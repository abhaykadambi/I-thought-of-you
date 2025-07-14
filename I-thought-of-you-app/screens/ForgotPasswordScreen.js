import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { authAPI } from '../services/api';

const globalBackground = '#f8f5ee';
const cardBackground = '#fff9ed';
const headerFontFamily = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function ForgotPasswordScreen({ navigation }) {
  const [method, setMethod] = useState('email');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSendReset = async () => {
    if (!contact.trim()) {
      Alert.alert('Error', `Please enter your ${method}`);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const result = await authAPI.forgotPassword(method, contact.trim());
      setMessage(result.message);
      
      if (result.method === 'phone' || result.method === 'email') {
        // Navigate to OTP/code entry screen for both methods
        navigation.navigate('EnterOTPAndReset', {
          method,
          contact: contact.trim(),
        });
      }
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to send reset request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Forgot Password?</Text>
      <Text style={styles.subtitle}>Choose how you'd like to reset your password</Text>

      <View style={styles.card}>
        {/* Method Selection */}
        <View style={styles.methodContainer}>
          <TouchableOpacity 
            style={[styles.methodButton, method === 'email' && styles.methodButtonActive]} 
            onPress={() => setMethod('email')}
          >
            <Text style={[styles.methodButtonText, method === 'email' && styles.methodButtonTextActive]}>
              Email
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.methodButton, method === 'phone' && styles.methodButtonActive]} 
            onPress={() => setMethod('phone')}
          >
            <Text style={[styles.methodButtonText, method === 'phone' && styles.methodButtonTextActive]}>
              Phone
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contact Input */}
        <TextInput
          style={styles.input}
          placeholder={method === 'email' ? 'Enter your email' : 'Enter your phone number'}
          value={contact}
          onChangeText={setContact}
          keyboardType={method === 'email' ? 'email-address' : 'phone-pad'}
          autoCapitalize="none"
          placeholderTextColor="#b0a99f"
        />

        {/* Send Button */}
        <TouchableOpacity 
          style={[styles.sendButton, loading && styles.sendButtonDisabled]} 
          onPress={handleSendReset}
          disabled={loading}
        >
          <Text style={styles.sendButtonText}>
            {loading ? 'Sending...' : `Send ${method === 'email' ? 'Reset Email' : 'OTP'}`}
          </Text>
        </TouchableOpacity>

        {message ? (
          <Text style={styles.messageText}>{message}</Text>
        ) : null}
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
  backButton: {
    position: 'absolute',
    top: 48,
    left: 24,
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  backIcon: {
    fontSize: 28,
    color: '#4a7cff',
    fontWeight: 'bold',
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
  methodContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  methodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodButtonActive: {
    backgroundColor: '#4a7cff',
    borderColor: '#4a7cff',
  },
  methodButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: headerFontFamily,
    color: '#6b6b6b',
  },
  methodButtonTextActive: {
    color: '#fff',
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
    marginBottom: 20,
  },
  sendButton: {
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
  sendButtonDisabled: {
    backgroundColor: '#b0a99f',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
  },
  messageText: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f4ff',
    color: '#4a7cff',
    fontSize: 14,
    textAlign: 'center',
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