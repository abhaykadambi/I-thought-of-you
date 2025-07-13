const supabase = require('./config/supabase');

async function setupNotifications() {
  try {
    console.log('Setting up notification system...');

    // First, let's check if the http extension is available
    const { data: extensions, error: extError } = await supabase
      .rpc('pg_extension_exists', { extname: 'http' });

    if (extError) {
      console.log('Note: Cannot check http extension status. You may need to enable it manually in Supabase.');
    }

    // Check if the trigger function exists
    const { data: functions, error: funcError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_name', 'notify_new_thought');

    if (funcError) {
      console.error('Error checking for existing function:', funcError);
    } else if (functions.length === 0) {
      console.log('Trigger function does not exist. You need to run the SQL in notification_trigger.sql');
    } else {
      console.log('✅ Trigger function exists');
    }

    // Check if the trigger exists
    const { data: triggers, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name')
      .eq('trigger_name', 'thought_created');

    if (triggerError) {
      console.error('Error checking for existing trigger:', triggerError);
    } else if (triggers.length === 0) {
      console.log('Trigger does not exist. You need to run the SQL in notification_trigger.sql');
    } else {
      console.log('✅ Trigger exists');
    }

    console.log('\n📋 Setup Instructions:');
    console.log('1. Make sure your backend is running and accessible');
    console.log('2. Update the URL in notification_trigger.sql with your actual backend URL');
    console.log('3. Run the SQL commands in notification_trigger.sql in your Supabase SQL editor');
    console.log('4. Test by creating a new thought - the recipient should get a push notification');

  } catch (error) {
    console.error('Setup error:', error);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupNotifications();
}

module.exports = { setupNotifications }; 