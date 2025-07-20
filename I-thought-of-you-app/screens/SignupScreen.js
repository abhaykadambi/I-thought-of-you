import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Platform, KeyboardAvoidingView, ActivityIndicator, Modal, Pressable, Linking } from 'react-native';
import { authAPI } from '../services/api';

const globalBackground = '#f8f5ee';
const cardBackground = '#fff9ed';
const headerFontFamily = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [pendingSignup, setPendingSignup] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !name || !phone || !username) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (!/^\d{8,}$/.test(phone)) {
      Alert.alert('Error', 'Please enter a valid phone number (at least 8 digits, numbers only)');
      return;
    }
    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,32}$/;
    if (!usernameRegex.test(username)) {
      Alert.alert('Error', 'Username must be 3-32 characters long and contain only letters, numbers, and underscores');
      return;
    }
    // Show modal before proceeding
    setShowPolicyModal(true);
    setPendingSignup(true);
  };

  const doActualSignup = async () => {
    setLoading(true);
    try {
      await authAPI.register({ email, password, name, phone, username });
      setShowPolicyModal(false);
      setPendingSignup(false);
      navigation.navigate('MainApp');
    } catch (error) {
      const backendError = error.response?.data?.error || '';
      if (
        backendError.includes('User with this email, phone, or username already exists') ||
        backendError.toLowerCase().includes('already exists')
      ) {
        Alert.alert('Registration Failed', 'An account with this email, phone number, or username already exists. Please use different credentials.');
      } else {
        Alert.alert('Registration Failed', backendError || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptPolicy = () => {
    setShowPolicyModal(false);
    setPendingSignup(false);
    doActualSignup();
  };

  const handleDeclinePolicy = () => {
    setShowPolicyModal(false);
    setPendingSignup(false);
    Alert.alert('Required', 'You must accept the Privacy Policy and Terms of Service to create an account.');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Sign up to get started</Text>
      <View style={styles.card}>
        {/* Remove Social Signup Buttons and Divider */}
        {/* Signup Form */}
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          placeholderTextColor="#b0a99f"
        />
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor="#b0a99f"
        />
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoCapitalize="none"
          placeholderTextColor="#b0a99f"
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#b0a99f"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#b0a99f"
        />
        <TouchableOpacity style={styles.signupButton} onPress={handleSignUp} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.signupButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>
      </View>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.backButtonText}>Back to Login</Text>
      </TouchableOpacity>
      <Modal
        visible={showPolicyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPolicyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Agree to Continue</Text>
            <Text style={styles.modalText}>
              To create an account, you must agree to our{' '}
              <Text style={styles.linkText} onPress={() => Linking.openURL('https://ithoughtofyou.app/privacy')}>Privacy Policy</Text>
              {' '}and{' '}
              <Text style={styles.linkText} onPress={() => Linking.openURL('https://ithoughtofyou.app/terms')}>Terms of Service</Text>.
            </Text>
            <View style={styles.modalButtonRow}>
              <Pressable style={styles.modalButton} onPress={handleDeclinePolicy}>
                <Text style={styles.modalButtonText}>Decline</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, styles.acceptButton]} onPress={handleAcceptPolicy}>
                <Text style={[styles.modalButtonText, styles.acceptButtonText]}>Accept</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
    textAlign: 'center',
    marginTop: 32,
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
  socialContainer: {
    gap: 12,
    marginBottom: 20,
  },
  googleButton: {
    backgroundColor: '#4285f4',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3.84,
    elevation: 2,
  },
  googleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: headerFontFamily,
  },
  icloudButton: {
    backgroundColor: '#000',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3.84,
    elevation: 2,
  },
  icloudButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: headerFontFamily,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ece6da',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#b0a99f',
    fontSize: 14,
    fontFamily: headerFontFamily,
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#2c2c2c',
    borderWidth: 1,
    borderColor: '#ece6da',
    fontFamily: headerFontFamily,
    marginBottom: 14,
  },
  signupButton: {
    backgroundColor: '#3498db',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
    letterSpacing: 0.5,
  },
  backButton: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3498db',
    marginHorizontal: 24,
  },
  backButtonText: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: headerFontFamily,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#fff9ed',
    borderRadius: 16,
    padding: 28,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2c2c2c',
    textAlign: 'center',
    fontFamily: headerFontFamily,
  },
  modalText: {
    fontSize: 16,
    color: '#2c2c2c',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: headerFontFamily,
  },
  linkText: {
    color: '#3498db',
    textDecorationLine: 'underline',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 6,
    borderRadius: 8,
    backgroundColor: '#ece6da',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#2c2c2c',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: headerFontFamily,
  },
  acceptButton: {
    backgroundColor: '#3498db',
  },
  acceptButtonText: {
    color: '#fff',
  },
}); 