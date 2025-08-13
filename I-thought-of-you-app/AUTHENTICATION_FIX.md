# Authentication Fix for Backend Reload Issue

## Problem Description
When the backend server reloads or restarts, all JWT tokens become invalid. However, the app was only checking if a token existed in AsyncStorage, not whether it was actually valid. This caused users to remain in the logged-in area but encounter errors when trying to access protected resources.

## Root Cause
The `isLoggedIn()` function in `authAPI` was only checking for token presence:
```javascript
// OLD CODE - Only checked if token exists
isLoggedIn: async () => {
  const token = await AsyncStorage.getItem('authToken');
  return !!token;
}
```

This meant that even invalid/expired tokens would return `true`, keeping users in the authenticated state.

## Solution Implemented

### 1. Enhanced Token Validation
Updated `authAPI.isLoggedIn()` to actually validate the stored token:
```javascript
// NEW CODE - Actually validates the token
validateToken: async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) return false;
    
    // Make a test API call to validate the token
    const response = await api.get('/auth/profile');
    return response.status === 200;
  } catch (error) {
    // If any error occurs (including 401), the token is invalid
    console.log('Token validation failed:', error.message);
    // Clean up invalid token
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
    return false;
  }
},

isLoggedIn: async () => {
  return await authAPI.validateToken();
}
```

### 2. API Call Wrapper
Created `apiCallWithAuth()` helper function to automatically handle authentication failures:
```javascript
export const apiCallWithAuth = async (apiFunction, navigation, onAuthFailure) => {
  try {
    return await apiFunction();
  } catch (error) {
    if (error.response?.status === 401) {
      // Handle authentication failure
      if (onAuthFailure) {
        onAuthFailure();
      } else if (navigation) {
        // Default behavior: redirect to welcome screen
        navigation.reset({
          index: 0,
          routes: [{ name: 'Welcome' }],
        });
      }
    }
    throw error;
  }
};
```

### 3. Updated All Protected Screens
Modified all screens that make API calls to use the new authentication wrapper:
- `FeedScreen.js` - Uses `apiCallWithAuth` for all API calls
- `FriendsListScreen.js` - Uses `apiCallWithAuth` for all API calls  
- `ProfileScreen.js` - Uses `apiCallWithAuth` for all API calls
- `ComposeThoughtScreen.js` - Uses `apiCallWithAuth` for all API calls

### 4. Periodic Authentication Check
Added a background check in `MainApp` that validates authentication every minute:
```javascript
// Periodic authentication check
React.useEffect(() => {
  const checkAuthInterval = setInterval(async () => {
    try {
      const isValid = await authAPI.validateToken();
      if (!isValid) {
        console.log('🔄 Token validation failed, redirecting to welcome screen');
        await authAPI.logout();
        navigation.reset({
          index: 0,
          routes: [{ name: 'Welcome' }],
        });
      }
    } catch (error) {
      // On error, redirect to welcome screen to be safe
      await authAPI.logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
    }
  }, 60000); // Check every minute

  return () => clearInterval(checkAuthInterval);
}, [navigation]);
```

### 5. Enhanced Error Handling
Updated error handling to distinguish between authentication errors and other errors:
```javascript
} catch (error) {
  console.error('Error loading thoughts:', error);
  // Don't show alert for auth errors as user will be redirected
  if (error.response?.status !== 401) {
    Alert.alert('Error', 'Failed to load thoughts. Please try again.');
  }
}
```

## How It Works Now

1. **App Startup**: When the app starts, `isLoggedIn()` makes a real API call to validate the stored token
2. **Invalid Token**: If the token is invalid, the user is immediately redirected to the welcome screen
3. **API Calls**: All protected API calls use `apiCallWithAuth()` which automatically redirects on 401 errors
4. **Background Check**: Every minute, the app validates the token and redirects if it becomes invalid
5. **Graceful Fallback**: If any authentication check fails, the user is safely redirected to the welcome screen

## Benefits

- ✅ **Immediate Detection**: Invalid tokens are detected on app startup
- ✅ **Automatic Redirects**: Users are automatically taken to the welcome screen when authentication fails
- ✅ **No More Stuck States**: Users can't get stuck in authenticated areas with invalid tokens
- ✅ **Real-time Validation**: Periodic checks ensure tokens remain valid during app usage
- ✅ **Better UX**: Users get clear feedback and are guided to re-authenticate
- ✅ **Robust Error Handling**: Distinguishes between auth errors and other errors

## Testing

To test this fix:
1. Start the app and log in
2. Restart your backend server
3. Try to use the app (navigate to Feed, Friends, Profile)
4. The app should automatically redirect you to the welcome screen
5. Check the console logs for authentication validation messages

## Files Modified

- `services/api.js` - Added token validation and API wrapper
- `App.js` - Enhanced app initialization and added periodic auth checks
- `screens/FeedScreen.js` - Updated to use authentication wrapper
- `screens/FriendsListScreen.js` - Updated to use authentication wrapper
- `screens/ProfileScreen.js` - Updated to use authentication wrapper
- `screens/ComposeThoughtScreen.js` - Updated to use authentication wrapper
- `services/useAuth.js` - New custom hook for authentication management

This fix ensures that users are never stuck in an invalid authenticated state and are always properly redirected when their authentication fails.
