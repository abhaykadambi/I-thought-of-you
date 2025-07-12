# Settings Implementation Setup Guide

## Overview
This implementation adds comprehensive Account, Privacy, and Notifications screens to the "I Thought of You" app with full backend support.

## Backend Setup

### 1. Database Schema
Run the following SQL in your Supabase SQL editor:

```sql
-- User Settings Table
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    privacy JSONB DEFAULT '{}',
    notifications JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Blocked Users Table
CREATE TABLE IF NOT EXISTS blocked_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, blocked_user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_user_id ON blocked_users(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_user_id ON blocked_users(blocked_user_id);

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_settings table
CREATE POLICY "Users can view their own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for blocked_users table
CREATE POLICY "Users can view their own blocked users" ON blocked_users
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can block users" ON blocked_users
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unblock their own blocked users" ON blocked_users
    FOR DELETE USING (auth.uid() = user_id);
```

### 2. Backend Dependencies
The backend already includes all necessary dependencies. The new routes are automatically loaded.

### 3. Start the Backend
```bash
cd backend
npm install
npm start
```

## Frontend Setup

### 1. Dependencies
All necessary dependencies are already included in the package.json.

### 2. Start the Frontend
```bash
cd I-thought-of-you-app
npm install
npm start
```

## Features Implemented

### AccountScreen
- ✅ Profile editing (name, avatar)
- ✅ Password change with validation
- ✅ Account deletion with confirmation
- ✅ Data export functionality
- ✅ Logout functionality

### PrivacyScreen
- ✅ Profile and thought visibility settings
- ✅ Social privacy controls
- ✅ Data analytics preferences
- ✅ Blocked users management
- ✅ Data export and deletion

### NotificationsScreen
- ✅ Push notification toggles
- ✅ Notification type controls
- ✅ Sound and vibration settings
- ✅ Quiet hours configuration
- ✅ Do not disturb mode
- ✅ Test notification functionality

## API Endpoints

### Settings Routes (`/api/settings`)
- `GET /` - Get user settings
- `PUT /` - Update user settings
- `PUT /password` - Change password
- `DELETE /account` - Delete account
- `GET /blocked` - Get blocked users
- `POST /block` - Block a user
- `DELETE /block/:userId` - Unblock a user
- `GET /export` - Export user data
- `POST /test-notification` - Send test notification

## Database Tables

### user_settings
- Stores privacy and notification preferences as JSONB
- One record per user
- Automatically created when settings are first saved

### blocked_users
- Tracks blocked user relationships
- Prevents blocked users from interacting
- Used for privacy controls

## Security Features

- All endpoints require authentication
- Row Level Security (RLS) enabled on all tables
- Password validation and hashing
- Account deletion cascades to all related data
- Blocked users cannot send thoughts or requests

## Testing

1. **Account Features:**
   - Edit profile information
   - Change password
   - Export data
   - Delete account

2. **Privacy Features:**
   - Toggle privacy settings
   - Block/unblock users
   - Test visibility controls

3. **Notification Features:**
   - Toggle notification types
   - Configure quiet hours
   - Test notifications

## Notes

- Settings are automatically created with defaults when first accessed
- Blocked users are completely isolated from the blocking user
- Account deletion is permanent and removes all associated data
- Test notifications currently return success (would need push service integration)
- Data export returns JSON format (could be extended to CSV/PDF)

## Future Enhancements

- Push notification service integration (Firebase, OneSignal)
- Email notifications for data export
- Advanced privacy controls
- Activity logs
- Two-factor authentication 