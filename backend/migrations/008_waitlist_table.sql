-- =============================================================================
-- Reimburse AI - Waitlist Table
-- =============================================================================
-- Version: 1.0.0
-- Description: Store waitlist signups for beta access
-- =============================================================================

-- Waitlist entries table
CREATE TABLE IF NOT EXISTS waitlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Contact Info
    email VARCHAR(255) NOT NULL UNIQUE,
    reason TEXT,
    
    -- Metadata
    source VARCHAR(50) DEFAULT 'website',  -- website, referral, etc.
    ip_address VARCHAR(45),                -- IPv4 or IPv6
    user_agent TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending',  -- pending, contacted, converted
    contacted_at TIMESTAMPTZ,
    converted_at TIMESTAMPTZ,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at DESC);

-- Disable RLS for waitlist (public signups)
ALTER TABLE waitlist DISABLE ROW LEVEL SECURITY;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_waitlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_waitlist_updated_at ON waitlist;
CREATE TRIGGER trigger_waitlist_updated_at
    BEFORE UPDATE ON waitlist
    FOR EACH ROW
    EXECUTE FUNCTION update_waitlist_updated_at();
