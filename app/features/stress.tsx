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

export default function StressScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [loading, setLoading] = useState(false); // Chargement sauvegarde
  const [scanning, setScanning] = useState(false); // État du scan
  const [scanStep, setScanStep] = useState(''); // Texte d'étape (ex: "Analyse VFC...")
  
  // Données
  const [stressLevel, setStressLevel] = useState<number | null>(null); // 1 à 10
  const [history, setHistory] = useState<any[]>([]);

  // Couleur de base (Ambre)
  const MODULE_COLOR = '#f59e0b'; 
  const STRESS_GRADIENT: [string, string] = ['#f59e0b', '#fbbf24'];

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
            .eq('type', 'stress_level')
            .order('date', { ascending: false })
            .limit(7);

        if (data) setHistory(data);
      } catch (e) { console.log(e); }
  };

  // --- SIMULATION SCAN BIOMÉTRIQUE ---
  const startScan = () => {
      setScanning(true);
      setStressLevel(null);
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      // Séquence de simulation réaliste
      setScanStep("Connexion capteurs...");
      
      setTimeout(() => {
          setScanStep("Analyse Variabilité Cardiaque (VFC)...");
          if (Platform.OS !== 'web') Haptics.selectionAsync();
      }, 1500);

      setTimeout(() => {
          setScanStep("Calcul cohérence...");
          if (Platform.OS !== 'web') Haptics.selectionAsync();
      }, 3000);

      setTimeout(() => {
          // Génération d'un score réaliste (1-10)
          // Pour la démo, on fait un random pondéré vers le milieu (4-7)
          const result = Math.floor(Math.random() * (8 - 3 + 1) + 3);
          completeScan(result);
      }, 4500);
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

        await supabase.from('body_metrics').insert({
            user_id: session.user.id,
            type: 'stress_level',
            value: val,
            date: new Date().toISOString().split('T')[0]
        });
        
        await fetchHistory();
        // Alert.alert("Analyse terminée", "Niveau de stress enregistré."); // Optionnel, on peut juste montrer le résultat

      } catch (error: any) {
          Alert.alert("Erreur", error.message);
      } finally {
          setLoading(false);
      }
  };

  const getStressInfo = (val: number) => {
      if (val <= 3) return { label: "RELAXÉ", color: theme.colors.success, desc: "Récupération optimale. Système parasympathique dominant." };
      if (val <= 6) return { label: "MODÉRÉ", color: "#facc15", desc: "État d'éveil normal. Équilibre physiologique." };
      if (val <= 8) return { label: "ÉLEVÉ", color: theme.colors.warning, desc: "Tension détectée. Une séance de respiration est recommandée." };
      return { label: "CRITIQUE", color: theme.colors.danger, desc: "Surcharge du système nerveux. Repos impératif." };
  };

  const info = stressLevel ? getStressInfo(stressLevel) : { label: "PRÊT", color: MODULE_COLOR, desc: "Appuyez pour lancer l'analyse biométrique." };

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

    // Scanner Card
    scanCard: {
        backgroundColor: theme.colors.glass,
        borderRadius: 30, padding: 30,
        alignItems: 'center', marginBottom: 30,
        borderWidth: 1, borderColor: scanning ? '#fff' : info.color,
        shadowColor: info.color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: theme.isDark ? 0.3 : 0.1, 
        shadowRadius: 15,
        elevation: 5,
        minHeight: 300,
        justifyContent: 'center'
    },
    
    // Animation Pulse
    brainContainer: {
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: theme.isDark ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 20, borderWidth: 2, 
        borderColor: scanning ? '#fff' : info.color
    },
    
    scoreValue: { fontSize: 64, fontWeight: '900', color: theme.colors.text },
    scoreMax: { fontSize: 20, color: theme.colors.textSecondary, fontWeight: 'bold', marginTop: -10, marginBottom: 10 },
    
    statusContainer: { 
        backgroundColor: info.color + '20', 
        paddingHorizontal: 15, paddingVertical: 5, 
        borderRadius: 12, borderWidth: 1, borderColor: info.color,
        marginTop: 10
    },
    statusText: { color: info.color, fontWeight: '900', fontSize: 14, letterSpacing: 1 },
    descText: { color: theme.colors.textSecondary, marginTop: 15, fontSize: 12, textAlign: 'center', lineHeight: 18 },

    // Button
    scanBtn: { width: '100%', borderRadius: 16, overflow: 'hidden', marginTop: 10 },
    btnGradient: { padding: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
    btnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1, marginLeft: 10 },

    // History
    sectionTitle: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 15, marginLeft: 5, marginTop: 20 },
    historyItem: { 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 15, backgroundColor: theme.colors.glass, borderRadius: 15, marginBottom: 10,
        borderWidth: 1, borderColor: theme.colors.border 
    },
    historyDate: { color: theme.colors.textSecondary, fontWeight: '600' },
    historyValContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    historyVal: { color: theme.colors.text, fontWeight: 'bold', fontSize: 16 },
    historyBadge: { width: 12, height: 12, borderRadius: 6 }
  });

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      
      {theme.isDark && (
        <View style={styles.auroraBg}>
            <View style={[styles.blob, { top: 100, right: -50, backgroundColor: 'rgba(245, 158, 11, 0.15)' }]} />
        </View>
      )}

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>NIVEAU DE STRESS</Text>
            <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            
            {/* CARTE SCANNER / RÉSULTAT */}
            <View style={styles.scanCard}>
                <View style={styles.brainContainer}>
                    {scanning ? (
                        <ActivityIndicator size="large" color={MODULE_COLOR} />
                    ) : (
                        <MaterialCommunityIcons name={stressLevel ? "brain" : "fingerprint"} size={48} color={info.color} />
                    )}
                </View>
                
                {scanning ? (
                    <Text style={[styles.statusText, {color: theme.colors.text}]}>{scanStep}</Text>
                ) : (
                    <>
                        {stressLevel ? (
                            <>
                                <Text style={styles.scoreValue}>{stressLevel}</Text>
                                <Text style={styles.scoreMax}>/ 10</Text>
                                <View style={styles.statusContainer}>
                                    <Text style={styles.statusText}>{info.label}</Text>
                                </View>
                            </>
                        ) : (
                            <Text style={[styles.statusText, {color: theme.colors.textSecondary}]}>AUCUNE DONNÉE</Text>
                        )}
                    </>
                )}
                
                <Text style={styles.descText}>{info.desc}</Text>
            </View>

            {/* BOUTON SCAN */}
            <TouchableOpacity style={styles.scanBtn} onPress={startScan} disabled={scanning || loading}>
                <LinearGradient 
                    colors={scanning ? ['#555', '#777'] : STRESS_GRADIENT} 
                    start={{x:0, y:0}} end={{x:1, y:0}} 
                    style={styles.btnGradient}
                >
                    <MaterialCommunityIcons name={scanning ? "loading" : "access-point-network"} size={24} color="#fff" />
                    <Text style={styles.btnText}>
                        {scanning ? "ANALYSE EN COURS..." : "LANCER SCAN BIO"}
                    </Text>
                </LinearGradient>
            </TouchableOpacity>
            
            <Text style={{color: theme.colors.textSecondary, fontSize: 10, marginTop: 15, textAlign:'center', fontStyle:'italic'}}>
                Placez votre doigt sur la caméra (simulation) ou synchronisez votre montre.
            </Text>

            {/* HISTORIQUE */}
            <Text style={styles.sectionTitle}>DERNIERS JOURS</Text>
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
                <Text style={{color: theme.colors.textSecondary, fontStyle:'italic', marginLeft: 5}}>Aucune donnée.</Text>
            )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}