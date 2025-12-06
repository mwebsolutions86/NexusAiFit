import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAINutrition } from './useAINutrition'; // Pour lire le plan

export type ShoppingItem = {
  id: string;
  item_name: string;
  is_checked: boolean;
};

export const useShoppingList = () => {
  const queryClient = useQueryClient();
  const { activePlan } = useAINutrition();
  const [isGenerating, setIsGenerating] = useState(false);

  // 1. Lecture de la liste (Triée : Non-cochés en haut)
  const { data: items, isLoading } = useQuery({
    queryKey: ['shoppingList'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .eq('user_id', session.user.id)
        .order('is_checked', { ascending: true }) // Cochés en bas
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ShoppingItem[];
    },
  });

  // 2. Action : Basculer l'état (Cocher/Décocher)
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

  // 3. Action : Ajouter un item manuel
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

  // 4. Action : Nettoyer la liste (Tout supprimer)
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

  // 5. Action : IMPORTER depuis le Plan (Le Cerveau)
  const generateFromPlan = async () => {
    if (!activePlan?.content?.days) throw new Error("Aucun plan actif");
    setIsGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // A. Extraire tous les ingrédients uniques
      const ingredients = new Set<string>();
      
      activePlan.content.days.forEach(day => {
        day.meals.forEach(meal => {
            if (meal.items) {
                meal.items.forEach(item => {
                    // Nettoyage basique (retirer les quantités si possible, ou garder tel quel)
                    // Ex: "2 Oeufs" -> "2 Oeufs"
                    ingredients.add(item.name.trim());
                });
            }
        });
      });

      // B. Préparer l'insertion (Bulk)
      const toInsert = Array.from(ingredients).map(name => ({
        user_id: session.user.id,
        item_name: name,
        is_checked: false
      }));

      // C. Insérer (On ne supprime pas l'existant, on ajoute à la suite)
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