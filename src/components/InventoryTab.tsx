'use client';

import React, { useState } from 'react';
import {
  Package,
  Plus,
  FileSpreadsheet,
  Download,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Check,
  X,
  Upload,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { generateTemplateBlob, exportItemsToExcel, parseExcelFile } from '@/lib/excel';

interface ItemType {
  _id: string;
  itno: string;
  itemName: string;
  availableQty: number;
  actualPrice?: number;
  unitPrice: number;
  reason: string;
  minAlertQty: number;
  updatedAt: string;
}

interface InventoryTabProps {
  items: ItemType[];
  loading: boolean;
  isAdmin?: boolean;
  onRefresh: () => void;
  onQuickOut: (item: ItemType) => void;
  onOpenLogin?: () => void;
}

export default function InventoryTab({
  items,
  loading,
  isAdmin = false,
  onRefresh,
  onQuickOut,
  onOpenLogin,
}: InventoryTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Selected item for edit or delete
  const [selectedItem, setSelectedItem] = useState<ItemType | null>(null);

  // Add / Edit form state
  const [formData, setFormData] = useState({
    itno: '',
    itemName: '',
    availableQty: 0,
    actualPrice: 0,
    unitPrice: 0,
    reason: 'Stock In',
    minAlertQty: 5,
  });

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Bulk Excel Upload state
  const [excelPreviewRows, setExcelPreviewRows] = useState<any[]>([]);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSummary, setUploadSummary] = useState<any>(null);

  // Filtered Items
  const filteredItems = items.filter((item) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      item.itno.toLowerCase().includes(q) ||
      item.itemName.toLowerCase().includes(q) ||
      (item.reason && item.reason.toLowerCase().includes(q));

    const matchesLowStock = !filterLowStock || item.availableQty <= (item.minAlertQty || 5);
    return matchesSearch && matchesLowStock;
  });

  // Open Edit Modal
  const handleOpenEdit = (item: ItemType) => {
    setSelectedItem(item);
    setFormData({
      itno: item.itno,
      itemName: item.itemName,
      availableQty: item.availableQty,
      actualPrice: item.actualPrice || Math.round(item.unitPrice * 1.18),
      unitPrice: item.unitPrice,
      reason: item.reason || 'Stock In',
      minAlertQty: item.minAlertQty || 5,
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  // Open Delete Modal
  const handleOpenDelete = (item: ItemType) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  // Submit Add New Item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add item');

      setIsAddModalOpen(false);
      setFormData({
        itno: '',
        itemName: '',
        availableQty: 0,
        actualPrice: 0,
        unitPrice: 0,
        reason: 'Stock In',
        minAlertQty: 5,
      });
      onRefresh();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Submit Edit Item
  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setFormSubmitting(true);
    setFormError('');

    try {
      const res = await fetch(`/api/items/${selectedItem._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update item');

      setIsEditModalOpen(false);
      setSelectedItem(null);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Confirm Delete Item
  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    setFormSubmitting(true);

    try {
      const res = await fetch(`/api/items/${selectedItem._id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete item');

      setIsDeleteModalOpen(false);
      setSelectedItem(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Download Sample Template
  const handleDownloadTemplate = () => {
    const blob = generateTemplateBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PRINT_OPTION_STOCK_TEMPLATE.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle Excel File Selected
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFile(file);
    try {
      const rows = await parseExcelFile(file);
      setExcelPreviewRows(rows);
      setUploadSummary(null);
    } catch (err: any) {
      alert('Failed to parse file: ' + err.message);
    }
  };

  // Submit Bulk Upload
  const handleConfirmUpload = async () => {
    if (!excelPreviewRows.length) return;
    setUploadLoading(true);

    try {
      const res = await fetch('/api/items/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: excelPreviewRows }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload items');

      setUploadSummary(data);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <Package className="w-6 h-6 text-sky-400" />
            <span>{isAdmin ? 'Stock Inventory & Pricing (Admin)' : 'Stock Catalog (View)'}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {isAdmin
              ? 'Add, edit, delete items, upload Excel sheets, and manage prices.'
              : 'Live inventory stock levels, prices, and quantities added by Admin.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin ? (
            <>
              <button
                onClick={() => {
                  setFormData({
                    itno: '',
                    itemName: '',
                    availableQty: 0,
                    actualPrice: 0,
                    unitPrice: 0,
                    reason: 'Stock In',
                    minAlertQty: 5,
                  });
                  setFormError('');
                  setIsAddModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-sky-600/30 transition-all hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                <span>Add Single Item</span>
              </button>

              <button
                onClick={() => {
                  setExcelFile(null);
                  setExcelPreviewRows([]);
                  setUploadSummary(null);
                  setIsUploadModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/20 transition-all hover:scale-105"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Upload Excel</span>
              </button>
            </>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-600/30 transition-all hover:scale-105"
            >
              <Lock className="w-4 h-4" />
              <span>Admin Login to Add/Edit</span>
            </button>
          )}

          <button
            onClick={() => exportItemsToExcel(items)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs sm:text-sm transition-all"
            title="Export full inventory to Excel file"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>

          <button
            onClick={onRefresh}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
            title="Refresh Inventory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ITNO, Item Name..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filterLowStock}
              onChange={(e) => setFilterLowStock(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-800"
            />
            <span className="flex items-center gap-1.5 text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              Low Stock Only
            </span>
          </label>

          <span className="text-xs text-slate-400 font-mono">
            Total: <strong className="text-sky-400">{filteredItems.length}</strong> items
          </span>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase font-mono tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-4 px-4 sm:px-6">ITNO</th>
                <th className="py-4 px-4 sm:px-6">Item Name</th>
                <th className="py-4 px-4 sm:px-6 text-center">Available Qty</th>
                <th className="py-4 px-4 sm:px-6 text-right">Actual / Discount Price</th>
                <th className="py-4 px-4 sm:px-6 text-right hidden md:table-cell">Total Value</th>
                <th className="py-4 px-4 sm:px-6 hidden lg:table-cell">Reason / Notes</th>
                <th className="py-4 px-4 sm:px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-400" />
                    <span>Loading inventory stock...</span>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="font-semibold text-slate-300">No items found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Add items manually or upload an Excel sheet.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLow = item.availableQty <= (item.minAlertQty || 5);
                  const isOutOfStock = item.availableQty <= 0;

                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-slate-800/50 transition-colors group"
                    >
                      <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-sky-400">
                        {item.itno}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 font-medium text-white">
                        <div className="flex items-center gap-2">
                          <span>{item.itemName}</span>
                          {isOutOfStock ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              Low Stock
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-xl font-bold font-mono text-xs ${
                            isOutOfStock
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : isLow
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {item.availableQty}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right font-mono">
                        <div className="flex flex-col items-end">
                          <span className="line-through text-slate-500 text-xs font-normal">
                            Rs. {Number(item.actualPrice || Math.round(item.unitPrice * 1.18)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="font-bold text-emerald-400 text-sm">
                            Rs. {Number(item.unitPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right font-mono text-slate-400 hidden md:table-cell">
                        Rs. {(item.availableQty * item.unitPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-slate-400 text-xs hidden lg:table-cell max-w-xs truncate">
                        {item.reason || 'Stock In'}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Quick Out Button */}
                          <button
                            onClick={() => onQuickOut(item)}
                            disabled={isOutOfStock}
                            className="px-2.5 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/40 text-sky-300 border border-sky-500/30 text-xs font-semibold flex items-center gap-1 disabled:opacity-40 transition-all"
                            title="Mark Stock Out"
                          >
                            <span>OUT</span>
                          </button>

                          {/* Edit & Delete Items only visible when Admin is logged in */}
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                                title="Edit Item"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleOpenDelete(item)}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                                title="Delete Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD / EDIT ITEM */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-7 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-sky-400" />
                <span>{isAddModalOpen ? 'Add New Item' : `Edit Item (${selectedItem?.itno})`}</span>
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {formError}
              </div>
            )}

            <form
              onSubmit={isAddModalOpen ? handleAddItem : handleUpdateItem}
              className="mt-5 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    ITNO (Item Code) *
                  </label>
                  <input
                    type="text"
                    value={formData.itno}
                    onChange={(e) => setFormData({ ...formData, itno: e.target.value.toUpperCase() })}
                    placeholder="e.g. PO-001"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Available Qty *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.availableQty}
                    onChange={(e) => setFormData({ ...formData, availableQty: Number(e.target.value) })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  placeholder="e.g. A4 Paper Rim / Sublimation Mug"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Actual Price (MRP / Regular)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Regular price with strikethrough"
                    value={formData.actualPrice || ''}
                    onChange={(e) => setFormData({ ...formData, actualPrice: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Discount Price (Selling Price) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-emerald-400 font-mono font-bold text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Low Stock Alert Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minAlertQty}
                    onChange={(e) => setFormData({ ...formData, minAlertQty: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Reason / Notes / Category
                  </label>
                  <input
                    type="text"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="e.g. Regular Stock, Office Supplies"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-medium text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-sky-600/30 flex items-center gap-2 disabled:opacity-50"
                >
                  {formSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{isAddModalOpen ? 'Save Item' : 'Update Item'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {isDeleteModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Delete Item</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Are you sure you want to delete <strong className="text-white">{selectedItem.itemName}</strong> (
              <span className="text-sky-400 font-mono">{selectedItem.itno}</span>)? This action cannot be undone.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteItem}
                disabled={formSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-rose-600/30"
              >
                {formSubmitting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EXCEL BULK UPLOAD */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-7 shadow-2xl relative my-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Upload Excel File</h3>
                  <p className="text-xs text-slate-400">
                    Bulk add or update stock items from an Excel (.xlsx / .csv) sheet.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Download Notice */}
            <div className="mt-5 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-200">Need the correct Excel format?</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Columns: <code className="text-sky-300 font-mono">ITNO</code>,{' '}
                  <code className="text-sky-300 font-mono">ITEM NAME</code>,{' '}
                  <code className="text-sky-300 font-mono">AVAILABLE QTY</code>,{' '}
                  <code className="text-sky-300 font-mono">ONE PIECE PRICE</code>,{' '}
                  <code className="text-sky-300 font-mono">REASON</code>
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 font-semibold text-xs whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                <span>Download Template</span>
              </button>
            </div>

            {/* Drag & Drop File Upload Input */}
            <div className="mt-5">
              <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-700 hover:border-sky-500 rounded-2xl cursor-pointer bg-slate-950/60 hover:bg-slate-950/90 transition-all p-4 text-center">
                <Upload className="w-8 h-8 text-sky-400 mb-2" />
                <span className="text-xs sm:text-sm font-semibold text-white">
                  {excelFile ? excelFile.name : 'Click to select or drag & drop Excel file (.xlsx, .csv)'}
                </span>
                <span className="text-[11px] text-slate-500 mt-1">
                  Supported formats: .xlsx, .xls, .csv
                </span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Upload Summary Feedback */}
            {uploadSummary && (
              <div className="mt-4 p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-200">
                  <Check className="w-4 h-4" />
                  <span>{uploadSummary.message}</span>
                </div>
                <div className="mt-2 flex gap-4 text-xs font-mono">
                  <span>New Added: <strong>{uploadSummary.createdCount}</strong></span>
                  <span>Updated: <strong>{uploadSummary.updatedCount}</strong></span>
                  {uploadSummary.skippedCount > 0 && (
                    <span className="text-amber-300">Skipped: <strong>{uploadSummary.skippedCount}</strong></span>
                  )}
                </div>
              </div>
            )}

            {/* Preview Table of Rows */}
            {excelPreviewRows.length > 0 && (
              <div className="mt-5">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-bold text-slate-300">
                    Preview: Found {excelPreviewRows.length} rows to import
                  </span>
                </div>
                <div className="max-h-56 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950 p-2 text-xs font-mono">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-800">
                        <th className="p-1.5">Row</th>
                        <th className="p-1.5">ITNO</th>
                        <th className="p-1.5">Item Name</th>
                        <th className="p-1.5 text-center">Qty</th>
                        <th className="p-1.5 text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {excelPreviewRows.slice(0, 10).map((r, idx) => (
                        <tr key={idx} className="text-slate-300">
                          <td className="p-1.5 text-slate-500">{idx + 1}</td>
                          <td className="p-1.5 font-bold text-sky-400">
                            {r.ITNO || r.itno || r['Item No'] || '-'}
                          </td>
                          <td className="p-1.5">{r['ITEM NAME'] || r.itemName || r.Name || '-'}</td>
                          <td className="p-1.5 text-center">{r['AVAILABLE QTY'] || r.qty || 0}</td>
                          <td className="p-1.5 text-right">{r['ONE PIECE PRICE'] || r.unitPrice || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {excelPreviewRows.length > 10 && (
                    <p className="text-[10px] text-slate-500 text-center py-2">
                      ... and {excelPreviewRows.length - 10} more rows
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-medium text-xs sm:text-sm"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleConfirmUpload}
                disabled={excelPreviewRows.length === 0 || uploadLoading}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 flex items-center gap-2 disabled:opacity-40"
              >
                {uploadLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>Import {excelPreviewRows.length} Items</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
