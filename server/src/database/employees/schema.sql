-- Employees Table Schema
CREATE TABLE IF NOT EXISTS public.employees (
  id TEXT PRIMARY KEY, -- Changed from UUID to TEXT Firebase UID
  company_id TEXT REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  IdentificationNumber NUMERIC(15, 0) NOT NULL UNIQUE,
  invitedBy TEXT REFERENCES public.companies(id) ON DELETE CASCADE,
  department TEXT,
  employee_number TEXT,
  employee_role TEXT DEFAULT 'employee', -- 'admin', 'manager', 'employee'
  employee_status TEXT DEFAULT 'inactive', -- 'active', 'inactive', 'invited'
  smart_wallet_address TEXT UNIQUE,
  wallet_address TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee Stats View (or cached table)
CREATE TABLE IF NOT EXISTS public.employee_stats (
  employee_id TEXT PRIMARY KEY REFERENCES public.employees(id) ON DELETE CASCADE,
  total_receipts INT DEFAULT 0,
  pending_receipts INT DEFAULT 0,
  total_reimbursed NUMERIC(18, 2) DEFAULT 0,
  month_spend NUMERIC(18, 2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
