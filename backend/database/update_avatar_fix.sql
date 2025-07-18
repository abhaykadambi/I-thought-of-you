-- Add avatar column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;

-- Add significant_other_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS significant_other_id UUID REFERENCES users(id);

-- Drop the existing get_friends function first
DROP FUNCTION IF EXISTS get_friends(uuid);

-- Recreate the get_friends function with avatar field
CREATE OR REPLACE FUNCTION get_friends(user_id uuid)
RETURNS TABLE(id uuid, name varchar, email varchar, phone varchar, avatar text, created_at timestamp with time zone) AS $$
BEGIN
  RETURN QUERY
    SELECT u.id, u.name, u.email, u.phone, u.avatar, u.created_at
    FROM users u
    WHERE u.id != user_id
      AND EXISTS (
        SELECT 1 FROM friend_requests fr
        WHERE fr.status = 'accepted'
          AND ((fr.sender_id = user_id AND fr.recipient_id = u.id)
               OR (fr.sender_id = u.id AND fr.recipient_id = user_id))
      );
END;
$$ LANGUAGE plpgsql; 