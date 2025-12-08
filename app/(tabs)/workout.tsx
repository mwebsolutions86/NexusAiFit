import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  Platform, 
  Dimensions, 
  Image 
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';

import { useTheme } from '../../lib/theme';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useAIWorkout } from '../../hooks/useAIWorkout'; 
import { useWorkoutLogger } from '../../hooks/useWorkoutLogger';
import { useSubscription } from '../../hooks/useSubscription';
import { useActivePlans } from '../../hooks/useActivePlans';

import { ScreenLayout } from '../../components/ui/ScreenLayout';
import { GlassCard } from '../../components/ui/GlassCard';
import { NeonButton } from '../../components/ui/NeonButton';
import { GlassButton } from '../../components/ui/GlassButton';

const { width } = Dimensions.get('window');

// --- COMPOSANT : CARTE MISSION (JOUR) ---
const MissionCard = ({ day, isActive, onPress, index }: any) => {
  const { colors, isDark } = useTheme();
  
  return (
    <TouchableOpacity 
      onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); onPress(); }}
      activeOpacity={0.9}
      style={{ marginRight: 15 }}
    >
      <GlassCard 
        style={[
            styles.missionCard, 
            { 
                backgroundColor: isActive 
                    ? (isDark ? colors.primary + '20' : colors.primary + '10') 
                    : (isDark ? 'transparent' : '#FFFFFF'),
                
                borderColor: isActive 
                    ? colors.primary 
                    : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                
                shadowColor: "#000",
                shadowOpacity: isDark ? 0 : 0.05,
                shadowOffset: { width: 0, height: 4 },
                shadowRadius: 8,
                elevation: isDark ? 0 : 3
            }
        ]}
        intensity={isDark ? (isActive ? 40 : 15) : 0}
      >
        {isActive && <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: colors.primary }} />}
        
        <View style={styles.cardTop}>
            <Text style={[styles.missionDay, { color: isActive ? colors.primary : colors.textSecondary, fontWeight: isActive ? '900' : '600' }]}>
                {day.day ? day.day.toUpperCase() : `JOUR ${index + 1}`}
            </Text>
            {isActive && <Ionicons name="radio-button-on" size={14} color={colors.primary} />}
        </View>
        
        <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={[styles.missionFocus, { color: colors.text }]} numberOfLines={3}>{day.focus || "Repos"}</Text>
        </View>
        
        <View style={styles.cardBottom}>
            <MaterialCommunityIcons name="dumbbell" size={14} color={colors.textSecondary} />
            <Text style={[styles.missionMeta, { color: colors.textSecondary }]}>{(day.exercises?.length || 0)} EXERCICES</Text>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
};

// --- COMPOSANT : LIGNE EXERCICE TACTIQUE ---
const TacticalExercise = ({ exercise, index, isSessionActive, isCompleted, onToggle }: any) => {
  const { colors, isDark } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const openDemo = async () => {
      if (Platform.OS !== 'web') Haptics.selectionAsync();
      const query = encodeURIComponent(`${exercise.name} exercise form tutorial`);
      await Linking.openURL(`https://www.youtube.com/results?search_query=${query}`);
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()} style={{ marginBottom: 12 }}>
        <View 
            style={[
                styles.exerciseCard, 
                { 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    borderWidth: 1,
                    opacity: isCompleted ? 0.6 : 1,
                    shadowColor: "#000",
                    shadowOpacity: isDark ? 0 : 0.03,
                    shadowRadius: 5,
                    elevation: isDark ? 0 : 2
                }
            ]}
        >
            <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.exerciseHeader} activeOpacity={0.7}>
                <View style={{flex: 1}}>
                    <Text style={[styles.exName, { color: colors.text, textDecorationLine: isCompleted ? 'line-through' : 'none' }]}>{exercise.name}</Text>
                    <View style={styles.exMetaRow}>
                        <View style={[styles.badge, { backgroundColor: isDark ? colors.primary + '15' : colors.bg }]}>
                            <Text style={[styles.exMeta, { color: colors.primary }]}>{exercise.sets} SÉRIES</Text>
                        </View>
                        <Text style={{ color: colors.textSecondary, fontSize: 10 }}>•</Text>
                        <View style={[styles.badge, { backgroundColor: isDark ? colors.primary + '15' : colors.bg }]}>
                            <Text style={[styles.exMeta, { color: colors.primary }]}>{exercise.reps} REPS</Text>
                        </View>
                    </View>
                </View>
                
                {isSessionActive ? (
                    <TouchableOpacity onPress={onToggle} style={[styles.checkBtn, { borderColor: isCompleted ? colors.success : colors.border, backgroundColor: isCompleted ? colors.success : 'transparent' }]}>
                        {isCompleted && <Ionicons name="checkmark" size={16} color={isDark ? "#fff" : "#000"} />}
                    </TouchableOpacity>
                ) : (
                    <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color={colors.textSecondary} />
                )}
            </TouchableOpacity>
            
            {expanded && (
                <View style={[styles.exerciseDetails, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#F9FAFB', borderTopColor: colors.border, borderTopWidth: 1 }]}>
                    <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="timer-sand" size={14} color={colors.warning} />
                        <Text style={[styles.detailText, { color: colors.textSecondary }]}>Repos: {exercise.rest}s</Text>
                    </View>
                    {exercise.notes && (
                        <View style={[styles.detailRow, { alignItems: 'flex-start' }]}>
                            <MaterialCommunityIcons name="information-outline" size={14} color={colors.primary} style={{marginTop: 2}} />
                            <Text style={[styles.detailText, { color: colors.textSecondary, flex: 1 }]}>{exercise.notes}</Text>
                        </View>
                    )}
                    <TouchableOpacity onPress={openDemo} style={[styles.demoBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff', borderColor: colors.border }]}>
                        <MaterialCommunityIcons name="youtube" size={16} color="#FF0000" />
                        <Text style={[styles.demoText, { color: colors.text }]}>VOIR LA DÉMO</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    </Animated.View>
  );
};

export default function WorkoutScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  
  const { userProfile } = useUserProfile();
  const { data: plans } = useActivePlans(userProfile?.id);
  const { generateWorkout, loading: isGenerating } = useAIWorkout();
  const { saveWorkout, isSaving } = useWorkoutLogger();
  const { isPremium } = useSubscription();

  const activePlan = plans?.workoutPlan ? { content: plans.workoutPlan } : null;

  const [userFocus, setUserFocus] = useState('');
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});
  const [isRegenerating, setIsRegenerating] = useState(false);

  // --- ACTIONS ---

  const handleGenerate = async () => {
    if (!userFocus.trim()) return Alert.alert("Cible Manquante", "Définissez un objectif.");
    if (!userProfile) return Alert.alert("Erreur", "Profil non chargé.");
    
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await generateWorkout(userProfile, userFocus);
      setUserFocus('');
      setIsRegenerating(false);
      Alert.alert("Plan Tactique Généré", "Votre mission est prête.");
    } catch (e: any) {
        if (e.message.includes("QUOTA_EXCEEDED")) {
            Alert.alert("Limite Atteinte", "Passez ELITE pour générer plus de plans.");
        } else {
            Alert.alert("Erreur", e.message || "Problème de connexion.");
        }
    }
  };

  const handleStartSession = () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSessionActive(true);
    setCompletedExercises({});
  };

  const toggleExercise = (index: number) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    const key = `ex_${index}`;
    setCompletedExercises(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFinish = async () => {
    if (!activePlan?.content?.days) return;
    const currentDay = activePlan.content.days[activeDayIndex];
    
    const exercisesDone: any[] = [];
    currentDay.exercises.forEach((ex: any, idx: number) => {
        if (completedExercises[`ex_${idx}`]) {
            exercisesDone.push({ name: ex.name, sets: ex.sets, reps: ex.reps, weight: 0 });
        }
    });

    if (exercisesDone.length === 0) return Alert.alert("Mission Vide", "Aucun objectif validé.");

    await saveWorkout({
        logDate: new Date().toISOString().split('T')[0],
        exercisesDone,
        note: `${activePlan.content.title} - ${currentDay.focus}`
    });

    setIsSessionActive(false);
    Alert.alert("Mission Accomplie", "Données tactiques enregistrées.");
    if (isPremium) router.push('/features/workout_log' as any);
  };

  // --- RENDERERS ---

  const renderGenerator = () => (
    <Animated.View entering={FadeInUp.springify()}>
        <View 
            style={[
                styles.generatorCard, 
                { 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    shadowColor: "#000",
                    shadowOpacity: isDark ? 0 : 0.05,
                    shadowRadius: 10,
                    elevation: isDark ? 0 : 3
                }
            ]}
        >
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
                <MaterialCommunityIcons name="dumbbell" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.genTitle, {color: colors.text}]}>
                {activePlan ? "NOUVELLE STRATÉGIE" : "GÉNÉRATEUR TACTIQUE"}
            </Text>
            <Text style={[styles.genSub, {color: colors.textSecondary}]}>L'IA crée votre programme sur mesure.</Text>
            
            <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : colors.bg }]}>
                <Text style={[styles.label, {color: colors.primary}]}>OBJECTIF</Text>
                <TextInput 
                    style={[styles.input, {color: colors.text}]}
                    placeholder="Ex: Pectoraux, Force, Cardio..."
                    placeholderTextColor={colors.textSecondary}
                    value={userFocus}
                    onChangeText={setUserFocus}
                />
            </View>

            <NeonButton 
                label="INITIALISER LE PROGRAMME" 
                onPress={handleGenerate} 
                loading={isGenerating} 
                icon="flash"
                style={{
                    // Force le bleu en mode clair
                    backgroundColor: isDark ? undefined : colors.primary,
                    borderColor: isDark ? undefined : colors.primary
                }}
            />

            {activePlan && (
                <TouchableOpacity onPress={() => setIsRegenerating(false)} style={{marginTop: 20}}>
                    <Text style={{color: colors.textSecondary, textDecorationLine: 'underline', fontSize: 12}}>Annuler et revenir au plan actif</Text>
                </TouchableOpacity>
            )}
        </View>
    </Animated.View>
  );

  const renderActivePlan = () => {
      const content = activePlan?.content;
      if (!content?.days) return null;
      
      const safeIndex = Math.min(activeDayIndex, content.days.length - 1);
      const day = content.days[safeIndex];

      return (
          <View>
              <View style={styles.planHeader}>
                  <View style={{ flex: 1 }}>
                      <Text style={[styles.planTitle, { color: colors.text }]} numberOfLines={1}>{content.title}</Text>
                      <Text style={[styles.planSub, { color: isSessionActive ? colors.success : colors.primary }]}>
                          {isSessionActive ? "🟢 MISSION EN COURS" : `PLAN ACTIF • ${content.days.length} JOURS`}
                      </Text>
                  </View>
                  
                  {!isSessionActive && (
                      <GlassButton 
                        icon="refresh" 
                        onPress={() => { 
                            Alert.alert(
                                "Nouvelle Mission ?", 
                                "Générer un nouveau plan remplacera l'actuel.", 
                                [
                                    { text: "Annuler", style: "cancel" },
                                    { text: "Nouveau Plan", onPress: () => setIsRegenerating(true) } 
                                ]
                            );
                        }} 
                        size={20} 
                      />
                  )}
              </View>

              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={{ paddingVertical: 10, paddingBottom: 25, paddingLeft: 5 }}
              >
                  {content.days.map((d: any, i: number) => (
                      <MissionCard 
                        key={i} 
                        day={d} 
                        index={i}
                        isActive={activeDayIndex === i}
                        onPress={() => !isSessionActive && setActiveDayIndex(i)} 
                      />
                  ))}
              </ScrollView>

              <View style={{ marginBottom: 20, marginTop: 5 }}>
                  <Text style={{color: colors.textSecondary, fontSize: 10, fontWeight: 'bold', marginBottom: 10, marginLeft: 5, letterSpacing: 1}}>
                      SÉQUENCE OPÉRATIONNELLE ({day.exercises?.length || 0})
                  </Text>
                  {day.exercises?.map((ex: any, i: number) => (
                      <TacticalExercise 
                        key={i}
                        index={i}
                        exercise={ex}
                        isSessionActive={isSessionActive}
                        isCompleted={!!completedExercises[`ex_${i}`]}
                        onToggle={() => toggleExercise(i)}
                      />
                  ))}
              </View>
          </View>
      );
  };

  return (
    <ScreenLayout>
        {/* FOND AMBIANT */}
        <Image 
            source={require('../../assets/adaptive-icon.png')} 
            style={[StyleSheet.absoluteFillObject, { opacity: isDark ? 0.05 : 0.02, transform: [{scale: 1.5}] }]}
            blurRadius={40}
        />

        <View style={styles.header}>
            <Text style={[styles.headerTitle, {color: colors.text}]}>CENTRE TACTIQUE</Text>
            <TouchableOpacity onPress={() => isPremium ? router.push('/features/workout_log' as any) : null}>
                <MaterialCommunityIcons name="history" size={24} color={isPremium ? colors.primary : colors.textSecondary} />
            </TouchableOpacity>
        </View>

        <ScrollView 
            style={{ flex: 1 }} 
            contentContainerStyle={[styles.content, { paddingBottom: 150 }]} 
            showsVerticalScrollIndicator={false}
        >
            {(activePlan && !isRegenerating) ? renderActivePlan() : renderGenerator()}
        </ScrollView>

        {/* --- FLOATING FOOTER --- */}
        {(activePlan && !isRegenerating) && (
            <LinearGradient 
                // Le dégradé du bas s'adapte pour que le bouton ne flotte pas dans le vide
                colors={isDark ? ['transparent', 'rgba(0,0,0,0.9)', '#000'] : ['transparent', 'rgba(255,255,255,0.9)', '#FFFFFF']} 
                style={[styles.floatingFooter, { bottom: Platform.OS === 'ios' ? 85 : 65 }]}
            >
                {!isSessionActive ? (
                    // ✅ CONDITION STRICTE : Si Dark -> Neon, Si Light -> SolidBlue
                    isDark ? (
                        <NeonButton 
                            label="LANCER LA MISSION" 
                            icon="play" 
                            onPress={handleStartSession} 
                            style={{ width: '100%' }} 
                        />
                    ) : (
                        <TouchableOpacity 
                            onPress={handleStartSession}
                            activeOpacity={0.8}
                            style={[styles.solidButton, { backgroundColor: colors.primary }]}
                        >
                            <MaterialCommunityIcons name="play" size={24} color="#FFF" style={{ marginRight: 10 }} />
                            <Text style={styles.solidButtonText}>LANCER LA MISSION</Text>
                        </TouchableOpacity>
                    )
                ) : (
                    // Bouton Stop (Rouge, on garde le NeonButton qui gère bien les styles danger)
                    <NeonButton 
                        label={isSaving ? "SYNCHRONISATION..." : "TERMINER MISSION"} 
                        icon="stop" 
                        onPress={handleFinish} 
                        style={{ backgroundColor: colors.danger, borderColor: colors.danger, width: '100%' }} 
                    />
                )}
            </LinearGradient>
        )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 10 },
    headerTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 2 },
    content: { padding: 20 },

    generatorCard: { padding: 30, alignItems: 'center', borderRadius: 24, borderWidth: 1 },
    iconCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    genTitle: { fontSize: 18, fontWeight: '900', marginBottom: 5, letterSpacing: 1 },
    genSub: { textAlign: 'center', marginBottom: 25, fontSize: 12 },
    inputWrapper: { width: '100%', marginBottom: 25, borderWidth: 1, borderRadius: 16, padding: 15 },
    label: { fontSize: 10, fontWeight: 'bold', marginBottom: 5, letterSpacing: 1 },
    input: { fontSize: 16, fontWeight: 'bold' },

    planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 },
    planTitle: { fontSize: 20, fontWeight: '900', fontStyle: 'italic', marginRight: 10 },
    planSub: { fontSize: 10, fontWeight: 'bold', marginTop: 4, letterSpacing: 1 },

    missionCard: { width: 160, height: 220, padding: 20, justifyContent: 'space-between', borderRadius: 24, borderWidth: 1 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    
    missionDay: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
    missionFocus: { fontSize: 20, fontWeight: '900', lineHeight: 24, letterSpacing: -0.5 },
    missionMeta: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },

    exerciseCard: { marginBottom: 12, padding: 0, overflow: 'hidden', borderRadius: 16 },
    exerciseHeader: { flexDirection: 'row', alignItems: 'center', padding: 15 },
    exName: { fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
    exMetaRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
    exMeta: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
    badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    checkBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    
    exerciseDetails: { padding: 15, paddingTop: 10, paddingBottom: 20 },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
    detailText: { fontSize: 12 },

    demoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 15, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
    demoText: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },

    floatingFooter: { position: 'absolute', left: 0, right: 0, padding: 20, paddingTop: 30 },

    // ✅ NOUVEAU STYLE : Bouton Solide pour Mode Clair
    solidButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingVertical: 16,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    solidButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
    }
});