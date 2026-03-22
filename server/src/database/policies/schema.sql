-- Policies Table Schema
CREATE TABLE IF NOT EXISTS public.policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id TEXT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  verification_mode TEXT CHECK (verification_mode IN ('autonomous', 'human_verification')),
  daily_receipt_limit INT CHECK (daily_receipt_limit >= 1 AND daily_receipt_limit <= 50),
  currencies TEXT[] DEFAULT 'USD'::TEXT[],
  amount_cap NUMERIC(18, 2) CHECK (amount_cap > 0),
  monthly_cap NUMERIC(18, 2) CHECK (monthly_cap > 0),
  allowed_categories TEXT[],
  vendor_whitelist TEXT[],
  vendor_blacklist TEXT[],
  max_days_old INT CHECK (max_days_old >= 1 AND max_days_old <= 365),
  custom_rules TEXT,
  require_description BOOLEAN DEFAULT false,
  require_category BOOLEAN DEFAULT false,
  auto_approve_under NUMERIC(18, 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
