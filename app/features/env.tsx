import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform, ActivityIndicator, Animated, Easing } from 'react-native';
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

export default function EnvScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const spinAnim = useRef(new Animated.Value(0)).current;

  const MODULE_COLOR = '#06b6d4'; 
  const ENV_GRADIENT: [string, string] = ['#06b6d4', '#22d3ee'];

  useEffect(() => {
    fetchHistory();
    Animated.loop(Animated.timing(spinAnim, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true })).start();
  }, []);

  const fetchHistory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data } = await supabase.from('body_metrics').select('date, value').eq('user_id', session.user.id).eq('type', 'env_score').order('created_at', { ascending: false }).limit(5);
        if (data) setHistory(data);
      } catch (e) { console.log(e); }
  };

  const startScan = () => {
      setScanning(true);
      setResult(null);
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(() => { completeScan(); }, 3000);
  };

  const completeScan = async () => {
      const noise = Math.floor(Math.random() * (60 - 30 + 1) + 30);
      const light = Math.floor(Math.random() * (500 - 50 + 1) + 50);
      const air = Math.floor(Math.random() * (100 - 80 + 1) + 80);
      let score = 100;
      if (noise > 50) score -= 20; if (light > 300) score -= 10; if (air < 90) score -= 10;

      setResult({ noise, light, air, score, advice: "Analyse complète." });
      setScanning(false);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await saveScan(score);
  };

  const saveScan = async (scoreVal: number) => {
      try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;
          await supabase.from('body_metrics').insert({ user_id: session.user.id, type: 'env_score', value: scoreVal, date: new Date().toISOString().split('T')[0] });
          fetchHistory();
      } catch (e) { console.log(e); }
  };

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    headerTitle: { color: theme.colors.text, fontWeight: 'bold', letterSpacing: 1 },
    content: { padding: 20, alignItems: 'center' },
    radarContainer: { width: 260, height: 260, borderRadius: 130, justifyContent: 'center', alignItems: 'center', marginBottom: 40, marginTop: 20, position: 'relative' },
    radarCircle: { position: 'absolute', width: '100%', height: '100%', borderRadius: 130, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.glass },
    spinner: { position: 'absolute', width: '100%', height: '100%', borderRightWidth: 2, borderTopWidth: 2, borderColor: scanning ? MODULE_COLOR : 'transparent', borderRadius: 130, opacity: 0.5 },
    scoreValue: { fontSize: 64, fontWeight: '900', color: theme.colors.text },
    scoreLabel: { fontSize: 12, fontWeight: 'bold', color: theme.colors.textSecondary, letterSpacing: 2 },
    grid: { flexDirection: 'row', gap: 10, marginBottom: 30, width: '100%' },
    metricCard: { flex: 1, backgroundColor: theme.colors.glass, borderRadius: 16, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    metricIcon: { marginBottom: 5 },
    metricVal: { fontSize: 18, fontWeight: '900', color: theme.colors.text },
    metricName: { fontSize: 10, color: theme.colors.textSecondary, fontWeight: 'bold' },
    adviceBox: { width: '100%', backgroundColor: MODULE_COLOR + '15', padding: 20, borderRadius: 16, marginBottom: 30, borderWidth: 1, borderColor: MODULE_COLOR },
    adviceTitle: { color: MODULE_COLOR, fontWeight: '900', marginBottom: 5, fontSize: 12 },
    adviceText: { color: theme.colors.text, fontSize: 13, lineHeight: 20 },
    scanBtn: { width: '100%', borderRadius: 16, overflow: 'hidden' },
    btnGradient: { padding: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 },
    btnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
    historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: 15, backgroundColor: theme.colors.glass, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border },
    historyDate: { color: theme.colors.textSecondary, fontWeight: '600' },
    historyVal: { color: theme.colors.text, fontWeight: 'bold', fontSize: 16 },
    sectionTitle: { width:'100%', color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold', marginBottom: 15, marginTop: 20 },
  });

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('modules.env.title')}</Text>
            <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.radarContainer}>
                <View style={styles.radarCircle} />
                <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]} />
                <View style={{alignItems:'center'}}>
                    <MaterialCommunityIcons name={scanning ? "radar" : "shield-check"} size={40} color={scanning ? theme.colors.textSecondary : MODULE_COLOR} style={{marginBottom: 10}} />
                    {result ? ( <> <Text style={styles.scoreValue}>{result.score}</Text> <Text style={styles.scoreLabel}>{t('modules.env.score')}</Text> </> ) : ( <Text style={styles.scoreLabel}>{scanning ? t('modules.env.scanning') : t('modules.stress.ready')}</Text> )}
                </View>
            </View>
            {result && (
                <>
                    <View style={styles.grid}>
                        <View style={styles.metricCard}><MaterialCommunityIcons name="volume-high" size={20} color="#f43f5e" style={styles.metricIcon}/><Text style={styles.metricVal}>{result.noise} dB</Text><Text style={styles.metricName}>{t('modules.env.noise')}</Text></View>
                        <View style={styles.metricCard}><MaterialCommunityIcons name="white-balance-sunny" size={20} color="#fbbf24" style={styles.metricIcon}/><Text style={styles.metricVal}>{result.light} Lx</Text><Text style={styles.metricName}>{t('modules.env.light')}</Text></View>
                        <View style={styles.metricCard}><MaterialCommunityIcons name="air-filter" size={20} color="#22c55e" style={styles.metricIcon}/><Text style={styles.metricVal}>{result.air}%</Text><Text style={styles.metricName}>{t('modules.env.air')}</Text></View>
                    </View>
                    <View style={styles.adviceBox}><Text style={styles.adviceTitle}>{t('modules.env.diag')}</Text><Text style={styles.adviceText}>{result.advice}</Text></View>
                </>
            )}
            <TouchableOpacity style={styles.scanBtn} onPress={startScan} disabled={scanning}>
                <LinearGradient colors={scanning ? ['#555', '#777'] : ENV_GRADIENT} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.btnGradient}>
                    <MaterialCommunityIcons name="access-point" size={24} color="#fff" />
                    <Text style={styles.btnText}>{scanning ? t('modules.env.scanning') : t('modules.env.scan_btn')}</Text>
                </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>{t('modules.env.history')}</Text>
            {history.map((item, i) => ( <View key={i} style={styles.historyItem}><Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString()}</Text><Text style={[styles.historyVal, {color: item.value > 80 ? theme.colors.success : theme.colors.warning}]}>{item.value}/100</Text></View> ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}