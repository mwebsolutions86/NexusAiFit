import React, { useMemo, useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Platform,
} from 'react-native';
import { Image } from 'expo-image'; 
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import Animated, { 
  FadeInUp, 
  FadeInRight, 
  FadeInDown, 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  withSpring
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../../lib/theme';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useActivePlans } from '../../hooks/useActivePlans'; 
import { useNutritionLog } from '../../hooks/useNutritionLog'; 
import { useNutritionMutations } from '../../hooks/useNutritionMutations'; 
import { ScreenLayout } from '../../components/ui/ScreenLayout';
import { GlassCard } from '../../components/ui/GlassCard';

// --- UTILITAIRES ---
const getTodayIndex = () => {
  const day = new Date().getDay(); 
  return (day + 6) % 7; 
};

const CountUp = ({ target, style }: { target: number, style?: any }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
      let startTimestamp: number | null = null;
      const duration = 1200; 
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        setCount(Math.floor(easeProgress * target));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, [target]);
    return <Text style={style}>{count}</Text>;
};

const SkeletonItem = ({ style, width, height, borderRadius = 8 }: any) => {
    const { colors, isDark } = useTheme();
    const opacity = useSharedValue(0.3);
    useEffect(() => {
        opacity.value = withRepeat(withSequence(withTiming(0.6, {duration:800}), withTiming(0.3, {duration:800})), -1, true);
    }, []);
    const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
    const bgColor = isDark ? colors.primary + '20' : '#cbd5e1'; 
    return (
        <Animated.View style={[{ backgroundColor: bgColor, width, height, borderRadius, overflow: 'hidden' }, style, animatedStyle]} />
    );
};

const DashboardSkeleton = () => {
    return (
        <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 40 }}>
                <View style={{ gap: 8 }}>
                    <SkeletonItem width={80} height={12} />
                    <SkeletonItem width={160} height={24} />
                </View>
                <SkeletonItem width={44} height={44} borderRadius={22} />
            </View>
            <GlassCard style={{ height: 180, padding: 25, justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ gap: 10 }}>
                        <SkeletonItem width={120} height={14} />
                        <SkeletonItem width={180} height={40} />
                    </View>
                    <SkeletonItem width={50} height={50} borderRadius={25} />
                </View>
                <SkeletonItem width="100%" height={8} />
            </GlassCard>
            <View style={{ gap: 15 }}>
                <SkeletonItem width={140} height={14} />
                <View style={{ flexDirection: 'row', gap: 20 }}>
                     <GlassCard style={{ flex: 1, height: 160, padding: 15 }}><View /></GlassCard>
                     <GlassCard style={{ flex: 1, height: 160, padding: 15 }}><View /></GlassCard>
                </View>
            </View>
        </View>
    );
};

const MicroToast = ({ visible, message }: { visible: boolean, message: string }) => {
    const { colors, isDark } = useTheme();
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(20);

    useEffect(() => {
        if (visible) {
            opacity.value = withTiming(1);
            translateY.value = withSpring(0);
        } else {
            opacity.value = withTiming(0);
            translateY.value = withTiming(20);
        }
    }, [visible]);

    const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }));

    return (
        <Animated.View style={[
            styles.toastContainer, 
            animatedStyle,
            { 
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                borderColor: colors.primary + '30',
                shadowColor: colors.primary,
                shadowOpacity: isDark ? 0.5 : 0.15,
                borderWidth: isDark ? 1 : 0 
            }
        ]}>
            <View style={{flexDirection:'row', alignItems:'center', gap: 10}}>
                <Ionicons name="water" size={20} color="#06b6d4" />
                <Text style={{color: isDark ? '#fff' : '#0f172a', fontWeight: 'bold'}}>{message}</Text>
            </View>
        </Animated.View>
    );
};

export default function DashboardScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const { userProfile, isLoading: profileLoading } = useUserProfile();
  const { data: plans, isLoading: isPlansLoading } = useActivePlans(userProfile?.id);
  const { data: log, isLoading: isLogLoading } = useNutritionLog(today);
  
  const { addWater } = useNutritionMutations(today);
  const [toastVisible, setToastVisible] = useState(false);

  const isLoading = profileLoading || isPlansLoading || isLogLoading;

  const handleAddWater = () => {
    addWater.mutate({ amount: 250, currentLog: log || null });
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
  };

  const nutritionTarget = useMemo(() => {
      const rawData = plans?.mealPlan;
      const content = (rawData as any)?.content?.days ? (rawData as any).content : rawData;
      if (!content?.days) return 2500;
      const day = content.days[getTodayIndex() % content.days.length];
      let total = 0;
      day?.meals?.forEach((m:any) => m?.items?.forEach((i:any) => {
          const v = parseInt(String(i.calories).replace(/[^0-9]/g,'')||'0');
          if(!isNaN(v)) total += v;
      }));
      return total || 2500;
  }, [plans]);

  const caloriesConsumed = log?.total_calories || 0;
  const safeTarget = nutritionTarget; 
  const caloriesProgress = Math.min((caloriesConsumed / safeTarget) * 100, 100);

  const workoutToday = useMemo(() => {
      const rawData = plans?.workoutPlan;
      const content = (rawData as any)?.content?.days ? (rawData as any).content : rawData;
      return content?.days?.[getTodayIndex() % content.days.length] || null;
  }, [plans]);

  const navigateTo = (route: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    router.push(route as any);
  };

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await queryClient.invalidateQueries();
  };

  // 🎨 COULEURS UNIFIÉES
  const iconBg = isDark ? colors.primary + '20' : '#e0f2fe'; 
  const waterIconBg = isDark ? '#06b6d420' : '#cffafe'; 
  // ✅ Harmonisation : Sommeil/Corps utilisent le même gris léger
  const secondaryIconBg = isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9';

  const cardTitleColor = isDark ? colors.text : '#1e293b'; 
  const cardSubColor = isDark ? colors.textSecondary : '#64748b';

  return (
    <ScreenLayout>
      <Image 
          source={require('../../assets/adaptive-icon.png')} 
          style={[StyleSheet.absoluteFillObject, { opacity: isDark ? 0.08 : 0.02 }]}
          blurRadius={60}
          contentFit="cover"
      />
      <LinearGradient 
        colors={isDark ? [colors.primary, 'transparent'] : ['#bfdbfe', 'transparent']} 
        style={{position:'absolute', top:0, left:0, right:0, height:250, opacity: isDark ? 0.1 : 0.3}} 
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {isLoading ? (
            <Animated.View entering={FadeInUp.duration(400)}>
                <DashboardSkeleton />
            </Animated.View>
        ) : (
            <>
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
                    <View>
                        <Text style={[styles.greeting, { color: isDark ? colors.textSecondary : '#64748b' }]}>BONJOUR,</Text>
                        <Text style={[styles.username, { color: isDark ? colors.text : '#0f172a' }]}>
                            {userProfile?.full_name?.split(' ')[0].toUpperCase() || "OPERATOR"}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={() => navigateTo('/profile')} style={styles.avatarBtn}>
                        <LinearGradient colors={[colors.primary, colors.primary+'20']} style={styles.avatarGradient}>
                            <MaterialCommunityIcons name="account-circle" size={32} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(300).springify()} style={{ paddingHorizontal: 20 }}>
                    <GlassCard variant="featured" intensity={60} onPress={() => navigateTo('/(tabs)/nutrition')}>
                        <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start'}}>
                            <View>
                                <Text style={[styles.label, {color:colors.primary}]}>OBJECTIF NUTRITION</Text>
                                <View style={{flexDirection:'row', alignItems:'flex-end', gap:4}}>
                                    <CountUp target={Math.round(caloriesConsumed)} style={[styles.bigValue, {color: isDark ? colors.text : '#0f172a'}]} />
                                    <Text style={[styles.subValue, {color: isDark ? colors.textSecondary : '#64748b', marginBottom:6}]}>/ {Math.round(safeTarget)} kcal</Text>
                                </View>
                            </View>
                            <View style={{width:50, height:50, borderRadius:25, borderWidth:4, borderColor:colors.primary+'30', justifyContent:'center', alignItems:'center'}}>
                                <FontAwesome5 name="fire" size={20} color={colors.primary} />
                            </View>
                        </View>
                        <View style={{height:6, backgroundColor:colors.border, borderRadius:3, marginTop:15, overflow:'hidden'}}>
                            <LinearGradient 
                                colors={[colors.primary, colors.primary+'80']} 
                                start={{x:0, y:0}} end={{x:1, y:0}}
                                style={{width:`${caloriesProgress}%`, height:'100%'}} 
                            />
                        </View>
                    </GlassCard>
                </Animated.View>

                <Text style={[styles.sectionTitle, {color: isDark ? colors.textSecondary : '#94a3b8'}]}>MODULES ACTIFS</Text>

                {/* GRILLE UNIFIÉE : Tout le monde a la même structure */}
                <View style={styles.grid}>
                    <Animated.View entering={FadeInRight.delay(400)} style={styles.col}>
                        <GlassCard 
                            variant="neon" 
                            expand={true} 
                            style={{height:160, justifyContent:'space-between'}}
                            onPress={() => navigateTo('/(tabs)/workout')}
                        >
                            <View style={[styles.iconBadge, {backgroundColor: iconBg}]}>
                                <MaterialCommunityIcons name="dumbbell" size={24} color={colors.primary} />
                            </View>
                            <View>
                                <Text style={[styles.cardTitle, {color: cardTitleColor}]}>Training</Text>
                                <Text style={[styles.cardDesc, {color: cardSubColor}]} numberOfLines={2}>
                                    {workoutToday ? workoutToday.focus : "Repos"}
                                </Text>
                            </View>
                            {workoutToday && (
                                <View style={{flexDirection:'row', alignItems:'center', gap:4}}>
                                    <View style={{width:6, height:6, borderRadius:3, backgroundColor:colors.success}} />
                                    <Text style={{fontSize:10, color:colors.success, fontWeight:'bold'}}>PRÊT</Text>
                                </View>
                            )}
                        </GlassCard>
                    </Animated.View>

                    <Animated.View entering={FadeInRight.delay(500)} style={styles.col}>
                        <GlassCard 
                            variant="neon" 
                            expand={true} 
                            style={{height:160, justifyContent:'space-between'}}
                            onPress={() => navigateTo('/features/water')}
                            onLongPress={handleAddWater}
                        >
                            <View style={[styles.iconBadge, {backgroundColor: waterIconBg}]}>
                                <Ionicons name="water" size={24} color="#06b6d4" />
                            </View>
                            <View>
                                <Text style={[styles.cardTitle, {color: cardTitleColor}]}>Hydratation</Text>
                                <Text style={[styles.cardDesc, {color: cardSubColor}]}>
                                    {log?.water_ml ? `${log.water_ml} ml` : "Suivi journalier"}
                                </Text>
                            </View>
                            <View style={{alignSelf:'flex-end'}}>
                                <Ionicons name="add-circle" size={28} color="#06b6d4" />
                            </View>
                        </GlassCard>
                    </Animated.View>
                </View>

                {/* MODULES SECONDAIRES : Structure IDENTIQUE à celle du dessus */}
                <View style={[styles.grid, {marginTop:15}]}>
                    <TouchableOpacity style={styles.col} onPress={() => navigateTo('/features/sleep')}>
                        <Animated.View entering={FadeInUp.delay(600)}>
                            <GlassCard variant="neon" expand={true} style={{height:160, justifyContent:'space-between'}}>
                                {/* ✅ Retour à iconBadge (carré arrondi) pour uniformité */}
                                <View style={[styles.iconBadge, { backgroundColor: secondaryIconBg }]}>
                                    <MaterialCommunityIcons name="sleep" size={24} color={ isDark ? colors.textSecondary : '#64748b'} />
                                </View>
                                <View>
                                    <Text style={[styles.cardTitle, {color: cardTitleColor}]}>Sommeil</Text>
                                    <Text style={[styles.cardDesc, {color: cardSubColor}]}>Non connecté</Text>
                                </View>
                                <View style={{alignSelf:'flex-end'}}>
                                    <MaterialCommunityIcons name="arrow-right" size={20} color={cardSubColor} />
                                </View>
                            </GlassCard>
                        </Animated.View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.col} onPress={() => navigateTo('/features/body')}>
                        <Animated.View entering={FadeInUp.delay(700)}>
                            <GlassCard variant="neon" expand={true} style={{height:160, justifyContent:'space-between'}}>
                                {/* ✅ Retour à iconBadge (carré arrondi) pour uniformité */}
                                <View style={[styles.iconBadge, { backgroundColor: secondaryIconBg }]}>
                                    <MaterialCommunityIcons name="human" size={24} color={ isDark ? colors.textSecondary : '#64748b'} />
                                </View>
                                <View>
                                    <Text style={[styles.cardTitle, {color: cardTitleColor}]}>Corps</Text>
                                    <Text style={[styles.cardDesc, {color: cardSubColor}]}>Mensurations</Text>
                                </View>
                                <View style={{alignSelf:'flex-end'}}>
                                    <MaterialCommunityIcons name="arrow-right" size={20} color={cardSubColor} />
                                </View>
                            </GlassCard>
                        </Animated.View>
                    </TouchableOpacity>
                </View>
            </>
        )}
      </ScrollView>
      <MicroToast visible={toastVisible} message="+ 250ml d'eau ajouté" />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 60,
    marginBottom: 20
  },
  greeting: { fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  username: { fontSize: 24, fontWeight: '900', letterSpacing: 0.5 },
  avatarBtn: { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  avatarGradient: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginBottom: 8 },
  bigValue: { fontSize: 38, fontWeight: '900', letterSpacing: -1 },
  subValue: { fontSize: 14, fontWeight: '600', marginLeft: 4 },
  sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginTop: 35, marginBottom: 15, marginLeft: 25, opacity: 0.7 },
  grid: { flexDirection: 'row', gap: 20, paddingHorizontal: 20 },
  col: { flex: 1 },
  iconBadge: { width: 45, height: 45, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '800', marginTop: 10, marginBottom: 2 },
  cardDesc: { fontSize: 12, fontWeight: '500' },
  // Suppression des styles "centeredCard" et "roundIcon" car inutilisés
  toastContainer: {
      position: 'absolute',
      bottom: 40,
      alignSelf: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 30,
      elevation: 10,
      zIndex: 100,
  }
});