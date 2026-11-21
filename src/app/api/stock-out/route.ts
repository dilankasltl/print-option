import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import StockOut, { IStockOutItem } from '@/models/StockOut';
import Item from '@/models/Item';
import CashBalance from '@/models/CashBalance';
import { getAdminSession } from '@/lib/auth';

function getInvoicePrefix(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `PO-${y}${m}${d}`;
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const dateString = searchParams.get('date'); // YYYY-MM-DD
    const startDate = searchParams.get('startDate'); // YYYY-MM-DD
    const endDate = searchParams.get('endDate'); // YYYY-MM-DD
    const month = searchParams.get('month'); // YYYY-MM
    const search = searchParams.get('q');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};

    if (dateString) {
      filter.dateString = dateString;
    } else if (startDate && endDate) {
      filter.dateString = { $gte: startDate, $lte: endDate };
    } else if (month) {
      filter.dateString = { $regex: `^${month}` };
    }

    if (search) {
      filter.$or = [
        { invoiceNo: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { 'items.itemName': { $regex: search, $options: 'i' } },
        { 'items.itno': { $regex: search, $options: 'i' } },
        { reason: { $regex: search, $options: 'i' } },
      ];
    }

    const records = await StockOut.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // Calculate totals for the filtered results
    let totalOutQty = 0;
    let totalSalesRevenue = 0;
    let totalCashSales = 0;

    for (const record of records) {
      totalOutQty += record.totalQty || 0;
      totalSalesRevenue += record.netAmount || 0;
      if (record.paymentMethod === 'Cash') {
        totalCashSales += record.netAmount || 0;
      }
    }

    return NextResponse.json({
      success: true,
      count: records.length,
      summary: {
        totalOutQty,
        totalSalesRevenue,
        totalCashSales,
      },
      records,
    });
  } catch (error: any) {
    console.error('Fetch stock-out error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stock out records' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getAdminSession(req);
    const recordedBy = session?.username || 'Cashier';

    const body = await req.json();
    const {
      date, // ISO or YYYY-MM-DD
      items, // array of { itno, qty, unitPrice } OR single item fields { itno, qty }
      customerName = '',
      customerPhone = '',
      paymentMethod = 'Cash',
      discount = 0,
      paidAmount = 0,
      reason = 'Sale',
    } = body;

    // Normalizing items array
    let itemsToProcess: Array<{ itno: string; qty: number; unitPrice?: number }> = [];

    if (Array.isArray(items) && items.length > 0) {
      itemsToProcess = items;
    } else if (body.itno && body.qty) {
      itemsToProcess = [{ itno: body.itno, qty: Number(body.qty), unitPrice: body.unitPrice }];
    } else {
      return NextResponse.json(
        { error: 'At least one item with ITNO and QTY is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const selectedDate = date ? new Date(date) : new Date();
    const dateString = selectedDate.toISOString().split('T')[0];

    // Verify stock availability and prepare items
    const processedItems: IStockOutItem[] = [];
    let calculatedTotalAmount = 0;
    let calculatedTotalQty = 0;

    for (const requestedItem of itemsToProcess) {
      const cleanItno = String(requestedItem.itno).trim().toUpperCase();
      const qty = Math.max(1, Number(requestedItem.qty) || 1);

      const dbItem = await Item.findOne({ itno: cleanItno });
      if (!dbItem) {
        return NextResponse.json(
          { error: `Item with ITNO "${cleanItno}" was not found in stock!` },
          { status: 400 }
        );
      }

      if (dbItem.availableQty < qty) {
        return NextResponse.json(
          {
            error: `Insufficient stock for "${dbItem.itemName}" (${cleanItno})! Available: ${dbItem.availableQty}, Requested: ${qty}`,
          },
          { status: 400 }
        );
      }

      const unitPrice =
        requestedItem.unitPrice !== undefined && requestedItem.unitPrice !== null
          ? Number(requestedItem.unitPrice)
          : dbItem.unitPrice;
      const total = unitPrice * qty;

      processedItems.push({
        itemId: dbItem._id,
        itno: dbItem.itno,
        itemName: dbItem.itemName,
        qty,
        unitPrice,
        total,
      });

      calculatedTotalAmount += total;
      calculatedTotalQty += qty;
    }

    const netAmount = Math.max(0, calculatedTotalAmount - (Number(discount) || 0));
    const finalPaid = Number(paidAmount) || netAmount;
    const changeAmount = Math.max(0, finalPaid - netAmount);

    // Generate unique sequential invoice number
    const prefix = getInvoicePrefix(selectedDate);
    const countToday = await StockOut.countDocuments({
      invoiceNo: { $regex: `^${prefix}` },
    });
    const invoiceNo = `${prefix}-${String(countToday + 1).padStart(4, '0')}`;

    // Atomically decrement stock quantity for each item
    for (const item of processedItems) {
      await Item.updateOne(
        { itno: item.itno },
        { $inc: { availableQty: -item.qty } }
      );
    }

    // Create StockOut record
    const stockOutRecord = await StockOut.create({
      invoiceNo,
      date: selectedDate,
      dateString,
      items: processedItems,
      totalQty: calculatedTotalQty,
      totalAmount: calculatedTotalAmount,
      discount: Number(discount) || 0,
      netAmount,
      paidAmount: finalPaid,
      changeAmount,
      paymentMethod,
      customerName: String(customerName || '').trim(),
      customerPhone: String(customerPhone || '').trim(),
      reason: String(reason || 'Sale').trim(),
      recordedBy,
    });

    // If payment method is Cash, update CashBalance for this date
    if (paymentMethod === 'Cash') {
      const existingCash = await CashBalance.findOne({ dateString });
      if (existingCash) {
        existingCash.cashSales += netAmount;
        existingCash.expectedClosingCash =
          existingCash.openingCash + existingCash.cashSales - existingCash.totalExpenses;
        await existingCash.save();
      } else {
        await CashBalance.create({
          dateString,
          openingCash: 0,
          cashSales: netAmount,
          expenses: [],
          totalExpenses: 0,
          expectedClosingCash: netAmount,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Stock out recorded and available stock deducted successfully',
      record: stockOutRecord,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create stock-out error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record stock out' },
      { status: 500 }
    );
  }
}
