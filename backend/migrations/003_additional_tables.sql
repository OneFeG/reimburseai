-- Migration: 003_additional_tables.sql
-- Description: Add tables for ledger, advances, KYB, and wallet whitelist
-- Author: Dev3 (Backend Lead)
-- Date: 2024

-- =============================================
-- LEDGER ENTRIES TABLE
-- =============================================
-- Tracks all financial transactions: advances, payouts, fees, deposits

CREATE TABLE IF NOT EXISTS public.ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    
    -- Transaction details
    amount_usd DECIMAL(12, 2) NOT NULL CHECK (amount_usd >= 0),
    fee_usd DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (fee_usd >= 0),
    entry_type TEXT NOT NULL CHECK (entry_type IN ('advance', 'payout', 'fee', 'deposit')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'settled', 'failed', 'cancelled')),
    
    -- Reference to related entity
    reference_id UUID,
    reference_type TEXT, -- 'receipt', 'advance_request', etc.
    
    -- Blockchain details
    transaction_hash TEXT,
    error_message TEXT,
    
    -- Additional data
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    settled_at TIMESTAMPTZ
);

-- Indexes for ledger
CREATE INDEX IF NOT EXISTS idx_ledger_entries_company ON public.ledger_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_employee ON public.ledger_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_status ON public.ledger_entries(status);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_type ON public.ledger_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_created ON public.ledger_entries(created_at DESC);

-- RLS for ledger_entries
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

-- Companies can view their own ledger entries
CREATE POLICY "ledger_company_read" ON public.ledger_entries
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM public.companies WHERE auth.uid() = user_id
        )
    );

-- Employees can view their own ledger entries
CREATE POLICY "ledger_employee_read" ON public.ledger_entries
    FOR SELECT USING (
        employee_id IN (
            SELECT id FROM public.employees WHERE auth.uid() = user_id
        )
    );

-- Service role can do everything
CREATE POLICY "ledger_service_all" ON public.ledger_entries
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');


-- =============================================
-- ADVANCE CONFIGURATIONS TABLE
-- =============================================
-- Per-company advance settings

CREATE TABLE IF NOT EXISTS public.advance_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
    
    -- Credit configuration
    credit_limit_usd DECIMAL(12, 2) NOT NULL DEFAULT 10000 CHECK (credit_limit_usd >= 0),
    utilization_usd DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (utilization_usd >= 0),
    fee_bps INTEGER NOT NULL DEFAULT 150 CHECK (fee_bps >= 0 AND fee_bps <= 10000), -- Basis points
    enabled BOOLEAN NOT NULL DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- RLS for advance_configs
ALTER TABLE public.advance_configs ENABLE ROW LEVEL SECURITY;

-- Companies can view and update their own config
CREATE POLICY "advance_config_company_read" ON public.advance_configs
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM public.companies WHERE auth.uid() = user_id
        )
    );

CREATE POLICY "advance_config_company_update" ON public.advance_configs
    FOR UPDATE USING (
        company_id IN (
            SELECT id FROM public.companies WHERE auth.uid() = user_id
        )
    );

CREATE POLICY "advance_config_service_all" ON public.advance_configs
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');


-- =============================================
-- ADVANCE REQUESTS TABLE
-- =============================================
-- Individual advance requests from employees

CREATE TABLE IF NOT EXISTS public.advance_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    
    -- Request details
    amount_usd DECIMAL(12, 2) NOT NULL CHECK (amount_usd > 0),
    fee_usd DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (fee_usd >= 0),
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'disbursed', 'settled')),
    
    -- Settlement reference
    receipt_id UUID REFERENCES public.receipts(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    settled_at TIMESTAMPTZ
);

-- Indexes for advance_requests
CREATE INDEX IF NOT EXISTS idx_advance_requests_company ON public.advance_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_advance_requests_employee ON public.advance_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_advance_requests_status ON public.advance_requests(status);

-- RLS for advance_requests
ALTER TABLE public.advance_requests ENABLE ROW LEVEL SECURITY;

-- Employees can view their own advances
CREATE POLICY "advance_requests_employee_read" ON public.advance_requests
    FOR SELECT USING (
        employee_id IN (
            SELECT id FROM public.employees WHERE auth.uid() = user_id
        )
    );

-- Companies can view all advances
CREATE POLICY "advance_requests_company_read" ON public.advance_requests
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM public.companies WHERE auth.uid() = user_id
        )
    );

CREATE POLICY "advance_requests_service_all" ON public.advance_requests
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');


-- =============================================
-- KYB SUBMISSIONS TABLE
-- =============================================
-- Know Your Business verification submissions

CREATE TABLE IF NOT EXISTS public.kyb_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    
    -- KYB status
    status TEXT NOT NULL DEFAULT 'unsubmitted' CHECK (status IN ('unsubmitted', 'pending', 'approved', 'rejected', 'under_review')),
    
    -- Submitted data (encrypted fields should be handled at app level)
    data JSONB NOT NULL DEFAULT '{}',
    documents TEXT[] DEFAULT '{}', -- File paths to uploaded documents
    
    -- Review information
    reviewer_notes TEXT,
    reviewed_by UUID,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ
);

-- Indexes for kyb_submissions
CREATE INDEX IF NOT EXISTS idx_kyb_submissions_company ON public.kyb_submissions(company_id);
CREATE INDEX IF NOT EXISTS idx_kyb_submissions_status ON public.kyb_submissions(status);

-- RLS for kyb_submissions
ALTER TABLE public.kyb_submissions ENABLE ROW LEVEL SECURITY;

-- Companies can view and submit their own KYB
CREATE POLICY "kyb_company_read" ON public.kyb_submissions
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM public.companies WHERE auth.uid() = user_id
        )
    );

CREATE POLICY "kyb_company_insert" ON public.kyb_submissions
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT id FROM public.companies WHERE auth.uid() = user_id
        )
    );

CREATE POLICY "kyb_service_all" ON public.kyb_submissions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');


-- =============================================
-- WALLET WHITELIST TABLE
-- =============================================
-- Whitelisted wallet addresses for payouts

CREATE TABLE IF NOT EXISTS public.wallet_whitelist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Wallet address (stored lowercase)
    wallet_address TEXT NOT NULL,
    
    -- Scope: NULL = global, company_id = company-specific
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    
    -- Metadata
    label TEXT,
    added_by UUID,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    
    -- Unique constraint: one entry per wallet per company (or global)
    UNIQUE(wallet_address, company_id)
);

-- Indexes for wallet_whitelist
CREATE INDEX IF NOT EXISTS idx_wallet_whitelist_address ON public.wallet_whitelist(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_whitelist_company ON public.wallet_whitelist(company_id);
CREATE INDEX IF NOT EXISTS idx_wallet_whitelist_employee ON public.wallet_whitelist(employee_id);
CREATE INDEX IF NOT EXISTS idx_wallet_whitelist_active ON public.wallet_whitelist(is_active);

-- RLS for wallet_whitelist
ALTER TABLE public.wallet_whitelist ENABLE ROW LEVEL SECURITY;

-- Anyone can check if a wallet is whitelisted (read-only)
CREATE POLICY "whitelist_read" ON public.wallet_whitelist
    FOR SELECT USING (true);

-- Companies can manage their own whitelist
CREATE POLICY "whitelist_company_insert" ON public.wallet_whitelist
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT id FROM public.companies WHERE auth.uid() = user_id
        )
    );

CREATE POLICY "whitelist_company_update" ON public.wallet_whitelist
    FOR UPDATE USING (
        company_id IN (
            SELECT id FROM public.companies WHERE auth.uid() = user_id
        )
    );

CREATE POLICY "whitelist_service_all" ON public.wallet_whitelist
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');


-- =============================================
-- UPDATE RECEIPTS TABLE
-- =============================================
-- Add additional fields to receipts table for audit and payout tracking

ALTER TABLE public.receipts 
ADD COLUMN IF NOT EXISTS audit_result JSONB,
ADD COLUMN IF NOT EXISTS payout_info JSONB,
ADD COLUMN IF NOT EXISTS payout_status TEXT CHECK (payout_status IN ('pending', 'processing', 'paid', 'failed'));


-- =============================================
-- AUDIT LOG TABLE (Optional but recommended)
-- =============================================
-- Track all system actions for compliance

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- What happened
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    
    -- Who did it
    user_id UUID,
    company_id UUID,
    
    -- Details
    old_data JSONB,
    new_data JSONB,
    metadata JSONB DEFAULT '{}',
    
    -- When
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- RLS for audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can access audit logs
CREATE POLICY "audit_logs_service_only" ON public.audit_logs
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');


-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_ledger_entries_updated_at
    BEFORE UPDATE ON public.ledger_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_advance_configs_updated_at
    BEFORE UPDATE ON public.advance_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_advance_requests_updated_at
    BEFORE UPDATE ON public.advance_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kyb_submissions_updated_at
    BEFORE UPDATE ON public.kyb_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_whitelist_updated_at
    BEFORE UPDATE ON public.wallet_whitelist
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE public.ledger_entries IS 'Financial ledger tracking all money movement';
COMMENT ON TABLE public.advance_configs IS 'Per-company advance credit configuration';
COMMENT ON TABLE public.advance_requests IS 'Employee expense advance requests';
COMMENT ON TABLE public.kyb_submissions IS 'Know Your Business verification submissions';
COMMENT ON TABLE public.wallet_whitelist IS 'Whitelisted wallet addresses for payouts';
COMMENT ON TABLE public.audit_logs IS 'System audit log for compliance tracking';
