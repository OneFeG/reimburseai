-- Quick Fix: Disable RLS for development/testing
-- Run this in Supabase SQL Editor for immediate testing
-- WARNING: Only use this in development, not production!

-- Disable RLS on wallet_whitelist
ALTER TABLE public.wallet_whitelist DISABLE ROW LEVEL SECURITY;

-- Disable RLS on employees (fixes infinite recursion)
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;

-- Disable RLS on ledger_entries (fixes infinite recursion in ledger query)
ALTER TABLE public.ledger_entries DISABLE ROW LEVEL SECURITY;

-- Optionally disable on other tables too for easier testing
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.advance_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.advance_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyb_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on usage_records and billing tables
ALTER TABLE IF EXISTS public.usage_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.billing_records DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('wallet_whitelist', 'employees', 'ledger_entries', 'companies', 'policies', 'receipts');
