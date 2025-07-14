import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { authAPI } from '../services/api';

const globalBackground = '#f8f5ee';
const cardBackground = '#fff9ed';
const headerFontFamily = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function ResetPasswordScreen({ route, navigation }) {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Extract token from route params or deep link
    const resetToken = route.params?.token;
    if (resetToken) {
      setToken(resetToken);
      verifyToken(resetToken);
    } else {
      setVerifying(false);
      Alert.alert('Error', 'Invalid reset link', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    }
  }, [route.params]);

  const verifyToken = async (resetToken) => {
    try {
      const result = await authAPI.verifyResetToken(resetToken);
      setTokenValid(true);
      setUserEmail(result.email);
    } catch (error) {
      setTokenValid(false);
      Alert.alert('Error', 'Invalid or expired reset link', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } finally {
      setVerifying(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword(token, newPassword.trim());
      Alert.alert('Success', 'Password updated successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Verifying reset link...</Text>
        </View>
      </View>
    );
  }

  if (!tokenValid) {
    return null; // Will navigate to login via useEffect
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>Enter your new password</Text>

      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          placeholderTextColor="#b0a99f"
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          placeholderTextColor="#b0a99f"
        />

        <TouchableOpacity 
          style={[styles.resetButton, loading && styles.resetButtonDisabled]} 
          onPress={handleResetPassword}
          disabled={loading}
        >
          <Text style={styles.resetButtonText}>
            {loading ? 'Updating...' : 'Update Password'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.backToLoginButton} 
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.backToLoginText}>Back to Login</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: globalBackground,
    paddingTop: 40,
    paddingHorizontal: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#7f8c8d',
    fontFamily: headerFontFamily,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
    textAlign: 'center',
    marginTop: 80,
    marginBottom: 10,
    color: '#2c2c2c',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: headerFontFamily,
  },
  card: {
    backgroundColor: cardBackground,
    borderRadius: 18,
    marginHorizontal: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#2c2c2c',
    borderWidth: 1,
    borderColor: '#ece6da',
    fontFamily: headerFontFamily,
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: '#4a7cff',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#4a7cff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  resetButtonDisabled: {
    backgroundColor: '#b0a99f',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
  },
  backToLoginButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  backToLoginText: {
    color: '#4a7cff',
    fontSize: 16,
    fontFamily: headerFontFamily,
  },
}); 