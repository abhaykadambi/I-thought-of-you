import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { authAPI, moderationAPI, notificationsAPI } from '../services/api';
import notificationService from '../services/notificationService';

const globalBackground = '#f8f5ee';
const cardBackground = '#fff9ed';
const headerFontFamily = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function SettingsScreen({ navigation }) {
  const [notificationStatus, setNotificationStatus] = useState('unknown');
  const [notificationSetupComplete, setNotificationSetupComplete] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkNotificationStatus();
    checkAdminStatus();
  }, []);

  // Refresh notification status when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      checkNotificationStatus();
      checkAdminStatus();
    });

    return unsubscribe;
  }, [navigation]);

  const checkNotificationStatus = async () => {
    const status = await notificationService.checkPermissionStatus();
    const setupStatus = await notificationService.isNotificationSetupComplete();
    setNotificationStatus(status);
    setNotificationSetupComplete(setupStatus.complete);
  };

  const checkAdminStatus = async () => {
    try {
      // Try to access admin dashboard - if successful, user is admin
      await moderationAPI.getDashboard();
      setIsAdmin(true);
    } catch (error) {
      setIsAdmin(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await authAPI.logout();
              // Reset navigation stack and navigate to Login screen
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Logout error:', error);
              // Still navigate to login even if logout fails
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>
      <Text style={styles.header}>Settings</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.settingRow} onPress={() => navigation.navigate('Account')}>
          <Text style={styles.settingText}>Account</Text>
          <Text style={styles.settingArrow}>→</Text>
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity style={styles.settingRow} onPress={() => navigation.navigate('Notifications')}>
          <View style={styles.settingContent}>
            <Text style={styles.settingText}>Notifications</Text>
            <View style={styles.statusIndicator}>
              <View style={[
                styles.statusDot,
                { backgroundColor: notificationSetupComplete ? '#27ae60' : notificationStatus === 'denied' ? '#e74c3c' : '#f39c12' }
              ]} />
              <Text style={[
                styles.statusText,
                { color: notificationSetupComplete ? '#27ae60' : notificationStatus === 'denied' ? '#e74c3c' : '#f39c12' }
              ]}>
                {notificationSetupComplete ? 'Fully Enabled' : notificationService.getPermissionStatusText()}
              </Text>
            </View>
          </View>
          <Text style={styles.settingArrow}>→</Text>
        </TouchableOpacity>
        
        {/* Add notification setup button */}
        <View style={styles.separator} />
        <TouchableOpacity 
          style={styles.settingRow} 
          onPress={async () => {
            try {
              Alert.alert(
                'Setup Notifications',
                'This will request notification permissions and register your device for push notifications.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Setup', 
                    onPress: async () => {
                      try {
                        const success = await notificationService.requestPermissions();
                        if (success) {
                          Alert.alert('Success', 'Notifications have been set up successfully!');
                          checkNotificationStatus(); // Refresh status
                        } else {
                          Alert.alert('Setup Failed', 'Failed to setup notifications. Please check your device settings.');
                        }
                      } catch (error) {
                        Alert.alert('Error', 'An error occurred while setting up notifications.');
                      }
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('Error showing notification setup alert:', error);
            }
          }}
        >
          <View style={styles.settingContent}>
            <Text style={styles.settingText}>Setup Notifications</Text>
            <Text style={styles.settingSubtext}>Request permissions and register device</Text>
          </View>
          <Text style={styles.settingArrow}>→</Text>
        </TouchableOpacity>
        
        {/* Add refresh notifications button */}
        <View style={styles.separator} />
        <TouchableOpacity 
          style={styles.settingRow} 
          onPress={async () => {
            try {
              Alert.alert(
                'Refresh Notifications',
                'This will refresh your push token and re-register with the backend.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Refresh', 
                    onPress: async () => {
                      try {
                        const success = await notificationService.refreshPushToken();
                        if (success) {
                          Alert.alert('Success', 'Notifications have been refreshed successfully!');
                          checkNotificationStatus(); // Refresh status
                        } else {
                          Alert.alert('Refresh Failed', 'Failed to refresh notifications. Please try again.');
                        }
                      } catch (error) {
                        Alert.alert('Error', 'An error occurred while refreshing notifications.');
                      }
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('Error showing refresh alert:', error);
            }
          }}
        >
          <View style={styles.settingContent}>
            <Text style={styles.settingText}>Refresh Notifications</Text>
            <Text style={styles.settingSubtext}>Refresh push token and backend registration</Text>
          </View>
          <Text style={styles.settingArrow}>→</Text>
        </TouchableOpacity>

        {/* Add debug notifications button */}
        <View style={styles.separator} />
        <TouchableOpacity 
          style={styles.settingRow} 
          onPress={async () => {
            try {
              Alert.alert(
                'Debug Notifications',
                'This will test your notification setup and show detailed information.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Debug', 
                    onPress: async () => {
                      try {
                        const debugInfo = await notificationService.debugNotificationSetup();
                        const backendInfo = debugInfo.backendStatus ? 
                          `Backend Token Valid: ${debugInfo.backendStatus.user.hasValidToken ? 'Yes' : 'No'}\n` +
                          `Backend Has Token: ${debugInfo.backendStatus.user.hasPushToken ? 'Yes' : 'No'}\n` : 
                          'Backend Status: Unavailable\n';
                        
                        Alert.alert(
                          'Debug Results', 
                          `Permission Status: ${debugInfo.permissionStatus}\n` +
                          `Has Push Token: ${debugInfo.hasToken ? 'Yes' : 'No'}\n` +
                          backendInfo +
                          `Test Notification: ${debugInfo.testNotification ? 'Sent' : 'Failed'}`
                        );
                      } catch (error) {
                        Alert.alert('Debug Error', 'An error occurred while debugging notifications.');
                      }
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('Error showing debug alert:', error);
            }
          }}
        >
          <View style={styles.settingContent}>
            <Text style={styles.settingText}>Debug Notifications</Text>
            <Text style={styles.settingSubtext}>Test and troubleshoot notification setup</Text>
          </View>
          <Text style={styles.settingArrow}>→</Text>
        </TouchableOpacity>

        <View style={styles.separator} />
        <TouchableOpacity style={styles.settingRow} onPress={() => navigation.navigate('Privacy')}>
          <Text style={styles.settingText}>Privacy</Text>
          <Text style={styles.settingArrow}>→</Text>
        </TouchableOpacity>

        {isAdmin && (
          <>
            <View style={styles.separator} />
            <TouchableOpacity 
              style={styles.settingRow} 
              onPress={() => navigation.navigate('AdminModeration')}
            >
              <View style={styles.settingContent}>
                <Text style={[styles.settingText, styles.adminText]}>Admin Dashboard</Text>
                <Text style={styles.adminSubtext}>Moderate content and manage reports</Text>
              </View>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: globalBackground,
    paddingTop: 40,
    paddingHorizontal: 0,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 24,
    color: '#2c2c2c',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: cardBackground,
    borderRadius: 16,
    marginHorizontal: 24,
    paddingVertical: 8,
    paddingHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 32,
  },
  settingRow: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontFamily: headerFontFamily,
    fontWeight: '500',
  },
  settingText: {
    fontSize: 18,
    fontFamily: headerFontFamily,
    color: '#2c2c2c',
  },
  adminText: {
    color: '#3498db',
    fontWeight: '600',
  },
  adminSubtext: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
    fontFamily: headerFontFamily,
  },
  settingArrow: {
    fontSize: 18,
    color: '#666',
  },
  separator: {
    height: 1,
    backgroundColor: '#ece6da',
    marginHorizontal: 24,
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  logoutButtonText: {
    color: '#e74c3c',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
    letterSpacing: 0.5,
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 24,
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  backIcon: {
    fontSize: 24,
    color: '#4a7cff',
    fontWeight: 'bold',
  },
  settingSubtext: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
    fontFamily: headerFontFamily,
  },
}); 