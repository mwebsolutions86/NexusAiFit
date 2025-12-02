import { useState } from 'react';
import { supabase } from '../../lib/supabase';

// Types pour sécuriser les données envoyées
export type WorkoutSetData = {
  exerciseName: string; // Le nom (ex: "Développé Couché") pour retrouver l'ID
  reps: number;
  weight: number;
  rpe?: number; // Difficulté ressentie (1-10)
};

export type WorkoutSessionData = {
  name: string;   // ex: "Push Day A"
  duration: number; // en secondes
  notes?: string;
  sets: WorkoutSetData[];
};

export const useWorkoutLogger = () => {
  const [isSaving, setIsSaving] = useState(false);

  const saveWorkout = async (data: WorkoutSessionData) => {
    setIsSaving(true);
    try {
      // 1. Vérification Utilisateur
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Utilisateur non connecté");

      // 2. Création de la SÉANCE
      const { data: sessionLog, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: session.user.id,
          name: data.name,
          duration_seconds: data.duration,
          notes: data.notes
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      if (!sessionLog) throw new Error("Impossible de créer la séance");

      const sessionId = sessionLog.id;
      const setsToInsert = [];

      // 3. Récupération des IDs d'exercices (Mapping Nom -> UUID)
      // On charge le dictionnaire des exercices pour éviter de faire 1 requête par set
      const { data: allExercises } = await supabase
        .from('exercises')
        .select('id, name');

      // 4. Préparation des données à insérer
      // On parcourt les sets envoyés par l'app
      for (let i = 0; i < data.sets.length; i++) {
        const set = data.sets[i];
        let exerciseId = null;

        // Recherche intelligente de l'ID par le nom (insensible à la casse)
        if (allExercises) {
           const match = allExercises.find(e => 
             e.name.trim().toLowerCase() === set.exerciseName.trim().toLowerCase()
           );
           if (match) exerciseId = match.id;
        }

        // Si on a trouvé l'exercice dans la DB, on prépare l'insertion
        if (exerciseId) {
          setsToInsert.push({
            session_id: sessionId,
            exercise_id: exerciseId,
            set_order: i + 1,
            reps: set.reps,
            weight_kg: set.weight,
            rpe: set.rpe || 0
          });
        } else {
            console.warn(`Exercice non trouvé en base: ${set.exerciseName}`);
            // Optionnel: Ici on pourrait créer l'exercice à la volée si on voulait
        }
      }

      // 5. Insertion groupée des SÉRIES (Bulk Insert)
      if (setsToInsert.length > 0) {
        const { error: setsError } = await supabase
          .from('workout_sets')
          .insert(setsToInsert);
        
        if (setsError) throw setsError;
      }

      return { success: true, sessionId };

    } catch (error: any) {
      console.error("Erreur sauvegarde workout:", error);
      return { success: false, error: error.message };
    } finally {
      setIsSaving(false);
    }
  };

  return { saveWorkout, isSaving };
};