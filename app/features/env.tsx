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

const { width } = Dimensions.get('window');

export default function EnvScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  // Animations Radar
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const MODULE_COLOR = '#06b6d4'; // Cyan
  const ENV_GRADIENT: [string, string] = ['#06b6d4', '#22d3ee'];

  useEffect(() => {
    fetchHistory();
    startRadarAnimation();
  }, []);

  const startRadarAnimation = () => {
      Animated.loop(
          Animated.timing(spinAnim, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true })
      ).start();
      
      Animated.loop(
          Animated.sequence([
              Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
              Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
          ])
      ).start();
  };

  const fetchHistory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data } = await supabase
            .from('body_metrics')
            .select('date, value')
            .eq('user_id', session.user.id)
            .eq('type', 'env_score')
            .order('created_at', { ascending: false })
            .limit(5);

        if (data) setHistory(data);
      } catch (e) { console.log(e); }
  };

  const startScan = () => {
      setScanning(true);
      setResult(null);
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      // Simulation d'analyse des capteurs
      setTimeout(() => {
          if (Platform.OS !== 'web') Haptics.selectionAsync();
      }, 1000);

      setTimeout(() => {
          if (Platform.OS !== 'web') Haptics.selectionAsync();
      }, 2000);

      setTimeout(() => {
          completeScan();
      }, 3000);
  };

  const completeScan = async () => {
      // Génération de valeurs réalistes simulées
      const noise = Math.floor(Math.random() * (60 - 30 + 1) + 30); // 30-60 dB
      const light = Math.floor(Math.random() * (500 - 50 + 1) + 50); // 50-500 Lux
      const air = Math.floor(Math.random() * (100 - 80 + 1) + 80); // 80-100% Qualité

      // Calcul d'un score global sur 100
      let score = 100;
      if (noise > 50) score -= 20;
      if (light > 300) score -= 10; // Trop lumineux = moins bon (selon contexte, mais bon)
      if (air < 90) score -= 10;

      const newResult = {
          noise,
          light,
          air,
          score,
          advice: getAdvice(noise, light)
      };

      setResult(newResult);
      setScanning(false);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      await saveScan(score);
  };

  const getAdvice = (n: number, l: number) => {
      if (n > 50) return "Environnement bruyant. Utilisez un casque antibruit pour le Deep Work.";
      if (l > 300) return "Lumière intense. Parfait pour l'éveil, à éviter avant de dormir.";
      if (l < 100) return "Ambiance tamisée. Idéal pour la relaxation ou la créativité.";
      return "Conditions équilibrées. Zone optimale pour la routine.";
  };

  const saveScan = async (scoreVal: number) => {
      try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;
          
          await supabase.from('body_metrics').insert({
              user_id: session.user.id,
              type: 'env_score',
              value: scoreVal,
              date: new Date().toISOString().split('T')[0]
          });
          fetchHistory();
      } catch (e) { console.log(e); }
  };

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // --- STYLES ---
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1 },
    
    auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
    blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.15 },
  
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    headerTitle: { color: theme.colors.text, fontWeight: 'bold', letterSpacing: 1 },

    content: { padding: 20, alignItems: 'center' },

    // Radar Visual
    radarContainer: { 
        width: 260, height: 260, borderRadius: 130, 
        justifyContent: 'center', alignItems: 'center', 
        marginBottom: 40, marginTop: 20, position: 'relative'
    },
    radarCircle: {
        position: 'absolute', width: '100%', height: '100%', borderRadius: 130,
        borderWidth: 1, borderColor: theme.colors.border,
        backgroundColor: theme.colors.glass
    },
    radarLine: {
        position: 'absolute', width: '100%', height: 2, backgroundColor: MODULE_COLOR, top: '50%', opacity: 0.5
    },
    radarSweep: {
        position: 'absolute', width: '50%', height: '50%', right: 0, top: 0,
        backgroundColor: 'transparent', borderBottomWidth: 2, borderBottomColor: MODULE_COLOR,
        opacity: 0.3, transformOrigin: 'bottom left' // Note: transformOrigin might not work on older RN versions, simulated by rotation container
    },
    // Simple Spinner simulation
    spinner: {
        position: 'absolute', width: '100%', height: '100%',
        borderRightWidth: 2, borderTopWidth: 2, borderColor: scanning ? MODULE_COLOR : 'transparent', borderRadius: 130, opacity: 0.5
    },

    scoreValue: { fontSize: 64, fontWeight: '900', color: theme.colors.text },
    scoreLabel: { fontSize: 12, fontWeight: 'bold', color: theme.colors.textSecondary, letterSpacing: 2 },

    // Metrics Grid
    grid: { flexDirection: 'row', gap: 10, marginBottom: 30, width: '100%' },
    metricCard: { 
        flex: 1, backgroundColor: theme.colors.glass, borderRadius: 16, padding: 15, 
        alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border 
    },
    metricIcon: { marginBottom: 5 },
    metricVal: { fontSize: 18, fontWeight: '900', color: theme.colors.text },
    metricName: { fontSize: 10, color: theme.colors.textSecondary, fontWeight: 'bold' },

    adviceBox: { 
        width: '100%', backgroundColor: MODULE_COLOR + '15', padding: 20, 
        borderRadius: 16, marginBottom: 30, borderWidth: 1, borderColor: MODULE_COLOR 
    },
    adviceTitle: { color: MODULE_COLOR, fontWeight: '900', marginBottom: 5, fontSize: 12 },
    adviceText: { color: theme.colors.text, fontSize: 13, lineHeight: 20 },

    scanBtn: { width: '100%', borderRadius: 16, overflow: 'hidden' },
    btnGradient: { padding: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 },
    btnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1 },

    historyItem: { 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%',
        padding: 15, backgroundColor: theme.colors.glass, borderRadius: 15, marginBottom: 10,
        borderWidth: 1, borderColor: theme.colors.border 
    },
    historyDate: { color: theme.colors.textSecondary, fontWeight: '600' },
    historyVal: { color: theme.colors.text, fontWeight: 'bold', fontSize: 16 },
    sectionTitle: { width:'100%', color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold', marginBottom: 15, marginTop: 20 },
  });

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      
      {theme.isDark && (
        <View style={styles.auroraBg}>
            <View style={[styles.blob, { top: 100, right: -50, backgroundColor: 'rgba(6, 182, 212, 0.15)' }]} />
        </View>
      )}

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>SUIVI ENVIRONNEMENT</Text>
            <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            
            <View style={styles.radarContainer}>
                <View style={styles.radarCircle} />
                <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]} />
                
                <View style={{alignItems:'center'}}>
                    <MaterialCommunityIcons name={scanning ? "radar" : "shield-check"} size={40} color={scanning ? theme.colors.textSecondary : MODULE_COLOR} style={{marginBottom: 10}} />
                    {result ? (
                        <>
                            <Text style={styles.scoreValue}>{result.score}</Text>
                            <Text style={styles.scoreLabel}>SCORE GLOBAL</Text>
                        </>
                    ) : (
                        <Text style={styles.scoreLabel}>{scanning ? "ANALYSE..." : "PRÊT"}</Text>
                    )}
                </View>
            </View>

            {result && (
                <>
                    <View style={styles.grid}>
                        <View style={styles.metricCard}>
                            <MaterialCommunityIcons name="volume-high" size={20} color="#f43f5e" style={styles.metricIcon}/>
                            <Text style={styles.metricVal}>{result.noise} dB</Text>
                            <Text style={styles.metricName}>BRUIT</Text>
                        </View>
                        <View style={styles.metricCard}>
                            <MaterialCommunityIcons name="white-balance-sunny" size={20} color="#fbbf24" style={styles.metricIcon}/>
                            <Text style={styles.metricVal}>{result.light} Lx</Text>
                            <Text style={styles.metricName}>LUMIÈRE</Text>
                        </View>
                        <View style={styles.metricCard}>
                            <MaterialCommunityIcons name="air-filter" size={20} color="#22c55e" style={styles.metricIcon}/>
                            <Text style={styles.metricVal}>{result.air}%</Text>
                            <Text style={styles.metricName}>AIR</Text>
                        </View>
                    </View>

                    <View style={styles.adviceBox}>
                        <Text style={styles.adviceTitle}>DIAGNOSTIC IA</Text>
                        <Text style={styles.adviceText}>{result.advice}</Text>
                    </View>
                </>
            )}

            <TouchableOpacity style={styles.scanBtn} onPress={startScan} disabled={scanning}>
                <LinearGradient colors={scanning ? ['#555', '#777'] : ENV_GRADIENT} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.btnGradient}>
                    <MaterialCommunityIcons name="access-point" size={24} color="#fff" />
                    <Text style={styles.btnText}>{scanning ? "SCAN EN COURS..." : "LANCER SCAN"}</Text>
                </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>HISTORIQUE SCORES</Text>
            {history.map((item, i) => (
                <View key={i} style={styles.historyItem}>
                    <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString()}</Text>
                    <Text style={[styles.historyVal, {color: item.value > 80 ? theme.colors.success : theme.colors.warning}]}>{item.value}/100</Text>
                </View>
            ))}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}