-- Migration: Create Employees Table

CREATE TABLE IF NOT EXISTS public.employees (
  id TEXT PRIMARY KEY, -- Firebase UID
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

CREATE TABLE IF NOT EXISTS public.employee_stats (
  employee_id TEXT PRIMARY KEY REFERENCES public.employees(id) ON DELETE CASCADE,
  total_receipts INT DEFAULT 0,
  pending_receipts INT DEFAULT 0,
  total_reimbursed NUMERIC(18, 2) DEFAULT 0,
  month_spend NUMERIC(18, 2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_stats ENABLE ROW LEVEL SECURITY;

/*
-- Policies
DO $$
BEGIN
    -- 1. Employees can view their own profile
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'employees' AND policyname = 'Users can view own profile'
    ) THEN
        CREATE POLICY "Users can view own profile" ON public.employees FOR SELECT TO authenticated USING (auth.uid() = id);
    END IF;

    -- 2. Company Admins can view all employees in their company
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'employees' AND policyname = 'Company admins can view employees'
    ) THEN
        CREATE POLICY "Company admins can view employees" ON public.employees FOR SELECT TO authenticated USING (
            company_id IN (SELECT company_id FROM public.employees WHERE id = auth.uid() AND employee_role = 'admin')
        );
    END IF;

    -- 3. Stats policies: Users can view own stats
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'employee_stats' AND policyname = 'Users can view own stats'
    ) THEN
        CREATE POLICY "Users can view own stats" ON public.employee_stats FOR SELECT TO authenticated USING (employee_id = auth.uid());
    END IF;

    -- 4. Stats policies: Admins can view other employees' stats in their company
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'employee_stats' AND policyname = 'Admins can view company employee stats'
    ) THEN
        CREATE POLICY "Admins can view company employee stats" ON public.employee_stats FOR SELECT TO authenticated USING (
            EXISTS (
                SELECT 1 
                FROM public.employees AS admin_emp
                JOIN public.employees AS target_emp ON target_emp.company_id = admin_emp.company_id
                WHERE admin_emp.id = auth.uid() 
                AND admin_emp.employee_role = 'admin'
                AND target_emp.id = employee_stats.employee_id
            )
        );
    END IF;
END
$$;
*/
