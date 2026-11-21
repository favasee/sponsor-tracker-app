'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ClassicReceipt, 
  RecurringDonorTemplate, 
  PaymentMethod 
} from '@/types';
import { 
  loadCurrencies, 
  saveNewCustomCurrency 
} from '@/lib/currencies';
import { 
  loadPurposes,
  loadHeaderSettings 
} from '@/lib/settingsStorage';
import { formatAmountInWords } from '@/lib/numberToWords';
import { useAuth } from '@/context/AuthContext';
import { 
  getNextClassicReceiptNumber, 
  saveClassicReceipt, 
  saveRecurringTemplate 
} from '@/lib/receiptStorage';
import { 
  FileText, 
  Save, 
  Bookmark, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Plus,
  Crown,
  Sparkles,
  Building2,
  User,
  Download,
  Eye,
  Clock,
  MessageSquare,
  Calendar,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GroupSubmissionView } from './GroupSubmissionView';
import { generateWhatsAppMessage } from '@/lib/whatsapp';
import { DEFAULT_RECEIPT_EMAILS } from '@/lib/constants';

interface ReceiptFormProps {
  receipts: ClassicReceipt[];
  templates: RecurringDonorTemplate[];
  receiptToEdit: ClassicReceipt | null;
  templateToApply?: RecurringDonorTemplate | null;
  onTemplateApplied?: () => void;
  onReceiptSaved: (receipt: ClassicReceipt) => void;
  onBatchReceiptsSaved?: (receipts: ClassicReceipt[]) => void;
  onCancelEdit?: () => void;
  onOpenTemplatesModal?: () => void;
  onOpenWhatsAppConfig?: () => void;
  onViewReceipt?: (receipt: ClassicReceipt, autoDownload?: boolean) => void;
}

export function ReceiptForm({
  receipts,
  templates,
  receiptToEdit,
  templateToApply,
  onTemplateApplied,
  onReceiptSaved,
  onBatchReceiptsSaved,
  onCancelEdit,
  onOpenTemplatesModal,
  onOpenWhatsAppConfig,
  onViewReceipt,
}: ReceiptFormProps) {
  const { user } = useAuth();

  // Mode Switcher: Individual vs Group Submission
  const [submissionMode, setSubmissionMode] = useState<'individual' | 'group'>('individual');

  // Currencies and Purposes lists with dynamic settings support
  const [currenciesList, setCurrenciesList] = useState<string[]>(['INR', 'USD', 'OMR', 'QAR', 'AED', 'SAR', 'EUR', 'GBP', 'KWD']);
  const [purposesList, setPurposesList] = useState<string[]>([]);
  const [showAddCurrencyModal, setShowAddCurrencyModal] = useState(false);
  const [newCurrencyInput, setNewCurrencyInput] = useState('');

  // Form Fields
  const [receiptNo, setReceiptNo] = useState('TH0001');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]); // Default Date is today
  const [donorName, setDonorName] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [donorEmail, setDonorEmail] = useState<string>(DEFAULT_RECEIPT_EMAILS[0]);
  const [donorAddress, setDonorAddress] = useState('');
  const [donorPAN, setDonorPAN] = useState('');
  const [donationAmount, setDonationAmount] = useState<string>('');
  const [currency, setCurrency] = useState('INR');
  
  // Change 3: Manual Indian Value only, NO automatic calculation, NO *
  const [indianValue, setIndianValue] = useState<string>('');
  
  const [purpose, setPurpose] = useState('THAIBA EDUCARE');
  const [customPurpose, setCustomPurpose] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');

  // Options
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [queueWhatsApp, setQueueWhatsApp] = useState(true);
  const [editReason, setEditReason] = useState('');

  // Autocomplete suggestions
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);

  // Open/Hide Section Toggles (User Request)
  const [showIndianValue, setShowIndianValue] = useState(false);
  const [showDonorContactDetails, setShowDonorContactDetails] = useState(false);

  // Load currencies and purposes from settings on mount
  useEffect(() => {
    const loadedCurrencies = loadCurrencies();
    const loadedPurposes = loadPurposes();
    setCurrenciesList(loadedCurrencies);
    setPurposesList(loadedPurposes);
    if (loadedPurposes.length > 0 && !purpose) {
      setPurpose(loadedPurposes[0]);
    }
  }, []);

  // Initialize form for Create or Edit
  useEffect(() => {
    const currentPurposes = loadPurposes();
    if (receiptToEdit) {
      setReceiptNo(receiptToEdit.receiptNo);
      setDate(receiptToEdit.date);
      setDonorName(receiptToEdit.donorName);
      setDonorPhone(receiptToEdit.donorPhone || '');
      setDonorEmail(receiptToEdit.donorEmail || DEFAULT_RECEIPT_EMAILS[0]);
      setDonorAddress(receiptToEdit.donorAddress || '');
      setDonorPAN(receiptToEdit.donorPAN || '');
      setDonationAmount(receiptToEdit.donationAmount ? receiptToEdit.donationAmount.toString() : '');
      setCurrency(receiptToEdit.currency);
      setIndianValue(receiptToEdit.indianValue ? receiptToEdit.indianValue.toString() : '');
      if (receiptToEdit.currency !== 'INR' || (receiptToEdit.indianValue && receiptToEdit.indianValue !== receiptToEdit.donationAmount)) {
        setShowIndianValue(true);
      }
      if (receiptToEdit.donorPhone || receiptToEdit.donorEmail || receiptToEdit.donorPAN) {
        setShowDonorContactDetails(true);
      }
      
      if (currentPurposes.includes(receiptToEdit.purpose)) {
        setPurpose(receiptToEdit.purpose);
        setCustomPurpose('');
      } else {
        setPurpose('Other / Custom');
        setCustomPurpose(receiptToEdit.purpose);
      }

      setPaymentMethod(receiptToEdit.paymentMethod);
      setPaymentReference(receiptToEdit.paymentReference || '');
      setNotes(receiptToEdit.notes || '');
      setSaveAsTemplate(false);
      setEditReason('');
    } else {
      // Create new with format like "TH0001" using prefix from settings
      setReceiptNo(getNextClassicReceiptNumber(receipts));
      setDate(new Date().toISOString().split('T')[0]); // Default Date is Today
      setDonorName('');
      setDonorPhone('');
      setDonorEmail(DEFAULT_RECEIPT_EMAILS[0]);
      setDonorAddress('');
      setDonorPAN('');
      setDonationAmount('');
      setCurrency('INR');
      setIndianValue(''); // Clean manual typing
      setPurpose(currentPurposes[0] || 'THAIBA EDUCARE');
      setCustomPurpose('');
      setPaymentMethod('Bank');
      setPaymentReference('');
      setNotes('');
      setSaveAsTemplate(false);
      setEditReason('');
      setShowIndianValue(false);
      setShowDonorContactDetails(false);
    }
  }, [receiptToEdit, receipts]);

  // Apply template when selected from DonorTemplatesModal
  useEffect(() => {
    if (templateToApply) {
      setDonorName(templateToApply.donorName);
      setDonorPhone(templateToApply.donorPhone || '');
      setDonorEmail(templateToApply.donorEmail || '');
      setDonorAddress(templateToApply.donorAddress || '');
      setDonorPAN(templateToApply.donorPAN || '');
      if (templateToApply.donorPhone || templateToApply.donorEmail || templateToApply.donorPAN) {
        setShowDonorContactDetails(true);
      }
      if (templateToApply.defaultAmount) {
        setDonationAmount(templateToApply.defaultAmount.toString());
        const tCurr = templateToApply.defaultCurrency || 'INR';
        setCurrency(tCurr);
        if (tCurr !== 'INR') {
          setShowIndianValue(true);
        }
      }
      if (templateToApply.defaultPurpose) {
        setPurpose(templateToApply.defaultPurpose);
      }
      if (templateToApply.defaultPaymentMethod) {
        setPaymentMethod(templateToApply.defaultPaymentMethod);
      }
      setShowTemplateDropdown(false);
      if (onTemplateApplied) {
        onTemplateApplied();
      }
    }
  }, [templateToApply, onTemplateApplied]);

  // Handle currency selection
  const handleCurrencySelect = (val: string) => {
    if (val === '__ADD_NEW__') {
      setShowAddCurrencyModal(true);
    } else {
      setCurrency(val);
      if (val !== 'INR') {
        setShowIndianValue(true);
      }
    }
  };

  // Add custom currency
  const handleSaveCustomCurrency = (e: React.FormEvent) => {
    e.preventDefault();
    const code = newCurrencyInput.trim().toUpperCase();
    if (!code) return;

    const updated = saveNewCustomCurrency(code);
    setCurrenciesList(updated);
    setCurrency(code);
    setNewCurrencyInput('');
    setShowAddCurrencyModal(false);
  };

  // Amount in Words in English (Computed live in real-time)
  const amountInWords = useMemo(() => {
    const num = parseFloat(donationAmount) || 0;
    if (num <= 0) return 'Zero Rupees Only';

    const baseWords = formatAmountInWords(num, currency);

    // If manual Indian Value is typed and currency is not INR, mention it
    const inrVal = parseFloat(indianValue) || 0;
    if (currency !== 'INR' && inrVal > 0) {
      const inrWords = formatAmountInWords(inrVal, 'INR');
      return `${baseWords} (Equivalent to ${inrWords})`;
    }

    return baseWords;
  }, [donationAmount, currency, indianValue]);

  // Matching templates for donor autocomplete
  const matchingTemplates = useMemo(() => {
    if (!donorName.trim() || donorName.length < 2) return [];
    return templates.filter((t) =>
      t.donorName.toLowerCase().includes(donorName.toLowerCase())
    ).slice(0, 5);
  }, [donorName, templates]);

  const loadFromTemplate = (t: RecurringDonorTemplate) => {
    setDonorName(t.donorName);
    if (t.donorPhone) setDonorPhone(t.donorPhone);
    if (t.donorEmail) setDonorEmail(t.donorEmail);
    if (t.donorAddress) setDonorAddress(t.donorAddress);
    if (t.donorPAN) setDonorPAN(t.donorPAN);
    if (t.defaultAmount) {
      setDonationAmount(t.defaultAmount.toString());
      setCurrency(t.defaultCurrency || 'INR');
    }
    if (t.defaultPurpose) setPurpose(t.defaultPurpose);
    if (t.defaultPaymentMethod) setPaymentMethod(t.defaultPaymentMethod);
    setShowTemplateDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!donorName.trim()) {
      alert('Please enter the Donor Full Name');
      return;
    }
    const parsedAmount = parseFloat(donationAmount) || 0;
    if (parsedAmount <= 0) {
      alert('Please enter a valid donation amount');
      return;
    }

    const finalPurpose = purpose === 'Other / Custom' ? (customPurpose || 'General Support') : purpose;
    const finalIndianVal = parseFloat(indianValue) || (currency === 'INR' ? parsedAmount : 0);
    const nowIso = new Date().toISOString();
    const isEditing = Boolean(receiptToEdit);

    const savedReceipt: ClassicReceipt = {
      id: receiptToEdit ? receiptToEdit.id : `rc-${Date.now()}`,
      receiptNo: receiptNo, // Format like "TH0001"
      date: date || new Date().toISOString().split('T')[0],
      donorName: donorName.trim(),
      donorPhone: donorPhone.trim() || undefined,
      donorEmail: donorEmail.trim() || DEFAULT_RECEIPT_EMAILS[0],
      donorAddress: donorAddress.trim() || undefined,
      donorPAN: donorPAN.trim().toUpperCase() || undefined,
      purpose: finalPurpose,
      currency,
      donationAmount: parsedAmount,
      exchangeRate: 1.0,
      indianValue: finalIndianVal,
      amountInWords: amountInWords,
      paymentMethod,
      paymentReference: paymentReference.trim() || undefined,
      notes: notes.trim() || undefined,
      isEdited: isEditing,
      editLogs: isEditing
        ? [
            ...(receiptToEdit?.editLogs || []),
            {
              editedAt: nowIso,
              editedBy: user?.name || 'Office',
              reason: editReason || 'Correction of receipt particulars',
              previousAmount: receiptToEdit?.donationAmount,
              previousIndianValue: receiptToEdit?.indianValue,
            },
          ]
        : undefined,
      whatsappStatus: queueWhatsApp ? 'placeholder' : undefined,
      createdBy: receiptToEdit ? receiptToEdit.createdBy : (user?.name || 'Office'),
      createdAt: receiptToEdit ? receiptToEdit.createdAt : nowIso,
      updatedAt: nowIso,
    };

    // Save to storage
    saveClassicReceipt(savedReceipt);

    // Save as recurring template if opted
    if (saveAsTemplate) {
      const newTemplate: RecurringDonorTemplate = {
        id: `tmpl-${Date.now()}`,
        donorName: savedReceipt.donorName,
        donorPhone: savedReceipt.donorPhone,
        donorEmail: savedReceipt.donorEmail,
        donorAddress: savedReceipt.donorAddress,
        donorPAN: savedReceipt.donorPAN,
        defaultAmount: savedReceipt.donationAmount,
        defaultCurrency: savedReceipt.currency,
        defaultPurpose: savedReceipt.purpose,
        defaultPaymentMethod: savedReceipt.paymentMethod,
        notes: `Saved from receipt ${savedReceipt.receiptNo}`,
        createdAt: nowIso,
      };
      saveRecurringTemplate(newTemplate);
    }

    // Trigger visual confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#FFFFFF', '#6366F1'],
      });
    } catch {}

    onReceiptSaved(savedReceipt);
  };

  // Latest 6 receipts for staff quick PDF download & WhatsApp sharing
  const recentSixReceipts = useMemo(() => {
    return [...receipts]
      .sort((a, b) => {
        const timeA = a.createdAt || a.date;
        const timeB = b.createdAt || b.date;
        if (timeB !== timeA) {
          return timeB.localeCompare(timeA);
        }
        return b.receiptNo.localeCompare(a.receiptNo, undefined, { numeric: true });
      })
      .slice(0, 6);
  }, [receipts]);

  const [downloadingReceiptId, setDownloadingReceiptId] = useState<string | null>(null);

  const handleDownloadPDF = (r: ClassicReceipt) => {
    setDownloadingReceiptId(r.id);
    onViewReceipt?.(r, true);
    setTimeout(() => {
      setDownloadingReceiptId(null);
    }, 1500);
  };

  const handleShareWhatsApp = (r: ClassicReceipt) => {
    const cleanPhone = (r.donorPhone || '').replace(/\D/g, '');
    const message = generateWhatsAppMessage({
      type: 'receipt',
      language: 'en',
      name: r.donorName,
      amount: r.donationAmount,
      currency: r.currency,
      category: r.purpose,
      paymentMethod: r.paymentMethod,
      receiptNo: r.receiptNo,
      date: r.date,
    });
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    } catch {}
    return dateStr;
  };

  return (
    <div className="space-y-6">

      {/* Top Mode Switcher: Individual vs Group Submission */}
      {!receiptToEdit && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 w-full sm:w-fit backdrop-blur-md">
          <button
            type="button"
            onClick={() => setSubmissionMode('individual')}
            aria-pressed={submissionMode === 'individual'}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition-all duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none cursor-pointer ${
              submissionMode === 'individual'
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Individual Receipt</span>
          </button>

          <button
            type="button"
            onClick={() => setSubmissionMode('group')}
            aria-pressed={submissionMode === 'group'}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition-all duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none cursor-pointer ${
              submissionMode === 'group'
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Group / Company Submission</span>
          </button>
        </div>
      )}

      {submissionMode === 'group' && !receiptToEdit ? (
        <GroupSubmissionView
          receipts={receipts}
          templates={templates}
          onReceiptSaved={onReceiptSaved}
          onBatchReceiptsSaved={(newReceipts) => {
            if (onBatchReceiptsSaved) {
              onBatchReceiptsSaved(newReceipts);
            } else {
              newReceipts.forEach((r) => onReceiptSaved(r));
            }
          }}
          onViewReceipt={onViewReceipt || ((r) => onReceiptSaved(r))}
          onOpenTemplatesModal={onOpenTemplatesModal}
        />
      ) : (
        <div className="bg-white/[0.04] backdrop-blur-2xl rounded-3xl p-6 sm:p-9 border border-white/[0.09] shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] relative overflow-hidden">
          
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

          {/* Edit Mode Banner */}
          {receiptToEdit && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-200">
                    Correction Mode Active: Editing Receipt #{receiptToEdit.receiptNo}
                  </p>
                  <p className="text-[11px] text-amber-300/80">
                    All modifications will be recorded in the audit trail while preserving the serial ID.
                  </p>
                </div>
              </div>
              {onCancelEdit && (
                <button
                  onClick={onCancelEdit}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          )}

          {/* Form Header */}
          <div className="pb-6 border-b border-white/[0.08] mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-slate-300 text-[10px] font-bold tracking-widest uppercase mb-2">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>{receiptToEdit ? 'Modify Existing Receipt' : 'New Receipt Entry'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-b from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                {receiptToEdit ? 'Correct Receipt Particulars' : 'Issue Donation Receipt'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Compliant with Section 80G statutory donation documentation.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* ROW 1: Receipt Date & Receipt Mail */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
          
          {/* Default Date (defaults to today) */}
          <div className="sm:col-span-5">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Receipt Date *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-white text-xs font-semibold font-mono tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none focus:border-amber-400/50 focus:bg-white/[0.07] transition"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Defaults to current date
            </span>
          </div>

          {/* Receipt Mail Dropdown (After Date) - Default: accounts@thaibagarden.com */}
          <div className="sm:col-span-7">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Receipt Mail (Send PDF) *
              </label>
              <span className="text-[10px] text-teal-400 font-bold">
                PDF Dispatch Destination
              </span>
            </div>
            <div className="relative">
              <select
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#141822] border border-white/10 text-white text-xs sm:text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none focus:border-amber-400/50 transition appearance-none cursor-pointer pr-10"
              >
                {DEFAULT_RECEIPT_EMAILS.map((email) => (
                  <option key={email} value={email} className="bg-[#141822] text-white py-1">
                    {email} {email === 'accounts@thaibagarden.com' ? '(Default)' : ''}
                  </option>
                ))}
                {donorEmail && !DEFAULT_RECEIPT_EMAILS.includes(donorEmail as any) && (
                  <option value={donorEmail} className="bg-[#141822] text-white py-1">
                    {donorEmail} (Custom)
                  </option>
                )}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Default recipient for email dispatch with PDF receipt attached
            </span>
          </div>

        </div>

        {/* ROW 2: Donor Full Name */}
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Donor Full Name *
            </label>
            {templates.length > 0 && (
              <button
                type="button"
                onClick={onOpenTemplatesModal}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none rounded px-1"
              >
                <Bookmark className="w-3 h-3" />
                <span>Templates ({templates.length})</span>
              </button>
            )}
          </div>

          <input
            type="text"
            required
            value={donorName}
            onChange={(e) => {
              setDonorName(e.target.value);
              setShowTemplateDropdown(true);
            }}
            onFocus={() => setShowTemplateDropdown(true)}
            placeholder="Donor Full Name"
            className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-white text-sm font-bold placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none focus:border-amber-400/50 focus:bg-white/[0.07] transition"
          />

            {/* Recurring Donor Autocomplete Dropdown */}
            {showTemplateDropdown && matchingTemplates.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#0f131a] border border-white/15 rounded-2xl shadow-2xl z-30 p-2 overflow-hidden backdrop-blur-xl">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Saved Recurring Donors</span>
                  <button onClick={() => setShowTemplateDropdown(false)} className="text-slate-400 hover:text-white">✕</button>
                </div>
                {matchingTemplates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => loadFromTemplate(t)}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/[0.08] flex items-center justify-between transition cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{t.donorName}</div>
                      <div className="text-[11px] text-slate-400">{t.defaultPurpose}</div>
                    </div>
                    <span className="text-xs font-mono tabular-nums font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                      {t.defaultCurrency} {t.defaultAmount.toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

        {/* ROW 2: Currency, Amount & Indian Value */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            
            {/* Change 2: Currency: Only INR, USD, OMR, QAR... and "+ Add Custom Currency" */}
            <div className="sm:col-span-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Currency
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddCurrencyModal(true)}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-0.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none rounded px-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>New</span>
                </button>
              </div>

              <select
                value={currency}
                onChange={(e) => handleCurrencySelect(e.target.value)}
                aria-label="Currency Code"
                className="w-full px-3 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-white text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none focus:border-amber-400/50 cursor-pointer"
              >
                {currenciesList.map((c) => (
                  <option key={c} value={c} className="bg-[#0f131a] text-white">
                    {c}
                  </option>
                ))}
                <option value="__ADD_NEW__" className="bg-[#0f131a] text-amber-400 font-bold">
                  + Add Custom Currency...
                </option>
              </select>
            </div>

            {/* Donation Amount */}
            <div className={showIndianValue ? 'sm:col-span-4' : 'sm:col-span-8'}>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Donation Amount *
                </label>
                {!showIndianValue && (
                  <button
                    type="button"
                    onClick={() => setShowIndianValue(true)}
                    className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Open Indian Value</span>
                  </button>
                )}
              </div>
              <input
                type="number"
                step="any"
                required
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                placeholder="Amount"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-base font-black text-white font-mono tabular-nums placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none focus:border-amber-400/50 transition"
              />
            </div>

            {/* Indian Value (INR) - Collapsible Open/Hide */}
            {showIndianValue && (
              <div className="sm:col-span-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Indian Value (INR)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowIndianValue(false)}
                    className="text-[10px] font-semibold text-slate-400 hover:text-amber-400 cursor-pointer transition"
                  >
                    Hide
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-500">₹</span>
                  <input
                    type="number"
                    step="any"
                    value={indianValue}
                    onChange={(e) => setIndianValue(e.target.value)}
                    placeholder="Indian Value"
                    className="w-full pl-8 pr-4 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-base font-black text-amber-300 font-mono tabular-nums placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none focus:border-amber-400/50 transition"
                  />
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ROW 3: Purpose & Payment Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          
          {/* Purpose */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Donation Purpose *
            </label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              aria-label="Donation Purpose"
              className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-white text-xs font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none focus:border-amber-400/50 cursor-pointer"
            >
              {purposesList.map((p) => (
                <option key={p} value={p} className="bg-[#0f131a] text-white">{p}</option>
              ))}
              <option value="Other / Custom" className="bg-[#0f131a] text-amber-400 font-bold">Other / Custom Purpose...</option>
            </select>

            {purpose === 'Other / Custom' && (
              <input
                type="text"
                value={customPurpose}
                onChange={(e) => setCustomPurpose(e.target.value)}
                placeholder="Specify specific cause or fund"
                className="w-full mt-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none focus:border-amber-400/50 transition"
              />
            )}
          </div>

          {/* Payment Method & Ref */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Payment Method & Reference
            </label>
            <div className="flex gap-2">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                aria-label="Payment Mode"
                className="w-44 px-3 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-white text-xs font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none focus:border-amber-400/50 cursor-pointer"
              >
                <option value="Bank" className="bg-[#0f131a] text-white">Bank</option>
                <option value="Bank Transfer" className="bg-[#0f131a] text-white">Bank Transfer</option>
                <option value="UPI / Online" className="bg-[#0f131a] text-white">UPI / Online</option>
                <option value="Cash" className="bg-[#0f131a] text-white">Cash</option>
                <option value="Cheque" className="bg-[#0f131a] text-white">Cheque</option>
                <option value="Card" className="bg-[#0f131a] text-white">Card</option>
                <option value="Direct Debit" className="bg-[#0f131a] text-white">Direct Debit</option>
              </select>

              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Txn ID / Cheque #"
                className="flex-1 px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-white text-xs font-mono font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none focus:border-amber-400/50 transition"
              />
            </div>
          </div>

        </div>

        {/* ROW 4: Optional Donor Details (Phone, Email, PAN for 80G) - Collapsible Open/Hide */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden transition-all duration-200">
          <button
            type="button"
            onClick={() => setShowDonorContactDetails((prev) => !prev)}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/[0.04] transition cursor-pointer select-none group"
          >
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-white/5 text-slate-400 group-hover:text-white transition">
                {showDonorContactDetails ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </span>
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Optional Donor Details (WhatsApp Phone, Email, PAN)
              </span>
              {(donorPhone || (donorEmail && !DEFAULT_RECEIPT_EMAILS.includes(donorEmail as any)) || donorPAN) && !showDonorContactDetails && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Filled
                </span>
              )}
            </div>
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-amber-400 transition">
              {showDonorContactDetails ? 'Hide' : 'Open'}
            </span>
          </button>

          {showDonorContactDetails && (
            <div className="p-4 pt-1 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in duration-150">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  WhatsApp Phone
                </label>
                <input
                  type="tel"
                  value={donorPhone}
                  onChange={(e) => setDonorPhone(e.target.value)}
                  placeholder="+91 8129755155"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs font-mono font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none focus:border-amber-400/50 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Custom / Alternate Email
                </label>
                <input
                  type="email"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  placeholder="custom@thaiba.org"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none focus:border-amber-400/50 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Donor PAN (for 80G Exemption)
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={donorPAN}
                  onChange={(e) => setDonorPAN(e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs font-mono font-bold uppercase focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none focus:border-amber-400/50 transition"
                />
              </div>
            </div>
          )}
        </div>

        {/* Correction Audit Note (Only if Editing) */}
        {receiptToEdit && (
          <div>
            <label className="block text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-2">
              Reason for Correction (Recorded in Audit Trail) *
            </label>
            <input
              type="text"
              required
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              placeholder="Corrected spelling of donor name or particulars"
              className="w-full px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-medium focus:outline-none focus:border-amber-400 transition"
            />
          </div>
        )}

        {/* Feature Checkboxes: Recurring Template & WhatsApp Placeholder */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/[0.08]">
          <div className="space-y-2">
            {!receiptToEdit && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveAsTemplate}
                  onChange={(e) => setSaveAsTemplate(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-white/20 bg-white/10 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-300">
                  Save as recurring donor template for 1-click future receipts
                </span>
              </label>
            )}

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={queueWhatsApp}
                onChange={(e) => setQueueWhatsApp(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-white/20 bg-white/10 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <span>Queue for automatic WhatsApp dispatch</span>
                <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/25 px-2 py-0.2 rounded-full">
                  Placeholder
                </span>
              </span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            {receiptToEdit && onCancelEdit && (
              <button
                type="button"
                onClick={onCancelEdit}
                className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none cursor-pointer"
              >
                Cancel
              </button>
            )}

            {/* Submit Button with short word matching user request */}
            <button
              type="submit"
              className="w-full sm:w-auto py-3.5 px-8 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 text-sm font-black shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none cursor-pointer"
            >
              <Save className="w-4 h-4 text-slate-950" />
              <span>{receiptToEdit ? 'Update' : 'Submit'}</span>
            </button>
          </div>
        </div>

      </form>

      {/* Add Custom Currency Modal */}
      {showAddCurrencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#11141c] rounded-3xl max-w-sm w-full p-6 border border-white/15 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Add Custom Currency Code</span>
            </h3>
            <p className="text-xs text-slate-400">
              Enter 3-letter currency abbreviation (e.g. MYR, CAD, SGD, JPY).
            </p>
            <form onSubmit={handleSaveCustomCurrency} className="space-y-4">
              <input
                type="text"
                required
                maxLength={5}
                value={newCurrencyInput}
                onChange={(e) => setNewCurrencyInput(e.target.value.toUpperCase())}
                placeholder="Currency Code (e.g. SGD)"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/15 text-white font-mono font-bold text-sm uppercase focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none focus:border-amber-400"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCurrencyModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-xs font-black shadow-md transition focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                >
                  Add Currency
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

        </div>
      )}

      {/* =========================================================================
          RECENT 6 ISSUED RECEIPTS (STAFF QUICK PDF DOWNLOAD & SHARE)
          ========================================================================= */}
      <div className="bg-white/[0.04] backdrop-blur-2xl rounded-3xl p-6 sm:p-7 border border-white/[0.09] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] space-y-5">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center justify-center font-bold shadow-inner shrink-0">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-white">Recent Issued Receipts</h3>
                <span className="text-[10px] font-mono tabular-nums px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold uppercase">
                  Latest {recentSixReceipts.length}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Instant A5 PDF download, view & WhatsApp sharing for staff — no need to navigate to the Ledger page.
              </p>
            </div>
          </div>
        </div>

        {/* List of 6 Recent Receipts */}
        {recentSixReceipts.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs bg-black/20 rounded-2xl border border-white/5">
            No receipts issued yet. Once you submit a receipt, it will appear here with an instant PDF download button.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {recentSixReceipts.map((r) => {
              const isNonInr = r.currency !== 'INR' && r.indianValue && r.indianValue > 0;
              const isDownloading = downloadingReceiptId === r.id;

              return (
                <div
                  key={r.id}
                  className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-amber-500/30 rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between gap-3 group relative overflow-hidden"
                >
                  {/* Card Header: Receipt Number & Date */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono tabular-nums text-xs font-black text-amber-300 bg-amber-500/15 border border-amber-500/25 px-2.5 py-0.5 rounded-lg flex items-center gap-1 shadow-xs">
                      #{r.receiptNo}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 font-mono tabular-nums">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{formatShortDate(r.date)}</span>
                    </span>
                  </div>

                  {/* Donor Info & Amount */}
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-white truncate" title={r.donorName}>
                      {r.donorName}
                    </h4>
                    
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-mono tabular-nums text-base font-black text-white">
                        {r.currency} {r.donationAmount.toLocaleString()}
                      </span>
                      {isNonInr && (
                        <span className="font-mono tabular-nums text-[11px] font-bold text-amber-300">
                          (₹ {r.indianValue?.toLocaleString('en-IN')})
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5" title={r.purpose}>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 shrink-0"></span>
                      <span className="truncate">{r.purpose}</span>
                    </div>

                    <div className="text-[10px] text-slate-500 font-medium">
                      Mode: {r.paymentMethod}
                    </div>
                  </div>

                  {/* Actions Bar: Download PDF, View, WhatsApp */}
                  <div className="pt-2 border-t border-white/[0.06] flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDownloadPDF(r)}
                      disabled={isDownloading}
                      aria-label={`Download PDF for receipt #${r.receiptNo} of ${r.donorName}`}
                      className="flex-1 min-h-[38px] py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 active:scale-[0.98] text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                      title={`Download official A5 PDF for ${r.receiptNo}`}
                    >
                      <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{isDownloading ? 'Generating...' : 'Download PDF'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onViewReceipt?.(r, false)}
                      aria-label={`View receipt #${r.receiptNo} of ${r.donorName}`}
                      className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl bg-white/[0.06] hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none cursor-pointer"
                      title="View Receipt & Print"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShareWhatsApp(r)}
                      aria-label={`Share receipt #${r.receiptNo} of ${r.donorName} on WhatsApp`}
                      className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/25 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none cursor-pointer"
                      title={r.donorPhone ? `Send WhatsApp to ${r.donorPhone}` : 'Share Receipt via WhatsApp'}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}
