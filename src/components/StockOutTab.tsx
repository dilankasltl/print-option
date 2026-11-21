'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Calendar,
  Plus,
  Trash2,
  Printer,
  CheckCircle2,
  AlertCircle,
  Receipt,
  RefreshCw,
  CreditCard,
  Banknote,
  Building,
} from 'lucide-react';

interface ItemType {
  _id: string;
  itno: string;
  itemName: string;
  availableQty: number;
  unitPrice: number;
  costPrice?: number;
  reason: string;
  minAlertQty: number;
}

interface CartItem {
  itno: string;
  itemName: string;
  availableQty: number;
  unitPrice: number;
  qty: number;
  total: number;
}

interface StockOutTabProps {
  items: ItemType[];
  preselectedItem?: ItemType | null;
  onRefreshItems: () => void;
  onOpenBill: (sale: any) => void;
}

export default function StockOutTab({
  items,
  preselectedItem,
  onRefreshItems,
  onOpenBill,
}: StockOutTabProps) {
  const todayStr = new Date().toISOString().split('T')[0];

  // Sale Entry Form State
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedItno, setSelectedItno] = useState(preselectedItem?.itno || '');
  const [outQty, setOutQty] = useState<number>(1);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Bank Transfer' | 'Credit'>('Cash');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [reason, setReason] = useState('Sale');

  // Multi-item Cart for POS Billing
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartMode, setCartMode] = useState(false);

  // Submitting state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // History state
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyDateFilter, setHistoryDateFilter] = useState(todayStr);

  // Find currently selected item object from items list
  const activeItem = items.find((it) => it.itno === selectedItno);

  useEffect(() => {
    if (preselectedItem) {
      setSelectedItno(preselectedItem.itno);
      setSellingPrice(preselectedItem.unitPrice);
      setOutQty(1);
    }
  }, [preselectedItem]);

  useEffect(() => {
    if (activeItem) {
      setSellingPrice(activeItem.unitPrice);
    }
  }, [selectedItno, activeItem]);

  // Load history records for the selected date
  const loadHistory = async (dateStr: string) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/stock-out?date=${dateStr}`);
      const data = await res.json();
      if (data.success) {
        setHistoryRecords(data.records || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(historyDateFilter);
  }, [historyDateFilter]);

  // Add Item to Cart (for multi-item sales)
  const handleAddToCart = () => {
    if (!activeItem) {
      setErrorMsg('Please select an item first');
      return;
    }
    if (outQty <= 0) {
      setErrorMsg('OUT Qty must be at least 1');
      return;
    }
    if (outQty > activeItem.availableQty) {
      setErrorMsg(`Cannot add ${outQty}. Only ${activeItem.availableQty} available in stock!`);
      return;
    }

    const existingIndex = cart.findIndex((c) => c.itno === activeItem.itno);
    if (existingIndex > -1) {
      const currentInCart = cart[existingIndex].qty;
      const newTotal = currentInCart + outQty;
      if (newTotal > activeItem.availableQty) {
        setErrorMsg(`Total in cart would be ${newTotal}, but only ${activeItem.availableQty} available!`);
        return;
      }
      const updated = [...cart];
      updated[existingIndex].qty = newTotal;
      updated[existingIndex].total = newTotal * sellingPrice;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          itno: activeItem.itno,
          itemName: activeItem.itemName,
          availableQty: activeItem.availableQty,
          unitPrice: sellingPrice,
          qty: outQty,
          total: outQty * sellingPrice,
        },
      ]);
    }

    setErrorMsg('');
    setSelectedItno('');
    setOutQty(1);
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // Submit Sale / Stock OUT
  const handleProcessSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    let itemsToSubmit: Array<{ itno: string; qty: number; unitPrice: number }> = [];

    if (cartMode) {
      if (cart.length === 0) {
        setErrorMsg('Please add at least one item to the cart');
        return;
      }
      itemsToSubmit = cart.map((c) => ({
        itno: c.itno,
        qty: c.qty,
        unitPrice: c.unitPrice,
      }));
    } else {
      if (!activeItem) {
        setErrorMsg('Please choose an item');
        return;
      }
      if (outQty <= 0) {
        setErrorMsg('OUT Qty must be at least 1');
        return;
      }
      if (outQty > activeItem.availableQty) {
        setErrorMsg(`Only ${activeItem.availableQty} units available for ${activeItem.itemName}!`);
        return;
      }
      itemsToSubmit = [
        {
          itno: activeItem.itno,
          qty: outQty,
          unitPrice: sellingPrice,
        },
      ];
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/stock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          items: itemsToSubmit,
          customerName,
          customerPhone,
          paymentMethod,
          discount: Number(discount) || 0,
          paidAmount: Number(paidAmount) || 0,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record stock out');

      setSuccessMsg(
        `Success! Deducted ${data.record.totalQty} items from stock. Invoice ${data.record.invoiceNo} created!`
      );

      // Reset form
      setCart([]);
      setSelectedItno('');
      setOutQty(1);
      setCustomerName('');
      setCustomerPhone('');
      setDiscount(0);
      setPaidAmount(0);

      // Refresh items list and history
      onRefreshItems();
      loadHistory(historyDateFilter);

      // Open printable bill
      onOpenBill(data.record);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel / Refund a Transaction
  const handleCancelSale = async (saleId: string, invoiceNo: string) => {
    if (!confirm(`Are you sure you want to cancel invoice ${invoiceNo}? This will restore all items back to stock!`)) {
      return;
    }

    try {
      const res = await fetch(`/api/stock-out/${saleId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel transaction');

      alert(data.message);
      onRefreshItems();
      loadHistory(historyDateFilter);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Calculations for Single Mode
  const singleTotal = activeItem ? outQty * sellingPrice : 0;
  const singleNewStock = activeItem ? Math.max(0, activeItem.availableQty - outQty) : 0;

  // Calculations for Cart Mode
  const cartSubtotal = cart.reduce((sum, it) => sum + it.total, 0);
  const cartTotalQty = cart.reduce((sum, it) => sum + it.qty, 0);
  const cartNetTotal = Math.max(0, cartSubtotal - (Number(discount) || 0));

  return (
    <div className="space-y-8">
      {/* Top Banner / Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <ShoppingCart className="w-6 h-6 text-sky-400" />
            <span>Mark Stock OUT / Cash Register</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Deduct outgoing items from stock, calculate daily totals, and auto-generate receipts.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setCartMode(false)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              !cartMode
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Quick 1-Item OUT
          </button>
          <button
            type="button"
            onClick={() => setCartMode(true)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
              cartMode
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Multi-Item Bill ({cart.length})</span>
          </button>
        </div>
      </div>

      {/* Main Form Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Selection & Out Entry */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
              Transaction Details
            </span>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Calendar className="w-4 h-4 text-sky-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-mono text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Select Item */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Select Item from Stock *
            </label>
            <select
              value={selectedItno}
              onChange={(e) => setSelectedItno(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="">-- Choose Item ({items.length} items in stock) --</option>
              {items.map((it) => (
                <option key={it._id} value={it.itno} disabled={it.availableQty <= 0}>
                  {it.itno} - {it.itemName} (Available: {it.availableQty}) - Rs. {it.unitPrice}
                </option>
              ))}
            </select>
          </div>

          {/* Live Item Stock Preview Card */}
          {activeItem && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border border-sky-500/30 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Current Stock</p>
                <p className="text-lg font-black font-mono text-white mt-0.5">
                  {activeItem.availableQty}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Deducting (OUT)</p>
                <p className="text-lg font-black font-mono text-rose-400 mt-0.5">
                  - {outQty || 0}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase">New Available</p>
                <p className="text-lg font-black font-mono text-emerald-400 mt-0.5">
                  {singleNewStock}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Unit Price</p>
                <p className="text-lg font-black font-mono text-sky-400 mt-0.5">
                  Rs. {sellingPrice}
                </p>
              </div>
            </div>
          )}

          {/* OUT QTY and Unit Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                OUT Quantity *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max={activeItem ? activeItem.availableQty : undefined}
                  value={outQty}
                  onChange={(e) => setOutQty(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-base focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                {activeItem && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    Max: {activeItem.availableQty}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Selling Unit Price (LKR)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Cart Add Button if in Cart Mode */}
          {cartMode && (
            <button
              type="button"
              onClick={handleAddToCart}
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Bill List</span>
            </button>
          )}

          {/* Cart Items List in Cart Mode */}
          {cartMode && (
            <div className="pt-2">
              <span className="text-xs font-bold text-slate-300 block mb-2">
                Items in Bill ({cart.length})
              </span>
              {cart.length === 0 ? (
                <p className="text-xs text-slate-500 p-4 border border-dashed border-slate-800 rounded-xl text-center">
                  Select an item above and click "Add to Bill List".
                </p>
              ) : (
                <div className="divide-y divide-slate-800 border border-slate-800 rounded-2xl bg-slate-950/60 overflow-hidden">
                  {cart.map((c, i) => (
                    <div key={i} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-white">{c.itemName}</p>
                        <p className="text-slate-400 font-mono">
                          {c.itno} &bull; {c.qty} &times; Rs. {c.unitPrice}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-sky-400">
                          Rs. {c.total.toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(i)}
                          className="p-1 rounded text-rose-400 hover:bg-rose-500/20"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Customer & Reason Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk-in Customer"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Customer Phone
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="07X XXXXXXX"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Reason / Note
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Sale / Damage / Sample"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Checkout Summary & Complete Sale */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400 block pb-3 border-b border-slate-800">
              Payment & Bill Summary
            </span>

            {/* Payment Method Selector */}
            <div className="mt-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'Cash', label: 'Cash', icon: Banknote },
                  { id: 'Card', label: 'Card / POS', icon: CreditCard },
                  { id: 'Bank Transfer', label: 'Bank Transfer', icon: Building },
                  { id: 'Credit', label: 'Credit (Store)', icon: Receipt },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-sky-600/20 border-sky-500 text-sky-300 shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-sky-400" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="mt-6 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal ({cartMode ? cartTotalQty : outQty} items):</span>
                <span>Rs. {(cartMode ? cartSubtotal : singleTotal).toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>Discount (LKR):</span>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-24 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-right text-emerald-400 font-bold focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-sans">
                <span className="font-bold text-white">Net Bill Amount:</span>
                <span className="font-mono font-black text-xl text-sky-400">
                  Rs. {(cartMode ? cartNetTotal : Math.max(0, singleTotal - discount)).toFixed(2)}
                </span>
              </div>

              {/* Cash tendered input */}
              {paymentMethod === 'Cash' && (
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-slate-300">
                  <span>Cash Tendered:</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter cash given"
                    value={paidAmount || ''}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-28 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-right text-white font-mono font-bold focus:outline-none"
                  />
                </div>
              )}

              {paymentMethod === 'Cash' && paidAmount > 0 && (
                <div className="flex justify-between text-slate-300 font-bold">
                  <span>Change to Return:</span>
                  <span className="text-emerald-400">
                    Rs. {Math.max(0, paidAmount - (cartMode ? cartNetTotal : singleTotal - discount)).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleProcessSale}
            disabled={
              submitting ||
              (cartMode ? cart.length === 0 : !activeItem || outQty <= 0)
            }
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-600 via-cyan-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-sky-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            {submitting ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Printer className="w-5 h-5" />
                <span>Confirm OUT & Generate Bill</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stock OUT History Section */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-sky-400" />
              <span>Stock OUT / Sales Log for Date</span>
            </h3>
            <p className="text-xs text-slate-400">
              Transactions recorded on selected date with print and refund options.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Filter Date:</span>
            <input
              type="date"
              value={historyDateFilter}
              onChange={(e) => setHistoryDateFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
            />
          </div>
        </div>

        {/* History Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Items Sold</th>
                <th className="py-3 px-4 text-center">Total Qty</th>
                <th className="py-3 px-4 text-right">Net Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {historyLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-400" />
                    <span>Loading sales records...</span>
                  </td>
                </tr>
              ) : historyRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No stock out records on {historyDateFilter}.
                  </td>
                </tr>
              ) : (
                historyRecords.map((rec) => (
                  <tr key={rec._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-sky-400">
                      {rec.invoiceNo}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono">
                      {new Date(rec.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 font-medium text-white max-w-xs">
                      {rec.items?.map((it: any) => `${it.itemName} (${it.qty})`).join(', ')}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-rose-400">
                      -{rec.totalQty}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      Rs. {Number(rec.netAmount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 border border-slate-700">
                        {rec.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onOpenBill(rec)}
                          className="px-2.5 py-1 rounded-lg bg-sky-600/20 hover:bg-sky-600/40 text-sky-300 border border-sky-500/30 flex items-center gap-1"
                          title="Print Receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Bill</span>
                        </button>
                        <button
                          onClick={() => handleCancelSale(rec._id, rec.invoiceNo)}
                          className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                          title="Refund & Restore Stock"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
