const supabase = require('./config/supabase');

async function setupNotifications() {
  try {
    console.log('Setting up notification system...');

    // 1. Enable http extension
    const { error: httpError } = await supabase.rpc('exec_sql', {
      sql: 'CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";'
    });

    if (httpError) {
      console.log('Note: http extension setup may require admin privileges');
    } else {
      console.log('✓ HTTP extension enabled');
    }

    // 2. Create the notification trigger function
    const triggerFunction = `
      CREATE OR REPLACE FUNCTION notify_new_thought()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Call the webhook endpoint
        PERFORM http_post(
          url := 'https://i-thought-of-you-production.up.railway.app/api/notifications/webhook/new-thought',
          body := json_build_object('thought_id', NEW.id),
          headers := '{"Content-Type": "application/json"}'::json
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;

    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql: triggerFunction
    });

    if (functionError) {
      console.error('Error creating trigger function:', functionError);
    } else {
      console.log('✓ Notification trigger function created');
    }

    // 3. Create the trigger
    const trigger = `
      DROP TRIGGER IF EXISTS thought_created ON thoughts;
      CREATE TRIGGER thought_created
        AFTER INSERT ON thoughts
        FOR EACH ROW
        EXECUTE FUNCTION notify_new_thought();
    `;

    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql: trigger
    });

    if (triggerError) {
      console.error('Error creating trigger:', triggerError);
    } else {
      console.log('✓ Notification trigger created');
    }

    // 4. Ensure push_token column exists
    const { error: columnError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token TEXT;'
    });

    if (columnError) {
      console.error('Error adding push_token column:', columnError);
    } else {
      console.log('✓ Push token column ensured');
    }

    console.log('Notification system setup complete!');
    console.log('Note: Make sure your Railway app is accessible at the webhook URL');

  } catch (error) {
    console.error('Setup error:', error);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupNotifications();
}

module.exports = setupNotifications; 