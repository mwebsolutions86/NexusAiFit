import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const useActivePlans = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['activePlans', userId],
    queryFn: async () => {
      if (!userId) return null;

      // 1. Récupérer le plan Sport Actif
      const { data: workoutData } = await supabase
        .from('plans')
        .select('content')
        .eq('user_id', userId)
        .eq('type', 'workout')
        .eq('is_active', true)
        .maybeSingle();

      // 2. Récupérer le plan Nutrition Actif (CORRECTION ICI)
      // On cherche soit 'meal', soit 'nutrition', soit 'MEAL' pour être sûr de le trouver
      const { data: mealData } = await supabase
        .from('plans')
        .select('content')
        .eq('user_id', userId)
        .in('type', ['meal', 'nutrition', 'MEAL']) 
        .eq('is_active', true)
        .maybeSingle();

      // DEBUG : Pour voir si on a trouvé quelque chose cette fois
      console.log(`📥 [ActivePlans] Workout: ${!!workoutData} | Meal: ${!!mealData}`);

      return {
        workoutPlan: workoutData ? workoutData.content : null,
        mealPlan: mealData ? mealData.content : null,
      };
    },
    enabled: !!userId,
  });
};