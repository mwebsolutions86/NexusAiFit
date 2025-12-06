import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const useDashboardStats = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['dashboardStats', userId],
    enabled: !!userId,
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      // 1. Calories consommées AUJOURD'HUI (Table V2)
      const { data: nutritionToday } = await supabase
        .from('nutrition_logs')
        .select('total_calories')
        .eq('user_id', userId)
        .eq('log_date', today)
        .maybeSingle();

      // 2. Séances de sport cette semaine
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: weeklyWorkouts } = await supabase
        .from('workout_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('log_date', sevenDaysAgo.toISOString().split('T')[0]);

      // 3. Récupérer un target par défaut du profil (fallback)
      const { data: profile } = await supabase
        .from('profiles')
        .select('fitness_level, weight')
        .eq('id', userId)
        .single();
        
      // Estimation basique si pas de plan
      const defaultTarget = (profile?.weight || 70) * 30; 

      return {
        caloriesConsumed: nutritionToday?.total_calories || 0,
        weeklyWorkouts: weeklyWorkouts || 0,
        targetCalories: defaultTarget // Utilisé seulement si pas de plan IA actif
      };
    },
    // Rafraîchir toutes les minutes si l'écran est focus
    refetchInterval: 60000 
  });
};