import { useState } from 'react';
import { supabase } from '../lib/supabase';

// NOUVEAU FORMAT : On stocke une "photo" de ce qui a été fait
export type CompletedExercise = {
  name: string;
  sets: number | string;
  reps: number | string;
  weight: number | string;
};

export type WorkoutLogData = {
  logDate: string;
  // Au lieu de { "key": true }, on stocke la liste complète
  exercisesDone: CompletedExercise[]; 
  note?: string;
  duration?: number;
};

export const useWorkoutLogger = () => {
  const [isSaving, setIsSaving] = useState(false);

  const saveWorkout = async (data: WorkoutLogData) => {
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Utilisateur non connecté");

      // On insère le tableau complet d'exercices dans la colonne JSONB
      const { error } = await supabase
        .from('workout_logs')
        .insert({
          user_id: session.user.id,
          log_date: data.logDate,
          exercises_status: data.exercisesDone, // Magie du JSONB : on stocke tout l'objet
          session_note: data.note || ''
        });

      if (error) throw error;

      return { success: true };

    } catch (error: any) {
      console.error("Erreur sauvegarde workout_log:", error);
      return { success: false, error: error.message };
    } finally {
      setIsSaving(false);
    }
  };

  return { saveWorkout, isSaving };
};