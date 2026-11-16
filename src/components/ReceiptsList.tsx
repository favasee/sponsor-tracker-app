'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { ClassicReceipt, OWNER_EMAIL, PaymentMethod } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { hasUserPermission, loadPurposes, savePurposes } from '@/lib/settingsStorage';
import { formatAmountInWords } from '@/lib/numberToWords';
import { getNextClassicReceiptNumber } from '@/lib/receiptStorage';
import { 
  Search, 
  Download, 
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  X,
  MessageSquare, 
  Mail,
  Edit3, 
  Trash2, 
  Eye, 
  ShieldCheck, 
  Sparkles,
  Calendar,
  RotateCcw,
  TrendingUp,
  BarChart3,
  ChevronDown,
  ChevronUp,
  ClipboardPaste,
  FileText,
  Check
} from 'lucide-react';

interface ReceiptsListProps {
  receipts: ClassicReceipt[];
  onViewReceipt: (receipt: ClassicReceipt, autoDownload?: boolean) => void;
  onEditReceipt: (receipt: ClassicReceipt) => void;
  onDeleteReceipt: (id: string) => void;
  onImportReceipts?: (importedReceipts: ClassicReceipt[]) => { addedCount: number; updatedCount: number };
  onClearExcept1To6?: () => void;
  initialPurposeFilter?: string;
  onNavigateToDashboard?: () => void;
}

// Universal Delimiter Detector (Comma, Tab, or Semicolon)
function detectDelimiter(text: string): string {
  const firstLine = text.replace(/^\uFEFF/, '').split(/\r\n|\n|\r/)[0] || '';
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;

  if (tabCount > commaCount && tabCount > semicolonCount) return '\t';
  if (semicolonCount > commaCount && semicolonCount > tabCount) return ';';
  return ',';
}

// Universal RFC-4180 compliant CSV / TSV parser
function parseCSV(text: string, customDelimiter?: string): { rows: string[][]; delimiter: string } {
  const clean = text.replace(/^\uFEFF/, '').trim();
  const delim = customDelimiter || detectDelimiter(clean);
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const nextChar = clean[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delim && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField.trim());
      if (currentRow.some((field) => field.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((field) => field.length > 0)) {
      rows.push(currentRow);
    }
  }

  return { rows, delimiter: delim };
}

// Flexible Date Parser (handles DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, Excel serial numbers, etc.)
function parseFlexibleDate(raw?: string | number): string {
  if (raw === undefined || raw === null || raw === '') return new Date().toISOString().split('T')[0];
  const clean = String(raw).trim().replace(/^"|"$/g, '');

  // Case 0: Excel serial date number (e.g. 45342 or "45342")
  if (/^\d{5}$/.test(clean)) {
    const serial = parseInt(clean, 10);
    const d = new Date(Math.round((serial - 25569) * 86400 * 1000));
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  }

  // Case 1: DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY (e.g. "20/02/2026")
  const dmyMatch = clean.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Case 2: YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = clean.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Case 3: Standard ISO / Date Parse fallback
  const parsed = Date.parse(clean);
  if (!isNaN(parsed)) {
    return new Date(parsed).toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

// Localized Date Formatter without UTC timezone shifts
export function formatDateDisplay(dateStr?: string): string {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  return dateStr;
}

// Clean Amount parser (handles commas e.g. "14,498" -> 14498)
function parseCleanAmount(val?: string | number): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const clean = String(val).replace(/,/g, '').replace(/[^0-9.]/g, '');
  return parseFloat(clean) || 0;
}

export function ReceiptsList({
  receipts,
  onViewReceipt,
  onEditReceipt,
  onDeleteReceipt,
  onImportReceipts,
  onClearExcept1To6,
  initialPurposeFilter,
  onNavigateToDashboard,
}: ReceiptsListProps) {
  const { user, isOwner } = useAuth();
  const isAdminOrOwner = isOwner || user?.role === 'admin';

  const [searchTerm, setSearchTerm] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('All');
  const [purposeFilter, setPurposeFilter] = useState(initialPurposeFilter || 'All');
  const [editedOnly, setEditedOnly] = useState(false);
  const [isOthersExpanded, setIsOthersExpanded] = useState(false);
  const [settingsPurposes, setSettingsPurposes] = useState<string[]>([]);

  // Sync initialPurposeFilter when passed from parent
  useEffect(() => {
    if (initialPurposeFilter) {
      setPurposeFilter(initialPurposeFilter);
    }
  }, [initialPurposeFilter]);

  // Load configured settings purposes on mount
  useEffect(() => {
    setSettingsPurposes(loadPurposes());
  }, []);

  // CSV Import State & Reference
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [pastedCSVText, setPastedCSVText] = useState('');
  const [importTab, setImportTab] = useState<'upload' | 'paste'>('upload');
  const [importSummary, setImportSummary] = useState<{
    show: boolean;
    addedCount: number;
    updatedCount: number;
    totalImported: number;
    filename: string;
  } | null>(null);

  // Sample CSV Template Generator
  const downloadSampleCSV = () => {
    const sampleHeaders = [
      'Receipt No',
      'Date',
      'Donor Name',
      'Donation Amount',
      'Currency',
      'Indian Value (INR)',
      'Amount in Words',
      'Purpose',
      'Payment Method',
      'Donor Phone',
      'Donor Email',
      'Donor PAN',
      'Is Corrected'
    ];
    const sampleRows = [
      [
        'TH0005',
        '2026-10-28',
        'Sulaiman Haji',
        '50000',
        'INR',
        '50000',
        'Rupees Fifty Thousand Only',
        'THAIBA EDUCARE',
        'Bank',
        '+91 9847012345',
        'sulaiman@example.com',
        'ABCDE1234F',
        'No'
      ],
      [
        'TH0006',
        '2026-10-28',
        'Rasheed Ahmad',
        '2000',
        'AED',
        '46000',
        'UAE Dirhams Two Thousand Only',
        'THAIBA DREAM HOME',
        'Bank',
        '+971 509876543',
        'rasheed@emirates.ae',
        '',
        'No'
      ]
    ];
    const csvContent = '\uFEFF' + [sampleHeaders.join(','), ...sampleRows.map(r => r.map(c => `"${c}"`).join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sample_Donation_Receipts_Template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Universal Data Import Processor (Handles TSV, CSV, Tab-Delimited, Comma-Delimited)
  const processRawImportText = (text: string, sourceName: string) => {
    try {
      if (!text || !text.trim()) {
        alert('Import data is empty. Please select a file or paste data.');
        return;
      }

      const { rows, delimiter } = parseCSV(text);
      if (rows.length < 2) {
        alert('Data must contain at least a header row and one donation record.');
        return;
      }

      const headers = rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

      const findIndex = (keywords: string[]) => {
        const exact = headers.findIndex((h) => keywords.includes(h));
        if (exact >= 0) return exact;
        const starts = headers.findIndex((h) => keywords.some((k) => k.length >= 3 && h.startsWith(k)));
        if (starts >= 0) return starts;
        return headers.findIndex((h) => keywords.some((k) => k.length >= 4 && h.includes(k)));
      };

      const idxReceiptNo = findIndex(['receiptno', 'serial', 'receiptnumber', 'receiptserial', 'receipt', 'serialno']);
      const idxDate = findIndex(['date', 'receiptdate']);
      const idxDonorName = findIndex(['donorname', 'name', 'donor', 'donorparticulars']);
      const idxAmount = findIndex(['donationamount', 'amount', 'totalamount', 'total', 'donation']);
      const idxCurrency = findIndex(['currency', 'curr']);
      const idxIndianValue = findIndex(['indianvalueinr', 'indianvalue', 'inrvalue', 'indian', 'inr']);
      const idxWords = findIndex(['amountinwords', 'words']);
      const idxPurpose = findIndex(['purpose', 'cause', 'category']);
      const idxPayment = findIndex(['paymentmethod', 'paymentmode', 'method', 'mode', 'payment']);
      const idxEdited = findIndex(['iscorrected', 'corrected', 'isedited', 'edited']);
      const idxPhone = findIndex(['donorphone', 'phone', 'mobile', 'whatsapp']);
      const idxEmail = findIndex(['donoremail', 'email', 'mail']);
      const idxAddress = findIndex(['address']);
      const idxPAN = findIndex(['donorpan', 'pan']);
      const idxCreatedBy = findIndex(['createdby', 'creator', 'user']);

      if (idxDonorName === -1 && idxAmount === -1) {
        alert('Could not detect "Donor Name" or "Amount" columns. Please verify column headers.');
        return;
      }

      const importedReceipts: ClassicReceipt[] = [];
      const discoveredPurposes = new Set<string>();
      let runningList = [...receipts];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0 || row.every((c) => !c.trim())) continue;

        const donorName = idxDonorName >= 0 && row[idxDonorName] ? row[idxDonorName].trim().replace(/^"|"$/g, '') : '';
        if (!donorName) continue;

        const rawAmount = idxAmount >= 0 ? row[idxAmount] : '0';
        const donationAmount = parseCleanAmount(rawAmount);

        const rawCurrency = idxCurrency >= 0 && row[idxCurrency] ? row[idxCurrency].trim().toUpperCase().replace(/^"|"$/g, '') : '';
        const currency = rawCurrency || 'INR';

        const rawIndianVal = idxIndianValue >= 0 ? row[idxIndianValue] : '';
        const parsedIndianVal = parseCleanAmount(rawIndianVal);
        const indianValue = parsedIndianVal > 0 ? parsedIndianVal : (currency === 'INR' ? donationAmount : donationAmount);

        const rawDate = idxDate >= 0 ? row[idxDate] : '';
        const date = parseFlexibleDate(rawDate);

        let receiptNo = idxReceiptNo >= 0 && row[idxReceiptNo] ? row[idxReceiptNo].trim().toUpperCase().replace(/^"|"$/g, '') : '';
        if (!receiptNo) {
          receiptNo = getNextClassicReceiptNumber(runningList);
        }

        const purpose = idxPurpose >= 0 && row[idxPurpose] ? row[idxPurpose].trim().replace(/^"|"$/g, '') : 'THAIBA EDUCARE';
        if (purpose) discoveredPurposes.add(purpose);

        let paymentMethod: PaymentMethod = 'Bank';
        if (idxPayment >= 0 && row[idxPayment]) {
          const raw = row[idxPayment].trim().toLowerCase();
          if (raw.includes('cash')) paymentMethod = 'Cash';
          else if (raw.includes('upi') || raw.includes('online')) paymentMethod = 'UPI / Online';
          else if (raw.includes('cheque') || raw.includes('check')) paymentMethod = 'Cheque';
          else if (raw.includes('card')) paymentMethod = 'Card';
          else if (raw.includes('transfer')) paymentMethod = 'Bank Transfer';
          else if (raw.includes('direct')) paymentMethod = 'Direct Debit';
          else paymentMethod = 'Bank';
        }

        let amountInWords = idxWords >= 0 && row[idxWords] ? row[idxWords].trim().replace(/^"|"$/g, '') : '';
        if (!amountInWords) {
          amountInWords = formatAmountInWords(donationAmount, currency);
        }

        const isEdited = idxEdited >= 0 && row[idxEdited]
          ? (row[idxEdited].toLowerCase().includes('yes') || row[idxEdited].toLowerCase().includes('true'))
          : false;

        const donorPhone = idxPhone >= 0 && row[idxPhone] ? row[idxPhone].trim().replace(/^"|"$/g, '') : '';
        let rawEmail = idxEmail >= 0 && row[idxEmail] ? row[idxEmail].trim().replace(/^"|"$/g, '') : '';
        let createdBy = idxCreatedBy >= 0 && row[idxCreatedBy] ? row[idxCreatedBy].trim().replace(/^"|"$/g, '') : '';
        let donorEmail = rawEmail;

        if (donorEmail && (donorEmail.includes('(Admin)') || donorEmail.includes('(Staff)') || !donorEmail.includes('@'))) {
          if (!createdBy) createdBy = donorEmail;
          donorEmail = '';
        }
        if (!createdBy) {
          createdBy = user?.name ? `${user.name} (Import)` : 'CSV Import';
        }

        const donorAddress = idxAddress >= 0 && row[idxAddress] ? row[idxAddress].trim().replace(/^"|"$/g, '') : '';
        const donorPAN = idxPAN >= 0 && row[idxPAN] ? row[idxPAN].trim().toUpperCase().replace(/^"|"$/g, '') : '';

        const newReceipt: ClassicReceipt = {
          id: `rc-csv-${Date.now()}-${i}`,
          receiptNo,
          date,
          donorName,
          donorPhone,
          donorEmail,
          donorAddress,
          donorPAN,
          purpose,
          currency,
          donationAmount,
          exchangeRate: currency === 'INR' ? 1.0 : (indianValue / (donationAmount || 1)),
          indianValue,
          amountInWords,
          paymentMethod,
          paymentReference: 'CSV-IMPORT',
          whatsappStatus: 'placeholder',
          isEdited,
          createdBy,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        importedReceipts.push(newReceipt);
        runningList.push(newReceipt);
      }

      if (importedReceipts.length === 0) {
        alert('No valid receipt rows could be found in the provided data.');
        return;
      }

      if (onImportReceipts) {
        const result = onImportReceipts(importedReceipts);
        setImportSummary({
          show: true,
          addedCount: result.addedCount,
          updatedCount: result.updatedCount,
          totalImported: importedReceipts.length,
          filename: `${sourceName} (${delimiter === '\t' ? 'Tab-separated / TSV' : delimiter === ';' ? 'Semicolon' : 'Comma CSV'})`,
        });
      }

      setIsImportModalOpen(false);
      setPastedCSVText('');
    } catch (err) {
      console.error('Import processing error:', err);
      alert('Failed to parse and import data. Please verify data format.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImportFile = async (file: File) => {
    if (!file) return;
    setIsImporting(true);
    try {
      const fileNameLower = file.name.toLowerCase();
      const isExcel =
        fileNameLower.endsWith('.xlsx') ||
        fileNameLower.endsWith('.xls') ||
        file.type.includes('spreadsheet') ||
        file.type.includes('excel');

      if (isExcel) {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        const sheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[sheetName];
        const csvText = XLSX.utils.sheet_to_csv(sheet);
        processRawImportText(csvText, file.name);
        return;
      }

      // Read as text
      const text = await file.text();
      // Check if it's an xlsx file renamed or missing extension (starts with PK zip header)
      if (text.startsWith('PK\x03\x04')) {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        const sheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[sheetName];
        const csvText = XLSX.utils.sheet_to_csv(sheet);
        processRawImportText(csvText, file.name);
        return;
      }

      processRawImportText(text, file.name);
    } catch (err) {
      console.error('File import reading error:', err);
      alert('Could not read file. Please ensure it is a valid CSV, TSV, or Excel (.xlsx) file.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImportCSVFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImportFile(file);
    }
  };

  const handleDropFile = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImportFile(file);
    }
  };

  // Purpose-wise breakdown for setting purposes and "Others" count (used by Purpose filter dropdown)
  const purposeSummary = useMemo(() => {
    const activePurposesConfig = settingsPurposes.length > 0 ? settingsPurposes : loadPurposes();
    
    // Map for settings purposes
    const settingsMap = new Map<string, { count: number; totalINR: number }>();
    activePurposesConfig.forEach((sp) => {
      settingsMap.set(sp, { count: 0, totalINR: 0 });
    });

    let othersCount = 0;
    let othersTotalINR = 0;

    receipts.forEach((r) => {
      const rawP = (r.purpose || '').trim().replace(/^"|"$/g, '');
      const inr = typeof r.indianValue === 'number'
        ? r.indianValue
        : (parseFloat(String(r.indianValue || '').replace(/,/g, '')) || (typeof r.donationAmount === 'number' ? r.donationAmount : parseFloat(String(r.donationAmount || '').replace(/,/g, '')) || 0));
      const safeInr = isNaN(inr) ? 0 : inr;

      const matchedSP = activePurposesConfig.find(
        (sp) => sp.trim().toLowerCase() === rawP.toLowerCase()
      );

      if (matchedSP) {
        const existing = settingsMap.get(matchedSP) || { count: 0, totalINR: 0 };
        existing.count += 1;
        existing.totalINR += safeInr;
        settingsMap.set(matchedSP, existing);
      } else {
        othersCount += 1;
        othersTotalINR += safeInr;
      }
    });

    return {
      othersCount,
      othersTotalINR,
    };
  }, [receipts, settingsPurposes]);

  // Full filtered receipts list (Purpose Filter + Search + Currency + Edited)
  const filteredReceipts = useMemo(() => {
    const activePurposesConfig = settingsPurposes.length > 0 ? settingsPurposes : loadPurposes();

    return receipts.filter((r) => {
      // Purpose Filter
      if (purposeFilter !== 'All') {
        const cleanReceiptPurpose = (r.purpose || '').trim().toLowerCase();
        if (purposeFilter === 'Others') {
          const matched = activePurposesConfig.some(
            (sp) => sp.trim().toLowerCase() === cleanReceiptPurpose
          );
          if (matched) return false;
        } else {
          if (cleanReceiptPurpose !== purposeFilter.trim().toLowerCase()) {
            return false;
          }
        }
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          r.donorName.toLowerCase().includes(q) ||
          r.receiptNo.toLowerCase().includes(q) ||
          r.purpose.toLowerCase().includes(q) ||
          (r.donorPhone && r.donorPhone.includes(q)) ||
          (r.donorPAN && r.donorPAN.toLowerCase().includes(q));
        if (!matches) return false;
      }

      if (currencyFilter !== 'All' && r.currency !== currencyFilter) return false;
      if (editedOnly && !r.isEdited) return false;

      return true;
    });
  }, [receipts, searchTerm, currencyFilter, editedOnly, purposeFilter, settingsPurposes]);

  const totalIndianValue = useMemo(() => {
    return filteredReceipts.reduce((sum, r) => {
      const inr = typeof r.indianValue === 'number'
        ? r.indianValue
        : (parseFloat(String(r.indianValue || '').replace(/,/g, '')) || (typeof r.donationAmount === 'number' ? r.donationAmount : parseFloat(String(r.donationAmount || '').replace(/,/g, '')) || 0));
      return sum + (isNaN(inr) ? 0 : inr);
    }, 0);
  }, [filteredReceipts]);

  // Export CSV summary
  const exportCSV = () => {
    const headers = [
      'Receipt No',
      'Date',
      'Donor Name',
      'Donation Amount',
      'Currency',
      'Indian Value (INR)',
      'Amount in Words',
      'Purpose',
      'Payment Method',
      'Is Corrected / Edited',
      'Created By',
    ];

    const rows = filteredReceipts.map((r) => [
      `"${r.receiptNo}"`,
      `"${r.date}"`,
      `"${r.donorName.replace(/"/g, '""')}"`,
      r.donationAmount,
      `"${r.currency}"`,
      r.indianValue || '',
      `"${r.amountInWords.replace(/"/g, '""')}"`,
      `"${r.purpose.replace(/"/g, '""')}"`,
      `"${r.paymentMethod}"`,
      r.isEdited ? 'Yes (Corrected)' : 'No',
      `"${r.createdBy}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Donation_Receipts_Register_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">

      {/* Metric Summary Cards in Image 3 Dark Glass Style */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-6 border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Total Indian Value Collected
          </span>
          <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono mt-1">
            ₹ {totalIndianValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Across {filteredReceipts.length} recorded receipts
          </p>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-6 border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Receipts Issued
          </span>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">
            {receipts.length}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Sequential format (TH0001, TH0002...)
          </p>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-6 border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Audit Corrections Logged
          </span>
          <div className="text-2xl sm:text-3xl font-black text-orange-400 font-mono mt-1">
            {receipts.filter((r) => r.isEdited).length}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Preserved historical correction trails
          </p>
        </div>
      </div>

      {/* Toolbar & Filter Bar */}
      <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-5 border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search donor name, serial #, purpose, PAN..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-xs font-semibold focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition"
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Purpose Filter */}
          <div className="flex items-center gap-1">
            <select
              value={purposeFilter}
              onChange={(e) => setPurposeFilter(e.target.value)}
              aria-label="Filter by Purpose"
              className="px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs font-bold text-slate-200 cursor-pointer focus:outline-none max-w-[170px] truncate"
            >
              <option value="All" className="bg-[#0f131a] text-white">All Purposes ({receipts.length})</option>
              {settingsPurposes.map((sp) => (
                <option key={sp} value={sp} className="bg-[#0f131a] text-white">
                  {sp}
                </option>
              ))}
              {purposeSummary.othersCount > 0 && (
                <option value="Others" className="bg-[#0f131a] text-amber-300 font-bold">
                  Others ({purposeSummary.othersCount})
                </option>
              )}
            </select>
            {purposeFilter !== 'All' && (
              <button
                type="button"
                onClick={() => setPurposeFilter('All')}
                className="px-2 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold hover:bg-amber-500/30 transition cursor-pointer"
                title="Reset purpose filter to All"
              >
                Clear
              </button>
            )}
          </div>

          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            aria-label="Filter by Currency"
            className="px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs font-bold text-slate-200 cursor-pointer focus:outline-none"
          >
            <option value="All" className="bg-[#0f131a] text-white">All Currencies</option>
            <option value="INR" className="bg-[#0f131a] text-white">INR</option>
            <option value="USD" className="bg-[#0f131a] text-white">USD</option>
            <option value="OMR" className="bg-[#0f131a] text-white">OMR</option>
            <option value="QAR" className="bg-[#0f131a] text-white">QAR</option>
            <option value="AED" className="bg-[#0f131a] text-white">AED</option>
            <option value="SAR" className="bg-[#0f131a] text-white">SAR</option>
            <option value="EUR" className="bg-[#0f131a] text-white">EUR</option>
            <option value="GBP" className="bg-[#0f131a] text-white">GBP</option>
          </select>

          <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs font-semibold text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={editedOnly}
              onChange={(e) => setEditedOnly(e.target.checked)}
              className="rounded text-amber-500 focus:ring-amber-500 border-white/20 bg-white/10"
            />
            <span>Corrected Only</span>
          </label>

          {/* Import CSV / TSV Option (Opens Import Modal & Appends to existing data) */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/15 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs"
            title="Import donation receipts from CSV / TSV file or paste text directly"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>Import CSV / TSV</span>
          </button>

          <input
            type="file"
            id="receipt-file-input"
            ref={fileInputRef}
            onChange={handleImportCSVFile}
            accept=".csv,.tsv,.txt,.xlsx,.xls,text/csv,text/tab-separated-values,text/plain,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
          />

          {/* Sample CSV Template */}
          <button
            onClick={downloadSampleCSV}
            className="px-2.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1 transition"
            title="Download formatted sample CSV file template"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
            <span>Sample</span>
          </button>

          {/* Clear Except 1-6 Button */}
          {onClearExcept1To6 && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all receipts except receipts 1 to 6 (TH0001 - TH0006)?\n\nThis will permanently delete all records beyond #6.')) {
                  onClearExcept1To6();
                }
              }}
              className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              title="Keep only receipts 1 to 6 and clear all others"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Keep 1-6 Only</span>
            </button>
          )}

          {/* Export CSV Button */}
          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 text-xs font-black shadow-md flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

      </div>

      {/* Receipts Table */}
      <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/[0.08] text-[11px] font-bold text-slate-400 uppercase tracking-widest select-none">
                <th className="py-3.5 px-5">Receipt No</th>
                <th className="py-3.5 px-5">Date</th>
                <th className="py-3.5 px-5">Donor Name</th>
                <th className="py-3.5 px-5">Purpose</th>
                <th className="py-3.5 px-5 text-right">Donation Amount</th>
                <th className="py-3.5 px-5 text-right">Indian Value (₹)</th>
                <th className="py-3.5 px-5 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.05] text-xs">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                    No donation receipts match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.03] transition group">
                    
                    {/* Receipt No like "TH0001" */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono tabular-nums font-black text-amber-300 bg-white/[0.06] border border-white/10 px-2.5 py-1 rounded-lg shadow-xs">
                          {r.receiptNo}
                        </span>
                        {r.isEdited && (
                          <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded" title="This receipt was edited / corrected">
                            Corrected
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-5 font-mono tabular-nums font-medium text-slate-300 whitespace-nowrap">
                      {formatDateDisplay(r.date)}
                    </td>

                    {/* Donor Name & Phone */}
                    <td className="py-4 px-5">
                      <div className="font-bold text-white group-hover:text-amber-300 transition">
                        {r.donorName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono tabular-nums flex items-center gap-2 mt-0.5">
                        {r.donorPhone && <span>{r.donorPhone}</span>}
                        {r.donorPAN && <span className="bg-white/10 px-1.5 py-0.2 rounded font-bold text-slate-300">PAN: {r.donorPAN}</span>}
                      </div>
                    </td>

                    {/* Purpose */}
                    <td className="py-4 px-5">
                      <span className="font-semibold text-slate-200 line-clamp-1 max-w-[200px]">
                        {r.purpose}
                      </span>
                      <span className="text-[10px] text-slate-400 block">{r.paymentMethod}</span>
                    </td>

                    {/* Amount & Currency */}
                    <td className="py-4 px-5 text-right font-mono tabular-nums font-bold text-white">
                      {r.currency} {r.donationAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Indian Value (INR) */}
                    <td className="py-4 px-5 text-right font-mono tabular-nums font-black text-amber-300 text-sm">
                      {r.indianValue ? `₹ ${r.indianValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        
                        {/* Download PDF directly */}
                        <button
                          onClick={() => onViewReceipt(r, true)}
                          aria-label={`Download PDF for receipt #${r.receiptNo} of ${r.donorName}`}
                          title={`Instantly download official A5 PDF for #${r.receiptNo}`}
                          className="px-2.5 py-1.5 min-h-[36px] rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-[11px] flex items-center gap-1 shadow-sm transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>PDF</span>
                        </button>

                        {/* View Classic Minimal Receipt */}
                        <button
                          onClick={() => onViewReceipt(r, false)}
                          aria-label={`View receipt #${r.receiptNo} of ${r.donorName}`}
                          title="View Receipt & Print"
                          className="p-2 min-h-[36px] min-w-[36px] rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-slate-300 hover:text-white border border-white/15 text-[11px] flex items-center justify-center transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                        </button>

                        {/* Edit Option for Corrections */}
                        <button
                          onClick={() => onEditReceipt(r)}
                          aria-label={`Edit receipt #${r.receiptNo} of ${r.donorName}`}
                          title="Edit / Correct particulars of this receipt"
                          className="p-2 min-h-[36px] min-w-[36px] rounded-xl bg-white/[0.06] hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-white/10 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* WhatsApp Link */}
                        <button
                          onClick={() => {
                            const text = `Assalamu Alaikum *${r.donorName}*,\n\nOfficial receipt *${r.receiptNo}* for your donation of *${r.currency} ${r.donationAmount}* has been issued by Al-Huda Charitable Trust.\n\nThank you for your generous contribution.`;
                            const clean = (r.donorPhone || '').replace(/\D/g, '');
                            window.open(clean ? `https://wa.me/${clean}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                          }}
                          aria-label={`Send WhatsApp for receipt #${r.receiptNo} to ${r.donorName}`}
                          title="Send receipt details via WhatsApp"
                          className="p-2 min-h-[36px] min-w-[36px] rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none cursor-pointer flex items-center justify-center"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>

                        {/* Email Link with Staff Role Permission */}
                        <button
                          onClick={() => {
                            const hasMailPerm = hasUserPermission(user?.role, user?.email, 'canSendMail');
                            if (!hasMailPerm) {
                              alert(`⚠️ Permission Restricted\n\nYour account role (${user?.role || 'Staff'}) does not have "Permission to Mail".\n\nPlease request an Administrator or Owner (${OWNER_EMAIL}) to enable "Permission to Mail" in Settings.`);
                              return;
                            }
                            const subject = encodeURIComponent(`Official Donation Receipt ${r.receiptNo} - Al-Huda Charitable Trust`);
                            const body = encodeURIComponent(`Dear ${r.donorName},\n\nHere is your official donation receipt ${r.receiptNo} for ${r.currency} ${r.donationAmount} (Indian Value: ₹${r.indianValue || r.donationAmount}) issued by Al-Huda Charitable Trust.\n\nPurpose: ${r.purpose}\nDate: ${r.date}\nPayment Mode: ${r.paymentMethod}\n\nThank you for your generous support.`);
                            window.location.href = `mailto:${r.donorEmail || ''}?subject=${subject}&body=${body}`;
                          }}
                          aria-label={`Send email for receipt #${r.receiptNo} to ${r.donorName}`}
                          title="Dispatch receipt particulars via Email (Requires Staff Mail Permission)"
                          className="p-2 min-h-[36px] min-w-[36px] rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none cursor-pointer flex items-center justify-center"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete (Admin or Owner only) */}
                        {isAdminOrOwner && (
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete receipt ${r.receiptNo}?`)) {
                                onDeleteReceipt(r.id);
                              }
                            }}
                            aria-label={`Delete receipt #${r.receiptNo}`}
                            title="Delete receipt (Admin/Owner only)"
                            className="p-2 min-h-[36px] min-w-[36px] rounded-xl bg-white/[0.04] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/10 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none cursor-pointer flex items-center justify-center"
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

        {/* Footer */}
        <div className="px-6 py-4 bg-white/[0.01] border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
          <span>
            Displaying <strong className="text-white">{filteredReceipts.length}</strong> of <strong className="text-white">{receipts.length}</strong> total records
          </span>
          <span className="font-semibold text-slate-300">
            Section 80G Statutory Donation Register
          </span>
        </div>

      </div>

      {/* Import CSV / TSV Dialog Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#11141c] rounded-3xl max-w-xl w-full p-6 sm:p-7 border border-white/15 shadow-2xl space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Import Donation Receipts</h3>
                  <p className="text-[11px] text-slate-400">
                    Supports CSV, TSV (Excel copy-paste), or text files. Merges safely with existing data.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab switch: File Upload vs Paste Text */}
            <div className="flex items-center gap-2 p-1 rounded-2xl bg-white/[0.04] border border-white/10">
              <button
                type="button"
                onClick={() => setImportTab('upload')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  importTab === 'upload'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File (.xlsx / .csv / .tsv)</span>
              </button>
              <button
                type="button"
                onClick={() => setImportTab('paste')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  importTab === 'paste'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>Paste Rows Directly</span>
              </button>
            </div>

            {/* TAB 1: File Upload */}
            {importTab === 'upload' && (
              <div className="space-y-4">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(false);
                  }}
                  onDrop={handleDropFile}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-8 border-2 border-dashed rounded-3xl text-center cursor-pointer transition group ${
                    isDragging
                      ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
                      : 'border-white/20 hover:border-amber-400/60 bg-white/[0.02] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto mb-3 group-hover:scale-105 transition-transform">
                    {isImporting ? (
                      <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <FileSpreadsheet className="w-6 h-6" />
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    {isImporting ? 'Processing donation data...' : isDragging ? 'Drop your file here' : 'Click to Select File or Drag & Drop'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Accepts Excel (.xlsx, .xls), TSV (tab-delimited), CSV, or text exports.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono font-bold text-emerald-300">
                      Excel .xlsx / .xls
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] font-mono font-bold text-amber-300">
                      TSV & Tab-delimited
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] font-mono font-bold text-blue-300">
                      Comma CSV
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/10 text-[11px] font-mono font-bold text-slate-300">
                      Auto DD/MM/YYYY
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Need an example file format?</span>
                  <button
                    type="button"
                    onClick={downloadSampleCSV}
                    className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Sample Template</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Paste Rows Directly */}
            {importTab === 'paste' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">
                    Paste Rows (Header + Data rows from Excel/Sheets):
                  </label>
                  {pastedCSVText && (
                    <span className="text-[11px] font-mono text-amber-400 font-bold">
                      ~{pastedCSVText.trim().split(/\r\n|\n/).length} lines detected
                    </span>
                  )}
                </div>

                <textarea
                  value={pastedCSVText}
                  onChange={(e) => setPastedCSVText(e.target.value)}
                  rows={8}
                  placeholder={`Receipt No\tDate\tDonor Name\tDonation Amount\tCurrency\tPurpose\nTH0007\t20/02/2026\tIEC QATAR\t14,498\tINR\tFOOD KIT...`}
                  className="w-full p-3.5 rounded-2xl bg-white/[0.04] border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-amber-400 focus:bg-white/[0.07] leading-relaxed resize-y"
                />

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setPastedCSVText('');
                    }}
                    className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-400 hover:text-white text-xs font-bold transition cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    disabled={!pastedCSVText.trim()}
                    onClick={() => processRawImportText(pastedCSVText, 'Pasted Data')}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 disabled:opacity-50 text-slate-950 text-xs font-black shadow-md flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import & Merge Pasted Data</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
      {importSummary && importSummary.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#11141c] rounded-3xl max-w-md w-full p-6 border border-white/15 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">CSV Data Imported Successfully</h3>
                  <p className="text-[11px] text-slate-400 truncate max-w-[240px]">
                    From: {importSummary.filename}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setImportSummary(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  New Records Added
                </span>
                <span className="text-2xl font-black text-emerald-400 font-mono mt-0.5 block">
                  +{importSummary.addedCount}
                </span>
                <span className="text-[10px] text-slate-500">Appended to ledger</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Existing Updated
                </span>
                <span className="text-2xl font-black text-amber-300 font-mono mt-0.5 block">
                  {importSummary.updatedCount}
                </span>
                <span className="text-[10px] text-slate-500">Merged by receipt #</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300/90 leading-relaxed">
              <span className="font-bold text-emerald-200">✓ Safe Data Merge: </span>
              All existing records have been preserved intact. {importSummary.totalImported} total records from the CSV file were processed into the live register.
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setImportSummary(null)}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-xs font-black shadow-md hover:from-amber-300 hover:to-orange-400 transition cursor-pointer"
              >
                View Updated Register
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
