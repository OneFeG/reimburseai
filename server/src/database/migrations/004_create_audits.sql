-- Migration: Create Audits Table

CREATE TABLE IF NOT EXISTS public.audits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id TEXT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE, 
  
  -- File info
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INT,
  mime_type TEXT,
  
  -- Extracted data
  merchant TEXT,
  merchant_category TEXT,
  receipt_date DATE,
  
  -- Original amount
  amount NUMERIC(18, 2),
  currency TEXT DEFAULT 'USD',
  
  -- Converted amount
  converted_amount NUMERIC(18, 2),
  payout_currency TEXT DEFAULT 'USDC',
  exchange_rate NUMERIC(18, 6),
  exchange_rate_timestamp TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'pending',
  ai_confidence NUMERIC(5, 4),
  ai_decision_reason TEXT,
  ai_extracted_data JSONB,
  ai_anomalies TEXT[],
  signature TEXT,
  
  -- Audit fee
  audit_fee_paid BOOLEAN DEFAULT false,
  audit_fee_tx_hash TEXT,
  audit_fee_amount NUMERIC(18, 2),
  
  -- Payout
  payout_amount NUMERIC(18, 2),
  payout_tx_hash TEXT,
  payout_wallet TEXT,
  paid_at TIMESTAMPTZ,
  
  -- Employee input
  description TEXT,
  category TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

/*
-- Policies
DO $$
BEGIN
    -- 1. Employees can view their own audits
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'audits' AND policyname = 'Employees can view own audits'
    ) THEN
        CREATE POLICY "Employees can view own audits" ON public.audits FOR SELECT TO authenticated USING (employee_id = auth.uid());
    END IF;

    -- 2. Company Admins can view all audits for their company
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'audits' AND policyname = 'Admins can view company audits'
    ) THEN
        CREATE POLICY "Admins can view company audits" ON public.audits FOR SELECT TO authenticated USING (
            company_id IN (SELECT company_id FROM public.employees WHERE id = auth.uid() AND employee_role = 'admin')
        );
    END IF;

    -- 3. Employees can insert their own audits
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'audits' AND policyname = 'Employees can insert own audits'
    ) THEN
        CREATE POLICY "Employees can insert own audits" ON public.audits FOR INSERT TO authenticated WITH CHECK (employee_id = auth.uid());
    END IF;
END
$$;
*/
