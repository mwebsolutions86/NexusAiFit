import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { NutritionLogData } from '../types/nutrition'; // Maintenant ça existe !

export const useNutritionLogger = () => {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const saveLogMutation = useMutation({
    mutationFn: async (data: NutritionLogData) => {
      setIsSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Utilisateur non connecté");
      
      // 1. Check si log existe pour ce jour
      const { data: existing } = await supabase
        .from('nutrition_logs')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('log_date', data.logDate)
        .maybeSingle();

      let error;
      
      if (existing) {
        // UPDATE
        const { error: upError } = await supabase
          .from('nutrition_logs')
          .update({
             meals_status: data.mealsStatus, // JSONB Snapshot
             total_calories: data.totalCalories,
             total_protein: data.totalProtein,
             updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        error = upError;
      } else {
        // INSERT
        const { error: inError } = await supabase
          .from('nutrition_logs')
          .insert({
             user_id: session.user.id,
             log_date: data.logDate,
             meals_status: data.mealsStatus,
             total_calories: data.totalCalories,
             total_protein: data.totalProtein
          });
        error = inError;
      }

      if (error) throw error;
      return true;
    },
    onSuccess: (_, variables) => {
      // Rafraîchir l'UI
      queryClient.invalidateQueries({ queryKey: ['nutritionLog', variables.logDate] }); // Attention au singulier/pluriel de la clé (aligné avec useNutritionLog)
      queryClient.invalidateQueries({ queryKey: ['dailyNutritionLog'] }); 
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setIsSaving(false);
    },
    onError: (e) => {
      console.error("Erreur save nutrition:", e);
      setIsSaving(false);
    }
  });

  return {
    saveLog: saveLogMutation.mutateAsync,
    isSaving
  };
};