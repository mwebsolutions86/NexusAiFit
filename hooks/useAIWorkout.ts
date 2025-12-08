import { useState } from 'react';
import { generateWorkoutJSON } from '../lib/groq';
import { supabase } from '../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native'; // Pour le debug visuel

export function useAIWorkout() {
  const [loading, setLoading] = useState(false);
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const generateWorkout = async (profile: any, focus: string) => {
    if (!profile) {
      setError("Profil manquant");
      return;
    }

    setLoading(true);
    setError(null);
    setWorkoutPlan(null);

    try {
      console.log(`🏋️‍♂️ [Workout] Envoi demande IA...`);
      
      // 1. APPEL IA
      const data = await generateWorkoutJSON(profile, focus);
      
      if (!data || data.error) throw new Error(data?.error || "Réponse vide de l'IA");
      
      // Vérification rapide de la structure
      if (!data.days || !Array.isArray(data.days)) {
          console.error("Structure reçue invalide:", data);
          throw new Error("L'IA a renvoyé un format invalide.");
      }

      console.log(`✅ [Workout] Reçu ${data.days.length} jours.`);

      // 2. SAUVEGARDE DB
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
          // A. Désactiver l'ancien
          await supabase
            .from('plans')
            .update({ is_active: false })
            .eq('user_id', user.id)
            .eq('type', 'workout');

          // B. Insérer le nouveau
          const { error: saveError } = await supabase
            .from('plans')
            .insert({
                user_id: user.id,
                type: 'workout',
                content: data,
                is_active: true,
                created_at: new Date()
            });

          if (saveError) {
              console.error("❌ ERREUR SUPABASE:", saveError.message);
              throw saveError; // On lance l'erreur pour la catcher plus bas
          }

          // C. Invalidation PUISSANTE du cache
          // On invalide tout ce qui commence par 'activePlans'
          await queryClient.invalidateQueries({ queryKey: ['activePlans'] });
          console.log("🔄 Cache invalidé");
      }

      setWorkoutPlan(data);
    
    } catch (err: any) {
      console.error("❌ CRASH WORKOUT:", err);
      setError(err.message);
      Alert.alert("Echec", "Erreur technique: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return { 
    generateWorkout, 
    workoutPlan, 
    loading, 
    error
  };
}