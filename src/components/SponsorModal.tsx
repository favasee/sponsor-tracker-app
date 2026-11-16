'use client';

import React, { useState, useEffect } from 'react';
import { Sponsor, LanguageCode, PaymentMethod, ReminderFrequency, SponsorStatus } from '@/types';
import { COUNTRY_CODES, CURRENCIES, CATEGORIES, PAYMENT_METHODS, REMINDER_FREQUENCIES, LANGUAGES } from '@/lib/constants';
import { formatWhatsAppNumber } from '@/lib/whatsapp';
import { X, Check, UserPlus, Save, AlertCircle } from 'lucide-react';

interface SponsorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sponsor: Sponsor) => void;
  sponsorToEdit?: Sponsor | null;
}

export function SponsorModal({
  isOpen,
  onClose,
  onSave,
  sponsorToEdit,
}: SponsorModalProps) {
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [paymentMode, setPaymentMode] = useState<PaymentMethod>('UPI / Online');
  const [reminderFrequency, setReminderFrequency] = useState<ReminderFrequency>('Monthly');
  const [reminderDay, setReminderDay] = useState<number>(1);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [pledgedAmount, setPledgedAmount] = useState<string>('');
  const [currency, setCurrency] = useState('INR');
  const [status, setStatus] = useState<SponsorStatus>('Active');
  const [nextDueDate, setNextDueDate] = useState<string>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (sponsorToEdit) {
      setName(sponsorToEdit.name);
      setCountryCode(sponsorToEdit.countryCode);
      setPhone(sponsorToEdit.phone);
      setEmail(sponsorToEdit.email || '');
      setLanguage(sponsorToEdit.language);
      setPaymentMode(sponsorToEdit.paymentMode);
      setReminderFrequency(sponsorToEdit.reminderFrequency);
      setReminderDay(sponsorToEdit.reminderDay || 1);
      setCategory(sponsorToEdit.category);
      setPledgedAmount(sponsorToEdit.pledgedAmount.toString());
      setCurrency(sponsorToEdit.currency);
      setStatus(sponsorToEdit.status);
      setNextDueDate(sponsorToEdit.nextDueDate || '');
      setNotes(sponsorToEdit.notes || '');
    } else {
      setName('');
      setCountryCode('+91');
      setPhone('');
      setEmail('');
      setLanguage('en');
      setPaymentMode('UPI / Online');
      setReminderFrequency('Monthly');
      setReminderDay(1);
      setCategory(CATEGORIES[0]);
      setPledgedAmount('');
      setCurrency('INR');
      setStatus('Active');
      // Default next due date to next month 1st
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      d.setDate(1);
      setNextDueDate(d.toISOString().split('T')[0]);
      setNotes('');
    }
  }, [sponsorToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter sponsor name');
      return;
    }
    if (!phone.trim()) {
      alert('Please enter sponsor phone number');
      return;
    }

    const fullPhone = formatWhatsAppNumber(countryCode, phone);

    const newSponsor: Sponsor = {
      id: sponsorToEdit ? sponsorToEdit.id : `sp-${Date.now()}`,
      name: name.trim(),
      countryCode,
      phone: phone.trim(),
      fullPhone,
      email: email.trim() || undefined,
      language,
      paymentMode,
      reminderFrequency,
      reminderDay: Number(reminderDay) || 1,
      category,
      pledgedAmount: parseFloat(pledgedAmount) || 0,
      currency,
      status,
      nextDueDate: nextDueDate || new Date().toISOString().split('T')[0],
      notes: notes.trim() || undefined,
      createdAt: sponsorToEdit ? sponsorToEdit.createdAt : new Date().toISOString(),
    };

    onSave(newSponsor);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-5 border-b border-slate-100 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0B1320] text-white flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {sponsorToEdit ? 'Edit Sponsor Profile' : 'Register New Sponsor'}
              </h3>
              <p className="text-xs text-slate-500">
                Configure international contact, language, and automated reminder schedule
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          
          {/* Sponsor Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Sponsor Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Anees Rahman"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sponsor@example.com"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
              />
            </div>
          </div>

          {/* International WhatsApp Phone */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              WhatsApp Phone (with Country Code) *
            </label>
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                aria-label="Modal Country Code"
                className="w-36 px-3 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition cursor-pointer"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} ({c.country.slice(0, 8)})
                  </option>
                ))}
              </select>

              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="8129755155"
                className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition font-mono"
              />
            </div>
          </div>

          {/* Pledged Amount & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-4">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                aria-label="Modal Currency"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition cursor-pointer"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-8">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Pledged Amount
              </label>
              <input
                type="number"
                value={pledgedAmount}
                onChange={(e) => setPledgedAmount(e.target.value)}
                placeholder="39600"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition font-mono"
              />
            </div>
          </div>

          {/* Category & Payment Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Donation Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Modal Category"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMethod)}
                aria-label="Modal Payment Mode"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition cursor-pointer"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reminder Frequency & Day */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Reminder Frequency
              </label>
              <select
                value={reminderFrequency}
                onChange={(e) => setReminderFrequency(e.target.value as ReminderFrequency)}
                aria-label="Modal Reminder Frequency"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition cursor-pointer"
              >
                {REMINDER_FREQUENCIES.map((rf) => (
                  <option key={rf} value={rf}>
                    {rf}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Reminder Day of Month
              </label>
              <input
                type="number"
                min={1}
                max={31}
                value={reminderDay}
                onChange={(e) => setReminderDay(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Next Due Date
              </label>
              <input
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Language Preference & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Preferred Language (for WhatsApp)
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                aria-label="Modal Language Preference"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition cursor-pointer"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name} ({l.native})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Sponsor Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SponsorStatus)}
                aria-label="Modal Sponsor Status"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition cursor-pointer"
              >
                <option value="Active">Active</option>
                <option value="Overdue">Overdue</option>
                <option value="Paused">Paused</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Internal Remarks / Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Sponsor prefers morning reminders on WhatsApp"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
            />
          </div>

          {/* Submit buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-[#0B1320] hover:bg-slate-800 text-white text-xs font-bold shadow-md shadow-slate-900/10 flex items-center gap-2 transition cursor-pointer"
            >
              <Save className="w-4 h-4 text-emerald-400" />
              <span>{sponsorToEdit ? 'Save Changes' : 'Register Sponsor'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

