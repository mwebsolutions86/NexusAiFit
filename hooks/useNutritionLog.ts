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
      
      // On retourne un objet par défaut si rien n'existe encore pour ce jour
      return (data as NutritionLogDB) || { 
          meals_status: [], 
          total_calories: 0, 
          total_protein: 0 
      };
    },
  });
};