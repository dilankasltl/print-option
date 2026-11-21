'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Package,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  Calendar,
  Printer,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';

interface DashboardTabProps {
  items: any[];
  onOpenBill: (sale: any) => void;
  onNavigateToStockOut: (item?: any) => void;
  onNavigateToInventory: () => void;
}

export default function DashboardTab({
  items,
  onOpenBill,
  onNavigateToStockOut,
  onNavigateToInventory,
}: DashboardTabProps) {
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  const [filterMode, setFilterMode] = useState<'day' | 'range' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [recordsSummary, setRecordsSummary] = useState<any>({
    totalOutQty: 0,
    totalSalesRevenue: 0,
    totalCashSales: 0,
  });

  const [stockSearch, setStockSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = '/api/stock-out?';
      if (filterMode === 'day') {
        url += `date=${selectedDate}`;
      } else if (filterMode === 'range') {
        url += `startDate=${startDate}&endDate=${endDate}`;
      } else if (filterMode === 'month') {
        url += `month=${selectedMonth}`;
      }

      const recRes = await fetch(url);
      const recData = await recRes.json();
      if (recData.success) {
        setRecords(recData.records || []);
        setRecordsSummary(recData.summary || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterMode, selectedDate, startDate, endDate, selectedMonth]);

  const totalStockCount = items.reduce((acc, it) => acc + (it.availableQty || 0), 0);
  const totalStockValue = items.reduce(
    (acc, it) => acc + (it.availableQty || 0) * (it.unitPrice || 0),
    0
  );
  const lowStockItems = items.filter((it) => it.availableQty <= (it.minAlertQty || 5));

  const filteredStockItems = items.filter((it) => {
    const q = stockSearch.toLowerCase();
    return (
      it.itno.toLowerCase().includes(q) ||
      it.itemName.toLowerCase().includes(q) ||
      (it.reason && it.reason.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8">
      {/* Date Filter Bar */}
      <div className="bg-slate-900/60 p-4 sm:p-5 rounded-3xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-sky-400" /> Filter Period:
          </span>

          <button
            onClick={() => {
              setFilterMode('day');
              setSelectedDate(todayStr);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterMode === 'day' && selectedDate === todayStr
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            Today
          </button>

          <button
            onClick={() => setFilterMode('day')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterMode === 'day' && selectedDate !== todayStr
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            Single Date
          </button>

          <button
            onClick={() => setFilterMode('range')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterMode === 'range'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            Date Range
          </button>

          <button
            onClick={() => setFilterMode('month')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterMode === 'month'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            Monthly
          </button>
        </div>

        {/* Date Inputs based on mode */}
        <div className="flex items-center gap-2 self-start lg:self-auto">
          {filterMode === 'day' && (
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-white">
              <Calendar className="w-4 h-4 text-sky-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white font-mono focus:outline-none"
              />
            </div>
          )}

          {filterMode === 'range' && (
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-white">
              <span className="text-slate-400">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-white font-mono focus:outline-none"
              />
              <span className="text-slate-400">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-white font-mono focus:outline-none"
              />
            </div>
          )}

          {filterMode === 'month' && (
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-white">
              <Calendar className="w-4 h-4 text-sky-400" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-white font-mono focus:outline-none"
              />
            </div>
          )}

          <button
            onClick={fetchData}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: OUT Qty for Selected Period */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-5 rounded-3xl shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              Period OUT QTY
            </span>
            <ShoppingCart className="w-4 h-4 text-rose-400" />
          </div>
          <p className="font-mono font-black text-3xl text-rose-400">
            {recordsSummary.totalOutQty || 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-2">
            Total items deducted/sold in this period
          </p>
        </div>

        {/* KPI 2: Sales Revenue for Selected Period */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-5 rounded-3xl shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Period Sales Revenue
            </span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="font-mono font-black text-2xl sm:text-3xl text-emerald-400">
            Rs. {Number(recordsSummary.totalSalesRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400 mt-2">
            Cash: Rs. {Number(recordsSummary.totalCashSales || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* KPI 3: Total Stock Valuation */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-5 rounded-3xl shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
              Current Stock Value
            </span>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <p className="font-mono font-black text-2xl sm:text-3xl text-white">
            Rs. {totalStockValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400 mt-2">
            Across {items.length} item types ({totalStockCount} units)
          </p>
        </div>

        {/* KPI 4: Low Stock Alert Count */}
        <div
          onClick={onNavigateToInventory}
          className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-5 rounded-3xl shadow-xl relative overflow-hidden cursor-pointer hover:border-amber-500/50 transition group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Low Stock Alerts
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="font-mono font-black text-3xl text-amber-400">
            {lowStockItems.length}
          </p>
          <p className="text-[11px] text-amber-400/80 mt-2 flex items-center gap-1">
            <span>Items need restock</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </p>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Out Transactions for Selected Filter (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-sky-400" />
                <span>
                  Outgoing Stock Log ({records.length} Transactions)
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Auto-records items deducted on selected period with quick bill print.
              </p>
            </div>
            <button
              onClick={() => onNavigateToStockOut()}
              className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-sky-600/30"
            >
              <span>+ New OUT</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Item(s) & Out Qty</th>
                  <th className="py-2.5 px-3 text-right">Net (LKR)</th>
                  <th className="py-2.5 px-3 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500">
                      No outgoing transactions found for this period.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 font-mono font-bold text-sky-400">
                        {r.invoiceNo}
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-mono">
                        {r.dateString || new Date(r.date).toISOString().split('T')[0]}
                      </td>
                      <td className="py-3 px-3 font-medium text-white max-w-xs">
                        <div className="space-y-0.5">
                          {r.items?.map((it: any, i: number) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <span className="font-mono text-rose-400 font-bold">-{it.qty}</span>
                              <span className="text-slate-200">{it.itemName}</span>
                              <span className="text-[10px] text-slate-500">(@ Rs. {it.unitPrice})</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                        Rs. {Number(r.netAmount).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onOpenBill(r)}
                          className="px-2.5 py-1 rounded-lg bg-sky-600/20 hover:bg-sky-600/40 text-sky-300 border border-sky-500/30 text-xs font-semibold flex items-center gap-1 mx-auto"
                          title="Generate / Print Bill"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Bill</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Live Stock & Unit Price Explorer (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-sky-400" />
                <span>Live Stock & Prices</span>
              </h3>
              <p className="text-xs text-slate-400">
                Item price, available quantity, and quick out action.
              </p>
            </div>
            <button
              onClick={onNavigateToInventory}
              className="text-xs text-sky-400 hover:underline flex items-center gap-1"
            >
              <span>Manage</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={stockSearch}
              onChange={(e) => setStockSearch(e.target.value)}
              placeholder="Search items or code..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Scrollable list of items */}
          <div className="max-h-[460px] overflow-y-auto space-y-2 pr-1 divide-y divide-slate-800/40">
            {filteredStockItems.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-500">
                No matching items.
              </p>
            ) : (
              filteredStockItems.map((item) => {
                const isOutOfStock = item.availableQty <= 0;
                const isLow = item.availableQty <= (item.minAlertQty || 5);

                return (
                  <div
                    key={item._id}
                    className="pt-2 pb-1 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{item.itemName}</p>
                      <p className="text-[11px] font-mono text-slate-400">
                        <span className="text-sky-400">{item.itno}</span> &bull; Rs.{' '}
                        {Number(item.unitPrice).toFixed(2)} / pc
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md font-mono font-bold text-xs ${
                            isOutOfStock
                              ? 'bg-rose-500/20 text-rose-300'
                              : isLow
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {item.availableQty} in stock
                        </span>
                      </div>

                      <button
                        onClick={() => onNavigateToStockOut(item)}
                        disabled={isOutOfStock}
                        className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-30 text-white font-bold text-[11px] shadow-sm"
                        title="Mark OUT this item"
                      >
                        OUT
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
