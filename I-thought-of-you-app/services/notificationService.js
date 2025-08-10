import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
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
  async requestPermissions() {
    try {
      console.log('🔔 Requesting notification permissions...');
      
      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('📱 Existing permission status:', existingStatus);
      
      let finalStatus = existingStatus;
      
      // Only ask if permissions have not been determined
      if (existingStatus !== 'granted') {
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

  // Send a local test notification
  async sendTestNotification() {
    try {
      console.log('🧪 Sending test notification...');
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Test Notification",
          body: "This is a test notification from I Thought of You!",
          data: { type: 'test' },
        },
        trigger: null, // Send immediately
      });
      console.log('✅ Test notification sent successfully');
      return true;
    } catch (error) {
      console.error('💥 Error sending test notification:', error);
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
      
      // Check if token is registered with backend
      if (token) {
        console.log('📡 Testing backend registration...');
        const isRegistered = await this.registerPushToken(token);
        console.log('✅ Backend registration test result:', isRegistered);
      }
      
      // Try to send a test notification
      const testResult = await this.sendTestNotification();
      console.log('🧪 Test notification result:', testResult);
      
      return {
        permissionStatus,
        hasToken: !!token,
        backendRegistered: !!token && await this.registerPushToken(token),
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
}

// Create and export a single instance
const notificationService = new NotificationService();
export default notificationService; 