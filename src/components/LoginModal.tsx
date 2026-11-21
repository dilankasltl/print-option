'use client';

import React, { useState } from 'react';
import { Lock, User, KeyRound, ArrowRight, AlertCircle, Phone, MessageCircle, X } from 'lucide-react';

interface LoginModalProps {
  onSuccess: (userData: any) => void;
  onClose?: () => void;
}

export default function LoginModal({ onSuccess, onClose }: LoginModalProps) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token in localStorage for client-side API requests
      if (data.token) {
        localStorage.setItem('print_option_token', data.token);
      }

      onSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-sky-500/10 relative overflow-hidden">
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors z-20"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Glow ambient background circles */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative text-center mb-6">
          <div className="relative w-24 h-24 mx-auto mb-4 group">
            <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-cyan-400 via-pink-500 to-amber-400 opacity-80 blur-md group-hover:opacity-100 transition animate-pulse" />
            <div className="relative w-24 h-24 rounded-3xl bg-white p-2 shadow-2xl flex items-center justify-center border border-slate-700 overflow-hidden">
              <img
                src="/logo.png"
                alt="PRINT OPTION"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <h2 className="text-2xl font-black bg-gradient-to-r from-cyan-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
            PRINT OPTION
          </h2>
          <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mt-0.5">
            We Print. You Shine.
          </p>
          <p className="text-xs text-sky-400 mt-2 font-medium">
            Admin Portal Access &bull; Stock & Cash Register
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-rose-400 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Admin Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-sky-950/40 border border-sky-800/40 text-[11px] text-sky-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
            <span className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Initial Default:</span>
              <span className="font-mono bg-sky-900/60 px-2 py-0.5 rounded text-sky-200">
                admin / admin123
              </span>
            </span>
            <span className="text-[10px] text-slate-400 italic">
              (Invalid once customized)
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-sky-600 via-cyan-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Phone className="w-3.5 h-3.5 text-sky-400" />
            <span>+94 71 723 7290</span>
          </div>
          <a
            href="https://wa.me/94717237290"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:underline flex items-center gap-1"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
