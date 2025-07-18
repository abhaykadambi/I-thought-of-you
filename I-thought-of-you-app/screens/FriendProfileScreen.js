import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, ScrollView, FlatList, Alert, ActivityIndicator } from 'react-native';
import { friendsAPI } from '../services/api';

const globalBackground = '#f8f5ee';
const cardBackground = '#fff9ed';
const headerFontFamily = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function FriendProfileScreen({ route, navigation }) {
  const { friend } = route.params;
  const [thoughtsFromFriend, setThoughtsFromFriend] = useState([]);
  const [thoughtsToFriend, setThoughtsToFriend] = useState([]);
  const [activeTab, setActiveTab] = useState('from'); // 'from' or 'to'
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fromOffset, setFromOffset] = useState(0);
  const [toOffset, setToOffset] = useState(0);
  const [fromTotal, setFromTotal] = useState(0);
  const [toTotal, setToTotal] = useState(0);
  const PAGE_SIZE = 10;
  const [showMenu, setShowMenu] = useState(false);
  const [stats, setStats] = useState({
    thoughtsSent: 0,
    thoughtsReceived: 0,
    daysConnected: 0
  });

  useEffect(() => {
    loadInitialThoughts();
  }, [friend.id, activeTab]);

  const loadInitialThoughts = async () => {
    setLoading(true);
    setLoadingMore(false);
    setFromOffset(0);
    setToOffset(0);
    try {
      const data = await friendsAPI.getProfile(friend.id, { limit: PAGE_SIZE, offset: 0 });
      setThoughtsFromFriend(data.thoughts || []);
      setThoughtsToFriend(data.sentThoughts || []);
      setFromTotal(data.thoughtsTotal || 0);
      setToTotal(data.sentThoughtsTotal || 0);
      setFromOffset(data.thoughts ? data.thoughts.length : 0);
      setToOffset(data.sentThoughts ? data.sentThoughts.length : 0);
      setStats({
        thoughtsSent: data.stats?.thoughtsSent || 0,
        thoughtsReceived: data.stats?.thoughtsReceived || 0,
        daysConnected: data.stats?.daysConnected || 0
      });
    } catch (error) {
      console.error('Error loading friend profile:', error);
      Alert.alert('Error', 'Failed to load friend profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreFrom = async () => {
    if (loadingMore || thoughtsFromFriend.length >= fromTotal) return;
    setLoadingMore(true);
    try {
      const data = await friendsAPI.getProfile(friend.id, { limit: PAGE_SIZE, offset: fromOffset });
      setThoughtsFromFriend(prev => [...prev, ...(data.thoughts || [])]);
      setFromOffset(prev => prev + (data.thoughts ? data.thoughts.length : 0));
      setFromTotal(data.thoughtsTotal || fromTotal);
    } catch (error) {
      console.error('Error loading more thoughts from friend:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const loadMoreTo = async () => {
    if (loadingMore || thoughtsToFriend.length >= toTotal) return;
    setLoadingMore(true);
    try {
      const data = await friendsAPI.getProfile(friend.id, { limit: PAGE_SIZE, offset: toOffset });
      setThoughtsToFriend(prev => [...prev, ...(data.sentThoughts || [])]);
      setToOffset(prev => prev + (data.sentThoughts ? data.sentThoughts.length : 0));
      setToTotal(data.sentThoughtsTotal || toTotal);
    } catch (error) {
      console.error('Error loading more thoughts to friend:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSendThought = () => {
    // Navigate to compose tab with friend pre-selected
    navigation.navigate('MainApp', { 
      screen: 'Compose', 
      params: { recipient: friend } 
    });
  };

  const handleMenuPress = () => {
    setShowMenu(!showMenu);
  };

  const handleUnfriend = () => {
    setShowMenu(false);
    Alert.alert(
      'Unfriend',
      `Are you sure you want to unfriend ${friend.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Unfriend',
          style: 'destructive',
          onPress: async () => {
            try {
              await friendsAPI.unfriend(friend.id);
              Alert.alert('Success', `${friend.name} has been unfriended.`);
              navigation.goBack();
            } catch (error) {
              console.error('Unfriend error:', error);
              Alert.alert('Error', 'Failed to unfriend. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderFooter = () => loadingMore ? (
    <View style={{ padding: 16 }}>
      <ActivityIndicator size="small" color="#4a7cff" />
    </View>
  ) : null;

  const renderThoughtItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.thoughtItem}
      onPress={async () => {
        let isPinned = false;
        try {
          const pinnedData = await friendsAPI.getProfile(friend.id); // fallback if thoughtsAPI.getPinned is not available here
          // If you want to use thoughtsAPI.getPinned, import it and use:
          // const pinnedData = await thoughtsAPI.getPinned();
          // isPinned = pinnedData.pinnedThoughts.some(pinned => pinned.id === item.id);
        } catch (e) {}
        if (typeof thoughtsAPI !== 'undefined' && thoughtsAPI.getPinned) {
          try {
            const pinnedData = await thoughtsAPI.getPinned();
            isPinned = pinnedData.pinnedThoughts.some(pinned => pinned.id === item.id);
          } catch (e) {}
        }
        navigation.navigate('ThoughtDetailOverlay', { 
          thought: {
            author: friend.name,
            authorAvatar: friend.avatar, // Pass avatar for focused view
            text: item.text,
            time: item.time,
            image: item.image
          },
          isPinned
        });
      }}
    >
      <Text style={styles.thoughtText}>"{item.text}"</Text>
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.thoughtImage} />
      )}
      <Text style={styles.thoughtTime}>{item.time}</Text>
    </TouchableOpacity>
  );



  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
        <Text style={styles.menuIcon}>⋮</Text>
      </TouchableOpacity>
      
      {showMenu && (
        <>
          <TouchableOpacity 
            style={styles.backdrop} 
            onPress={() => setShowMenu(false)}
            activeOpacity={1}
          />
          <View style={styles.menuOverlay}>
            <TouchableOpacity style={styles.menuItem} onPress={handleUnfriend}>
              <Text style={styles.menuItemText}>Unfriend</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      
      <View style={styles.profileSection}>
        {friend.avatar ? (
          <Image source={{ uri: friend.avatar }} style={styles.profileAvatar} />
        ) : (
          <View style={styles.profileAvatarPlaceholder}>
            <Text style={styles.profileAvatarText}>
              {friend.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={styles.profileName}>{friend.name}</Text>
        <Text style={styles.profileStatus}>Friend</Text>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.thoughtsSent}</Text>
          <Text style={styles.statLabel}>Thoughts Sent</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.thoughtsReceived}</Text>
          <Text style={styles.statLabel}>Thoughts Received</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.daysConnected}</Text>
          <Text style={styles.statLabel}>Days Connected</Text>
        </View>
      </View>

      <View style={styles.actionsCard}>
        <TouchableOpacity style={styles.actionButton} onPress={handleSendThought}>
          <Text style={styles.actionButtonText}>Send a Thought</Text>
        </TouchableOpacity>
      </View>
      {/* Toggle for thoughts from/to friend */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'from' && styles.activeTabButton]}
          onPress={() => setActiveTab('from')}
        >
          <Text style={[styles.tabText, activeTab === 'from' && styles.activeTabText]}>from {friend.name}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'to' && styles.activeTabButton]}
          onPress={() => setActiveTab('to')}
        >
          <Text style={[styles.tabText, activeTab === 'to' && styles.activeTabText]}>to {friend.name}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.recentThoughtsCard}>
        {loading ? (
          <Text>Loading...</Text>
        ) : (
          <>
            {activeTab === 'from' ? (
              thoughtsFromFriend.length > 0 ? (
                <FlatList
                  data={thoughtsFromFriend}
                  renderItem={renderThoughtItem}
                  keyExtractor={item => item.id}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                  onEndReached={loadMoreFrom}
                  onEndReachedThreshold={0.5}
                  ListFooterComponent={renderFooter}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No thoughts from {friend.name} yet</Text>
                  <Text style={styles.emptyStateSubtext}>Send them a thought to get started!</Text>
                </View>
              )
            ) : (
              thoughtsToFriend.length > 0 ? (
                <FlatList
                  data={thoughtsToFriend}
                  renderItem={renderThoughtItem}
                  keyExtractor={item => item.id}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                  onEndReached={loadMoreTo}
                  onEndReachedThreshold={0.5}
                  ListFooterComponent={renderFooter}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No thoughts sent to {friend.name} yet</Text>
                  <Text style={styles.emptyStateSubtext}>Send them a thought to get started!</Text>
                </View>
              )
            )}
          </>
        )}
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
  menuButton: {
    position: 'absolute',
    top: 48,
    right: 24,
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
  menuIcon: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 15,
  },
  menuOverlay: {
    position: 'absolute',
    top: 80,
    right: 24,
    zIndex: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 120,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 16,
    fontFamily: headerFontFamily,
    color: '#e74c3c',
    fontWeight: '500',
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    backgroundColor: '#ece6da',
  },
  profileAvatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    backgroundColor: '#4a7cff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileName: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
    color: '#2c2c2c',
    marginBottom: 8,
  },
  profileStatus: {
    fontSize: 16,
    color: '#4a7cff',
    fontFamily: headerFontFamily,
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: cardBackground,
    borderRadius: 16,
    marginHorizontal: 24,
    paddingVertical: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
    color: '#4a7cff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#b0a99f',
    fontFamily: headerFontFamily,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#ece6da',
  },
  actionsCard: {
    marginHorizontal: 24,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#4a7cff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#4a7cff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
    letterSpacing: 0.5,
  },
  secondaryActionButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4a7cff',
  },
  secondaryActionButtonText: {
    color: '#4a7cff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
    letterSpacing: 0.5,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#4a7cff',
  },
  tabText: {
    fontSize: 16,
    fontFamily: headerFontFamily,
    color: '#b0a99f',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4a7cff',
    fontWeight: '600',
  },
  recentThoughtsCard: {
    backgroundColor: cardBackground,
    borderRadius: 16,
    marginHorizontal: 24,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
    color: '#2c2c2c',
    marginBottom: 16,
  },
  thoughtItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ece6da',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  thoughtText: {
    fontSize: 16,
    fontFamily: headerFontFamily,
    color: '#2c2c2c',
    marginBottom: 8,
    lineHeight: 24,
  },
  thoughtTime: {
    fontSize: 14,
    color: '#b0a99f',
    fontFamily: headerFontFamily,
  },
  thoughtImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#b0a99f',
    fontFamily: headerFontFamily,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#b0a99f',
    fontFamily: headerFontFamily,
    textAlign: 'center',
    opacity: 0.7,
  },
}); 