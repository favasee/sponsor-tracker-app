'use client';

import React, { useState } from 'react';
import { useRole, ROLE_LABELS } from '@/context/RoleContext';
import { UserRole } from '@/types';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { 
  Shield, 
  Database, 
  Check, 
  X, 
  Copy, 
  Key, 
  Terminal, 
  RefreshCw,
  Sparkles,
  Users
} from 'lucide-react';
import { INITIAL_SPONSORS, INITIAL_RECEIPTS } from '@/lib/constants';

interface SettingsRBACProps {
  onResetData: () => void;
}

export function SettingsRBAC({ onResetData }: SettingsRBACProps) {
  const { role, setRole } = useRole();
  const [copiedSql, setCopiedSql] = useState(false);

  const permissionsMatrix = [
    { action: 'View Sponsor Directory & Receipts', super_admin: true, admin: true, staff: true, viewer: true },
    { action: 'Search, Filter & Export to Excel (.csv)', super_admin: true, admin: true, staff: true, viewer: true },
    { action: 'Issue New Donation Receipts', super_admin: true, admin: true, staff: true, viewer: false },
    { action: 'Send Localized WhatsApp Messages', super_admin: true, admin: true, staff: true, viewer: false },
    { action: 'Register & Edit Sponsors', super_admin: true, admin: true, staff: true, viewer: false },
    { action: 'Delete Sponsors or Receipts', super_admin: true, admin: true, staff: false, viewer: false },
    { action: 'Manage Users & Role Assignment', super_admin: true, admin: false, staff: false, viewer: false },
    { action: 'View System Audit Logs', super_admin: true, admin: false, staff: false, viewer: false },
  ];

  const roles: UserRole[] = ['super_admin', 'admin', 'staff', 'viewer'];

  const copySqlCode = () => {
    const sqlText = `-- Supabase Schema for Donation Sponsor Tracker
-- Copy and run inside your Supabase SQL Editor:
-- Available in file: supabase/schema.sql`;
    navigator.clipboard.writeText(sqlText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          User Roles, Permissions & Supabase Config
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review the four role permission boundaries (Super Admin, Admin, Staff, Viewer) and Supabase database connection details.
        </p>
      </div>

      {/* Role Switcher Demo Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#0B1320] text-white flex items-center justify-center">
            <Users className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Interactive Role Simulation
            </h2>
            <p className="text-xs text-slate-500">
              Select any role below to instantly simulate the application experience and access privileges.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {roles.map((r) => {
            const isSelected = r === role;
            const meta = ROLE_LABELS[r];

            return (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`text-left p-5 rounded-2xl border-2 transition relative flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'border-slate-900 bg-slate-50/50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${meta.badgeClass}`}>
                      {meta.title}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed mt-2">
                    {meta.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-slate-400">
                  {isSelected ? '● Currently Active' : 'Click to Activate'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RBAC Matrix Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">
            Role-Based Access Control (RBAC) Permissions Matrix
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Strictly enforced in application UI and Supabase PostgreSQL Row Level Security (RLS) policies.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <th className="py-3 px-6">Capability / Action</th>
                <th className="py-3 px-4 text-center">Super Admin</th>
                <th className="py-3 px-4 text-center">Admin</th>
                <th className="py-3 px-4 text-center">Staff</th>
                <th className="py-3 px-4 text-center">Viewer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {permissionsMatrix.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-6 font-semibold text-slate-800">
                    {item.action}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {item.super_admin ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {item.admin ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {item.staff ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {item.viewer ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supabase Integration & Setup Details */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Supabase Backend Configuration
              </h3>
              <p className="text-xs text-slate-500">
                {isSupabaseConfigured
                  ? 'Connected to live Supabase Cloud project'
                  : 'Currently operating in Offline-First Local Mode (Zero setup required to run)'}
              </p>
            </div>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
            isSupabaseConfigured
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {isSupabaseConfigured ? 'Live Supabase Sync' : 'Local Hybrid Active'}
          </span>
        </div>

        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-3 text-xs text-slate-700 leading-relaxed">
          <p className="font-bold text-slate-900">
            How to link your own Supabase project:
          </p>
          <ol className="list-decimal pl-4 space-y-1.5">
            <li>Create a project at <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-semibold">supabase.com</a>.</li>
            <li>Open the Supabase SQL Editor and execute the complete schema provided in <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-800">supabase/schema.sql</code>.</li>
            <li>Create a <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-800">.env.local</code> file in this project with:</li>
          </ol>
          <pre className="bg-slate-900 text-slate-200 p-3.5 rounded-xl text-[11px] font-mono overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`}
          </pre>
          <p className="text-slate-500">
            The application automatically switches from local storage mode to Supabase cloud database with zero code changes!
          </p>
        </div>

        {/* Reset Mock Data button */}
        <div className="pt-2 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Want to reset data back to default test sponsors (Anees Rahman, Muhammed Khan, etc.)?
          </p>
          <button
            onClick={onResetData}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

    </div>
  );
}

