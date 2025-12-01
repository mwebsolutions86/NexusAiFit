import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Alert, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';

const { width } = Dimensions.get('window');

export default function BmiScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  
  // Données
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bmi, setBmi] = useState<number | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  // Couleur du module (Vert Santé)
  const MODULE_COLOR = '#10b981'; 
  const BMI_GRADIENT: [string, string] = ['#10b981', '#34d399'];

  useEffect(() => {
    fetchData();
    fetchHistory();
  }, []);

  const fetchData = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data } = await supabase
                .from('profiles')
                .select('height, weight')
                .eq('id', session.user.id)
                .single();
            
            if (data) {
                if (data.height) setHeight(data.height.toString());
                if (data.weight) setWeight(data.weight.toString());
                
                // Calcul auto si données présentes
                if (data.height && data.weight) {
                    calculate(data.weight, data.height, false);
                }
            }
        }
    } catch (e) { console.log(e); }
  };

  const fetchHistory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data } = await supabase
            .from('body_metrics')
            .select('date, value')
            .eq('user_id', session.user.id)
            .eq('type', 'bmi')
            .order('date', { ascending: false })
            .limit(5);

        if (data) setHistory(data);
      } catch (e) { console.log(e); }
  };

  const calculate = async (w = parseFloat(weight), h = parseFloat(height), save = true) => {
      if (!w || !h) {
          if(save) Alert.alert("Manquant", "Veuillez entrer poids et taille.");
          return;
      }

      if (save) {
          setLoading(true);
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // BMI = Poids(kg) / Taille(m)²
      const heightInMeters = h / 100;
      const bmiCalc = w / (heightInMeters * heightInMeters);
      const finalBmi = Math.round(bmiCalc * 10) / 10;

      setBmi(finalBmi);

      if (save) {
          await saveResult(finalBmi);
          setLoading(false);
      }
  };

  const saveResult = async (val: number) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        await supabase.from('body_metrics').insert({
            user_id: session.user.id,
            type: 'bmi',
            value: val,
            date: new Date().toISOString().split('T')[0]
        });
        
        await fetchHistory();
      } catch (error: any) {
          Alert.alert("Erreur", error.message);
      }
  };

  const getInterpretation = (val: number) => {
      if (val < 18.5) return { text: "Maigreur", color: theme.colors.primary }; // Bleu
      if (val < 25) return { text: "Poids Normal", color: theme.colors.success }; // Vert
      if (val < 30) return { text: "Surpoids", color: theme.colors.warning }; // Orange
      return { text: "Obésité", color: theme.colors.danger }; // Rouge
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

    // Result Card
    resultCard: {
        backgroundColor: theme.colors.glass,
        borderRadius: 24, padding: 30,
        alignItems: 'center', marginBottom: 30,
        borderWidth: 1, borderColor: MODULE_COLOR,
        shadowColor: MODULE_COLOR, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, shadowRadius: 10, elevation: 5
    },
    resultValue: { fontSize: 56, fontWeight: '900', color: theme.colors.text },
    resultLabel: { color: theme.colors.textSecondary, fontSize: 12, letterSpacing: 2, marginTop: 5, fontWeight: 'bold' },
    
    interpBadge: { 
        marginTop: 15, paddingHorizontal: 20, paddingVertical: 8, 
        borderRadius: 20, borderWidth: 1
    },
    interpText: { fontWeight: '900', fontSize: 14, letterSpacing: 1 },

    // Gauge Visual
    gaugeContainer: { width: '100%', height: 10, backgroundColor: theme.colors.border, borderRadius: 5, marginTop: 25, flexDirection: 'row', overflow: 'hidden' },
    gaugeSection: { flex: 1, height: '100%' },
    gaugeCursor: { 
        position: 'absolute', top: -5, width: 4, height: 20, 
        backgroundColor: theme.colors.text, borderRadius: 2, 
        zIndex: 10 
    },

    // Form
    formSection: { marginBottom: 30 },
    sectionTitle: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 15, marginLeft: 5 },
    
    inputRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    inputGroup: { flex: 1 },
    inputLabel: { color: theme.colors.text, fontSize: 12, fontWeight: 'bold', marginBottom: 8, marginLeft: 5 },
    input: { 
        backgroundColor: theme.colors.glass, 
        height: 50, borderRadius: 15, 
        paddingHorizontal: 15, color: theme.colors.text, fontSize: 16, fontWeight: 'bold',
        borderWidth: 1, borderColor: theme.colors.border 
    },

    calcBtn: { borderRadius: 20, overflow: 'hidden', marginTop: 10 },
    btnGradient: { padding: 18, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1 },

    // History
    historyItem: { 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 15, backgroundColor: theme.colors.glass, borderRadius: 15, marginBottom: 10,
        borderWidth: 1, borderColor: theme.colors.border 
    },
    historyDate: { color: theme.colors.textSecondary, fontWeight: '600' },
    historyVal: { color: theme.colors.text, fontWeight: 'bold' }
  });

  const interpretation = bmi ? getInterpretation(bmi) : null;
  
  // Position du curseur sur la jauge (min 15, max 35 pour l'échelle visuelle)
  const cursorPosition = bmi 
    ? Math.min(Math.max(((bmi - 15) / (35 - 15)) * 100, 0), 100) 
    : 0;

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      
      {theme.isDark && (
        <View style={styles.auroraBg}>
            <View style={[styles.blob, { top: 100, right: -50, backgroundColor: 'rgba(16, 185, 129, 0.15)' }]} />
        </View>
      )}

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>INDICE MASSE CORPORELLE</Text>
            <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            
            {/* RESULTAT */}
            <View style={styles.resultCard}>
                {bmi ? (
                    <>
                        <Text style={styles.resultValue}>{bmi}</Text>
                        <Text style={styles.resultLabel}>VOTRE IMC</Text>
                        
                        <View style={[styles.interpBadge, { borderColor: interpretation?.color, backgroundColor: interpretation?.color + '15' }]}>
                            <Text style={[styles.interpText, { color: interpretation?.color }]}>
                                {interpretation?.text.toUpperCase()}
                            </Text>
                        </View>

                        <View style={styles.gaugeContainer}>
                            <View style={[styles.gaugeSection, { backgroundColor: theme.colors.primary }]} /> 
                            <View style={[styles.gaugeSection, { backgroundColor: theme.colors.success }]} /> 
                            <View style={[styles.gaugeSection, { backgroundColor: theme.colors.warning }]} /> 
                            <View style={[styles.gaugeSection, { backgroundColor: theme.colors.danger }]} /> 
                            <View style={[styles.gaugeCursor, { left: `${cursorPosition}%` }]} />
                        </View>
                    </>
                ) : (
                    <>
                        <MaterialCommunityIcons name="human-handsup" size={48} color={MODULE_COLOR} style={{opacity: 0.5}} />
                        <Text style={[styles.resultLabel, {marginTop:15}]}>CALCULATEUR DE SANTÉ</Text>
                    </>
                )}
            </View>

            {/* FORMULAIRE */}
            <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>MESURES</Text>
                
                <View style={styles.inputRow}>
                    <View style={[styles.inputGroup, {marginRight: 10}]}>
                        <Text style={styles.inputLabel}>POIDS (KG)</Text>
                        <TextInput 
                            style={styles.input} 
                            keyboardType="numeric" 
                            value={weight} 
                            onChangeText={setWeight} 
                            placeholderTextColor={theme.colors.textSecondary} 
                            placeholder="70" 
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>TAILLE (CM)</Text>
                        <TextInput 
                            style={styles.input} 
                            keyboardType="numeric" 
                            value={height} 
                            onChangeText={setHeight} 
                            placeholderTextColor={theme.colors.textSecondary} 
                            placeholder="175" 
                        />
                    </View>
                </View>

                <TouchableOpacity style={styles.calcBtn} onPress={() => calculate(undefined, undefined, true)} disabled={loading}>
                    <LinearGradient colors={BMI_GRADIENT} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.btnGradient}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>CALCULER & SAUVEGARDER</Text>}
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* HISTORIQUE */}
            <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>HISTORIQUE</Text>
                {history.length > 0 ? history.map((item, i) => (
                    <View key={i} style={styles.historyItem}>
                        <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString()}</Text>
                        <Text style={styles.historyVal}>{item.value}</Text>
                    </View>
                )) : (
                    <Text style={{color: theme.colors.textSecondary, fontStyle:'italic'}}>Aucun historique.</Text>
                )}
            </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}