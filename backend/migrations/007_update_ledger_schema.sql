-- Migration: 007_update_ledger_schema.sql
-- Description: Add missing columns to ledger_entries to support the service code
-- Run this in Supabase SQL Editor

-- Add missing columns to ledger_entries
ALTER TABLE public.ledger_entries 
ADD COLUMN IF NOT EXISTS amount_usd DECIMAL(12, 6),
ADD COLUMN IF NOT EXISTS fee_usd DECIMAL(12, 6) DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS reference_id UUID,
ADD COLUMN IF NOT EXISTS reference_type TEXT,
ADD COLUMN IF NOT EXISTS transaction_hash TEXT,
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS settled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Copy existing amount data to amount_usd if needed
UPDATE public.ledger_entries 
SET amount_usd = amount 
WHERE amount_usd IS NULL AND amount IS NOT NULL;

-- Add check constraint for status
ALTER TABLE public.ledger_entries 
DROP CONSTRAINT IF EXISTS ledger_entries_status_check;

ALTER TABLE public.ledger_entries 
ADD CONSTRAINT ledger_entries_status_check 
CHECK (status IS NULL OR status IN ('pending', 'processing', 'settled', 'failed', 'cancelled'));

-- Create index on status
CREATE INDEX IF NOT EXISTS idx_ledger_status ON public.ledger_entries(status);

-- Update entry_type enum to include 'payout' if it doesn't exist
-- Note: PostgreSQL doesn't allow easy enum modifications, so we may need to use TEXT instead
-- For now, let's change entry_type to TEXT if it's causing issues:
-- ALTER TABLE public.ledger_entries ALTER COLUMN entry_type TYPE TEXT;

COMMENT ON COLUMN public.ledger_entries.amount_usd IS 'Transaction amount in USD';
COMMENT ON COLUMN public.ledger_entries.fee_usd IS 'Associated fee in USD';
COMMENT ON COLUMN public.ledger_entries.status IS 'Transaction status: pending, processing, settled, failed, cancelled';
COMMENT ON COLUMN public.ledger_entries.reference_id IS 'Reference to related entity (receipt, advance request, etc.)';
COMMENT ON COLUMN public.ledger_entries.reference_type IS 'Type of reference entity';
