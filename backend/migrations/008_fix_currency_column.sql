-- Migration: 008_fix_currency_column.sql
-- Description: Fix currency column to allow 4+ characters for "USDC"
-- Run this in Supabase SQL Editor

-- Expand currency column in ledger_entries to accommodate "USDC" (4 chars)
ALTER TABLE public.ledger_entries 
ALTER COLUMN currency TYPE VARCHAR(10);

-- Also fix the receipts table if needed
ALTER TABLE public.receipts 
ALTER COLUMN currency TYPE VARCHAR(10);

-- Update default value in ledger_entries (already USDC)
ALTER TABLE public.ledger_entries 
ALTER COLUMN currency SET DEFAULT 'USDC';

COMMENT ON COLUMN public.ledger_entries.currency IS 'Currency code (e.g., USD, USDC, ETH)';
COMMENT ON COLUMN public.receipts.currency IS 'Currency code (e.g., USD, USDC)';
