import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

// --- HOOKS ---
import { useTheme } from '../../lib/theme';
import { useUserProfile } from '../hooks/useUserProfile'; // Assure-toi que ce fichier existe
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useActivePlans } from '../hooks/useActivePlans';

// --- COMPONENTS UI ---
import { ScreenLayout } from '../../components/ui/ScreenLayout';
import { GlassCard } from '../../components/ui/GlassCard';

// Petit hook utilitaire pour récupérer l'ID utilisateur
const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user?.id;
    },
    staleTime: Infinity,
  });
};

const ProgressWidget = ({ label, value, target, unit, icon, color }: any) => {
    const { colors } = useTheme();
    const percentage = target > 0 ? Math.min(value / target, 1) : 0;
    
    return (
        <GlassCard style={styles.widgetCard}>
            <View style={styles.widgetHeader}>
                <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
                    <MaterialCommunityIcons name={icon} size={18} color={color} />
                </View>
                <Text style={[styles.widgetLabel, { color: colors.textSecondary }]}>{label}</Text>
            </View>
            <View style={{ marginTop: 15 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 5 }}>
                    <Text style={[styles.widgetValue, { color: colors.text }]}>{value}</Text>
                    <Text style={[styles.widgetTarget, { color: colors.textSecondary }]}> / {target} {unit}</Text>
                </View>
                <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
                    <LinearGradient
                        colors={[color, color + '80']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={[styles.progressFill, { width: `${percentage * 100}%` }]}
                    />
                </View>
            </View>
        </GlassCard>
    );
};

export default function DashboardScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // 1. Récupération des données via React Query
  const { data: userId } = useCurrentUser();
  const { data: profile } = useUserProfile();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats(userId);
  const { data: plans, isLoading: plansLoading, refetch: refetchPlans } = useActivePlans(userId);

  const isLoading = statsLoading || plansLoading;
  const activeWorkout = plans?.workoutPlan;
  const activeMealPlan = plans?.mealPlan;

  const onRefresh = () => {
    refetchStats();
    refetchPlans();
    queryClient.invalidateQueries({ queryKey: ['userProfile'] });
  };

  const userName = profile?.full_name?.split(' ')[0] || 'Athlète';

  return (
    <ScreenLayout>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>{t('dashboard.greeting')}</Text>
            <Text style={[styles.username, { color: colors.text }]}>{userName}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/profile')} style={[styles.profileBtn, { backgroundColor: colors.glass, borderColor: colors.border }]}>
            <Ionicons name="person" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* STATS WIDGETS */}
        <View style={styles.statsRow}>
           <ProgressWidget 
              label={t('dashboard.stats_nutri')} 
              value={stats?.caloriesConsumed || 0} 
              target={stats?.targetCalories || 2500} // Tu pourras affiner ce target plus tard
              unit={t('dashboard.unit_kcal')}
              icon="fire" 
              color={colors.success} 
           />
           <View style={{ width: 10 }} />
           <ProgressWidget 
              label={t('dashboard.stats_work')} 
              value={stats?.weeklyWorkouts || 0} 
              target={4} 
              unit="S." 
              icon="dumbbell" 
              color={colors.primary} 
           />
        </View>

        {/* ACTIVE WORKOUT CARD */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('dashboard.section_active')}</Text>
        <TouchableOpacity 
          style={styles.mainCardContainer}
          activeOpacity={0.9}
          onPress={() => router.push('/features/workout-tracker')}
        >
          <LinearGradient
            colors={activeWorkout ? [colors.primary, colors.secondary] : [colors.glass, colors.glass]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.5 }}
            style={[styles.mainCardGradient, { borderColor: activeWorkout ? 'transparent' : colors.border }]}
          >
              {activeWorkout ? (
                  <>
                      <View style={{ flex: 1 }}>
                          <View style={styles.activeBadge}>
                              <MaterialCommunityIcons name="lightning-bolt" size={12} color="#FFD700" />
                              <Text style={styles.badgeText}>{t('dashboard.active_badge')}</Text>
                          </View>
                          <Text style={styles.mainCardTitle}>{activeWorkout.title}</Text>
                          <Text style={styles.mainCardSub}>
                              {t('dashboard.card_focus')} {activeWorkout.days?.[0]?.focus} • {activeWorkout.days?.length} {t('dashboard.card_sess')}
                          </Text>
                      </View>
                      <View style={styles.arrowBtn}>
                          <Ionicons name="arrow-forward" size={20} color="#fff" />
                      </View>
                  </>
              ) : (
                  <>
                       <View style={{ flex: 1 }}>
                          <Text style={[styles.mainCardTitle, { color: colors.text }]}>{t('dashboard.no_plan_title')}</Text>
                          <Text style={[styles.mainCardSub, { color: colors.textSecondary }]}>{t('dashboard.no_plan_desc')}</Text>
                      </View>
                      <View style={[styles.arrowBtn, { backgroundColor: colors.primary }]}>
                          <Ionicons name="add" size={20} color="#fff" />
                      </View>
                  </>
              )}
          </LinearGradient>
        </TouchableOpacity>

        {/* GRID NAVIGATION */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('dashboard.section_explore')}</Text>
        <View style={styles.grid}>
          <NavCard 
            title={t('dashboard.mod_nutri')}
            sub={activeMealPlan ? t('dashboard.mod_nutri_sub') : t('dashboard.mod_gen')}
            icon="food-apple"
            color={colors.success}
            path="/features/nutrition-plan"
          />
          <NavCard 
            title={t('dashboard.mod_lib')}
            sub={t('dashboard.mod_lib_sub')}
            icon="bookshelf"
            color="#f59e0b"
            path="/features/exercise-library"
          />
          <NavCard 
            title={t('dashboard.mod_hist')}
            sub={t('dashboard.mod_hist_sub')}
            icon="history"
            color="#8b5cf6"
            path="/features/workout_log"
          />
          <NavCard 
            title={t('dashboard.mod_coach')}
            sub={t('dashboard.mod_coach_sub')}
            icon="robot"
            color={colors.primary}
            path="/(tabs)/coach"
          />
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

// Composant interne pour la grille
const NavCard = ({ title, sub, icon, color, path }: any) => {
    const router = useRouter();
    const { colors } = useTheme();
    return (
        <TouchableOpacity style={[styles.gridItem, { backgroundColor: colors.glass, borderColor: colors.border }]} onPress={() => router.push(path)}>
            <View style={styles.gridHeader}>
                <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
                    <MaterialCommunityIcons name={icon} size={18} color={color} />
                </View>
                <Ionicons name="arrow-forward" size={16} color={colors.border} />
            </View>
            <View>
                <Text style={[styles.gridTitle, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.gridSub, { color: colors.textSecondary }]}>{sub}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 20 },
    greeting: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
    username: { fontSize: 20, fontWeight: '300', marginTop: 2 },
    profileBtn: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    sectionTitle: { fontSize: 11, fontWeight: '900', marginHorizontal: 20, marginBottom: 12, marginTop: 25, letterSpacing: 2 },
    
    statsRow: { flexDirection: 'row', paddingHorizontal: 20 },
    widgetCard: { flex: 1, padding: 16 },
    widgetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    widgetLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
    widgetValue: { fontSize: 22, fontWeight: '900' },
    widgetTarget: { fontSize: 11, fontWeight: '600' },
    
    iconBox: { width: 30, height: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    progressBg: { height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 8 },
    progressFill: { height: '100%', borderRadius: 2 },
    
    mainCardContainer: { marginHorizontal: 20, borderRadius: 24, overflow: 'hidden', height: 120, marginBottom: 10 },
    mainCardGradient: { flex: 1, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1 },
    activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6, backgroundColor: 'rgba(0,0,0,0.2)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    badgeText: { color: '#FFD700', fontWeight: '900', fontSize: 8 },
    mainCardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    mainCardSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 4 },
    arrowBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginLeft: 15 },
    
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 10 },
    gridItem: { width: '48%', height: 110, borderRadius: 16, padding: 15, justifyContent: 'space-between', borderWidth: 1, marginBottom: 10 },
    gridHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    gridTitle: { fontSize: 13, fontWeight: 'bold' },
    gridSub: { fontSize: 10, marginTop: 2, letterSpacing: 0.5 },
});