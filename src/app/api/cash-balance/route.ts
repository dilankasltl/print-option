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

    // 1. WEEK-WISE or MONTH-WISE SUMMARY
    if (type === 'summary') {
      const period = searchParams.get('period') || 'month'; // 'week' | 'month'
      const queryDate = searchParams.get('date') || today;
      const queryMonth = searchParams.get('month') || queryDate.substring(0, 7);

      let startDateStr = '';
      let endDateStr = '';
      const allDaysInRange: string[] = [];

      if (period === 'week') {
        const curr = new Date(queryDate + 'T00:00:00');
        const day = curr.getDay(); // 0 is Sun, 1 is Mon...
        const diffToMonday = curr.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(curr);
        monday.setDate(diffToMonday);

        for (let i = 0; i < 7; i++) {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          const dStr = d.toISOString().split('T')[0];
          allDaysInRange.push(dStr);
        }

        startDateStr = allDaysInRange[0];
        endDateStr = allDaysInRange[6];
      } else {
        // Month: YYYY-MM-01 to YYYY-MM-(lastDay)
        const [y, m] = queryMonth.split('-').map(Number);
        const lastDay = new Date(y, m, 0).getDate();
        startDateStr = `${queryMonth}-01`;
        endDateStr = `${queryMonth}-${String(lastDay).padStart(2, '0')}`;
      }

      // Fetch all CashBalance records in this date range
      const balances = await CashBalance.find({
        dateString: { $gte: startDateStr, $lte: endDateStr },
      }).lean();

      const balanceMap: Record<string, any> = {};
      balances.forEach((b) => {
        balanceMap[b.dateString] = b;
      });

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

      // Determine date list to return
      let targetDates: string[] = [];
      if (period === 'week') {
        // Full 7 days of the week
        targetDates = allDaysInRange;
      } else {
        // For month: all dates that have balance or sales, sorted
        const dateSet = new Set<string>();
        balances.forEach((b) => dateSet.add(b.dateString));
        cashSalesByDay.forEach((s) => dateSet.add(s._id));
        targetDates = Array.from(dateSet).sort();
      }

      let totalOpening = 0;
      let totalSales = 0;
      let totalExpenses = 0;
      let totalExpected = 0;

      const dailyBreakdown = targetDates.map((dateStr) => {
        const b = balanceMap[dateStr];
        const daySales = salesMap[dateStr] !== undefined ? salesMap[dateStr] : (b ? b.cashSales : 0);
        const dayExpenses = b ? b.totalExpenses || 0 : 0;
        const dayOpening = b ? b.openingCash || 0 : 0;
        const expected = dayOpening + daySales - dayExpenses;

        totalOpening += dayOpening;
        totalSales += daySales;
        totalExpenses += dayExpenses;
        totalExpected += expected;

        const dayName = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
          weekday: 'short',
        });

        return {
          dateString: dateStr,
          dayName,
          openingCash: dayOpening,
          cashSales: daySales,
          totalExpenses: dayExpenses,
          expectedClosingCash: expected,
          actualClosingCash: b?.actualClosingCash,
          difference: b?.difference,
          expenseCount: b?.expenses?.length || 0,
          hasRecord: !!b || daySales > 0,
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
          recordCount: dailyBreakdown.filter((d) => d.hasRecord).length,
        },
        dailyBreakdown,
      });
    }

    // 2. SINGLE DATE-WISE CASH BALANCE
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
