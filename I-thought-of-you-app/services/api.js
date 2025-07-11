import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
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
      // Token expired or invalid, redirect to login
      AsyncStorage.removeItem('authToken');
      AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

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

  // Check if user is logged in
  isLoggedIn: async () => {
    const token = await AsyncStorage.getItem('authToken');
    return !!token;
  },

  // Get stored user data
  getStoredUser: async () => {
    const user = await AsyncStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};

// Thoughts API
export const thoughtsAPI = {
  // Get all thoughts (received and sent)
  getAll: async () => {
    const response = await api.get('/thoughts');
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
};

// Friends API
export const friendsAPI = {
  // Get all users (potential friends)
  getAll: async () => {
    const response = await api.get('/friends');
    return response.data;
  },

  // Get friend profile with thoughts
  getProfile: async (friendId) => {
    const response = await api.get(`/friends/${friendId}`);
    return response.data;
  },

  // Get suggested friends by phone numbers
  getSuggested: async ({ phoneNumbers }) => {
    const response = await api.post('/friends/suggested', { phoneNumbers });
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

  // Send a friend request by phone number
  sendFriendRequest: async (phone) => {
    const response = await api.post('/friends/request', { phone });
    return response.data;
  },
};

export default api; 