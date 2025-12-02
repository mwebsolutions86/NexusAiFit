import { supabase } from './supabase';

// Fonction générique pour appeler l'IA via le serveur sécurisé
async function callEdgeFunction(body: any) {
  try {
    const { data, error } = await supabase.functions.invoke('generate-plan', {
      body: body
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

// 1. Générateur de SPORT
export async function generateWorkoutJSON(userProfile: any, focus: string) {
  return await callEdgeFunction({
    type: 'WORKOUT',
    userProfile,
    preferences: focus
  });
}

// 2. Générateur de NUTRITION
export async function generateMealPlanJSON(userProfile: any, preferences: string) {
  return await callEdgeFunction({
    type: 'MEAL',
    userProfile,
    preferences
  });
}

// 3. Chat avec le COACH (Si vous l'utilisez dans (tabs)/coach.tsx)
export async function generateAIResponse(systemPrompt: string, userMessage: string) {
  // Pour le chat, on envoie juste le message utilisateur et un contexte minimal
  // Note : Vous pouvez enrichir 'userProfile' ici si vous voulez que le coach connaisse votre nom
  return await callEdgeFunction({
    type: 'CHAT',
    userProfile: { context: systemPrompt }, 
    preferences: userMessage 
  });
}