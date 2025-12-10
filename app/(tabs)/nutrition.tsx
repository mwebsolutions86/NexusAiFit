import React, { useState, useMemo, useEffect } from 'react';
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
  Alert, 
  LayoutAnimation, 
  UIManager 
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

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
import { useActivePlans } from '../../hooks/useActivePlans'; // ✅ IMPORT CRUCIAL
import FoodJournal from '../../app/features/food-journal'; 

const { width } = Dimensions.get('window');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const getTodayIndex = () => {
  const day = new Date().getDay(); 
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

const NutritionSkeleton = () => (
    <View style={{ padding: 20, gap: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
            <View style={{ gap: 8 }}>
                <SkeletonItem width={120} height={20} />
                <SkeletonItem width={80} height={12} />
            </View>
            <SkeletonItem width={40} height={40} borderRadius={20} />
        </View>
        <GlassCard style={{ height: 200, padding: 20 }}><View /></GlassCard>
        <View style={{ flexDirection: 'row', gap: 10 }}>
            <SkeletonItem width={100} height={30} borderRadius={16} />
            <SkeletonItem width={100} height={30} borderRadius={16} />
        </View>
        <View style={{ gap: 10 }}>
            <SkeletonItem width="100%" height={80} borderRadius={16} />
            <SkeletonItem width="100%" height={80} borderRadius={16} />
        </View>
    </View>
);

// --- COMPOSANTS UI ---

const MacroBar = ({ label, value, total, color, delay = 0 }: any) => {
  const { colors, isDark } = useTheme();
  const width = useSharedValue(0);
  const safeTotal = total || 1; 
  const percent = Math.min((value / safeTotal) * 100, 100);

  React.useEffect(() => {
    width.value = withTiming(percent, { duration: 1000 });
  }, [percent]);

  const animatedStyle = useAnimatedStyle(() => ({ width: `${width.value}%` }));

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={styles.macroContainer}>
      <View style={styles.macroHeader}>
        <Text style={[styles.macroLabel, { color: isDark ? colors.textSecondary : '#64748b' }]}>{label}</Text>
        <Text style={[styles.macroValue, { color: isDark ? colors.text : '#0f172a' }]}>
            {Math.round(value)}g <Text style={{fontSize:10, color: isDark ? colors.textSecondary : '#94a3b8'}}>/ {Math.round(safeTotal)}g</Text>
        </Text>
      </View>
      <View style={[styles.macroTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0' }]}>
        <Animated.View style={[styles.macroFill, { backgroundColor: color }, animatedStyle]} />
      </View>
    </Animated.View>
  );
};

export default function NutritionScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  
  const today = new Date().toISOString().split('T')[0];
  const [preferences, setPreferences] = useState('');
  
  const { userProfile } = useUserProfile();
  const { generateNutrition, isGenerating } = useAINutrition();
  const { data: log, isLoading: isLogLoading, refetch } = useNutritionLog(today);
  const { toggleItem } = useNutritionMutations(today);
  
  // ✅ LE FIX EST ICI : On récupère le plan actif depuis la DB
  const { data: plans, isLoading: isPlansLoading } = useActivePlans(userProfile?.id);

  // On fusionne : soit le plan en DB, soit celui qu'on vient de générer (si pas encore en DB)
  // Mais en priorité celui de la DB pour la persistance
  const activePlanData = plans?.mealPlan;

  const todayIndex = getTodayIndex();
  const [activeTab, setActiveTab] = useState(todayIndex);
  const [showJournal, setShowJournal] = useState(false);

  // --- CALCULS ---

  const consumedMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    if (log?.meals_status) {
        log.meals_status.forEach((item: any) => {
            map[`${item.mealName}_${item.name}`] = true;
        });
    }
    return map;
  }, [log]);

  const dailyStats = {
      cals: log?.total_calories || 0,
      prot: log?.total_protein || 0
  };

  const dayTarget = useMemo(() => {
      // ✅ Utilisation de activePlanData (DB)
      const content = (activePlanData?.content || activePlanData) as any;
      
      if (!content || !content.days || !Array.isArray(content.days)) return 2500;

      const safeIndex = activeTab % content.days.length;
      const day = content.days[safeIndex];
      
      let total = 0;
      if (day && day.meals) {
        day.meals.forEach((m: any) => {
            if (m.items && Array.isArray(m.items)) {
                m.items.forEach((i: any) => {
                    const cals = parseInt(i.calories, 10);
                    if (!isNaN(cals)) total += cals;
                });
            }
        });
      }
      return total > 0 ? total : 2500;
  }, [activePlanData, activeTab]);

  const journalCount = log?.meals_status ? log.meals_status.length : 0;

  // --- HANDLERS ---

  const handleGenerate = async () => {
      if (!userProfile) return;
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      try {
          const context = preferences.trim() || `Objectif: ${userProfile.goal}`;
          await generateNutrition({ userProfile, preferences: context });
          setPreferences('');
      } catch (e: any) {
          if (e.message.includes("QUOTA_EXCEEDED")) {
            Alert.alert(
                "Limite Atteinte 🔒",
                "Quota de génération hebdomadaire atteint.\nPassez ELITE pour débloquer 7 plans/semaine.",
                [
                    { text: "Annuler", style: "cancel" },
                    { text: "Devenir Elite", onPress: () => router.push('/subscription' as any) }
                ]
            );
          } else {
            Alert.alert("Erreur", e.message);
          }
      }
  };

  const onRefresh = () => {
      if (Platform.OS !== 'web') Haptics.selectionAsync();
      refetch();
  };

  const handleMealPress = (item: any, mealName: string, isEditable: boolean) => {
      if (!isEditable) {
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          Alert.alert("Mode Consultation", "Vous ne pouvez valider que les repas d'aujourd'hui.");
          return;
      }
      toggleItem.mutate({ 
          item, 
          mealName: mealName, 
          currentLog: log || null
      });
  };

  const toggleJournalDrawer = () => {
      if (Platform.OS !== 'web') Haptics.selectionAsync();
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setShowJournal(!showJournal);
  };

  // --- RENDERERS ---

  const renderGenerator = () => (
    <View 
        style={[
            styles.generatorWrapper, 
            { 
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
                // Nettoyage Light Mode
                shadowColor: "#000",
                shadowOpacity: isDark ? 0 : 0.05,
                shadowRadius: 10,
                elevation: isDark ? 0 : 2
            }
        ]}
    >
        <MaterialCommunityIcons name="food-apple" size={48} color={colors.success} style={{marginBottom: 15}} />
        <Text style={[styles.title, {color: isDark ? colors.text : '#0f172a'}]}>GÉNÉRATEUR IA</Text>
        <Text style={[styles.desc, {color: isDark ? colors.textSecondary : '#64748b'}]}>Créez votre plan nutritionnel tactique sur mesure.</Text>
        
        <View style={styles.inputContainer}>
            <Text style={[styles.label, {color: colors.success}]}>PRÉFÉRENCES (Optionnel)</Text>
            <TextInput 
                style={[
                    styles.input, 
                    { 
                        backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc', 
                        borderColor: isDark ? colors.border : '#cbd5e1', 
                        color: isDark ? colors.text : '#0f172a' 
                    }
                ]}
                placeholder="Ex: Keto, Jeûne intermittent, Vegan..."
                placeholderTextColor={isDark ? colors.textSecondary : '#94a3b8'}
                value={preferences}
                onChangeText={setPreferences}
                multiline
            />
        </View>
        
        <NeonButton 
            label="INITIALISER LE PLAN" 
            onPress={handleGenerate} 
            loading={isGenerating} 
            icon="brain"
            style={{
                backgroundColor: isDark ? undefined : colors.success,
                borderColor: isDark ? undefined : colors.success
            }}
        />
    </View>
  );

  const renderPlan = () => {
      const content = (activePlanData?.content || activePlanData) as any;
      
      if (!content?.days) return renderGenerator();

      const safeIndex = activeTab % content.days.length;
      const day = content.days[safeIndex];
      const isEditable = activeTab === todayIndex;

      // Couleurs Light Mode Clean
      const tabBgActive = colors.success;
      const tabBgInactive = 'transparent';
      const tabTextActive = '#FFFFFF'; // Blanc sur vert, très lisible
      const tabTextInactive = isDark ? colors.textSecondary : '#64748b';
      const mealCardBg = isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF';
      const mealCardBorder = isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0';

      return (
          <View>
              {/* Header avec Bouton Regen */}
              <View style={styles.planHeader}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 8, paddingRight: 20}}>
                      {content.days.map((d: any, i: number) => {
                          const isActive = activeTab === i;
                          const isTodayTab = i === todayIndex;
                          return (
                            <TouchableOpacity 
                                key={i}
                                onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); setActiveTab(i); }}
                                style={[
                                    styles.dayTab, 
                                    { 
                                        backgroundColor: isActive ? tabBgActive : tabBgInactive,
                                        borderColor: isActive ? tabBgActive : (isTodayTab ? colors.primary : (isDark ? colors.border : '#cbd5e1')),
                                        borderWidth: 1
                                    }
                                ]}
                            >
                                <View style={{flexDirection:'row', alignItems:'center', gap: 4}}>
                                    <Text style={{color: isActive ? tabTextActive : tabTextInactive, fontWeight:'bold', fontSize:12}}>
                                        {d.day ? d.day.slice(0,3).toUpperCase() : `J${i+1}`}
                                    </Text>
                                    {isTodayTab && !isActive && <View style={{width:4, height:4, borderRadius:2, backgroundColor: colors.primary}} />}
                                </View>
                            </TouchableOpacity>
                          )
                      })}
                  </ScrollView>
                  
                  <GlassButton 
                    icon="refresh" 
                    onPress={() => { 
                        Alert.alert("Nouveau Menu ?", "Générer un nouveau plan remplacera l'actuel.", [{text:"Annuler"}, {text:"Générer", onPress: handleGenerate}]);
                    }} 
                    size={20} 
                  />
              </View>

              {!isEditable && (
                  <View style={[styles.readOnlyBanner, { backgroundColor: isDark ? colors.textSecondary + '20' : '#f1f5f9', marginHorizontal: 20 }]}>
                      <Ionicons name="eye-outline" size={14} color={isDark ? colors.textSecondary : '#64748b'} />
                      <Text style={{color: isDark ? colors.textSecondary : '#64748b', fontSize: 10, marginLeft: 5}}>MODE LECTURE SEULE</Text>
                  </View>
              )}

              {/* CARROUSEL REPAS */}
              <View style={{ marginBottom: 10 }}>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, gap: 15 }}
                    decelerationRate="fast"
                    snapToInterval={width * 0.85 + 15}
                  >
                      {day.meals && day.meals.map((meal: any, idx: number) => {
                          const mealCals = meal.items ? meal.items.reduce((acc: number, i: any) => acc + (parseInt(i.calories, 10) || 0), 0) : 0;

                          return (
                              <View 
                                key={idx} 
                                style={[
                                    styles.mealCardContainer,
                                    { 
                                        width: width * 0.85,
                                        backgroundColor: mealCardBg,
                                        borderColor: mealCardBorder,
                                        shadowColor: "#000",
                                        shadowOpacity: isDark ? 0 : 0.05,
                                        shadowRadius: 8,
                                        elevation: isDark ? 0 : 2
                                    }
                                ]}
                              >
                                  <View style={[
                                      styles.mealHeader, 
                                      { 
                                          backgroundColor: isDark ? colors.primary + '15' : '#f0f9ff', 
                                          borderColor: isDark ? colors.primary + '30' : 'transparent' 
                                      }
                                  ]}>
                                      <Text style={[styles.mealTitle, { color: isDark ? colors.text : '#0f172a' }]}>{meal.name.toUpperCase()}</Text>
                                      <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 10 }}>{mealCals} KCAL</Text>
                                  </View>

                                  <View style={{ padding: 15, paddingTop: 5 }}>
                                      {meal.items && meal.items.map((item: any, i: number) => {
                                          const key = `${meal.name}_${item.name}`;
                                          const isChecked = !!consumedMap[key];
                                          
                                          return (
                                              <TouchableOpacity 
                                                  key={i}
                                                  style={[styles.foodRow, { borderBottomColor: isDark ? colors.border : '#f1f5f9', borderBottomWidth: i === meal.items.length - 1 ? 0 : 1 }]}
                                                  onPress={() => handleMealPress(item, meal.name, isEditable)}
                                                  activeOpacity={0.7}
                                              >
                                                  <View style={{ flex: 1 }}>
                                                      <Text style={[styles.foodName, { color: isDark ? colors.text : '#334155', textDecorationLine: isChecked ? 'line-through' : 'none', opacity: isChecked ? 0.6 : 1 }]}>
                                                          {item.name}
                                                      </Text>
                                                      <Text style={{ fontSize: 10, color: isDark ? colors.textSecondary : '#94a3b8' }}>
                                                          {item.calories} kcal • {item.protein}g prot {item.notes ? `• ${item.notes}` : ''}
                                                      </Text>
                                                  </View>

                                                  <View style={[styles.checkbox, { 
                                                      borderColor: isChecked ? colors.success : (isEditable ? (isDark ? colors.border : '#cbd5e1') : colors.textSecondary),
                                                      backgroundColor: isChecked ? colors.success : 'transparent',
                                                      opacity: isEditable ? 1 : 0.5
                                                  }]}>
                                                      {isChecked && <Ionicons name="checkmark" size={12} color="#FFF" />}
                                                      {!isChecked && !isEditable && <Ionicons name="lock-closed" size={10} color={colors.textSecondary} />}
                                                  </View>
                                              </TouchableOpacity>
                                          )
                                      })}
                                  </View>
                              </View>
                          )
                      })}
                  </ScrollView>
                  
                  {day.meals && day.meals.length > 1 && (
                      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: -10, opacity: 0.6 }}>
                          <Text style={{ color: isDark ? colors.textSecondary : '#94a3b8', fontSize: 10, marginRight: 5 }}>GLISSER POUR VOIR</Text>
                          <Ionicons name="arrow-forward" size={12} color={isDark ? colors.textSecondary : '#94a3b8'} />
                      </View>
                  )}
              </View>
          </View>
      );
  };

  return (
    <ScreenLayout>
        {/* Fond adaptatif */}
        <Image 
            source={require('../../assets/adaptive-icon.png')} 
            style={[StyleSheet.absoluteFillObject, { opacity: isDark ? 0.05 : 0.02, transform: [{scale: 1.5}] }]}
            blurRadius={40}
            contentFit="cover"
        />
        {/* Gradient pour donner de la profondeur */}
        <LinearGradient 
            colors={isDark ? [colors.primary, 'transparent'] : ['#bfdbfe', 'transparent']} 
            style={{position:'absolute', top:0, left:0, right:0, height:200, opacity: isDark ? 0.1 : 0.2}} 
        />

        <View style={styles.header}>
            <View>
                <Text style={[styles.headerTitle, { color: isDark ? colors.text : '#0f172a' }]}>CARBURANT</Text>
                <Text style={[styles.headerDate, { color: colors.primary }]}>
                    {activeTab === todayIndex ? "AUJOURD'HUI" : `JOUR ${activeTab + 1}`}
                </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/features/shopping' as any)}>
                <MaterialCommunityIcons name="cart-outline" size={24} color={isDark ? colors.text : '#334155'} />
            </TouchableOpacity>
        </View>

        <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 120 }}
            refreshControl={<RefreshControl refreshing={isPlansLoading || isLogLoading} onRefresh={onRefresh} tintColor={colors.primary} />}
            showsVerticalScrollIndicator={false}
        >
            {isPlansLoading ? (
                <Animated.View entering={FadeInUp}>
                    <NutritionSkeleton />
                </Animated.View>
            ) : (
                <>
                    {activeTab === todayIndex && (
                        <GlassCard 
                            style={[
                                styles.dashboardCard, 
                                { 
                                    backgroundColor: isDark ? colors.glass : '#FFFFFF',
                                    borderColor: isDark ? colors.border : '#e2e8f0',
                                    // Nettoyage Light Mode
                                    shadowColor: "#000",
                                    shadowOpacity: isDark ? 0 : 0.05,
                                    shadowRadius: 8,
                                    elevation: isDark ? 0 : 2
                                }
                            ]} 
                            intensity={isDark ? 20 : 0}
                        >
                            <View style={styles.calsRow}>
                                <View>
                                    <Text style={[styles.calsValue, { color: isDark ? colors.text : '#0f172a' }]}>{Math.round(dailyStats.cals)}</Text>
                                    <Text style={[styles.calsLabel, { color: isDark ? colors.textSecondary : '#64748b' }]}>KCAL CONSOMMÉES</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={[styles.calsTarget, { color: isDark ? colors.textSecondary : '#64748b' }]}>CIBLE: {dayTarget}</Text>
                                    <Ionicons name="flame" size={24} color={colors.warning} />
                                </View>
                            </View>
                            <View style={[styles.divider, { backgroundColor: isDark ? colors.border : '#e2e8f0' }]} />
                            <MacroBar label="PROGRÈS CALORIQUE" value={dailyStats.cals} total={dayTarget} color={colors.warning} delay={100} />
                            <MacroBar label="PROTÉINES" value={dailyStats.prot} total={180} color={colors.primary} delay={200} />
                        </GlassCard>
                    )}

                    <View style={{ marginBottom: 10 }}>
                        {activePlanData ? renderPlan() : renderGenerator()}
                    </View>

                    {/* --- TIROIR JOURNAL TACTIQUE --- */}
                    {activeTab === todayIndex && (
                        <View style={{ paddingHorizontal: 20 }}>
                              <TouchableOpacity 
                                onPress={toggleJournalDrawer} 
                                activeOpacity={0.8}
                                style={{ marginBottom: 10 }}
                              >
                                <View style={[styles.drawerHeader, { borderColor: isDark ? colors.primary + '30' : '#bfdbfe', backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f0f9ff' }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <MaterialCommunityIcons name="history" size={20} color={colors.primary} />
                                        <Text style={[styles.sectionTitle, { color: isDark ? colors.text : '#1e293b', marginBottom: 0 }]}>
                                            HISTORIQUE ({journalCount})
                                        </Text>
                                    </View>
                                    <Ionicons name={showJournal ? "chevron-up" : "chevron-down"} size={20} color={isDark ? colors.textSecondary : '#94a3b8'} />
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
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  headerTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -1, fontStyle: 'italic' },
  headerDate: { fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginTop: 4 },
  
  dashboardCard: { margin: 20, marginTop: 10, padding: 24, borderRadius: 30, borderWidth: 1 },
  calsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  calsValue: { fontSize: 42, fontWeight: '900', letterSpacing: -2 },
  calsLabel: { fontSize: 9, fontWeight: 'bold', letterSpacing: 2, marginTop: 2 },
  calsTarget: { fontSize: 12, fontWeight: '600', marginBottom: 6, opacity: 0.8 },
  divider: { height: 1, marginBottom: 20 },

  macroContainer: { marginBottom: 15 },
  macroHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  macroLabel: { fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },
  macroValue: { fontSize: 12, fontWeight: 'bold' },
  macroTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  macroFill: { height: '100%', borderRadius: 4 },

  generatorWrapper: { alignItems: 'center', padding: 30, margin: 20, borderRadius: 24, borderWidth: 1 },
  title: { fontSize: 20, fontWeight: '900', marginBottom: 10 },
  desc: { textAlign: 'center', marginBottom: 25, lineHeight: 20, fontSize: 13 },
  inputContainer: { width: '100%', marginBottom: 20 },
  label: { fontSize: 10, fontWeight: 'bold', marginBottom: 8, marginLeft: 4 },
  input: { borderRadius: 12, borderWidth: 1, padding: 15, minHeight: 80, textAlignVertical: 'top' },

  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  dayTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, marginRight: 5 },
  
  mealCardContainer: { borderRadius: 20, overflow: 'hidden', borderWidth: 1 },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1 },
  mealTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  
  foodRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  foodName: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginLeft: 15 },
  
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 16, borderWidth: 1 },
  sectionTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
  readOnlyBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8, marginBottom: 15 },
});