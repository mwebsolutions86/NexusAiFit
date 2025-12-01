import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator, Platform, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase'; // Vérifiez que ce chemin est correct par rapport à votre structure
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
  total_calories?: number;
  meals: MealItem[]; 
};

export default function FoodJournalScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  
  // Données
  const [plan, setPlan] = useState<DayPlan | null>(null); 
  const [status, setStatus] = useState<any>({});
  const [note, setNote] = useState(''); 
  const [isNoteModalVisible, setNoteModalVisible] = useState(false);

  // Couleur principale de ce module (Orange)
  const PRIMARY_COLOR = '#f97316';

  useFocusEffect(
    useCallback(() => {
      loadDailyData();
    }, [date]) 
  );

  const loadDailyData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const dateStr = date.toISOString().split('T')[0];

      // 1. Charger le plan
      const { data: planData } = await supabase
        .from('meal_plans')
        .select('content')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .single();

      if (planData?.content?.days && Array.isArray(planData.content.days)) {
        const dayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
        const days = planData.content.days;
        const finalIndex = dayIndex % days.length;
        const dayPlan = days[finalIndex] || days[0];
        setPlan(dayPlan);
      } else {
        setPlan(null);
      }

      // 2. Charger les logs (Journal)
      const { data: logData, error } = await supabase
        .from('nutrition_logs')
        .select('meals_status, daily_note')
        .eq('user_id', session.user.id)
        .eq('log_date', dateStr)
        .maybeSingle(); // Utiliser maybeSingle pour éviter l'erreur si vide

      if (logData) {
        setStatus(logData.meals_status || {});
        setNote(logData.daily_note || '');
      } else {
        setStatus({});
        setNote('');
      }

    } catch (e) {
      console.log("Erreur chargement journal:", e);
    } finally {
      setLoading(false);
    }
  };

  const toggleMeal = async (mealType: string) => {
    if (!plan || !plan.meals) return;

    const mealExists = plan.meals.some(m => m.type === mealType);
    if (!mealExists) {
        Alert.alert("Erreur", "Ce repas n'est pas prévu pour aujourd'hui.");
        return;
    }

    if (Platform.OS !== 'web') Haptics.selectionAsync();
    
    // Mise à jour optimiste de l'UI
    const newStatus = { ...status, [mealType]: !status[mealType] };
    setStatus(newStatus);
    
    // Sauvegarde en arrière-plan
    await saveLog(newStatus, note);
  };

  // --- SAUVEGARDE ROBUSTE (Check -> Insert/Update) ---
  const saveLog = async (currentStatus: any, currentNote: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
          Alert.alert("Erreur", "Non connecté");
          return;
      }

      const dateStr = date.toISOString().split('T')[0];

      // 1. Vérifier si une ligne existe déjà pour ce jour
      const { data: existingRow } = await supabase
        .from('nutrition_logs')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('log_date', dateStr)
        .maybeSingle();

      let error;

      if (existingRow) {
        // 2a. Si oui, on MET À JOUR (UPDATE)
        const res = await supabase
          .from('nutrition_logs')
          .update({
            meals_status: currentStatus,
            daily_note: currentNote,
            updated_at: new Date()
          })
          .eq('id', existingRow.id);
        error = res.error;
      } else {
        // 2b. Sinon, on CRÉE (INSERT)
        const res = await supabase
          .from('nutrition_logs')
          .insert({
            user_id: session.user.id,
            log_date: dateStr,
            meals_status: currentStatus,
            daily_note: currentNote
          });
        error = res.error;
      }

      if (error) {
        console.error("Erreur Supabase:", error);
        Alert.alert("Erreur de sauvegarde", "Impossible d'enregistrer. Vérifiez votre connexion.");
      }

    } catch (e: any) { 
        console.log("Exception:", e);
    }
  };

  const saveNoteAndClose = async () => {
    setNoteModalVisible(false);
    await saveLog(status, note);
  };

  // --- CALCULS ---
  const calculateConsumed = () => {
    if (!plan || !plan.meals) return 0;
    let total = 0;
    plan.meals.forEach(meal => {
        if (status[meal.type]) {
            total += meal.calories || 0;
        }
    });
    return total;
  };

  const calculateGoal = () => {
    if (!plan || !plan.meals) return 2500;
    if (plan.total_calories && plan.total_calories > 0) {
        return parseInt(plan.total_calories.toString());
    }
    const sum = plan.meals.reduce((acc, meal) => acc + (parseInt(meal.calories?.toString()) || 0), 0);
    return sum > 0 ? sum : 2500;
  };

  const consumed = calculateConsumed();
  const goal = calculateGoal();
  const progress = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  const remaining = goal - consumed;

  const changeDate = (days: number) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + days);
    setDate(newDate);
  };

  const formatDate = (d: Date) => {
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "AUJOURD'HUI";
    
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "HIER";

    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
  };

  // --- STYLES DYNAMIQUES ---
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1 },
    
    auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
    blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.2 },
    
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 10 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    dateControls: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    dateText: { color: theme.colors.text, fontWeight: '900', fontSize: 14, letterSpacing: 1 },
    
    content: { padding: 20 },
    
    summaryCard: { 
        backgroundColor: theme.colors.glass, 
        borderRadius: 24, padding: 20, 
        borderWidth: 1, borderColor: PRIMARY_COLOR + '50', 
        marginBottom: 20,
        shadowColor: theme.isDark ? 'transparent' : '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: theme.isDark ? 0 : 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    summaryTitle: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
    summaryGoal: { color: PRIMARY_COLOR, fontSize: 10, fontWeight: 'bold' },
    
    mainStat: { alignItems: 'center', marginBottom: 15 },
    bigNumber: { color: theme.colors.text, fontSize: 42, fontWeight: '900' },
    unit: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold', marginTop: -5 },
    
    progressBarBg: { height: 8, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 4 },
    remainingText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: 'bold', marginTop: 10, textAlign: 'right' },
    
    noteCard: { 
        backgroundColor: theme.colors.glass, 
        padding: 15, borderRadius: 16, marginBottom: 30,
        borderWidth: 1, borderColor: theme.colors.border,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
    },
    noteTitle: { color: PRIMARY_COLOR, fontSize: 12, fontWeight: 'bold', marginLeft: 10 },
    notePreview: { color: theme.colors.textSecondary, fontSize: 13, fontStyle: 'italic', flex: 1, textAlign: 'right' },
    
    sectionHeader: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginBottom: 10, marginLeft: 5 },
    
    mealCard: { 
        backgroundColor: theme.colors.glass, 
        borderRadius: 20, padding: 15, 
        borderWidth: 1, borderColor: theme.colors.border, 
        marginBottom: 15,
        shadowColor: theme.isDark ? 'transparent' : '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: theme.isDark ? 0 : 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    mealCardChecked: { borderColor: PRIMARY_COLOR, backgroundColor: theme.isDark ? PRIMARY_COLOR + '10' : '#fff5eb' },
    
    mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    mealType: { color: PRIMARY_COLOR, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
    
    checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: theme.colors.textSecondary, justifyContent: 'center', alignItems: 'center' },
    checkboxActive: { backgroundColor: PRIMARY_COLOR, borderColor: PRIMARY_COLOR },
    
    foodName: { color: theme.colors.text, fontSize: 15, fontWeight: 'bold' },
    foodDetails: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 4, flex: 1, paddingRight: 10 },
    foodCals: { color: PRIMARY_COLOR, fontSize: 14, fontWeight: 'bold' },
    
    textDim: { color: theme.colors.textSecondary, textDecorationLine: 'line-through' },
    
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalContent: { 
        backgroundColor: theme.colors.cardBg, 
        borderTopLeftRadius: 30, borderTopRightRadius: 30, 
        padding: 25, height: '50%', 
        borderTopWidth: 1, borderTopColor: theme.colors.border 
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { color: theme.colors.text, fontSize: 16, fontWeight: 'bold' },
    noteInput: { 
        backgroundColor: theme.colors.bg, 
        color: theme.colors.text, 
        padding: 15, borderRadius: 15, 
        height: 150, textAlignVertical: 'top', fontSize: 16,
        borderWidth: 1, borderColor: theme.colors.border
    },
    
    emptyState: { alignItems: 'center', marginTop: 40 },
    emptyText: { color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 20, fontWeight: 'bold' },
    generateBtn: { padding: 15, backgroundColor: PRIMARY_COLOR, borderRadius: 12, width: '100%', alignItems: 'center' },
    generateText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  });

  const MealItemCard = ({ type }: { type: string }) => {
    const isChecked = status[type] === true;
    const plannedMeal = plan?.meals.find((m: MealItem) => m.type === type);

    return (
        <TouchableOpacity 
            key={type}
            style={[styles.mealCard, isChecked && styles.mealCardChecked]} 
            onPress={() => toggleMeal(type)}
            activeOpacity={0.9}
        >
            <View style={styles.mealHeader}>
                <Text style={styles.mealType}>{type.toUpperCase()}</Text>
                <View style={[styles.checkbox, isChecked && styles.checkboxActive]}>
                    {isChecked && <MaterialCommunityIcons name="check" size={16} color="#fff" />}
                </View>
            </View>
            
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end'}}>
                <View style={{flex: 1}}>
                    <Text style={[styles.foodName, isChecked && styles.textDim]}>
                        {plannedMeal ? plannedMeal.name : "Rien de prévu"}
                    </Text>
                    
                    {plannedMeal?.ingredients && Array.isArray(plannedMeal.ingredients) && (
                        <Text style={[styles.foodDetails, isChecked && styles.textDim]} numberOfLines={1}>
                             {plannedMeal.ingredients.slice(0, 3).join(', ')}...
                        </Text>
                    )}

                </View>
                <Text style={[styles.foodCals, isChecked && styles.textDim]}>
                    {plannedMeal ? `${plannedMeal.calories} kcal` : '--'}
                </Text>
            </View>
            
        </TouchableOpacity>
    );
  };

  if (loading) {
      return <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}><ActivityIndicator color={PRIMARY_COLOR} size="large" /></View>
  }

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      
      {theme.isDark && (
        <View style={styles.auroraBg}>
            <View style={[styles.blob, { top: -100, left: -50, backgroundColor: 'rgba(249, 115, 22, 0.15)' }]} /> 
            <View style={[styles.blob, { bottom: 0, right: -50, backgroundColor: 'rgba(249, 115, 22, 0.1)' }]} />
        </View>
      )}

      <SafeAreaView style={styles.safeArea}>
        
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            
            <View style={styles.dateControls}>
                <TouchableOpacity onPress={() => changeDate(-1)}>
                    <MaterialCommunityIcons name="chevron-left" size={24} color={theme.colors.textSecondary} />
                </TouchableOpacity>
                <Text style={styles.dateText}>{formatDate(date)}</Text>
                <TouchableOpacity onPress={() => changeDate(1)} disabled={date.toDateString() === new Date().toDateString()}>
                    <MaterialCommunityIcons 
                        name="chevron-right" 
                        size={24} 
                        color={date.toDateString() === new Date().toDateString() ? theme.colors.border : theme.colors.textSecondary} 
                    />
                </TouchableOpacity>
            </View>
            
            <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            
            <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                    <Text style={styles.summaryTitle}>TOTAL JOURNALIER</Text>
                    <Text style={styles.summaryGoal}>OBJ: {goal} KCAL</Text>
                </View>
                
                <View style={styles.mainStat}>
                    <Text style={styles.bigNumber}>{consumed}</Text>
                    <Text style={styles.unit}>KCAL CONSOMMÉES</Text>
                </View>

                <View style={styles.progressBarBg}>
                    <LinearGradient 
                        colors={['#f97316', '#fb923c']} 
                        start={{x:0, y:0}} end={{x:1, y:0}} 
                        style={[styles.progressBarFill, { width: `${progress * 100}%` }]} 
                    />
                </View>
                 <Text style={styles.remainingText}>
                        {remaining > 0 ? `${remaining} RESTANTES` : `${Math.abs(remaining)} EXCÈS`}
                </Text>
            </View>

            <TouchableOpacity style={styles.noteCard} onPress={() => setNoteModalVisible(true)}>
                <View style={{flexDirection:'row', alignItems:'center', gap: 10}}>
                    <MaterialCommunityIcons name="notebook-edit" size={20} color={PRIMARY_COLOR} />
                    <Text style={styles.noteTitle}>NOTE DU JOUR</Text>
                </View>
                <Text style={styles.notePreview} numberOfLines={1}>
                    {note ? note : "Ajouter une observation..."}
                </Text>
            </TouchableOpacity>

            {plan ? (
                <View style={{marginBottom: 20}}>
                    <Text style={styles.sectionHeader}>PLAN DU COACH</Text>
                    {['Petit Déj', 'Déjeuner', 'Collation', 'Dîner'].map(type => (
                        <MealItemCard key={type} type={type} />
                    ))}
                </View>
            ) : (
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="food-off" size={48} color={theme.colors.textSecondary} />
                    <Text style={styles.emptyText}>Aucun plan actif pour ce jour.</Text>
                    <TouchableOpacity style={styles.generateBtn} onPress={() => router.push('/(tabs)/nutrition')}>
                        <Text style={styles.generateText}>CRÉER UNE STRATÉGIE</Text>
                    </TouchableOpacity>
                </View>
            )}
            <View style={{ height: 100 }} />
        </ScrollView>

        <Modal animationType="slide" transparent={true} visible={isNoteModalVisible} onRequestClose={saveNoteAndClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>OBSERVATIONS</Text>
                        <TouchableOpacity onPress={saveNoteAndClose}>
                            <MaterialCommunityIcons name="check" size={24} color={PRIMARY_COLOR} />
                        </TouchableOpacity>
                    </View>
                    <TextInput 
                        style={styles.noteInput} 
                        multiline 
                        placeholder="Ex: J'avais très faim après le sport..." 
                        placeholderTextColor={theme.colors.textSecondary}
                        value={note}
                        onChangeText={setNote}
                    />
                </View>
            </View>
        </Modal>

      </SafeAreaView>
    </View>
  );
}