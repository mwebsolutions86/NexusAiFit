import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator, Platform, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

// --- TYPES (Doit correspondre aux données du plan) ---
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

export default function FoodJournalScreen() {
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  
  // Données
  const [plan, setPlan] = useState<DayPlan | null>(null); 
  const [status, setStatus] = useState<any>({}); // État des checks (ex: { 'Petit Déj': true })
  const [note, setNote] = useState(''); 
  const [isNoteModalVisible, setNoteModalVisible] = useState(false);

  // Recharger les données à chaque fois qu'on change de date
  useFocusEffect(
    useCallback(() => {
      loadDailyData();
    }, [date]) 
  );

  // --- CHARGEMENT DES DONNÉES ---
  const loadDailyData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const dateStr = date.toISOString().split('T')[0];

      // 1. Récupérer le PLAN ACTIF (Plan 7 jours)
      const { data: planData } = await supabase
        .from('meal_plans')
        .select('content')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .single();

      if (planData?.content?.days && Array.isArray(planData.content.days)) {
        // Logique intelligente pour trouver le bon jour du plan
        const dayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1; // 0=Dimanche -> 6
        const days = planData.content.days;
        const finalIndex = dayIndex % days.length;
        
        const dayPlan = days[finalIndex] || days[0]; // Jour du plan
        setPlan(dayPlan);
      } else {
        setPlan(null);
      }

      // 2. Récupérer les LOGS du jour
      const { data: logData } = await supabase
        .from('nutrition_logs')
        .select('meals_status, daily_note')
        .eq('user_id', session.user.id)
        .eq('log_date', dateStr)
        .single();

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

  // --- ACTIONS ---

  const toggleMeal = async (mealType: string) => {
    if (!plan || !plan.meals) return;

    // S'assurer que le repas existe dans le plan avant de cocher
    const mealExists = plan.meals.some(m => m.type === mealType);
    if (!mealExists) {
        Alert.alert("Erreur", "Ce repas n'est pas prévu pour aujourd'hui.");
        return;
    }

    if (Platform.OS !== 'web') Haptics.selectionAsync();
    
    const newStatus = { ...status, [mealType]: !status[mealType] };
    setStatus(newStatus);
    
    await saveLog(newStatus, note);
  };

  const saveLog = async (currentStatus: any, currentNote: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const dateStr = date.toISOString().split('T')[0];

      const updates = {
        user_id: session.user.id,
        log_date: dateStr,
        meals_status: currentStatus,
        daily_note: currentNote,
        updated_at: new Date(),
      };

      await supabase
        .from('nutrition_logs')
        .upsert(updates, { onConflict: 'user_id, log_date' });

    } catch (e) { console.log(e); }
  };

  const saveNoteAndClose = async () => {
    setNoteModalVisible(false);
    await saveLog(status, note);
  };

  // --- CALCULS ---
  const calculateConsumed = () => {
    if (!plan || !plan.meals) return 0;
    let total = 0;
    
    // Filtre les repas planifiés et additionne les calories si le repas est coché dans 'status'
    plan.meals.forEach(meal => {
        if (status[meal.type]) {
            total += meal.calories || 0;
        }
    });
    return total;
  };

  const consumed = calculateConsumed();
  const goal = plan?.total_calories ? parseInt(plan.total_calories.toString()) : 2500;
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

  // --- RENDU DÉTAILLÉ ---
  const mealTypes = ['Petit Déj', 'Déjeuner', 'Collation', 'Dîner'];

  const MealItemCard = ({ type, meal }: { type: string, meal?: MealItem | undefined }) => {
    const isChecked = status[type] === true;

    // Cherche le repas prévu pour ce type
    const plannedMeal = plan?.meals.find((m: MealItem) => m.type === type);
    const item = plannedMeal || meal; // Utilise le planifié ou le repas passé en prop

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
                    {isChecked && <MaterialCommunityIcons name="check" size={16} color="#000" />}
                </View>
            </View>
            
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end'}}>
                <View style={{flex: 1}}>
                    <Text style={[styles.foodName, isChecked && styles.textDim]}>
                        {plannedMeal ? plannedMeal.name : "Rien de prévu"}
                    </Text>
                    
                    {/* Affichage des Ingrédients du plan */}
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
      return <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}><ActivityIndicator color="#f97316" size="large" /></View>
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.auroraBg}>
          <View style={[styles.blob, { top: -100, left: -50, backgroundColor: 'rgba(249, 115, 22, 0.15)' }]} /> 
          <View style={[styles.blob, { bottom: 0, right: -50, backgroundColor: 'rgba(249, 115, 22, 0.1)' }]} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.dateControls}>
                <TouchableOpacity onPress={() => changeDate(-1)}>
                    <MaterialCommunityIcons name="chevron-left" size={24} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
                <Text style={styles.dateText}>{formatDate(date)}</Text>
                <TouchableOpacity onPress={() => changeDate(1)} disabled={date.toDateString() === new Date().toDateString()}>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={date.toDateString() === new Date().toDateString() ? '#444' : 'rgba(255,255,255,0.5)'} />
                </TouchableOpacity>
            </View>
            
            <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            
            {/* RÉSUMÉ CALORIQUE */}
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

            {/* NOTE DU JOUR */}
            <TouchableOpacity style={styles.noteCard} onPress={() => setNoteModalVisible(true)}>
                <View style={{flexDirection:'row', alignItems:'center', gap: 10}}>
                    <MaterialCommunityIcons name="notebook-edit" size={20} color="#f97316" />
                    <Text style={styles.noteTitle}>NOTE DU JOUR</Text>
                </View>
                <Text style={styles.notePreview} numberOfLines={1}>
                    {note ? note : "Ajouter une observation, un ressenti..."}
                </Text>
            </TouchableOpacity>

            {/* LISTE DES REPAS DU PLAN */}
            {plan ? (
                <View style={{marginBottom: 20}}>
                    <Text style={styles.sectionHeader}>PLAN DU COACH</Text>
                    {mealTypes.map(type => (
                        <MealItemCard key={type} type={type} />
                    ))}
                </View>
            ) : (
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="food-off" size={48} color="rgba(255,255,255,0.2)" />
                    <Text style={styles.emptyText}>Aucun plan actif pour ce jour.</Text>
                    <TouchableOpacity style={styles.generateBtn} onPress={() => router.push('/(tabs)/nutrition')}>
                        <Text style={styles.generateText}>CRÉER UNE STRATÉGIE</Text>
                    </TouchableOpacity>
                </View>
            )}
            <View style={{ height: 100 }} />
        </ScrollView>

        {/* MODAL NOTE */}
        <Modal animationType="slide" transparent={true} visible={isNoteModalVisible} onRequestClose={saveNoteAndClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>OBSERVATIONS</Text>
                        <TouchableOpacity onPress={saveNoteAndClose}>
                            <MaterialCommunityIcons name="check" size={24} color="#f97316" />
                        </TouchableOpacity>
                    </View>
                    <TextInput 
                        style={styles.noteInput} 
                        multiline 
                        placeholder="Ex: J'avais très faim après le sport..." 
                        placeholderTextColor="#666"
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

const MealItemCard = ({ type }: { type: string }) => {
    const { plan, status, toggleMeal } = useMealContext();
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
                    {isChecked && <MaterialCommunityIcons name="check" size={16} color="#000" />}
                </View>
            </View>
            
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end'}}>
                <View style={{flex: 1}}>
                    <Text style={[styles.foodName, isChecked && styles.textDim]} numberOfLines={1}>
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

// Context pour partager l'état entre composants (meilleure approche que l'accès au prototype)
const MealContext = React.createContext<{
    plan: DayPlan | null;
    status: any;
    toggleMeal: (mealType: string) => Promise<void>;
} | null>(null);

const useMealContext = () => {
    const context = React.useContext(MealContext);
    if (!context) {
        throw new Error('useMealContext must be used within a MealProvider');
    }
    return context;
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },
  auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
  blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  dateControls: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  dateText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  content: { padding: 20 },
  summaryCard: { backgroundColor: 'rgba(20, 20, 30, 0.6)', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.3)', marginBottom: 20 },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  summaryTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  summaryGoal: { color: '#f97316', fontSize: 10, fontWeight: 'bold' },
  mainStat: { alignItems: 'center', marginBottom: 15 },
  bigNumber: { color: '#fff', fontSize: 42, fontWeight: '900' },
  unit: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold', marginTop: -5 },
  progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  remainingText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginTop: 10, textAlign: 'right' },
  noteCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 16, marginBottom: 30 },
  noteTitle: { color: '#f97316', fontSize: 12, fontWeight: 'bold' },
  notePreview: { color: 'rgba(255,255,255,0.5)', marginTop: 5, fontSize: 13, fontStyle: 'italic' },
  sectionHeader: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginBottom: 10, marginLeft: 5 },
  mealCard: { backgroundColor: 'rgba(20, 20, 30, 0.6)', borderRadius: 20, padding: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 15 },
  mealCardChecked: { borderColor: 'rgba(249, 115, 22, 0.5)', backgroundColor: 'rgba(249, 115, 22, 0.05)' },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  mealType: { color: '#f97316', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#444', justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: '#f97316', borderColor: '#f97316' },
  foodName: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: 'bold' },
  foodDetails: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4, flex: 1, paddingRight: 10 },
  foodCals: { color: '#f97316', fontSize: 14, fontWeight: 'bold' },
  textDim: { color: '#666', textDecorationLine: 'line-through' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#111', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, height: '50%', borderTopWidth: 1, borderTopColor: '#333' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  noteInput: { backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', padding: 15, borderRadius: 15, height: 150, textAlignVertical: 'top', fontSize: 16 },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 20, fontWeight: 'bold' },
  generateBtn: { padding: 15, backgroundColor: '#f97316', borderRadius: 12, width: '100%', alignItems: 'center' },
  generateText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
});