'use client';

import React from 'react';
import { Phone, MessageCircle, LogOut, Package, ShoppingCart, DollarSign, LayoutDashboard, ShieldCheck, Lock } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  adminUser: { username: string; name: string } | null;
  onLogout: () => void;
  onOpenLogin: () => void;
}

export default function Header({ activeTab, setActiveTab, adminUser, onLogout, onOpenLogin }: HeaderProps) {
  const phoneNumber = '+94 71 723 7290';
  const whatsappUrl = 'https://wa.me/94717237290?text=Hello%20PRINT%20OPTION';
  const callUrl = 'tel:+94717237290';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'stock-out', label: 'Mark OUT / POS', icon: ShoppingCart },
    { id: 'inventory', label: 'Stock Inventory', icon: Package },
    { id: 'cash-balance', label: 'Cash Balance', icon: DollarSign },
  ];

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-400 via-pink-500 to-amber-400 opacity-70 blur-sm group-hover:opacity-100 transition duration-300 animate-pulse" />
              <div className="relative w-12 h-12 rounded-2xl bg-white p-1 flex items-center justify-center shadow-lg border border-slate-700 overflow-hidden">
                <img
                  src="/logo.png"
                  alt="PRINT OPTION"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-wider bg-gradient-to-r from-cyan-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
                  PRINT OPTION
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase bg-sky-500/10 text-cyan-400 border border-cyan-500/30 rounded-full">
                  POS & Stock
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-wider hidden sm:block">
                We Print. You Shine.
              </p>
            </div>
          </div>

          {/* Quick Call & WhatsApp Badges */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={callUrl}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-sky-400 hover:text-sky-300 border border-sky-500/20 hover:border-sky-500/50 transition-all text-xs sm:text-sm font-semibold group shadow-sm"
              title="Call Print Option"
            >
              <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Phone className="w-4 h-4 text-sky-400" />
              </div>
              <span className="hidden md:inline">{phoneNumber}</span>
            </a>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/60 transition-all text-xs sm:text-sm font-semibold group shadow-sm"
              title="Chat on WhatsApp"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="hidden md:inline">WhatsApp</span>
            </a>

            {/* Admin status & Logout or Login Button in Top Right Corner */}
            {adminUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-sky-950/60 border border-sky-500/30 text-xs text-sky-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                  <span className="font-semibold">{adminUser.username}</span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="pl-1 sm:pl-2 border-l border-slate-800">
                <button
                  onClick={onOpenLogin}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-600/30 transition-all hover:scale-105"
                  title="Admin Sign In"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Admin Login</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto py-2.5 border-t border-slate-800/80 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-md shadow-sky-600/30 border border-sky-400/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
