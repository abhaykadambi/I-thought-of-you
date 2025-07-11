import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { thoughtsAPI } from '../services/api';

const globalBackground = '#f8f5ee';
const cardBackground = '#fff9ed';
const headerFontFamily = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function ComposeThoughtScreen() {
  const [friend, setFriend] = useState('');
  const [note, setNote] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  const pickImage = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
  };

  const handleSend = async () => {
    if (!friend || !note) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await thoughtsAPI.create({
        recipientEmail: friend,
        text: note,
        imageUrl: selectedImage
      });
      
      // Clear the fields
      setFriend('');
      setNote('');
      setSelectedImage(null);
      
      Alert.alert('Success', 'Thought sent successfully!');
      // Optionally navigate back or to feed
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to send thought. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.header}>Send a Thought</Text>
      <View style={styles.card}>
        <Text style={styles.label}>To</Text>
        <TextInput
          style={styles.input}
          placeholder="Friend's name"
          placeholderTextColor="#b0a99f"
          value={friend}
          onChangeText={setFriend}
        />
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
              <Text style={styles.addImageText}>📷 Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={!friend || !note}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    shadowColor: '#4a7cff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
    opacity: 1,
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
}); 