-- ==============================================================================
-- DONATION SPONSOR TRACKING & AUTOMATION SYSTEM
-- Supabase PostgreSQL Schema with Role-Based Access Control (RBAC)
-- ==============================================================================

-- 1. Create Enums
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'staff', 'viewer');
CREATE TYPE sponsor_status AS ENUM ('Active', 'Paused', 'Completed', 'Overdue');
CREATE TYPE receipt_status AS ENUM ('Sent', 'Draft', 'Paid', 'Cancelled');
CREATE TYPE language_code AS ENUM ('en', 'ml', 'ar', 'hi', 'ur', 'ta');

-- 2. Profiles Table (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role DEFAULT 'staff' NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Sponsors Table
CREATE TABLE IF NOT EXISTS public.sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country_code VARCHAR(10) DEFAULT '+91' NOT NULL,
  phone VARCHAR(30) NOT NULL,
  full_phone VARCHAR(40) NOT NULL,
  email TEXT,
  language language_code DEFAULT 'en' NOT NULL,
  payment_mode VARCHAR(50) DEFAULT 'UPI / Online' NOT NULL,
  reminder_frequency VARCHAR(50) DEFAULT 'Monthly' NOT NULL,
  reminder_day INTEGER DEFAULT 1 CHECK (reminder_day BETWEEN 1 AND 31),
  category VARCHAR(100) NOT NULL,
  pledged_amount NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR' NOT NULL,
  status sponsor_status DEFAULT 'Active' NOT NULL,
  last_payment_date DATE,
  next_due_date DATE,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Receipts Table
CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_no VARCHAR(50) UNIQUE NOT NULL,
  sponsor_id UUID REFERENCES public.sponsors(id) ON DELETE SET NULL,
  payer_name TEXT NOT NULL,
  country_code VARCHAR(10) DEFAULT '+91' NOT NULL,
  phone VARCHAR(30) NOT NULL,
  full_phone VARCHAR(40) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR' NOT NULL,
  category VARCHAR(100) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  status receipt_status DEFAULT 'Draft' NOT NULL,
  issued_date DATE DEFAULT CURRENT_DATE NOT NULL,
  whatsapp_sent_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Reminders Log
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID NOT NULL REFERENCES public.sponsors(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'Sent' NOT NULL,
  channel VARCHAR(20) DEFAULT 'WhatsApp' NOT NULL,
  message_content TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id)
);

-- 6. Audit Logs Table (For Super Admin oversight)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  record_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for high-performance querying
CREATE INDEX IF NOT EXISTS idx_sponsors_phone ON public.sponsors(phone);
CREATE INDEX IF NOT EXISTS idx_sponsors_name ON public.sponsors(name);
CREATE INDEX IF NOT EXISTS idx_sponsors_status ON public.sponsors(status);
CREATE INDEX IF NOT EXISTS idx_sponsors_due ON public.sponsors(next_due_date);
CREATE INDEX IF NOT EXISTS idx_receipts_no ON public.receipts(receipt_no);
CREATE INDEX IF NOT EXISTS idx_receipts_date ON public.receipts(issued_date);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Roles: super_admin, admin, staff, viewer
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS user_role AS $$
BEGIN
  RETURN (
    SELECT role FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles:
CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admin can modify all profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.get_current_role() = 'super_admin');

-- Sponsors:
CREATE POLICY "All authenticated roles can view sponsors"
  ON public.sponsors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff, Admin, Super Admin can insert sponsors"
  ON public.sponsors FOR INSERT
  TO authenticated
  WITH CHECK (public.get_current_role() IN ('staff', 'admin', 'super_admin'));

CREATE POLICY "Staff, Admin, Super Admin can update sponsors"
  ON public.sponsors FOR UPDATE
  TO authenticated
  USING (public.get_current_role() IN ('staff', 'admin', 'super_admin'));

CREATE POLICY "Only Admin and Super Admin can delete sponsors"
  ON public.sponsors FOR DELETE
  TO authenticated
  USING (public.get_current_role() IN ('admin', 'super_admin'));

-- Receipts:
CREATE POLICY "All authenticated roles can view receipts"
  ON public.receipts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff, Admin, Super Admin can insert receipts"
  ON public.receipts FOR INSERT
  TO authenticated
  WITH CHECK (public.get_current_role() IN ('staff', 'admin', 'super_admin'));

CREATE POLICY "Staff, Admin, Super Admin can update receipts"
  ON public.receipts FOR UPDATE
  TO authenticated
  USING (public.get_current_role() IN ('staff', 'admin', 'super_admin'));

CREATE POLICY "Only Admin and Super Admin can delete receipts"
  ON public.receipts FOR DELETE
  TO authenticated
  USING (public.get_current_role() IN ('admin', 'super_admin'));

-- Audit Logs:
CREATE POLICY "Only Super Admin can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.get_current_role() = 'super_admin');

