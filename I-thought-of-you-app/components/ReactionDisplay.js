import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const REACTION_EMOJIS = {
  happy: '😊',
  sad: '😢',
  disgust: '🤢',
  laughing: '😂',
  anger: '😠',
  smirk: '😏',
};

export default function ReactionDisplay({ reactions, currentUserId }) {
  if (!reactions || reactions.length === 0) return null;

  // Group reactions by type
  const reactionCounts = reactions.reduce((acc, reaction) => {
    acc[reaction.reaction_type] = (acc[reaction.reaction_type] || 0) + 1;
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      {Object.entries(reactionCounts).map(([type, count]) => (
        <View key={type} style={styles.reactionItem}>
          <Text style={styles.emoji}>{REACTION_EMOJIS[type]}</Text>
          <Text style={styles.count}>{count}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  reactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emoji: {
    fontSize: 16,
    marginRight: 4,
  },
  count: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
}); 