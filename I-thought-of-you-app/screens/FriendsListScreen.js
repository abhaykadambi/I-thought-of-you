import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Platform, Alert, Share, ActivityIndicator, SectionList } from 'react-native';
import { friendsAPI } from '../services/api';
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
      const data = await friendsAPI.getRequests();
      setIncomingRequests((data.incoming || []).filter(r => r.status === 'pending'));
    } catch (error) {
      console.error('Error loading incoming requests:', error);
      setIncomingRequests([]);
    }
  };

  const handleRespond = async (requestId, status) => {
    setResponding(requestId + status);
    try {
      await friendsAPI.respondToRequest(requestId, status);
      await loadIncomingRequests();
      await loadFriends();
    } catch (error) {
      Alert.alert('Error', 'Failed to update request.');
    } finally {
      setResponding(null);
    }
  };

  const loadFriends = async () => {
    try {
      setLoading(true);
      const data = await friendsAPI.getAll();
      setFriends(data.users || []);
    } catch (error) {
      console.error('Error loading friends:', error);
      Alert.alert('Error', 'Failed to load friends. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestedFriends = async () => {
    try {
      setLoadingSuggested(true);
      
      // Request contacts permission
      const { status } = await Contacts.requestPermissionsAsync();
      console.log('Contacts permission status:', status);
      
      if (status !== 'granted') {
        console.log('Contacts permission denied');
        setSuggestedFriends([]);
        return;
      }
      
      // Get contacts with phone numbers - simpler approach
      const { data } = await Contacts.getContactsAsync({ 
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
        pageSize: 1000
      });
      
      console.log('Contacts loaded:', data?.length || 0);
      
      if (!data || data.length === 0) {
        console.log('No contacts found');
        setSuggestedFriends([]);
        return;
      }
      
      // Simple phone number extraction (like the original working version)
      const phoneNumbers = data
        .flatMap(contact => (contact.phoneNumbers || []).map(p => p.number))
        .map(num => num.replace(/[^\d]/g, '')) // Just digits like original
        .filter(num => num.length >= 8);
      
      console.log('Phone numbers found:', phoneNumbers.length);
      
      if (phoneNumbers.length === 0) {
        console.log('No valid phone numbers found');
        setSuggestedFriends([]);
        return;
      }
      
      // Remove duplicates
      const uniquePhones = [...new Set(phoneNumbers)];
      console.log('Unique phone numbers:', uniquePhones.length);
      
      // Remove phone numbers of existing friends (simple approach)
      const friendPhones = friends.map(f => f.phone ? f.phone.replace(/[^\d]/g, '') : null).filter(Boolean);
      const filteredPhones = uniquePhones.filter(num => !friendPhones.includes(num));
      
      console.log('Phone numbers after filtering friends:', filteredPhones.length);
      
      if (filteredPhones.length === 0) {
        console.log('No phone numbers left after filtering');
        setSuggestedFriends([]);
        return;
      }
      
      // Query backend for suggested friends
      console.log('Sending phone numbers to backend:', filteredPhones.slice(0, 5));
      const response = await friendsAPI.getSuggested({ phoneNumbers: filteredPhones });
      console.log('Backend response users:', response.users?.length || 0);
      
      setSuggestedFriends(response.users || []);
    } catch (error) {
      console.error('Error loading suggested friends:', error);
      setSuggestedFriends([]);
    } finally {
      setLoadingSuggested(false);
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

  const renderSuggestedItem = ({ item }) => (
    <View style={styles.suggestedCard}>
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
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>Add</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No friends yet</Text>
      <Text style={styles.emptyMessage}>Go add some friends to start sharing thoughts!</Text>
    </View>
  );

  // SectionList data
  const sections = [
    {
      title: 'Friends',
      data: friends,
      renderItem: renderItem,
      emptyComponent: renderEmptyState(),
    },
    {
      title: 'Suggested Friends',
      data: suggestedFriends,
      renderItem: renderSuggestedItem,
      emptyComponent: (
        loadingSuggested ? (
          <ActivityIndicator size="small" color="#4a7cff" style={{ marginTop: 16 }} />
        ) : (
          <Text style={styles.suggestedEmpty}>No suggested friends found from your contacts.</Text>
        )
      ),
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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
    marginBottom: 32,
    lineHeight: 24,
  },
  suggestedSection: {
    marginTop: 16,
    marginHorizontal: 24,
    marginBottom: 24,
  },
  suggestedHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c2c2c',
    marginTop: 20,
    marginBottom: 10,
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
    backgroundColor: '#f0f4ff',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#4a7cff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginLeft: 12,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
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
  avatarText: {
    fontSize: 18,
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