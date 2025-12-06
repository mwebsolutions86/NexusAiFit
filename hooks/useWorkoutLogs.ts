import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export type LogEntry = {
  id: string;
  log_date: string;
  session_note: string;
  exercises_status: any[]; // Notre liste d'exercices
  created_at: string;
};

export const useWorkoutLogs = () => {
  return useQuery({
    queryKey: ['workoutLogs'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .order('log_date', { ascending: false }); // Plus récent en haut

      if (error) throw error;
      return data as LogEntry[];
    },
  });
};