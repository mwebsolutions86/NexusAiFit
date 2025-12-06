export interface Recipe {
  id?: string; // Optionnel car pas encore en base
  title: string;
  description: string;
  prep_time: string;
  cook_time: string;
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  ingredients: string[];
  instructions: string[];
  storage_tips?: string;
}