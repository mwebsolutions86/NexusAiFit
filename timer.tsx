import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

type TimerMode = 'REST' | 'TABATA' | 'STOPWATCH';

export default function TimerScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<TimerMode>('REST');
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); // en secondes
  const [initialTime, setInitialTime] = useState(0);
  
  // Pour Tabata
  const [tabataState, setTabataState] = useState<'WORK' | 'REST' | 'PREPA'>('PREPA');
  const [round, setRound] = useState(1);
  const [config, setConfig] = useState({ work: 20, rest: 10, rounds: 8 }); // Standard Tabata

  // Refs pour l'intervalle
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        if (mode === 'STOPWATCH') {
            setTimeLeft(prev => prev + 1);
        } else {
            // Modes décompte (Rest & Tabata)
            setTimeLeft(prev => {
                if (prev <= 1) {
                    handleTimerComplete();
                    return 0;
                }
                return prev - 1;
            });
        }
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, mode, tabataState]);

  const handleTimerComplete = () => {
      if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      if (mode === 'REST') {
          setIsActive(false);
          // Reset automatique au temps précédent pour la prochaine série
          setTimeLeft(initialTime);
      } 
      else if (mode === 'TABATA') {
          if (tabataState === 'WORK') {
              // Passage au Repos
              if (round < config.rounds) {
                  setTabataState('REST');
                  setTimeLeft(config.rest);
              } else {
                  // Fin du Tabata
                  setIsActive(false);
                  setTabataState('PREPA');
                  setRound(1);
                  setTimeLeft(config.work);
                  alert("SESSION TERMINÉE ! 🔥");
              }
          } else if (tabataState === 'REST') {
              // Passage au Travail
              setTabataState('WORK');
              setRound(r => r + 1);
              setTimeLeft(config.work);
          }
      }
  };

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
        setTabataState('PREPA');
        setRound(1);
        setTimeLeft(config.work);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // --- PRESETS REPOS ---
  const setRestTime = (seconds: number) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setInitialTime(seconds);
    setTimeLeft(seconds);
    setIsActive(false);
  };

  const adjustTime = (delta: number) => {
      if (Platform.OS !== 'web') Haptics.selectionAsync();
      setTimeLeft(prev => Math.max(0, prev + delta));
      if (!isActive && mode === 'REST') setInitialTime(prev => Math.max(0, prev + delta));
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* BACKGROUND */}
      <View style={styles.auroraBg}>
          <View style={[styles.blob, { top: 100, left: -50, backgroundColor: 'rgba(255, 255, 255, 0.05)' }]} />
          <View style={[styles.blob, { bottom: 0, right: -50, backgroundColor: mode === 'TABATA' ? 'rgba(255, 80, 80, 0.15)' : 'rgba(0, 243, 255, 0.15)' }]} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        
        {/* HEADER */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>CHRONO TACTIQUE</Text>
            <View style={{ width: 40 }} />
        </View>

        {/* TABS MODE */}
        <View style={styles.tabsContainer}>
            {['REST', 'TABATA', 'STOPWATCH'].map((m) => (
                <TouchableOpacity 
                    key={m} 
                    onPress={() => {
                        setMode(m as TimerMode);
                        setIsActive(false);
                        // Init values
                        if (m === 'REST') { setTimeLeft(90); setInitialTime(90); }
                        if (m === 'TABATA') { setTimeLeft(config.work); setTabataState('PREPA'); setRound(1); }
                        if (m === 'STOPWATCH') { setTimeLeft(0); }
                    }}
                    style={[styles.tabBtn, mode === m && styles.tabBtnActive]}
                >
                    <Text style={[styles.tabText, mode === m && styles.tabTextActive]}>
                        {m === 'REST' ? 'REPOS' : m === 'STOPWATCH' ? 'CHRONO' : 'TABATA'}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>

        <ScrollView contentContainerStyle={styles.content}>
            
            {/* VISUEL CENTRAL */}
            <View style={styles.timerCircle}>
                <LinearGradient
                    colors={
                        mode === 'TABATA' && tabataState === 'WORK' ? ['#ff4d4d', '#990000'] :
                        mode === 'TABATA' && tabataState === 'REST' ? ['#4ade80', '#22c55e'] :
                        ['#00f3ff', '#0066ff']
                    }
                    style={styles.timerBorder}
                >
                    <View style={styles.timerInner}>
                        <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                        <Text style={styles.timerLabel}>
                            {mode === 'REST' ? (isActive ? "RÉCUPÉRATION" : "PRÊT") :
                             mode === 'STOPWATCH' ? "TEMPS ÉCOULÉ" :
                             tabataState === 'WORK' ? "EFFORT MAXIMAL" : "RÉCUPÉRATION"}
                        </Text>
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

            {/* BOUTONS DE CONTROLE */}
            <View style={styles.controls}>
                <TouchableOpacity style={styles.controlBtnSmall} onPress={resetTimer}>
                    <MaterialCommunityIcons name="refresh" size={24} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.controlBtnMain} onPress={toggleTimer}>
                    <LinearGradient
                         colors={isActive ? ['#ff4d4d', '#990000'] : ['#4ade80', '#22c55e']}
                         style={styles.playGradient}
                    >
                        <MaterialCommunityIcons name={isActive ? "pause" : "play"} size={32} color="#000" />
                    </LinearGradient>
                </TouchableOpacity>

                {mode === 'REST' && (
                    <TouchableOpacity style={styles.controlBtnSmall} onPress={() => adjustTime(10)}>
                        <Text style={{color:'#fff', fontWeight:'bold'}}>+10</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* PRESETS (REPOS) */}
            {mode === 'REST' && (
                <View style={styles.presetsContainer}>
                    {[30, 60, 90, 120, 180].map(sec => (
                        <TouchableOpacity key={sec} style={styles.presetBtn} onPress={() => setRestTime(sec)}>
                            <Text style={styles.presetText}>{sec < 60 ? sec + 's' : (sec/60) + 'm'}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* CONFIG TABATA (Si inactif) */}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },
  auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
  blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.2 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontWeight: '900', letterSpacing: 2, fontSize: 14 },

  tabsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 30, marginTop: 10 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  tabBtnActive: { backgroundColor: '#fff', borderColor: '#fff' },
  tabText: { color: '#888', fontWeight: 'bold', fontSize: 10 },
  tabTextActive: { color: '#000' },

  content: { alignItems: 'center', paddingBottom: 50 },

  // Timer Circle
  timerCircle: { width: 250, height: 250, borderRadius: 125, justifyContent: 'center', alignItems: 'center', marginBottom: 30, marginTop: 20 },
  timerBorder: { width: '100%', height: '100%', borderRadius: 125, padding: 4, justifyContent: 'center', alignItems: 'center', shadowColor: "#00f3ff", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20 },
  timerInner: { width: '100%', height: '100%', borderRadius: 125, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  timerText: { color: '#fff', fontSize: 64, fontWeight: '900', fontVariant: ['tabular-nums'] },
  timerLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12, letterSpacing: 2, marginTop: 5, fontWeight: 'bold' },

  // Controls
  controls: { flexDirection: 'row', alignItems: 'center', gap: 30, marginBottom: 40 },
  controlBtnMain: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden' },
  playGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  controlBtnSmall: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

  // Presets
  presetsContainer: { flexDirection: 'row', gap: 10 },
  presetBtn: { paddingVertical: 10, paddingHorizontal: 15, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  presetText: { color: '#fff', fontWeight: 'bold' },

  // Tabata Info
  tabataInfo: { alignItems: 'center', marginBottom: 30 },
  roundText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  configRow: { flexDirection: 'row', gap: 20 },
  configItem: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 10, minWidth: 80 },
  configLabel: { color: '#888', fontSize: 10, fontWeight: 'bold' },
  configValue: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // Config Card
  configCard: { width: '90%', backgroundColor: 'rgba(20,20,30,0.6)', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  configTitle: { color: '#fff', fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  inputLabel: { color: '#ccc', fontSize: 14 },
  input: { backgroundColor: 'rgba(255,255,255,0.1)', width: 80, padding: 8, borderRadius: 8, color: '#fff', textAlign: 'center', fontWeight: 'bold' },
});