import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Platform
} from 'react-native';
import { thoughtsAPI } from '../services/api';

const globalBackground = '#f8f5ee';
const cardBackground = '#fff9ed';
const headerFontFamily = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function ThoughtOptionsOverlay({ 
  visible, 
  onClose, 
  thought, 
  isOwnThought = false,
  onThoughtDeleted,
  onReportThought 
}) {
  const handleDeleteThought = () => {
    Alert.alert(
      'Delete Thought',
      'Are you sure you want to delete this thought? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await thoughtsAPI.delete(thought.id);
              Alert.alert('Success', 'Thought deleted successfully');
              onThoughtDeleted();
              onClose();
            } catch (error) {
              console.error('Delete thought error:', error);
              const errorMessage = error.response?.data?.error || 'Failed to delete thought';
              Alert.alert('Error', errorMessage);
            }
          }
        }
      ]
    );
  };

  const handleReportThought = () => {
    onClose();
    onReportThought();
  };

  const handleBlockUser = () => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${thought.author || 'this user'}? You won't see their thoughts anymore.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            // This would typically open a block user screen or modal
            // For now, we'll just show a message
            Alert.alert('Block User', 'Block user functionality will be implemented in the settings screen.');
            onClose();
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.container}>
          <View style={styles.menuCard}>
            {isOwnThought ? (
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={handleDeleteThought}
              >
                <Text style={[styles.menuItemText, styles.deleteText]}>Delete Thought</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={handleReportThought}
                >
                  <Text style={styles.menuItemText}>Report Content</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={handleBlockUser}
                >
                  <Text style={styles.menuItemText}>Block User</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    position: 'absolute',
    top: 100,
    right: 20,
  },
  menuCard: {
    backgroundColor: cardBackground,
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 150,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  menuItemText: {
    fontSize: 16,
    color: '#2c2c2c',
    fontFamily: headerFontFamily,
  },
  deleteText: {
    color: '#e74c3c',
    fontWeight: '600',
  },
}); 