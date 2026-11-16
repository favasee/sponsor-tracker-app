'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { OWNER_EMAIL, AccessRequest, AppPrivilege } from '@/types';
import { 
  ShieldCheck, 
  Crown, 
  UserCheck, 
  Shield, 
  Lock, 
  Mail, 
  User, 
  ArrowRight,
  Clock,
  XCircle,
  CheckCircle2,
  FileSpreadsheet,
  Send,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Inbox,
  AlertCircle
} from 'lucide-react';

export function LoginPage() {
  const { 
    loginAsOwner, 
    loginCustomUser, 
    registeredUsers, 
    accessRequests, 
    pendingRequests,
    submitAccessRequest, 
    approveAccessRequest, 
    rejectAccessRequest, 
    checkAccessStatus,
    loginApprovedUser
  } = useAuth();

  // Mode: 'request_access' | 'owner_dashboard' | 'direct_login'
  const [activeTab, setActiveTab] = useState<'request_access' | 'owner_dashboard' | 'direct_login'>('request_access');

  // Request Access Form state
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [requestedRole, setRequestedRole] = useState<'admin' | 'staff'>('staff');
  const [messageInput, setMessageInput] = useState('');
  
  // Feedback state for current user's request
  const [submittedStatus, setSubmittedStatus] = useState<'idle' | 'pending' | 'approved' | 'rejected'>('idle');
  const [statusFeedback, setStatusFeedback] = useState<string>('');
  const [activeCheckedRequest, setActiveCheckedRequest] = useState<AccessRequest | null>(null);

  // Check email status whenever user finishes typing
  const handleCheckEmail = (email: string) => {
    setEmailInput(email);
    if (!email.trim() || !email.includes('@')) {
      setSubmittedStatus('idle');
      setActiveCheckedRequest(null);
      return;
    }

    const { status, request } = checkAccessStatus(email);
    if (status !== 'none') {
      setSubmittedStatus(status);
      if (request) setActiveCheckedRequest(request);
    } else {
      setSubmittedStatus('idle');
      setActiveCheckedRequest(null);
    }
  };

  // Submit access request (Google Sheets "Request Access" flow)
  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      alert('Please enter your email address');
      return;
    }

    const result = submitAccessRequest(emailInput, nameInput, requestedRole, messageInput);
    setSubmittedStatus(result.status);
    setStatusFeedback(result.message);

    const { request } = checkAccessStatus(emailInput);
    if (request) setActiveCheckedRequest(request);
  };

  // When user clicks "Check Status"
  const handleRefreshStatus = () => {
    if (!emailInput.trim()) return;
    const { status, request } = checkAccessStatus(emailInput);
    if (status !== 'none') {
      setSubmittedStatus(status);
      if (request) setActiveCheckedRequest(request);
      if (status === 'approved') {
        loginApprovedUser(emailInput);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#08090C] bg-dot-grid flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Banner Notice: Pending Requests Indicator for Owner */}
      {pendingRequests.length > 0 && activeTab !== 'owner_dashboard' && (
        <div className="mb-4 max-w-xl w-full z-20 animate-in fade-in slide-in-from-top-4 duration-300">
          <button
            onClick={() => setActiveTab('owner_dashboard')}
            className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center justify-between gap-3 shadow-lg shadow-black/40 hover:border-amber-400 transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span className="text-white font-black">Owner Alert:</span>
              <span>
                <strong className="text-amber-300 font-mono tabular-nums">{pendingRequests.length}</strong> access {pendingRequests.length === 1 ? 'request is' : 'requests are'} waiting for Owner approval!
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-amber-400 text-slate-950 font-black text-[11px] shrink-0 flex items-center gap-1">
              <span>Review Now</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </button>
        </div>
      )}

      {/* Main Glassmorphic Card */}
      <div className="max-w-xl w-full bg-white/[0.04] backdrop-blur-2xl rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.7)] border border-white/[0.1] overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Google Sheet Style Header Bar */}
        <div className="p-6 sm:p-8 pb-5 border-b border-white/[0.08] text-center relative">
          
          {/* Google Sheets / Doc Icon Badge */}
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-emerald-600/10 to-transparent border border-emerald-500/30 text-emerald-400 mb-3 shadow-lg shadow-emerald-950/40">
            <FileSpreadsheet className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
              <span>Al-Huda Statutory Document</span>
              <span className="text-slate-500">•</span>
              <span>Section 80G</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Donation Receipt Creator
            </h1>

            <p className="text-xs text-slate-400">
              Restricted Organization Registry • Owner: <span className="text-slate-200 font-mono">{OWNER_EMAIL}</span>
            </p>
          </div>

          {/* Navigation Mode Pill Switcher */}
          <div className="mt-5 flex items-center p-1 rounded-2xl bg-white/[0.03] border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('request_access')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'request_access'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Request Access</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('owner_dashboard')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 relative ${
                activeTab === 'owner_dashboard'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Owner Panel</span>
              {pendingRequests.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold flex items-center justify-center tabular-nums">
                  {pendingRequests.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('direct_login')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'direct_login'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          </div>

        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8">
          
          {/* =========================================================================
              VIEW 1: GOOGLE SHEET STYLE "YOU NEED ACCESS" FORM
              ========================================================================= */}
          {activeTab === 'request_access' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* STATUS STATE: PENDING APPROVAL */}
              {submittedStatus === 'pending' && (
                <div className="p-5 rounded-2xl bg-amber-500/[0.08] border border-amber-500/30 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/30">
                      <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">Access Requested • Pending Owner Approval</h3>
                      <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                        Your request to access this portal has been sent to the primary Owner (<strong className="text-white font-mono">{OWNER_EMAIL}</strong>).
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-400">
                      <span>Requested Account:</span>
                      <span className="font-mono text-white font-bold">{emailInput}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Requested Privilege:</span>
                      <span className="font-bold text-amber-300 capitalize">
                        {activeCheckedRequest?.requestedRole === 'admin' ? 'Editor (Admin)' : 'Viewer (Staff)'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Current Status:</span>
                      <span className="inline-flex items-center gap-1.5 text-amber-400 font-bold">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                        Waiting for Owner Decision
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleRefreshStatus}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Check Approval Status</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSubmittedStatus('idle')}
                      className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-bold transition cursor-pointer"
                    >
                      Switch Email
                    </button>
                  </div>
                </div>
              )}

              {/* STATUS STATE: REJECTED */}
              {submittedStatus === 'rejected' && (
                <div className="p-5 rounded-2xl bg-rose-500/[0.08] border border-rose-500/30 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0 border border-rose-500/30">
                      <XCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-rose-300">Access Request Declined</h3>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        The administrator declined access for <strong className="text-white font-mono">{emailInput}</strong>.
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 bg-black/30 p-3 rounded-xl border border-white/5">
                    If you believe this was an error, please contact the primary authority at{' '}
                    <span className="text-amber-300 font-mono font-bold">{OWNER_EMAIL}</span> or submit a revised request with your official credentials.
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSubmittedStatus('idle')}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Submit New Request
                    </button>
                  </div>
                </div>
              )}

              {/* STATUS STATE: APPROVED */}
              {submittedStatus === 'approved' && (
                <div className="p-5 rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/30 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-500/30">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-emerald-300">Access Approved!</h3>
                      <p className="text-xs text-slate-300 mt-1">
                        Your account has been granted authorization to access the donation receipt portal.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => loginApprovedUser(emailInput)}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition cursor-pointer"
                  >
                    <span>Enter Portal Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* DEFAULT FORM: YOU NEED ACCESS */}
              {submittedStatus === 'idle' && (
                <form onSubmit={handleRequestSubmit} className="space-y-5">
                  
                  <div className="space-y-1">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <span>You need access</span>
                    </h2>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      To open this receipt portal, request access from the owner or choose your requested role.
                    </p>
                  </div>

                  {/* Input 1: Email Address */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Your Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={emailInput}
                        onChange={(e) => handleCheckEmail(e.target.value)}
                        placeholder="yourname@gmail.com or official@al-huda.org"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 transition"
                      />
                    </div>
                    {emailInput.trim().toLowerCase() === OWNER_EMAIL.toLowerCase() && (
                      <p className="text-[11px] text-amber-400 font-bold mt-1.5 flex items-center gap-1">
                        <Crown className="w-3.5 h-3.5 text-amber-400 inline" />
                        Recognized as Master Owner account! You can sign in immediately.
                      </p>
                    )}
                  </div>

                  {/* Input 2: Full Name */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Your Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="Full Name"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 transition"
                      />
                    </div>
                  </div>

                  {/* Input 3: Requested Role (Google Sheet Style: Editor vs Viewer) */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Access Level Requested:
                    </label>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      
                      {/* Editor (Admin) */}
                      <button
                        type="button"
                        onClick={() => setRequestedRole('admin')}
                        className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          requestedRole === 'admin'
                            ? 'bg-purple-500/15 border-purple-500 text-purple-200 shadow-md shadow-purple-500/10'
                            : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.05]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-black text-white flex items-center gap-1.5">
                              <Shield className="w-3.5 h-3.5 text-purple-400" />
                              <span>Editor (Admin)</span>
                            </span>
                            {requestedRole === 'admin' && (
                              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug">
                            Full managerial rights: Issue receipts, edit records, reconcile ledger, and export.
                          </p>
                        </div>
                      </button>

                      {/* Viewer (Staff) */}
                      <button
                        type="button"
                        onClick={() => setRequestedRole('staff')}
                        className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          requestedRole === 'staff'
                            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-500/10'
                            : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.05]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-black text-white flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Viewer (Staff)</span>
                            </span>
                            {requestedRole === 'staff' && (
                              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug">
                            Counter desk rights: Issue 80G receipts, view recent records, and print A5 receipts.
                          </p>
                        </div>
                      </button>

                    </div>
                  </div>

                  {/* Input 4: Message for Owner */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Message (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Reason for requesting access (e.g. Counter officer at Calicut branch)"
                      className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 transition resize-none"
                    />
                  </div>

                  {/* Submit Button (Google Style Blue/Amber Button) */}
                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Request Access</span>
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('owner_dashboard')}
                      className="text-[11px] font-bold text-slate-400 hover:text-amber-300 transition"
                    >
                      Are you the owner? <span className="underline">Switch to Owner Panel</span>
                    </button>
                  </div>

                </form>
              )}

            </div>
          )}

          {/* =========================================================================
              VIEW 2: OWNER REVIEW PANEL (APPROVE AS EDITOR/VIEWER OR REJECT)
              ========================================================================= */}
          {activeTab === 'owner_dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Owner 1-Click Login Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md shrink-0">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>Primary Owner Portal</span>
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono uppercase">
                        Super Authority
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">{OWNER_EMAIL}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={loginAsOwner}
                  className="py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md shrink-0"
                >
                  <span>Sign In as Master Owner</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Pending Requests Section (The Core User Request: Editor, Viewer, Reject) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Inbox className="w-4 h-4 text-amber-400" />
                    <span>Pending Access Requests</span>
                    <span className="font-mono tabular-nums px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px]">
                      {pendingRequests.length}
                    </span>
                  </h3>
                  <span className="text-[10px] text-slate-500">Google Sheet Shared Link Queue</span>
                </div>

                {pendingRequests.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400/60 mx-auto" />
                    <p className="text-xs font-bold text-slate-300">All caught up! No pending access requests.</p>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      When someone opens your portal link and requests access, their request will appear here for you to approve as Editor or Viewer, or reject.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 transition-all space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-white truncate">{req.name}</span>
                              <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-md truncate">
                                {req.email}
                              </span>
                            </div>
                            {req.message && (
                              <p className="text-[11px] text-slate-300 mt-1 italic">&ldquo;{req.message}&rdquo;</p>
                            )}
                          </div>

                          <div className="shrink-0 text-right">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                              req.requestedRole === 'admin'
                                ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            }`}>
                              Wants {req.requestedRole === 'admin' ? 'Editor' : 'Viewer'}
                            </span>
                          </div>
                        </div>

                        {/* THREE ACTION BUTTONS: Editor(Admin), Viewer(Staff), Reject */}
                        <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center gap-2">
                          
                          {/* Option 1: Approve as Editor (Admin) */}
                          <button
                            type="button"
                            onClick={() => approveAccessRequest(req.id, 'admin')}
                            className="flex-1 min-w-[120px] py-2 px-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                            title="Grant Editor (Admin) privileges"
                          >
                            <Shield className="w-3.5 h-3.5 text-purple-400" />
                            <span>Editor (Admin)</span>
                          </button>

                          {/* Option 2: Approve as Viewer (Staff) */}
                          <button
                            type="button"
                            onClick={() => approveAccessRequest(req.id, 'staff')}
                            className="flex-1 min-w-[120px] py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                            title="Grant Viewer (Staff) privileges"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Viewer (Staff)</span>
                          </button>

                          {/* Option 3: Reject */}
                          <button
                            type="button"
                            onClick={() => rejectAccessRequest(req.id)}
                            className="py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
                            title="Decline this access request"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>

                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* History / All Registered Users Overview */}
              <div className="pt-3 border-t border-white/10 space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Approved Users Directory ({registeredUsers.length})
                </div>
                <div className="divide-y divide-white/[0.04] max-h-44 overflow-y-auto">
                  {registeredUsers.map((u) => (
                    <div key={u.id} className="py-2 flex items-center justify-between text-xs">
                      <div className="min-w-0">
                        <span className="font-bold text-white truncate block">{u.name}</span>
                        <span className="font-mono text-[10px] text-slate-500 truncate block">{u.email}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border shrink-0 ${
                        u.isOwner 
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : u.role === 'admin'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}>
                        {u.isOwner ? 'Owner' : u.role === 'admin' ? 'Editor' : 'Viewer'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* =========================================================================
              VIEW 3: DIRECT SIGN IN FOR AUTHORIZED USERS
              ========================================================================= */}
          {activeTab === 'direct_login' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              <div className="space-y-1">
                <h2 className="text-lg font-black text-white">Sign In with Authorized Account</h2>
                <p className="text-xs text-slate-400">
                  Select your pre-authorized profile or enter your approved email address.
                </p>
              </div>

              {/* Quick Authorized Accounts Grid */}
              <div className="space-y-2.5">
                {registeredUsers.map((u) => {
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        if (u.isOwner) {
                          loginAsOwner();
                        } else {
                          loginApprovedUser(u.email);
                        }
                      }}
                      className="w-full p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-amber-400/40 flex items-center justify-between gap-3 transition cursor-pointer text-left group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={u.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
                          alt={u.name}
                          className="w-8 h-8 rounded-full border border-white/20 object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white group-hover:text-amber-300 transition truncate">
                            {u.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">{u.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                          u.isOwner
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : u.role === 'admin'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}>
                          {u.isOwner ? 'Owner' : u.role === 'admin' ? 'Editor' : 'Viewer'}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Or enter custom email */}
              <div className="pt-2">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!emailInput.trim()) return;
                    const res = loginApprovedUser(emailInput);
                    if (!res.success) {
                      if (res.reason === 'pending') {
                        setSubmittedStatus('pending');
                        setActiveTab('request_access');
                      } else if (res.reason === 'rejected') {
                        setSubmittedStatus('rejected');
                        setActiveTab('request_access');
                      } else {
                        alert(`Account not found or not approved yet. Please submit an access request.`);
                        setActiveTab('request_access');
                      }
                    }
                  }}
                  className="space-y-3"
                >
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Or Enter Approved Email:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="approved@email.com"
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Sign In
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}

        </div>

        {/* Card Footer */}
        <div className="p-4 bg-white/[0.02] border-t border-white/[0.06] text-center text-[11px] text-slate-500 flex items-center justify-between">
          <span>Official Section 80G Receipt System</span>
          <span className="font-mono text-slate-400">Google Sheets Access Flow Active</span>
        </div>

      </div>

    </div>
  );
}
