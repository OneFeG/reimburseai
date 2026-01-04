-- ============================================
-- Migration 011: Multi-Currency Support
-- ============================================
-- Adds support for multiple stablecoins and currency conversion tracking
-- 
-- Changes:
-- 1. Add base_currency to companies table
-- 2. Add currency conversion fields to receipts table
-- ============================================

-- Add base_currency to companies
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS base_currency VARCHAR(10) DEFAULT 'USDC';

-- Add comment for documentation
COMMENT ON COLUMN companies.base_currency IS 'Company base stablecoin for payouts (USDC, EURC, USDT, DAI)';

-- Add multi-currency fields to receipts
ALTER TABLE receipts 
ADD COLUMN IF NOT EXISTS original_currency VARCHAR(3) DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS original_amount DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS converted_amount DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS payout_currency VARCHAR(10) DEFAULT 'USDC',
ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(12, 6),
ADD COLUMN IF NOT EXISTS exchange_rate_timestamp TIMESTAMPTZ;

-- Comments for documentation
COMMENT ON COLUMN receipts.original_currency IS 'Original fiat currency from receipt (USD, EUR, GBP, INR, etc.)';
COMMENT ON COLUMN receipts.original_amount IS 'Original amount in original_currency';
COMMENT ON COLUMN receipts.converted_amount IS 'Converted amount in payout_currency';
COMMENT ON COLUMN receipts.payout_currency IS 'Stablecoin used for payout (company base_currency)';
COMMENT ON COLUMN receipts.exchange_rate IS 'Exchange rate used: original_currency -> payout_currency fiat peg';
COMMENT ON COLUMN receipts.exchange_rate_timestamp IS 'When the exchange rate was fetched';

-- Migrate existing data: set original_amount = amount where NULL
UPDATE receipts 
SET original_amount = amount,
    original_currency = COALESCE(currency, 'USD'),
    converted_amount = amount,
    payout_currency = 'USDC'
WHERE original_amount IS NULL;

-- Create enum type for supported currencies (optional, for stricter validation)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'supported_currency') THEN
        CREATE TYPE supported_currency AS ENUM ('USDC', 'EURC', 'USDT', 'DAI');
    END IF;
END $$;

-- Index for currency-based queries
CREATE INDEX IF NOT EXISTS idx_receipts_payout_currency ON receipts(payout_currency);
CREATE INDEX IF NOT EXISTS idx_companies_base_currency ON companies(base_currency);

-- ============================================
-- Verification
-- ============================================
-- Run this to verify the migration:
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'receipts' AND column_name LIKE '%currency%';
--
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'companies' AND column_name = 'base_currency';
