import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert, Image, RefreshControl, FlatList, ActivityIndicator } from 'react-native';
import { thoughtsAPI } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

const globalBackground = '#f8f5ee';
const cardBackground = '#fff9ed';
const headerFontFamily = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const sectionFontFamily = Platform.OS === 'ios' ? 'Georgia' : 'serif';

const SkeletonThought = () => (
  <View style={[styles.thoughtCard, { opacity: 0.5, backgroundColor: '#ececec', marginBottom: 16 }]}> 
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#ddd', marginRight: 8 }} />
      <View style={{ flex: 1, height: 16, backgroundColor: '#ddd', borderRadius: 4 }} />
    </View>
    <View style={{ width: 80, height: 12, backgroundColor: '#ddd', borderRadius: 4 }} />
  </View>
);

export default function FeedScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('received');
  const [receivedThoughts, setReceivedThoughts] = useState([]);
  const [sentThoughts, setSentThoughts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastLoadTime, setLastLoadTime] = useState(0);
  const [receivedOffset, setReceivedOffset] = useState(0);
  const [sentOffset, setSentOffset] = useState(0);
  const [receivedTotal, setReceivedTotal] = useState(0);
  const [sentTotal, setSentTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 10;

  useEffect(() => {
    loadInitialThoughts();
  }, [activeTab]);

  // Refresh thoughts when screen comes into focus (e.g., after creating a thought)
  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      const shouldReload = (receivedThoughts.length === 0 && sentThoughts.length === 0) || 
                          (lastLoadTime > 0 && (now - lastLoadTime) > 300000); // 5 minutes
      if (shouldReload) {
        loadInitialThoughts();
      }
    }, [receivedThoughts.length, sentThoughts.length, lastLoadTime, activeTab])
  );

  const loadInitialThoughts = async () => {
    setLoading(true);
    setLoadingMore(false);
    setRefreshing(false);
    setReceivedOffset(0);
    setSentOffset(0);
    try {
      const data = await thoughtsAPI.getAll({ limit: PAGE_SIZE, offset: 0 });
      setReceivedThoughts(data.received || []);
      setSentThoughts(data.sent || []);
      setReceivedTotal(data.receivedTotal || 0);
      setSentTotal(data.sentTotal || 0);
      setReceivedOffset(data.received ? data.received.length : 0);
      setSentOffset(data.sent ? data.sent.length : 0);
      setLastLoadTime(Date.now());
    } catch (error) {
      console.error('Error loading thoughts:', error);
      Alert.alert('Error', 'Failed to load thoughts. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialThoughts();
    setRefreshing(false);
  };

  const loadMoreReceived = async () => {
    if (loadingMore || receivedThoughts.length >= receivedTotal) return;
    setLoadingMore(true);
    try {
      const data = await thoughtsAPI.getAll({ limit: PAGE_SIZE, offset: receivedOffset });
      setReceivedThoughts(prev => [...prev, ...(data.received || [])]);
      setReceivedOffset(prev => prev + (data.received ? data.received.length : 0));
      setReceivedTotal(data.receivedTotal || receivedTotal);
    } catch (error) {
      console.error('Error loading more received thoughts:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const loadMoreSent = async () => {
    if (loadingMore || sentThoughts.length >= sentTotal) return;
    setLoadingMore(true);
    try {
      const data = await thoughtsAPI.getAll({ limit: PAGE_SIZE, offset: sentOffset });
      setSentThoughts(prev => [...prev, ...(data.sent || [])]);
      setSentOffset(prev => prev + (data.sent ? data.sent.length : 0));
      setSentTotal(data.sentTotal || sentTotal);
    } catch (error) {
      console.error('Error loading more sent thoughts:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const renderFooter = () => loadingMore ? (
    <View style={{ padding: 16 }}>
      <ActivityIndicator size="small" color="#4a7cff" />
    </View>
  ) : null;

  const renderReceivedThought = ({ item }) => (
    <TouchableOpacity
      style={styles.thoughtCard}
      onPress={() => navigation.navigate('ThoughtDetailOverlay', { thought: item })}
    >
      <View style={styles.thoughtHeader}>
        {item.authorAvatar ? (
          <Image source={{ uri: item.authorAvatar }} style={styles.authorAvatar} />
        ) : (
          <View style={styles.authorAvatarPlaceholder}>
            <Text style={styles.authorAvatarText}>
              {item.author.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={styles.thoughtText} numberOfLines={2} ellipsizeMode="tail">
          <Text style={styles.thoughtAuthor}>{item.author}: </Text>
          {item.text}
        </Text>
      </View>
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.thoughtImage} />
      )}
      <Text style={styles.thoughtTime}>{item.time}</Text>
    </TouchableOpacity>
  );

  const renderSentThought = ({ item }) => (
    <TouchableOpacity
      style={styles.thoughtCard}
      onPress={() => navigation.navigate('ThoughtDetailOverlay', { 
        thought: {
          author: 'You',
          text: item.text,
          time: item.time,
          recipient: item.recipient,
          image: item.image
        }
      })}
    >
      <View style={styles.sentThoughtContainer}>
        <Text style={styles.thoughtText} numberOfLines={2} ellipsizeMode="tail">
          <Text style={styles.thoughtAuthor}>To {item.recipient}: </Text>
          {item.text}
        </Text>
      </View>
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.thoughtImage} />
      )}
      <Text style={styles.thoughtTime}>{item.time}</Text>
    </TouchableOpacity>
  );

  const renderReceivedThoughts = () => (
    loading ? (
      <>
        <SkeletonThought />
        <SkeletonThought />
        <SkeletonThought />
      </>
    ) : (
      <FlatList
        data={receivedThoughts}
        keyExtractor={(item) => item.id || item.time || Math.random().toString()}
        renderItem={renderReceivedThought}
        ListEmptyComponent={renderEmptyState('received')}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMoreReceived}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
      />
    )
  );

  const renderSentThoughts = () => (
    loading ? (
      <>
        <SkeletonThought />
        <SkeletonThought />
        <SkeletonThought />
      </>
    ) : (
      <FlatList
        data={sentThoughts}
        keyExtractor={(item) => 'sent-' + (item.id || item.time || Math.random().toString())}
        renderItem={renderSentThought}
        ListEmptyComponent={renderEmptyState('sent')}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMoreSent}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
      />
    )
  );

  const renderEmptyState = (type) => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No thoughts yet</Text>
      <Text style={styles.emptyMessage}>
        {type === 'received' 
          ? "When friends send you thoughts, they'll appear here."
          : "Thoughts you send to friends will appear here."
        }
      </Text>
    </View>
  );

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setLoading(true);
    setReceivedThoughts([]);
    setSentThoughts([]);
    setReceivedOffset(0);
    setSentOffset(0);
    setReceivedTotal(0);
    setSentTotal(0);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Feed</Text>
      {/* Tab Switch */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'received' && styles.activeTabButton]} 
          onPress={() => handleTabSwitch('received')}
        >
          <Text style={[styles.tabText, activeTab === 'received' && styles.activeTabText]}>
            Recent Thoughts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'sent' && styles.activeTabButton]} 
          onPress={() => handleTabSwitch('sent')}
        >
          <Text style={[styles.tabText, activeTab === 'sent' && styles.activeTabText]}>
            Thoughts I've Sent
          </Text>
        </TouchableOpacity>
      </View>
      {/* Content */}
      {activeTab === 'received' ? renderReceivedThoughts() : renderSentThoughts()}
    </View>
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
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 18,
    color: '#2c2c2c',
    letterSpacing: 0.5,
  },
  feedContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
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
    lineHeight: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#4a7cff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: sectionFontFamily,
    color: '#b0a99f',
  },
  activeTabText: {
    color: '#fff',
  },
  thoughtCard: {
    backgroundColor: cardBackground,
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  thoughtHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    flex: 1,
  },
  authorAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
    backgroundColor: '#e0e0e0',
  },
  authorAvatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
    backgroundColor: '#4a7cff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  thoughtText: {
    fontSize: 16,
    color: '#2c2c2c',
    fontFamily: sectionFontFamily,
    marginBottom: 6,
    flex: 1,
    flexShrink: 1,
  },
  thoughtAuthor: {
    fontWeight: 'bold',
    color: '#2c2c2c',
    fontFamily: sectionFontFamily,
  },
  thoughtTime: {
    fontSize: 13,
    color: '#b0a99f',
    fontFamily: sectionFontFamily,
  },
  thoughtImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  sentThoughtContainer: {
    flex: 1,
  },
}); 