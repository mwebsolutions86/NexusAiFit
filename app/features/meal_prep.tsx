import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { generateMealPrepIdeas } from '../../lib/groq';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';
import { useTranslation } from 'react-i18next';

export default function MealPrepScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'GENERATE' | 'SAVED'>('GENERATE');
  
  const [preferences, setPreferences] = useState('');
  const [generatedRecipes, setGeneratedRecipes] = useState<any[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const MODULE_COLOR = '#f43f5e'; 
  const CHEF_GRADIENT: [string, string] = ['#f43f5e', '#fb7185'];

  useEffect(() => { if (mode === 'SAVED') fetchSavedRecipes(); }, [mode]);

  const fetchSavedRecipes = async () => {
      try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;
          const { data } = await supabase.from('saved_recipes').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
          if (data) setSavedRecipes(data);
      } catch (e) { console.log(e); }
  };

  const handleGenerate = async () => {
      if (!preferences.trim()) return;
      setLoading(true);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      try {
          const data = await generateMealPrepIdeas(preferences);
          if (data && data.recipes) { setGeneratedRecipes(data.recipes); if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
      } catch (e) { Alert.alert("Erreur", "Réessayez."); } finally { setLoading(false); }
  };

  const saveRecipe = async (recipe: any) => {
      try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;
          await supabase.from('saved_recipes').insert({ user_id: session.user.id, title: recipe.title, calories: recipe.calories, protein: recipe.macros?.p, carbs: recipe.macros?.c, fat: recipe.macros?.f, ingredients: recipe.ingredients, instructions: recipe.steps, storage_tips: recipe.storage });
          Alert.alert(t('profile.alerts.success'), "Recette ajoutée.");
      } catch (e) { console.log(e); }
  };

  const deleteRecipe = async (id: string) => {
      try { await supabase.from('saved_recipes').delete().eq('id', id); setSavedRecipes(prev => prev.filter(r => r.id !== id)); } catch (e) { console.log(e); }
  };

  const toggleExpand = (id: string | number) => { setExpandedId(expandedId === id ? null : id); };

  const RecipeCard = ({ item, isSaved }: { item: any, isSaved: boolean }) => {
      const isExpanded = expandedId === (isSaved ? item.id : item.title);
      return (
        <TouchableOpacity style={[styles.card, isExpanded && styles.cardExpanded]} onPress={() => toggleExpand(isSaved ? item.id : item.title)} activeOpacity={0.9}>
            <View style={styles.cardHeader}>
                <View style={styles.iconBox}><MaterialCommunityIcons name="chef-hat" size={24} color={MODULE_COLOR} /></View>
                <View style={{flex:1}}>
                    <Text style={styles.recipeTitle}>{item.title}</Text>
                    <View style={styles.macrosRow}><Text style={styles.macroText}>🔥 {item.calories} kcal</Text><Text style={styles.macroText}>🥩 {item.protein || item.macros?.p}g P</Text></View>
                </View>
                <TouchableOpacity onPress={() => isSaved ? deleteRecipe(item.id) : saveRecipe(item)} style={styles.actionBtn}>
                    <MaterialCommunityIcons name={isSaved ? "trash-can-outline" : "heart-plus-outline"} size={20} color={isSaved ? theme.colors.textSecondary : MODULE_COLOR} />
                </TouchableOpacity>
            </View>
            {isExpanded && (
                <View style={styles.detailsContainer}>
                    <Text style={styles.sectionTitle}>{t('modules.mealprep.ingredients')}</Text>
                    {item.ingredients?.map((ing: string, i: number) => (<Text key={i} style={styles.detailText}>• {ing}</Text>))}
                    <Text style={[styles.sectionTitle, {marginTop: 15}]}>{t('modules.mealprep.prep')}</Text>
                    {(item.instructions || item.steps)?.map((step: string, i: number) => (<Text key={i} style={styles.detailText}>{i+1}. {step}</Text>))}
                    <View style={styles.storageBox}><MaterialCommunityIcons name="fridge-outline" size={16} color={MODULE_COLOR} style={{marginRight:5}} /><Text style={styles.storageText}>{item.storage_tips || item.storage}</Text></View>
                </View>
            )}
        </TouchableOpacity>
      );
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    headerTitle: { color: theme.colors.text, fontWeight: 'bold', letterSpacing: 1 },
    tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20 },
    tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderColor: theme.colors.border },
    tabBtnActive: { borderColor: MODULE_COLOR },
    tabText: { color: theme.colors.textSecondary, fontWeight: 'bold', fontSize: 12 },
    tabTextActive: { color: MODULE_COLOR },
    content: { paddingHorizontal: 20 },
    inputCard: { backgroundColor: theme.colors.glass, padding: 20, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: theme.colors.border },
    label: { color: MODULE_COLOR, fontSize: 10, fontWeight: 'bold', marginBottom: 10 },
    input: { backgroundColor: theme.isDark ? 'rgba(0,0,0,0.3)' : theme.colors.bg, borderRadius: 12, padding: 15, height: 100, textAlignVertical: 'top', color: theme.colors.text, marginBottom: 15, borderWidth: 1, borderColor: theme.colors.border },
    genBtn: { borderRadius: 15, overflow: 'hidden' },
    btnGradient: { padding: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 },
    btnText: { color: '#fff', fontWeight: '900', fontSize: 14 },
    emptyState: { alignItems: 'center', marginTop: 50, opacity: 0.5 },
    emptyText: { color: theme.colors.textSecondary, marginTop: 10 },
    card: { backgroundColor: theme.colors.glass, borderRadius: 16, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: theme.colors.border, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    cardExpanded: { borderColor: MODULE_COLOR },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 50, height: 50, borderRadius: 12, backgroundColor: MODULE_COLOR + '15', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    recipeTitle: { color: theme.colors.text, fontWeight: 'bold', fontSize: 15, marginBottom: 4 },
    macrosRow: { flexDirection: 'row', gap: 10 },
    macroText: { color: theme.colors.textSecondary, fontSize: 11, fontWeight: '600' },
    actionBtn: { padding: 10 },
    detailsContainer: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: theme.colors.border },
    sectionTitle: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
    detailText: { color: theme.colors.text, fontSize: 13, lineHeight: 20, marginBottom: 4 },
    storageBox: { marginTop: 15, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.bg, padding: 10, borderRadius: 8 },
    storageText: { color: MODULE_COLOR, fontSize: 11, fontWeight: 'bold', flex: 1 }
  });

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('modules.mealprep.title')}</Text>
        </View>
        <View style={styles.tabsContainer}>
            <TouchableOpacity onPress={() => setMode('GENERATE')} style={[styles.tabBtn, mode==='GENERATE' && styles.tabBtnActive]}><Text style={[styles.tabText, mode==='GENERATE' && styles.tabTextActive]}>{t('modules.mealprep.tab_chef')}</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setMode('SAVED')} style={[styles.tabBtn, mode==='SAVED' && styles.tabBtnActive]}><Text style={[styles.tabText, mode==='SAVED' && styles.tabTextActive]}>{t('modules.mealprep.tab_book')}</Text></TouchableOpacity>
        </View>
        <ScrollView style={styles.content} contentContainerStyle={{paddingBottom: 50}} showsVerticalScrollIndicator={false}>
            {mode === 'GENERATE' && (
                <>
                    <View style={styles.inputCard}>
                        <Text style={styles.label}>{t('modules.mealprep.input_label')}</Text>
                        <TextInput style={styles.input} multiline placeholder={t('modules.mealprep.input_ph')} placeholderTextColor={theme.colors.textSecondary} value={preferences} onChangeText={setPreferences} />
                        <TouchableOpacity style={styles.genBtn} onPress={handleGenerate} disabled={loading}>
                            <LinearGradient colors={CHEF_GRADIENT} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.btnGradient}>
                                {loading ? <ActivityIndicator color="#fff" /> : <><MaterialCommunityIcons name="creation" size={20} color="#fff" /><Text style={styles.btnText}>{t('modules.mealprep.btn_generate')}</Text></>}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                    {generatedRecipes.length > 0 && <View><Text style={[styles.sectionTitle, {marginBottom: 10}]}>{t('modules.mealprep.suggestions')}</Text>{generatedRecipes.map((recipe, i) => <RecipeCard key={i} item={recipe} isSaved={false} />)}</View>}
                </>
            )}
            {mode === 'SAVED' && (
                <>
                    {savedRecipes.length > 0 ? savedRecipes.map((recipe, i) => <RecipeCard key={recipe.id} item={recipe} isSaved={true} />) : <View style={styles.emptyState}><MaterialCommunityIcons name="book-open-page-variant-outline" size={64} color={theme.colors.textSecondary} /><Text style={styles.emptyText}>{t('modules.mealprep.empty')}</Text></View>}
                </>
            )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}