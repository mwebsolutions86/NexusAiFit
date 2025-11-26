import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import * as Haptics from 'expo-haptics';

// Types pour les données étendues
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
  dietary_pref: string[]; // Tableau pour plusieurs préférences
  equipment: 'gym' | 'home_basic' | 'home_none' | '';
};

// --- COMPOSANTS UI ---
const OptionCard = ({ selected, onPress, icon, title, subtitle }: any) => (
  <TouchableOpacity 
    onPress={onPress} 
    activeOpacity={0.8}
    style={[
      styles.glassCard, 
      selected && styles.selectedCard,
      { width: '100%', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 }
    ]}
  >
    <View style={[styles.cardIcon, selected && { backgroundColor: '#00f3ff' }]}>
      <MaterialCommunityIcons name={icon} size={24} color={selected ? '#000' : '#fff'} />
    </View>
    <View style={{ marginLeft: 15, flex: 1 }}>
      <Text style={[styles.cardValue, { fontSize: 16 }]}>{title}</Text>
      {subtitle && <Text style={styles.cardLabel}>{subtitle}</Text>}
    </View>
    {selected && <Ionicons name="checkmark-circle" size={24} color="#00f3ff" />}
  </TouchableOpacity>
);

const MultiSelectCard = ({ selected, onPress, icon, title }: any) => (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.8}
      style={[
        styles.glassCard, 
        selected && styles.selectedCard,
        { width: '48%', alignItems: 'center', padding: 15, marginBottom: 10 }
      ]}
    >
      <MaterialCommunityIcons name={icon} size={28} color={selected ? '#00f3ff' : '#fff'} style={{marginBottom: 5}}/>
      <Text style={[styles.cardValue, { fontSize: 12, textAlign: 'center' }]}>{title}</Text>
    </TouchableOpacity>
  );

const InputField = ({ label, value, onChangeText, placeholder, icon, unit, keyboardType = 'numeric' }: any) => (
  <View style={{ marginBottom: 15 }}>
    <Text style={[styles.cardLabel, { marginBottom: 8, marginLeft: 4 }]}>{label}</Text>
    <View style={[styles.glassCard, { padding: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 55 }]}>
      <MaterialCommunityIcons name={icon} size={20} color="rgba(255,255,255,0.4)" />
      <TextInput
        style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 10, height: '100%' }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.2)"
        keyboardType={keyboardType}
        returnKeyType="done"
      />
      {unit && <Text style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', fontSize: 12 }}>{unit}</Text>}
    </View>
  </View>
);

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const totalSteps = 7; // Augmenté à 7 étapes

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

    // Validations par étape
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
        gender: formData.gender, // Peut être vide si non sélectionné (optionnel dans l'étape 1)
        age: parseInt(formData.age) || 25,
        weight: parseFloat(formData.weight.replace(',', '.')) || 70,
        height: parseFloat(formData.height.replace(',', '.')) || 175,
        goal: formData.goal,
        activity_level: formData.activity_level,
        experience_level: formData.experience_level,
        training_days: formData.training_days,
        // dietary_pref et equipment pourraient être stockés dans un champ jsonb 'preferences' ou des colonnes dédiées si vous mettez à jour la table
        // Pour l'instant, on suppose que la table profiles a été mise à jour ou on stocke l'essentiel
        updated_at: new Date(),
        points: 100, // Bonus de bienvenue plus généreux
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

  // --- RENDU DES ÉTAPES ---

  const renderStep1 = () => (
    <View>
        <Text style={styles.stepTitle}>PROFIL</Text>
        <Text style={styles.stepQuestion}>Qui êtes-vous ?</Text>
        
        <InputField label="NOM COMPLET / PSEUDO" value={formData.full_name} onChangeText={(t:string) => updateData('full_name', t)} placeholder="Votre nom" icon="account" keyboardType="default" />
        
        <Text style={[styles.cardLabel, {marginBottom: 10, marginLeft: 5}]}>GENRE (Optionnel)</Text>
        <View style={{ gap: 10 }}>
            <OptionCard title="HOMME" subtitle="" icon="gender-male" selected={formData.gender === 'male'} onPress={() => updateData('gender', 'male')} />
            <OptionCard title="FEMME" subtitle="" icon="gender-female" selected={formData.gender === 'female'} onPress={() => updateData('gender', 'female')} />
        </View>
    </View>
  );

  const renderStep2 = () => (
    <View>
        <Text style={styles.stepTitle}>MÉTRIQUES</Text>
        <Text style={styles.stepQuestion}>Vos stats actuelles</Text>
        <Text style={styles.stepDesc}>Essentiel pour que l'IA calcule votre métabolisme de base.</Text>

        <InputField label="ÂGE" value={formData.age} onChangeText={(t:string) => updateData('age', t)} placeholder="Années" icon="calendar-account" unit="ANS" />
        <InputField label="POIDS" value={formData.weight} onChangeText={(t:string) => updateData('weight', t)} placeholder="Kg" icon="scale-bathroom" unit="KG" />
        <InputField label="TAILLE" value={formData.height} onChangeText={(t:string) => updateData('height', t)} placeholder="Cm" icon="human-male-height" unit="CM" />
    </View>
  );

  const renderStep3 = () => (
    <View>
        <Text style={styles.stepTitle}>OBJECTIF</Text>
        <Text style={styles.stepQuestion}>Votre but ultime</Text>
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
        <Text style={styles.stepTitle}>ACTIVITÉ</Text>
        <Text style={styles.stepQuestion}>Votre quotidien hors sport</Text>
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
        <Text style={styles.stepTitle}>NIVEAU</Text>
        <Text style={styles.stepQuestion}>Votre expérience en musculation</Text>
        <View style={{ gap: 10 }}>
            <OptionCard title="DÉBUTANT" subtitle="Je commence / < 6 mois" icon="sprout" selected={formData.experience_level === 'beginner'} onPress={() => updateData('experience_level', 'beginner')} />
            <OptionCard title="INTERMÉDIAIRE" subtitle="6 mois - 2 ans de pratique" icon="leaf" selected={formData.experience_level === 'intermediate'} onPress={() => updateData('experience_level', 'intermediate')} />
            <OptionCard title="AVANCÉ" subtitle="+ 2 ans de pratique sérieuse" icon="tree" selected={formData.experience_level === 'advanced'} onPress={() => updateData('experience_level', 'advanced')} />
        </View>
    </View>
  );

  const renderStep6 = () => (
    <View>
        <Text style={styles.stepTitle}>LOGISTIQUE</Text>
        <Text style={styles.stepQuestion}>Où et quand ?</Text>
        
        <Text style={[styles.cardLabel, {marginBottom: 10, marginLeft: 5}]}>MATÉRIEL DISPONIBLE</Text>
        <View style={{ gap: 10 }}>
            <OptionCard title="SALLE DE SPORT" subtitle="Équipement complet" icon="dumbbell" selected={formData.equipment === 'gym'} onPress={() => updateData('equipment', 'gym')} />
            <OptionCard title="MAISON (MATÉRIEL)" subtitle="Haltères, banc, élastiques..." icon="home-analytics" selected={formData.equipment === 'home_basic'} onPress={() => updateData('equipment', 'home_basic')} />
            <OptionCard title="POIDS DU CORPS" subtitle="Sans matériel / Calisthenics" icon="human-handsup" selected={formData.equipment === 'home_none'} onPress={() => updateData('equipment', 'home_none')} />
        </View>

        <Text style={[styles.cardLabel, {marginTop: 20, marginBottom: 10, marginLeft: 5}]}>DISPONIBILITÉ (Jours/Semaine)</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {[2, 3, 4, 5, 6].map((d) => (
                <TouchableOpacity 
                    key={d} 
                    onPress={() => updateData('training_days', d)}
                    style={[
                        styles.dayBtn, 
                        formData.training_days === d && styles.dayBtnActive
                    ]}
                >
                    <Text style={[styles.dayBtnText, formData.training_days === d && {color: '#000'}]}>{d}</Text>
                </TouchableOpacity>
            ))}
        </View>
    </View>
  );

  const renderStep7 = () => (
    <View>
        <Text style={styles.stepTitle}>NUTRITION</Text>
        <Text style={styles.stepQuestion}>Préférences alimentaires</Text>
        <Text style={styles.stepDesc}>Sélectionnez tout ce qui s'applique.</Text>
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <MultiSelectCard title="SANS GLUTEN" icon="barley-off" selected={formData.dietary_pref.includes('gluten_free')} onPress={() => toggleDietaryPref('gluten_free')} />
            <MultiSelectCard title="VÉGÉTARIEN" icon="leaf" selected={formData.dietary_pref.includes('vegetarian')} onPress={() => toggleDietaryPref('vegetarian')} />
            <MultiSelectCard title="VÉGAN" icon="sprout" selected={formData.dietary_pref.includes('vegan')} onPress={() => toggleDietaryPref('vegan')} />
            <MultiSelectCard title="SANS LACTOSE" icon="cow-off" selected={formData.dietary_pref.includes('lactose_free')} onPress={() => toggleDietaryPref('lactose_free')} />
            <MultiSelectCard title="KETO" icon="food-steak" selected={formData.dietary_pref.includes('keto')} onPress={() => toggleDietaryPref('keto')} />
            <MultiSelectCard title="PALEO" icon="bone" selected={formData.dietary_pref.includes('paleo')} onPress={() => toggleDietaryPref('paleo')} />
        </View>
        
        <TouchableOpacity 
            style={{ marginTop: 20, alignItems: 'center' }} 
            onPress={() => updateData('dietary_pref', [])}
        >
            <Text style={{ color: 'rgba(255,255,255,0.5)', textDecorationLine: 'underline' }}>Aucune restriction particulière</Text>
        </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="transparent" translucent={true} />
      <View style={styles.auroraBg}>
          <View style={[styles.blob, { top: -100, left: -50, backgroundColor: 'rgba(0, 243, 255, 0.1)' }]} />
          <View style={[styles.blob, { bottom: 0, right: -50, backgroundColor: 'rgba(139, 92, 246, 0.1)' }]} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity onPress={prevStep} disabled={step === 1} style={{opacity: step === 1 ? 0 : 1}}>
                <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={{alignItems: 'center'}}>
                <Text style={styles.headerTitle}>INITIALISATION</Text>
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${(step / totalSteps) * 100}%` }]} />
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

          <View style={styles.footer}>
            <TouchableOpacity onPress={nextStep} disabled={loading} style={styles.nextBtn}>
              <LinearGradient colors={['#00f3ff', '#0066ff']} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.btnGradient}>
                {loading ? (
                    <ActivityIndicator color="#000" />
                ) : (
                    <Text style={styles.btnText}>{step === totalSteps ? "GÉNÉRER MON PROGRAMME" : "SUIVANT"}</Text>
                )}
                {!loading && <MaterialCommunityIcons name="arrow-right" size={20} color="#000" />}
              </LinearGradient>
            </TouchableOpacity>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },
  auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
  blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.2 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 },
  headerTitle: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 5 },
  progressContainer: { width: 100, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 },
  progressBar: { height: '100%', backgroundColor: '#00f3ff', borderRadius: 2 },

  stepTitle: { color: '#00f3ff', fontSize: 12, fontWeight: 'bold', letterSpacing: 2, marginBottom: 5 },
  stepQuestion: { color: '#fff', fontSize: 28, fontWeight: '900', marginBottom: 10 },
  stepDesc: { color: 'rgba(255,255,255,0.6)', fontSize: 16, marginBottom: 25, lineHeight: 22 },

  glassCard: { backgroundColor: 'rgba(20, 20, 30, 0.6)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  selectedCard: { borderColor: '#00f3ff', backgroundColor: 'rgba(0, 243, 255, 0.1)' },
  
  cardIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  cardValue: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cardLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 },

  dayBtn: { width: 50, height: 50, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  dayBtnActive: { backgroundColor: '#00f3ff', borderColor: '#00f3ff' },
  dayBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },

  footer: { padding: 20, paddingBottom: 30 },
  nextBtn: { width: '100%', height: 56, borderRadius: 16, overflow: 'hidden', shadowColor: "#00f3ff", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  btnGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  btnText: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
});