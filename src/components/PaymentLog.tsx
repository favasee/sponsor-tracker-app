'use client';

import React, { useState, useMemo } from 'react';
import { Receipt } from '@/types';
import { useRole } from '@/context/RoleContext';
import { 
  Receipt as ReceiptIcon, 
  Search, 
  Calendar, 
  Download, 
  Printer, 
  MessageSquare, 
  Filter, 
  DollarSign, 
  CheckCircle2, 
  Trash2,
  ExternalLink
} from 'lucide-react';
import { getWhatsAppUrl, generateWhatsAppMessage } from '@/lib/whatsapp';

interface PaymentLogProps {
  receipts: Receipt[];
  onViewPrint: (receipt: Receipt) => void;
  onDeleteReceipt?: (id: string) => void;
}

export function PaymentLog({
  receipts,
  onViewPrint,
  onDeleteReceipt,
}: PaymentLogProps) {
  const { permissions } = useRole();

  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('All');
  const [currencyFilter, setCurrencyFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Filtered Receipts
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          r.payerName.toLowerCase().includes(q) ||
          r.receiptNo.toLowerCase().includes(q) ||
          r.phone.includes(q) ||
          r.category.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (methodFilter !== 'All' && r.paymentMethod !== methodFilter) return false;
      if (currencyFilter !== 'All' && r.currency !== currencyFilter) return false;
      if (statusFilter !== 'All' && r.status !== statusFilter) return false;
      return true;
    });
  }, [receipts, searchTerm, methodFilter, currencyFilter, statusFilter]);

  // Aggregate stats
  const totalAmount = useMemo(() => {
    return filteredReceipts.reduce((sum, r) => sum + r.amount, 0);
  }, [filteredReceipts]);

  // Export to CSV
  const exportReceiptsCSV = () => {
    const headers = [
      'Receipt No',
      'Payer Full Name',
      'Country Code',
      'Phone Number',
      'Full Phone',
      'Amount',
      'Currency',
      'Category',
      'Payment Method',
      'Status',
      'Issued Date',
      'WhatsApp Dispatched',
    ];

    const rows = filteredReceipts.map((r) => [
      `"${r.receiptNo}"`,
      `"${r.payerName.replace(/"/g, '""')}"`,
      `"${r.countryCode}"`,
      `"${r.phone}"`,
      `"${r.fullPhone}"`,
      r.amount,
      `"${r.currency}"`,
      `"${r.category.replace(/"/g, '""')}"`,
      `"${r.paymentMethod}"`,
      `"${r.status}"`,
      `"${r.issuedDate}"`,
      `"${r.whatsappSentAt || 'No'}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Payment_Receipts_Log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reSendWhatsApp = (r: Receipt) => {
    const msg = generateWhatsAppMessage({
      type: 'receipt',
      language: 'en',
      name: r.payerName,
      amount: r.amount,
      currency: r.currency,
      category: r.category,
      paymentMethod: r.paymentMethod,
      receiptNo: r.receiptNo,
      date: new Date(r.issuedDate).toLocaleDateString('en-GB'),
    });

    const url = getWhatsAppUrl(r.countryCode, r.phone, msg);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Payment Received & Receipts Log
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Historical audit log of all issued receipts, amounts, payment dates, and payment methods.
          </p>
        </div>

        <button
          onClick={exportReceiptsCSV}
          className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold shadow-xs flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          <span>Export Receipts to CSV</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Filtered Collections
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-1">
            {filteredReceipts[0]?.currency || 'INR'} {totalAmount.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Across {filteredReceipts.length} recorded receipts
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Receipts Issued
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-1">
            {receipts.length}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official sequential records
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            WhatsApp Delivery Rate
          </span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono mt-1">
            {receipts.length > 0
              ? `${Math.round((receipts.filter((r) => r.status === 'Sent').length / receipts.length) * 100)}%`
              : '100%'}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Instant digital receipts dispatched
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by payer name, receipt #, or phone..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            aria-label="Filter Payment Method"
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
          >
            <option value="All">All Methods</option>
            <option value="UPI / Online">UPI / Online</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter Receipt Status"
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Sent">Sent</option>
            <option value="Draft">Draft</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Receipts List Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
                <th className="py-3.5 px-5">Receipt #</th>
                <th className="py-3.5 px-5">Payer Name</th>
                <th className="py-3.5 px-5">Payment Method & Category</th>
                <th className="py-3.5 px-5 text-right">Amount Received</th>
                <th className="py-3.5 px-5">Payment Date</th>
                <th className="py-3.5 px-5">WhatsApp Status</th>
                <th className="py-3.5 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No payment receipts match the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    
                    {/* Receipt No */}
                    <td className="py-4 px-5">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                        {r.receiptNo}
                      </span>
                    </td>

                    {/* Payer Name */}
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900">{r.payerName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {r.countryCode} {r.phone}
                      </div>
                    </td>

                    {/* Method & Category */}
                    <td className="py-4 px-5">
                      <div className="font-semibold text-slate-800">{r.category}</div>
                      <div className="text-[11px] text-slate-500">{r.paymentMethod}</div>
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-5 text-right font-mono font-black text-slate-900 text-sm">
                      {r.currency} {r.amount.toLocaleString()}
                    </td>

                    {/* Date */}
                    <td className="py-4 px-5 text-slate-700 font-medium">
                      {new Date(r.issuedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>

                    {/* WhatsApp Status */}
                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        r.status === 'Sent'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : r.status === 'Draft'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {r.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onViewPrint(r)}
                          title="Print or Download Receipt PDF"
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1 transition"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print</span>
                        </button>

                        {permissions.canSendWhatsApp && (
                          <button
                            onClick={() => reSendWhatsApp(r)}
                            title="Resend WhatsApp Receipt"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {permissions.canDeleteReceipt && onDeleteReceipt && (
                          <button
                            onClick={() => {
                              if (confirm(`Delete receipt ${r.receiptNo}?`)) {
                                onDeleteReceipt(r.id);
                              }
                            }}
                            title="Delete receipt (Super Admin/Admin)"
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

