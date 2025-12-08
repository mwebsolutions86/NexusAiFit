// types/nutrition.ts

// --- PLAN NUTRITIONNEL (Table: meal_plans) ---

export interface MealItem {
  name: string;
  calories: number;
  protein: number;
  carbs?: number;
  fat?: number;
  notes?: string;
  ingredients?: string;
}

export interface Meal {
  name: string;
  items: MealItem[];
}

export interface NutritionDay {
  day: string;
  meals: Meal[];
}

export interface NutritionPlanContent {
  title: string;
  days: NutritionDay[];
}

export interface MealPlanDB {
  id: string;
  user_id: string;
  title: string;
  content: NutritionPlanContent;
  is_active: boolean;
  week_number: number;
  created_at: string;
}

// --- SUIVI JOURNALIER (Table: nutrition_logs) ---

// Structure d'un item consommé (Snapshot)
// On utilise 'ConsumedItem' partout pour être cohérent avec les mutations
export interface ConsumedItem {
  name: string;
  mealName: string; // "Petit Déjeuner", "Collation"...
  calories: number;
  protein: number;
  eatenAt: string; // ISO String
}

// ✅ L'INTERFACE QUI MANQUAIT (Pour le Logger)
export interface NutritionLogData {
  logDate: string; // YYYY-MM-DD
  mealsStatus: ConsumedItem[]; // Liste complète des aliments mangés
  totalCalories: number;
  totalProtein: number;
  note?: string;
}

// Structure de la table 'nutrition_logs' dans Supabase
export interface NutritionLogDB {
  id: string;
  user_id: string;
  log_date: string;
  meals_status: ConsumedItem[]; // JSONB
  total_calories: number;
  total_protein: number;
  daily_note?: string;
}