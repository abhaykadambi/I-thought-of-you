import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
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
    this.permissionStatus = null;
  }

  // Request push notification permissions
  async requestPermissions() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      // Only ask if permissions have not been determined
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      this.permissionStatus = finalStatus;
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get notification permissions!');
        return false;
      }
      
      // Get push token for remote notifications
      const token = await this.getPushToken();
      if (token) {
        await this.registerPushToken(token);
      }
      
      console.log('Notification permissions granted successfully!');
      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  // Check current permission status
  async checkPermissionStatus() {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      this.permissionStatus = status;
      return status;
    } catch (error) {
      console.error('Error checking notification permissions:', error);
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
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Test Notification",
          body: "This is a test notification from I Thought of You!",
          data: { type: 'test' },
        },
        trigger: null, // Send immediately
      });
      return true;
    } catch (error) {
      console.error('Error sending test notification:', error);
      return false;
    }
  }

  // Open app settings if permissions are denied
  async openAppSettings() {
    try {
      if (Platform.OS === 'ios') {
        // For iOS, try to open the specific app's settings
        // This will work in both development and production
        const canOpen = await Linking.canOpenURL('app-settings:');
        if (canOpen) {
          await Linking.openURL('app-settings:');
          return true;
        }
      } else {
        // For Android, we need to know the actual package name
        // In development, this might not work perfectly, but in production it will
        const packageName = 'com.ithoughtofyou.app'; // This matches the package name in app.json
        const canOpen = await Linking.canOpenURL(`package:${packageName}`);
        if (canOpen) {
          await Linking.openURL(`package:${packageName}`);
          return true;
        } else {
          // Fallback to general settings
          const canOpenSettings = await Linking.canOpenURL('android-app://com.android.settings/.Settings');
          if (canOpenSettings) {
            await Linking.openURL('android-app://com.android.settings/.Settings');
            return true;
          }
        }
      }
      return false;
    } catch (error) {
      console.error('Error opening app settings:', error);
      return false;
    }
  }

  // Get Expo push token
  async getPushToken() {
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: '35bc5d75-73b4-4250-b2d1-470d61a7279d',
      });
      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  // Register push token with backend
  async registerPushToken(token) {
    try {
      const response = await api.post('/notifications/register-token', {
        pushToken: token
      });
      console.log('Push token registered successfully');
      return true;
    } catch (error) {
      console.error('Error registering push token:', error);
      return false;
    }
  }

  // Unregister push token
  async unregisterPushToken() {
    try {
      await api.delete('/notifications/unregister-token');
      console.log('Push token unregistered successfully');
      return true;
    } catch (error) {
      console.error('Error unregistering push token:', error);
      return false;
    }
  }

  // Set up notification listener
  setupNotificationListener(navigation) {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      // You can handle the notification here if needed
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      // Navigate to the appropriate screen when notification is tapped
      if (response.notification.request.content.data?.type === 'new_thought' && navigation) {
        // Navigate to the feed screen to show the new thought
        navigation.navigate('Feed');
      }
    });

    return () => {
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
}

export default new NotificationService(); 