-- Fix password constraint for Apple Sign-In users
-- Allow NULL passwords for users who signed up with Apple

-- First, update existing Apple users to have a placeholder password (if any exist)
UPDATE users SET password = 'apple_user_no_password' WHERE auth_provider = 'apple' AND password IS NULL;

-- Drop the NOT NULL constraint on password column
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- Add a check constraint to ensure password is not null for email users
ALTER TABLE users ADD CONSTRAINT check_password_for_email_users 
  CHECK ((auth_provider = 'email' AND password IS NOT NULL) OR auth_provider = 'apple');

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON users TO authenticated; 