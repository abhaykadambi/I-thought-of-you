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

  useEffect(() => {
    loadFriendProfile();
  }, [friend.id]);

  const loadFriendProfile = async () => {
    try {
      setLoading(true);
      const data = await friendsAPI.getProfile(friend.id);
      setThoughtsFromFriend(data.thoughts || []);
    } catch (error) {
      console.error('Error loading friend profile:', error);
      Alert.alert('Error', 'Failed to load friend profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendThought = () => {
    // Navigate to compose screen with friend pre-selected
    navigation.navigate('Compose', { recipient: friend });
  };

  const renderThoughtItem = ({ item }) => (
    <View style={styles.thoughtItem}>
      <Text style={styles.thoughtText}>"{item.text}"</Text>
      <Text style={styles.thoughtTime}>{item.time}</Text>
    </View>
  );



  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>
      
      <View style={styles.profileSection}>
        <Image source={{ uri: friend.avatar }} style={styles.profileAvatar} />
        <Text style={styles.profileName}>{friend.name}</Text>
        <Text style={styles.profileStatus}>Friend</Text>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>Thoughts Sent</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>8</Text>
          <Text style={styles.statLabel}>Thoughts Received</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>5</Text>
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
  },
  thoughtItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ece6da',
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