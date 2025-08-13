import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, Alert, TouchableWithoutFeedback, Keyboard, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DropDownPicker from 'react-native-dropdown-picker';
import { thoughtsAPI, friendsAPI, apiCallWithAuth } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notificationService from '../services/notificationService';

const globalBackground = '#f8f5ee';
const cardBackground = '#fff9ed';
const headerFontFamily = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function ComposeThoughtScreen({ route, navigation }) {
  const [friend, setFriend] = useState('');
  const [note, setNote] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  
  // Dropdown states
  const [friends, setFriends] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [loading, setLoading] = useState(false);

  // Check if a recipient was passed from navigation
  const recipient = route.params?.recipient;

  // Fetch friends on component mount
  useEffect(() => {
    fetchFriends();
  }, []);

  // Pre-select recipient if passed from navigation
  useEffect(() => {
    if (recipient && friends.length > 0) {
      const recipientFriend = friends.find(f => f.value === recipient.id);
      if (recipientFriend) {
        setSelectedFriend(recipient.id);
      }
    }
  }, [recipient, friends]);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const response = await apiCallWithAuth(
        () => friendsAPI.getAll(),
        navigation
      );
      const friendsList = response.users.map(friend => {
        return {
          label: friend.name,
          value: friend.id,
          avatar: friend.avatar,
          email: friend.email,
        };
      });
      setFriends(friendsList);
    } catch (error) {
      console.error('Error fetching friends:', error);
      // Don't show alert for auth errors as user will be redirected
      if (error.response?.status !== 401) {
        Alert.alert('Error', 'Failed to load friends');
      }
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    Alert.alert(
      'Add Photo',
      'Choose how you want to add a photo',
      [
        {
          text: 'Take Photo',
          onPress: () => takePhoto(),
        },
        {
          text: 'Choose from Gallery',
          onPress: () => selectFromGallery(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const takePhoto = async () => {
    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera permissions to take a photo!');
      return;
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.3, // Very low quality to keep files under 5MB
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const selectFromGallery = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    // Launch image picker with aggressive compression for smaller file sizes
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.3, // Very low quality to keep files under 5MB
      allowsMultipleSelection: false,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
  };

  const handleSend = async () => {
    if (!selectedFriend || !note) {
      Alert.alert('Error', 'Please select a friend and write a note');
      return;
    }

    try {
      const selectedFriendData = friends.find(f => f.value === selectedFriend);
      let imageUrl = null;

      // Upload image if selected
      if (selectedImage) {
        try {
          // Create form data for image upload
          const formData = new FormData();
          formData.append('image', {
            uri: selectedImage,
            type: 'image/jpeg', // You might want to detect the actual type
            name: 'thought-image.jpg'
          });

          // Upload image first
          const uploadResponse = await fetch('https://i-thought-of-you-production.up.railway.app/api/thoughts/upload-image', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${await AsyncStorage.getItem('authToken')}`,
              'Content-Type': 'multipart/form-data',
            },
            body: formData
          });

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload image');
          }

          const uploadResult = await uploadResponse.json();
          imageUrl = uploadResult.imageUrl;
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          Alert.alert('Error', 'Failed to upload image. Please try again.');
          return;
        }
      }

      // Send thought with uploaded image URL
      await thoughtsAPI.create({
        recipientEmail: selectedFriendData.email,
        text: note,
        imageUrl: imageUrl
      });
      
      // Clear the fields
      setSelectedFriend(null);
      setNote('');
      setSelectedImage(null);
      
      Alert.alert('Success', 'Thought sent successfully!');
      // Navigate back to feed to show the new thought
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to send thought. Please try again.');
    }
  };

  const getSelectedFriendData = () => {
    return friends.find(f => f.value === selectedFriend);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.header}>Send a Thought</Text>
          <View style={styles.card}>
        <Text style={styles.label}>To</Text>
        
        {/* Friend Selection - Show dropdown or selected friend */}
        {!selectedFriend ? (
          <DropDownPicker
            open={open}
            value={selectedFriend}
            items={friends}
            setOpen={setOpen}
            setValue={(callback) => {
              setSelectedFriend(callback);
            }}
            setItems={setFriends}
            placeholder="Select a friend"
            placeholderStyle={styles.dropdownPlaceholder}
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            listMode="SCROLLVIEW"
            scrollViewProps={{
              nestedScrollEnabled: true,
            }}
            loading={loading}
            activityIndicatorColor="#4a7cff"
            activityIndicatorSize="small"
          />
        ) : (
          <View style={styles.selectedFriendDisplay}>
            <View style={styles.selectedFriendContent}>
              {getSelectedFriendData()?.avatar ? (
                <Image source={{ uri: getSelectedFriendData().avatar }} style={styles.selectedFriendAvatar} />
              ) : (
                <View style={styles.selectedFriendAvatarPlaceholder}>
                  <Text style={styles.selectedFriendAvatarText}>
                    {getSelectedFriendData()?.label.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={styles.selectedFriendName}>{getSelectedFriendData()?.label}</Text>
            </View>
            <TouchableOpacity 
              style={styles.clearButton} 
              onPress={() => setSelectedFriend(null)}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.label}>Your Note</Text>
        <TextInput
          style={styles.textarea}
          placeholder="Write your thought..."
          placeholderTextColor="#b0a99f"
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          returnKeyType="done"
          blurOnSubmit={true}
          onSubmitEditing={Keyboard.dismiss}
        />
        
        {/* Image Attachment Section */}
        <View style={styles.imageSection}>
          <Text style={styles.label}>Add Image (Optional)</Text>
          {selectedImage ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
                <Text style={styles.removeImageText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
              <Text style={styles.addImageText}>📷 Take or Choose Photo</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={[styles.sendButton, (!selectedFriend || !note) && styles.sendButtonDisabled]} 
          onPress={handleSend} 
          disabled={!selectedFriend || !note}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: globalBackground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 40,
    paddingHorizontal: 0,
    paddingBottom: 80,
  },
  header: {
    fontSize: 28,
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
    borderRadius: 18,
    marginHorizontal: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
    color: '#2c2c2c',
    marginBottom: 8,
    marginTop: 10,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ece6da',
    marginBottom: 16,
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderColor: '#ece6da',
    borderRadius: 10,
    maxHeight: 200,
  },
  dropdownPlaceholder: {
    color: '#b0a99f',
    fontSize: 16,
    fontFamily: headerFontFamily,
  },
  dropdownItem: {
    paddingVertical: 8,
  },
  dropdownItemLabel: {
    fontSize: 16,
    fontFamily: headerFontFamily,
  },
  dropdownItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  dropdownItemText: {
    fontSize: 16,
    fontFamily: headerFontFamily,
    color: '#2c2c2c',
    marginLeft: 12,
  },
  friendAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  friendAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4a7cff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: headerFontFamily,
    color: '#2c2c2c',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ece6da',
  },
  textarea: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: headerFontFamily,
    color: '#2c2c2c',
    minHeight: 90,
    borderWidth: 1,
    borderColor: '#ece6da',
    marginBottom: 24,
  },
  sendButton: {
    backgroundColor: '#4a7cff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
    shadowColor: '#4a7cff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#b0a99f',
    shadowOpacity: 0,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
    letterSpacing: 0.5,
  },
  imageSection: {
    marginBottom: 24,
  },
  addImageButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#4a7cff',
    borderStyle: 'dashed',
    alignItems: 'center',
    marginTop: 8,
  },
  addImageText: {
    color: '#4a7cff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: headerFontFamily,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginTop: 8,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedFriendDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ece6da',
    marginBottom: 16,
  },
  selectedFriendContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedFriendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  selectedFriendAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4a7cff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedFriendName: {
    fontSize: 16,
    fontFamily: headerFontFamily,
    color: '#2c2c2c',
    marginLeft: 16,
    fontWeight: '600',
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 20,
    color: '#b0a99f',
  },
}); 