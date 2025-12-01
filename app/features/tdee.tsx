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

export default function TdeeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  
  // Données utilisateur
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activity, setActivity] = useState('sedentary');
  
  const [tdee, setTdee] = useState<number | null>(null);
  const [bmr, setBmr] = useState<number | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  // Couleur du module (Feu/Energie)
  const MODULE_COLOR = '#f97316'; 
  const FIRE_GRADIENT: [string, string] = ['#f97316', '#fbbf24'];

  useEffect(() => {
    fetchUserData();
    fetchHistory();
  }, []);

  const fetchUserData = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data } = await supabase
                .from('profiles')
                .select('gender, age, height, weight, activity_level')
                .eq('id', session.user.id)
                .single();
            
            if (data) {
                if (data.gender) setGender(data.gender === 'female' ? 'female' : 'male');
                if (data.age) setAge(data.age.toString());
                if (data.height) setHeight(data.height.toString());
                if (data.weight) setWeight(data.weight.toString());
                if (data.activity_level) setActivity(data.activity_level);
                
                // Calcul automatique au chargement si données présentes
                if(data.weight && data.height && data.age) {
                    calculate(data.weight, data.height, data.age, data.gender, data.activity_level, false);
                }
            }
        }
    } catch (e) {
        console.log("Erreur chargement profil", e);
    }
  };

  const fetchHistory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data } = await supabase
            .from('body_metrics')
            .select('date, value')
            .eq('user_id', session.user.id)
            .eq('type', 'tdee')
            .order('date', { ascending: false })
            .limit(5);

        if (data) setHistory(data);
      } catch (e) { console.log(e); }
  };

  const getActivityMultiplier = (level: string) => {
      switch(level) {
          case 'sedentary': return 1.2;
          case 'light': return 1.375;
          case 'moderate': return 1.55;
          case 'active': return 1.725;
          case 'athlete': return 1.9;
          default: return 1.2;
      }
  };

  const calculate = async (
      w = parseFloat(weight), 
      h = parseFloat(height), 
      a = parseFloat(age), 
      g = gender, 
      act = activity,
      save = true
  ) => {
    if (!w || !h || !a) {
        if(save) Alert.alert("Manquant", "Remplissez tous les champs.");
        return;
    }

    if (save) {
        setLoading(true);
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Formule Mifflin-St Jeor
    let s = g === 'male' ? 5 : -161;
    let bmrCalc = (10 * w) + (6.25 * h) - (5 * a) + s;
    let tdeeCalc = bmrCalc * getActivityMultiplier(act);

    setBmr(Math.round(bmrCalc));
    setTdee(Math.round(tdeeCalc));

    if (save) {
        await saveResult(Math.round(tdeeCalc));
        setLoading(false);
    }
  };

  const saveResult = async (val: number) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        await supabase.from('body_metrics').insert({
            user_id: session.user.id,
            type: 'tdee',
            value: val,
            date: new Date().toISOString().split('T')[0]
        });
        
        await fetchHistory();
      } catch (error: any) {
          Alert.alert("Erreur", error.message);
      }
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

    // Result Circle
    resultCard: {
        backgroundColor: theme.colors.glass,
        borderRadius: 24, padding: 25,
        alignItems: 'center', marginBottom: 30,
        borderWidth: 1, borderColor: MODULE_COLOR,
        shadowColor: MODULE_COLOR, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, shadowRadius: 10, elevation: 5
    },
    flameIcon: { 
        width: 60, height: 60, borderRadius: 30, 
        backgroundColor: theme.isDark ? 'rgba(249, 115, 22, 0.2)' : '#fff7ed', 
        justifyContent: 'center', alignItems: 'center', marginBottom: 15 
    },
    resultValue: { fontSize: 48, fontWeight: '900', color: theme.colors.text },
    resultUnit: { fontSize: 16, color: MODULE_COLOR, fontWeight: 'bold', marginTop: -5 },
    resultLabel: { color: theme.colors.textSecondary, fontSize: 12, letterSpacing: 2, marginTop: 5, fontWeight: 'bold' },
    
    bmrContainer: { 
        marginTop: 20, paddingHorizontal: 20, paddingVertical: 8, 
        borderRadius: 12, backgroundColor: theme.colors.cardBg,
        borderWidth: 1, borderColor: theme.colors.border
    },
    bmrText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: 'bold' },

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

    // Activity Selector
    activityScroll: { marginBottom: 20 },
    actBtn: { 
        paddingHorizontal: 15, paddingVertical: 10, 
        borderRadius: 12, backgroundColor: theme.colors.glass, 
        marginRight: 10, borderWidth: 1, borderColor: theme.colors.border 
    },
    actBtnActive: { backgroundColor: MODULE_COLOR, borderColor: MODULE_COLOR },
    actText: { color: theme.colors.textSecondary, fontWeight: 'bold', fontSize: 12 },
    actTextActive: { color: '#fff' },

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

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      
      {theme.isDark && (
        <View style={styles.auroraBg}>
            <View style={[styles.blob, { top: 100, left: -50, backgroundColor: 'rgba(249, 115, 22, 0.15)' }]} />
        </View>
      )}

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>MÉTABOLISME</Text>
            <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            
            {/* RESULTAT */}
            <View style={styles.resultCard}>
                <View style={styles.flameIcon}>
                    <MaterialCommunityIcons name="fire" size={32} color={MODULE_COLOR} />
                </View>
                {tdee ? (
                    <>
                        <Text style={styles.resultValue}>{tdee}</Text>
                        <Text style={styles.resultUnit}>KCAL / JOUR</Text>
                        <Text style={styles.resultLabel}>DÉPENSE TOTALE (TDEE)</Text>
                        <View style={styles.bmrContainer}>
                            <Text style={styles.bmrText}>Métabolisme de base (BMR) : {bmr} kcal</Text>
                        </View>
                    </>
                ) : (
                    <Text style={[styles.resultLabel, {marginTop:0}]}>ENTREZ VOS DONNÉES</Text>
                )}
            </View>

            {/* FORMULAIRE */}
            <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>PARAMÈTRES</Text>
                
                <View style={styles.inputRow}>
                    <View style={[styles.inputGroup, {marginRight: 10}]}>
                        <Text style={styles.inputLabel}>POIDS (KG)</Text>
                        <TextInput style={styles.input} keyboardType="numeric" value={weight} onChangeText={setWeight} placeholderTextColor={theme.colors.textSecondary} placeholder="70" />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>TAILLE (CM)</Text>
                        <TextInput style={styles.input} keyboardType="numeric" value={height} onChangeText={setHeight} placeholderTextColor={theme.colors.textSecondary} placeholder="175" />
                    </View>
                </View>

                <View style={styles.inputRow}>
                    <View style={[styles.inputGroup, {marginRight: 10}]}>
                        <Text style={styles.inputLabel}>ÂGE</Text>
                        <TextInput style={styles.input} keyboardType="numeric" value={age} onChangeText={setAge} placeholderTextColor={theme.colors.textSecondary} placeholder="25" />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>GENRE</Text>
                        <TouchableOpacity 
                            style={[styles.input, {justifyContent:'center', alignItems:'center'}]} 
                            onPress={() => setGender(gender === 'male' ? 'female' : 'male')}
                        >
                            <Text style={{color: theme.colors.text, fontWeight:'bold'}}>{gender === 'male' ? 'HOMME' : 'FEMME'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.inputLabel}>NIVEAU D'ACTIVITÉ</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activityScroll}>
                    {[
                        {id: 'sedentary', label: 'Sédentaire'},
                        {id: 'light', label: 'Léger'},
                        {id: 'moderate', label: 'Modéré'},
                        {id: 'active', label: 'Actif'},
                        {id: 'athlete', label: 'Athlète'}
                    ].map((act) => (
                        <TouchableOpacity 
                            key={act.id} 
                            style={[styles.actBtn, activity === act.id && styles.actBtnActive]}
                            onPress={() => setActivity(act.id)}
                        >
                            <Text style={[styles.actText, activity === act.id && styles.actTextActive]}>{act.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <TouchableOpacity style={styles.calcBtn} onPress={() => calculate(undefined, undefined, undefined, undefined, undefined, true)} disabled={loading}>
                    <LinearGradient colors={FIRE_GRADIENT} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.btnGradient}>
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
                        <Text style={styles.historyVal}>{Math.round(item.value)} kcal</Text>
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