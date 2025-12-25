-- =============================================================================
-- Supabase Storage Policies
-- =============================================================================
-- Run this AFTER creating the 'receipts' bucket in Supabase Storage
-- Dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT/storage/buckets
-- =============================================================================

-- First, create the bucket via Supabase Dashboard or API with these settings:
-- - Name: receipts
-- - Public: false
-- - File size limit: 10MB
-- - Allowed MIME types: image/jpeg, image/png, image/webp, application/pdf

-- -----------------------------------------------------------------------------
-- Storage RLS Policies
-- -----------------------------------------------------------------------------

-- Service role can do anything (backend uploads)
CREATE POLICY "Service role full access"
ON storage.objects FOR ALL
USING (bucket_id = 'receipts' AND auth.role() = 'service_role');

-- Employees can upload to their own folder: receipts/{company_id}/{employee_id}/*
CREATE POLICY "Employees can upload own receipts"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'receipts' 
    AND (storage.foldername(name))[1] = (
        SELECT company_id::text FROM employees WHERE id = auth.uid()
    )
    AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Employees can view their own receipts
CREATE POLICY "Employees can view own receipts"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Managers can view all receipts in their company
CREATE POLICY "Managers can view company receipts"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = (
        SELECT company_id::text FROM employees WHERE id = auth.uid()
    )
);
