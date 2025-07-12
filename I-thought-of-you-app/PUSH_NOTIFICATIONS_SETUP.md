# Push Notifications Setup Guide

This guide explains how push notifications work in the "I Thought of You" app and what setup is required.

## **How Push Notifications Work**

### **The Problem with Local Notifications:**
Local notifications can only be sent from the device that's running the app. So when User A sends a thought to User B, the notification would go to User A's device (the sender), not User B's device (the recipient).

### **The Solution: Push Notifications**
Push notifications are sent from the server to the recipient's device, which is exactly what we need.

## **How It Works:**

1. **User grants notification permissions** → App gets Expo push token → Token registered with backend
2. **User sends thought** → Backend creates thought → Sends push notification to recipient's device
3. **Recipient receives notification** → "Someone thought of you! 💭"

## **Setup Required:**

### **Step 1: Get Your Expo Project ID**
1. Go to [https://expo.dev](https://expo.dev)
2. Sign in with your account
3. Create a new project or use an existing one
4. Copy the project ID from the URL: `https://expo.dev/accounts/[username]/projects/[project-id]`

### **Step 2: Update Project ID**
1. Open `I-thought-of-you-app/services/notificationService.js`
2. Replace `'your-expo-project-id'` with your actual project ID:
   ```javascript
   projectId: 'your-actual-project-id-here',
   ```

### **Step 3: Run Database Migration**
Run this SQL in your Supabase dashboard:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token TEXT;
CREATE INDEX IF NOT EXISTS idx_users_push_token ON users(push_token) WHERE push_token IS NOT NULL;
```

### **Step 4: Install Backend Dependency**
```bash
cd backend
npm install expo-server-sdk
```

## **Testing:**

1. **Install the app** on two devices
2. **Grant notification permissions** on both devices
3. **Send a thought** from Device A to Device B
4. **Check Device B** - it should receive a push notification

## **Why This Approach:**

- ✅ **Recipient gets the notification** (not the sender)
- ✅ **Works when app is closed** (push notifications work in background)
- ✅ **Works across devices** (server sends to recipient's device)
- ✅ **Real-time** (notifications arrive immediately)

## **Troubleshooting:**

- **No notifications received**: Check that the project ID is correct
- **Token registration fails**: Check backend logs for errors
- **Notifications not showing**: Ensure the app has notification permissions

The push notification approach is necessary because we need to send notifications to the recipient's device, not the sender's device. 