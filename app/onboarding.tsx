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
import { useTranslation } from 'react-i18next'; // Import

// Types
type OnboardingData = {
  full_name: string;
  gender: 'male' | 'female' | 'other' | '';
  age: string;
  weight: string;
  height: string;
  goal: string;
  activity_level: string;
  experience_level: string;
  training_days: number;
  dietary_pref: string[]; 
  equipment: string;
};

// DONNÉES AVEC CLÉS DE TRADUCTION
const GOALS = [
    { id: 'lose_weight', labelKey: 'onboarding.goals.lose_weight', icon: 'fire' },
    { id: 'muscle', labelKey: 'onboarding.goals.muscle', icon: 'arm-flex' },
    { id: 'strength', labelKey: 'onboarding.goals.strength', icon: 'weight-lifter' },
    { id: 'endurance', labelKey: 'onboarding.goals.endurance', icon: 'heart-pulse' }
];

const EXPERIENCE = [
    { id: 'beginner', labelKey: 'onboarding.levels.beginner', icon: 'sprout' },
    { id: 'intermediate', labelKey: 'onboarding.levels.intermediate', icon: 'leaf' },
    { id: 'advanced', labelKey: 'onboarding.levels.advanced', icon: 'tree' }
];

const EQUIPMENT = [
    { id: 'gym', labelKey: 'onboarding.equip.gym', icon: 'dumbbell' },
    { id: 'home', labelKey: 'onboarding.equip.home', icon: 'home-analytics' },
    { id: 'bodyweight', labelKey: 'onboarding.equip.bodyweight', icon: 'human-handsup' }
];

const OptionCard = ({ selected, onPress, icon, titleKey }: any) => {
  const theme = useTheme();
  const { t } = useTranslation();
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
        <Text style={[styles(theme).cardValue, { fontSize: 16 }]}>{t(titleKey)}</Text>
      </View>
      {selected && <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />}
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

export default function Onboarding() {
  const router = useRouter();
  const theme = useTheme();
  const currentStyles = styles(theme);
  const { t } = useTranslation(); // Hook
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const totalSteps = 6; // Simplifié pour l'exemple

  const [formData, setFormData] = useState<OnboardingData>({
    full_name: '', gender: '', age: '', weight: '', height: '',
    goal: '', activity_level: '', experience_level: '', training_days: 3,
    dietary_pref: [], equipment: '',
  });

  const updateData = (key: keyof OnboardingData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const nextStep = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < totalSteps) setStep(step + 1);
    else finishOnboarding();
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
        age: parseInt(formData.age) || 25,
        weight: parseFloat(formData.weight.replace(',', '.')) || 70,
        height: parseFloat(formData.height.replace(',', '.')) || 175,
        goal: formData.goal,
        experience_level: formData.experience_level,
        equipment: formData.equipment,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;

      router.replace('/(tabs)/dashboard' as any);
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
    </View>
  );

  const renderStep2 = () => (
    <View>
        <Text style={currentStyles.stepTitle}>MÉTRIQUES</Text>
        <Text style={currentStyles.stepQuestion}>Vos stats actuelles</Text>
        <InputField label="ÂGE" value={formData.age} onChangeText={(t:string) => updateData('age', t)} placeholder="Années" icon="calendar-account" unit="ANS" />
        <InputField label="POIDS" value={formData.weight} onChangeText={(t:string) => updateData('weight', t)} placeholder="Kg" icon="scale-bathroom" unit="KG" />
        <InputField label="TAILLE" value={formData.height} onChangeText={(t:string) => updateData('height', t)} placeholder="Cm" icon="human-male-height" unit="CM" />
    </View>
  );

  const renderStep3 = () => (
    <View>
        <Text style={currentStyles.stepTitle}>{t('onboarding.step1')}</Text>
        <View style={{ gap: 10 }}>
            {GOALS.map(g => (
                <OptionCard key={g.id} titleKey={g.labelKey} icon={g.icon} selected={formData.goal === g.id} onPress={() => updateData('goal', g.id)} />
            ))}
        </View>
    </View>
  );

  const renderStep4 = () => (
    <View>
        <Text style={currentStyles.stepTitle}>{t('onboarding.step2')}</Text>
        <View style={{ gap: 10 }}>
            {EXPERIENCE.map(e => (
                <OptionCard key={e.id} titleKey={e.labelKey} icon={e.icon} selected={formData.experience_level === e.id} onPress={() => updateData('experience_level', e.id)} />
            ))}
        </View>
    </View>
  );

  const renderStep5 = () => (
    <View>
        <Text style={currentStyles.stepTitle}>{t('onboarding.step3')}</Text>
        <View style={{ gap: 10 }}>
            {EQUIPMENT.map(e => (
                <OptionCard key={e.id} titleKey={e.labelKey} icon={e.icon} selected={formData.equipment === e.id} onPress={() => updateData('equipment', e.id)} />
            ))}
        </View>
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
          </ScrollView>

          <View style={currentStyles.footer}>
            <TouchableOpacity onPress={nextStep} disabled={loading} style={currentStyles.nextBtn}>
              <LinearGradient colors={[theme.colors.primary, theme.colors.secondary]} start={{x:0, y:0}} end={{x:1, y:0}} style={currentStyles.btnGradient}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={currentStyles.btnText}>{step === totalSteps ? t('onboarding.finish') : t('onboarding.next')}</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

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
  glassCard: { backgroundColor: theme.colors.glass, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border },
  selectedCard: { borderColor: theme.colors.primary, backgroundColor: theme.isDark ? 'rgba(0, 243, 255, 0.1)' : theme.colors.primary + '10' },
  cardIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : theme.colors.bg, justifyContent: 'center', alignItems: 'center' },
  cardValue: { color: theme.colors.text, fontSize: 16, fontWeight: 'bold' },
  cardLabel: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 },
  footer: { padding: 20, paddingBottom: 30 },
  nextBtn: { width: '100%', height: 56, borderRadius: 16, overflow: 'hidden' },
  btnGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
});