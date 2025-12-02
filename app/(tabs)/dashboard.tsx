import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next'; // Import

const { width } = Dimensions.get('window');
const CARD_HEIGHT = 120;

const ProgressWidget = ({ label, value, target, unit, icon, color, theme }: any) => {
    const percentage = target > 0 ? Math.min(value / target, 1) : 0;
    return (
        <View style={[styles(theme).widgetCard, {borderColor: color + '40'}]}>
            <View style={styles(theme).widgetHeader}>
                <View style={[styles(theme).iconBox, {backgroundColor: color + '20'}]}>
                    <MaterialCommunityIcons name={icon} size={18} color={color} />
                </View>
                <Text style={[styles(theme).widgetLabel, {color: theme.colors.textSecondary}]}>{label}</Text>
            </View>
            <View style={{marginTop: 15}}>
                <View style={{flexDirection:'row', alignItems:'baseline', marginBottom: 5}}>
                    <Text style={[styles(theme).widgetValue, {color: theme.colors.text}]}>{value}</Text>
                    <Text style={[styles(theme).widgetTarget, {color: theme.colors.textSecondary}]}> / {target} {unit}</Text>
                </View>
                <View style={styles(theme).progressBg}>
                    <LinearGradient
                        colors={[color, color + '80']}
                        start={{x:0, y:0}} end={{x:1, y:0}}
                        style={[styles(theme).progressFill, {width: `${percentage * 100}%`}]}
                    />
                </View>
            </View>
        </View>
    );
};

export default function DashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation(); // Hook
  
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('Athlète');
  const [activeWorkout, setActiveWorkout] = useState<any>(null);
  const [activeMealPlan, setActiveMealPlan] = useState<any>(null);
  
  const [nutritionStats, setNutritionStats] = useState({ consumed: 0, target: 2500 });
  const [workoutStats, setWorkoutStats] = useState({ done: 0, target: 4 });
  const [weeklyWorkouts, setWeeklyWorkouts] = useState(0);

  useFocusEffect(useCallback(() => { loadDashboardData(); }, []));

  const loadDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;

      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', userId).single();
      if (profile?.full_name) setUserName(profile.full_name.split(' ')[0]);

      const { data: workout } = await supabase.from('workout_plans').select('title, content').eq('user_id', userId).eq('is_active', true).maybeSingle();
      setActiveWorkout(workout ? workout.content : null);

      const { data: meal } = await supabase.from('meal_plans').select('title, content').eq('user_id', userId).eq('is_active', true).maybeSingle();
      setActiveMealPlan(meal ? meal.content : null);

      const today = new Date().toISOString().split('T')[0];
      const { data: nutLog } = await supabase.from('nutrition_logs').select('total_calories').eq('user_id', userId).eq('log_date', today).maybeSingle();
      
      const todayIndex = (new Date().getDay() + 6) % 7; 
      let dailyGoal = 2000;

      if (meal?.content?.days && meal.content.days[todayIndex]) {
          const dayPlan = meal.content.days[todayIndex];
          const sumPlan = dayPlan.meals.reduce((acc: number, m: any) => acc + (parseInt(m.calories) || 0), 0);
          if (sumPlan > 0) dailyGoal = sumPlan;
      }

      setNutritionStats({ consumed: nutLog?.total_calories || 0, target: dailyGoal });

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { count } = await supabase.from('workout_logs').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('log_date', sevenDaysAgo.toISOString());
      
      setWeeklyWorkouts(count || 0);
      const targetSessions = workout?.content?.days?.length || 4;
      setWorkoutStats({ done: count || 0, target: targetSessions });

    } catch (error) { console.log('Erreur Dashboard:', error); } finally { setRefreshing(false); }
  };

  const onRefresh = () => { setRefreshing(true); loadDashboardData(); };
  const currentStyles = styles(theme);

  return (
    <View style={currentStyles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView 
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View style={currentStyles.header}>
            <View>
              <Text style={currentStyles.greeting}>{t('dashboard.greeting')}</Text>
              <Text style={currentStyles.username}>{userName}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/profile')} style={currentStyles.profileBtn}>
              <Ionicons name="person" size={18} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={currentStyles.statsRow}>
             <ProgressWidget 
                label={t('dashboard.stats_nutri')} 
                value={nutritionStats.consumed} 
                target={nutritionStats.target} 
                unit={t('dashboard.unit_kcal')}
                icon="fire" 
                color={theme.colors.success} 
                theme={theme}
             />
             <View style={{width: 10}} />
             <ProgressWidget 
                label={t('dashboard.stats_work')} 
                value={workoutStats.done} 
                target={workoutStats.target} 
                unit={t('dashboard.unit_sessions').includes('7') ? 'S.' : ''} 
                icon="dumbbell" 
                color={theme.colors.primary} 
                theme={theme}
             />
          </View>

          <Text style={currentStyles.sectionTitle}>{t('dashboard.section_active')}</Text>
          <TouchableOpacity 
            style={currentStyles.mainCard} 
            activeOpacity={0.9}
            onPress={() => router.push('/features/workout-tracker')}
          >
            <LinearGradient
              colors={activeWorkout ? [theme.colors.primary, theme.colors.secondary] : [theme.colors.glass, theme.colors.glass]}
              start={{x: 0, y: 0}} end={{x: 1, y: 0.5}}
              style={currentStyles.mainCardGradient}
            >
                {activeWorkout ? (
                    <>
                        <View style={currentStyles.mainCardContent}>
                            <View style={currentStyles.activeBadge}>
                                <MaterialCommunityIcons name="lightning-bolt" size={12} color="#FFD700" />
                                <Text style={currentStyles.badgeText}>{t('dashboard.active_badge')}</Text>
                            </View>
                            <Text style={currentStyles.mainCardTitle}>{activeWorkout.title}</Text>
                            <Text style={currentStyles.mainCardSub}>
                                {t('dashboard.card_focus')} {activeWorkout.days[0].focus} • {activeWorkout.days.length} {t('dashboard.card_sess')}
                            </Text>
                        </View>
                        <View style={currentStyles.arrowBtn}>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </View>
                    </>
                ) : (
                    <>
                         <View style={currentStyles.mainCardContent}>
                            <Text style={[currentStyles.mainCardTitle, {color: theme.colors.text}]}>{t('dashboard.no_plan_title')}</Text>
                            <Text style={[currentStyles.mainCardSub, {color: theme.colors.textSecondary}]}>{t('dashboard.no_plan_desc')}</Text>
                        </View>
                        <View style={[currentStyles.arrowBtn, {backgroundColor: theme.colors.primary}]}>
                            <Ionicons name="add" size={20} color="#fff" />
                        </View>
                    </>
                )}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={currentStyles.sectionTitle}>{t('dashboard.section_explore')}</Text>
          <View style={currentStyles.grid}>
            <TouchableOpacity style={currentStyles.gridItem} onPress={() => router.push('/features/nutrition-plan')}>
                <View style={currentStyles.gridHeader}>
                    <View style={[currentStyles.gridIconBox, { backgroundColor: theme.colors.success + '15' }]}>
                        <MaterialCommunityIcons name="food-apple" size={18} color={theme.colors.success} />
                    </View>
                    <Ionicons name="arrow-forward" size={16} color={theme.colors.border} />
                </View>
                <View>
                    <Text style={currentStyles.gridTitle}>{t('dashboard.mod_nutri')}</Text>
                    <Text style={currentStyles.gridSub}>{activeMealPlan ? t('dashboard.mod_nutri_sub') : t('dashboard.mod_gen')}</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity style={currentStyles.gridItem} onPress={() => router.push('/features/exercise-library')}>
                <View style={currentStyles.gridHeader}>
                    <View style={[currentStyles.gridIconBox, { backgroundColor: '#f59e0b15' }]}>
                        <MaterialCommunityIcons name="bookshelf" size={18} color="#f59e0b" />
                    </View>
                    <Ionicons name="arrow-forward" size={16} color={theme.colors.border} />
                </View>
                <View>
                    <Text style={currentStyles.gridTitle}>{t('dashboard.mod_lib')}</Text>
                    <Text style={currentStyles.gridSub}>{t('dashboard.mod_lib_sub')}</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity style={currentStyles.gridItem} onPress={() => router.push('/features/workout_log')}>
                <View style={currentStyles.gridHeader}>
                    <View style={[currentStyles.gridIconBox, { backgroundColor: '#8b5cf615' }]}>
                        <MaterialCommunityIcons name="history" size={18} color="#8b5cf6" />
                    </View>
                    <Ionicons name="arrow-forward" size={16} color={theme.colors.border} />
                </View>
                <View>
                    <Text style={currentStyles.gridTitle}>{t('dashboard.mod_hist')}</Text>
                    <Text style={currentStyles.gridSub}>{t('dashboard.mod_hist_sub')}</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity style={currentStyles.gridItem} onPress={() => router.push('/(tabs)/coach')}>
                <View style={currentStyles.gridHeader}>
                    <View style={[currentStyles.gridIconBox, { backgroundColor: theme.colors.primary + '15' }]}>
                        <MaterialCommunityIcons name="robot" size={18} color={theme.colors.primary} />
                    </View>
                    <Ionicons name="arrow-forward" size={16} color={theme.colors.border} />
                </View>
                <View>
                    <Text style={currentStyles.gridTitle}>{t('dashboard.mod_coach')}</Text>
                    <Text style={currentStyles.gridSub}>{t('dashboard.mod_coach_sub')}</Text>
                </View>
            </TouchableOpacity>
          </View>
          
          <View style={{height: 40}} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = (theme: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 20 },
    greeting: { fontSize: 11, color: theme.colors.textSecondary, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
    username: { fontSize: 20, fontWeight: '300', color: theme.colors.text, marginTop: 2 },
    profileBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    sectionTitle: { fontSize: 11, fontWeight: '900', color: theme.colors.textSecondary, marginHorizontal: 20, marginBottom: 12, marginTop: 25, letterSpacing: 2 },
    statsRow: { flexDirection: 'row', paddingHorizontal: 20 },
    widgetCard: { flex: 1, backgroundColor: theme.colors.glass, borderRadius: 20, padding: 16, borderWidth: 1 },
    widgetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    iconBox: { width: 30, height: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    widgetLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
    widgetValue: { fontSize: 22, fontWeight: '900' },
    widgetTarget: { fontSize: 11, fontWeight: '600' },
    progressBg: { height: 4, backgroundColor: theme.colors.border, borderRadius: 2, overflow: 'hidden', marginTop: 8 },
    progressFill: { height: '100%', borderRadius: 2 },
    mainCard: { marginHorizontal: 20, borderRadius: 20, overflow: 'hidden', height: CARD_HEIGHT, marginBottom: 10 },
    mainCardGradient: { flex: 1, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    mainCardContent: { flex: 1 },
    activeBadge: { flexDirection:'row', alignItems:'center', gap:4, marginBottom:6, backgroundColor:'rgba(0,0,0,0.2)', alignSelf:'flex-start', paddingHorizontal:8, paddingVertical:4, borderRadius:8 },
    badgeText: { color:'#FFD700', fontWeight:'900', fontSize:8 },
    mainCardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    mainCardSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 4 },
    arrowBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginLeft: 15 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 10 },
    gridItem: { width: (width - 50) / 2, height: 110, backgroundColor: theme.colors.glass, borderRadius: 16, padding: 15, justifyContent: 'space-between', borderWidth: 1, borderColor: theme.colors.border },
    gridHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    gridIconBox: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    gridTitle: { color: theme.colors.text, fontSize: 13, fontWeight: 'bold' },
    gridSub: { color: theme.colors.textSecondary, fontSize: 10, marginTop: 2, letterSpacing: 0.5 },
});