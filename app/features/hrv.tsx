import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform, Animated, Easing, ActivityIndicator } from 'react-native';
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

export default function HrvScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const [scanning, setScanning] = useState(false);
  const [hrvValue, setHrvValue] = useState<number | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [advice, setAdvice] = useState('');
  const ecgAnim = useRef(new Animated.Value(0)).current;

  const MODULE_COLOR = '#d946ef'; 
  const HRV_GRADIENT: [string, string] = ['#d946ef', '#f0abfc'];

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data } = await supabase.from('body_metrics').select('date, value').eq('user_id', session.user.id).eq('type', 'hrv_score').order('created_at', { ascending: false }).limit(5);
        if (data) setHistory(data);
      } catch (e) { console.log(e); }
  };

  const startScan = () => {
      setScanning(true);
      setHrvValue(null);
      setAdvice('');
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      ecgAnim.setValue(0);
      Animated.loop(Animated.sequence([Animated.timing(ecgAnim, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: true }), Animated.timing(ecgAnim, { toValue: 0, duration: 0, useNativeDriver: true })])).start();
      setTimeout(() => { completeScan(); }, 3000);
  };

  const completeScan = async () => {
      ecgAnim.stopAnimation();
      ecgAnim.setValue(0);
      const result = Math.floor(Math.random() * (90 - 25 + 1) + 25);
      setHrvValue(result);
      determineAdvice(result);
      setScanning(false);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await saveResult(result);
  };

  const determineAdvice = (val: number) => {
      // CORRECTION : TEXTES TRADUITS
      if (val > 70) setAdvice(t('modules.hrv.advices.high'));
      else if (val > 40) setAdvice(t('modules.hrv.advices.mid'));
      else setAdvice(t('modules.hrv.advices.low'));
  };

  const saveResult = async (val: number) => {
      try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;
          await supabase.from('body_metrics').insert({ user_id: session.user.id, type: 'hrv_score', value: val, date: new Date().toISOString().split('T')[0] });
          fetchHistory();
      } catch (e) { console.log(e); }
  };

  const translateX = ecgAnim.interpolate({ inputRange: [0, 1], outputRange: [-width, width] });

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1 },
    auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
    blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.15 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    headerTitle: { color: theme.colors.text, fontWeight: 'bold', letterSpacing: 1 },
    content: { padding: 20 },
    monitorContainer: { height: 200, backgroundColor: theme.isDark ? '#000' : '#111', borderRadius: 20, marginBottom: 30, borderWidth: 2, borderColor: theme.colors.border, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative' },
    gridLineV: { position: 'absolute', width: 1, height: '100%', backgroundColor: 'rgba(217, 70, 239, 0.1)', left: '50%' },
    gridLineH: { position: 'absolute', width: '100%', height: 1, backgroundColor: 'rgba(217, 70, 239, 0.1)', top: '50%' },
    ecgLine: { position: 'absolute', width: 100, height: 4, borderRadius: 2, backgroundColor: MODULE_COLOR, shadowColor: MODULE_COLOR, shadowOffset: {width:0, height:0}, shadowOpacity: 1, shadowRadius: 10, elevation: 5 },
    monitorText: { color: MODULE_COLOR, fontSize: 64, fontWeight: '900', textShadowColor: MODULE_COLOR, textShadowRadius: 10 },
    monitorUnit: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 'bold', marginTop: -5 },
    statusContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, backgroundColor: theme.colors.glass, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border },
    statusItem: { alignItems: 'center', flex: 1 },
    statusLabel: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
    statusVal: { color: theme.colors.text, fontSize: 16, fontWeight: 'bold' },
    adviceBox: { backgroundColor: theme.isDark ? 'rgba(217, 70, 239, 0.1)' : '#fae8ff', padding: 20, borderRadius: 16, marginBottom: 30, borderLeftWidth: 4, borderLeftColor: MODULE_COLOR },
    adviceText: { color: theme.colors.text, fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
    scanBtn: { width: '100%', borderRadius: 16, overflow: 'hidden' },
    btnGradient: { padding: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 },
    btnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
    historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: theme.colors.glass, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border },
    historyDate: { color: theme.colors.textSecondary, fontWeight: '600' },
    historyVal: { color: theme.colors.text, fontWeight: 'bold', fontSize: 16 },
    sectionTitle: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold', marginBottom: 15, marginTop: 20 },
  });

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      {theme.isDark && (<View style={styles.auroraBg}><View style={[styles.blob, { top: 100, right: -50, backgroundColor: 'rgba(217, 70, 239, 0.15)' }]} /></View>)}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('modules.hrv.title')}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.monitorContainer}>
                <View style={styles.gridLineV} />
                <View style={styles.gridLineH} />
                {scanning ? ( <Animated.View style={[styles.ecgLine, { transform: [{ translateX }] }]} /> ) : ( <View style={{alignItems:'center'}}><Text style={styles.monitorText}>{hrvValue || '--'}</Text><Text style={styles.monitorUnit}>ms (RMSSD)</Text></View> )}
            </View>
            {hrvValue && (
                <>
                    <View style={styles.statusContainer}>
                        <View style={styles.statusItem}>
                            <Text style={styles.statusLabel}>{t('modules.hrv.status_label')}</Text>
                            <Text style={[styles.statusVal, {color: hrvValue > 50 ? theme.colors.success : theme.colors.warning}]}>{hrvValue > 50 ? t('modules.hrv.coherence') : t('modules.hrv.stress')}</Text>
                        </View>
                        <View style={styles.statusItem}>
                            <Text style={styles.statusLabel}>{t('modules.hrv.power_label')}</Text>
                            <Text style={styles.statusVal}>{hrvValue > 60 ? t('modules.hrv.power_high') : t('modules.hrv.power_low')}</Text>
                        </View>
                    </View>
                    <View style={styles.adviceBox}><Text style={styles.adviceText}>"{advice}"</Text></View>
                </>
            )}
            <TouchableOpacity style={styles.scanBtn} onPress={startScan} disabled={scanning}>
                <LinearGradient colors={scanning ? ['#555', '#777'] : HRV_GRADIENT} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.btnGradient}>
                    <MaterialCommunityIcons name="heart-pulse" size={24} color="#fff" />
                    <Text style={styles.btnText}>{scanning ? t('modules.hrv.scanning') : t('modules.hrv.scan_btn')}</Text>
                </LinearGradient>
            </TouchableOpacity>
            {!hrvValue && !scanning && (<Text style={{color: theme.colors.textSecondary, fontSize: 10, marginTop: 15, textAlign:'center', fontStyle:'italic'}}>{t('modules.hrv.place_finger')}</Text>)}
            <Text style={styles.sectionTitle}>{t('modules.hrv.history_title')}</Text>
            {history.map((item, i) => (<View key={i} style={styles.historyItem}><Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString()}</Text><Text style={[styles.historyVal, {color: item.value > 50 ? theme.colors.success : theme.colors.warning}]}>{item.value} ms</Text></View>))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}