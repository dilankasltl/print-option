import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import CashBalance from '@/models/CashBalance';
import StockOut from '@/models/StockOut';
import { getAdminSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const today = new Date().toISOString().split('T')[0];
    const dateString = searchParams.get('date') || today;

    // Calculate actual cash sales from StockOut transactions for this date
    const cashSalesAgg = await StockOut.aggregate([
      { $match: { dateString, paymentMethod: 'Cash' } },
      { $group: { _id: null, total: { $sum: '$netAmount' } } },
    ]);
    const computedCashSales = cashSalesAgg.length > 0 ? cashSalesAgg[0].total : 0;

    let record = await CashBalance.findOne({ dateString });

    if (!record) {
      record = await CashBalance.create({
        dateString,
        openingCash: 0,
        cashSales: computedCashSales,
        expenses: [],
        totalExpenses: 0,
        expectedClosingCash: computedCashSales,
      });
    } else {
      // Sync cash sales
      if (record.cashSales !== computedCashSales) {
        record.cashSales = computedCashSales;
        record.expectedClosingCash =
          record.openingCash + computedCashSales - record.totalExpenses;
        if (record.actualClosingCash !== undefined) {
          record.difference = record.actualClosingCash - record.expectedClosingCash;
        }
        await record.save();
      }
    }

    return NextResponse.json({
      success: true,
      data: record,
    });
  } catch (error: any) {
    console.error('Fetch cash balance error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch cash balance' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const {
      dateString,
      openingCash,
      expenses,
      actualClosingCash,
      notes,
    } = body;

    if (!dateString) {
      return NextResponse.json({ error: 'Date string (YYYY-MM-DD) is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Recompute cash sales from StockOut
    const cashSalesAgg = await StockOut.aggregate([
      { $match: { dateString, paymentMethod: 'Cash' } },
      { $group: { _id: null, total: { $sum: '$netAmount' } } },
    ]);
    const cashSales = cashSalesAgg.length > 0 ? cashSalesAgg[0].total : 0;

    let totalExpenses = 0;
    if (Array.isArray(expenses)) {
      totalExpenses = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    }

    const currentOpening = openingCash !== undefined ? Math.max(0, Number(openingCash)) : 0;
    const expectedClosingCash = currentOpening + cashSales - totalExpenses;
    const diff =
      actualClosingCash !== undefined && actualClosingCash !== null
        ? Number(actualClosingCash) - expectedClosingCash
        : undefined;

    const record = await CashBalance.findOneAndUpdate(
      { dateString },
      {
        dateString,
        openingCash: currentOpening,
        cashSales,
        expenses: expenses || [],
        totalExpenses,
        expectedClosingCash,
        actualClosingCash:
          actualClosingCash !== undefined && actualClosingCash !== null
            ? Number(actualClosingCash)
            : undefined,
        difference: diff,
        notes: notes !== undefined ? String(notes).trim() : undefined,
      },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Cash balance updated successfully',
      data: record,
    });
  } catch (error: any) {
    console.error('Update cash balance error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update cash balance' },
      { status: 500 }
    );
  }
}
