-- Add Apple Sign-In support to users table
-- This migration adds columns for Apple ID and auth provider

-- Add apple_id column for storing Apple's unique user identifier
ALTER TABLE users ADD COLUMN IF NOT EXISTS apple_id TEXT UNIQUE;

-- Add auth_provider column to track how users authenticated
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email';

-- Create index on apple_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_apple_id ON users(apple_id) WHERE apple_id IS NOT NULL;

-- Create index on auth_provider for analytics
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);

-- Add constraint to ensure auth_provider is one of the valid values
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS check_auth_provider 
  CHECK (auth_provider IN ('email', 'apple'));

-- Update existing users to have 'email' as auth_provider
UPDATE users SET auth_provider = 'email' WHERE auth_provider IS NULL;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON users TO authenticated; 