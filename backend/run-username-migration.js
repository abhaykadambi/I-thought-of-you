const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runUsernameMigration() {
  try {
    console.log('Starting username migration...');
    
    // Add username column
    console.log('Adding username column...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(32) UNIQUE;
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      `
    });
    
    if (alterError) {
      console.error('Error adding username column:', alterError);
      return;
    }
    
    console.log('Username column added successfully!');
    
    // Update the get_friends function to include username
    console.log('Updating get_friends function...');
    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION get_friends(user_id uuid)
        RETURNS TABLE(id uuid, name varchar, email varchar, phone varchar, username varchar, avatar text, created_at timestamp with time zone) AS $$
        BEGIN
          RETURN QUERY
            SELECT u.id, u.name, u.email, u.phone, u.username, u.avatar, u.created_at
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
      `
    });
    
    if (functionError) {
      console.error('Error updating get_friends function:', functionError);
      return;
    }
    
    console.log('get_friends function updated successfully!');
    console.log('Username migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
runUsernameMigration(); 