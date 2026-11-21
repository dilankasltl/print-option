'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Save,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Receipt,
  Scale,
} from 'lucide-react';

interface ExpenseItem {
  id: string;
  description: string;
  amount: number;
  category: string;
  time: string;
}

export default function CashBalanceTab() {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Cash balancing fields
  const [openingCash, setOpeningCash] = useState<number>(0);
  const [cashSales, setCashSales] = useState<number>(0);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [actualClosingCash, setActualClosingCash] = useState<string>('');
  const [notes, setNotes] = useState('');

  // New expense form
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState<number>(0);
  const [newExpenseCategory, setNewExpenseCategory] = useState('Shop Supplies');

  // Load cash balance for selected date
  const loadCashData = async (dateStr: string) => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`/api/cash-balance?date=${dateStr}`);
      const data = await res.json();
      if (data.success && data.data) {
        const d = data.data;
        setOpeningCash(d.openingCash || 0);
        setCashSales(d.cashSales || 0);
        setExpenses(d.expenses || []);
        setActualClosingCash(d.actualClosingCash !== undefined ? String(d.actualClosingCash) : '');
        setNotes(d.notes || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCashData(selectedDate);
  }, [selectedDate]);

  // Add an expense
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseDesc || newExpenseAmount <= 0) return;

    const newItem: ExpenseItem = {
      id: Date.now().toString(),
      description: newExpenseDesc,
      amount: newExpenseAmount,
      category: newExpenseCategory,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    setExpenses([...expenses, newItem]);
    setNewExpenseDesc('');
    setNewExpenseAmount(0);
  };

  // Remove an expense
  const handleRemoveExpense = (id: string) => {
    setExpenses(expenses.filter((it) => it.id !== id));
  };

  // Save Cash Balance
  const handleSaveCashBalance = async () => {
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/cash-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateString: selectedDate,
          openingCash: Number(openingCash) || 0,
          expenses,
          actualClosingCash: actualClosingCash !== '' ? Number(actualClosingCash) : undefined,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save cash balance');

      setMessage('Cash balance saved successfully!');
      loadCashData(selectedDate);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Calculations
  const totalExpenses = expenses.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
  const expectedClosingCash = Number(openingCash) + Number(cashSales) - totalExpenses;
  const counted = actualClosingCash !== '' ? Number(actualClosingCash) : null;
  const difference = counted !== null ? counted - expectedClosingCash : null;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <Scale className="w-6 h-6 text-sky-400" />
            <span>Daily Cash Balance & Register</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Reconcile daily cash in drawer: Opening cash + cash sales - daily petty expenses.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-2xl border border-slate-800 text-xs">
            <Calendar className="w-4 h-4 text-sky-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white font-mono text-xs focus:outline-none"
            />
          </div>

          <button
            onClick={() => loadCashData(selectedDate)}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {/* KPI 4-Card Formula Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Opening Cash */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">1. Opening Cash</span>
            <Wallet className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400 font-mono">Rs.</span>
            <input
              type="number"
              min="0"
              value={openingCash}
              onChange={(e) => setOpeningCash(Number(e.target.value))}
              placeholder="0.00"
              className="w-full bg-transparent font-mono font-black text-2xl text-white focus:outline-none border-b border-dashed border-slate-700 focus:border-sky-500"
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-2">Cash in drawer at start of day</p>
        </div>

        {/* Card 2: Cash Sales (Auto-computed from Stock Out) */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> 2. Cash In / Sales
            </span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="font-mono font-black text-2xl text-emerald-400">
            Rs. {Number(cashSales).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-500 mt-2">Auto-synced from daily cash stock-outs</p>
        </div>

        {/* Card 3: Total Expenses */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5" /> 3. Total Expenses
            </span>
            <Receipt className="w-4 h-4 text-rose-400" />
          </div>
          <p className="font-mono font-black text-2xl text-rose-400">
            - Rs. {totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-500 mt-2">
            {expenses.length} petty cash expense items
          </p>
        </div>

        {/* Card 4: Expected Closing Cash */}
        <div className="bg-gradient-to-br from-sky-950/60 to-slate-900 border border-sky-500/40 p-5 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-sky-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">4. Expected In Drawer</span>
            <Scale className="w-4 h-4 text-sky-400" />
          </div>
          <p className="font-mono font-black text-2xl text-white">
            Rs. {expectedClosingCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-sky-300/80 mt-2">Opening + Sales - Expenses</p>
        </div>
      </div>

      {/* Reconcile Cash Counter & Expenses List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Expenses Management */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Receipt className="w-4 h-4 text-rose-400" />
              <span>Petty Cash / Daily Shop Expenses</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Total: <strong className="text-rose-400">Rs. {totalExpenses.toFixed(2)}</strong>
            </span>
          </div>

          {/* Add Expense Form */}
          <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
            <div className="sm:col-span-5">
              <input
                type="text"
                placeholder="Description (e.g. Tea, Paper Roll, Courier)"
                value={newExpenseDesc}
                onChange={(e) => setNewExpenseDesc(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Amount (LKR)"
                value={newExpenseAmount || ''}
                onChange={(e) => setNewExpenseAmount(Number(e.target.value))}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-4 flex items-center gap-2">
              <select
                value={newExpenseCategory}
                onChange={(e) => setNewExpenseCategory(e.target.value)}
                className="w-full px-2 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
              >
                <option value="Shop Supplies">Shop Supplies</option>
                <option value="Refreshments">Refreshments / Tea</option>
                <option value="Transport">Transport / Courier</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Utilities">Utilities</option>
                <option value="Other">Other</option>
              </select>
              <button
                type="submit"
                className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shrink-0 shadow-md shadow-rose-600/30"
                title="Add Expense"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Expenses Table */}
          <div className="border border-slate-800 rounded-2xl bg-slate-950/60 overflow-hidden">
            {expenses.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-500">
                No daily expenses logged for {selectedDate}.
              </p>
            ) : (
              <div className="divide-y divide-slate-800/80 text-xs">
                {expenses.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">{item.description}</p>
                      <p className="text-[10px] text-slate-400">
                        {item.category} &bull; {item.time}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-rose-400">
                        - Rs. {Number(item.amount).toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleRemoveExpense(item.id)}
                        className="p-1 text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Physical Drawer Reconciliation & Verification */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Scale className="w-4 h-4 text-sky-400" />
                <span>Physical Drawer Verification</span>
              </h3>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Counted Cash In Drawer (End of Day)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter physical cash counted"
                  value={actualClosingCash}
                  onChange={(e) => setActualClosingCash(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-white font-mono font-black text-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Enter the total physical notes & coins counted in the register.
              </p>
            </div>

            {/* Reconciliation Difference Alert Box */}
            {difference !== null && (
              <div
                className={`p-4 rounded-2xl border ${
                  difference === 0
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : difference > 0
                    ? 'bg-sky-950/60 border-sky-500/40 text-sky-300'
                    : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-sm">
                  <span>
                    {difference === 0
                      ? 'Perfect Match!'
                      : difference > 0
                      ? 'Cash Excess (Surplus)'
                      : 'Cash Shortage (Deficit)'}
                  </span>
                  <span className="font-mono text-base font-black">
                    {difference > 0 ? `+ Rs. ${difference.toFixed(2)}` : `Rs. ${difference.toFixed(2)}`}
                  </span>
                </div>
                <p className="text-[11px] opacity-80 mt-1">
                  {difference === 0
                    ? 'Physical cash matches expected calculation exactly.'
                    : difference > 0
                    ? `You have Rs. ${difference.toFixed(2)} more cash than recorded sales.`
                    : `You are short by Rs. ${Math.abs(difference).toFixed(2)}. Check unrecorded receipts.`}
                </p>
              </div>
            )}

            {/* Daily Notes */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Closing Notes / Remarks
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. All bills verified, Rs. 500 kept in drawer for tomorrow's opening."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSaveCashBalance}
            disabled={saving}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-600 via-cyan-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-sky-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Daily Cash Balance</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
