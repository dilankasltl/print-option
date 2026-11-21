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

  const formattedDate = new Date(sale.date || sale.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = new Date(sale.createdAt || Date.now()).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        
        {/* Action Header (Hidden in Print) */}
        <div className="no-print p-4 sm:p-5 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">Receipt / Bill Generated</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-sky-600/30 transition-all hover:scale-105"
            >
              <Printer className="w-4 h-4" />
              <span>Print Bill</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="p-4 sm:p-6 bg-slate-900/50 flex justify-center">
          <div
            ref={receiptRef}
            className="printable-receipt w-full max-w-sm bg-white text-slate-900 p-6 rounded-2xl shadow-xl border border-slate-200 font-mono text-xs"
          >
            {/* Header */}
            <div className="text-center pb-4 border-b border-dashed border-slate-300">
              <div className="w-14 h-14 mx-auto mb-1">
                <img
                  src="/logo.png"
                  alt="PRINT OPTION"
                  className="w-full h-full object-contain mx-auto"
                />
              </div>
              <h2 className="text-lg font-black tracking-wider text-slate-900 uppercase">
                PRINT OPTION
              </h2>
              <p className="text-[10px] text-slate-600 font-sans tracking-widest uppercase">
                We Print. You Shine.
              </p>
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-800 mt-1">
                <span>Hotline: +94 71 723 7290</span>
              </div>
            </div>

            {/* Meta Details */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice No:</span>
                <span className="font-bold">{sale.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date & Time:</span>
                <span>{formattedDate} {formattedTime}</span>
              </div>
              {sale.customerName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-semibold">{sale.customerName}</span>
                </div>
              )}
              {sale.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <span>{sale.customerPhone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Payment:</span>
                <span className="font-semibold">{sale.paymentMethod || 'Cash'}</span>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="py-3 border-b border-dashed border-slate-300">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] text-slate-500 uppercase border-b border-slate-200">
                    <th className="pb-1">Item / Code</th>
                    <th className="pb-1 text-center">Qty</th>
                    <th className="pb-1 text-right">Price</th>
                    <th className="pb-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sale.items?.map((it: any, idx: number) => (
                    <tr key={idx} className="text-[11px]">
                      <td className="py-1.5 pr-1">
                        <p className="font-semibold leading-tight text-slate-900">{it.itemName}</p>
                        <p className="text-[10px] text-slate-500">{it.itno}</p>
                      </td>
                      <td className="py-1.5 text-center font-bold text-slate-800">{it.qty}</td>
                      <td className="py-1.5 text-right text-slate-600">
                        {Number(it.unitPrice).toFixed(2)}
                      </td>
                      <td className="py-1.5 text-right font-bold text-slate-900">
                        {Number(it.total).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="py-3 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({sale.totalQty} items):</span>
                <span>Rs. {Number(sale.totalAmount).toFixed(2)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount:</span>
                  <span>- Rs. {Number(sale.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-300">
                <span>NET TOTAL:</span>
                <span>Rs. {Number(sale.netAmount).toFixed(2)}</span>
              </div>
              {sale.paidAmount > 0 && (
                <>
                  <div className="flex justify-between text-slate-600 pt-1">
                    <span>Cash Tendered:</span>
                    <span>Rs. {Number(sale.paidAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-800 font-bold">
                    <span>Change:</span>
                    <span>Rs. {Number(sale.changeAmount || 0).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-dashed border-slate-300 text-center space-y-1">
              <p className="font-bold text-slate-800 text-[11px]">Thank You For Your Business!</p>
              <p className="text-[10px] text-slate-500">
                For Inquiries & Reorders: +94 71 723 7290
              </p>
              <p className="text-[9px] text-slate-400 font-sans pt-1">
                Software by PRINT OPTION
              </p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="no-print p-4 bg-slate-800/80 border-t border-slate-700 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Tip: Select "Save as PDF" in print dialog to download.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs sm:text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
