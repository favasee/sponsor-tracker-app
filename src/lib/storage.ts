import { Sponsor, Receipt } from '@/types';
import { INITIAL_SPONSORS, INITIAL_RECEIPTS } from './constants';
import { supabase, isSupabaseConfigured } from './supabase/client';

const SPONSORS_STORAGE_KEY = 'sponsor_app_sponsors_v1';
const RECEIPTS_STORAGE_KEY = 'sponsor_app_receipts_v1';

// Initial loader helper
export async function loadSponsors(): Promise<Sponsor[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((row) => ({
          id: row.id,
          name: row.name,
          countryCode: row.country_code,
          phone: row.phone,
          fullPhone: row.full_phone,
          email: row.email,
          language: row.language,
          paymentMode: row.payment_mode,
          reminderFrequency: row.reminder_frequency,
          reminderDay: row.reminder_day,
          category: row.category,
          pledgedAmount: Number(row.pledged_amount),
          currency: row.currency,
          status: row.status,
          lastPaymentDate: row.last_payment_date,
          nextDueDate: row.next_due_date,
          notes: row.notes,
          createdAt: row.created_at,
        }));
      }
    } catch (e) {
      console.warn('Supabase fetch failed, falling back to local storage:', e);
    }
  }

  // Local Storage fallback
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(SPONSORS_STORAGE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // Parse error, reset to initial
      }
    }
    localStorage.setItem(SPONSORS_STORAGE_KEY, JSON.stringify(INITIAL_SPONSORS));
  }
  return INITIAL_SPONSORS;
}

export async function saveSponsorToStore(sponsor: Sponsor): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('sponsors').upsert({
        id: sponsor.id,
        name: sponsor.name,
        country_code: sponsor.countryCode,
        phone: sponsor.phone,
        full_phone: sponsor.fullPhone,
        email: sponsor.email,
        language: sponsor.language,
        payment_mode: sponsor.paymentMode,
        reminder_frequency: sponsor.reminderFrequency,
        reminder_day: sponsor.reminderDay,
        category: sponsor.category,
        pledged_amount: sponsor.pledgedAmount,
        currency: sponsor.currency,
        status: sponsor.status,
        last_payment_date: sponsor.lastPaymentDate,
        next_due_date: sponsor.nextDueDate,
        notes: sponsor.notes,
      });
    } catch (e) {
      console.error('Supabase sponsor save failed:', e);
    }
  }

  if (typeof window !== 'undefined') {
    const list = await loadSponsors();
    const existingIndex = list.findIndex((s) => s.id === sponsor.id);
    let updated: Sponsor[];
    if (existingIndex >= 0) {
      updated = [...list];
      updated[existingIndex] = sponsor;
    } else {
      updated = [sponsor, ...list];
    }
    localStorage.setItem(SPONSORS_STORAGE_KEY, JSON.stringify(updated));
  }
}

export async function deleteSponsorFromStore(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('sponsors').delete().eq('id', id);
    } catch (e) {
      console.error('Supabase sponsor delete failed:', e);
    }
  }

  if (typeof window !== 'undefined') {
    const list = await loadSponsors();
    const filtered = list.filter((s) => s.id !== id);
    localStorage.setItem(SPONSORS_STORAGE_KEY, JSON.stringify(filtered));
  }
}

export async function loadReceipts(): Promise<Receipt[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((row) => ({
          id: row.id,
          receiptNo: row.receipt_no,
          sponsorId: row.sponsor_id,
          payerName: row.payer_name,
          countryCode: row.country_code,
          phone: row.phone,
          fullPhone: row.full_phone,
          amount: Number(row.amount),
          currency: row.currency,
          category: row.category,
          paymentMethod: row.payment_method,
          status: row.status,
          issuedDate: row.issued_date,
          notes: row.notes,
          whatsappSentAt: row.whatsapp_sent_at,
          createdAt: row.created_at,
        }));
      }
    } catch (e) {
      console.warn('Supabase receipts fetch failed, falling back to local storage:', e);
    }
  }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(RECEIPTS_STORAGE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // Fallback
      }
    }
    localStorage.setItem(RECEIPTS_STORAGE_KEY, JSON.stringify(INITIAL_RECEIPTS));
  }
  return INITIAL_RECEIPTS;
}

export async function saveReceiptToStore(receipt: Receipt): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('receipts').upsert({
        id: receipt.id,
        receipt_no: receipt.receiptNo,
        sponsor_id: receipt.sponsorId || null,
        payer_name: receipt.payerName,
        country_code: receipt.countryCode,
        phone: receipt.phone,
        full_phone: receipt.fullPhone,
        amount: receipt.amount,
        currency: receipt.currency,
        category: receipt.category,
        payment_method: receipt.paymentMethod,
        status: receipt.status,
        issued_date: receipt.issuedDate,
        whatsapp_sent_at: receipt.whatsappSentAt,
        notes: receipt.notes,
      });
    } catch (e) {
      console.error('Supabase receipt save failed:', e);
    }
  }

  if (typeof window !== 'undefined') {
    const list = await loadReceipts();
    const existingIndex = list.findIndex((r) => r.id === receipt.id);
    let updated: Receipt[];
    if (existingIndex >= 0) {
      updated = [...list];
      updated[existingIndex] = receipt;
    } else {
      updated = [receipt, ...list];
    }
    localStorage.setItem(RECEIPTS_STORAGE_KEY, JSON.stringify(updated));
  }
}

export async function deleteReceiptFromStore(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('receipts').delete().eq('id', id);
    } catch (e) {
      console.error('Supabase receipt delete failed:', e);
    }
  }

  if (typeof window !== 'undefined') {
    const list = await loadReceipts();
    const filtered = list.filter((r) => r.id !== id);
    localStorage.setItem(RECEIPTS_STORAGE_KEY, JSON.stringify(filtered));
  }
}

/**
 * Generate next receipt number e.g., TH-01665
 */
export function getNextReceiptNumber(receipts: Receipt[]): string {
  if (!receipts || receipts.length === 0) return 'TH-01665';

  const numbers = receipts
    .map((r) => {
      const match = r.receiptNo.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    })
    .filter((n) => !isNaN(n));

  const max = numbers.length > 0 ? Math.max(...numbers) : 1664;
  const next = max + 1;
  return `TH-${String(next).padStart(4, '0')}`;
}

