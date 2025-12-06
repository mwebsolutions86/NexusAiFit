import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, ImageBackground } from 'react-native';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../lib/theme';
import { useAIMealPrep } from '../../hooks/useAIMealPrep';
import { Recipe } from '../../types/recipe';
import { ScreenLayout } from '../../components/ui/ScreenLayout';
import { GlassCard } from '../../components/ui/GlassCard';

export default function MealPrepScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { savedRecipes, generateRecipe, saveRecipe, isGenerating } = useAIMealPrep();

  const [ingredients, setIngredients] = useState('');
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // --- ACTIONS ---

  const handleGenerate = async () => {
    if (!ingredients.trim()) {
        Alert.alert("Frigo Vide ?", "Indiquez quelques ingrédients (ex: Poulet, Riz, Citron) ou un thème (ex: Italien).");
        return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
        const recipe = await generateRecipe(ingredients);
        setCurrentRecipe(recipe);
        setShowHistory(false);
    } catch (e: any) {
        if (e.message === "PREMIUM_REQUIRED") {
            Alert.alert("Fonction Chef Étoilé 💎", "Réservé aux membres Premium.", [
                { text: "Voir Offres", onPress: () => router.push('/subscription') },
                { text: "Annuler", style: "cancel" }
            ]);
        } else {
            Alert.alert("Erreur Chef", "Le chef est en pause. " + e.message);
        }
    }
  };

  const handleSave = async () => {
      if (!currentRecipe) return;
      try {
          await saveRecipe(currentRecipe);
          Alert.alert("Livre de Recettes", "Recette sauvegardée avec succès !");
          setCurrentRecipe(null); // Reset
          setShowHistory(true); // Montrer la liste
      } catch (e) {
          Alert.alert("Erreur", "Impossible de sauvegarder.");
      }
  };

  // --- RENDERS ---

  const renderRecipeCard = (recipe: Recipe, isPreview = false) => (
    <View key={recipe.title} style={{marginBottom: 20}}>
        <GlassCard style={styles.recipeCard}>
            <View style={styles.recipeHeader}>
                <View style={[styles.iconBox, {backgroundColor: '#f59e0b20'}]}>
                    <MaterialCommunityIcons name="chef-hat" size={24} color="#f59e0b" />
                </View>
                <View style={{flex:1, marginLeft: 15}}>
                    <Text style={[styles.recipeTitle, {color: theme.colors.text}]}>{recipe.title}</Text>
                    <Text style={[styles.recipeTime, {color: theme.colors.textSecondary}]}>
                        ⏱️ Prép: {recipe.prep_time} • Cuisson: {recipe.cook_time}
                    </Text>
                </View>
            </View>

            <View style={styles.macrosRow}>
                <View style={styles.macroBadge}>
                    <Text style={styles.macroVal}>{recipe.calories}</Text>
                    <Text style={styles.macroLabel}>KCAL</Text>
                </View>
                <View style={styles.macroBadge}>
                    <Text style={[styles.macroVal, {color: theme.colors.success}]}>{recipe.macros?.protein}g</Text>
                    <Text style={styles.macroLabel}>PROT</Text>
                </View>
                <View style={styles.macroBadge}>
                    <Text style={[styles.macroVal, {color: theme.colors.warning}]}>{recipe.macros?.carbs}g</Text>
                    <Text style={styles.macroLabel}>GLU</Text>
                </View>
                <View style={styles.macroBadge}>
                    <Text style={[styles.macroVal, {color: '#f43f5e'}]}>{recipe.macros?.fat}g</Text>
                    <Text style={styles.macroLabel}>LIP</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>INGRÉDIENTS</Text>
            {recipe.ingredients?.map((ing, i) => (
                <Text key={i} style={[styles.listItem, {color: theme.colors.textSecondary}]}>• {ing}</Text>
            ))}

            <View style={{height: 15}} />

            <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>INSTRUCTIONS</Text>
            {recipe.instructions?.map((step, i) => (
                <View key={i} style={{flexDirection:'row', marginBottom: 8}}>
                    <Text style={{color: theme.colors.primary, fontWeight:'bold', marginRight: 8}}>{i+1}.</Text>
                    <Text style={[styles.listItem, {color: theme.colors.textSecondary, flex:1}]}>{step}</Text>
                </View>
            ))}

            {recipe.storage_tips && (
                <View style={styles.tipBox}>
                    <MaterialCommunityIcons name="information-outline" size={16} color={theme.colors.text} />
                    <Text style={[styles.tipText, {color: theme.colors.text}]}>{recipe.storage_tips}</Text>
                </View>
            )}
        </GlassCard>

        {isPreview && (
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <LinearGradient colors={['#10b981', '#059669']} style={styles.gradientBtn}>
                    <MaterialCommunityIcons name="content-save" size={20} color="#fff" style={{marginRight: 8}} />
                    <Text style={styles.btnText}>SAUVEGARDER DANS MON LIVRE</Text>
                </LinearGradient>
            </TouchableOpacity>
        )}
    </View>
  );

  return (
    <ScreenLayout>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>CHEF GASTRO IA</Text>
        <TouchableOpacity onPress={() => setShowHistory(!showHistory)} style={styles.backBtn}>
           <MaterialCommunityIcons name={showHistory ? "creation" : "book-open-variant"} size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* INPUT ZONE (Si pas en mode historique) */}
        {!showHistory && !currentRecipe && (
            <GlassCard style={styles.inputCard}>
                <Text style={[styles.promptLabel, {color: theme.colors.text}]}>QU'AVEZ-VOUS DANS LE FRIGO ?</Text>
                <TextInput 
                    style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                    placeholder="Ex: 2 oeufs, reste de riz, courgettes..."
                    placeholderTextColor={theme.colors.textSecondary}
                    value={ingredients}
                    onChangeText={setIngredients}
                    multiline
                />
                <TouchableOpacity style={styles.genBtn} onPress={handleGenerate} disabled={isGenerating}>
                    <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.gradientBtn}>
                        {isGenerating ? <ActivityIndicator color="#fff"/> : (
                            <>
                                <MaterialCommunityIcons name="silverware-variant" size={20} color="#fff" style={{marginRight: 8}} />
                                <Text style={styles.btnText}>CRÉER UNE RECETTE</Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </GlassCard>
        )}

        {/* MODE RECETTE GÉNÉRÉE */}
        {!showHistory && currentRecipe && renderRecipeCard(currentRecipe, true)}

        {/* MODE HISTORIQUE (LIVRE DE CUISINE) */}
        {showHistory && (
            <View>
                <Text style={[styles.bookTitle, {color: theme.colors.textSecondary}]}>VOTRE LIVRE DE RECETTES ({savedRecipes?.length})</Text>
                {savedRecipes?.map(r => renderRecipeCard(r, false))}
                {savedRecipes?.length === 0 && (
                    <Text style={{textAlign:'center', color:theme.colors.textSecondary, marginTop: 20}}>Aucune recette sauvegardée.</Text>
                )}
            </View>
        )}

      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  content: { padding: 20, paddingBottom: 100 },
  
  inputCard: { padding: 20, marginBottom: 20 },
  promptLabel: { fontSize: 14, fontWeight: '900', marginBottom: 15, textAlign: 'center' },
  input: { height: 100, borderWidth: 1, borderRadius: 16, padding: 15, marginBottom: 20, textAlignVertical: 'top', fontSize: 16 },
  genBtn: { borderRadius: 16, overflow: 'hidden' },
  gradientBtn: { paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },

  recipeCard: { padding: 20, marginBottom: 15 },
  recipeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconBox: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  recipeTitle: { fontSize: 18, fontWeight: 'bold', lineHeight: 24 },
  recipeTime: { fontSize: 12, marginTop: 4 },
  
  macrosRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, backgroundColor: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 12 },
  macroBadge: { alignItems: 'center', flex: 1 },
  macroVal: { fontSize: 16, fontWeight: '900' },
  macroLabel: { fontSize: 9, fontWeight: 'bold', opacity: 0.7 },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 15 },
  sectionTitle: { fontSize: 12, fontWeight: '900', marginBottom: 10, letterSpacing: 1 },
  listItem: { fontSize: 14, marginBottom: 6, lineHeight: 20 },
  
  tipBox: { flexDirection: 'row', gap: 10, backgroundColor: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 12, marginTop: 15 },
  tipText: { fontSize: 12, fontStyle: 'italic', flex: 1 },

  saveBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 0 },
  bookTitle: { fontSize: 12, fontWeight: '900', marginBottom: 15, textAlign: 'center', opacity: 0.7 }
});