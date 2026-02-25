-- Migration: 006_fix_rls_policies.sql
-- Description: Fix RLS policies that cause infinite recursion and service role access issues
-- Run this in Supabase SQL Editor

-- =============================================
-- FIX WALLET_WHITELIST RLS
-- =============================================
-- Drop the problematic policy
DROP POLICY IF EXISTS "whitelist_service_all" ON public.wallet_whitelist;

-- Create a proper service role policy using auth.role()
CREATE POLICY "whitelist_service_all" ON public.wallet_whitelist
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Also allow insert/update/delete for service role explicitly
DROP POLICY IF EXISTS "whitelist_read" ON public.wallet_whitelist;

CREATE POLICY "whitelist_select_all" ON public.wallet_whitelist
    FOR SELECT 
    USING (true);

CREATE POLICY "whitelist_insert_service" ON public.wallet_whitelist
    FOR INSERT 
    TO service_role
    WITH CHECK (true);

CREATE POLICY "whitelist_update_service" ON public.wallet_whitelist
    FOR UPDATE 
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "whitelist_delete_service" ON public.wallet_whitelist
    FOR DELETE 
    TO service_role
    USING (true);


-- =============================================
-- FIX EMPLOYEES RLS (Infinite Recursion)
-- =============================================
-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Employees can view same company employees" ON public.employees;

-- Create a non-recursive policy for employees viewing their company
-- This uses a security definer function to avoid recursion
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT company_id FROM public.employees WHERE id = auth.uid() LIMIT 1;
$$;

-- Re-create the policy using the function
CREATE POLICY "Employees can view same company employees"
    ON public.employees FOR SELECT
    USING (
        auth.role() = 'service_role' 
        OR company_id = get_user_company_id()
    );


-- =============================================
-- FIX COMPANIES RLS
-- =============================================
DROP POLICY IF EXISTS "Users can view own company" ON public.companies;

CREATE POLICY "Users can view own company"
    ON public.companies FOR SELECT
    USING (
        auth.role() = 'service_role'
        OR id = get_user_company_id()
    );


-- =============================================
-- FIX POLICIES (expense rules) RLS
-- =============================================
DROP POLICY IF EXISTS "Employees can view company policies" ON public.policies;

CREATE POLICY "Employees can view company policies"
    ON public.policies FOR SELECT
    USING (
        auth.role() = 'service_role'
        OR company_id = get_user_company_id()
    );


-- =============================================
-- FIX RECEIPTS RLS
-- =============================================
DROP POLICY IF EXISTS "Managers can view all company receipts" ON public.receipts;

CREATE POLICY "Managers can view all company receipts"
    ON public.receipts FOR SELECT
    USING (
        auth.role() = 'service_role'
        OR company_id = get_user_company_id()
    );


-- =============================================
-- FIX LEDGER_ENTRIES RLS
-- =============================================
DROP POLICY IF EXISTS "Employees can view company ledger" ON public.ledger_entries;

CREATE POLICY "Employees can view company ledger"
    ON public.ledger_entries FOR SELECT
    USING (
        auth.role() = 'service_role'
        OR company_id = get_user_company_id()
    );


-- =============================================
-- FIX ADVANCE_CONFIGS RLS
-- =============================================
DROP POLICY IF EXISTS "Employees can view company advance config" ON public.advance_configs;

CREATE POLICY "Employees can view company advance config"
    ON public.advance_configs FOR SELECT
    USING (
        auth.role() = 'service_role'
        OR company_id = get_user_company_id()
    );


-- =============================================
-- FIX AUDIT_LOGS RLS
-- =============================================
DROP POLICY IF EXISTS "Employees can view company audit logs" ON public.audit_logs;

CREATE POLICY "Employees can view company audit logs"
    ON public.audit_logs FOR SELECT
    USING (
        auth.role() = 'service_role'
        OR company_id = get_user_company_id()
    );


-- =============================================
-- FIX KYB_SUBMISSIONS RLS
-- =============================================
DROP POLICY IF EXISTS "kyb_service_all" ON public.kyb_submissions;

CREATE POLICY "kyb_service_all" ON public.kyb_submissions
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "kyb_select_company" ON public.kyb_submissions
    FOR SELECT
    USING (
        auth.role() = 'service_role'
        OR company_id = get_user_company_id()
    );


-- =============================================
-- FIX ADVANCE_REQUESTS RLS
-- =============================================
DROP POLICY IF EXISTS "advance_requests_service_all" ON public.advance_requests;

CREATE POLICY "advance_requests_service_all" ON public.advance_requests
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "advance_requests_select_company" ON public.advance_requests
    FOR SELECT
    USING (
        auth.role() = 'service_role'
        OR company_id = get_user_company_id()
    );


-- =============================================
-- VERIFICATION
-- =============================================
-- Test that service role can insert into wallet_whitelist
-- SELECT * FROM pg_policies WHERE tablename = 'wallet_whitelist';
-- SELECT * FROM pg_policies WHERE tablename = 'employees';

COMMENT ON FUNCTION get_user_company_id() IS 'Helper function to get the company_id of the current user without causing RLS recursion';
