import { useState, useEffect, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { authAPI } from './api';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const loggedIn = await authAPI.isLoggedIn();
      setIsAuthenticated(loggedIn);
      
      if (loggedIn) {
        const userData = await authAPI.getStoredUser();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle authentication failure
  const handleAuthFailure = useCallback(async () => {
    try {
      await authAPI.logout();
      setIsAuthenticated(false);
      setUser(null);
      
      // Navigate to welcome screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
    } catch (error) {
      console.error('Error handling auth failure:', error);
    }
  }, [navigation]);

  // Login
  const login = useCallback(async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      setIsAuthenticated(true);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
      setIsAuthenticated(false);
      setUser(null);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [navigation]);

  // Register
  const register = useCallback(async (userData) => {
    try {
      const response = await authAPI.register(userData);
      setIsAuthenticated(true);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  }, []);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    isAuthenticated,
    user,
    loading,
    checkAuth,
    handleAuthFailure,
    login,
    logout,
    register,
  };
};
