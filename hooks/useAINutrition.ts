import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

export function useAINutrition() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const [localPlan, setLocalPlan] = useState<any>(null);

  const generateNutrition = async ({ userProfile, preferences }: any) => {
    setIsGenerating(true);
    setError(null);

    try {
      console.log("🥗 [Nutrition] Lancement génération...");

      const { data, error: funcError } = await supabase.functions.invoke('supafit-ai', {
        body: {
          type: 'MEAL',
          userProfile,
          preferences
        }
      });

      if (funcError) throw funcError;
      
      if (data && data.error === "QUOTA_EXCEEDED") {
          throw new Error("QUOTA_EXCEEDED");
      }

      let planContent = data;
      if (typeof data === 'string') {
          try { planContent = JSON.parse(data); } catch (e) { console.error("JSON Parse Error", e); }
      }

      console.log("🥗 [Nutrition] Sauvegarde en DB...");

      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
          await supabase
            .from('plans')
            .update({ is_active: false })
            .eq('user_id', user.id)
            .in('type', ['meal', 'nutrition', 'MEAL']);

          const { error: saveError } = await supabase
            .from('plans')
            .insert({
                user_id: user.id,
                type: 'meal',
                content: planContent,
                is_active: true,
                created_at: new Date()
            });

          if (saveError) throw saveError;
          await queryClient.invalidateQueries({ queryKey: ['activePlans'] });
      }

      setLocalPlan({ content: planContent });

    } catch (err: any) {
      console.error("❌ Erreur Nutrition:", err);
      setError(err.message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateNutrition,
    mealPlan: localPlan,
    isGenerating,
    isLoadingPlan: isGenerating, // ✅ CORRECTION : On ajoute cette propriété manquante
    error
  };
}