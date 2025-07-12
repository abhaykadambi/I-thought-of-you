import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert, TextInput, ScrollView, Image } from 'react-native';
import { authAPI, settingsAPI } from '../services/api';
import * as ImagePicker from 'expo-image-picker';

const globalBackground = '#f8f5ee';
const cardBackground = '#fff9ed';
const headerFontFamily = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const defaultAvatar = 'https://randomuser.me/api/portraits/lego/1.jpg';

export default function AccountScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedAvatar, setEditedAvatar] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { user: profile } = await authAPI.getProfile();
      setUser(profile);
      setEditedName(profile.name || '');
      setEditedAvatar(profile.avatar || '');
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pickAvatarImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets[0]) {
      try {
        const file = result.assets[0];
        const response = await fetch(file.uri);
        const blob = await response.blob();
        const reader = new FileReader();
        const base64Promise = new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
        });
        reader.readAsDataURL(blob);
        const base64Data = await base64Promise;
        setEditedAvatar(base64Data);
      } catch (error) {
        console.error('Avatar upload error:', error);
        Alert.alert('Error', 'Failed to upload avatar: ' + error.message);
      }
    }
  };

  const handleSaveProfile = async () => {
    try {
      await authAPI.updateProfile({ name: editedName, avatar: editedAvatar });
      setUser((prev) => ({ ...prev, name: editedName, avatar: editedAvatar }));
      setEditMode(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Profile save error:', error);
      Alert.alert('Error', 'Failed to update profile: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    try {
      await settingsAPI.changePassword(currentPassword, newPassword);
      Alert.alert('Success', 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to change password. Please try again.');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await settingsAPI.deleteAccount();
              Alert.alert('Account Deleted', 'Your account has been deleted.');
              navigation.reset({
                index: 0,
                routes: [{ name: 'Welcome' }],
              });
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
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
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Logout error:', error);
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
      
      <Text style={styles.header}>Account</Text>

      {/* Profile Section */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <View style={styles.profileSection}>
          <Image 
            source={{ uri: editMode ? editedAvatar || defaultAvatar : user?.avatar || defaultAvatar }} 
            style={styles.avatar}
          />
          {editMode && (
            <TouchableOpacity style={styles.changeAvatarButton} onPress={pickAvatarImage}>
              <Text style={styles.changeAvatarText}>Change Photo</Text>
            </TouchableOpacity>
          )}
          {editMode ? (
            <TextInput
              style={styles.nameInput}
              value={editedName}
              onChangeText={setEditedName}
              placeholder="Your Name"
              placeholderTextColor="#b0a99f"
            />
          ) : (
            <Text style={styles.name}>{user?.name || 'No Name'}</Text>
          )}
          <Text style={styles.email}>{user?.email}</Text>
        </View>
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={() => editMode ? handleSaveProfile() : setEditMode(true)}
        >
          <Text style={styles.editButtonText}>{editMode ? 'Save Changes' : 'Edit Profile'}</Text>
        </TouchableOpacity>
        {editMode && (
          <TouchableOpacity style={styles.cancelButton} onPress={() => setEditMode(false)}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Security Section */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Security</Text>
        <TouchableOpacity 
          style={styles.settingRow} 
          onPress={() => setShowPasswordForm(!showPasswordForm)}
        >
          <Text style={styles.settingText}>Change Password</Text>
          <Text style={styles.settingArrow}>{showPasswordForm ? '↑' : '↓'}</Text>
        </TouchableOpacity>
        
        {showPasswordForm && (
          <View style={styles.passwordForm}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              placeholderTextColor="#b0a99f"
            />
            <TextInput
              style={styles.passwordInput}
              placeholder="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholderTextColor="#b0a99f"
            />
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholderTextColor="#b0a99f"
            />
            <TouchableOpacity style={styles.savePasswordButton} onPress={handleChangePassword}>
              <Text style={styles.savePasswordButtonText}>Update Password</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Account Actions */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Account Actions</Text>
        <TouchableOpacity style={styles.settingRow} onPress={async () => {
          try {
            const result = await settingsAPI.exportData();
            Alert.alert('Export Started', 'Your data export has been initiated. You will receive an email when it\'s ready.');
          } catch (error) {
            Alert.alert('Error', 'Failed to export data. Please try again.');
          }
        }}>
          <Text style={styles.settingText}>Export Data</Text>
          <Text style={styles.settingArrow}>→</Text>
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity style={styles.settingRow}>
          <Text style={styles.settingText}>Privacy Policy</Text>
          <Text style={styles.settingArrow}>→</Text>
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity style={styles.settingRow}>
          <Text style={styles.settingText}>Terms of Service</Text>
          <Text style={styles.settingArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Danger Zone */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </TouchableOpacity>
      </View>
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
  profileSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  changeAvatarButton: {
    backgroundColor: '#4a7cff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  changeAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
    color: '#2c2c2c',
    marginBottom: 4,
  },
  nameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
    color: '#2c2c2c',
    marginBottom: 4,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#4a7cff',
    paddingVertical: 4,
  },
  email: {
    fontSize: 16,
    color: '#666',
    fontFamily: headerFontFamily,
  },
  editButton: {
    backgroundColor: '#4a7cff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
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
  settingArrow: {
    fontSize: 16,
    color: '#666',
  },
  passwordForm: {
    marginTop: 16,
  },
  passwordInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
    fontFamily: headerFontFamily,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  savePasswordButton: {
    backgroundColor: '#4a7cff',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  savePasswordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
  },
  separator: {
    height: 1,
    backgroundColor: '#ece6da',
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
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
  deleteButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  deleteButtonText: {
    color: '#e74c3c',
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