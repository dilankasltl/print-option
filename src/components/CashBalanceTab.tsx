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
  TrendingUp,
  BarChart3,
  CalendarDays,
  Clock,
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
  const currentMonthStr = todayStr.substring(0, 7);

  // View mode: 'daily' | 'weekly' | 'monthly'
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Daily State
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedStatus, setSavedStatus] = useState<string>('Saved');

  const [openingCash, setOpeningCash] = useState<number>(0);
  const [cashSales, setCashSales] = useState<number>(0);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [actualClosingCash, setActualClosingCash] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Add expense inputs
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState<number>(0);
  const [newExpenseCategory, setNewExpenseCategory] = useState('Shop Supplies');

  // Summary State (Weekly / Monthly)
  const [summaryData, setSummaryData] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

  // Helper to get auth headers with token from localStorage
  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('print_option_token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  // 1. Load Daily Cash Data
  const loadDailyData = async (dateStr: string) => {
    setLoading(true);
    setSavedStatus('Loading...');
    try {
      const res = await fetch(`/api/cash-balance?date=${dateStr}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const d = data.data;
        setOpeningCash(d.openingCash || 0);
        setCashSales(d.cashSales || 0);
        setExpenses(d.expenses || []);
        setActualClosingCash(d.actualClosingCash !== undefined ? String(d.actualClosingCash) : '');
        setNotes(d.notes || '');
        setSavedStatus(`Saved for ${dateStr}`);
      }
    } catch (err) {
      console.error(err);
      setSavedStatus('Error loading');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'daily') {
      loadDailyData(selectedDate);
    }
  }, [selectedDate, viewMode]);

  // 2. Load Summary Data (Weekly / Monthly)
  const loadSummaryData = async () => {
    setSummaryLoading(true);
    try {
      let url = `/api/cash-balance?type=summary&period=${viewMode}`;
      if (viewMode === 'monthly') {
        url += `&month=${selectedMonth}`;
      } else {
        url += `&date=${selectedDate}`;
      }

      const res = await fetch(url, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setSummaryData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'weekly' || viewMode === 'monthly') {
      loadSummaryData();
    }
  }, [viewMode, selectedMonth, selectedDate]);

  // 3. Save Cash Balance to MongoDB
  const saveCashData = async (
    newOpening?: number,
    newExpenses?: ExpenseItem[],
    newActual?: string,
    newNotes?: string
  ) => {
    setSaving(true);
    const openingToSave = newOpening !== undefined ? newOpening : Number(openingCash) || 0;
    const expensesToSave = newExpenses !== undefined ? newExpenses : expenses;
    const actualToSave = newActual !== undefined ? newActual : actualClosingCash;
    const notesToSave = newNotes !== undefined ? newNotes : notes;

    try {
      const res = await fetch('/api/cash-balance', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          dateString: selectedDate,
          openingCash: openingToSave,
          expenses: expensesToSave,
          actualClosingCash: actualToSave !== '' ? Number(actualToSave) : undefined,
          notes: notesToSave,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      setSavedStatus(`Saved to Database at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`);
    } catch (err: any) {
      console.error('Save error:', err);
      setSavedStatus('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Add an expense & Immediately auto-save to MongoDB
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseDesc || newExpenseAmount <= 0) return;

    const newItem: ExpenseItem = {
      id: Date.now().toString(),
      description: newExpenseDesc,
      amount: newExpenseAmount,
      category: newExpenseCategory,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedExpenses = [...expenses, newItem];
    setExpenses(updatedExpenses);
    setNewExpenseDesc('');
    setNewExpenseAmount(0);

    // Auto-save immediately to database
    await saveCashData(undefined, updatedExpenses, undefined, undefined);
  };

  // Remove an expense & Immediately auto-save
  const handleRemoveExpense = async (id: string) => {
    const updatedExpenses = expenses.filter((it) => it.id !== id);
    setExpenses(updatedExpenses);
    await saveCashData(undefined, updatedExpenses, undefined, undefined);
  };

  // On Opening Cash blur / enter
  const handleOpeningCashChange = (val: number) => {
    setOpeningCash(val);
  };

  const handleOpeningCashBlur = async () => {
    await saveCashData(openingCash, undefined, undefined, undefined);
  };

  // Daily Calculations
  const totalExpenses = expenses.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
  const expectedClosingCash = Number(openingCash) + Number(cashSales) - totalExpenses;
  const counted = actualClosingCash !== '' ? Number(actualClosingCash) : null;
  const difference = counted !== null ? counted - expectedClosingCash : null;

  return (
    <div className="space-y-8">
      {/* Top Banner & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <Scale className="w-6 h-6 text-sky-400" />
            <span>Daily Cash Balance & Register</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Reconcile Opening cash + daily cash sales - petty expenses for exact drawer balance.
          </p>
        </div>

        {/* View Toggle: Daily | Weekly | Monthly */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('daily')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'daily'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Daily</span>
          </button>

          <button
            onClick={() => setViewMode('weekly')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'weekly'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Weekly</span>
          </button>

          <button
            onClick={() => setViewMode('monthly')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'monthly'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Monthly</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: DAILY CASH BALANCE */}
      {viewMode === 'daily' && (
        <div className="space-y-6">
          {/* Date Picker & Persistence Status Indicator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Select Date:
              </span>
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-white">
                <Calendar className="w-4 h-4 text-sky-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-white font-mono focus:outline-none"
                />
              </div>

              <button
                onClick={() => loadDailyData(selectedDate)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                title="Refresh Date Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-mono text-[11px]">{savedStatus}</span>
            </div>
          </div>

          {/* 4-Card Balance Formula */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Opening Cash */}
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl shadow-lg relative">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                  1. Opening Cash
                </span>
                <Wallet className="w-4 h-4 text-sky-400" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-400 font-mono">Rs.</span>
                <input
                  type="number"
                  min="0"
                  value={openingCash || ''}
                  onChange={(e) => handleOpeningCashChange(Number(e.target.value))}
                  onBlur={handleOpeningCashBlur}
                  placeholder="0.00"
                  className="w-full bg-transparent font-mono font-black text-2xl text-white focus:outline-none border-b border-dashed border-slate-700 focus:border-sky-500"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                Auto-saves when you click out of the box
              </p>
            </div>

            {/* 2. Cash In / Sales */}
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl shadow-lg relative">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" /> 2. Cash Sales
                </span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="font-mono font-black text-2xl text-emerald-400">
                Rs. {Number(cashSales).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-slate-500 mt-2">
                Auto-synced from daily cash stock-out sales
              </p>
            </div>

            {/* 3. Total Expenses */}
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl shadow-lg relative">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                  <ArrowDownRight className="w-3.5 h-3.5" /> 3. Petty Expenses
                </span>
                <Receipt className="w-4 h-4 text-rose-400" />
              </div>
              <p className="font-mono font-black text-2xl text-rose-400">
                - Rs. {totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-slate-500 mt-2">
                {expenses.length} petty cash items saved
              </p>
            </div>

            {/* 4. Expected In Drawer */}
            <div className="bg-gradient-to-br from-sky-950/60 to-slate-900 border border-sky-500/40 p-5 rounded-3xl shadow-lg relative">
              <div className="flex items-center justify-between text-sky-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">
                  4. Expected in Drawer
                </span>
                <Scale className="w-4 h-4 text-sky-400" />
              </div>
              <p className="font-mono font-black text-2xl text-white">
                Rs. {expectedClosingCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-sky-300/80 mt-2">Opening + Sales - Expenses</p>
            </div>
          </div>

          {/* Expenses & Drawer Count Split Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Petty Cash Expenses with Instant Auto-Save */}
            <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-rose-400" />
                  <span>Petty Cash / Daily Expenses</span>
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
                    title="Add and Auto-save"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Expenses List */}
              <div className="border border-slate-800 rounded-2xl bg-slate-950/60 overflow-hidden">
                {expenses.length === 0 ? (
                  <p className="p-6 text-center text-xs text-slate-500">
                    No petty expenses logged for {selectedDate}.
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
                            title="Remove"
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

            {/* Right: Actual Drawer Count & Reconcile Verification */}
            <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Scale className="w-4 h-4 text-sky-400" />
                    <span>Drawer Physical Verification</span>
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Counted Cash in Drawer (End of Day)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter physical cash counted"
                    value={actualClosingCash}
                    onChange={(e) => setActualClosingCash(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-white font-mono font-black text-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Count notes & coins in drawer to check difference.
                  </p>
                </div>

                {/* Over / Short Difference Alert Box */}
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

                {/* Closing Notes */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Closing Notes
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

              {/* Explicit Save Button */}
              <button
                type="button"
                onClick={() => saveCashData()}
                disabled={saving}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-600 via-cyan-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-sky-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
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
      )}

      {/* VIEW 2 & 3: WEEKLY / MONTHLY SUMMARY */}
      {(viewMode === 'weekly' || viewMode === 'monthly') && (
        <div className="space-y-6">
          {/* Summary Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-400" />
                <span>
                  {viewMode === 'weekly'
                    ? `Weekly Cash Flow Summary (${summaryData?.summary?.startDate || ''} to ${summaryData?.summary?.endDate || ''})`
                    : `Monthly Cash Flow Summary (${selectedMonth})`}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Aggregate cash in, expenses, and net profit flow.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {viewMode === 'monthly' ? (
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono text-xs focus:outline-none"
                />
              ) : (
                <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
                  <span className="text-slate-400">Week of:</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent text-white font-mono focus:outline-none"
                  />
                </div>
              )}

              <button
                onClick={loadSummaryData}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${summaryLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* 3 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-5 rounded-3xl shadow-xl">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                Total Cash In (Sales)
              </span>
              <p className="font-mono font-black text-2xl sm:text-3xl text-emerald-400">
                Rs. {Number(summaryData?.summary?.totalSales || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-slate-400 mt-2">All cash receipts in period</p>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-5 rounded-3xl shadow-xl">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400 block mb-1">
                Total Petty Expenses
              </span>
              <p className="font-mono font-black text-2xl sm:text-3xl text-rose-400">
                - Rs. {Number(summaryData?.summary?.totalExpenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-slate-400 mt-2">All petty cash expenses paid</p>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-sky-500/40 p-5 rounded-3xl shadow-xl">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400 block mb-1">
                Net Cash Flow
              </span>
              <p className="font-mono font-black text-2xl sm:text-3xl text-white">
                Rs. {Number(summaryData?.summary?.netCashFlow || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-sky-300/80 mt-2">Cash Sales minus Petty Expenses</p>
            </div>
          </div>

          {/* Day-by-Day Breakdown Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Day-by-Day Cash Breakdown
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Opening Cash</th>
                    <th className="py-3 px-4 text-right">Cash In (Sales)</th>
                    <th className="py-3 px-4 text-right">Expenses</th>
                    <th className="py-3 px-4 text-right">Expected Drawer</th>
                    <th className="py-3 px-4 text-right">Counted</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {!summaryData?.dailyBreakdown || summaryData.dailyBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500 font-sans">
                        No cash records logged for this {viewMode}.
                      </td>
                    </tr>
                  ) : (
                    summaryData.dailyBreakdown.map((row: any) => (
                      <tr key={row.dateString} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-bold text-sky-400">
                          {row.dateString}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-300">
                          Rs. {Number(row.openingCash).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-400">
                          Rs. {Number(row.cashSales).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right text-rose-400">
                          -Rs. {Number(row.totalExpenses).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-white">
                          Rs. {Number(row.expectedClosingCash).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {row.actualClosingCash !== undefined ? (
                            <span
                              className={`font-bold ${
                                row.difference === 0
                                  ? 'text-emerald-400'
                                  : row.difference > 0
                                  ? 'text-sky-400'
                                  : 'text-rose-400'
                              }`}
                            >
                              Rs. {Number(row.actualClosingCash).toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedDate(row.dateString);
                              setViewMode('daily');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-sky-600/20 hover:bg-sky-600/40 text-sky-300 border border-sky-500/30 text-[11px] font-sans font-semibold transition"
                          >
                            Open Date
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
