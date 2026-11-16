import { DEFAULT_TEMPLATES } from './constants';
import { LanguageCode } from '@/types';

/**
 * Format raw phone number into clean WhatsApp compatible international string without symbols
 */
export function formatWhatsAppNumber(countryCode: string, phone: string): string {
  // Strip non-digit characters from countryCode and phone
  const cleanCC = countryCode.replace(/\D/g, '');
  let cleanNumber = phone.replace(/\D/g, '');

  // If user entered phone with leading 0 (common in UAE, UK, India, etc.), strip the zero
  if (cleanNumber.startsWith('0')) {
    cleanNumber = cleanNumber.substring(1);
  }

  // If number already contains the country code at start, don't duplicate
  if (cleanNumber.startsWith(cleanCC) && cleanNumber.length > cleanCC.length + 6) {
    return cleanNumber;
  }

  return `${cleanCC}${cleanNumber}`;
}

/**
 * Generate personalized WhatsApp message from template
 */
export function generateWhatsAppMessage(params: {
  type: 'receipt' | 'reminder_due';
  language: LanguageCode;
  name: string;
  amount: number | string;
  currency: string;
  category: string;
  paymentMethod?: string;
  receiptNo?: string;
  date?: string;
  dueDate?: string;
}): string {
  // Find matching template or fallback to English
  const template =
    DEFAULT_TEMPLATES.find((t) => t.type === params.type && t.language === params.language) ||
    DEFAULT_TEMPLATES.find((t) => t.type === params.type && t.language === 'en') ||
    DEFAULT_TEMPLATES[0];

  let text = template.message;

  const formattedAmount =
    typeof params.amount === 'number'
      ? params.amount.toLocaleString('en-US')
      : params.amount;

  text = text
    .replace(/{name}/g, params.name || 'Valued Supporter')
    .replace(/{amount}/g, formattedAmount || '0')
    .replace(/{currency}/g, params.currency || 'INR')
    .replace(/{category}/g, params.category || 'General Support')
    .replace(/{payment_method}/g, params.paymentMethod || 'UPI / Online')
    .replace(/{receipt_no}/g, params.receiptNo || 'TH-00000')
    .replace(/{date}/g, params.date || new Date().toLocaleDateString('en-GB'))
    .replace(/{due_date}/g, params.dueDate || new Date().toLocaleDateString('en-GB'));

  return text;
}

/**
 * Generate full WhatsApp web / mobile dispatch URL
 */
export function getWhatsAppUrl(countryCode: string, phone: string, messageText: string): string {
  const cleanPhone = formatWhatsAppNumber(countryCode, phone);
  const encodedText = encodeURIComponent(messageText);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

