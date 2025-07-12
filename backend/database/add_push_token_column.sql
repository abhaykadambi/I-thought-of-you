-- Add push token column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Create index for push token lookups
CREATE INDEX IF NOT EXISTS idx_users_push_token ON users(push_token) WHERE push_token IS NOT NULL; 