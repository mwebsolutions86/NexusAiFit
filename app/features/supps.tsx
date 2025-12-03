import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, Alert, KeyboardAvoidingView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';
import { useTranslation } from 'react-i18next';

export default function SuppsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const [supps, setSupps] = useState<any[]>([]);
  const [newName, setNewName] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [newFreq, setNewFreq] = useState('');
  const MODULE_COLOR = '#6366f1'; 
  const SUPP_GRADIENT: [string, string] = ['#6366f1', '#818cf8'];

  // Les données "ESSENTIALS" restent en dur car ce sont des noms scientifiques
  const ESSENTIALS = [
      { name: 'Créatine Monohydrate', dosage: '5g', freq: 'Quotidien' },
      { name: 'Whey Isolate', dosage: '30g', freq: 'Post-workout' },
      { name: 'Multivitamine', dosage: '1 cap', freq: 'Matin' },
      { name: 'Omega-3', dosage: '2g', freq: 'Matin/Soir' },
      { name: 'Magnésium Bisglycinate', dosage: '300mg', freq: 'Soir' },
      { name: 'ZMA', dosage: '1 dose', freq: 'Soir' },
      { name: 'Ashwagandha', dosage: '600mg', freq: 'Soir' }
  ];

  useEffect(() => { fetchSupps(); }, []);

  const fetchSupps = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data } = await supabase.from('user_supplements').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
        if (data) setSupps(data);
    } catch (e) { console.log(e); }
  };

  const addSupp = async (nameArg?: string, dosageArg?: string, freqArg?: string) => {
      const n = nameArg || newName;
      const d = dosageArg || newDosage;
      const f = freqArg || newFreq;
      if (!n.trim()) return;
      if (Platform.OS !== 'web') Haptics.selectionAsync();
      if (!nameArg) { setNewName(''); setNewDosage(''); setNewFreq(''); }
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data, error } = await supabase.from('user_supplements').insert({ user_id: session.user.id, name: n.trim(), dosage: d.trim(), frequency: f.trim() }).select().single();
        if (error) throw error;
        if (data) setSupps(prev => [data, ...prev]);
      } catch (e) { console.log(e); }
  };

  const deleteSupp = async (id: string) => {
      setSupps(supps.filter(i => i.id !== id)); 
      try { await supabase.from('user_supplements').delete().eq('id', id); } catch (e) { console.log(e); }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    headerTitle: { color: theme.colors.text, fontWeight: 'bold', letterSpacing: 1 },
    content: { flex: 1, paddingHorizontal: 20 },
    formCard: { backgroundColor: theme.colors.glass, padding: 20, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: theme.colors.border },
    inputLabel: { color: MODULE_COLOR, fontSize: 10, fontWeight: 'bold', marginBottom: 5, marginLeft: 5 },
    input: { backgroundColor: theme.isDark ? 'rgba(0,0,0,0.3)' : theme.colors.bg, borderRadius: 12, padding: 12, marginBottom: 15, color: theme.colors.text, fontSize: 16, borderWidth: 1, borderColor: theme.colors.border },
    rowInputs: { flexDirection: 'row', gap: 10 },
    addBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 5 },
    btnGradient: { padding: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
    btnText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
    sectionTitle: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 15, marginLeft: 5, marginTop: 10 },
    chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 25 },
    chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.colors.glass, borderWidth: 1, borderColor: theme.colors.border, flexDirection: 'row', alignItems: 'center' },
    chipText: { color: theme.colors.text, fontSize: 11, fontWeight: '600' },
    suppCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.glass, padding: 15, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border },
    iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: MODULE_COLOR + '20', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    suppInfo: { flex: 1 },
    suppName: { color: theme.colors.text, fontSize: 16, fontWeight: 'bold' },
    suppDetails: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 },
    suppBadge: { backgroundColor: theme.colors.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: theme.colors.border },
    suppDosage: { color: MODULE_COLOR, fontSize: 10, fontWeight: 'bold' },
    deleteBtn: { padding: 10 }
  });

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('modules.supps.title')}</Text>
        </View>
        <ScrollView contentContainerStyle={{paddingBottom: 50}} style={styles.content} showsVerticalScrollIndicator={false}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <View style={styles.formCard}>
                    <Text style={styles.inputLabel}>{t('modules.supps.manual_title')}</Text>
                    <TextInput style={styles.input} placeholder={t('modules.supps.input_name')} placeholderTextColor={theme.colors.textSecondary} value={newName} onChangeText={setNewName} />
                    <View style={styles.rowInputs}>
                        <View style={{flex: 1}}><TextInput style={styles.input} placeholder={t('modules.supps.input_dose')} placeholderTextColor={theme.colors.textSecondary} value={newDosage} onChangeText={setNewDosage} /></View>
                        <View style={{flex: 1}}><TextInput style={styles.input} placeholder={t('modules.supps.input_freq')} placeholderTextColor={theme.colors.textSecondary} value={newFreq} onChangeText={setNewFreq} /></View>
                    </View>
                    <TouchableOpacity style={styles.addBtn} onPress={() => addSupp()}>
                        <LinearGradient colors={SUPP_GRADIENT} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.btnGradient}>
                            <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                            <Text style={styles.btnText}>{t('modules.supps.btn_add')}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
            <Text style={styles.sectionTitle}>{t('modules.supps.quick_title')}</Text>
            <View style={styles.chipsContainer}>
                {ESSENTIALS.map((item, index) => (
                    <TouchableOpacity key={index} style={styles.chip} onPress={() => addSupp(item.name, item.dosage, item.freq)}>
                        <MaterialCommunityIcons name="plus-circle" size={14} color={MODULE_COLOR} style={{marginRight:4}} />
                        <Text style={styles.chipText}>{item.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <Text style={[styles.sectionTitle, {marginTop: 20}]}>{t('modules.supps.my_stack')} ({supps.length})</Text>
            {supps.length > 0 ? supps.map((item) => (
                <View key={item.id} style={styles.suppCard}>
                    <View style={styles.iconBox}><MaterialCommunityIcons name="bottle-tonic-plus" size={20} color={MODULE_COLOR} /></View>
                    <View style={styles.suppInfo}>
                        <Text style={styles.suppName}>{item.name}</Text>
                        <Text style={styles.suppDetails}>{item.frequency}</Text>
                    </View>
                    <View style={styles.suppBadge}><Text style={styles.suppDosage}>{item.dosage}</Text></View>
                    <TouchableOpacity onPress={() => deleteSupp(item.id)} style={styles.deleteBtn}><MaterialCommunityIcons name="close" size={18} color={theme.colors.textSecondary} /></TouchableOpacity>
                </View>
            )) : (
                <View style={{alignItems:'center', marginTop: 30, opacity: 0.5}}><MaterialCommunityIcons name="bottle-tonic-outline" size={48} color={theme.colors.textSecondary} /><Text style={{color: theme.colors.textSecondary, marginTop: 10}}>{t('modules.supps.empty')}</Text></View>
            )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}