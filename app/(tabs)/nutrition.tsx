import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Platform, Dimensions } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../../lib/supabase';
import { useTheme } from '../../lib/theme';
import { generateMealPlanJSON } from '../../lib/groq';

// --- IMPORTS ARCHITECTURE ---
import { ScreenLayout } from '../../components/ui/ScreenLayout';
import { GlassCard } from '../../components/ui/GlassCard';
import { NeonButton } from '../../components/ui/NeonButton';
import { GlassButton } from '../../components/ui/GlassButton';
import { useActivePlans } from '../hooks/useActivePlans';
import { useUserProfile } from '../hooks/useUserProfile';

const { width } = Dimensions.get('window');

export default function NutritionScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [userId, setUserId] = useState<string | undefined>();
  const [preferences, setPreferences] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Gestion des jours
  const getTodayIndex = () => (new Date().getDay() + 6) % 7; // Lundi = 0
  const [activeTab, setActiveTab] = useState(getTodayIndex());

  // 1. Récupération des Données (Hooks)
  useEffect(() => { supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id)) }, []);
  
  const { data: profile } = useUserProfile();
  const { data: plans } = useActivePlans(userId);
  const activePlan = plans?.mealPlan;

  // 2. Récupération du Log Quotidien (Checklist)
  // On utilise useQuery pour garder ça en cache et rapide
  const { data: dailyLog } = useQuery({
    queryKey: ['dailyNutritionLog', userId, new Date().toISOString().split('T')[0]],
    enabled: !!userId && !!activePlan,
    queryFn: async () => {
        const today = new Date().toISOString().split('T')[0];
        const { data } = await supabase
            .from('nutrition_logs')
            .select('meals_status, total_calories, total_protein')
            .eq('user_id', userId)
            .eq('log_date', today)
            .maybeSingle();
        return data || { meals_status: {}, total_calories: 0, total_protein: 0 };
    }
  });

  const consumedMeals = dailyLog?.meals_status || {};
  const dailyStats = { calories: dailyLog?.total_calories || 0, protein: dailyLog?.total_protein || 0 };

  // 3. Mutation pour cocher un repas
  const toggleMealMutation = useMutation({
    mutationFn: async ({ dayIndex, mealIndex, calories, protein }: any) => {
        if (!userId) return;
        
        // Vérification jour courant
        if (dayIndex !== getTodayIndex()) {
            if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(t('nutrition.alert_zone') || "Attention", t('nutrition.alert_zone_msg') || "Tu ne peux modifier que le jour en cours.");
            throw new Error("Wrong day");
        }

        if (Platform.OS !== 'web') Haptics.selectionAsync();

        const key = `day_${dayIndex}_meal_${mealIndex}`;
        const isChecking = !consumedMeals[key];
        
        // Nettoyage valeur protéine (parfois string "30g")
        let proteinVal = 0;
        if (typeof protein === 'number') proteinVal = protein;
        else if (typeof protein === 'string') proteinVal = parseInt(protein.replace(/\D/g, '')) || 0;

        // Calculs optimistes
        const newStatus = { ...consumedMeals, [key]: isChecking };
        const newCalories = isChecking ? dailyStats.calories + calories : dailyStats.calories - calories;
        const newProtein = isChecking ? dailyStats.protein + proteinVal : dailyStats.protein - proteinVal;

        // Sauvegarde
        const today = new Date().toISOString().split('T')[0];
        const { error } = await supabase.from('nutrition_logs').upsert({
            user_id: userId,
            log_date: today,
            meals_status: newStatus,
            total_calories: Math.max(0, newCalories),
            total_protein: Math.max(0, newProtein)
        }, { onConflict: 'user_id, log_date' });

        if (error) throw error;
    },
    onSuccess: () => {
        // Rafraîchir instantanément l'UI
        queryClient.invalidateQueries({ queryKey: ['dailyNutritionLog'] });
        queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    }
  });

  // 4. Génération IA
  const handleGenerate = async () => {
    if (!userId) return;
    setIsGenerating(true);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    try {
        const context = preferences.trim() || `Objectif: ${profile?.goal || 'Santé'}`;
        // On utilise la lib groq ou l'edge function (ici on garde ta lib existante pour compatibilité code initial)
        const mealJson = await generateMealPlanJSON(profile, context); 
        
        if (mealJson && mealJson.days) {
            await supabase.from('meal_plans').update({ is_active: false }).eq('user_id', userId);
            const { error } = await supabase.from('meal_plans').insert({
                user_id: userId,
                content: mealJson,
                title: mealJson.title || "Plan Nutrition IA",
                is_active: true
            });

            if (!error) {
                queryClient.invalidateQueries({ queryKey: ['activePlans'] });
                setPreferences('');
                Alert.alert(t('nutrition.alert_title') || "Succès", t('nutrition.alert_msg') || "Nouveau plan généré !");
            }
        }
    } catch (e: any) {
        Alert.alert(t('nutrition.alert_error') || "Erreur", e.message);
    } finally {
        setIsGenerating(false);
    }
  };

  const calculateDayTarget = (dayIndex: number) => {
      if (!activePlan || !activePlan.days || !activePlan.days[dayIndex]) return 2000;
      const day = activePlan.days[dayIndex];
      return day.meals.reduce((acc: number, meal: any) => acc + (parseInt(meal.calories) || 0), 0) || 2000;
  };

  // --- RENDERS ---

  const renderGenerator = () => (
    <GlassCard style={styles.centerContent}>
        <MaterialCommunityIcons name="food-apple" size={48} color={colors.success} style={{marginBottom: 15}} />
        <Text style={[styles.title, {color: colors.text}]}>{t('nutrition.ia_title') || "GÉNÉRATEUR DE PLAN"}</Text>
        <Text style={[styles.desc, {color: colors.textSecondary}]}>{t('nutrition.ia_desc') || "Crée une diète sur mesure en quelques secondes."}</Text>
        
        <View style={styles.inputContainer}>
            <Text style={[styles.label, {color: colors.success}]}>{t('nutrition.pref_label') || "PRÉFÉRENCES"}</Text>
            <TextInput 
                style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
                placeholder={t('nutrition.pref_ph') || "Ex: Sans gluten, Budget étudiant..."}
                placeholderTextColor={colors.textSecondary}
                value={preferences}
                onChangeText={setPreferences}
                multiline
            />
        </View>
        
        <NeonButton 
            label={t('nutrition.btn_generate') || "GÉNÉRER"}
            onPress={handleGenerate}
            loading={isGenerating}
            icon="brain"
        />
    </GlassCard>
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
                    <Text style={[styles.planTitle, {color: colors.text}]}>{activePlan.title}</Text>
                    <View style={{flexDirection:'row', gap:15, marginTop:5}}>
                        <Text style={[styles.statsText, {color: colors.textSecondary}]}>
                            {t('nutrition.target') || "Cible"}: <Text style={{color: colors.text, fontWeight:'900'}}>{dayTarget}</Text>
                        </Text>
                        <Text style={[styles.statsText, {color: colors.success}]}>
                            {t('nutrition.consumed') || "Fait"}: {dailyStats.calories}
                        </Text>
                    </View>
                </View>
                <GlassButton icon="refresh" onPress={handleGenerate} size={20} />
            </View>

            {/* Progress Bar */}
            <View style={[styles.progressBg, {backgroundColor: colors.border}]}>
                <LinearGradient 
                    colors={[colors.success, '#34d399']} 
                    start={{x:0, y:0}} end={{x:1, y:0}} 
                    style={[styles.progressFill, { width: `${progress * 100}%` }]} 
                />
            </View>

            {/* Day Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 10, paddingVertical: 20}}>
                {activePlan.days.map((d: any, i: number) => {
                    const isToday = i === todayIndex;
                    const isActive = activeTab === i;
                    return (
                    <TouchableOpacity 
                        key={i} 
                        style={[
                            styles.dayTab, 
                            { backgroundColor: isActive ? colors.success : colors.glass, borderColor: isActive ? colors.success : colors.border },
                            isToday && !isActive && { borderColor: colors.success, borderWidth: 1 }
                        ]}
                        onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); setActiveTab(i); }}
                    >
                        <Text style={[styles.dayText, { color: isActive ? '#fff' : colors.textSecondary }]}>
                            {d.day ? d.day.slice(0,3).toUpperCase() : `J${i+1}`}
                            {isToday && " •"}
                        </Text>
                    </TouchableOpacity>
                )})}
            </ScrollView>

            {/* Meal List */}
            {day.meals.map((meal: any, index: number) => {
                const isChecked = consumedMeals[`day_${safeIndex}_meal_${index}`];
                return (
                    <GlassCard 
                        key={index} 
                        style={[styles.mealCard, isChecked && { backgroundColor: colors.success + '10', borderColor: colors.success }]}
                        onPress={() => toggleMealMutation.mutate({ dayIndex: safeIndex, mealIndex: index, calories: parseInt(meal.calories), protein: meal.protein })}
                    >
                        <View style={{flex:1}}>
                            <View style={styles.mealHeaderRow}>
                                <View style={[styles.mealBadge, {backgroundColor: colors.success + '20'}]}>
                                    <Text style={[styles.mealType, {color: colors.success}]}>{meal.type}</Text>
                                </View>
                                <View style={{flexDirection:'row', gap:10}}>
                                    <Text style={[styles.macroText, {color: colors.textSecondary}]}>🔥 {meal.calories}</Text>
                                    <Text style={[styles.macroText, {color: colors.textSecondary}]}>🥩 {meal.protein}</Text>
                                </View>
                            </View>
                            <Text style={[styles.mealName, {color: colors.text}, isChecked && {textDecorationLine: 'line-through', color: colors.textSecondary}]}>
                                {meal.name}
                            </Text>
                            <Text style={[styles.ingredients, {color: colors.textSecondary}]} numberOfLines={2}>
                                🛒 {meal.ingredients}
                            </Text>
                        </View>
                        
                        <View style={[
                            styles.checkbox, 
                            { borderColor: isChecked ? colors.success : colors.textSecondary, backgroundColor: isChecked ? colors.success : 'transparent' }
                        ]}>
                            {isChecked && <Ionicons name="checkmark" size={16} color="#fff" />}
                        </View>
                    </GlassCard>
                );
            })}

            <TouchableOpacity style={{padding: 20, alignItems:'center'}} onPress={handleGenerate}>
                <Text style={{color: colors.textSecondary, fontSize: 10, fontWeight:'bold', letterSpacing:1}}>
                    {t('nutrition.btn_regen') || "RÉGÉNÉRER LE PLAN"}
                </Text>
            </TouchableOpacity>
            
            <View style={{height: 100}} />
        </View>
    );
  };

  return (
    <ScreenLayout>
        <View style={styles.header}>
            <GlassButton icon="arrow-back" onPress={() => router.back()} />
            <Text style={[styles.headerTitle, {color: colors.text}]}>{t('nutrition.title') || "NUTRITION"}</Text>
            <View style={{width:48}} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {activePlan ? renderPlan() : renderGenerator()}
        </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 10 },
    headerTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 2 },
    content: { padding: 20 },
    
    centerContent: { alignItems: 'center', padding: 30 },
    title: { fontSize: 20, fontWeight: '900', marginBottom: 10 },
    desc: { textAlign: 'center', marginBottom: 25, lineHeight: 20 },
    inputContainer: { width: '100%', marginBottom: 20 },
    label: { fontSize: 10, fontWeight: 'bold', marginBottom: 8, marginLeft: 4 },
    input: { borderRadius: 12, borderWidth: 1, padding: 15, minHeight: 80, textAlignVertical: 'top' },
    
    planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
    planTitle: { fontSize: 22, fontWeight: '900', fontStyle: 'italic', flex: 1 },
    statsText: { fontSize: 10, fontWeight: 'bold' },
    
    progressBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
    
    dayTab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    dayText: { fontWeight: 'bold', fontSize: 12 },
    
    mealCard: { flexDirection: 'row', alignItems: 'center', padding: 15, marginBottom: 12 },
    mealHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    mealBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
    mealType: { fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' },
    macroText: { fontSize: 11, fontWeight: 'bold' },
    mealName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    ingredients: { fontSize: 11, fontStyle: 'italic' },
    
    checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginLeft: 15 },
});