export type UserRole = 'super_admin' | 'admin' | 'staff' | 'viewer';
export type AppPrivilege = 'owner' | 'admin' | 'staff';
export type AccessStatus = 'approved' | 'pending' | 'rejected';

export const OWNER_EMAIL = 'Itfundest@gmail.com';

export interface AccessRequest {
  id: string;
  email: string;
  name: string;
  requestedRole: 'admin' | 'staff'; // Editor (Admin) or Viewer (Staff)
  message?: string;
  status: AccessStatus;
  approvedRole?: AppPrivilege;
  requestedAt: string;
  respondedAt?: string;
  respondedBy?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: AppPrivilege;
  accessStatus?: AccessStatus;
  isOwner?: boolean;
  isFirstSignUp?: boolean;
  provider: 'google' | 'mock';
  createdAt: string;
}

export type LanguageCode = 'en' | 'ml' | 'ar' | 'hi' | 'ur' | 'ta';

export type PaymentMethod = 
  | 'Bank'
  | 'Bank Transfer'
  | 'UPI / Online' 
  | 'Cash' 
  | 'Cheque' 
  | 'Card' 
  | 'Direct Debit';

export interface ReceiptEditLog {
  editedAt: string;
  editedBy: string;
  reason?: string;
  previousAmount?: number;
  previousIndianValue?: number;
}

export interface ClassicReceipt {
  id: string;
  receiptNo: string; // e.g. REC-2026-0001
  date: string; // default date YYYY-MM-DD
  donorName: string;
  donorPhone?: string;
  donorEmail?: string;
  donorAddress?: string;
  donorPAN?: string; // For 80G tax receipt
  purpose: string;
  currency: string;
  donationAmount: number;
  exchangeRate: number; // e.g. 84.5 for USD, 1.0 for INR
  indianValue: number; // calculated or custom converted INR value
  amountInWords: string; // In English
  paymentMethod: PaymentMethod;
  paymentReference?: string; // UPI txn ID, Cheque #, etc.
  isEdited?: boolean;
  editLogs?: ReceiptEditLog[];
  templateId?: string; // If created from recurring template
  groupId?: string; // If created from a group/company submission
  groupName?: string; // e.g. "Apex Technologies" or "Thaiba Monthly Circle"
  whatsappStatus?: 'queued' | 'sent' | 'placeholder';
  whatsappSentAt?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringDonorTemplate {
  id: string;
  donorName: string;
  donorPhone?: string;
  donorEmail?: string;
  donorAddress?: string;
  donorPAN?: string;
  defaultAmount: number;
  defaultCurrency: string;
  defaultPurpose: string;
  defaultPaymentMethod: PaymentMethod;
  groupId?: string;
  groupName?: string;
  notes?: string;
  createdAt: string;
}

export interface DonorGroupMember {
  id: string;
  templateId?: string;
  donorName: string;
  donorPhone?: string;
  donorEmail?: string;
  donorAddress?: string;
  donorPAN?: string;
  amount: number;
  currency: string;
  purpose: string;
  paymentMethod: PaymentMethod;
}

export interface DonorGroup {
  id: string;
  name: string; // Company or Group name, e.g. "Al-Huda Staff", "Apex Technologies"
  description?: string;
  defaultPaymentMethod?: PaymentMethod;
  members: DonorGroupMember[];
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  language: LanguageCode;
  type: 'receipt' | 'reminder_upcoming' | 'reminder_due' | 'reminder_overdue';
  message: string;
}

export interface WhatsAppAutomationConfig {
  autoSendEnabled: boolean;
  provider: 'meta_cloud' | 'twilio' | 'custom_webhook';
  webhookUrl: string;
  apiToken: string;
  phoneNumberId: string;
  templateName: string;
  autoSendDelaySeconds: number;
  customMessageTemplate: string;
}

// Retaining previous types for full backward compatibility
export type ReminderFrequency = 'Monthly' | 'Quarterly' | 'Bi-Annual' | 'Annual' | 'One-time';
export type SponsorStatus = 'Active' | 'Paused' | 'Completed' | 'Overdue';
export type ReceiptStatus = 'Sent' | 'Draft' | 'Paid' | 'Cancelled';

export interface Sponsor {
  id: string;
  name: string;
  countryCode: string;
  phone: string;
  fullPhone: string;
  email?: string;
  language: LanguageCode;
  paymentMode: PaymentMethod;
  reminderFrequency: ReminderFrequency;
  reminderDay: number;
  category: string;
  pledgedAmount: number;
  currency: string;
  status: SponsorStatus;
  lastPaymentDate?: string;
  nextDueDate: string;
  notes?: string;
  createdAt: string;
}

export interface Receipt {
  id: string;
  receiptNo: string;
  sponsorId?: string;
  payerName: string;
  countryCode: string;
  phone: string;
  fullPhone: string;
  amount: number;
  currency: string;
  category: string;
  paymentMethod: PaymentMethod;
  status: ReceiptStatus;
  issuedDate: string;
  notes?: string;
  whatsappSentAt?: string;
  createdAt: string;
}
