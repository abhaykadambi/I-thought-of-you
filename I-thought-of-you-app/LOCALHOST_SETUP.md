# Localhost Setup for Testing

## Overview
Your app has been configured to use `localhost:3000` for testing purposes. All API calls now point to your local backend server instead of the production Railway server.

## What Was Changed

### 1. Main API Configuration (`services/api.js`)
- **Base URL**: Changed from `https://i-thought-of-you-production.up.railway.app/api` to `http://localhost:3000/api`
- **Avatar Upload**: Updated hardcoded URL in `uploadAvatar` function

### 2. Image Upload (`screens/ComposeThoughtScreen.js`)
- **Thought Image Upload**: Updated hardcoded URL for image uploads

### 3. Documentation
- Created `API_ENDPOINTS.md` - Complete list of all API endpoints
- Created `LOCALHOST_SETUP.md` - This file
- Created `AUTHENTICATION_FIX.md` - Previous authentication fixes

## Current Configuration

### Testing (Current)
```javascript
// services/api.js
baseURL: 'http://localhost:3000/api'

// Avatar upload
fetch('http://localhost:3000/api/auth/upload-avatar', ...)

// Thought image upload  
fetch('http://localhost:3000/api/thoughts/upload-image', ...)
```

### Production (When Ready to Build)
```javascript
// services/api.js
baseURL: 'https://i-thought-of-you-production.up.railway.app/api'

// Avatar upload
fetch('https://i-thought-of-you-production.up.railway.app/api/auth/upload-avatar', ...)

// Thought image upload
fetch('https://i-thought-of-you-production.up.railway.app/api/thoughts/upload-image', ...)
```

## All API Endpoints

Your frontend makes calls to these endpoints (all now pointing to localhost:3000):

### Authentication (`/auth`)
- `POST /auth/register` - User registration
- `POST /auth/login` - User login  
- `POST /auth/apple` - Apple Sign-In
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update profile
- `POST /auth/forgot-password` - Password reset
- `POST /auth/verify-reset-code` - Verify reset code
- `POST /auth/reset-password` - Reset password
- `POST /auth/verify-otp` - Verify OTP
- `GET /auth/check-username/:username` - Check username availability
- `POST /auth/upload-avatar` - Upload avatar image

### Thoughts (`/thoughts`)
- `GET /thoughts` - Get all thoughts
- `POST /thoughts` - Create thought
- `DELETE /thoughts/:id` - Delete thought
- `GET /thoughts/pinned` - Get pinned thoughts
- `POST /thoughts/pin/:id` - Pin thought
- `DELETE /thoughts/pin/:id` - Unpin thought
- `GET /thoughts/:id/reactions` - Get reactions
- `POST /thoughts/:id/reactions` - Add reaction
- `DELETE /thoughts/:id/reactions` - Remove reaction
- `POST /thoughts/upload-image` - Upload thought image

### Friends (`/friends`)
- `GET /friends` - Get all users
- `GET /friends/:id` - Get friend profile
- `DELETE /friends/:id` - Remove friend
- `GET /friends/requests` - Get friend requests
- `POST /friends/request` - Send friend request
- `POST /friends/request/:id/respond` - Respond to request
- `POST /friends/suggested` - Get suggested friends
- `GET /friends/search?query=:query` - Search users

### Settings (`/settings`)
- `GET /settings` - Get user settings
- `PUT /settings` - Update settings
- `PUT /settings/password` - Change password
- `DELETE /settings/account` - Delete account
- `GET /settings/blocked` - Get blocked users
- `POST /settings/block` - Block user
- `DELETE /settings/block/:id` - Unblock user

### Notifications (`/notifications`)
- `POST /notifications/register-token` - Register push token
- `DELETE /notifications/unregister-token` - Unregister token
- `GET /notifications/debug` - Debug notifications
- `POST /notifications/test` - Test notification

### Moderation (`/moderation`)
- `POST /moderation/report` - Report content
- `POST /moderation/block` - Block user
- `DELETE /moderation/block/:id` - Unblock user
- `GET /moderation/reports` - Get reports
- `PUT /moderation/reports/:id` - Update report
- `GET /moderation/dashboard` - Moderation dashboard

## Switching Between Environments

### Quick Switch Scripts

#### Switch to Localhost (Testing)
```bash
./switch-to-localhost.sh
```

#### Switch to Production (Building)
```bash
./switch-to-production.sh
```

### Manual Switch

If you prefer to manually switch, update these files:

1. **`services/api.js`** - Change baseURL
2. **`services/api.js`** - Update uploadAvatar fetch URL
3. **`screens/ComposeThoughtScreen.js`** - Update image upload fetch URL

## Testing Your Local Backend

### 1. Start Your Backend
```bash
cd backend
npm run dev
# or
npm start
```

### 2. Verify Backend is Running
```bash
curl http://localhost:3000/health
# Should return: {"status":"OK","message":"Server is running"}
```

### 3. Test Database Connection
```bash
curl http://localhost:3000/test-db
# Should return: {"status":"OK","message":"Database connection successful"}
```

### 4. Test Your App
- Start your React Native app
- Try to register/login
- Test API calls (they should now go to localhost:3000)

## Troubleshooting

### Common Issues

1. **Backend not running**
   - Error: "Network Error" or "ECONNREFUSED"
   - Solution: Start your backend server

2. **CORS issues**
   - Error: "CORS policy" errors
   - Solution: Ensure your backend has CORS enabled for localhost

3. **Port conflicts**
   - Error: "EADDRINUSE"
   - Solution: Change backend port or kill conflicting process

4. **Database connection**
   - Error: "Database connection failed"
   - Solution: Check your Supabase credentials and connection

### Debug Steps

1. Check backend logs for errors
2. Verify backend is running on port 3000
3. Test backend endpoints directly with curl/Postman
4. Check React Native console for network errors
5. Ensure your backend environment variables are set correctly

## Before Building for Production

1. **Switch to production URLs**:
   ```bash
   ./switch-to-production.sh
   ```

2. **Verify production URLs**:
   - Check `services/api.js` baseURL
   - Check avatar upload URL
   - Check image upload URL

3. **Test production endpoints**:
   - Ensure your production backend is running
   - Test a few key endpoints

4. **Build your app**:
   ```bash
   expo build:android
   # or
   expo build:ios
   ```

## Notes

- All API calls now go to `localhost:3000` for testing
- The app will work exactly the same, just pointing to your local backend
- Authentication, thoughts, friends, and all features will work locally
- When you're ready to build, use the switch script to go back to production
- Your local backend needs to be running for the app to work
- Make sure your backend has the same database schema and environment setup
