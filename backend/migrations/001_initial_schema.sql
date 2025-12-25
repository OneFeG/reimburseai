-- =============================================================================
-- Reimburse.ai Database Schema
-- =============================================================================
-- Version: 1.0.0
-- Description: Initial database schema for multi-tenant expense reimbursement
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUMS
-- =============================================================================

-- Company verification status
CREATE TYPE company_status AS ENUM (
    'pending',      -- Awaiting KYB verification
    'verified',     -- KYB approved, can operate
    'suspended',    -- Temporarily disabled
    'rejected'      -- KYB failed
);

-- Employee status within a company
CREATE TYPE employee_status AS ENUM (
    'active',       -- Can submit receipts
    'inactive',     -- Disabled, cannot submit
    'pending'       -- Awaiting approval
);

-- Receipt processing status
CREATE TYPE receipt_status AS ENUM (
    'uploaded',     -- File uploaded, pending audit
    'processing',   -- AI audit in progress
    'approved',     -- Audit passed, pending payout
    'rejected',     -- Audit failed
    'paid',         -- Payout completed
    'flagged'       -- Requires manual review
);

-- Transaction types for ledger
CREATE TYPE ledger_entry_type AS ENUM (
    'audit_fee',        -- x402 audit fee payment
    'reimbursement',    -- Employee payout
    'deposit',          -- Company vault deposit
    'withdrawal',       -- Company vault withdrawal
    'advance',          -- Liquidity advance
    'advance_repayment' -- Advance repayment
);

-- =============================================================================
-- TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Companies (Tenants)
-- -----------------------------------------------------------------------------
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Info
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,  -- URL-friendly identifier (e.g., "acme-corp")
    email VARCHAR(255) NOT NULL UNIQUE,
    
    -- KYB/Compliance
    status company_status NOT NULL DEFAULT 'pending',
    kyb_verified_at TIMESTAMPTZ,
    kyb_provider VARCHAR(50),           -- e.g., "idenfy", "sumsub"
    kyb_reference_id VARCHAR(255),
    
    -- Blockchain (Vault)
    vault_address VARCHAR(42),          -- Ethereum address format (0x...)
    vault_deployed_at TIMESTAMPTZ,
    vault_chain_id INTEGER DEFAULT 43113,  -- Avalanche Fuji by default
    
    -- Settings
    settings JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for slug lookups (for reimburse.ai/[company_slug])
CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_companies_status ON companies(status);

-- -----------------------------------------------------------------------------
-- Employees
-- -----------------------------------------------------------------------------
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Basic Info
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    employee_number VARCHAR(50),        -- Internal company ID
    department VARCHAR(100),
    
    -- Wallet (for receiving payouts)
    wallet_address VARCHAR(42),         -- Ethereum address format
    wallet_verified_at TIMESTAMPTZ,
    
    -- Status
    status employee_status NOT NULL DEFAULT 'pending',
    
    -- Auth (if using password auth instead of SSO)
    password_hash VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique email per company
    UNIQUE(company_id, email)
);

CREATE INDEX idx_employees_company ON employees(company_id);
CREATE INDEX idx_employees_wallet ON employees(wallet_address);
CREATE INDEX idx_employees_status ON employees(status);

-- -----------------------------------------------------------------------------
-- Policies (Company expense rules)
-- -----------------------------------------------------------------------------
CREATE TABLE policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Policy Rules
    name VARCHAR(100) NOT NULL DEFAULT 'Default Policy',
    amount_cap_usd DECIMAL(10, 2) DEFAULT 1000.00,  -- Max single expense
    monthly_cap_usd DECIMAL(12, 2),                  -- Max per employee/month
    
    -- Category Rules (JSON array of allowed categories)
    allowed_categories JSONB DEFAULT '["travel", "meals", "software", "equipment", "office", "other"]'::jsonb,
    
    -- Vendor Rules
    vendor_whitelist JSONB DEFAULT '[]'::jsonb,     -- Empty = all allowed
    vendor_blacklist JSONB DEFAULT '[]'::jsonb,
    
    -- Time Rules
    max_days_old INTEGER DEFAULT 30,                 -- Receipts older than this are rejected
    
    -- AI Prompt Extension (custom rules in natural language)
    custom_rules TEXT,
    
    -- Flags
    require_description BOOLEAN DEFAULT false,
    require_category BOOLEAN DEFAULT true,
    auto_approve_under DECIMAL(10, 2) DEFAULT 50.00,  -- Auto-approve small expenses
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_policies_company ON policies(company_id);
CREATE UNIQUE INDEX idx_policies_company_active ON policies(company_id) WHERE is_active = true;

-- -----------------------------------------------------------------------------
-- Receipts
-- -----------------------------------------------------------------------------
CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- File Info
    file_path VARCHAR(500) NOT NULL,    -- Supabase storage path
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,         -- Bytes
    mime_type VARCHAR(100) NOT NULL,
    
    -- Extracted Data (from AI audit)
    merchant VARCHAR(255),
    merchant_category VARCHAR(100),
    receipt_date DATE,
    amount DECIMAL(12, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- AI Audit Results
    status receipt_status NOT NULL DEFAULT 'uploaded',
    ai_confidence DECIMAL(5, 2),        -- 0-100%
    ai_decision_reason TEXT,
    ai_extracted_data JSONB,            -- Full structured extraction
    ai_anomalies JSONB DEFAULT '[]'::jsonb,  -- Detected issues
    
    -- Audit Billing (x402)
    audit_fee_paid BOOLEAN DEFAULT false,
    audit_fee_tx_hash VARCHAR(66),      -- Transaction hash
    audit_fee_amount DECIMAL(10, 6),    -- USDC amount
    
    -- Payout Info
    payout_amount DECIMAL(12, 2),
    payout_tx_hash VARCHAR(66),
    payout_wallet VARCHAR(42),
    paid_at TIMESTAMPTZ,
    
    -- Manual Review
    reviewed_by UUID REFERENCES employees(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    
    -- Employee Submission
    description TEXT,
    category VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_receipts_company ON receipts(company_id);
CREATE INDEX idx_receipts_employee ON receipts(employee_id);
CREATE INDEX idx_receipts_status ON receipts(status);
CREATE INDEX idx_receipts_created ON receipts(created_at DESC);
CREATE INDEX idx_receipts_merchant ON receipts(merchant);

-- -----------------------------------------------------------------------------
-- Ledger (Financial Transactions)
-- -----------------------------------------------------------------------------
CREATE TABLE ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Entry Type
    entry_type ledger_entry_type NOT NULL,
    
    -- Amounts
    amount DECIMAL(12, 6) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USDC',
    
    -- References
    receipt_id UUID REFERENCES receipts(id),
    employee_id UUID REFERENCES employees(id),
    
    -- Blockchain
    tx_hash VARCHAR(66),
    from_address VARCHAR(42),
    to_address VARCHAR(42),
    chain_id INTEGER DEFAULT 43113,
    
    -- Description
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ledger_company ON ledger_entries(company_id);
CREATE INDEX idx_ledger_type ON ledger_entries(entry_type);
CREATE INDEX idx_ledger_created ON ledger_entries(created_at DESC);
CREATE INDEX idx_ledger_receipt ON ledger_entries(receipt_id);

-- -----------------------------------------------------------------------------
-- Advance Configuration (Liquidity Bridge)
-- -----------------------------------------------------------------------------
CREATE TABLE advance_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
    
    -- Limits
    credit_limit_usd DECIMAL(12, 2) DEFAULT 10000.00,
    utilized_usd DECIMAL(12, 2) DEFAULT 0.00,
    
    -- Fees
    fee_bps INTEGER DEFAULT 100,        -- 100 bps = 1%
    
    -- Status
    is_enabled BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Audit Log (For compliance)
-- -----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    
    -- Actor
    actor_type VARCHAR(50) NOT NULL,    -- 'employee', 'admin', 'system', 'api'
    actor_id UUID,
    actor_email VARCHAR(255),
    
    -- Action
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    
    -- Details
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_company ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================
-- This ensures Company A cannot query Company B's data

-- Enable RLS on all tenant tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- RLS Policies for Companies
-- -----------------------------------------------------------------------------
-- Service role can do anything (backend operations)
CREATE POLICY "Service role full access to companies"
    ON companies FOR ALL
    USING (auth.role() = 'service_role');

-- Authenticated users can only see their own company
CREATE POLICY "Users can view own company"
    ON companies FOR SELECT
    USING (
        id = (
            SELECT company_id FROM employees 
            WHERE employees.id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- RLS Policies for Employees
-- -----------------------------------------------------------------------------
CREATE POLICY "Service role full access to employees"
    ON employees FOR ALL
    USING (auth.role() = 'service_role');

-- Employees can view colleagues in same company
CREATE POLICY "Employees can view same company employees"
    ON employees FOR SELECT
    USING (
        company_id = (
            SELECT company_id FROM employees 
            WHERE employees.id = auth.uid()
        )
    );

-- Employees can update own record
CREATE POLICY "Employees can update own record"
    ON employees FOR UPDATE
    USING (id = auth.uid());

-- -----------------------------------------------------------------------------
-- RLS Policies for Policies (expense rules)
-- -----------------------------------------------------------------------------
CREATE POLICY "Service role full access to policies"
    ON policies FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Employees can view company policies"
    ON policies FOR SELECT
    USING (
        company_id = (
            SELECT company_id FROM employees 
            WHERE employees.id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- RLS Policies for Receipts
-- -----------------------------------------------------------------------------
CREATE POLICY "Service role full access to receipts"
    ON receipts FOR ALL
    USING (auth.role() = 'service_role');

-- Employees can view own receipts
CREATE POLICY "Employees can view own receipts"
    ON receipts FOR SELECT
    USING (employee_id = auth.uid());

-- Employees can insert own receipts
CREATE POLICY "Employees can insert own receipts"
    ON receipts FOR INSERT
    WITH CHECK (employee_id = auth.uid());

-- Managers can view all company receipts (requires role check)
CREATE POLICY "Managers can view all company receipts"
    ON receipts FOR SELECT
    USING (
        company_id = (
            SELECT company_id FROM employees 
            WHERE employees.id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- RLS Policies for Ledger
-- -----------------------------------------------------------------------------
CREATE POLICY "Service role full access to ledger"
    ON ledger_entries FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Employees can view company ledger"
    ON ledger_entries FOR SELECT
    USING (
        company_id = (
            SELECT company_id FROM employees 
            WHERE employees.id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- RLS Policies for Advance Configs
-- -----------------------------------------------------------------------------
CREATE POLICY "Service role full access to advance_configs"
    ON advance_configs FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Employees can view company advance config"
    ON advance_configs FOR SELECT
    USING (
        company_id = (
            SELECT company_id FROM employees 
            WHERE employees.id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- RLS Policies for Audit Logs
-- -----------------------------------------------------------------------------
CREATE POLICY "Service role full access to audit_logs"
    ON audit_logs FOR ALL
    USING (auth.role() = 'service_role');

-- Audit logs are read-only for employees
CREATE POLICY "Employees can view company audit logs"
    ON audit_logs FOR SELECT
    USING (
        company_id = (
            SELECT company_id FROM employees 
            WHERE employees.id = auth.uid()
        )
    );

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_policies_updated_at
    BEFORE UPDATE ON policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_receipts_updated_at
    BEFORE UPDATE ON receipts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_advance_configs_updated_at
    BEFORE UPDATE ON advance_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SEED DATA (Optional - for development/demo)
-- =============================================================================

-- Uncomment to insert demo data:
/*
-- Demo Company
INSERT INTO companies (name, slug, email, status) VALUES
('Acme Corporation', 'acme-corp', 'admin@acme.corp', 'verified');

-- Get the company ID
DO $$
DECLARE
    acme_id UUID;
BEGIN
    SELECT id INTO acme_id FROM companies WHERE slug = 'acme-corp';
    
    -- Demo Employees
    INSERT INTO employees (company_id, email, name, status, wallet_address) VALUES
    (acme_id, 'alice@acme.corp', 'Alice Smith', 'active', '0x1234567890123456789012345678901234567890'),
    (acme_id, 'bob@acme.corp', 'Bob Jones', 'active', '0x2345678901234567890123456789012345678901'),
    (acme_id, 'charlie@acme.corp', 'Charlie Day', 'active', NULL);
    
    -- Default Policy
    INSERT INTO policies (company_id, name, amount_cap_usd) VALUES
    (acme_id, 'Standard Policy', 500.00);
END $$;
*/
