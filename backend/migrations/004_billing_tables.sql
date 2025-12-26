-- Migration: 004_billing_tables.sql
-- Description: Add tables for usage tracking, billing, and invoicing
-- Phase 2: Dynamic Billing System
-- Author: Dev3 (Backend Lead)

-- =============================================
-- USAGE RECORDS TABLE
-- =============================================
-- Tracks all billable usage: audits, payouts, advances

CREATE TABLE IF NOT EXISTS public.usage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    
    -- Usage details
    usage_type TEXT NOT NULL CHECK (usage_type IN ('audit', 'payout', 'advance', 'storage')),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price_usd DECIMAL(12, 6),  -- Allows for fractional cents
    total_usd DECIMAL(12, 2) NOT NULL,
    
    -- Reference and metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for usage_records
CREATE INDEX IF NOT EXISTS idx_usage_records_company ON public.usage_records(company_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_type ON public.usage_records(usage_type);
CREATE INDEX IF NOT EXISTS idx_usage_records_created ON public.usage_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_records_company_type ON public.usage_records(company_id, usage_type);

-- RLS for usage_records
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;

-- Companies can view their own usage
CREATE POLICY "usage_records_company_read" ON public.usage_records
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM public.companies WHERE auth.uid() = user_id
        )
    );

-- Service role can do everything
CREATE POLICY "usage_records_service_all" ON public.usage_records
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');


-- =============================================
-- INVOICES TABLE
-- =============================================
-- Generated invoices for billing periods

CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    
    -- Invoice period
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled')),
    
    -- Line items and totals
    line_items JSONB NOT NULL DEFAULT '[]',
    subtotal_usd DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax_usd DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total_usd DECIMAL(12, 2) NOT NULL DEFAULT 0,
    
    -- Payment details
    paid_at TIMESTAMPTZ,
    payment_method TEXT,
    payment_reference TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ
);

-- Indexes for invoices
CREATE INDEX IF NOT EXISTS idx_invoices_company ON public.invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_period ON public.invoices(period_start, period_end);

-- RLS for invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Companies can view their own invoices
CREATE POLICY "invoices_company_read" ON public.invoices
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM public.companies WHERE auth.uid() = user_id
        )
    );

-- Service role can do everything
CREATE POLICY "invoices_service_all" ON public.invoices
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');


-- =============================================
-- BILLING PLANS TABLE (for future tiered pricing)
-- =============================================

CREATE TABLE IF NOT EXISTS public.billing_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Plan details
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    
    -- Pricing
    base_fee_usd DECIMAL(12, 2) NOT NULL DEFAULT 0,
    audit_fee_usd DECIMAL(12, 6) NOT NULL DEFAULT 0.05,
    payout_fee_bps INTEGER NOT NULL DEFAULT 50,  -- Basis points
    advance_fee_bps INTEGER NOT NULL DEFAULT 150,
    
    -- Limits
    included_audits INTEGER,  -- NULL = unlimited
    max_employees INTEGER,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Insert default plans
INSERT INTO public.billing_plans (name, description, base_fee_usd, audit_fee_usd, payout_fee_bps, advance_fee_bps, included_audits, max_employees)
VALUES 
    ('free', 'Free tier for testing', 0, 0.05, 50, 150, 10, 5),
    ('starter', 'Starter plan for small teams', 29, 0.05, 50, 150, 100, 25),
    ('growth', 'Growth plan for scaling teams', 99, 0.04, 40, 125, 500, 100),
    ('enterprise', 'Enterprise plan with custom pricing', 0, 0.03, 30, 100, NULL, NULL)
ON CONFLICT (name) DO NOTHING;


-- =============================================
-- COMPANY SUBSCRIPTIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.company_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.billing_plans(id),
    
    -- Subscription status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
    
    -- Period
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '1 month',
    
    -- Trial
    trial_end TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_company ON public.company_subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.company_subscriptions(status);

-- RLS for company_subscriptions
ALTER TABLE public.company_subscriptions ENABLE ROW LEVEL SECURITY;

-- Companies can view their own subscription
CREATE POLICY "subscriptions_company_read" ON public.company_subscriptions
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM public.companies WHERE auth.uid() = user_id
        )
    );

-- Service role can do everything
CREATE POLICY "subscriptions_service_all" ON public.company_subscriptions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');


-- =============================================
-- ADD UPDATED_AT TRIGGERS
-- =============================================

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_plans_updated_at
    BEFORE UPDATE ON public.billing_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.company_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE public.usage_records IS 'Tracks all billable usage for metering';
COMMENT ON TABLE public.invoices IS 'Generated invoices for billing periods';
COMMENT ON TABLE public.billing_plans IS 'Available billing/pricing plans';
COMMENT ON TABLE public.company_subscriptions IS 'Company subscription to billing plans';
