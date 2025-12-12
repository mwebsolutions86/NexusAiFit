import { supabase } from './supabase';

type AIRequestType = 'CHAT' | 'WORKOUT' | 'MEAL' | 'MEAL_PREP' | 'CHEF';

interface AIRequestPayload {
  type: AIRequestType;
  userProfile: any;
  preferences?: string;
  userMessage?: string;
  context?: string;
}

// Configuration des timeouts par type de tâche
const FUNCTION_CONFIG = {
  CHAT: { functionName: 'supafit-chat', timeout: 10000 },      // Rapide
  WORKOUT: { functionName: 'supafit-planner', timeout: 60000 }, // Lent
  MEAL: { functionName: 'supafit-planner', timeout: 60000 },    // Lent
  MEAL_PREP: { functionName: 'supafit-planner', timeout: 45000 },
  CHEF: { functionName: 'supafit-planner', timeout: 45000 },
};

async function callNeuralCore(payload: AIRequestPayload) {
  try {
    // 1. Routage Intelligent
    // Si tu n'as pas encore déployé les 2 fonctions, remplace les noms ci-dessus par 'supafit-ai' partout.
    // Mais cette structure est PRÊTE pour l'architecture micro-service.
    const config = FUNCTION_CONFIG[payload.type] || FUNCTION_CONFIG.CHAT;
    
    // Fallback temporaire : Tout vers 'supafit-ai' tant que tu n'as pas split
    const targetFunction = 'supafit-ai'; 

    console.log(`[NEURAL ROUTER] Routing ${payload.type} to ${targetFunction}...`);

    const { data, error } = await supabase.functions.invoke(targetFunction, {
      body: payload
    });

    if (error) {
      console.error(`[NEURAL CORE] Error on ${payload.type}:`, error);
      // Extraction propre du message d'erreur
      let msg = "Erreur IA inconnue";
      try {
         const jsonErr = JSON.parse(error.message);
         if(jsonErr.error) msg = jsonErr.error;
      } catch {
         msg = error.message;
      }
      throw new Error(msg);
    }

    if (data && data.error) throw new Error(data.error);

    // Parsing défensif
    if (typeof data === 'string') {
        try { return JSON.parse(data); } catch { return data; }
    }
    
    return data;

  } catch (e: any) {
    console.error("[NEURAL CORE] System Failure:", e.message);
    throw new Error(e.message || "Erreur critique du noyau IA.");
  }
}

// --- FAÇADES (API CLIENT) ---
// (Le reste de tes exports reste identique, ils appellent juste callNeuralCore)
export async function generateAIResponse(userProfile: any, systemPrompt: string, userMessage: string) {
  return await callNeuralCore({ type: 'CHAT', userProfile, userMessage, context: systemPrompt });
}

export async function generateWorkoutJSON(userProfile: any, focus: string) {
  return await callNeuralCore({ type: 'WORKOUT', userProfile, preferences: focus });
}

export async function generateMealPlanJSON(userProfile: any, preferences: string) {
  return await callNeuralCore({ type: 'MEAL', userProfile, preferences });
}

export async function generateMealPrepIdeas(userProfile: any, ingredients: string) {
  return await callNeuralCore({ type: 'MEAL_PREP', userProfile, preferences: ingredients });
}