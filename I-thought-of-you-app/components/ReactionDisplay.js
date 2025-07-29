import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const REACTION_EMOJIS = {
  happy: '😊',
  sad: '😢',
  disgust: '🤢',
  laughing: '😂',
  anger: '🤬',
  smirk: '😏',
};

export default function ReactionDisplay({ reactions, currentUserId }) {
  if (!reactions || reactions.length === 0) return null;

  // Get unique reaction types (no duplicates)
  const uniqueReactions = [...new Set(reactions.map(r => r.reaction_type))];

  return (
    <View style={styles.container}>
      {uniqueReactions.map((type) => (
        <View key={type} style={styles.reactionItem}>
          <Text style={styles.emoji}>{REACTION_EMOJIS[type]}</Text>
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
    gap: 6,
  },
  reactionItem: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 16,
  },
  emoji: {
    fontSize: 20,
  },
}); 