import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert, TextInput, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';
import { useTranslation } from 'react-i18next';

export default function SleepScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [hours, setHours] = useState('');
  const [quality, setQuality] = useState(3);
  const [history, setHistory] = useState<any[]>([]);
  
  const MODULE_COLOR = '#8b5cf6'; 
  const SLEEP_GRADIENT: [string, string] = ['#8b5cf6', '#a78bfa'];

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data } = await supabase.from('body_metrics').select('date, value').eq('user_id', session.user.id).eq('type', 'sleep_duration').order('date', { ascending: false }).limit(7);
        if (data) setHistory(data);
      } catch (e) { console.log(e); }
  };

  const saveSleep = async () => {
      const h = parseFloat(hours);
      if (!h || h < 0 || h > 24) { Alert.alert(t('profile.alerts.error'), "0 - 24"); return; }
      setLoading(true);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        await supabase.from('body_metrics').insert({ user_id: session.user.id, type: 'sleep_duration', value: h, date: new Date().toISOString().split('T')[0] });
        setHours('');
        await fetchHistory();
        Alert.alert(t('profile.alerts.success'), t('profile.alerts.saved'));
      } catch (error: any) { Alert.alert(t('profile.alerts.error'), error.message); } finally { setLoading(false); }
  };

  // CORRECTION : Utilisation de t('modules.sleep...')
  const getSleepStatus = (h: number) => {
      if (h < 5) return { label: t('modules.sleep.status.critical'), color: theme.colors.danger };
      if (h < 7) return { label: t('modules.sleep.status.poor'), color: theme.colors.warning };
      if (h <= 9) return { label: t('modules.sleep.status.good'), color: theme.colors.success };
      return { label: t('modules.sleep.status.excessive'), color: theme.colors.primary };
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
    mainCard: { backgroundColor: theme.colors.glass, borderRadius: 24, padding: 25, alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: MODULE_COLOR, shadowColor: MODULE_COLOR, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
    moonIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: theme.isDark ? 'rgba(139, 92, 246, 0.2)' : '#ede9fe', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    questionText: { color: theme.colors.text, fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 20 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    input: { fontSize: 48, fontWeight: '900', color: theme.colors.text, borderBottomWidth: 2, borderBottomColor: MODULE_COLOR, textAlign: 'center', minWidth: 100, paddingBottom: 5 },
    unitText: { fontSize: 20, color: theme.colors.textSecondary, fontWeight: 'bold', marginLeft: 10, marginTop: 15 },
    qualityContainer: { flexDirection: 'row', gap: 10, marginBottom: 25 },
    starBtn: { padding: 5 },
    saveBtn: { borderRadius: 20, overflow: 'hidden', width: '100%' },
    btnGradient: { padding: 18, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
    sectionTitle: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 15, marginLeft: 5 },
    historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: theme.colors.glass, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border },
    historyDate: { color: theme.colors.textSecondary, fontWeight: '600' },
    historyValContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    historyVal: { color: theme.colors.text, fontWeight: 'bold', fontSize: 16 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    statusText: { fontSize: 10, fontWeight: '900', color: '#fff' }
  });

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      {theme.isDark && (<View style={styles.auroraBg}><View style={[styles.blob, { top: 100, right: -50, backgroundColor: 'rgba(139, 92, 246, 0.15)' }]} /></View>)}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('modules.sleep.title')}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.mainCard}>
                <View style={styles.moonIcon}>
                    <MaterialCommunityIcons name="bed" size={32} color={MODULE_COLOR} />
                </View>
                <Text style={styles.questionText}>{t('modules.sleep.question')}</Text>
                <View style={styles.inputContainer}>
                    <TextInput style={styles.input} keyboardType="numeric" value={hours} onChangeText={setHours} placeholder="0.0" placeholderTextColor={theme.colors.border} />
                    <Text style={styles.unitText}>{t('modules.sleep.unit')}</Text>
                </View>
                <Text style={[styles.sectionTitle, {alignSelf:'center', marginBottom:10}]}>{t('modules.sleep.quality')}</Text>
                <View style={styles.qualityContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity key={star} onPress={() => { if(Platform.OS!=='web') Haptics.selectionAsync(); setQuality(star); }} style={styles.starBtn}>
                            <MaterialCommunityIcons name={star <= quality ? "star" : "star-outline"} size={32} color={star <= quality ? "#fbbf24" : theme.colors.border} />
                        </TouchableOpacity>
                    ))}
                </View>
                <TouchableOpacity style={styles.saveBtn} onPress={saveSleep} disabled={loading}>
                    <LinearGradient colors={SLEEP_GRADIENT} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.btnGradient}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t('modules.sleep.save')}</Text>}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
            <Text style={styles.sectionTitle}>{t('modules.sleep.history')}</Text>
            {history.length > 0 ? history.map((item, i) => {
                const status = getSleepStatus(item.value);
                return (
                    <View key={i} style={styles.historyItem}>
                        <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString(undefined, {weekday:'long'})}</Text>
                        <View style={styles.historyValContainer}>
                            <View style={[styles.statusBadge, {backgroundColor: status.color}]}>
                                <Text style={styles.statusText}>{status.label}</Text>
                            </View>
                            <Text style={styles.historyVal}>{item.value}h</Text>
                        </View>
                    </View>
                );
            }) : (
                <Text style={{color: theme.colors.textSecondary, fontStyle:'italic', marginLeft: 5}}>--</Text>
            )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}