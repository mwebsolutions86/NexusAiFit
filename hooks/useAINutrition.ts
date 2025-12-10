import { useState } from 'react';
import { generateMealPlanJSON } from '../lib/groq'; // Assure-toi que cette fonction existe dans groq.ts
import { supabase } from '../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';

export function useAINutrition() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // On récupère le plan actif depuis le cache ou via un hook séparé, 
  // mais ici on gère surtout la génération.
  
  const generateNutrition = async ({ userProfile, preferences }: { userProfile: any, preferences: string }) => {
    if (!userProfile) {
      setError("Profil manquant");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      console.log(`🍎 [Nutrition] Lancement génération IA...`);
      
      // 1. GÉNÉRATION IA
      // On passe le profil et les préférences à Groq
      const data = await generateMealPlanJSON(userProfile, preferences);
      
      if (!data || data.error) throw new Error(data?.error || "Réponse IA vide");
      
      // Validation structurelle minimale
      if (!data.days || !Array.isArray(data.days)) {
          throw new Error("Format du plan nutritionnel invalide.");
      }

      console.log(`✅ [Nutrition] Plan généré (${data.days.length} jours). Sauvegarde...`);

      // 2. SAUVEGARDE SUPABASE
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
          // A. Archiver l'ancien plan (is_active = false)
          const { error: updateError } = await supabase
            .from('plans')
            .update({ is_active: false })
            .eq('user_id', user.id)
            .eq('type', 'nutrition'); // ⚠️ IMPORTANT : Type 'nutrition'

          if (updateError) console.warn("⚠️ Erreur archivage ancien plan:", updateError);

          // B. Insérer le nouveau plan
          const { error: insertError } = await supabase
            .from('plans')
            .insert({
                user_id: user.id,
                type: 'nutrition', // ⚠️ On taggue bien 'nutrition'
                content: data,     // Le JSON pur
                is_active: true,
                created_at: new Date().toISOString()
            });

          if (insertError) {
              console.error("❌ ERREUR INSERT SUPABASE:", insertError.message);
              throw new Error("Erreur sauvegarde: " + insertError.message);
          }

          // C. Rafraîchir l'interface
          await queryClient.invalidateQueries({ queryKey: ['activePlans'] });
          console.log("🔄 Cache invalidé & Plan sauvegardé.");
      }

      setMealPlan(data); // Mise à jour locale immédiate
      Alert.alert("Succès", "Nouveau plan nutritionnel activé !");
    
    } catch (err: any) {
      console.error("❌ CRASH NUTRITION:", err);
      setError(err.message);
      Alert.alert("Oups", "Échec de la génération : " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return { 
    generateNutrition, 
    mealPlan, 
    isGenerating, 
    error,
    // Pour compatibilité avec ton UI qui attend 'isLoadingPlan'
    isLoadingPlan: isGenerating 
  };
}