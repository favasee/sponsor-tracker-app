'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AppPrivilege, OWNER_EMAIL } from '@/types';
import { 
  Users, 
  Crown, 
  Shield, 
  UserCheck, 
  X, 
  Trash2, 
  UserPlus, 
  Check, 
  AlertCircle 
} from 'lucide-react';

interface UserRoleManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserRoleManagementModal({
  isOpen,
  onClose,
}: UserRoleManagementModalProps) {
  const { 
    user, 
    registeredUsers, 
    assignUserRole, 
    deleteUser, 
    loginCustomUser, 
    isOwner,
    accessRequests,
    pendingRequests,
    approveAccessRequest,
    rejectAccessRequest,
    deleteAccessRequest
  } = useAuth();

  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<AppPrivilege>('staff');
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'requests'>('requests');

  if (!isOpen) return null;

  const handleAddNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      alert('Email is required');
      return;
    }
    loginCustomUser(newEmail, newName, newRole);
    setNewEmail('');
    setNewName('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#0f1219] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/15 text-white">
        
        {/* Header */}
        <div className="sticky top-0 bg-[#0f1219]/95 backdrop-blur-xl px-6 py-5 border-b border-white/10 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-bold shadow-md">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">
                  Access & Role Governance
                </h3>
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono uppercase">
                  Owner Exclusive
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Logged in as <strong className="text-white">{OWNER_EMAIL}</strong> • Google Sheets Access System
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close role management modal"
            className="w-9 h-9 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-4 flex gap-2 border-b border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'requests'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>Access Requests</span>
            {pendingRequests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>Active Directory</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-slate-300 text-[10px] font-mono">
              {registeredUsers.length}
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* TAB 1: ACCESS REQUESTS (EDITOR, VIEWER, REJECT) */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Incoming Link Access Requests ({pendingRequests.length} Pending)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    When someone clicks your portal link and requests access, approve them as Editor or Viewer, or reject them.
                  </p>
                </div>
              </div>

              {accessRequests.length === 0 ? (
                <div className="text-center py-10 bg-white/[0.02] border border-white/5 rounded-2xl text-slate-400 text-xs">
                  No access requests submitted yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {accessRequests.map((req) => (
                    <div
                      key={req.id}
                      className={`p-4 rounded-2xl border transition-all space-y-3 ${
                        req.status === 'pending'
                          ? 'bg-white/[0.04] border-amber-500/30'
                          : req.status === 'approved'
                          ? 'bg-emerald-500/[0.04] border-emerald-500/20 opacity-80'
                          : 'bg-rose-500/[0.04] border-rose-500/20 opacity-80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{req.name}</span>
                            <span className="text-[10px] font-mono text-slate-400">{req.email}</span>
                          </div>
                          {req.message && (
                            <p className="text-[11px] text-slate-300 italic mt-1">&ldquo;{req.message}&rdquo;</p>
                          )}
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border shrink-0 ${
                          req.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : req.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        }`}>
                          {req.status === 'pending'
                            ? `Wants ${req.requestedRole === 'admin' ? 'Editor' : 'Viewer'}`
                            : req.status === 'approved'
                            ? `Approved (${req.approvedRole})`
                            : 'Rejected'}
                        </span>
                      </div>

                      {/* Three Core Actions: Editor (Admin), Viewer (Staff), Reject */}
                      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => approveAccessRequest(req.id, 'admin')}
                            className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/30 text-xs font-bold transition active:scale-95 cursor-pointer"
                          >
                            Approve Editor (Admin)
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => approveAccessRequest(req.id, 'staff')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 text-xs font-bold transition active:scale-95 cursor-pointer"
                          >
                            Approve Viewer (Staff)
                          </button>

                          <button
                            type="button"
                            onClick={() => rejectAccessRequest(req.id)}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition active:scale-95 cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteAccessRequest(req.id)}
                          className="text-[10px] text-slate-500 hover:text-slate-300 transition"
                        >
                          Clear Record
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ACTIVE DIRECTORY & PRE-AUTHORIZE FORM */}
          {activeTab === 'users' && (
            <div className="space-y-5">
          
          {/* Owner Notice */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200 flex items-start gap-3">
            <Crown className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white">Owner Authority Active: </span>
              As the master owner (<span className="font-mono text-amber-300">{OWNER_EMAIL}</span>), any privilege change you make here takes effect immediately across the user&apos;s active session and database access.
            </div>
          </div>

          {/* Add New Authorized User Button & Form */}
          {showAddForm ? (
            <form onSubmit={handleAddNewUser} className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-white/10">
                <span className="text-xs font-bold text-white">Pre-Authorize New User</span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@gmail.com"
                  className="px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-amber-400"
                />
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Full Name"
                  className="px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400">Assign Role:</span>
                  <button
                    type="button"
                    onClick={() => setNewRole('admin')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      newRole === 'admin' ? 'bg-purple-600 text-white' : 'bg-white/10 text-slate-400'
                    }`}
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRole('staff')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      newRole === 'staff' ? 'bg-emerald-600 text-white' : 'bg-white/10 text-slate-400'
                    }`}
                  >
                    Staff
                  </button>
                </div>

                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-xs font-black shadow-md cursor-pointer"
                >
                  Save & Pre-Authorize
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Authorized Accounts ({registeredUsers.length})
              </span>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-md"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add / Pre-Authorize User</span>
              </button>
            </div>
          )}

          {/* Users Table with Role Switcher */}
          <div className="border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/10 bg-white/[0.02]">
            {registeredUsers.map((u) => {
              const isAccountOwner = u.isOwner || u.email.toLowerCase() === OWNER_EMAIL.toLowerCase();

              return (
                <div
                  key={u.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.04] transition"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={u.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
                      alt={u.name}
                      className="w-10 h-10 rounded-full border border-white/20 object-cover"
                    />
                    <div>
                      <div className="font-bold text-white text-sm flex items-center gap-1.5">
                        <span>{u.name}</span>
                        {isAccountOwner && (
                          <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.2 rounded-full font-mono">
                            👑 OWNER
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {u.email}
                      </div>
                    </div>
                  </div>

                  {/* Role Assignment Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {isAccountOwner ? (
                      <span className="text-xs font-black text-amber-300 bg-amber-500/20 border border-amber-500/30 px-3 py-1 rounded-xl">
                        Primary Owner
                      </span>
                    ) : (
                      <>
                        <div className="flex items-center rounded-xl bg-white/[0.05] p-1 border border-white/10">
                          <button
                            type="button"
                            onClick={() => assignUserRole(u.id, 'admin')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                              u.role === 'admin'
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Admin
                          </button>
                          <button
                            type="button"
                            onClick={() => assignUserRole(u.id, 'staff')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                              u.role === 'staff'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Staff
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Remove account access for ${u.name}?`)) {
                              deleteUser(u.id);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                          title="Remove user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>

  </div>
</div>
  );
}
