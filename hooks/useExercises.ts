// app/hooks/useExercises.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type Exercise = {
  id: string;
  code_id: string;
  name: string;
  muscle: string;
  equipment: string;
  difficulty: string;
  instructions: string;
};

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchExercises() {
      try {
        // On récupère tout (vous pourrez ajouter de la pagination plus tard si >500 items)
        const { data, error } = await supabase
          .from('exercises')
          .select('*')
          .order('name');

        if (error) throw error;

        if (isMounted && data) {
          setExercises(data);
        }
      } catch (e) {
        console.error('Erreur chargement exercices:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchExercises();

    return () => { isMounted = false; };
  }, []);

  return { exercises, loading };
}