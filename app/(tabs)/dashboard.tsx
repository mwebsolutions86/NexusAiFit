import React, { useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  RefreshControl,
  Platform,
  Image,
  StatusBar
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

// Hooks & Libs
import { useTheme } from '../../lib/theme';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useActivePlans } from '../../hooks/useActivePlans'; 
import { useNutritionLog } from '../../hooks/useNutritionLog'; 
import { ScreenLayout } from '../../components/ui/ScreenLayout';
import { GlassCard } from '../../components/ui/GlassCard';

const { width } = Dimensions.get('window');

const getTodayIndex = () => {
  const day = new Date().getDay(); 
  // 0 = Dimanche (6), 1 = Lundi (0)...
  return (day + 6) % 7; 
};

export default function DashboardScreen() {
  const { colors, isDark } = useTheme(); // ✅ On récupère le thème
  const router = useRouter();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const { userProfile } = useUserProfile();
  const { data: plans, isLoading: isPlansLoading } = useActivePlans(userProfile?.id);
  const { data: log, isLoading: isLogLoading } = useNutritionLog(today);

  // --- 🧠 CALCULATEUR CALORIES (Logique Bulldozer) ---
  const nutritionTarget = useMemo(() => {
      if (!plans?.mealPlan) return 2500;

      // Normalisation de la structure
      const rawData = plans.mealPlan;
      const content = ((rawData as any).content && (rawData as any).content.days) ? (rawData as any).content : rawData;

      if (!content.days || !Array.isArray(content.days)) return 2500;

      // Trouver le bon jour
      const todayIdx = getTodayIndex();
      const safeIndex = todayIdx % content.days.length;
      const day = content.days[safeIndex];

      // Somme
      let total = 0;
      if (day.meals && Array.isArray(day.meals)) {
          day.meals.forEach((meal: any) => {
              if (meal.items && Array.isArray(meal.items)) {
                  meal.items.forEach((item: any) => {
                      const valStr = String(item.calories || 0).replace(/[^0-9.]/g, ''); 
                      const val = parseInt(valStr, 10);
                      if (!isNaN(val)) total += val;
                  });
              }
          });
      }
      return total > 0 ? total : 2500;
  }, [plans]);

  // --- DONNÉES ---
  const caloriesConsumed = log?.total_calories || 0;
  const safeTarget = nutritionTarget; 
  const caloriesProgress = Math.min((caloriesConsumed / safeTarget) * 100, 100);
  const remaining = Math.max(0, safeTarget - caloriesConsumed);

  const workoutToday = useMemo(() => {
      const rawData = plans?.workoutPlan;
      const content = ((rawData as any)?.content && (rawData as any).content.days) ? (rawData as any).content : rawData;
      
      if (!content || !content.days || !Array.isArray(content.days)) return null;
      
      const todayIdx = getTodayIndex();
      const safeIndex = todayIdx % content.days.length;
      return content.days[safeIndex];
  }, [plans]);

  // --- ACTIONS ---
  const onRefresh = async () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    await queryClient.invalidateQueries();
  };

  const navigateTo = (route: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    router.push(route as any);
  };

  return (
    <ScreenLayout>
      {/* FOND AMBIANT (Subtil en Light, Sombre en Dark) */}
      <Image 
          source={require('../../assets/adaptive-icon.png')} 
          style={[StyleSheet.absoluteFillObject, { opacity: isDark ? 0.05 : 0.02, transform: [{scale: 1.5}] }]}
          blurRadius={40}
      />
      
      {/* EFFET LUMIÈRE HAUT (Seulement en Dark pour l'ambiance) */}
      {isDark && (
        <View style={{position: 'absolute', top: -100, left: 0, right: 0, height: 250, backgroundColor: colors.primary, opacity: 0.08, borderRadius: 100, transform: [{scaleX: 2}]}} />
      )}

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isPlansLoading || isLogLoading} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        
        {/* --- 1. HUD HEADER --- */}
        <View style={styles.hudContainer}>
            <View style={styles.topBar}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                    <View style={[styles.statusDot, { backgroundColor: colors.success, shadowColor: colors.success }]} />
                    <Text style={[styles.systemText, { color: isDark ? '#fff' : colors.textSecondary }]}>SYSTEM ONLINE</Text>
                </View>
                <Text style={[styles.dateText, { color: isDark ? '#fff' : colors.text }]}>
                    {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' }).toUpperCase()}
                </Text>
            </View>

            <View style={styles.profileRow}>
                <View>
                    <Text style={[styles.welcomeLabel, { color: colors.textSecondary }]}>OPERATOR_ID</Text>
                    <Text style={[styles.operatorName, { color: colors.text }]}>
                        {userProfile?.full_name ? userProfile.full_name.toUpperCase() : "INITIÉ"}
                    </Text>
                    <View style={[styles.rankBadge, { borderColor: colors.border, backgroundColor: colors.primary + '10' }]}>
                        <Text style={[styles.rankText, { color: colors.primary }]}>
                            {userProfile?.tier === 'PREMIUM' ? 'ELITE CLASS' : 'STANDARD CLASS'}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity onPress={() => navigateTo('/profile')} style={styles.avatarContainer}>
                    <LinearGradient
                        colors={[colors.primary, isDark ? 'transparent' : '#fff']}
                        style={styles.avatarBorder}
                    >
                        <View style={[styles.avatarInner, { backgroundColor: isDark ? '#000' : '#fff' }]}>
                            <MaterialCommunityIcons name="account" size={30} color={colors.text} />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>

        {/* --- 2. HERO CARD (DYNAMIQUE) --- */}
        <Animated.View entering={FadeInUp.delay(200).springify()} style={{ paddingHorizontal: 20, marginTop: 10 }}>
            <GlassCard 
                style={[styles.heroCard, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(20,20,30,0.6)' : 'rgba(255,255,255,0.8)' }]} 
                intensity={isDark ? 40 : 80}
            >
                
                {/* SECTION CALORIES */}
                <View style={styles.heroTop}>
                    <View>
                        <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>BILAN ÉNERGÉTIQUE</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                            <Text style={[styles.bigNumber, { color: colors.text }]}>{Math.round(caloriesConsumed)}</Text>
                            <Text style={[styles.unit, { color: colors.textSecondary }]}> / {Math.round(safeTarget)} KCAL</Text>
                        </View>
                        
                        {/* Progress Bar Adaptative */}
                        <View style={[styles.progressBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                            <View style={[styles.progressFill, { width: `${caloriesProgress}%`, backgroundColor: colors.primary }]} />
                        </View>
                        
                        <Text style={[styles.remainingText, { color: colors.textSecondary }]}>
                            {Math.round(remaining)} kcal restantes
                        </Text>
                    </View>

                    {/* Cercle Réacteur */}
                    <View style={[styles.ringContainer, { borderColor: colors.primary + '30', backgroundColor: colors.primary + '05' }]}>
                        <MaterialCommunityIcons name="lightning-bolt" size={32} color={colors.primary} />
                    </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {/* SECTION WORKOUT */}
                <View style={styles.heroBottom}>
                    <View style={styles.statusRow}>
                        <MaterialCommunityIcons 
                            name={workoutToday ? "radioactive" : "sleep"} 
                            size={18} 
                            color={workoutToday ? colors.success : colors.textSecondary} 
                        />
                        <Text style={[styles.statusText, { color: colors.text }]}>
                            {workoutToday ? "MISSION ACTIVE" : "REPOS"}
                        </Text>
                    </View>
                    
                    <TouchableOpacity onPress={() => navigateTo('/(tabs)/workout')}>
                        <View style={[styles.actionChip, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}>
                            <Text style={[styles.chipText, { color: colors.primary }]}>ACCÈS</Text>
                            <Ionicons name="arrow-forward" size={12} color={colors.primary} />
                        </View>
                    </TouchableOpacity>
                </View>

            </GlassCard>
        </Animated.View>

        {/* --- 3. ACCÈS RAPIDE --- */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ACCÈS RAPIDE</Text>

        <View style={styles.gridContainer}>
            {/* CARTE SPORT */}
            <TouchableOpacity style={{flex:1}} onPress={() => navigateTo('/(tabs)/workout')} activeOpacity={0.8}>
                <Animated.View entering={FadeInRight.delay(300)}>
                    <GlassCard style={[styles.smallCard, { backgroundColor: isDark ? undefined : '#fff' }]}>
                        <View style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}>
                            <MaterialCommunityIcons name="dumbbell" size={24} color={colors.primary} />
                        </View>
                        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                            {workoutToday ? workoutToday.focus : "Sport"}
                        </Text>
                        <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                            {workoutToday ? `${workoutToday.exercises?.length} Exos` : "Planifier"}
                        </Text>
                    </GlassCard>
                </Animated.View>
            </TouchableOpacity>

            {/* CARTE NUTRITION */}
            <TouchableOpacity style={{flex:1}} onPress={() => navigateTo('/(tabs)/nutrition')} activeOpacity={0.8}>
                <Animated.View entering={FadeInRight.delay(400)}>
                    <GlassCard style={[styles.smallCard, { backgroundColor: isDark ? undefined : '#fff' }]}>
                        <View style={[styles.iconBox, { backgroundColor: colors.success + '15' }]}>
                            <MaterialCommunityIcons name="food-apple" size={24} color={colors.success} />
                        </View>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Nutrition</Text>
                        <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                            {Math.round(caloriesProgress)}% Requis
                        </Text>
                    </GlassCard>
                </Animated.View>
            </TouchableOpacity>
        </View>

        {/* --- 4. HYDRATATION (Shortcut) --- */}
        <TouchableOpacity style={{ marginHorizontal: 20, marginTop: 15 }} onPress={() => navigateTo('/features/water')}>
            <Animated.View entering={FadeInUp.delay(500)}>
                <GlassCard style={[styles.rowCard, { backgroundColor: isDark ? undefined : '#fff' }]}>
                    <View style={{flexDirection:'row', alignItems:'center', gap: 15}}>
                        <View style={[styles.iconBox, { backgroundColor: '#06b6d415', width: 40, height: 40 }]}>
                            <Ionicons name="water" size={20} color="#06b6d4" />
                        </View>
                        <View>
                            <Text style={[styles.cardTitle, { color: colors.text, fontSize: 14 }]}>Hydratation</Text>
                            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Suivi journalier</Text>
                        </View>
                    </View>
                    <Ionicons name="add-circle-outline" size={24} color={colors.textSecondary} />
                </GlassCard>
            </Animated.View>
        </TouchableOpacity>

      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  hudContainer: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 25,
    paddingBottom: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    opacity: 0.8
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, shadowOpacity: 0.5, shadowRadius: 4, shadowOffset: {width:0, height:0} },
  systemText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  dateText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },

  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 2 },
  operatorName: { fontSize: 28, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  rankBadge: { 
    alignSelf: 'flex-start', 
    marginTop: 5, 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 6, 
    borderWidth: 1, 
  },
  rankText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },

  avatarContainer: { width: 60, height: 60 },
  avatarBorder: { flex: 1, borderRadius: 30, padding: 2, justifyContent: 'center', alignItems: 'center' },
  avatarInner: { flex: 1, width: '100%', borderRadius: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },

  // HERO CARD
  heroCard: { padding: 25, borderRadius: 28, borderWidth: 1 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 5 },
  bigNumber: { fontSize: 36, fontWeight: '900', letterSpacing: -1 },
  unit: { fontSize: 12, fontWeight: 'bold', marginBottom: 6 },
  
  progressBar: { height: 6, width: 140, borderRadius: 3, marginTop: 5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  remainingText: { fontSize: 10, marginTop: 8, fontWeight: 'bold', opacity: 0.7 },

  ringContainer: {
    width: 70, height: 70, borderRadius: 35, borderWidth: 4, justifyContent: 'center', alignItems: 'center',
  },

  divider: { height: 1, width: '100%', marginVertical: 20, opacity: 0.5 },

  heroBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusText: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  actionChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 10, fontWeight: '900' },

  // GRID
  sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 2, marginTop: 30, marginBottom: 15, marginLeft: 25 },
  gridContainer: { flexDirection: 'row', gap: 15, paddingHorizontal: 20 },
  
  smallCard: { padding: 15, borderRadius: 20, height: 130, justifyContent: 'space-between' },
  iconBox: { width: 45, height: 45, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 14, fontWeight: '900', marginBottom: 2 },
  cardSub: { fontSize: 11, fontWeight: '500' },

  rowCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 20 },
});