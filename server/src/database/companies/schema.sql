-- Companies Table Schema
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

-- Company Stats View (derived from other tables or updated via triggers)
-- For now, we create a table if these need to be persisted/cached for performance
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
