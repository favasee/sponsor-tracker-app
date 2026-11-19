'use client';

import React, { useState, useEffect } from 'react';
import { 
  ClassicReceipt, 
  RecurringDonorTemplate, 
  WhatsAppAutomationConfig 
} from '@/types';
import { 
  loadClassicReceipts, 
  saveClassicReceipt, 
  saveAllClassicReceipts,
  deleteClassicReceipt,
  loadRecurringTemplates,
  saveRecurringTemplate,
  deleteRecurringTemplate,
  loadWhatsAppAutomationConfig,
  saveWhatsAppAutomationConfig,
  pruneReceiptsToOnly1To6
} from '@/lib/receiptStorage';
import { Navbar } from '@/components/Navbar';
import { Dashboard } from '@/components/Dashboard';
import { ReceiptForm } from '@/components/ReceiptForm';
import { ReceiptsList } from '@/components/ReceiptsList';
import { ClassicReceiptView } from '@/components/ClassicReceiptView';
import { DonorTemplatesModal } from '@/components/DonorTemplatesModal';
import { WhatsAppAutomationModal } from '@/components/WhatsAppAutomationModal';
import { SettingsPage } from '@/components/SettingsPage';

export default function Home() {
  const [activeView, setActiveView] = useState<'dashboard' | 'create' | 'register' | 'sponsors' | 'settings'>('dashboard');
  const [ledgerPurposeFilter, setLedgerPurposeFilter] = useState<string>('All');
  const [receipts, setReceipts] = useState<ClassicReceipt[]>([]);
  const [templates, setTemplates] = useState<RecurringDonorTemplate[]>([]);
  const [waConfig, setWaConfig] = useState<WhatsAppAutomationConfig>(loadWhatsAppAutomationConfig());
  const [isLoading, setIsLoading] = useState(true);

  // Modal & Selection States
  const [selectedReceiptForView, setSelectedReceiptForView] = useState<ClassicReceipt | null>(null);
  const [autoDownloadPDF, setAutoDownloadPDF] = useState(false);

  const handleOpenReceiptView = (receipt: ClassicReceipt, autoDownload: boolean = false) => {
    setSelectedReceiptForView(receipt);
    setAutoDownloadPDF(autoDownload);
  };
  const [receiptToEdit, setReceiptToEdit] = useState<ClassicReceipt | null>(null);
  const [templateToApply, setTemplateToApply] = useState<RecurringDonorTemplate | null>(null);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'header' | 'purposes' | 'currency'>('header');

  // Load initial data from local storage
  useEffect(() => {
    try {
      const loadedReceipts = loadClassicReceipts();
      const loadedTemplates = loadRecurringTemplates();
      const loadedConfig = loadWhatsAppAutomationConfig();
      setReceipts(loadedReceipts);
      setTemplates(loadedTemplates);
      setWaConfig(loadedConfig);
    } catch (e) {
      console.error('Failed to load receipts data:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Login gate removed (direct access enabled)

  // Receipt Handlers
  const handleReceiptSaved = (savedReceipt: ClassicReceipt) => {
    const existingIndex = receipts.findIndex((r) => r.id === savedReceipt.id);
    let updated: ClassicReceipt[];
    if (existingIndex >= 0) {
      updated = [...receipts];
      updated[existingIndex] = savedReceipt;
    } else {
      updated = [savedReceipt, ...receipts];
    }
    setReceipts(updated);

    // Refresh templates list if new one was saved
    setTemplates(loadRecurringTemplates());

    // Clear edit mode
    setReceiptToEdit(null);

    // Open Classic Receipt View with PDF download option immediately!
    setSelectedReceiptForView(savedReceipt);
  };

  const handleBatchReceiptsSaved = (newReceipts: ClassicReceipt[]) => {
    if (!newReceipts || newReceipts.length === 0) return;
    const merged = [...newReceipts, ...receipts];
    setReceipts(merged);
    saveAllClassicReceipts(merged);
    if (newReceipts.length > 0) {
      setSelectedReceiptForView(newReceipts[0]);
    }
  };

  const handleEditReceipt = (receipt: ClassicReceipt) => {
    setReceiptToEdit(receipt);
    setSelectedReceiptForView(null);
    setActiveView('create'); // Navigate to form in edit mode
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteReceipt = (id: string) => {
    deleteClassicReceipt(id);
    setReceipts(receipts.filter((r) => r.id !== id));
  };

  const handleClearExcept1To6 = () => {
    const pruned = pruneReceiptsToOnly1To6(receipts);
    setReceipts(pruned);
    saveAllClassicReceipts(pruned);
    if (typeof window !== 'undefined') {
      localStorage.setItem('receipts_pruned_except_1_to_6_v1', 'true');
    }
  };

  // Template Handlers
  const handleSaveTemplate = (template: RecurringDonorTemplate) => {
    saveRecurringTemplate(template);
    setTemplates(loadRecurringTemplates());
  };

  const handleDeleteTemplate = (id: string) => {
    deleteRecurringTemplate(id);
    setTemplates(templates.filter((t) => t.id !== id));
  };

  const handleSelectTemplate = (template: RecurringDonorTemplate) => {
    setReceiptToEdit(null);
    setTemplateToApply(template);
    setActiveView('create');
    setIsTemplatesModalOpen(false);
  };

  // WhatsApp Automation Save
  const handleSaveWhatsAppConfig = (newConfig: WhatsAppAutomationConfig) => {
    saveWhatsAppAutomationConfig(newConfig);
    setWaConfig(newConfig);
  };

  // CSV Receipts Import (Appends / Merges with existing data safely)
  const handleImportReceipts = (importedList: ClassicReceipt[]) => {
    let addedCount = 0;
    let updatedCount = 0;

    const merged = [...receipts];

    importedList.forEach((newR) => {
      const cleanReceiptNo = (newR.receiptNo || '').trim().toUpperCase();
      const existingIdx = merged.findIndex(
        (r) =>
          (cleanReceiptNo && r.receiptNo && r.receiptNo.trim().toUpperCase() === cleanReceiptNo) ||
          (r.id && r.id === newR.id)
      );

      if (existingIdx >= 0) {
        merged[existingIdx] = {
          ...merged[existingIdx],
          ...newR,
          updatedAt: new Date().toISOString(),
        };
        updatedCount++;
      } else {
        merged.unshift(newR);
        addedCount++;
      }
    });

    // Ensure sequential descending order (newest receipt # on top)
    const getNum = (no?: string) => {
      const m = (no || '').match(/\d+/);
      return m ? parseInt(m[0], 10) : 0;
    };
    merged.sort((a, b) => {
      const numA = getNum(a.receiptNo);
      const numB = getNum(b.receiptNo);
      if (numA !== numB) return numB - numA;
      return (b.date || '').localeCompare(a.date || '');
    });

    setReceipts(merged);
    saveAllClassicReceipts(merged);
    return { addedCount, updatedCount };
  };

  const handleNavigateToRegisterWithPurpose = (purpose?: string) => {
    if (purpose) {
      setLedgerPurposeFilter(purpose);
    } else {
      setLedgerPurposeFilter('All');
    }
    setActiveView('register');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#08090C] bg-dot-grid text-slate-100">
      
      {/* Left Sidebar Navigation on Desktop/Laptop / Drawer & Bottom Bar on Mobile */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenTemplates={() => setIsTemplatesModalOpen(true)}
        onOpenWhatsAppConfig={() => setIsWhatsAppModalOpen(true)}
        receiptCount={receipts.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 w-full px-3 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6 md:space-y-8 pb-24 md:pb-8 overflow-y-auto">
        
        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-slate-400 font-medium text-sm">
            <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mr-3"></div>
            Loading Classic Receipt System...
          </div>
        ) : (
          <>
            {activeView === 'dashboard' && (
              <Dashboard
                receipts={receipts}
                onNavigateToCreate={() => {
                  setActiveView('create');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onNavigateToRegister={handleNavigateToRegisterWithPurpose}
                onViewReceipt={(r) => setSelectedReceiptForView(r)}
                onOpenTemplates={() => setIsTemplatesModalOpen(true)}
                onOpenSettings={(tab) => {
                  setSettingsTab(tab || 'header');
                  setActiveView('settings');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {activeView === 'create' && (
              <div className="max-w-4xl mx-auto">
                <ReceiptForm
                  receipts={receipts}
                  templates={templates}
                  receiptToEdit={receiptToEdit}
                  templateToApply={templateToApply}
                  onTemplateApplied={() => setTemplateToApply(null)}
                  onReceiptSaved={handleReceiptSaved}
                  onBatchReceiptsSaved={handleBatchReceiptsSaved}
                  onViewReceipt={handleOpenReceiptView}
                  onCancelEdit={() => {
                    setReceiptToEdit(null);
                    setTemplateToApply(null);
                  }}
                  onOpenTemplatesModal={() => setIsTemplatesModalOpen(true)}
                  onOpenWhatsAppConfig={() => setIsWhatsAppModalOpen(true)}
                />
              </div>
            )}

            {activeView === 'register' && (
              <ReceiptsList
                receipts={receipts}
                onViewReceipt={handleOpenReceiptView}
                onEditReceipt={handleEditReceipt}
                onDeleteReceipt={handleDeleteReceipt}
                onImportReceipts={handleImportReceipts}
                onClearExcept1To6={handleClearExcept1To6}
                initialPurposeFilter={ledgerPurposeFilter}
                onNavigateToDashboard={() => {
                  setActiveView('dashboard');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {activeView === 'settings' && (
              <div className="max-w-4xl mx-auto w-full">
                <SettingsPage
                  initialTab={settingsTab}
                  onSettingsUpdated={() => {
                    // Refresh templates or other local state
                    setTemplates(loadRecurringTemplates());
                  }}
                />
              </div>
            )}
          </>
        )}

      </main>

      {/* Classic Minimal Receipt & PDF Export Modal */}
      {selectedReceiptForView && (
        <ClassicReceiptView
          receipt={selectedReceiptForView}
          onClose={() => {
            setSelectedReceiptForView(null);
            setAutoDownloadPDF(false);
          }}
          onEdit={(r) => handleEditReceipt(r)}
          autoDownloadPDF={autoDownloadPDF}
        />
      )}

      {/* Recurring Donor Templates & Group Submissions Modal */}
      <DonorTemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        templates={templates}
        receipts={receipts}
        onSelectTemplate={handleSelectTemplate}
        onSaveTemplate={handleSaveTemplate}
        onDeleteTemplate={handleDeleteTemplate}
        onRecordQuickPayment={handleReceiptSaved}
        onRecordGroupPayments={handleBatchReceiptsSaved}
      />

      {/* WhatsApp Automation Webhook Placeholder Modal */}
      <WhatsAppAutomationModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        config={waConfig}
        onSaveConfig={handleSaveWhatsAppConfig}
      />

    </div>
  );
}
