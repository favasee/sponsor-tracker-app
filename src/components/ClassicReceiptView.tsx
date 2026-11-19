'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ClassicReceipt } from '@/types';
import { Download, Printer, MessageSquare, Mail, X, Check, ShieldCheck, Sparkles } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { loadHeaderSettings, OrganizationHeaderSettings } from '@/lib/settingsStorage';

interface ClassicReceiptViewProps {
  receipt: ClassicReceipt | null;
  onClose: () => void;
  onEdit?: (receipt: ClassicReceipt) => void;
  autoDownloadPDF?: boolean;
}

// Format Receipt Serial matching user request: "TH0000" (4 digits, remove 1 zero from TH00000)
function formatReceiptSerial(no: string): string {
  if (!no) return 'TH-0001';
  const match = no.match(/^([A-Za-z]+)-?(\d+)$/);
  if (match) {
    const prefix = match[1];
    const num = parseInt(match[2], 10);
    const padded = String(num).padStart(4, '0');
    return `${prefix}-${padded}`;
  }
  return no;
}

// Format Date strictly DD/MM/YYYY matching Image 2: e.g. "01/11/2026"
function formatReceiptDate(dateStr: string): string {
  if (!dateStr) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// Format Amount: e.g. 26000 or 26,000 without extraneous trailing zeros
function formatNumericAmount(amount: number): string {
  if (amount == null) return '0';
  if (amount % 1 === 0) {
    // Integer amount like 26000 in Image 2
    return amount.toString();
  }
  return amount.toFixed(2);
}



export function ClassicReceiptView({ receipt, onClose, onEdit, autoDownloadPDF }: ClassicReceiptViewProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [header, setHeader] = useState<OrganizationHeaderSettings>(() => loadHeaderSettings());
  // Template Style: 'modern' (Image 2 - default) vs 'classic' (Image 1 - 80G border)
  const [templateStyle, setTemplateStyle] = useState<'modern' | 'classic'>('modern');

  // Reload header settings whenever receipt modal opens
  useEffect(() => {
    if (receipt) {
      setHeader(loadHeaderSettings());
    }
  }, [receipt]);

  // Set document.title strictly to receipt number when modal is open
  useEffect(() => {
    if (!receipt) return;
    
    try {
      document.querySelectorAll('canvas').forEach((c) => {
        if (!c.id) c.remove();
      });
    } catch {}

    document.body.classList.add('receipt-modal-active');
    const prevTitle = document.title;
    document.title = receipt.receiptNo;

    return () => {
      document.body.classList.remove('receipt-modal-active');
      document.title = prevTitle;
    };
  }, [receipt]);

  // Dispatch via Email
  const handleSendEmail = () => {
    if (!receipt) return;

    const subject = encodeURIComponent(`Official Donation Receipt ${receipt.receiptNo} - ${header.trustName}`);
    const body = encodeURIComponent(`Dear ${receipt.donorName},

Thank you for your generous contribution to ${header.trustName}.

RECEIPT DETAILS:
----------------------------------------
Receipt No: ${receipt.receiptNo}
Date: ${formatReceiptDate(receipt.date)}
Donation Amount: ${receipt.currency} ${receipt.donationAmount.toLocaleString('en-US')}
Amount in Words: ${receipt.amountInWords}
Towards a Donation for the: ${receipt.purpose}
${receipt.paymentMethod ? `Payment Mode: ${receipt.paymentMethod}` : ''}

With sincere gratitude,
President
${header.trustName}`);

    const mailto = `mailto:${receipt.donorEmail || ''}?subject=${subject}&body=${body}`;
    window.location.href = mailto;
  };

  // Generate high-resolution PDF download: EXACTLY 1 page, named receipt number e.g. "TH0009.pdf"
  const handleDownloadPDF = async () => {
    if (!receipt || !receiptRef.current) return;
    setIsExporting(true);

    try {
      const element = receiptRef.current;

      // Capture receipt card at crisp high resolution matching A5 proportions
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          const card = clonedDoc.getElementById('printable-receipt-card');
          if (!card) return;
          card.style.boxShadow = 'none';

          // Helper to sanitize modern color formats (lab/oklch) that html2canvas cannot parse
          const dummyCanvas = clonedDoc.createElement('canvas');
          dummyCanvas.width = 1;
          dummyCanvas.height = 1;
          const ctx = dummyCanvas.getContext('2d');

          const toStandardRgb = (val: string | null | undefined): string => {
            if (!val) return '';
            if (val.includes('lab') || val.includes('oklch') || val.includes('color(')) {
              if (ctx) {
                ctx.fillStyle = '#000000';
                ctx.fillStyle = val;
                return ctx.fillStyle;
              }
              return '#0f172a';
            }
            return val;
          };

          const allNodes = [card, ...Array.from(card.querySelectorAll('*'))] as HTMLElement[];
          for (const node of allNodes) {
            if (!node.style) continue;
            const computed = clonedDoc.defaultView?.getComputedStyle(node) || window.getComputedStyle(node);
            
            const color = toStandardRgb(computed.color);
            const bg = toStandardRgb(computed.backgroundColor);
            const borderTop = toStandardRgb(computed.borderTopColor);
            const borderRight = toStandardRgb(computed.borderRightColor);
            const borderBottom = toStandardRgb(computed.borderBottomColor);
            const borderLeft = toStandardRgb(computed.borderLeftColor);

            if (color) node.style.color = color;
            if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') node.style.backgroundColor = bg;
            if (borderTop) node.style.borderTopColor = borderTop;
            if (borderRight) node.style.borderRightColor = borderRight;
            if (borderBottom) node.style.borderBottomColor = borderBottom;
            if (borderLeft) node.style.borderLeftColor = borderLeft;
          }
        },
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5', // A5 format: 148mm × 210mm
      });

      // Fit strictly within single A5 page (148mm × 210mm) full bleed
      // The card's internal padding directly forms the exact margins of the A5 document,
      // guaranteeing that what is seen on the site is 100% identical on the downloaded PDF!
      pdf.addImage(imgData, 'PNG', 0, 0, 148, 210, undefined, 'FAST');

      // Filename strictly receipt number e.g. "TH0009.pdf" matching tab in user's image
      const filename = `${displayReceiptNo.replace('-', '')}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error('PDF generation error, fallback to print:', err);
      handlePrint();
    } finally {
      setIsExporting(false);
    }
  };

  // Automatically trigger PDF download if requested
  useEffect(() => {
    if (receipt && autoDownloadPDF) {
      const timer = setTimeout(() => {
        handleDownloadPDF();
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [receipt, autoDownloadPDF]);

  // Browser Print
  const handlePrint = () => {
    if (!receipt) return;
    document.title = receipt.receiptNo;
    window.print();
  };

  // Direct WhatsApp click-to-chat fallback
  const handleSendWhatsApp = () => {
    if (!receipt) return;
    const text = `Assalamu Alaikum / Greetings *${receipt.donorName}*,\n\nHere is your official donation receipt from *${header.trustName}*:\n\n📄 *Receipt No:* ${formatReceiptSerial(receipt.receiptNo)}\n📅 *Date:* ${formatReceiptDate(receipt.date)}\n💰 *Donation Amount:* ${receipt.currency} ${receipt.donationAmount.toLocaleString('en-US')}\n📝 *Amount in Words:* ${receipt.amountInWords}\n🎯 *Purpose:* ${receipt.purpose}\n\nMay the Almighty accept your noble contribution.\n\n_Official Digital Receipt • ${header.website || 'www.thaibaheritage.com'}_`;
    const cleanPhone = (receipt.donorPhone || '').replace(/\D/g, '');
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!receipt) return null;

  const displayReceiptNo = formatReceiptSerial(receipt.receiptNo);
  const displayDate = formatReceiptDate(receipt.date);
  const displayAmount = formatNumericAmount(receipt.donationAmount);
  const displayCurrency = receipt.currency || 'INR';
  const displayWords = (receipt.amountInWords || '').toUpperCase();

  return (
    <div 
      id="printable-receipt-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto"
    >
      <div 
        id="printable-receipt-modal-container"
        className="bg-[#0f1219] rounded-3xl max-w-2xl w-full shadow-2xl border border-white/15 overflow-hidden my-4 text-white"
      >
        
        {/* Top Control Bar (Strictly hidden on print) */}
        <div className="bg-[#141822] text-white px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 print-hide">
          <div className="flex items-center gap-2">
            <span className="font-mono tabular-nums text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-xl shadow-xs">
              {displayReceiptNo}
            </span>
            {receipt.isEdited && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                Revised
              </span>
            )}
            
            {/* Design Style Selector */}
            <div className="hidden sm:inline-flex items-center bg-white/10 p-0.5 rounded-xl border border-white/10 text-[11px] font-bold ml-2">
              <button
                type="button"
                onClick={() => setTemplateStyle('modern')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  templateStyle === 'modern'
                    ? 'bg-[#00a896] text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Exact Image 2 Reference Design"
              >
                Thaiba Modern
              </button>
              <button
                type="button"
                onClick={() => setTemplateStyle('classic')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  templateStyle === 'classic'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Classic 80G Formal Border Design"
              >
                Classic 80G
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(receipt)}
                aria-label={`Edit receipt ${receipt.receiptNo}`}
                className="px-3 py-1.5 min-h-[36px] rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-200 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none cursor-pointer"
              >
                Edit
              </button>
            )}

            {/* Download PDF button (saves strictly as single-page A5 PDF) */}
            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              aria-label={`Export A5 PDF for receipt ${receipt.receiptNo}`}
              className="px-3.5 py-1.5 min-h-[36px] rounded-xl bg-gradient-to-r from-[#00a896] to-[#0284c7] hover:from-[#009688] hover:to-[#0369a1] text-white text-xs font-black flex items-center gap-1.5 shadow-md transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:outline-none cursor-pointer disabled:opacity-50"
              title={`Download A5 PDF as ${receipt.receiptNo}.pdf`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Exporting...' : 'Export PDF (A5)'}</span>
            </button>

            <button
              onClick={handlePrint}
              aria-label="Print receipt"
              className="px-3 py-1.5 min-h-[36px] rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            {/* Email Dispatch button */}
            <button
              onClick={handleSendEmail}
              aria-label={`Dispatch receipt ${receipt.receiptNo} via Email`}
              className="px-3 py-1.5 min-h-[36px] rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none cursor-pointer"
              title="Dispatch via Email"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email</span>
            </button>

            <button
              onClick={handleSendWhatsApp}
              aria-label={`Dispatch receipt ${receipt.receiptNo} via WhatsApp`}
              className="px-3 py-1.5 min-h-[36px] rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none cursor-pointer"
              title="Dispatch via WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={onClose}
              aria-label="Close receipt modal"
              className="w-9 h-9 min-h-[36px] min-w-[36px] rounded-xl bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white flex items-center justify-center transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Small screen template switcher */}
        <div className="sm:hidden px-4 py-2 bg-[#121620] border-b border-white/10 flex items-center justify-center gap-2 print-hide">
          <button
            type="button"
            onClick={() => setTemplateStyle('modern')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              templateStyle === 'modern' ? 'bg-[#00a896] text-white' : 'text-slate-400'
            }`}
          >
            Thaiba Modern (Img 2)
          </button>
          <button
            type="button"
            onClick={() => setTemplateStyle('classic')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              templateStyle === 'classic' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
            }`}
          >
            Classic 80G (Img 1)
          </button>
        </div>

        {/* ================= RECEIPT CANVAS ================= */}
        <div className="p-3 sm:p-6 bg-slate-200/90 flex justify-center overflow-x-auto">

          {/* TEMPLATE A: THAIBA MODERN DESIGN (EXACT REFERENCE IMAGE 2 & PPTX) */}
          {templateStyle === 'modern' && (
            <div
              id="printable-receipt-card"
              ref={receiptRef}
              className="bg-white text-slate-900 font-sans leading-normal relative flex flex-col justify-between shadow-2xl mx-auto shrink-0"
              style={{
                width: '560px',
                height: '794px',
                minWidth: '560px',
                minHeight: '794px',
                maxWidth: '560px',
                maxHeight: '794px',
                padding: '26px 28px 20px 26px',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                border: 'none',
                boxSizing: 'border-box',
                fontFamily: 'var(--font-inter), "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              <div>
                {/* Header Row: Logo & Org Info on Left, RECEIPT & Serial on Right */}
                <div className="flex justify-between items-start gap-4">
                  {/* Left Column */}
                  <div>
                    {/* Official Thaiba Heritage Origami Logo (Enlarged size matching reference) */}
                    <img 
                      src="/receipt_assets/thaiba_logo.png" 
                      alt="Thaiba Heritage" 
                      className="w-[74px] h-[74px] object-contain shrink-0"
                    />

                    {/* Organization Title Lines (Enlarged size matching reference) */}
                    <div className="mt-3 mb-1.5">
                      <h1 
                        className="text-[27px] sm:text-[29px] font-black uppercase tracking-tight leading-none"
                        style={{ color: '#0178C9' }}
                      >
                        {header.trustName || 'THAIBA HERITAGE'}
                      </h1>
                      <h2 
                        className="text-[22px] sm:text-[24px] font-black uppercase tracking-tight leading-none mt-1"
                        style={{ color: '#00AA9D' }}
                      >
                        {header.tagline || 'KOLKATA'}
                      </h2>
                    </div>

                    {/* Address & Contact Block */}
                    <div 
                      className="text-[10px] leading-[1.35] font-semibold mt-2.5 space-y-0.5 text-[#000000]"
                    >
                      <p>{header.officeAddress || 'MAJHIKHANDA, TAPAN, DAKSHIN DINAJPUR'}</p>
                      <p>{header.officeAddressLine2 || 'WEST BENGAL - 733127'}</p>
                      <p style={{ textTransform: 'lowercase' }}>{header.email || 'info@thaibaheritage.com'}</p>
                      <p className="font-bold">Ph: {header.phone || '+91 8129755155'}</p>
                    </div>
                  </div>

                  {/* Right Column: Large Teal RECEIPT & Receipt No */}
                  <div className="text-right">
                    <div 
                      className="text-[32px] sm:text-[34px] font-black tracking-wider uppercase leading-none"
                      style={{ color: '#00AA9D' }}
                    >
                      RECEIPT
                    </div>
                    <div 
                      className="mt-14 text-xl sm:text-[22px] font-bold tracking-tight text-[#000000]"
                    >
                      {displayReceiptNo}
                    </div>
                  </div>
                </div>

                {/* Divider Line 1: Solid Teal */}
                <div 
                  className="my-4"
                  style={{ borderBottom: '2px solid #00AA9D' }}
                />

                {/* Particulars List */}
                <div className="space-y-3.5 my-1 text-[11.5px] font-bold leading-normal text-[#000000]">
                  
                  {/* DATE */}
                  <div className="flex items-baseline gap-2">
                    <span className="tracking-wide whitespace-nowrap text-[#000000] font-bold">DATE :</span>
                    <span className="tracking-wide font-semibold text-[#000000]">{displayDate}</span>
                  </div>

                  {/* RECEIVED FROM */}
                  <div className="flex items-baseline gap-2">
                    <span className="tracking-wide whitespace-nowrap text-[#000000] font-bold">RECEIVED FROM :</span>
                    <span className="uppercase tracking-wide font-semibold text-[#000000]">{receipt.donorName}</span>
                  </div>

                  {/* TOWARDS */}
                  <div className="flex items-baseline gap-2">
                    <span className="tracking-wide whitespace-nowrap text-[#000000] font-bold">TOWARDS :</span>
                    <span className="uppercase tracking-wide font-semibold text-[#000000]">{receipt.purpose}</span>
                  </div>

                  {/* THE SUM OF Box (Gray rounded container with dynamic text scaling) */}
                  <div 
                    className="rounded-[12px] px-3.5 py-2 flex items-baseline gap-2 min-h-[36px]"
                    style={{ backgroundColor: '#EEEEEE' }}
                  >
                    <span className="tracking-wide whitespace-nowrap text-[11px] font-bold text-[#000000]">THE SUM OF :</span>
                    <span 
                      className={`uppercase tracking-wide font-bold text-[#000000] leading-snug break-words ${
                        displayWords.length > 70 
                          ? 'text-[9.5px]' 
                          : displayWords.length > 45 
                          ? 'text-[10.5px]' 
                          : 'text-[11.5px]'
                      }`}
                    >
                      {displayWords}
                    </span>
                  </div>

                  {/* AMOUNT Section (Concentric rounded rectangles matching user request) */}
                  <div className="flex items-center gap-3 pt-0.5">
                    <span className="text-[12px] font-bold tracking-wide text-[#000000]">AMOUNT :</span>
                    <div 
                      className="inline-flex items-center rounded-[12px] p-[2px] gap-2.5 max-w-full overflow-hidden"
                      style={{ backgroundColor: '#EEEEEE' }}
                    >
                      {/* Blue Currency Badge - Concentric rounded rectangle with little gray border */}
                      <div 
                        className="text-white text-xs font-black px-4 py-1.5 rounded-[10px] tracking-wider whitespace-nowrap shrink-0 flex items-center justify-center shadow-xs"
                        style={{ backgroundColor: '#0075BF' }}
                      >
                        {displayCurrency}
                      </div>
                      <div 
                        className={`font-black pr-4 py-0.5 tracking-tight flex items-center ${
                          displayAmount.length > 8 
                            ? 'text-lg' 
                            : 'text-[22px]'
                        }`}
                        style={{ color: '#00AA9D' }}
                      >
                        {displayAmount}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Divider Line 2: Solid Teal */}
                <div 
                  className="my-4"
                  style={{ borderBottom: '2px solid #00AA9D' }}
                />

                {/* Signatures & Appreciation Section */}
                <div className="flex justify-between items-end pt-1">
                  {/* Left: Thank you! For your Donation */}
                  <div>
                    <h3 
                      className="text-xl sm:text-2xl font-black leading-none"
                      style={{ color: '#FE3844' }}
                    >
                      Thank you!
                    </h3>
                    <p 
                      className="text-[11px] font-semibold mt-1 text-[#000000]"
                    >
                      For your Donation
                    </p>
                  </div>

                  {/* Right: President + Authentic Circular Seal & Blue Signature */}
                  <div className="text-right flex flex-col items-end">
                    <div 
                      className="text-xs font-semibold mb-1 mr-14 text-[#000000]"
                    >
                      {header.signatoryTitle || 'President:'}
                    </div>
                    <div className="relative select-none pointer-events-none w-[125px] h-[110px]">
                      {/* Official Circular Seal */}
                      <img
                        src="/receipt_assets/thaiba_seal.png"
                        alt="Official Trust Seal"
                        className="absolute right-0 top-0 w-[110px] h-[110px] object-contain opacity-95"
                      />
                      {/* Official Calligraphic Signature Overlaid */}
                      <img
                        src="/receipt_assets/thaiba_signature.png"
                        alt="Authorized Signature"
                        className="absolute -right-2 top-1.5 w-[125px] h-[90px] object-contain transform -rotate-3 pointer-events-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Divider Line 3: Solid Teal */}
                <div 
                  className="my-3.5"
                  style={{ borderBottom: '2px solid #00AA9D' }}
                />
              </div>

              {/* Footer: Website URL */}
              <div 
                className="text-xs font-medium text-[#000000]"
              >
                {header.website || 'www.thaibaheritage.com'}
              </div>

            </div>
          )}

          {/* TEMPLATE B: CLASSIC 80G FORMAL DESIGN (IMAGE 1 REFERENCE) */}
          {templateStyle === 'classic' && (
            <div
              id="printable-receipt-card"
              ref={receiptRef}
              className="w-full max-w-[560px] p-6 sm:p-8 font-serif leading-relaxed relative bg-white"
              style={{ 
                minHeight: '520px',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                border: '4px double #0f172a'
              }}
            >
              {/* Corner Decorative Stars */}
              <div className="absolute top-2 left-2 text-xs select-none" style={{ color: '#94a3b8' }}>✦</div>
              <div className="absolute top-2 right-2 text-xs select-none" style={{ color: '#94a3b8' }}>✦</div>
              <div className="absolute bottom-2 left-2 text-xs select-none" style={{ color: '#94a3b8' }}>✦</div>
              <div className="absolute bottom-2 right-2 text-xs select-none" style={{ color: '#94a3b8' }}>✦</div>

              {/* Institution Header */}
              <div className="text-center pb-4" style={{ borderBottom: '2px solid #0f172a' }}>
                <p className="text-[10px] tracking-[0.22em] font-sans font-bold uppercase mb-1" style={{ color: '#64748b' }}>
                  {header.tagline || 'CHARITABLE SOCIETY & EDUCATIONAL FOUNDATION'}
                </p>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase font-serif" style={{ color: '#020617' }}>
                  {header.trustName}
                </h1>
                <p className="text-xs font-sans mt-1" style={{ color: '#475569' }}>
                  {header.officeAddress}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-sans mt-2 font-medium" style={{ color: '#475569' }}>
                  <span><strong>Reg. No:</strong> {header.regNumber}</span>
                  <span>•</span>
                  <span><strong>PAN:</strong> {header.panNumber}</span>
                  <span>•</span>
                  <span><strong>80G No:</strong> {header.tax80GNumber}</span>
                </div>
              </div>

              {/* Receipt Serial & Date */}
              <div className="py-3 flex items-center justify-between text-xs font-sans" style={{ borderBottom: '1px solid #cbd5e1' }}>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold uppercase tracking-wider text-[11px]" style={{ color: '#64748b' }}>RECEIPT NO:</span>
                  <span className="font-mono font-black text-sm tracking-wide" style={{ color: '#020617' }}>
                    {receipt.receiptNo}
                  </span>
                  {receipt.isEdited && (
                    <span className="text-[9px] font-sans font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                      REVISED
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-bold uppercase tracking-wider text-[11px]" style={{ color: '#64748b' }}>DATE:</span>
                  <span className="font-serif font-bold text-sm" style={{ color: '#020617' }}>
                    {new Date(receipt.date).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Formal Phrasing Grid */}
              <div className="py-5 space-y-3.5 text-[13px] font-serif leading-relaxed">
                <div className="flex items-baseline flex-wrap gap-x-2">
                  <span style={{ color: '#475569' }}>Received with thanks from</span>
                  <span className="font-bold text-base flex-1 min-w-[200px]" style={{ color: '#020617', borderBottom: '1px dotted #334155' }}>
                    {receipt.donorName}
                  </span>
                </div>

                <div className="flex items-baseline flex-wrap gap-x-2">
                  <span style={{ color: '#475569' }}>The sum of</span>
                  <span className="font-bold flex-1 min-w-[200px]" style={{ color: '#020617', borderBottom: '1px dotted #334155' }}>
                    {receipt.amountInWords}
                  </span>
                </div>

                <div className="flex items-baseline flex-wrap gap-x-2">
                  <span style={{ color: '#475569' }}>On account of / Purpose:</span>
                  <span className="font-bold flex-1 min-w-[200px]" style={{ color: '#020617', borderBottom: '1px dotted #334155' }}>
                    {receipt.purpose}
                  </span>
                </div>

                <div className="flex items-baseline flex-wrap gap-x-2">
                  <span style={{ color: '#475569' }}>By way of:</span>
                  <span className="font-semibold flex-1 min-w-[200px]" style={{ color: '#020617', borderBottom: '1px dotted #334155' }}>
                    {receipt.paymentMethod} {receipt.paymentReference ? `(Ref: ${receipt.paymentReference})` : ''}
                  </span>
                </div>
              </div>

              {/* Amount Box Grid */}
              <div 
                className="my-4 rounded-sm p-4 font-sans grid grid-cols-1 sm:grid-cols-2 gap-4 items-center"
                style={{ backgroundColor: '#f8fafc', border: '2px solid #0f172a' }}
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: '#64748b' }}>
                    DONATION AMOUNT
                  </span>
                  <span className="text-xl sm:text-2xl font-black font-mono" style={{ color: '#020617' }}>
                    {receipt.currency} {receipt.donationAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="sm:text-right sm:border-l sm:pl-4" style={{ borderColor: '#cbd5e1' }}>
                  <span className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: '#64748b' }}>
                    INDIAN VALUE (INR)
                  </span>
                  <span className="text-xl sm:text-2xl font-black font-mono" style={{ color: '#065f46' }}>
                    {receipt.indianValue ? `₹ ${Number(receipt.indianValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                  </span>
                </div>
              </div>

              {/* Bottom Signatures */}
              <div className="pt-5 mt-5 grid grid-cols-2 gap-4 items-end" style={{ borderTop: '1px solid #cbd5e1' }}>
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-sans font-semibold mb-1" style={{ color: '#047857' }}>
                    <ShieldCheck className="w-4 h-4" style={{ color: '#047857' }} />
                    <span>{header.verifiedText || 'Verified & Cleared'}</span>
                  </div>
                  <p className="text-[10px] font-sans leading-tight" style={{ color: '#64748b' }}>
                    {header.disclaimerText || 'Computer generated official receipt. Eligible for tax exemption under Section 80G of the Income Tax Act.'}
                  </p>
                </div>

                <div className="text-right font-sans">
                  <div className="font-serif text-lg font-bold mb-0.5 select-none pr-2" style={{ color: '#1e293b' }}>
                    {header.signatoryName || 'Ameenur Rahman'}
                  </div>
                  <div className="w-36 ml-auto mb-1" style={{ borderBottom: '1px solid #334155' }}></div>
                  <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#020617' }}>
                    {header.signatoryTitle || 'AUTHORIZED SIGNATORY'}
                  </p>
                  <p className="text-[9px]" style={{ color: '#64748b' }}>{header.legalEntityNote || 'For Al-Huda Charitable Trust'}</p>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
