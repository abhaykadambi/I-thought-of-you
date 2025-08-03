-- Make username case-insensitive and ensure uniqueness is case-insensitive

-- First, normalize all existing usernames to lowercase
UPDATE users SET username = LOWER(username) WHERE username IS NOT NULL;

-- Create a case-insensitive unique index on username
-- This will prevent duplicate usernames that differ only by case
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lowercase ON users (LOWER(username));

-- Drop the old case-sensitive index if it exists
DROP INDEX IF EXISTS idx_users_username;

-- Create a new case-insensitive index for lookups
CREATE INDEX IF NOT EXISTS idx_users_username_lookup ON users (LOWER(username));

-- Add a check constraint to ensure usernames are always stored in lowercase
ALTER TABLE users ADD CONSTRAINT check_username_lowercase CHECK (username = LOWER(username)); 