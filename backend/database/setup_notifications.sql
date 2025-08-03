-- Setup notifications for I Thought of You app
-- Run this script in your Supabase database to ensure notifications work properly

-- 1. Ensure the push_token column exists in users table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'push_token'
    ) THEN
        ALTER TABLE users ADD COLUMN push_token TEXT;
    END IF;
END $$;

-- 2. Create function to handle new thought notifications
CREATE OR REPLACE FUNCTION handle_new_thought_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the new thought for debugging
    RAISE NOTICE 'New thought created: ID=%, sender_id=%, recipient_id=%', NEW.id, NEW.sender_id, NEW.recipient_id;
    
    -- The actual notification will be sent by the backend when creating the thought
    -- This trigger is mainly for logging and potential future webhook functionality
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger for new thoughts
DROP TRIGGER IF EXISTS thought_notification_trigger ON thoughts;
CREATE TRIGGER thought_notification_trigger
    AFTER INSERT ON thoughts
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_thought_notification();

-- 4. Create index on push_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_push_token ON users(push_token) WHERE push_token IS NOT NULL;

-- 5. Create a view to help debug notification issues
CREATE OR REPLACE VIEW notification_debug_view AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.username,
    CASE 
        WHEN u.push_token IS NOT NULL THEN 'Has Token'
        ELSE 'No Token'
    END as token_status,
    u.push_token,
    u.created_at,
    COUNT(t.id) as thoughts_received
FROM users u
LEFT JOIN thoughts t ON u.id = t.recipient_id
GROUP BY u.id, u.name, u.email, u.username, u.push_token, u.created_at
ORDER BY u.created_at DESC;

-- 6. Grant necessary permissions
GRANT SELECT ON notification_debug_view TO authenticated;

-- 7. Create a function to clean up invalid push tokens
CREATE OR REPLACE FUNCTION cleanup_invalid_push_tokens()
RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER := 0;
BEGIN
    -- Remove push tokens that don't look like valid Expo tokens
    UPDATE users 
    SET push_token = NULL 
    WHERE push_token IS NOT NULL 
    AND (push_token NOT LIKE 'ExponentPushToken[%]' OR length(push_token) < 50);
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    RAISE NOTICE 'Cleaned up % invalid push tokens', cleaned_count;
    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- 8. Create a function to get notification statistics
CREATE OR REPLACE FUNCTION get_notification_stats()
RETURNS TABLE(
    total_users INTEGER,
    users_with_tokens INTEGER,
    users_without_tokens INTEGER,
    recent_thoughts INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_users,
        COUNT(CASE WHEN push_token IS NOT NULL THEN 1 END)::INTEGER as users_with_tokens,
        COUNT(CASE WHEN push_token IS NULL THEN 1 END)::INTEGER as users_without_tokens,
        COUNT(CASE WHEN t.created_at > NOW() - INTERVAL '24 hours' THEN 1 END)::INTEGER as recent_thoughts
    FROM users u
    LEFT JOIN thoughts t ON u.id = t.recipient_id;
END;
$$ LANGUAGE plpgsql;

-- 9. Grant permissions for the new functions
GRANT EXECUTE ON FUNCTION cleanup_invalid_push_tokens() TO authenticated;
GRANT EXECUTE ON FUNCTION get_notification_stats() TO authenticated;

-- 10. Create a table to log notification attempts (optional, for debugging)
CREATE TABLE IF NOT EXISTS notification_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    notification_type TEXT NOT NULL,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Create index on notification logs
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at);

-- 12. Grant permissions for notification logs
GRANT SELECT, INSERT ON notification_logs TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE notification_logs_id_seq TO authenticated;

-- Print summary
DO $$
BEGIN
    RAISE NOTICE 'Notification setup completed successfully!';
    RAISE NOTICE 'Run SELECT * FROM get_notification_stats(); to see current stats';
    RAISE NOTICE 'Run SELECT * FROM notification_debug_view LIMIT 10; to debug user tokens';
END $$; 