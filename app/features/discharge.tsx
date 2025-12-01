import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useKeepAwake } from 'expo-keep-awake';
import { useTheme } from '../../lib/theme';

const { width } = Dimensions.get('window');

const MODES = [
    { id: 'gamma', name: 'GAMMA (Reset)', freq: '40Hz', desc: 'Décharge rapide, reset mental.', color: '#f43f5e', speed: 500 },
    { id: 'alpha', name: 'ALPHA (Calme)', freq: '10Hz', desc: 'Relaxation après le travail.', color: '#3b82f6', speed: 2000 },
    { id: 'theta', name: 'THETA (Sleep)', freq: '4Hz', desc: 'Induction du sommeil profond.', color: '#8b5cf6', speed: 4000 },
];

export default function DischargeScreen() {
  const router = useRouter();
  const theme = useTheme();
  useKeepAwake();

  const [activeMode, setActiveMode] = useState(MODES[1]); // Alpha par défaut
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 min par défaut
  const [history, setHistory] = useState<any[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Animations
  const animValues = useRef([...Array(3)].map(() => new Animated.Value(0))).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const MODULE_COLOR = '#94a3b8'; 
  const DISCHARGE_GRADIENT: [string, string] = ['#475569', '#94a3b8'];

  useEffect(() => {
    fetchHistory();
    // Nettoyage à la sortie
    return () => {
        stopSession();
    };
  }, []);

  // Animation Hypnotique
  useEffect(() => {
      if (isRunning) {
          const animations = animValues.map((anim, i) => {
              return Animated.loop(
                  Animated.sequence([
                      Animated.timing(anim, { 
                          toValue: 1, 
                          duration: activeMode.speed, 
                          easing: Easing.out(Easing.ease), 
                          useNativeDriver: false 
                      }),
                      Animated.timing(anim, { 
                          toValue: 0, 
                          duration: 0, 
                          useNativeDriver: false 
                      })
                  ])
              );
          });

          Animated.stagger(activeMode.speed / 3, animations).start();
      } else {
          animValues.forEach(anim => {
              anim.stopAnimation();
              anim.setValue(0);
          });
      }
  }, [isRunning, activeMode]);

  const fetchHistory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data } = await supabase
            .from('body_metrics')
            .select('date, value')
            .eq('user_id', session.user.id)
            .eq('type', 'discharge_minutes')
            .order('created_at', { ascending: false })
            .limit(5);

        if (data) setHistory(data);
      } catch (e) { console.log(e); }
  };

  const toggleSession = async () => {
      if (isRunning) {
          stopSession();
      } else {
          startSession();
      }
  };

  const startSession = async () => {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setIsRunning(true);
      
      // Lecture Audio Native (Sans accélération)
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, shouldDuckAndroid: true });
        
        let source;
        // Sélection du fichier son spécifique selon le mode
        switch (activeMode.id) {
            case 'gamma':
                source = require('../../assets/sounds/gamma.mp3'); // Assurez-vous d'avoir ce fichier
                break;
            case 'alpha':
                source = require('../../assets/sounds/alpha.mp3'); // Assurez-vous d'avoir ce fichier
                break;
            case 'theta':
                source = require('../../assets/sounds/theta.mp3'); // Assurez-vous d'avoir ce fichier
                break;
            default:
                source = require('../../assets/sounds/alpha.mp3');
        }

        const { sound: newSound } = await Audio.Sound.createAsync(source, { isLooping: true });
        
        setSound(newSound);
        await newSound.playAsync();
      } catch (e) {
          console.log("Erreur lecture audio (fichier manquant ?)", e);
      }

      timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
              if (prev <= 1) {
                  completeSession();
                  return 0;
              }
              return prev - 1;
          });
      }, 1000);
  };

  const stopSession = async () => {
      setIsRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
      
      // Arrêt propre du son
      if (sound) {
          try {
            await sound.stopAsync();
            await sound.unloadAsync();
          } catch(e) {}
          setSound(null);
      }
  };

  const completeSession = async () => {
      stopSession();
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
              await supabase.from('body_metrics').insert({
                  user_id: session.user.id,
                  type: 'discharge_minutes',
                  value: 5, 
                  date: new Date().toISOString().split('T')[0]
              });
              fetchHistory();
          }
      } catch (e) { console.log(e); }
  };

  const formatTime = (s: number) => {
      const min = Math.floor(s / 60);
      const sec = s % 60;
      return `${min}:${sec < 10 ? '0'+sec : sec}`;
  };

  // --- STYLES ---
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1 },
    
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    headerTitle: { color: theme.colors.text, fontWeight: 'bold', letterSpacing: 1 },

    content: { flex: 1, justifyContent: 'space-between', padding: 20 },

    // Visual Tunnel
    visualContainer: { alignItems: 'center', justifyContent: 'center', height: 350, position: 'relative' },
    
    tunnelCircle: {
        position: 'absolute', 
        borderRadius: 150, borderWidth: 2, borderColor: activeMode.color,
        opacity: 0.5
    },
    
    centerCore: {
        width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff',
        shadowColor: "#fff", shadowOpacity: 0.8, shadowRadius: 10, elevation: 10,
        zIndex: 10
    },

    timerText: { 
        position: 'absolute', bottom: 20,
        fontSize: 32, fontWeight: '900', color: theme.colors.text, 
        letterSpacing: 2, fontVariant: ['tabular-nums'] 
    },

    // Modes
    modesContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    modeCard: { 
        flex: 1, marginHorizontal: 5, padding: 15, borderRadius: 16, 
        backgroundColor: theme.colors.glass, borderWidth: 1, borderColor: theme.colors.border,
        alignItems: 'center'
    },
    modeActive: { borderColor: '#fff', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9' },
    modeTitle: { fontSize: 12, fontWeight: '900', color: theme.colors.text, marginBottom: 5 },
    modeFreq: { fontSize: 10, fontWeight: 'bold', color: theme.colors.textSecondary },

    descText: { textAlign: 'center', color: theme.colors.textSecondary, fontSize: 12, marginBottom: 20, fontStyle: 'italic' },

    startBtn: { borderRadius: 20, overflow: 'hidden', width: '100%' },
    btnGradient: { padding: 20, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: '900', fontSize: 18, letterSpacing: 1 },
    
    // History
    historyContainer: { marginTop: 20 },
    sectionTitle: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold', marginBottom: 10 },
    historyItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    historyDate: { color: theme.colors.textSecondary },
    historyVal: { color: theme.colors.text, fontWeight: 'bold' }
  });

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>NEURO-DÉCHARGE</Text>
            <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
            
            <View style={styles.visualContainer}>
                {/* Cercles animés */}
                {animValues.map((anim, i) => (
                    <Animated.View 
                        key={i}
                        style={[
                            styles.tunnelCircle,
                            {
                                width: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 300] }),
                                height: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 300] }),
                                opacity: anim.interpolate({ inputRange: [0, 0.8, 1], outputRange: [0.8, 0.2, 0] }),
                                borderWidth: anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] })
                            }
                        ]}
                    />
                ))}
                <View style={styles.centerCore} />
                <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
            </View>

            <View>
                <Text style={styles.descText}>{activeMode.desc}</Text>

                <View pointerEvents={isRunning ? 'none' : 'auto'} style={styles.modesContainer}>
                    {MODES.map((m) => (
                        <TouchableOpacity 
                            key={m.id} 
                            style={[styles.modeCard, activeMode.id === m.id && styles.modeActive, {borderColor: activeMode.id === m.id ? m.color : theme.colors.border}]}
                            onPress={() => {
                                setActiveMode(m);
                                if(Platform.OS!=='web') Haptics.selectionAsync();
                            }}
                        >
                            <Text style={[styles.modeTitle, {color: activeMode.id === m.id ? m.color : theme.colors.text}]}>{m.name}</Text>
                            <Text style={styles.modeFreq}>{m.freq}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.startBtn} onPress={toggleSession}>
                    <LinearGradient 
                        colors={isRunning ? [theme.colors.danger, '#991b1b'] : DISCHARGE_GRADIENT} 
                        start={{x:0, y:0}} end={{x:1, y:0}} 
                        style={styles.btnGradient}
                    >
                        <Text style={styles.btnText}>{isRunning ? "ARRÊTER SESSION" : "INITIER DÉCHARGE"}</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <View style={styles.historyContainer}>
                    <Text style={styles.sectionTitle}>DERNIÈRES SESSIONS</Text>
                    {history.map((item, i) => (
                        <View key={i} style={styles.historyItem}>
                            <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString()}</Text>
                            <Text style={styles.historyVal}>Terminé</Text>
                        </View>
                    ))}
                </View>
            </View>

        </View>
      </SafeAreaView>
    </View>
  );
}