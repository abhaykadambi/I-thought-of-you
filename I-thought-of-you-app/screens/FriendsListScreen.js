import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Platform, Alert, Share, ActivityIndicator, SectionList, RefreshControl } from 'react-native';
import { friendsAPI, apiCallWithAuth } from '../services/api';
import * as Contacts from 'expo-contacts';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const globalBackground = '#f8f5ee';
const cardBackground = '#fff9ed';
const headerFontFamily = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const defaultAvatar = 'https://ui-avatars.com/api/?background=ece6da&color=2c2c2c&name=User';

export default function FriendsListScreen({ navigation: propNavigation }) {
  const navigation = propNavigation || useNavigation();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suggestedFriends, setSuggestedFriends] = useState([]);
  const [loadingSuggested, setLoadingSuggested] = useState(false);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [responding, setResponding] = useState(null);
  const [addingFriend, setAddingFriend] = useState(null);
  const [removingItems, setRemovingItems] = useState(new Set());
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadFriends();
      loadIncomingRequests();
    }, [])
  );

  useEffect(() => {
    if (friends.length > 0 || !loading) {
      loadSuggestedFriends();
    }
  }, [friends, loading]);

  // Debug: Log current user ID on mount
  useEffect(() => {
    (async () => {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        const parsed = JSON.parse(user);
        // console.log('CURRENT USER ID:', parsed.id);
      }
    })();
  }, []);

  // Debug: Log unhandled promise rejections
  if (typeof global !== 'undefined' && global.process && global.process.on) {
    global.process.on('unhandledRejection', (reason, promise) => {
      // console.log('UNHANDLED PROMISE REJECTION:', reason);
    });
  }

  const loadIncomingRequests = async () => {
    try {
      const data = await apiCallWithAuth(
        () => friendsAPI.getRequests(),
        navigation
      );
      setIncomingRequests((data.incoming || []).filter(r => r.status === 'pending'));
    } catch (error) {
      console.error('Error loading incoming requests:', error);
      // Don't show alert for auth errors as user will be redirected
      if (error.response?.status !== 401) {
        setIncomingRequests([]);
      }
    }
  };

  const handleRespond = async (requestId, status) => {
    setResponding(requestId + status);
    try {
      await apiCallWithAuth(
        () => friendsAPI.respondToRequest(requestId, status),
        navigation
      );
      await loadIncomingRequests();
      await loadFriends();
    } catch (error) {
      // Don't show alert for auth errors as user will be redirected
      if (error.response?.status !== 401) {
        Alert.alert('Error', 'Failed to update request.');
      }
    } finally {
      setResponding(null);
    }
  };

  const loadFriends = async () => {
    try {
      setLoading(true);
      const data = await apiCallWithAuth(
        () => friendsAPI.getAll(),
        navigation
      );
      setFriends(data.users || []);
    } catch (error) {
      console.error('Error loading friends:', error);
      // Don't show alert for auth errors as user will be redirected
      if (error.response?.status !== 401) {
        Alert.alert('Error', 'Failed to load friends. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadFriends(),
        loadIncomingRequests(),
        loadSuggestedFriends()
      ]);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadSuggestedFriends = async () => {
    try {
      setLoadingSuggested(true);
      
      let phoneNumbers = [];
      let emails = [];
      let usernames = [];
      let contactNames = [];
      
      // Try to get contacts if permission is granted
      try {
        const { status } = await Contacts.requestPermissionsAsync();
        console.log('Contacts permission status:', status);
        
        if (status === 'granted') {
          // Get contacts with phone numbers and emails
          const { data } = await Contacts.getContactsAsync({ 
            fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails, Contacts.Fields.Name],
            pageSize: 1000
          });
          
          console.log('Contacts loaded:', data?.length || 0);
          
          if (data && data.length > 0) {
            // Extract contact names for username pattern matching
            contactNames = data
              .map(contact => contact.name)
              .filter(name => name && name.trim().length > 0);
            
            // Extract phone numbers
            phoneNumbers = data
              .flatMap(contact => (contact.phoneNumbers || []).map(p => p.number))
              .map(num => num.replace(/[^\d]/g, '')) // Just digits
              .filter(num => num.length >= 8);
            
            // Extract emails
            emails = data
              .flatMap(contact => (contact.emails || []).map(e => e.email))
              .filter(email => email && email.includes('@'));
            
            // Generate potential usernames from contact names (for exact matching)
            usernames = data
              .map(contact => {
                const name = contact.name || '';
                return [
                  name.toLowerCase().replace(/\s+/g, ''), // "John Doe" -> "johndoe"
                  name.toLowerCase().replace(/\s+/g, '_'), // "John Doe" -> "john_doe"
                  name.toLowerCase().replace(/\s+/g, '.'), // "John Doe" -> "john.doe"
                  name.split(' ')[0]?.toLowerCase(), // "John Doe" -> "john"
                  name.split(' ')[1]?.toLowerCase(), // "John Doe" -> "doe"
                ].filter(Boolean);
              })
              .flat();
            
            // Remove duplicates
            phoneNumbers = [...new Set(phoneNumbers)];
            emails = [...new Set(emails)];
            usernames = [...new Set(usernames)];
            contactNames = [...new Set(contactNames)];
            
            console.log('Extracted from contacts:', {
              contactNames: contactNames.length,
              phoneNumbers: phoneNumbers.length,
              emails: emails.length,
              usernames: usernames.length
            });
            
            // Note: Backend now handles excluding existing friends from all queries
          }
        }
      } catch (contactError) {
        console.log('Error accessing contacts:', contactError);
        // Continue without contacts - will use friends-of-friends
      }
      
      // Query backend for suggested friends (enhanced hybrid approach)
      console.log('Sending to backend:', {
        contactNames: contactNames.length,
        phoneNumbers: phoneNumbers.length,
        emails: emails.length,
        usernames: usernames.length
      });
      
      const response = await friendsAPI.getSuggested({ 
        contactNames,
        phoneNumbers, 
        emails, 
        usernames 
      });
      
      console.log('Backend response users:', response.users?.length || 0);
      setSuggestedFriends(response.users || []);
      
    } catch (error) {
      console.error('Error loading suggested friends:', error);
      setSuggestedFriends([]);
    } finally {
      setLoadingSuggested(false);
    }
  };

  const handleAddSuggestedFriend = async (friend) => {
    if (addingFriend === friend.id) return; // Prevent double-tap
    
    setAddingFriend(friend.id);
    setRemovingItems(prev => new Set([...prev, friend.id]));
    
    try {
      console.log('Adding friend with data:', friend);
      
      // Determine the best identifier to use for the friend request
      let contactIdentifier;
      if (friend.username) {
        contactIdentifier = friend.username;
      } else if (friend.email) {
        contactIdentifier = friend.email;
      } else if (friend.phone) {
        contactIdentifier = friend.phone;
      } else {
        throw new Error('No valid contact information found for this user');
      }
      
      console.log('Using contact identifier:', contactIdentifier);
      
      // Send friend request
      await friendsAPI.sendFriendRequest(contactIdentifier);
      
      // Remove from suggested friends list immediately after successful request
      setSuggestedFriends(prev => prev.filter(f => f.id !== friend.id));
      
      // Clear the removing state
      setRemovingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(friend.id);
        return newSet;
      });
      
      // Reload friends list to show the new friend if they accept
      await loadFriends();
      
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Failed to send friend request. Please try again.');
      
      // Remove from removing items if there was an error
      setRemovingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(friend.id);
        return newSet;
      });
    } finally {
      setAddingFriend(null);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.friendCard}
      onPress={() => navigation.navigate('FriendProfile', { friend: item })}
    >
      {item.avatar ? (
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <Text style={styles.friendName}>{item.name}</Text>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  const renderSuggestedItem = ({ item, index }) => {
    // Determine suggestion type based on position and data
    // This is a simple heuristic - in a real app you might want to add a 'source' field
    const isDirectMatch = item.email || item.phone; // Direct contact match
    const isPatternMatch = !isDirectMatch && item.username; // Username pattern match
    const isFriendOfFriend = !isDirectMatch && !isPatternMatch; // Friends-of-friends
    
    const isAdding = addingFriend === item.id;
    
    return (
      <View style={styles.suggestedCard}>
        <View style={styles.suggestedCardLeft}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.suggestedAvatar} />
          ) : (
            <View style={styles.suggestedAvatarPlaceholder}>
              <Text style={styles.suggestedAvatarText}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.suggestedUserInfo}>
            <Text style={[styles.friendName, { fontSize: 16 }]}>{item.name}</Text>
            {item.username && (
              <Text style={styles.suggestedUsername}>@{item.username}</Text>
            )}
            {/* Show suggestion source indicator */}
            {isPatternMatch && (
              <Text style={styles.suggestionSource}>🔍 Similar username</Text>
            )}
            {isFriendOfFriend && (
              <Text style={styles.suggestionSource}>👥 Friend of friend</Text>
            )}
          </View>
        </View>
        <TouchableOpacity 
          style={[
            styles.addButton,
            isAdding && styles.addButtonDisabled
          ]}
          onPress={() => handleAddSuggestedFriend(item)}
          disabled={isAdding}
        >
          {isAdding ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.addButtonText}>Add</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No friends yet</Text>
      <Text style={styles.emptyMessage}>Go add some friends to start sharing thoughts!</Text>
    </View>
  );

  // SectionList data
  const sections = [
    ...(suggestedFriends.length > 0 || loadingSuggested ? [{
      title: 'Suggested Friends',
      data: suggestedFriends.filter(friend => !removingItems.has(friend.id)),
      renderItem: renderSuggestedItem,
      emptyComponent: (
        loadingSuggested ? (
          <ActivityIndicator size="small" color="#4a7cff" style={{ marginTop: 16 }} />
        ) : (
          <Text style={styles.suggestedEmpty}>No suggested friends found. We'll show contacts, similar usernames, and friends of friends!</Text>
        )
      ),
    }] : []),
    {
      title: 'Friends',
      data: friends,
      renderItem: renderItem,
      emptyComponent: renderEmptyState(),
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Friends</Text>
        <TouchableOpacity style={styles.headerInviteButton} onPress={() => navigation.navigate('AddFriendOverlay')}>
          <Text style={styles.headerInviteButtonText}>🔍</Text>
        </TouchableOpacity>
      </View>
      {/* Incoming Friend Requests */}
      {incomingRequests.length > 0 && (
        <View style={styles.requestsSection}>
          <Text style={styles.requestsHeader}>Friend Requests</Text>
          {incomingRequests.map(item => (
            <View style={styles.requestCard} key={item.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                {item.sender?.avatar ? (
                  <Image
                    source={{ uri: item.sender.avatar }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {(item.sender?.name || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={styles.requestText}>
                  {item.sender?.name || 'Unknown User'}
                </Text>
              </View>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.acceptButton]}
                  onPress={() => handleRespond(item.id, 'accepted')}
                  disabled={responding === item.id + 'accepted'}
                >
                  <Text style={styles.actionButtonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.declineButton]}
                  onPress={() => handleRespond(item.id, 'declined')}
                  disabled={responding === item.id + 'declined'}
                >
                  <Text style={styles.actionButtonText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
      {/* Unified SectionList for Friends and Suggested Friends */}
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        extraData={[suggestedFriends.length, removingItems.size, addingFriend]}
        renderSectionHeader={({ section: { title } }) => (
          title === 'Friends' ? null : <Text style={styles.suggestedHeader}>{title}</Text>
        )}
        renderItem={({ item, section }) => section.renderItem({ item })}
        ListEmptyComponent={renderEmptyState}
        renderSectionFooter={({ section }) =>
          section.data.length === 0 && section.emptyComponent ? section.emptyComponent : null
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4a7cff']}
            tintColor="#4a7cff"
          />
        }
      />
    </View>
  );
}

// Add to friendsAPI in services/api.js:
// getSuggested: async ({ phoneNumbers }) => {
//   const response = await api.post('/friends/suggested', { phoneNumbers });
//   return response.data;
// }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: globalBackground,
    paddingTop: 40,
    paddingHorizontal: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 24,
    marginTop: 32,
    marginBottom: 18,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
    color: '#2c2c2c',
    letterSpacing: 0.5,
  },
  headerInviteButton: {
    backgroundColor: '#4a7cff',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4a7cff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  headerInviteButtonText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: cardBackground,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 16,
    backgroundColor: '#ece6da',
  },
  suggestedAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: '#ece6da',
  },
  friendName: {
    fontSize: 18,
    fontFamily: headerFontFamily,
    color: '#2c2c2c',
    flex: 1,
    fontWeight: 'bold',
  },
  arrow: {
    fontSize: 28,
    color: '#b0a99f',
    marginLeft: 8,
    fontWeight: '300',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 40,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
    color: '#2c2c2c',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    fontFamily: headerFontFamily,
    color: '#6b6b6b',
    textAlign: 'center',
    marginBottom: 60,
    lineHeight: 24,
  },
  suggestedSection: {
    marginTop: 16,
    marginHorizontal: 24,
    marginBottom: 24,
  },
  suggestedHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c2c2c',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: headerFontFamily,
  },
  suggestedEmpty: {
    color: '#b0a99f',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 16,
    fontFamily: headerFontFamily,
  },
  suggestedListContent: {
    paddingBottom: 8,
  },
  suggestedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f4ff',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  suggestedCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  suggestedUserInfo: {
    flex: 1,
    marginLeft: 12,
  },
  suggestedUsername: {
    fontSize: 12,
    color: '#666',
    fontFamily: headerFontFamily,
    marginTop: 1,
  },
  suggestionSource: {
    fontSize: 10,
    color: '#4a7cff',
    fontFamily: headerFontFamily,
    marginTop: 1,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#4a7cff',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  addButtonDisabled: {
    backgroundColor: '#b0a99f',
    opacity: 0.7,
  },
  headerRequestButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderWidth: 2,
    borderColor: '#4a7cff',
    shadowColor: '#4a7cff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRequestButtonText: {
    color: '#4a7cff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  requestsSection: {
    marginHorizontal: 24,
    marginBottom: 12,
  },
  requestsHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a7cff',
    marginBottom: 6,
    fontFamily: headerFontFamily,
  },
  requestCard: {
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  requestText: {
    fontSize: 16,
    color: '#2c2c2c',
    fontFamily: headerFontFamily,
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  acceptButton: {
    backgroundColor: '#4a7cff',
  },
  declineButton: {
    backgroundColor: '#b0a99f',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    fontFamily: headerFontFamily,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 16,
    backgroundColor: '#4a7cff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestedAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: '#4a7cff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  suggestedAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c2c2c',
    marginTop: 24,
    marginBottom: 10,
    fontFamily: headerFontFamily,
  },
}); 