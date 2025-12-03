import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform, Animated, Easing } from 'react-native';
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
import { useTranslation } from 'react-i18next'; // Import

const { width } = Dimensions.get('window');

export default function MeditationScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation(); // Hook
  useKeepAwake(); 

  // DÉPLACÉ À L'INTÉRIEUR POUR LA TRADUCTION
  const DURATIONS = [
    { id: 5, label: '5 MIN', val: 5 },
    { id: 10, label: '10 MIN', val: 10 },
    { id: 20, label: '20 MIN', val: 20 },
    { id: 30, label: '30 MIN', val: 30 },
  ];

  const AMBIANCES = [
    { id: 'silence', name: t('modules.meditation.sounds.silence'), icon: 'volume-off' },
    { id: 'rain', name: t('modules.meditation.sounds.rain'), icon: 'weather-rainy' },
    { id: 'waves', name: t('modules.meditation.sounds.waves'), icon: 'waves' },
    { id: 'forest', name: t('modules.meditation.sounds.forest'), icon: 'pine-tree' },
  ];

  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(10); 
  const [timeLeft, setTimeLeft] = useState(10 * 60);
  const [selectedAmbiance, setSelectedAmbiance] = useState('silence');
  
  const [history, setHistory] = useState<any[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const breatheAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<any>(null);
  const MODULE_COLOR = '#8b5cf6'; 
  const ZEN_GRADIENT: [string, string] = ['#8b5cf6', '#a78bfa'];

  useEffect(() => {
    fetchHistory();
    return () => { stopSession(); };
  }, []);

  useEffect(() => {
      if (isPlaying) {
          Animated.loop(
              Animated.sequence([
                  Animated.timing(breatheAnim, { toValue: 1.5, duration: 6000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
                  Animated.timing(breatheAnim, { toValue: 1, duration: 6000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) })
              ])
          ).start();
      } else {
          breatheAnim.stopAnimation();
          Animated.timing(breatheAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
      }
  }, [isPlaying]);

  const fetchHistory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data } = await supabase.from('body_metrics').select('date, value').eq('user_id', session.user.id).eq('type', 'meditation_minutes').order('created_at', { ascending: false }).limit(5);
        if (data) setHistory(data);
      } catch (e) { console.log(e); }
  };

  const loadSound = async (ambiance: string) => {
      if (sound) { await sound.unloadAsync(); setSound(null); }
      if (ambiance === 'silence') return;
      try {
          await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, shouldDuckAndroid: true });
          let source;
          switch (ambiance) {
              case 'rain': source = require('../../assets/sounds/rain.mp3'); break;
              case 'waves': source = require('../../assets/sounds/waves.mp3'); break;
              case 'forest': source = require('../../assets/sounds/forest.mp3'); break;
              default: return;
          }
          const { sound: newSound } = await Audio.Sound.createAsync(source, { isLooping: true });
          setSound(newSound);
          if (isPlaying) await newSound.playAsync();
      } catch (e) { console.log("Erreur son:", e); }
  };

  const startSession = async () => {
      if (Platform.OS !== 'web') Haptics.selectionAsync();
      setIsPlaying(true);
      if (sound) await sound.playAsync();
      timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
              if (prev <= 1) { completeSession(); return 0; }
              return prev - 1;
          });
      }, 1000);
  };

  const pauseSession = async () => {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsPlaying(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (sound) await sound.pauseAsync();
  };

  const stopSession = async () => {
      setIsPlaying(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (sound) await sound.stopAsync();
      setTimeLeft(selectedDuration * 60);
  };

  const completeSession = async () => {
      stopSession();
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await supabase.from('body_metrics').insert({ user_id: session.user.id, type: 'meditation_minutes', value: selectedDuration, date: new Date().toISOString().split('T')[0] });
            fetchHistory();
        }
      } catch (e) { console.log(e); }
  };

  const changeDuration = (min: number) => {
      if (isPlaying) return;
      setSelectedDuration(min);
      setTimeLeft(min * 60);
  };

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s < 10 ? '0'+s : s}`;
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1 },
    auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
    blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.2 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    headerTitle: { color: theme.colors.text, fontWeight: 'bold', letterSpacing: 1 },
    content: { flex: 1, justifyContent: 'space-around', padding: 20 },
    visualContainer: { alignItems: 'center', justifyContent: 'center', height: 300 },
    outerCircle: { position: 'absolute', width: 280, height: 280, borderRadius: 140, borderWidth: 1, borderColor: theme.colors.border, opacity: 0.3 },
    haloCircle: { width: 150, height: 150, borderRadius: 75, backgroundColor: MODULE_COLOR, opacity: 0.4 },
    timerText: { position: 'absolute', fontSize: 48, fontWeight: '100', color: theme.colors.text, letterSpacing: 2, fontVariant: ['tabular-nums'] },
    configContainer: { opacity: isPlaying ? 0.3 : 1 },
    sectionTitle: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 10, textAlign: 'center' },
    row: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 25 },
    optionBtn: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, backgroundColor: theme.colors.glass, borderWidth: 1, borderColor: theme.colors.border },
    optionBtnActive: { backgroundColor: MODULE_COLOR, borderColor: MODULE_COLOR },
    optionText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: 'bold' },
    optionTextActive: { color: '#fff' },
    mainBtn: { width: '100%', borderRadius: 25, overflow: 'hidden', marginBottom: 20 },
    btnGradient: { padding: 20, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 2 },
    historyContainer: { marginTop: 10 },
    historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    historyDate: { color: theme.colors.textSecondary, fontWeight: '600', fontSize: 12 },
    historyVal: { color: theme.colors.text, fontWeight: 'bold', fontSize: 12 }
  });

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      {theme.isDark && (<View style={styles.auroraBg}><View style={[styles.blob, { top: 100, left: -50, backgroundColor: 'rgba(139, 92, 246, 0.15)' }]} /></View>)}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('modules.meditation.title')}</Text>
        </View>
        <View style={styles.content}>
            <View style={styles.visualContainer}>
                <View style={styles.outerCircle} />
                <Animated.View style={[styles.haloCircle, { transform: [{ scale: breatheAnim }] }]} />
                <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
            </View>
            <View>
                <View pointerEvents={isPlaying ? 'none' : 'auto'} style={styles.configContainer}>
                    <Text style={styles.sectionTitle}>{t('modules.meditation.duration')}</Text>
                    <View style={styles.row}>
                        {DURATIONS.map((d) => (
                            <TouchableOpacity key={d.id} style={[styles.optionBtn, selectedDuration === d.val && styles.optionBtnActive]} onPress={() => changeDuration(d.val)}>
                                <Text style={[styles.optionText, selectedDuration === d.val && styles.optionTextActive]}>{d.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text style={styles.sectionTitle}>{t('modules.meditation.ambiance')}</Text>
                    <View style={styles.row}>
                        {AMBIANCES.map((a) => (
                            <TouchableOpacity key={a.id} style={[styles.optionBtn, selectedAmbiance === a.id && styles.optionBtnActive]} onPress={() => { setSelectedAmbiance(a.id); loadSound(a.id); }}>
                                <MaterialCommunityIcons name={a.icon as any} size={18} color={selectedAmbiance === a.id ? '#fff' : theme.colors.textSecondary} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
                <TouchableOpacity style={styles.mainBtn} onPress={isPlaying ? pauseSession : startSession}>
                    <LinearGradient colors={isPlaying ? [theme.colors.danger, '#b91c1c'] : ZEN_GRADIENT} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.btnGradient}>
                        <Text style={styles.btnText}>{isPlaying ? t('modules.meditation.pause') : t('modules.meditation.start')}</Text>
                    </LinearGradient>
                </TouchableOpacity>
                <View style={styles.historyContainer}>
                    {history.length > 0 && <Text style={[styles.sectionTitle, {textAlign:'left'}]}>{t('modules.meditation.history_title')}</Text>}
                    {history.map((item, i) => (
                        <View key={i} style={styles.historyItem}>
                            <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString()}</Text>
                            <Text style={styles.historyVal}>{item.value} min</Text>
                        </View>
                    ))}
                </View>
            </View>
        </View>
      </SafeAreaView>
    </View>
  );
}