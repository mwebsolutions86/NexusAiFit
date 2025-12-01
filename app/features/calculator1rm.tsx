import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';

export default function Calculator1RMScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [oneRM, setOneRM] = useState<number | null>(null);

  // Couleur spécifique à ce module (Rose/Magenta)
  const TOOL_COLOR = '#db2777';
  const TOOL_GRADIENT = ['#f472b6', '#db2777'] as const;

  const calculate = () => {
    const w = parseFloat(weight);
    const r = parseInt(reps);

    if (!w || !r) {
        Alert.alert("Erreur", "Veuillez entrer un poids et un nombre de répétitions valides.");
        return;
    }
    
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Formule d'Epley
    const max = Math.round(w * (1 + r / 30));
    setOneRM(max);
  };

  const PercentageRow = ({ percent, value }: { percent: number, value: number }) => (
    <View style={styles.percentRow}>
        <Text style={styles.percentText}>{percent}%</Text>
        <View style={styles.percentBarBg}>
            <LinearGradient 
                colors={TOOL_GRADIENT} 
                start={{x:0, y:0}} end={{x:1, y:0}} 
                style={[styles.percentBarFill, { width: `${percent}%` }]} 
            />
        </View>
        <Text style={styles.weightText}>{Math.round(value)} KG</Text>
    </View>
  );

  // --- STYLES DYNAMIQUES ---
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1 },
    
    auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
    blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.2 },
  
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    headerTitle: { color: theme.colors.text, fontWeight: 'bold', letterSpacing: 1 },
  
    content: { padding: 20, alignItems: 'center' },
  
    // Result Circle
    resultCircle: { 
        width: 200, height: 200, borderRadius: 100, 
        justifyContent: 'center', alignItems: 'center', 
        marginBottom: 30, marginTop: 10,
        // Ombre portée rose subtile
        shadowColor: TOOL_COLOR,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: theme.isDark ? 0.5 : 0.2,
        shadowRadius: 20,
        elevation: 5
    },
    resultBorder: { width: '100%', height: '100%', borderRadius: 100, padding: 4, justifyContent: 'center', alignItems: 'center' },
    resultInner: { 
        width: '100%', height: '100%', borderRadius: 100, 
        backgroundColor: theme.colors.bg, // Fond adapté au thème
        justifyContent: 'center', alignItems: 'center' 
    },
    resultVal: { color: theme.colors.text, fontSize: 56, fontWeight: '900' },
    resultUnit: { color: TOOL_COLOR, fontSize: 16, fontWeight: 'bold', marginTop: -5 },
    resultLabel: { color: theme.colors.textSecondary, fontSize: 10, letterSpacing: 2, marginTop: 5, fontWeight: 'bold' },
    placeholderText: { color: theme.colors.border, fontSize: 48, fontWeight: 'bold' },
  
    // Form
    formCard: { 
        width: '100%', 
        backgroundColor: theme.colors.glass, 
        borderRadius: 24, padding: 20, marginBottom: 20,
        borderWidth: 1, borderColor: theme.colors.border,
        shadowColor: theme.isDark ? 'transparent' : '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: theme.isDark ? 0 : 0.05,
        shadowRadius: 8,
        elevation: 2
    },
    inputRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    inputLabel: { color: TOOL_COLOR, fontSize: 10, fontWeight: 'bold', marginBottom: 10, marginLeft: 5 },
    input: { 
        backgroundColor: theme.isDark ? 'rgba(0,0,0,0.3)' : '#f9fafb', 
        height: 50, borderRadius: 12, 
        color: theme.colors.text, fontSize: 18, fontWeight: 'bold', textAlign: 'center', 
        borderWidth: 1, borderColor: theme.colors.border 
    },
    
    calcBtn: { borderRadius: 16, overflow: 'hidden' },
    btnGradient: { padding: 16, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  
    // Percentages
    percentCard: { 
        width: '100%', 
        backgroundColor: theme.colors.glass, 
        borderRadius: 24, padding: 20, 
        borderWidth: 1, borderColor: TOOL_COLOR + '40' // Bordure rose légère
    },
    percentTitle: { color: theme.colors.text, fontSize: 12, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', letterSpacing: 1 },
    percentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    percentText: { color: theme.colors.textSecondary, width: 40, fontSize: 12, fontWeight: 'bold' },
    percentBarBg: { 
        flex: 1, height: 6, 
        backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', 
        borderRadius: 3, marginHorizontal: 10, overflow: 'hidden' 
    },
    percentBarFill: { height: '100%', borderRadius: 3 },
    weightText: { color: theme.colors.text, width: 60, textAlign: 'right', fontWeight: 'bold', fontSize: 14 },
  });

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      
      {theme.isDark && (
        <View style={styles.auroraBg}>
            <View style={[styles.blob, { top: 100, right: -50, backgroundColor: 'rgba(244, 114, 182, 0.15)' }]} />
        </View>
      )}

      <SafeAreaView style={styles.safeArea}>
        
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>ESTIMATION FORCE MAX</Text>
            <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
            
            {/* RESULTAT CENTRAL */}
            <View style={styles.resultCircle}>
                <LinearGradient
                    colors={TOOL_GRADIENT}
                    style={styles.resultBorder}
                >
                    <View style={styles.resultInner}>
                        {oneRM ? (
                            <>
                                <Text style={styles.resultVal}>{oneRM}</Text>
                                <Text style={styles.resultUnit}>KG</Text>
                                <Text style={styles.resultLabel}>1RM ESTIMÉ</Text>
                            </>
                        ) : (
                            <Text style={styles.placeholderText}>--</Text>
                        )}
                    </View>
                </LinearGradient>
            </View>

            {/* FORMULAIRE */}
            <View style={styles.formCard}>
                <View style={styles.inputRow}>
                    <View style={{flex:1}}>
                        <Text style={styles.inputLabel}>POIDS SOULEVÉ</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="KG" 
                            placeholderTextColor={theme.colors.textSecondary}
                            keyboardType="numeric"
                            value={weight}
                            onChangeText={setWeight}
                        />
                    </View>
                    <View style={{width: 20}} />
                    <View style={{flex:1}}>
                        <Text style={styles.inputLabel}>RÉPÉTITIONS</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="REPS" 
                            placeholderTextColor={theme.colors.textSecondary}
                            keyboardType="numeric"
                            value={reps}
                            onChangeText={setReps}
                        />
                    </View>
                </View>

                <TouchableOpacity style={styles.calcBtn} onPress={calculate}>
                    <LinearGradient colors={TOOL_GRADIENT} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.btnGradient}>
                        <Text style={styles.btnText}>CALCULER</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* TABLEAU DES POURCENTAGES */}
            {oneRM && (
                <View style={styles.percentCard}>
                    <Text style={styles.percentTitle}>ZONES D'ENTRAÎNEMENT</Text>
                    <PercentageRow percent={95} value={oneRM * 0.95} />
                    <PercentageRow percent={90} value={oneRM * 0.90} />
                    <PercentageRow percent={85} value={oneRM * 0.85} />
                    <PercentageRow percent={80} value={oneRM * 0.80} />
                    <PercentageRow percent={75} value={oneRM * 0.75} />
                    <PercentageRow percent={70} value={oneRM * 0.70} />
                    <PercentageRow percent={60} value={oneRM * 0.60} />
                    <PercentageRow percent={50} value={oneRM * 0.50} />
                </View>
            )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}