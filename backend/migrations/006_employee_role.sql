-- =============================================================================
-- Migration 006: Add Employee Role
-- =============================================================================
-- Adds role column to employees table for RBAC
-- Roles: admin, manager, employee
-- =============================================================================

-- Create role enum type
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'employee_role') THEN
        CREATE TYPE employee_role AS ENUM ('admin', 'manager', 'employee');
    END IF;
END $$;

-- Add role column to employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS role employee_role NOT NULL DEFAULT 'employee';

-- Create index for role lookups
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);

-- Update existing admin employees (first employee of each company is admin)
WITH first_employees AS (
    SELECT DISTINCT ON (company_id) id, company_id
    FROM employees
    ORDER BY company_id, created_at ASC
)
UPDATE employees
SET role = 'admin'
FROM first_employees
WHERE employees.id = first_employees.id
  AND employees.role = 'employee';

-- =============================================================================
-- Comments
-- =============================================================================
COMMENT ON COLUMN employees.role IS 'Employee role for RBAC: admin (full access), manager (approve receipts), employee (submit receipts)';
