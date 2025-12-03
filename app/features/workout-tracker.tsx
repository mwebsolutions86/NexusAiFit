import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Dimensions, Platform, TextInput, Linking } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { generateWorkoutJSON } from '../../lib/groq'; 
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';
import { useWorkoutLogger } from '../hooks/useWorkoutLogger';
import { useTranslation } from 'react-i18next'; // Import

const { width } = Dimensions.get('window');

// ... (Types inchangés) ...
type ExerciseItem = { name: string; sets: string | number; reps: string | number; rest: string | number; notes?: string; };
type WorkoutDay = { day: string; focus: string; exercises: ExerciseItem[]; };
type WorkoutPlan = { title: string; days: WorkoutDay[]; };

export default function WorkoutTrackerScreen() {
  const theme = useTheme();
  const { t } = useTranslation(); // Hook
  const { saveWorkout, isSaving } = useWorkoutLogger();

  // ... (Etats et Logic inchangés, voir Lot 5) ...
  // Je ne répète pas tout le code logique pour gagner de la place, il est dans la réponse précédente.
  // L'important est le render ci-dessous.

  // ... (fetchData, loadDailyLogs, etc.) ...
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activePlan, setActivePlan] = useState<WorkoutPlan | null>(null);
  const [userFocus, setUserFocus] = useState(''); 
  const [activeTab, setActiveTab] = useState(0); 
  const [completedExercises, setCompletedExercises] = useState<any>({});
  const [sessionNote, setSessionNote] = useState('');

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/auth/index' as any); return; }

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (profile) setUserProfile(profile);

      const { data: planData } = await supabase.from('workout_plans').select('content').eq('user_id', session.user.id).eq('is_active', true).order('created_at', { ascending: false }).limit(1).single();
      if (planData?.content?.days) { setActivePlan(planData.content); loadDailyLogs(session.user.id); } 
      else { setActivePlan(null); }
    } catch (e) { console.log("Erreur fetch workout:", e); }
  };

  const loadDailyLogs = async (userId: string) => {
      const dateStr = new Date().toISOString().split('T')[0];
      const { data } = await supabase.from('workout_logs').select('exercises_status, session_note').eq('user_id', userId).eq('log_date', dateStr).single();
      if (data) { setCompletedExercises(data.exercises_status || {}); setSessionNote(data.session_note || ''); } 
      else { setCompletedExercises({}); setSessionNote(''); }
  };

  const handleGenerate = async () => {
    setLoading(true);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const focusContext = userFocus.trim() || `Adapté à mon niveau ${userProfile?.experience_level} et mon matériel ${userProfile?.equipment}`;
    try {
        const workoutJson = await generateWorkoutJSON(userProfile, focusContext);
        if (workoutJson && workoutJson.days) {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            await supabase.from('workout_plans').update({ is_active: false }).eq('user_id', session.user.id);
            const { error } = await supabase.from('workout_plans').insert({ user_id: session.user.id, content: workoutJson, title: workoutJson.title || "Programme IA", is_active: true });
            if (!error) { await fetchData(); setUserFocus(''); Alert.alert(t('workout_tracker.alert_ready_title'), t('workout_tracker.alert_ready_msg')); }
        }
    } catch (e: any) { Alert.alert("Erreur IA", e.message); } finally { setLoading(false); }
  };

  const handleFinishSession = async () => {
    if (!activePlan) return;
    const hasActivity = Object.values(completedExercises).some(v => v === true);
    if (!hasActivity) { Alert.alert(t('workout_tracker.alert_empty_title'), t('workout_tracker.alert_empty_msg')); return; }
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const currentDay = activePlan.days[activeTab];
    const sessionName = currentDay.focus ? `${activePlan.title} - ${currentDay.focus}` : activePlan.title;
    const sessionData = { name: sessionName, duration: 3600, notes: sessionNote, sets: [] as any[] };

    currentDay.exercises.forEach((ex, index) => {
        if (completedExercises[`day_${activeTab}_ex_${index}`]) {
            const sets = parseInt(String(ex.sets)) || 3;
            const reps = parseInt(String(ex.reps)) || 10;
            for(let i=0; i < sets; i++) { sessionData.sets.push({ exerciseName: ex.name, reps, weight: 0, rpe: 8 }); }
        }
    });

    const result = await saveWorkout(sessionData);
    if (result.success) {
        Alert.alert(t('workout_tracker.alert_saved_title'), t('workout_tracker.alert_saved_msg'), [{ text: t('workout_tracker.btn_history'), onPress: () => router.push('/features/workout_log' as any) }, { text: "OK", style: 'cancel' }]);
    }
  };

  const toggleExercise = async (dayIndex: number, exIndex: number) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    const key = `day_${dayIndex}_ex_${exIndex}`;
    const isChecking = !completedExercises[key]; 
    const newStatus = { ...completedExercises, [key]: isChecking };
    setCompletedExercises(newStatus);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) { await supabase.from('workout_logs').upsert({ user_id: session.user.id, log_date: new Date().toISOString().split('T')[0], exercises_status: newStatus, session_note: sessionNote }, { onConflict: 'user_id, log_date' }); }
  };

  const openVideoDemo = (exerciseName: string) => { Linking.openURL(`https://www.youtube.com/results?search_query=${encodeURIComponent(exerciseName + " exercise")}`); };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1 },
    auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
    blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.3 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 10 },
    headerTitle: { color: theme.colors.text, fontSize: 12, fontWeight: '900', letterSpacing: 2 },
    glassBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    content: { padding: 20 },
    inputCard: { padding: 30, backgroundColor: theme.colors.glass, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.primary + '40', marginTop: 20 },
    inputTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
    inputDesc: { color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 25, lineHeight: 20 },
    inputContainer: { width: '100%', marginBottom: 20 },
    inputLabel: { color: theme.colors.primary, fontSize: 10, fontWeight: 'bold', marginBottom: 8, marginLeft: 5 },
    textInput: { backgroundColor: theme.isDark ? 'rgba(0,0,0,0.3)' : theme.colors.bg, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.text, padding: 15, height: 50 },
    genBtn: { width: '100%', borderRadius: 16, overflow: 'hidden' },
    btnGradient: { padding: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
    btnGenText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
    planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    planName: { color: theme.colors.text, fontSize: 20, fontWeight: '900', fontStyle: 'italic', flex: 1 },
    planSub: { color: theme.colors.primary, fontSize: 10, fontWeight: 'bold', marginTop: 5, letterSpacing: 1 },
    regenBtnSmall: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    tabsContainer: { marginBottom: 20 },
    dayTab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: theme.colors.glass, borderWidth: 1, borderColor: theme.colors.border, marginRight: 10 },
    dayTabActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    dayText: { color: theme.colors.textSecondary, fontWeight: 'bold', fontSize: 12 },
    dayTextActive: { color: '#fff' },
    dayContainer: { marginBottom: 20 },
    dayTitle: { color: theme.colors.text, fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase' },
    badge: { backgroundColor: theme.isDark ? 'rgba(0, 243, 255, 0.1)' : theme.colors.primary + '15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.primary + '30' },
    badgeText: { color: theme.colors.primary, fontSize: 10, fontWeight: 'bold' },
    exCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.colors.glass, padding: 15, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border },
    exCardChecked: { borderColor: theme.colors.success, backgroundColor: theme.isDark ? 'rgba(74, 222, 128, 0.05)' : '#f0fdf4' },
    exName: { color: theme.colors.text, fontSize: 15, fontWeight: 'bold', marginBottom: 5 },
    exMetaRow: { flexDirection: 'row', gap: 15, flexWrap: 'wrap' },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    metaText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: 'bold' },
    exNote: { color: theme.colors.textSecondary, fontSize: 11, marginTop: 5, fontStyle: 'italic' },
    checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: theme.colors.textSecondary, justifyContent: 'center', alignItems: 'center' },
    checkboxActive: { backgroundColor: theme.colors.success, borderColor: theme.colors.success },
    regenBtn: { padding: 15, alignItems: 'center', marginTop: 20, marginBottom: 10 },
    regenText: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
    demoBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingVertical: 4, paddingHorizontal: 8, backgroundColor: theme.isDark ? 'rgba(255,0,0,0.1)' : '#fee2e2', borderRadius: 8, alignSelf: 'flex-start' },
    demoText: { color: '#ef4444', fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
    finishBtn: { backgroundColor: theme.colors.success, padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 20, marginBottom: 30 },
    finishBtnText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1, textTransform: 'uppercase' }
  });

  const renderGenerator = () => (
    <View style={styles.inputCard}>
        <MaterialCommunityIcons name="dumbbell" size={40} color={theme.colors.primary} style={{marginBottom: 15}} />
        <Text style={styles.inputTitle}>{t('workout_tracker.ia_title')}</Text>
        <Text style={styles.inputDesc}>{t('workout_tracker.ia_desc')}</Text>
        <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('workout_tracker.label_focus')}</Text>
            <TextInput style={styles.textInput} placeholder={t('workout_tracker.ph_focus')} placeholderTextColor={theme.colors.textSecondary} value={userFocus} onChangeText={setUserFocus} />
        </View>
        <TouchableOpacity style={styles.genBtn} onPress={handleGenerate} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <LinearGradient colors={[theme.colors.primary, theme.colors.secondary]} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.btnGradient}><MaterialCommunityIcons name="brain" size={20} color="#fff" style={{marginRight: 10}} /><Text style={styles.btnGenText}>{t('workout_tracker.btn_generate')}</Text></LinearGradient>}
        </TouchableOpacity>
    </View>
  );

  const renderActivePlan = () => {
    const safeDayIndex = activeTab < (activePlan?.days.length || 0) ? activeTab : 0;
    const currentDay = activePlan?.days[safeDayIndex];
    if (!currentDay) return renderGenerator();

    return (
      <View>
        <View style={styles.planHeader}>
            <View>
                <Text style={styles.planName}>{activePlan?.title}</Text>
                <Text style={styles.planSub}>{activePlan?.days.length} {t('workout_tracker.week_sessions')}</Text>
            </View>
            <TouchableOpacity onPress={handleGenerate} style={styles.regenBtnSmall}><MaterialCommunityIcons name="refresh" size={20} color={theme.colors.text} /></TouchableOpacity>
        </View>
        <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 20, gap: 10}}>
                {activePlan?.days.map((day, index) => (
                    <TouchableOpacity key={index} onPress={() => { if(Platform.OS !== 'web') Haptics.selectionAsync(); setActiveTab(index); }} style={[styles.dayTab, activeTab === index && styles.dayTabActive]}>
                        <Text style={[styles.dayText, activeTab === index && styles.dayTextActive]}>{day.day ? day.day.substring(0, 8) : `${t('workout_tracker.day_session')} ${index+1}`}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
        <View style={styles.dayContainer}>
            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: 15}}>
                 <Text style={styles.dayTitle}>{currentDay.focus || "Full Body"}</Text>
                 <View style={styles.badge}><Text style={styles.badgeText}>{currentDay.exercises.length} {t('workout_tracker.exos_count')}</Text></View>
            </View>
            {currentDay.exercises.map((ex, index) => {
                const isChecked = completedExercises[`day_${safeDayIndex}_ex_${index}`];
                return (
                    <TouchableOpacity key={index} style={[styles.exCard, isChecked && styles.exCardChecked]} onPress={() => toggleExercise(safeDayIndex, index)} activeOpacity={0.8}>
                        <View style={{flex:1}}>
                            <Text style={[styles.exName, isChecked && {color: theme.colors.textSecondary, textDecorationLine:'line-through'}]}>{ex.name}</Text>
                            <View style={styles.exMetaRow}>
                                <View style={styles.metaItem}><MaterialCommunityIcons name="repeat" size={14} color={theme.colors.primary} /><Text style={styles.metaText}>{ex.sets} x {ex.reps}</Text></View>
                                <View style={styles.metaItem}><MaterialCommunityIcons name="timer-outline" size={14} color={theme.colors.warning} /><Text style={styles.metaText}>{ex.rest}s</Text></View>
                            </View>
                            {ex.notes && <Text style={styles.exNote}>{ex.notes}</Text>}
                            <TouchableOpacity style={styles.demoBtn} onPress={() => openVideoDemo(ex.name)}><MaterialCommunityIcons name="youtube" size={14} color="#ef4444" /><Text style={styles.demoText}>{t('workout_tracker.btn_demo')}</Text></TouchableOpacity>
                        </View>
                        <View style={[styles.checkbox, isChecked && styles.checkboxActive]}>{isChecked && <Ionicons name="checkmark" size={14} color="#fff" />}</View>
                    </TouchableOpacity>
                );
            })}
        </View>
        <TouchableOpacity style={styles.finishBtn} onPress={handleFinishSession} disabled={isSaving}>
            {isSaving ? <ActivityIndicator color="#fff"/> : <Text style={styles.finishBtnText}>{t('workout_tracker.btn_finish')}</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.regenBtn} onPress={handleGenerate}><Text style={styles.regenText}>{t('workout_tracker.btn_regen')}</Text></TouchableOpacity>
        <View style={{height: 100}} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      {theme.isDark && (<View style={styles.auroraBg}><View style={[styles.blob, { top: -100, right: -50, backgroundColor: 'rgba(0, 243, 255, 0.1)' }]} /><View style={[styles.blob, { bottom: 0, left: -50, backgroundColor: 'rgba(0, 100, 255, 0.1)' }]} /></View>)}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.glassBtn}><Ionicons name="arrow-back" size={20} color={theme.colors.text} /></TouchableOpacity>
          <Text style={styles.headerTitle}>{t('workout_tracker.title')}</Text>
          <View style={{width:40}}/>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>{activePlan ? renderActivePlan() : renderGenerator()}</ScrollView>
      </SafeAreaView>
    </View>
  );
}