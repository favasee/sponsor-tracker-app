'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Users, 
  Check, 
  Plus, 
  Calendar, 
  CreditCard, 
  Sparkles, 
  Eye, 
  CheckCircle2, 
  ArrowRight,
  Trash2,
  Edit2,
  AlertCircle,
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ClassicReceipt, DonorGroup, DonorGroupMember, PaymentMethod, RecurringDonorTemplate } from '@/types';
import { loadDonorGroups, saveDonorGroup, deleteDonorGroup } from '@/lib/groupStorage';
import { getNextClassicReceiptNumbers } from '@/lib/receiptStorage';
import { createReceiptsFromGroup, createReceiptFromTemplate } from '@/lib/quickReceiptHelper';
import { useAuth } from '@/context/AuthContext';
import { loadPurposes } from '@/lib/settingsStorage';
import { loadCurrencies } from '@/lib/currencies';

interface GroupSubmissionViewProps {
  receipts: ClassicReceipt[];
  templates?: RecurringDonorTemplate[];
  onReceiptSaved?: (receipt: ClassicReceipt) => void;
  onBatchReceiptsSaved: (receipts: ClassicReceipt[]) => void;
  onViewReceipt: (receipt: ClassicReceipt) => void;
  onOpenTemplatesModal?: () => void;
}

export function GroupSubmissionView({
  receipts,
  templates = [],
  onReceiptSaved,
  onBatchReceiptsSaved,
  onViewReceipt,
  onOpenTemplatesModal,
}: GroupSubmissionViewProps) {
  const { user } = useAuth();

  const [groups, setGroups] = useState<DonorGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [submissionDate, setSubmissionDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [paymentRef, setPaymentRef] = useState<string>('');

  // Selected members to include in this month's submission
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());

  // Inline Member Amount adjustments for this specific month
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({});

  // Success summary modal
  const [generatedReceipts, setGeneratedReceipts] = useState<ClassicReceipt[] | null>(null);

  // New Group Creator Modal
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupMembers, setNewGroupMembers] = useState<DonorGroupMember[]>([]);

  // Add Member to New Group Form fields
  const [mName, setMName] = useState('');
  const [mPhone, setMPhone] = useState('');
  const [mAmount, setMAmount] = useState('');
  const [mCurrency, setMCurrency] = useState('INR');
  const [mPurpose, setMPurpose] = useState('THAIBA EDUCARE');
  const [mPAN, setMPAN] = useState('');

  const [availablePurposes, setAvailablePurposes] = useState<string[]>([]);
  const [availableCurrencies, setAvailableCurrencies] = useState<string[]>([]);

  useEffect(() => {
    const loaded = loadDonorGroups();
    setGroups(loaded);
    if (loaded.length > 0 && !selectedGroupId) {
      setSelectedGroupId(loaded[0].id);
      setSelectedMemberIds(new Set(loaded[0].members.map((m) => m.id)));
    }
    setAvailablePurposes(loadPurposes());
    setAvailableCurrencies(loadCurrencies());
  }, []);

  const activeGroup = useMemo(() => {
    return groups.find((g) => g.id === selectedGroupId) || groups[0] || null;
  }, [groups, selectedGroupId]);

  // When active group changes, select all its members by default
  useEffect(() => {
    if (activeGroup) {
      setSelectedMemberIds(new Set(activeGroup.members.map((m) => m.id)));
      setCustomAmounts({});
      if (activeGroup.defaultPaymentMethod) {
        setPaymentMethod(activeGroup.defaultPaymentMethod);
      }
    }
  }, [activeGroup]);

  const activeMembers = useMemo(() => {
    if (!activeGroup) return [];
    return activeGroup.members.filter((m) => selectedMemberIds.has(m.id)).map((m) => {
      const customAmount = customAmounts[m.id];
      return {
        ...m,
        amount: customAmount !== undefined && !isNaN(customAmount) ? customAmount : m.amount,
      };
    });
  }, [activeGroup, selectedMemberIds, customAmounts]);

  // Preview next receipt numbers for active members
  const nextReceiptNumbers = useMemo(() => {
    return getNextClassicReceiptNumbers(activeMembers.length, receipts);
  }, [activeMembers.length, receipts]);

  const toggleMember = (memberId: string) => {
    const next = new Set(selectedMemberIds);
    if (next.has(memberId)) {
      next.delete(memberId);
    } else {
      next.add(memberId);
    }
    setSelectedMemberIds(next);
  };

  const handleCustomAmountChange = (memberId: string, val: string) => {
    const num = parseFloat(val);
    setCustomAmounts((prev) => ({
      ...prev,
      [memberId]: isNaN(num) ? 0 : num,
    }));
  };

  // 1-Click Submit Group Payments
  const handleGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeGroup) {
      alert('Please select a company or group');
      return;
    }

    if (activeMembers.length === 0) {
      alert('Please select at least 1 member for group submission');
      return;
    }

    // Generate separate individual receipts
    const created = createReceiptsFromGroup(
      activeGroup,
      activeMembers,
      receipts,
      submissionDate,
      paymentMethod,
      paymentRef,
      user?.name || 'Authorized Admin'
    );

    // Save batch to database / storage
    onBatchReceiptsSaved(created);

    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#a855f7'],
      });
    } catch (e) {
      // ignore
    }

    // Show summary modal
    setGeneratedReceipts(created);
  };

  // Add Member to New Group draft
  const handleAddMemberToDraft = () => {
    if (!mName.trim()) {
      alert('Member name is required');
      return;
    }
    const amt = parseFloat(mAmount) || 0;
    if (amt <= 0) {
      alert('Valid amount is required');
      return;
    }

    const newMem: DonorGroupMember = {
      id: `gm-new-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
      donorName: mName.trim(),
      donorPhone: mPhone.trim() || undefined,
      donorPAN: mPAN.trim().toUpperCase() || undefined,
      amount: amt,
      currency: mCurrency,
      purpose: mPurpose,
      paymentMethod: paymentMethod,
    };

    setNewGroupMembers([...newGroupMembers, newMem]);
    setMName('');
    setMPhone('');
    setMAmount('');
    setMPAN('');
  };

  const handleSaveNewGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      alert('Group name is required');
      return;
    }
    if (newGroupMembers.length === 0) {
      alert('Please add at least 1 member to the group');
      return;
    }

    const newGrp: DonorGroup = {
      id: `grp-${Date.now()}`,
      name: newGroupName.trim(),
      description: newGroupDesc.trim() || undefined,
      defaultPaymentMethod: paymentMethod,
      members: newGroupMembers,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveDonorGroup(newGrp);
    const updated = loadDonorGroups();
    setGroups(updated);
    setSelectedGroupId(newGrp.id);
    setShowNewGroupModal(false);
    setNewGroupName('');
    setNewGroupDesc('');
    setNewGroupMembers([]);
  };

  const [showQuickPayment, setShowQuickPayment] = useState(true);

  // Quick 1-click payment for a template in Group / Company view
  const handleQuickPay = (tmpl: RecurringDonorTemplate) => {
    const newReceipt = createReceiptFromTemplate(
      tmpl,
      receipts,
      submissionDate || new Date().toISOString().split('T')[0],
      paymentMethod,
      paymentRef,
      user?.name || 'Authorized Admin'
    );

    if (onReceiptSaved) {
      onReceiptSaved(newReceipt);
    } else {
      onBatchReceiptsSaved([newReceipt]);
    }

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (e) {
      // ignore
    }

    if (onViewReceipt) {
      onViewReceipt(newReceipt);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ⚡ 1-Click Quick Payment (Saved Regular Sponsors) - Open/Hide */}
      {templates && templates.length > 0 && (
        <div className="rounded-2xl bg-amber-500/[0.05] border border-amber-500/20 overflow-hidden transition-all duration-200">
          <div className="p-3.5 sm:p-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowQuickPayment((prev) => !prev)}
              className="flex items-center gap-2 text-left cursor-pointer group select-none"
            >
              <span className="p-1 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition">
                {showQuickPayment ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </span>
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 group-hover:text-amber-200 transition">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>⚡ 1-Click Quick Payment (Saved Regular Sponsors)</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20">
                {templates.length}
              </span>
            </button>

            <div className="flex items-center gap-3">
              {onOpenTemplatesModal && (
                <button
                  type="button"
                  onClick={onOpenTemplatesModal}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                >
                  View All ({templates.length})
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowQuickPayment((prev) => !prev)}
                className="text-[11px] font-semibold text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                {showQuickPayment ? 'Hide' : 'Open'}
              </button>
            </div>
          </div>

          {showQuickPayment && (
            <div className="px-4 pb-4 pt-1 flex flex-wrap items-center gap-2 border-t border-amber-500/10 animate-in fade-in duration-150">
              {templates.slice(0, 8).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleQuickPay(t)}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-amber-400 hover:text-slate-950 border border-white/10 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs group"
                  title={`Click to instantly generate today's receipt for ${t.donorName} (${t.defaultCurrency} ${t.defaultAmount})`}
                >
                  <Zap className="w-3 h-3 text-amber-400 group-hover:text-slate-950" />
                  <span>{t.donorName}</span>
                  <span className="text-[10px] font-mono text-amber-300 group-hover:text-slate-950 bg-black/20 group-hover:bg-black/10 px-1.5 py-0.2 rounded font-bold">
                    {t.defaultCurrency} {t.defaultAmount.toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Group Selector & Header Banner */}
      <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-6 sm:p-7 border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5" />
              <span>Multi-Member Corporate Batch</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Group & Company Submission
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Select a company or sponsor circle to record multiple separate payment receipts with a single click.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowNewGroupModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition shadow-md self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Company / Group</span>
          </button>
        </div>

        {/* Group Selection Dropdown & Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
          
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Select Company / Sponsor Group
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full px-3.5 py-3 rounded-2xl bg-white/[0.05] border border-white/10 text-white font-bold text-xs focus:outline-none focus:border-amber-400"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id} className="bg-[#0f1219] text-white">
                  {g.name} ({g.members.length} members)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Payment Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={submissionDate}
                onChange={(e) => setSubmissionDate(e.target.value)}
                className="w-full px-3.5 py-3 rounded-2xl bg-white/[0.05] border border-white/10 text-white font-mono font-bold text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3.5 py-3 rounded-2xl bg-white/[0.05] border border-white/10 text-white font-bold text-xs focus:outline-none focus:border-amber-400"
            >
              <option value="Bank Transfer" className="bg-[#0f1219]">Bank Transfer</option>
              <option value="UPI / Online" className="bg-[#0f1219]">UPI / Online</option>
              <option value="Bank" className="bg-[#0f1219]">Bank</option>
              <option value="Cash" className="bg-[#0f1219]">Cash</option>
              <option value="Cheque" className="bg-[#0f1219]">Cheque</option>
              <option value="Card" className="bg-[#0f1219]">Card</option>
              <option value="Direct Debit" className="bg-[#0f1219]">Direct Debit</option>
            </select>
          </div>

        </div>

        {/* Optional Payment Ref */}
        <div className="pt-4">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Company Payment Reference (Optional Cheque # / Bank Txn ID)
          </label>
          <input
            type="text"
            value={paymentRef}
            onChange={(e) => setPaymentRef(e.target.value)}
            placeholder="e.g. CORP-CHQ-98124 or NEFT-APEX-OCT2026"
            className="w-full px-3.5 py-2.5 rounded-2xl bg-white/[0.05] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
          />
        </div>

      </div>

      {/* Group Members Table & Submission Action */}
      {activeGroup && (
        <form onSubmit={handleGroupSubmit} className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-5 sm:p-7 border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.08] gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>{activeGroup.name}</span>
                <span className="text-xs font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md">
                  {activeMembers.length} of {activeGroup.members.length} Selected
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Each member will receive their own individual sequential receipt number and separate record in the ledger.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedMemberIds(new Set(activeGroup.members.map((m) => m.id)))}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
              >
                Select All
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={() => setSelectedMemberIds(new Set())}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                Deselect All
              </button>
            </div>
          </div>

          {/* Members Breakdown Table */}
          <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.04] border-b border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-widest select-none">
                    <th className="py-3 px-4 w-12 text-center">Include</th>
                    <th className="py-3 px-4">Receipt # (Seq)</th>
                    <th className="py-3 px-5">Member Name</th>
                    <th className="py-3 px-5">Donation Purpose</th>
                    <th className="py-3 px-5 text-right w-44">Amount ({paymentMethod})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05] text-xs">
                  {activeGroup.members.map((m, idx) => {
                    const isSelected = selectedMemberIds.has(m.id);
                    const assignedIndex = activeMembers.findIndex((am) => am.id === m.id);
                    const previewNo = assignedIndex >= 0 ? nextReceiptNumbers[assignedIndex] : '—';
                    const currentAmt = customAmounts[m.id] !== undefined ? customAmounts[m.id] : m.amount;

                    return (
                      <tr
                        key={m.id}
                        className={`transition ${isSelected ? 'hover:bg-white/[0.04]' : 'opacity-40 bg-white/[0.01]'}`}
                      >
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleMember(m.id)}
                            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-white/20 bg-white/10 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-amber-300">
                          {previewNo}
                        </td>
                        <td className="py-3 px-5 font-bold text-white">
                          <div>
                            <span>{m.donorName}</span>
                            {m.donorPAN && (
                              <span className="ml-2 text-[10px] font-mono bg-blue-500/15 text-blue-300 border border-blue-500/25 px-1.5 py-0.2 rounded">
                                {m.donorPAN}
                              </span>
                            )}
                          </div>
                          {m.donorPhone && (
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {m.donorPhone}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-5 text-slate-300">
                          {m.purpose}
                        </td>
                        <td className="py-3 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="font-mono text-xs font-bold text-slate-400">
                              {m.currency}
                            </span>
                            <input
                              type="number"
                              disabled={!isSelected}
                              value={currentAmt}
                              onChange={(e) => handleCustomAmountChange(m.id, e.target.value)}
                              className="w-28 px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/10 text-right font-mono font-bold text-amber-300 text-xs focus:outline-none focus:border-amber-400"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Confirmation Bar */}
          <div className="p-5 rounded-2xl bg-amber-500/[0.06] border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider block">
                Batch Generation Summary
              </span>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Total: <strong className="text-amber-300 font-mono">{activeMembers.length}</strong> Separate Receipts</span>
                <span>•</span>
                <span>Assigned Nos: <strong className="text-white font-mono">{nextReceiptNumbers[0] || '—'} → {nextReceiptNumbers[nextReceiptNumbers.length - 1] || '—'}</strong></span>
              </div>
            </div>

            <button
              type="submit"
              disabled={activeMembers.length === 0}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(245,158,11,0.3)] transition transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Submit & Generate {activeMembers.length} Receipts</span>
            </button>
          </div>

        </form>
      )}

      {/* Generated Receipts Success Modal */}
      {generatedReceipts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#0f1219] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/15 text-white p-6 sm:p-8 space-y-6">
            
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  Group Submission Complete!
                </h3>
                <p className="text-xs text-slate-400">
                  Successfully generated <strong className="text-emerald-400">{generatedReceipts.length} separate receipts</strong> for {activeGroup?.name}.
                </p>
              </div>
            </div>

            {/* List of Issued Receipts */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Issued Receipts
              </span>
              <div className="border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/10 bg-white/[0.02]">
                {generatedReceipts.map((r) => (
                  <div key={r.id} className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-amber-300 text-sm">
                        {r.receiptNo}
                      </span>
                      <div>
                        <div className="font-bold text-white text-xs">{r.donorName}</div>
                        <div className="text-[11px] text-slate-400">{r.purpose}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        {r.currency} {r.donationAmount.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => onViewReceipt(r)}
                        className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
                        title="View individual receipt / PDF"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setGeneratedReceipts(null)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-xs shadow-md transition cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Create New Group Modal */}
      {showNewGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#0f1219] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/15 text-white p-6 sm:p-8 space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Create New Sponsor Company / Group</h3>
                  <p className="text-xs text-slate-400">Bundle regular members under a single company or recurring circle.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowNewGroupModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveNewGroup} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Company / Group Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g. Al-Noor Enterprises"
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Description / Notes
                  </label>
                  <input
                    type="text"
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    placeholder="e.g. Monthly employee donation pool"
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Add Member Subsection */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  Add Members to this Group ({newGroupMembers.length} added)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={mName}
                    onChange={(e) => setMName(e.target.value)}
                    placeholder="Member Name *"
                    className="px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white"
                  />
                  <input
                    type="tel"
                    value={mPhone}
                    onChange={(e) => setMPhone(e.target.value)}
                    placeholder="Phone (Optional)"
                    className="px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white"
                  />
                  <div className="flex gap-1.5">
                    <select
                      value={mCurrency}
                      onChange={(e) => setMCurrency(e.target.value)}
                      className="px-2 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white font-bold"
                    >
                      {availableCurrencies.map((c) => (
                        <option key={c} value={c} className="bg-[#0f1219]">{c}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={mAmount}
                      onChange={(e) => setMAmount(e.target.value)}
                      placeholder="Amount *"
                      className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <select
                    value={mPurpose}
                    onChange={(e) => setMPurpose(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white flex-1"
                  >
                    {availablePurposes.map((p) => (
                      <option key={p} value={p} className="bg-[#0f1219]">{p}</option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleAddMemberToDraft}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs shrink-0 cursor-pointer"
                  >
                    + Add Member
                  </button>
                </div>

                {/* Draft Members List */}
                {newGroupMembers.length > 0 && (
                  <div className="border border-white/10 rounded-xl overflow-hidden divide-y divide-white/10 bg-black/20 mt-2">
                    {newGroupMembers.map((m, idx) => (
                      <div key={m.id} className="p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-white">{m.donorName}</span>
                          <span className="text-slate-400 ml-2">• {m.purpose}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-300">{m.currency} {m.amount}</span>
                          <button
                            type="button"
                            onClick={() => setNewGroupMembers(newGroupMembers.filter((_, i) => i !== idx))}
                            className="text-rose-400 hover:text-rose-300 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewGroupModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-xs shadow-md transition cursor-pointer"
                >
                  Save Group
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
