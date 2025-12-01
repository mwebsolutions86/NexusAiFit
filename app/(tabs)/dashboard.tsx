import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';

const { width } = Dimensions.get('window');

export default function Dashboard() {
  const router = useRouter();
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const [stats, setStats] = useState({
    workoutProgress: 0,
    nutritionProgress: 0,
    calories: 0,
    caloriesTarget: 2500,
    nextWorkout: 'Repos / Aucun Plan',
    workoutName: 'AUCUN PROGRAMME',
  });

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const fetchDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;
      const todayStr = new Date().toISOString().split('T')[0];

      // 1. Charger le profil
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (userProfile) {
          setProfile(userProfile);
          await updateStreakLogic(userId, userProfile);
      }

      // 2. CALCULS (Nutrition & Sport)
      let calConsumed = 0;
      let calTarget = 2500;
      let nutProgress = 0;
      let workProgress = 0;
      let sessionName = "Repos / Libre";
      let planName = "AUCUN PROGRAMME";

      const { data: mealPlan } = await supabase.from('meal_plans').select('content').eq('user_id', userId).eq('is_active', true).limit(1).maybeSingle();
      const { data: foodLog } = await supabase.from('nutrition_logs').select('meals_status').eq('user_id', userId).eq('log_date', todayStr).maybeSingle();

      if (mealPlan?.content?.days) {
          const dayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
          const currentDayPlan = mealPlan.content.days[dayIndex % mealPlan.content.days.length];
          if (currentDayPlan) {
              let dailyTotal = parseInt(currentDayPlan.total_calories);
              if (!dailyTotal || isNaN(dailyTotal)) {
                   if (currentDayPlan.meals) dailyTotal = currentDayPlan.meals.reduce((acc:any, m:any) => acc + (parseInt(m.calories)||0), 0);
              }
              calTarget = dailyTotal > 0 ? dailyTotal : 2500;
              if (foodLog?.meals_status && currentDayPlan.meals) {
                  currentDayPlan.meals.forEach((meal: any) => {
                      if (foodLog.meals_status[meal.type]) calConsumed += parseInt(meal.calories) || 0;
                  });
              }
          }
      }
      nutProgress = Math.min((calConsumed / calTarget) * 100, 100);

      const { data: workoutPlan } = await supabase.from('workout_plans').select('content, title').eq('user_id', userId).eq('is_active', true).limit(1).maybeSingle();
      if (workoutPlan?.content?.days) {
          planName = workoutPlan.title || "Programme Perso";
          const dayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
          const currentWorkoutDay = workoutPlan.content.days[dayIndex % workoutPlan.content.days.length];
          if (currentWorkoutDay) {
              sessionName = currentWorkoutDay.focus || "Full Body";
              const { data: workoutLog } = await supabase.from('workout_logs').select('exercises_status').eq('user_id', userId).eq('log_date', todayStr).maybeSingle();
              const totalExercises = currentWorkoutDay.exercises?.length || 0;
              let completedExercises = 0;
              if (workoutLog?.exercises_status && totalExercises > 0) {
                  completedExercises = Object.values(workoutLog.exercises_status).filter(v => v === true).length;
                  workProgress = Math.min((completedExercises / totalExercises) * 100, 100);
              }
          }
      }

      setStats({
        workoutProgress: workProgress,
        nutritionProgress: nutProgress,
        calories: calConsumed,
        caloriesTarget: calTarget,
        nextWorkout: sessionName,
        workoutName: planName
      });

    } catch (error) {
      console.log('Erreur dashboard', error);
    }
  };

  const updateStreakLogic = async (userId: string, currentProfile: any) => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const lastActive = currentProfile.last_active_date;
      let newStreak = currentProfile.streak || 0;
      let shouldUpdate = false;

      const { data: hasSport } = await supabase.from('workout_logs').select('id').eq('user_id', userId).eq('log_date', todayStr).maybeSingle();
      const { data: hasFood } = await supabase.from('nutrition_logs').select('id').eq('user_id', userId).eq('log_date', todayStr).maybeSingle();

      const isActiveToday = !!hasSport || !!hasFood;

      if (isActiveToday) {
          if (lastActive !== todayStr) {
              if (lastActive === yesterdayStr) {
                  newStreak += 1;
              } else {
                  newStreak = 1; 
              }
              shouldUpdate = true;
          }
      } else {
          if (lastActive && lastActive < yesterdayStr && newStreak > 0) {
              newStreak = 0; 
              shouldUpdate = true;
          }
      }

      if (shouldUpdate) {
          await supabase.from('profiles').update({
              streak: newStreak,
              last_active_date: isActiveToday ? todayStr : lastActive 
          }).eq('id', userId);
          
          setProfile({ ...currentProfile, streak: newStreak });
      }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleNav = (path: any) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    router.push(path);
  };

  // --- GESTION ACCÈS PREMIUM ---
  const isPremiumUser = () => {
      const tier = (profile?.tier || 'FREE').toUpperCase();
      return ['PREMIUM', 'ELITE', 'AVANCE', 'ESSENTIEL'].includes(tier);
  };

  const handleLockedNav = (path: string) => {
      if (Platform.OS !== 'web') Haptics.selectionAsync();
      
      if (isPremiumUser()) {
          router.push(path as any);
      } else {
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert(
            "MODULE PREMIUM",
            "Cette fonctionnalité est réservée aux membres Premium.",
            [
                { text: "Annuler", style: "cancel" },
                { text: "DÉBLOQUER", onPress: () => router.push('/profile' as any) }
            ]
          );
      }
  };

  const currentPoints = profile?.points || 0;
  const currentLevel = Math.floor(currentPoints / 1000) + 1;
  const pointsForNextLevel = 1000;
  const pointsInCurrentLevel = currentPoints % 1000;
  const xpProgress = (pointsInCurrentLevel / pointsForNextLevel) * 100;
  
  const isUserPremium = isPremiumUser();

  // --- STYLES DYNAMIQUES ---
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? 30 : 0 },
    auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
    blob: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.4 },
    scrollContent: { padding: 20 },
    
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 },
    greeting: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: '600', letterSpacing: 1, marginBottom: 2 },
    username: { color: theme.colors.text, fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    statusText: { color: theme.colors.success, fontSize: 10, fontWeight: '600' },
    avatarBtn: { shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    avatarGradient: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#fff', fontWeight: '900', fontSize: 16 },
    
    xpWrapper: { marginBottom: 25 },
    xpInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    levelText: { color: theme.colors.text, fontWeight: '600', fontSize: 12 },
    xpText: { color: theme.colors.textSecondary, fontSize: 10 },
    xpTrack: { height: 4, backgroundColor: theme.colors.border, borderRadius: 2, overflow: 'hidden' },
    xpFill: { height: '100%', borderRadius: 2 },
    
    grid: { flexDirection: 'row', gap: 15, marginBottom: 30 },
    glassCard: { flex: 1, backgroundColor: theme.colors.glass, borderRadius: 20, padding: 15, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', shadowColor: theme.isDark ? 'transparent' : '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: theme.isDark ? 0 : 0.05, shadowRadius: 8, elevation: theme.isDark ? 0 : 2 },
    cardIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : theme.colors.bg, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    cardValue: { color: theme.colors.text, fontSize: 24, fontWeight: '900' },
    cardLabel: { color: theme.colors.textSecondary, fontSize: 9, fontWeight: '600', marginTop: 5, letterSpacing: 1, textAlign: 'center' },
    
    sectionTitle: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: '600', letterSpacing: 2, marginBottom: 15, marginLeft: 5 },
    
    aetherSystemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.glass, borderRadius: 20, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: theme.colors.border, shadowColor: theme.isDark ? 'transparent' : '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: theme.isDark ? 0 : 0.05, shadowRadius: 8, elevation: theme.isDark ? 0 : 2 },
    systemIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : theme.colors.bg, justifyContent: 'center', alignItems: 'center' },
    textContainer: { flex: 1, paddingHorizontal: 15 },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    systemLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 1, color: theme.colors.textSecondary, flex: 1, marginRight: 10 },
    systemValue: { fontSize: 12, fontWeight: '600', flexShrink: 0 },
    barBackground: { height: 6, backgroundColor: theme.colors.border, borderRadius: 3, overflow: 'hidden', marginTop: 5 },
    barFill: { height: '100%', borderRadius: 3 },
    
    quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 25 },
    quickActionBtn: { width: (width - 40 - 15) / 2, backgroundColor: theme.colors.glass, borderRadius: 20, padding: 15, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', marginBottom: 15, shadowColor: theme.isDark ? 'transparent' : '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: theme.isDark ? 0 : 0.05, shadowRadius: 8, elevation: theme.isDark ? 0 : 2 },
    quickActionIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    quickActionText: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: '600', letterSpacing: 1, textAlign: 'center' },
    
    lockOverlay: { position: 'absolute', top: -5, right: -5, backgroundColor: theme.colors.cardBg, borderRadius: 10, padding: 2 },
  });

  const AetherProgress = React.memo(({ progress, color, label, icon, value }: any) => (
    <View style={styles.aetherSystemCard}>
      <View style={styles.systemIconBox}>
          <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <View style={styles.textContainer}>
          <View style={styles.labelRow}>
              <Text style={styles.systemLabel} numberOfLines={1} ellipsizeMode="tail">{label}</Text>
              <Text style={[styles.systemValue, { color }]}>{value}</Text>
          </View>
          <View style={styles.barBackground}>
              <LinearGradient
                  colors={[color, theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.barFill, { width: `${Math.min(progress, 100)}%` }]}
              />
          </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
    </View>
  ));

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent={true} />
      {theme.isDark && (
        <View style={styles.auroraBg}>
            <View style={[styles.blob, { top: -100, right: -50, backgroundColor: 'rgba(0, 243, 255, 0.15)' }]} />
            <View style={[styles.blob, { top: 200, left: -100, backgroundColor: 'rgba(139, 92, 246, 0.15)' }]} />
        </View>
      )}
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />} showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
              <View>
                  <Text style={styles.greeting}>CONNEXION ÉTABLIE</Text>
                  <Text style={styles.username}>{profile?.full_name || 'INITIÉ NEXUS'}</Text>
                  <View style={styles.statusRow}>
                      <View style={[styles.statusDot, { backgroundColor: theme.colors.success }]} />
                      <Text style={styles.statusText}>SYSTÈMES EN LIGNE</Text>
                  </View>
              </View>
              <TouchableOpacity style={styles.avatarBtn} onPress={() => router.push('/profile' as any)}>
                  <LinearGradient colors={[theme.colors.primary, theme.colors.secondary]} style={styles.avatarGradient}>
                      <Text style={styles.avatarText}>{profile?.full_name ? profile.full_name.substring(0, 2).toUpperCase() : 'NX'}</Text>
                  </LinearGradient>
              </TouchableOpacity>
          </View>

          <View style={styles.xpWrapper}>
              <View style={styles.xpInfo}>
                  <Text style={styles.levelText}>NIVEAU {currentLevel}</Text>
                  <Text style={styles.xpText}>{pointsInCurrentLevel} / {pointsForNextLevel} XP</Text>
              </View>
              <View style={styles.xpTrack}>
                  <LinearGradient colors={[theme.colors.primary, theme.colors.accent]} start={{x:0, y:0}} end={{x:1, y:0}} style={[styles.xpFill, {width: `${xpProgress}%`}]} />
              </View>
          </View>

          <View style={styles.grid}>
              <View style={styles.glassCard}>
                  <View style={styles.cardIcon}>
                      <MaterialCommunityIcons name="fire" size={24} color={theme.colors.warning} />
                  </View>
                  <Text style={styles.cardValue}>{profile?.streak || 0}</Text>
                  <Text style={styles.cardLabel}>SÉRIE JOURS</Text>
              </View>
              <View style={styles.glassCard}>
                  <View style={styles.cardIcon}>
                      <MaterialCommunityIcons name="scale-bathroom" size={24} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.cardValue}>
                    {profile?.weight || '--'} <Text style={{fontSize:12, color: theme.colors.textSecondary}}>KG</Text>
                  </Text>
                  <Text style={styles.cardLabel}>MASSE ACTUELLE</Text>
              </View>
          </View>

          <Text style={styles.sectionTitle}>MONITORING</Text>
          
          <TouchableOpacity onPress={() => handleNav('/(tabs)/workout')} activeOpacity={0.8}>
              <AetherProgress
                  progress={stats.workoutProgress}
                  color={theme.colors.primary}
                  label={stats.workoutName.toUpperCase()} 
                  value={stats.nextWorkout}
                  icon="dumbbell"
              />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleNav('/(tabs)/nutrition')} activeOpacity={0.8}>
              <AetherProgress
                  progress={stats.nutritionProgress}
                  color={theme.colors.accent}
                  label="NUTRITION"
                  value={`${stats.calories} / ${stats.caloriesTarget} kcal`}
                  icon="food-apple"
              />
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>ACTIONS RAPIDES</Text>
          <View style={styles.quickActionsGrid}>
              
              {/* BOUTON MASSE GRASSE - PREMIUM ONLY */}
              <TouchableOpacity 
                style={[styles.quickActionBtn, !isUserPremium && {opacity: 0.8}]} 
                onPress={() => handleLockedNav('/features/body_fat')}
              >
                  <View style={[styles.quickActionIcon, { backgroundColor: theme.isDark ? 'rgba(255, 170, 0, 0.2)' : '#FFF8E1' }]}>
                      <MaterialCommunityIcons name="water-percent" size={24} color={theme.colors.warning} />
                  </View>
                  <Text style={styles.quickActionText}>MASSE GRASSE</Text>
                  
                  {/* Cadenas si gratuit */}
                  {!isUserPremium && (
                      <View style={styles.lockOverlay}>
                          <MaterialCommunityIcons name="lock" size={12} color={theme.colors.textSecondary} />
                      </View>
                  )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickActionBtn} onPress={() => handleNav('/features/exercise-library')}>
                  <View style={[styles.quickActionIcon, { backgroundColor: theme.isDark ? 'rgba(255, 50, 50, 0.2)' : '#FFEBEE' }]}>
                      <MaterialCommunityIcons name="dumbbell" size={24} color={theme.colors.danger} />
                  </View>
                  <Text style={styles.quickActionText}>BIBLIOTHÈQUE</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickActionBtn} onPress={() => handleNav('/features/food-journal')}>
                  <View style={[styles.quickActionIcon, { backgroundColor: theme.isDark ? 'rgba(74, 222, 128, 0.2)' : '#E8F5E9' }]}>
                      <MaterialCommunityIcons name="notebook-edit" size={24} color={theme.colors.success} />
                  </View>
                  <Text style={styles.quickActionText}>JOURNAL</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickActionBtn} onPress={() => handleNav('/(tabs)/systems')}>
                  <View style={[styles.quickActionIcon, { backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.1)' : theme.colors.bg }]}>
                      <MaterialCommunityIcons name="grid" size={24} color={theme.colors.text} />
                  </View>
                  <Text style={styles.quickActionText}>TOUT VOIR</Text>
              </TouchableOpacity>
          </View>
          <View style={{ height: 100 }} />
       </ScrollView>
     </SafeAreaView>
   </View>
 );
}