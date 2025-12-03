import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useTheme } from '../../lib/theme';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

const PROTOCOLS = [
    { id: 16, label: '16:8', name: 'Le Classique', desc: '16h Jeûne / 8h Repas' },
    { id: 18, label: '18:6', name: 'Le Guerrier', desc: '18h Jeûne / 6h Repas' },
    { id: 20, label: '20:4', name: 'L\'Expert', desc: '20h Jeûne / 4h Repas' },
    { id: 23, label: 'OMAD', name: 'One Meal A Day', desc: '23h Jeûne / 1h Repas' },
];

export default function FastingScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [isFasting, setIsFasting] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [targetHours, setTargetHours] = useState(16);
  const [history, setHistory] = useState<any[]>([]);
  const timerRef = useRef<number | null>(null);
  const tickSoundRef = useRef<Audio.Sound | null>(null);
  const alarmSoundRef = useRef<Audio.Sound | null>(null);
  const MODULE_COLOR = '#14b8a6'; 
  const FAST_GRADIENT: [string, string] = ['#14b8a6', '#2dd4bf'];

  useEffect(() => {
      loadActiveFast();
      fetchHistory();
      loadSounds();
      return () => { if (timerRef.current) clearInterval(timerRef.current); unloadSounds(); };
  }, []);

  const loadSounds = async () => {
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, shouldDuckAndroid: true });
      const { sound: tick } = await Audio.Sound.createAsync(require('../../assets/sounds/tick.mp3'));
      tickSoundRef.current = tick;
      const { sound: alarm } = await Audio.Sound.createAsync(require('../../assets/sounds/alarm.mp3'));
      alarmSoundRef.current = alarm;
    } catch (error) { console.log("Erreur chargement sons", error); }
  };

  const unloadSounds = async () => {
    if (tickSoundRef.current) await tickSoundRef.current.unloadAsync();
    if (alarmSoundRef.current) await alarmSoundRef.current.unloadAsync();
  };

  const playSound = async (type: 'tick' | 'alarm') => {
    try { const soundObj = type === 'tick' ? tickSoundRef.current : alarmSoundRef.current; if (soundObj) await soundObj.replayAsync(); } catch (e) { console.log(e); }
  };

  useEffect(() => {
      if (isFasting && startTime) {
          timerRef.current = setInterval(() => {
              const now = new Date();
              setElapsed(Math.floor((now.getTime() - startTime.getTime()) / 1000));
          }, 1000);
      } else { if (timerRef.current) clearInterval(timerRef.current); }
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isFasting, startTime]);

  const loadActiveFast = async () => {
      try {
          const storedStart = await AsyncStorage.getItem('fasting_start');
          const storedTarget = await AsyncStorage.getItem('fasting_target');
          if (storedStart) {
              const start = new Date(storedStart);
              setStartTime(start);
              setTargetHours(storedTarget ? parseInt(storedTarget) : 16);
              setIsFasting(true);
              const now = new Date();
              setElapsed(Math.floor((now.getTime() - start.getTime()) / 1000));
          }
      } catch (e) { console.log(e); }
  };

  const fetchHistory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data } = await supabase.from('body_metrics').select('date, value, created_at').eq('user_id', session.user.id).eq('type', 'fasting').order('created_at', { ascending: false }).limit(7);
        if (data) setHistory(data);
      } catch (e) { console.log(e); }
  };

  const toggleFast = async () => {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (isFasting) {
          Alert.alert(t('modules.fasting.alerts.stop_title'), t('modules.fasting.alerts.stop_msg'), [{ text: "Annuler", style: "cancel" }, { text: "Terminer", onPress: endFast }]);
      } else {
          const now = new Date();
          setStartTime(now);
          setIsFasting(true);
          setElapsed(0);
          await AsyncStorage.setItem('fasting_start', now.toISOString());
          await AsyncStorage.setItem('fasting_target', targetHours.toString());
          playSound('tick');
      }
  };

  const endFast = async () => {
      setLoading(true);
      playSound('alarm');
      try {
          const { data: { session } } = await supabase.auth.getSession();
          const durationHours = elapsed / 3600;
          const roundedDuration = Math.round(durationHours * 10) / 10;
          if (session && durationHours > 0.1) {
               await supabase.from('body_metrics').insert({ user_id: session.user.id, type: 'fasting', value: roundedDuration, date: new Date().toISOString().split('T')[0] });
              await fetchHistory();
          }
          await AsyncStorage.removeItem('fasting_start');
          setIsFasting(false);
          setStartTime(null);
          setElapsed(0);
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert(t('modules.fasting.alerts.finish_title'), t('modules.fasting.alerts.finish_msg'));
      } catch (e) { console.log(e); } finally { setLoading(false); }
  };

  const formatTime = (seconds: number) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return `${h}h ${m < 10 ? '0'+m : m}m ${s < 10 ? '0'+s : s}s`;
  };

  const targetSeconds = targetHours * 3600;
  const progress = Math.min(elapsed / targetSeconds, 1);
  const percentage = Math.round(progress * 100);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    headerTitle: { color: theme.colors.text, fontWeight: 'bold', letterSpacing: 1 },
    content: { padding: 20 },
    timerContainer: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
    circleOutline: { width: 260, height: 260, borderRadius: 130, borderWidth: 1, borderColor: theme.colors.border, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.glass, shadowColor: isFasting ? MODULE_COLOR : '#000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: isFasting ? 0.4 : 0.1, shadowRadius: 20, elevation: 5 },
    progressRing: { position: 'absolute', width: '100%', height: '100%', borderRadius: 130, borderWidth: 4, borderColor: isFasting ? MODULE_COLOR : 'transparent', opacity: 0.3 },
    timerValue: { fontSize: 42, fontWeight: '900', color: theme.colors.text, fontVariant: ['tabular-nums'], textAlign: 'center' },
    timerLabel: { fontSize: 12, fontWeight: 'bold', color: isFasting ? MODULE_COLOR : theme.colors.textSecondary, letterSpacing: 1.5, marginTop: 5, textAlign: 'center', paddingHorizontal: 10 },
    targetBadge: { position: 'absolute', bottom: 40, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, backgroundColor: theme.colors.cardBg, borderWidth: 1, borderColor: theme.colors.border },
    targetText: { fontSize: 10, fontWeight: 'bold', color: theme.colors.textSecondary },
    actionBtn: { width: '100%', borderRadius: 20, overflow: 'hidden', marginBottom: 30 },
    btnGradient: { padding: 20, alignItems: 'center', justifyContent: 'center' },
    btnText: { color: '#fff', fontWeight: '900', fontSize: 18, letterSpacing: 1 },
    sectionTitle: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 15, marginLeft: 5 },
    protocolsScroll: { marginBottom: 30 },
    protocolCard: { width: 140, padding: 15, marginRight: 10, backgroundColor: theme.colors.glass, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' },
    protocolActive: { borderColor: MODULE_COLOR, backgroundColor: theme.isDark ? 'rgba(20, 184, 166, 0.1)' : '#f0fdfa' },
    protoLabel: { fontSize: 18, fontWeight: '900', color: theme.colors.text, marginBottom: 5 },
    protoName: { fontSize: 10, fontWeight: 'bold', color: MODULE_COLOR, marginBottom: 5, textAlign:'center' },
    protoDesc: { fontSize: 9, color: theme.colors.textSecondary, textAlign: 'center' },
    historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: theme.colors.glass, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border },
    historyDate: { color: theme.colors.textSecondary, fontWeight: '600' },
    historyVal: { color: theme.colors.text, fontWeight: 'bold', fontSize: 16 },
    historyBadge: { width: 10, height: 10, borderRadius: 5, backgroundColor: MODULE_COLOR, marginRight: 10 }
  });

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('modules.fasting.title')}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.timerContainer}>
                <View style={styles.circleOutline}>
                    <View style={styles.progressRing} />
                    <MaterialCommunityIcons name={isFasting ? "timer-sand" : "food-apple-outline"} size={32} color={isFasting ? MODULE_COLOR : theme.colors.textSecondary} style={{marginBottom: 10}} />
                    <Text style={styles.timerValue}>{formatTime(elapsed)}</Text>
                    <Text style={styles.timerLabel}>{isFasting ? t('modules.fasting.fasting_label') : t('modules.fasting.eating_label')}</Text>
                    {isFasting && ( <View style={styles.targetBadge}><Text style={styles.targetText}>{t('modules.fasting.target_badge')} {targetHours}H ({percentage}%)</Text></View> )}
                </View>
            </View>
            <TouchableOpacity style={styles.actionBtn} onPress={toggleFast} disabled={loading}>
                <LinearGradient colors={isFasting ? [theme.colors.danger, '#ef4444'] : FAST_GRADIENT} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.btnGradient}>
                    {loading ? <ActivityIndicator color="#fff" /> : ( <Text style={styles.btnText}>{isFasting ? t('modules.fasting.btn_stop') : t('modules.fasting.btn_start')}</Text> )}
                </LinearGradient>
            </TouchableOpacity>
            {!isFasting && (
                <>
                    <Text style={styles.sectionTitle}>{t('modules.fasting.section_proto')}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.protocolsScroll}>
                        {PROTOCOLS.map((p) => (
                            <TouchableOpacity key={p.id} style={[styles.protocolCard, targetHours === p.id && styles.protocolActive]} onPress={() => { if(Platform.OS!=='web') Haptics.selectionAsync(); setTargetHours(p.id); }}>
                                <Text style={styles.protoLabel}>{p.label}</Text>
                                <Text style={styles.protoName}>{p.name}</Text>
                                <Text style={styles.protoDesc}>{p.desc}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </>
            )}
            <Text style={styles.sectionTitle}>{t('modules.fasting.section_history')}</Text>
            {history.length > 0 ? history.map((item, i) => (
                <View key={i} style={styles.historyItem}>
                    <View style={{flexDirection:'row', alignItems:'center'}}>
                        <View style={styles.historyBadge} />
                        <Text style={styles.historyDate}>{new Date(item.created_at).toLocaleDateString(undefined, {weekday:'short', day:'numeric'})}</Text>
                    </View>
                    <Text style={styles.historyVal}>{item.value}h</Text>
                </View>
            )) : (
                <Text style={{color: theme.colors.textSecondary, fontStyle:'italic', marginLeft: 5}}>Aucune donnée.</Text>
            )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}