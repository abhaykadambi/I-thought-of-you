-- Create content_reports table for flagging objectionable content
CREATE TABLE IF NOT EXISTS content_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_thought_id UUID NOT NULL REFERENCES thoughts(id) ON DELETE CASCADE,
    reported_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(50) NOT NULL CHECK (reason IN ('harassment', 'hate_speech', 'violence', 'spam', 'inappropriate', 'other')),
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    admin_notes TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(reporter_id, reported_thought_id) -- Prevent duplicate reports from same user
);

-- Create user_blocks table for blocking abusive users
CREATE TABLE IF NOT EXISTS user_blocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_user_id) -- Prevent duplicate blocks
);

-- Create admin_users table to identify moderators/admins
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'moderator' CHECK (role IN ('moderator', 'admin')),
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_reports_reporter_id ON content_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_reported_thought_id ON content_reports(reported_thought_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_reported_user_id ON content_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_created_at ON content_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker_id ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked_user_id ON user_blocks(blocked_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);

-- Enable Row Level Security
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_reports table
CREATE POLICY "Users can view their own reports" ON content_reports
    FOR SELECT USING (reporter_id = auth.uid());

CREATE POLICY "Users can create reports" ON content_reports
    FOR INSERT WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Admins can view all reports" ON content_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can update reports" ON content_reports
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.user_id = auth.uid()
        )
    );

-- RLS Policies for user_blocks table
CREATE POLICY "Users can view their own blocks" ON user_blocks
    FOR SELECT USING (blocker_id = auth.uid());

CREATE POLICY "Users can create blocks" ON user_blocks
    FOR INSERT WITH CHECK (blocker_id = auth.uid());

CREATE POLICY "Users can delete their own blocks" ON user_blocks
    FOR DELETE USING (blocker_id = auth.uid());

-- RLS Policies for admin_users table
CREATE POLICY "Admins can view admin users" ON admin_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.user_id = auth.uid()
        )
    );

-- Create trigger for updated_at on content_reports
CREATE TRIGGER update_content_reports_updated_at BEFORE UPDATE ON content_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check if a user is blocked by another user
CREATE OR REPLACE FUNCTION is_user_blocked(blocker_uuid uuid, blocked_uuid uuid)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_blocks 
        WHERE blocker_id = blocker_uuid AND blocked_user_id = blocked_uuid
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get pending reports count for admin dashboard
CREATE OR REPLACE FUNCTION get_pending_reports_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM content_reports 
        WHERE status = 'pending'
    );
END;
$$ LANGUAGE plpgsql; 