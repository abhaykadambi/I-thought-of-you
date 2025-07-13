# Push Notification Setup Guide

This guide will help you set up automatic push notifications for new thoughts in your "I Thought of You" app.

## 🎯 Overview

When a user sends a thought to someone, the recipient will automatically receive a push notification on their device.

## 📋 Prerequisites

1. **Backend Server**: Your Express.js backend must be running and accessible via HTTPS
2. **Supabase Database**: Your database must have the `http` extension enabled
3. **Expo Push Tokens**: Users must have granted notification permissions

## 🚀 Setup Steps

### Step 1: Update Backend URL

Edit `backend/database/notification_trigger.sql` and replace the placeholder URL:

```sql
-- Change this line:
url := 'https://your-backend-url.com/api/notifications/webhook/new-thought',

-- To your actual backend URL, for example:
url := 'https://your-app.herokuapp.com/api/notifications/webhook/new-thought',
```

**For Local Development:**
- Use a service like [ngrok](https://ngrok.com/) to expose your local server
- Run: `ngrok http 3000`
- Use the ngrok URL in the SQL file

### Step 2: Enable HTTP Extension in Supabase

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run this command:

```sql
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";
```

### Step 3: Create Database Trigger

1. In Supabase SQL Editor, run the contents of `backend/database/notification_trigger.sql`
2. This creates:
   - A function `notify_new_thought()` that calls your webhook
   - A trigger `thought_created` that fires when a new thought is inserted

### Step 4: Test the Setup

1. Start your backend server
2. Send a thought from one user to another
3. The recipient should receive a push notification

## 🔧 Troubleshooting

### Check if Trigger is Working

Run this query in Supabase SQL Editor:

```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'thought_created';
```

### Check if Function Exists

```sql
SELECT * FROM information_schema.routines 
WHERE routine_name = 'notify_new_thought';
```

### Test Webhook Manually

You can test the webhook endpoint directly:

```bash
curl -X POST https://your-backend-url.com/api/notifications/webhook/new-thought \
  -H "Content-Type: application/json" \
  -d '{"thought_id": "some-thought-id"}'
```

### Common Issues

1. **"http extension not available"**
   - Contact Supabase support to enable the http extension
   - Or use Edge Functions as an alternative

2. **"Webhook not receiving calls"**
   - Check your backend URL is correct and accessible
   - Ensure your backend is running
   - Check Supabase logs for trigger errors

3. **"Push notifications not sending"**
   - Verify users have granted notification permissions
   - Check that push tokens are stored in the database
   - Review the notification service logs

## 📱 Frontend Integration

The frontend is already set up to:
- Request notification permissions
- Register push tokens with the backend
- Handle incoming notifications
- Navigate to the feed when a notification is tapped

## 🔄 How It Works

1. **User sends a thought** → Thought is saved to database
2. **Supabase trigger fires** → Calls your webhook endpoint
3. **Backend processes webhook** → Fetches thought details and recipient info
4. **Push notification sent** → Via Expo's push service
5. **User receives notification** → On their device

## 🛠️ Development vs Production

### Development
- Use ngrok for local development
- Test with real devices or simulators
- Monitor logs carefully

### Production
- Use a proper HTTPS domain
- Set up monitoring for webhook failures
- Consider rate limiting and error handling

## 📊 Monitoring

Add these logs to monitor the system:

```javascript
// In your webhook endpoint
console.log(`Webhook received for thought: ${thought_id}`);

// In your notification service
console.log(`Sending notification to user: ${userId}`);
```

## 🔐 Security Considerations

1. **Webhook Authentication**: Consider adding authentication to your webhook endpoint
2. **Rate Limiting**: Implement rate limiting to prevent abuse
3. **Error Handling**: Gracefully handle webhook failures
4. **Token Validation**: Validate push tokens before sending

## 📝 Next Steps

After setup, consider:
- Adding notification preferences per user
- Implementing notification history
- Adding different notification types (friend requests, etc.)
- Setting up notification analytics 