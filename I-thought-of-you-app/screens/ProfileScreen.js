import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform, FlatList, TextInput, Alert, ActivityIndicator } from 'react-native';
import { thoughtsAPI } from '../services/api';
import { authAPI } from '../services/api';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../supabaseClient'; // We'll create this helper for upload
import { useFocusEffect } from '@react-navigation/native';

const globalBackground = '#f8f5ee';
const cardBackground = '#fff9ed';
const headerFontFamily = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const defaultAvatar = 'https://randomuser.me/api/portraits/lego/1.jpg';

export default function ProfileScreen({ navigation }) {
  const [editMode, setEditMode] = useState(false);
  const [user, setUser] = useState(null);
  const [pinnedThoughts, setPinnedThoughts] = useState([]);
  const [editedName, setEditedName] = useState('');
  const [editedAvatar, setEditedAvatar] = useState('');
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadProfile();
    loadPinnedThoughts();
  }, []);

  // Refresh pinned thoughts when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadPinnedThoughts();
    }, [])
  );

  const loadProfile = async () => {
    try {
      setProfileLoading(true);
      const { user: profile } = await authAPI.getProfile();
      setUser(profile);
      setEditedName(profile.name || '');
      setEditedAvatar(profile.avatar || '');
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  };

  const loadPinnedThoughts = async () => {
    try {
      setLoading(true);
      const data = await thoughtsAPI.getPinned();
      setPinnedThoughts(data.pinnedThoughts || []);
    } catch (error) {
      console.error('Error loading pinned thoughts:', error);
      Alert.alert('Error', 'Failed to load pinned thoughts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePin = async (thoughtId) => {
    try {
      await thoughtsAPI.unpin(thoughtId);
      await loadPinnedThoughts(); // Reload the list
    } catch (error) {
      console.error('Error removing pin:', error);
      Alert.alert('Error', 'Failed to remove pin. Please try again.');
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
      setUploading(true);
      try {
        console.log('Starting avatar upload...');
        const file = result.assets[0];
        console.log('File selected:', file.uri);
        
        // Convert image to base64
        const response = await fetch(file.uri);
        const blob = await response.blob();
        console.log('Blob created, size:', blob.size);
        
        // Convert blob to base64
        const reader = new FileReader();
        const base64Promise = new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
        });
        reader.readAsDataURL(blob);
        const base64Data = await base64Promise;
        
        console.log('Base64 data length:', base64Data.length);
        console.log('Setting avatar as base64 data...');
        setEditedAvatar(base64Data);
      } catch (error) {
        console.error('Avatar upload error:', error);
        Alert.alert('Error', 'Failed to upload avatar: ' + error.message);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSave = async () => {
    try {
      console.log('Saving profile with data:', { name: editedName, avatarLength: editedAvatar ? editedAvatar.length : 0 });
      await authAPI.updateProfile({ name: editedName, avatar: editedAvatar });
      console.log('Profile update successful');
      setUser((prev) => ({ ...prev, name: editedName, avatar: editedAvatar }));
      setEditMode(false);
      await loadProfile();
    } catch (error) {
      console.error('Profile save error:', error);
      console.error('Error response:', error.response?.data);
      Alert.alert('Error', 'Failed to update profile: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleCancel = () => {
    setEditedName(user?.name || '');
    setEditedAvatar(user?.avatar || '');
    setEditMode(false);
  };

  const renderPinnedThought = ({ item, index }) => (
    <TouchableOpacity
      style={styles.thoughtCard}
      disabled={editMode}
      onPress={() => {
        if (!editMode) {
          navigation.navigate('ThoughtDetailOverlay', { thought: item });
        }
      }}
    >
      <View style={styles.thoughtHeader}>
        <Text style={styles.thoughtText}>
          <Text style={styles.thoughtAuthor}>{item.author}: </Text>
          {item.text}
        </Text>
        {editMode && (
          <TouchableOpacity onPress={() => handleRemovePin(item.id)}>
            <Text style={styles.removePin}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.thoughtTime}>{item.time}</Text>
    </TouchableOpacity>
  );

  if (profileLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}> 
        <ActivityIndicator size="large" color="#4a7cff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Settings button */}
      <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('Settings')}>
        <Text style={styles.settingsIcon}>⚙️</Text>
      </TouchableOpacity>
      {/* Edit button */}
      {!editMode && (
        <TouchableOpacity style={styles.editButton} onPress={() => setEditMode(true)}>
          <Text style={styles.editIcon}>✏️</Text>
        </TouchableOpacity>
      )}
      <View style={styles.profileSection}>
        {editMode ? (
          <>
            <Image 
              source={{ uri: editedAvatar || defaultAvatar }} 
              style={styles.avatar}
              onError={(error) => console.log('Edit mode image load error:', error)}
              onLoad={() => console.log('Edit mode image loaded')}
            />
            <TouchableOpacity style={styles.avatarPickerButton} onPress={pickAvatarImage} disabled={uploading}>
              <Text style={styles.avatarPickerText}>{uploading ? 'Uploading...' : 'Pick Profile Picture'}</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.nameInput}
              value={editedName}
              onChangeText={setEditedName}
              placeholder="Your Name"
              placeholderTextColor="#b0a99f"
            />
          </>
        ) : (
          <>
            <Image 
              source={{ uri: user?.avatar || defaultAvatar }} 
              style={styles.avatar}
              onError={(error) => console.log('Image load error:', error)}
              onLoad={() => console.log('Image loaded successfully')}
            />
            <Text style={styles.name}>{user?.name || 'No Name'}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </>
        )}
      </View>
      <Text style={styles.sectionTitle}>Pinned Thoughts</Text>
      <View style={styles.card}>
        {loading ? (
          <ActivityIndicator size="small" color="#4a7cff" />
        ) : pinnedThoughts.length === 0 ? (
          <View style={styles.emptyPinnedContainer}>
            <Text style={styles.emptyPinnedText}>No pinned thoughts. Pin something and come back!</Text>
          </View>
        ) : (
          <FlatList
            data={pinnedThoughts}
            keyExtractor={(item) => item.id}
            renderItem={renderPinnedThought}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            scrollEnabled={false}
          />
        )}
      </View>
      {editMode && (
        <View style={styles.editActions}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={uploading}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} disabled={uploading}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
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
  settingsButton: {
    position: 'absolute',
    top: 40,
    right: 24,
    zIndex: 10,
  },
  settingsIcon: {
    fontSize: 28,
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 48,
    marginBottom: 24,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#ece6da',
    marginBottom: 16,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
    color: '#2c2c2c',
    letterSpacing: 0.5,
  },
  email: {
    fontSize: 16,
    color: '#7f8c8d',
    fontFamily: headerFontFamily,
    marginTop: 4,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
    color: '#2c2c2c',
    marginLeft: 32,
    marginBottom: 8,
  },
  card: {
    backgroundColor: cardBackground,
    borderRadius: 16,
    marginHorizontal: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 32,
  },
  thoughtCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  thoughtHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  thoughtText: {
    fontSize: 16,
    color: '#2c2c2c',
    fontFamily: headerFontFamily,
    marginBottom: 6,
    flex: 1,
  },
  thoughtAuthor: {
    fontWeight: 'bold',
    color: '#2c2c2c',
    fontFamily: headerFontFamily,
  },
  thoughtTime: {
    fontSize: 13,
    color: '#b0a99f',
    fontFamily: headerFontFamily,
  },
  removePin: {
    color: '#e74c3c',
    fontSize: 18,
    marginLeft: 10,
    fontWeight: 'bold',
  },
  separator: {
    height: 8,
  },
  editButton: {
    position: 'absolute',
    top: 100, // Adjust based on profileSection height
    right: 24,
    zIndex: 10,
  },
  editIcon: {
    fontSize: 28,
  },
  nameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
    color: '#2c2c2c',
    letterSpacing: 0.5,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ece6da',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 4,
    textAlign: 'center',
    width: 180,
  },
  avatarInput: {
    fontSize: 16,
    fontFamily: headerFontFamily,
    color: '#2c2c2c',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ece6da',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 8,
    textAlign: 'center',
    width: 220,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  saveButton: {
    backgroundColor: '#4a7cff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginHorizontal: 8,
    shadowColor: '#4a7cff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
    letterSpacing: 0.5,
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cancelButtonText: {
    color: '#4a7cff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
    letterSpacing: 0.5,
  },
  emptyPinnedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyPinnedText: {
    color: '#b0a99f',
    fontSize: 16,
    fontFamily: headerFontFamily,
    textAlign: 'center',
  },
  avatarPickerButton: {
    backgroundColor: '#4a7cff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarPickerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
  },
}); 