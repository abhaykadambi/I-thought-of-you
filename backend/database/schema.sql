-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(32) UNIQUE,
    avatar TEXT,
    significant_other_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create thoughts table
CREATE TABLE IF NOT EXISTS thoughts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pinned_thoughts table
CREATE TABLE IF NOT EXISTS pinned_thoughts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    thought_id UUID NOT NULL REFERENCES thoughts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, thought_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_thoughts_sender_id ON thoughts(sender_id);
CREATE INDEX IF NOT EXISTS idx_thoughts_recipient_id ON thoughts(recipient_id);
CREATE INDEX IF NOT EXISTS idx_thoughts_created_at ON thoughts(created_at);
CREATE INDEX IF NOT EXISTS idx_pinned_thoughts_user_id ON pinned_thoughts(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinned_thoughts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view all users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for thoughts table
CREATE POLICY "Users can view thoughts they sent or received" ON thoughts
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create thoughts" ON thoughts
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- RLS Policies for pinned_thoughts table
CREATE POLICY "Users can view their own pinned thoughts" ON pinned_thoughts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can pin thoughts" ON pinned_thoughts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unpin their own thoughts" ON pinned_thoughts
    FOR DELETE USING (auth.uid() = user_id);

-- Create friend_requests table
CREATE TABLE IF NOT EXISTS friend_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(16) NOT NULL DEFAULT 'pending', -- pending, accepted, declined
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(sender_id, recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_friend_requests_sender_id ON friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_recipient_id ON friend_requests(recipient_id);

-- RLS Policies for friend_requests table
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own friend requests" ON friend_requests
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Users can create friend requests" ON friend_requests
    FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update their own incoming requests" ON friend_requests
    FOR UPDATE USING (auth.uid() = recipient_id);
CREATE POLICY "Users can delete their own requests" ON friend_requests
    FOR DELETE USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_thoughts_updated_at BEFORE UPDATE ON thoughts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get all friends for a user
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