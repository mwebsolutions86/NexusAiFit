import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// Types
type TogglePayload = {
  id: string;
  is_checked: boolean;
};

export type ShoppingItem = {
  id: string;
  item_name: string;
  is_checked: boolean;
};

// 👇 FONCTION D'AGRÉGATION (Maths des ingrédients)
const aggregateIngredients = (rawIngredients: string[]) => {
    const map = new Map<string, { qty: number, unit: string }>();

    rawIngredients.forEach(raw => {
        // Regex pour capturer: "100" (qty) "g" (unit) "Riz" (name)
        const regex = /^([\d\.]+)\s*(\w*)\s+(.+)$/i;
        const match = raw.trim().match(regex);

        if (match) {
            const qty = parseFloat(match[1]);
            const unit = match[2].toLowerCase();
            const name = match[3].toLowerCase().trim();
            const key = `${name}_${unit}`;

            if (map.has(key)) {
                const existing = map.get(key)!;
                map.set(key, { ...existing, qty: existing.qty + qty });
            } else {
                map.set(key, { qty, unit });
            }
        } else {
            const key = raw.toLowerCase().trim();
            if (!map.has(key)) map.set(key, { qty: 1, unit: 'x' });
        }
    });

    return Array.from(map.entries()).map(([key, data]) => {
        const name = key.split('_')[0]; 
        const cleanName = name.charAt(0).toUpperCase() + name.slice(1);
        if (data.unit === 'x') return cleanName; 
        return `${Number(data.qty.toFixed(1))} ${data.unit} ${cleanName}`;
    });
};

export const useShoppingList = () => {
  const queryClient = useQueryClient();

  // 1. Lecture
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

  // 2. Actions Unitaires
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_checked }: TogglePayload) => {
      const { error } = await supabase.from('shopping_items').update({ is_checked: !is_checked }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shoppingList'] }),
  });

  const addMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { error } = await supabase.from('shopping_items').insert({ user_id: session.user.id, item_name: name, is_checked: false });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shoppingList'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shopping_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shoppingList'] }),
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { error } = await supabase.from('shopping_items').delete().eq('user_id', session.user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shoppingList'] }),
  });

  // 3. Génération Intelligente (Avec Nettoyage Préalable)
  const generateMutation = useMutation({
    mutationFn: async (ingredients: string[]) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
  
        // A. Agrégation
        const smartList = aggregateIngredients(ingredients);
        
        const toInsert = smartList.map(name => ({
          user_id: session.user.id,
          item_name: name,
          is_checked: false
        }));
  
        // B. Nettoyage et Insertion (Transaction implicite)
        if (toInsert.length > 0) {
            // 🛑 ON SUPPRIME TOUT D'ABORD
            await supabase.from('shopping_items').delete().eq('user_id', session.user.id);

            // ✅ PUIS ON INSÈRE
            const { error } = await supabase.from('shopping_items').insert(toInsert);
            if (error) throw error;
        }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shoppingList'] }),
  });

  return {
    items,
    isLoading,
    toggleItem: toggleMutation,
    addItem: addMutation,
    deleteItem: deleteMutation,
    clearList: clearMutation,
    generateFromPlan: generateMutation,
    isGenerating: generateMutation.isPending
  };
};