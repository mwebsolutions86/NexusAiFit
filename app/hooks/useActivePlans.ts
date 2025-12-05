import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export const useActivePlans = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['activePlans', userId],
    enabled: !!userId,
    queryFn: async () => {
      // On utilise Promise.all pour lancer les deux requêtes en parallèle (gain de temps x2)
      const [workoutRes, mealRes] = await Promise.all([
        supabase
          .from('workout_plans')
          .select('title, content')
          .eq('user_id', userId)
          .eq('is_active', true)
          .maybeSingle(),
        supabase
          .from('meal_plans')
          .select('title, content')
          .eq('user_id', userId)
          .eq('is_active', true)
          .maybeSingle()
      ]);

      return {
        workoutPlan: workoutRes.data?.content || null,
        mealPlan: mealRes.data?.content || null,
      };
    },
  });
};