import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Platform, Modal } from 'react-native';

const globalBackground = '#f8f5ee';
const cardBackground = '#fff9ed';
const headerFontFamily = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function AppleSignInModal({ visible, onComplete, onCancel, appleUserData }) {
  const [name, setName] = useState(appleUserData?.fullName?.givenName && appleUserData?.fullName?.familyName 
    ? `${appleUserData.fullName.givenName} ${appleUserData.fullName.familyName}` 
    : '');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!name.trim() || !username.trim()) {
      Alert.alert('Error', 'Please fill in both name and username');
      return;
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,32}$/;
    if (!usernameRegex.test(username)) {
      Alert.alert('Error', 'Username must be 3-32 characters long and contain only letters, numbers, and underscores');
      return;
    }

    setLoading(true);
    try {
      await onComplete({ name: name.trim(), username: username.trim() });
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to complete setup');
    } finally {
      setLoading(false);
    }
  };

  const generateUsernameSuggestions = (fullName) => {
    if (!fullName) return [];
    
    const cleanName = fullName.toLowerCase().replace(/[^a-z\s]/g, '');
    const nameParts = cleanName.split(/\s+/);
    
    return [
      nameParts.join(''), // "john doe" -> "johndoe"
      nameParts.join('_'), // "john doe" -> "john_doe"
      nameParts.join('.'), // "john doe" -> "john.doe"
      nameParts[0], // "john doe" -> "john"
      nameParts[nameParts.length - 1], // "john doe" -> "doe"
      `${nameParts[0]}${Math.floor(Math.random() * 999)}`, // "john123"
    ].filter(Boolean);
  };

  const suggestions = generateUsernameSuggestions(name);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Complete Your Profile</Text>
          <Text style={styles.modalSubtitle}>Please provide your name and choose a username</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your full name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              placeholderTextColor="#b0a99f"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Choose a username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#b0a99f"
            />
          </View>

          {suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsLabel}>Suggested usernames:</Text>
              <View style={styles.suggestionsList}>
                {suggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionButton}
                    onPress={() => setUsername(suggestion)}
                  >
                    <Text style={styles.suggestionText}>@{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.completeButton]} 
              onPress={handleComplete}
              disabled={loading}
            >
              <Text style={styles.completeButtonText}>
                {loading ? 'Setting up...' : 'Complete Setup'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: cardBackground,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
    color: '#2c2c2c',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: headerFontFamily,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c2c2c',
    marginBottom: 8,
    fontFamily: headerFontFamily,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontFamily: headerFontFamily,
  },
  suggestionsContainer: {
    marginBottom: 24,
  },
  suggestionsLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontFamily: headerFontFamily,
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionButton: {
    backgroundColor: '#4a7cff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  suggestionText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: headerFontFamily,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  completeButton: {
    backgroundColor: '#4a7cff',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: headerFontFamily,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: headerFontFamily,
  },
}); 