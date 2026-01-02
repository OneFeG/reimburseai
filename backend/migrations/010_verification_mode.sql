-- =============================================================================
-- Migration 010: Add Verification Mode to Policies
-- =============================================================================
-- Adds verification_mode and daily_receipt_limit fields to policies table
-- to support Autonomous vs Human Verification modes for receipt processing.
-- =============================================================================

-- Create enum for verification mode
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_mode') THEN
        CREATE TYPE verification_mode AS ENUM (
            'autonomous',           -- AI handles everything, hard limit enforced
            'human_verification'    -- All receipts go through human review
        );
    END IF;
END $$;

-- Add new columns to policies table
ALTER TABLE policies 
ADD COLUMN IF NOT EXISTS verification_mode verification_mode NOT NULL DEFAULT 'autonomous';

ALTER TABLE policies 
ADD COLUMN IF NOT EXISTS daily_receipt_limit INTEGER NOT NULL DEFAULT 3;

-- Add constraint for daily_receipt_limit
ALTER TABLE policies 
ADD CONSTRAINT chk_daily_receipt_limit 
CHECK (daily_receipt_limit >= 1 AND daily_receipt_limit <= 50);

-- Add comment for documentation
COMMENT ON COLUMN policies.verification_mode IS 'How receipts are verified: autonomous (AI-only) or human_verification (manual review)';
COMMENT ON COLUMN policies.daily_receipt_limit IS 'Maximum receipts per employee per day. Default is 3.';

-- =============================================================================
-- Function to check daily receipt limit for an employee
-- =============================================================================
CREATE OR REPLACE FUNCTION check_daily_receipt_limit(
    p_employee_id UUID,
    p_company_id UUID
)
RETURNS TABLE (
    can_upload BOOLEAN,
    current_count INTEGER,
    daily_limit INTEGER,
    verification_mode verification_mode,
    requires_human_review BOOLEAN
) AS $$
DECLARE
    v_policy RECORD;
    v_today_count INTEGER;
BEGIN
    -- Get active policy for the company
    SELECT p.verification_mode, p.daily_receipt_limit 
    INTO v_policy
    FROM policies p
    WHERE p.company_id = p_company_id AND p.is_active = true
    LIMIT 1;
    
    -- If no policy found, use defaults
    IF v_policy IS NULL THEN
        v_policy.verification_mode := 'autonomous';
        v_policy.daily_receipt_limit := 3;
    END IF;
    
    -- Count receipts uploaded today by this employee
    SELECT COUNT(*)
    INTO v_today_count
    FROM receipts r
    WHERE r.employee_id = p_employee_id
      AND r.company_id = p_company_id
      AND DATE(r.created_at AT TIME ZONE 'UTC') = CURRENT_DATE;
    
    -- Determine if upload is allowed
    -- For HUMAN_VERIFICATION mode: hard limit, no uploads after limit
    -- For AUTONOMOUS mode: hard limit enforced as well
    RETURN QUERY SELECT
        (v_today_count < v_policy.daily_receipt_limit) AS can_upload,
        v_today_count AS current_count,
        v_policy.daily_receipt_limit AS daily_limit,
        v_policy.verification_mode,
        (v_policy.verification_mode = 'human_verification') AS requires_human_review;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Update existing policies to have default values
-- =============================================================================
-- Set autonomous mode with limit of 10 for existing policies (more generous for existing users)
UPDATE policies 
SET verification_mode = 'autonomous', daily_receipt_limit = 10
WHERE verification_mode IS NULL OR daily_receipt_limit IS NULL;
