import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Dimensions, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { generateMealPlanJSON } from '../../lib/groq';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';

const { width } = Dimensions.get('window');

// --- TYPES ---
type MealItem = {
  type: string;
  name: string;
  calories: number;
  macros: string;
  ingredients: string[];
  prep: string;
};

type DayPlan = {
  day: string;
  total_calories: number;
  meals: MealItem[];
};

type NutritionPlan = {
  title: string;
  target_calories: number;
  days: DayPlan[];
};

export default function NutritionScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activePlan, setActivePlan] = useState<NutritionPlan | null>(null);
  const [preferences, setPreferences] = useState('');
  const [dailyStats, setDailyStats] = useState({ target: 0 });
  const [activeTab, setActiveTab] = useState(0);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  React.useEffect(() => {
    if (activePlan?.days?.[activeTab]) {
        const day = activePlan.days[activeTab];
        let total = 0;
        if (day.total_calories) total = day.total_calories;
        else day.meals?.forEach((m:any) => total += parseInt(m.calories) || 0);
        setDailyStats({ target: total });
    }
  }, [activePlan, activeTab]);

  const fetchData = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.replace('/auth/index'); return; }

        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (profile) setUserProfile(profile);

        const { data: planData } = await supabase.from('meal_plans').select('content').eq('user_id', session.user.id).eq('is_active', true).order('created_at', { ascending: false }).limit(1).single();

        if (planData?.content?.days) setActivePlan(planData.content);
        else setActivePlan(null);
    } catch (e) { console.log(e); }
  };

  const handleGenerate = async () => {
    setLoading(true);
    const dietContext = preferences.trim() || `Objectif: ${userProfile?.goal || 'Santé'}`;
    try {
        const mealJson = await generateMealPlanJSON(userProfile, dietContext);
        if (mealJson && mealJson.days && mealJson.days.length > 0) {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            
            await supabase.from('meal_plans').update({ is_active: false }).eq('user_id', session.user.id);
            
            const { error } = await supabase.from('meal_plans').insert({
                user_id: session.user.id, content: mealJson, title: mealJson.title || "Plan 7 Jours", is_active: true
            });
            if (!error) { 
                await fetchData(); 
                setPreferences(''); 
                Alert.alert("Succès", "Votre plan 7 jours est prêt !");
            } else {
                 Alert.alert("Erreur", error.message);
            }
        } else {
             throw new Error("L'IA n'a pas pu générer un plan valide.");
        }
    } catch (e) { Alert.alert("Erreur IA", "Réessayez, le coach réfléchit."); }
    setLoading(false);
  };

  // --- STYLES DYNAMIQUES ---
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    
    topBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingBottom: 10 },
    screenTitle: { color: theme.colors.text, fontWeight: '900', letterSpacing: 2 },
    
    // Generator Card
    genCard: { 
        backgroundColor: theme.colors.glass, 
        padding: 20, 
        borderRadius: 20, 
        alignItems: 'center', 
        borderWidth: 1, 
        borderColor: theme.colors.border,
        shadowColor: theme.isDark ? 'transparent' : '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: theme.isDark ? 0 : 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    genTitle: { color: theme.colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
    genDesc: { color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 20 },
    
    input: { 
        width: '100%', 
        backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : '#f0f2f5', 
        color: theme.colors.text, 
        padding: 15, 
        borderRadius: 10, 
        marginBottom: 20, 
        minHeight: 60, 
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: theme.colors.border
    },
    
    btn: { backgroundColor: theme.colors.accent, width: '100%', padding: 15, borderRadius: 10, alignItems: 'center' },
    btnText: { fontWeight: '900', color: '#000' }, // Texte noir sur le vert pour contraste

    // Header Plan
    headerCard: { 
        padding: 20, 
        borderRadius: 15, 
        marginBottom: 20, 
        borderWidth: 1, 
        borderColor: theme.colors.accent + '50', // Vert semi-transparent
        backgroundColor: theme.colors.glass
    },
    label: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
    value: { color: theme.colors.accent, fontSize: 18, fontWeight: '900' },
    
    tabsScroll: { marginBottom: 20, paddingLeft: 20 },
    tab: { 
        paddingVertical: 8, 
        paddingHorizontal: 15, 
        backgroundColor: theme.colors.cardBg, 
        borderRadius: 20, 
        marginRight: 10, 
        minWidth: 40, 
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border
    },
    activeTab: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
    tabText: { color: theme.colors.textSecondary, fontWeight: 'bold', fontSize: 12 },
    activeTabText: { color: '#000' },

    dayTitle: { color: theme.colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 15, marginLeft: 5 },
    
    // Meal Card
    mealCard: { 
        backgroundColor: theme.colors.glass, 
        padding: 15, 
        borderRadius: 15, 
        marginBottom: 15, 
        borderLeftWidth: 3, 
        borderLeftColor: theme.colors.accent,
        borderWidth: 1,
        borderColor: theme.colors.border,
        shadowColor: theme.isDark ? 'transparent' : '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: theme.isDark ? 0 : 0.03,
        shadowRadius: 5,
        elevation: 1,
    },
    mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 5 },
    mealType: { color: theme.colors.accent, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
    mealName: { color: theme.colors.text, fontSize: 14, fontWeight: 'bold' },
    mealCals: { color: theme.colors.textSecondary, fontWeight: 'bold' },

    mealDetails: { marginTop: 10, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 10 },
    detailsTitle: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 5 },
    detailText: { color: theme.colors.text, fontSize: 13, lineHeight: 18 },
    
    ingredientsList: { paddingLeft: 10 },
    ingredientRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 8 },
    dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: theme.colors.accent },

    macrosBadge: { 
        backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : '#f0f9ff', 
        padding: 5, 
        borderRadius: 8, 
        alignSelf: 'flex-start', 
        marginTop: 10,
        borderWidth: 1,
        borderColor: theme.colors.border
    },
    macrosText: { color: theme.colors.accent, fontSize: 10, fontWeight: 'bold' },

    regenBtn: { padding: 15, alignItems: 'center', marginTop: 20 },
    regenText: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold' },
    
    journalLink: { marginTop: 10, borderRadius: 16, overflow: 'hidden' },
    journalGradient: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    journalText: { color: '#fff', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  });

  const MealCard = ({ meal }: { meal: MealItem }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
        <View style={styles.mealCard}>
            <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
                <View style={styles.mealHeader}>
                    <View>
                        <Text style={styles.mealType}>{meal.type}</Text>
                        <Text style={styles.mealName}>{meal.name}</Text>
                    </View>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                        <Text style={styles.mealCals}>{meal.calories} kcal</Text>
                        <MaterialCommunityIcons 
                            name={isExpanded ? "chevron-up" : "chevron-down"} 
                            size={20} 
                            color={theme.colors.textSecondary} 
                        />
                    </View>
                </View>
            </TouchableOpacity>

            {isExpanded && (
                <View style={styles.mealDetails}>
                    <Text style={styles.detailsTitle}>INGRÉDIENTS :</Text>
                    <View style={styles.ingredientsList}>
                        {Array.isArray(meal.ingredients) && meal.ingredients.map((ing, i) => (
                            <View key={i} style={styles.ingredientRow}>
                                <View style={styles.dot} />
                                <Text style={styles.detailText}>{ing}</Text>
                            </View>
                        ))}
                    </View>

                    <Text style={[styles.detailsTitle, {marginTop: 15}]}>PRÉPARATION :</Text>
                    <Text style={styles.detailText}>{meal.prep}</Text>
                    
                    <View style={styles.macrosBadge}>
                        <Text style={styles.macrosText}>MACROS: {meal.macros}</Text>
                    </View>
                </View>
            )}
        </View>
    );
  };

  const renderActivePlan = () => {
    if (!activePlan?.days?.[activeTab]) return null;
    const currentDay = activePlan.days[activeTab];

    return (
      <View>
        <LinearGradient 
            colors={theme.isDark 
                ? ['rgba(74, 222, 128, 0.1)', 'rgba(74, 222, 128, 0.02)'] 
                : ['rgba(16, 185, 129, 0.1)', 'rgba(255, 255, 255, 0.5)']} 
            style={styles.headerCard}
        >
            <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                <Text style={styles.label}>TOTAL JOUR</Text>
                <Text style={styles.value}>{dailyStats.target} KCAL</Text>
            </View>
            <Text style={{color: theme.colors.textSecondary, fontSize:10, marginTop:5}}>{activePlan.title}</Text>
        </LinearGradient>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
            {activePlan.days.map((day:any, i:number) => (
                <TouchableOpacity key={i} onPress={() => setActiveTab(i)} style={[styles.tab, activeTab===i && styles.activeTab]}>
                    <Text style={[styles.tabText, activeTab===i && styles.activeTabText]}>
                        J{i + 1}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>

        <View>
            <Text style={styles.dayTitle}>{currentDay.day}</Text>
            {currentDay.meals?.map((meal: MealItem, index: number) => (
                <MealCard key={index} meal={meal} />
            ))}
        </View>
        
        <TouchableOpacity style={styles.regenBtn} onPress={handleGenerate}>
            <Text style={styles.regenText}>GÉNÉRER UN NOUVEAU PLAN (7 JOURS)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.journalLink} onPress={() => router.push('/features/food-journal' as any)}>
            <LinearGradient colors={['#f97316', '#ea580c']} style={styles.journalGradient}>
                <Text style={styles.journalText}>OUVRIR LE JOURNAL QUOTIDIEN</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
            </LinearGradient>
        </TouchableOpacity>

        <View style={{height:100}}/>
      </View>
    );
  };

  const renderGenerator = () => (
    <View style={styles.genCard}>
        <MaterialCommunityIcons name="food-apple" size={40} color={theme.colors.accent} style={{marginBottom:15}} />
        <Text style={styles.genTitle}>CRÉATION DU PLAN 7 JOURS</Text>
        <Text style={styles.genDesc}>L'IA va générer une semaine complète avec recettes et listes de courses intégrées.</Text>
        <TextInput 
            style={styles.input} 
            placeholder="Préférences (ex: Vegan, Pas de poisson...)" 
            placeholderTextColor={theme.colors.textSecondary}
            value={preferences} onChangeText={setPreferences} 
            multiline
        />
        <TouchableOpacity style={styles.btn} onPress={handleGenerate} disabled={loading}>
            {loading ? <ActivityIndicator color="#000"/> : <Text style={styles.btnText}>LANCER L'ANALYSE</Text>}
        </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <SafeAreaView style={{flex:1}}>
        <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.text}/>
            </TouchableOpacity>
            <Text style={styles.screenTitle}>FUEL STRATEGY</Text>
            <View style={{width:24}}/>
        </View>
        <ScrollView contentContainerStyle={{padding:20}} showsVerticalScrollIndicator={false}>
            {activePlan ? renderActivePlan() : renderGenerator()}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}