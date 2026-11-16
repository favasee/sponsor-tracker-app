'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { AuthUser, AppPrivilege, OWNER_EMAIL, AccessRequest, AccessStatus } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  signInWithGoogle: (requestedRole?: AppPrivilege) => Promise<void>;
  loginAsOwner: () => void;
  loginCustomUser: (email: string, name: string, preferredRole: AppPrivilege) => void;
  signOut: () => void;
  assignUserRole: (userId: string, newRole: AppPrivilege) => void;
  deleteUser: (userId: string) => void;
  registeredUsers: AuthUser[];
  isOwner: boolean;

  // Google Sheets Style Access Request System
  accessRequests: AccessRequest[];
  pendingRequests: AccessRequest[];
  submitAccessRequest: (email: string, name: string, requestedRole: 'admin' | 'staff', message?: string) => { status: AccessStatus; message: string };
  approveAccessRequest: (requestId: string, role: 'admin' | 'staff') => void;
  rejectAccessRequest: (requestId: string) => void;
  deleteAccessRequest: (requestId: string) => void;
  checkAccessStatus: (email: string) => { status: AccessStatus | 'none'; request?: AccessRequest; user?: AuthUser };
  loginApprovedUser: (email: string) => { success: boolean; reason?: 'pending' | 'rejected' | 'not_found' };
}

const AUTH_STORAGE_KEY = 'classic_receipt_auth_user_v2';
const USERS_LIST_STORAGE_KEY = 'classic_receipt_registered_users_v2';
const ACCESS_REQUESTS_STORAGE_KEY = 'classic_receipt_access_requests_v3';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initial known users list for demo & role assignment
const INITIAL_REGISTERED_USERS: AuthUser[] = [
  {
    id: 'usr-owner-1',
    email: OWNER_EMAIL,
    name: 'Foundation Owner (IT Fundest)',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    role: 'owner',
    isOwner: true,
    accessStatus: 'approved',
    provider: 'google',
    createdAt: '2026-10-01T08:00:00Z',
  },
  {
    id: 'usr-admin-1',
    email: 'finance.admin@thaqaful.org',
    name: 'Ameenur Rahman (Finance Admin)',
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=AR&backgroundColor=0f172a',
    role: 'admin',
    isOwner: false,
    accessStatus: 'approved',
    provider: 'google',
    createdAt: '2026-10-15T10:00:00Z',
  },
  {
    id: 'usr-staff-1',
    email: 'counter.staff@thaqaful.org',
    name: 'Zaid Farhan (Desk Officer)',
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=ZF&backgroundColor=0f172a',
    role: 'staff',
    isOwner: false,
    accessStatus: 'approved',
    provider: 'google',
    createdAt: '2026-10-20T11:30:00Z',
  },
];

// Initial demo access requests so Owner immediately sees how to Approve as Editor/Viewer or Reject
const INITIAL_ACCESS_REQUESTS: AccessRequest[] = [
  {
    id: 'req-demo-1',
    email: 'fathima.zahra@gmail.com',
    name: 'Fathima Zahra',
    requestedRole: 'staff',
    message: 'Counter officer for branch collection desk and A5 receipt generation.',
    status: 'pending',
    requestedAt: '2026-11-01T08:30:00Z',
  },
  {
    id: 'req-demo-2',
    email: 'tariq.audit@al-huda.org',
    name: 'Tariq Mansoor (Internal Auditor)',
    requestedRole: 'admin',
    message: 'Requesting Editor access to reconcile monthly 80G statutory registries.',
    status: 'pending',
    requestedAt: '2026-11-01T09:15:00Z',
  },
];

export const DEFAULT_ACTIVE_USER: AuthUser = {
  id: 'usr-admin-1',
  email: 'admin@thaibaheritage.com',
  name: 'Thaiba Administrator',
  avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=TH&backgroundColor=0284c7',
  role: 'owner',
  isOwner: true,
  accessStatus: 'approved',
  provider: 'mock',
  createdAt: '2026-10-01T08:00:00Z',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(DEFAULT_ACTIVE_USER);
  const [registeredUsers, setRegisteredUsers] = useState<AuthUser[]>(INITIAL_REGISTERED_USERS);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>(INITIAL_ACCESS_REQUESTS);
  const [isLoading, setIsLoading] = useState(false);

  // Load user session & access requests on mount
  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem(USERS_LIST_STORAGE_KEY);
      if (storedUsers) {
        setRegisteredUsers(JSON.parse(storedUsers));
      } else {
        localStorage.setItem(USERS_LIST_STORAGE_KEY, JSON.stringify(INITIAL_REGISTERED_USERS));
      }

      const storedRequests = localStorage.getItem(ACCESS_REQUESTS_STORAGE_KEY);
      if (storedRequests) {
        setAccessRequests(JSON.parse(storedRequests));
      } else {
        localStorage.setItem(ACCESS_REQUESTS_STORAGE_KEY, JSON.stringify(INITIAL_ACCESS_REQUESTS));
      }

      // Check if custom user was stored, otherwise default to active admin
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(DEFAULT_ACTIVE_USER);
      }
    } catch (e) {
      console.warn('Auth local session load failed:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pendingRequests = useMemo(() => {
    return accessRequests.filter((r) => r.status === 'pending');
  }, [accessRequests]);

  // Helper to persist access requests
  const saveRequests = (updated: AccessRequest[]) => {
    setAccessRequests(updated);
    try {
      localStorage.setItem(ACCESS_REQUESTS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving access requests:', e);
    }
  };

  // Submit new access request (Google Sheet style)
  const submitAccessRequest = (
    email: string,
    name: string,
    requestedRole: 'admin' | 'staff',
    message?: string
  ): { status: AccessStatus; message: string } => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim() || cleanEmail.split('@')[0];

    // 1. If Owner, instant approval
    if (cleanEmail === OWNER_EMAIL.toLowerCase()) {
      loginAsOwner();
      return { status: 'approved', message: 'Owner recognized! Entering portal immediately.' };
    }

    // 2. Check if already an approved registered user
    const existingUser = registeredUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existingUser && existingUser.accessStatus !== 'rejected') {
      loginApprovedUser(cleanEmail);
      return { status: 'approved', message: `Welcome back! Logged in as ${existingUser.role}.` };
    }

    // 3. Check existing request
    const existingReq = accessRequests.find((r) => r.email.toLowerCase() === cleanEmail);
    if (existingReq) {
      if (existingReq.status === 'approved') {
        loginApprovedUser(cleanEmail);
        return { status: 'approved', message: 'Your request is already approved! Entering portal.' };
      }

      // Re-submit if pending or previously rejected
      const updatedReq: AccessRequest = {
        ...existingReq,
        name: cleanName,
        requestedRole,
        message: message?.trim() || existingReq.message,
        status: 'pending',
        requestedAt: new Date().toISOString(),
      };
      const updatedList = accessRequests.map((r) => (r.id === existingReq.id ? updatedReq : r));
      saveRequests(updatedList);
      return {
        status: 'pending',
        message: 'Your access request has been sent to the Owner. You will be able to enter as soon as the Owner approves.',
      };
    }

    // 4. Create new pending access request
    const newReq: AccessRequest = {
      id: `req-${Date.now()}`,
      email: cleanEmail,
      name: cleanName,
      requestedRole,
      message: message?.trim(),
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };

    saveRequests([newReq, ...accessRequests]);
    return {
      status: 'pending',
      message: 'Access requested! The Owner has been notified to approve you as Editor (Admin) or Viewer (Staff).',
    };
  };

  // Owner action 1: Approve as Editor (Admin) or Viewer (Staff)
  const approveAccessRequest = (requestId: string, role: 'admin' | 'staff') => {
    const target = accessRequests.find((r) => r.id === requestId);
    if (!target) return;

    const now = new Date().toISOString();
    const updatedRequests = accessRequests.map((r) => {
      if (r.id === requestId) {
        return {
          ...r,
          status: 'approved' as AccessStatus,
          approvedRole: role,
          respondedAt: now,
          respondedBy: OWNER_EMAIL,
        };
      }
      return r;
    });
    saveRequests(updatedRequests);

    // Add or update in registeredUsers directory
    const cleanEmail = target.email.toLowerCase();
    const existingUserIndex = registeredUsers.findIndex((u) => u.email.toLowerCase() === cleanEmail);
    let updatedUsersList: AuthUser[];

    if (existingUserIndex >= 0) {
      updatedUsersList = registeredUsers.map((u, i) => {
        if (i === existingUserIndex) {
          return {
            ...u,
            role,
            accessStatus: 'approved' as AccessStatus,
          };
        }
        return u;
      });
    } else {
      const newUser: AuthUser = {
        id: `usr-${Date.now()}`,
        email: target.email,
        name: target.name,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(target.name)}&backgroundColor=0f172a`,
        role,
        accessStatus: 'approved',
        isOwner: false,
        provider: 'google',
        createdAt: now,
      };
      updatedUsersList = [newUser, ...registeredUsers];
    }

    setRegisteredUsers(updatedUsersList);
    localStorage.setItem(USERS_LIST_STORAGE_KEY, JSON.stringify(updatedUsersList));

    // If currently logged in user matches, update active role too
    if (user && user.email.toLowerCase() === cleanEmail) {
      const updatedUser = { ...user, role, accessStatus: 'approved' as AccessStatus };
      setUser(updatedUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
    }
  };

  // Owner action 2: Reject access request
  const rejectAccessRequest = (requestId: string) => {
    const target = accessRequests.find((r) => r.id === requestId);
    if (!target) return;

    const now = new Date().toISOString();
    const updatedRequests = accessRequests.map((r) => {
      if (r.id === requestId) {
        return {
          ...r,
          status: 'rejected' as AccessStatus,
          respondedAt: now,
          respondedBy: OWNER_EMAIL,
        };
      }
      return r;
    });
    saveRequests(updatedRequests);

    // If user was in registered users, mark as rejected
    const cleanEmail = target.email.toLowerCase();
    const updatedUsersList = registeredUsers.map((u) => {
      if (u.email.toLowerCase() === cleanEmail && !u.isOwner) {
        return { ...u, accessStatus: 'rejected' as AccessStatus };
      }
      return u;
    });
    setRegisteredUsers(updatedUsersList);
    localStorage.setItem(USERS_LIST_STORAGE_KEY, JSON.stringify(updatedUsersList));

    // If this user was currently viewing, disconnect them immediately
    if (user && user.email.toLowerCase() === cleanEmail) {
      setUser(null);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  };

  // Delete an access request record from history
  const deleteAccessRequest = (requestId: string) => {
    const updated = accessRequests.filter((r) => r.id !== requestId);
    saveRequests(updated);
  };

  // Check the access status of any email
  const checkAccessStatus = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return { status: 'none' as const };

    if (cleanEmail === OWNER_EMAIL.toLowerCase()) {
      return { status: 'approved' as const };
    }

    // Check requests first
    const req = accessRequests.find((r) => r.email.toLowerCase() === cleanEmail);
    const regUser = registeredUsers.find((u) => u.email.toLowerCase() === cleanEmail);

    if (req) {
      return { status: req.status, request: req, user: regUser };
    }

    if (regUser) {
      return { status: (regUser.accessStatus || 'approved') as AccessStatus, user: regUser };
    }

    return { status: 'none' as const };
  };

  // Login a user who is approved
  const loginApprovedUser = (email: string): { success: boolean; reason?: 'pending' | 'rejected' | 'not_found' } => {
    const cleanEmail = email.trim().toLowerCase();

    if (cleanEmail === OWNER_EMAIL.toLowerCase()) {
      loginAsOwner();
      return { success: true };
    }

    const { status, request, user: regUser } = checkAccessStatus(cleanEmail);

    if (status === 'pending') {
      return { success: false, reason: 'pending' };
    }

    if (status === 'rejected') {
      return { success: false, reason: 'rejected' };
    }

    if (status === 'approved') {
      const targetRole = request?.approvedRole || regUser?.role || 'staff';
      const targetName = regUser?.name || request?.name || cleanEmail.split('@')[0];

      const authUser: AuthUser = {
        id: regUser?.id || `usr-${Date.now()}`,
        email: cleanEmail,
        name: targetName,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(targetName)}&backgroundColor=0f172a`,
        role: targetRole,
        accessStatus: 'approved',
        isOwner: false,
        provider: 'google',
        createdAt: regUser?.createdAt || new Date().toISOString(),
      };

      setUser(authUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
      return { success: true };
    }

    return { success: false, reason: 'not_found' };
  };

  // Quick 1-click login as Master Owner (Itfundest@gmail.com)
  const loginAsOwner = () => {
    const ownerUser: AuthUser = {
      id: 'usr-owner-master',
      email: OWNER_EMAIL,
      name: 'Owner (Itfundest@gmail.com)',
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=IT&backgroundColor=047857',
      role: 'owner',
      accessStatus: 'approved',
      isOwner: true,
      provider: 'google',
      createdAt: new Date().toISOString(),
    };

    setUser(ownerUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(ownerUser));

    // Ensure owner is in directory
    const existing = registeredUsers.filter((u) => u.email.toLowerCase() !== OWNER_EMAIL.toLowerCase());
    const updated = [ownerUser, ...existing];
    setRegisteredUsers(updated);
    localStorage.setItem(USERS_LIST_STORAGE_KEY, JSON.stringify(updated));
  };

  // Direct login for custom user (retains approved role or owner)
  const loginCustomUser = (email: string, name: string, preferredRole: AppPrivilege) => {
    const cleanEmail = email.trim().toLowerCase();
    const isOwner = cleanEmail === OWNER_EMAIL.toLowerCase();

    if (isOwner) {
      loginAsOwner();
      return;
    }

    const existing = registeredUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    const assignedRole = existing ? existing.role : (preferredRole === 'owner' ? 'admin' : preferredRole);

    const newUser: AuthUser = {
      id: existing ? existing.id : `usr-${Date.now()}`,
      email: email.trim(),
      name: name.trim() || email.split('@')[0],
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || email)}&backgroundColor=0f172a`,
      role: assignedRole,
      accessStatus: 'approved',
      isOwner: false,
      provider: 'google',
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
    };

    setUser(newUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));

    const filtered = registeredUsers.filter((u) => u.email.toLowerCase() !== cleanEmail);
    const updatedList = [newUser, ...filtered];
    setRegisteredUsers(updatedList);
    localStorage.setItem(USERS_LIST_STORAGE_KEY, JSON.stringify(updatedList));
  };

  // Google OAuth trigger
  const signInWithGoogle = async (requestedRole: AppPrivilege = 'staff') => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
          },
        });
        if (error) throw error;
      } catch (err: any) {
        console.error('Supabase Google OAuth, using Google profile flow:', err);
        loginCustomUser(
          requestedRole === 'admin' ? 'admin.staff@gmail.com' : 'officer.desk@gmail.com',
          requestedRole === 'admin' ? 'Finance Admin (Google)' : 'Desk Staff (Google)',
          requestedRole
        );
      }
    } else {
      loginCustomUser(
        requestedRole === 'admin' ? 'finance.admin@gmail.com' : 'counter.staff@gmail.com',
        requestedRole === 'admin' ? 'Finance Admin (Google)' : 'Counter Staff (Google)',
        requestedRole
      );
    }
  };

  // Sign out -> resets to default active administrator
  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error(e);
      }
    }
    setUser(DEFAULT_ACTIVE_USER);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  // Owner assigns or changes a user's role (Admin <-> Staff)
  const assignUserRole = (userId: string, newRole: AppPrivilege) => {
    const updatedList = registeredUsers.map((u) => {
      if (u.id === userId) {
        if (u.isOwner || u.email.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
          return u;
        }
        return { ...u, role: newRole };
      }
      return u;
    });

    setRegisteredUsers(updatedList);
    localStorage.setItem(USERS_LIST_STORAGE_KEY, JSON.stringify(updatedList));

    if (user && user.id === userId) {
      const updatedActive = { ...user, role: newRole };
      setUser(updatedActive);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedActive));
    }
  };

  // Delete user account
  const deleteUser = (userId: string) => {
    const target = registeredUsers.find((u) => u.id === userId);
    if (target?.isOwner || target?.email.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
      alert('Cannot delete the primary Owner account.');
      return;
    }
    const filtered = registeredUsers.filter((u) => u.id !== userId);
    setRegisteredUsers(filtered);
    localStorage.setItem(USERS_LIST_STORAGE_KEY, JSON.stringify(filtered));
  };

  const isOwner = Boolean(user && (user.isOwner || user.email.toLowerCase() === OWNER_EMAIL.toLowerCase()));

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signInWithGoogle,
        loginAsOwner,
        loginCustomUser,
        signOut,
        assignUserRole,
        deleteUser,
        registeredUsers,
        isOwner,
        accessRequests,
        pendingRequests,
        submitAccessRequest,
        approveAccessRequest,
        rejectAccessRequest,
        deleteAccessRequest,
        checkAccessStatus,
        loginApprovedUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
