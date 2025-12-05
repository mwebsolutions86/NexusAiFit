import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export const useUserProfile = () => {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.log('Error fetching profile:', error);
        return null;
      }
      return data;
    },
  });
};