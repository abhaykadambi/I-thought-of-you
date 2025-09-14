import * as Notifications from 'expo-notifications';
import { Platform, AppState } from 'react-native';
import api from './api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  constructor() {
    this.permissionStatus = 'undetermined';
    this.pushToken = null;
  }

  // Request notification permissions and register push token
  async requestPermissions(forcePrompt = false) {
    try {
      console.log('🔔 Requesting notification permissions...');
      
      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('📱 Existing permission status:', existingStatus);
      
      let finalStatus = existingStatus;
      
      // Ask for permissions if not granted or if forcePrompt is true
      if (existingStatus !== 'granted' || forcePrompt) {
        console.log('📝 Requesting new permissions...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('✅ New permission status:', status);
      }
      
      this.permissionStatus = finalStatus;
      
      if (finalStatus !== 'granted') {
        console.log('❌ Failed to get notification permissions!');
        return false;
      }
      
      console.log('🎯 Permissions granted, getting push token...');
      
      // Get push token for remote notifications
      const token = await this.getPushToken();
      if (token) {
        console.log('🔑 Got push token:', token.substring(0, 30) + '...');
        
        // Store token locally
        this.pushToken = token;
        
        // Register with backend
        console.log('📡 Registering push token with backend...');
        const success = await this.registerPushToken(token);
        
        if (success) {
          console.log('✅ Push token registered successfully!');
          return true;
        } else {
          console.log('❌ Failed to register push token with backend');
          return false;
        }
      } else {
        console.log('❌ Failed to get push token');
        return false;
      }
      
    } catch (error) {
      console.error('💥 Error requesting notification permissions:', error);
      return false;
    }
  }

  // Check current permission status
  async checkPermissionStatus() {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      this.permissionStatus = status;
      console.log('📱 Current permission status:', status);
      return status;
    } catch (error) {
      console.error('💥 Error checking notification permissions:', error);
      return 'unknown';
    }
  }

  // Get current permission status
  getPermissionStatus() {
    return this.permissionStatus;
  }

  // Get permission status as readable string
  getPermissionStatusText() {
    switch (this.permissionStatus) {
      case 'granted':
        return 'Enabled';
      case 'denied':
        return 'Disabled';
      case 'undetermined':
        return 'Not Set';
      default:
        return 'Unknown';
    }
  }

  // Check if notifications are enabled
  async areNotificationsEnabled() {
    const status = await this.checkPermissionStatus();
    return status === 'granted';
  }

  // Send a backend test notification
  async sendBackendTestNotification() {
    try {
      console.log('🧪 Sending backend test notification...');
      const { notificationsAPI } = await import('./api');
      const result = await notificationsAPI.test();
      console.log('✅ Backend test notification result:', result);
      return true;
    } catch (error) {
      console.error('💥 Error sending backend test notification:', error);
      return false;
    }
  }

  // Send a local test notification
  async sendTestNotification() {
    try {
      console.log('🧪 Sending local test notification...');
      
      // Check app state
      const appState = AppState.currentState;
      console.log('📱 App state:', appState);
      
      // First check if we have permissions
      const { status } = await Notifications.getPermissionsAsync();
      console.log('📱 Current permission status for local notification:', status);
      
      if (status !== 'granted') {
        console.log('❌ No permission for local notifications');
        return false;
      }
      
      // Try to send the notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Test Notification",
          body: "This is a test notification from I Thought of You!",
          data: { type: 'test' },
        },
        trigger: null, // Send immediately
      });
      
      console.log('✅ Local test notification scheduled with ID:', notificationId);
      
      // For debugging, let's also try to present a notification immediately
      if (Platform.OS === 'ios') {
        try {
          await Notifications.presentNotificationAsync({
            title: "Immediate Test",
            body: "This is an immediate test notification!",
            data: { type: 'immediate_test' },
          });
          console.log('✅ Immediate notification presented');
        } catch (immediateError) {
          console.log('⚠️ Immediate notification failed:', immediateError);
        }
      }
      
      return true;
    } catch (error) {
      console.error('💥 Error sending local test notification:', error);
      return false;
    }
  }

  // Open app settings if permissions are denied
  async openAppSettings() {
    try {
      await Notifications.openAppSettingsAsync();
      return true;
    } catch (error) {
      console.error('💥 Error opening app settings:', error);
      return false;
    }
  }

  // Get Expo push token
  async getPushToken() {
    try {
      console.log('🔑 Getting Expo push token...');
      
      // Check if we already have a token
      if (this.pushToken) {
        console.log('✅ Using cached push token');
        return this.pushToken;
      }
      
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: '35bc5d75-73b4-4250-b2d1-470d61a7279d', // Your Expo project ID
      });
      
      if (token && token.data) {
        console.log('✅ Push token obtained successfully');
        this.pushToken = token.data;
        return token.data;
      } else {
        console.log('❌ No token data received');
        return null;
      }
    } catch (error) {
      console.error('💥 Error getting push token:', error);
      return null;
    }
  }

  // Register push token with backend
  async registerPushToken(token) {
    try {
      console.log('📡 Registering push token with backend...');
      console.log('🔑 Token to register:', token.substring(0, 30) + '...');
      
      const response = await api.post('/notifications/register-token', {
        pushToken: token
      });
      
      console.log('✅ Push token registered successfully with backend');
      console.log('📋 Backend response:', response.data);
      return true;
    } catch (error) {
      console.error('💥 Error registering push token with backend:', error);
      if (error.response) {
        console.error('📋 Backend error response:', error.response.data);
        console.error('📊 Status code:', error.response.status);
      }
      return false;
    }
  }

  // Unregister push token
  async unregisterPushToken() {
    try {
      console.log('🗑️ Unregistering push token...');
      await api.delete('/notifications/unregister-token');
      console.log('✅ Push token unregistered successfully');
      
      // Clear local token
      this.pushToken = null;
      return true;
    } catch (error) {
      console.error('💥 Error unregistering push token:', error);
      return false;
    }
  }

  // Set up notification listener
  setupNotificationListener(navigation) {
    console.log('🎧 Setting up notification listeners...');
    
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('📨 Notification received:', notification);
      // You can handle the notification here if needed
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification response received:', response);
      // Navigate to the appropriate screen when notification is tapped
      if (response.notification.request.content.data?.type === 'new_thought' && navigation) {
        console.log('🧭 Navigating to Feed screen...');
        // Navigate to the feed screen to show the new thought
        navigation.navigate('Feed');
      }
    });

    console.log('✅ Notification listeners set up successfully');
    
    return () => {
      console.log('🧹 Cleaning up notification listeners...');
      subscription.remove();
      responseSubscription.remove();
    };
  }

  // Get platform-specific settings instructions
  getSettingsInstructions() {
    if (Platform.OS === 'ios') {
      return '1. Open Settings app\n2. Scroll down and tap "I Thought of You"\n3. Tap "Notifications"\n4. Enable "Allow Notifications"';
    } else {
      return '1. Open Settings app\n2. Tap "Apps" or "Application Manager"\n3. Find and tap "I Thought of You"\n4. Tap "Notifications"\n5. Enable notifications';
    }
  }

  // Debug function to check notification setup
  async debugNotificationSetup() {
    try {
      console.log('🔍 === Notification Setup Debug ===');
      
      // Check permissions
      const permissionStatus = await this.checkPermissionStatus();
      console.log('📱 Permission status:', permissionStatus);
      
      // Check if we can get a push token
      const token = await this.getPushToken();
      console.log('🔑 Push token available:', !!token);
      if (token) {
        console.log('🔑 Token preview:', token.substring(0, 30) + '...');
      }
      
      // Check backend status
      let backendStatus = null;
      try {
        const { notificationsAPI } = await import('./api');
        backendStatus = await notificationsAPI.getStatus();
        console.log('📡 Backend status:', backendStatus);
      } catch (backendError) {
        console.error('📡 Backend status check failed:', backendError);
      }
      
      // Try to send a test notification
      const testResult = await this.sendTestNotification();
      console.log('🧪 Test notification result:', testResult);
      
      return {
        permissionStatus,
        hasToken: !!token,
        backendStatus,
        testNotification: testResult
      };
    } catch (error) {
      console.error('💥 Debug error:', error);
      return { error: error.message };
    }
  }

  // Force refresh push token (useful for debugging)
  async refreshPushToken() {
    try {
      console.log('🔄 Refreshing push token...');
      this.pushToken = null; // Clear cached token
      const newToken = await this.getPushToken();
      
      if (newToken) {
        console.log('✅ New token obtained, registering with backend...');
        const success = await this.registerPushToken(newToken);
        return success;
      } else {
        console.log('❌ Failed to get new token');
        return false;
      }
    } catch (error) {
      console.error('💥 Error refreshing push token:', error);
      return false;
    }
  }

  // Check if notifications are fully set up (permissions + token + backend registration)
  async isNotificationSetupComplete() {
    try {
      const permissionStatus = await this.checkPermissionStatus();
      if (permissionStatus !== 'granted') {
        return { complete: false, reason: 'permissions_not_granted', status: permissionStatus };
      }

      const token = await this.getPushToken();
      if (!token) {
        return { complete: false, reason: 'no_push_token', status: permissionStatus };
      }

      // Test backend registration
      const registrationSuccess = await this.registerPushToken(token);
      if (!registrationSuccess) {
        return { complete: false, reason: 'backend_registration_failed', status: permissionStatus };
      }

      return { complete: true, reason: 'all_good', status: permissionStatus };
    } catch (error) {
      console.error('💥 Error checking notification setup:', error);
      return { complete: false, reason: 'error', status: 'unknown' };
    }
  }

  // Prompt user to enable notifications if not already enabled
  async promptForNotificationsIfNeeded() {
    try {
      const setupStatus = await this.isNotificationSetupComplete();
      
      if (!setupStatus.complete) {
        console.log('🔔 Notification setup incomplete, prompting user...');
        
        if (setupStatus.reason === 'permissions_not_granted') {
          // Try to request permissions
          const success = await this.requestPermissions(true);
          if (success) {
            console.log('✅ User granted notification permissions');
            return true;
          } else {
            console.log('❌ User denied notification permissions');
            return false;
          }
        } else if (setupStatus.reason === 'no_push_token' || setupStatus.reason === 'backend_registration_failed') {
          // Try to refresh token and re-register
          const success = await this.refreshPushToken();
          if (success) {
            console.log('✅ Push token refreshed and registered');
            return true;
          } else {
            console.log('❌ Failed to refresh push token');
            return false;
          }
        }
      }
      
      return setupStatus.complete;
    } catch (error) {
      console.error('💥 Error prompting for notifications:', error);
      return false;
    }
  }
}

// Create and export a single instance
const notificationService = new NotificationService();
export default notificationService; 