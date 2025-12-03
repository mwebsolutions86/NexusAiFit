import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';
import { useTranslation } from 'react-i18next';

export default function ColdScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const [isActive, setIsActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [temperature, setTemperature] = useState('12'); 
  const [history, setHistory] = useState<any[]>([]);
  const timerRef = useRef<number | null>(null);

  const MODULE_COLOR = '#0ea5e9'; 
  const COLD_GRADIENT: [string, string] = ['#0ea5e9', '#38bdf8'];

  useEffect(() => { fetchHistory(); return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, []);
  
  useEffect(() => {
      if (isActive) { timerRef.current = setInterval(() => { setSeconds(s => s + 1); }, 1000); } 
      else if (timerRef.current) { clearInterval(timerRef.current); }
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive]);

  const fetchHistory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data } = await supabase.from('body_metrics').select('date, value, created_at').eq('user_id', session.user.id).eq('type', 'cold_exposure').order('created_at', { ascending: false }).limit(5);
        if (data) setHistory(data);
      } catch (e) { console.log(e); }
  };

  const toggleTimer = () => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); setIsActive(!isActive); };

  const saveSession = async () => {
      if (seconds < 10) { setIsActive(false); setSeconds(0); return; }
      setIsActive(false);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;
          const durationMin = Math.round((seconds / 60) * 10) / 10;
          await supabase.from('body_metrics').insert({ user_id: session.user.id, type: 'cold_exposure', value: durationMin, date: new Date().toISOString().split('T')[0] });
          setSeconds(0);
          fetchHistory();
      } catch (e) { console.log(e); }
  };

  const formatTime = (sec: number) => { const m = Math.floor(sec / 60); const s = sec % 60; return `${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`; };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1 },
    auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
    blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.15 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    headerTitle: { color: theme.colors.text, fontWeight: 'bold', letterSpacing: 1 },
    content: { padding: 20, alignItems: 'center' },
    timerContainer: { width: 280, height: 280, borderRadius: 140, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: isActive ? MODULE_COLOR : theme.colors.border, backgroundColor: theme.colors.glass, marginBottom: 30, marginTop: 20, shadowColor: MODULE_COLOR, shadowOpacity: isActive ? 0.4 : 0.1, shadowRadius: 20 },
    timerText: { fontSize: 64, fontWeight: '900', color: theme.colors.text, fontVariant: ['tabular-nums'] },
    timerLabel: { fontSize: 12, fontWeight: 'bold', color: theme.colors.textSecondary, marginTop: 5, letterSpacing: 2 },
    controlsRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 30 },
    actionBtn: { borderRadius: 35, overflow: 'hidden', width: 70, height: 70 },
    btnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    saveBtn: { paddingHorizontal: 30, paddingVertical: 15, borderRadius: 25, backgroundColor: theme.colors.glass, borderWidth: 1, borderColor: theme.colors.success },
    saveText: { color: theme.colors.success, fontWeight: '900' },
    tempContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, backgroundColor: theme.colors.glass, padding: 10, borderRadius: 15 },
    tempInput: { fontSize: 20, fontWeight: 'bold', color: theme.colors.text, width: 50, textAlign: 'center' },
    tempLabel: { fontSize: 14, fontWeight: 'bold', color: theme.colors.textSecondary, marginRight: 10 },
    historyContainer: { width: '100%' },
    sectionTitle: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold', marginBottom: 15 },
    historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: theme.colors.glass, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border },
    historyDate: { color: theme.colors.textSecondary, fontWeight: '600' },
    historyVal: { color: theme.colors.text, fontWeight: 'bold' },
  });

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      {theme.isDark && (<View style={styles.auroraBg}><View style={[styles.blob, { top: 100, right: -50, backgroundColor: 'rgba(14, 165, 233, 0.15)' }]} /></View>)}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('modules.cold.title')}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.timerContainer}>
                <MaterialCommunityIcons name="snowflake" size={32} color={MODULE_COLOR} style={{marginBottom: 10}} />
                <Text style={styles.timerText}>{formatTime(seconds)}</Text>
                <Text style={styles.timerLabel}>{isActive ? t('modules.cold.timer_label') : t('modules.cold.ready')}</Text>
            </View>
            <View style={styles.tempContainer}>
                <MaterialCommunityIcons name="thermometer" size={20} color={theme.colors.textSecondary} style={{marginRight: 10}} />
                <Text style={styles.tempLabel}>{t('modules.cold.temp_label')}</Text>
                <TextInput style={styles.tempInput} value={temperature} onChangeText={setTemperature} keyboardType="numeric" maxLength={2} />
                <Text style={{color: theme.colors.text, fontWeight: 'bold'}}>°C</Text>
            </View>
            <View style={styles.controlsRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={toggleTimer}>
                    <LinearGradient colors={isActive ? [theme.colors.warning, '#d97706'] : COLD_GRADIENT} style={styles.btnGradient}>
                        <MaterialCommunityIcons name={isActive ? "pause" : "play"} size={32} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
                {!isActive && seconds > 0 && (
                    <TouchableOpacity style={styles.saveBtn} onPress={saveSession}>
                        <Text style={styles.saveText}>{t('modules.cold.btn_finish')}</Text>
                    </TouchableOpacity>
                )}
            </View>
            <View style={styles.historyContainer}>
                <Text style={styles.sectionTitle}>{t('modules.cold.history_title')}</Text>
                {history.length > 0 ? history.map((item, i) => (
                    <View key={i} style={styles.historyItem}>
                        <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString()}</Text>
                        <View style={{flexDirection:'row', alignItems:'center'}}>
                            <MaterialCommunityIcons name="snowflake" size={14} color={MODULE_COLOR} style={{marginRight:5}}/>
                            <Text style={styles.historyVal}>{item.value} min</Text>
                        </View>
                    </View>
                )) : (
                    <Text style={{color: theme.colors.textSecondary, fontStyle:'italic'}}>--</Text>
                )}
            </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}