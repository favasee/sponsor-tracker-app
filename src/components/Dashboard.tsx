'use client';

import React, { useMemo } from 'react';
import { 
  LayoutDashboard, 
  Plus, 
  Receipt as ReceiptIcon, 
  TrendingUp, 
  Coins, 
  Award, 
  Calendar, 
  ArrowUpRight, 
  Eye, 
  Bookmark, 
  Settings as SettingsIcon,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Users,
  Crown,
  Shield
} from 'lucide-react';
import { ClassicReceipt, OWNER_EMAIL } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { CollectionsSummaryTable } from './CollectionsSummaryTable';
import { formatDateDisplay } from './ReceiptsList';

interface DashboardProps {
  receipts: ClassicReceipt[];
  onNavigateToCreate: () => void;
  onNavigateToRegister: (filterPurpose?: string) => void;
  onViewReceipt: (receipt: ClassicReceipt) => void;
  onOpenTemplates?: () => void;
  onOpenSettings?: (tab?: 'header' | 'purposes' | 'currency' | 'roles') => void;
}

export function Dashboard({
  receipts,
  onNavigateToCreate,
  onNavigateToRegister,
  onViewReceipt,
  onOpenTemplates,
  onOpenSettings,
}: DashboardProps) {
  const { user, registeredUsers, pendingRequests } = useAuth();

  // Admin & Staff Governance Metrics
  const adminUsers = useMemo(() => registeredUsers.filter((u) => u.role === 'admin'), [registeredUsers]);
  const staffUsers = useMemo(() => registeredUsers.filter((u) => u.role === 'staff'), [registeredUsers]);
  const ownerUsers = useMemo(
    () => registeredUsers.filter((u) => u.isOwner || u.email.toLowerCase() === OWNER_EMAIL.toLowerCase()),
    [registeredUsers]
  );

  // 1. Overall Key Performance Indicators (KPIs)
  const analytics = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let totalINR = 0;
    let todayINR = 0;
    let todayCount = 0;
    let thisMonthINR = 0;
    let thisMonthCount = 0;
    let maxReceipt: ClassicReceipt | null = null;
    let maxAmount = 0;

    const purposeTotals = new Map<string, number>();

    receipts.forEach((r) => {
      const val = (r.indianValue ?? (r.currency === 'INR' ? r.donationAmount : r.donationAmount)) as any;
      const inr = typeof val === 'number'
        ? val
        : (parseFloat(String(val || 0).replace(/,/g, '')) || 0);
      const safeInr = isNaN(inr) ? 0 : inr;

      totalINR += safeInr;

      if (r.date === todayStr) {
        todayINR += safeInr;
        todayCount += 1;
      }

      if (r.date && r.date.startsWith(thisMonthPrefix)) {
        thisMonthINR += safeInr;
        thisMonthCount += 1;
      }

      if (safeInr > maxAmount) {
        maxAmount = safeInr;
        maxReceipt = r;
      }

      const pKey = (r.purpose || 'Unspecified').trim();
      purposeTotals.set(pKey, (purposeTotals.get(pKey) || 0) + safeInr);
    });

    // Find top performing purpose
    let topPurposeName = 'N/A';
    let topPurposeTotal = 0;
    purposeTotals.forEach((val, key) => {
      if (val > topPurposeTotal) {
        topPurposeTotal = val;
        topPurposeName = key;
      }
    });

    const avgDonation = receipts.length > 0 ? totalINR / receipts.length : 0;
    const topPurposeShare = totalINR > 0 ? (topPurposeTotal / totalINR) * 100 : 0;

    return {
      totalINR,
      totalCount: receipts.length,
      todayINR,
      todayCount,
      thisMonthINR,
      thisMonthCount,
      avgDonation,
      topPurposeName,
      topPurposeTotal,
      topPurposeShare,
      maxReceipt,
      maxAmount,
    };
  }, [receipts]);

  // Recent 6 Receipts
  const recentReceipts = useMemo(() => {
    return [...receipts].slice(0, 6);
  }, [receipts]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      
      {/* =========================================================================
          1. DASHBOARD HERO BANNER & QUICK ACTIONS
          ========================================================================= */}
      <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Section 80G Live Insights</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Executive Dashboard</span>
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Real-time financial analytics, cause-wise collection distributions, and recent donation receipts for{' '}
              <strong className="text-slate-200">Al-Huda Charitable Trust</strong>.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onNavigateToCreate}
              className="px-4 sm:px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-[0_4px_20px_rgba(245,158,11,0.3)] transition-all duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Issue New Receipt</span>
            </button>

            <button
              onClick={() => onNavigateToRegister()}
              className="px-4 py-3 rounded-2xl bg-white/[0.05] hover:bg-white/10 text-white border border-white/10 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none cursor-pointer"
            >
              <ReceiptIcon className="w-4 h-4 text-amber-400" />
              <span>View Ledger (<span className="font-mono tabular-nums">{receipts.length}</span>)</span>
            </button>
          </div>

        </div>
      </div>

      {/* =========================================================================
          2. TOP EXECUTIVE METRIC CARDS (4 HIGHLIGHT KPIs)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Collections All Time */}
        <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-5 border border-white/[0.08] shadow-[0_8px_24px_rgba(0,0,0,0.4)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Collections (All-Time)
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono tabular-nums tracking-tight">
              ₹ {analytics.totalINR.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
              <span>Across <strong className="text-white font-mono tabular-nums">{analytics.totalCount}</strong> receipts</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Total Receipts Issued */}
        <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-5 border border-white/[0.08] shadow-[0_8px_24px_rgba(0,0,0,0.4)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Receipts Issued
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ReceiptIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums tracking-tight">
              {analytics.totalCount}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
              <span>Average: <strong className="text-amber-300 font-mono tabular-nums">₹ {analytics.avgDonation.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong> / rct</span>
            </div>
          </div>
        </div>

        {/* Metric 3: This Month's Collections */}
        <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-5 border border-white/[0.08] shadow-[0_8px_24px_rgba(0,0,0,0.4)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              This Month Collection
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-purple-300 font-mono tabular-nums tracking-tight">
              ₹ {analytics.thisMonthINR.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
              <span><strong className="text-white font-mono tabular-nums">{analytics.thisMonthCount}</strong> receipts this month</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Top Donation Purpose */}
        <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-5 border border-white/[0.08] shadow-[0_8px_24px_rgba(0,0,0,0.4)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Top Cause Category
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-base sm:text-lg font-black text-orange-300 truncate" title={analytics.topPurposeName}>
              {analytics.topPurposeName}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
              <span className="font-mono tabular-nums text-white font-bold">₹ {analytics.topPurposeTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              <span>(<span className="font-mono tabular-nums">{analytics.topPurposeShare.toFixed(1)}</span>% share)</span>
            </div>
          </div>
        </div>

      </div>

      {/* =========================================================================
          3. CORE COMPONENT: COLLECTIONS SUMMARY BY PURPOSE (REQUESTED TABLE)
          ========================================================================= */}
      <div>
        <CollectionsSummaryTable
          receipts={receipts}
          onNavigateToLedger={(purpose) => onNavigateToRegister(purpose)}
          initiallyExpanded={true}
          showLedgerDrilldown={true}
        />
      </div>

      {/* =========================================================================
          4. RECENT RECEIPTS ACTIVITY & QUICK HIGHLIGHTS
          ========================================================================= */}
      <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-5 sm:p-7 border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] space-y-5">
        
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
              <ReceiptIcon className="w-4 h-4 text-amber-400" />
              <span>Recently Issued Receipts</span>
            </h2>
            <p className="text-xs text-slate-400">
              Latest transactions added to the statutory receipts registry.
            </p>
          </div>

          <button
            onClick={() => onNavigateToRegister()}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition cursor-pointer"
          >
            <span>View All ({receipts.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentReceipts.length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-xs font-medium">
            No receipts issued yet. Click &quot;Issue New Receipt&quot; to generate your first 80G receipt.
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.04] border-b border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-widest select-none">
                    <th className="py-3 px-4">Receipt #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-5">Donor Name</th>
                    <th className="py-3 px-5">Purpose</th>
                    <th className="py-3 px-5 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05] text-xs">
                  {recentReceipts.map((r) => {
                    const inr = r.indianValue || (r.currency === 'INR' ? r.donationAmount : r.donationAmount);
                    return (
                      <tr key={r.id} className="hover:bg-white/[0.04] transition">
                        <td className="py-3 px-4 font-mono tabular-nums font-bold text-amber-300">
                          {r.receiptNo}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-400">
                          {formatDateDisplay(r.date)}
                        </td>
                        <td className="py-3 px-5 font-bold text-white">
                          <div className="flex items-center gap-1.5">
                            <span>{r.donorName}</span>
                            {r.donorPAN && (
                              <span className="text-[9px] font-mono bg-blue-500/15 text-blue-300 border border-blue-500/25 px-1.5 py-0.2 rounded">
                                80G
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-5 text-slate-300 truncate max-w-[200px]" title={r.purpose}>
                          {r.purpose}
                        </td>
                        <td className="py-3 px-5 text-right font-mono tabular-nums font-bold text-amber-300 text-sm">
                          ₹ {inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => onViewReceipt(r)}
                            aria-label={`View receipt ${r.receiptNo} for ${r.donorName}`}
                            className="p-2 min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg bg-white/[0.06] hover:bg-white/10 text-slate-300 hover:text-white transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none cursor-pointer"
                            title="View classic receipt / PDF"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* =========================================================================
          5. STAFF & ADMIN GOVERNANCE: USER COUNT & ACCESS STATUS (REQUEST 2)
          ========================================================================= */}
      <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-5 sm:p-7 border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.08] gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>System Administration & Staff Access</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 uppercase font-bold">
                  All Systems Operational
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Staff and administrator accounts authorized to operate the receipt portal.
            </p>
          </div>

          {onOpenSettings && (
            <button
              onClick={() => onOpenSettings('roles')}
              className="px-3.5 py-2 min-h-[40px] rounded-xl bg-white/[0.06] hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none self-start sm:self-auto cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Manage Roles in Settings</span>
            </button>
          )}
        </div>

        {/* Pending Requests Alert Banner for Owner/Admin */}
        {pendingRequests && pendingRequests.length > 0 && onOpenSettings && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span className="text-xs font-bold text-amber-200">
                <strong className="text-white font-mono">{pendingRequests.length}</strong> new person link {pendingRequests.length === 1 ? 'request' : 'requests'} waiting for approval as Editor (Admin) or Viewer (Staff).
              </span>
            </div>
            <button
              onClick={() => onOpenSettings('roles')}
              className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs transition active:scale-95 cursor-pointer shadow-sm hover:bg-amber-300"
            >
              Review in Settings
            </button>
          </div>
        )}

        {/* 3 Status KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Card 1: Admin Count & Status */}
          <div className="p-4 rounded-2xl bg-purple-500/[0.06] border border-purple-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">
                System Administrators
              </span>
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white font-mono tabular-nums">
              {adminUsers.length} <span className="text-xs text-slate-400 font-sans font-normal">Admins</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Status: Active & Authorized (Full Privileges)</span>
            </div>
          </div>

          {/* Card 2: Staff Count & Status */}
          <div className="p-4 rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                Counter Staff Members
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white font-mono tabular-nums">
              {staffUsers.length} <span className="text-xs text-slate-400 font-sans font-normal">Staff</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Status: Active & Authorized (Counter & Mail)</span>
            </div>
          </div>

          {/* Card 3: Master Owner Status */}
          <div className="p-4 rounded-2xl bg-amber-500/[0.06] border border-amber-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                Master Authority
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                <Crown className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-300 font-mono tabular-nums">
              {ownerUsers.length} <span className="text-xs text-slate-400 font-sans font-normal">Primary Owner</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-medium truncate">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="truncate">{OWNER_EMAIL} (Full Owner Access)</span>
            </div>
          </div>

        </div>

        {/* User Badges Strip */}
        <div className="pt-2 border-t border-white/[0.06]">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
            Authorized Personnel Directory (<span className="font-mono tabular-nums">{registeredUsers.length}</span> Accounts Active)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {registeredUsers.map((u) => {
              const isAccountOwner = u.isOwner || u.email.toLowerCase() === OWNER_EMAIL.toLowerCase();
              return (
                <div
                  key={u.id}
                  className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-between gap-3 hover:bg-white/[0.04] transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={u.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
                      alt={u.name}
                      className="w-8 h-8 rounded-full border border-white/20 object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                        <span className="truncate">{u.name}</span>
                        {isAccountOwner && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">{u.email}</div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    {isAccountOwner ? (
                      <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono uppercase">
                        Owner
                      </span>
                    ) : u.role === 'admin' ? (
                      <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-mono uppercase">
                        Admin
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono uppercase">
                        Staff
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}