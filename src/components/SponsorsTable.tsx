'use client';

import React, { useState, useMemo } from 'react';
import { Sponsor, LanguageCode, SponsorStatus, ReminderFrequency } from '@/types';
import { useRole } from '@/context/RoleContext';
import { CATEGORIES, LANGUAGES, REMINDER_FREQUENCIES } from '@/lib/constants';
import { generateWhatsAppMessage, getWhatsAppUrl } from '@/lib/whatsapp';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  ArrowUpDown, 
  MessageSquare, 
  Edit2, 
  Trash2, 
  CheckSquare, 
  Square, 
  ChevronRight, 
  Globe, 
  Calendar, 
  DollarSign,
  AlertCircle
} from 'lucide-react';

interface SponsorsTableProps {
  sponsors: Sponsor[];
  onAddNew: () => void;
  onEdit: (sponsor: Sponsor) => void;
  onDelete: (id: string) => void;
  onQuickIssueReceipt: (sponsor: Sponsor) => void;
}

type SortField = 'name' | 'pledgedAmount' | 'nextDueDate' | 'status' | 'category';
type SortOrder = 'asc' | 'desc';

export function SponsorsTable({
  sponsors,
  onAddNew,
  onEdit,
  onDelete,
  onQuickIssueReceipt,
}: SponsorsTableProps) {
  const { permissions } = useRole();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [languageFilter, setLanguageFilter] = useState<string>('All');
  const [frequencyFilter, setFrequencyFilter] = useState<string>('All');
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filtering & Sorting Logic
  const filteredSponsors = useMemo(() => {
    return sponsors
      .filter((s) => {
        // Search term
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matches =
            s.name.toLowerCase().includes(q) ||
            s.phone.includes(q) ||
            s.fullPhone.includes(q) ||
            s.category.toLowerCase().includes(q) ||
            (s.notes && s.notes.toLowerCase().includes(q));
          if (!matches) return false;
        }

        // Status
        if (statusFilter !== 'All' && s.status !== statusFilter) return false;

        // Category
        if (categoryFilter !== 'All' && s.category !== categoryFilter) return false;

        // Language
        if (languageFilter !== 'All' && s.language !== languageFilter) return false;

        // Frequency
        if (frequencyFilter !== 'All' && s.reminderFrequency !== frequencyFilter) return false;

        return true;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (sortField === 'pledgedAmount') {
          valA = a.pledgedAmount;
          valB = b.pledgedAmount;
        } else if (sortField === 'nextDueDate') {
          valA = new Date(a.nextDueDate || '1970-01-01').getTime();
          valB = new Date(b.nextDueDate || '1970-01-01').getTime();
        } else {
          valA = (valA || '').toString().toLowerCase();
          valB = (valB || '').toString().toLowerCase();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [sponsors, searchTerm, statusFilter, categoryFilter, languageFilter, frequencyFilter, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Select all handler
  const handleSelectAll = () => {
    if (selectedIds.length === filteredSponsors.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSponsors.map((s) => s.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Export to CSV formatted for Excel (with UTF-8 BOM for Malayalam/Arabic)
  const exportToCSV = () => {
    const listToExport = selectedIds.length > 0
      ? filteredSponsors.filter((s) => selectedIds.includes(s.id))
      : filteredSponsors;

    const headers = [
      'Sponsor Name',
      'Country Code',
      'Phone Number',
      'Full International Phone',
      'Email',
      'Language',
      'Payment Mode',
      'Reminder Frequency',
      'Reminder Day',
      'Category / Purpose',
      'Pledged Amount',
      'Currency',
      'Status',
      'Next Due Date',
      'Notes',
    ];

    const rows = listToExport.map((s) => [
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.countryCode}"`,
      `"${s.phone}"`,
      `"${s.fullPhone}"`,
      `"${s.email || ''}"`,
      `"${s.language}"`,
      `"${s.paymentMode}"`,
      `"${s.reminderFrequency}"`,
      s.reminderDay,
      `"${s.category.replace(/"/g, '""')}"`,
      s.pledgedAmount,
      `"${s.currency}"`,
      `"${s.status}"`,
      `"${s.nextDueDate || ''}"`,
      `"${(s.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Sponsors_Directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger single WhatsApp reminder
  const sendWhatsAppReminder = (s: Sponsor) => {
    const message = generateWhatsAppMessage({
      type: 'reminder_due',
      language: s.language,
      name: s.name,
      amount: s.pledgedAmount,
      currency: s.currency,
      category: s.category,
      dueDate: s.nextDueDate || new Date().toLocaleDateString('en-GB'),
    });

    const url = getWhatsAppUrl(s.countryCode, s.phone, message);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      
      {/* Top Bar: Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Consolidated Sponsor Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Excel-grade spreadsheet view with search, multi-column filters, and automated WhatsApp triggers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Export to CSV Button */}
          <button
            onClick={exportToCSV}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold shadow-xs flex items-center gap-2 transition cursor-pointer"
            title="Download formatted CSV spreadsheet for Microsoft Excel"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export to Excel ({selectedIds.length > 0 ? selectedIds.length : filteredSponsors.length})</span>
          </button>

          {/* Add New Sponsor Button */}
          {permissions.canCreateSponsor && (
            <button
              onClick={onAddNew}
              className="px-4 py-2.5 rounded-xl bg-[#0B1320] hover:bg-slate-800 text-white text-xs font-bold shadow-md shadow-slate-900/10 flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Add Sponsor</span>
            </button>
          )}
        </div>
      </div>

      {/* Excel Toolbar & Multi-Filter Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search sponsor name, phone (+91/etc), category, remarks..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by Status"
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Overdue">Overdue</option>
              <option value="Paused">Paused</option>
              <option value="Completed">Completed</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by Category"
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer max-w-[150px] truncate"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Language Filter */}
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              aria-label="Filter by Language"
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="All">All Languages</option>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>

            {/* Frequency Filter */}
            <select
              value={frequencyFilter}
              onChange={(e) => setFrequencyFilter(e.target.value)}
              aria-label="Filter by Frequency"
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="All">All Schedules</option>
              {REMINDER_FREQUENCIES.map((rf) => (
                <option key={rf} value={rf}>{rf}</option>
              ))}
            </select>

            {/* Density switch */}
            <div className="hidden sm:flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5">
              <button
                onClick={() => setDensity('comfortable')}
                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition ${
                  density === 'comfortable' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
                }`}
              >
                Normal
              </button>
              <button
                onClick={() => setDensity('compact')}
                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition ${
                  density === 'compact' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
                }`}
              >
                Compact
              </button>
            </div>

          </div>
        </div>

        {/* Selected Rows Action Pill */}
        {selectedIds.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs text-emerald-800">
            <span className="font-bold">
              {selectedIds.length} sponsor{selectedIds.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={exportToCSV}
                className="px-3 py-1 bg-white hover:bg-emerald-100 rounded-lg font-bold border border-emerald-300 text-emerald-800 transition"
              >
                Export Selected ({selectedIds.length})
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="px-2 py-1 text-emerald-700 hover:text-emerald-900 font-semibold"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Spreadsheet Data Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            
            {/* Table Header (Excel style) */}
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
                <th className="py-3.5 px-4 w-10 text-center">
                  <button 
                    onClick={handleSelectAll} 
                    aria-label="Select all sponsors" 
                    className="cursor-pointer text-slate-400 hover:text-slate-600"
                  >
                    {selectedIds.length === filteredSponsors.length && filteredSponsors.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>

                <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900" onClick={() => toggleSort('name')}>
                  <div className="flex items-center gap-1.5">
                    <span>Sponsor Name</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>

                <th className="py-3.5 px-4">WhatsApp Contact</th>

                <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900" onClick={() => toggleSort('category')}>
                  <div className="flex items-center gap-1.5">
                    <span>Category / Purpose</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>

                <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900 text-right" onClick={() => toggleSort('pledgedAmount')}>
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Pledged Amount</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>

                <th className="py-3.5 px-4">Schedule & Mode</th>

                <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900" onClick={() => toggleSort('nextDueDate')}>
                  <div className="flex items-center gap-1.5">
                    <span>Next Due</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>

                <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900" onClick={() => toggleSort('status')}>
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>

                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>

            {/* Table Rows */}
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredSponsors.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    No sponsors match the current search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredSponsors.map((s) => {
                  const isSelected = selectedIds.includes(s.id);
                  const isOverdue = s.status === 'Overdue';
                  const rowPadding = density === 'compact' ? 'py-2 px-4' : 'py-3.5 px-4';

                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-slate-50/70 transition group ${
                        isSelected ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className={`${rowPadding} text-center`}>
                        <button
                          onClick={() => toggleSelectOne(s.id)}
                          aria-label={`Select ${s.name}`}
                          className="cursor-pointer text-slate-400 hover:text-slate-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Sponsor Name & Email */}
                      <td className={rowPadding}>
                        <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition">
                          {s.name}
                        </div>
                        {s.email && (
                          <div className="text-[11px] text-slate-400 font-normal truncate max-w-[180px]">
                            {s.email}
                          </div>
                        )}
                      </td>

                      {/* Phone & Language */}
                      <td className={rowPadding}>
                        <div className="font-mono font-medium text-slate-800">
                          {s.countryCode} {s.phone}
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5 flex items-center gap-1">
                          <Globe className="w-3 h-3 text-slate-400" />
                          <span>Lang: {s.language.toUpperCase()}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className={rowPadding}>
                        <span className="font-semibold text-slate-800">
                          {s.category}
                        </span>
                      </td>

                      {/* Pledged Amount */}
                      <td className={`${rowPadding} text-right font-mono font-bold text-slate-900`}>
                        {s.currency} {s.pledgedAmount.toLocaleString()}
                      </td>

                      {/* Schedule & Mode */}
                      <td className={rowPadding}>
                        <div className="font-medium text-slate-700">
                          {s.reminderFrequency} (Day {s.reminderDay})
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {s.paymentMode}
                        </div>
                      </td>

                      {/* Next Due Date */}
                      <td className={rowPadding}>
                        <div className={`font-medium ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
                          {s.nextDueDate ? new Date(s.nextDueDate).toLocaleDateString('en-GB') : '—'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className={rowPadding}>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          s.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : s.status === 'Overdue'
                            ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                            : s.status === 'Paused'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {s.status}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className={`${rowPadding} text-center`}>
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Send WhatsApp Reminder */}
                          {permissions.canSendWhatsApp && (
                            <button
                              onClick={() => sendWhatsAppReminder(s)}
                              title={`Send WhatsApp reminder in ${s.language.toUpperCase()}`}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          )}

                          {/* Quick Issue Receipt */}
                          {permissions.canIssueReceipt && (
                            <button
                              onClick={() => onQuickIssueReceipt(s)}
                              title="Issue receipt for this sponsor"
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition"
                            >
                              Receipt
                            </button>
                          )}

                          {/* Edit Sponsor */}
                          {permissions.canEditSponsor && (
                            <button
                              onClick={() => onEdit(s)}
                              title="Edit sponsor"
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete Sponsor */}
                          {permissions.canDeleteSponsor && (
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete sponsor "${s.name}"?`)) {
                                  onDelete(s.id);
                                }
                              }}
                              title="Delete sponsor (Super Admin/Admin)"
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Directory Footer Info */}
        <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            Showing <span className="font-bold text-slate-700">{filteredSponsors.length}</span> of{' '}
            <span className="font-bold text-slate-700">{sponsors.length}</span> total registered sponsors
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> Overdue
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Paused
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}

