'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '@/types';

interface RolePermissions {
  canCreateSponsor: boolean;
  canEditSponsor: boolean;
  canDeleteSponsor: boolean;
  canIssueReceipt: boolean;
  canDeleteReceipt: boolean;
  canSendWhatsApp: boolean;
  canExportData: boolean;
  canManageSettings: boolean;
  canViewAuditLogs: boolean;
}

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  permissions: RolePermissions;
  userEmail: string;
  userName: string;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  super_admin: {
    canCreateSponsor: true,
    canEditSponsor: true,
    canDeleteSponsor: true,
    canIssueReceipt: true,
    canDeleteReceipt: true,
    canSendWhatsApp: true,
    canExportData: true,
    canManageSettings: true,
    canViewAuditLogs: true,
  },
  admin: {
    canCreateSponsor: true,
    canEditSponsor: true,
    canDeleteSponsor: true,
    canIssueReceipt: true,
    canDeleteReceipt: true,
    canSendWhatsApp: true,
    canExportData: true,
    canManageSettings: false,
    canViewAuditLogs: false,
  },
  staff: {
    canCreateSponsor: true,
    canEditSponsor: true,
    canDeleteSponsor: false,
    canIssueReceipt: true,
    canDeleteReceipt: false,
    canSendWhatsApp: true,
    canExportData: true,
    canManageSettings: false,
    canViewAuditLogs: false,
  },
  viewer: {
    canCreateSponsor: false,
    canEditSponsor: false,
    canDeleteSponsor: false,
    canIssueReceipt: false,
    canDeleteReceipt: false,
    canSendWhatsApp: false,
    canExportData: true,
    canManageSettings: false,
    canViewAuditLogs: false,
  },
};

export const ROLE_LABELS: Record<UserRole, { title: string; badgeClass: string; desc: string }> = {
  super_admin: {
    title: 'Super Admin',
    badgeClass: 'bg-purple-100 text-purple-700 border-purple-200',
    desc: 'Full system control, manage users, delete records, view audit logs',
  },
  admin: {
    title: 'Admin',
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
    desc: 'Manage sponsors, issue receipts, trigger reminders, delete entries',
  },
  staff: {
    title: 'Staff',
    badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    desc: 'Create/edit sponsors, issue receipts, send WhatsApp notifications',
  },
  viewer: {
    title: 'Viewer (Read Only)',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    desc: 'View directory & receipts, export to Excel, no modification access',
  },
};

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>('super_admin');
  const [userName, setUserName] = useState<string>('Director Administrator');
  const [userEmail, setUserEmail] = useState<string>('admin@thaqaful.org');

  useEffect(() => {
    const saved = localStorage.getItem('sponsor_app_active_role');
    if (saved && (saved === 'super_admin' || saved === 'admin' || saved === 'staff' || saved === 'viewer')) {
      setRoleState(saved as UserRole);
    }
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('sponsor_app_active_role', newRole);
    
    // Update display user info according to role for realism
    if (newRole === 'super_admin') {
      setUserName('Executive Director');
      setUserEmail('director@thaqaful.org');
    } else if (newRole === 'admin') {
      setUserName('Admin Manager');
      setUserEmail('admin@thaqaful.org');
    } else if (newRole === 'staff') {
      setUserName('Finance Officer');
      setUserEmail('officer@thaqaful.org');
    } else {
      setUserName('Guest Auditor');
      setUserEmail('auditor@thaqaful.org');
    }
  };

  const permissions = ROLE_PERMISSIONS[role];

  return (
    <RoleContext.Provider value={{ role, setRole, permissions, userEmail, userName }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}

