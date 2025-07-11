import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert, Image } from 'react-native';
import { thoughtsAPI } from '../services/api';

const globalBackground = '#f8f5ee';
const cardBackground = '#fff9ed';
const headerFontFamily = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function ThoughtDetailOverlay({ route, navigation }) {
  const { thought } = route.params;
  const [isPinned, setIsPinned] = useState(false);

  const handlePinThought = async () => {
    if (isPinned) {
      Alert.alert(
        'Unpin Thought',
        'Are you sure you want to unpin this thought?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Unpin',
            style: 'destructive',
            onPress: async () => {
              try {
                await thoughtsAPI.unpin(thought.id);
                setIsPinned(false);
                Alert.alert('Success', 'Thought unpinned successfully!');
              } catch (error) {
                Alert.alert('Error', 'Failed to unpin thought. Please try again.');
              }
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Pin Thought',
        'Would you like to pin this thought?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Pin',
            onPress: async () => {
              try {
                await thoughtsAPI.pin(thought.id);
                setIsPinned(true);
                Alert.alert('Success', 'Thought pinned successfully!');
              } catch (error) {
                Alert.alert('Error', 'Failed to pin thought. Please try again.');
              }
            },
          },
        ]
      );
    }
  };

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
        <Text style={styles.closeIcon}>←</Text>
      </TouchableOpacity>
      <View style={styles.card}>
        <Text style={styles.author}>
          {thought.author === 'You' && thought.recipient ? `To ${thought.recipient}` : thought.author}
        </Text>
        <Text style={styles.text}>{thought.text}</Text>
        {thought.image && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: thought.image }} style={styles.thoughtImage} />
          </View>
        )}
        <Text style={styles.time}>{thought.time}</Text>
      </View>
      {thought.author !== 'You' && !thought.recipient && (
        <TouchableOpacity 
          style={[styles.pinButton, isPinned && styles.pinButtonActive]} 
          onPress={handlePinThought}
        >
          <Text style={[styles.pinButtonText, isPinned && styles.pinButtonTextActive]}>
            {isPinned ? '📌 Pinned' : '📌 Pin Thought'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(248,245,238,0.98)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  closeButton: {
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
  closeIcon: {
    fontSize: 24,
    color: '#4a7cff',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: cardBackground,
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    width: '100%',
    maxWidth: 400,
  },
  author: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
    color: '#2c2c2c',
    marginBottom: 18,
  },
  text: {
    fontSize: 20,
    fontFamily: headerFontFamily,
    color: '#2c2c2c',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 30,
  },
  time: {
    fontSize: 15,
    color: '#b0a99f',
    fontFamily: headerFontFamily,
    marginBottom: 24,
  },
  pinButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4a7cff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    marginTop: 20,
    alignSelf: 'center',
  },
  pinButtonActive: {
    backgroundColor: '#4a7cff',
    borderColor: '#4a7cff',
  },
  pinButtonText: {
    color: '#4a7cff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
    letterSpacing: 0.5,
  },
  pinButtonTextActive: {
    color: '#fff',
  },
  imageContainer: {
    marginVertical: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  thoughtImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
}); 