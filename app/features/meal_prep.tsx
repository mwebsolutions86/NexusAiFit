import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../lib/theme';

import { ScreenLayout } from '../../components/ui/ScreenLayout';
import { GlassCard } from '../../components/ui/GlassCard';
import { NeonButton } from '../../components/ui/NeonButton';
import { GlassButton } from '../../components/ui/GlassButton';

export default function MealPrepScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const { t } = useTranslation();

    const [loading, setLoading] = useState(false);
    const [ingredients, setIngredients] = useState('');
    const [recipe, setRecipe] = useState<any>(null);

    const handleGenerateRecipe = async () => {
        if (!ingredients.trim()) {
            Alert.alert("Ingrédients requis", "Dis-moi ce que tu as dans ton frigo ou ce dont tu as envie !");
            return;
        }
        
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Appel à la fonction Edge 'generate-plan' avec le type 'meal_prep'
            const { data, error } = await supabase.functions.invoke('generate-plan', {
                body: { 
                    userId: session.user.id, 
                    type: 'meal_prep', // Important : on appelle le type 'meal_prep'
                    userContext: ingredients 
                }
            });

            if (error) throw error;
            setRecipe(data);

        } catch (e: any) {
            Alert.alert("Erreur Chef IA", "Impossible de créer la recette pour le moment.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const renderInput = () => (
        <GlassCard style={{ padding: 20 }}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <MaterialCommunityIcons name="chef-hat" size={50} color={colors.warning} />
                <Text style={[styles.title, { color: colors.text, marginTop: 10 }]}>CHEF PRIVÉ IA</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Transforme tes restes en un plat gastronomique optimisé pour ta santé.
                </Text>
            </View>

            <Text style={{ color: colors.warning, fontSize: 10, fontWeight: 'bold', marginBottom: 8, marginLeft: 5 }}>TES INGRÉDIENTS / ENVIE</Text>
            <TextInput 
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
                placeholder="Ex: Saumon, Avocat, et j'ai besoin d'énergie..."
                placeholderTextColor={colors.textSecondary}
                value={ingredients}
                onChangeText={setIngredients}
                multiline
            />

            <NeonButton 
                label={loading ? "CRÉATION EN COURS..." : "INVENTER UNE RECETTE"} 
                onPress={handleGenerateRecipe} 
                loading={loading}
                icon="silverware-fork-knife"
                style={{ marginTop: 20 }}
            />
        </GlassCard>
    );

    const renderRecipe = () => (
        <View>
            <GlassCard style={{ marginBottom: 20, borderColor: colors.warning }}>
                <Text style={{ fontSize: 24, fontWeight: '900', color: colors.text, marginBottom: 5 }}>{recipe.title}</Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, fontStyle: 'italic', marginBottom: 15 }}>{recipe.description}</Text>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15, backgroundColor: colors.bg, padding: 10, borderRadius: 12 }}>
                    <View style={{ alignItems: 'center' }}>
                        <MaterialCommunityIcons name="clock-outline" size={20} color={colors.primary} />
                        <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 12 }}>{recipe.prep_time}</Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                        <MaterialCommunityIcons name="fire" size={20} color={colors.danger} />
                        <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 12 }}>{recipe.calories} kcal</Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                         <MaterialCommunityIcons name="leaf" size={20} color={colors.success} />
                         <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 12 }}>{recipe.macros.protein}g Prot</Text>
                    </View>
                </View>

                <Text style={styles.sectionHeader}>INGRÉDIENTS</Text>
                {recipe.ingredients.map((ing: string, i: number) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.warning, marginRight: 10 }} />
                        <Text style={{ color: colors.text }}>{ing}</Text>
                    </View>
                ))}
            </GlassCard>

            <GlassCard>
                <Text style={[styles.sectionHeader, { color: colors.primary }]}>PRÉPARATION</Text>
                {recipe.steps.map((step: string, i: number) => (
                    <View key={i} style={{ marginBottom: 15 }}>
                        <Text style={{ color: colors.text, lineHeight: 22 }}>{step}</Text>
                    </View>
                ))}
            </GlassCard>

            <View style={{ marginTop: 20 }}>
                <NeonButton 
                    label="NOUVELLE RECETTE" 
                    onPress={() => setRecipe(null)} 
                    icon="refresh"
                    variant="primary"
                />
            </View>
        </View>
    );

    return (
        <ScreenLayout>
            <View style={styles.header}>
                <GlassButton icon="arrow-back" onPress={() => router.back()} />
                <Text style={[styles.headerTitle, { color: colors.text }]}>MEAL PREP</Text>
                <View style={{ width: 48 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
                {!recipe ? renderInput() : renderRecipe()}
            </ScrollView>
        </ScreenLayout>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 10 },
    headerTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 2 },
    title: { fontSize: 22, fontWeight: '900', letterSpacing: 1 },
    subtitle: { fontSize: 12, textAlign: 'center', marginTop: 5, maxWidth: '80%' },
    input: { height: 100, borderWidth: 1, borderRadius: 12, padding: 15, textAlignVertical: 'top' },
    sectionHeader: { fontSize: 14, fontWeight: '900', letterSpacing: 1, marginBottom: 15, marginTop: 5, color: '#f59e0b' } 
});