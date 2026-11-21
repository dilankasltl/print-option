import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import StockOut from '@/models/StockOut';
import Item from '@/models/Item';
import CashBalance from '@/models/CashBalance';
import { getAdminSession } from '@/lib/auth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
    }

    const { id } = params;
    await connectToDatabase();

    const record = await StockOut.findById(id);
    if (!record) {
      return NextResponse.json({ error: 'Stock out record not found' }, { status: 404 });
    }

    // Restore quantities back into Item collection
    for (const item of record.items) {
      await Item.updateOne(
        { itno: item.itno },
        { $inc: { availableQty: item.qty } }
      );
    }

    // If it was Cash payment, deduct from CashBalance
    if (record.paymentMethod === 'Cash') {
      const cashEntry = await CashBalance.findOne({ dateString: record.dateString });
      if (cashEntry) {
        cashEntry.cashSales = Math.max(0, cashEntry.cashSales - record.netAmount);
        cashEntry.expectedClosingCash =
          cashEntry.openingCash + cashEntry.cashSales - cashEntry.totalExpenses;
        await cashEntry.save();
      }
    }

    await StockOut.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: `Stock out transaction ${record.invoiceNo} cancelled and stock quantities restored!`,
    });
  } catch (error: any) {
    console.error('Delete stock out error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}
