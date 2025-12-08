import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, RefreshControl, Platform, Dimensions, Alert, LayoutAnimation, UIManager, Image } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../lib/theme';
import { ScreenLayout } from '../../components/ui/ScreenLayout';
import { GlassCard } from '../../components/ui/GlassCard';
import { NeonButton } from '../../components/ui/NeonButton';
import { GlassButton } from '../../components/ui/GlassButton';

// Hooks d'Architecture
import { useUserProfile } from '../../hooks/useUserProfile';
import { useAINutrition } from '../../hooks/useAINutrition';
import { useNutritionLog } from '../../hooks/useNutritionLog';
import { useNutritionMutations } from '../../hooks/useNutritionMutations';
import FoodJournal from '../../app/features/food-journal'; 

const { width } = Dimensions.get('window');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const getTodayIndex = () => {
  const day = new Date().getDay(); 
  return (day + 6) % 7;
};

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
        <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.macroValue, { color: colors.text }]}>
            {Math.round(value)}g <Text style={{fontSize:10, color:colors.textSecondary}}>/ {Math.round(safeTotal)}g</Text>
        </Text>
      </View>
      {/* Track adaptatif : sombre en dark, gris pâle en light */}
      <View style={[styles.macroTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
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
  const { mealPlan, generateNutrition, isGenerating, isLoadingPlan } = useAINutrition();
  const { data: log, isLoading: isLogLoading, refetch } = useNutritionLog(today);
  const { toggleItem } = useNutritionMutations(today);

  const todayIndex = getTodayIndex();
  const [activeTab, setActiveTab] = useState(todayIndex);
  const [showJournal, setShowJournal] = useState(false);

  useEffect(() => {}, [today]);

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
      const content = (mealPlan?.content || mealPlan) as any;
      
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
  }, [mealPlan, activeTab]);

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
                    // ✅ REDIRECTION SUBSCRIPTION
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
          currentLog: log ?? null
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
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                shadowColor: "#000",
                shadowOpacity: isDark ? 0 : 0.05,
                shadowRadius: 10,
                elevation: isDark ? 0 : 3
            }
        ]}
    >
        <MaterialCommunityIcons name="food-apple" size={48} color={colors.success} style={{marginBottom: 15}} />
        <Text style={[styles.title, {color: colors.text}]}>GÉNÉRATEUR IA</Text>
        <Text style={[styles.desc, {color: colors.textSecondary}]}>Créez votre plan nutritionnel tactique sur mesure.</Text>
        
        <View style={styles.inputContainer}>
            <Text style={[styles.label, {color: colors.success}]}>PRÉFÉRENCES (Optionnel)</Text>
            <TextInput 
                style={[
                    styles.input, 
                    { 
                        backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : colors.bg, 
                        borderColor: colors.border, 
                        color: colors.text 
                    }
                ]}
                placeholder="Ex: Keto, Jeûne intermittent, Vegan..."
                placeholderTextColor={colors.textSecondary}
                value={preferences}
                onChangeText={setPreferences}
                multiline
            />
        </View>
        
        <NeonButton 
            label="INITIALISER LE PLAN" 
            onPress={handleGenerate} 
            loading={isGenerating || isLoadingPlan} 
            icon="brain"
            style={{
                backgroundColor: isDark ? undefined : colors.success,
                borderColor: isDark ? undefined : colors.success
            }}
        />
    </View>
  );

  const renderPlan = () => {
      const content = (mealPlan?.content || mealPlan) as any;
      
      if (!content?.days) return renderGenerator();

      const safeIndex = activeTab % content.days.length;
      const day = content.days[safeIndex];
      const isEditable = activeTab === todayIndex;

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
                                        backgroundColor: isActive ? colors.success : 'transparent',
                                        borderColor: isActive ? colors.success : (isTodayTab ? colors.primary : colors.border),
                                        borderWidth: 1
                                    }
                                ]}
                            >
                                <View style={{flexDirection:'row', alignItems:'center', gap: 4}}>
                                    <Text style={{color: isActive ? '#000' : colors.textSecondary, fontWeight:'bold', fontSize:12}}>
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
                        Alert.alert("Nouveau Menu ?", "Générer un nouveau plan consommera un crédit.", [{text:"Annuler"}, {text:"Générer", onPress: handleGenerate}]);
                    }} 
                    size={20} 
                  />
              </View>

              {!isEditable && (
                  <View style={[styles.readOnlyBanner, { backgroundColor: colors.textSecondary + '20', marginHorizontal: 20 }]}>
                      <Ionicons name="eye-outline" size={14} color={colors.textSecondary} />
                      <Text style={{color: colors.textSecondary, fontSize: 10, marginLeft: 5}}>MODE LECTURE SEULE</Text>
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
                                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                        shadowColor: "#000",
                                        shadowOpacity: isDark ? 0 : 0.05,
                                        shadowRadius: 8,
                                        elevation: isDark ? 0 : 3
                                    }
                                ]}
                              >
                                  <View style={[styles.mealHeader, { backgroundColor: isDark ? colors.primary + '15' : colors.primary + '10', borderColor: isDark ? colors.primary + '30' : 'transparent' }]}>
                                      <Text style={[styles.mealTitle, { color: colors.text }]}>{meal.name.toUpperCase()}</Text>
                                      <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 10 }}>{mealCals} KCAL</Text>
                                  </View>

                                  <View style={{ padding: 15, paddingTop: 5 }}>
                                      {meal.items && meal.items.map((item: any, i: number) => {
                                          const key = `${meal.name}_${item.name}`;
                                          const isChecked = !!consumedMap[key];
                                          
                                          return (
                                              <TouchableOpacity 
                                                  key={i}
                                                  style={[styles.foodRow, { borderBottomColor: colors.border, borderBottomWidth: i === meal.items.length - 1 ? 0 : 1 }]}
                                                  onPress={() => handleMealPress(item, meal.name, isEditable)}
                                                  activeOpacity={0.7}
                                              >
                                                  <View style={{ flex: 1 }}>
                                                      <Text style={[styles.foodName, { color: colors.text, textDecorationLine: isChecked ? 'line-through' : 'none', opacity: isChecked ? 0.6 : 1 }]}>
                                                          {item.name}
                                                      </Text>
                                                      <Text style={{ fontSize: 10, color: colors.textSecondary }}>
                                                          {item.calories} kcal • {item.protein}g prot {item.notes ? `• ${item.notes}` : ''}
                                                      </Text>
                                                  </View>

                                                  <View style={[styles.checkbox, { 
                                                      borderColor: isChecked ? colors.success : (isEditable ? colors.border : colors.textSecondary),
                                                      backgroundColor: isChecked ? colors.success : 'transparent',
                                                      opacity: isEditable ? 1 : 0.5
                                                  }]}>
                                                      {isChecked && <Ionicons name="checkmark" size={12} color={isDark ? "#000" : "#FFF"} />}
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
                          <Text style={{ color: colors.textSecondary, fontSize: 10, marginRight: 5 }}>GLISSER POUR VOIR</Text>
                          <Ionicons name="arrow-forward" size={12} color={colors.textSecondary} />
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
        />

        <View style={styles.header}>
            <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>CARBURANT</Text>
                <Text style={[styles.headerDate, { color: colors.primary }]}>
                    {activeTab === todayIndex ? "AUJOURD'HUI" : `JOUR ${activeTab + 1}`}
                </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/features/shopping' as any)}>
                <MaterialCommunityIcons name="cart-outline" size={24} color={colors.text} />
            </TouchableOpacity>
        </View>

        <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 120 }}
            refreshControl={<RefreshControl refreshing={isLoadingPlan || isLogLoading} onRefresh={onRefresh} tintColor={colors.primary} />}
            showsVerticalScrollIndicator={false}
        >
            {activeTab === todayIndex && (
                <GlassCard 
                    style={[
                        styles.dashboardCard, 
                        { 
                            backgroundColor: isDark ? colors.glass : '#FFFFFF',
                            borderColor: isDark ? colors.border : 'rgba(0,0,0,0.05)',
                            shadowColor: "#000",
                            shadowOpacity: isDark ? 0 : 0.05,
                            shadowRadius: 10,
                            elevation: isDark ? 0 : 3
                        }
                    ]} 
                    intensity={isDark ? 20 : 0}
                >
                    <View style={styles.calsRow}>
                        <View>
                            <Text style={[styles.calsValue, { color: colors.text }]}>{Math.round(dailyStats.cals)}</Text>
                            <Text style={[styles.calsLabel, { color: colors.textSecondary }]}>KCAL CONSOMMÉES</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[styles.calsTarget, { color: colors.textSecondary }]}>CIBLE: {dayTarget}</Text>
                            <Ionicons name="flame" size={24} color={colors.warning} />
                        </View>
                    </View>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <MacroBar label="PROGRÈS CALORIQUE" value={dailyStats.cals} total={dayTarget} color={colors.warning} delay={100} />
                    <MacroBar label="PROTÉINES" value={dailyStats.prot} total={180} color={colors.primary} delay={200} />
                </GlassCard>
            )}

            <View style={{ marginBottom: 10 }}>
                {mealPlan ? renderPlan() : renderGenerator()}
            </View>

            {/* --- TIROIR JOURNAL TACTIQUE --- */}
            {activeTab === todayIndex && (
                <View style={{ paddingHorizontal: 20 }}>
                      <TouchableOpacity 
                        onPress={toggleJournalDrawer} 
                        activeOpacity={0.8}
                        style={{ marginBottom: 10 }}
                      >
                        <View style={[styles.drawerHeader, { borderColor: colors.primary + '30', backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF' }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <MaterialCommunityIcons name="history" size={20} color={colors.primary} />
                                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
                                    HISTORIQUE ({journalCount})
                                </Text>
                            </View>
                            <Ionicons name={showJournal ? "chevron-up" : "chevron-down"} size={20} color={colors.textSecondary} />
                        </View>
                      </TouchableOpacity>

                      {showJournal && (
                          <Animated.View entering={FadeInDown} style={{ marginTop: 5 }}>
                              <FoodJournal date={today} />
                          </Animated.View>
                      )}
                </View>
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