-- Add username column to users table
ALTER TABLE users ADD COLUMN username VARCHAR(32) UNIQUE;

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Add RLS policy for username lookups
CREATE POLICY "Users can search by username" ON users
    FOR SELECT USING (true); 