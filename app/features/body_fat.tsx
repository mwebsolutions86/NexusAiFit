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
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

export default function BodyFatScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [height, setHeight] = useState('');
  const [neck, setNeck] = useState('');
  const [waist, setWaist] = useState('');
  const [hip, setHip] = useState(''); 
  
  const [result, setResult] = useState<number | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  const MODULE_COLOR = '#ffaa00'; 

  useEffect(() => { fetchUserData(); fetchHistory(); }, []);

  const fetchUserData = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data } = await supabase.from('profiles').select('gender, height').eq('id', session.user.id).single();
            if (data) {
                if (data.gender) setGender(data.gender === 'female' ? 'female' : 'male');
                if (data.height) setHeight(data.height.toString());
            }
        }
    } catch (e) { console.log("Erreur profil", e); }
  };

  const fetchHistory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data } = await supabase.from('body_metrics').select('date, value').eq('user_id', session.user.id).eq('type', 'body_fat').order('date', { ascending: false }).limit(5);
        if (data) setHistory(data);
      } catch (e) { console.log(e); }
  };

  const calculateBodyFat = async () => {
    if (!height || !neck || !waist || (gender === 'female' && !hip)) { Alert.alert(t('profile.alerts.error'), "Veuillez remplir toutes les mensurations."); return; }
    setLoading(true);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const h = parseFloat(height); const n = parseFloat(neck); const w = parseFloat(waist); const hi = parseFloat(hip);
    let bodyFat = 0;
    if (gender === 'male') { bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(w - n) + 0.15456 * Math.log10(h)) - 450; } 
    else { bodyFat = 495 / (1.29579 - 0.35004 * Math.log10(w + hi - n) + 0.22100 * Math.log10(h)) - 450; }
    const finalResult = Math.round(bodyFat * 10) / 10;
    
    if (isNaN(finalResult) || finalResult < 2 || finalResult > 60) { setLoading(false); Alert.alert("Erreur", "Résultat incohérent."); return; }
    setResult(finalResult);
    await saveResult(finalResult);
    setLoading(false);
  };

  const saveResult = async (val: number) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        await supabase.from('body_metrics').insert({ user_id: session.user.id, type: 'body_fat', value: val, date: new Date().toISOString().split('T')[0] });
        await fetchHistory();
      } catch (error: any) { Alert.alert("Erreur", error.message); }
  };

  const getInterpretation = (bf: number) => {
      if (gender === 'male') {
          if (bf < 6) return t('modules.body_fat.interp.essential');
          if (bf < 14) return t('modules.body_fat.interp.athlete');
          if (bf < 18) return t('modules.body_fat.interp.fitness');
          if (bf < 25) return t('modules.body_fat.interp.average');
          return t('modules.body_fat.interp.obese');
      } else {
          if (bf < 14) return t('modules.body_fat.interp.essential');
          if (bf < 21) return t('modules.body_fat.interp.athlete');
          if (bf < 25) return t('modules.body_fat.interp.fitness');
          if (bf < 32) return t('modules.body_fat.interp.average');
          return t('modules.body_fat.interp.obese');
      }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1 },
    auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
    blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.2 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    headerTitle: { color: theme.colors.text, fontWeight: 'bold', letterSpacing: 1 },
    content: { padding: 20 },
    resultCard: { backgroundColor: theme.colors.glass, borderRadius: 24, padding: 30, alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: MODULE_COLOR, shadowColor: theme.isDark ? MODULE_COLOR : '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: theme.isDark ? 0.2 : 0.1, shadowRadius: 10, elevation: 5 },
    resultValue: { fontSize: 48, fontWeight: '900', color: theme.colors.text },
    resultUnit: { fontSize: 20, color: MODULE_COLOR, fontWeight: 'bold' },
    resultLabel: { color: theme.colors.textSecondary, fontSize: 12, letterSpacing: 2, marginTop: 5, fontWeight: 'bold' },
    resultInterp: { marginTop: 15, paddingHorizontal: 15, paddingVertical: 5, borderRadius: 12, backgroundColor: theme.isDark ? MODULE_COLOR + '20' : '#fff8e1', borderWidth: 1, borderColor: MODULE_COLOR },
    interpText: { color: MODULE_COLOR, fontWeight: 'bold', fontSize: 12 },
    formSection: { marginBottom: 30 },
    sectionTitle: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 15, marginLeft: 5 },
    inputRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    inputGroup: { flex: 1 },
    inputLabel: { color: theme.colors.text, fontSize: 12, fontWeight: 'bold', marginBottom: 8, marginLeft: 5 },
    input: { backgroundColor: theme.colors.glass, height: 50, borderRadius: 15, paddingHorizontal: 15, color: theme.colors.text, fontSize: 16, fontWeight: 'bold', borderWidth: 1, borderColor: theme.colors.border },
    genderSwitch: { flexDirection: 'row', backgroundColor: theme.colors.glass, borderRadius: 15, padding: 5, marginBottom: 20, borderWidth: 1, borderColor: theme.colors.border },
    genderBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
    genderBtnActive: { backgroundColor: theme.colors.cardBg, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
    genderText: { fontWeight: 'bold', color: theme.colors.textSecondary },
    genderTextActive: { color: theme.colors.text },
    calcBtn: { borderRadius: 20, overflow: 'hidden', marginTop: 10 },
    btnGradient: { padding: 18, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
    historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: theme.colors.glass, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border },
    historyDate: { color: theme.colors.textSecondary, fontWeight: '600' },
    historyVal: { color: theme.colors.text, fontWeight: 'bold' }
  });

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      {theme.isDark && (<View style={styles.auroraBg}><View style={[styles.blob, { top: 100, right: -50, backgroundColor: 'rgba(255, 170, 0, 0.15)' }]} /></View>)}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('modules.body_fat.title')}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.resultCard}>
                {result ? (
                    <>
                        <View style={{flexDirection:'row', alignItems:'baseline'}}><Text style={styles.resultValue}>{result}</Text><Text style={styles.resultUnit}>%</Text></View>
                        <Text style={styles.resultLabel}>{t('modules.body_fat.result_label')}</Text>
                        <View style={styles.resultInterp}><Text style={styles.interpText}>{getInterpretation(result).toUpperCase()}</Text></View>
                    </>
                ) : (
                    <>
                        <MaterialCommunityIcons name="water-percent" size={48} color={MODULE_COLOR} style={{opacity: 0.5}} />
                        <Text style={[styles.resultLabel, {marginTop:15}]}>{t('modules.body_fat.input_info')}</Text>
                    </>
                )}
            </View>
            <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>PARAMÈTRES</Text>
                <View style={styles.genderSwitch}>
                    <TouchableOpacity onPress={() => setGender('male')} style={[styles.genderBtn, gender==='male' && styles.genderBtnActive]}>
                        <Text style={[styles.genderText, gender==='male' && styles.genderTextActive]}>{t('modules.body_fat.gender_m')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setGender('female')} style={[styles.genderBtn, gender==='female' && styles.genderBtnActive]}>
                        <Text style={[styles.genderText, gender==='female' && styles.genderTextActive]}>{t('modules.body_fat.gender_f')}</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.inputRow}>
                    <View style={[styles.inputGroup, {marginRight: 10}]}>
                        <Text style={styles.inputLabel}>TAILLE (CM)</Text>
                        <TextInput style={styles.input} keyboardType="numeric" placeholder="175" placeholderTextColor={theme.colors.textSecondary} value={height} onChangeText={setHeight} />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>{t('modules.body_fat.neck')}</Text>
                        <TextInput style={styles.input} keyboardType="numeric" placeholder="38" placeholderTextColor={theme.colors.textSecondary} value={neck} onChangeText={setNeck} />
                    </View>
                </View>
                <View style={styles.inputRow}>
                    <View style={[styles.inputGroup, {marginRight: gender==='female' ? 10 : 0}]}>
                        <Text style={styles.inputLabel}>{t('modules.body_fat.waist')}</Text>
                        <TextInput style={styles.input} keyboardType="numeric" placeholder="80" placeholderTextColor={theme.colors.textSecondary} value={waist} onChangeText={setWaist} />
                    </View>
                    {gender === 'female' && (
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>{t('modules.body_fat.hip')}</Text>
                            <TextInput style={styles.input} keyboardType="numeric" placeholder="95" placeholderTextColor={theme.colors.textSecondary} value={hip} onChangeText={setHip} />
                        </View>
                    )}
                </View>
                <TouchableOpacity style={styles.calcBtn} onPress={calculateBodyFat} disabled={loading}>
                    <LinearGradient colors={[MODULE_COLOR, '#fbbf24']} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.btnGradient}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>CALCULER</Text>}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
            <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>{t('modules.body_fat.history_title')}</Text>
                {history.length > 0 ? history.map((item, i) => (
                    <View key={i} style={styles.historyItem}>
                        <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString()}</Text>
                        <Text style={styles.historyVal}>{item.value}%</Text>
                    </View>
                )) : (
                    <Text style={{color: theme.colors.textSecondary, fontStyle:'italic', marginLeft: 5}}>--</Text>
                )}
            </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}