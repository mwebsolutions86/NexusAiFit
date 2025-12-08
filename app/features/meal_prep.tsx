import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Alert,
  Platform,
  Dimensions
} from 'react-native';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { ScreenLayout } from '../../components/ui/ScreenLayout';
import { GlassCard } from '../../components/ui/GlassCard';
import { NeonButton } from '../../components/ui/NeonButton';

const { width } = Dimensions.get('window');

export default function MealPrepScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [ingredients, setIngredients] = useState('');
  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // --- ACTIONS ---
  const handleGenerateRecipe = async () => {
      if (!ingredients.trim()) {
          Alert.alert("Garde-manger vide", "Indiquez au moins un ingrédient ou une envie.");
          return;
      }

      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setLoading(true);
      setRecipe(null); // Reset pour l'effet de surprise

      try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;

          // Récupération du profil pour adapter les macros
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          // Appel au Chef Nexus
          const { data, error } = await supabase.functions.invoke('supafit-ai', {
            body: {
              type: 'CHEF', // On appelle le nouveau case backend
              preferences: ingredients, // On passe les ingrédients ici
              userProfile: profile || {},
            }
          });

          if (error) throw error;

          // Parsing sécurisé
          let result = data;
          if (typeof data === 'string') {
               try { result = JSON.parse(data); } catch { throw new Error("Erreur de lecture de la recette."); }
          }
          if (result.response && typeof result.response === 'string') {
               try { result = JSON.parse(result.response); } catch { /* C'est peut-être déjà l'objet */ }
          }

          setRecipe(result);
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      } catch (e: any) {
          Alert.alert("Le Chef est occupé", "Impossible de générer la recette pour le moment.");
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  // --- RENDERERS ---
  const renderRecipe = () => {
      if (!recipe) return null;

      return (
          <Animated.View entering={FadeInUp.springify()} style={{ paddingBottom: 50 }}>
              
              {/* TITRE ET DESCRIPTION */}
              <View style={styles.headerRecipe}>
                  <MaterialCommunityIcons name="chef-hat" size={40} color={colors.primary} style={{marginBottom: 10}} />
                  <Text style={[styles.recipeTitle, { color: colors.text }]}>{recipe.title}</Text>
                  <Text style={[styles.recipeDesc, { color: colors.textSecondary }]}>"{recipe.description}"</Text>
              </View>

              {/* CARTE MACROS */}
              <View style={styles.macroRow}>
                  <GlassCard style={styles.macroBadge} intensity={20}>
                      <Text style={[styles.macroVal, {color: colors.primary}]}>{recipe.macros_per_serving?.calories || '?'}</Text>
                      <Text style={[styles.macroLabel, {color: colors.textSecondary}]}>KCAL</Text>
                  </GlassCard>
                  <GlassCard style={styles.macroBadge} intensity={20}>
                      <Text style={[styles.macroVal, {color: colors.success}]}>{recipe.macros_per_serving?.protein || '?'}g</Text>
                      <Text style={[styles.macroLabel, {color: colors.textSecondary}]}>PROT</Text>
                  </GlassCard>
                  <GlassCard style={styles.macroBadge} intensity={20}>
                      <Text style={[styles.macroVal, {color: colors.warning}]}>{recipe.macros_per_serving?.carbs || '?'}g</Text>
                      <Text style={[styles.macroLabel, {color: colors.textSecondary}]}>GLU</Text>
                  </GlassCard>
              </View>

              {/* INGRÉDIENTS */}
              <GlassCard style={styles.sectionCard} intensity={15}>
                  <View style={styles.sectionHeader}>
                      <MaterialCommunityIcons name="basket-outline" size={20} color={colors.primary} />
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>MISE EN PLACE</Text>
                  </View>
                  {recipe.ingredients?.map((ing: string, i: number) => (
                      <View key={i} style={styles.listItem}>
                          <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
                          <Text style={{ color: colors.textSecondary, flex: 1 }}>{ing}</Text>
                      </View>
                  ))}
              </GlassCard>

              {/* ÉTAPES */}
              <GlassCard style={styles.sectionCard} intensity={15}>
                  <View style={styles.sectionHeader}>
                      <MaterialCommunityIcons name="fire" size={20} color={colors.danger} />
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>EXÉCUTION</Text>
                  </View>
                  {recipe.steps?.map((step: string, i: number) => (
                      <View key={i} style={styles.stepItem}>
                          <Text style={[styles.stepNum, { color: colors.text, borderColor: colors.primary }]}>{i + 1}</Text>
                          <Text style={{ color: colors.textSecondary, flex: 1, lineHeight: 20 }}>{step}</Text>
                      </View>
                  ))}
              </GlassCard>

              {/* LE TIP DU CHEF */}
              {recipe.chef_tip && (
                  <LinearGradient 
                      colors={[colors.primary + '20', 'transparent']} 
                      style={styles.chefTipBox}
                  >
                      <View style={{flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 5}}>
                          <MaterialCommunityIcons name="star-face" size={20} color="#FFD700" />
                          <Text style={{color: '#FFD700', fontWeight: 'bold', letterSpacing: 1}}>LE SECRET DU CHEF</Text>
                      </View>
                      <Text style={{color: colors.text, fontStyle: 'italic'}}>
                          {recipe.chef_tip}
                      </Text>
                  </LinearGradient>
              )}

          </Animated.View>
      );
  };

  return (
    <ScreenLayout>
        {/* FOND D'AMBIANCE */}
        <Image 
            source={require('../../assets/adaptive-icon.png')} 
            style={[StyleSheet.absoluteFillObject, { opacity: 0.05, transform: [{scale: 2}] }]}
            blurRadius={50}
        />

        <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
            
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.pageTitle, { color: colors.text }]}>ATELIER GASTRONOMIQUE</Text>
            </View>

            {/* INPUT CARD */}
            <GlassCard style={styles.inputCard} intensity={30}>
                <Text style={[styles.label, {color: colors.primary}]}>QU'AVEZ-VOUS EN RÉSERVE ?</Text>
                <TextInput 
                    style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                    placeholder="Ex: Poulet, Avocat, Riz, Citron..."
                    placeholderTextColor={colors.textSecondary}
                    value={ingredients}
                    onChangeText={setIngredients}
                    multiline
                />
                <NeonButton 
                    label="CRÉER UN PLAT D'EXCEPTION" 
                    icon="silverware-fork-knife" 
                    onPress={handleGenerateRecipe}
                    loading={loading}
                />
            </GlassCard>

            <View style={{ height: 20 }} />

            {/* RÉSULTAT */}
            {recipe ? renderRecipe() : (
                !loading && (
                    <View style={styles.placeholder}>
                        <MaterialCommunityIcons name="food-variant" size={60} color={colors.textSecondary + '40'} />
                        <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
                            Le Chef Nexus attend vos ingrédients pour sublimer votre diète.
                        </Text>
                    </View>
                )
            )}

        </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  backBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, marginRight: 15 },
  pageTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 1 },

  inputCard: { padding: 20, borderRadius: 24 },
  label: { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
  input: { 
    borderWidth: 1, borderRadius: 12, padding: 15, fontSize: 16, minHeight: 80, 
    textAlignVertical: 'top', marginBottom: 20, backgroundColor: 'rgba(0,0,0,0.2)' 
  },

  // Recette Styles
  headerRecipe: { alignItems: 'center', marginVertical: 20 },
  recipeTitle: { fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 10, lineHeight: 28 },
  recipeDesc: { fontSize: 14, textAlign: 'center', fontStyle: 'italic', opacity: 0.8, lineHeight: 20 },

  macroRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 25 },
  macroBadge: { padding: 10, minWidth: 80, alignItems: 'center', borderRadius: 12 },
  macroVal: { fontSize: 18, fontWeight: '900' },
  macroLabel: { fontSize: 10, fontWeight: 'bold' },

  sectionCard: { padding: 20, borderRadius: 20, marginBottom: 15 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  sectionTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },

  listItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  bullet: { width: 6, height: 6, borderRadius: 3 },

  stepItem: { flexDirection: 'row', gap: 15, marginBottom: 15 },
  stepNum: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, textAlign: 'center', lineHeight: 22, fontSize: 12, fontWeight: 'bold' },

  chefTipBox: { padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#FFD700', marginTop: 10 },

  placeholder: { alignItems: 'center', justifyContent: 'center', marginTop: 50, opacity: 0.7 },
  placeholderText: { textAlign: 'center', marginTop: 15, maxWidth: 250, lineHeight: 20 },
});