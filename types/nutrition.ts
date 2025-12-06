// Structure d'un aliment/repas
export interface MealItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
}

export interface NutritionDay {
  day: string; // "Jour 1", "Lundi"...
  meals: {
    name: string; // "Petit Déjeuner", "Déjeuner"...
    items: MealItem[];
  }[];
  total_calories?: number;
}

export interface NutritionPlanContent {
  title: string;
  days: NutritionDay[];
}

// Pour la DB (similaire à PlanDB workout, mais typé nutrition)
export interface NutritionPlanDB {
  id: string;
  user_id: string;
  content: NutritionPlanContent;
  type: 'nutrition';
  created_at: string;
  is_active: boolean;
}

// ... (Vos interfaces existantes NutritionPlanContent, MealItem, etc.)

// Structure d'un aliment consommé (Snapshot)
export interface EatenItem {
  name: string;
  calories: number;
  protein: number;
  mealName: string; // "Petit Déjeuner", "Collation"...
  eatenAt: string; // ISO String de l'heure
}

// Données envoyées au Logger
export interface NutritionLogData {
  logDate: string; // YYYY-MM-DD
  mealsStatus: EatenItem[]; // Liste complète des aliments mangés
  totalCalories: number;
  totalProtein: number;
  waterIntake?: number; // Optionnel si géré ici
  note?: string;
}

// Structure de la table 'nutrition_logs'
export interface NutritionLogDB {
  id: string;
  user_id: string;
  log_date: string;
  meals_status: EatenItem[]; 
  total_calories: number;
  total_protein: number;
  daily_note?: string;
}