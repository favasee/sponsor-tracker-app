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
  CreditCard
} from 'lucide-react';
import { ClassicReceipt } from '@/types';
import { CollectionsSummaryTable } from './CollectionsSummaryTable';
import { formatDateDisplay } from './ReceiptsList';

interface DashboardProps {
  receipts: ClassicReceipt[];
  onNavigateToCreate: () => void;
  onNavigateToRegister: (filterPurpose?: string) => void;
  onViewReceipt: (receipt: ClassicReceipt) => void;
  onOpenTemplates?: () => void;
  onOpenSettings?: (tab?: 'header' | 'purposes' | 'currency') => void;
}

export function Dashboard({
  receipts,
  onNavigateToCreate,
  onNavigateToRegister,
  onViewReceipt,
  onOpenTemplates,
  onOpenSettings,
}: DashboardProps) {
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

    </div>
  );
}