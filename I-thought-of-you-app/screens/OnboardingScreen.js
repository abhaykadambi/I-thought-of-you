import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Platform } from 'react-native';

const globalBackground = '#f8f5ee';
const cardBackground = '#fff9ed';
const headerFontFamily = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function OnboardingScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.cardWrapper}>
        <View style={styles.card}>
          <Text style={styles.title}>I Thought of You</Text>

          <View style={styles.featureContainer}>
            <Text style={styles.featureTitle}>✨ Share Your Thoughts</Text>
            <Text style={styles.featureText}>
              Capture those moments when you think of someone special and share them instantly.
            </Text>
          </View>

          <View style={styles.featureContainer}>
            <Text style={styles.featureTitle}>👥 Connect with Friends</Text>
            <Text style={styles.featureText}>
              Build meaningful connections by sharing thoughtful moments with your friends.
            </Text>
          </View>

          <View style={styles.featureContainer}>
            <Text style={styles.featureTitle}>💭 Meaningful Interactions</Text>
            <Text style={styles.featureText}>
              Create deeper relationships through thoughtful, spontaneous sharing.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.secondaryButtonText}>Back to Welcome</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.websiteLink}
            onPress={() => Linking.openURL('https://ithoughtofyou.app')}
          >
            <Text style={styles.websiteLinkText}>Visit our website for more information</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: globalBackground,
  },
  cardWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  card: {
    backgroundColor: cardBackground,
    borderRadius: 16,
    padding: 28,
    marginHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    width: '100%',
    maxWidth: 420,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
    color: '#2c2c2c',
    letterSpacing: 0.5,
  },
  featureContainer: {
    marginBottom: 24,
    paddingHorizontal: 2,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2c2c2c',
    fontFamily: headerFontFamily,
  },
  featureText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#7f8c8d',
    fontFamily: headerFontFamily,
  },
  buttonContainer: {
    marginTop: 10,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#4a7cff',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#4a7cff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 0,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4a7cff',
    marginTop: 0,
  },
  secondaryButtonText: {
    color: '#4a7cff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: headerFontFamily,
    letterSpacing: 0.5,
  },
  websiteLink: {
    marginTop: 28,
    alignItems: 'center',
  },
  websiteLinkText: {
    color: '#2980b9',
    fontSize: 16,
    textDecorationLine: 'underline',
    fontWeight: '500',
    fontFamily: headerFontFamily,
  },
}); 