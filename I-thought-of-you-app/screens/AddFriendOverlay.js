import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert, TextInput, Share, ActivityIndicator } from 'react-native';
import { friendsAPI } from '../services/api';

const globalBackground = '#f8f5ee';
const cardBackground = '#fff9ed';
const headerFontFamily = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function AddFriendOverlay({ navigation }) {
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState('');

  const handleSendRequest = async () => {
    setSendError('');
    setSendSuccess('');
    if (!/^\d{8,}$/.test(phone)) {
      setSendError('Enter a valid phone number (at least 8 digits)');
      return;
    }
    setSending(true);
    try {
      await friendsAPI.sendFriendRequest(phone);
      setPhone('');
      setSendSuccess('Friend request sent!');
    } catch (error) {
      setSendError(error.response?.data?.error || 'Failed to send request');
    } finally {
      setSending(false);
    }
  };

  const handleInviteFriend = async () => {
    try {
      const inviteMessage = "Hey! I'm using I Thought of You - a beautiful app for sharing thoughts with friends. Join me! Download it here: https://your-app-store-link.com";
      await Share.share({
        message: inviteMessage,
        title: 'Invite to I Thought of You'
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share invite. Please try again.');
    }
  };

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
        <Text style={styles.closeIcon}>×</Text>
      </TouchableOpacity>
      <View style={styles.card}>
        <Text style={styles.header}>Add a Friend</Text>
        <View style={styles.addRow}>
          <TextInput
            style={styles.input}
            placeholder="Add by phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor="#b0a99f"
            editable={!sending}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleSendRequest} disabled={sending}>
            <Text style={styles.addButtonText}>{sending ? '...' : 'Add'}</Text>
          </TouchableOpacity>
        </View>
        {!!sendError && <Text style={styles.errorText}>{sendError}</Text>}
        {!!sendSuccess && <Text style={styles.successText}>{sendSuccess}</Text>}
        <TouchableOpacity style={styles.inviteButton} onPress={handleInviteFriend}>
          <Text style={styles.inviteButtonText}>Invite a Friend</Text>
        </TouchableOpacity>
      </View>
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
    fontSize: 28,
    color: '#4a7cff',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: cardBackground,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    width: '100%',
    maxWidth: 400,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
    color: '#2c2c2c',
    marginBottom: 18,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#2c2c2c',
    borderWidth: 1,
    borderColor: '#ece6da',
    fontFamily: headerFontFamily,
  },
  addButton: {
    backgroundColor: '#4a7cff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginLeft: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: headerFontFamily,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: headerFontFamily,
  },
  successText: {
    color: '#27ae60',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: headerFontFamily,
  },
  inviteButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4a7cff',
    marginTop: 12,
  },
  inviteButtonText: {
    color: '#4a7cff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
  },
}); 