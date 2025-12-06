// app/types/workout.ts

// Structure d'un exercice individuel
export interface Exercise {
  name: string;
  sets: number | string;
  reps: number | string;
  rest: number | string;
  notes?: string;
}

// Structure d'une journée d'entraînement
export interface WorkoutDay {
  day: string;
  focus: string;
  exercises: Exercise[];
}

// Structure du contenu JSON stocké dans la DB (colonne 'content')
export interface WorkoutPlanContent {
  title: string;
  days: WorkoutDay[];
}

// Structure de la table 'plans' dans Supabase
export interface PlanDB {
  id: string;
  user_id: string;
  content: WorkoutPlanContent; // C'est ici que le JSON est typé
  created_at: string;
  is_active: boolean;
  week_number?: number;
  type?: string; // Optionnel si vous ajoutez 'nutrition' plus tard
}