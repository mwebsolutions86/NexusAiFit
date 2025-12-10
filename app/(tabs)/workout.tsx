import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  Platform, 
  Dimensions 
} from 'react-native';
import { Image } from 'expo-image'; 
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence 
} from 'react-native-reanimated';
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

// --- 🛠 UTILITAIRE DATE (Correction) ---
const getTodayIndex = () => {
  const day = new Date().getDay(); 
  // Transforme 0 (Dimanche) -> 6, 1 (Lundi) -> 0
  return (day + 6) % 7; 
};

// --- 👻 SKELETON ---
const SkeletonItem = ({ style, width, height, borderRadius = 8 }: any) => {
    const { colors, isDark } = useTheme();
    const opacity = useSharedValue(0.3);
    useEffect(() => {
        opacity.value = withRepeat(withSequence(withTiming(0.6, {duration:800}), withTiming(0.3, {duration:800})), -1, true);
    }, []);
    const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
    const bgColor = isDark ? colors.primary + '20' : '#cbd5e1'; 
    return <Animated.View style={[{ backgroundColor: bgColor, width, height, borderRadius, overflow: 'hidden' }, style, animatedStyle]} />;
};

const WorkoutSkeleton = () => (
    <View style={{ padding: 20, gap: 20 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
            <View style={{ gap: 8 }}>
                <SkeletonItem width={120} height={20} />
                <SkeletonItem width={80} height={12} />
            </View>
            <SkeletonItem width={40} height={40} borderRadius={20} />
        </View>
        {/* Carousel */}
        <View style={{ flexDirection: 'row', gap: 15 }}>
            <GlassCard style={{ width: 150, height: 160, padding: 15, justifyContent: 'space-between' }}><View/></GlassCard>
            <GlassCard style={{ width: 150, height: 160, padding: 15, justifyContent: 'space-between' }}><View/></GlassCard>
        </View>
        {/* Liste */}
        <View style={{ gap: 10, marginTop: 10 }}>
            <SkeletonItem width={100} height={14} />
            <SkeletonItem width="100%" height={80} borderRadius={16} />
            <SkeletonItem width="100%" height={80} borderRadius={16} />
        </View>
    </View>
);

// --- COMPOSANTS UI ---

const MissionCard = ({ day, isActive, onPress, index }: any) => {
  const { colors, isDark } = useTheme();
  
  const titleColor = isDark ? colors.text : '#1e293b';
  const subColor = isDark ? colors.textSecondary : '#64748b';
  const activeColor = isDark ? colors.primary : '#2563eb'; 

  return (
    <TouchableOpacity 
      onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); onPress(); }}
      activeOpacity={0.8}
      style={{ marginRight: 15 }}
    >
      <GlassCard 
        variant={isActive ? "neon" : "default"}
        style={{ width: 150, height: 160, justifyContent: 'space-between', padding: 15 }}
      >
        {isActive && <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: activeColor }} />}
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: isActive ? activeColor : subColor, fontWeight: isActive ? '900' : '600', fontSize: 11, letterSpacing: 1 }}>
                {day.day ? day.day.toUpperCase().slice(0, 3) : `J${index + 1}`}
            </Text>
            {isActive && <Ionicons name="radio-button-on" size={12} color={activeColor} />}
        </View>
        
        <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={{ color: titleColor, fontSize: 16, fontWeight: '800', lineHeight: 20 }} numberOfLines={3}>
                {day.focus || "Repos"}
            </Text>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialCommunityIcons name="dumbbell" size={14} color={subColor} />
            <Text style={{ color: subColor, fontSize: 10, fontWeight: 'bold' }}>
                {(day.exercises?.length || 0)} EXOS
            </Text>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
};

const TacticalExercise = ({ exercise, index, isSessionActive, isCompleted, onToggle }: any) => {
  const { colors, isDark } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const openDemo = async () => {
      if (Platform.OS !== 'web') Haptics.selectionAsync();
      const query = encodeURIComponent(`${exercise.name} exercise form tutorial`);
      await Linking.openURL(`https://www.youtube.com/results?search_query=${query}`);
  };

  const cardBg = isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'; 
  const badgeBg = isDark ? colors.primary + '15' : '#f1f5f9';
  const titleColor = isDark ? colors.text : '#0f172a'; 
  const metaColor = isDark ? colors.primary : '#3b82f6'; 

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()} style={{ marginBottom: 12 }}>
        <View 
            style={[
                styles.exerciseCard, 
                { 
                    backgroundColor: cardBg,
                    borderColor: borderColor,
                    opacity: isCompleted ? 0.5 : 1,
                    borderWidth: 1,
                    elevation: 0,
                    shadowOpacity: 0
                }
            ]}
        >
            <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.exerciseHeader} activeOpacity={0.7}>
                <View style={{flex: 1}}>
                    <Text style={[styles.exName, { color: titleColor, textDecorationLine: isCompleted ? 'line-through' : 'none' }]}>
                        {exercise.name}
                    </Text>
                    <View style={styles.exMetaRow}>
                        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                            <Text style={[styles.exMeta, { color: metaColor }]}>{exercise.sets} SÉRIES</Text>
                        </View>
                        <Text style={{ color: isDark ? colors.textSecondary : '#94a3b8', fontSize: 10 }}>•</Text>
                        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                            <Text style={[styles.exMeta, { color: metaColor }]}>{exercise.reps} REPS</Text>
                        </View>
                    </View>
                </View>
                
                {isSessionActive ? (
                    <TouchableOpacity 
                        onPress={onToggle} 
                        style={[
                            styles.checkBtn, 
                            { 
                                borderColor: isCompleted ? colors.success : borderColor, 
                                backgroundColor: isCompleted ? colors.success : 'transparent',
                                transform: [{scale: isCompleted ? 1.1 : 1}]
                            }
                        ]}
                    >
                        {isCompleted && <Ionicons name="checkmark" size={18} color="#fff" />}
                    </TouchableOpacity>
                ) : (
                    <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color={isDark ? colors.textSecondary : '#94a3b8'} />
                )}
            </TouchableOpacity>
            
            {expanded && (
                <View style={[styles.exerciseDetails, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc', borderTopColor: borderColor }]}>
                    <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="timer-sand" size={14} color={colors.warning} />
                        <Text style={[styles.detailText, { color: isDark ? colors.textSecondary : '#64748b' }]}>Repos: {exercise.rest}s</Text>
                    </View>
                    {exercise.notes && (
                        <View style={[styles.detailRow, { alignItems: 'flex-start' }]}>
                            <MaterialCommunityIcons name="information-outline" size={14} color={colors.primary} style={{marginTop: 2}} />
                            <Text style={[styles.detailText, { color: isDark ? colors.textSecondary : '#64748b', flex: 1 }]}>{exercise.notes}</Text>
                        </View>
                    )}
                    <TouchableOpacity onPress={openDemo} style={[styles.demoBtn, { borderColor: borderColor }]}>
                        <MaterialCommunityIcons name="youtube" size={16} color="#ef4444" />
                        <Text style={[styles.demoText, { color: titleColor }]}>VOIR LA DÉMO</Text>
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
  
  const { userProfile, isLoading: profileLoading } = useUserProfile();
  const { data: plans, isLoading: isPlansLoading } = useActivePlans(userProfile?.id);
  const { generateWorkout, loading: isGenerating } = useAIWorkout();
  const { saveWorkout, isSaving } = useWorkoutLogger();
  const { isPremium } = useSubscription();

  const activePlan = plans?.workoutPlan ? { content: plans.workoutPlan } : null;
  const isLoading = profileLoading || isPlansLoading;

  const [userFocus, setUserFocus] = useState('');
  
  // ✅ INITIALISATION INTELLIGENTE : Pointer sur le jour actuel
  const [activeDayIndex, setActiveDayIndex] = useState(getTodayIndex());
  
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});
  const [isRegenerating, setIsRegenerating] = useState(false);

  // --- ACTIONS ---

  const handleGenerate = async () => {
    if (!userFocus.trim()) return Alert.alert("Cible Manquante", "Définissez un objectif.");
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await generateWorkout(userProfile, userFocus);
      setUserFocus('');
      setIsRegenerating(false);
    } catch (e: any) {
        Alert.alert("Erreur", e.message);
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
        <View style={[styles.generatorCard, { borderColor: isDark ? colors.border : '#e2e8f0', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff' }]}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? colors.primary + '15' : '#e0f2fe' }]}>
                <MaterialCommunityIcons name="dumbbell" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.genTitle, {color: isDark ? colors.text : '#0f172a'}]}>GÉNÉRATEUR TACTIQUE</Text>
            <Text style={[styles.genSub, {color: isDark ? colors.textSecondary : '#64748b'}]}>L'IA crée votre programme sur mesure.</Text>
            
            <View style={[styles.inputWrapper, { borderColor: isDark ? colors.border : '#cbd5e1', backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc' }]}>
                <Text style={[styles.label, {color: colors.primary}]}>OBJECTIF</Text>
                <TextInput 
                    style={[styles.input, {color: isDark ? colors.text : '#0f172a'}]}
                    placeholder="Ex: Pectoraux, Force, Cardio..."
                    placeholderTextColor={isDark ? colors.textSecondary : '#94a3b8'}
                    value={userFocus}
                    onChangeText={setUserFocus}
                />
            </View>

            <NeonButton 
                label="INITIALISER LE PROGRAMME" 
                onPress={handleGenerate} 
                loading={isGenerating} 
                icon="flash"
                style={{ backgroundColor: isDark ? undefined : colors.primary }}
            />

            {activePlan && (
                <TouchableOpacity onPress={() => setIsRegenerating(false)} style={{marginTop: 20}}>
                    <Text style={{color: isDark ? colors.textSecondary : '#64748b', textDecorationLine: 'underline', fontSize: 12}}>Annuler et revenir</Text>
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
                      <Text style={[styles.planTitle, { color: isDark ? colors.text : '#0f172a' }]} numberOfLines={1}>{content.title}</Text>
                      <Text style={[styles.planSub, { color: isSessionActive ? colors.success : colors.primary }]}>
                          {isSessionActive ? "🟢 MISSION EN COURS" : `PLAN ACTIF • ${content.days.length} JOURS`}
                      </Text>
                  </View>
                  
                  {!isSessionActive && (
                      <GlassButton 
                        icon="refresh" 
                        onPress={() => Alert.alert("Nouveau Plan ?", "Cela remplacera l'actuel.", [{ text: "Annuler" }, { text: "Nouveau", onPress: () => setIsRegenerating(true) }])} 
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
                        key={i} day={d} index={i}
                        isActive={activeDayIndex === i}
                        onPress={() => !isSessionActive && setActiveDayIndex(i)} 
                      />
                  ))}
              </ScrollView>

              <View style={{ marginBottom: 20, marginTop: 5 }}>
                  <Text style={{color: isDark ? colors.textSecondary : '#64748b', fontSize: 10, fontWeight: 'bold', marginBottom: 10, marginLeft: 5, letterSpacing: 1}}>
                      SÉQUENCE OPÉRATIONNELLE ({day.exercises?.length || 0})
                  </Text>
                  {day.exercises?.map((ex: any, i: number) => (
                      <TacticalExercise 
                        key={i} index={i} exercise={ex}
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
        <Image 
            source={require('../../assets/adaptive-icon.png')} 
            style={[StyleSheet.absoluteFillObject, { opacity: isDark ? 0.05 : 0.02 }]}
            blurRadius={40}
            contentFit="cover"
        />
        <LinearGradient 
            colors={isDark ? [colors.primary, 'transparent'] : ['#bfdbfe', 'transparent']} 
            style={{position:'absolute', top:0, left:0, right:0, height:200, opacity: isDark ? 0.1 : 0.3}} 
        />

        <View style={styles.header}>
            <Text style={[styles.headerTitle, {color: isDark ? colors.text : '#0f172a'}]}>CENTRE TACTIQUE</Text>
            <TouchableOpacity onPress={() => isPremium ? router.push('/features/workout_log' as any) : null}>
                <MaterialCommunityIcons name="history" size={24} color={isPremium ? colors.primary : (isDark ? colors.textSecondary : '#94a3b8')} />
            </TouchableOpacity>
        </View>

        <ScrollView 
            style={{ flex: 1 }} 
            contentContainerStyle={[styles.content, { paddingBottom: 150 }]} 
            showsVerticalScrollIndicator={false}
        >
            {isLoading ? <WorkoutSkeleton /> : ((activePlan && !isRegenerating) ? renderActivePlan() : renderGenerator())}
        </ScrollView>

        {/* --- FLOATING FOOTER --- */}
        {(activePlan && !isRegenerating) && (
            <LinearGradient 
                colors={isDark ? ['transparent', 'rgba(0,0,0,0.9)', '#000'] : ['transparent', 'rgba(255,255,255,0.9)', '#FFFFFF']} 
                style={[styles.floatingFooter, { bottom: Platform.OS === 'ios' ? 85 : 65 }]}
            >
                {!isSessionActive ? (
                    isDark ? (
                        <NeonButton label="LANCER LA MISSION" icon="play" onPress={handleStartSession} style={{ width: '100%' }} />
                    ) : (
                        <TouchableOpacity onPress={handleStartSession} activeOpacity={0.8} style={[styles.solidButton, { backgroundColor: colors.primary }]}>
                            <MaterialCommunityIcons name="play" size={24} color="#FFF" style={{ marginRight: 10 }} />
                            <Text style={styles.solidButtonText}>LANCER LA MISSION</Text>
                        </TouchableOpacity>
                    )
                ) : (
                    <NeonButton 
                        label={isSaving ? "SYNCHRONISATION..." : "TERMINER MISSION"} 
                        icon="stop" onPress={handleFinish} 
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

    generatorCard: { padding: 30, alignItems: 'center', borderRadius: 24, borderWidth: 1, shadowOpacity: 0, elevation: 0 },
    iconCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    genTitle: { fontSize: 18, fontWeight: '900', marginBottom: 5, letterSpacing: 1 },
    genSub: { textAlign: 'center', marginBottom: 25, fontSize: 12 },
    inputWrapper: { width: '100%', marginBottom: 25, borderWidth: 1, borderRadius: 16, padding: 15 },
    label: { fontSize: 10, fontWeight: 'bold', marginBottom: 5, letterSpacing: 1 },
    input: { fontSize: 16, fontWeight: 'bold' },

    planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 },
    planTitle: { fontSize: 20, fontWeight: '900', fontStyle: 'italic', marginRight: 10 },
    planSub: { fontSize: 10, fontWeight: 'bold', marginTop: 4, letterSpacing: 1 },

    exerciseCard: { marginBottom: 12, padding: 0, overflow: 'hidden', borderRadius: 16, borderWidth: 1 },
    exerciseHeader: { flexDirection: 'row', alignItems: 'center', padding: 15 },
    exName: { fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
    exMetaRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
    exMeta: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
    badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    checkBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
    
    exerciseDetails: { padding: 15, paddingTop: 10, paddingBottom: 20, borderTopWidth: 1 },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
    detailText: { fontSize: 12 },

    demoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 15, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
    demoText: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },

    floatingFooter: { position: 'absolute', left: 0, right: 0, padding: 20, paddingTop: 30 },

    solidButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        width: '100%', paddingVertical: 16, borderRadius: 16,
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
    },
    solidButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 }
});