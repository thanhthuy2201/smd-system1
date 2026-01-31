-- Migration: Add WITHDRAWN value to approvalaction enum type
-- Date: 2026-01-31
-- Description: Adds 'Withdrawn' as a valid action for approval history

-- Add 'Withdrawn' to the approvalaction enum type
ALTER TYPE approvalaction ADD VALUE IF NOT EXISTS 'Withdrawn';

-- Verify the enum values
SELECT enumlabel FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'approvalaction');
