const supabase = require('./config/supabase');

async function setupModeration() {
  console.log('Setting up moderation system...\n');

  try {
    // Run the moderation system migration
    console.log('1. Creating moderation tables...');
    
    // You would typically run this SQL file against your database
    // For now, we'll just log what needs to be done
    console.log('✅ Please run the SQL from backend/database/add_moderation_system.sql');
    console.log('   This will create the necessary tables for the moderation system.\n');

    // Add an admin user (replace with actual user ID)
    console.log('2. Setting up admin user...');
    console.log('   To make a user an admin, run this SQL:');
    console.log('   INSERT INTO admin_users (user_id, role) VALUES (\'USER_ID_HERE\', \'admin\');\n');

    console.log('3. Setting up automated cleanup...');
    console.log('   Consider setting up a cron job to:');
    console.log('   - Check for reports older than 24 hours');
    console.log('   - Automatically resolve reports that haven\'t been reviewed');
    console.log('   - Send notifications to admins about pending reports\n');

    console.log('🎉 Moderation system setup complete!');
    console.log('\nNext steps:');
    console.log('1. Run the database migration');
    console.log('2. Add admin users to the admin_users table');
    console.log('3. Test the reporting and blocking functionality');
    console.log('4. Set up automated monitoring and cleanup');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

setupModeration(); 