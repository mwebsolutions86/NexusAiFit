import { useState } from 'react';
import { supabase } from '../lib/supabase';

export type CompletedExercise = {
  name: string;
  sets: number | string;
  reps: number | string;
  weight: number | string;
};

export type WorkoutLogData = {
  logDate: string;
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

      // 1. ÉCRITURE BACKWARD-COMPATIBLE (JSONB)
      // On garde ça pour que l'UI actuelle continue de marcher
      const { error: logError } = await supabase
        .from('workout_logs')
        .insert({
          user_id: session.user.id,
          log_date: data.logDate,
          exercises_status: data.exercisesDone,
          session_note: data.note || ''
        });

      if (logError) throw logError;

      // 2. ÉCRITURE RELATIONNELLE (INTELLIGENTE) - "Fire and Forget"
      // On ne bloque pas l'UI si cette partie échoue (pour l'instant)
      saveRelationalData(session.user.id, data).catch(err => 
        console.error("⚠️ Erreur sauvegarde relationnelle:", err)
      );

      return { success: true };

    } catch (error: any) {
      console.error("❌ Erreur sauvegarde workout_log:", error);
      return { success: false, error: error.message };
    } finally {
      setIsSaving(false);
    }
  };

  // Logique privée pour éclater les données
  const saveRelationalData = async (userId: string, data: WorkoutLogData) => {
    // A. Créer la session
    const { data: sessionData, error: sessionError } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: userId,
        name: "Séance du " + data.logDate,
        started_at: new Date(data.logDate).toISOString(), // Simplification
        notes: data.note,
        duration_seconds: data.duration || 0
      })
      .select()
      .single();

    if (sessionError || !sessionData) throw sessionError;

    const sessionId = sessionData.id;

    // B. Traiter chaque exercice
    // Note: Idéalement, il faudrait mapper 'exercise.name' avec un vrai 'exercise_id' de ta table 'exercises'.
    // Pour l'instant, on va devoir insérer sans ID d'exercice ou faire une recherche floue.
    // Cette étape suppose que tu as une table 'exercises' peuplée.
    
    for (const ex of data.exercisesDone) {
      // Tentative de récupération de l'ID exercice par nom (nom exact)
      const { data: dbEx } = await supabase
        .from('exercises')
        .select('id')
        .ilike('name', ex.name) // insensible à la casse
        .maybeSingle();

      if (dbEx) {
        // Si l'exo existe, on crée les sets
        const setsCount = Number(ex.sets) || 1;
        const repsCount = parseInt(String(ex.reps)) || 0;
        const weightVal = parseFloat(String(ex.weight)) || 0;

        const setsToInsert = Array.from({ length: setsCount }).map((_, i) => ({
          session_id: sessionId,
          exercise_id: dbEx.id,
          set_order: i + 1,
          reps: repsCount,
          weight_kg: weightVal,
          rpe: 8 // Valeur par défaut
        }));

        await supabase.from('workout_sets').insert(setsToInsert);
      }
    }
  };

  return { saveWorkout, isSaving };
};