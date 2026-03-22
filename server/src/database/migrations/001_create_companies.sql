-- Migration: Create Companies Table


-- NOTE:
-- This project uses a backend-only architecture.
-- All database access is performed via the backend using the Supabase SERVICE_ROLE_KEY.
-- Row Level Security is enabled to prevent access from anon/authenticated clients,
-- but no policies are defined because the service role bypasses RLS.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Companies
CREATE TABLE IF NOT EXISTS public.companies (
  id TEXT PRIMARY KEY, -- id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  IdentificationNumber NUMERIC(15, 0) NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending', -- 'active', 'inactive', 'pending'
  base_currency TEXT DEFAULT 'USD',
  smart_wallet_address TEXT UNIQUE,
  wallet_address TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Company Stats
CREATE TABLE IF NOT EXISTS public.company_stats (
  company_id TEXT PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  total_employees INT DEFAULT 0,
  active_employees INT DEFAULT 0,
  total_receipts INT DEFAULT 0,
  pending_receipts INT DEFAULT 0,
  approved_receipts INT DEFAULT 0,
  rejected_receipts INT DEFAULT 0,
  total_spend_month NUMERIC(18, 2) DEFAULT 0,
  total_spend_all_time NUMERIC(18, 2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_stats ENABLE ROW LEVEL SECURITY;

/*
-- Policies
DO $$
BEGIN
    -- Employees can view own company info
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'Employees can view own company'
    ) THEN
        CREATE POLICY "Employees can view own company" ON public.companies FOR SELECT TO authenticated USING (
            id IN (SELECT company_id FROM public.employees WHERE id = auth.uid())
        );
    END IF;

    -- Company Admins can update their own company
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'Managers can update own company'
    ) THEN
        CREATE POLICY "Admins can update own company" ON public.companies FOR UPDATE TO authenticated USING (
            id IN (SELECT company_id FROM public.employees WHERE id = auth.uid() AND employee_role = 'sudo')
        );
    END IF;

    -- Company Stats: Only Admins can view/update
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'company_stats' AND policyname = 'Admins can view company stats'
    ) THEN
        CREATE POLICY "Admins can view company stats" ON public.company_stats FOR ALL TO authenticated USING (
            company_id IN (SELECT company_id FROM public.employees WHERE id = auth.uid() AND employee_role = 'admin')
        );
    END IF;
END
$$;
*/