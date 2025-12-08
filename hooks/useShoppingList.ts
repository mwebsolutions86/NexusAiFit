import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAINutrition } from './useAINutrition'; 
import { NutritionDay, Meal, MealItem } from '../types/nutrition'; // ✅ Types importés

export type ShoppingItem = {
  id: string;
  item_name: string;
  is_checked: boolean;
};

export const useShoppingList = () => {
  const queryClient = useQueryClient();
  
  // ✅ CORRECTION 1 : On récupère 'mealPlan' (le nouveau nom)
  const { mealPlan } = useAINutrition(); 
  
  const [isGenerating, setIsGenerating] = useState(false);

  // 1. Lecture de la liste
  const { data: items, isLoading } = useQuery({
    queryKey: ['shoppingList'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .eq('user_id', session.user.id)
        .order('is_checked', { ascending: true }) 
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ShoppingItem[];
    },
  });

  // 2. Basculer l'état
  const toggleMutation = useMutation({
    mutationFn: async (item: ShoppingItem) => {
      const { error } = await supabase
        .from('shopping_items')
        .update({ is_checked: !item.is_checked })
        .eq('id', item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shoppingList'] });
    },
  });

  // 3. Ajouter un item
  const addMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { error } = await supabase
        .from('shopping_items')
        .insert({ user_id: session.user.id, item_name: name, is_checked: false });
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shoppingList'] });
    },
  });

  // 4. Nettoyer la liste
  const clearMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .eq('user_id', session.user.id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shoppingList'] });
    },
  });

  // 5. Importer depuis le Plan (GÉNÉRATEUR)
  const generateFromPlan = async () => {
    // ✅ CORRECTION 2 : Vérification sur mealPlan
    if (!mealPlan?.content?.days) throw new Error("Aucun plan actif");
    setIsGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const ingredients = new Set<string>();
      
      // ✅ CORRECTION 3 : Typage explicite des itérateurs
      mealPlan.content.days.forEach((day: NutritionDay) => {
        if (day.meals) {
            day.meals.forEach((meal: Meal) => {
                if (meal.items) {
                    meal.items.forEach((item: MealItem) => {
                        if (item.name) ingredients.add(item.name.trim());
                    });
                }
            });
        }
      });

      const toInsert = Array.from(ingredients).map(name => ({
        user_id: session.user.id,
        item_name: name,
        is_checked: false
      }));

      if (toInsert.length > 0) {
          const { error } = await supabase
            .from('shopping_items')
            .insert(toInsert);
          if (error) throw error;
      }
      
      queryClient.invalidateQueries({ queryKey: ['shoppingList'] });

    } catch (e) {
        console.error(e);
        throw e;
    } finally {
        setIsGenerating(false);
    }
  };

  return {
    items,
    isLoading,
    toggleItem: toggleMutation.mutate,
    addItem: addMutation.mutateAsync,
    clearList: clearMutation.mutate,
    generateFromPlan,
    isGenerating
  };
};