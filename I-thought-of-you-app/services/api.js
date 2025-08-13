import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance
const api = axios.create({
  baseURL: 'https://i-thought-of-you-production.up.railway.app/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear local storage
      AsyncStorage.removeItem('authToken');
      AsyncStorage.removeItem('user');
      
      // Note: We can't navigate here since this interceptor doesn't have access to navigation
      // The individual API calls will need to handle navigation on auth failures
    }
    return Promise.reject(error);
  }
);

// Helper function to handle API calls with auth error handling
export const apiCallWithAuth = async (apiFunction, navigation, onAuthFailure) => {
  try {
    return await apiFunction();
  } catch (error) {
    if (error.response?.status === 401) {
      // Handle authentication failure
      if (onAuthFailure) {
        onAuthFailure();
      } else if (navigation) {
        // Default behavior: redirect to welcome screen
        navigation.reset({
          index: 0,
          routes: [{ name: 'Welcome' }],
        });
      }
    }
    throw error;
  }
};

// Auth API
export const authAPI = {
  // Register new user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    if (response.data.user) {
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Logout
  logout: async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
  },

  // Validate if the stored token is actually valid
  validateToken: async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return false;
      
      // Make a test API call to validate the token
      const response = await api.get('/auth/profile');
      return response.status === 200;
    } catch (error) {
      // If any error occurs (including 401), the token is invalid
      console.log('Token validation failed:', error.message);
      // Clean up invalid token
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      return false;
    }
  },

  // Check if user is logged in (with token validation)
  isLoggedIn: async () => {
    return await authAPI.validateToken();
  },

  // Get stored user data
  getStoredUser: async () => {
    const user = await AsyncStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Forgot password
  forgotPassword: async (method, contact) => {
    const response = await api.post('/auth/forgot-password', { method, contact });
    return response.data;
  },

  // Verify reset code (for both email and phone)
  verifyResetCode: async (method, contact, code) => {
    const response = await api.post('/auth/verify-reset-code', { method, contact, code });
    return response.data;
  },

  // Reset password using code (for both email and phone)
  resetPassword: async (method, contact, code, newPassword) => {
    const response = await api.post('/auth/reset-password', { method, contact, code, newPassword });
    return response.data;
  },

  // Verify OTP and reset password
  verifyOTP: async (userId, otp, newPassword, phone) => {
    const response = await api.post('/auth/verify-otp', { userId, otp, newPassword, phone });
    return response.data;
  },

  // Verify reset token
  verifyResetToken: async (token) => {
    const response = await api.get(`/auth/verify-reset-token/${token}`);
    return response.data;
  },

  // Upload avatar image
  uploadAvatar: async (avatarUri) => {
    const formData = new FormData();
    formData.append('avatar', {
      uri: avatarUri,
      type: 'image/jpeg', // You might want to detect the actual type
      name: 'avatar.jpg',
    });
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch('https://i-thought-of-you-production.up.railway.app/api/auth/upload-avatar', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload avatar');
    }
    return await response.json();
  },

  // Check username availability
  checkUsername: async (username) => {
    const response = await api.get(`/auth/check-username/${username}`);
    return response.data;
  },

  // Apple Sign-In
  appleSignIn: async (identityToken, fullName, email) => {
    const response = await api.post('/auth/apple', { identityToken, fullName, email });
    if (response.data.token) {
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Complete Apple Sign-In profile
  completeAppleSignIn: async (appleUserId, appleEmail, fullName, name, username) => {
    const response = await api.post('/auth/apple/complete', { 
      appleUserId, 
      appleEmail, 
      fullName, 
      name, 
      username 
    });
    if (response.data.token) {
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
};

// Thoughts API
export const thoughtsAPI = {
  // Get all thoughts (received and sent)
  getAll: async ({ limit = 10, offset = 0 } = {}) => {
    const response = await api.get('/thoughts', {
      params: { limit, offset },
    });
    return response.data;
  },

  // Create new thought
  create: async (thoughtData) => {
    const response = await api.post('/thoughts', thoughtData);
    return response.data;
  },

  // Get pinned thoughts
  getPinned: async () => {
    const response = await api.get('/thoughts/pinned');
    return response.data;
  },

  // Pin a thought
  pin: async (thoughtId) => {
    const response = await api.post(`/thoughts/pin/${thoughtId}`);
    return response.data;
  },

  // Unpin a thought
  unpin: async (thoughtId) => {
    const response = await api.delete(`/thoughts/pin/${thoughtId}`);
    return response.data;
  },

  // Get reactions for a thought
  getReactions: async (thoughtId) => {
    const response = await api.get(`/thoughts/${thoughtId}/reactions`);
    return response.data;
  },

  // Add/update reaction
  addReaction: async (thoughtId, reactionType) => {
    const response = await api.post(`/thoughts/${thoughtId}/reactions`, { reactionType });
    return response.data;
  },

  // Remove reaction
  removeReaction: async (thoughtId) => {
    const response = await api.delete(`/thoughts/${thoughtId}/reactions`);
    return response.data;
  },

  // Delete a thought
  delete: async (thoughtId) => {
    const response = await api.delete(`/thoughts/${thoughtId}`);
    return response.data;
  },
};

// Friends API
export const friendsAPI = {
  // Get all users (potential friends)
  getAll: async () => {
    const response = await api.get('/friends');
    return response.data;
  },

  // Get friend profile with thoughts
  getProfile: async (friendId, params = {}) => {
    const response = await api.get(`/friends/${friendId}`, { params });
    return response.data;
  },

  // Get suggested friends by phone numbers, emails, or usernames
  getSuggested: async ({ phoneNumbers = [], emails = [], usernames = [] }) => {
    const response = await api.post('/friends/suggested', { phoneNumbers, emails, usernames });
    return response.data;
  },
  
  // Debug suggested friends functionality
  debugSuggested: async () => {
    const response = await api.get('/friends/debug-suggested');
    return response.data;
  },
  
  // Search users by username
  searchUsers: async (query) => {
    const response = await api.get(`/friends/search?query=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Get incoming and outgoing friend requests
  getRequests: async () => {
    const response = await api.get('/friends/requests');
    return response.data;
  },

  // Respond to a friend request (accept/decline)
  respondToRequest: async (requestId, status) => {
    const response = await api.post(`/friends/request/${requestId}/respond`, { status });
    return response.data;
  },

  // Send a friend request by phone number, email, or username
  sendFriendRequest: async (contact) => {
    // Simple email regex
    const isEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact);
    // Username regex (3-32 chars, letters, numbers, underscores)
    const isUsername = /^[a-zA-Z0-9_]{3,32}$/.test(contact);
    
    let payload;
    if (isEmail) {
      payload = { email: contact };
    } else if (isUsername) {
      payload = { username: contact };
    } else {
      payload = { phone: contact };
    }
    
    const response = await api.post('/friends/request', payload);
    return response.data;
  },

  // Unfriend a user
  unfriend: async (friendId) => {
    const response = await api.delete(`/friends/${friendId}`);
    return response.data;
  },
};

// Notifications API
export const notificationsAPI = {
  // Debug notification setup
  debug: async () => {
    const response = await api.get('/notifications/debug');
    return response.data;
  },

  // Test notification
  test: async () => {
    const response = await api.post('/notifications/test');
    return response.data;
  },
};

// Settings API
export const settingsAPI = {
  // Get user settings (privacy and notifications)
  getSettings: async () => {
    const response = await api.get('/settings');
    return response.data;
  },

  // Update user settings
  updateSettings: async (settings) => {
    const response = await api.put('/settings', settings);
    return response.data;
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/settings/password', { currentPassword, newPassword });
    return response.data;
  },

  // Delete account
  deleteAccount: async () => {
    const response = await api.delete('/settings/account');
    return response.data;
  },

  // Get blocked users
  getBlockedUsers: async () => {
    const response = await api.get('/settings/blocked');
    return response.data;
  },

  // Block a user
  blockUser: async (contact) => {
    const response = await api.post('/settings/block', { contact });
    return response.data;
  },

  // Unblock a user
  unblockUser: async (userId) => {
    const response = await api.delete(`/settings/block/${userId}`);
    return response.data;
  },

  // Export user data
  exportData: async () => {
    const response = await api.get('/settings/export');
    return response.data;
  },

  // Test notification
  testNotification: async () => {
    const response = await api.post('/settings/test-notification');
    return response.data;
  },
};

// Moderation API
export const moderationAPI = {
  // Report content
  reportContent: (data) => api.post('/moderation/report', data),
  
  // Block user
  blockUser: (data) => api.post('/moderation/block', data),
  
  // Unblock user
  unblockUser: (userId) => api.delete(`/moderation/block/${userId}`),
  
  // Get blocked users
  getBlockedUsers: () => api.get('/moderation/blocked'),
  
  // Admin: Get reports
  getReports: (params) => api.get('/moderation/reports', { params }),
  
  // Admin: Update report
  updateReport: (reportId, data) => api.put(`/moderation/reports/${reportId}`, data),
  
  // Admin: Get dashboard
  getDashboard: () => api.get('/moderation/dashboard'),
};

export default api; 