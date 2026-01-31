-- Migration: Add file attachment columns to syllabi table
-- Date: 2026-01-31
-- Description: Adds columns for storing uploaded syllabus file metadata

-- Add file attachment columns to syllabi table
ALTER TABLE syllabi
ADD COLUMN IF NOT EXISTS original_file_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS file_path VARCHAR(500),
ADD COLUMN IF NOT EXISTS file_size INTEGER,
ADD COLUMN IF NOT EXISTS file_type VARCHAR(50);

-- Add comments for documentation
COMMENT ON COLUMN syllabi.original_file_name IS 'Original uploaded filename';
COMMENT ON COLUMN syllabi.file_path IS 'Storage path (Supabase/S3/local)';
COMMENT ON COLUMN syllabi.file_size IS 'File size in bytes';
COMMENT ON COLUMN syllabi.file_type IS 'MIME type (application/pdf, etc.)';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'syllabi'
AND column_name IN ('original_file_name', 'file_path', 'file_size', 'file_type');
