import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';

import { supabase } from '../../lib/supabase';
import { useTheme } from '../../lib/theme';
import { useActivePlans } from '../hooks/useActivePlans';

import { ScreenLayout } from '../../components/ui/ScreenLayout';
import { GlassCard } from '../../components/ui/GlassCard';
import { NeonButton } from '../../components/ui/NeonButton';
import { GlassButton } from '../../components/ui/GlassButton';

export default function NutritionPlanScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    // Récupérer le plan actif
    const [userId, setUserId] = React.useState<string>();
    React.useEffect(() => { supabase.auth.getSession().then(({data}) => setUserId(data.session?.user.id))}, []);
    const { data: plans, isLoading: isPlansLoading } = useActivePlans(userId);

    const [loading, setLoading] = useState(false);
    const [preferences, setPreferences] = useState('');
    const activeMealPlan = plans?.mealPlan;

    const handleGenerate = async () => {
        if (!userId) return;
        setLoading(true);

        try {
            // 1. Récupérer le profil complet pour l'adaptation culturelle
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            // 2. Appel à l'Edge Function Supabase
            // On envoie 'userProfile' pour que l'IA sache où habite l'utilisateur
            const { data: planAI, error: funcError } = await supabase.functions.invoke('generate-plan', {
                body: { 
                    userId, 
                    type: 'nutrition', 
                    userContext: preferences || "Equilibré, riche en protéines",
                    userProfile: profile, // <--- AJOUT CRUCIAL
                    language: 'fr'
                }
            });

            if (funcError) throw funcError;
            if (!planAI || !planAI.days) throw new Error("L'IA a renvoyé un format invalide. Veuillez réessayer.");

            // 3. SAUVEGARDE EN BASE DE DONNÉES (C'était l'étape manquante !)
            // D'abord, on désactive les anciens plans
            await supabase
                .from('meal_plans')
                .update({ is_active: false })
                .eq('user_id', userId);

            // Ensuite, on insère le nouveau plan
            const { error: insertError } = await supabase
                .from('meal_plans')
                .insert({
                    user_id: userId,
                    title: planAI.title || "Plan Nutritionnel IA",
                    content: planAI, // On stocke tout le JSON généré
                    is_active: true
                });

            if (insertError) throw insertError;

            // 4. Rafraîchir l'interface
            queryClient.invalidateQueries({ queryKey: ['activePlans'] });
            Alert.alert("Succès", "Ton plan nutritionnel a été généré et adapté à ta région !");
            setPreferences('');

        } catch (e: any) {
            // Affiche le vrai message d'erreur pour aider au débogage
            console.error(e);
            Alert.alert("Erreur IA", e.message || "Problème de connexion au cerveau IA.");
        } finally {
            setLoading(false);
        }
    };

    const renderGenerator = () => (
        <GlassCard style={{ alignItems: 'center', padding: 25 }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: colors.success + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
                <MaterialCommunityIcons name="food-apple" size={30} color={colors.success} />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text, marginBottom: 10, textAlign: 'center' }}>
                {t('nutrition_plan.generate_title') || "GÉNÉRATEUR DE DIÈTE IA"}
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 25, lineHeight: 20 }}>
                {t('nutrition_plan.generate_desc') || "Laisse l'IA analyser ton métabolisme et créer le plan parfait pour tes objectifs."}
            </Text>

            <View style={{ width: '100%', marginBottom: 20 }}>
                <Text style={{ color: colors.success, fontSize: 10, fontWeight: 'bold', marginBottom: 8, marginLeft: 5 }}>PRÉFÉRENCES (OPTIONNEL)</Text>
                <TextInput
                    style={{ backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 15, color: colors.text, height: 50 }}
                    placeholder="Ex: Végétarien, Jeûne intermittent..."
                    placeholderTextColor={colors.textSecondary}
                    value={preferences}
                    onChangeText={setPreferences}
                />
            </View>

            <NeonButton 
                label={loading ? "ANALYSE EN COURS..." : "GÉNÉRER LE PLAN"} 
                onPress={handleGenerate} 
                loading={loading}
                icon="brain"
            />
        </GlassCard>
    );

    const renderActivePlan = () => (
        <View>
            <GlassCard style={{ marginBottom: 20, borderColor: colors.success }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: colors.text }}>{activeMealPlan.title}</Text>
                    <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Plan actif généré par Nexus AI</Text>
            </GlassCard>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 5 }}>
                <Text style={{ color: colors.textSecondary, fontWeight: '900', letterSpacing: 1 }}>SEMAINE TYPE</Text>
                <TouchableOpacity onPress={handleGenerate}>
                    <Text style={{ color: colors.success, fontSize: 12, fontWeight: 'bold' }}>RÉGÉNÉRER</Text>
                </TouchableOpacity>
            </View>

            {activeMealPlan.days?.map((day: any, index: number) => (
                <GlassCard key={index} style={{ marginBottom: 10 }}>
                    <Text style={{ color: colors.success, fontWeight: 'bold', marginBottom: 10 }}>JOUR {index + 1}</Text>
                    {day.meals?.map((meal: any, mIndex: number) => (
                        <View key={mIndex} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: mIndex === day.meals.length - 1 ? 0 : 1, borderColor: colors.border }}>
                            <Text style={{ color: colors.text, flex: 1 }}>{meal.name}</Text>
                            <Text style={{ color: colors.textSecondary, fontWeight: 'bold' }}>{meal.calories} kcal</Text>
                        </View>
                    ))}
                </GlassCard>
            ))}
        </View>
    );

    return (
        <ScreenLayout>
             <View style={styles.header}>
                <GlassButton icon="arrow-back" iconFamily="Ionicons" onPress={() => router.back()} />
                <Text style={{ fontSize: 12, fontWeight: '900', letterSpacing: 2, color: colors.text }}>PLAN NUTRITION</Text>
                <View style={{ width: 48 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
                {!activeMealPlan ? renderGenerator() : renderActivePlan()}
            </ScrollView>
        </ScreenLayout>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 10 },
});