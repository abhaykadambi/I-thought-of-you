# Apple Sign-In Setup Guide

## Overview
This guide will help you set up Apple Sign-In for your "I Thought of You" app. Apple Sign-In requires configuration in both the Apple Developer Console and your backend environment.

## Prerequisites
- Apple Developer Account ($99/year)
- Access to your app's Apple Developer Console
- Backend server with environment variable support

## Step-by-Step Setup

### 1. Enable Sign In with Apple Capability
1. Go to [Apple Developer Console](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Identifiers** in the left sidebar
4. Find your app's App ID (should be `com.ithoughtofyou.app`)
5. Click on the App ID to edit it
6. Scroll down to **Capabilities**
7. ✅ Check **Sign In with Apple**
8. Click **Save**

### 2. Create a Sign In with Apple Key
1. In the left sidebar, click **Keys**
2. Click the **+** button to create a new key
3. Enter a name (e.g., "Sign In with Apple Key")
4. ✅ Check **Sign In with Apple**
5. Click **Configure** next to Sign In with Apple
6. Select your App ID (`com.ithoughtofyou.app`)
7. Click **Save**
8. Click **Continue** and then **Register**
9. **IMPORTANT**: Download the `.p8` file immediately (you can't download it again!)
10. Note down the **Key ID** (10 characters)

### 3. Get Your Team ID
1. In the left sidebar, click **Membership**
2. Your **Team ID** is displayed at the top (10 characters)

### 4. Extract the Private Key
1. Open the downloaded `.p8` file in a text editor
2. Copy the entire content including the BEGIN and END markers
3. The content should look like:
   ```
   -----BEGIN PRIVATE KEY-----
   MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
   -----END PRIVATE KEY-----
   ```

### 5. Set Environment Variables
Add these to your backend's `.env` file:

```bash
# Apple Sign-In Configuration
APPLE_BUNDLE_ID=com.ithoughtofyou.app
APPLE_TEAM_ID=YOUR_TEAM_ID_HERE
APPLE_KEY_ID=YOUR_KEY_ID_HERE
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
YOUR_PRIVATE_KEY_CONTENT_HERE
-----END PRIVATE KEY-----
```

## Production Deployment Checklist

### ✅ Before Deploying to App Store

1. **Apple Developer Console**
   - [ ] Sign In with Apple capability enabled
   - [ ] Sign In with Apple key created and downloaded
   - [ ] Team ID noted
   - [ ] Key ID noted

2. **Backend Environment**
   - [ ] `APPLE_BUNDLE_ID` set to `com.ithoughtofyou.app`
   - [ ] `APPLE_TEAM_ID` set to your 10-character team ID
   - [ ] `APPLE_KEY_ID` set to your 10-character key ID
   - [ ] `APPLE_PRIVATE_KEY` set to your .p8 file content

3. **App Configuration**
   - [ ] `app.json` has `"usesAppleSignIn": true`
   - [ ] `app.json` has correct `"bundleIdentifier": "com.ithoughtofyou.app"`
   - [ ] `eas.json` has `"ios.resourceClass": "m-medium"` for production builds

4. **Testing**
   - [ ] Test Apple Sign-In locally with simulator
   - [ ] Test Apple Sign-In with TestFlight build
   - [ ] Verify backend logs show successful token verification
   - [ ] Test with real Apple ID (not simulator)

### 🚨 Common App Store Issues

1. **Bundle ID Mismatch**
   - Ensure `APPLE_BUNDLE_ID` in backend matches `bundleIdentifier` in `app.json`
   - Both should be exactly `com.ithoughtofyou.app`

2. **Missing Capability**
   - If Apple Sign-In fails in App Store but works in simulator, check that the capability is enabled in Apple Developer Console

3. **Environment Variables**
   - Ensure all Apple Sign-In environment variables are set in your production backend
   - Don't forget to set them in your hosting platform (Heroku, Railway, etc.)

4. **Key Expiration**
   - Apple Sign-In keys don't expire, but ensure you have the correct one
   - You can create multiple keys if needed

## Testing

### Local Testing
```bash
cd backend
node test-apple-config.js
```

### Production Testing
1. Deploy backend with all environment variables set
2. Build and submit app to TestFlight
3. Test Apple Sign-In with real Apple ID
4. Check backend logs for successful verification

## Troubleshooting

### "Apple Sign-In Failed" Error
1. Check backend logs for token verification errors
2. Verify all environment variables are set correctly
3. Ensure Apple Developer Console configuration is correct
4. Test with TestFlight before App Store submission

### Token Verification Errors
1. Check that `APPLE_BUNDLE_ID` matches your app's bundle identifier
2. Verify the private key is correctly formatted
3. Ensure the backend can reach `https://appleid.apple.com/auth/keys`

## Security Notes
- Never commit your `.p8` file or private key to version control
- Use environment variables for all sensitive configuration
- The private key is used only for server-to-server communication with Apple
- User authentication is handled by Apple's secure infrastructure

## Support
If you encounter issues:
1. Check Apple Developer Console for configuration errors
2. Verify all environment variables are set correctly
3. Test with TestFlight before App Store submission
4. Check backend logs for detailed error information
