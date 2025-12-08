import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence, 
  FadeIn,
  FadeInDown
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '../lib/supabase'; // ✅ IMPORT CRUCIAL

const { width } = Dimensions.get('window');

// --- COMPOSANT : GLITCH TEXT ---
const GlitchText = ({ text, style }: { text: string, style?: any }) => {
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.9) { 
        if (process.env.EXPO_OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        translateX.value = withSequence(
          withTiming(-5, { duration: 50 }),
          withTiming(5, { duration: 50 }),
          withTiming(0, { duration: 50 })
        );
        opacity.value = withSequence(
          withTiming(0.5, { duration: 50 }),
          withTiming(1, { duration: 50 })
        );
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }]
  }));

  return (
    <Animated.Text style={[style, animatedStyle]}>
      {text}
    </Animated.Text>
  );
};

// --- COMPOSANT : BOUTON PULSANT ---
const PulseButton = ({ onPress }: { onPress: () => void }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          if (process.env.EXPO_OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onPress();
        }}
        style={styles.buttonContainer}
      >
        <LinearGradient
          colors={['#00f3ff', '#0066ff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.buttonGradient}
        >
          <Text style={styles.buttonText}>INITIALISER LE SYSTÈME</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function LandingScreen() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true); // État de vérification

  // --- LOGIQUE AUTO-LOGIN ---
  useEffect(() => {
    const checkSession = async () => {
        try {
            // On vérifie si une session est stockée dans le téléphone
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session) {
                console.log("⚡ [AUTO-LOGIN] Session trouvée, redirection Dashboard...");
                // Redirection directe vers le Dashboard
                router.replace('/(tabs)/dashboard');
            } else {
                // Pas de session, on affiche la Landing Page
                setIsChecking(false);
            }
        } catch (e) {
            console.error("Erreur check session:", e);
            setIsChecking(false);
        }
    };

    checkSession();
  }, []);

  const handleEnter = () => {
    router.replace('/auth');
  };

  // PENDANT LA VÉRIFICATION (Écran Noir ou Loader minimaliste)
  if (isChecking) {
      return (
          <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
              <StatusBar style="light" />
              <ActivityIndicator size="large" color="#00f3ff" />
          </View>
      );
  }

  // AFFICHAGE NORMAL (Si pas connecté)
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <LinearGradient
        colors={['#050505', '#0a0a12', '#001a33']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={[styles.glowBlob, { top: -100, left: -50, backgroundColor: '#00f3ff', opacity: 0.15 }]} />
      <View style={[styles.glowBlob, { bottom: -100, right: -50, backgroundColor: '#0066ff', opacity: 0.15 }]} />

      <View style={styles.content}>
        
        <View style={styles.titleContainer}>
          <Animated.View entering={FadeInDown.duration(1000).springify()}>
            <Text style={styles.subtitle}>PROTOCOLE v2.0</Text>
          </Animated.View>
          
          <GlitchText text="NEXUS" style={styles.titleMain} />
          <GlitchText text="AI FIT" style={styles.titleSub} />
          
          <Animated.View 
            entering={FadeIn.delay(500).duration(1000)}
            style={styles.divider}
          />
          
          <Animated.Text 
            entering={FadeIn.delay(800).duration(1000)}
            style={styles.description}
          >
            L'architecture de votre potentiel humain.{"\n"}
            Optimisée par l'Intelligence Artificielle.
          </Animated.Text>
        </View>

        <Animated.View 
          entering={FadeInDown.delay(1200).springify()}
          style={styles.footer}
        >
          <PulseButton onPress={handleEnter} />
          
          <Text style={styles.version}>
            SYSTEM STATUS: <Text style={{color: '#00f3ff'}}>ONLINE</Text>
          </Text>
        </Animated.View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  glowBlob: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width / 2,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 30,
    paddingTop: 100,
    paddingBottom: 60,
  },
  titleContainer: {
    alignItems: 'center', 
  },
  subtitle: {
    color: 'rgba(0, 243, 255, 0.6)',
    fontSize: 12,
    letterSpacing: 4,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  titleMain: {
    fontSize: 62,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -2,
    textShadowColor: 'rgba(0, 243, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  titleSub: {
    fontSize: 62,
    fontWeight: '300', 
    color: '#fff',
    letterSpacing: -2,
    marginTop: -15, 
  },
  divider: {
    width: 40,
    height: 4,
    backgroundColor: '#00f3ff',
    borderRadius: 2,
    marginTop: 30,
    marginBottom: 30,
  },
  description: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: 'center',
    gap: 20,
  },
  buttonContainer: {
    width: '100%',
    shadowColor: "#00f3ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
  },
  version: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    letterSpacing: 1,
  },
});