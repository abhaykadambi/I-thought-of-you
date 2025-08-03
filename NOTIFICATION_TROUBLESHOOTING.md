# Push Notification Troubleshooting Guide

## Why Notifications Work in Development but Not in Production

Push notifications often work in development but fail in production due to several key differences:

### 1. **Expo Project Configuration**
- **Development**: Uses development build with development certificates
- **Production**: Uses production build with production certificates
- **Solution**: Ensure your `app.json` has the correct `projectId` and `owner`

### 2. **Push Token Registration**
- **Development**: Tokens are automatically registered
- **Production**: Tokens must be explicitly registered with your backend
- **Solution**: Verify tokens are being saved to the database

### 3. **App Permissions**
- **Development**: Permissions are often more permissive
- **Production**: Stricter permission requirements
- **Solution**: Ensure users grant notification permissions

## Quick Fixes to Try

### 1. **Run Database Migration**
Execute the notification setup script in your Supabase database:
```sql
-- Run the contents of backend/database/setup_notifications.sql
```

### 2. **Check Project ID**
Verify your Expo project ID in `app.json` matches your actual Expo project:
```json
{
  "extra": {
    "eas": {
      "projectId": "35bc5d75-73b4-4250-b2d1-470d61a7279d"
    }
  }
}
```

### 3. **Test with Debug Button**
Use the new debug button in Settings → 🔧 Debug Notifications to:
- Check permission status
- Verify push token generation
- Test local notifications
- Test remote notifications

### 4. **Check Console Logs**
Look for these key log messages:
- `"Requesting notification permissions..."`
- `"Got push token: ExponentPushToken[...]"`
- `"Push token registered successfully with backend"`
- `"Push notification sent successfully"`

## Common Issues and Solutions

### Issue 1: "No push token found for user"
**Cause**: User's push token not saved to database
**Solution**: 
1. Check if `requestPermissions()` is called on app startup
2. Verify the `/notifications/register-token` endpoint works
3. Check database for `push_token` column

### Issue 2: "Push token is not a valid Expo push token"
**Cause**: Invalid or expired push token
**Solution**:
1. Re-register the user's push token
2. Check if token format matches `ExponentPushToken[...]`
3. Run the cleanup function: `SELECT cleanup_invalid_push_tokens();`

### Issue 3: "Permission denied"
**Cause**: User denied notification permissions
**Solution**:
1. Guide user to Settings → Notifications
2. Use the debug button to check permission status
3. Provide clear instructions for enabling notifications

### Issue 4: "Expo push service error"
**Cause**: Expo push service configuration issue
**Solution**:
1. Verify project ID is correct
2. Check if app is properly configured in Expo dashboard
3. Ensure you're using the correct Expo SDK version

## Debugging Steps

### Step 1: Check User Setup
```sql
-- Check if user has push token
SELECT id, name, push_token IS NOT NULL as has_token 
FROM users 
WHERE id = 'your-user-id';
```

### Step 2: Check Notification Stats
```sql
-- Get overall notification statistics
SELECT * FROM get_notification_stats();
```

### Step 3: Check Recent Logs
```sql
-- Check recent notification attempts
SELECT * FROM notification_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

### Step 4: Test Backend Notification
```bash
# Test sending a notification via API
curl -X POST https://your-backend.com/api/notifications/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

## Production Checklist

- [ ] Database migration script executed
- [ ] Push token column exists in users table
- [ ] Notification trigger is active
- [ ] Expo project ID is correct
- [ ] App permissions are properly configured
- [ ] Backend notification service is working
- [ ] Users are granting notification permissions
- [ ] Push tokens are being registered

## Testing Notifications

### Local Testing
1. Use the debug button in Settings
2. Check console for detailed logs
3. Verify local test notification appears

### Remote Testing
1. Send a thought to another user
2. Check if recipient receives notification
3. Verify notification appears when app is closed

### Production Testing
1. Deploy the updated app
2. Test with real users
3. Monitor notification delivery rates
4. Check backend logs for errors

## Monitoring and Maintenance

### Regular Checks
- Monitor notification delivery rates
- Check for invalid push tokens
- Review notification logs
- Update Expo SDK when needed

### Cleanup Tasks
```sql
-- Clean up invalid tokens monthly
SELECT cleanup_invalid_push_tokens();

-- Check notification statistics
SELECT * FROM get_notification_stats();
```

## Support

If issues persist:
1. Check the debug output from the Settings screen
2. Review backend logs for errors
3. Verify database setup is correct
4. Test with a fresh user account
5. Check Expo dashboard for project status 