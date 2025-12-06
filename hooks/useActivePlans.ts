import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const useActivePlans = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['activePlans', userId],
    enabled: !!userId,
    queryFn: async () => {
      // ARCHITECTURE V2 : On cible la table unifiée 'plans'
      // On récupère tous les plans actifs de l'utilisateur en une seule requête
      const { data, error } = await supabase
        .from('plans')
        .select('type, content')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('Erreur de synchronisation Dashboard:', error);
        return { workoutPlan: null, mealPlan: null };
      }

      // Filtrage en mémoire (Extrêmement rapide)
      // On cherche le plan de type 'workout'
      const workoutRow = data.find((p) => p.type === 'workout');
      
      // On cherche le plan de type 'nutrition' ou 'meal'
      const mealRow = data.find((p) => p.type === 'nutrition' || p.type === 'meal');

      return {
        // On retourne l'objet JSON complet stocké dans la colonne 'content'
        workoutPlan: workoutRow?.content || null,
        mealPlan: mealRow?.content || null,
      };
    },
    // Optionnel : On garde les données en cache 5 minutes pour éviter trop d'appels
    staleTime: 1000 * 60 * 5, 
  });
};