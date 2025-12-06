import { supabase } from './supabase';

// Fonction générique d'envoi
async function callEdgeFunction(body: any) {
  // ... (Ton code existant pour callEdgeFunction, pas besoin de le changer s'il marchait)
  // Mais pour être sûr, je te remets le strict minimum qui marche :
  try {
    const { data, error } = await supabase.functions.invoke('generate-plan', {
      body: { ...body }
    });
    if (error) throw error;
    return data;
  } catch (e) {
    console.error("Erreur interne:", e);
    return null;
  }
}

// 1. CHAT
export async function generateAIResponse(userProfile: any, systemPrompt: string, userMessage: string) {
  return await callEdgeFunction({
    type: 'CHAT',
    userProfile,
    preferences: userMessage,
    context: systemPrompt
  });
}

// 2. WORKOUT (C'est ici qu'était ton erreur)
export async function generateWorkoutJSON(userProfile: any, focus: string) {
  try {
    if (!userProfile) throw new Error("Profil manquant");

    const { data, error } = await supabase.functions.invoke('generate-plan', {
      body: { 
        type: 'WORKOUT',
        userProfile: userProfile,
        preferences: focus 
      }
    });

    if (error) throw error;
    return data;
    
  } catch (e) {
    console.error("Erreur Appel Edge:", e);
    // CORRECTION ICI : (e as any)
    return { error: (e as any).message || "Erreur inconnue" };
  }
}

// 3. MEAL
export async function generateMealPlanJSON(userProfile: any, preferences: string) {
  return await callEdgeFunction({
    type: 'MEAL',
    userProfile,
    preferences
  });
}

// 4. RECIPE
export async function generateMealPrepIdeas(userProfile: any, preferences: string) {
  return await callEdgeFunction({
    type: 'RECIPE',
    userProfile,
    preferences
  });
}