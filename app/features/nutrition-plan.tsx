import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../lib/theme';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useAINutrition } from '../../hooks/useAINutrition'; 
import { ScreenLayout } from '../../components/ui/ScreenLayout';
import { GlassCard } from '../../components/ui/GlassCard';

export default function NutritionPlanScreen() {
  const theme = useTheme();
  const router = useRouter();
  
  // --- CORRECTION 1 : Destructuration correcte du profil ---
  const { userProfile } = useUserProfile(); 
  
  // --- CORRECTION 2 : Noms corrects du hook useAINutrition ---
  const { mealPlan, generateNutrition, isGenerating } = useAINutrition();

  // Alias pour garder la logique du composant intacte sans tout renommer
  const activePlan = mealPlan;

  const [userFocus, setUserFocus] = useState(''); 
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  // --- ACTIONS ---

  const handleGenerate = async () => {
    if (!userFocus.trim()) {
      Alert.alert("Préférences Manquantes", "Précisez votre régime (ex: Keto, Végétarien, Prise de masse...)");
      return;
    }
    
    if (process.env.EXPO_OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      // --- CORRECTION 3 : Arguments corrects pour la mutation ---
      await generateNutrition({
        preferences: userFocus,
        userProfile: userProfile || {}
      });
      
      setUserFocus('');
      Alert.alert("Succès", "Plan nutritionnel généré et activé.");
    } catch (e: any) {
      if (e.message === "FREE_PLAN_ACTIVE") {
        Alert.alert(
            "Plan Actif 🔒",
            "Terminez votre semaine de nutrition actuelle avant d'en générer une nouvelle (Limitation Gratuite).",
            [{ text: "Passer Premium", onPress: () => router.push('/subscription') }, { text: "OK" }]
        );
      } 
      else if (e.message === "FREE_LIMIT_REACHED") {
        Alert.alert(
            "Quota Atteint ⏳",
            "Vous avez déjà généré un plan cette semaine. Revenez dans 7 jours ou passez Premium.",
            [{ text: "Débloquer", onPress: () => router.push('/subscription') }, { text: "Attendre" }]
        );
      }
      else {
        Alert.alert("Erreur", "Le Nutritionniste IA ne répond pas. " + (e.message || ""));
      }
    }
  };

  // --- COMPOSANTS UI ---

  const renderGenerator = () => (
    <GlassCard style={styles.generatorCard}>
      <View style={[styles.iconRing, { borderColor: theme.colors.success + '40', backgroundColor: theme.colors.success + '10' }]}>
        <MaterialCommunityIcons name="food-apple" size={32} color={theme.colors.success} />
      </View>
      <Text style={[styles.title, { color: theme.colors.text }]}>BIO-FUEL AI</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        L'IA calcule vos macros et génère des repas adaptés à votre métabolisme.
      </Text>

      <View style={[styles.inputContainer, { borderColor: theme.colors.border }]}>
        <Text style={[styles.label, { color: theme.colors.success }]}>PRÉFÉRENCES / ALLERGIES</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          placeholder="Ex: Keto, Sans gluten, 2500 kcal..."
          placeholderTextColor={theme.colors.textSecondary}
          value={userFocus}
          onChangeText={setUserFocus}
        />
      </View>

      <TouchableOpacity 
        style={styles.generateBtn} 
        onPress={handleGenerate}
        disabled={isGenerating}
      >
        <LinearGradient
          colors={[theme.colors.success, '#10b981']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.gradientBtn}
        >
          {isGenerating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="chef-hat" size={20} color="#fff" style={{marginRight:8}}/>
              <Text style={styles.btnText}>GÉNÉRER LE MENU</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </GlassCard>
  );

  const renderPlan = () => {
    // Sécurité de base
    if (!activePlan || !activePlan.content) return null;
    const content = activePlan.content;

    // Sécurité structure
    if (!content.days || !Array.isArray(content.days) || content.days.length === 0) {
        return <View><Text style={{color: theme.colors.text}}>Erreur de format plan</Text></View>;
    }

    const currentDay = content.days[activeDayIndex] || content.days[0];
    
    // On s'assure que meals est toujours un tableau, même vide
    const meals = currentDay.meals || [];

    // Calcul rapide des macros du jour (si dispo)
    let totalCals = 0, totalProt = 0;
    
    // --- CORRECTION 4 : Typage explicite (any) pour éviter les erreurs implicites ---
    meals.forEach((m: any) => {
        if (m.items && Array.isArray(m.items)) {
            m.items.forEach((i: any) => {
                totalCals += i.calories || 0;
                totalProt += i.protein || 0;
            });
        }
    });

    return (
      <View>
        {/* Header Plan */}
        <View style={styles.planHeader}>
          <View>
            <Text style={[styles.planTitle, { color: theme.colors.text }]}>{content.title}</Text>
            <Text style={[styles.planSub, { color: theme.colors.success }]}>
              {content.days.length} JOURS • ~{totalCals} KCAL
            </Text>
          </View>
          <TouchableOpacity onPress={() => setUserFocus('Update')} style={styles.regenBtn}>
            <Ionicons name="refresh" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Tabs Jours */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {content.days.map((day: any, index: number) => {
            const isActive = index === activeDayIndex;
            return (
              <TouchableOpacity
                key={index}
                onPress={() => { 
                    if (process.env.EXPO_OS !== 'web') Haptics.selectionAsync(); 
                    setActiveDayIndex(index); 
                }}
                style={[
                  styles.tab,
                  { 
                    backgroundColor: isActive ? theme.colors.success : theme.colors.glass,
                    borderColor: isActive ? theme.colors.success : theme.colors.border
                  }
                ]}
              >
                <Text style={[styles.tabText, { color: isActive ? '#fff' : theme.colors.textSecondary }]}>
                  {day.day || `J${index+1}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Liste Repas */}
        <View style={{ marginTop: 20 }}>
            {meals.length === 0 ? (
                <Text style={{color: theme.colors.textSecondary, fontStyle:'italic'}}>Aucun repas pour ce jour.</Text>
            ) : (
                meals.map((meal: any, index: number) => (
                    <GlassCard key={index} style={{ marginBottom: 15 }}>
                        <View style={styles.mealHeader}>
                            <Text style={[styles.mealTitle, { color: theme.colors.success }]}>{meal.name}</Text>
                            <MaterialCommunityIcons name="silverware-fork-knife" size={16} color={theme.colors.textSecondary} />
                        </View>
                        
                        {(meal.items || []).map((item: any, idx: number) => (
                            <View key={idx} style={styles.foodItem}>
                                <View style={{flex:1}}>
                                    <Text style={[styles.foodName, { color: theme.colors.text }]}>{item.name}</Text>
                                    {item.notes && <Text style={[styles.foodNote, { color: theme.colors.textSecondary }]}>{item.notes}</Text>}
                                </View>
                                <View style={styles.macros}>
                                    <Text style={[styles.macroText, { color: theme.colors.text }]}>{item.calories} kcal</Text>
                                    <Text style={[styles.macroSub, { color: theme.colors.textSecondary }]}>P: {item.protein}g</Text>
                                </View>
                            </View>
                        ))}
                    </GlassCard>
                ))
            )}
        </View>
      </View>
    );
  };

  return (
    <ScreenLayout>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>NUTRITION SYSTEM</Text>
        <View style={{width:24}} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!activePlan ? renderGenerator() : renderPlan()}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  content: { padding: 20, paddingBottom: 100 },
  
  // Generator
  generatorCard: { padding: 24, alignItems: 'center' },
  iconRing: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth:1 },
  title: { fontSize: 20, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
  subtitle: { fontSize: 13, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  inputContainer: { width: '100%', borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 24 },
  label: { fontSize: 10, fontWeight: 'bold', marginBottom: 8, letterSpacing: 1 },
  input: { fontSize: 16, fontWeight: '500' },
  generateBtn: { width: '100%', borderRadius: 16, overflow: 'hidden' },
  gradientBtn: { paddingVertical: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  btnText: { color: '#fff', fontWeight: '900', letterSpacing: 1, fontSize: 14 },

  // Plan
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  planTitle: { fontSize: 24, fontWeight: '900', fontStyle: 'italic', flex: 1 },
  planSub: { fontSize: 10, fontWeight: 'bold', marginTop: 4, letterSpacing: 1 },
  regenBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
  
  tabsScroll: { gap: 10, paddingBottom: 10 },
  tab: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, minWidth: 60, alignItems: 'center' },
  tabText: { fontWeight: 'bold', fontSize: 12 },

  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  mealTitle: { fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase' },
  
  foodItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  foodName: { fontSize: 14, fontWeight: '600' },
  foodNote: { fontSize: 11, fontStyle: 'italic', marginTop: 2 },
  macros: { alignItems: 'flex-end' },
  macroText: { fontWeight: 'bold', fontSize: 14 },
  macroSub: { fontSize: 10, marginTop: 2 }
});