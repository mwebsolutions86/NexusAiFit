import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions, Platform } from 'react-native';
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

  // Données simulées pour l'instant (seront connectées aux modules plus tard)
  const [stats, setStats] = useState({
    workoutProgress: 30, // Exemple: 30%
    nutritionProgress: 65, // Exemple: 65%
    calories: 1450,
    caloriesTarget: 2500,
    nextWorkout: 'Pec / Dos',
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

      // Récupération du profil
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (userProfile) setProfile(userProfile);

      // TODO: Ici, ajouter les appels pour récupérer les stats réelles depuis meal_plans et workout_logs
      // Pour l'instant, on garde les stats simulées pour l'UI

    } catch (error) {
      console.log('Erreur dashboard', error);
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

  // Calcul du Niveau (Basé sur les Points / 1000)
  const currentPoints = profile?.points || 0;
  const currentLevel = Math.floor(currentPoints / 1000) + 1;
  const pointsForNextLevel = 1000;
  const pointsInCurrentLevel = currentPoints % 1000;
  const xpProgress = (pointsInCurrentLevel / pointsForNextLevel) * 100;

  // Composant Jauge Aether avec memoization
  const AetherProgress = React.memo(({ progress, color, label, icon, value }: any) => (
    <View style={styles.aetherSystemCard}>
      <View style={styles.systemIconBox}>
          <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <View style={{ flex: 1, paddingHorizontal: 15 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
              <Text style={[styles.systemLabel, { color: 'rgba(255,255,255,0.8)' }]}>{label}</Text>
              <Text style={[styles.systemValue, { color }]}>{value}</Text>
          </View>
          <View style={styles.barBackground}>
              <LinearGradient
                  colors={[color, 'rgba(255,255,255,0.1)']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.barFill, { width: `${Math.min(progress, 100)}%` }]}
              />
          </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255,255,255,0.2)" />
    </View>
  ));

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? 30 : 0 },
    auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
    blob: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.4 },
    scrollContent: { padding: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 },
    greeting: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '600', letterSpacing: 1, marginBottom: 2 },
    username: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    statusText: { color: '#4ade80', fontSize: 10, fontWeight: '600' },
    avatarBtn: { shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10 },
    avatarGradient: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: theme.isDark ? '#000' : '#fff', fontWeight: '900', fontSize: 16 },
    xpWrapper: { marginBottom: 25 },
    xpInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    levelText: { color: theme.colors.text, fontWeight: '600', fontSize: 12 },
    xpText: { color: theme.colors.textSecondary, fontSize: 10 },
    xpTrack: { height: 4, backgroundColor: theme.colors.border, borderRadius: 2, overflow: 'hidden' },
    xpFill: { height: '100%', borderRadius: 2 },
    grid: { flexDirection: 'row', gap: 15, marginBottom: 30 },
    glassCard: { flex: 1, backgroundColor: 'rgba(20, 20, 30, 0.6)', borderRadius: 20, padding: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center' },
    cardIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    cardValue: { color: '#fff', fontSize: 24, fontWeight: '900' },
    cardLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '600', marginTop: 5, letterSpacing: 1 },
    sectionTitle: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: '600', letterSpacing: 2, marginBottom: 15, marginLeft: 5 },
    aetherSystemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.cardBg, borderRadius: 20, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: theme.colors.border },
    systemIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' },
    systemLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 1 },
    systemValue: { fontSize: 12, fontWeight: '600' },
    barBackground: { height: 6, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: 3, overflow: 'hidden', marginTop: 5 },
    barFill: { height: '100%', borderRadius: 3 },
    quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 25 },
    quickActionBtn: { width: (width - 40 - 15) / 2, backgroundColor: 'rgba(20, 20, 30, 0.6)', borderRadius: 20, padding: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', marginBottom: 15 },
    quickActionIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    quickActionText: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '600', letterSpacing: 1 },
  });



  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

      {theme.isDark && (
        <View style={styles.auroraBg}>
            <View style={[styles.blob, { top: -100, right: -50, backgroundColor: 'rgba(0, 243, 255, 0.15)' }]} />
            <View style={[styles.blob, { top: 200, left: -100, backgroundColor: 'rgba(139, 92, 246, 0.15)' }]} />
        </View>
      )}

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00f3ff" />}
          showsVerticalScrollIndicator={false}
        >

          {/* HEADER */}
          <View style={styles.header}>
              <View>
                  <Text style={styles.greeting}>CONNEXION ÉTABLIE</Text>
                  <Text style={styles.username}>{profile?.full_name || 'INITIÉ NEXUS'}</Text>
                  <View style={styles.statusRow}>
                      <View style={[styles.statusDot, { backgroundColor: theme.colors.success }]} />
                      <Text style={styles.statusText}>SYSTÈMES EN LIGNE</Text>
                  </View>
              </View>
              {/* On peut rediriger vers le profil complet si besoin */}
              <TouchableOpacity style={styles.avatarBtn} onPress={() => router.push('/profile' as any)}>
                  <LinearGradient colors={['#00f3ff', '#0066ff']} style={styles.avatarGradient}>
                      <Text style={styles.avatarText}>
                        {profile?.full_name ? profile.full_name.substring(0, 2).toUpperCase() : 'NX'}
                      </Text>
                  </LinearGradient>
              </TouchableOpacity>
          </View>

          {/* BARRE XP */}
          <View style={styles.xpWrapper}>
              <View style={styles.xpInfo}>
                  <Text style={styles.levelText}>NIVEAU {currentLevel}</Text>
                  <Text style={styles.xpText}>{pointsInCurrentLevel} / {pointsForNextLevel} XP</Text>
              </View>
              <View style={styles.xpTrack}>
                  <LinearGradient
                      colors={[theme.colors.primary, theme.colors.accent]}
                      start={{x:0, y:0}} end={{x:1, y:0}}
                      style={[styles.xpFill, {width: `${xpProgress}%`}]}
                  />
              </View>
          </View>

          {/* GRID STATS */}
          <View style={styles.grid}>
              <View style={styles.glassCard}>
                  <View style={styles.cardIcon}>
                      <MaterialCommunityIcons name="fire" size={24} color="#ffaa00" />
                  </View>
                  <Text style={styles.cardValue}>{profile?.streak || 0}</Text>
                  <Text style={styles.cardLabel}>SÉRIE JOURS</Text>
              </View>

              <View style={styles.glassCard}>
                  <View style={styles.cardIcon}>
                      <MaterialCommunityIcons name="scale-bathroom" size={24} color="#00f3ff" />
                  </View>
                  <Text style={styles.cardValue}>
                    {profile?.weight || '--'} <Text style={{fontSize:12, color:'#666'}}>KG</Text>
                  </Text>
                  <Text style={styles.cardLabel}>MASSE ACTUELLE</Text>
              </View>
          </View>

          {/* MONITORING */}
          <Text style={styles.sectionTitle}>MONITORING</Text>
          
          <TouchableOpacity onPress={() => handleNav('/(tabs)/workout')} activeOpacity={0.8}>
              <AetherProgress
                  progress={stats.workoutProgress}
                  color="#00f3ff"
                  label="PROTOCOLE SPORT"
                  value={stats.nextWorkout}
                  icon="dumbbell"
              />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleNav('/(tabs)/nutrition')} activeOpacity={0.8}>
              <AetherProgress
                  progress={stats.nutritionProgress}
                  color="#4ade80"
                  label="NUTRITION"
                  value={`${stats.calories} / ${stats.caloriesTarget} kcal`}
                  icon="food-apple"
              />
          </TouchableOpacity>

          {/* ACTIONS RAPIDES */}
          <Text style={styles.sectionTitle}>ACTIONS RAPIDES</Text>
          <View style={styles.quickActionsGrid}>
             
              <TouchableOpacity style={styles.quickActionBtn} onPress={() => handleNav('/features/body_fat')}>
                  <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(255, 170, 0, 0.2)' }]}>
                      <MaterialCommunityIcons name="water-percent" size={24} color="#ffaa00" />
                  </View>
                  <Text style={styles.quickActionText}>MASSE GRASSE</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickActionBtn} onPress={() => handleNav('/features/exercise-library')}>
                  <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(255, 50, 50, 0.2)' }]}>
                      <MaterialCommunityIcons name="dumbbell" size={24} color="#ff3232" />
                  </View>
                  <Text style={styles.quickActionText}>BIBLIOTHÈQUE</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickActionBtn} onPress={() => handleNav('/features/food-journal')}>
                  <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(74, 222, 128, 0.2)' }]}>
                      <MaterialCommunityIcons name="notebook-edit" size={24} color="#4ade80" />
                  </View>
                  <Text style={styles.quickActionText}>JOURNAL</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickActionBtn} onPress={() => handleNav('/(tabs)/systems')}>
                  <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
                      <MaterialCommunityIcons name="grid" size={24} color="#fff" />
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