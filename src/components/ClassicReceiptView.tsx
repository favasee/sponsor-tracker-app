'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ClassicReceipt } from '@/types';
import { 
  Download, 
  Printer, 
  MessageSquare, 
  Mail, 
  X, 
  Check, 
  ShieldCheck, 
  Sparkles,
  Edit3,
  ZoomIn,
  Smartphone
} from 'lucide-react';
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

  // Dynamic scale state to auto-fit mobile phone screens 100% without horizontal cutoff
  const [scale, setScale] = useState(1);
  const [zoomMode, setZoomMode] = useState<'fit' | 'actual'>('fit');
  const previewContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateScale = () => {
      if (previewContainerRef.current) {
        const containerWidth = previewContainerRef.current.clientWidth;
        // On small screens leave 16px horizontal breathing room
        const horizontalPadding = window.innerWidth < 640 ? 16 : 48;
        const availableWidth = Math.max(260, containerWidth - horizontalPadding);
        if (availableWidth < 560 && zoomMode === 'fit') {
          setScale(availableWidth / 560);
        } else if (zoomMode === 'actual') {
          setScale(1);
        } else {
          setScale(1);
        }
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    const timer = setTimeout(updateScale, 100);
    return () => {
      window.removeEventListener('resize', updateScale);
      clearTimeout(timer);
    };
  }, [receipt, templateStyle, zoomMode]);

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
          card.style.transform = 'none';
          card.style.margin = '0 auto';
          card.style.width = '560px';
          card.style.height = '794px';
          card.style.minWidth = '560px';
          card.style.minHeight = '794px';
          card.style.maxWidth = '560px';
          card.style.maxHeight = '794px';

          let p = card.parentElement;
          while (p && p !== clonedDoc.body) {
            p.style.transform = 'none';
            p.style.overflow = 'visible';
            p.style.width = 'auto';
            p.style.height = 'auto';
            p.style.margin = '0';
            p = p.parentElement;
          }

          // Enforce exact AMOUNT capsule metrics in html2canvas to guarantee identical concentric alignment
          const amountRow = card.querySelector('#receipt-amount-row') as HTMLElement | null;
          if (amountRow) {
            amountRow.style.display = 'flex';
            amountRow.style.alignItems = 'center';
            amountRow.style.paddingTop = '2px';
          }
          const amountLabel = card.querySelector('#receipt-amount-label') as HTMLElement | null;
          if (amountLabel) {
            amountLabel.style.height = '32px';
            amountLabel.style.lineHeight = '32px';
            amountLabel.style.marginRight = '12px';
            amountLabel.style.display = 'inline-flex';
            amountLabel.style.alignItems = 'center';
          }
          const amountContainer = card.querySelector('#receipt-amount-badge-container') as HTMLElement | null;
          if (amountContainer) {
            amountContainer.style.height = '32px';
            amountContainer.style.minHeight = '32px';
            amountContainer.style.maxHeight = '32px';
            amountContainer.style.display = 'inline-flex';
            amountContainer.style.alignItems = 'center';
            amountContainer.style.padding = '2px';
            amountContainer.style.borderRadius = '16px';
            amountContainer.style.backgroundColor = '#EEEEEE';
            amountContainer.style.boxSizing = 'border-box';
          }
          const currencyBadge = card.querySelector('#receipt-currency-badge') as HTMLElement | null;
          if (currencyBadge) {
            currencyBadge.style.height = '28px';
            currencyBadge.style.minHeight = '28px';
            currencyBadge.style.maxHeight = '28px';
            currencyBadge.style.lineHeight = '28px';
            currencyBadge.style.borderRadius = '14px';
            currencyBadge.style.display = 'inline-flex';
            currencyBadge.style.alignItems = 'center';
            currencyBadge.style.justifyContent = 'center';
            currencyBadge.style.backgroundColor = '#0075BF';
            currencyBadge.style.color = '#FFFFFF';
            currencyBadge.style.paddingLeft = '14px';
            currencyBadge.style.paddingRight = '14px';
            currencyBadge.style.boxSizing = 'border-box';
            currencyBadge.style.verticalAlign = 'middle';
          }
          const amountValue = card.querySelector('#receipt-amount-value') as HTMLElement | null;
          if (amountValue) {
            amountValue.style.height = '28px';
            amountValue.style.minHeight = '28px';
            amountValue.style.maxHeight = '28px';
            amountValue.style.lineHeight = '28px';
            amountValue.style.display = 'inline-flex';
            amountValue.style.alignItems = 'center';
            amountValue.style.color = '#00AA9D';
            amountValue.style.paddingLeft = '8px';
            amountValue.style.paddingRight = '12px';
            amountValue.style.boxSizing = 'border-box';
            amountValue.style.verticalAlign = 'middle';
          }

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
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto"
    >
      <div 
        id="printable-receipt-modal-container"
        className="bg-[#0f1219] rounded-2xl sm:rounded-3xl max-w-2xl w-full shadow-2xl border border-white/15 overflow-hidden my-auto text-white flex flex-col max-h-[96vh]"
      >
        
        {/* Top Control Bar (Strictly hidden on print) */}
        <div className="bg-[#141822] text-white p-3 sm:px-6 sm:py-3.5 border-b border-white/10 print-hide space-y-2.5">
          
          {/* Top Row: Serial Badge, Template Switcher, and Pinned Close Button */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-wrap">
              <span className="font-mono tabular-nums text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 sm:px-3 py-1 rounded-xl shadow-xs shrink-0">
                {displayReceiptNo}
              </span>
              {receipt.isEdited && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold shrink-0">
                  Revised
                </span>
              )}
              
              {/* Design Style Selector */}
              <div className="inline-flex items-center bg-white/10 p-0.5 rounded-xl border border-white/10 text-[10px] sm:text-[11px] font-bold shrink-0">
                <button
                  type="button"
                  onClick={() => setTemplateStyle('modern')}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    templateStyle === 'modern'
                      ? 'bg-[#00a896] text-white shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="Exact Modern Reference Design"
                >
                  Thaiba Modern
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateStyle('classic')}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
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

            {/* Pinned Close Button: ALWAYS visible, high contrast, top-right, minimum 40px touch target */}
            <button
              onClick={onClose}
              aria-label="Close receipt modal"
              className="w-9 h-9 min-h-[38px] min-w-[38px] rounded-xl bg-white/10 hover:bg-rose-500/25 text-slate-300 hover:text-rose-200 border border-white/15 hover:border-rose-500/40 flex items-center justify-center transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none cursor-pointer shrink-0 ml-auto"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 sm:gap-2 pt-1 sm:pt-2 sm:border-t sm:border-white/[0.06]">
            
            {/* Primary Download PDF Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              aria-label={`Export A5 PDF for receipt ${receipt.receiptNo}`}
              className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 min-h-[40px] rounded-xl bg-gradient-to-r from-[#00a896] to-[#0284c7] hover:from-[#009688] hover:to-[#0369a1] text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/20 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:outline-none cursor-pointer disabled:opacity-50"
              title={`Download A5 PDF as ${displayReceiptNo.replace('-', '')}.pdf`}
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>{isExporting ? 'Exporting...' : 'Export PDF (A5)'}</span>
            </button>

            {/* WhatsApp Share Button */}
            <button
              onClick={handleSendWhatsApp}
              aria-label={`Dispatch receipt ${receipt.receiptNo} via WhatsApp`}
              className="px-3 py-2 min-h-[40px] rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none cursor-pointer"
              title="Dispatch via WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span className="inline">WhatsApp</span>
            </button>

            {/* Email Dispatch Button */}
            <button
              onClick={handleSendEmail}
              aria-label={`Dispatch receipt ${receipt.receiptNo} via Email`}
              className="px-3 py-2 min-h-[40px] rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none cursor-pointer"
              title="Dispatch via Email"
            >
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span className="inline">Email</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              aria-label="Print receipt"
              className="px-3 py-2 min-h-[40px] rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none cursor-pointer"
              title="Print receipt"
            >
              <Printer className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Print</span>
            </button>

            {/* Edit Button (if onEdit callback provided) */}
            {onEdit && (
              <button
                onClick={() => onEdit(receipt)}
                aria-label={`Edit receipt ${receipt.receiptNo}`}
                className="px-3 py-2 min-h-[40px] rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none cursor-pointer"
                title="Edit receipt"
              >
                <Edit3 className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}

          </div>

        </div>

        {/* ================= RECEIPT CANVAS ================= */}
        <div 
          ref={previewContainerRef}
          className="p-2 sm:p-6 bg-slate-300/85 flex flex-col items-center justify-start overflow-y-auto overflow-x-hidden min-h-[380px] flex-1"
        >
          {/* Mobile Auto-fit Status & Zoom Toggle */}
          <div className="sm:hidden mb-2.5 flex items-center justify-between w-full max-w-[560px] px-1 text-[11px] font-bold text-slate-700 select-none">
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-teal-700" />
              <span>{zoomMode === 'fit' ? 'Auto-fitted to Phone Screen' : 'Zoom 100% (Scroll Mode)'}</span>
            </div>
            <button
              type="button"
              onClick={() => setZoomMode(zoomMode === 'fit' ? 'actual' : 'fit')}
              className="px-2.5 py-1 rounded-lg bg-black/10 hover:bg-black/20 text-slate-800 text-[10px] font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer"
            >
              {zoomMode === 'fit' ? (
                <>
                  <ZoomIn className="w-3 h-3" />
                  <span>Zoom 100%</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-3 h-3" />
                  <span>Fit Phone</span>
                </>
              )}
            </button>
          </div>

          {/* Scaled Card Viewport Container */}
          <div 
            className="w-full flex justify-center items-start"
            style={{
              overflowX: zoomMode === 'actual' ? 'auto' : 'hidden',
              overflowY: 'visible',
            }}
          >
            <div 
              style={{
                width: zoomMode === 'fit' && scale < 1 ? `${Math.round(560 * scale)}px` : '560px',
                height: zoomMode === 'fit' && scale < 1 
                  ? `${Math.round((templateStyle === 'modern' ? 794 : 650) * scale)}px` 
                  : templateStyle === 'modern' ? '794px' : 'auto',
                position: 'relative',
                overflow: 'hidden',
                flexShrink: 0,
                margin: '0 auto',
              }}
            >
              <div
                style={{
                  transform: zoomMode === 'fit' && scale < 1 ? `scale(${scale})` : 'none',
                  transformOrigin: 'top left',
                  width: '560px',
                  height: templateStyle === 'modern' ? '794px' : undefined,
                  position: zoomMode === 'fit' && scale < 1 ? 'absolute' : 'relative',
                  top: 0,
                  left: 0,
                }}
              >

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
                      className="w-[84px] h-[84px] object-contain shrink-0"
                    />

                    {/* Organization Title Lines (Enlarged size matching reference) */}
                    <div className="mt-2.5 mb-1">
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
                      className="text-[10px] leading-[1.35] font-semibold mt-2 space-y-0.5 text-[#000000]"
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
                  className="my-3.5"
                  style={{ borderBottom: '2px solid #00AA9D' }}
                />

                {/* Particulars List */}
                <div className="space-y-3 my-1 text-[11.5px] font-bold leading-normal text-[#000000]">
                  
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

                  {/* AMOUNT Section (Concentric rounded capsules with locked pixel metrics) */}
                  <div 
                    id="receipt-amount-row"
                    className="flex items-center"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      paddingTop: '2px',
                    }}
                  >
                    <span 
                      id="receipt-amount-label"
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        letterSpacing: '0.025em',
                        color: '#000000',
                        marginRight: '12px',
                        height: '32px',
                        lineHeight: '32px',
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                    >
                      AMOUNT :
                    </span>
                    
                    <div 
                      id="receipt-amount-badge-container"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        height: '32px',
                        backgroundColor: '#EEEEEE',
                        borderRadius: '16px',
                        padding: '2px',
                        boxSizing: 'border-box',
                      }}
                    >
                      {/* Blue Currency Badge - Exactly 28px height, 14px radius (concentric with 16px - 2px), zero vertical drift */}
                      <div 
                        id="receipt-currency-badge"
                        style={{
                          height: '28px',
                          lineHeight: '28px',
                          backgroundColor: '#0075BF',
                          color: '#FFFFFF',
                          fontSize: '12px',
                          fontWeight: 900,
                          letterSpacing: '0.05em',
                          paddingLeft: '14px',
                          paddingRight: '14px',
                          borderRadius: '14px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxSizing: 'border-box',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        {displayCurrency}
                      </div>

                      {/* Numeric Amount - Tightly hugged by the gray pill without large right void */}
                      <div 
                        id="receipt-amount-value"
                        style={{
                          height: '28px',
                          lineHeight: '28px',
                          fontSize: displayAmount.length > 8 ? '18px' : '21px',
                          fontWeight: 900,
                          letterSpacing: '-0.02em',
                          color: '#00AA9D',
                          paddingLeft: '8px',
                          paddingRight: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          boxSizing: 'border-box',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {displayAmount}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Divider Line 2: Solid Teal */}
                <div 
                  className="my-3.5"
                  style={{ borderBottom: '2px solid #00AA9D' }}
                />
              </div>

              {/* Bottom Pinned Block: Appreciation, President Seal/Signature Down, Green Line, and Website Footer */}
              <div className="mt-auto">
                {/* Signatures & Appreciation Section */}
                <div className="flex justify-between items-end pb-1.5">
                  {/* Left: Thank you! For your Donation */}
                  <div>
                    <h3 
                      className="text-[22px] sm:text-[24px] font-black leading-none"
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

                  {/* Right: President + Authentic Circular Seal & Blue Signature (Shifted DOWN) */}
                  <div className="text-right flex flex-col items-end">
                    <div 
                      className="text-xs font-semibold mb-1 mr-10 text-[#000000]"
                    >
                      {header.signatoryTitle || 'President:'}
                    </div>
                    {/* Shifted seal & signature down closer to the teal line */}
                    <div className="relative select-none pointer-events-none w-[125px] h-[105px] mt-0.5">
                      {/* Official Circular Seal */}
                      <img
                        src="/receipt_assets/thaiba_seal.png"
                        alt="Official Trust Seal"
                        className="absolute right-0 bottom-0 w-[105px] h-[105px] object-contain opacity-95"
                      />
                      {/* Official Calligraphic Signature Overlaid */}
                      <img
                        src="/receipt_assets/thaiba_signature.png"
                        alt="Authorized Signature"
                        className="absolute -right-2 bottom-0 w-[125px] h-[90px] object-contain transform -rotate-3 pointer-events-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Divider Line 3: Solid Teal - strictly above www.thaibaheritage.com */}
                <div 
                  className="mt-1 mb-2.5"
                  style={{ borderBottom: '2px solid #00AA9D' }}
                />

                {/* Footer: Website URL */}
                <div 
                  className="text-xs font-medium text-[#000000] pb-0.5"
                >
                  {header.website || 'www.thaibaheritage.com'}
                </div>
              </div>

            </div>
          )}

          {/* TEMPLATE B: CLASSIC 80G FORMAL DESIGN (IMAGE 1 REFERENCE) */}
          {templateStyle === 'classic' && (
            <div
              id="printable-receipt-card"
              ref={receiptRef}
              className="p-6 sm:p-8 font-serif leading-relaxed relative bg-white mx-auto shrink-0"
              style={{ 
                width: '560px',
                minWidth: '560px',
                maxWidth: '560px',
                minHeight: '520px',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                border: '4px double #0f172a',
                boxSizing: 'border-box'
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

        </div>

      </div>
    </div>
  );
}
