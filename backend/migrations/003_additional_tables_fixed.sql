-- Migration: 003_additional_tables_fixed.sql
-- Description: Add ONLY the missing tables and columns (ledger_entries, advance_configs, audit_logs already exist in 001)
-- Run this INSTEAD of 003_additional_tables.sql

-- =============================================
-- ADVANCE REQUESTS TABLE (NEW)
-- =============================================
CREATE TABLE IF NOT EXISTS public.advance_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    
    amount_usd DECIMAL(12, 2) NOT NULL CHECK (amount_usd > 0),
    fee_usd DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (fee_usd >= 0),
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'disbursed', 'settled')),
    
    receipt_id UUID REFERENCES public.receipts(id),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    settled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_advance_requests_company ON public.advance_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_advance_requests_employee ON public.advance_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_advance_requests_status ON public.advance_requests(status);

ALTER TABLE public.advance_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "advance_requests_service_all" ON public.advance_requests
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');


-- =============================================
-- KYB SUBMISSIONS TABLE (NEW)
-- =============================================
CREATE TABLE IF NOT EXISTS public.kyb_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    
    status TEXT NOT NULL DEFAULT 'unsubmitted' CHECK (status IN ('unsubmitted', 'pending', 'approved', 'rejected', 'under_review')),
    data JSONB NOT NULL DEFAULT '{}',
    documents TEXT[] DEFAULT '{}',
    
    reviewer_notes TEXT,
    reviewed_by UUID,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_kyb_submissions_company ON public.kyb_submissions(company_id);
CREATE INDEX IF NOT EXISTS idx_kyb_submissions_status ON public.kyb_submissions(status);

ALTER TABLE public.kyb_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kyb_service_all" ON public.kyb_submissions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');


-- =============================================
-- WALLET WHITELIST TABLE (NEW)
-- =============================================
CREATE TABLE IF NOT EXISTS public.wallet_whitelist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    
    label TEXT,
    added_by UUID,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    
    UNIQUE(wallet_address, company_id)
);

CREATE INDEX IF NOT EXISTS idx_wallet_whitelist_address ON public.wallet_whitelist(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_whitelist_company ON public.wallet_whitelist(company_id);
CREATE INDEX IF NOT EXISTS idx_wallet_whitelist_active ON public.wallet_whitelist(is_active);

ALTER TABLE public.wallet_whitelist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whitelist_read" ON public.wallet_whitelist
    FOR SELECT USING (true);

CREATE POLICY "whitelist_service_all" ON public.wallet_whitelist
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');


-- =============================================
-- UPDATE RECEIPTS TABLE (ADD MISSING COLUMNS)
-- =============================================
ALTER TABLE public.receipts 
ADD COLUMN IF NOT EXISTS audit_result JSONB,
ADD COLUMN IF NOT EXISTS payout_info JSONB;


-- =============================================
-- ADD TRIGGERS FOR NEW TABLES
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_advance_requests_updated_at ON public.advance_requests;
CREATE TRIGGER update_advance_requests_updated_at
    BEFORE UPDATE ON public.advance_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_kyb_submissions_updated_at ON public.kyb_submissions;
CREATE TRIGGER update_kyb_submissions_updated_at
    BEFORE UPDATE ON public.kyb_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wallet_whitelist_updated_at ON public.wallet_whitelist;
CREATE TRIGGER update_wallet_whitelist_updated_at
    BEFORE UPDATE ON public.wallet_whitelist
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON TABLE public.advance_requests IS 'Employee expense advance requests';
COMMENT ON TABLE public.kyb_submissions IS 'Know Your Business verification submissions';
COMMENT ON TABLE public.wallet_whitelist IS 'Whitelisted wallet addresses for payouts';
