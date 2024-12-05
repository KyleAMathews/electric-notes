-- Add active_users column to notes table
ALTER TABLE notes ADD COLUMN active_users JSONB DEFAULT '[]'::jsonb;
