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

const { width } = Dimensions.get('window');

export default function PostureScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  
  // Critères d'évaluation (0 = Non, 1 = Oui)
  const [forwardHead, setForwardHead] = useState(false); // Tête en avant
  const [roundedShoulders, setRoundedShoulders] = useState(false); // Épaules enroulées
  const [pelvicTilt, setPelvicTilt] = useState(false); // Bascule du bassin
  
  const [score, setScore] = useState<number | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  // Couleur du module (Indigo)
  const MODULE_COLOR = '#6366f1'; 
  const POSTURE_GRADIENT: [string, string] = ['#6366f1', '#818cf8'];

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data } = await supabase
            .from('body_metrics')
            .select('date, value')
            .eq('user_id', session.user.id)
            .eq('type', 'posture_score')
            .order('date', { ascending: false })
            .limit(5);

        if (data) setHistory(data);
      } catch (e) { console.log(e); }
  };

  const calculateScore = async () => {
      setLoading(true);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Base 100 points
      let currentScore = 100;
      
      // Pénalités
      if (forwardHead) currentScore -= 20;
      if (roundedShoulders) currentScore -= 20;
      if (pelvicTilt) currentScore -= 20;

      setScore(currentScore);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        await supabase.from('body_metrics').insert({
            user_id: session.user.id,
            type: 'posture_score',
            value: currentScore,
            date: new Date().toISOString().split('T')[0]
        });
        
        await fetchHistory();

      } catch (error: any) {
          Alert.alert("Erreur", error.message);
      } finally {
          setLoading(false);
      }
  };

  const toggleCheck = (setter: React.Dispatch<React.SetStateAction<boolean>>, val: boolean) => {
      if (Platform.OS !== 'web') Haptics.selectionAsync();
      setter(!val);
  };

  const getAdvice = (s: number) => {
      if (s === 100) return "Posture parfaite ! Continuez ainsi.";
      if (s >= 80) return "Bonne posture globale. Quelques ajustements mineurs possibles.";
      if (s >= 60) return "Attention, des déséquilibres sont visibles. Intégrez des exercices de tirage.";
      return "Posture à corriger en priorité pour éviter les blessures.";
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

    // Visual Grid (Silhouette)
    gridContainer: { 
        height: 300, backgroundColor: theme.colors.glass, 
        borderRadius: 24, marginBottom: 30, 
        borderWidth: 1, borderColor: MODULE_COLOR,
        justifyContent: 'center', alignItems: 'center',
        position: 'relative', overflow: 'hidden'
    },
    gridLineV: { position: 'absolute', width: 1, height: '100%', backgroundColor: MODULE_COLOR, opacity: 0.3 },
    gridLineH: { position: 'absolute', width: '100%', height: 1, backgroundColor: MODULE_COLOR, opacity: 0.3 },
    
    bodyIcon: { opacity: 0.8 },
    
    scoreOverlay: { 
        position: 'absolute', bottom: 20, 
        backgroundColor: MODULE_COLOR, 
        paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20,
        shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 5, elevation: 5
    },
    scoreText: { color: '#fff', fontWeight: '900', fontSize: 18 },

    // Checklist
    sectionTitle: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 15, marginLeft: 5 },
    
    checkItem: { 
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: theme.colors.glass, padding: 20, borderRadius: 16, marginBottom: 10,
        borderWidth: 1, borderColor: theme.colors.border 
    },
    checkActive: { borderColor: theme.colors.danger, backgroundColor: theme.isDark ? 'rgba(239, 68, 68, 0.1)' : '#fee2e2' },
    
    checkLabel: { color: theme.colors.text, fontSize: 14, fontWeight: 'bold' },
    checkSub: { color: theme.colors.textSecondary, fontSize: 10, marginTop: 2 },
    
    checkbox: { 
        width: 24, height: 24, borderRadius: 6, borderWidth: 2, 
        borderColor: theme.colors.textSecondary, justifyContent: 'center', alignItems: 'center' 
    },
    checkboxChecked: { backgroundColor: theme.colors.danger, borderColor: theme.colors.danger },

    saveBtn: { borderRadius: 20, overflow: 'hidden', marginTop: 20, marginBottom: 30 },
    btnGradient: { padding: 18, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1 },

    // History
    historyItem: { 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 15, backgroundColor: theme.colors.glass, borderRadius: 15, marginBottom: 10,
        borderWidth: 1, borderColor: theme.colors.border 
    },
    historyDate: { color: theme.colors.textSecondary, fontWeight: '600' },
    historyVal: { color: theme.colors.text, fontWeight: 'bold', fontSize: 16 },
    
    adviceBox: { 
        backgroundColor: theme.colors.glass, padding: 15, borderRadius: 15, marginBottom: 20,
        borderWidth: 1, borderColor: theme.colors.primary 
    },
    adviceText: { color: theme.colors.text, fontSize: 13, fontStyle: 'italic', textAlign: 'center' }
  });

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      
      {theme.isDark && (
        <View style={styles.auroraBg}>
            <View style={[styles.blob, { top: 100, left: -50, backgroundColor: 'rgba(99, 102, 241, 0.15)' }]} />
        </View>
      )}

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>ANALYSE POSTURE</Text>
            <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            
            {/* VISUAL GRID */}
            <View style={styles.gridContainer}>
                <View style={styles.gridLineV} />
                <View style={styles.gridLineH} />
                <MaterialCommunityIcons name="human-male" size={240} color={theme.colors.text} style={styles.bodyIcon} />
                
                {score !== null && (
                    <View style={styles.scoreOverlay}>
                        <Text style={styles.scoreText}>SCORE: {score}/100</Text>
                    </View>
                )}
            </View>

            {score !== null && (
                <View style={styles.adviceBox}>
                    <Text style={styles.adviceText}>"{getAdvice(score)}"</Text>
                </View>
            )}

            {/* CHECKLIST */}
            <Text style={styles.sectionTitle}>AUTO-DIAGNOSTIC (Cochez si présent)</Text>
            
            <TouchableOpacity 
                style={[styles.checkItem, forwardHead && styles.checkActive]} 
                onPress={() => toggleCheck(setForwardHead, forwardHead)}
            >
                <View>
                    <Text style={styles.checkLabel}>Cou de Texto (Forward Head)</Text>
                    <Text style={styles.checkSub}>L'oreille est en avant de l'épaule</Text>
                </View>
                <View style={[styles.checkbox, forwardHead && styles.checkboxChecked]}>
                    {forwardHead && <MaterialCommunityIcons name="check" size={16} color="#fff" />}
                </View>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.checkItem, roundedShoulders && styles.checkActive]} 
                onPress={() => toggleCheck(setRoundedShoulders, roundedShoulders)}
            >
                <View>
                    <Text style={styles.checkLabel}>Épaules Enroulées</Text>
                    <Text style={styles.checkSub}>Les épaules tombent vers l'avant</Text>
                </View>
                <View style={[styles.checkbox, roundedShoulders && styles.checkboxChecked]}>
                    {roundedShoulders && <MaterialCommunityIcons name="check" size={16} color="#fff" />}
                </View>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.checkItem, pelvicTilt && styles.checkActive]} 
                onPress={() => toggleCheck(setPelvicTilt, pelvicTilt)}
            >
                <View>
                    <Text style={styles.checkLabel}>Cambrures Excessives</Text>
                    <Text style={styles.checkSub}>Le bas du dos est très creusé</Text>
                </View>
                <View style={[styles.checkbox, pelvicTilt && styles.checkboxChecked]}>
                    {pelvicTilt && <MaterialCommunityIcons name="check" size={16} color="#fff" />}
                </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={calculateScore} disabled={loading}>
                <LinearGradient colors={POSTURE_GRADIENT} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.btnGradient}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>ANALYSER</Text>}
                </LinearGradient>
            </TouchableOpacity>

            {/* HISTORIQUE */}
            <Text style={styles.sectionTitle}>SUIVI POSTURAL</Text>
            {history.length > 0 ? history.map((item, i) => (
                <View key={i} style={styles.historyItem}>
                    <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString()}</Text>
                    <Text style={[styles.historyVal, { color: item.value >= 80 ? theme.colors.success : theme.colors.warning }]}>
                        {item.value}/100
                    </Text>
                </View>
            )) : (
                <Text style={{color: theme.colors.textSecondary, fontStyle:'italic', marginLeft: 5}}>Aucun historique.</Text>
            )}

            <View style={{height: 50}} />

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}