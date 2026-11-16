'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  CalendarRange, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw,
  ExternalLink,
  Target
} from 'lucide-react';
import { ClassicReceipt } from '@/types';
import { loadPurposes } from '@/lib/settingsStorage';

interface CollectionsSummaryTableProps {
  receipts: ClassicReceipt[];
  onNavigateToLedger?: (purpose?: string) => void;
  onPurposeFilterSelect?: (purpose: string) => void;
  activePurposeFilter?: string;
  initiallyExpanded?: boolean;
  showLedgerDrilldown?: boolean;
}

export function CollectionsSummaryTable({
  receipts,
  onNavigateToLedger,
  onPurposeFilterSelect,
  activePurposeFilter,
  initiallyExpanded = true,
  showLedgerDrilldown = true,
}: CollectionsSummaryTableProps) {
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(initiallyExpanded);
  const [isOthersExpanded, setIsOthersExpanded] = useState(false);
  const [settingsPurposes, setSettingsPurposes] = useState<string[]>([]);

  // Date Range Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeDatePreset, setActiveDatePreset] = useState<'all' | 'today' | 'this-month' | 'last-30' | 'this-year' | 'custom'>('all');

  // Load configured settings purposes on mount
  useEffect(() => {
    setSettingsPurposes(loadPurposes());
  }, []);

  // Date Range Presets Handler
  const applyDatePreset = (preset: 'all' | 'today' | 'this-month' | 'last-30' | 'this-year') => {
    setActiveDatePreset(preset);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'this-month') {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      setStartDate(`${year}-${month}-01`);
      setEndDate(todayStr);
    } else if (preset === 'last-30') {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'this-year') {
      const year = now.getFullYear();
      setStartDate(`${year}-01-01`);
      setEndDate(todayStr);
    }
  };

  // 1. Filter receipts by selected date range
  const dateFilteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      if (startDate && r.date < startDate) return false;
      if (endDate && r.date > endDate) return false;
      return true;
    });
  }, [receipts, startDate, endDate]);

  // 2. Compute Purpose-wise Collection Breakdown for Selected Date Range
  // Only list purposes configured in Settings; all other non-matching purposes are totaled under "Others"
  const purposeSummary = useMemo(() => {
    const activePurposesConfig = settingsPurposes.length > 0 ? settingsPurposes : loadPurposes();
    
    // Map for settings purposes
    const settingsMap = new Map<string, { count: number; totalINR: number }>();
    activePurposesConfig.forEach((sp) => {
      settingsMap.set(sp, { count: 0, totalINR: 0 });
    });

    let othersCount = 0;
    let othersTotalINR = 0;
    const othersBreakdownMap = new Map<string, { count: number; totalINR: number }>();

    dateFilteredReceipts.forEach((r) => {
      const rawP = (r.purpose || '').trim().replace(/^"|"$/g, '');
      const val = (r.indianValue ?? (r.currency === 'INR' ? r.donationAmount : r.donationAmount)) as any;
      const inr = typeof val === 'number'
        ? val
        : (parseFloat(String(val || 0).replace(/,/g, '')) || 0);
      const safeInr = isNaN(inr) ? 0 : inr;

      // Match rawP to configured settingsPurposes case-insensitively
      const matchedSP = activePurposesConfig.find(
        (sp) => sp.trim().toLowerCase() === rawP.toLowerCase()
      );

      if (matchedSP) {
        const existing = settingsMap.get(matchedSP) || { count: 0, totalINR: 0 };
        existing.count += 1;
        existing.totalINR += safeInr;
        settingsMap.set(matchedSP, existing);
      } else {
        // Any other purpose goes to Others!
        othersCount += 1;
        othersTotalINR += safeInr;
        const otherKey = rawP || 'Unspecified';
        const existingOther = othersBreakdownMap.get(otherKey) || { count: 0, totalINR: 0 };
        existingOther.count += 1;
        existingOther.totalINR += safeInr;
        othersBreakdownMap.set(otherKey, existingOther);
      }
    });

    const grandTotalINR = dateFilteredReceipts.reduce(
      (sum, r) => {
        const val = (r.indianValue ?? (r.currency === 'INR' ? r.donationAmount : r.donationAmount)) as any;
        const inr = typeof val === 'number'
          ? val
          : (parseFloat(String(val || 0).replace(/,/g, '')) || 0);
        return sum + (isNaN(inr) ? 0 : inr);
      },
      0
    );
    const grandTotalCount = dateFilteredReceipts.length;

    // Filter settings purposes that have at least 1 receipt in this date range
    const activeSettingsList = activePurposesConfig
      .filter((sp) => (settingsMap.get(sp)?.count || 0) > 0)
      .map((purpose) => {
        const data = settingsMap.get(purpose)!;
        return {
          purpose,
          count: data.count,
          totalINR: data.totalINR,
          percentage: grandTotalINR > 0 ? (data.totalINR / grandTotalINR) * 100 : 0,
          isOthers: false,
        };
      })
      .sort((a, b) => b.totalINR - a.totalINR);

    // If there are other receipts not matching settings purposes, append "Others"
    if (othersCount > 0) {
      activeSettingsList.push({
        purpose: 'Others',
        count: othersCount,
        totalINR: othersTotalINR,
        percentage: grandTotalINR > 0 ? (othersTotalINR / grandTotalINR) * 100 : 0,
        isOthers: true,
      });
    }

    return {
      list: activeSettingsList,
      grandTotalCount,
      grandTotalINR,
      othersCount,
      othersTotalINR,
      othersBreakdown: Array.from(othersBreakdownMap.entries())
        .map(([k, v]) => ({
          purpose: k,
          count: v.count,
          totalINR: v.totalINR,
        }))
        .sort((a, b) => b.totalINR - a.totalINR),
    };
  }, [dateFilteredReceipts, settingsPurposes]);

  // Export Purpose Breakdown Summary CSV
  const exportPurposeSummaryCSV = () => {
    const rangeLabel = startDate || endDate
      ? `${startDate || 'Start'} to ${endDate || 'Latest'}`
      : 'All Time';
    const headers = ['Donation Purpose / Category', 'Receipt Count', 'Amount Received (INR)', 'Share (%)'];
    const rows = purposeSummary.list.map(p => [
      `"${p.purpose.replace(/"/g, '""')}"`,
      p.count,
      p.totalINR.toFixed(2),
      `${p.percentage.toFixed(1)}%`
    ]);
    rows.push([
      `"TOTAL (${rangeLabel})"`,
      purposeSummary.grandTotalCount,
      purposeSummary.grandTotalINR.toFixed(2),
      '100.0%'
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Donations_Summary_${(startDate || 'All')}_to_${(endDate || 'Time')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRowClick = (purposeName: string) => {
    if (onPurposeFilterSelect) {
      onPurposeFilterSelect(purposeName);
    } else if (onNavigateToLedger) {
      onNavigateToLedger(purposeName);
    }
  };

  return (
    <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-5 sm:p-7 border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] space-y-5">
      
      {/* Header: Title, Active Range Badge & Collapse Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <CalendarRange className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
              <span>Collections Summary by Purpose</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/25 uppercase font-bold">
                {startDate || endDate ? 'Filtered Range' : 'All Time'}
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Receipt count, purpose categories, and total amount received for the selected period.
          </p>
        </div>

        {/* Action Buttons: Export & Collapse Toggle */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <button
            onClick={exportPurposeSummaryCSV}
            className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="Export this Purpose Breakdown table to CSV"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export Summary</span>
          </button>

          <button
            onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
            className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            {isSummaryExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                <span>Collapse</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                <span>View Breakdown ({purposeSummary.list.length})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Date Range Selection Bar */}
      <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/[0.06] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Date Pickers */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider text-[11px]">
              FROM:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setActiveDatePreset('custom');
              }}
              className="px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/10 text-white font-mono text-xs font-semibold focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider text-[11px]">
              TO:
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setActiveDatePreset('custom');
              }}
              className="px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/10 text-white font-mono text-xs font-semibold focus:outline-none focus:border-amber-400"
            />
          </div>

          {(startDate || endDate) && (
            <button
              onClick={() => applyDatePreset('all')}
              className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs flex items-center gap-1 transition cursor-pointer"
              title="Reset Date Filter to All Time"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">Reset</span>
            </button>
          )}
        </div>

        {/* Quick Presets Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'All Time' },
            { id: 'today', label: 'Today' },
            { id: 'this-month', label: 'This Month' },
            { id: 'last-30', label: 'Last 30 Days' },
            { id: 'this-year', label: 'This Year' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => applyDatePreset(p.id as any)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                activeDatePreset === p.id
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] border border-white/10'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

      </div>

      {/* Selected Range KPI Highlights matching Image */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            TOTAL AMOUNT IN RANGE
          </span>
          <span className="text-xl font-black text-amber-300 font-mono mt-0.5 block">
            ₹ {purposeSummary.grandTotalINR.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            RECEIPTS COUNT IN RANGE
          </span>
          <span className="text-xl font-black text-white font-mono mt-0.5 block">
            {purposeSummary.grandTotalCount}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            SETTINGS PURPOSES ACTIVE
          </span>
          <span className="text-xl font-black text-orange-300 font-mono mt-0.5 block">
            {purposeSummary.list.filter(p => !p.isOthers).length} Causes {purposeSummary.othersCount > 0 ? '+ Others' : ''}
          </span>
        </div>
      </div>

      {/* Collapsible Purpose Summary Table */}
      {isSummaryExpanded && (
        <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.04] border-b border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-widest select-none">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-5">DONATION PURPOSE / CAUSE</th>
                  <th className="py-3 px-5 text-center">RECEIPT COUNT</th>
                  <th className="py-3 px-5 text-right">AMOUNT RECEIVED (₹ INR)</th>
                  <th className="py-3 px-5 text-right w-44">SHARE OF TOTAL</th>
                  {showLedgerDrilldown && onNavigateToLedger && (
                    <th className="py-3 px-4 text-center w-28">ACTIONS</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05] text-xs">
                {purposeSummary.list.length === 0 ? (
                  <tr>
                    <td colSpan={showLedgerDrilldown && onNavigateToLedger ? 6 : 5} className="py-8 text-center text-slate-500 font-medium">
                      No receipts found within the selected date range ({startDate || 'Start'} to {endDate || 'Latest'}).
                    </td>
                  </tr>
                ) : (
                  purposeSummary.list.map((item, idx) => (
                    <React.Fragment key={item.purpose}>
                      <tr
                        onClick={() => handleRowClick(item.purpose)}
                        className={`hover:bg-white/[0.04] transition cursor-pointer select-none ${
                          activePurposeFilter === item.purpose ? 'bg-amber-500/15 border-l-2 border-amber-400' : ''
                        }`}
                        title={`Click to view receipts for "${item.purpose}"`}
                      >
                        <td className="py-3 px-4 text-center font-mono text-slate-500 text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-5 font-bold">
                          <div className="flex items-center gap-2">
                            <span className={item.isOthers ? 'text-amber-400 font-black' : 'text-white'}>
                              {item.purpose}
                            </span>
                            {item.isOthers && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/25 font-bold">
                                All Other Causes
                              </span>
                            )}
                            {activePurposeFilter === item.purpose && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400 text-slate-950">
                                Active Filter
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-5 text-center">
                          <span className="font-mono font-bold px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-amber-300 text-xs">
                            {item.count}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-right font-mono font-bold text-amber-300 text-sm">
                          ₹ {item.totalINR.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-20 bg-white/10 rounded-full h-1.5 overflow-hidden hidden sm:block">
                              <div
                                className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full"
                                style={{ width: `${Math.min(100, Math.max(0, item.percentage))}%` }}
                              ></div>
                            </div>
                            <span className="font-mono text-xs text-slate-300 font-bold min-w-[42px]">
                              {item.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        {showLedgerDrilldown && onNavigateToLedger && (
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigateToLedger(item.purpose);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-amber-500 hover:text-slate-950 text-slate-300 text-[11px] font-bold transition flex items-center justify-center gap-1 mx-auto cursor-pointer"
                              title={`Open ledger filtered by ${item.purpose}`}
                            >
                              <span>Ledger</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </td>
                        )}
                      </tr>

                      {/* Collapsible Sub-breakdown if item is "Others" */}
                      {item.isOthers && purposeSummary.othersBreakdown && purposeSummary.othersBreakdown.length > 0 && (
                        <tr className="bg-white/[0.015]">
                          <td colSpan={showLedgerDrilldown && onNavigateToLedger ? 6 : 5} className="py-2.5 px-6 sm:px-12 border-t border-white/5">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
                                <span>Unlisted causes rolled into "Others":</span>
                                <span className="font-mono text-amber-400 font-bold">
                                  ({purposeSummary.othersBreakdown.length} sub-causes, {purposeSummary.othersCount} receipts)
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsOthersExpanded(!isOthersExpanded);
                                }}
                                className="text-[11px] text-amber-400 hover:text-amber-300 font-bold underline decoration-dotted cursor-pointer"
                              >
                                {isOthersExpanded ? 'Hide Sub-causes ▲' : 'Show All Sub-causes ▼'}
                              </button>
                            </div>

                            {isOthersExpanded && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 pb-2">
                                {purposeSummary.othersBreakdown.map((sub) => (
                                  <div
                                    key={sub.purpose}
                                    className="p-2 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs"
                                  >
                                    <span className="text-slate-300 truncate max-w-[170px]" title={sub.purpose}>
                                      {sub.purpose}
                                    </span>
                                    <div className="text-right font-mono text-[11px] shrink-0 ml-2">
                                      <span className="text-slate-500 mr-1.5">{sub.count}</span>
                                      <span className="text-amber-300 font-bold">₹ {sub.totalINR.toLocaleString('en-IN')}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
              {/* Grand Totals Footer Row */}
              {purposeSummary.list.length > 0 && (
                <tfoot>
                  <tr className="bg-white/[0.05] border-t-2 border-white/20 text-xs font-black">
                    <td colSpan={2} className="py-3.5 px-5 uppercase tracking-wider text-white">
                      GRAND TOTAL ({startDate || endDate ? `${startDate || 'Start'} → ${endDate || 'Latest'}` : 'All Time'})
                    </td>
                    <td className="py-3.5 px-5 text-center text-amber-300 font-mono text-sm font-bold">
                      {purposeSummary.grandTotalCount}
                    </td>
                    <td className="py-3.5 px-5 text-right text-amber-300 font-mono text-base font-black">
                      ₹ {purposeSummary.grandTotalINR.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-5 text-right text-slate-300 font-mono">
                      100.0%
                    </td>
                    {showLedgerDrilldown && onNavigateToLedger && (
                      <td></td>
                    )}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

    </div>
  );
}