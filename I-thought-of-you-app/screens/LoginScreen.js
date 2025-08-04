import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Platform, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { authAPI } from '../services/api';
import notificationService from '../services/notificationService';

const globalBackground = '#f8f5ee';
const cardBackground = '#fff9ed';
const headerFontFamily = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [appleLoading, setAppleLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      await authAPI.login({ email, password });
      
      // Check and request notification permissions if not already granted
      try {
        const permissionStatus = await notificationService.checkPermissionStatus();
        if (permissionStatus !== 'granted') {
          console.log('Requesting notification permissions for existing user...');
          await notificationService.requestPermissions();
        } else {
          console.log('Notification permissions already granted for existing user');
        }
      } catch (notificationError) {
        console.error('Error handling notification permissions:', notificationError);
        // Don't fail the login if notification permission request fails
      }
      
      navigation.navigate('MainApp');
    } catch (error) {
      Alert.alert('Login Failed', error.response?.data?.error || 'Login failed. Please try again.');
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setAppleLoading(true);
      
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Send to backend
      const response = await authAPI.appleSignIn(
        credential.identityToken,
        credential.fullName,
        credential.email
      );

      if (response.isNewUser) {
        // New user - redirect to signup to complete profile
        Alert.alert(
          'New User',
          'Please complete your profile setup on the signup screen.',
          [{ text: 'OK', onPress: () => navigation.navigate('Signup') }]
        );
      } else {
        // Existing user - proceed to main app
        try {
          const permissionStatus = await notificationService.checkPermissionStatus();
          if (permissionStatus !== 'granted') {
            console.log('Requesting notification permissions for Apple Sign-In user...');
            await notificationService.requestPermissions();
          } else {
            console.log('Notification permissions already granted for Apple Sign-In user');
          }
        } catch (notificationError) {
          console.error('Error handling notification permissions:', notificationError);
        }
        navigation.navigate('MainApp');
      }
    } catch (error) {
      if (error.code === 'ERR_CANCELED') {
        // User cancelled Apple Sign-In
        console.log('Apple Sign-In cancelled');
      } else {
        console.error('Apple Sign-In error:', error);
        Alert.alert('Apple Sign-In Failed', 'Please try again or use email login.');
      }
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>
      <View style={styles.card}>
        {/* Remove Social Login Buttons and Divider */}
        {/* Email/Password Form */}
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
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Apple Sign-In Button */}
        {AppleAuthentication.isAvailableAsync && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={12}
            style={styles.appleButton}
            onPress={handleAppleSignIn}
            disabled={appleLoading}
          />
        )}

        <TouchableOpacity style={styles.forgotPasswordButton} onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.signupButton} onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.signupButtonText}>Create Account</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })}
      >
        <Text style={styles.backButtonText}>Back to Welcome</Text>
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
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ece6da',
    fontSize: 16,
    fontFamily: headerFontFamily,
    color: '#2c2c2c',
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: '#4a7cff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#4a7cff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
    opacity: 1,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
    letterSpacing: 0.5,
  },
  signupButton: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4a7cff',
    marginTop: 8,
  },
  signupButtonText: {
    color: '#4a7cff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
    letterSpacing: 0.5,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 10,
  },
  backButtonText: {
    color: '#b0a99f',
    fontSize: 16,
    fontFamily: headerFontFamily,
  },
  forgotPasswordButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  forgotPasswordText: {
    color: '#4a7cff',
    fontSize: 14,
    fontFamily: headerFontFamily,
  },
  appleButton: {
    height: 50,
    width: '100%',
  },
}); 