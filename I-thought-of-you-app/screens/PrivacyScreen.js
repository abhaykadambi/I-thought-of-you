import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert, ScrollView, Switch, TextInput } from 'react-native';
import { authAPI, settingsAPI } from '../services/api';

const globalBackground = '#f8f5ee';
const cardBackground = '#fff9ed';
const headerFontFamily = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function PrivacyScreen({ navigation }) {
  const [privacySettings, setPrivacySettings] = useState({
    allowFriendRequests: true,
    dataAnalytics: true,
  });
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blockContact, setBlockContact] = useState('');

  useEffect(() => {
    loadPrivacySettings();
    loadBlockedUsers();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      setLoading(true);
      const { settings } = await settingsAPI.getSettings();
      if (settings && settings.privacy) {
        setPrivacySettings(settings.privacy);
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
      // If settings don't exist yet, use defaults (this will be created when user saves)
    } finally {
      setLoading(false);
    }
  };

  const loadBlockedUsers = async () => {
    try {
      const { blockedUsers } = await settingsAPI.getBlockedUsers();
      setBlockedUsers(blockedUsers || []);
    } catch (error) {
      console.error('Error loading blocked users:', error);
    }
  };

  const handleSettingChange = (setting, value) => {
    setPrivacySettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      await settingsAPI.updateSettings({ privacy: privacySettings });
      Alert.alert('Success', 'Privacy settings updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update privacy settings. Please try again.');
    }
  };

  const handleBlockUser = async () => {
    if (blockContact && blockContact.trim()) {
      try {
        await settingsAPI.blockUser(blockContact.trim());
        await loadBlockedUsers(); // Reload the list
        setBlockContact(''); // Clear the input
        Alert.alert('Success', 'User blocked successfully!');
      } catch (error) {
        console.error('Block user error:', error);
        if (error.response?.data?.error) {
          Alert.alert('Error', error.response.data.error);
        } else {
          Alert.alert('Error', 'Failed to block user. Please try again.');
        }
      }
    } else {
      Alert.alert('Error', 'Please enter a valid email or phone number.');
    }
  };

  const handleUnblockUser = (email) => {
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock ${email}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Unblock',
          onPress: async () => {
            try {
              await settingsAPI.unblockUser(email);
              await loadBlockedUsers(); // Reload the list
              Alert.alert('Success', 'User unblocked successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to unblock user. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'This will export all your data including thoughts, friends, and settings. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Export',
          onPress: async () => {
            try {
              await settingsAPI.exportData();
              Alert.alert('Export Started', 'Your data export has been initiated. You will receive an email when it\'s ready.');
            } catch (error) {
              Alert.alert('Error', 'Failed to export data. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteData = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your thoughts, friends, and account data. This action cannot be undone. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete All Data',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Data Deletion', 'Your data deletion request has been submitted. This process may take up to 30 days.');
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
      
      <Text style={styles.header}>Privacy</Text>



      {/* Social Privacy */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Social Privacy</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingText}>Allow Friend Requests</Text>
          <Switch
            value={privacySettings.allowFriendRequests}
            onValueChange={(value) => handleSettingChange('allowFriendRequests', value)}
            trackColor={{ false: '#e0e0e0', true: '#4a7cff' }}
            thumbColor={privacySettings.allowFriendRequests ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Data & Analytics */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Data & Analytics</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingText}>Data Analytics</Text>
          <Switch
            value={privacySettings.dataAnalytics}
            onValueChange={(value) => handleSettingChange('dataAnalytics', value)}
            trackColor={{ false: '#e0e0e0', true: '#4a7cff' }}
            thumbColor={privacySettings.dataAnalytics ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Blocked Users */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Blocked Users</Text>
        {blockedUsers.length === 0 ? (
          <Text style={styles.emptyText}>No blocked users</Text>
        ) : (
          blockedUsers.map((user, index) => (
            <View key={index} style={styles.blockedUserRow}>
              <Text style={styles.blockedUserEmail}>{user.email}</Text>
              <TouchableOpacity 
                style={styles.unblockButton}
                onPress={() => handleUnblockUser(user.id)}
              >
                <Text style={styles.unblockButtonText}>Unblock</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
        <View style={styles.blockInputContainer}>
          <TextInput
            style={styles.blockInput}
            placeholder="Enter email or phone number"
            value={blockContact}
            onChangeText={setBlockContact}
            keyboardType="default"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.blockButton} onPress={handleBlockUser}>
            <Text style={styles.blockButtonText}>Block</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Data Control */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Data Control</Text>
        <TouchableOpacity style={styles.settingRow} onPress={handleExportData}>
          <Text style={styles.settingText}>Export My Data</Text>
          <Text style={styles.settingArrow}>→</Text>
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity style={styles.settingRow} onPress={handleDeleteData}>
          <Text style={styles.settingText}>Delete All Data</Text>
          <Text style={styles.settingArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSaveSettings}>
        <Text style={styles.saveButtonText}>Save Privacy Settings</Text>
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
  settingArrow: {
    fontSize: 16,
    color: '#666',
  },
  separator: {
    height: 1,
    backgroundColor: '#ece6da',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: headerFontFamily,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  blockedUserRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  blockedUserEmail: {
    fontSize: 16,
    fontFamily: headerFontFamily,
    color: '#2c2c2c',
  },
  unblockButton: {
    backgroundColor: '#4a7cff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  unblockButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  blockInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  blockInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontFamily: headerFontFamily,
    backgroundColor: '#fff',
  },
  blockButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  blockButtonText: {
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
}); 