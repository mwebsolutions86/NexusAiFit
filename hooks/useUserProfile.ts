import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const useUserProfile = () => {
  // 1. On récupère 'refetch' depuis useQuery
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return null;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  return { 
    userProfile: data, 
    isLoading, 
    error,
    refetch // ✅ 2. On l'ajoute ici pour qu'il soit accessible
  };
};