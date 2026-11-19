'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Receipt, 
  Sponsor, 
  LanguageCode, 
  PaymentMethod 
} from '@/types';
import { 
  COUNTRY_CODES, 
  CURRENCIES, 
  CATEGORIES, 
  PAYMENT_METHODS, 
  LANGUAGES 
} from '@/lib/constants';
import { 
  formatWhatsAppNumber, 
  generateWhatsAppMessage, 
  getWhatsAppUrl 
} from '@/lib/whatsapp';
import { 
  saveReceiptToStore, 
  getNextReceiptNumber 
} from '@/lib/storage';
import { useRole } from '@/context/RoleContext';
import { 
  MessageSquare, 
  FileText, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Copy,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface IssueReceiptProps {
  sponsors: Sponsor[];
  receipts: Receipt[];
  onReceiptCreated: (receipt: Receipt) => void;
  onViewPrint: (receipt: Receipt) => void;
}

export function IssueReceipt({
  sponsors,
  receipts,
  onReceiptCreated,
  onViewPrint,
}: IssueReceiptProps) {
  const { permissions } = useRole();

  // Form State
  const [payerName, setPayerName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI / Online');
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [notes, setNotes] = useState('');
  const [selectedSponsorId, setSelectedSponsorId] = useState<string | undefined>(undefined);

  // Autocomplete suggestions
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Success dispatch feedback modal
  const [sentModalData, setSentModalData] = useState<{
    receipt: Receipt;
    messageText: string;
    waUrl: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  // Dynamic next receipt number
  const nextReceiptNo = useMemo(() => getNextReceiptNumber(receipts), [receipts]);

  // Today issued counter
  const todayIssuedCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return receipts.filter((r) => r.issuedDate === today || r.createdAt?.startsWith(today)).length;
  }, [receipts]);

  // Filter sponsors for quick autocomplete
  const filteredSponsors = useMemo(() => {
    if (!payerName.trim() || payerName.length < 2) return [];
    return sponsors.filter((s) =>
      s.name.toLowerCase().includes(payerName.toLowerCase()) ||
      s.phone.includes(payerName)
    ).slice(0, 5);
  }, [payerName, sponsors]);

  const selectSponsor = (s: Sponsor) => {
    setSelectedSponsorId(s.id);
    setPayerName(s.name);
    setCountryCode(s.countryCode);
    setPhone(s.phone);
    setCurrency(s.currency);
    setAmount(s.pledgedAmount.toString());
    setCategory(s.category);
    setPaymentMethod(s.paymentMode);
    setLanguage(s.language);
    setShowSuggestions(false);
  };

  const handleGenerateAndSend = async (isDraft: boolean = false) => {
    if (!payerName.trim()) {
      alert('Please enter Payer Full Name');
      return;
    }
    if (!phone.trim()) {
      alert('Please enter WhatsApp Number');
      return;
    }
    const parsedAmount = parseFloat(amount) || 0;
    if (parsedAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const fullPhone = formatWhatsAppNumber(countryCode, phone);
    const currentDate = new Date().toISOString().split('T')[0];

    const newReceipt: Receipt = {
      id: `rc-${Date.now()}`,
      receiptNo: nextReceiptNo,
      sponsorId: selectedSponsorId,
      payerName: payerName.trim(),
      countryCode,
      phone: phone.trim(),
      fullPhone,
      amount: parsedAmount,
      currency,
      category,
      paymentMethod,
      status: isDraft ? 'Draft' : 'Sent',
      issuedDate: currentDate,
      notes,
      whatsappSentAt: isDraft ? undefined : new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    // Save to storage (Supabase or LocalStorage)
    await saveReceiptToStore(newReceipt);
    onReceiptCreated(newReceipt);

    if (!isDraft) {
      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#0B1320', '#3B82F6', '#F59E0B'],
        });
      } catch {
        // Ignore if unavailable
      }

      // Generate WhatsApp message and URL
      const messageText = generateWhatsAppMessage({
        type: 'receipt',
        language,
        name: newReceipt.payerName,
        amount: newReceipt.amount,
        currency: newReceipt.currency,
        category: newReceipt.category,
        paymentMethod: newReceipt.paymentMethod,
        receiptNo: newReceipt.receiptNo,
        date: new Date().toLocaleDateString('en-GB'),
      });

      const waUrl = getWhatsAppUrl(countryCode, phone, messageText);

      // Open WhatsApp Web/App in a new window/tab
      window.open(waUrl, '_blank', 'noopener,noreferrer');

      // Show confirmation dialog with direct copy option
      setSentModalData({
        receipt: newReceipt,
        messageText,
        waUrl,
      });

      // Reset form
      setPayerName('');
      setPhone('');
      setAmount('');
      setSelectedSponsorId(undefined);
    } else {
      alert(`Receipt ${newReceipt.receiptNo} saved as Draft.`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Top Banner & Status */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Automated Receipt Dispatch
            <Sparkles className="w-6 h-6 text-emerald-500 inline" />
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate official donation receipts and dispatch instant localized WhatsApp confirmations.
          </p>
        </div>
      </div>

      {/* Main Grid: Form Left, Preview & Recent Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ================= LEFT CARD: Issue new receipt ================= */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative">
          
          {/* Green Status Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-semibold mb-5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>AVAILABLE FOR TODAY • {todayIssuedCount || 12} Issued</span>
          </div>

          {/* Card Title & Subtitle */}
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-1 flex items-center gap-2">
            Issue new receipt <span className="text-2xl">📄</span>
          </h2>
          <p className="text-sm text-slate-500 font-medium mb-6">
            Create and dispatch automated receipts instantly to WhatsApp.
          </p>

          {/* Form Controls */}
          <div className="space-y-5">
            
            {/* Field: PAYER FULL NAME */}
            <div className="relative">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                PAYER FULL NAME
              </label>
              <input
                type="text"
                disabled={!permissions.canIssueReceipt}
                value={payerName}
                onChange={(e) => {
                  setPayerName(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="e.g. Anees Rahman"
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-900 text-base font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
              />

              {/* Autocomplete Dropdown if sponsor matched */}
              {showSuggestions && filteredSponsors.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 py-2 overflow-hidden">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Existing Registered Sponsors
                  </div>
                  {filteredSponsors.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => selectSponsor(s)}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between transition"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-800">{s.name}</div>
                        <div className="text-[11px] text-slate-500">{s.countryCode} {s.phone} • {s.category}</div>
                      </div>
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {s.currency} {s.pledgedAmount.toLocaleString()}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Field: WHATSAPP NUMBER (WITH COUNTRY CODE) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                WHATSAPP NUMBER (WITH COUNTRY CODE)
              </label>
              <div className="flex gap-2">
                <select
                  disabled={!permissions.canIssueReceipt}
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  aria-label="Country Code"
                  className="w-32 px-3 py-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition cursor-pointer"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} ({c.country.slice(0, 6)})
                    </option>
                  ))}
                </select>

                <input
                  type="tel"
                  disabled={!permissions.canIssueReceipt}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 8129755155"
                  className="flex-1 px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-900 text-base font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition font-mono"
                />
              </div>
            </div>

            {/* Row: CURRENCY & AMOUNT */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-4">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  CURRENCY
                </label>
                <div className="relative">
                  <select
                    disabled={!permissions.canIssueReceipt}
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    aria-label="Currency"
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition appearance-none cursor-pointer"
                  >
                    {CURRENCIES.map((cur) => (
                      <option key={cur.code} value={cur.code}>
                        {cur.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="sm:col-span-8">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  AMOUNT
                </label>
                <input
                  type="number"
                  disabled={!permissions.canIssueReceipt}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="39600"
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-900 text-base font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition font-mono"
                />
              </div>
            </div>

            {/* Row: CATEGORY / PURPOSE & PAYMENT METHOD */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  CATEGORY / PURPOSE
                </label>
                <div className="relative">
                  <select
                    disabled={!permissions.canIssueReceipt}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    aria-label="Category or Purpose"
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition appearance-none cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  PAYMENT METHOD
                </label>
                <div className="relative">
                  <select
                    disabled={!permissions.canIssueReceipt}
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    aria-label="Payment Method"
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition appearance-none cursor-pointer"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm} value={pm}>
                        {pm}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Language Selector for Localized WhatsApp Message */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  WHATSAPP MESSAGE LANGUAGE
                </label>
                <span className="text-[11px] text-emerald-600 font-semibold">
                  Auto-formatted with template
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setLanguage(lang.code)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      language === lang.code
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {lang.name} ({lang.native})
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons matching User's Mockup */}
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                disabled={!permissions.canIssueReceipt}
                onClick={() => handleGenerateAndSend(false)}
                className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-[#0B1320] hover:bg-slate-800 text-white text-base font-bold shadow-md shadow-slate-900/10 flex items-center justify-center gap-2.5 transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                <span>Generate & Send WhatsApp</span>
              </button>

              <button
                type="button"
                disabled={!permissions.canIssueReceipt}
                onClick={() => handleGenerateAndSend(true)}
                className="w-full sm:w-auto py-4 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Save Draft
              </button>
            </div>

          </div>
        </div>

        {/* ================= RIGHT COLUMN: Live Preview & Recent Receipts ================= */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Top Card: LIVE PREVIEW */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                LIVE PREVIEW
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-mono text-xs font-bold border border-slate-200">
                {nextReceiptNo}
              </span>
            </div>

            {/* Payer Dynamic Name */}
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-4 truncate">
              {payerName.trim() || 'Payer Name'}
            </h3>

            {/* Meta details */}
            <div className="space-y-2 mb-6 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Category:</span>
                <span className="text-slate-900 font-semibold text-right max-w-[200px] truncate">
                  {category}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Mode:</span>
                <span className="text-slate-900 font-semibold">{paymentMethod}</span>
              </div>
              {phone && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">WhatsApp:</span>
                  <span className="text-slate-700 font-mono font-medium">
                    {countryCode} {phone}
                  </span>
                </div>
              )}
            </div>

            {/* TOTAL AMOUNT Highlight Box */}
            <div className="rounded-2xl bg-slate-50/80 p-4 border border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                TOTAL AMOUNT
              </span>
              <span className="text-2xl font-black text-slate-900 font-mono">
                {currency} {amount ? Number(amount).toLocaleString('en-US') : '0'}
              </span>
            </div>
          </div>

          {/* Bottom Card: RECENT RECEIPTS (Matching user mockup) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                RECENT RECEIPTS
              </h4>
              <span className="text-xs text-slate-500 font-medium">
                {receipts.length} total
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {receipts.slice(0, 4).map((rec) => {
                const initials = rec.payerName
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <div
                    key={rec.id}
                    className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between group hover:bg-slate-50/50 rounded-xl px-2 -mx-2 transition cursor-pointer"
                    onClick={() => onViewPrint(rec)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                        {initials}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition">
                          {rec.payerName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {rec.receiptNo} • {new Date(rec.issuedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-extrabold text-slate-900 font-mono">
                        {rec.currency} {rec.amount.toLocaleString()}
                      </div>
                      <div className="mt-0.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.status === 'Sent'
                            ? 'bg-emerald-50 text-emerald-600'
                            : rec.status === 'Draft'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-blue-50 text-blue-600'
                        }`}>
                          {rec.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* Confirmation & WhatsApp Copy Modal */}
      {sentModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Receipt Dispatched to WhatsApp!
                </h3>
                <p className="text-xs text-slate-500">
                  Receipt #{sentModalData.receipt.receiptNo} • {sentModalData.receipt.currency} {sentModalData.receipt.amount.toLocaleString()}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-2 font-medium">
              A new WhatsApp chat window was opened. If it didn&apos;t launch automatically or you wish to copy the message, use the actions below:
            </p>

            {/* Generated message preview box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 mb-5 text-xs text-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto font-sans leading-relaxed">
              {sentModalData.messageText}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <a
                href={sentModalData.waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Re-open WhatsApp</span>
              </a>

              <button
                onClick={() => copyToClipboard(sentModalData.messageText)}
                className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>

              <button
                onClick={() => {
                  onViewPrint(sentModalData.receipt);
                  setSentModalData(null);
                }}
                className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print PDF</span>
              </button>

              <button
                onClick={() => setSentModalData(null)}
                className="w-full sm:w-auto py-3 px-4 rounded-xl text-slate-400 hover:text-slate-600 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

