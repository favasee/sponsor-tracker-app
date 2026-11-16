'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard,
  FileText, 
  Receipt as ReceiptIcon, 
  Bookmark, 
  MessageSquare, 
  Crown, 
  LogOut, 
  Settings,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  Inbox
} from 'lucide-react';

interface NavbarProps {
  activeView: 'dashboard' | 'create' | 'register' | 'sponsors' | 'settings';
  setActiveView: (view: 'dashboard' | 'create' | 'register' | 'sponsors' | 'settings') => void;
  onOpenTemplates: () => void;
  onOpenWhatsAppConfig: () => void;
  onOpenRoleManagement: () => void;
  receiptCount: number;
}

export function Navbar({
  activeView,
  setActiveView,
  onOpenTemplates,
  onOpenWhatsAppConfig,
  onOpenRoleManagement,
  receiptCount,
}: NavbarProps) {
  const { user, signOut, isOwner, pendingRequests } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const navigateTo = (view: 'dashboard' | 'create' | 'register' | 'settings') => {
    setActiveView(view);
    setMobileDrawerOpen(false);
  };

  return (
    <>
      {/* =========================================================================
          1. DESKTOP / LAPTOP / TABLET: LEFT SIDEBAR NAVIGATION (md:flex)
          ========================================================================= */}
      <aside className="hidden md:flex flex-col justify-between w-64 lg:w-72 h-screen sticky top-0 bg-[#090B10]/95 backdrop-blur-2xl border-r border-white/[0.08] shadow-[4px_0_30px_rgba(0,0,0,0.5)] z-30 shrink-0 print-hide">
        
        {/* Top: Logo & Main Navigation Links */}
        <div className="p-5 space-y-6 overflow-y-auto">
          
          {/* Brand Header */}
          <div 
            onClick={() => setActiveView('dashboard')} 
            className="flex items-center gap-3 cursor-pointer group pb-4 border-b border-white/[0.08]"
          >
            <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/15 flex items-center justify-center text-white font-bold shadow-lg shadow-black/40 group-hover:scale-105 transition-transform backdrop-blur-md shrink-0">
              <ReceiptIcon className="w-5 h-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold tracking-tight text-lg bg-gradient-to-b from-white via-slate-200 to-slate-400 bg-clip-text text-transparent block leading-tight">
                Donation Receipt Creator
              </span>
              <p className="text-[10px] text-slate-400 font-medium truncate">
                Section 80G Receipt Portal
              </p>
            </div>
          </div>

          {/* Main Menu Links */}
          <div className="space-y-1.5">
            <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Main Menu
            </div>

            {/* Dashboard */}
            <button
              onClick={() => setActiveView('dashboard')}
              aria-current={activeView === 'dashboard' ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07080C] cursor-pointer ${
                activeView === 'dashboard'
                  ? 'bg-gradient-to-r from-amber-400/20 to-orange-500/20 text-white border border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.15)] font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className={`w-4 h-4 ${activeView === 'dashboard' ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>Dashboard</span>
              </div>
              {activeView === 'dashboard' && (
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400"></div>
              )}
            </button>

            {/* Create Receipt */}
            <button
              onClick={() => setActiveView('create')}
              aria-current={activeView === 'create' ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07080C] cursor-pointer ${
                activeView === 'create'
                  ? 'bg-gradient-to-r from-amber-400/20 to-orange-500/20 text-white border border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.15)] font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className={`w-4 h-4 ${activeView === 'create' ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>Receipt</span>
              </div>
              {activeView === 'create' && (
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400"></div>
              )}
            </button>

            {/* Receipts Register */}
            <button
              onClick={() => setActiveView('register')}
              aria-current={activeView === 'register' ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07080C] cursor-pointer ${
                activeView === 'register'
                  ? 'bg-gradient-to-r from-amber-400/20 to-orange-500/20 text-white border border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.15)] font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center gap-3">
                <ReceiptIcon className={`w-4 h-4 ${activeView === 'register' ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>Ledger</span>
              </div>
              <span className="bg-white/10 px-2 py-0.5 rounded-full text-[10px] font-mono tabular-nums text-amber-300 font-bold">
                {receiptCount}
              </span>
            </button>

            {/* Settings Page */}
            <button
              onClick={() => setActiveView('settings')}
              aria-current={activeView === 'settings' ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07080C] cursor-pointer ${
                activeView === 'settings'
                  ? 'bg-gradient-to-r from-amber-400/20 to-orange-500/20 text-white border border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.15)] font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings className={`w-4 h-4 ${activeView === 'settings' ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>Settings</span>
              </div>
              <span className="text-[9px] uppercase font-bold text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">
                A5/Roles
              </span>
            </button>

          </div>

          {/* Quick Tools & Shortcuts */}
          <div className="space-y-1.5 pt-4 border-t border-white/[0.06]">
            <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Quick Shortcuts
            </div>

            {/* Donor Templates */}
            <button
              onClick={onOpenTemplates}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.05] transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Bookmark className="w-4 h-4 text-slate-400" />
                <span>Donor Templates</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            </button>

            {/* WhatsApp Config */}
            <button
              onClick={onOpenWhatsAppConfig}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.05] transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp Webhook</span>
              </div>
              <span className="text-[9px] bg-emerald-500/15 text-emerald-400 font-bold px-1.5 py-0.2 rounded">
                API
              </span>
            </button>

            {/* Owner Alert: Pending Access Requests */}
            {isOwner && pendingRequests.length > 0 && (
              <button
                onClick={onOpenRoleManagement}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <Inbox className="w-4 h-4 text-amber-400" />
                  <span>Access Requests</span>
                </div>
                <span className="text-[10px] font-mono font-black bg-rose-500 text-white px-2 py-0.5 rounded-full tabular-nums">
                  {pendingRequests.length}
                </span>
              </button>
            )}

          </div>

        </div>

        {/* Bottom Profile Card & Sign Out */}
        <div className="p-4 border-t border-white/[0.08] bg-[#07080C]/80 space-y-3">
          
          <div className="flex items-center gap-3 p-2 rounded-2xl bg-white/[0.04] border border-white/10">
            <img
              src={user?.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
              alt={user?.name || 'User'}
              className="w-8 h-8 rounded-full border border-white/20 object-cover shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                <span className="truncate">{user?.name}</span>
                {isOwner && <Crown className="w-3 h-3 text-amber-400 shrink-0 inline" />}
              </div>
              <div className="text-[10px] font-bold">
                {isOwner ? (
                  <span className="text-amber-400">👑 Master Owner</span>
                ) : user?.role === 'admin' ? (
                  <span className="text-purple-300">🛡️ Admin</span>
                ) : (
                  <span className="text-emerald-400">👤 Staff</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={signOut}
            className="w-full py-2 px-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-rose-500/20 hover:border-rose-500/30 text-slate-300 hover:text-rose-300 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

        </div>

      </aside>

      {/* =========================================================================
          2. MOBILE & TABLET: STICKY TOP HEADER (< md:)
          ========================================================================= */}
      <header className="md:hidden sticky top-0 z-40 bg-[#090B10]/95 backdrop-blur-2xl border-b border-white/[0.08] px-4 py-3 flex items-center justify-between print-hide">
        
        {/* Left: Mobile Drawer Hamburger Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/15 flex items-center justify-center text-white transition active:scale-95 cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileDrawerOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
          </button>

          <div 
            onClick={() => setActiveView('dashboard')} 
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/15 flex items-center justify-center text-white font-bold">
              <ReceiptIcon className="w-4 h-4 text-amber-400" />
            </div>
            <span className="font-extrabold text-sm sm:text-base text-white">
              Donation Receipt Creator
            </span>
          </div>
        </div>

        {/* Right: User Avatar & Quick View Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 uppercase">
            {activeView === 'dashboard' ? 'Dashboard' : activeView === 'create' ? 'Issue' : activeView === 'register' ? `Ledger (${receiptCount})` : 'Settings'}
          </span>
          <img
            src={user?.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
            alt="Avatar"
            className="w-8 h-8 rounded-full border border-white/20"
          />
        </div>

      </header>

      {/* =========================================================================
          3. MOBILE SLIDE-OVER DRAWER (< md:)
          ========================================================================= */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex print-hide animate-in fade-in duration-150">
          
          {/* Backdrop */}
          <div 
            onClick={() => setMobileDrawerOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          ></div>

          {/* Slide Drawer Content */}
          <div className="relative w-72 max-w-[80vw] bg-[#0A0C10] border-r border-white/15 h-full flex flex-col justify-between p-5 z-10 shadow-2xl overflow-y-auto">
            
            <div className="space-y-6">
              
              {/* Drawer Brand Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div 
                  onClick={() => navigateTo('dashboard')}
                  className="flex items-center gap-2.5 cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/[0.08] flex items-center justify-center">
                    <ReceiptIcon className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <span className="font-black text-base text-white block leading-tight">Donation Receipt Creator</span>
                    <span className="text-[10px] text-slate-400">Section 80G Portal</span>
                  </div>
                </div>

                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  aria-label="Close navigation drawer"
                  className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none transition active:scale-95"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items */}
              <div className="space-y-1.5">
                <button
                  onClick={() => navigateTo('dashboard')}
                  aria-current={activeView === 'dashboard' ? 'page' : undefined}
                  className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                    activeView === 'dashboard'
                      ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                      : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => navigateTo('create')}
                  aria-current={activeView === 'create' ? 'page' : undefined}
                  className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                    activeView === 'create'
                      ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                      : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Receipt</span>
                </button>

                <button
                  onClick={() => navigateTo('register')}
                  aria-current={activeView === 'register' ? 'page' : undefined}
                  className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                    activeView === 'register'
                      ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                      : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ReceiptIcon className="w-4 h-4" />
                    <span>Ledger</span>
                  </div>
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-mono tabular-nums">
                    {receiptCount}
                  </span>
                </button>

                <button
                  onClick={() => navigateTo('settings')}
                  aria-current={activeView === 'settings' ? 'page' : undefined}
                  className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                    activeView === 'settings'
                      ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                      : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
              </div>

              {/* Shortcuts */}
              <div className="space-y-2 pt-4 border-t border-white/10">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Shortcuts</div>

                <button
                  onClick={() => { onOpenTemplates(); setMobileDrawerOpen(false); }}
                  className="w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.05] focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none transition active:scale-[0.98]"
                >
                  <Bookmark className="w-4 h-4 text-slate-400" />
                  <span>Donor Templates</span>
                </button>

                <button
                  onClick={() => { onOpenWhatsAppConfig(); setMobileDrawerOpen(false); }}
                  className="w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.05] focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none transition active:scale-[0.98]"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>WhatsApp Webhook</span>
                </button>

                {isOwner && pendingRequests.length > 0 && (
                  <button
                    onClick={() => { onOpenRoleManagement(); setMobileDrawerOpen(false); }}
                    className="w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <Inbox className="w-4 h-4 text-amber-400" />
                      <span>Access Requests</span>
                    </div>
                    <span className="text-[10px] font-mono font-black bg-rose-500 text-white px-2 py-0.5 rounded-full tabular-nums">
                      {pendingRequests.length}
                    </span>
                  </button>
                )}
              </div>

            </div>

            {/* Mobile Drawer Bottom User Card */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={user?.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full border border-white/20"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate">{user?.name}</div>
                  <div className="text-[10px] text-amber-400 font-bold uppercase">{user?.role}</div>
                </div>
              </div>

              <button
                onClick={signOut}
                className="w-full min-h-[44px] py-2 rounded-xl bg-white/10 hover:bg-white/15 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none transition active:scale-[0.98]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* =========================================================================
          4. MOBILE PHONE: FIXED BOTTOM 1-THUMB NAVIGATION BAR (< md:)
          ========================================================================= */}
      <nav aria-label="Mobile navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090B10]/95 backdrop-blur-2xl border-t border-white/10 px-2 py-2 flex items-center justify-around print-hide">
        <button
          onClick={() => setActiveView('dashboard')}
          aria-current={activeView === 'dashboard' ? 'page' : undefined}
          className={`min-h-[48px] min-w-[48px] flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition active:scale-95 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
            activeView === 'dashboard' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Dashboard</span>
        </button>

        <button
          onClick={() => setActiveView('create')}
          aria-current={activeView === 'create' ? 'page' : undefined}
          className={`min-h-[48px] min-w-[48px] flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition active:scale-95 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
            activeView === 'create' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px]">Receipt</span>
        </button>

        <button
          onClick={() => setActiveView('register')}
          aria-current={activeView === 'register' ? 'page' : undefined}
          className={`min-h-[48px] min-w-[48px] flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition relative active:scale-95 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
            activeView === 'register' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ReceiptIcon className="w-5 h-5" />
          <span className="text-[10px]">Ledger</span>
          {receiptCount > 0 && (
            <span className="absolute top-0 right-2 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[9px] flex items-center justify-center font-mono tabular-nums">
              {receiptCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveView('settings')}
          aria-current={activeView === 'settings' ? 'page' : undefined}
          className={`min-h-[48px] min-w-[48px] flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition active:scale-95 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
            activeView === 'settings' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px]">Settings</span>
        </button>
      </nav>
    </>
  );
}
