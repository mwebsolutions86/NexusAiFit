import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { generateWorkoutJSON } from '../lib/groq';
import { Alert } from 'react-native';

export const useAIWorkout = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fonction privée pour récupérer la mémoire musculaire
  const fetchWorkoutHistory = async (userId: string) => {
    // On récupère les 3 dernières sessions avec leurs stats
    const { data: history } = await supabase
      .from('workout_logs')
      .select('log_date, session_note, exercises_status')
      .eq('user_id', userId)
      .order('log_date', { ascending: false })
      .limit(3);

    return history || [];
  };

  const generateWorkout = async (userProfile: any, focus: string) => {
    if (!userProfile) return;
    setLoading(true);
    setError(null);

    try {
      // 1. RÉCUPÉRATION DU CONTEXTE (MÉMOIRE)
      const history = await fetchWorkoutHistory(userProfile.id);
      
      // 2. PRÉPARATION DU PAYLOAD INTELLIGENT
      // On injecte l'historique dans la requête
      const contextPayload = {
        focus,
        lastSessions: history.map(h => ({
          date: h.log_date,
          note: h.session_note,
          perf: h.exercises_status // Contient maintenant { done, weight, reps } grâce à la Phase 2
        }))
      };

      // 3. APPEL AU CERVEAU CENTRAL
      // Note: On passe l'objet complexe en string pour que le backend le reçoive comme "preferences" 
      // ou idéalement, on mettra à jour le backend pour accepter un champ "history".
      // Pour l'instant, on ruse en le passant dans le prompt contextuel.
      const aiResponse = await generateWorkoutJSON(
        userProfile, 
        JSON.stringify(contextPayload) // On passe tout le contexte comme "focus/preferences" pour l'instant
      );

      // 4. SAUVEGARDE DU PLAN TACTIQUE
      const { error: saveError } = await supabase
        .from('plans')
        .upsert({
          user_id: userProfile.id,
          type: 'workout',
          content: aiResponse,
          is_active: true,
          created_at: new Date().toISOString()
        });

      if (saveError) throw saveError;

      await queryClient.invalidateQueries({ queryKey: ['activePlans'] });
      return aiResponse;

    } catch (err: any) {
      console.error("Neural Failure:", err);
      setError(err.message);
      Alert.alert("Erreur IA", "Connexion neuronale instable. Réessayez.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { generateWorkout, loading, error };
};