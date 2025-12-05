import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { supabase } from '../lib/supabase';
import { useTheme } from '../lib/theme';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { GlassCard } from '../components/ui/GlassCard';
import { NeonButton } from '../components/ui/NeonButton';
import { GlassButton } from '../components/ui/GlassButton';

// Nombre total d'étapes
const TOTAL_STEPS = 4;

export default function OnboardingScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const { t } = useTranslation();
    
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    
    // État du formulaire complet
    const [formData, setFormData] = useState({
        full_name: '',
        age: '',
        weight: '',
        height: '',
        gender: 'Homme',
        fitness_level: 'Débutant',
        goal: 'Perte de poids',
        country: '', 
        city: '',    
        equipment: 'Salle de sport',
        dietary_restrictions: '',
        training_days: '4' // Valeur par défaut pour éviter le bug des 7 jours
    });

    const nextStep = () => {
        if (Platform.OS !== 'web') Haptics.selectionAsync();
        if (step < TOTAL_STEPS) setStep(step + 1);
        else handleFinish();
    };

    const prevStep = () => {
        if (step > 1) setStep(step - 1);
    };

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFinish = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error(t('onboarding.error_no_session') || "Pas de session active");

            // Conversion des types numériques
            const updates = {
                id: session.user.id,
                ...formData,
                age: parseInt(formData.age) || 25,
                weight: parseFloat(formData.weight) || 70,
                height: parseFloat(formData.height) || 175,
                updated_at: new Date(),
            };

            const { error } = await supabase.from('profiles').upsert(updates);
            if (error) throw error;

            if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace('/(tabs)/dashboard' as any);

        } catch (error: any) {
            Alert.alert(t('common.error') || "Erreur", error.message);
        } finally {
            setLoading(false);
        }
    };

    // --- RENDERERS DES ÉTAPES ---

    const renderStep1_Bio = () => (
        <View>
            <Text style={[styles.stepTitle, { color: colors.text }]}>{t('onboarding.step1_title') || "PROFIL BIOLOGIQUE"}</Text>
            <Text style={[styles.stepSub, { color: colors.textSecondary }]}>{t('onboarding.step1_sub') || "Ces données permettent de calculer ton métabolisme de base."}</Text>
            
            <GlassCard style={{ padding: 20, marginTop: 20 }}>
                <TextInput 
                    placeholder={t('onboarding.ph_fullname') || "Nom complet"} 
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                    value={formData.full_name}
                    onChangeText={v => updateField('full_name', v)}
                />
                
                <View style={{ flexDirection: 'row', gap: 15, marginTop: 15 }}>
                    <TextInput 
                        placeholder={t('onboarding.ph_age') || "Age"} keyboardType="numeric"
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.input, { flex: 1, color: colors.text, borderColor: colors.border }]}
                        value={formData.age}
                        onChangeText={v => updateField('age', v)}
                    />
                     <TextInput 
                        placeholder={t('onboarding.ph_weight') || "Poids (kg)"} keyboardType="numeric"
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.input, { flex: 1, color: colors.text, borderColor: colors.border }]}
                        value={formData.weight}
                        onChangeText={v => updateField('weight', v)}
                    />
                </View>

                <View style={{ flexDirection: 'row', gap: 15, marginTop: 15 }}>
                    <TextInput 
                        placeholder={t('onboarding.ph_height') || "Taille (cm)"} keyboardType="numeric"
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.input, { flex: 1, color: colors.text, borderColor: colors.border }]}
                        value={formData.height}
                        onChangeText={v => updateField('height', v)}
                    />
                    <View style={{ flex: 1 }} />
                </View>

                <View style={{ flexDirection: 'row', marginTop: 20, gap: 10 }}>
                    {['Homme', 'Femme'].map(g => (
                        <TouchableOpacity 
                            key={g} 
                            onPress={() => updateField('gender', g)}
                            style={[
                                styles.choiceBtn, 
                                { borderColor: formData.gender === g ? colors.primary : colors.border, backgroundColor: formData.gender === g ? colors.primary + '20' : 'transparent' }
                            ]}
                        >
                            <Text style={{ color: formData.gender === g ? colors.primary : colors.textSecondary, fontWeight: 'bold' }}>
                                {t(`gender.${g.toLowerCase()}`) || g.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </GlassCard>
        </View>
    );

    const renderStep2_Location = () => (
        <View>
            <Text style={[styles.stepTitle, { color: colors.text }]}>{t('onboarding.step2_title') || "LOCALISATION & CULTURE"}</Text>
            
            <View style={[styles.infoBox, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                <MaterialCommunityIcons name="earth" size={24} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                    {t('onboarding.location_info') || "Nous utilisons ta région pour adapter les plans nutritionnels à ta culture locale et aux produits disponibles près de chez toi."}
                </Text>
            </View>

            <GlassCard style={{ padding: 20, marginTop: 20 }}>
                <View style={{ marginBottom: 20 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: 'bold', marginBottom: 8, marginLeft: 4 }}>{t('onboarding.label_country') || "PAYS"}</Text>
                    <TextInput 
                        placeholder={t('onboarding.ph_country') || "Ex: Maroc, France, Canada..."} 
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                        value={formData.country}
                        onChangeText={v => updateField('country', v)}
                    />
                </View>

                <View>
                    <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: 'bold', marginBottom: 8, marginLeft: 4 }}>{t('onboarding.label_city') || "VILLE (OPTIONNEL)"}</Text>
                    <TextInput 
                        placeholder={t('onboarding.ph_city') || "Ex: Casablanca, Paris..."} 
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                        value={formData.city}
                        onChangeText={v => updateField('city', v)}
                    />
                </View>
            </GlassCard>
        </View>
    );

    const renderStep3_Goals = () => (
        <View>
             <Text style={[styles.stepTitle, { color: colors.text }]}>{t('onboarding.step3_title') || "OBJECTIFS & NIVEAU"}</Text>
             <GlassCard style={{ padding: 20, marginTop: 20 }}>
                <Text style={styles.label}>{t('onboarding.label_level') || "TON NIVEAU ACTUEL"}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                    {['Débutant', 'Intermédiaire', 'Avancé', 'Athlète'].map(l => (
                         <TouchableOpacity 
                            key={l} onPress={() => updateField('fitness_level', l)}
                            style={[styles.choiceBtn, { borderColor: formData.fitness_level === l ? colors.warning : colors.border, backgroundColor: formData.fitness_level === l ? colors.warning + '20' : 'transparent' }]}
                        >
                            <Text style={{ color: formData.fitness_level === l ? colors.warning : colors.textSecondary, fontWeight: 'bold', fontSize: 12 }}>
                                {t(`level.${l.toLowerCase()}`) || l}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>{t('onboarding.label_goal') || "TON OBJECTIF PRINCIPAL"}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                    {['Perte de poids', 'Prise de masse', 'Endurance', 'Flexibilité', 'Santé Globale'].map(g => (
                         <TouchableOpacity 
                            key={g} onPress={() => updateField('goal', g)}
                            style={[styles.choiceBtn, { paddingHorizontal: 20, borderColor: formData.goal === g ? colors.success : colors.border, backgroundColor: formData.goal === g ? colors.success + '20' : 'transparent' }]}
                        >
                            <Text style={{ color: formData.goal === g ? colors.success : colors.textSecondary, fontWeight: 'bold', fontSize: 12 }}>
                                {t(`goal.${g.replace(/ /g, '_').toLowerCase()}`) || g}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
             </GlassCard>
        </View>
    );

    const renderStep4_Context = () => (
        <View>
             <Text style={[styles.stepTitle, { color: colors.text }]}>{t('onboarding.step4_title') || "CONTEXTE"}</Text>
             <GlassCard style={{ padding: 20, marginTop: 20 }}>
                {/* SELECTEUR DE JOURS (CORRECTIF POUR IA) */}
                <Text style={styles.label}>{t('onboarding.label_freq') || "FRÉQUENCE D'ENTRAÎNEMENT (JOURS/SEMAINE)"}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25, backgroundColor: colors.bg, padding: 5, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
                    {['2', '3', '4', '5', '6'].map(d => (
                        <TouchableOpacity 
                            key={d} 
                            onPress={() => updateField('training_days', d)}
                            style={[
                                styles.dayBtn, 
                                { backgroundColor: formData.training_days === d ? colors.primary : 'transparent' }
                            ]}
                        >
                            <Text style={{ color: formData.training_days === d ? '#000' : colors.textSecondary, fontWeight: 'bold' }}>{d}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>{t('onboarding.label_equip') || "ÉQUIPEMENT DISPONIBLE"}</Text>
                <TextInput 
                    placeholder={t('onboarding.ph_equip') || "Ex: Salle complète, Haltères maison, Poids du corps..."}
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                    value={formData.equipment}
                    onChangeText={v => updateField('equipment', v)}
                />

                <Text style={[styles.label, { marginTop: 20 }]}>{t('onboarding.label_diet') || "RESTRICTIONS ALIMENTAIRES"}</Text>
                <TextInput 
                    placeholder={t('onboarding.ph_diet') || "Ex: Végétarien, Sans Gluten, Aucune..."}
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                    value={formData.dietary_restrictions}
                    onChangeText={v => updateField('dietary_restrictions', v)}
                />
             </GlassCard>
        </View>
    );

    return (
        <ScreenLayout>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <View style={styles.container}>
                    {/* Header Progress */}
                    <View style={styles.header}>
                        {step > 1 ? (
                            <GlassButton icon="arrow-back" onPress={prevStep} size={20} />
                        ) : <View style={{width: 40}} />}
                        
                        <View style={styles.progressContainer}>
                            <View style={[styles.progressBar, { width: `${(step / TOTAL_STEPS) * 100}%`, backgroundColor: colors.primary }]} />
                        </View>
                        <Text style={{ color: colors.textSecondary, fontWeight: 'bold' }}>{step}/{TOTAL_STEPS}</Text>
                    </View>

                    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                        {step === 1 && renderStep1_Bio()}
                        {step === 2 && renderStep2_Location()}
                        {step === 3 && renderStep3_Goals()}
                        {step === 4 && renderStep4_Context()}
                    </ScrollView>

                    <View style={styles.footer}>
                        <NeonButton 
                            label={step === TOTAL_STEPS ? (t('onboarding.btn_finish') || "TERMINER") : (t('onboarding.btn_next') || "SUIVANT")}
                            onPress={nextStep}
                            loading={loading}
                            icon={step === TOTAL_STEPS ? "check" : "arrow-right"}
                        />
                    </View>
                </View>
            </KeyboardAvoidingView>
        </ScreenLayout>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 },
    progressContainer: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20, borderRadius: 2 },
    progressBar: { height: '100%', borderRadius: 2 },
    stepTitle: { fontSize: 24, fontWeight: '900', letterSpacing: 1, marginBottom: 5, textAlign: 'center' },
    stepSub: { fontSize: 14, textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },
    input: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, fontSize: 16 },
    choiceBtn: { paddingVertical: 12, paddingHorizontal: 15, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    label: { fontSize: 10, fontWeight: 'bold', marginBottom: 10, marginLeft: 5, color: '#888', letterSpacing: 1 },
    footer: { position: 'absolute', bottom: 30, left: 20, right: 20 },
    infoBox: { flexDirection: 'row', padding: 15, borderRadius: 16, borderWidth: 1, alignItems: 'center', gap: 15, marginTop: 10 },
    infoText: { flex: 1, fontSize: 13, lineHeight: 20 },
    dayBtn: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }
});