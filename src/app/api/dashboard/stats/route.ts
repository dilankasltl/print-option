import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Item from '@/models/Item';
import StockOut from '@/models/StockOut';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.substring(0, 7);

    const queryDate = searchParams.get('date') || today;
    const queryMonth = searchParams.get('month') || currentMonth;

    // 1. Inventory Summary
    const items = await Item.find({}).lean();
    const totalItemTypes = items.length;
    let totalStockQty = 0;
    let totalStockValue = 0;
    const lowStockItems = [];

    for (const item of items) {
      totalStockQty += item.availableQty || 0;
      totalStockValue += (item.availableQty || 0) * (item.unitPrice || 0);
      if (item.availableQty <= item.minAlertQty) {
        lowStockItems.push({
          _id: item._id,
          itno: item.itno,
          itemName: item.itemName,
          availableQty: item.availableQty,
          unitPrice: item.unitPrice,
          minAlertQty: item.minAlertQty,
        });
      }
    }

    // 2. Query Date Sales Summary
    const daySalesAgg = await StockOut.aggregate([
      { $match: { dateString: queryDate } },
      {
        $group: {
          _id: null,
          totalQty: { $sum: '$totalQty' },
          totalRevenue: { $sum: '$netAmount' },
          totalTransactions: { $sum: 1 },
        },
      },
    ]);
    const dayStats = daySalesAgg.length > 0 ? daySalesAgg[0] : { totalQty: 0, totalRevenue: 0, totalTransactions: 0 };

    // 3. Query Month Sales Summary
    const monthSalesAgg = await StockOut.aggregate([
      { $match: { dateString: { $regex: `^${queryMonth}` } } },
      {
        $group: {
          _id: null,
          totalQty: { $sum: '$totalQty' },
          totalRevenue: { $sum: '$netAmount' },
          totalTransactions: { $sum: 1 },
        },
      },
    ]);
    const monthStats = monthSalesAgg.length > 0 ? monthSalesAgg[0] : { totalQty: 0, totalRevenue: 0, totalTransactions: 0 };

    // 4. Top Selling Items (all time or this month)
    const topItemsAgg = await StockOut.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.itno',
          itemName: { $first: '$items.itemName' },
          soldQty: { $sum: '$items.qty' },
          totalAmount: { $sum: '$items.total' },
        },
      },
      { $sort: { soldQty: -1 } },
      { $limit: 5 },
    ]);

    // 5. Recent Transactions
    const recentTransactions = await StockOut.find({})
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        inventory: {
          totalItemTypes,
          totalStockQty,
          totalStockValue,
          lowStockCount: lowStockItems.length,
          lowStockItems,
        },
        dayStats: {
          date: queryDate,
          totalQty: dayStats.totalQty,
          totalRevenue: dayStats.totalRevenue,
          totalTransactions: dayStats.totalTransactions,
        },
        monthStats: {
          month: queryMonth,
          totalQty: monthStats.totalQty,
          totalRevenue: monthStats.totalRevenue,
          totalTransactions: monthStats.totalTransactions,
        },
        topSellingItems: topItemsAgg,
        recentTransactions,
      },
    });
  } catch (error: any) {
    console.error('Fetch dashboard stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
