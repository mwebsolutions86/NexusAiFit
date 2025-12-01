import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Dimensions, Platform, TextInput } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { generateWorkoutJSON } from '../../lib/groq'; 
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// --- TYPES ---
type ExerciseItem = {
  name: string;
  sets: string | number;
  reps: string | number;
  rest: string | number; // temps de repos en secondes
  notes?: string;
};

type WorkoutDay = {
  day: string;
  focus: string;
  exercises: ExerciseItem[];
};

type WorkoutPlan = {
  title: string;
  days: WorkoutDay[];
};

export default function WorkoutTrackerScreen() {
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activePlan, setActivePlan] = useState<WorkoutPlan | null>(null);
  const [userFocus, setUserFocus] = useState(''); // Ex: "Bras, Pecs, Cardio..."
  const [activeTab, setActiveTab] = useState(0); // Jour sélectionné
  
  // État des checks pour la séance du jour
  const [completedExercises, setCompletedExercises] = useState<any>({});
  const [sessionNote, setSessionNote] = useState('');
  const [isNoteVisible, setIsNoteVisible] = useState(false);

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/auth/index'); return; }

      // 1. Profil
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (profile) setUserProfile(profile);

      // 2. Plan Actif
      const { data: planData } = await supabase
        .from('workout_plans')
        .select('content')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (planData?.content) {
          // Sécurité structure
          if (planData.content.days && Array.isArray(planData.content.days)) {
             setActivePlan(planData.content);
             loadDailyLogs(session.user.id); // Charger les logs du jour si plan existe
          } else {
             setActivePlan(null);
          }
      } else {
        setActivePlan(null);
      }
    } catch (e) { console.log("Erreur fetch workout:", e); }
  };

  const loadDailyLogs = async (userId: string) => {
      const dateStr = new Date().toISOString().split('T')[0];
      const { data } = await supabase
          .from('workout_logs')
          .select('exercises_status, session_note')
          .eq('user_id', userId)
          .eq('log_date', dateStr)
          .single();
      
      if (data) {
          setCompletedExercises(data.exercises_status || {});
          setSessionNote(data.session_note || '');
      } else {
          setCompletedExercises({});
          setSessionNote('');
      }
  };

  const handleGenerate = async () => {
    setLoading(true);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    // Si pas de focus précis, l'IA décide selon le profil
    const focusContext = userFocus.trim() || `Adapté à mon niveau ${userProfile?.experience_level} et mon matériel ${userProfile?.equipment}`;

    try {
        const workoutJson = await generateWorkoutJSON(userProfile, focusContext);
        
        if (workoutJson && workoutJson.days && Array.isArray(workoutJson.days)) {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            
            // Désactiver anciens plans
            await supabase.from('workout_plans').update({ is_active: false }).eq('user_id', session.user.id);
            
            // Insérer nouveau plan
            const { error } = await supabase.from('workout_plans').insert({
                user_id: session.user.id, 
                content: workoutJson, 
                title: workoutJson.title || "Programme Sur-Mesure",
                is_active: true
            });

            if (!error) { 
                await fetchData(); 
                setUserFocus(''); 
                Alert.alert("Programme Prêt", "Votre semaine d'entraînement a été générée !");
            } else {
                Alert.alert("Erreur Base de données", error.message);
            }
        } else {
             throw new Error("Format JSON invalide reçu de l'IA");
        }
    } catch (e: any) {
        Alert.alert("Erreur IA", e.message || "Impossible de générer le programme.");
    } finally {
        setLoading(false);
    }
  };

  const toggleExercise = async (dayIndex: number, exIndex: number) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    
    // Clé unique pour l'exercice du jour : "day_0_ex_1"
    const key = `day_${dayIndex}_ex_${exIndex}`;
    const newStatus = { ...completedExercises, [key]: !completedExercises[key] };
    
    setCompletedExercises(newStatus);
    
    // Sauvegarde silencieuse
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        const dateStr = new Date().toISOString().split('T')[0];
        await supabase.from('workout_logs').upsert({
            user_id: session.user.id,
            log_date: dateStr,
            exercises_status: newStatus,
            session_note: sessionNote
        }, { onConflict: 'user_id, log_date' });
    }
  };

  // --- RENDER GENERATOR ---
  const renderGenerator = () => (
    <View style={styles.inputCard}>
        <MaterialCommunityIcons name="dumbbell" size={40} color="#00f3ff" style={{marginBottom: 15}} />
        <Text style={styles.inputTitle}>GÉNÉRATEUR DE PROGRAMME</Text>
        <Text style={styles.inputDesc}>
            L'IA va créer une semaine d'entraînement adaptée à votre matériel ({userProfile?.equipment}) et votre niveau.
        </Text>
        
        <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>FOCUS PARTICULIER (Optionnel)</Text>
            <TextInput 
                style={styles.textInput} 
                placeholder="Ex: Pecs, Fessiers, Cardio, Dos large..." 
                placeholderTextColor="rgba(255,255,255,0.3)" 
                value={userFocus}
                onChangeText={setUserFocus}
            />
        </View>

        <TouchableOpacity style={styles.genBtn} onPress={handleGenerate} disabled={loading}>
            {loading ? <ActivityIndicator color="#000" /> : (
                <LinearGradient colors={['#00f3ff', '#0066ff']} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.btnGradient}>
                    <MaterialCommunityIcons name="brain" size={20} color="#000" style={{marginRight: 10}} />
                    <Text style={styles.genBtnText}>GÉNÉRER LE PROGRAMME</Text>
                </LinearGradient>
            )}
        </TouchableOpacity>
    </View>
  );

  // --- RENDER PLAN ---
  const renderActivePlan = () => {
    // Sécurité si l'onglet actif dépasse le nombre de jours du nouveau plan
    const safeDayIndex = activeTab < (activePlan?.days.length || 0) ? activeTab : 0;
    const currentDay = activePlan?.days[safeDayIndex];

    if (!currentDay) return renderGenerator();

    return (
      <View>
        <View style={styles.planHeader}>
            <View>
                <Text style={styles.planName}>{activePlan?.title}</Text>
                <Text style={styles.planSub}>{activePlan?.days.length} SÉANCES / SEMAINE</Text>
            </View>
            <TouchableOpacity onPress={handleGenerate} style={styles.regenBtnSmall}>
                <MaterialCommunityIcons name="refresh" size={20} color="#fff" />
            </TouchableOpacity>
        </View>

        {/* Tabs Jours */}
        <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 20, gap: 10}}>
                {activePlan?.days.map((day, index) => (
                    <TouchableOpacity 
                        key={index} 
                        onPress={() => { 
                            if(Platform.OS !== 'web') Haptics.selectionAsync(); 
                            setActiveTab(index); 
                        }}
                        style={[styles.dayTab, activeTab === index && styles.dayTabActive]}
                    >
                        <Text style={[styles.dayText, activeTab === index && styles.dayTextActive]}>
                            {day.day ? day.day.substring(0, 8) : `SÉANCE ${index+1}`}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>

        {/* Contenu Séance */}
        <View style={styles.dayContainer}>
            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: 15}}>
                 <Text style={styles.dayTitle}>{currentDay.focus || "Full Body"}</Text>
                 <View style={styles.badge}>
                    <Text style={styles.badgeText}>{currentDay.exercises.length} EXOS</Text>
                 </View>
            </View>
            
            {currentDay.exercises.map((ex, index) => {
                const isChecked = completedExercises[`day_${safeDayIndex}_ex_${index}`];
                return (
                    <TouchableOpacity 
                        key={index} 
                        style={[styles.exCard, isChecked && styles.exCardChecked]}
                        onPress={() => toggleExercise(safeDayIndex, index)}
                        activeOpacity={0.8}
                    >
                        <View style={{flex:1}}>
                            <Text style={[styles.exName, isChecked && {color:'#666', textDecorationLine:'line-through'}]}>
                                {ex.name}
                            </Text>
                            <View style={styles.exMetaRow}>
                                <View style={styles.metaItem}>
                                    <MaterialCommunityIcons name="repeat" size={14} color="#00f3ff" />
                                    <Text style={styles.metaText}>{ex.sets} x {ex.reps}</Text>
                                </View>
                                <View style={styles.metaItem}>
                                    <MaterialCommunityIcons name="timer-outline" size={14} color="#ffaa00" />
                                    <Text style={styles.metaText}>{ex.rest}s</Text>
                                </View>
                            </View>
                            {ex.notes && <Text style={styles.exNote}>{ex.notes}</Text>}
                        </View>
                        
                        <View style={[styles.checkbox, isChecked && styles.checkboxActive]}>
                            {isChecked && <Ionicons name="checkmark" size={14} color="#000" />}
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>

        <TouchableOpacity style={styles.regenBtn} onPress={handleGenerate}>
            <Text style={styles.regenText}>GÉNÉRER UN NOUVEAU PROGRAMME</Text>
        </TouchableOpacity>

        <View style={{height: 100}} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.auroraBg}>
          <View style={[styles.blob, { top: -100, right: -50, backgroundColor: 'rgba(0, 243, 255, 0.1)' }]} />
          <View style={[styles.blob, { bottom: 0, left: -50, backgroundColor: 'rgba(0, 100, 255, 0.1)' }]} />
      </View>
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.glassBtn}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>WORKOUT TRACKER</Text>
          <View style={{width:40}}/>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {activePlan ? renderActivePlan() : renderGenerator()}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },
  auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
  blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.3 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 10 },
  headerTitle: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  glassBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  
  content: { padding: 20 },

  // Generator
  inputCard: { padding: 30, backgroundColor: 'rgba(20,20,30,0.6)', borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0, 243, 255, 0.2)', marginTop: 20 },
  inputTitle: { color: '#fff', fontSize: 18, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
  inputDesc: { color: '#888', textAlign: 'center', marginBottom: 25, lineHeight: 20 },
  inputContainer: { width: '100%', marginBottom: 20 },
  inputLabel: { color: '#00f3ff', fontSize: 10, fontWeight: 'bold', marginBottom: 8, marginLeft: 5 },
  textInput: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', color: '#fff', padding: 15, height: 50 },
  genBtn: { width: '100%', borderRadius: 16, overflow: 'hidden' },
  btnGradient: { padding: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  genBtnText: { color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 1 },

  // Plan
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  planName: { color: '#fff', fontSize: 20, fontWeight: '900', fontStyle: 'italic', flex: 1 },
  planSub: { color: '#00f3ff', fontSize: 10, fontWeight: 'bold', marginTop: 5, letterSpacing: 1 },
  regenBtnSmall: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },

  tabsContainer: { marginBottom: 20 },
  dayTab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginRight: 10 },
  dayTabActive: { backgroundColor: '#00f3ff', borderColor: '#00f3ff' },
  dayText: { color: '#888', fontWeight: 'bold', fontSize: 12 },
  dayTextActive: { color: '#000' },

  dayContainer: { marginBottom: 20 },
  dayTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase' },
  badge: { backgroundColor: 'rgba(0, 243, 255, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0, 243, 255, 0.3)' },
  badgeText: { color: '#00f3ff', fontSize: 10, fontWeight: 'bold' },

  exCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  exCardChecked: { borderColor: 'rgba(0, 243, 255, 0.3)', backgroundColor: 'rgba(0, 243, 255, 0.05)' },
  
  exName: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 5 },
  exMetaRow: { flexDirection: 'row', gap: 15 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { color: '#aaa', fontSize: 12, fontWeight: 'bold' },
  exNote: { color: '#666', fontSize: 11, marginTop: 5, fontStyle: 'italic' },

  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: '#444', justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: '#00f3ff', borderColor: '#00f3ff' },

  regenBtn: { padding: 15, alignItems: 'center', marginTop: 20, marginBottom: 10 },
  regenText: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
});