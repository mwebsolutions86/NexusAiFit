import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Recipe } from '../types/recipe';
import { useSubscription } from './useSubscription';

export const useAIMealPrep = () => {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const { isPremium } = useSubscription();

  // 1. Lire les recettes (Livre de Cuisine)
  const { data: savedRecipes, isLoading: isLoadingRecipes } = useQuery({
    queryKey: ['savedRecipes'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];
      const { data } = await supabase.from('saved_recipes').select('*').order('created_at', { ascending: false });
      return data as Recipe[];
    },
  });

  // 2. Générer (Chef)
  const generateRecipeMutation = useMutation({
    mutationFn: async (ingredients: string) => {
      if (!isPremium) throw new Error("PREMIUM_REQUIRED");

      setIsGenerating(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Login required");

      const { data, error } = await supabase.functions.invoke('generate-plan', {
        body: {
          userId: session.user.id,
          type: 'meal_prep', // <--- C'EST ICI QUE CA SE JOUE
          userContext: ingredients || "Surprends-moi",
          language: 'fr'
        }
      });

      if (error) throw error;
      if (data.isError) throw new Error(data.error);

      // Le serveur renvoie directement la recette, pas besoin de .days
      return data as Recipe;
    },
    onSuccess: () => {
        setIsGenerating(false);
    },
    onError: (e) => {
      console.error("Erreur Chef:", e);
      setIsGenerating(false);
    }
  });

  // 3. Sauvegarder
  const saveRecipeMutation = useMutation({
    mutationFn: async (recipe: Recipe) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase.from('saved_recipes').insert({
        user_id: session.user.id,
        title: recipe.title,
        calories: recipe.calories,
        protein: recipe.macros?.protein || 0,
        carbs: recipe.macros?.carbs || 0,
        fat: recipe.macros?.fat || 0,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        storage_tips: recipe.storage_tips
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedRecipes'] });
    }
  });

  return {
    savedRecipes,
    isLoadingRecipes,
    generateRecipe: generateRecipeMutation.mutateAsync,
    saveRecipe: saveRecipeMutation.mutateAsync,
    isGenerating
  };
};