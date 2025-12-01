import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, TextInput, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useTheme } from '../../lib/theme';

const { width } = Dimensions.get('window');

type TimerMode = 'REST' | 'TABATA' | 'STOPWATCH';

export default function TimerScreen() {
  const router = useRouter();
  const theme = useTheme();
  
  // États Timer
  const [mode, setMode] = useState<TimerMode>('REST');
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90); 
  const [initialTime, setInitialTime] = useState(90);
  
  // États Tabata
  const [tabataState, setTabataState] = useState<'WORK' | 'REST'>('WORK');
  const [round, setRound] = useState(1);
  const [config, setConfig] = useState({ work: 20, rest: 10, rounds: 8 });

  // États Audio & Refs
  const [soundEnabled, setSoundEnabled] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const tickSoundRef = useRef<Audio.Sound | null>(null);
  const alarmSoundRef = useRef<Audio.Sound | null>(null);

  // --- 1. CHARGEMENT DES SONS ---
  useEffect(() => {
    loadSounds();
    return () => {
      unloadSounds();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const loadSounds = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      const { sound: tick } = await Audio.Sound.createAsync(
        require('../../assets/sounds/tick.mp3')
      );
      tickSoundRef.current = tick;

      const { sound: alarm } = await Audio.Sound.createAsync(
        require('../../assets/sounds/alarm.mp3')
      );
      alarmSoundRef.current = alarm;

    } catch (error) {
      console.log("Erreur chargement sons", error);
    }
  };

  const unloadSounds = async () => {
    if (tickSoundRef.current) await tickSoundRef.current.unloadAsync();
    if (alarmSoundRef.current) await alarmSoundRef.current.unloadAsync();
  };

  // --- CORRECTION AUDIO ICI ---
  const playSound = async (type: 'tick' | 'alarm') => {
    if (!soundEnabled) return;
    try {
      if (type === 'alarm') {
          // Si on lance l'alarme, on coupe net le tick précédent
          if (tickSoundRef.current) await tickSoundRef.current.stopAsync();
          const soundObj = alarmSoundRef.current;
          if (soundObj) await soundObj.replayAsync();
      } 
      else {
          // Si on lance un tick
          const soundObj = tickSoundRef.current;
          if (soundObj) await soundObj.replayAsync();
      }
    } catch (e) { console.log(e); }
  };

  const toggleSound = () => {
      if (Platform.OS !== 'web') Haptics.selectionAsync();
      setSoundEnabled(!soundEnabled);
  };

  // --- 2. COEUR DU TIMER ---
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (mode === 'STOPWATCH') {
            return prev + 1;
          } else {
            // On est forcément en REST ou TABATA ici
            const newValue = prev > 0 ? prev - 1 : 0;
            
            // Gestion des Bips (3, 2, 1)
            // SUPPRESSION DE : && mode !== 'STOPWATCH' (car c'est implicite ici)
            if (soundEnabled && newValue < 4 && newValue >= 0) {
                playSound('tick');
            }
            
            return newValue;
          }
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, mode, soundEnabled]);
   [isActive, mode, soundEnabled];

  // --- 3. TRANSITIONS ---
  useEffect(() => {
    if (timeLeft === 0 && isActive && mode !== 'STOPWATCH') {
        handleTimerComplete();
    }
  }, [timeLeft, isActive, mode]);

  const handleTimerComplete = () => {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      playSound('alarm'); 

      if (mode === 'REST') {
          setIsActive(false);
          setTimeLeft(initialTime); 
      } 
      else if (mode === 'TABATA') {
          if (tabataState === 'WORK') {
              if (round < config.rounds) {
                  setTabataState('REST');
                  setTimeLeft(config.rest);
              } else {
                  finishTabata();
              }
          } else {
              setTabataState('WORK');
              setRound(r => r + 1);
              setTimeLeft(config.work);
          }
      }
  };

  const finishTabata = () => {
      setIsActive(false);
      setTabataState('WORK');
      setRound(1);
      setTimeLeft(config.work);
      Alert.alert("BRAVO", "Session HIIT terminée ! 🔥");
  };

  // --- ACTIONS UI ---
  const toggleTimer = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsActive(false);
    
    if (mode === 'REST') setTimeLeft(initialTime);
    if (mode === 'STOPWATCH') setTimeLeft(0);
    
    if (mode === 'TABATA') {
        setTabataState('WORK');
        setRound(1);
        setTimeLeft(config.work);
    }
  };

  const switchMode = (newMode: TimerMode) => {
      setMode(newMode);
      setIsActive(false);
      if (newMode === 'REST') { setTimeLeft(90); setInitialTime(90); }
      if (newMode === 'TABATA') { setTimeLeft(config.work); setTabataState('WORK'); setRound(1); }
      if (newMode === 'STOPWATCH') { setTimeLeft(0); }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const adjustTime = (delta: number) => {
      if (Platform.OS !== 'web') Haptics.selectionAsync();
      const newVal = Math.max(0, timeLeft + delta);
      setTimeLeft(newVal);
      if (!isActive && mode === 'REST') setInitialTime(newVal);
  };

  const setRestPreset = (val: number) => {
      setInitialTime(val);
      setTimeLeft(val);
      setIsActive(false);
  };

  // --- STYLES ---
  const getTimerColors = () => {
      if (mode === 'TABATA') {
          if (tabataState === 'WORK') return [theme.colors.danger, '#991b1b'];
          return [theme.colors.success, '#166534'];
      }
      return [theme.colors.primary, theme.colors.secondary];
  };

  const getTimerLabel = () => {
      if (mode === 'STOPWATCH') return "TEMPS ÉCOULÉ";
      if (mode === 'REST') return isActive ? "RÉCUPÉRATION" : "PRÊT";
      if (tabataState === 'WORK') return "EFFORT MAXIMAL";
      return "RÉCUPÉRATION";
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1 },
    
    auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
    blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.2 },
  
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 10 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    headerTitle: { color: theme.colors.text, fontWeight: '900', letterSpacing: 2, fontSize: 14 },
    soundBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  
    tabsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 30, marginTop: 10 },
    tabBtn: { 
        paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, 
        backgroundColor: theme.colors.glass, 
        borderWidth: 1, borderColor: theme.colors.border 
    },
    tabBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    tabText: { color: theme.colors.textSecondary, fontWeight: 'bold', fontSize: 10 },
    tabTextActive: { color: '#fff' }, 
  
    content: { alignItems: 'center', paddingBottom: 50 },
  
    timerCircle: { 
        width: 250, height: 250, borderRadius: 125, 
        justifyContent: 'center', alignItems: 'center', 
        marginBottom: 30, marginTop: 20,
        shadowColor: mode === 'TABATA' && tabataState === 'WORK' ? theme.colors.danger : theme.colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: theme.isDark ? 0.5 : 0.3,
        shadowRadius: 20,
        elevation: 10
    },
    timerBorder: { width: '100%', height: '100%', borderRadius: 125, padding: 4, justifyContent: 'center', alignItems: 'center' },
    timerInner: { 
        width: '100%', height: '100%', borderRadius: 125, 
        backgroundColor: theme.colors.bg, 
        justifyContent: 'center', alignItems: 'center' 
    },
    timerText: { color: theme.colors.text, fontSize: 64, fontWeight: '900', fontVariant: ['tabular-nums'] },
    timerLabel: { color: theme.colors.textSecondary, fontSize: 12, letterSpacing: 2, marginTop: 5, fontWeight: 'bold' },
  
    controls: { flexDirection: 'row', alignItems: 'center', gap: 30, marginBottom: 40 },
    controlBtnMain: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden' },
    playGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    controlBtnSmall: { 
        width: 50, height: 50, borderRadius: 25, 
        backgroundColor: theme.colors.glass, 
        justifyContent: 'center', alignItems: 'center', 
        borderWidth: 1, borderColor: theme.colors.border 
    },
  
    presetsContainer: { flexDirection: 'row', gap: 10 },
    presetBtn: { 
        paddingVertical: 10, paddingHorizontal: 15, 
        backgroundColor: theme.colors.glass, 
        borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border 
    },
    presetText: { color: theme.colors.text, fontWeight: 'bold' },
  
    tabataInfo: { alignItems: 'center', marginBottom: 30 },
    roundText: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    configRow: { flexDirection: 'row', gap: 20 },
    configItem: { alignItems: 'center', backgroundColor: theme.colors.glass, padding: 10, borderRadius: 10, minWidth: 80, borderWidth: 1, borderColor: theme.colors.border },
    configLabel: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold' },
    configValue: { color: theme.colors.text, fontSize: 16, fontWeight: 'bold' },
  
    configCard: { 
        width: '90%', 
        backgroundColor: theme.colors.glass, 
        padding: 20, borderRadius: 20, 
        borderWidth: 1, borderColor: theme.colors.border,
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2
    },
    configTitle: { color: theme.colors.text, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    inputRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    inputLabel: { color: theme.colors.textSecondary, fontSize: 14 },
    input: { 
        backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : '#f0f0f0', 
        width: 80, padding: 8, borderRadius: 8, 
        color: theme.colors.text, textAlign: 'center', fontWeight: 'bold' 
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      
      {theme.isDark && (
        <View style={styles.auroraBg}>
            <View style={[styles.blob, { top: 100, left: -50, backgroundColor: 'rgba(255, 255, 255, 0.05)' }]} />
            <View style={[
                styles.blob, 
                { bottom: 0, right: -50, backgroundColor: mode === 'TABATA' ? 'rgba(255, 80, 80, 0.15)' : 'rgba(0, 243, 255, 0.15)' }
            ]} />
        </View>
      )}

      <SafeAreaView style={styles.safeArea}>
        
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>CHRONO TACTIQUE</Text>
            <TouchableOpacity onPress={toggleSound} style={styles.soundBtn}>
                <MaterialCommunityIcons 
                    name={soundEnabled ? "volume-high" : "volume-off"} 
                    size={24} 
                    color={soundEnabled ? theme.colors.primary : theme.colors.textSecondary} 
                />
            </TouchableOpacity>
        </View>

        <View style={styles.tabsContainer}>
            {['REST', 'TABATA', 'STOPWATCH'].map((m) => (
                <TouchableOpacity 
                    key={m} 
                    onPress={() => switchMode(m as TimerMode)}
                    style={[styles.tabBtn, mode === m && styles.tabBtnActive]}
                >
                    <Text style={[styles.tabText, mode === m && styles.tabTextActive]}>
                        {m === 'REST' ? 'REPOS' : m === 'STOPWATCH' ? 'CHRONO' : 'TABATA'}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>

        <ScrollView contentContainerStyle={styles.content}>
            
            <View style={styles.timerCircle}>
                <LinearGradient
                    colors={getTimerColors() as any}
                    style={styles.timerBorder}
                >
                    <View style={styles.timerInner}>
                        <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                        <Text style={styles.timerLabel}>{getTimerLabel()}</Text>
                    </View>
                </LinearGradient>
            </View>

            {/* INFO SUPP (TABATA) */}
            {mode === 'TABATA' && (
                <View style={styles.tabataInfo}>
                    <Text style={styles.roundText}>ROUND {round} / {config.rounds}</Text>
                    <View style={styles.configRow}>
                        <View style={styles.configItem}>
                            <Text style={styles.configLabel}>WORK</Text>
                            <Text style={styles.configValue}>{config.work}s</Text>
                        </View>
                        <View style={styles.configItem}>
                            <Text style={styles.configLabel}>REST</Text>
                            <Text style={styles.configValue}>{config.rest}s</Text>
                        </View>
                    </View>
                </View>
            )}

            {/* CONTROLES */}
            <View style={styles.controls}>
                <TouchableOpacity style={styles.controlBtnSmall} onPress={resetTimer}>
                    <MaterialCommunityIcons name="refresh" size={24} color={theme.colors.text} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.controlBtnMain} onPress={toggleTimer}>
                    <LinearGradient
                         colors={isActive ? [theme.colors.danger, '#990000'] : [theme.colors.success, '#166534']}
                         style={styles.playGradient}
                    >
                        <MaterialCommunityIcons name={isActive ? "pause" : "play"} size={32} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>

                {mode === 'REST' && (
                    <TouchableOpacity style={styles.controlBtnSmall} onPress={() => adjustTime(10)}>
                        <Text style={{color: theme.colors.text, fontWeight:'bold'}}>+10</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* PRESETS / CONFIG */}
            {mode === 'REST' && (
                <View style={styles.presetsContainer}>
                    {[30, 60, 90, 120, 180].map(sec => (
                        <TouchableOpacity key={sec} style={styles.presetBtn} onPress={() => setRestPreset(sec)}>
                            <Text style={styles.presetText}>{sec < 60 ? sec + 's' : (sec/60) + 'm'}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {mode === 'TABATA' && !isActive && (
                <View style={styles.configCard}>
                    <Text style={styles.configTitle}>CONFIGURATION HIIT</Text>
                    <View style={styles.inputRow}>
                        <Text style={styles.inputLabel}>Travail (s)</Text>
                        <TextInput 
                            style={styles.input} 
                            keyboardType="numeric" 
                            value={config.work.toString()}
                            onChangeText={t => setConfig(prev => ({...prev, work: parseInt(t)||0}))}
                        />
                    </View>
                    <View style={styles.inputRow}>
                        <Text style={styles.inputLabel}>Repos (s)</Text>
                        <TextInput 
                            style={styles.input} 
                            keyboardType="numeric" 
                            value={config.rest.toString()}
                            onChangeText={t => setConfig(prev => ({...prev, rest: parseInt(t)||0}))}
                        />
                    </View>
                    <View style={styles.inputRow}>
                        <Text style={styles.inputLabel}>Rounds</Text>
                        <TextInput 
                            style={styles.input} 
                            keyboardType="numeric" 
                            value={config.rounds.toString()}
                            onChangeText={t => setConfig(prev => ({...prev, rounds: parseInt(t)||0}))}
                        />
                    </View>
                </View>
            )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}