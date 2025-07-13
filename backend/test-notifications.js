const notificationService = require('./services/notificationService');
const supabase = require('./config/supabase');

async function testNotifications() {
  try {
    console.log('Testing notification system...');

    // Get a test user (first user in the database)
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, name, push_token')
      .limit(1);

    if (userError || !users || users.length === 0) {
      console.error('No users found for testing');
      return;
    }

    const testUser = users[0];
    console.log(`Testing with user: ${testUser.name} (${testUser.id})`);
    console.log(`Push token: ${testUser.push_token ? 'Present' : 'Not set'}`);

    if (!testUser.push_token) {
      console.log('No push token found. Please register a push token first.');
      return;
    }

    // Test sending a notification
    const success = await notificationService.sendThoughtNotification(
      testUser.id,
      'Test User'
    );

    if (success) {
      console.log('✅ Test notification sent successfully!');
    } else {
      console.log('❌ Failed to send test notification');
    }

  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testNotifications();
}

module.exports = testNotifications; 