import { ClassicReceipt, RecurringDonorTemplate, WhatsAppAutomationConfig } from '@/types';
import { removeTemplateFromAllGroups } from './groupStorage';

const RECEIPTS_KEY = 'classic_receipts_store_v3';
const TEMPLATES_KEY = 'recurring_donor_templates_store_v3';
const WA_CONFIG_KEY = 'whatsapp_automation_config_v3';

export const INITIAL_CLASSIC_RECEIPTS: ClassicReceipt[] = [
  {
    id: 'rc-th1',
    receiptNo: 'TH0001',
    date: '2026-10-25',
    donorName: 'Anees Rahman',
    donorPhone: '+91 8129755155',
    donorEmail: 'anees.r@example.com',
    donorAddress: 'Calicut, Kerala, India',
    donorPAN: 'ABCDE1234F',
    purpose: 'Hifzul Quran & Religious Education',
    currency: 'INR',
    donationAmount: 39600,
    exchangeRate: 1.0,
    indianValue: 39600,
    amountInWords: 'Rupees Thirty-Nine Thousand Six Hundred Only',
    paymentMethod: 'UPI / Online',
    paymentReference: 'UPI-98234871923',
    whatsappStatus: 'sent',
    whatsappSentAt: '2026-10-25T11:00:00Z',
    notes: 'Long-term recurring Thaqaful education sponsor.',
    createdBy: 'Ahmed Tariq (Admin)',
    createdAt: '2026-10-25T10:45:00Z',
    updatedAt: '2026-10-25T10:45:00Z',
  },
  {
    id: 'rc-th2',
    receiptNo: 'TH0002',
    date: '2026-10-26',
    donorName: 'Muhammed Khan',
    donorPhone: '+971 501234567',
    donorEmail: 'm.khan@emirates.ae',
    donorAddress: 'Deira, Dubai, UAE',
    purpose: 'Orphan Care & Sponsorship',
    currency: 'AED',
    donationAmount: 1500,
    exchangeRate: 23.0,
    indianValue: 34500,
    amountInWords: 'UAE Dirhams One Thousand Five Hundred Only',
    paymentMethod: 'Bank Transfer',
    paymentReference: 'ENBD-TXN-88712',
    whatsappStatus: 'placeholder',
    notes: 'Dubai quarterly orphan support.',
    createdBy: 'Ahmed Tariq (Admin)',
    createdAt: '2026-10-26T14:20:00Z',
    updatedAt: '2026-10-26T14:20:00Z',
  },
  {
    id: 'rc-th3',
    receiptNo: 'TH0003',
    date: '2026-10-27',
    donorName: 'Dr. Abdul Basith',
    donorPhone: '+966 559876543',
    donorEmail: 'basith.md@riyadh.med',
    donorAddress: 'Riyadh, Saudi Arabia',
    purpose: 'Medical Relief & Patient Aid',
    currency: 'USD',
    donationAmount: 500,
    exchangeRate: 84.5,
    indianValue: 42250,
    amountInWords: 'US Dollars Five Hundred Only',
    paymentMethod: 'Card',
    paymentReference: 'STRIPE-CH-918231',
    whatsappStatus: 'placeholder',
    notes: 'Dialysis patient support unit.',
    createdBy: 'Ahmed Tariq (Admin)',
    createdAt: '2026-10-27T09:15:00Z',
    updatedAt: '2026-10-27T09:15:00Z',
  },
  {
    id: 'rc-th4',
    receiptNo: 'TH0004',
    date: '2026-10-28',
    donorName: 'Fathima Zahra',
    donorPhone: '+91 9847123987',
    donorEmail: 'fathima.z@kerala.in',
    donorAddress: 'Kochi, Kerala, India',
    donorPAN: 'XYZPA9988K',
    purpose: 'HIFZUL QURAN THAQAFUL',
    currency: 'INR',
    donationAmount: 10000,
    exchangeRate: 1.0,
    indianValue: 10000,
    amountInWords: 'Rupees Ten Thousand Only',
    paymentMethod: 'Bank',
    notes: 'Annual scholarship donor.',
    createdBy: 'Ahmed Tariq (Admin)',
    createdAt: '2026-10-28T08:30:00Z',
    updatedAt: '2026-10-28T08:30:00Z',
  },
  {
    id: 'rc-th5',
    receiptNo: 'TH0005',
    date: '2026-10-29',
    donorName: 'Sulaiman Haji',
    donorPhone: '+91 9847012345',
    donorEmail: 'sulaiman@example.com',
    donorAddress: 'Malappuram, Kerala, India',
    donorPAN: 'KLMNO5678P',
    purpose: 'THAIBA DREAM HOME',
    currency: 'INR',
    donationAmount: 50000,
    exchangeRate: 1.0,
    indianValue: 50000,
    amountInWords: 'Rupees Fifty Thousand Only',
    paymentMethod: 'Bank Transfer',
    notes: 'Housing project donor.',
    createdBy: 'Ahmed Tariq (Admin)',
    createdAt: '2026-10-29T10:00:00Z',
    updatedAt: '2026-10-29T10:00:00Z',
  },
  {
    id: 'rc-th6',
    receiptNo: 'TH0006',
    date: '2026-11-01',
    donorName: 'NASSER AL-LATIFI',
    donorPhone: '+968 91234567',
    donorEmail: 'nasser.latifi@oman.om',
    donorAddress: 'Muscat, Sultanate of Oman',
    purpose: 'THAIBA EDUCARE',
    currency: 'INR',
    donationAmount: 26000,
    exchangeRate: 1.0,
    indianValue: 26000,
    amountInWords: 'TWENTY SIX THOUSAND RUPEES',
    paymentMethod: 'Bank Transfer',
    paymentReference: 'TXN-99881122',
    notes: 'Thaiba Heritage general education fund.',
    createdBy: 'Ahmed Tariq (Admin)',
    createdAt: '2026-11-01T09:00:00Z',
    updatedAt: '2026-11-01T09:00:00Z',
  },
];

export const INITIAL_RECURRING_TEMPLATES: RecurringDonorTemplate[] = [
  {
    id: 'tmpl-1',
    donorName: 'Anees Rahman',
    donorPhone: '+91 8129755155',
    donorEmail: 'anees.r@example.com',
    donorAddress: 'Calicut, Kerala, India',
    donorPAN: 'ABCDE1234F',
    defaultAmount: 39600,
    defaultCurrency: 'INR',
    defaultPurpose: 'THAIBA EDUCARE',
    defaultPaymentMethod: 'Bank',
    notes: 'Monthly recurring sponsor.',
    createdAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'tmpl-2',
    donorName: 'Muhammed Khan',
    donorPhone: '+971 501234567',
    donorEmail: 'm.khan@emirates.ae',
    donorAddress: 'Dubai, UAE',
    defaultAmount: 1500,
    defaultCurrency: 'AED',
    defaultPurpose: 'THABA ORPHAN CARE',
    defaultPaymentMethod: 'Bank',
    notes: 'Quarterly donor.',
    createdAt: '2026-10-21T11:00:00Z',
  },
  {
    id: 'tmpl-3',
    donorName: 'Fathima Zahra',
    donorPhone: '+91 9847123987',
    donorEmail: 'fathima.z@kerala.in',
    donorAddress: 'Kochi, Kerala, India',
    donorPAN: 'XYZPA9988K',
    defaultAmount: 10000,
    defaultCurrency: 'INR',
    defaultPurpose: 'HIFZUL QURAN THAQAFUL',
    defaultPaymentMethod: 'Bank',
    notes: 'Annual scholarship donor.',
    createdAt: '2026-10-22T08:30:00Z',
  },
];

export const DEFAULT_WA_AUTOMATION_CONFIG: WhatsAppAutomationConfig = {
  autoSendEnabled: false,
  provider: 'meta_cloud',
  webhookUrl: 'https://api.thaqaful.org/v1/webhooks/whatsapp-receipt',
  apiToken: 'EAAG...your_meta_system_user_token_placeholder',
  phoneNumberId: '1098234718234',
  templateName: 'official_donation_receipt_v2',
  autoSendDelaySeconds: 2,
  customMessageTemplate: `Dear *{donor_name}*,\n\nWe gratefully acknowledge your donation of *{currency} {amount}* (Indian Value: *₹{indian_value}*) towards *{purpose}*.\n\nReceipt No: *{receipt_no}*\nDate: *{date}*\nAmount in words: _{amount_words}_\n\nMay the Almighty accept your noble charity.\n\nDownload Official PDF: {pdf_download_url}`,
};

// ================= STORAGE FUNCTIONS =================

export function sanitizeReceiptRecord(r: any): ClassicReceipt {
  const donationAmount = typeof r.donationAmount === 'number'
    ? r.donationAmount
    : (parseFloat(String(r.donationAmount || '0').replace(/,/g, '')) || 0);

  const rawIndian = r.indianValue !== undefined && r.indianValue !== null && r.indianValue !== ''
    ? r.indianValue
    : (r.currency === 'INR' ? donationAmount : donationAmount);

  const indianValue = typeof rawIndian === 'number'
    ? rawIndian
    : (parseFloat(String(rawIndian || '0').replace(/,/g, '')) || donationAmount);

  return {
    ...r,
    donationAmount: isNaN(donationAmount) ? 0 : donationAmount,
    indianValue: isNaN(indianValue) ? 0 : indianValue,
    purpose: typeof r.purpose === 'string' ? r.purpose.trim() : 'THAIBA EDUCARE',
  };
}

export const PRUNE_VERSION_KEY = 'receipts_pruned_except_1_to_6_v1';

export function pruneReceiptsToOnly1To6(list: ClassicReceipt[]): ClassicReceipt[] {
  // Filter receipts matching numbers 1 to 6
  const kept = (list || []).filter((r) => {
    const match = r.receiptNo.match(/(\d+)/);
    if (!match) return false;
    const num = parseInt(match[1], 10);
    return num >= 1 && num <= 6;
  });

  // Ensure all 1 to 6 are present from INITIAL_CLASSIC_RECEIPTS if missing
  const result: ClassicReceipt[] = [...kept];
  for (const initR of INITIAL_CLASSIC_RECEIPTS) {
    const initMatch = initR.receiptNo.match(/(\d+)/);
    const initNum = initMatch ? parseInt(initMatch[1], 10) : 0;
    const alreadyHas = result.some((r) => {
      const m = r.receiptNo.match(/(\d+)/);
      return m && parseInt(m[1], 10) === initNum;
    });
    if (!alreadyHas) {
      result.push(initR);
    }
  }

  // Sort sequentially 1 -> 6
  result.sort((a, b) => {
    const numA = parseInt((a.receiptNo.match(/(\d+)/) || ['0', '0'])[1], 10);
    const numB = parseInt((b.receiptNo.match(/(\d+)/) || ['0', '0'])[1], 10);
    return numA - numB;
  });

  return result;
}

export function loadClassicReceipts(): ClassicReceipt[] {
  if (typeof window === 'undefined') return INITIAL_CLASSIC_RECEIPTS;
  const raw = localStorage.getItem(RECEIPTS_KEY);
  if (!raw) {
    localStorage.setItem(RECEIPTS_KEY, JSON.stringify(INITIAL_CLASSIC_RECEIPTS));
    localStorage.setItem(PRUNE_VERSION_KEY, 'true');
    return INITIAL_CLASSIC_RECEIPTS;
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Auto-prune any old bulk or imported data beyond 1-6 if not yet pruned
      const hasPruned = localStorage.getItem(PRUNE_VERSION_KEY);
      if (!hasPruned) {
        const pruned = pruneReceiptsToOnly1To6(parsed.map(sanitizeReceiptRecord));
        localStorage.setItem(RECEIPTS_KEY, JSON.stringify(pruned));
        localStorage.setItem(PRUNE_VERSION_KEY, 'true');
        return pruned;
      }
      return parsed.map(sanitizeReceiptRecord);
    }
    return INITIAL_CLASSIC_RECEIPTS;
  } catch {
    return INITIAL_CLASSIC_RECEIPTS;
  }
}

export function saveClassicReceipt(receipt: ClassicReceipt): void {
  if (typeof window === 'undefined') return;
  const list = loadClassicReceipts();
  const existingIdx = list.findIndex((r) => r.id === receipt.id);
  let updated: ClassicReceipt[];
  if (existingIdx >= 0) {
    updated = [...list];
    updated[existingIdx] = receipt;
  } else {
    updated = [receipt, ...list];
  }
  localStorage.setItem(RECEIPTS_KEY, JSON.stringify(updated));
}

export function saveAllClassicReceipts(receipts: ClassicReceipt[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(RECEIPTS_KEY, JSON.stringify(receipts));
}

export function deleteClassicReceipt(id: string): void {
  if (typeof window === 'undefined') return;
  const list = loadClassicReceipts();
  const filtered = list.filter((r) => r.id !== id);
  localStorage.setItem(RECEIPTS_KEY, JSON.stringify(filtered));
}

/**
 * Generate next receipt number e.g. TH0001, TH0002, TH0003...
 */
export function getNextClassicReceiptNumber(receipts: ClassicReceipt[]): string {
  if (!receipts || receipts.length === 0) return 'TH0001';

  const numbers = receipts
    .map((r) => {
      const match = r.receiptNo.match(/TH(\d+)/i) || r.receiptNo.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => !isNaN(n));

  const max = numbers.length > 0 ? Math.max(...numbers) : 0;
  const next = max + 1;
  return `TH${String(next).padStart(4, '0')}`;
}

/**
 * Generate multiple sequential receipt numbers e.g. ['TH0004', 'TH0005', 'TH0006']
 */
export function getNextClassicReceiptNumbers(count: number, receipts: ClassicReceipt[]): string[] {
  if (count <= 0) return [];
  const numbers = (receipts || [])
    .map((r) => {
      const match = r.receiptNo.match(/TH(\d+)/i) || r.receiptNo.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => !isNaN(n));

  const max = numbers.length > 0 ? Math.max(...numbers) : 0;
  const result: string[] = [];
  for (let i = 1; i <= count; i++) {
    result.push(`TH${String(max + i).padStart(4, '0')}`);
  }
  return result;
}

// ================= TEMPLATES STORAGE =================

export function loadRecurringTemplates(): RecurringDonorTemplate[] {
  if (typeof window === 'undefined') return INITIAL_RECURRING_TEMPLATES;
  const raw = localStorage.getItem(TEMPLATES_KEY);
  if (!raw) {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(INITIAL_RECURRING_TEMPLATES));
    return INITIAL_RECURRING_TEMPLATES;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_RECURRING_TEMPLATES;
  }
}

export function saveRecurringTemplate(template: RecurringDonorTemplate): void {
  if (typeof window === 'undefined') return;
  const list = loadRecurringTemplates();
  const existingIdx = list.findIndex((t) => t.id === template.id);
  let updated: RecurringDonorTemplate[];
  if (existingIdx >= 0) {
    updated = [...list];
    updated[existingIdx] = template;
  } else {
    updated = [template, ...list];
  }
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(updated));
}

export function deleteRecurringTemplate(id: string): void {
  if (typeof window === 'undefined') return;
  const list = loadRecurringTemplates();
  const filtered = list.filter((t) => t.id !== id);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(filtered));
  removeTemplateFromAllGroups(id);
}

// ================= WA CONFIG STORAGE =================

export function loadWhatsAppAutomationConfig(): WhatsAppAutomationConfig {
  if (typeof window === 'undefined') return DEFAULT_WA_AUTOMATION_CONFIG;
  const raw = localStorage.getItem(WA_CONFIG_KEY);
  if (!raw) {
    localStorage.setItem(WA_CONFIG_KEY, JSON.stringify(DEFAULT_WA_AUTOMATION_CONFIG));
    return DEFAULT_WA_AUTOMATION_CONFIG;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULT_WA_AUTOMATION_CONFIG;
  }
}

export function saveWhatsAppAutomationConfig(config: WhatsAppAutomationConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(WA_CONFIG_KEY, JSON.stringify(config));
}
