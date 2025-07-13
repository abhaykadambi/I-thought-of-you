# Notification System Setup Guide

## Overview
The notification system sends push notifications to users when they receive a thought. The system uses:
- **Expo Push Notifications** for sending notifications
- **Supabase Database Triggers** to detect new thoughts
- **Railway Backend** to handle webhook calls

## How It Works

1. **User registers push token**: When a user logs in, the app requests notification permissions and registers their push token with the backend
2. **Thought is created**: When someone sends a thought, it's saved to the database
3. **Database trigger fires**: A Supabase trigger detects the new thought and calls the webhook
4. **Backend processes webhook**: The Railway backend receives the webhook and sends a push notification
5. **User receives notification**: The recipient gets a push notification saying "Someone thought of you! 💭"

## Setup Steps

### 1. Database Setup

Run the notification trigger setup in your Supabase SQL editor:

```sql
-- Enable the http extension for webhooks
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";

-- Create function to notify backend about new thoughts
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

-- Create trigger to call the function when a new thought is inserted
DROP TRIGGER IF EXISTS thought_created ON thoughts;
CREATE TRIGGER thought_created
  AFTER INSERT ON thoughts
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_thought();
```

### 2. Backend Setup

The backend is already configured with:
- ✅ Notification service (`backend/services/notificationService.js`)
- ✅ Webhook endpoint (`backend/routes/notifications.js`)
- ✅ Push token registration endpoints
- ✅ Railway deployment

### 3. Frontend Setup

The frontend is already configured with:
- ✅ Notification service (`I-thought-of-you-app/services/notificationService.js`)
- ✅ Permission requests on app startup
- ✅ Push token registration
- ✅ Notification listeners

## Testing the System

### 1. Test Push Token Registration

1. Open the app and log in
2. Check the console for "Notification permissions granted successfully!"
3. Check the console for "Push token registered successfully"

### 2. Test Notification Sending

You can test the notification system by running:

```bash
cd backend
node test-notifications.js
```

This will send a test notification to the first user in the database.

### 3. Test End-to-End Flow

1. Have two users logged in on different devices
2. User A sends a thought to User B
3. User B should receive a push notification saying "Someone thought of you! 💭"

## Troubleshooting

### Common Issues

1. **No notifications received**
   - Check if push tokens are registered in the database
   - Verify notification permissions are granted
   - Check Railway logs for webhook errors

2. **Webhook not firing**
   - Verify the http extension is enabled in Supabase
   - Check the trigger function exists
   - Verify the Railway URL is correct

3. **Permission denied**
   - Users need to grant notification permissions
   - Check device notification settings

### Debug Steps

1. **Check push token registration**:
   ```sql
   SELECT id, name, push_token FROM users WHERE push_token IS NOT NULL;
   ```

2. **Check trigger function**:
   ```sql
   SELECT routine_name FROM information_schema.routines WHERE routine_name = 'notify_new_thought';
   ```

3. **Check trigger**:
   ```sql
   SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = 'thought_created';
   ```

4. **Test webhook manually**:
   ```bash
   curl -X POST https://i-thought-of-you-production.up.railway.app/api/notifications/webhook/new-thought \
     -H "Content-Type: application/json" \
     -d '{"thought_id": "your-thought-id"}'
   ```

## Configuration

### Notification Message
The notification message can be customized in `backend/services/notificationService.js`:

```javascript
async sendThoughtNotification(recipientId, senderName) {
  return this.sendNotificationToUser(
    recipientId,
    'Someone thought of you! 💭',  // Title
    `${senderName} just had a thought about you 💭`,  // Body
    {
      type: 'new_thought',
      senderName: senderName
    }
  );
}
```

### Webhook URL
If you change the Railway URL, update it in:
1. `backend/database/notification_trigger.sql`
2. `backend/setup-notifications.js`

## Security Notes

- The webhook endpoint doesn't require authentication (it's called by Supabase)
- Push tokens are stored securely in the database
- Notifications only contain the sender's name, not the thought content
- Users can disable notifications in their device settings

## Performance

- Notifications are sent asynchronously
- Failed notifications are logged but don't block the thought creation
- Push tokens are validated before sending
- The system handles multiple notifications efficiently 