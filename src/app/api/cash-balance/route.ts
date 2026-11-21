import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import CashBalance from '@/models/CashBalance';
import StockOut from '@/models/StockOut';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'summary' | undefined
    const today = new Date().toISOString().split('T')[0];

    // 1. WEEKLY or MONTHLY SUMMARY
    if (type === 'summary') {
      const period = searchParams.get('period') || 'month'; // 'week' | 'month'
      const queryDate = searchParams.get('date') || today;
      const queryMonth = searchParams.get('month') || queryDate.substring(0, 7);

      let startDateStr = '';
      let endDateStr = '';

      if (period === 'week') {
        const curr = new Date(queryDate);
        const day = curr.getDay(); // 0 is Sunday
        const diffToMonday = curr.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(curr.setDate(diffToMonday));
        const sunday = new Date(curr.setDate(monday.getDate() + 6));

        startDateStr = monday.toISOString().split('T')[0];
        endDateStr = sunday.toISOString().split('T')[0];
      } else {
        // Full month: from YYYY-MM-01 to YYYY-MM-31
        startDateStr = `${queryMonth}-01`;
        endDateStr = `${queryMonth}-31`;
      }

      // Fetch all CashBalance records in this date range
      const balances = await CashBalance.find({
        dateString: { $gte: startDateStr, $lte: endDateStr },
      })
        .sort({ dateString: 1 })
        .lean();

      // Fetch all StockOut Cash Sales in this date range
      const cashSalesByDay = await StockOut.aggregate([
        {
          $match: {
            dateString: { $gte: startDateStr, $lte: endDateStr },
            paymentMethod: 'Cash',
          },
        },
        {
          $group: {
            _id: '$dateString',
            totalCashSales: { $sum: '$netAmount' },
          },
        },
      ]);

      const salesMap: Record<string, number> = {};
      cashSalesByDay.forEach((s) => {
        salesMap[s._id] = s.totalCashSales;
      });

      // Calculate totals
      let totalOpening = 0;
      let totalSales = 0;
      let totalExpenses = 0;
      let totalExpected = 0;

      const dailyBreakdown = balances.map((b) => {
        const daySales = salesMap[b.dateString] !== undefined ? salesMap[b.dateString] : b.cashSales || 0;
        const dayExp = b.totalExpenses || 0;
        const dayNet = daySales - dayExp;

        totalOpening += b.openingCash || 0;
        totalSales += daySales;
        totalExpenses += dayExp;
        totalExpected += b.expectedClosingCash || 0;

        return {
          dateString: b.dateString,
          openingCash: b.openingCash || 0,
          cashSales: daySales,
          totalExpenses: dayExp,
          expectedClosingCash: b.expectedClosingCash || 0,
          actualClosingCash: b.actualClosingCash,
          difference: b.difference,
          expenseCount: b.expenses?.length || 0,
        };
      });

      return NextResponse.json({
        success: true,
        summary: {
          period,
          startDate: startDateStr,
          endDate: endDateStr,
          month: queryMonth,
          totalSales,
          totalExpenses,
          netCashFlow: totalSales - totalExpenses,
          recordCount: balances.length,
        },
        dailyBreakdown,
      });
    }

    // 2. SINGLE DATE CASH BALANCE
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
      // Sync cash sales if different
      if (record.cashSales !== computedCashSales) {
        record.cashSales = computedCashSales;
        record.expectedClosingCash =
          (record.openingCash || 0) + computedCashSales - (record.totalExpenses || 0);
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
      actualClosingCash !== undefined && actualClosingCash !== null && actualClosingCash !== ''
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
          actualClosingCash !== undefined && actualClosingCash !== null && actualClosingCash !== ''
            ? Number(actualClosingCash)
            : undefined,
        difference: diff,
        notes: notes !== undefined ? String(notes).trim() : undefined,
      },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Cash balance saved successfully',
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
