'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import FloatingQuickContact from '@/components/FloatingQuickContact';
import LoginModal from '@/components/LoginModal';
import DashboardTab from '@/components/DashboardTab';
import StockOutTab from '@/components/StockOutTab';
import InventoryTab from '@/components/InventoryTab';
import CashBalanceTab from '@/components/CashBalanceTab';
import BillModal from '@/components/BillModal';
import SplashScreen from '@/components/SplashScreen';

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminUser, setAdminUser] = useState<{ username: string; name: string } | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Inventory items state
  const [items, setItems] = useState<any[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  // Preselected item for Stock OUT
  const [stockOutPreselectedItem, setStockOutPreselectedItem] = useState<any | null>(null);

  // Bill Modal state
  const [activeSaleBill, setActiveSaleBill] = useState<any | null>(null);

  // Check auth session
  const checkAuth = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('print_option_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/auth/me', { headers });
      const data = await res.json();
      if (data.authenticated && data.user) {
        setAdminUser(data.user);
      } else {
        setAdminUser(null);
      }
    } catch {
      setAdminUser(null);
    } finally {
      setAuthChecking(false);
    }
  };

  // Fetch Items list
  const fetchItems = async () => {
    setItemsLoading(true);
    try {
      const res = await fetch('/api/items');
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
      }
    } catch (err) {
      console.error('Fetch items error:', err);
    } finally {
      setItemsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
    fetchItems();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('print_option_token');
      }
      setAdminUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickOutFromInventory = (item: any) => {
    setStockOutPreselectedItem(item);
    setActiveTab('stock-out');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* Opening Intro Splash Animation */}
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}

      {/* Top Header with Admin Login button in top-right corner */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        adminUser={adminUser}
        onLogout={handleLogout}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      {/* Floating Call & WhatsApp Pill */}
      <FloatingQuickContact />

      {/* Main Content Area - Dashboard opens directly! */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {authChecking && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-semibold">Loading PRINT OPTION...</p>
          </div>
        ) : (
          <div>
            {/* Dashboard Tab with Direct Checkout and Dual Pricing */}
            {activeTab === 'dashboard' && (
              <DashboardTab
                items={items}
                onOpenBill={(sale) => setActiveSaleBill(sale)}
                onRefreshItems={fetchItems}
                onNavigateToStockOut={(item) => {
                  if (item) setStockOutPreselectedItem(item);
                  setActiveTab('stock-out');
                }}
                onNavigateToInventory={() => setActiveTab('inventory')}
              />
            )}

            {activeTab === 'stock-out' && (
              <StockOutTab
                items={items}
                preselectedItem={stockOutPreselectedItem}
                onRefreshItems={fetchItems}
                onOpenBill={(sale) => setActiveSaleBill(sale)}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryTab
                items={items}
                loading={itemsLoading}
                isAdmin={!!adminUser}
                onRefresh={fetchItems}
                onQuickOut={handleQuickOutFromInventory}
                onOpenLogin={() => setIsLoginModalOpen(true)}
              />
            )}

            {activeTab === 'cash-balance' && <CashBalanceTab />}
          </div>
        )}
      </main>

      {/* Admin Login Modal (Triggered by Top Right Button) */}
      {isLoginModalOpen && (
        <LoginModal
          onClose={() => setIsLoginModalOpen(false)}
          onSuccess={(user) => {
            setAdminUser(user);
            setIsLoginModalOpen(false);
            fetchItems();
          }}
        />
      )}

      {/* Generated Bill / Receipt Modal */}
      {activeSaleBill && (
        <BillModal
          sale={activeSaleBill}
          onClose={() => setActiveSaleBill(null)}
        />
      )}

      {/* Footer */}
      <footer className="no-print border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>&copy; {new Date().getFullYear()} PRINT OPTION. All Rights Reserved.</p>
          <p className="flex items-center gap-2">
            <span>Direct Hotline:</span>
            <strong className="text-sky-400">+94 71 723 7290</strong>
          </p>
        </div>
      </footer>
    </div>
  );
}
