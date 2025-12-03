import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../lib/theme';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');
type MacroGoal = 'cut' | 'maintain' | 'bulk';
type MacroProfile = 'balanced' | 'low_carb' | 'high_carb';

export default function MacrosScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [tdee, setTdee] = useState(2500); 
  const [goal, setGoal] = useState<MacroGoal>('maintain');
  const [profile, setProfile] = useState<MacroProfile>('balanced');
  const [results, setResults] = useState({ p: 0, c: 0, f: 0, cal: 0 });

  const MODULE_COLOR = '#f97316'; 

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { calculateMacros(); }, [tdee, goal, profile]);

  const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data } = await supabase.from('body_metrics').select('value').eq('user_id', session.user.id).eq('type', 'tdee').order('date', { ascending: false }).limit(1).maybeSingle();
        if (data) setTdee(Number(data.value));
      } catch (e) { console.log(e); }
      setLoading(false);
  };

  const calculateMacros = () => {
      let targetCalories = tdee;
      switch(goal) { case 'cut': targetCalories -= 500; break; case 'bulk': targetCalories += 300; break; }
      let ratios = { p: 0.3, c: 0.4, f: 0.3 };
      if (profile === 'low_carb') ratios = { p: 0.4, c: 0.2, f: 0.4 };
      if (profile === 'high_carb') ratios = { p: 0.3, c: 0.5, f: 0.2 };
      const p = Math.round((targetCalories * ratios.p) / 4);
      const c = Math.round((targetCalories * ratios.c) / 4);
      const f = Math.round((targetCalories * ratios.f) / 9);
      setResults({ p, c, f, cal: targetCalories });
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    headerTitle: { color: theme.colors.text, fontWeight: 'bold', letterSpacing: 1 },
    content: { padding: 20 },
    resultCard: { backgroundColor: theme.colors.glass, borderRadius: 24, padding: 20, marginBottom: 30, borderWidth: 1, borderColor: MODULE_COLOR, shadowColor: MODULE_COLOR, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    caloriesTitle: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: 'bold', textAlign: 'center', letterSpacing: 1 },
    caloriesValue: { color: theme.colors.text, fontSize: 48, fontWeight: '900', textAlign: 'center', marginVertical: 10 },
    macrosRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    macroItem: { alignItems: 'center', flex: 1 },
    macroValue: { fontSize: 20, fontWeight: 'bold', color: theme.colors.text },
    macroLabel: { fontSize: 10, fontWeight: 'bold', marginTop: 2 },
    macroBar: { width: 4, height: 40, borderRadius: 2, marginTop: 8 },
    sectionTitle: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 10, marginTop: 20, marginLeft: 5 },
    optionRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    optionBtn: { flex: 1, paddingVertical: 12, backgroundColor: theme.colors.glass, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    optionBtnActive: { backgroundColor: MODULE_COLOR, borderColor: MODULE_COLOR },
    optionText: { color: theme.colors.textSecondary, fontWeight: 'bold', fontSize: 12 },
    optionTextActive: { color: '#fff' },
    infoBox: { marginTop: 20, padding: 15, backgroundColor: theme.colors.glass, borderRadius: 15, borderLeftWidth: 3, borderLeftColor: MODULE_COLOR },
    infoText: { color: theme.colors.text, fontSize: 13, lineHeight: 20 }
  });

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('modules.macros.title')}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
            {loading ? <ActivityIndicator color={MODULE_COLOR} /> : (
                <>
                    <View style={styles.resultCard}>
                        <Text style={styles.caloriesTitle}>{t('modules.macros.target_title')}</Text>
                        <Text style={styles.caloriesValue}>{results.cal} kcal</Text>
                        <View style={styles.macrosRow}>
                            <View style={styles.macroItem}><Text style={styles.macroValue}>{results.p}g</Text><Text style={[styles.macroLabel, {color: '#3b82f6'}]}>PROT</Text><View style={[styles.macroBar, {backgroundColor: '#3b82f6'}]} /></View>
                            <View style={styles.macroItem}><Text style={styles.macroValue}>{results.c}g</Text><Text style={[styles.macroLabel, {color: '#eab308'}]}>CARBS</Text><View style={[styles.macroBar, {backgroundColor: '#eab308'}]} /></View>
                            <View style={styles.macroItem}><Text style={styles.macroValue}>{results.f}g</Text><Text style={[styles.macroLabel, {color: '#ef4444'}]}>LIPID</Text><View style={[styles.macroBar, {backgroundColor: '#ef4444'}]} /></View>
                        </View>
                    </View>
                    <Text style={styles.sectionTitle}>{t('modules.macros.section_goal')}</Text>
                    <View style={styles.optionRow}>
                        <TouchableOpacity onPress={() => setGoal('cut')} style={[styles.optionBtn, goal==='cut' && styles.optionBtnActive]}><Text style={[styles.optionText, goal==='cut' && styles.optionTextActive]}>{t('modules.macros.goals.cut')}</Text></TouchableOpacity>
                        <TouchableOpacity onPress={() => setGoal('maintain')} style={[styles.optionBtn, goal==='maintain' && styles.optionBtnActive]}><Text style={[styles.optionText, goal==='maintain' && styles.optionTextActive]}>{t('modules.macros.goals.maintain')}</Text></TouchableOpacity>
                        <TouchableOpacity onPress={() => setGoal('bulk')} style={[styles.optionBtn, goal==='bulk' && styles.optionBtnActive]}><Text style={[styles.optionText, goal==='bulk' && styles.optionTextActive]}>{t('modules.macros.goals.bulk')}</Text></TouchableOpacity>
                    </View>
                    <Text style={styles.sectionTitle}>{t('modules.macros.section_split')}</Text>
                    <View style={styles.optionRow}>
                        <TouchableOpacity onPress={() => setProfile('balanced')} style={[styles.optionBtn, profile==='balanced' && styles.optionBtnActive]}><Text style={[styles.optionText, profile==='balanced' && styles.optionTextActive]}>{t('modules.macros.splits.balanced')}</Text></TouchableOpacity>
                        <TouchableOpacity onPress={() => setProfile('low_carb')} style={[styles.optionBtn, profile==='low_carb' && styles.optionBtnActive]}><Text style={[styles.optionText, profile==='low_carb' && styles.optionTextActive]}>{t('modules.macros.splits.low')}</Text></TouchableOpacity>
                        <TouchableOpacity onPress={() => setProfile('high_carb')} style={[styles.optionBtn, profile==='high_carb' && styles.optionBtnActive]}><Text style={[styles.optionText, profile==='high_carb' && styles.optionTextActive]}>{t('modules.macros.splits.high')}</Text></TouchableOpacity>
                    </View>
                    <View style={styles.infoBox}><Text style={styles.infoText}>{t('modules.macros.info')}</Text></View>
                </>
            )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}