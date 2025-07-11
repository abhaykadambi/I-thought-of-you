import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function OnboardingScreen({ navigation }) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to I Thought of You</Text>
        
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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  content: {
    padding: 20,
    paddingTop: 60
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#2c3e50'
  },
  featureContainer: {
    marginBottom: 30,
    paddingHorizontal: 10
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    color: '#2c3e50'
  },
  featureText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#7f8c8d'
  },
  buttonContainer: {
    marginTop: 20,
    gap: 15
  },
  primaryButton: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600'
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3498db'
  },
  secondaryButtonText: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: '600'
  }
}); 