import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, ScrollView, FlatList, Alert } from 'react-native';
import { friendsAPI } from '../services/api';

const globalBackground = '#f8f5ee';
const cardBackground = '#fff9ed';
const headerFontFamily = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function FriendProfileScreen({ route, navigation }) {
  const { friend } = route.params;
  const [thoughtsFromFriend, setThoughtsFromFriend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [stats, setStats] = useState({
    thoughtsSent: 0,
    thoughtsReceived: 0,
    daysConnected: 0
  });
  const [isSignificantOther, setIsSignificantOther] = useState(friend.isSignificantOther || false);
  const [soLoading, setSoLoading] = useState(false);

  useEffect(() => {
    loadFriendProfile();
  }, [friend.id]);

  const loadFriendProfile = async () => {
    try {
      setLoading(true);
      const data = await friendsAPI.getProfile(friend.id);
      setThoughtsFromFriend(data.thoughts || []);
      setIsSignificantOther(data.friend.isSignificantOther || false);
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

  const handleSetSO = async () => {
    setSoLoading(true);
    try {
      await friendsAPI.setSignificantOther(friend.id);
      setIsSignificantOther(true);
      Alert.alert('Success', `${friend.name} is now your Significant Other!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to set significant other.');
    } finally {
      setSoLoading(false);
    }
  };

  const handleUnsetSO = async () => {
    setSoLoading(true);
    try {
      await friendsAPI.unsetSignificantOther();
      setIsSignificantOther(false);
      Alert.alert('Removed', `${friend.name} is no longer your Significant Other.`);
    } catch (error) {
      Alert.alert('Error', 'Failed to unset significant other.');
    } finally {
      setSoLoading(false);
    }
  };

  const renderThoughtItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.thoughtItem}
      onPress={() => navigation.navigate('ThoughtDetailOverlay', { 
        thought: {
          author: friend.name,
          text: item.text,
          time: item.time,
          image: item.image
        }
      })}
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
        <View style={{ position: 'relative', alignItems: 'center' }}>
          {friend.avatar ? (
            <Image source={{ uri: friend.avatar }} style={styles.profileAvatar} />
          ) : (
            <View style={styles.profileAvatarPlaceholder}>
              <Text style={styles.profileAvatarText}>
                {friend.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {isSignificantOther && (
            <View style={styles.heartBadge}>
              <Text style={styles.heartEmoji}>❤️</Text>
            </View>
          )}
        </View>
        <Text style={styles.profileName}>{friend.name}</Text>
        <Text style={styles.profileStatus}>Friend</Text>
        <TouchableOpacity
          style={[styles.soButton, isSignificantOther ? styles.unsetSoButton : styles.setSoButton]}
          onPress={isSignificantOther ? handleUnsetSO : handleSetSO}
          disabled={soLoading}
        >
          <Text style={[styles.soButtonText, isSignificantOther ? styles.unsetSoButtonText : styles.setSoButtonText]}>
            {isSignificantOther ? 'Remove Significant Other' : 'Set as Significant Other'}
          </Text>
        </TouchableOpacity>
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

      <View style={styles.recentThoughtsCard}>
        <Text style={styles.sectionTitle}>Thoughts from {friend.name}</Text>
        {thoughtsFromFriend.length > 0 ? (
          <FlatList
            data={thoughtsFromFriend}
            renderItem={renderThoughtItem}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No thoughts from {friend.name} yet</Text>
            <Text style={styles.emptyStateSubtext}>Send them a thought to get started!</Text>
          </View>
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
  heartBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 2,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  heartEmoji: {
    fontSize: 20,
    marginLeft: 1,
    marginTop: 1,
  },
  soButton: {
    marginTop: 12,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  setSoButton: {
    backgroundColor: '#e74c3c',
  },
  unsetSoButton: {
    backgroundColor: '#ece6da',
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  soButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
  },
  setSoButtonText: {
    color: '#fff',
  },
  unsetSoButtonText: {
    color: '#e74c3c',
  },
}); 