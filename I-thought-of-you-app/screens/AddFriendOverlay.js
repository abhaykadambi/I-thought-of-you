import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert, TextInput, Share, ActivityIndicator, FlatList, Image } from 'react-native';
import { friendsAPI } from '../services/api';

const globalBackground = '#f8f5ee';
const cardBackground = '#fff9ed';
const headerFontFamily = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function AddFriendOverlay({ navigation }) {
  const [contact, setContact] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Search users as they type (only for usernames)
  const handleSearch = async (text) => {
    setContact(text);
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Only search if it looks like a username (no @, no spaces, no special chars except _)
    const isUsernameLike = /^[a-zA-Z0-9_]*$/.test(text) && text.length >= 1;
    
    // Clear results if not username-like or too short
    if (!isUsernameLike) {
      setSearchResults([]);
      return;
    }
    
    // Debounce search to avoid too many API calls
    const timeout = setTimeout(async () => {
      try {
        setSearching(true);
        const response = await friendsAPI.searchUsers(text.trim());
        setSearchResults(response.users || []);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300); // 300ms delay
    
    setSearchTimeout(timeout);
  };

  // Select a user from search results
  const selectUser = (user) => {
    setContact(user.username);
    setSearchResults([]);
  };

  const handleSendRequest = async () => {
    setSendError('');
    setSendSuccess('');
    // Simple email regex
    const isEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact);
    const isPhone = /^\d{8,}$/.test(contact);
    // Username regex (3-32 chars, letters, numbers, underscores)
    const isUsername = /^[a-zA-Z0-9_]{3,32}$/.test(contact);
    if (!isEmail && !isPhone && !isUsername) {
      setSendError('Enter a valid email address, phone number (at least 8 digits), or username (3-32 characters, letters, numbers, underscores)');
      return;
    }
    setSending(true);
    try {
      await friendsAPI.sendFriendRequest(contact);
      setContact('');
      setSendSuccess('Friend request sent!');
    } catch (error) {
      setSendError(error.response?.data?.error || 'Failed to send request');
    } finally {
      setSending(false);
    }
  };

  const handleInviteFriend = async () => {
    try {
      // iOS App Store link (Android not available yet)
      const iosLink = "https://apps.apple.com/us/app/i-thought-of-you/id6748984846";
      
      // Create platform-appropriate message
      let inviteMessage;
      if (Platform.OS === 'ios') {
        inviteMessage = `I thought of you.\n\n📱 ${iosLink}`;
      } else {
        // For Android users or other platforms, still show iOS link since that's the only option
        inviteMessage = `I thought of you.\n\n📱 ${iosLink}\n\n(Android version coming soon!)`;
      }
      
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
            placeholder="Type username to search, or enter email/phone"
            value={contact}
            onChangeText={handleSearch}
            keyboardType="default"
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor="#b0a99f"
            editable={!sending}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleSendRequest} disabled={sending}>
            <Text style={styles.addButtonText}>{sending ? '...' : 'Add'}</Text>
          </TouchableOpacity>
        </View>
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <View style={styles.searchResultsContainer}>
            <Text style={styles.searchResultsTitle}>Matching Usernames:</Text>
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.searchResultItem}
                  onPress={() => selectUser(item)}
                >
                  {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.searchResultAvatar} />
                  ) : (
                    <View style={styles.searchResultAvatarPlaceholder}>
                      <Text style={styles.searchResultAvatarText}>
                        {item.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.searchResultInfo}>
                    <Text style={styles.searchResultName}>{item.name}</Text>
                    <Text style={styles.searchResultUsername}>@{item.username}</Text>
                  </View>
                </TouchableOpacity>
              )}
              style={styles.searchResultsList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}
        
        {/* Search Loading Indicator */}
        {searching && (
          <View style={styles.searchLoadingContainer}>
            <ActivityIndicator size="small" color="#4a7cff" />
            <Text style={styles.searchLoadingText}>Searching...</Text>
          </View>
        )}
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
  searchResultsContainer: {
    width: '100%',
    maxHeight: 200,
    marginBottom: 16,
  },
  searchResultsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c2c2c',
    marginBottom: 8,
    fontFamily: headerFontFamily,
  },
  searchResultsList: {
    maxHeight: 150,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#ece6da',
  },
  searchResultAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  searchResultAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: '#4a7cff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c2c2c',
    fontFamily: headerFontFamily,
  },
  searchResultUsername: {
    fontSize: 14,
    color: '#666',
    fontFamily: headerFontFamily,
  },
  searchLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: 16,
  },
  searchLoadingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontFamily: headerFontFamily,
  },
}); 