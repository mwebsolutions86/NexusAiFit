import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

export default function BodyBatteryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  
  const [batteryLevel, setBatteryLevel] = useState(80);
  const [status, setStatus] = useState('');
  
  const [factors, setFactors] = useState({ 
      sleep: { val: 0, label: '?' }, 
      stress: { val: 0, label: '?' }, 
      activity: { val: 0, label: '?' } 
  });
  
  const [history, setHistory] = useState<any[]>([]);
  const BATTERY_GRADIENT: [string, string] = ['#22c55e', '#4ade80'];

  useFocusEffect(useCallback(() => { calculateBodyBattery(); }, []));

  const calculateBodyBattery = async () => {
    setLoading(true);
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const today = new Date().toISOString().split('T')[0];
        const { data: metrics } = await supabase.from('body_metrics').select('type, value, date').eq('user_id', session.user.id).order('created_at', { ascending: false });

        const lastSleepObj = metrics?.find(m => m.type === 'sleep_duration');
        const lastStressObj = metrics?.find(m => m.type === 'stress_level');
        const lastSleep = lastSleepObj ? Number(lastSleepObj.value) : 7.5;
        const lastStress = lastStressObj ? Number(lastStressObj.value) : 5;
        
        const { data: workouts } = await supabase.from('workout_logs').select('id').eq('user_id', session.user.id).eq('log_date', today);
        const hasWorkout = workouts && workouts.length > 0;

        let score = Math.min((lastSleep / 8) * 100, 100);
        if (lastStress > 5) score -= (lastStress - 5) * 5;
        if (hasWorkout) score -= 15; 
        score = Math.max(5, Math.min(100, Math.round(score)));

        setBatteryLevel(score);
        setFactors({
            sleep: { val: lastSleep, label: `${lastSleep}h` },
            stress: { val: lastStress, label: `${lastStress}/10` },
            activity: { val: hasWorkout ? 1 : 0, label: hasWorkout ? 'Oui' : 'Non' }
        });

        if (score >= 80) setStatus(t('modules.body.status_badge'));
        else if (score >= 50) setStatus("MODÉRÉ");
        else setStatus("FATIGUÉ");

        await saveBodyBattery(score, session.user.id, today);

    } catch (e) { console.log("Erreur calcul battery", e); } finally { setLoading(false); }
  };

  const saveBodyBattery = async (val: number, userId: string, dateStr: string) => {
      try {
        const { data: existing } = await supabase.from('body_metrics').select('id').eq('user_id', userId).eq('type', 'body_battery').eq('date', dateStr).maybeSingle();
        if (existing) { await supabase.from('body_metrics').update({ value: val }).eq('id', existing.id); } 
        else { await supabase.from('body_metrics').insert({ user_id: userId, type: 'body_battery', value: val, date: dateStr }); }
        fetchHistory(userId);
      } catch (e) { console.log(e) }
  };

  const fetchHistory = async (userId: string) => {
      const { data } = await supabase.from('body_metrics').select('date, value').eq('user_id', userId).eq('type', 'body_battery').order('date', { ascending: false }).limit(7);
      if(data) setHistory(data);
  };

  const getBatteryColor = (level: number) => {
      if (level > 70) return theme.colors.success;
      if (level > 30) return '#facc15';
      return theme.colors.danger;
  };
  const currentColor = getBatteryColor(batteryLevel);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1 },
    auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
    blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.2 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    headerTitle: { color: theme.colors.text, fontWeight: 'bold', letterSpacing: 1 },
    content: { padding: 20 },
    batteryContainer: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
    batteryOutline: { width: 140, height: 240, borderRadius: 30, borderWidth: 4, borderColor: theme.colors.border, justifyContent: 'flex-end', padding: 6, backgroundColor: theme.colors.glass, shadowColor: currentColor, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 5 },
    batteryCap: { width: 60, height: 15, backgroundColor: theme.colors.border, borderRadius: 5, marginBottom: 5 },
    batteryFill: { width: '100%', borderRadius: 20 },
    batteryTextContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
    batteryValue: { fontSize: 48, fontWeight: '900', color: theme.colors.text, textShadowColor:'rgba(0,0,0,0.5)', textShadowRadius:5 },
    batteryLabel: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textSecondary, marginTop: -5 },
    statusBadge: { marginTop: 20, paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20, backgroundColor: currentColor + '20', borderWidth: 1, borderColor: currentColor },
    statusText: { color: currentColor, fontWeight: '900', fontSize: 12, letterSpacing: 1 },
    sectionTitle: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 15, marginLeft: 5, marginTop: 10 },
    factorsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    factorCard: { flex: 1, alignItems: 'center', padding: 15, backgroundColor: theme.colors.glass, borderRadius: 20, marginHorizontal: 5, borderWidth: 1, borderColor: theme.colors.border },
    factorIcon: { marginBottom: 5 },
    factorValue: { color: theme.colors.text, fontWeight: 'bold', fontSize: 14 },
    factorLabel: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: '600' },
    historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: theme.colors.glass, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border },
    historyDate: { color: theme.colors.textSecondary, fontWeight: '600' },
    historyBarContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' },
    historyBar: { width: 80, height: 6, backgroundColor: theme.colors.border, borderRadius: 3, marginRight: 10, overflow: 'hidden' },
    historyFill: { height: '100%', borderRadius: 3 }, 
    historyVal: { color: theme.colors.text, fontWeight: 'bold', fontSize: 14, width: 30, textAlign: 'right' },
    tipsCard: { backgroundColor: theme.colors.glass, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.primary + '50', marginTop: 10 },
    tipsTitle: { color: theme.colors.primary, fontWeight: 'bold', marginBottom: 5 },
    tipsText: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 20 }
  });

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      {theme.isDark && (<View style={styles.auroraBg}><View style={[styles.blob, { top: 100, right: -50, backgroundColor: 'rgba(34, 197, 94, 0.15)' }]} /></View>)}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('modules.body.title')}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.batteryContainer}>
                <View style={styles.batteryCap} />
                <View style={styles.batteryOutline}>
                    <LinearGradient colors={batteryLevel > 30 ? BATTERY_GRADIENT : [theme.colors.danger, '#b91c1c']} style={[styles.batteryFill, { height: `${batteryLevel}%` }]} />
                    <View style={styles.batteryTextContainer}>
                        <MaterialCommunityIcons name="lightning-bolt" size={24} color={theme.isDark ? "#fff" : (batteryLevel > 50 ? "#fff" : theme.colors.text)} style={{opacity: 0.8, marginBottom: 5}} />
                        <Text style={[styles.batteryValue, !theme.isDark && batteryLevel < 50 && {color: theme.colors.text}]}>{batteryLevel}</Text>
                        <Text style={[styles.batteryLabel, !theme.isDark && batteryLevel < 50 && {color: theme.colors.textSecondary}]}>%</Text>
                    </View>
                </View>
                <View style={styles.statusBadge}><Text style={styles.statusText}>{status}</Text></View>
            </View>
            <Text style={styles.sectionTitle}>{t('modules.body.factors_title')}</Text>
            <View style={styles.factorsGrid}>
                <View style={styles.factorCard}><MaterialCommunityIcons name="bed-outline" size={24} color="#8b5cf6" style={styles.factorIcon} /><Text style={styles.factorValue}>{factors.sleep.label}</Text><Text style={styles.factorLabel}>{t('modules.body.factors.sleep')}</Text></View>
                <View style={styles.factorCard}><MaterialCommunityIcons name="brain" size={24} color="#f59e0b" style={styles.factorIcon} /><Text style={styles.factorValue}>{factors.stress.label}</Text><Text style={styles.factorLabel}>{t('modules.body.factors.stress')}</Text></View>
                <View style={styles.factorCard}><MaterialCommunityIcons name="dumbbell" size={24} color="#ef4444" style={styles.factorIcon} /><Text style={styles.factorValue}>{factors.activity.label}</Text><Text style={styles.factorLabel}>{t('modules.body.factors.sport')}</Text></View>
            </View>
            <View style={styles.tipsCard}><Text style={styles.tipsTitle}>{t('modules.body.tips_title')}</Text><Text style={styles.tipsText}>{batteryLevel > 70 ? "Optimale." : "Repos recommandé."}</Text></View>
            <Text style={styles.sectionTitle}>{t('modules.body.history_title')}</Text>
            {history.length > 0 ? history.map((item, i) => ( <View key={i} style={styles.historyItem}><Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString()}</Text><View style={styles.historyBarContainer}><View style={styles.historyBar}><View style={[styles.historyFill, { width: `${item.value}%`, backgroundColor: getBatteryColor(item.value) }]} /></View><Text style={styles.historyVal}>{Math.round(item.value)}%</Text></View></View> )) : ( <Text style={{color: theme.colors.textSecondary, fontStyle:'italic', marginLeft: 5}}>--</Text> )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}