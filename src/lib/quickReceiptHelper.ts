import { ClassicReceipt, RecurringDonorTemplate, DonorGroup, DonorGroupMember, PaymentMethod } from '@/types';
import { getNextClassicReceiptNumber, getNextClassicReceiptNumbers } from './receiptStorage';
import { formatAmountInWords } from './numberToWords';

/**
 * Creates a complete ClassicReceipt for an individual sponsor template with 1 click.
 */
export function createReceiptFromTemplate(
  template: RecurringDonorTemplate,
  existingReceipts: ClassicReceipt[],
  customDate?: string,
  paymentMethod?: PaymentMethod,
  paymentRef?: string,
  createdByName?: string
): ClassicReceipt {
  const receiptNo = getNextClassicReceiptNumber(existingReceipts);
  const date = customDate || new Date().toISOString().split('T')[0];
  const amount = template.defaultAmount || 0;
  const currency = template.defaultCurrency || 'INR';
  const method = paymentMethod || template.defaultPaymentMethod || 'UPI / Online';

  const inrVal = currency === 'INR' ? amount : amount;
  const words = formatAmountInWords(amount, currency);

  const newReceipt: ClassicReceipt = {
    id: `rc-quick-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    receiptNo,
    date,
    donorName: template.donorName.trim(),
    donorPhone: template.donorPhone?.trim() || undefined,
    donorEmail: template.donorEmail?.trim() || undefined,
    donorAddress: template.donorAddress?.trim() || undefined,
    donorPAN: template.donorPAN?.trim().toUpperCase() || undefined,
    purpose: template.defaultPurpose || 'General Support',
    currency,
    donationAmount: amount,
    exchangeRate: 1.0,
    indianValue: inrVal,
    amountInWords: words,
    paymentMethod: method,
    paymentReference: paymentRef?.trim() || undefined,
    templateId: template.id,
    groupName: template.groupName,
    notes: template.notes ? `Quick Pay: ${template.notes}` : '1-Click Template Payment',
    whatsappStatus: 'placeholder',
    createdBy: createdByName || 'Authorized User',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return newReceipt;
}

/**
 * Creates separate individual ClassicReceipts for each member of a company or group.
 */
export function createReceiptsFromGroup(
  group: DonorGroup,
  members: DonorGroupMember[],
  existingReceipts: ClassicReceipt[],
  customDate?: string,
  groupPaymentMethod?: PaymentMethod,
  paymentRef?: string,
  createdByName?: string
): ClassicReceipt[] {
  if (!members || members.length === 0) return [];

  const numbers = getNextClassicReceiptNumbers(members.length, existingReceipts);
  const date = customDate || new Date().toISOString().split('T')[0];
  const nowIso = new Date().toISOString();

  return members.map((m, index) => {
    const receiptNo = numbers[index] || `TH${String(Date.now() + index).slice(-4)}`;
    const currency = m.currency || 'INR';
    const amount = m.amount || 0;
    const inrVal = currency === 'INR' ? amount : amount;
    const method = groupPaymentMethod || m.paymentMethod || group.defaultPaymentMethod || 'Bank Transfer';
    const words = formatAmountInWords(amount, currency);

    const receipt: ClassicReceipt = {
      id: `rc-grp-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
      receiptNo,
      date,
      donorName: m.donorName.trim(),
      donorPhone: m.donorPhone?.trim() || undefined,
      donorEmail: m.donorEmail?.trim() || undefined,
      donorAddress: m.donorAddress?.trim() || undefined,
      donorPAN: m.donorPAN?.trim().toUpperCase() || undefined,
      purpose: m.purpose || 'General Support',
      currency,
      donationAmount: amount,
      exchangeRate: 1.0,
      indianValue: inrVal,
      amountInWords: words,
      paymentMethod: method,
      paymentReference: paymentRef ? `${paymentRef} (Group: ${group.name})` : undefined,
      groupId: group.id,
      groupName: group.name,
      templateId: m.templateId,
      notes: `Group Submission: ${group.name} (Monthly Member Contribution)`,
      whatsappStatus: 'placeholder',
      createdBy: createdByName || 'Authorized User',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    return receipt;
  });
}
