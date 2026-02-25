-- Migration: 005_vault_admin_address
-- Description: Add vault_admin_address column to companies table
-- Phase: 1 - Vault Deployment

-- Add vault_admin_address to companies
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS vault_admin_address TEXT;

-- Comment
COMMENT ON COLUMN companies.vault_admin_address IS 'Wallet address of vault admin (client with withdrawal rights)';
