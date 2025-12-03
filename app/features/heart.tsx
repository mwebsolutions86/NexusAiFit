import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';
import { useTranslation } from 'react-i18next';

export default function HeartScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false); 
  const [scanning, setScanning] = useState(false); 
  
  const [bpm, setBpm] = useState<number | null>(null);
  const [age, setAge] = useState<number>(30);
  const [history, setHistory] = useState<any[]>([]);

  const MODULE_COLOR = '#ef4444'; 
  const HEART_GRADIENT: [string, string] = ['#ef4444', '#f87171'];

  useEffect(() => {
    fetchUserData();
    fetchHistory();
  }, []);

  const fetchUserData = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data } = await supabase.from('profiles').select('age').eq('id', session.user.id).single();
            if (data?.age) setAge(data.age);
        }
    } catch (e) { console.log("Erreur profil", e); }
  };

  const fetchHistory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data } = await supabase.from('body_metrics').select('date, value').eq('user_id', session.user.id).eq('type', 'heart_rate').order('date', { ascending: false }).limit(7);
        if (data) setHistory(data);
      } catch (e) { console.log(e); }
  };

  const startMeasurement = async () => {
      setScanning(true);
      setBpm(null); 
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setTimeout(() => {
          const simulatedBPM = Math.floor(Math.random() * (90 - 60 + 1) + 60);
          completeMeasurement(simulatedBPM);
      }, 3000);
  };

  const completeMeasurement = async (measuredVal: number) => {
      setScanning(false);
      setBpm(measuredVal);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await saveHeartRate(measuredVal);
  };

  const saveHeartRate = async (val: number) => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        await supabase.from('body_metrics').insert({ user_id: session.user.id, type: 'heart_rate', value: val, date: new Date().toISOString().split('T')[0] });
        await fetchHistory();
        Alert.alert(t('modules.heart.alert_title'), t('modules.heart.alert_msg'));
      } catch (error: any) { Alert.alert("Erreur", error.message); } finally { setLoading(false); }
  };

  const maxHeartRate = 220 - age;
  
  // CORRECTION : TRADUCTION DES ZONES
  const zones = [
      { id: 1, label: t('modules.heart.zones.warmup'), range: '50-60%', min: Math.round(maxHeartRate * 0.5), max: Math.round(maxHeartRate * 0.6), color: '#94a3b8' },
      { id: 2, label: t('modules.heart.zones.fatburn'), range: '60-70%', min: Math.round(maxHeartRate * 0.6), max: Math.round(maxHeartRate * 0.7), color: '#4ade80' },
      { id: 3, label: t('modules.heart.zones.aerobic'), range: '70-80%', min: Math.round(maxHeartRate * 0.7), max: Math.round(maxHeartRate * 0.8), color: '#facc15' },
      { id: 4, label: t('modules.heart.zones.anaerobic'), range: '80-90%', min: Math.round(maxHeartRate * 0.8), max: Math.round(maxHeartRate * 0.9), color: '#f97316' },
      { id: 5, label: t('modules.heart.zones.max'), range: '90-100%', min: Math.round(maxHeartRate * 0.9), max: maxHeartRate, color: '#ef4444' },
  ];

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1 },
    auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
    blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.2 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    headerTitle: { color: theme.colors.text, fontWeight: 'bold', letterSpacing: 1 },
    content: { padding: 20 },
    mainCard: { backgroundColor: theme.colors.glass, borderRadius: 24, padding: 30, alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: scanning ? '#fff' : MODULE_COLOR, shadowColor: MODULE_COLOR, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
    pulseContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: theme.isDark ? 'rgba(239, 68, 68, 0.1)' : '#fee2e2', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: scanning ? '#fff' : MODULE_COLOR },
    bpmText: { fontSize: 48, fontWeight: '900', color: theme.colors.text },
    bpmUnit: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textSecondary, marginTop: -5 },
    scanBtn: { width: '100%', borderRadius: 16, overflow: 'hidden', marginTop: 10 },
    btnGradient: { padding: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
    btnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1, marginLeft: 10 },
    sectionTitle: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 15, marginLeft: 5, marginTop: 10 },
    zoneItem: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: theme.colors.glass, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border },
    zoneBadge: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    zoneId: { color: '#fff', fontWeight: '900', fontSize: 16 },
    zoneInfo: { flex: 1 },
    zoneLabel: { color: theme.colors.text, fontWeight: 'bold', fontSize: 14 },
    zoneRange: { color: theme.colors.textSecondary, fontSize: 12 },
    zoneValues: { color: theme.colors.text, fontWeight: '900', fontSize: 14 },
    historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: theme.colors.glass, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border },
    historyDate: { color: theme.colors.textSecondary, fontWeight: '600' },
    historyVal: { color: theme.colors.text, fontWeight: 'bold', fontSize: 16 },
  });

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      {theme.isDark && (<View style={styles.auroraBg}><View style={[styles.blob, { top: 100, right: -50, backgroundColor: 'rgba(239, 68, 68, 0.15)' }]} /></View>)}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('modules.heart.title')}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.mainCard}>
                <View style={styles.pulseContainer}>
                    {scanning ? ( <ActivityIndicator size="large" color={MODULE_COLOR} /> ) : ( <> {bpm ? ( <> <Text style={styles.bpmText}>{bpm}</Text> <Text style={styles.bpmUnit}>{t('modules.heart.unit')}</Text> </> ) : ( <MaterialCommunityIcons name="watch-variant" size={48} color={MODULE_COLOR} /> )} </> )}
                </View>
                <TouchableOpacity style={styles.scanBtn} onPress={startMeasurement} disabled={scanning || loading}>
                    <LinearGradient colors={scanning ? ['#555', '#777'] : HEART_GRADIENT} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.btnGradient}>
                        <MaterialCommunityIcons name={scanning ? "loading" : "access-point"} size={24} color="#fff" />
                        <Text style={styles.btnText}>{scanning ? t('modules.heart.measuring') : (bpm ? t('modules.heart.new_scan') : t('modules.heart.scan_btn'))}</Text>
                    </LinearGradient>
                </TouchableOpacity>
                <Text style={{color: theme.colors.textSecondary, fontSize: 10, marginTop: 15, textAlign:'center'}}>{t('modules.heart.desc')}</Text>
            </View>
            <Text style={styles.sectionTitle}>{t('modules.heart.zones_title')} (Max: {maxHeartRate} BPM)</Text>
            {zones.map((zone) => ( <View key={zone.id} style={styles.zoneItem}><View style={[styles.zoneBadge, { backgroundColor: zone.color }]}><Text style={styles.zoneId}>Z{zone.id}</Text></View><View style={styles.zoneInfo}><Text style={styles.zoneLabel}>{zone.label}</Text><Text style={styles.zoneRange}>{zone.range} FCM</Text></View><Text style={styles.zoneValues}>{zone.min}-{zone.max}</Text></View> ))}
            <Text style={[styles.sectionTitle, {marginTop: 20}]}>{t('modules.heart.history_title')}</Text>
            {history.length > 0 ? history.map((item, i) => ( <View key={i} style={styles.historyItem}><Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString()}</Text><Text style={styles.historyVal}>{item.value} BPM</Text></View> )) : ( <Text style={{color: theme.colors.textSecondary, fontStyle:'italic', marginLeft: 5}}>Aucune donnée.</Text> )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}