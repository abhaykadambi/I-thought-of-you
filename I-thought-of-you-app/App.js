import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, Platform, ActivityIndicator, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import WelcomeScreen from './screens/WelcomeScreen';
import LoginScreen from './screens/LoginScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import ComposeThoughtScreen from './screens/ComposeThoughtScreen';
import FriendsListScreen from './screens/FriendsListScreen';
import ProfileScreen from './screens/ProfileScreen';
import FeedScreen from './screens/FeedScreen';
import SettingsScreen from './screens/SettingsScreen';
import AccountScreen from './screens/AccountScreen';
import PrivacyScreen from './screens/PrivacyScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import ThoughtDetailOverlay from './screens/ThoughtDetailOverlay';
import FriendProfileScreen from './screens/FriendProfileScreen';
import AddFriendOverlay from './screens/AddFriendOverlay';
import SignupScreen from './screens/SignupScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import EnterOTPAndResetScreen from './screens/EnterOTPAndResetScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import AdminModerationScreen from './screens/AdminModerationScreen';
import { authAPI } from './services/api';
import notificationService from './services/notificationService';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const globalBackground = '#f8f5ee'; // soft cream
const headerFontFamily = Platform.OS === 'ios' ? 'Georgia' : 'serif';

// Main App with Bottom Tabs
function MainApp({ navigation }) {
  // Set up notification listener with navigation
  React.useEffect(() => {
    const cleanup = notificationService.setupNotificationListener(navigation);
    return cleanup;
  }, [navigation]);

  // Periodic authentication check
  React.useEffect(() => {
    const checkAuthInterval = setInterval(async () => {
      try {
        const isValid = await authAPI.validateToken();
        if (!isValid) {
          console.log('🔄 Token validation failed, redirecting to welcome screen');
          // Clear stored auth data
          await authAPI.logout();
          // Navigate to welcome screen
          navigation.reset({
            index: 0,
            routes: [{ name: 'Welcome' }],
          });
        }
      } catch (error) {
        console.error('💥 Error during periodic auth check:', error);
        // On error, redirect to welcome screen to be safe
        await authAPI.logout();
        navigation.reset({
          index: 0,
          routes: [{ name: 'Welcome' }],
        });
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkAuthInterval);
  }, [navigation]);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3498db',
        tabBarInactiveTintColor: '#7f8c8d',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: 15,
          paddingTop: 10,
          height: 80,
          position: 'absolute',
          bottom: 20,
          left: 0,
          right: 0,
          marginHorizontal: 20,
          borderRadius: 15,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen 
        name="Feed" 
        component={FeedScreen}
        options={{
          tabBarLabel: 'Feed',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>📱</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Compose" 
        component={ComposeThoughtScreen}
        options={{
          tabBarLabel: 'Compose',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>✏️</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Friends" 
        component={FriendsListScreen}
        options={{
          tabBarLabel: 'Friends',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>👥</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing app...');
        
        // Check if user is logged in with token validation
        const loggedIn = await authAPI.isLoggedIn();
        console.log('🔐 Authentication check result:', loggedIn);
        
        setInitialRoute(loggedIn ? 'MainApp' : 'Welcome');
        
        // Request notification permissions if user is logged in
        if (loggedIn) {
          console.log('🔔 User is logged in, checking notification setup...');
          
          // Small delay to ensure app is fully loaded
          setTimeout(async () => {
            try {
              console.log('🔔 Checking notification setup...');
              const setupComplete = await notificationService.isNotificationSetupComplete();
              
              if (!setupComplete.complete) {
                console.log('⚠️ Notification setup incomplete:', setupComplete.reason);
                // Prompt user to enable notifications
                await notificationService.promptForNotificationsIfNeeded();
              } else {
                console.log('✅ Notification system is properly set up');
              }
            } catch (error) {
              console.error('💥 Error checking notification setup:', error);
              // Don't fail the app if notifications fail
            }
          }, 1000);
        } else {
          console.log('ℹ️ User not logged in, skipping notification setup');
        }
      } catch (error) {
        console.error('💥 Error during app initialization:', error);
        // If there's an error during auth check, default to welcome screen
        console.log('🔄 Redirecting to welcome screen due to auth error');
        setInitialRoute('Welcome');
      } finally {
        setAppIsReady(true);
        console.log('✅ App initialization complete');
        // Hide the splash screen
        await SplashScreen.hideAsync();
      }
    };
    initializeApp();
  }, []);

  // Handle deep linking for password reset
  const linking = {
    prefixes: ['ithoughtofyou://'],
    config: {
      screens: {
        ResetPassword: {
          path: 'reset',
          parse: {
            token: (token) => token,
          },
        },
      },
    },
  };

  if (!appIsReady || initialRoute === null) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>I thought of you...</Text>
        <ActivityIndicator size="large" color="#4a7cff" style={styles.loadingSpinner} />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator 
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="EnterOTPAndReset" component={EnterOTPAndResetScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="MainApp" component={MainApp} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Account" component={AccountScreen} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="ThoughtDetailOverlay" component={ThoughtDetailOverlay} options={{ presentation: 'modal' }} />
        <Stack.Screen name="FriendProfile" component={FriendProfileScreen} />
        <Stack.Screen name="AddFriendOverlay" component={AddFriendOverlay} options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="AdminModeration" component={AdminModerationScreen} />
      </Stack.Navigator>
      <StatusBar style="dark" backgroundColor={globalBackground} />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: globalBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: globalBackground,
  },
  loadingText: {
    fontSize: 18,
    color: '#4a7cff',
    marginBottom: 20,
    fontFamily: headerFontFamily,
    fontWeight: '500',
  },
  loadingSpinner: {
    marginTop: 10,
  },
});
