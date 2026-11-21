'use client';

import React, { useState } from 'react';
import { Phone, MessageCircle, X, Headphones } from 'lucide-react';

export default function FloatingQuickContact() {
  const [isOpen, setIsOpen] = useState(false);
  const phoneNumber = '+94 71 723 7290';
  const whatsappUrl = 'https://wa.me/94717237290?text=Hello%20PRINT%20OPTION';
  const callUrl = 'tel:+94717237290';

  return (
    <div className="fixed bottom-6 right-6 z-50 no-print flex flex-col items-end gap-3">
      {isOpen && (
        <div className="bg-slate-900/95 border border-slate-700/80 backdrop-blur-xl p-4 rounded-2xl shadow-2xl shadow-black/80 flex flex-col gap-3 w-64 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-sky-400">PRINT OPTION Support</p>
              <p className="text-sm font-semibold text-white">{phoneNumber}</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <a
            href={callUrl}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 transition-all font-medium text-sm group"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white shadow-md shadow-sky-500/40 group-hover:scale-105 transition-transform">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs text-sky-400/80">Direct Call</span>
              <span className="text-xs font-bold text-white">{phoneNumber}</span>
            </div>
          </a>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-all font-medium text-sm group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/40 group-hover:scale-105 transition-transform">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs text-emerald-400/80">WhatsApp Chat</span>
              <span className="text-xs font-bold text-white">Message Us</span>
            </div>
          </a>
        </div>
      )}

      {/* Floating Pill Trigger */}
      <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 backdrop-blur-md p-1.5 rounded-full shadow-xl shadow-sky-500/10">
        <a
          href={callUrl}
          className="w-10 h-10 rounded-full bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-600/30 hover:scale-105 transition-transform"
          title={`Call ${phoneNumber}`}
        >
          <Phone className="w-4 h-4" />
        </a>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 hover:scale-105 transition-transform"
          title="WhatsApp +94 71 723 7290"
        >
          <MessageCircle className="w-4 h-4" />
        </a>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5"
        >
          <Headphones className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Help</span>
        </button>
      </div>
    </div>
  );
}
