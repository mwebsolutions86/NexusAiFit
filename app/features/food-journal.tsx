import { router } from 'expo-router';
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../lib/theme';
import { useAINutrition } from '../../hooks/useAINutrition'; // Le Plan
import { useNutritionLog } from '../../hooks/useNutritionLog'; // L'Historique du jour
import { useNutritionLogger } from '../../hooks/useNutritionLogger'; // L'Action de sauvegarde
import { ScreenLayout } from '../../components/ui/ScreenLayout';
import { GlassCard } from '../../components/ui/GlassCard';

export default function FoodJournalScreen() {
  const theme = useTheme();
  const router = useRouter();
  
  // 1. Dates
  const today = new Date().toISOString().split('T')[0];
  
  // 2. Data Fetching
  const { activePlan, isLoadingPlan } = useAINutrition();
  const { data: todayLog, isLoading: isLoadingLog } = useNutritionLog(today);
  const { saveLog, isSaving } = useNutritionLogger();

  // 3. Local State (Gestion des checks)
  // On stocke les IDs ou noms des items cochés
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // 4. Effet de synchronisation
  // Quand le log du jour arrive, on pré-coche les items déjà mangés
  useEffect(() => {
    if (todayLog?.meals_status) {
        const initialChecks: Record<string, boolean> = {};
        todayLog.meals_status.forEach((item: any) => {
            // On utilise une clé composite "Repas_Item" pour identifier unique
            const key = `${item.mealName}_${item.name}`;
            initialChecks[key] = true;
        });
        setCheckedItems(initialChecks);
    }
  }, [todayLog]);

  // 5. Calculs Temps Réel (Mémoïsés pour la perf)
  const stats = useMemo(() => {
    let currentCals = 0;
    let currentProt = 0;
    let targetCals = 0;
    let targetProt = 0;

    if (activePlan?.content?.days) {
        // On prend le Jour 1 par défaut ou on pourrait gérer le cycle de jours
        const dayPlan = activePlan.content.days[0]; 
        
        dayPlan.meals.forEach(meal => {
            meal.items.forEach(item => {
                targetCals += item.calories;
                targetProt += item.protein;

                const key = `${meal.name}_${item.name}`;
                if (checkedItems[key]) {
                    currentCals += item.calories;
                    currentProt += item.protein;
                }
            });
        });
    }

    return { currentCals, currentProt, targetCals, targetProt };
  }, [activePlan, checkedItems]);

  // --- ACTIONS ---

  const toggleItem = (mealName: string, item: any) => {
    if (process.env.EXPO_OS !== 'web') Haptics.selectionAsync();
    
    const key = `${mealName}_${item.name}`;
    const newChecked = { ...checkedItems, [key]: !checkedItems[key] };
    setCheckedItems(newChecked);

    // Sauvegarde "Optimiste" / Debounce ou Manuelle ?
    // Pour l'instant, on propose un bouton de sauvegarde pour éviter trop d'appels,
    // mais une UX moderne sauvegarderait après 1s d'inactivité.
  };

  const handleSave = async () => {
    if (!activePlan?.content?.days) return;

    if (process.env.EXPO_OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Reconstruire la liste des items mangés (Snapshot)
    const dayPlan = activePlan.content.days[0];
    const eatenItems: any[] = [];

    dayPlan.meals.forEach(meal => {
        meal.items.forEach(item => {
            const key = `${meal.name}_${item.name}`;
            if (checkedItems[key]) {
                eatenItems.push({
                    name: item.name,
                    calories: item.calories,
                    protein: item.protein,
                    mealName: meal.name,
                    eatenAt: new Date().toISOString()
                });
            }
        });
    });

    try {
        await saveLog({
            logDate: today,
            mealsStatus: eatenItems,
            totalCalories: stats.currentCals,
            totalProtein: stats.currentProt
        });
        Alert.alert("Journal Mis à Jour", "Vos données nutritionnelles ont été synchronisées.");
    } catch (e) {
        Alert.alert("Erreur", "Impossible de sauvegarder.");
    }
  };

  // --- RENDER ---

  const renderContent = () => {
    if (!activePlan?.content) {
        return (
            <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="chef-hat" size={48} color={theme.colors.textSecondary} />
                <Text style={[styles.emptyText, {color: theme.colors.text}]}>Aucun plan nutritionnel actif.</Text>
                <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/features/nutrition-plan' as any)}>
                    <Text style={styles.btnText}>Générer un plan avec l'IA</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const dayPlan = activePlan.content.days[0];

    return (
        <View>
            {/* Jauges Résumé */}
            <GlassCard style={styles.statsCard}>
                <View style={styles.statRow}>
                    <View style={styles.statCol}>
                        <Text style={[styles.statLabel, {color: theme.colors.textSecondary}]}>CALORIES</Text>
                        <Text style={[styles.statValue, {color: theme.colors.text}]}>
                            {stats.currentCals} <Text style={[styles.statTarget, {color: theme.colors.textSecondary}]}>/ {stats.targetCals}</Text>
                        </Text>
                        <View style={[styles.barBg, {backgroundColor: theme.colors.border}]}>
                            <View style={[styles.barFill, {
                                backgroundColor: theme.colors.warning, 
                                width: `${Math.min((stats.currentCals / (stats.targetCals || 1)) * 100, 100)}%`
                            }]} />
                        </View>
                    </View>
                    <View style={styles.statCol}>
                        <Text style={[styles.statLabel, {color: theme.colors.textSecondary}]}>PROTÉINES</Text>
                        <Text style={[styles.statValue, {color: theme.colors.text}]}>
                            {stats.currentProt}g <Text style={[styles.statTarget, {color: theme.colors.textSecondary}]}>/ {stats.targetProt}g</Text>
                        </Text>
                         <View style={[styles.barBg, {backgroundColor: theme.colors.border}]}>
                            <View style={[styles.barFill, {
                                backgroundColor: theme.colors.success, 
                                width: `${Math.min((stats.currentProt / (stats.targetProt || 1)) * 100, 100)}%`
                            }]} />
                        </View>
                    </View>
                </View>
            </GlassCard>

            {/* Liste des Repas */}
            {dayPlan.meals.map((meal: any, idx: number) => (
                <View key={idx} style={styles.mealSection}>
                    <Text style={[styles.mealTitle, {color: theme.colors.primary}]}>{meal.name}</Text>
                    
                    {meal.items.map((item: any, i: number) => {
                         const key = `${meal.name}_${item.name}`;
                         const isChecked = !!checkedItems[key];

                         return (
                            <TouchableOpacity 
                                key={i} 
                                style={[styles.foodRow, {borderBottomColor: theme.colors.border}]}
                                onPress={() => toggleItem(meal.name, item)}
                                activeOpacity={0.7}
                            >
                                <View style={[
                                    styles.checkbox, 
                                    { borderColor: isChecked ? theme.colors.success : theme.colors.textSecondary },
                                    isChecked && { backgroundColor: theme.colors.success }
                                ]}>
                                    {isChecked && <Ionicons name="checkmark" size={14} color="#fff" />}
                                </View>
                                
                                <View style={{flex: 1}}>
                                    <Text style={[styles.foodName, {color: theme.colors.text, textDecorationLine: isChecked ? 'line-through' : 'none', opacity: isChecked ? 0.6 : 1}]}>
                                        {item.name}
                                    </Text>
                                    <Text style={[styles.foodMacros, {color: theme.colors.textSecondary}]}>
                                        {item.calories} kcal • {item.protein}g prot
                                    </Text>
                                </View>
                            </TouchableOpacity>
                         );
                    })}
                </View>
            ))}
        </View>
    );
  };

  return (
    <ScreenLayout>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>JOURNAL (BÊTA)</Text>
        <TouchableOpacity 
            onPress={handleSave} 
            disabled={isSaving}
            style={[styles.saveBtn, {backgroundColor: theme.colors.success + '20'}]}
        >
           {isSaving ? <ActivityIndicator color={theme.colors.success} /> : <Ionicons name="save" size={20} color={theme.colors.success} />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {(isLoadingPlan || isLoadingLog) ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={{marginTop: 50}} />
        ) : renderContent()}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  saveBtn: { padding: 10, borderRadius: 12 },
  content: { padding: 20, paddingBottom: 100 },
  
  emptyContainer: { alignItems: 'center', marginTop: 50, gap: 15 },
  emptyText: { fontSize: 16 },
  createBtn: { paddingVertical: 12, paddingHorizontal: 24, backgroundColor: '#10b981', borderRadius: 24 },
  btnText: { color: '#fff', fontWeight: 'bold' },

  statsCard: { padding: 16, marginBottom: 25 },
  statRow: { flexDirection: 'row', gap: 20 },
  statCol: { flex: 1 },
  statLabel: { fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  statValue: { fontSize: 18, fontWeight: '900', marginBottom: 8 },
  statTarget: { fontSize: 12, fontWeight: 'normal' },
  barBg: { height: 6, borderRadius: 3, width: '100%', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },

  mealSection: { marginBottom: 20 },
  mealTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  foodRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, marginRight: 15, justifyContent: 'center', alignItems: 'center' },
  foodName: { fontSize: 15, fontWeight: '500' },
  foodMacros: { fontSize: 12, marginTop: 2 }
});