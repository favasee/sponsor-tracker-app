'use client';

import React, { useState, useMemo } from 'react';
import { Sponsor, LanguageCode } from '@/types';
import { LANGUAGES, DEFAULT_TEMPLATES } from '@/lib/constants';
import { generateWhatsAppMessage, getWhatsAppUrl } from '@/lib/whatsapp';
import { useRole } from '@/context/RoleContext';
import { 
  MessageSquare, 
  Send, 
  Clock, 
  CheckCircle2, 
  Globe, 
  Sparkles, 
  AlertTriangle,
  ExternalLink,
  Copy,
  ChevronRight,
  Filter
} from 'lucide-react';

interface RemindersManagerProps {
  sponsors: Sponsor[];
}

export function RemindersManager({ sponsors }: RemindersManagerProps) {
  const { permissions } = useRole();

  // Tab: 'queue' or 'templates'
  const [subTab, setSubTab] = useState<'queue' | 'templates'>('queue');
  
  // Template Preview language state
  const [activeLang, setActiveLang] = useState<LanguageCode>('ml'); // Default Malayalam for regional context
  const [sampleName, setSampleName] = useState('Anees Rahman');
  const [sampleAmount, setSampleAmount] = useState('39,600');
  const [sampleCurrency, setSampleCurrency] = useState('INR');
  const [sampleCategory, setSampleCategory] = useState('Hifzul Quran Thaqaful');

  // Filter for Queue
  const [queueFilter, setQueueFilter] = useState<'all' | 'overdue' | 'today' | 'upcoming'>('all');

  // Sent reminders tracking in session
  const [sentSponsorIds, setSentSponsorIds] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // Compute upcoming/due sponsors
  const queueList = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    return sponsors.map((s) => {
      const isOverdue = s.status === 'Overdue' || (s.nextDueDate && s.nextDueDate < today);
      const isDueToday = s.nextDueDate === today;
      return {
        sponsor: s,
        isOverdue,
        isDueToday,
      };
    }).filter((item) => {
      if (queueFilter === 'overdue') return item.isOverdue;
      if (queueFilter === 'today') return item.isDueToday;
      if (queueFilter === 'upcoming') return !item.isOverdue && !item.isDueToday;
      return true;
    });
  }, [sponsors, queueFilter]);

  // Active template preview text
  const previewReminderText = useMemo(() => {
    return generateWhatsAppMessage({
      type: 'reminder_due',
      language: activeLang,
      name: sampleName,
      amount: sampleAmount,
      currency: sampleCurrency,
      category: sampleCategory,
      dueDate: new Date().toLocaleDateString('en-GB'),
    });
  }, [activeLang, sampleName, sampleAmount, sampleCurrency, sampleCategory]);

  const previewReceiptText = useMemo(() => {
    return generateWhatsAppMessage({
      type: 'receipt',
      language: activeLang,
      name: sampleName,
      amount: sampleAmount,
      currency: sampleCurrency,
      category: sampleCategory,
      paymentMethod: 'UPI / Online',
      receiptNo: 'TH-01665',
      date: new Date().toLocaleDateString('en-GB'),
    });
  }, [activeLang, sampleName, sampleAmount, sampleCurrency, sampleCategory]);

  const dispatchReminder = (s: Sponsor) => {
    const msg = generateWhatsAppMessage({
      type: 'reminder_due',
      language: s.language,
      name: s.name,
      amount: s.pledgedAmount,
      currency: s.currency,
      category: s.category,
      dueDate: s.nextDueDate || new Date().toLocaleDateString('en-GB'),
    });

    const url = getWhatsAppUrl(s.countryCode, s.phone, msg);
    window.open(url, '_blank', 'noopener,noreferrer');

    if (!sentSponsorIds.includes(s.id)) {
      setSentSponsorIds([...sentSponsorIds, s.id]);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            WhatsApp Automation & Localization Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Dispatch multi-language payment reminders and receipts according to each sponsor&apos;s preferred language and pledge cycle.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center rounded-2xl bg-white border border-slate-200 p-1 shadow-xs">
          <button
            onClick={() => setSubTab('queue')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              subTab === 'queue' ? 'bg-[#0B1320] text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Reminder Queue ({queueList.length})
          </button>
          <button
            onClick={() => setSubTab('templates')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              subTab === 'templates' ? 'bg-[#0B1320] text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Multi-Language Templates
          </button>
        </div>
      </div>

      {subTab === 'queue' ? (
        /* ================= REMINDER QUEUE VIEW ================= */
        <div className="space-y-5">
          
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">
                Queue Filter:
              </span>
              <button
                onClick={() => setQueueFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  queueFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                All Schedules
              </button>
              <button
                onClick={() => setQueueFilter('overdue')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  queueFilter === 'overdue' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700'
                }`}
              >
                Overdue Reminders
              </button>
              <button
                onClick={() => setQueueFilter('today')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  queueFilter === 'today' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700'
                }`}
              >
                Due Today
              </button>
              <button
                onClick={() => setQueueFilter('upcoming')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  queueFilter === 'upcoming' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                Upcoming
              </button>
            </div>

            <div className="text-xs text-slate-500 font-semibold">
              Dispatched in this session: <span className="font-bold text-emerald-600">{sentSponsorIds.length}</span>
            </div>
          </div>

          {/* Queue Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {queueList.map(({ sponsor: s, isOverdue, isDueToday }) => {
              const alreadySent = sentSponsorIds.includes(s.id);

              return (
                <div
                  key={s.id}
                  className={`bg-white rounded-3xl p-6 border transition shadow-xs flex flex-col justify-between ${
                    isOverdue
                      ? 'border-rose-200 hover:border-rose-300'
                      : isDueToday
                      ? 'border-amber-200 hover:border-amber-300'
                      : 'border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <div>
                    {/* Status Pill & Language */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isOverdue
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : isDueToday
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {isOverdue ? 'Overdue Due' : isDueToday ? 'Due Today' : 'Upcoming'}
                      </span>

                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg uppercase flex items-center gap-1">
                        <Globe className="w-3 h-3 text-slate-400" />
                        {s.language.toUpperCase()}
                      </span>
                    </div>

                    {/* Sponsor Name & Pledged Amount */}
                    <h3 className="text-lg font-bold text-slate-900">{s.name}</h3>
                    <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                      {s.currency} {s.pledgedAmount.toLocaleString()}
                    </div>

                    {/* Details */}
                    <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Category:</span>
                        <span className="font-semibold text-slate-700 truncate max-w-[170px]">{s.category}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">WhatsApp:</span>
                        <span className="font-mono font-medium">{s.countryCode} {s.phone}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Schedule:</span>
                        <span className="font-medium">{s.reminderFrequency} (Day {s.reminderDay})</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Due Date:</span>
                        <span className={`font-semibold ${isOverdue ? 'text-rose-600' : 'text-slate-800'}`}>
                          {s.nextDueDate ? new Date(s.nextDueDate).toLocaleDateString('en-GB') : '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Send WhatsApp Button */}
                  <div className="pt-5 mt-4 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={!permissions.canSendWhatsApp}
                      onClick={() => dispatchReminder(s)}
                      className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                        alreadySent
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          : 'bg-[#0B1320] hover:bg-slate-800 text-white shadow-md shadow-slate-900/10'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {alreadySent ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Sent (Click to Resend)</span>
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-4 h-4 text-emerald-400" />
                          <span>Send WhatsApp ({s.language.toUpperCase()})</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      ) : (
        /* ================= MULTI-LANGUAGE TEMPLATES VIEW ================= */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Pre-Configured Multi-Language WhatsApp Templates
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Automated placeholders like {'{name}'}, {'{amount}'}, {'{category}'}, and {'{receipt_no}'} are dynamically filled upon message creation.
            </p>
          </div>

          {/* Language Selector Tabs */}
          <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-100">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setActiveLang(l.code)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeLang === l.code
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {l.name} ({l.native})
              </button>
            ))}
          </div>

          {/* Interactive Preview of Both Templates */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Template 1: Receipt Confirmation */}
            <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
                    1. Receipt Confirmation Template
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Dispatched on Receipt Issue
                  </span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed shadow-xs">
                  {previewReceiptText}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end">
                <button
                  onClick={() => copyText(previewReceiptText)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied!' : 'Copy Template'}</span>
                </button>
              </div>
            </div>

            {/* Template 2: Scheduled Due Reminder */}
            <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
                    2. Scheduled Due Reminder Template
                  </span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                    Dispatched on Due Date
                  </span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed shadow-xs">
                  {previewReminderText}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end">
                <button
                  onClick={() => copyText(previewReminderText)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied!' : 'Copy Template'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

