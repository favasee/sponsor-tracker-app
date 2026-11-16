'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AppPrivilege, OWNER_EMAIL } from '@/types';
import { Shield, Check, X, LogIn, LogOut, Sparkles, UserCheck, Crown } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { user, signInWithGoogle, loginCustomUser, signOut, assignUserRole, isOwner } = useAuth();
  const [selectedPrivilege, setSelectedPrivilege] = useState<AppPrivilege>('admin');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Active Account Session
              </h3>
              <p className="text-xs text-slate-500">
                Signed in Google user & privilege credentials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {user ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <img
                  src={user.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
                  alt={user.name}
                  className="w-12 h-12 rounded-full border-2 border-white shadow-xs object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-900 truncate flex items-center gap-1.5">
                    <span>{user.name}</span>
                    {isOwner && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                  </div>
                  <div className="text-xs text-slate-500 font-mono truncate">
                    {user.email}
                  </div>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      isOwner
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : user.role === 'admin'
                        ? 'bg-purple-100 text-purple-700 border-purple-200'
                        : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    }`}>
                      {isOwner ? '👑 Master Owner' : user.role === 'admin' ? '🛡️ Admin' : '👤 Staff'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Role Switcher if Admin or Owner */}
              {(isOwner || user.role === 'admin') && (
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Testing Active Privilege:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => assignUserRole(user.id, 'admin')}
                      className={`p-3 rounded-xl border text-left transition ${
                        user.role === 'admin'
                          ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className="text-xs font-bold">Admin</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Edit/Delete allowed</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => assignUserRole(user.id, 'staff')}
                      className={`p-3 rounded-xl border text-left transition ${
                        user.role === 'staff'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className="text-xs font-bold">Staff</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Issue receipts only</div>
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  signOut();
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out to Login Page</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Sign in with Google to access the portal:
              </p>
              <button
                type="button"
                onClick={() => {
                  signInWithGoogle(selectedPrivilege);
                  onClose();
                }}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2"
              >
                <span>Sign in with Google</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
