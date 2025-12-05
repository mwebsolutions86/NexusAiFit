import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

// Type de retour explicite pour garantir à TypeScript que targetCalories existe
type DashboardStats = {
  caloriesConsumed: number;
  weeklyWorkouts: number;
  targetCalories: number;
};

export const useDashboardStats = (userId: string | undefined) => {
  return useQuery<DashboardStats>({
    queryKey: ['dashboardStats', userId],
    // On laisse enabled true même sans userId pour afficher les données de simulation
    queryFn: async () => {
      // --- MODE SIMULATION (Valeurs par défaut) ---
      // Ces chiffres s'afficheront si la DB est vide ou en cas d'erreur
      const MOCK_DATA = {
        caloriesConsumed: 0, 
        weeklyWorkouts: 0,      
        targetCalories: 2000    // Valeur par défaut standard
      };

      if (!userId) return MOCK_DATA;

      try {
        const today = new Date().toISOString().split('T')[0];
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Lancement des requêtes en parallèle pour la performance
        const [nutLogRes, workoutRes, mealPlanRes] = await Promise.all([
          // 1. Récupérer Nutrition consommée aujourd'hui
          supabase
            .from('nutrition_logs')
            .select('total_calories')
            .eq('user_id', userId)
            .eq('log_date', today)
            .maybeSingle(),

          // 2. Récupérer Sport de la semaine
          supabase
            .from('workout_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('log_date', sevenDaysAgo.toISOString()),

          // 3. Récupérer le Plan Nutritionnel Actif pour l'objectif
          supabase
            .from('meal_plans')
            .select('content')
            .eq('user_id', userId)
            .eq('is_active', true)
            .maybeSingle()
        ]);

        // Calcul de l'objectif calorique dynamique
        let dynamicTarget = 2000; // Fallback si pas de plan

        if (mealPlanRes.data?.content?.days) {
          // On trouve l'index du jour (Lundi = 0, Dimanche = 6)
          const todayIndex = (new Date().getDay() + 6) % 7;
          const todayPlan = mealPlanRes.data.content.days[todayIndex];

          if (todayPlan?.meals) {
            // On somme les calories de tous les repas prévus pour ce jour
            const dailyTotal = todayPlan.meals.reduce((acc: number, meal: any) => {
              return acc + (parseInt(meal.calories) || 0);
            }, 0);
            
            if (dailyTotal > 0) {
              dynamicTarget = dailyTotal;
            }
          }
        }

        return {
          caloriesConsumed: nutLogRes.data?.total_calories || 0,
          weeklyWorkouts: workoutRes.count || 0,
          targetCalories: dynamicTarget, 
        };

      } catch (error) {
        console.error("Erreur fetch stats:", error);
        // En cas de pépin, on renvoie les données de simulation pour ne pas casser l'UI
        return MOCK_DATA;
      }
    },
  });
};