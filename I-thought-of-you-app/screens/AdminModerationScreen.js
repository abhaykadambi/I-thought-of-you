import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Modal,
  ScrollView
} from 'react-native';
import { moderationAPI } from '../services/api';

const globalBackground = '#f8f5ee';
const cardBackground = '#fff9ed';
const headerFontFamily = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function AdminModerationScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [dashboard, setDashboard] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDashboard = async () => {
    try {
      const response = await moderationAPI.getDashboard();
      setDashboard(response.data);
    } catch (error) {
      console.error('Fetch dashboard error:', error);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await moderationAPI.getReports({ status: 'pending', limit: 50 });
      setReports(response.data.reports || []);
    } catch (error) {
      console.error('Fetch reports error:', error);
      Alert.alert('Error', 'Failed to load reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchReports();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
    fetchReports();
  };

  const handleReportAction = async (reportId, action, status) => {
    setActionLoading(true);
    try {
      await moderationAPI.updateReport(reportId, {
        status,
        action,
        adminNotes: `Action taken: ${action}`
      });

      // Remove the report from the list
      setReports(prev => prev.filter(report => report.id !== reportId));
      
      // Refresh dashboard
      fetchDashboard();
      
      Alert.alert('Success', `Report ${status}`);
    } catch (error) {
      console.error('Report action error:', error);
      Alert.alert('Error', 'Failed to update report');
    } finally {
      setActionLoading(false);
      setShowReportModal(false);
    }
  };

  const renderReport = ({ item }) => (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() => {
        setSelectedReport(item);
        setShowReportModal(true);
      }}
    >
      <View style={styles.reportHeader}>
        <Text style={styles.reportReason}>{item.reason.replace('_', ' ').toUpperCase()}</Text>
        <Text style={styles.reportDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      
      <Text style={styles.reportContent} numberOfLines={2}>
        "{item.thought?.text}"
      </Text>
      
      <View style={styles.reportUsers}>
        <Text style={styles.reportUser}>
          Reported by: {item.reporter?.name} (@{item.reporter?.username})
        </Text>
        <Text style={styles.reportUser}>
          Content by: {item.reported_user?.name} (@{item.reported_user?.username})
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderDashboardStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{dashboard.pendingCount || 0}</Text>
        <Text style={styles.statLabel}>Pending Reports</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{dashboard.statusStats?.resolved || 0}</Text>
        <Text style={styles.statLabel}>Resolved</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{dashboard.statusStats?.dismissed || 0}</Text>
        <Text style={styles.statLabel}>Dismissed</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading moderation dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Moderation Dashboard</Text>
        <View style={styles.placeholder} />
      </View>

      {renderDashboardStats()}

      <View style={styles.reportsHeader}>
        <Text style={styles.reportsTitle}>Pending Reports</Text>
        <Text style={styles.reportsCount}>{reports.length} reports</Text>
      </View>

      {reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Pending Reports</Text>
          <Text style={styles.emptyText}>
            All reports have been reviewed. Great job keeping the community safe!
          </Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderReport}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Report Detail Modal */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedReport && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Report Details</Text>
                  <TouchableOpacity onPress={() => setShowReportModal(false)}>
                    <Text style={styles.closeButton}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent}>
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Report Reason</Text>
                    <Text style={styles.modalText}>
                      {selectedReport.reason.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Reported Content</Text>
                    <Text style={styles.modalText}>"{selectedReport.thought?.text}"</Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Reporter</Text>
                    <Text style={styles.modalText}>
                      {selectedReport.reporter?.name} (@{selectedReport.reporter?.username})
                    </Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Content Creator</Text>
                    <Text style={styles.modalText}>
                      {selectedReport.reported_user?.name} (@{selectedReport.reported_user?.username})
                    </Text>
                  </View>

                  {selectedReport.description && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Additional Details</Text>
                      <Text style={styles.modalText}>{selectedReport.description}</Text>
                    </View>
                  )}

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Report Date</Text>
                    <Text style={styles.modalText}>
                      {new Date(selectedReport.created_at).toLocaleString()}
                    </Text>
                  </View>
                </ScrollView>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.dismissButton]}
                    onPress={() => handleReportAction(selectedReport.id, 'dismiss', 'dismissed')}
                    disabled={actionLoading}
                  >
                    <Text style={styles.dismissButtonText}>Dismiss</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.removeButton]}
                    onPress={() => handleReportAction(selectedReport.id, 'remove_content', 'resolved')}
                    disabled={actionLoading}
                  >
                    <Text style={styles.removeButtonText}>Remove Content</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.banButton]}
                    onPress={() => handleReportAction(selectedReport.id, 'ban_user', 'resolved')}
                    disabled={actionLoading}
                  >
                    <Text style={styles.banButtonText}>Ban User</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: globalBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ece6da',
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3498db',
    fontFamily: headerFontFamily,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c2c2c',
    fontFamily: headerFontFamily,
  },
  placeholder: {
    width: 60,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: globalBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
    fontFamily: headerFontFamily,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: cardBackground,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3498db',
    fontFamily: headerFontFamily,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 5,
    fontFamily: headerFontFamily,
  },
  reportsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  reportsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c2c2c',
    fontFamily: headerFontFamily,
  },
  reportsCount: {
    fontSize: 14,
    color: '#7f8c8d',
    fontFamily: headerFontFamily,
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
    color: '#2c2c2c',
    marginBottom: 10,
    fontFamily: headerFontFamily,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: headerFontFamily,
  },
  listContainer: {
    padding: 20,
  },
  reportCard: {
    backgroundColor: cardBackground,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reportReason: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#e74c3c',
    fontFamily: headerFontFamily,
  },
  reportDate: {
    fontSize: 12,
    color: '#7f8c8d',
    fontFamily: headerFontFamily,
  },
  reportContent: {
    fontSize: 16,
    color: '#2c2c2c',
    marginBottom: 10,
    fontFamily: headerFontFamily,
  },
  reportUsers: {
    gap: 5,
  },
  reportUser: {
    fontSize: 14,
    color: '#7f8c8d',
    fontFamily: headerFontFamily,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: globalBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ece6da',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c2c2c',
    fontFamily: headerFontFamily,
  },
  closeButton: {
    fontSize: 24,
    color: '#7f8c8d',
  },
  modalContent: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c2c2c',
    marginBottom: 8,
    fontFamily: headerFontFamily,
  },
  modalText: {
    fontSize: 16,
    color: '#2c2c2c',
    fontFamily: headerFontFamily,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  dismissButton: {
    backgroundColor: '#95a5a6',
  },
  dismissButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: headerFontFamily,
  },
  removeButton: {
    backgroundColor: '#f39c12',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: headerFontFamily,
  },
  banButton: {
    backgroundColor: '#e74c3c',
  },
  banButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: headerFontFamily,
  },
}); 