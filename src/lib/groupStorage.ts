import { DonorGroup, DonorGroupMember, RecurringDonorTemplate } from '@/types';

const DONOR_GROUPS_KEY = 'classic_donor_groups_v1';

export const INITIAL_DONOR_GROUPS: DonorGroup[] = [
  {
    id: 'grp-corporate-1',
    name: 'Apex Solutions (Corporate Donors)',
    description: 'Corporate monthly contribution group for employees and directors.',
    defaultPaymentMethod: 'Bank Transfer',
    members: [
      {
        id: 'gm-1',
        templateId: 'tmpl-1',
        donorName: 'Anees Rahman',
        donorPhone: '+91 8129755155',
        donorEmail: 'anees.r@example.com',
        donorPAN: 'ABCDE1234F',
        amount: 39600,
        currency: 'INR',
        purpose: 'Hifzul Quran & Religious Education',
        paymentMethod: 'UPI / Online',
      },
      {
        id: 'gm-2',
        templateId: 'tmpl-2',
        donorName: 'Muhammed Khan',
        donorPhone: '+971 501234567',
        donorEmail: 'm.khan@emirates.ae',
        donorAddress: 'Deira, Dubai, UAE',
        amount: 1500,
        currency: 'AED',
        purpose: 'Orphan Care & Sponsorship',
        paymentMethod: 'Bank Transfer',
      },
      {
        id: 'gm-3',
        templateId: 'tmpl-3',
        donorName: 'Fathima Zahra',
        donorPhone: '+91 9847123987',
        donorEmail: 'fathima.z@example.com',
        donorPAN: 'XYZPA5678K',
        amount: 10000,
        currency: 'INR',
        purpose: 'Higher Education Scholarship',
        paymentMethod: 'UPI / Online',
      },
    ],
    createdAt: '2026-10-20T08:00:00Z',
    updatedAt: '2026-10-20T08:00:00Z',
  },
];

export function loadDonorGroups(): DonorGroup[] {
  if (typeof window === 'undefined') return INITIAL_DONOR_GROUPS;
  const raw = localStorage.getItem(DONOR_GROUPS_KEY);
  if (!raw) {
    localStorage.setItem(DONOR_GROUPS_KEY, JSON.stringify(INITIAL_DONOR_GROUPS));
    return INITIAL_DONOR_GROUPS;
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_DONOR_GROUPS;
  } catch {
    return INITIAL_DONOR_GROUPS;
  }
}

export function saveDonorGroup(group: DonorGroup): void {
  if (typeof window === 'undefined') return;
  const list = loadDonorGroups();
  const existingIdx = list.findIndex((g) => g.id === group.id);
  let updated: DonorGroup[];
  if (existingIdx >= 0) {
    updated = [...list];
    updated[existingIdx] = {
      ...group,
      updatedAt: new Date().toISOString(),
    };
  } else {
    updated = [group, ...list];
  }
  localStorage.setItem(DONOR_GROUPS_KEY, JSON.stringify(updated));
}

export function deleteDonorGroup(id: string): void {
  if (typeof window === 'undefined') return;
  const list = loadDonorGroups();
  const filtered = list.filter((g) => g.id !== id);
  localStorage.setItem(DONOR_GROUPS_KEY, JSON.stringify(filtered));
}

/**
 * Synchronizes an individual donor template with its assigned group.
 * If targetGroupId is provided, adds or updates the member in that group.
 * If targetGroupId is empty/changed, cleans up old memberships.
 */
export function syncTemplateWithGroup(template: RecurringDonorTemplate, targetGroupId?: string): void {
  if (typeof window === 'undefined') return;
  const groups = loadDonorGroups();

  let modified = false;

  // 1. Remove this template from any other groups where it might currently reside
  const cleanedGroups = groups.map((g) => {
    if (g.id !== targetGroupId) {
      const filteredMembers = g.members.filter((m) => m.templateId !== template.id);
      if (filteredMembers.length !== g.members.length) {
        modified = true;
        return { ...g, members: filteredMembers, updatedAt: new Date().toISOString() };
      }
    }
    return g;
  });

  // 2. If targetGroupId is specified, add or update member in target group
  if (targetGroupId) {
    const targetGroup = cleanedGroups.find((g) => g.id === targetGroupId);
    if (targetGroup) {
      const existingMemberIdx = targetGroup.members.findIndex((m) => m.templateId === template.id);
      const updatedMemberData: DonorGroupMember = {
        id: existingMemberIdx >= 0 ? targetGroup.members[existingMemberIdx].id : `gm-${template.id}`,
        templateId: template.id,
        donorName: template.donorName.trim(),
        donorPhone: template.donorPhone?.trim() || undefined,
        donorEmail: template.donorEmail?.trim() || undefined,
        donorAddress: template.donorAddress?.trim() || undefined,
        donorPAN: template.donorPAN?.trim().toUpperCase() || undefined,
        amount: template.defaultAmount,
        currency: template.defaultCurrency,
        purpose: template.defaultPurpose,
        paymentMethod: template.defaultPaymentMethod,
      };

      if (existingMemberIdx >= 0) {
        targetGroup.members[existingMemberIdx] = updatedMemberData;
      } else {
        targetGroup.members.push(updatedMemberData);
      }
      targetGroup.updatedAt = new Date().toISOString();
      modified = true;
    }
  }

  if (modified) {
    localStorage.setItem(DONOR_GROUPS_KEY, JSON.stringify(cleanedGroups));
  }
}

/**
 * Removes all references to a deleted template across all groups.
 */
export function removeTemplateFromAllGroups(templateId: string): void {
  if (typeof window === 'undefined') return;
  const groups = loadDonorGroups();
  let modified = false;
  const updated = groups.map((g) => {
    const filtered = g.members.filter((m) => m.templateId !== templateId);
    if (filtered.length !== g.members.length) {
      modified = true;
      return { ...g, members: filtered, updatedAt: new Date().toISOString() };
    }
    return g;
  });
  if (modified) {
    localStorage.setItem(DONOR_GROUPS_KEY, JSON.stringify(updated));
  }
}
