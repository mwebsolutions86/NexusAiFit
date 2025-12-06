import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

// Hooks & UI
import { useTheme } from '../../lib/theme';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useAIWorkout } from '../../hooks/useAIWorkout'; // Le Hook V2
import { useWorkoutLogger } from '../../hooks/useWorkoutLogger';
import { useSubscription } from '../../hooks/useSubscription';

import { ScreenLayout } from '../../components/ui/ScreenLayout';
import { GlassCard } from '../../components/ui/GlassCard';
import { NeonButton } from '../../components/ui/NeonButton';

export default function WorkoutScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  
  // --- LOGIQUE BACKEND CORRIGÉE ---
  const { userProfile } = useUserProfile();
  
  // On récupère les fonctions du Hook V2 et on les renomme pour matcher ton UI
  const { 
    workoutPlan: rawPlan, 
    generateWorkout, 
    loading: isGenerating 
  } = useAIWorkout();

  // ADAPTATEUR: Ton UI utilise 'activePlan.content', on adapte la structure ici
  const activePlan = rawPlan ? { content: rawPlan } : null;

  // On garde le logger existant
  const { saveWorkout, isSaving } = useWorkoutLogger();
  const { isPremium } = useSubscription();

  // États Locaux
  const [userFocus, setUserFocus] = useState('');
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});

  // --- ACTIONS ---

  const handleGenerate = async () => {
    if (!userFocus.trim()) {
      Alert.alert("Objectif requis", "Ex: Pectoraux, Cardio, Jambes...");
      return;
    }

    // SÉCURITÉ : On vérifie le profil
    if (!userProfile) {
        Alert.alert("Profil manquant", "Veuillez attendre le chargement du profil.");
        return;
    }
    
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // APPEL CORRIGÉ : On passe le profil et le focus directement
      await generateWorkout(userProfile, userFocus);
      
      setUserFocus('');
      Alert.alert("Prêt !", "Nouveau programme chargé.");
    } catch (e: any) {
        if (e.message === "FREE_LIMIT_REACHED") Alert.alert("Limite Gratuite", "Revenez la semaine prochaine ou passez Premium.");
        else if (e.message === "FREE_PLAN_ACTIVE") Alert.alert("Plan Actif", "Terminez votre plan actuel d'abord.");
        else Alert.alert("Erreur", e.message);
    }
  };

  const handleStartSession = () => {
    setIsSessionActive(true);
    setCompletedExercises({});
  };

  const toggleExercise = (index: number) => {
    if (!isSessionActive) return;
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    const key = `ex_${index}`;
    setCompletedExercises(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFinish = async () => {
    if (!activePlan?.content?.days) return;
    const currentDay = activePlan.content.days[activeDayIndex];
    
    // Construction du Snapshot pour l'historique
    const exercisesDone: any[] = [];
    currentDay.exercises.forEach((ex: any, idx: number) => {
        if (completedExercises[`ex_${idx}`]) {
            exercisesDone.push({
                name: ex.name,
                sets: ex.sets,
                reps: ex.reps,
                weight: 0 
            });
        }
    });

    if (exercisesDone.length === 0) {
        Alert.alert("Session Vide", "Validez au moins un exercice.");
        return;
    }

    await saveWorkout({
        logDate: new Date().toISOString().split('T')[0],
        exercisesDone,
        note: `${activePlan.content.title} - ${currentDay.focus}`
    });

    setIsSessionActive(false);
    Alert.alert("Bravo !", "Séance enregistrée.");
    if (isPremium) router.push('/features/workout_log' as any);
  };

  // --- RENDERS (INCHANGÉS) ---

  const renderGenerator = () => (
    <GlassCard style={{ padding: 25, alignItems: 'center' }}>
        <MaterialCommunityIcons name="dumbbell" size={50} color={colors.primary} style={{marginBottom: 15}} />
        <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text, marginBottom: 10 }}>NEURAL COACH</Text>
        <Text style={{ textAlign: 'center', color: colors.textSecondary, marginBottom: 20 }}>
            L'IA analyse votre profil pour créer l'entraînement parfait.
        </Text>
        
        <View style={{ width: '100%', marginBottom: 20 }}>
            <Text style={{ color: colors.primary, fontSize: 10, fontWeight: 'bold', marginBottom: 5, marginLeft: 5 }}>OBJECTIF DE LA SÉANCE</Text>
            <TextInput 
                style={{ backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 15, color: colors.text }}
                placeholder="Ex: Dos & Biceps, HIIT, Force..."
                placeholderTextColor={colors.textSecondary}
                value={userFocus}
                onChangeText={setUserFocus}
            />
        </View>

        <NeonButton 
            label="GÉNÉRER LE PROGRAMME" 
            onPress={handleGenerate} 
            loading={isGenerating} 
            icon="flash"
        />
    </GlassCard>
  );

  const renderActivePlan = () => {
      const content = activePlan?.content;
      if (!content?.days) return renderGenerator();
      
      const safeIndex = Math.min(activeDayIndex, content.days.length - 1);
      const day = content.days[safeIndex];

      return (
          <View>
              {/* Header Plan */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
                  <View>
                      <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text }}>{content.title}</Text>
                      <Text style={{ color: colors.primary, fontWeight: 'bold' }}>
                          {isSessionActive ? "🟢 SÉANCE EN COURS" : `${content.days.length} SESSIONS`}
                      </Text>
                  </View>
                  {!isSessionActive && (
                      <TouchableOpacity onPress={handleGenerate} style={{ padding: 10, backgroundColor: colors.glass, borderRadius: 12 }}>
                          <Ionicons name="refresh" size={20} color={colors.text} />
                      </TouchableOpacity>
                  )}
              </View>

              {/* Tabs Jours */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, marginBottom: 20 }}>
                  {content.days.map((d: any, i: number) => (
                      <TouchableOpacity 
                        key={i}
                        disabled={isSessionActive}
                        onPress={() => setActiveDayIndex(i)}
                        style={{
                            paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1,
                            backgroundColor: activeDayIndex === i ? colors.primary : 'transparent',
                            borderColor: colors.primary
                        }}
                      >
                          <Text style={{ fontWeight: 'bold', color: activeDayIndex === i ? '#fff' : colors.textSecondary }}>
                              {d.day || `J${i+1}`}
                          </Text>
                      </TouchableOpacity>
                  ))}
              </ScrollView>

              {/* Focus du Jour */}
              <GlassCard style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 15, textTransform: 'uppercase' }}>
                      {day.focus}
                  </Text>
                  
                  {day.exercises?.map((ex: any, i: number) => {
                      const isChecked = completedExercises[`ex_${i}`];
                      return (
                          <TouchableOpacity 
                            key={i} 
                            disabled={!isSessionActive}
                            onPress={() => toggleExercise(i)}
                            style={{ 
                                flexDirection: 'row', alignItems: 'center', paddingVertical: 12, 
                                borderBottomWidth: 1, borderColor: colors.border,
                                opacity: (isSessionActive && isChecked) ? 0.5 : 1
                            }}
                          >
                              {isSessionActive && (
                                  <View style={{
                                      width: 24, height: 24, borderRadius: 6, borderWidth: 2, marginRight: 15,
                                      borderColor: isChecked ? colors.success : colors.textSecondary,
                                      backgroundColor: isChecked ? colors.success : 'transparent',
                                      justifyContent: 'center', alignItems: 'center'
                                  }}>
                                      {isChecked && <Ionicons name="checkmark" size={16} color="#fff" />}
                                  </View>
                              )}
                              <View style={{ flex: 1 }}>
                                  <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.text }}>{ex.name}</Text>
                                  {ex.notes && <Text style={{ fontSize: 11, color: colors.textSecondary }}>{ex.notes}</Text>}
                              </View>
                              <View style={{ alignItems: 'flex-end' }}>
                                  <Text style={{ fontWeight: '900', color: colors.primary }}>{ex.sets} x {ex.reps}</Text>
                                  <Text style={{ fontSize: 10, color: colors.textSecondary }}>{ex.rest}s repos</Text>
                              </View>
                          </TouchableOpacity>
                      );
                  })}
              </GlassCard>

              {/* Actions */}
              {!isSessionActive ? (
                  <NeonButton label="DÉMARRER LA SÉANCE" icon="play" onPress={handleStartSession} />
              ) : (
                  <NeonButton 
                    label={isSaving ? "SAUVEGARDE..." : "TERMINER LA SÉANCE"} 
                    icon="stop" 
                    onPress={handleFinish} 
                    style={{ backgroundColor: colors.danger, borderColor: colors.danger }} // Rouge pour stop
                  />
              )}
          </View>
      );
  };

  return (
    <ScreenLayout>
        <View style={styles.header}>
            <Text style={[styles.headerTitle, {color: colors.text}]}>WORKOUT</Text>
            {/* Raccourci vers l'historique (Premium) */}
            <TouchableOpacity onPress={() => isPremium ? router.push('/features/workout_log' as any) : Alert.alert("Premium", "Historique réservé aux membres.")}>
                <MaterialCommunityIcons name="history" size={24} color={isPremium ? colors.primary : colors.textSecondary} />
            </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
            {activePlan ? renderActivePlan() : renderGenerator()}
            
            {/* Lien vers la bibliothèque (pour ne pas perdre l'accès) */}
            <TouchableOpacity 
                style={{ marginTop: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                onPress={() => router.push('/features/exercise-library' as any)}
            >
                <MaterialCommunityIcons name="book-open-variant" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <Text style={{ color: colors.textSecondary, fontWeight: 'bold' }}>Voir la Bibliothèque d'Exercices</Text>
            </TouchableOpacity>
            
            <View style={{ height: 100 }} />
        </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 10 },
    headerTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 2 },
    content: { padding: 20 },
});