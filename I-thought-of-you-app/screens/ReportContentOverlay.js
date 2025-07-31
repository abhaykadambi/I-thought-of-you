import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  TextInput
} from 'react-native';
import { moderationAPI } from '../services/api';

const globalBackground = '#f8f5ee';
const cardBackground = '#fff9ed';
const headerFontFamily = Platform.OS === 'ios' ? 'Georgia' : 'serif';

const REPORT_REASONS = [
  { key: 'harassment', label: 'Harassment or Bullying' },
  { key: 'hate_speech', label: 'Hate Speech' },
  { key: 'violence', label: 'Violence or Threats' },
  { key: 'spam', label: 'Spam or Misleading Content' },
  { key: 'inappropriate', label: 'Inappropriate Content' },
  { key: 'other', label: 'Other' }
];

export default function ReportContentOverlay({ visible, onClose, thought, onReportSubmitted }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitReport = async () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a reason for reporting');
      return;
    }

    setLoading(true);
    try {
      await moderationAPI.reportContent({
        thoughtId: thought.id,
        reason: selectedReason,
        description: description.trim() || null
      });

      Alert.alert(
        'Report Submitted',
        'Thank you for your report. We will review it within 24 hours.',
        [
          {
            text: 'OK',
            onPress: () => {
              onReportSubmitted();
              onClose();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Report submission error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to submit report';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setDescription('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Report Content</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.subtitle}>
              Help us keep the community safe by reporting inappropriate content.
            </Text>

            <View style={styles.thoughtPreview}>
              <Text style={styles.thoughtPreviewLabel}>Content being reported:</Text>
              <Text style={styles.thoughtText}>{thought?.text}</Text>
            </View>

            <Text style={styles.sectionTitle}>Reason for Report</Text>
            <View style={styles.reasonsContainer}>
              {REPORT_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason.key}
                  style={[
                    styles.reasonButton,
                    selectedReason === reason.key && styles.reasonButtonSelected
                  ]}
                  onPress={() => setSelectedReason(reason.key)}
                >
                  <Text style={[
                    styles.reasonButtonText,
                    selectedReason === reason.key && styles.reasonButtonTextSelected
                  ]}>
                    {reason.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Additional Details (Optional)</Text>
            <Text style={styles.descriptionHint}>
              Please provide any additional context that will help us understand the issue.
            </Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Describe the issue..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor="#b0a99f"
            />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, !selectedReason && styles.submitButtonDisabled]}
              onPress={handleSubmitReport}
              disabled={loading || !selectedReason}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Report</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: globalBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ece6da',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
    color: '#2c2c2c',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#7f8c8d',
  },
  content: {
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 20,
    fontFamily: headerFontFamily,
  },
  thoughtPreview: {
    backgroundColor: cardBackground,
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  thoughtPreviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 8,
    fontFamily: headerFontFamily,
  },
  thoughtText: {
    fontSize: 16,
    color: '#2c2c2c',
    fontFamily: headerFontFamily,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c2c2c',
    marginBottom: 15,
    fontFamily: headerFontFamily,
  },
  reasonsContainer: {
    marginBottom: 20,
  },
  reasonButton: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ece6da',
  },
  reasonButtonSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  reasonButtonText: {
    fontSize: 16,
    color: '#2c2c2c',
    fontFamily: headerFontFamily,
  },
  reasonButtonTextSelected: {
    color: '#fff',
  },
  descriptionHint: {
    fontSize: 14,
    color: '#7f8c8d',
    fontFamily: headerFontFamily,
    marginBottom: 10,
  },
  descriptionInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2c2c2c',
    borderWidth: 1,
    borderColor: '#ece6da',
    fontFamily: headerFontFamily,
    minHeight: 100,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ece6da',
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#7f8c8d',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: headerFontFamily,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#3498db',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: headerFontFamily,
  },
}); 