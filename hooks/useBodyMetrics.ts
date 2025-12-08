import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// Liste complète des types de mesures supportées
export type MetricType = 
  | 'bmi' | 'weight' | 'body_fat' 
  | 'neck' | 'shoulders' | 'chest' | 'biceps' | 'forearms'
  | 'waist' | 'hips' | 'thighs' | 'calves';

export const useBodyMetrics = (type?: MetricType) => {
  const queryClient = useQueryClient();

  // 1. Récupérer l'historique (Si un type spécifique est demandé)
  const { data: history, isLoading } = useQuery({
    queryKey: ['metrics', type],
    queryFn: async () => {
      if (!type) return [];
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecté");

      const { data, error } = await supabase
        .from('body_metrics')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', type)
        .order('date', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!type 
  });

  // 2. Snapshot (Dernières valeurs connues pour TOUT le corps)
  const { data: latestMetrics, isLoading: isLoadingLatest } = useQuery({
    queryKey: ['metrics_latest'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return {};

      const { data } = await supabase
        .from('body_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      const latestItems: Record<string, any> = {}; 
      
      data?.forEach((item: any) => {
          if (!latestItems[item.type] || new Date(item.date).getTime() > new Date(latestItems[item.type].date).getTime()) {
              latestItems[item.type] = item; 
          }
      });
      
      const finalLatest: Record<string, number> = {};
      Object.keys(latestItems).forEach(key => {
          finalLatest[key] = latestItems[key].value;
      });

      return finalLatest;
    }
  });

  // 3. Ajouter une mesure (Mutation)
  const addMetric = useMutation({
    mutationFn: async ({ type, value }: { type: MetricType, value: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecté");

      const { error } = await supabase.from('body_metrics').insert({
        user_id: user.id,
        type,
        value,
        date: new Date().toISOString().split('T')[0]
      });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      // Invalide l'historique de ce type ET le snapshot global (Force le re-fetch)
      queryClient.invalidateQueries({ queryKey: ['metrics', variables.type] });
      queryClient.invalidateQueries({ queryKey: ['metrics_latest'] });
      
      if (variables.type === 'weight') {
          queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      }
    }
  });

  return {
    history,
    latestMetrics,
    isLoading: isLoading || isLoadingLatest,
    addMetric
  };
};