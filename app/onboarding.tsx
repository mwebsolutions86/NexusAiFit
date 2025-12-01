import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../lib/theme';

// Types pour les données
type OnboardingData = {
  full_name: string;
  gender: 'male' | 'female' | 'other' | '';
  age: string;
  weight: string;
  height: string;
  goal: 'lose_weight' | 'muscle' | 'strength'| 'endurance' | 'flexibility' | 'health' | '';
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete' | '';
  experience_level: 'beginner' | 'intermediate' | 'advanced' | '';
  training_days: number;
  dietary_pref: string[]; 
  equipment: 'gym' | 'home_basic' | 'home_none' | '';
};

// --- COMPOSANTS UI INTERNES ---

const OptionCard = ({ selected, onPress, icon, title, subtitle }: any) => {
  const theme = useTheme();
  return (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.8}
      style={[
        styles(theme).glassCard, 
        selected && styles(theme).selectedCard,
        { width: '100%', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 }
      ]}
    >
      <View style={[styles(theme).cardIcon, selected && { backgroundColor: theme.colors.primary }]}>
        <MaterialCommunityIcons 
            name={icon} 
            size={24} 
            color={selected ? '#fff' : theme.colors.text} 
        />
      </View>
      <View style={{ marginLeft: 15, flex: 1 }}>
        <Text style={[styles(theme).cardValue, { fontSize: 16 }]}>{title}</Text>
        {subtitle && <Text style={styles(theme).cardLabel}>{subtitle}</Text>}
      </View>
      {selected && <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />}
    </TouchableOpacity>
  );
};

const MultiSelectCard = ({ selected, onPress, icon, title }: any) => {
  const theme = useTheme();
  return (
      <TouchableOpacity 
        onPress={onPress} 
        activeOpacity={0.8}
        style={[
          styles(theme).glassCard, 
          selected && styles(theme).selectedCard,
          { width: '48%', alignItems: 'center', padding: 15, marginBottom: 10 }
        ]}
      >
        <MaterialCommunityIcons 
            name={icon} 
            size={28} 
            color={selected ? theme.colors.primary : theme.colors.text} 
            style={{marginBottom: 5}}
        />
        <Text style={[styles(theme).cardValue, { fontSize: 12, textAlign: 'center' }]}>{title}</Text>
      </TouchableOpacity>
    );
};

const InputField = ({ label, value, onChangeText, placeholder, icon, unit, keyboardType = 'numeric' }: any) => {
  const theme = useTheme();
  return (
    <View style={{ marginBottom: 15 }}>
      <Text style={[styles(theme).cardLabel, { marginBottom: 8, marginLeft: 4 }]}>{label}</Text>
      <View style={[styles(theme).glassCard, { padding: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 55 }]}>
        <MaterialCommunityIcons name={icon} size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={{ flex: 1, color: theme.colors.text, fontSize: 16, fontWeight: 'bold', marginLeft: 10, height: '100%' }}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType={keyboardType}
          returnKeyType="done"
        />
        {unit && <Text style={{ color: theme.colors.textSecondary, fontWeight: 'bold', fontSize: 12 }}>{unit}</Text>}
      </View>
    </View>
  );
};

// --- COMPOSANT PRINCIPAL ---

export default function Onboarding() {
  const router = useRouter();
  const theme = useTheme();
  const currentStyles = styles(theme);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const totalSteps = 7;

  const [formData, setFormData] = useState<OnboardingData>({
    full_name: '',
    gender: '',
    age: '',
    weight: '',
    height: '',
    goal: '',
    activity_level: '',
    experience_level: '',
    training_days: 3,
    dietary_pref: [],
    equipment: '',
  });

  const updateData = (key: keyof OnboardingData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleDietaryPref = (pref: string) => {
      if (Platform.OS !== 'web') Haptics.selectionAsync();
      const currentPrefs = formData.dietary_pref;
      if (currentPrefs.includes(pref)) {
          updateData('dietary_pref', currentPrefs.filter(p => p !== pref));
      } else {
          updateData('dietary_pref', [...currentPrefs, pref]);
      }
  };

  const nextStep = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Validations
    if (step === 1 && !formData.full_name) return Alert.alert("Oups", "Dites-nous comment vous appeler !");
    if (step === 2 && (!formData.age || !formData.weight || !formData.height)) return Alert.alert("Oups", "Ces infos sont cruciales pour l'IA.");
    if (step === 3 && !formData.goal) return Alert.alert("Oups", "Quel est votre objectif principal ?");
    if (step === 4 && !formData.activity_level) return Alert.alert("Oups", "Votre niveau d'activité aide à calculer vos besoins.");
    if (step === 5 && !formData.experience_level) return Alert.alert("Oups", "Votre expérience définit votre programme.");
    if (step === 6 && !formData.equipment) return Alert.alert("Oups", "Quel matériel avez-vous ?");

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      finishOnboarding();
    }
  };

  const prevStep = () => {
    if (step > 1) {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setStep(step - 1);
    }
  };

  const finishOnboarding = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expirée.");

      const updates = {
        id: session.user.id,
        full_name: formData.full_name,
        gender: formData.gender,
        age: parseInt(formData.age) || 25,
        weight: parseFloat(formData.weight.replace(',', '.')) || 70,
        height: parseFloat(formData.height.replace(',', '.')) || 175,
        goal: formData.goal,
        activity_level: formData.activity_level,
        experience_level: formData.experience_level,
        training_days: formData.training_days,
        updated_at: new Date(),
        points: 100, 
        streak: 1,
      };

      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;

      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)/dashboard');

    } catch (error: any) {
      Alert.alert("Erreur", error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View>
        <Text style={currentStyles.stepTitle}>PROFIL</Text>
        <Text style={currentStyles.stepQuestion}>Qui êtes-vous ?</Text>
        
        <InputField label="NOM COMPLET / PSEUDO" value={formData.full_name} onChangeText={(t:string) => updateData('full_name', t)} placeholder="Votre nom" icon="account" keyboardType="default" />
        
        <Text style={[currentStyles.cardLabel, {marginBottom: 10, marginLeft: 5}]}>GENRE (Optionnel)</Text>
        <View style={{ gap: 10 }}>
            <OptionCard title="HOMME" subtitle="" icon="gender-male" selected={formData.gender === 'male'} onPress={() => updateData('gender', 'male')} />
            <OptionCard title="FEMME" subtitle="" icon="gender-female" selected={formData.gender === 'female'} onPress={() => updateData('gender', 'female')} />
        </View>
    </View>
  );

  const renderStep2 = () => (
    <View>
        <Text style={currentStyles.stepTitle}>MÉTRIQUES</Text>
        <Text style={currentStyles.stepQuestion}>Vos stats actuelles</Text>
        <Text style={currentStyles.stepDesc}>Essentiel pour que l'IA calcule votre métabolisme de base.</Text>

        <InputField label="ÂGE" value={formData.age} onChangeText={(t:string) => updateData('age', t)} placeholder="Années" icon="calendar-account" unit="ANS" />
        <InputField label="POIDS" value={formData.weight} onChangeText={(t:string) => updateData('weight', t)} placeholder="Kg" icon="scale-bathroom" unit="KG" />
        <InputField label="TAILLE" value={formData.height} onChangeText={(t:string) => updateData('height', t)} placeholder="Cm" icon="human-male-height" unit="CM" />
    </View>
  );

  const renderStep3 = () => (
    <View>
        <Text style={currentStyles.stepTitle}>OBJECTIF</Text>
        <Text style={currentStyles.stepQuestion}>Votre but ultime</Text>
        <View style={{ gap: 10 }}>
            <OptionCard title="PERTE DE GRAS" subtitle="Sécher, affiner la silhouette" icon="fire" selected={formData.goal === 'lose_weight'} onPress={() => updateData('goal', 'lose_weight')} />
            <OptionCard title="PRISE DE MUSCLE" subtitle="Volume, hypertrophie" icon="arm-flex" selected={formData.goal === 'muscle'} onPress={() => updateData('goal', 'muscle')} />
            <OptionCard title="FORCE & PUISSANCE" subtitle="Performance athlétique" icon="weight-lifter" selected={formData.goal === 'strength'} onPress={() => updateData('goal', 'strength')} />
            <OptionCard title="SANTÉ & VITALITÉ" subtitle="Énergie, longévité" icon="heart-pulse" selected={formData.goal === 'health'} onPress={() => updateData('goal', 'health')} />
        </View>
    </View>
  );

  const renderStep4 = () => (
    <View>
        <Text style={currentStyles.stepTitle}>ACTIVITÉ</Text>
        <Text style={currentStyles.stepQuestion}>Votre quotidien hors sport</Text>
        <View style={{ gap: 10 }}>
            <OptionCard title="SÉDENTAIRE" subtitle="Bureau, peu de marche" icon="seat-recline-normal" selected={formData.activity_level === 'sedentary'} onPress={() => updateData('activity_level', 'sedentary')} />
            <OptionCard title="LÉGER" subtitle="Travail debout / Marche un peu" icon="walk" selected={formData.activity_level === 'light'} onPress={() => updateData('activity_level', 'light')} />
            <OptionCard title="MODÉRÉ" subtitle="Actif toute la journée" icon="run" selected={formData.activity_level === 'moderate'} onPress={() => updateData('activity_level', 'moderate')} />
            <OptionCard title="TRÈS ACTIF" subtitle="Métier physique / Sport intensif" icon="bike" selected={formData.activity_level === 'active'} onPress={() => updateData('activity_level', 'active')} />
        </View>
    </View>
  );

  const renderStep5 = () => (
    <View>
        <Text style={currentStyles.stepTitle}>NIVEAU</Text>
        <Text style={currentStyles.stepQuestion}>Votre expérience en musculation</Text>
        <View style={{ gap: 10 }}>
            <OptionCard title="DÉBUTANT" subtitle="Je commence / < 6 mois" icon="sprout" selected={formData.experience_level === 'beginner'} onPress={() => updateData('experience_level', 'beginner')} />
            <OptionCard title="INTERMÉDIAIRE" subtitle="6 mois - 2 ans de pratique" icon="leaf" selected={formData.experience_level === 'intermediate'} onPress={() => updateData('experience_level', 'intermediate')} />
            <OptionCard title="AVANCÉ" subtitle="+ 2 ans de pratique sérieuse" icon="tree" selected={formData.experience_level === 'advanced'} onPress={() => updateData('experience_level', 'advanced')} />
        </View>
    </View>
  );

  const renderStep6 = () => (
    <View>
        <Text style={currentStyles.stepTitle}>LOGISTIQUE</Text>
        <Text style={currentStyles.stepQuestion}>Où et quand ?</Text>
        
        <Text style={[currentStyles.cardLabel, {marginBottom: 10, marginLeft: 5}]}>MATÉRIEL DISPONIBLE</Text>
        <View style={{ gap: 10 }}>
            <OptionCard title="SALLE DE SPORT" subtitle="Équipement complet" icon="dumbbell" selected={formData.equipment === 'gym'} onPress={() => updateData('equipment', 'gym')} />
            <OptionCard title="MAISON (MATÉRIEL)" subtitle="Haltères, banc, élastiques..." icon="home-analytics" selected={formData.equipment === 'home_basic'} onPress={() => updateData('equipment', 'home_basic')} />
            <OptionCard title="POIDS DU CORPS" subtitle="Sans matériel / Calisthenics" icon="human-handsup" selected={formData.equipment === 'home_none'} onPress={() => updateData('equipment', 'home_none')} />
        </View>

        <Text style={[currentStyles.cardLabel, {marginTop: 20, marginBottom: 10, marginLeft: 5}]}>DISPONIBILITÉ (Jours/Semaine)</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {[2, 3, 4, 5, 6].map((d) => (
                <TouchableOpacity 
                    key={d} 
                    onPress={() => updateData('training_days', d)}
                    style={[
                        currentStyles.dayBtn, 
                        formData.training_days === d && currentStyles.dayBtnActive
                    ]}
                >
                    <Text style={[currentStyles.dayBtnText, formData.training_days === d ? {color: '#fff'} : {}]}>{d}</Text>
                </TouchableOpacity>
            ))}
        </View>
    </View>
  );

  const renderStep7 = () => (
    <View>
        <Text style={currentStyles.stepTitle}>NUTRITION</Text>
        <Text style={currentStyles.stepQuestion}>Préférences alimentaires</Text>
        <Text style={currentStyles.stepDesc}>Sélectionnez tout ce qui s'applique.</Text>
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <MultiSelectCard title="SANS GLUTEN" icon="barley-off" selected={formData.dietary_pref.includes('gluten_free')} onPress={() => toggleDietaryPref('gluten_free')} />
            <MultiSelectCard title="VÉGÉTARIEN" icon="leaf" selected={formData.dietary_pref.includes('vegetarian')} onPress={() => toggleDietaryPref('vegetarian')} />
            <MultiSelectCard title="VÉGAN" icon="sprout" selected={formData.dietary_pref.includes('vegan')} onPress={() => toggleDietaryPref('vegan')} />
            <MultiSelectCard title="HALAL" icon="food-halal" selected={formData.dietary_pref.includes('halal')} onPress={() => toggleDietaryPref('halal')} />
            <MultiSelectCard title="SANS LACTOSE" icon="cow-off" selected={formData.dietary_pref.includes('lactose_free')} onPress={() => toggleDietaryPref('lactose_free')} />
            <MultiSelectCard title="KETO" icon="food-steak" selected={formData.dietary_pref.includes('keto')} onPress={() => toggleDietaryPref('keto')} />
            <MultiSelectCard title="PALEO" icon="bone" selected={formData.dietary_pref.includes('paleo')} onPress={() => toggleDietaryPref('paleo')} />
        </View>
        
        <TouchableOpacity 
            style={{ marginTop: 20, alignItems: 'center' }} 
            onPress={() => updateData('dietary_pref', [])}
        >
            <Text style={{ color: theme.colors.textSecondary, textDecorationLine: 'underline' }}>Aucune restriction particulière</Text>
        </TouchableOpacity>
    </View>
  );

  return (
    <View style={currentStyles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      
      {theme.isDark && (
        <View style={currentStyles.auroraBg}>
            <View style={[currentStyles.blob, { top: -100, left: -50, backgroundColor: 'rgba(0, 243, 255, 0.1)' }]} />
            <View style={[currentStyles.blob, { bottom: 0, right: -50, backgroundColor: 'rgba(139, 92, 246, 0.1)' }]} />
        </View>
      )}

      <SafeAreaView style={currentStyles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          
          {/* HEADER */}
          <View style={currentStyles.header}>
            <TouchableOpacity onPress={prevStep} disabled={step === 1} style={{opacity: step === 1 ? 0 : 1}}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <View style={{alignItems: 'center'}}>
                <Text style={currentStyles.headerTitle}>INITIALISATION</Text>
                <View style={currentStyles.progressContainer}>
                    <View style={[currentStyles.progressBar, { width: `${(step / totalSteps) * 100}%` }]} />
                </View>
            </View>
            <View style={{width: 24}} /> 
          </View>

          <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20 }} showsVerticalScrollIndicator={false}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
            {step === 5 && renderStep5()}
            {step === 6 && renderStep6()}
            {step === 7 && renderStep7()}
          </ScrollView>

          <View style={currentStyles.footer}>
            <TouchableOpacity onPress={nextStep} disabled={loading} style={currentStyles.nextBtn}>
              <LinearGradient colors={[theme.colors.primary, theme.colors.secondary]} start={{x:0, y:0}} end={{x:1, y:0}} style={currentStyles.btnGradient}>
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={currentStyles.btnText}>{step === totalSteps ? "GÉNÉRER MON PROGRAMME" : "SUIVANT"}</Text>
                )}
                {!loading && <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />}
              </LinearGradient>
            </TouchableOpacity>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// --- STYLES DYNAMIQUES ---
const styles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  safeArea: { flex: 1 },
  
  auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
  blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.2 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 },
  headerTitle: { color: theme.colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 5 },
  
  progressContainer: { width: 100, height: 4, backgroundColor: theme.colors.border, borderRadius: 2 },
  progressBar: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 2 },

  stepTitle: { color: theme.colors.primary, fontSize: 12, fontWeight: 'bold', letterSpacing: 2, marginBottom: 5 },
  stepQuestion: { color: theme.colors.text, fontSize: 28, fontWeight: '900', marginBottom: 10 },
  stepDesc: { color: theme.colors.textSecondary, fontSize: 16, marginBottom: 25, lineHeight: 22 },

  glassCard: { 
      backgroundColor: theme.colors.glass, 
      borderRadius: 16, 
      borderWidth: 1, 
      borderColor: theme.colors.border,
      shadowColor: theme.isDark ? 'transparent' : '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0 : 0.05,
      shadowRadius: 4,
      elevation: theme.isDark ? 0 : 2,
  },
  selectedCard: { 
      borderColor: theme.colors.primary, 
      backgroundColor: theme.isDark ? 'rgba(0, 243, 255, 0.1)' : theme.colors.primary + '10' 
  },
  
  cardIcon: { 
      width: 40, height: 40, borderRadius: 12, 
      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : theme.colors.bg, 
      justifyContent: 'center', alignItems: 'center' 
  },
  cardValue: { color: theme.colors.text, fontSize: 16, fontWeight: 'bold' },
  cardLabel: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 },

  dayBtn: { 
      width: 50, height: 50, borderRadius: 12, 
      backgroundColor: theme.colors.glass, 
      justifyContent: 'center', alignItems: 'center', 
      borderWidth: 1, borderColor: theme.colors.border 
  },
  dayBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  dayBtnText: { color: theme.colors.text, fontWeight: 'bold', fontSize: 18 },

  footer: { padding: 20, paddingBottom: 30 },
  nextBtn: { width: '100%', height: 56, borderRadius: 16, overflow: 'hidden', shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  btnGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
});