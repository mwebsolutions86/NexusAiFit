// hooks/useNutritionMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { NutritionLogDB, ConsumedItem } from '../types/nutrition';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export const useNutritionMutations = (dateStr: string) => {
  const queryClient = useQueryClient();
  const queryKey = ['nutritionLog', dateStr];

  const toggleItem = useMutation({
    mutationFn: async ({ item, mealName, currentLog }: { item: any, mealName: string, currentLog: NutritionLogDB | null }) => {
      if (Platform.OS !== 'web') Haptics.selectionAsync();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      // 1. Préparer la liste actuelle
      let currentList: ConsumedItem[] = currentLog?.meals_status || [];
      
      // 2. Vérifier si l'item est déjà coché
      // Clé unique = NomRepas + NomItem
      const existingIndex = currentList.findIndex(
          i => i.name === item.name && i.mealName === mealName
      );

      let newList = [...currentList];
      
      if (existingIndex >= 0) {
        // RETIRER (Décocher)
        newList.splice(existingIndex, 1);
      } else {
        // AJOUTER (Cocher)
        newList.push({
          name: item.name,
          mealName: mealName,
          calories: item.calories || 0,
          protein: item.protein || 0,
          eatenAt: new Date().toISOString()
        });
      }

      // 3. Recalculer les totaux
      const totalCals = newList.reduce((acc, curr) => acc + (curr.calories || 0), 0);
      const totalProt = newList.reduce((acc, curr) => acc + (curr.protein || 0), 0);

      // 4. Upsert en base
      const { data, error } = await supabase
        .from('nutrition_logs')
        .upsert({
          user_id: user.id,
          log_date: dateStr,
          meals_status: newList,
          total_calories: totalCals,
          total_protein: totalProt,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, log_date' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // OPTIMISTIC UI : On met à jour l'écran AVANT la réponse serveur
    onMutate: async ({ item, mealName }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousLog = queryClient.getQueryData<NutritionLogDB>(queryKey);

      if (previousLog) {
         // Simulation de la logique locale pour l'affichage immédiat
         const currentList = previousLog.meals_status || [];
         const exists = currentList.find(i => i.name === item.name && i.mealName === mealName);
         
         let newList = exists 
            ? currentList.filter(i => !(i.name === item.name && i.mealName === mealName))
            : [...currentList, { name: item.name, mealName, calories: item.calories, protein: item.protein, eatenAt: new Date().toISOString() }];

         const newTotalCals = newList.reduce((acc, curr) => acc + curr.calories, 0);
         const newTotalProt = newList.reduce((acc, curr) => acc + curr.protein, 0);

         queryClient.setQueryData(queryKey, {
             ...previousLog,
             meals_status: newList,
             total_calories: newTotalCals,
             total_protein: newTotalProt
         });
      }
      return { previousLog };
    },

    onError: (err, vars, context) => {
      if (context?.previousLog) {
        queryClient.setQueryData(queryKey, context.previousLog);
      }
      console.error("Erreur Sync Nutrition:", err);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    }
  });

  return { toggleItem };
};