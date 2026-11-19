'use client';

import React, { useState } from 'react';
import { WhatsAppAutomationConfig } from '@/types';
import { 
  MessageSquare, 
  ToggleLeft, 
  ToggleRight, 
  Globe, 
  Code, 
  CheckCircle2, 
  Send, 
  X, 
  Copy, 
  Save, 
  Lock 
} from 'lucide-react';

interface WhatsAppAutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: WhatsAppAutomationConfig;
  onSaveConfig: (config: WhatsAppAutomationConfig) => void;
}

export function WhatsAppAutomationModal({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}: WhatsAppAutomationModalProps) {
  const [autoSendEnabled, setAutoSendEnabled] = useState(config.autoSendEnabled);
  const [provider, setProvider] = useState(config.provider);
  const [webhookUrl, setWebhookUrl] = useState(config.webhookUrl);
  const [apiToken, setApiToken] = useState(config.apiToken);
  const [phoneNumberId, setPhoneNumberId] = useState(config.phoneNumberId);
  const [templateName, setTemplateName] = useState(config.templateName);
  const [customMessageTemplate, setCustomMessageTemplate] = useState(config.customMessageTemplate);

  const [testSent, setTestSent] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  if (!isOpen) return null;

  // Example JSON payload preview
  const samplePayload = {
    event: 'receipt.created',
    timestamp: new Date().toISOString(),
    receipt_no: 'TH0001',
    date: new Date().toISOString().split('T')[0],
    donor: {
      name: 'Anees Rahman',
      phone: '+918129755155',
      pan: 'ABCDE1234F',
    },
    donation: {
      amount: 39600,
      currency: 'INR',
      indian_value: 39600,
      amount_in_words: 'Rupees Thirty-Nine Thousand Six Hundred Only',
      purpose: 'Hifzul Quran & Religious Education',
      payment_method: 'UPI / Online',
    },
    template: templateName,
    pdf_download_url: 'https://thaqaful.org/receipts/TH0001.pdf',
    provider: provider,
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      autoSendEnabled,
      provider,
      webhookUrl,
      apiToken,
      phoneNumberId,
      templateName,
      autoSendDelaySeconds: 2,
      customMessageTemplate,
    });
    alert('WhatsApp automation settings saved successfully.');
    onClose();
  };

  const handleTestPing = () => {
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const copyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(samplePayload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#0f1219] rounded-2xl sm:rounded-3xl max-w-3xl w-full max-h-[96vh] sm:max-h-[92vh] overflow-y-auto shadow-2xl border border-white/15 text-white">
        
        {/* Modal Header */}
        <div className="sticky top-0 bg-[#0f1219]/95 backdrop-blur-xl px-4 sm:px-6 py-3.5 sm:py-5 border-b border-white/10 flex items-center justify-between gap-3 z-10">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white truncate">
                  Automatic WhatsApp Sending Webhook
                </h3>
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                  Future Ready Placeholder
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                Configure webhook endpoints, Meta Cloud API tokens, and automatic dispatch hooks
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-9 h-9 min-h-[38px] min-w-[38px] rounded-xl bg-white/10 hover:bg-rose-500/25 text-slate-300 hover:text-white border border-white/10 flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0 ml-auto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-8 space-y-5 sm:space-y-6">
          
          {/* Main Activation Toggle */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-white">
                Automatic WhatsApp Sending on Receipt Creation
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                When enabled, the app automatically dispatches webhook events to your WhatsApp service provider in the background.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setAutoSendEnabled(!autoSendEnabled)}
              className="transition cursor-pointer"
            >
              {autoSendEnabled ? (
                <ToggleRight className="w-10 h-10 text-emerald-400" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-slate-500" />
              )}
            </button>
          </div>

          {/* Provider Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'meta_cloud', label: 'Meta WhatsApp Cloud API', desc: 'Direct Graph API via Facebook Developers' },
              { id: 'twilio', label: 'Twilio WhatsApp API', desc: 'Twilio Programmable Messaging' },
              { id: 'custom_webhook', label: 'Custom Webhook / Zapier', desc: 'HTTP POST to your server or n8n workflow' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProvider(p.id as any)}
                className={`text-left p-3.5 rounded-2xl border transition cursor-pointer ${
                  provider === p.id
                    ? 'border-amber-400 bg-amber-500/10 text-amber-200 font-bold'
                    : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-slate-300'
                }`}
              >
                <div className="text-xs font-bold">{p.label}</div>
                <div className="text-[10px] text-slate-400 font-normal mt-1">{p.desc}</div>
              </button>
            ))}
          </div>

          {/* Webhook Endpoint & Tokens */}
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Webhook / Cloud Endpoint URL *
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  required
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://api.yourdomain.com/webhooks/whatsapp-receipt"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs font-mono font-medium focus:outline-none focus:border-amber-400 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  System User Access Token / API Key *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    placeholder="bearer_token"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs font-mono font-medium focus:outline-none focus:border-amber-400 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  WhatsApp Phone Number ID
                </label>
                <input
                  type="text"
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                  placeholder="1098234718234"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs font-mono font-medium focus:outline-none focus:border-amber-400 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Meta Pre-Approved Template Name
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="donation_receipt_v2"
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs font-mono font-medium focus:outline-none focus:border-amber-400 text-white"
              />
            </div>
          </div>

          {/* JSON Webhook Schema Payload Preview */}
          <div className="rounded-2xl border border-white/10 bg-black/60 p-4 font-mono text-[11px] relative">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-slate-400">
              <span className="flex items-center gap-1.5 font-sans text-xs font-bold text-slate-300">
                <Code className="w-3.5 h-3.5 text-amber-400" />
                <span>JSON Payload Dispatched to Webhook Hook</span>
              </span>
              <button
                type="button"
                onClick={copyPayload}
                className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedPayload ? 'Copied' : 'Copy Schema'}</span>
              </button>
            </div>
            <pre className="overflow-x-auto max-h-44 text-slate-300">
              {JSON.stringify(samplePayload, null, 2)}
            </pre>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={handleTestPing}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              {testSent ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Send className="w-4 h-4" />}
              <span>{testSent ? 'Simulated 200 OK Received!' : 'Test Webhook Dispatch'}</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 text-xs font-black shadow-md flex items-center gap-1.5 transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Webhook Configuration</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
