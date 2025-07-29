import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const REACTIONS = [
  { type: 'happy', emoji: '😊', label: 'Happy' },
  { type: 'sad', emoji: '😢', label: 'Sad' },
  { type: 'disgust', emoji: '🤢', label: 'Disgust' },
  { type: 'laughing', emoji: '😂', label: 'Laughing' },
  { type: 'anger', emoji: '🤬', label: 'Anger' },
  { type: 'smirk', emoji: '😏', label: 'Smirk' },
];

export default function ReactionPicker({ onReaction, userReaction, isRecipient }) {
  if (!isRecipient) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>React to this thought:</Text>
      <View style={styles.reactionRow}>
        {REACTIONS.map((reaction) => (
          <TouchableOpacity
            key={reaction.type}
            style={[
              styles.reactionButton,
              userReaction === reaction.type && styles.selectedReaction
            ]}
            onPress={() => onReaction(reaction.type)}
          >
            <Text style={styles.emoji}>{reaction.emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  reactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  reactionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    minWidth: 40,
    alignItems: 'center',
  },
  selectedReaction: {
    backgroundColor: '#4a7cff',
  },
  emoji: {
    fontSize: 20,
  },
}); 