import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export type Meal = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
};

export type NutritionLog = {
  id?: string;
  user_id: string;
  log_date: string;
  meals: Meal[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
};

export const useNutritionLog = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  // 1. Fetcher le log du jour
  const query = useQuery({
    queryKey: ['nutritionLog', userId, today],
    enabled: !!userId,
    queryFn: async () => {
      // Sécurité TypeScript : bien que 'enabled' protège, on assure que userId est là
      if (!userId) return null;

      const { data, error } = await supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('log_date', today)
        .maybeSingle();

      if (error) throw error;
      
      // CORRECTION : On inclut user_id et log_date pour respecter le type NutritionLog
      if (!data) return { 
        user_id: userId,
        log_date: today,
        meals: [], 
        total_calories: 0, 
        total_protein: 0, 
        total_carbs: 0, 
        total_fat: 0 
      } as NutritionLog;

      return data as NutritionLog;
    },
  });

  // 2. Ajouter un repas
  const addMealMutation = useMutation({
    mutationFn: async (newMeal: Omit<Meal, 'id' | 'time'>) => {
      if (!userId) throw new Error("User not found");

      // Récupérer le log actuel (ou créer une structure par défaut complète)
      const currentLog = query.data || { 
        user_id: userId,
        log_date: today,
        meals: [], 
        total_calories: 0, 
        total_protein: 0, 
        total_carbs: 0, 
        total_fat: 0 
      };
      
      const mealWithId: Meal = {
        ...newMeal,
        id: Math.random().toString(36).substr(2, 9),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const updatedMeals = [...(currentLog.meals || []), mealWithId];

      // Recalculer les totaux
      const stats = updatedMeals.reduce((acc, item) => ({
        calories: acc.calories + (item.calories || 0),
        protein: acc.protein + (item.protein || 0),
        carbs: acc.carbs + (item.carbs || 0),
        fat: acc.fat + (item.fat || 0),
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

      const payload = {
        user_id: userId,
        log_date: today,
        meals: updatedMeals,
        total_calories: stats.calories,
        total_protein: stats.protein,
        total_carbs: stats.carbs,
        total_fat: stats.fat,
      };

      // Upsert dans Supabase
      const { data, error } = await supabase
        .from('nutrition_logs')
        .upsert(payload, { onConflict: 'user_id, log_date' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Rafraîchir le cache Nutrition ET le Dashboard
      queryClient.invalidateQueries({ queryKey: ['nutritionLog'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });

  // 3. Supprimer un repas
  const deleteMealMutation = useMutation({
    mutationFn: async (mealId: string) => {
      if (!userId || !query.data?.meals) return;

      const updatedMeals = query.data.meals.filter(m => m.id !== mealId);
      
      // Recalculer les totaux (Code dupliqué pour la sécurité, idéalement une fonction helper)
      const stats = updatedMeals.reduce((acc, item) => ({
        calories: acc.calories + (item.calories || 0),
        protein: acc.protein + (item.protein || 0),
        carbs: acc.carbs + (item.carbs || 0),
        fat: acc.fat + (item.fat || 0),
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

      const { error } = await supabase
        .from('nutrition_logs')
        .upsert({
          user_id: userId,
          log_date: today,
          meals: updatedMeals,
          total_calories: stats.calories,
          total_protein: stats.protein,
          total_carbs: stats.carbs,
          total_fat: stats.fat,
        }, { onConflict: 'user_id, log_date' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutritionLog'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });

  return {
    log: query.data,
    isLoading: query.isLoading,
    addMeal: addMealMutation.mutateAsync,
    isAdding: addMealMutation.isPending,
    deleteMeal: deleteMealMutation.mutateAsync,
  };
};