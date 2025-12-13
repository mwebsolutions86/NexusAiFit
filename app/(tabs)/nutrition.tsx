import React, { useState, useMemo, useEffect, memo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  RefreshControl, 
  Platform, 
  Dimensions, 
  LayoutAnimation, 
  UIManager,
  Modal 
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedProps, withTiming, withRepeat, withSequence, useAnimatedStyle } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '../../lib/theme';
import { ScreenLayout } from '../../components/ui/ScreenLayout';
import { GlassCard } from '../../components/ui/GlassCard';
import { NeonButton } from '../../components/ui/NeonButton';
import { GlassButton } from '../../components/ui/GlassButton';

// Hooks
import { useUserProfile } from '../../hooks/useUserProfile';
import { useAINutrition } from '../../hooks/useAINutrition';
import { useNutritionLog } from '../../hooks/useNutritionLog';
import { useNutritionMutations } from '../../hooks/useNutritionMutations';
import { useActivePlans } from '../../hooks/useActivePlans';
import FoodJournal from '../../app/features/food-journal'; 
import { useAlert } from '../../lib/AlertContext';

const { width } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const getTodayIndex = () => {
  const day = new Date().getDay(); 
  return (day + 6) % 7;
};

// --- 🕒 UTILITAIRE "SMART TIME" ---
const getTimeContext = () => {
    const hour = new Date().getHours();
    if (hour < 10) return { label: "PETIT DÉJEUNER", icon: "cafe-outline", keyword: "PETIT" };
    if (hour < 14) return { label: "DÉJEUNER", icon: "restaurant-outline", keyword: "DÉJEUNER" };
    if (hour < 18) return { label: "SNACK / GOÛTER", icon: "nutrition-outline", keyword: "SNACK" };
    return { label: "DÎNER", icon: "moon-outline", keyword: "DÎNER" };
};

// --- 📊 COMPOSANT JAUGE CIRCULAIRE ---
const CircularProgress = ({ value, total, size = 80, strokeWidth = 8, color, label, delay = 0 }: any) => {
    const { colors, isDark } = useTheme();
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progress = useSharedValue(0);
    
    const safeTotal = total || 1;
    const percentage = Math.min(value / safeTotal, 1);

    useEffect(() => {
        progress.value = withTiming(percentage, { duration: 1500 });
    }, [percentage]);

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: circumference * (1 - progress.value),
    }));

    return (
        <Animated.View entering={FadeInUp.delay(delay).springify()} style={{ alignItems: 'center', gap: 8 }}>
            <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
                <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <Circle
                        cx={size / 2} cy={size / 2} r={radius}
                        stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}
                        strokeWidth={strokeWidth}
                    />
                    <AnimatedCircle
                        cx={size / 2} cy={size / 2} r={radius}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${circumference} ${circumference}`}
                        animatedProps={animatedProps}
                        strokeLinecap="round"
                        rotation="-90"
                        origin={`${size / 2}, ${size / 2}`}
                    />
                </Svg>
                <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                    <FontAwesome5 name={label === "KCAL" ? "fire" : "dna"} size={16} color={color} style={{opacity:0.9}} />
                </View>
            </View>
            <View style={{alignItems:'center'}}>
                <Text style={{ fontSize: 16, fontWeight: '900', color: isDark ? colors.text : '#0f172a' }}>
                    {Math.round(value)}
                    <Text style={{ fontSize: 10, color: isDark ? colors.textSecondary : '#94a3b8', fontWeight:'600' }}>/{Math.round(safeTotal)}</Text>
                </Text>
                <Text style={{ fontSize: 9, fontWeight: 'bold', color: isDark ? colors.textSecondary : '#64748b', letterSpacing: 0.5 }}>{label}</Text>
            </View>
        </Animated.View>
    );
};

// --- 🛡️ MEMOIZED HUD COMPONENT (LE FIX ANTI-FREEZE) ---
// On isole la carte lourde (Glass + Animations) pour qu'elle ne re-render pas si les chiffres ne changent pas
// --- DÉFINITION DU TYPE DES PROPS ---
interface DailySummaryHUDProps {
  cals: number;
  prot: number;
  target: number;
  isDark: boolean;
  colors: any; // On met 'any' pour éviter des erreurs complexes avec votre thème
}

// --- LE COMPOSANT CORRIGÉ POUR TYPESCRIPT ---
const DailySummaryHUD = memo(({ cals, prot, target, isDark, colors }: DailySummaryHUDProps) => {
  return (
    <GlassCard 
      style={[styles.hudCard, { backgroundColor: isDark ? 'rgba(20,20,30,0.6)' : '#FFFFFF' }]} 
      intensity={isDark ? 30 : 50}
    >
      <View style={styles.hudRow}>
        <CircularProgress 
          value={cals} total={target} label="KCAL" color={colors.warning} 
          delay={100} size={90} strokeWidth={10} 
        />
        <View style={[styles.verticalDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0' }]} />
        <CircularProgress 
          value={prot} total={180} label="PROT" color={colors.primary} 
          delay={200} size={90} strokeWidth={10} 
        />
      </View>
    </GlassCard>
  );
}, (prev: DailySummaryHUDProps, next: DailySummaryHUDProps) => {
  // TypeScript sait maintenant que 'prev' et 'next' contiennent 'cals', 'prot', etc.
  return (
    prev.cals === next.cals &&
    prev.prot === next.prot &&
    prev.target === next.target &&
    prev.isDark === next.isDark
  );
});


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

const NutritionSkeleton = () => (
    <View style={{ padding: 20, gap: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <SkeletonItem width={120} height={24} />
            <SkeletonItem width={40} height={40} borderRadius={20} />
        </View>
        <GlassCard style={{ height: 160, padding: 20 }}>
             <View style={{flexDirection:'row', justifyContent:'space-around', alignItems:'center', width:'100%'}}>
                <SkeletonItem width={80} height={80} borderRadius={40} />
                <SkeletonItem width={80} height={80} borderRadius={40} />
             </View>
        </GlassCard>
        <View style={{ gap: 15 }}>
            <SkeletonItem width={150} height={16} />
            <SkeletonItem width="100%" height={100} borderRadius={20} />
            <SkeletonItem width="100%" height={100} borderRadius={20} />
        </View>
    </View>
);

export default function NutritionScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { showAlert } = useAlert();
  
  const today = new Date().toISOString().split('T')[0];
  const [preferences, setPreferences] = useState('');
  
  const { userProfile } = useUserProfile();
  const { generateNutrition, isGenerating } = useAINutrition();
  const { data: log, isLoading: isLogLoading, refetch } = useNutritionLog(today);
  const { toggleItem } = useNutritionMutations(today);
  const { data: plans, isLoading: isPlansLoading } = useActivePlans(userProfile?.id);

  const activePlanData = plans?.mealPlan;
  const todayIndex = getTodayIndex();
  const [activeTab, setActiveTab] = useState(todayIndex);
  const [showJournal, setShowJournal] = useState(false);
  
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  
  // ✅ FIX 1: Memoize le timeContext pour éviter de recréer l'objet à chaque render
  const timeContext = useMemo(() => getTimeContext(), []);

  const consumedMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    if (log?.meals_status && Array.isArray(log.meals_status)) {
        log.meals_status.forEach((item: any) => {
            map[`${item.mealName}_${item.name}`] = true;
        });
    }
    return map;
  }, [log]);

  // ✅ FIX 2: Memoize les stats pour éviter les boucles infinies de rendu
  const dailyStats = useMemo(() => ({
      cals: log?.total_calories || 0,
      prot: log?.total_protein || 0
  }), [log?.total_calories, log?.total_protein]);

  const dayTarget = useMemo(() => {
      const content = (activePlanData?.content || activePlanData) as any;
      if (!content || !content.days || !Array.isArray(content.days)) return 2500;

      const safeIndex = activeTab % content.days.length;
      const day = content.days[safeIndex];
      let total = 0;
      day?.meals?.forEach((m: any) => m?.items?.forEach((i: any) => {
          const cals = parseInt(i.calories, 10);
          if (!isNaN(cals)) total += cals;
      }));
      return total > 0 ? total : 2500;
  }, [activePlanData, activeTab]);

  const journalCount = (log?.meals_status && Array.isArray(log.meals_status)) ? log.meals_status.length : 0;

  const handleGenerate = async () => {
      if (!userProfile) return;
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      try {
          const context = preferences.trim() || `Objectif: ${userProfile.goal}`;
          await generateNutrition({ userProfile, preferences: context });
          setPreferences('');
      } catch (e: any) {
          showAlert({ title: "Erreur IA", message: e.message, type: "error" });
      }
  };

  const onRefresh = () => {
      if (Platform.OS !== 'web') Haptics.selectionAsync();
      refetch();
  };

  const handleMealPress = (item: any, mealName: string, isEditable: boolean) => {
      if (item.preparation || (item.ingredients && Array.isArray(item.ingredients))) {
          if (Platform.OS !== 'web') Haptics.selectionAsync();
          setSelectedRecipe({ ...item, mealName }); 
          return;
      }

      if (!isEditable) {
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          return;
      }

      const isTimeMatching = mealName.toUpperCase().includes(timeContext.keyword);
      
      const executeToggle = () => {
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          toggleItem.mutate({ item, mealName: mealName, currentLog: log || null });
      };

      if (!isTimeMatching) {
          showAlert({
              title: "Déjà mangé ?",
              message: `Ce repas (${mealName}) ne correspond pas à l'heure actuelle (${timeContext.label}). Voulez-vous le noter maintenant ?`,
              type: "warning",
              buttons: [
                  { text: "Attendre", style: "cancel" },
                  { 
                      text: "Oui, noter", 
                      onPress: executeToggle 
                  }
              ]
          });
      } else {
          executeToggle();
      }
  };

  const toggleJournalDrawer = () => {
      if (Platform.OS !== 'web') Haptics.selectionAsync();
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setShowJournal(!showJournal);
  };

  const renderGenerator = () => (
    <View style={[styles.generatorWrapper, { 
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0' 
    }]}>
        <MaterialCommunityIcons name="chef-hat" size={40} color={colors.success} style={{marginBottom: 15}} />
        <Text style={[styles.title, {color: isDark ? colors.text : '#0f172a'}]}>CHEF TACTIQUE IA</Text>
        <Text style={[styles.desc, {color: isDark ? colors.textSecondary : '#64748b'}]}>
            Générez un plan nutritionnel calibré pour vos objectifs.
        </Text>
        <TextInput 
            style={[styles.input, { 
                backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc', 
                borderColor: isDark ? colors.border : '#cbd5e1', 
                color: isDark ? colors.text : '#0f172a' 
            }]}
            placeholder="Ex: Végétarien, High Prot, Budget étudiant..."
            placeholderTextColor={isDark ? colors.textSecondary : '#94a3b8'}
            value={preferences}
            onChangeText={setPreferences}
        />
        <NeonButton 
            label="GÉNÉRER LE PLAN" onPress={handleGenerate} loading={isGenerating} icon="flash"
            style={{ backgroundColor: isDark ? undefined : colors.success, borderColor: isDark ? undefined : colors.success }}
        />
    </View>
  );

  const renderPlan = () => {
      const content = (activePlanData?.content || activePlanData) as any;
      if (!content?.days) return renderGenerator();

      const safeIndex = activeTab % content.days.length;
      const day = content.days[safeIndex];
      const isEditable = activeTab === todayIndex;

      const activeColor = colors.success;
      const inactiveText = isDark ? colors.textSecondary : '#64748b';

      return (
          <View>
              <View style={styles.planHeader}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 8, paddingRight: 20}}>
                      {content.days.map((d: any, i: number) => {
                          const isActive = activeTab === i;
                          const isToday = i === todayIndex;
                          return (
                            <TouchableOpacity 
                                key={i}
                                onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); setActiveTab(i); }}
                                style={[
                                    styles.dayTab, 
                                    { 
                                        backgroundColor: isActive ? activeColor : 'transparent',
                                        borderColor: isActive ? activeColor : (isToday ? colors.primary : (isDark ? colors.border : '#cbd5e1')),
                                        borderWidth: 1
                                    }
                                ]}
                            >
                                <Text style={{color: isActive ? '#FFF' : inactiveText, fontWeight:'bold', fontSize:11}}>
                                    {d.day ? d.day.slice(0,3).toUpperCase() : `J${i+1}`}
                                </Text>
                            </TouchableOpacity>
                          )
                      })}
                  </ScrollView>
                  <GlassButton 
                    icon="refresh" 
                    onPress={() => { 
                        showAlert({
                            title: "Nouveau Menu ?",
                            message: "Générer un nouveau plan remplacera l'actuel.",
                            type: "warning",
                            buttons: [
                                {text:"Annuler", style:"cancel"}, 
                                {text:"Générer", onPress: handleGenerate}
                            ]
                        });
                    }} 
                    size={20} 
                  />
              </View>

              {!isEditable && (
                  <View style={[styles.banner, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }]}>
                      <Ionicons name="eye" size={12} color={inactiveText} />
                      <Text style={{color: inactiveText, fontSize: 10, fontWeight:'bold', marginLeft: 6}}>LECTURE SEULE</Text>
                  </View>
              )}

              <View style={{ gap: 16, paddingHorizontal: 20 }}>
                  {day.meals && day.meals.map((meal: any, idx: number) => {
                      const mealCals = meal.items ? meal.items.reduce((acc: number, i: any) => acc + (parseInt(i.calories, 10) || 0), 0) : 0;
                      const isContextual = isEditable && activeTab === todayIndex && meal.name.toUpperCase().includes(timeContext.keyword);

                      return (
                          <Animated.View key={idx} entering={FadeInDown.delay(idx * 100).springify()}>
                            <View style={[
                                styles.mealCard,
                                { 
                                    backgroundColor: isDark ? 'rgba(30,30,40,0.6)' : '#FFFFFF',
                                    borderColor: isContextual ? colors.primary : (isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'),
                                    borderWidth: isContextual ? 1.5 : 1,
                                    shadowOpacity: isDark ? 0 : 0.05,
                                }
                            ]}>
                                <View style={[styles.mealHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }]}>
                                    <View style={{flexDirection:'row', alignItems:'center', gap: 8}}>
                                        {isContextual && <View style={{width:6, height:6, borderRadius:3, backgroundColor: colors.primary}} />}
                                        <Text style={[styles.mealTitle, { color: isContextual ? colors.primary : (isDark ? colors.text : '#0f172a') }]}>
                                            {meal.name.toUpperCase()}
                                        </Text>
                                    </View>
                                    <Text style={{ color: inactiveText, fontSize: 10, fontWeight: 'bold' }}>{mealCals} kcal</Text>
                                </View>

                                <View style={{ padding: 16, paddingTop: 8 }}>
                                    {meal.items && meal.items.map((item: any, i: number) => {
                                        const key = `${meal.name}_${item.name}`;
                                        const isChecked = !!consumedMap[key];
                                        const hasRecipe = item.preparation || (item.ingredients && item.ingredients.length > 0);

                                        return (
                                            <TouchableOpacity 
                                                key={i}
                                                style={[styles.foodRow, { borderBottomWidth: i === meal.items.length - 1 ? 0 : 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }]}
                                                onPress={() => handleMealPress(item, meal.name, isEditable)}
                                                activeOpacity={0.7}
                                            >
                                                <View style={{ flex: 1 }}>
                                                    <View style={{flexDirection:'row', alignItems:'center', gap: 6}}>
                                                        <Text style={[styles.foodName, { 
                                                            color: isDark ? colors.text : '#334155', 
                                                            textDecorationLine: isChecked ? 'line-through' : 'none', 
                                                            opacity: isChecked ? 0.5 : 1 
                                                        }]}>
                                                            {item.name}
                                                        </Text>
                                                        {hasRecipe && <Ionicons name="restaurant" size={12} color={colors.primary} style={{opacity:0.8}} />}
                                                    </View>
                                                    
                                                    <Text style={{ fontSize: 10, color: inactiveText }}>
                                                        {item.calories} kcal • {item.protein}g prot
                                                    </Text>
                                                </View>

                                                <View style={[styles.checkbox, { 
                                                    borderColor: isChecked ? colors.success : (isDark ? 'rgba(255,255,255,0.2)' : '#cbd5e1'),
                                                    backgroundColor: isChecked ? colors.success : 'transparent',
                                                }]}>
                                                    {isChecked && <Ionicons name="checkmark" size={12} color="#FFF" />}
                                                </View>
                                            </TouchableOpacity>
                                        )
                                    })}
                                </View>
                            </View>
                          </Animated.View>
                      )
                  })}
              </View>
          </View>
      );
  };

  return (
    <ScreenLayout>
        <Image source={require('../../assets/adaptive-icon.png')} style={[StyleSheet.absoluteFillObject, { opacity: isDark ? 0.05 : 0.02, transform: [{scale: 1.5}] }]} blurRadius={50} contentFit="cover" />
        <LinearGradient colors={isDark ? [colors.primary, 'transparent'] : ['#bfdbfe', 'transparent']} style={{position:'absolute', top:0, left:0, right:0, height:250, opacity: isDark ? 0.1 : 0.25}} />

        <View style={styles.header}>
            <View>
                <Text style={[styles.headerTitle, { color: isDark ? colors.text : '#0f172a' }]}>CARBURANT</Text>
                <View style={{flexDirection:'row', alignItems:'center', gap: 6}}>
                    <Ionicons name={timeContext.icon as any} size={12} color={colors.primary} />
                    <Text style={[styles.headerSub, { color: colors.primary }]}>{timeContext.label}</Text>
                </View>
            </View>
            <TouchableOpacity onPress={() => router.push('/features/shopping' as any)} style={styles.cartBtn}>
                <MaterialCommunityIcons name="cart-outline" size={22} color={isDark ? colors.text : '#334155'} />
            </TouchableOpacity>
        </View>

        <ScrollView 
            contentContainerStyle={{ paddingBottom: 120 }}
            refreshControl={<RefreshControl refreshing={isPlansLoading || isLogLoading} onRefresh={onRefresh} tintColor={colors.primary} />}
            showsVerticalScrollIndicator={false}
        >
            {isPlansLoading ? (
                <Animated.View entering={FadeInUp}><NutritionSkeleton /></Animated.View>
            ) : (
                <>
                    {/* ✅ UTILISATION DU HUD MEMOIZÉ */}
                    {activeTab === todayIndex && (
                       <DailySummaryHUD 
                          cals={dailyStats.cals} 
                          prot={dailyStats.prot} 
                          target={dayTarget} 
                          isDark={isDark} 
                          colors={colors} 
                       />
                    )}

                    <View style={{ marginTop: 10 }}>
                        {activePlanData ? renderPlan() : renderGenerator()}
                    </View>

                    {activeTab === todayIndex && (
                        <View style={{ paddingHorizontal: 20, marginTop: 25 }}>
                              <TouchableOpacity onPress={toggleJournalDrawer} activeOpacity={0.8} style={{ marginBottom: 10 }}>
                                <View style={[styles.drawerHeader, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0', backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc' }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <MaterialCommunityIcons name="history" size={18} color={isDark ? colors.textSecondary : '#64748b'} />
                                        <Text style={[styles.sectionTitle, { color: isDark ? colors.textSecondary : '#64748b' }]}>
                                            JOURNAL ({journalCount})
                                        </Text>
                                    </View>
                                    <Ionicons name={showJournal ? "chevron-up" : "chevron-down"} size={18} color={isDark ? colors.textSecondary : '#94a3b8'} />
                                </View>
                              </TouchableOpacity>

                              {showJournal && (
                                  <Animated.View entering={FadeInDown} style={{ marginTop: 5 }}>
                                      <FoodJournal date={today} />
                                  </Animated.View>
                              )}
                        </View>
                    )}
                </>
            )}
        </ScrollView>

        {/* --- 🔥 MODALE RECETTE --- */}
        <Modal visible={!!selectedRecipe} transparent animationType="slide" onRequestClose={() => setSelectedRecipe(null)}>
            <View style={{flex:1, backgroundColor:'rgba(0,0,0,0.8)', justifyContent:'flex-end'}}>
                <GlassCard style={{height:'85%', borderTopLeftRadius:30, borderTopRightRadius:30, padding:0}} intensity={95}>
                    <ScrollView contentContainerStyle={{padding:25, paddingBottom: 50}}>
                        {/* EN-TÊTE */}
                        <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                            <Text style={{fontSize:22, fontWeight:'900', color: isDark ? '#fff' : '#000', flex:1, marginRight:10}}>
                                {selectedRecipe?.name}
                            </Text>
                            <TouchableOpacity onPress={() => setSelectedRecipe(null)} style={{padding:5}}>
                                <Ionicons name="close-circle" size={30} color={isDark ? colors.textSecondary : '#64748b'} />
                            </TouchableOpacity>
                        </View>

                        {/* MACROS BADGES */}
                        <View style={{flexDirection:'row', gap:15, marginBottom:25}}>
                            <View style={{backgroundColor:colors.primary+'15', padding:12, borderRadius:16, flex:1, alignItems:'center', flexDirection:'row', justifyContent:'center', gap:8}}>
                                <FontAwesome5 name="fire" size={14} color={colors.primary} />
                                <Text style={{fontWeight:'900', color:colors.primary}}>{selectedRecipe?.calories} Kcal</Text>
                            </View>
                            <View style={{backgroundColor:colors.success+'15', padding:12, borderRadius:16, flex:1, alignItems:'center', flexDirection:'row', justifyContent:'center', gap:8}}>
                                <FontAwesome5 name="dna" size={14} color={colors.success} />
                                <Text style={{fontWeight:'900', color:colors.success}}>{selectedRecipe?.protein}g Prot</Text>
                            </View>
                        </View>

                        {/* INGRÉDIENTS */}
                        <Text style={{fontSize:14, fontWeight:'900', color: isDark ? '#fff' : '#000', marginBottom:12, letterSpacing:1}}>
                            🛒 INGRÉDIENTS
                        </Text>
                        <View style={{backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc', padding:15, borderRadius:16, marginBottom:25}}>
                            {selectedRecipe?.ingredients?.map((ing: string, i: number) => (
                                <View key={i} style={{flexDirection:'row', marginBottom:10, alignItems:'flex-start'}}>
                                    <View style={{width:6, height:6, borderRadius:3, backgroundColor:colors.primary, marginTop:7, marginRight:10}} />
                                    <Text style={{color: isDark ? '#e2e8f0' : '#334155', fontSize:15, flex:1, lineHeight:22}}>{ing}</Text>
                                </View>
                            )) || <Text style={{color:colors.textSecondary}}>Aucun ingrédient listé</Text>}
                        </View>

                        {/* PRÉPARATION */}
                        <Text style={{fontSize:14, fontWeight:'900', color: isDark ? '#fff' : '#000', marginBottom:12, letterSpacing:1}}>
                            👨‍🍳 PRÉPARATION
                        </Text>
                        <View style={{backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc', padding:20, borderRadius:16, marginBottom:25}}>
                            <Text style={{color: isDark ? '#e2e8f0' : '#334155', lineHeight:26, fontSize:15}}>
                                {selectedRecipe?.preparation || "Aucune instruction disponible."}
                            </Text>
                        </View>

                        <View style={{height:20}}/>
                        
                        {/* BOUTON VALIDATION AVEC PROTECTION HORAIRE */}
                        {activeTab === todayIndex && (
                            <NeonButton 
                                label="J'AI MANGÉ CE REPAS"
                                icon="check"
                                onPress={() => {
                                    const mealName = selectedRecipe.mealName || "Manuel";
                                    const isTimeMatching = mealName.toUpperCase().includes(timeContext.keyword);
                                    
                                    const execute = () => {
                                        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                        toggleItem.mutate({ item: selectedRecipe, mealName, currentLog: log || null });
                                        setSelectedRecipe(null);
                                    };

                                    if (!isTimeMatching) {
                                         showAlert({
                                            title: "Déjà mangé ?",
                                            message: `Ce repas (${mealName}) ne semble pas correspondre à l'heure actuelle (${timeContext.label}).`,
                                            type: "warning",
                                            buttons: [
                                                { text: "Annuler", style: "cancel" },
                                                { text: "Confirmer", onPress: execute }
                                            ]
                                        });
                                    } else {
                                        execute();
                                    }
                                }}
                                style={{backgroundColor: colors.success}}
                            />
                        )}
                    </ScrollView>
                </GlassCard>
            </View>
        </Modal>

    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingTop: 20, paddingBottom: 15 },
  headerTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5, fontStyle: 'italic' },
  headerSub: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 2 },
  cartBtn: { padding: 10, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 20 },
  
  hudCard: { marginHorizontal: 20, marginBottom: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  hudRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 10 },
  verticalDivider: { width: 1, height: 50, borderRadius: 1 },

  generatorWrapper: { alignItems: 'center', padding: 30, margin: 20, borderRadius: 24, borderWidth: 1, borderStyle: 'dashed' },
  title: { fontSize: 18, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
  desc: { textAlign: 'center', marginBottom: 20, fontSize: 13, lineHeight: 18 },
  input: { width: '100%', borderRadius: 12, borderWidth: 1, padding: 15, minHeight: 80, textAlignVertical: 'top', marginBottom: 20 },

  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  dayTab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, marginRight: 6 },
  banner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 6, marginHorizontal: 20, marginBottom: 15, borderRadius: 8 },

  mealCard: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, marginBottom: 0 },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  mealTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  
  foodRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  foodName: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginLeft: 15 },
  
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
});