import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform, Animated, Easing, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';

const { width } = Dimensions.get('window');

// --- DONNÉES DES PROTOCOLES ---
const ROUTINES = [
    {
        id: 'morning',
        title: 'NEURAL ACTIVATION',
        desc: 'Réveil musculaire et articulaire.',
        color: '#facc15', // Jaune
        duration: '5 min',
        exercises: [
            { name: 'Cervical Rotations', duration: 30, side: 'both' },
            { name: 'Shoulder Rolls', duration: 30, side: 'both' },
            { name: 'Cat-Cow Stretch', duration: 45, side: 'center' },
            { name: 'Torso Twists', duration: 45, side: 'alternating' },
            { name: 'Forward Fold', duration: 60, side: 'center' }
        ]
    },
    {
        id: 'post_workout',
        title: 'SYSTEM COOLDOWN',
        desc: 'Récupération après effort intense.',
        color: '#3b82f6', // Bleu
        duration: '8 min',
        exercises: [
            { name: 'Quad Stretch', duration: 45, side: 'left' },
            { name: 'Quad Stretch', duration: 45, side: 'right' },
            { name: 'Hamstring Stretch', duration: 45, side: 'left' },
            { name: 'Hamstring Stretch', duration: 45, side: 'right' },
            { name: 'Calf Stretch', duration: 30, side: 'left' },
            { name: 'Calf Stretch', duration: 30, side: 'right' },
            { name: 'Child’s Pose', duration: 60, side: 'center' }
        ]
    },
    {
        id: 'spine',
        title: 'SPINAL ALIGNMENT',
        desc: 'Décompression du dos (Bureau).',
        color: '#a855f7', // Violet
        duration: '6 min',
        exercises: [
            { name: 'Child’s Pose', duration: 60, side: 'center' },
            { name: 'Cobra Stretch', duration: 45, side: 'center' },
            { name: 'Spinal Twist', duration: 45, side: 'left' },
            { name: 'Spinal Twist', duration: 45, side: 'right' },
            { name: 'Dead Hang (Simulation)', duration: 60, side: 'center' }
        ]
    }
];

export default function StretchingScreen() {
  const router = useRouter();
  const theme = useTheme();
  
  // États
  const [activeRoutine, setActiveRoutine] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchHistory();
    return () => {
        stopSession();
    };
  }, []);

  // Animation de pulsation (Respiration visuelle)
  useEffect(() => {
      if (isPlaying && !isPaused) {
          Animated.loop(
              Animated.sequence([
                  Animated.timing(pulseAnim, { toValue: 1.2, duration: 3000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
                  Animated.timing(pulseAnim, { toValue: 1, duration: 3000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) })
              ])
          ).start();
      } else {
          pulseAnim.stopAnimation();
          pulseAnim.setValue(1);
      }
  }, [isPlaying, isPaused]);

  const fetchHistory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data } = await supabase
            .from('body_metrics')
            .select('date, value')
            .eq('user_id', session.user.id)
            .eq('type', 'stretching_minutes')
            .order('created_at', { ascending: false })
            .limit(5);

        if (data) setHistory(data);
      } catch (e) { console.log(e); }
  };

  const startRoutine = (routine: any) => {
      if (Platform.OS !== 'web') Haptics.selectionAsync();
      setActiveRoutine(routine);
      setCurrentExIndex(0);
      setTimeLeft(routine.exercises[0].duration);
      setIsPlaying(true);
      setIsPaused(false);
      
      runTimer();
  };

  const runTimer = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      
      timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
              if (prev <= 1) {
                  nextExercise();
                  return 0;
              }
              return prev - 1;
          });
      }, 1000);
  };

  const nextExercise = () => {
      if (!activeRoutine) return;

      if (currentExIndex < activeRoutine.exercises.length - 1) {
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          
          const nextIndex = currentExIndex + 1;
          setCurrentExIndex(nextIndex);
          setTimeLeft(activeRoutine.exercises[nextIndex].duration);
      } else {
          completeSession();
      }
  };

  const completeSession = async () => {
      stopSession();
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const totalSeconds = activeRoutine.exercises.reduce((acc:number, ex:any) => acc + ex.duration, 0);
      const totalMinutes = Math.round(totalSeconds / 60);

      try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
              await supabase.from('body_metrics').insert({
                  user_id: session.user.id,
                  type: 'stretching_minutes',
                  value: totalMinutes,
                  date: new Date().toISOString().split('T')[0]
              });
              fetchHistory();
          }
      } catch (e) { console.log(e); }
      
      setActiveRoutine(null);
  };

  const stopSession = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsPlaying(false);
      setIsPaused(false);
      setTimeLeft(0);
  };

  const togglePause = () => {
      if (isPaused) {
          setIsPaused(false);
          runTimer();
      } else {
          setIsPaused(true);
          if (timerRef.current) clearInterval(timerRef.current);
      }
  };

  // --- FONCTION VIDEO ---
  const openVideoDemo = (exerciseName: string) => {
      if (Platform.OS !== 'web') Haptics.selectionAsync();
      const query = encodeURIComponent(`${exerciseName} stretching exercise`);
      const url = `https://www.youtube.com/results?search_query=${query}`;
      Linking.openURL(url);
  };

  // --- RENDER ---
  const renderSession = () => {
      const currentEx = activeRoutine.exercises[currentExIndex];
      const progress = (currentExIndex / activeRoutine.exercises.length) * 100;

      return (
          <View style={styles.sessionContainer}>
              
              {/* Header */}
              <View style={styles.sessionHeader}>
                  <Text style={styles.sessionTitle}>{activeRoutine.title}</Text>
                  <View style={styles.progressTrack}>
                      <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: activeRoutine.color }]} />
                  </View>
              </View>

              {/* Visual */}
              <View style={styles.visualContainer}>
                  <Animated.View style={[
                      styles.pulseCircle, 
                      { 
                          borderColor: activeRoutine.color,
                          transform: [{ scale: pulseAnim }],
                          opacity: isPaused ? 0.3 : 1
                      }
                  ]} />
                  
                  <View style={[styles.timerCircle, { borderColor: activeRoutine.color }]}>
                      <Text style={styles.timerText}>{timeLeft}</Text>
                      <Text style={styles.timerUnit}>SEC</Text>
                  </View>
              </View>

              {/* Info */}
              <View style={styles.exInfo}>
                  <Text style={styles.exName}>{currentEx.name}</Text>
                  
                  {/* BOUTON DÉMO VIDÉO */}
                  <TouchableOpacity style={styles.demoBtn} onPress={() => openVideoDemo(currentEx.name)}>
                      <MaterialCommunityIcons name="youtube" size={20} color="#ef4444" />
                      <Text style={styles.demoText}>VOIR DÉMO</Text>
                  </TouchableOpacity>

                  <Text style={[styles.exSide, {color: activeRoutine.color}]}>
                      {currentEx.side === 'left' ? 'CÔTÉ GAUCHE' : currentEx.side === 'right' ? 'CÔTÉ DROIT' : 'CENTRÉ'}
                  </Text>
                  <Text style={styles.exNext}>
                      SUIVANT : {activeRoutine.exercises[currentExIndex + 1]?.name || "TERMINÉ"}
                  </Text>
              </View>

              {/* Controls */}
              <View style={styles.controlsRow}>
                  <TouchableOpacity onPress={stopSession} style={styles.controlBtnSmall}>
                      <MaterialCommunityIcons name="close" size={24} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity onPress={togglePause} style={[styles.controlBtnMain, { backgroundColor: activeRoutine.color }]}>
                      <MaterialCommunityIcons name={isPaused ? "play" : "pause"} size={32} color="#fff" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity onPress={nextExercise} style={styles.controlBtnSmall}>
                      <MaterialCommunityIcons name="skip-next" size={24} color={theme.colors.text} />
                  </TouchableOpacity>
              </View>
          </View>
      );
  };

  // --- STYLES DYNAMIQUES ---
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1 },
    
    auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
    blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.2 },
  
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    headerTitle: { color: theme.colors.text, fontWeight: 'bold', letterSpacing: 1 },
    
    content: { padding: 20 },

    // Menu
    sectionTitle: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 15, marginLeft: 5 },
    routineCard: { 
        marginBottom: 15, borderRadius: 20, overflow: 'hidden',
        borderWidth: 1, borderColor: theme.colors.border
    },
    routineGradient: { padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    routineInfo: { flex: 1 },
    routineTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '900', marginBottom: 4 },
    routineDesc: { color: theme.colors.textSecondary, fontSize: 12 },
    routineMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    metaBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginRight: 10 },
    metaText: { fontSize: 10, fontWeight: 'bold', color: '#000' },

    // Session
    sessionContainer: { flex: 1, padding: 20, justifyContent: 'space-between' },
    sessionHeader: { alignItems: 'center', marginBottom: 20 },
    sessionTitle: { color: theme.colors.text, fontSize: 14, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 },
    progressTrack: { width: '100%', height: 4, backgroundColor: theme.colors.border, borderRadius: 2 },
    progressBar: { height: '100%', borderRadius: 2 },

    visualContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', position: 'relative' },
    pulseCircle: { position: 'absolute', width: 280, height: 280, borderRadius: 140, borderWidth: 2, opacity: 0.5 },
    timerCircle: { 
        width: 220, height: 220, borderRadius: 110, 
        borderWidth: 4, 
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: theme.colors.glass,
        shadowColor: "#000", shadowOffset: {width:0, height:0}, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10
    },
    timerText: { fontSize: 64, fontWeight: '900', color: theme.colors.text, fontVariant: ['tabular-nums'] },
    timerUnit: { fontSize: 14, fontWeight: 'bold', color: theme.colors.textSecondary, marginTop: -5 },

    exInfo: { alignItems: 'center', marginBottom: 40 },
    exName: { fontSize: 24, fontWeight: '900', color: theme.colors.text, textAlign: 'center', marginBottom: 5 },
    exSide: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase', marginTop: 15 },
    exNext: { fontSize: 10, color: theme.colors.textSecondary, marginTop: 5 },

    // Demo Btn
    demoBtn: { 
        flexDirection: 'row', alignItems: 'center', 
        backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : '#fee2e2', 
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
        marginBottom: 5
    },
    demoText: { color: '#ef4444', fontWeight: 'bold', fontSize: 12, marginLeft: 6 },

    controlsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 30, marginBottom: 20 },
    controlBtnMain: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    controlBtnSmall: { width: 50, height: 50, borderRadius: 25, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },

    // History
    historyItem: { 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 15, backgroundColor: theme.colors.glass, borderRadius: 15, marginBottom: 10,
        borderWidth: 1, borderColor: theme.colors.border 
    },
    historyDate: { color: theme.colors.textSecondary, fontWeight: '600' },
    historyVal: { color: theme.colors.text, fontWeight: 'bold' }
  });

  if (isPlaying && activeRoutine) {
      return (
        <View style={styles.container}>
            <StatusBar style={theme.isDark ? "light" : "dark"} hidden />
            <SafeAreaView style={styles.safeArea}>
                {renderSession()}
            </SafeAreaView>
        </View>
      );
  }

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      
      {theme.isDark && (
        <View style={styles.auroraBg}>
            <View style={[styles.blob, { top: 100, right: -50, backgroundColor: 'rgba(45, 212, 191, 0.15)' }]} />
        </View>
      )}

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>ROUTINES SOUPLESSE</Text>
            <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            
            <Text style={styles.sectionTitle}>PROTOCOLES SYSTÈME</Text>
            
            {ROUTINES.map((routine) => (
                <TouchableOpacity 
                    key={routine.id} 
                    style={styles.routineCard}
                    activeOpacity={0.9}
                    onPress={() => startRoutine(routine)}
                >
                    <LinearGradient 
                        colors={[theme.colors.glass, theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.5)']}
                        style={styles.routineGradient}
                    >
                        <View style={styles.routineInfo}>
                            <Text style={styles.routineTitle}>{routine.title}</Text>
                            <Text style={styles.routineDesc}>{routine.desc}</Text>
                            <View style={styles.routineMeta}>
                                <View style={[styles.metaBadge, {backgroundColor: routine.color}]}>
                                    <Text style={styles.metaText}>{routine.duration}</Text>
                                </View>
                                <View style={[styles.metaBadge, {backgroundColor: theme.colors.border}]}>
                                    <Text style={[styles.metaText, {color: theme.colors.textSecondary}]}>
                                        {routine.exercises.length} EXOS
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <MaterialCommunityIcons name="play-circle" size={40} color={routine.color} />
                    </LinearGradient>
                </TouchableOpacity>
            ))}

            <Text style={[styles.sectionTitle, {marginTop: 20}]}>HISTORIQUE</Text>
            {history.length > 0 ? history.map((item, i) => (
                <View key={i} style={styles.historyItem}>
                    <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString()}</Text>
                    <Text style={styles.historyVal}>{item.value} min</Text>
                </View>
            )) : (
                <Text style={{color: theme.colors.textSecondary, fontStyle:'italic', marginLeft: 5}}>Aucune séance enregistrée.</Text>
            )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}