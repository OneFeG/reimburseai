-- =============================================================================
-- Multi-Company Employee Support Migration
-- =============================================================================
-- Version: 009
-- Description: Allows employees to work with multiple companies
-- =============================================================================

-- -----------------------------------------------------------------------------
-- New Junction Table: employee_company_memberships
-- This replaces the direct company_id in employees table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employee_company_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Role per company (employee can be admin in one, regular in another)
    role VARCHAR(50) NOT NULL DEFAULT 'employee',  -- 'admin', 'manager', 'employee'
    
    -- Status per company
    status employee_status NOT NULL DEFAULT 'pending',
    
    -- Employee's wallet for THIS company (could be different per company)
    wallet_address VARCHAR(42),
    
    -- Department in this company
    department VARCHAR(100),
    employee_number VARCHAR(50),
    
    -- Settings
    is_primary BOOLEAN DEFAULT false,  -- Primary company for the employee
    notifications_enabled BOOLEAN DEFAULT true,
    
    -- Timestamps
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique: one membership per employee-company pair
    UNIQUE(employee_id, company_id)
);

-- Indexes for fast lookups
CREATE INDEX idx_ecm_employee ON employee_company_memberships(employee_id);
CREATE INDEX idx_ecm_company ON employee_company_memberships(company_id);
CREATE INDEX idx_ecm_wallet ON employee_company_memberships(wallet_address);
CREATE INDEX idx_ecm_primary ON employee_company_memberships(employee_id, is_primary) WHERE is_primary = true;

-- -----------------------------------------------------------------------------
-- Migrate existing data: Create memberships from current employees table
-- -----------------------------------------------------------------------------
INSERT INTO employee_company_memberships (
    employee_id,
    company_id,
    role,
    status,
    wallet_address,
    department,
    employee_number,
    is_primary,
    joined_at
)
SELECT 
    id,
    company_id,
    COALESCE(role, 'employee'),
    status,
    wallet_address,
    department,
    employee_number,
    true,  -- Mark as primary
    created_at
FROM employees
WHERE company_id IS NOT NULL
ON CONFLICT (employee_id, company_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Global Employee Profile (shared across companies)
-- -----------------------------------------------------------------------------
-- Add global profile fields to employees table (if not exist)
ALTER TABLE employees 
    ADD COLUMN IF NOT EXISTS global_wallet_address VARCHAR(42),
    ADD COLUMN IF NOT EXISTS preferred_currency VARCHAR(3) DEFAULT 'USD',
    ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC',
    ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "push": true}'::jsonb;

-- Copy existing wallet to global wallet (one-time migration)
UPDATE employees 
SET global_wallet_address = wallet_address 
WHERE global_wallet_address IS NULL AND wallet_address IS NOT NULL;

-- -----------------------------------------------------------------------------
-- Enable RLS on new table
-- -----------------------------------------------------------------------------
ALTER TABLE employee_company_memberships ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access to memberships"
    ON employee_company_memberships FOR ALL
    USING (auth.role() = 'service_role');

-- Employees can view their own memberships
CREATE POLICY "Employees can view own memberships"
    ON employee_company_memberships FOR SELECT
    USING (employee_id = auth.uid());

-- Employees can update their own memberships
CREATE POLICY "Employees can update own memberships"
    ON employee_company_memberships FOR UPDATE
    USING (employee_id = auth.uid());

-- Company admins can manage memberships
CREATE POLICY "Admins can manage company memberships"
    ON employee_company_memberships FOR ALL
    USING (
        company_id IN (
            SELECT company_id FROM employee_company_memberships 
            WHERE employee_id = auth.uid() AND role = 'admin'
        )
    );

-- -----------------------------------------------------------------------------
-- Update receipts table to track which company membership submitted it
-- -----------------------------------------------------------------------------
ALTER TABLE receipts 
    ADD COLUMN IF NOT EXISTS membership_id UUID REFERENCES employee_company_memberships(id);

-- -----------------------------------------------------------------------------
-- Helper function: Get employee's companies
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_employee_companies(p_employee_id UUID)
RETURNS TABLE (
    company_id UUID,
    company_name VARCHAR,
    company_slug VARCHAR,
    role VARCHAR,
    status employee_status,
    is_primary BOOLEAN,
    vault_address VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.slug,
        ecm.role,
        ecm.status,
        ecm.is_primary,
        c.vault_address
    FROM employee_company_memberships ecm
    JOIN companies c ON c.id = ecm.company_id
    WHERE ecm.employee_id = p_employee_id
    ORDER BY ecm.is_primary DESC, ecm.joined_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- Helper function: Set primary company
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_primary_company(p_employee_id UUID, p_company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Remove primary from all other memberships
    UPDATE employee_company_memberships
    SET is_primary = false
    WHERE employee_id = p_employee_id;
    
    -- Set new primary
    UPDATE employee_company_memberships
    SET is_primary = true
    WHERE employee_id = p_employee_id AND company_id = p_company_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- Trigger: Ensure only one primary company per employee
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION ensure_single_primary_company()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = true THEN
        UPDATE employee_company_memberships
        SET is_primary = false
        WHERE employee_id = NEW.employee_id
        AND id != NEW.id
        AND is_primary = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_single_primary_company
    BEFORE INSERT OR UPDATE ON employee_company_memberships
    FOR EACH ROW
    WHEN (NEW.is_primary = true)
    EXECUTE FUNCTION ensure_single_primary_company();

-- -----------------------------------------------------------------------------
-- Trigger: Auto-update updated_at
-- -----------------------------------------------------------------------------
CREATE TRIGGER update_memberships_updated_at
    BEFORE UPDATE ON employee_company_memberships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Notes:
-- - Existing employees now have memberships created automatically
-- - The old company_id column in employees is kept for backward compatibility
-- - New API endpoints should use employee_company_memberships
-- - Frontend should allow switching between companies
-- =============================================================================
