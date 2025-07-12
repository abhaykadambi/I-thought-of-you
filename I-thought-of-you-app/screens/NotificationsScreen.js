import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert, ScrollView, Switch } from 'react-native';
import { authAPI, settingsAPI } from '../services/api';
import notificationService from '../services/notificationService';

const globalBackground = '#f8f5ee';
const cardBackground = '#fff9ed';
const headerFontFamily = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function NotificationsScreen({ navigation }) {
  const [notificationSettings, setNotificationSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState('unknown');

  useEffect(() => {
    loadNotificationSettings();
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    const status = await notificationService.checkPermissionStatus();
    setPermissionStatus(status);
  };

  const loadNotificationSettings = async () => {
    try {
      setLoading(true);
      // No settings to load since we removed notification types
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };



  const handleSaveSettings = async () => {
    try {
      // Since we removed notification types, there's nothing to save
      Alert.alert('Success', 'Notification permissions are managed by your device settings.');
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification settings. Please try again.');
    }
  };



  const handleRequestPermissions = async () => {
    const granted = await notificationService.requestPermissions();
    if (granted) {
      Alert.alert('Success', 'Push notifications are now enabled!');
      setPermissionStatus('granted');
    } else {
      Alert.alert(
        'Permission Denied',
        'To receive notifications, please enable them in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Settings', 
            onPress: async () => {
              const success = await notificationService.openAppSettings();
              if (!success) {
                Alert.alert(
                  'Settings',
                  notificationService.getSettingsInstructions(),
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert(
                  'Settings Opened',
                  'Please enable notifications for this app in the settings that just opened.',
                  [{ text: 'OK' }]
                );
              }
            }
          }
        ]
      );
      setPermissionStatus('denied');
    }
    // Refresh permission status
    await checkPermissionStatus();
  };

  const handleTestNotification = async () => {
    if (permissionStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Please enable push notifications to test them.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Enable Notifications', onPress: handleRequestPermissions }
        ]
      );
      return;
    }

    Alert.alert(
      'Test Notification',
      'This will send a test notification to your device.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Send Test',
          onPress: async () => {
            try {
              const success = await notificationService.sendTestNotification();
              if (success) {
                Alert.alert('Test Sent', 'A test notification has been sent to your device.');
              } else {
                Alert.alert('Error', 'Failed to send test notification. Please try again.');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to send test notification. Please try again.');
            }
          },
        },
      ]
    );
  };



  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>
      
      <Text style={styles.header}>Notifications</Text>

      {/* Permission Status */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Permission Status</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingText}>Push Notifications</Text>
          <View style={styles.statusContainer}>
            <Text style={[
              styles.statusText,
              { color: permissionStatus === 'granted' ? '#27ae60' : permissionStatus === 'denied' ? '#e74c3c' : '#f39c12' }
            ]}>
              {notificationService.getPermissionStatusText()}
            </Text>
          </View>
        </View>
        {permissionStatus !== 'granted' && (
          <>
            <View style={styles.separator} />
            <TouchableOpacity style={styles.permissionButton} onPress={handleRequestPermissions}>
              <Text style={styles.permissionButtonText}>
                {permissionStatus === 'denied' ? 'Enable Notifications' : 'Request Permissions'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* General Notifications */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>General</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingText}>Push Notifications</Text>
          <Switch
            value={permissionStatus === 'granted'}
            onValueChange={handleRequestPermissions}
            trackColor={{ false: '#e0e0e0', true: '#4a7cff' }}
            thumbColor={permissionStatus === 'granted' ? '#fff' : '#f4f3f4'}
          />
        </View>
        {permissionStatus === 'denied' && (
          <Text style={styles.settingDescription}>
            Tap the switch to request notification permissions.
          </Text>
        )}
        {permissionStatus === 'undetermined' && (
          <Text style={styles.settingDescription}>
            Enable push notifications to receive updates from friends and the app.
          </Text>
        )}
      </View>





      {/* Test Notifications */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Test Notifications</Text>
        <TouchableOpacity style={styles.testButton} onPress={handleTestNotification}>
          <Text style={styles.testButtonText}>Send Test Notification</Text>
        </TouchableOpacity>
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSaveSettings}>
        <Text style={styles.saveButtonText}>Save Notification Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: globalBackground,
    paddingTop: 40,
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
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
    color: '#2c2c2c',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  settingText: {
    fontSize: 16,
    fontFamily: headerFontFamily,
    color: '#2c2c2c',
  },
  settingValue: {
    fontSize: 16,
    fontFamily: headerFontFamily,
    color: '#666',
  },
  settingDescription: {
    fontSize: 14,
    fontFamily: headerFontFamily,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 20,
  },
  separator: {
    height: 1,
    backgroundColor: '#ece6da',
  },
  testButton: {
    backgroundColor: '#4a7cff',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
  },
  saveButton: {
    backgroundColor: '#4a7cff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
    letterSpacing: 0.5,
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    fontFamily: headerFontFamily,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
  },
  permissionButton: {
    backgroundColor: '#4a7cff',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
  },
}); 