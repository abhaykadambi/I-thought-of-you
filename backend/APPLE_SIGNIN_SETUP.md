# Apple Sign-In Setup Guide

## Overview
This guide explains how to properly configure Apple Sign-In for production deployment.

## Prerequisites
1. Apple Developer Account with paid membership
2. App ID configured in Apple Developer Console
3. App Store Connect app created
4. Production provisioning profiles

## Step 1: Configure App ID in Apple Developer Console

1. Go to [Apple Developer Console](https://developer.apple.com/account/)
2. Navigate to "Certificates, Identifiers & Profiles"
3. Select "Identifiers" → "App IDs"
4. Find your app ID: `com.ithoughtofyou.app`
5. Click on it and ensure "Sign In with Apple" capability is enabled
6. Save the configuration

## Step 2: Create Apple Sign-In Key

1. In Apple Developer Console, go to "Keys"
2. Click "+" to create a new key
3. Name it something like "ITY Apple Sign-In Key"
4. Enable "Sign In with Apple"
5. Click "Configure" and select your App ID
6. Click "Save" and download the `.p8` file
7. **IMPORTANT**: Save the Key ID and Team ID from this page

## Step 3: Get Your Team ID

1. In Apple Developer Console, click on your account name (top right)
2. Note your Team ID (10-character string)

## Step 4: Configure Environment Variables

Add these to your backend environment:

```bash
# Apple Sign-In Configuration
APPLE_BUNDLE_ID=com.ithoughtofyou.app
APPLE_TEAM_ID=YOUR_TEAM_ID_HERE
APPLE_KEY_ID=YOUR_KEY_ID_HERE
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
YOUR_PRIVATE_KEY_CONTENT_HERE
-----END PRIVATE KEY-----
```

**Note**: For the private key, you need to:
1. Open the downloaded `.p8` file
2. Copy the entire content including the BEGIN/END lines
3. Replace newlines with `\n` or keep as-is depending on your environment setup

## Step 5: Verify App Store Connect Configuration

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Select your app
3. Go to "App Information" → "General Information"
4. Ensure "Sign In with Apple" is listed under "App Store Information"

## Step 6: Test the Implementation

1. Deploy your updated backend
2. Test Apple Sign-In with a TestFlight build
3. Verify tokens are properly verified
4. Check backend logs for any verification errors

## Troubleshooting

### Common Issues

1. **"Invalid identity token" error**
   - Check that all environment variables are set correctly
   - Verify the bundle ID matches exactly
   - Ensure the private key is properly formatted

2. **"Token verification failed" error**
   - Check that the Apple Sign-In capability is enabled in your App ID
   - Verify the key is associated with the correct App ID
   - Ensure the key hasn't expired

3. **"Audience mismatch" error**
   - Verify `APPLE_BUNDLE_ID` matches your app's bundle identifier exactly
   - Check for extra spaces or typos

### Debug Steps

1. Check backend logs for detailed error messages
2. Verify environment variables are loaded correctly
3. Test token verification with a known valid token
4. Check Apple's public keys are accessible from your server

## Security Notes

- Never commit private keys to version control
- Use environment variables for all sensitive configuration
- Regularly rotate your Apple Sign-In keys
- Monitor for any suspicious authentication attempts

## Production Checklist

- [ ] App ID has "Sign In with Apple" capability enabled
- [ ] Apple Sign-In key created and configured
- [ ] Environment variables set correctly
- [ ] Backend deployed with updated code
- [ ] TestFlight testing completed
- [ ] App Store submission ready
