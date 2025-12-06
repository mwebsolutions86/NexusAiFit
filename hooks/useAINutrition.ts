import { useState } from 'react';
import { generateMealPlanJSON } from '../lib/groq';
import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';

export function useAINutrition() {
  const [loading, setLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // 1. GÉNÉRATION
  const generateNutrition = async (profile: any, preferences: string) => {
    if (!profile) {
      setError("Profil manquant");
      return;
    }

    setLoading(true);
    setError(null);
    setMealPlan(null);

    try {
      console.log(`🥗 [Nutrition] Envoi demande pour : ${preferences}`);
      const data = await generateMealPlanJSON(profile, preferences);

      if (!data || data.error) throw new Error(data?.error || "Erreur IA");

      console.log("✅ [Nutrition] Plan reçu !");
      setMealPlan(data);
    } catch (err: any) {
      console.error("❌ Erreur Nutrition:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. SAUVEGARDE (Synchronisation Dashboard)
  const savePlanToDashboard = async () => {
    if (!mealPlan) return;
    
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecté");

      // On désactive les anciens plans nutrition
      await supabase.from('plans').update({ is_active: false }).eq('user_id', user.id).eq('type', 'nutrition');

      // On insère le nouveau
      const { error } = await supabase.from('plans').insert({
        user_id: user.id,
        type: 'nutrition',
        content: mealPlan, // Le JSON complet
        is_active: true,
        created_at: new Date()
      });

      if (error) throw error;
      Alert.alert("Succès", "Votre plan nutritionnel est actif et visible sur le dashboard !");
    } catch (e: any) {
      Alert.alert("Erreur Sauvegarde", e.message);
    } finally {
      setLoading(false);
    }
  };

  return { generateNutrition, mealPlan, loading, error, savePlanToDashboard };
}