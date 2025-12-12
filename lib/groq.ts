import { supabase } from './supabase';

// Définition des types pour plus de sécurité
type AIRequestType = 'CHAT' | 'WORKOUT' | 'MEAL' | 'MEAL_PREP';

interface AIRequestPayload {
  type: AIRequestType;
  userProfile: any;
  preferences?: string;     // Pour Workout/Meal
  userMessage?: string;     // Pour Chat
  context?: string;         // Pour contextes additionnels
}

// Fonction générique unifiée
async function callNeuralCore(payload: AIRequestPayload) {
  try {
    // On appelle UNIQUEMENT 'supafit-ai'
    const { data, error } = await supabase.functions.invoke('supafit-ai', {
      body: payload
    });

    // 🛠 GESTION AMÉLIORÉE DES ERREURS
    // Intercepte les erreurs HTTP (4xx, 5xx) renvoyées par invoke
    if (error) {
        let customMessage = "Erreur technique IA";
        
        // On tente de récupérer le vrai message d'erreur si disponible
        try {
            if (error instanceof Error) {
                // Parfois le message d'erreur contient le JSON de la réponse
                try {
                    // Si le message est du JSON stringifié (cas fréquent)
                    const parsedMsg = JSON.parse(error.message);
                    if (parsedMsg.error) customMessage = parsedMsg.error;
                } catch {
                    // Sinon on prend le message brut
                    customMessage = error.message;
                }
            }
        } catch (e) {
            // Fallback silencieux
        }

        console.error(`[NEURAL CORE] Error on ${payload.type}:`, error);
        throw new Error(customMessage);
    }
    
    // Gestion des erreurs métier (Status 200 mais avec champ error dans le JSON)
    if (data && data.error) {
        throw new Error(data.error);
    }
    
    // Si l'IA renvoie une string (cas rare d'erreur mal formatée), on tente de parser
    if (typeof data === 'string') {
        try { return JSON.parse(data); } catch { return data; }
    }
    
    return data;

  } catch (e: any) {
    console.error("[NEURAL CORE] System Failure:", e.message);
    // On propage l'erreur pour que l'UI affiche une alerte propre
    throw new Error(e.message || "Erreur de communication avec le noyau IA.");
  }
}

// --- FAÇADES (API CLIENT) ---

export async function generateAIResponse(userProfile: any, systemPrompt: string, userMessage: string) {
  // Le Chat attend un format { response: string }
  return await callNeuralCore({
    type: 'CHAT',
    userProfile,
    userMessage,
    context: systemPrompt
  });
}

export async function generateWorkoutJSON(userProfile: any, focus: string) {
  // Le Workout attend un JSON complexe
  return await callNeuralCore({
    type: 'WORKOUT',
    userProfile,
    preferences: focus
  });
}

export async function generateMealPlanJSON(userProfile: any, preferences: string) {
  return await callNeuralCore({
    type: 'MEAL',
    userProfile,
    preferences
  });
}

export async function generateMealPrepIdeas(userProfile: any, ingredients: string) {
  return await callNeuralCore({
    type: 'MEAL_PREP',
    userProfile,
    preferences: ingredients // On passe les ingrédients comme "préférences"
  });
}