'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Target, 
  Coins, 
  Check, 
  Plus, 
  Trash2, 
  Edit2, 
  RotateCcw, 
  Save, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import {
  OrganizationHeaderSettings,
  DEFAULT_HEADER_SETTINGS,
  loadHeaderSettings,
  saveHeaderSettings,
  loadPurposes,
  savePurposes,
  DEFAULT_DONATION_PURPOSES,
  CurrencyConfig,
  loadCurrenciesConfig,
  saveCurrenciesConfig,
  DEFAULT_CURRENCIES
} from '@/lib/settingsStorage';

interface SettingsPageProps {
  onSettingsUpdated?: () => void;
  initialTab?: 'header' | 'purposes' | 'currency';
}

export function SettingsPage({ onSettingsUpdated, initialTab }: SettingsPageProps) {
  // Active Tab: 'header' | 'purposes' | 'currency'
  const [activeTab, setActiveTab] = useState<'header' | 'purposes' | 'currency'>(initialTab || 'header');

  // Sync activeTab when initialTab changes from parent
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // 1. Header Settings State
  const [headerSettings, setHeaderSettings] = useState<OrganizationHeaderSettings>(DEFAULT_HEADER_SETTINGS);
  const [headerSavedAlert, setHeaderSavedAlert] = useState(false);

  // 2. Purposes State
  const [purposes, setPurposes] = useState<string[]>([]);
  const [newPurposeInput, setNewPurposeInput] = useState('');
  const [editingPurposeIndex, setEditingPurposeIndex] = useState<number | null>(null);
  const [editingPurposeValue, setEditingPurposeValue] = useState('');
  const [purposeAlert, setPurposeAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // 3. Currencies State
  const [currencies, setCurrencies] = useState<CurrencyConfig[]>([]);
  const [newCurrencyCode, setNewCurrencyCode] = useState('');
  const [newCurrencyName, setNewCurrencyName] = useState('');
  const [newCurrencySymbol, setNewCurrencySymbol] = useState('');

  // Load stored configurations on mount
  useEffect(() => {
    setHeaderSettings(loadHeaderSettings());
    setPurposes(loadPurposes());
    setCurrencies(loadCurrenciesConfig());
  }, []);

  // Save Header
  const handleSaveHeader = (e: React.FormEvent) => {
    e.preventDefault();
    saveHeaderSettings(headerSettings);
    setHeaderSavedAlert(true);
    setTimeout(() => setHeaderSavedAlert(false), 2500);
    if (onSettingsUpdated) onSettingsUpdated();
  };

  const handleResetHeader = () => {
    if (confirm('Reset receipt header particulars to default Al-Huda Charitable Trust details?')) {
      setHeaderSettings(DEFAULT_HEADER_SETTINGS);
      saveHeaderSettings(DEFAULT_HEADER_SETTINGS);
      if (onSettingsUpdated) onSettingsUpdated();
    }
  };

  // Add Purpose
  const handleAddPurpose = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newPurposeInput.trim();
    if (!clean) {
      setPurposeAlert({ message: 'Please type the name of the donation purpose before clicking Add Purpose.', type: 'error' });
      setTimeout(() => setPurposeAlert(null), 3500);
      return;
    }
    if (purposes.some((p) => p.trim().toLowerCase() === clean.toLowerCase())) {
      setPurposeAlert({ message: `"${clean}" already exists in the donation purposes list.`, type: 'error' });
      setTimeout(() => setPurposeAlert(null), 3500);
      return;
    }
    // Prepend so the newly added purpose appears at the top of the list immediately
    const updated = [clean, ...purposes];
    setPurposes(updated);
    savePurposes(updated);
    setNewPurposeInput('');
    setPurposeAlert({ message: `✓ "${clean}" added to donation purposes successfully!`, type: 'success' });
    setTimeout(() => setPurposeAlert(null), 3500);
    if (onSettingsUpdated) onSettingsUpdated();
  };

  const handleDeletePurpose = (index: number) => {
    const item = purposes[index];
    if (confirm(`Remove "${item}" from donation purposes?`)) {
      const updated = purposes.filter((_, i) => i !== index);
      setPurposes(updated);
      savePurposes(updated);
      setPurposeAlert({ message: `Removed "${item}" from donation purposes.`, type: 'success' });
      setTimeout(() => setPurposeAlert(null), 3500);
      if (onSettingsUpdated) onSettingsUpdated();
    }
  };

  const handleSaveEditPurpose = (index: number) => {
    const clean = editingPurposeValue.trim();
    if (!clean) return;
    const updated = [...purposes];
    updated[index] = clean;
    setPurposes(updated);
    savePurposes(updated);
    setEditingPurposeIndex(null);
    setEditingPurposeValue('');
    setPurposeAlert({ message: `✓ Updated to "${clean}" successfully!`, type: 'success' });
    setTimeout(() => setPurposeAlert(null), 3500);
    if (onSettingsUpdated) onSettingsUpdated();
  };

  const handleResetPurposes = () => {
    if (confirm('Reset donation purposes list to default 12 Thaiba & educational causes?')) {
      setPurposes(DEFAULT_DONATION_PURPOSES);
      savePurposes(DEFAULT_DONATION_PURPOSES);
      setPurposeAlert({ message: '✓ Donation purposes reset to default 12 categories.', type: 'success' });
      setTimeout(() => setPurposeAlert(null), 3500);
      if (onSettingsUpdated) onSettingsUpdated();
    }
  };

  // Currencies Handlers
  const handleAddCurrency = (e: React.FormEvent) => {
    e.preventDefault();
    const code = newCurrencyCode.trim().toUpperCase();
    if (!code) return;
    if (currencies.some(c => c.code === code)) {
      alert(`Currency "${code}" already exists.`);
      return;
    }
    const updated: CurrencyConfig[] = [
      ...currencies,
      {
        code,
        name: newCurrencyName.trim() || code,
        symbol: newCurrencySymbol.trim() || code,
        isDefault: false,
      }
    ];
    setCurrencies(updated);
    saveCurrenciesConfig(updated);
    setNewCurrencyCode('');
    setNewCurrencyName('');
    setNewCurrencySymbol('');
    if (onSettingsUpdated) onSettingsUpdated();
  };

  const handleDeleteCurrency = (code: string) => {
    if (currencies.length <= 1) {
      alert('You must keep at least one currency configured.');
      return;
    }
    if (confirm(`Delete currency ${code}?`)) {
      const updated = currencies.filter(c => c.code !== code);
      setCurrencies(updated);
      saveCurrenciesConfig(updated);
      if (onSettingsUpdated) onSettingsUpdated();
    }
  };

  const handleSetDefaultCurrency = (code: string) => {
    const updated = currencies.map(c => ({
      ...c,
      isDefault: c.code === code,
    }));
    setCurrencies(updated);
    saveCurrenciesConfig(updated);
    if (onSettingsUpdated) onSettingsUpdated();
  };

  const handleResetCurrencies = () => {
    if (confirm('Reset currencies to default international list?')) {
      setCurrencies(DEFAULT_CURRENCIES);
      saveCurrenciesConfig(DEFAULT_CURRENCIES);
      if (onSettingsUpdated) onSettingsUpdated();
    }
  };


  return (
    <div className="max-w-4xl mx-auto space-y-8 py-2 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Receipt Settings</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Settings
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Configure receipt header details, customize donation purposes, and manage currencies.
            </p>
          </div>
        </div>

        {/* Navigation Tabs - Frosted Glass Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-6 border-t border-white/[0.08]">
          <button
            onClick={() => setActiveTab('header')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'header'
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-md font-black'
                : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] border border-white/10'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Receipt Header</span>
          </button>

          <button
            onClick={() => setActiveTab('purposes')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'purposes'
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-md font-black'
                : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] border border-white/10'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Donation Purposes ({purposes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('currency')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'currency'
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-md font-black'
                : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] border border-white/10'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Currencies ({currencies.length})</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: SET RECEIPT HEADER ================= */}
      {activeTab === 'header' && (
        <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-amber-400" />
                <span>Organization & Statutory Receipt Header</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                These values are dynamically rendered on the printed/exported classic receipt (Image 2).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetHeader}
                className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/10 text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveHeader} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Trust / Organization Name */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Trust / Organization Legal Name *
                </label>
                <input
                  type="text"
                  value={headerSettings.trustName}
                  onChange={(e) => setHeaderSettings({ ...headerSettings, trustName: e.target.value })}
                  required
                  placeholder="e.g. AL-HUDA CHARITABLE TRUST"
                  className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-white font-bold text-sm focus:outline-none focus:border-amber-400/50"
                />
              </div>

              {/* Subtitle / Category */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Tagline / Subtitle
                </label>
                <input
                  type="text"
                  value={headerSettings.tagline}
                  onChange={(e) => setHeaderSettings({ ...headerSettings, tagline: e.target.value })}
                  placeholder="e.g. CHARITABLE SOCIETY & EDUCATIONAL FOUNDATION"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-amber-400/50"
                />
              </div>

              {/* Serial Prefix */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Receipt Serial Prefix (e.g. TH)
                </label>
                <input
                  type="text"
                  value={headerSettings.serialPrefix}
                  onChange={(e) => setHeaderSettings({ ...headerSettings, serialPrefix: e.target.value.toUpperCase() })}
                  maxLength={6}
                  placeholder="e.g. TH"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-white text-xs font-mono font-bold focus:outline-none focus:border-amber-400/50"
                />
              </div>

              {/* Office Address Line 1 */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Administrative Address (Line 1) *
                </label>
                <input
                  type="text"
                  value={headerSettings.officeAddress}
                  onChange={(e) => setHeaderSettings({ ...headerSettings, officeAddress: e.target.value })}
                  required
                  placeholder="e.g. MAJHIKHANDA, TAPAN, DAKSHIN DINAJPUR"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-amber-400/50"
                />
              </div>

              {/* Office Address Line 2 */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Address (Line 2 / State / Pin)
                </label>
                <input
                  type="text"
                  value={headerSettings.officeAddressLine2 || ''}
                  onChange={(e) => setHeaderSettings({ ...headerSettings, officeAddressLine2: e.target.value })}
                  placeholder="e.g. WEST BENGAL - 733127"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-amber-400/50"
                />
              </div>

              {/* Official Email */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Official Email
                </label>
                <input
                  type="text"
                  value={headerSettings.email || ''}
                  onChange={(e) => setHeaderSettings({ ...headerSettings, email: e.target.value })}
                  placeholder="e.g. info@thaibaheritage.com"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-amber-400/50"
                />
              </div>

              {/* Official Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Official Phone / Contact
                </label>
                <input
                  type="text"
                  value={headerSettings.phone || ''}
                  onChange={(e) => setHeaderSettings({ ...headerSettings, phone: e.target.value })}
                  placeholder="e.g. +91 8129755155"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-amber-400/50"
                />
              </div>

              {/* Official Website */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Official Website
                </label>
                <input
                  type="text"
                  value={headerSettings.website || ''}
                  onChange={(e) => setHeaderSettings({ ...headerSettings, website: e.target.value })}
                  placeholder="e.g. www.thaibaheritage.com"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-amber-400/50"
                />
              </div>

              {/* Reg Number */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Trust Registration Number
                </label>
                <input
                  type="text"
                  value={headerSettings.regNumber}
                  onChange={(e) => setHeaderSettings({ ...headerSettings, regNumber: e.target.value })}
                  placeholder="e.g. TRUST/REG/8421/2012"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-white text-xs font-mono font-bold focus:outline-none focus:border-amber-400/50"
                />
              </div>

              {/* PAN Number */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Permanent Account Number (PAN)
                </label>
                <input
                  type="text"
                  value={headerSettings.panNumber}
                  onChange={(e) => setHeaderSettings({ ...headerSettings, panNumber: e.target.value.toUpperCase() })}
                  placeholder="e.g. AAETA1294F"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-white text-xs font-mono font-bold focus:outline-none focus:border-amber-400/50"
                />
              </div>

              {/* 80G Approval No */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Section 80G Tax Exemption Approval No
                </label>
                <input
                  type="text"
                  value={headerSettings.tax80GNumber}
                  onChange={(e) => setHeaderSettings({ ...headerSettings, tax80GNumber: e.target.value })}
                  placeholder="e.g. CIT(E)/80G/2018-19/A-0442"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-white text-xs font-mono font-bold focus:outline-none focus:border-amber-400/50"
                />
              </div>

              {/* Authorized Signatory */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Authorized Signatory Name
                </label>
                <input
                  type="text"
                  value={headerSettings.signatoryName}
                  onChange={(e) => setHeaderSettings({ ...headerSettings, signatoryName: e.target.value })}
                  placeholder="e.g. Ameenur Rahman"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-amber-400/50"
                />
              </div>

              {/* Signatory Designation */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Signatory Designation Title
                </label>
                <input
                  type="text"
                  value={headerSettings.signatoryTitle}
                  onChange={(e) => setHeaderSettings({ ...headerSettings, signatoryTitle: e.target.value })}
                  placeholder="e.g. AUTHORIZED SIGNATORY"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-amber-400/50"
                />
              </div>

              {/* Legal Entity Line */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Legal Entity Signatory Note
                </label>
                <input
                  type="text"
                  value={headerSettings.legalEntityNote}
                  onChange={(e) => setHeaderSettings({ ...headerSettings, legalEntityNote: e.target.value })}
                  placeholder="e.g. For Al-Huda Charitable Trust"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-amber-400/50"
                />
              </div>

            </div>

            {/* Live Header Preview Card */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                Live Receipt Header Preview:
              </span>
              <div className="p-4 bg-white text-slate-900 rounded-xl font-sans text-center border border-slate-300 shadow-inner">
                <h3 className="text-xl font-extrabold uppercase leading-tight" style={{ color: '#0284c7' }}>
                  {headerSettings.trustName}
                </h3>
                <h4 className="text-lg font-extrabold uppercase leading-tight mt-0.5" style={{ color: '#00a896' }}>
                  {headerSettings.tagline}
                </h4>
                <p className="text-[11px] font-bold text-slate-800 mt-1">
                  {headerSettings.officeAddress} {headerSettings.officeAddressLine2 ? `• ${headerSettings.officeAddressLine2}` : ''}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] text-slate-600 mt-1 font-semibold">
                  {headerSettings.email && <span>{headerSettings.email}</span>}
                  {headerSettings.phone && <span>• Ph: {headerSettings.phone}</span>}
                  {headerSettings.website && <span>• {headerSettings.website}</span>}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
              {headerSavedAlert ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                  <Check className="w-4 h-4" />
                  <span>Header settings saved successfully!</span>
                </span>
              ) : (
                <span className="text-xs text-slate-400">All fields save to persistent storage.</span>
              )}

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 text-xs font-black shadow-lg flex items-center gap-2 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Header Details</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= TAB 2: DONATION PURPOSES ================= */}
      {activeTab === 'purposes' && (
        <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" />
                <span>Donation Purpose Categories</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage the selectable donation causes available on the receipt issuance form and templates.
              </p>
            </div>

            <button
              onClick={handleResetPurposes}
              className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/10 text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>

          {/* Add New Purpose Form */}
          <form onSubmit={handleAddPurpose} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={newPurposeInput}
                onChange={(e) => {
                  setNewPurposeInput(e.target.value);
                  if (purposeAlert) setPurposeAlert(null);
                }}
                placeholder="Enter new donation purpose (e.g. Winter Warmth Blankets, Dialysis Aid)..."
                className="flex-1 px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-white text-xs font-semibold placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:bg-white/[0.07] transition"
              />
              <button
                type="submit"
                onClick={handleAddPurpose}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Purpose</span>
              </button>
            </div>

            {/* Purpose Alert / Feedback message */}
            {purposeAlert && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150 ${
                  purposeAlert.type === 'success'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                }`}
              >
                {purposeAlert.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{purposeAlert.message}</span>
              </div>
            )}
          </form>

          {/* Purposes List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {purposes.map((p, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.08] transition group"
              >
                {editingPurposeIndex === idx ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editingPurposeValue}
                      onChange={(e) => setEditingPurposeValue(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-white/10 border border-amber-400 text-white text-xs font-medium focus:outline-none"
                    />
                    <button
                      onClick={() => handleSaveEditPurpose(idx)}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingPurposeIndex(null)}
                      className="px-2 py-1.5 rounded-xl bg-white/10 text-slate-400 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-lg bg-amber-500/10 text-amber-400 font-mono text-[10px] font-black flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-200">
                        {p}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                      <button
                        onClick={() => {
                          setEditingPurposeIndex(idx);
                          setEditingPurposeValue(p);
                        }}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-amber-300 transition"
                        title="Edit Purpose"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePurpose(idx)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                        title="Delete Purpose"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 3: CURRENCIES ================= */}
      {activeTab === 'currency' && (
        <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>Accepted Currency Portfolio</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure international donation currencies (INR, USD, OMR, QAR, AED, etc.) and set the default currency.
              </p>
            </div>

            <button
              onClick={handleResetCurrencies}
              className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/10 text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>

          {/* Add New Currency Form */}
          <form onSubmit={handleAddCurrency} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white/[0.02] p-4 rounded-2xl border border-white/[0.06]">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Currency Code (ISO) *
              </label>
              <input
                type="text"
                value={newCurrencyCode}
                onChange={(e) => setNewCurrencyCode(e.target.value.toUpperCase())}
                maxLength={4}
                required
                placeholder="e.g. BHD, CAD"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs font-mono font-bold focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Currency Full Name
              </label>
              <input
                type="text"
                value={newCurrencyName}
                onChange={(e) => setNewCurrencyName(e.target.value)}
                placeholder="e.g. Bahraini Dinar"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Symbol / Prefix
              </label>
              <input
                type="text"
                value={newCurrencySymbol}
                onChange={(e) => setNewCurrencySymbol(e.target.value)}
                placeholder="e.g. BD, $"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Currency</span>
              </button>
            </div>
          </form>

          {/* Currencies Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {currencies.map((c) => (
              <div
                key={c.code}
                className={`p-4 rounded-2xl border transition flex items-center justify-between ${
                  c.isDefault
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.04]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-black text-white">
                      {c.code}
                    </span>
                    <span className="text-xs font-bold text-amber-400 bg-white/10 px-1.5 py-0.5 rounded">
                      {c.symbol}
                    </span>
                    {c.isDefault && (
                      <span className="text-[9px] font-bold bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded uppercase">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">
                    {c.name}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {!c.isDefault && (
                    <button
                      onClick={() => handleSetDefaultCurrency(c.code)}
                      className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold text-slate-300 transition"
                      title="Set as Default Currency"
                    >
                      Make Default
                    </button>
                  )}
                  {currencies.length > 1 && (
                    <button
                      onClick={() => handleDeleteCurrency(c.code)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                      title="Delete Currency"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


    </div>
  );
}
