-- Create reactions table
CREATE TABLE IF NOT EXISTS thought_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    thought_id UUID NOT NULL REFERENCES thoughts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('happy', 'sad', 'disgust', 'laughing', 'anger', 'smirk')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(thought_id, user_id) -- One reaction per user per thought
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_thought_reactions_thought_id ON thought_reactions(thought_id);
CREATE INDEX IF NOT EXISTS idx_thought_reactions_user_id ON thought_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_thought_reactions_type ON thought_reactions(reaction_type);

-- Enable Row Level Security
ALTER TABLE thought_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for thought_reactions table
CREATE POLICY "Users can view reactions on thoughts they sent or received" ON thought_reactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM thoughts t 
            WHERE t.id = thought_reactions.thought_id 
            AND (t.sender_id = auth.uid() OR t.recipient_id = auth.uid())
        )
    );

CREATE POLICY "Users can create reactions on thoughts they received" ON thought_reactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM thoughts t 
            WHERE t.id = thought_reactions.thought_id 
            AND t.recipient_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own reactions" ON thought_reactions
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own reactions" ON thought_reactions
    FOR DELETE USING (user_id = auth.uid()); 