import { supabase } from './supabase';
import i18n from './i18n'; // On importe la langue actuelle

// Fonction générique pour appeler l'IA via le serveur sécurisé
async function callEdgeFunction(body: any) {
  try {
    // On injecte la langue de l'utilisateur pour que l'IA réponde correctement
    const userLanguage = i18n.language; 

    const { data, error } = await supabase.functions.invoke('generate-plan', {
      body: { ...body, language: userLanguage }
    });

    if (error) {
      console.error("Erreur Edge Function:", error);
      throw error;
    }
    
    return data;
  } catch (e) {
    console.error("Exception appel IA:", e);
    return null;
  }
}

// 1. CHAT (Neural Coach)
export async function generateAIResponse(systemPrompt: string, userMessage: string) {
  return await callEdgeFunction({
    type: 'CHAT',
    userProfile: { context: systemPrompt }, 
    preferences: userMessage 
  });
}

// 2. GÉNÉRATEUR DE SPORT
export async function generateWorkoutJSON(userProfile: any, focus: string) {
  return await callEdgeFunction({
    type: 'WORKOUT',
    userProfile,
    preferences: focus
  });
}

// 3. GÉNÉRATEUR DE NUTRITION (Plan 7 jours)
export async function generateMealPlanJSON(userProfile: any, preferences: string) {
  return await callEdgeFunction({
    type: 'MEAL',
    userProfile,
    preferences
  });
}

// 4. GÉNÉRATEUR MEAL PREP (Recettes Chef)
export async function generateMealPrepIdeas(preferences: string) {
  return await callEdgeFunction({
    type: 'RECIPE', 
    userProfile: {}, 
    preferences
  });
}