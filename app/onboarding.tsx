import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  Dimensions 
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Animated, { 
  FadeInRight, 
  FadeOutLeft, 
  FadeIn, 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

import { supabase } from '../lib/supabase';
import { useTheme } from '../lib/theme';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { GlassCard } from '../components/ui/GlassCard';
import { NeonButton } from '../components/ui/NeonButton';
import { GlassButton } from '../components/ui/GlassButton';

// --- COMPOSANT ISOLÉ : VUE DE TRAITEMENT (Fix du Crash) ---
const ProcessingView = () => {
    const { colors } = useTheme();
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
    }, []);
    
    const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

    return (
        <Animated.View entering={FadeIn} style={styles.processingContainer}>
            <Animated.View style={[styles.scannerLine, animatedStyle, { backgroundColor: colors.primary }]} />
            <MaterialCommunityIcons name="brain" size={80} color={colors.primary} />
            <Text style={[styles.processingTitle, { color: colors.text }]}>ANALYSE NEURALE EN COURS...</Text>
            <Text style={[styles.processingSub, { color: colors.textSecondary }]}>
                Optimisation des paramètres métaboliques.{"\n"}Construction du plan tactique.
            </Text>
        </Animated.View>
    );
};

// --- COMPOSANT : SELECTEUR ---
const SelectionCard = ({ label, icon, selected, onPress }: any) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity 
      onPress={() => {
        if (Platform.OS !== 'web') Haptics.selectionAsync();
        onPress();
      }}
      activeOpacity={0.8}
      style={{ flex: 1 }}
    >
      <GlassCard 
        style={[
          styles.selectionCard, 
          selected && { borderColor: colors.primary, backgroundColor: colors.primary + '15' }
        ]}
        intensity={selected ? 40 : 10}
      >
        <MaterialCommunityIcons 
          name={icon} 
          size={32} 
          color={selected ? colors.primary : colors.textSecondary} 
        />
        <Text style={[
          styles.selectionText, 
          { color: selected ? '#fff' : colors.textSecondary }
        ]}>
          {label}
        </Text>
        {selected && (
          <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
            <Ionicons name="checkmark" size={12} color="#000" />
          </View>
        )}
      </GlassCard>
    </TouchableOpacity>
  );
};

// --- COMPOSANT : INPUT DONNÉE ---
const DataInput = ({ label, value, onChange, placeholder, suffix, keyboardType = 'default' }: any) => {
  const { colors } = useTheme();
  return (
    <View style={styles.dataInputContainer}>
      <Text style={[styles.dataLabel, { color: colors.primary }]}>{label}</Text>
      <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
        <TextInput
          style={[styles.mainInput, { color: colors.text }]}
          value={String(value)}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          keyboardType={keyboardType}
        />
        {suffix && <Text style={[styles.suffix, { color: colors.textSecondary }]}>{suffix}</Text>}
      </View>
    </View>
  );
};

export default function OnboardingScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const { t } = useTranslation();
    
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        full_name: '',
        gender: 'Homme',
        age: '',
        weight: '',
        height: '',
        goal: 'Perte de poids',
        fitness_level: 'Débutant',
        training_days: '4',
        equipment: 'Salle de sport',
        country: ''
    });

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const nextStep = () => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (step < 4) {
            setStep(step + 1);
        } else {
            handleProcessing();
        }
    };

    const prevStep = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleProcessing = async () => {
        setStep(5); // Affiche le composant ProcessingView
        setLoading(true);
        
        setTimeout(async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) throw new Error("Session expirée");

                const updates = {
                    id: session.user.id,
                    ...formData,
                    age: parseInt(formData.age) || 25,
                    weight: parseFloat(formData.weight) || 70,
                    height: parseFloat(formData.height) || 175,
                    training_days: parseInt(formData.training_days) || 4,
                    updated_at: new Date(),
                };

                const { error } = await supabase.from('profiles').upsert(updates);
                if (error) throw error;

                if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.replace('/(tabs)/dashboard');

            } catch (error: any) {
                Alert.alert("Erreur de Sync", error.message);
                setStep(4);
            } finally {
                setLoading(false);
            }
        }, 2500);
    };

    // --- RENDERERS (Sans Hooks internes) ---

    const renderStep1 = () => (
      <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.stepTitle, { color: colors.text }]}>IDENTIFICATION</Text>
          <Text style={[styles.stepSub, { color: colors.textSecondary }]}>Calibrage du profil biologique.</Text>
        </View>

        <DataInput 
          label="NOM DE CODE (PSEUDO)"
          placeholder="Ex: Maverick"
          value={formData.full_name}
          onChange={(v: string) => updateField('full_name', v)}
        />

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>GENRE BIOLOGIQUE</Text>
        <View style={styles.row}>
          <SelectionCard 
            label="HOMME" icon="gender-male" 
            selected={formData.gender === 'Homme'} 
            onPress={() => updateField('gender', 'Homme')} 
          />
          <View style={{width: 15}} />
          <SelectionCard 
            label="FEMME" icon="gender-female" 
            selected={formData.gender === 'Femme'} 
            onPress={() => updateField('gender', 'Femme')} 
          />
        </View>

        <View style={{height: 20}} />
        <DataInput 
          label="ÂGE"
          placeholder="25"
          value={formData.age}
          onChange={(v: string) => updateField('age', v)}
          keyboardType="numeric"
          suffix="ANS"
        />
      </Animated.View>
    );

    const renderStep2 = () => (
      <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.stepTitle, { color: colors.text }]}>MÉTRIQUES</Text>
          <Text style={[styles.stepSub, { color: colors.textSecondary }]}>Données nécessaires au calcul du métabolisme basal.</Text>
        </View>

        <View style={styles.metricsRow}>
           <View style={{flex:1}}>
             <DataInput 
                label="POIDS" value={formData.weight} 
                onChange={(v: string) => updateField('weight', v)} 
                keyboardType="numeric" suffix="KG"
             />
           </View>
           <View style={{width: 20}} />
           <View style={{flex:1}}>
             <DataInput 
                label="TAILLE" value={formData.height} 
                onChange={(v: string) => updateField('height', v)} 
                keyboardType="numeric" suffix="CM"
             />
           </View>
        </View>

        <View style={{height: 30}} />
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>LOCALISATION (Pour la nutrition)</Text>
        <DataInput 
            label="PAYS / RÉGION" value={formData.country} 
            onChange={(v: string) => updateField('country', v)} 
            placeholder="Ex: France, Maroc..."
        />
      </Animated.View>
    );

    const renderStep3 = () => (
      <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.stepTitle, { color: colors.text }]}>MISSION</Text>
          <Text style={[styles.stepSub, { color: colors.textSecondary }]}>Définition de l'objectif principal.</Text>
        </View>

        <View style={{gap: 15}}>
            {['Perte de poids', 'Prise de masse', 'Endurance', 'Santé Globale'].map((g) => (
                <TouchableOpacity 
                    key={g}
                    onPress={() => {
                        if (Platform.OS !== 'web') Haptics.selectionAsync();
                        updateField('goal', g);
                    }}
                    style={[
                        styles.goalItem, 
                        { 
                            borderColor: formData.goal === g ? colors.primary : colors.border,
                            backgroundColor: formData.goal === g ? colors.primary + '10' : colors.glass
                        }
                    ]}
                >
                    <Text style={{ color: colors.text, fontWeight: 'bold' }}>{g.toUpperCase()}</Text>
                    {formData.goal === g && <Ionicons name="radio-button-on" size={20} color={colors.primary} />}
                    {formData.goal !== g && <Ionicons name="radio-button-off" size={20} color={colors.textSecondary} />}
                </TouchableOpacity>
            ))}
        </View>
      </Animated.View>
    );

    const renderStep4 = () => (
      <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.stepTitle, { color: colors.text }]}>CONTEXTE</Text>
          <Text style={[styles.stepSub, { color: colors.textSecondary }]}>Ajustement de la charge de travail.</Text>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>NIVEAU D'EXPÉRIENCE</Text>
        <View style={styles.rowWrap}>
            {['Débutant', 'Intermédiaire', 'Avancé'].map(l => (
                <TouchableOpacity 
                    key={l} 
                    onPress={() => updateField('fitness_level', l)}
                    style={[
                        styles.chip,
                        { backgroundColor: formData.fitness_level === l ? colors.primary : colors.glass, borderColor: colors.border }
                    ]}
                >
                    <Text style={{ color: formData.fitness_level === l ? '#000' : colors.text, fontWeight: 'bold', fontSize: 12 }}>{l}</Text>
                </TouchableOpacity>
            ))}
        </View>

        <View style={{height: 30}} />
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>DISPONIBILITÉ (Jours/Semaine)</Text>
        <View style={styles.row}>
            {['2', '3', '4', '5', '6'].map(d => (
                <TouchableOpacity 
                    key={d} 
                    onPress={() => updateField('training_days', d)}
                    style={[
                        styles.dayCircle,
                        { backgroundColor: formData.training_days === d ? colors.primary : colors.glass, borderColor: colors.border }
                    ]}
                >
                    <Text style={{ color: formData.training_days === d ? '#000' : colors.text, fontWeight: 'bold' }}>{d}</Text>
                </TouchableOpacity>
            ))}
        </View>
      </Animated.View>
    );

    return (
        <ScreenLayout>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                
                {/* HEADER */}
                {step < 5 && (
                    <View style={styles.header}>
                        <View style={{width: 40}}>
                            {step > 1 && <GlassButton icon="arrow-back" onPress={prevStep} size={20} />}
                        </View>
                        <View style={styles.progressTrack}>
                            <View style={[
                                styles.progressFill, 
                                { width: `${(step / 4) * 100}%`, backgroundColor: colors.primary }
                            ]} />
                        </View>
                        <Text style={[styles.stepIndicator, { color: colors.textSecondary }]}>0{step} / 04</Text>
                    </View>
                )}

                {/* CONTENU */}
                <View style={styles.content}>
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                    {step === 4 && renderStep4()}
                    
                    {/* CORRECTION DU CRASH : Le composant est monté conditionnellement ici */}
                    {step === 5 && <ProcessingView />}
                </View>

                {/* FOOTER */}
                {step < 5 && (
                    <View style={styles.footer}>
                        <NeonButton 
                            label={step === 4 ? "INITIALISER LE SYSTÈME" : "SUIVANT"}
                            onPress={nextStep}
                            icon={step === 4 ? "rocket-launch" : "arrow-right"}
                        />
                    </View>
                )}

            </KeyboardAvoidingView>
        </ScreenLayout>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
    progressTrack: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20, borderRadius: 2 },
    progressFill: { height: '100%', borderRadius: 2 },
    stepIndicator: { fontSize: 12, fontWeight: 'bold', fontVariant: ['tabular-nums'] },
    
    content: { flex: 1, justifyContent: 'center', paddingHorizontal: 25 },
    stepContainer: { width: '100%' },
    
    headerTextContainer: { marginBottom: 40 },
    stepTitle: { fontSize: 32, fontWeight: '900', letterSpacing: 2, marginBottom: 5 },
    stepSub: { fontSize: 14, letterSpacing: 0.5 },

    dataInputContainer: { marginBottom: 25 },
    dataLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 10 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, height: 60, paddingHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.05)' },
    mainInput: { flex: 1, fontSize: 20, fontWeight: 'bold' },
    suffix: { fontWeight: 'bold', fontSize: 12, opacity: 0.7 },

    sectionLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 15, marginTop: 10 },
    
    row: { flexDirection: 'row' },
    rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    
    selectionCard: { padding: 20, alignItems: 'center', justifyContent: 'center', borderRadius: 20, borderWidth: 1, borderColor: 'transparent', height: 140 },
    selectionText: { marginTop: 10, fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },
    checkCircle: { position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

    metricsRow: { flexDirection: 'row', justifyContent: 'space-between' },

    goalItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
    
    chip: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, borderWidth: 1 },
    dayCircle: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 10 },

    footer: { padding: 25, paddingBottom: 40 },

    // Processing Screen
    processingContainer: { alignItems: 'center', justifyContent: 'center', flex: 1 },
    scannerLine: { height: 2, width: 200, marginBottom: 40 },
    processingTitle: { fontSize: 18, fontWeight: 'bold', letterSpacing: 2, marginTop: 40, textAlign: 'center' },
    processingSub: { fontSize: 12, textAlign: 'center', marginTop: 10, opacity: 0.6, lineHeight: 20 },
});