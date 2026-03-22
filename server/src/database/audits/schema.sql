-- Audits (Receipts) Table Schema
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
  currency TEXT,
  
  -- Converted amount
  converted_amount NUMERIC(18, 2),
  payout_currency TEXT DEFAULT 'USDC',
  exchange_rate NUMERIC(18, 6),
  exchange_rate_timestamp TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'processing'
  ai_confidence NUMERIC(5, 4), -- 0.0 to 1.0
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
