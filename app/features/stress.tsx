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

const { width } = Dimensions.get('window');

export default function StressScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false); 
  const [scanning, setScanning] = useState(false); 
  const [scanStep, setScanStep] = useState(''); 
  
  const [stressLevel, setStressLevel] = useState<number | null>(null); 
  const [history, setHistory] = useState<any[]>([]);

  const MODULE_COLOR = '#f59e0b'; 
  const STRESS_GRADIENT: [string, string] = ['#f59e0b', '#fbbf24'];

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data } = await supabase.from('body_metrics').select('date, value').eq('user_id', session.user.id).eq('type', 'stress_level').order('date', { ascending: false }).limit(7);
        if (data) setHistory(data);
      } catch (e) { console.log(e); }
  };

  const startScan = () => {
      setScanning(true);
      setStressLevel(null);
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      // TRADUCTION DES ÉTAPES DU SCAN
      // Note: Pour faire simple, on peut garder des textes génériques ou ajouter des clés
      // Ici je mets des textes simples qui passent partout
      setScanStep("1/3...");
      setTimeout(() => { setScanStep("2/3..."); if (Platform.OS !== 'web') Haptics.selectionAsync(); }, 1500);
      setTimeout(() => { setScanStep("3/3..."); if (Platform.OS !== 'web') Haptics.selectionAsync(); }, 3000);
      setTimeout(() => { const result = Math.floor(Math.random() * (8 - 3 + 1) + 3); completeScan(result); }, 4500);
  };

  const completeScan = async (level: number) => {
      setScanning(false);
      setStressLevel(level);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await saveStress(level);
  };

  const saveStress = async (val: number) => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        await supabase.from('body_metrics').insert({ user_id: session.user.id, type: 'stress_level', value: val, date: new Date().toISOString().split('T')[0] });
        await fetchHistory();
      } catch (error: any) { Alert.alert(t('profile.alerts.error'), error.message); } finally { setLoading(false); }
  };

  const getStressInfo = (val: number) => {
      if (val <= 3) return { label: t('modules.stress.status.relaxed'), color: theme.colors.success };
      if (val <= 6) return { label: t('modules.stress.status.moderate'), color: "#facc15" };
      if (val <= 8) return { label: t('modules.stress.status.high'), color: theme.colors.warning };
      return { label: t('modules.stress.status.critical'), color: theme.colors.danger };
  };

  const info = stressLevel ? getStressInfo(stressLevel) : { label: t('modules.stress.ready'), color: MODULE_COLOR };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1 },
    auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
    blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.2 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    headerTitle: { color: theme.colors.text, fontWeight: 'bold', letterSpacing: 1 },
    content: { padding: 20 },
    scanCard: { backgroundColor: theme.colors.glass, borderRadius: 30, padding: 30, alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: scanning ? '#fff' : info.color, shadowColor: info.color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: theme.isDark ? 0.3 : 0.1, shadowRadius: 15, elevation: 5, minHeight: 300, justifyContent: 'center' },
    brainContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: theme.isDark ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: scanning ? '#fff' : info.color },
    scoreValue: { fontSize: 64, fontWeight: '900', color: theme.colors.text },
    scoreMax: { fontSize: 20, color: theme.colors.textSecondary, fontWeight: 'bold', marginTop: -10, marginBottom: 10 },
    statusContainer: { backgroundColor: info.color + '20', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: info.color, marginTop: 10 },
    statusText: { color: info.color, fontWeight: '900', fontSize: 14, letterSpacing: 1 },
    descText: { color: theme.colors.textSecondary, marginTop: 15, fontSize: 12, textAlign: 'center', lineHeight: 18 },
    scanBtn: { width: '100%', borderRadius: 16, overflow: 'hidden', marginTop: 10 },
    btnGradient: { padding: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
    btnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1, marginLeft: 10 },
    sectionTitle: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 15, marginLeft: 5, marginTop: 20 },
    historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: theme.colors.glass, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border },
    historyDate: { color: theme.colors.textSecondary, fontWeight: '600' },
    historyValContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    historyVal: { color: theme.colors.text, fontWeight: 'bold', fontSize: 16 },
    historyBadge: { width: 12, height: 12, borderRadius: 6 }
  });

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      {theme.isDark && (<View style={styles.auroraBg}><View style={[styles.blob, { top: 100, right: -50, backgroundColor: 'rgba(245, 158, 11, 0.15)' }]} /></View>)}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('modules.stress.title')}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.scanCard}>
                <View style={styles.brainContainer}>
                    {scanning ? <ActivityIndicator size="large" color={MODULE_COLOR} /> : <MaterialCommunityIcons name={stressLevel ? "brain" : "fingerprint"} size={48} color={info.color} />}
                </View>
                {scanning ? <Text style={[styles.statusText, {color: theme.colors.text}]}>{scanStep}</Text> : 
                    <>
                        {stressLevel ? (
                            <>
                                <Text style={styles.scoreValue}>{stressLevel}</Text>
                                <Text style={styles.scoreMax}>/ 10</Text>
                                <View style={styles.statusContainer}><Text style={styles.statusText}>{info.label}</Text></View>
                            </>
                        ) : (
                            <Text style={[styles.statusText, {color: theme.colors.textSecondary}]}>--</Text>
                        )}
                    </>
                }
                <Text style={styles.descText}>{t('modules.stress.ready_desc')}</Text>
            </View>
            <TouchableOpacity style={styles.scanBtn} onPress={startScan} disabled={scanning || loading}>
                <LinearGradient colors={scanning ? ['#555', '#777'] : STRESS_GRADIENT} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.btnGradient}>
                    <MaterialCommunityIcons name={scanning ? "loading" : "access-point-network"} size={24} color="#fff" />
                    <Text style={styles.btnText}>{scanning ? t('modules.stress.scanning') : t('modules.stress.scan_btn')}</Text>
                </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>{t('modules.stress.history')}</Text>
            {history.length > 0 ? history.map((item, i) => {
                const itemInfo = getStressInfo(item.value);
                return (
                    <View key={i} style={styles.historyItem}>
                        <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString(undefined, {weekday:'long', day:'numeric'})}</Text>
                        <View style={styles.historyValContainer}>
                            <Text style={styles.historyVal}>{item.value}/10</Text>
                            <View style={[styles.historyBadge, {backgroundColor: itemInfo.color}]} />
                        </View>
                    </View>
                );
            }) : (
                <Text style={{color: theme.colors.textSecondary, fontStyle:'italic', marginLeft: 5}}>--</Text>
            )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}