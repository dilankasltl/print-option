'use client';

import React, { useRef } from 'react';
import { Printer, X, CheckCircle2 } from 'lucide-react';

interface BillModalProps {
  sale: any;
  onClose: () => void;
}

export default function BillModal({ sale, onClose }: BillModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(sale.date || sale.createdAt || Date.now()).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = new Date(sale.createdAt || Date.now()).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Calculate actual total sum and savings across all items
  const totalActualSum = sale.items?.reduce((acc: number, it: any) => {
    const actual = Number(it.actualPrice || it.unitPrice || 0);
    return acc + actual * (Number(it.qty) || 1);
  }, 0) || Number(sale.totalAmount || 0);

  const itemSavings = Math.max(0, totalActualSum - Number(sale.totalAmount || 0));
  const additionalDiscount = Number(sale.discount || 0);
  const grandTotalSavings = itemSavings + additionalDiscount;

  return (
    <div className="bill-modal-portal fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="bill-modal-card w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-4">
        
        {/* Action Header (Hidden in Print) */}
        <div className="no-print p-3.5 sm:p-4 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
            <div>
              <h3 className="font-bold text-white text-xs sm:text-sm">Receipt / Bill Generated</h3>
              <p className="text-[10px] text-slate-400">1-Page POS Slip &bull; Actual & Discount Price</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-bold text-xs shadow-md shadow-sky-600/30 transition-all hover:scale-105"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print 1-Page</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="p-3 sm:p-5 bg-slate-900/60 flex justify-center">
          <div
            ref={receiptRef}
            className="printable-receipt w-full max-w-[78mm] bg-white text-slate-900 p-4 sm:p-5 rounded-xl shadow-xl font-mono text-xs leading-tight"
          >
            {/* Header */}
            <div className="text-center pb-2.5 border-b border-dashed border-slate-400">
              <div className="w-11 h-11 mx-auto mb-1">
                <img
                  src="/logo.png"
                  alt="PRINT OPTION"
                  className="w-full h-full object-contain mx-auto"
                />
              </div>
              <h2 className="text-base font-black tracking-wider text-slate-900 uppercase">
                PRINT OPTION
              </h2>
              <p className="text-[9px] text-slate-600 font-sans tracking-widest uppercase font-semibold">
                We Print. You Shine.
              </p>
              <p className="text-[10px] font-bold text-slate-800 mt-0.5">
                Hotline: +94 71 723 7290
              </p>
            </div>

            {/* Meta Details */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span className="text-slate-600">Invoice No:</span>
                <span className="font-bold text-slate-900">{sale.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Date & Time:</span>
                <span className="text-slate-800">{formattedDate} {formattedTime}</span>
              </div>
              {sale.customerName && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Customer:</span>
                  <span className="font-semibold text-slate-900">{sale.customerName}</span>
                </div>
              )}
              {sale.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Phone:</span>
                  <span className="text-slate-800">{sale.customerPhone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-600">Payment Method:</span>
                <span className="font-bold text-slate-900">{sale.paymentMethod || 'Cash'}</span>
              </div>
            </div>

            {/* Itemized Table showing Actual Price AND Discount Price */}
            <div className="py-2 border-b border-dashed border-slate-400">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[9px] text-slate-600 uppercase border-b border-slate-300 pb-1">
                    <th className="pb-1 text-left font-bold">Item</th>
                    <th className="pb-1 text-center font-bold">Qty</th>
                    <th className="pb-1 text-right font-bold">Actual/Disc</th>
                    <th className="pb-1 text-right font-bold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sale.items?.map((it: any, idx: number) => {
                    const selling = Number(it.unitPrice || 0);
                    // Actual Price from item record or fallback
                    const actual = Number(it.actualPrice && it.actualPrice > 0 ? it.actualPrice : selling);
                    const hasDiscount = actual > selling;

                    return (
                      <tr key={idx} className="text-[10px]">
                        <td className="py-1 pr-1 align-top">
                          <p className="font-bold text-slate-900 leading-tight">{it.itemName}</p>
                          <p className="text-[8px] text-slate-500 font-sans">{it.itno}</p>
                        </td>
                        <td className="py-1 text-center font-bold text-slate-800 align-top">
                          {it.qty}
                        </td>
                        <td className="py-1 text-right align-top whitespace-nowrap">
                          {hasDiscount && (
                            <p className="line-through text-slate-500 text-[9px]">
                              {actual.toFixed(2)}
                            </p>
                          )}
                          <p className={`font-bold ${hasDiscount ? 'text-slate-900' : 'text-slate-800'}`}>
                            {selling.toFixed(2)}
                          </p>
                        </td>
                        <td className="py-1 text-right font-bold text-slate-900 align-top">
                          {Number(it.total).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="py-2 space-y-1 text-[10px]">
              {totalActualSum > Number(sale.totalAmount) && (
                <div className="flex justify-between text-slate-600">
                  <span>Total Actual Value:</span>
                  <span className="line-through">Rs. {Number(totalActualSum).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-700">
                <span>Subtotal ({sale.totalQty} items):</span>
                <span>Rs. {Number(sale.totalAmount).toFixed(2)}</span>
              </div>
              {additionalDiscount > 0 && (
                <div className="flex justify-between text-emerald-800 font-semibold">
                  <span>Additional Discount:</span>
                  <span>- Rs. {Number(additionalDiscount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-black text-slate-900 pt-1 border-t border-slate-400">
                <span>NET TOTAL:</span>
                <span>Rs. {Number(sale.netAmount).toFixed(2)}</span>
              </div>

              {/* Cash tendered & Change if cash payment */}
              {sale.paidAmount > 0 && (
                <>
                  <div className="flex justify-between text-slate-600 pt-0.5">
                    <span>Cash Tendered:</span>
                    <span>Rs. {Number(sale.paidAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-800 font-bold">
                    <span>Change:</span>
                    <span>Rs. {Number(sale.changeAmount || 0).toFixed(2)}</span>
                  </div>
                </>
              )}

              {/* Total Savings Highlight */}
              {grandTotalSavings > 0 && (
                <div className="mt-1.5 p-1 rounded bg-slate-100 border border-slate-300 text-center text-slate-900 font-black text-[10px]">
                  ★ TOTAL SAVINGS: Rs. {Number(grandTotalSavings).toFixed(2)} ★
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-2.5 border-t border-dashed border-slate-400 text-center space-y-0.5">
              <p className="font-bold text-slate-900 text-[10px]">Thank You For Your Business!</p>
              <p className="text-[9px] text-slate-600">
                For Inquiries & Reorders: +94 71 723 7290
              </p>
              <p className="text-[8px] text-slate-500 font-sans">
                PRINT OPTION POS &bull; We Print. You Shine.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions (Hidden in Print) */}
        <div className="no-print p-3 bg-slate-800/90 border-t border-slate-700 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400">
            Strictly 1 Page &bull; 80mm POS Slip
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
