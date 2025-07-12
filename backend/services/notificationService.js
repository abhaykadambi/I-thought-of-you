const { Expo } = require('expo-server-sdk');
const supabase = require('../config/supabase');

// Create a new Expo SDK instance
const expo = new Expo();

class NotificationService {
  // Send push notification to a specific user
  async sendNotificationToUser(userId, title, body, data = {}) {
    try {
      // Get user's push token
      const { data: user, error } = await supabase
        .from('users')
        .select('push_token, name')
        .eq('id', userId)
        .single();

      if (error || !user) {
        console.error('Error fetching user for notification:', error);
        return false;
      }

      if (!user.push_token) {
        console.log(`No push token found for user ${userId}`);
        return false;
      }

      // Check that the push token is valid
      if (!Expo.isExpoPushToken(user.push_token)) {
        console.error(`Push token ${user.push_token} is not a valid Expo push token`);
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

      // Send the message
      const chunks = expo.chunkPushNotifications([message]);
      const tickets = [];

      for (let chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Error sending push notification chunk:', error);
        }
      }

      // Check for errors
      const errors = tickets.filter(ticket => ticket.status === 'error');
      if (errors.length > 0) {
        console.error('Push notification errors:', errors);
        return false;
      }

      console.log(`Push notification sent successfully to user ${userId}`);
      return true;

    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  // Send "someone thought of you" notification
  async sendThoughtNotification(recipientId, senderName) {
    return this.sendNotificationToUser(
      recipientId,
      'Someone thought of you! 💭',
      `${senderName} just had a thought about you`,
      {
        type: 'new_thought',
        senderName: senderName
      }
    );
  }
}

module.exports = new NotificationService(); 