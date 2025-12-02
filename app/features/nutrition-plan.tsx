import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput, Platform, Dimensions } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { generateMealPlanJSON } from '../../lib/groq';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';

const { width } = Dimensions.get('window');

export default function NutritionPlanScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activePlan, setActivePlan] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [preferences, setPreferences] = useState('');
  
  // --- LOGIQUE JOUR J ---
  // (new Date().getDay() renvoie 0 pour Dimanche, 1 pour Lundi...)
  // On veut 0 pour Lundi, donc on décale : (Jour + 6) % 7
  const getTodayIndex = () => (new Date().getDay() + 6) % 7;
  const [activeTab, setActiveTab] = useState(getTodayIndex());
  
  const [consumedMeals, setConsumedMeals] = useState<{[key: string]: boolean}>({});
  const [dailyStats, setDailyStats] = useState({ calories: 0, protein: 0 });

  // Force l'onglet sur le jour actuel au montage
  useEffect(() => {
    setActiveTab(getTodayIndex());
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      setUserProfile(profile);

      const { data: plan } = await supabase
        .from('meal_plans')
        .select('content')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (plan?.content) {
        setActivePlan(plan.content);
        loadDailyLog(session.user.id);
      }
    } catch (e) { console.log("Erreur chargement:", e); }
  };

  const loadDailyLog = async (userId: string) => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('nutrition_logs')
        .select('meals_status, total_calories, total_protein')
        .eq('user_id', userId)
        .eq('log_date', today)
        .maybeSingle();

      if (data) {
          setConsumedMeals(data.meals_status || {});
          setDailyStats({ 
              calories: data.total_calories || 0, 
              protein: data.total_protein || 0 
          });
      } else {
          setConsumedMeals({});
          setDailyStats({ calories: 0, protein: 0 });
      }
  };

  const calculateDayTarget = (dayIndex: number) => {
      if (!activePlan || !activePlan.days || !activePlan.days[dayIndex]) return 2000;
      const day = activePlan.days[dayIndex];
      const sum = day.meals.reduce((acc: number, meal: any) => acc + (parseInt(meal.calories) || 0), 0);
      return sum > 0 ? sum : 2000;
  };

  const toggleMeal = async (dayIndex: number, mealIndex: number, calories: number, proteinRaw: string | number) => {
    const todayIdx = getTodayIndex();
    
    if (dayIndex !== todayIdx) {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Hors Zone", dayIndex > todayIdx 
            ? "Vous ne pouvez pas manger dans le futur ! Revenez demain." 
            : "Ce jour est passé. Concentrez-vous sur aujourd'hui.");
        return;
    }

    if (Platform.OS !== 'web') Haptics.selectionAsync();

    const key = `day_${dayIndex}_meal_${mealIndex}`;
    const isChecking = !consumedMeals[key];
    
    let proteinVal = 0;
    if (typeof proteinRaw === 'number') proteinVal = proteinRaw;
    else if (typeof proteinRaw === 'string') proteinVal = parseInt(proteinRaw.replace(/\D/g,'')) || 0;

    const newStatus = { ...consumedMeals, [key]: isChecking };
    const newCalories = isChecking ? dailyStats.calories + calories : dailyStats.calories - calories;
    const newProtein = isChecking ? dailyStats.protein + proteinVal : dailyStats.protein - proteinVal;

    setConsumedMeals(newStatus);
    setDailyStats({ 
        calories: Math.max(0, newCalories), 
        protein: Math.max(0, newProtein) 
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        const today = new Date().toISOString().split('T')[0];
        await supabase.from('nutrition_logs').upsert({
            user_id: session.user.id,
            log_date: today,
            meals_status: newStatus,
            total_calories: Math.max(0, newCalories),
            total_protein: Math.max(0, newProtein)
        }, { onConflict: 'user_id, log_date' });
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    try {
        const context = preferences.trim() || `Objectif: ${userProfile?.goal || 'Santé'}`;
        const mealJson = await generateMealPlanJSON(userProfile, context);

        if (mealJson && mealJson.days) {
            const { data: { session } } = await supabase.auth.getSession();
            await supabase.from('meal_plans').update({ is_active: false }).eq('user_id', session!.user.id);
            
            const { error } = await supabase.from('meal_plans').insert({
                user_id: session!.user.id,
                content: mealJson,
                title: mealJson.title || "Plan Nutrition IA",
                is_active: true
            });

            if (!error) {
                setActivePlan(mealJson);
                setConsumedMeals({});
                setDailyStats({ calories: 0, protein: 0 });
                setPreferences('');
                Alert.alert("Nouveau Menu Prêt", "Votre plan a été généré et calibré.");
            }
        }
    } catch (e: any) {
        Alert.alert("Erreur", "Impossible de générer le plan.");
    } finally {
        setLoading(false);
    }
  };

  const renderGenerator = () => (
    <View style={styles.inputCard}>
        <MaterialCommunityIcons name="food-apple" size={48} color={theme.colors.success} style={{marginBottom: 15}} />
        <Text style={styles.inputTitle}>DIÉTÉTICIEN IA</Text>
        <Text style={styles.inputDesc}>Générez votre plan de la semaine.</Text>
        <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>PRÉFÉRENCES</Text>
            <TextInput 
                style={styles.textInput} 
                placeholder="Ex: Végétarien, Budget étudiant..." 
                placeholderTextColor={theme.colors.textSecondary}
                value={preferences}
                onChangeText={setPreferences}
                multiline
            />
        </View>
        <TouchableOpacity style={styles.genBtn} onPress={handleGenerate} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
                <LinearGradient colors={[theme.colors.success, '#10b981']} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.btnGradient}>
                    <Text style={styles.genBtnText}>GÉNÉRER LE PLAN</Text>
                </LinearGradient>
            )}
        </TouchableOpacity>
    </View>
  );

  const renderPlan = () => {
    const safeIndex = Math.min(activeTab, (activePlan?.days?.length || 1) - 1);
    const day = activePlan.days[safeIndex];
    
    if (!day) return null;

    const dayTarget = calculateDayTarget(safeIndex);
    const progress = Math.min(dailyStats.calories / dayTarget, 1);
    const todayIndex = getTodayIndex();

    return (
        <View>
            <View style={styles.planHeader}>
                <View>
                    <Text style={styles.planTitle}>{activePlan.title}</Text>
                    <View style={{flexDirection:'row', gap:15, marginTop:5}}>
                        <Text style={[styles.planSub, {color: theme.colors.textSecondary}]}>
                            CIBLE: <Text style={{color: theme.colors.text, fontWeight:'900'}}>{dayTarget}</Text> KCAL
                        </Text>
                        <Text style={[styles.planSub, {color: theme.colors.success}]}>
                            ACTUEL: {dailyStats.calories}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity onPress={handleGenerate} style={styles.regenBtnSmall}>
                    <MaterialCommunityIcons name="refresh" size={20} color={theme.colors.text} />
                </TouchableOpacity>
            </View>

            <View style={styles.progressBarBg}>
                <LinearGradient 
                    colors={[theme.colors.success, '#34d399']} 
                    start={{x:0, y:0}} end={{x:1, y:0}}
                    style={[styles.progressBarFill, { width: `${progress * 100}%` }]} 
                />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 10, paddingVertical: 20}}>
                {activePlan.days.map((d: any, i: number) => {
                    const isToday = i === todayIndex;
                    return (
                    <TouchableOpacity 
                        key={i} 
                        style={[
                            styles.dayTab, 
                            activeTab === i && styles.dayTabActive,
                            isToday && activeTab !== i && {borderColor: theme.colors.success, borderWidth: 1} 
                        ]}
                        onPress={() => {
                            if (Platform.OS !== 'web') Haptics.selectionAsync();
                            setActiveTab(i);
                        }}
                    >
                        <Text style={[styles.dayText, activeTab === i && styles.dayTextActive]}>
                            {d.day.slice(0,3).toUpperCase()}
                            {isToday && " •"}
                        </Text>
                    </TouchableOpacity>
                )})}
            </ScrollView>

            {day.meals.map((meal: any, index: number) => {
                const isChecked = consumedMeals[`day_${safeIndex}_meal_${index}`];
                return (
                    <TouchableOpacity 
                        key={index} 
                        style={[
                            styles.mealCard, 
                            isChecked && styles.mealCardChecked,
                            activeTab !== todayIndex && {opacity: 0.6} 
                        ]}
                        onPress={() => toggleMeal(safeIndex, index, meal.calories, meal.protein)}
                        activeOpacity={0.8}
                    >
                        <View style={{flex:1}}>
                            <View style={styles.mealHeader}>
                                <View style={styles.mealBadge}>
                                    <Text style={styles.mealType}>{meal.type}</Text>
                                </View>
                                <View style={{flexDirection:'row', gap:8}}>
                                     <Text style={styles.macroText}>🔥 {meal.calories}</Text>
                                     <Text style={styles.macroText}>🥩 {meal.protein}</Text>
                                </View>
                            </View>
                            <Text style={[styles.mealName, isChecked && {textDecorationLine: 'line-through', color: theme.colors.textSecondary}]}>
                                {meal.name}
                            </Text>
                            <Text style={styles.ingredients} numberOfLines={2}>🛒 {meal.ingredients}</Text>
                        </View>
                        <View style={[styles.checkbox, isChecked && styles.checkboxActive]}>
                            {isChecked && <Ionicons name="checkmark" size={16} color="#fff" />}
                        </View>
                    </TouchableOpacity>
                );
            })}
            
            <View style={{height:100}}/>
        </View>
    );
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    headerTitle: { color: theme.colors.text, fontWeight: '900', marginLeft: 15, letterSpacing: 1, fontSize: 16 },
    content: { padding: 20 },
    progressBarBg: { height: 8, backgroundColor: theme.colors.border, borderRadius: 4, overflow: 'hidden', marginTop: 10 },
    progressBarFill: { height: '100%', borderRadius: 4 },
    inputCard: { padding: 30, backgroundColor: theme.colors.glass, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    inputTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '900', marginBottom: 10 },
    inputDesc: { color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 25, lineHeight: 20 },
    inputContainer: { width: '100%', marginBottom: 20 },
    inputLabel: { color: theme.colors.success, fontSize: 10, fontWeight: 'bold', marginBottom: 8, marginLeft: 4 },
    textInput: { backgroundColor: theme.colors.bg, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.text, padding: 15, minHeight: 80, textAlignVertical: 'top' },
    genBtn: { width: '100%', borderRadius: 16, overflow: 'hidden' },
    btnGradient: { padding: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
    genBtnText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
    planHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    planTitle: { color: theme.colors.text, fontSize: 22, fontWeight: '900', fontStyle: 'italic' },
    planSub: { color: theme.colors.success, fontSize: 10, fontWeight: 'bold' },
    regenBtnSmall: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    dayTab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: theme.colors.glass, borderWidth: 1, borderColor: theme.colors.border },
    dayTabActive: { backgroundColor: theme.colors.success, borderColor: theme.colors.success },
    dayText: { color: theme.colors.textSecondary, fontWeight: 'bold', fontSize: 12 },
    dayTextActive: { color: '#fff' },
    mealCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.glass, padding: 15, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border, shadowColor: "#000", shadowOffset: {width:0, height:2}, shadowOpacity:0.05, shadowRadius:4, elevation:2 },
    mealCardChecked: { borderColor: theme.colors.success, backgroundColor: theme.isDark ? 'rgba(34, 197, 94, 0.05)' : '#f0fdf4' },
    mealHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    mealBadge: { backgroundColor: theme.colors.success + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 4 },
    mealType: { color: theme.colors.success, fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' },
    macroText: { color: theme.colors.textSecondary, fontSize: 11, fontWeight: 'bold' },
    mealName: { color: theme.colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    ingredients: { color: theme.colors.textSecondary, fontSize: 12, fontStyle: 'italic' },
    checkbox: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: theme.colors.textSecondary, marginLeft: 15, justifyContent: 'center', alignItems: 'center' },
    checkboxActive: { backgroundColor: theme.colors.success, borderColor: theme.colors.success },
    regenBtn: { padding: 15, alignItems: 'center', marginTop: 20 },
    regenText: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 }
  });

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>NUTRITION PLANNER</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {activePlan ? renderPlan() : renderGenerator()}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}