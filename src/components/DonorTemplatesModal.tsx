'use client';

import React, { useState, useEffect } from 'react';
import { 
  RecurringDonorTemplate, 
  PaymentMethod, 
  ClassicReceipt, 
  DonorGroup, 
  DonorGroupMember 
} from '@/types';
import { loadCurrencies } from '@/lib/currencies';
import { loadPurposes } from '@/lib/settingsStorage';
import { 
  Bookmark, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  ArrowRight, 
  Zap, 
  Building2, 
  Users, 
  CheckCircle2, 
  Sparkles,
  Calendar,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { createReceiptFromTemplate, createReceiptsFromGroup } from '@/lib/quickReceiptHelper';
import { loadDonorGroups, saveDonorGroup, deleteDonorGroup, syncTemplateWithGroup } from '@/lib/groupStorage';
import { useAuth } from '@/context/AuthContext';

interface DonorTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: RecurringDonorTemplate[];
  receipts?: ClassicReceipt[];
  onSelectTemplate: (template: RecurringDonorTemplate) => void;
  onSaveTemplate: (template: RecurringDonorTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onRecordQuickPayment?: (receipt: ClassicReceipt) => void;
  onRecordGroupPayments?: (receipts: ClassicReceipt[]) => void;
}

export function DonorTemplatesModal({
  isOpen,
  onClose,
  templates,
  receipts = [],
  onSelectTemplate,
  onSaveTemplate,
  onDeleteTemplate,
  onRecordQuickPayment,
  onRecordGroupPayments,
}: DonorTemplatesModalProps) {
  const { user } = useAuth();

  // Active Tab: 'individual' vs 'groups'
  const [activeTab, setActiveTab] = useState<'individual' | 'groups'>('individual');

  // Individual Template Form State
  const [editingTemplate, setEditingTemplate] = useState<RecurringDonorTemplate | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pan, setPan] = useState('');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [purposesList, setPurposesList] = useState<string[]>([]);
  const [purpose, setPurpose] = useState('THAIBA EDUCARE');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI / Online');
  const [assignedGroupId, setAssignedGroupId] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Groups State
  const [groups, setGroups] = useState<DonorGroup[]>([]);
  const [editingGroup, setEditingGroup] = useState<DonorGroup | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [groupDescInput, setGroupDescInput] = useState('');
  const [groupPaymentMethod, setGroupPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [groupSelectedTemplateIds, setGroupSelectedTemplateIds] = useState<Set<string>>(new Set());
  const [groupCustomAmounts, setGroupCustomAmounts] = useState<Record<string, number>>({});
  const [groupCustomMembers, setGroupCustomMembers] = useState<DonorGroupMember[]>([]);

  // Ad-hoc member fields for Group Creator
  const [adHocName, setAdHocName] = useState('');
  const [adHocAmount, setAdHocAmount] = useState('');
  const [adHocCurrency, setAdHocCurrency] = useState('INR');
  const [adHocPurpose, setAdHocPurpose] = useState('THAIBA EDUCARE');

  const [availableCurrencies, setAvailableCurrencies] = useState<string[]>(['INR', 'USD', 'OMR', 'QAR', 'AED', 'SAR', 'EUR', 'GBP', 'KWD']);

  // Success alert
  const [quickPaySuccess, setQuickPaySuccess] = useState<string | null>(null);

  useEffect(() => {
    setAvailableCurrencies(loadCurrencies());
    const loadedPurposes = loadPurposes();
    setPurposesList(loadedPurposes);
    if (loadedPurposes.length > 0 && !purpose) {
      setPurpose(loadedPurposes[0]);
    }
    setGroups(loadDonorGroups());
  }, []);

  if (!isOpen) return null;

  // 1-Click Pay for Individual Sponsor
  const handleQuickPay = (t: RecurringDonorTemplate) => {
    if (!onRecordQuickPayment) {
      onSelectTemplate(t);
      onClose();
      return;
    }

    const receipt = createReceiptFromTemplate(
      t,
      receipts,
      undefined,
      undefined,
      undefined,
      user?.name || 'Authorized Admin'
    );

    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#FFFFFF'],
      });
    } catch {}

    onRecordQuickPayment(receipt);
    setQuickPaySuccess(`✅ Receipt #${receipt.receiptNo} generated for ${receipt.donorName} (${receipt.currency} ${receipt.donationAmount}) in 1 click!`);
    setTimeout(() => {
      setQuickPaySuccess(null);
      onClose();
    }, 1800);
  };

  // 1-Click Group Submission
  const handleQuickPayGroup = (g: DonorGroup) => {
    if (!onRecordGroupPayments) return;

    const createdReceipts = createReceiptsFromGroup(
      g,
      g.members,
      receipts,
      undefined,
      g.defaultPaymentMethod || 'Bank Transfer',
      undefined,
      user?.name || 'Authorized Admin'
    );

    try {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#A855F7'],
      });
    } catch {}

    onRecordGroupPayments(createdReceipts);
    setQuickPaySuccess(`🎉 Group payment complete! Generated ${createdReceipts.length} separate receipts for ${g.name}.`);
    setTimeout(() => {
      setQuickPaySuccess(null);
      onClose();
    }, 2000);
  };

  // Start Individual Edit
  const startEdit = (t: RecurringDonorTemplate) => {
    setEditingTemplate(t);
    setIsCreatingNew(false);
    setDonorName(t.donorName);
    setPhone(t.donorPhone || '');
    setEmail(t.donorEmail || '');
    setPan(t.donorPAN || '');
    setAddress(t.donorAddress || '');
    setAmount(t.defaultAmount.toString());
    setCurrency(t.defaultCurrency);
    setPurpose(t.defaultPurpose);
    setPaymentMethod(t.defaultPaymentMethod);
    setAssignedGroupId(t.groupId || '');
    setNotes(t.notes || '');
  };

  // Start Individual New
  const startNew = () => {
    setEditingTemplate(null);
    setIsCreatingNew(true);
    setDonorName('');
    setPhone('');
    setEmail('');
    setPan('');
    setAddress('');
    setAmount('');
    setCurrency('INR');
    setPurpose(purposesList[0] || 'THAIBA EDUCARE');
    setPaymentMethod('UPI / Online');
    setAssignedGroupId('');
    setNotes('');
  };

  // Submit Individual Template (includes "after individual add select the group")
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorName.trim()) {
      alert('Donor name is required');
      return;
    }

    const selectedGroup = groups.find((g) => g.id === assignedGroupId);

    const template: RecurringDonorTemplate = {
      id: editingTemplate ? editingTemplate.id : `tmpl-${Date.now()}`,
      donorName: donorName.trim(),
      donorPhone: phone.trim() || undefined,
      donorEmail: email.trim() || undefined,
      donorPAN: pan.trim().toUpperCase() || undefined,
      donorAddress: address.trim() || undefined,
      defaultAmount: parseFloat(amount) || 0,
      defaultCurrency: currency,
      defaultPurpose: purpose,
      defaultPaymentMethod: paymentMethod,
      groupId: assignedGroupId || undefined,
      groupName: selectedGroup?.name || undefined,
      notes: notes.trim() || undefined,
      createdAt: editingTemplate ? editingTemplate.createdAt : new Date().toISOString(),
    };

    onSaveTemplate(template);

    // Synchronize this individual template into the selected group's membership list
    syncTemplateWithGroup(template, assignedGroupId || undefined);
    setGroups(loadDonorGroups());

    setEditingTemplate(null);
    setIsCreatingNew(false);
  };

  // ================= GROUP MANAGEMENT HANDLERS =================
  const startNewGroup = () => {
    setEditingGroup(null);
    setIsCreatingGroup(true);
    setGroupNameInput('');
    setGroupDescInput('');
    setGroupPaymentMethod('Bank Transfer');
    // Start with empty or all templates
    setGroupSelectedTemplateIds(new Set());
    setGroupCustomAmounts({});
    setGroupCustomMembers([]);
  };

  const startEditGroup = (g: DonorGroup) => {
    setEditingGroup(g);
    setIsCreatingGroup(false);
    setGroupNameInput(g.name);
    setGroupDescInput(g.description || '');
    setGroupPaymentMethod(g.defaultPaymentMethod || 'Bank Transfer');

    // Determine which templates are selected
    const selectedIds = new Set<string>();
    const customAmts: Record<string, number> = {};
    const adHocs: DonorGroupMember[] = [];

    g.members.forEach((m) => {
      if (m.templateId) {
        selectedIds.add(m.templateId);
        customAmts[m.templateId] = m.amount;
      } else {
        adHocs.push(m);
      }
    });

    setGroupSelectedTemplateIds(selectedIds);
    setGroupCustomAmounts(customAmts);
    setGroupCustomMembers(adHocs);
  };

  const toggleGroupMemberTemplate = (tmplId: string) => {
    const next = new Set(groupSelectedTemplateIds);
    if (next.has(tmplId)) {
      next.delete(tmplId);
    } else {
      next.add(tmplId);
    }
    setGroupSelectedTemplateIds(next);
  };

  const handleGroupCustomAmountChange = (tmplId: string, val: string) => {
    const num = parseFloat(val);
    setGroupCustomAmounts((prev) => ({
      ...prev,
      [tmplId]: isNaN(num) ? 0 : num,
    }));
  };

  const handleAddAdHocMember = () => {
    if (!adHocName.trim()) {
      alert('Member name is required');
      return;
    }
    const amt = parseFloat(adHocAmount) || 0;
    if (amt <= 0) {
      alert('Valid amount is required');
      return;
    }

    const newAdHoc: DonorGroupMember = {
      id: `gm-adhoc-${Date.now()}`,
      donorName: adHocName.trim(),
      amount: amt,
      currency: adHocCurrency,
      purpose: adHocPurpose,
      paymentMethod: groupPaymentMethod,
    };

    setGroupCustomMembers([...groupCustomMembers, newAdHoc]);
    setAdHocName('');
    setAdHocAmount('');
  };

  const handleSaveGroupTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupNameInput.trim()) {
      alert('Group / Company name is required');
      return;
    }

    // Assemble all members: selected templates + custom members
    const finalMembers: DonorGroupMember[] = [];

    // 1. From selected templates
    templates.forEach((t) => {
      if (groupSelectedTemplateIds.has(t.id)) {
        const amt = groupCustomAmounts[t.id] !== undefined ? groupCustomAmounts[t.id] : t.defaultAmount;
        finalMembers.push({
          id: `gm-${t.id}`,
          templateId: t.id,
          donorName: t.donorName,
          donorPhone: t.donorPhone,
          donorEmail: t.donorEmail,
          donorAddress: t.donorAddress,
          donorPAN: t.donorPAN,
          amount: amt,
          currency: t.defaultCurrency,
          purpose: t.defaultPurpose,
          paymentMethod: t.defaultPaymentMethod || groupPaymentMethod,
        });
      }
    });

    // 2. Custom ad-hoc members
    groupCustomMembers.forEach((m) => {
      finalMembers.push(m);
    });

    if (finalMembers.length === 0) {
      alert('Please select at least 1 member for the group');
      return;
    }

    const newOrUpdatedGroup: DonorGroup = {
      id: editingGroup ? editingGroup.id : `grp-${Date.now()}`,
      name: groupNameInput.trim(),
      description: groupDescInput.trim() || undefined,
      defaultPaymentMethod: groupPaymentMethod,
      members: finalMembers,
      createdAt: editingGroup ? editingGroup.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveDonorGroup(newOrUpdatedGroup);
    setGroups(loadDonorGroups());
    setEditingGroup(null);
    setIsCreatingGroup(false);
  };

  const handleDeleteGroup = (groupId: string, gName: string) => {
    if (confirm(`Delete group template "${gName}"? (Individual member templates will be preserved).`)) {
      deleteDonorGroup(groupId);
      setGroups(loadDonorGroups());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#0f1219] rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[96vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl border border-white/15 text-white">
        
        {/* Modal Header */}
        <div className="sticky top-0 bg-[#0f1219]/95 backdrop-blur-xl px-4 sm:px-6 py-3.5 sm:py-5 border-b border-white/10 flex items-center justify-between gap-3 z-10">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center justify-center font-bold shrink-0">
              <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-black text-white truncate">
                Recurring Donors & Groups
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                1-Click individual payments & corporate group template management
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-9 h-9 min-h-[38px] min-w-[38px] rounded-xl bg-white/10 hover:bg-rose-500/25 text-slate-300 hover:text-white border border-white/10 flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0 ml-auto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Pay Success Alert Banner */}
        {quickPaySuccess && (
          <div className="mx-4 sm:mx-6 mt-4 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{quickPaySuccess}</span>
          </div>
        )}

        {/* Tab Toggle: Individual vs Groups */}
        <div className="px-4 sm:px-6 pt-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2 p-1 rounded-2xl bg-white/[0.04] border border-white/10 w-full sm:w-fit">
            <button
              onClick={() => {
                setActiveTab('individual');
                setEditingGroup(null);
                setIsCreatingGroup(false);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'individual'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Individual Sponsors ({templates.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('groups');
                setEditingTemplate(null);
                setIsCreatingNew(false);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'groups'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Company / Groups ({groups.length})</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          
          {/* ================= TAB 1: INDIVIDUAL SPONSORS ================= */}
          {activeTab === 'individual' && (
            <>
              {/* If individual form is open */}
              {(editingTemplate || isCreatingNew) ? (
                <form onSubmit={handleFormSubmit} className="space-y-4 bg-white/[0.04] p-5 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-xs font-bold text-white">
                      {editingTemplate ? 'Edit Recurring Template' : 'Create Recurring Template'}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setEditingTemplate(null); setIsCreatingNew(false); }}
                      className="text-xs text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Donor Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                        placeholder="Donor Name"
                        className="w-full px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        WhatsApp Phone
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 8129755155"
                        className="w-full px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white text-xs font-mono font-medium focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Currency
                      </label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        aria-label="Currency Code"
                        className="w-full px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white text-xs font-bold"
                      >
                        {availableCurrencies.map((c) => (
                          <option key={c} value={c} className="bg-[#0f1219] text-white">{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Default Amount
                      </label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Amount"
                        className="w-full px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white text-xs font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        PAN (Optional)
                      </label>
                      <input
                        type="text"
                        value={pan}
                        onChange={(e) => setPan(e.target.value.toUpperCase())}
                        placeholder="ABCDE1234F"
                        className="w-full px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Default Purpose
                    </label>
                    <select
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      aria-label="Donation Purpose"
                      className="w-full px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white text-xs font-semibold"
                    >
                      {purposesList.map((p) => (
                        <option key={p} value={p} className="bg-[#0f1219] text-white">{p}</option>
                      ))}
                    </select>
                  </div>

                  {/* USER REQUEST 1: "(after individual add select the group)" */}
                  <div className="p-3 rounded-2xl bg-amber-500/[0.06] border border-amber-500/20">
                    <label className="block text-[10px] font-bold text-amber-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Assign to Company / Group (Optional)</span>
                    </label>
                    <select
                      value={assignedGroupId}
                      onChange={(e) => setAssignedGroupId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-amber-400"
                    >
                      <option value="" className="bg-[#0f1219]">None (Individual Sponsor Only)</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id} className="bg-[#0f1219]">
                          🏢 {g.name} ({g.members.length} members)
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Selecting a group will automatically add this sponsor as a member of that company&apos;s monthly batch submission.
                    </span>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => { setEditingTemplate(null); setIsCreatingNew(false); }}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-xs font-black shadow-md transition cursor-pointer"
                    >
                      Save Template
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Saved Templates ({templates.length})
                  </span>
                  <button
                    onClick={startNew}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 text-xs font-black flex items-center gap-1 shadow-md transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>New Template</span>
                  </button>
                </div>
              )}

              {/* List of Templates with Assigned Group Badge */}
              <div className="divide-y divide-white/10">
                {templates.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    No recurring donor templates saved yet.
                  </div>
                ) : (
                  templates.map((t) => (
                    <div
                      key={t.id}
                      className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.04] p-3 rounded-2xl transition"
                    >
                      <div>
                        <div className="font-bold text-white text-sm flex items-center gap-2 flex-wrap">
                          <span>{t.donorName}</span>
                          <span className="font-mono text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                            {t.defaultCurrency} {t.defaultAmount.toLocaleString()}
                          </span>
                          {t.groupName && (
                            <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Building2 className="w-2.5 h-2.5" />
                              <span>{t.groupName}</span>
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {t.defaultPurpose} • {t.defaultPaymentMethod}
                        </div>
                        {t.donorPhone && (
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {t.donorPhone}
                          </div>
                        )}
                      </div>

                      {/* 1-Click Pay Button & Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => handleQuickPay(t)}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition shadow-md cursor-pointer"
                          title={`Instantly record today's payment for ${t.donorName}`}
                        >
                          <Zap className="w-3.5 h-3.5 fill-slate-950" />
                          <span>1-Click Pay</span>
                        </button>

                        <button
                          onClick={() => {
                            onSelectTemplate(t);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/10 text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                          title="Load into receipt form to review or edit before saving"
                        >
                          <span>Use</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>

                        <button
                          onClick={() => startEdit(t)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                          title="Edit Template & Assigned Group"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Delete template for ${t.donorName}?`)) {
                              onDeleteTemplate(t.id);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* ================= TAB 2: COMPANIES & GROUPS (USER REQUEST: CREATE & EDIT GROUP TEMPLATE) ================= */}
          {activeTab === 'groups' && (
            <div className="space-y-5">
              
              {/* If Group Form (Create / Edit) is open */}
              {(isCreatingGroup || editingGroup) ? (
                <form onSubmit={handleSaveGroupTemplate} className="space-y-5 bg-white/[0.04] p-5 sm:p-6 rounded-2xl border border-white/10 animate-in fade-in">
                  
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div>
                      <h4 className="text-sm font-black text-white flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-amber-400" />
                        <span>{editingGroup ? `Edit Group Template: ${editingGroup.name}` : 'Create New Group Template'}</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Bundle recurring sponsors under a company or circle for single-click batch submissions.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => { setEditingGroup(null); setIsCreatingGroup(false); }}
                      className="text-xs text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Company / Group Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={groupNameInput}
                        onChange={(e) => setGroupNameInput(e.target.value)}
                        placeholder="e.g. Apex Solutions (Corporate Donors)"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Default Payment Method
                      </label>
                      <select
                        value={groupPaymentMethod}
                        onChange={(e) => setGroupPaymentMethod(e.target.value as PaymentMethod)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white text-xs font-bold"
                      >
                        <option value="Bank Transfer" className="bg-[#0f1219]">Bank Transfer</option>
                        <option value="UPI / Online" className="bg-[#0f1219]">UPI / Online</option>
                        <option value="Bank" className="bg-[#0f1219]">Bank</option>
                        <option value="Cash" className="bg-[#0f1219]">Cash</option>
                        <option value="Cheque" className="bg-[#0f1219]">Cheque</option>
                        <option value="Card" className="bg-[#0f1219]">Card</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Description / Memo
                    </label>
                    <input
                      type="text"
                      value={groupDescInput}
                      onChange={(e) => setGroupDescInput(e.target.value)}
                      placeholder="e.g. Corporate monthly employee donation pool"
                      className="w-full px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Member Selection from Individual Templates (Checklist) */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-amber-400" />
                        <span>Select Members from Individual Templates ({groupSelectedTemplateIds.size} Selected)</span>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Check/uncheck to add or remove members
                      </span>
                    </div>

                    <div className="border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/10 bg-black/20 max-h-60 overflow-y-auto">
                      {templates.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500">
                          No individual templates found. Add individual templates first or enter custom members below.
                        </div>
                      ) : (
                        templates.map((t) => {
                          const isSelected = groupSelectedTemplateIds.has(t.id);
                          const currentAmt = groupCustomAmounts[t.id] !== undefined ? groupCustomAmounts[t.id] : t.defaultAmount;

                          return (
                            <div
                              key={t.id}
                              onClick={() => toggleGroupMemberTemplate(t.id)}
                              className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition ${
                                isSelected ? 'bg-amber-500/[0.08]' : 'hover:bg-white/[0.02]'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}} // handled by div click
                                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-white/20 bg-white/10 cursor-pointer"
                                />
                                <div>
                                  <div className="font-bold text-white text-xs">{t.donorName}</div>
                                  <div className="text-[10px] text-slate-400">{t.defaultPurpose}</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <span className="font-mono text-xs text-slate-400 font-bold">{t.defaultCurrency}</span>
                                <input
                                  type="number"
                                  disabled={!isSelected}
                                  value={currentAmt}
                                  onChange={(e) => handleGroupCustomAmountChange(t.id, e.target.value)}
                                  className="w-24 px-2 py-1 rounded-lg bg-white/[0.06] border border-white/10 text-right font-mono font-bold text-amber-300 text-xs focus:outline-none focus:border-amber-400"
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Ad-Hoc Member Quick Add */}
                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      + Or Add Custom Member to this Group Template
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <input
                        type="text"
                        value={adHocName}
                        onChange={(e) => setAdHocName(e.target.value)}
                        placeholder="Member Name"
                        className="px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white"
                      />
                      <input
                        type="number"
                        value={adHocAmount}
                        onChange={(e) => setAdHocAmount(e.target.value)}
                        placeholder="Amount"
                        className="px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white font-mono"
                      />
                      <select
                        value={adHocPurpose}
                        onChange={(e) => setAdHocPurpose(e.target.value)}
                        className="px-2 py-1.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white"
                      >
                        {purposesList.map((p) => (
                          <option key={p} value={p} className="bg-[#0f1219]">{p}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleAddAdHocMember}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer"
                      >
                        Add Member
                      </button>
                    </div>

                    {groupCustomMembers.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {groupCustomMembers.map((m, idx) => (
                          <span
                            key={m.id}
                            className="text-[11px] px-2 py-0.5 rounded-lg bg-white/10 text-slate-200 flex items-center gap-1.5"
                          >
                            <span>{m.donorName} ({m.currency} {m.amount})</span>
                            <button
                              type="button"
                              onClick={() => setGroupCustomMembers(groupCustomMembers.filter((_, i) => i !== idx))}
                              className="text-rose-400 hover:text-rose-300"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => { setEditingGroup(null); setIsCreatingGroup(false); }}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-xs font-black shadow-md transition cursor-pointer"
                    >
                      Save Group Template
                    </button>
                  </div>

                </form>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                        Saved Company & Sponsor Groups ({groups.length})
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Record multiple separate member receipts in a single click.
                      </p>
                    </div>

                    {/* Button to Create Group Template */}
                    <button
                      onClick={startNewGroup}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Create Group Template</span>
                    </button>
                  </div>

                  <div className="divide-y divide-white/10">
                    {groups.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 text-xs">
                        No company or sponsor groups created yet. Click &quot;Create Group Template&quot; above to create one.
                      </div>
                    ) : (
                      groups.map((g) => {
                        const totalMembers = g.members.length;
                        return (
                          <div key={g.id} className="py-4 first:pt-0 last:pb-0 space-y-3 p-3 rounded-2xl hover:bg-white/[0.03] transition">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div>
                                <div className="font-bold text-white text-sm flex items-center gap-2">
                                  <span>{g.name}</span>
                                  <span className="text-xs font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/25 px-2 py-0.5 rounded-full">
                                    {totalMembers} Members
                                  </span>
                                </div>
                                {g.description && (
                                  <p className="text-xs text-slate-400 mt-0.5">{g.description}</p>
                                )}
                              </div>

                              {/* Actions: 1-Click Group Pay, Edit Group, Delete Group */}
                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                <button
                                  onClick={() => handleQuickPayGroup(g)}
                                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition shadow-md cursor-pointer"
                                  title={`Generate ${totalMembers} separate receipts for all members at once`}
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>1-Click Group Pay ({totalMembers})</span>
                                </button>

                                <button
                                  onClick={() => startEditGroup(g)}
                                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                                  title="Edit Group Template & Members"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleDeleteGroup(g.id, g.name)}
                                  className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                                  title="Delete Group"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Members pill breakdown */}
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {g.members.map((m) => (
                                <span
                                  key={m.id}
                                  className="text-[11px] px-2.5 py-1 rounded-xl bg-white/[0.05] border border-white/10 text-slate-300 font-medium flex items-center gap-1"
                                >
                                  <span className="font-bold text-white">{m.donorName}</span>
                                  <span className="text-amber-300 font-mono font-bold">({m.currency} {m.amount.toLocaleString()})</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
