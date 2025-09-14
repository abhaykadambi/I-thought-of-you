const { Expo } = require('expo-server-sdk');
const supabase = require('../config/supabase');

// Create a new Expo SDK instance
const expo = new Expo();

class NotificationService {
  // Send push notification to a specific user
  async sendNotificationToUser(userId, title, body, data = {}) {
    try {
      console.log(`🔔 Sending notification to user ${userId}: ${title}`);
      
      // Get user's push token
      const { data: user, error } = await supabase
        .from('users')
        .select('push_token, name')
        .eq('id', userId)
        .single();

      if (error || !user) {
        console.error('Error fetching user for notification:', error);
        await this.logNotification(userId, title, body, 'error', 'User not found');
        return false;
      }

      if (!user.push_token) {
        console.log(`No push token found for user ${userId}`);
        await this.logNotification(userId, title, body, 'error', 'No push token');
        return false;
      }

      // Check that the push token is valid
      if (!Expo.isExpoPushToken(user.push_token)) {
        console.error(`Push token ${user.push_token} is not a valid Expo push token`);
        await this.logNotification(userId, title, body, 'error', 'Invalid push token');
        return false;
      }

      // Create the message
      const message = {
        to: user.push_token,
        sound: 'default',
        title: title,
        body: body,
        data: data,
      };

      console.log(`📤 Sending message to token: ${user.push_token.substring(0, 20)}...`);

      // Send the message
      const chunks = expo.chunkPushNotifications([message]);
      const tickets = [];

      for (let chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
          console.log(`📦 Sent chunk with ${ticketChunk.length} tickets`);
        } catch (error) {
          console.error('Error sending push notification chunk:', error);
        }
      }

      // Check for errors
      const errors = tickets.filter(ticket => ticket.status === 'error');
      if (errors.length > 0) {
        console.error('Push notification errors:', errors);
        await this.logNotification(userId, title, body, 'error', `Expo errors: ${JSON.stringify(errors)}`);
        return false;
      }

      console.log(`✅ Push notification sent successfully to user ${userId}`);
      await this.logNotification(userId, title, body, 'sent', 'Success');
      return true;

    } catch (error) {
      console.error('Error sending push notification:', error);
      await this.logNotification(userId, title, body, 'error', error.message);
      return false;
    }
  }

  // Log notification attempt
  async logNotification(userId, title, body, status, message) {
    try {
      await supabase
        .from('notification_logs')
        .insert([
          {
            user_id: userId,
            notification_type: title,
            success: status === 'sent',
            error_message: status === 'error' ? message : null,
            created_at: new Date().toISOString()
          }
        ]);
      console.log(`📝 Logged notification: ${status} - ${message}`);
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }

  // Send "someone thought of you" notification
  async sendThoughtNotification(recipientId, senderName) {
    return this.sendNotificationToUser(
      recipientId,
      'Someone thought of you! 💭',
      'Someone just had a thought about you 💭',
      {
        type: 'new_thought',
        senderName: senderName
      }
    );
  }
}

module.exports = new NotificationService(); 