import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Platform, Dimensions, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../../lib/supabase';
import { useTheme } from '../../lib/theme';

// --- IMPORTS ARCHITECTURE V2 ---
import { ScreenLayout } from '../../components/ui/ScreenLayout';
import { GlassCard } from '../../components/ui/GlassCard';
import { NeonButton } from '../../components/ui/NeonButton';
import { GlassButton } from '../../components/ui/GlassButton';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useAINutrition } from '../../hooks/useAINutrition'; // <--- LE CERVEAU V2

const { width } = Dimensions.get('window');

export default function NutritionScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [userId, setUserId] = useState<string | undefined>();
  const [preferences, setPreferences] = useState('');
  
  // --- LOGIQUE BACKEND CORRIGÉE ---
  const { userProfile } = useUserProfile();

  // On récupère le hook V2
  const { 
    mealPlan: rawPlan, 
    generateNutrition, // La fonction qu'on a fixée
    loading: isGenerating 
  } = useAINutrition();

  // ADAPTATEUR: L'UI attend 'activePlan.content', on adapte la structure
  const activePlan = rawPlan ? { content: rawPlan } : null;

  // Gestion des jours
  const getTodayIndex = () => (new Date().getDay() + 6) % 7; // Lundi = 0
  const [activeTab, setActiveTab] = useState(getTodayIndex());

  useEffect(() => { supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id)) }, []);

  // 1. Récupération du Log Quotidien (Checklist)
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
        return data || { meals_status: [], total_calories: 0, total_protein: 0 };
    }
  });

  // Transformation du tableau d'items mangés en objet pour accès rapide
  const consumedMeals = React.useMemo(() => {
      const map: Record<string, boolean> = {};
      if (dailyLog?.meals_status && Array.isArray(dailyLog.meals_status)) {
          dailyLog.meals_status.forEach((item: any) => {
              // Clé composite : NomRepas_NomItem
              const key = `${item.mealName}_${item.name}`;
              map[key] = true;
          });
      }
      return map;
  }, [dailyLog]);

  const dailyStats = { calories: dailyLog?.total_calories || 0, protein: dailyLog?.total_protein || 0 };

  // 2. Mutation pour cocher un repas (Logique V2 Snapshot)
  const toggleMealMutation = useMutation({
    mutationFn: async ({ mealName, item }: any) => {
        if (!userId) return;
        
        // On reconstruit la liste complète des items mangés
        const currentList = Array.isArray(dailyLog?.meals_status) ? [...dailyLog.meals_status] : [];
        const key = `${mealName}_${item.name}`;
        const existsIndex = currentList.findIndex((i: any) => `${i.mealName}_${i.name}` === key);
        
        let newList;
        let newCalories = dailyStats.calories;
        let newProtein = dailyStats.protein;

        if (existsIndex >= 0) {
            // RETIRER
            currentList.splice(existsIndex, 1);
            newList = currentList;
            newCalories -= (item.calories || 0);
            newProtein -= (item.protein || 0);
        } else {
            // AJOUTER
            newList = [...currentList, {
                name: item.name,
                calories: item.calories,
                protein: item.protein,
                mealName: mealName,
                eatenAt: new Date().toISOString()
            }];
            newCalories += (item.calories || 0);
            newProtein += (item.protein || 0);
        }

        if (Platform.OS !== 'web') Haptics.selectionAsync();

        // Sauvegarde
        const today = new Date().toISOString().split('T')[0];
        const { error } = await supabase.from('nutrition_logs').upsert({
            user_id: userId,
            log_date: today,
            meals_status: newList,
            total_calories: Math.max(0, newCalories),
            total_protein: Math.max(0, newProtein)
        }, { onConflict: 'user_id, log_date' });

        if (error) throw error;
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['dailyNutritionLog'] });
        queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    }
  });

  // 3. Génération IA (Via le Hook V2)
  const handleGenerate = async () => {
    if (!userId) return;
    
    // SÉCURITÉ : Profil requis
    if (!userProfile) {
        Alert.alert("Profil manquant", "Veuillez patienter.");
        return;
    }

    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
        const context = preferences.trim() || `Objectif: ${userProfile?.goal || 'Santé'}`;
        
        // APPEL CORRIGÉ: On passe userProfile et le context
        await generateNutrition(userProfile, context);

        setPreferences('');
        Alert.alert(t('nutrition.alert_title') || "Succès", t('nutrition.alert_msg') || "Nouveau plan nutritionnel activé !");
        
    } catch (e: any) {
        if (e.message === "FREE_LIMIT_REACHED") {
             Alert.alert("Limite Atteinte", "Passez Premium pour générer plus de plans.");
        } else if (e.message === "FREE_PLAN_ACTIVE") {
             Alert.alert("Plan Actif", "Terminez votre plan actuel ou passez Premium.");
        } else {
             Alert.alert("Erreur", e.message);
        }
    }
  };

  const calculateDayTarget = (dayIndex: number) => {
      // Sécurité : structure du plan
      if (!activePlan?.content?.days) return 2000;
      const day = activePlan.content.days[dayIndex] || activePlan.content.days[0];
      
      // Calculer la somme des items
      let total = 0;
      day.meals?.forEach((m: any) => {
          if (m.items) m.items.forEach((i: any) => total += (i.calories || 0));
          else if (m.calories) total += m.calories;
      });
      return total > 0 ? total : 2000;
  };

  // --- RENDERS (INCHANGÉS) ---

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
    // Sécurité accès contenu
    const content = activePlan?.content;
    if (!content?.days) return renderGenerator(); // Fallback si plan corrompu

    const safeIndex = Math.min(activeTab, (content.days.length || 1) - 1);
    const day = content.days[safeIndex];
    if (!day) return null;

    const dayTarget = calculateDayTarget(safeIndex);
    const progress = Math.min(dailyStats.calories / dayTarget, 1);
    const todayIndex = getTodayIndex();

    return (
        <View>
            <View style={styles.planHeader}>
                <View>
                    <Text style={[styles.planTitle, {color: colors.text}]}>{content.title}</Text>
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
                {content.days.map((d: any, i: number) => {
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
            {day.meals?.map((meal: any, index: number) => (
                <View key={index} style={{marginBottom: 20}}>
                    <Text style={{color: colors.success, fontWeight:'bold', marginBottom:10, textTransform:'uppercase', letterSpacing:1}}>{meal.name}</Text>
                    
                    {/* Items du repas */}
                    {meal.items?.map((item: any, i: number) => {
                        const key = `${meal.name}_${item.name}`;
                        const isChecked = !!consumedMeals[key];
                        
                        return (
                            <GlassCard 
                                key={i} 
                                style={[styles.mealCard, isChecked && { backgroundColor: colors.success + '10', borderColor: colors.success }]}
                                onPress={() => toggleMealMutation.mutate({ mealName: meal.name, item })}
                            >
                                <View style={[
                                    styles.checkbox, 
                                    { borderColor: isChecked ? colors.success : colors.textSecondary, backgroundColor: isChecked ? colors.success : 'transparent' }
                                ]}>
                                    {isChecked && <Ionicons name="checkmark" size={12} color="#fff" />}
                                </View>

                                <View style={{flex:1}}>
                                    <Text style={[styles.mealName, {color: colors.text}, isChecked && {textDecorationLine: 'line-through', color: colors.textSecondary}]}>
                                        {item.name}
                                    </Text>
                                    <View style={{flexDirection:'row', gap:10}}>
                                        <Text style={[styles.macroText, {color: colors.textSecondary}]}>🔥 {item.calories}</Text>
                                        <Text style={[styles.macroText, {color: colors.textSecondary}]}>🥩 {item.protein}g</Text>
                                    </View>
                                </View>
                            </GlassCard>
                        );
                    })}
                </View>
            ))}

            <View style={{height: 100}} />
        </View>
    );
  };

  return (
    <ScreenLayout>
        <View style={styles.header}>
            {/* Si on vient du Dashboard, pas de back button nécessaire, c'est un Tab */}
            <Text style={[styles.headerTitle, {color: colors.text}]}>{t('nutrition.title') || "NUTRITION"}</Text>
            {/* Petit bouton shopping pour aller vers la liste */}
            <TouchableOpacity onPress={() => router.push('/features/shopping' as any)}>
                <MaterialCommunityIcons name="cart-outline" size={24} color={colors.text} />
            </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {activePlan ? renderPlan() : renderGenerator()}
        </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 10 },
    headerTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 2 },
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
    
    mealCard: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 8 },
    mealName: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
    macroText: { fontSize: 10, fontWeight: 'bold' },
    
    checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
});