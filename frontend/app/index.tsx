import { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';

const GOLD = '#D4AF37';

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Animate logo entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate to home after 2.5 seconds
    const timer = setTimeout(() => {
      router.replace('/(tabs)/home');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Metallic A with Key Icon */}
        <View style={styles.logoWrapper}>
          <Text style={styles.logoText}>A</Text>
          <Ionicons 
            name="key" 
            size={40} 
            color={GOLD} 
            style={styles.keyIcon}
          />
        </View>
        
        <Text style={styles.brandText}>AIMLINK</Text>
        <Text style={styles.brandSubtext}>PROPERTY</Text>
        
        <View style={styles.sloganContainer}>
          <Text style={styles.slogan}>Real Estate, Real Direction</Text>
          <Text style={styles.tagline}>Connecting You to The Right Address</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 140,
    fontWeight: 'bold',
    color: GOLD,
    textShadowColor: 'rgba(212, 175, 55, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  keyIcon: {
    position: 'absolute',
    right: -10,
    top: 50,
    transform: [{ rotate: '-45deg' }],
    opacity: 0.9,
  },
  brandText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: GOLD,
    letterSpacing: 10,
    marginBottom: 8,
    textShadowColor: 'rgba(212, 175, 55, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  brandSubtext: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    letterSpacing: 3,
    marginBottom: 32,
  },
  sloganContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  slogan: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 6,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '400',
    color: '#999',
    fontStyle: 'italic',
  },
});
