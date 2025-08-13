# Frontend API Endpoints

## Base URL
**Current (Testing):** `http://localhost:3000/api`  
**Production:** `https://i-thought-of-you-production.up.railway.app/api`

## Authentication Endpoints (`/auth`)

### User Registration & Login
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/apple` - Apple Sign-In
- `POST /auth/apple/complete` - Complete Apple Sign-In

### Profile Management
- `GET /auth/profile` - Get current user profile
- `PUT /auth/profile` - Update user profile

### Password Recovery
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/verify-reset-code` - Verify reset code
- `POST /auth/reset-password` - Reset password with code
- `POST /auth/verify-otp` - Verify OTP for password reset
- `GET /auth/verify-reset-token/:token` - Verify reset token

### Username Management
- `GET /auth/check-username/:username` - Check if username is available

## Thoughts Endpoints (`/thoughts`)

### Thought Management
- `GET /thoughts` - Get all thoughts for current user (received and sent)
- `POST /thoughts` - Create a new thought
- `DELETE /thoughts/:thoughtId` - Delete a thought

### Pinned Thoughts
- `GET /thoughts/pinned` - Get pinned thoughts for current user
- `POST /thoughts/pin/:thoughtId` - Pin a thought
- `DELETE /thoughts/pin/:thoughtId` - Unpin a thought

### Reactions
- `GET /thoughts/:thoughtId/reactions` - Get reactions for a thought
- `POST /thoughts/:thoughtId/reactions` - Add a reaction to a thought
- `DELETE /thoughts/:thoughtId/reactions` - Remove reaction from a thought

### Image Upload
- `POST /thoughts/upload-image` - Upload image for a thought

## Friends Endpoints (`/friends`)

### Friend Management
- `GET /friends` - Get all users (potential friends)
- `GET /friends/:friendId` - Get friend profile with thoughts
- `DELETE /friends/:friendId` - Remove a friend

### Friend Requests
- `GET /friends/requests` - Get friend requests (incoming/outgoing)
- `POST /friends/request` - Send friend request
- `POST /friends/request/:requestId/respond` - Respond to friend request

### Friend Discovery
- `POST /friends/suggested` - Get suggested friends from contacts
- `GET /friends/debug-suggested` - Debug suggested friends
- `GET /friends/search?query=:query` - Search for users

## Settings Endpoints (`/settings`)

### User Settings
- `GET /settings` - Get user settings
- `PUT /settings` - Update user settings
- `PUT /settings/password` - Change password
- `DELETE /settings/account` - Delete account

### Privacy & Blocking
- `GET /settings/blocked` - Get blocked users
- `POST /settings/block` - Block a user
- `DELETE /settings/block/:userId` - Unblock a user

### Data & Testing
- `GET /settings/export` - Export user data
- `POST /settings/test-notification` - Test notification

## Notifications Endpoints (`/notifications`)

### Push Token Management
- `POST /notifications/register-token` - Register push token
- `DELETE /notifications/unregister-token` - Unregister push token

### Debug & Testing
- `GET /notifications/debug` - Debug notification setup
- `POST /notifications/test` - Test notification

## Moderation Endpoints (`/moderation`)

### Content Moderation
- `POST /moderation/report` - Report content
- `POST /moderation/block` - Block user
- `DELETE /moderation/block/:userId` - Unblock user

### Admin Functions
- `GET /moderation/blocked` - Get blocked users
- `GET /moderation/reports` - Get content reports
- `PUT /moderation/reports/:reportId` - Update report status
- `GET /moderation/dashboard` - Get moderation dashboard

## Health & Testing Endpoints

### Server Health
- `GET /health` - Server health check
- `GET /test-db` - Test database connection

## API Usage Patterns

### Authentication Flow
1. User registers/logs in → `POST /auth/register` or `POST /auth/login`
2. Token stored in AsyncStorage
3. All subsequent requests include `Authorization: Bearer {token}` header
4. Token validated on each API call
5. On 401 errors, user redirected to welcome screen

### Error Handling
- **401 Unauthorized**: Token invalid/expired, user redirected to welcome screen
- **400 Bad Request**: Validation errors, shown to user
- **500 Internal Server Error**: Server errors, logged and handled gracefully

### Request/Response Interceptors
- **Request**: Automatically adds auth token to headers
- **Response**: Automatically handles 401 errors and clears invalid tokens

## Testing Configuration

### Local Development
```javascript
// In services/api.js
baseURL: 'http://localhost:3000/api'
```

### Production Build
```javascript
// In services/api.js
baseURL: 'https://i-thought-of-you-production.up.railway.app/api'
```

## Notes

- All endpoints require authentication except `/auth/register`, `/auth/login`, and health checks
- Image uploads have 5MB size limit
- Pagination is supported for thoughts and friends with `limit` and `offset` parameters
- Push notifications require Expo push tokens to be registered
- Apple Sign-In requires additional setup and configuration

## Files That Make API Calls

### Core Services
- `services/api.js` - Main API service with all endpoint definitions
- `services/notificationService.js` - Push notification token management

### Screens
- `FeedScreen.js` - Thoughts loading and pagination
- `ComposeThoughtScreen.js` - Creating thoughts and loading friends
- `FriendsListScreen.js` - Friend management and discovery
- `ProfileScreen.js` - Profile updates and pinned thoughts
- `SettingsScreen.js` - User settings and moderation
- `AccountScreen.js` - Account management
- `AdminModerationScreen.js` - Content moderation
- `ThoughtDetailOverlay.js` - Thought interactions
- `ThoughtOptionsOverlay.js` - Thought actions
- `FriendProfileScreen.js` - Friend profile viewing
- `PrivacyScreen.js` - Privacy settings

### Custom Hooks
- `useAuth.js` - Authentication state management
