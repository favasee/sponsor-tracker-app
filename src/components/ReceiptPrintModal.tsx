'use client';

import React from 'react';
import { Receipt } from '@/types';
import { X, Printer, CheckCircle2, ShieldCheck } from 'lucide-react';

interface ReceiptPrintModalProps {
  receipt: Receipt | null;
  onClose: () => void;
}

export function ReceiptPrintModal({ receipt, onClose }: ReceiptPrintModalProps) {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden print:border-none print:shadow-none print:w-full print:max-w-none">
        
        {/* Action Bar (Hidden on print) */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Official Donation Receipt
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[#0B1320] hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div className="p-8 space-y-6 text-slate-900 font-sans print:p-8">
          
          {/* Header */}
          <div className="text-center border-b border-slate-100 pb-5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-900 text-white mb-2 shadow-xs">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">
              Thaqaful Charitable Foundation
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Official Digital Donation Receipt • 80G / Tax Exempt Applicable
            </p>
          </div>

          {/* Receipt Info Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 uppercase tracking-wider font-bold block text-[10px]">
                Receipt Number
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {receipt.receiptNo}
              </span>
            </div>

            <div className="text-right">
              <span className="text-slate-400 uppercase tracking-wider font-bold block text-[10px]">
                Issued Date
              </span>
              <span className="font-bold text-slate-900 text-sm">
                {new Date(receipt.issuedDate).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Donor & Payment Details Box */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Received with thanks from:</span>
              <span className="font-bold text-slate-900 text-sm text-right">
                {receipt.payerName}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">WhatsApp Contact:</span>
              <span className="font-mono font-semibold text-slate-800">
                {receipt.countryCode} {receipt.phone}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">For Purpose / Category:</span>
              <span className="font-bold text-emerald-700 text-right">
                {receipt.category}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Payment Method:</span>
              <span className="font-semibold text-slate-800">
                {receipt.paymentMethod}
              </span>
            </div>
          </div>

          {/* Amount Box */}
          <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200 p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                Total Amount Received
              </span>
              <span className="text-xs text-emerald-700 font-medium">
                Payment verified & cleared
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-900 font-mono">
              {receipt.currency} {receipt.amount.toLocaleString()}
            </div>
          </div>

          {/* Footer & Signature Note */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <div>
              <p className="font-semibold text-slate-700">Digital Seal</p>
              <p>Generated via Thaqaful Automated System</p>
            </div>
            <div className="text-right">
              <div className="w-24 h-8 border-b border-dashed border-slate-300 ml-auto mb-1"></div>
              <p className="font-semibold text-slate-700">Authorized Signatory</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

