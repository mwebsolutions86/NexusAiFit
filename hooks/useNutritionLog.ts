// hooks/useNutritionLog.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { NutritionLogDB } from '../types/nutrition';

export const useNutritionLog = (dateStr: string) => {
  return useQuery({
    queryKey: ['nutritionLog', dateStr],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data, error } = await supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('log_date', dateStr)
        .maybeSingle();

      if (error) throw error;
      
      // ✅ CORRECTION BLINDÉE
      if (data) {
          // Si meals_status est un objet '{}' (défaut SQL) ou null, on force un tableau []
          const safeMealsStatus = Array.isArray(data.meals_status) ? data.meals_status : [];
          return { ...data, meals_status: safeMealsStatus };
      }

      // Cas où aucune ligne n'existe encore
      return { 
          meals_status: [], 
          total_calories: 0, 
          total_protein: 0 
      };
    },
  });
};