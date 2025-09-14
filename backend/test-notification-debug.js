const { Expo } = require('expo-server-sdk');
const supabase = require('./config/supabase');

// Create a new Expo SDK instance
const expo = new Expo();

async function debugNotifications() {
  console.log('🔍 === Backend Notification Debug ===');
  
  try {
    // Check if we can connect to Supabase
    console.log('📡 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('id, name, push_token')
      .limit(1);
    
    if (testError) {
      console.error('❌ Supabase connection failed:', testError);
      return;
    }
    
    console.log('✅ Supabase connection successful');
    
    // Get all users with push tokens
    console.log('👥 Fetching users with push tokens...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, push_token')
      .not('push_token', 'is', null);
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }
    
    console.log(`📊 Found ${users.length} users with push tokens`);
    
    // Check token validity
    let validTokens = 0;
    let invalidTokens = 0;
    
    for (const user of users) {
      if (Expo.isExpoPushToken(user.push_token)) {
        validTokens++;
        console.log(`✅ User ${user.name} (${user.email}) has valid token: ${user.push_token.substring(0, 20)}...`);
      } else {
        invalidTokens++;
        console.log(`❌ User ${user.name} (${user.email}) has invalid token: ${user.push_token}`);
      }
    }
    
    console.log(`📈 Token Summary: ${validTokens} valid, ${invalidTokens} invalid`);
    
    // Test sending a notification to the first valid user
    if (validTokens > 0) {
      const testUser = users.find(user => Expo.isExpoPushToken(user.push_token));
      console.log(`🧪 Testing notification to ${testUser.name}...`);
      
      const message = {
        to: testUser.push_token,
        sound: 'default',
        title: 'Debug Test Notification',
        body: 'This is a debug test notification from the backend!',
        data: { type: 'debug_test' },
      };
      
      try {
        const chunks = expo.chunkPushNotifications([message]);
        const tickets = [];
        
        for (let chunk of chunks) {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        }
        
        const errors = tickets.filter(ticket => ticket.status === 'error');
        if (errors.length > 0) {
          console.error('❌ Notification errors:', errors);
        } else {
          console.log('✅ Test notification sent successfully!');
        }
      } catch (error) {
        console.error('❌ Error sending test notification:', error);
      }
    }
    
    // Check notification logs
    console.log('📋 Checking notification logs...');
    const { data: logs, error: logsError } = await supabase
      .from('notification_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (logsError) {
      console.error('❌ Error fetching logs:', logsError);
    } else {
      console.log(`📊 Found ${logs.length} recent notification logs`);
      logs.forEach(log => {
        console.log(`  - ${log.created_at}: ${log.status} - ${log.message}`);
      });
    }
    
  } catch (error) {
    console.error('💥 Debug error:', error);
  }
}

// Run the debug
debugNotifications().then(() => {
  console.log('🏁 Debug complete');
  process.exit(0);
}).catch(error => {
  console.error('💥 Debug failed:', error);
  process.exit(1);
});
