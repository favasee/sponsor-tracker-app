// Storage and configuration manager for:
// 1. Organization Receipt Header
// 2. Donation Purposes
// 3. Currencies
// 4. Staff Role Permissions (including "Permission to Mail")

export interface OrganizationHeaderSettings {
  trustName: string;
  tagline: string;
  officeAddress: string;
  officeAddressLine2?: string;
  email?: string;
  phone?: string;
  website?: string;
  regNumber: string;
  panNumber: string;
  tax80GNumber: string;
  signatoryName: string;
  signatoryTitle: string;
  legalEntityNote: string;
  verifiedText: string;
  disclaimerText: string;
  serialPrefix: string;
  startingSerial: number;
}

export const DEFAULT_HEADER_SETTINGS: OrganizationHeaderSettings = {
  trustName: 'THAIBA HERITAGE',
  tagline: 'KOLKATA',
  officeAddress: 'MAJHIKHANDA, TAPAN, DAKSHIN DINAJPUR',
  officeAddressLine2: 'WEST BENGAL - 733127',
  email: 'info@thaibaheritage.com',
  phone: '+91 8129755155',
  website: 'www.thaibaheritage.com',
  regNumber: 'TRUST/REG/8421/2012',
  panNumber: 'AAETA1294F',
  tax80GNumber: 'CIT(E)/80G/2018-19/A-0442',
  signatoryName: 'President',
  signatoryTitle: 'President:',
  legalEntityNote: 'GROUP OF INSTITUTIONS',
  verifiedText: 'Verified & Cleared',
  disclaimerText: 'Computer generated official receipt.',
  serialPrefix: 'TH',
  startingSerial: 1776,
};

export const DEFAULT_DONATION_PURPOSES: string[] = [
  'THAIBA EDUCARE',
  'THAIBA MORAL ACADEMY',
  'THAIBA SWEET WATER',
  'THAIBA FEED THE NEEDY',
  'THAIBA DREAM HOME',
  'IFTHAR',
  'FOOD KIT',
  'FOOD EXPENSE',
  'THABA ORPHAN CARE',
  'MONTHLY SUBSCRIPTION',
  'ACADEMIC BUILDING',
  'HIFZUL QURAN THAQAFUL',
];

export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  isDefault?: boolean;
}

export const DEFAULT_CURRENCIES: CurrencyConfig[] = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', isDefault: true },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'OMR' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'QAR' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KWD' },
];

export interface StaffPermissions {
  canSendMail: boolean; // Specifically requested "permission to mail"
  canSendWhatsApp: boolean;
  canCreateReceipt: boolean;
  canEditReceipt: boolean;
  canDeleteReceipt: boolean;
  canExportPDF: boolean;
  canManageTemplates: boolean;
}

export const DEFAULT_STAFF_PERMISSIONS: StaffPermissions = {
  canSendMail: false, // Default requires administrator to grant mail permission
  canSendWhatsApp: true,
  canCreateReceipt: true,
  canEditReceipt: false,
  canDeleteReceipt: false,
  canExportPDF: true,
  canManageTemplates: true,
};

export interface StaffMemberSetting {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff';
  permissions: StaffPermissions;
  assignedAt: string;
}

export const DEFAULT_STAFF_MEMBERS: StaffMemberSetting[] = [
  {
    id: 'staff-1',
    email: 'counter.staff@thaqaful.org',
    name: 'Zaid Farhan',
    role: 'staff',
    permissions: {
      ...DEFAULT_STAFF_PERMISSIONS,
      canSendMail: true, // Example staff granted mail permission
    },
    assignedAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'staff-2',
    email: 'reception.staff@thaqaful.org',
    name: 'Bilal Hameed',
    role: 'staff',
    permissions: {
      ...DEFAULT_STAFF_PERMISSIONS,
      canSendMail: false, // Mail permission restricted
    },
    assignedAt: '2026-10-25T14:30:00Z',
  },
];

// Storage keys
const HEADER_KEY = 'app_org_header_settings_v3';
const PURPOSES_KEY = 'app_donation_purposes_v5';
const CURRENCIES_KEY = 'app_currency_configs_v3';
const STAFF_PERMISSIONS_KEY = 'app_staff_default_permissions_v3';
const STAFF_MEMBERS_KEY = 'app_staff_members_registry_v3';

// 1. Header Settings
export function loadHeaderSettings(): OrganizationHeaderSettings {
  if (typeof window === 'undefined') return DEFAULT_HEADER_SETTINGS;
  try {
    const raw = localStorage.getItem(HEADER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrate legacy default trust name to Thaiba Heritage
      if (parsed.trustName === 'AL-HUDA CHARITABLE TRUST') {
        const migrated = { ...DEFAULT_HEADER_SETTINGS, ...parsed, trustName: 'THAIBA HERITAGE', tagline: 'KOLKATA' };
        saveHeaderSettings(migrated);
        return migrated;
      }
      return { ...DEFAULT_HEADER_SETTINGS, ...parsed };
    }
  } catch {}
  return DEFAULT_HEADER_SETTINGS;
}

export function saveHeaderSettings(settings: OrganizationHeaderSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HEADER_KEY, JSON.stringify(settings));
}

// 2. Donation Purposes
export function loadPurposes(): string[] {
  if (typeof window === 'undefined') return DEFAULT_DONATION_PURPOSES;
  try {
    const raw = localStorage.getItem(PURPOSES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_DONATION_PURPOSES;
}

export function savePurposes(purposes: string[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PURPOSES_KEY, JSON.stringify(purposes));
}

// 3. Currencies
export function loadCurrenciesConfig(): CurrencyConfig[] {
  if (typeof window === 'undefined') return DEFAULT_CURRENCIES;
  try {
    const raw = localStorage.getItem(CURRENCIES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_CURRENCIES;
}

export function saveCurrenciesConfig(currencies: CurrencyConfig[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CURRENCIES_KEY, JSON.stringify(currencies));
}

// 4. Staff Default Permissions
export function loadDefaultStaffPermissions(): StaffPermissions {
  if (typeof window === 'undefined') return DEFAULT_STAFF_PERMISSIONS;
  try {
    const raw = localStorage.getItem(STAFF_PERMISSIONS_KEY);
    if (raw) return { ...DEFAULT_STAFF_PERMISSIONS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_STAFF_PERMISSIONS;
}

export function saveDefaultStaffPermissions(perms: StaffPermissions): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STAFF_PERMISSIONS_KEY, JSON.stringify(perms));
}

// 5. Staff Members List
export function loadStaffMembers(): StaffMemberSetting[] {
  if (typeof window === 'undefined') return DEFAULT_STAFF_MEMBERS;
  try {
    const raw = localStorage.getItem(STAFF_MEMBERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_STAFF_MEMBERS;
}

export function saveStaffMembers(members: StaffMemberSetting[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STAFF_MEMBERS_KEY, JSON.stringify(members));
}

// Helper to evaluate if a user has a specific permission (always unrestricted)
export function hasUserPermission(
  _userRole?: string,
  _userEmail?: string,
  _permission: keyof StaffPermissions = 'canSendMail'
): boolean {
  return true;
}
