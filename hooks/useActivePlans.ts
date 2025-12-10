import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const useActivePlans = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['activePlans', userId],
    queryFn: async () => {
      if (!userId) return null;

      // 1. Récupérer le plan Sport Actif (Le plus récent)
      const { data: workoutData } = await supabase
        .from('plans')
        .select('content')
        .eq('user_id', userId)
        .eq('type', 'workout')
        .eq('is_active', true)
        .order('created_at', { ascending: false }) // Priorité au dernier créé
        .limit(1)
        .maybeSingle();

      // 2. Récupérer le plan Nutrition Actif (Le plus récent)
      // On cherche 'nutrition' OU 'meal' pour la compatibilité
      const { data: mealData } = await supabase
        .from('plans')
        .select('content')
        .eq('user_id', userId)
        .in('type', ['nutrition', 'meal', 'MEAL']) 
        .eq('is_active', true)
        .order('created_at', { ascending: false }) // Priorité absolue au dernier généré
        .limit(1)
        .maybeSingle();

      // DEBUG : Vérification dans la console
      console.log(`📥 [ActivePlans] Workout: ${!!workoutData} | Meal: ${!!mealData}`);

      return {
        workoutPlan: workoutData ? workoutData.content : null,
        mealPlan: mealData ? mealData.content : null,
      };
    },
    enabled: !!userId,
    // On garde les données fraîches mais on évite le spam
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};