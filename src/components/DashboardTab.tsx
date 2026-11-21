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
  CheckCircle2,
  X,
  Plus,
  Banknote,
  CreditCard,
  Building,
  Tag,
} from 'lucide-react';

interface DashboardTabProps {
  items: any[];
  onOpenBill: (sale: any) => void;
  onRefreshItems?: () => void;
  onNavigateToStockOut: (item?: any) => void;
  onNavigateToInventory: () => void;
}

export default function DashboardTab({
  items,
  onOpenBill,
  onRefreshItems,
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

  // Dashboard Direct Checkout Modal State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState<any | null>(null);
  const [checkoutQty, setCheckoutQty] = useState<number>(1);
  const [checkoutDate, setCheckoutDate] = useState(todayStr);
  const [checkoutCustomerName, setCheckoutCustomerName] = useState('');
  const [checkoutCustomerPhone, setCheckoutCustomerPhone] = useState('');
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<'Cash' | 'Card' | 'Bank Transfer'>('Cash');
  const [checkoutPaidAmount, setCheckoutPaidAmount] = useState<number>(0);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

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

  // Open Direct Checkout Modal for a specific item
  const handleOpenDirectCheckout = (item: any) => {
    setCheckoutItem(item);
    setCheckoutQty(1);
    setCheckoutDate(todayStr);
    setCheckoutCustomerName('');
    setCheckoutCustomerPhone('');
    setCheckoutPaymentMethod('Cash');
    setCheckoutPaidAmount(0);
    setCheckoutError('');
    setCheckoutModalOpen(true);
  };

  // Submit Direct Checkout right from Dashboard
  const handleConfirmDirectCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutItem) return;
    if (checkoutQty <= 0) {
      setCheckoutError('Quantity must be at least 1');
      return;
    }
    if (checkoutQty > checkoutItem.availableQty) {
      setCheckoutError(`Cannot checkout ${checkoutQty}. Only ${checkoutItem.availableQty} units available!`);
      return;
    }

    setCheckoutSubmitting(true);
    setCheckoutError('');

    try {
      const res = await fetch('/api/stock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: checkoutDate,
          items: [
            {
              itno: checkoutItem.itno,
              qty: checkoutQty,
              unitPrice: checkoutItem.unitPrice,
            },
          ],
          customerName: checkoutCustomerName,
          customerPhone: checkoutCustomerPhone,
          paymentMethod: checkoutPaymentMethod,
          paidAmount: Number(checkoutPaidAmount) || 0,
          reason: 'Dashboard Sale',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');

      setCheckoutModalOpen(false);
      setCheckoutItem(null);

      // Refresh items and dashboard records
      if (onRefreshItems) onRefreshItems();
      fetchData();

      // Open printable bill
      onOpenBill(data.record);
    } catch (err: any) {
      setCheckoutError(err.message);
    } finally {
      setCheckoutSubmitting(false);
    }
  };

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
            
            {/* Direct Checkout Shortcut on Dashboard */}
            <button
              onClick={() => {
                if (items.length > 0) {
                  handleOpenDirectCheckout(items[0]);
                } else {
                  onNavigateToStockOut();
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 via-cyan-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-600/30 transition-all hover:scale-105"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Direct Check Out</span>
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

        {/* Right Column: Live Stock with ACTUAL PRICE (Strikethrough) & DISCOUNT PRICE */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-cyan-400" />
                <span>Live Stock & Prices</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Strikethrough <span className="line-through text-slate-500 font-semibold">Actual Price</span> vs <span className="text-emerald-400 font-bold">Discount Price</span>
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

          {/* Scrollable list of items with Dual Pricing */}
          <div className="max-h-[460px] overflow-y-auto space-y-2 pr-1 divide-y divide-slate-800/40">
            {filteredStockItems.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-500">
                No matching items found.
              </p>
            ) : (
              filteredStockItems.map((item) => {
                const isOutOfStock = item.availableQty <= 0;
                const isLow = item.availableQty <= (item.minAlertQty || 5);

                // Calculate Actual Price (Original / Retail) and Discount Price
                const actualPrice =
                  item.actualPrice && item.actualPrice > item.unitPrice
                    ? item.actualPrice
                    : Math.round(item.unitPrice * 1.18);
                const discountPrice = item.unitPrice;
                const savings = actualPrice - discountPrice;

                return (
                  <div
                    key={item._id}
                    className="pt-2.5 pb-2 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-sky-950/80 text-cyan-300 border border-sky-800/50">
                          {item.itno}
                        </span>
                        <p className="font-semibold text-white truncate text-xs">{item.itemName}</p>
                      </div>

                      {/* Actual Price (with line-through) + Discounted Selling Price */}
                      <div className="flex items-center gap-2 mt-1">
                        {/* Actual Price with Strikethrough */}
                        <span
                          className="line-through text-slate-400 font-mono text-[11px] font-medium decoration-rose-500/80 decoration-2"
                          title="Original / Regular Actual Price"
                        >
                          Rs. {Number(actualPrice).toFixed(2)}
                        </span>

                        {/* Discounted / Selling Price */}
                        <span
                          className="text-emerald-400 font-black font-mono text-xs sm:text-sm"
                          title="Discount / Offer Price"
                        >
                          Rs. {Number(discountPrice).toFixed(2)}
                        </span>

                        {/* Savings Tag */}
                        {savings > 0 && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-pink-500/15 text-pink-300 border border-pink-500/30">
                            Save Rs. {savings.toFixed(0)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md font-mono font-bold text-[11px] ${
                            isOutOfStock
                              ? 'bg-rose-500/20 text-rose-300'
                              : isLow
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {item.availableQty} left
                        </span>
                      </div>

                      {/* DIRECT CHECKOUT BUTTON RIGHT FROM DASHBOARD */}
                      <button
                        onClick={() => handleOpenDirectCheckout(item)}
                        disabled={isOutOfStock}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 disabled:opacity-30 text-white font-bold text-xs shadow-md shadow-sky-600/30 transition-all hover:scale-105"
                        title="Check out directly from Dashboard"
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

      {/* DASHBOARD DIRECT CHECKOUT MODAL */}
      {checkoutModalOpen && checkoutItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-7 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-white text-base">Direct Check Out</h3>
              </div>
              <button
                onClick={() => setCheckoutModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {checkoutError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {checkoutError}
              </div>
            )}

            <form onSubmit={handleConfirmDirectCheckout} className="mt-4 space-y-4 text-xs">
              {/* Item Card */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-[10px] text-cyan-400 font-bold">
                      {checkoutItem.itno}
                    </span>
                    <h4 className="font-bold text-sm text-white">{checkoutItem.itemName}</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {checkoutItem.availableQty} Available
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/80 font-mono">
                  <span className="line-through text-slate-500 text-xs">
                    Rs. {(checkoutItem.actualPrice || Math.round(checkoutItem.unitPrice * 1.18)).toFixed(2)}
                  </span>
                  <span className="text-emerald-400 font-bold text-sm">
                    Rs. {Number(checkoutItem.unitPrice).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Date & Out QTY */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={checkoutDate}
                    onChange={(e) => setCheckoutDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    OUT Qty *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={checkoutItem.availableQty}
                    value={checkoutQty}
                    onChange={(e) => setCheckoutQty(Math.max(1, Number(e.target.value)))}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-sm focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Total Calculation Preview */}
              <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-800/40 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-400">Total Check Out Bill:</span>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {checkoutQty} &times; Rs. {checkoutItem.unitPrice}
                  </p>
                </div>
                <span className="font-mono font-black text-lg text-emerald-400">
                  Rs. {(checkoutQty * checkoutItem.unitPrice).toFixed(2)}
                </span>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Cash', label: 'Cash', icon: Banknote },
                    { id: 'Card', label: 'Card', icon: CreditCard },
                    { id: 'Bank Transfer', label: 'Transfer', icon: Building },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = checkoutPaymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setCheckoutPaymentMethod(m.id as any)}
                        className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border font-semibold text-xs transition ${
                          isSelected
                            ? 'bg-sky-600/30 border-sky-500 text-sky-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 text-sky-400" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Customer Info */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={checkoutCustomerName}
                  onChange={(e) => setCheckoutCustomerName(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Customer Phone"
                  value={checkoutCustomerPhone}
                  onChange={(e) => setCheckoutCustomerPhone(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCheckoutModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={checkoutSubmitting}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-sky-600/30 disabled:opacity-50"
                >
                  {checkoutSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Printer className="w-4 h-4" />
                  )}
                  <span>Confirm OUT & Print Bill</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
