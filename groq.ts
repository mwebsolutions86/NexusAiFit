import { supabase } from './supabase';

// ⚠️ REMPLACE PAR TA VRAIE CLÉ API GROQ
const GROQ_API_KEY = "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"; 

const API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL_ID = "llama-3.3-70b-versatile"; 

// --- 1. CHAT STANDARD ---
export async function generateAIResponse(systemPrompt: string, userPrompt: string): Promise<string | null> {
  if (!GROQ_API_KEY || GROQ_API_KEY.includes("TA_CLE")) return null;
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        temperature: 0.7,
        max_tokens: 1024
      })
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (e) { return null; }
}

// --- 2. GÉNÉRATEUR NUTRITION (7 JOURS + DÉTAILS) ---
export async function generateMealPlanJSON(userProfile: any, preferences: string): Promise<any | null> {
  if (!GROQ_API_KEY) return null;

  const systemPrompt = `
    TU ES UN NUTRITIONNISTE EXPERT, SPÉCIALISÉ DANS LES DIÈTES ÉCONOMIQUES ET SAINES.
    
    RÈGLE CRITIQUE : Génère un plan de repas pour **7 JOURS (Lundi à Dimanche)**. Les ingrédients doivent être **les moins chers possible** (aliments de base, de saison, peu de produits transformés).
    
    PROFIL: ${JSON.stringify(userProfile)}
    PRÉFÉRENCES: ${preferences}
    
    FORMAT JSON STRICT ATTENDU :
    {
      "title": "Nom du Plan (ex: Sèche 7 Jours Économique)",
      "target_calories": 2500,
      "days": [
        {
          "day": "Lundi",
          "meals": [
            { 
              "type": "Petit Déj", 
              "name": "Nom du plat", 
              "calories": 500, 
              "macros": "30P/40G/15L",
              "ingredients": ["2 oeufs", "50g avoine"],
              "prep": "Mélanger et cuire 5min."
            },
            { "type": "Déjeuner", "name": "...", "calories": 800, "macros": "...", "ingredients": ["..."], "prep": "..." },
            { "type": "Collation", "name": "...", "calories": 300, "macros": "...", "ingredients": ["..."], "prep": "..." },
            { "type": "Dîner", "name": "...", "calories": 600, "macros": "...", "ingredients": ["..."], "prep": "..." }
          ]
        }
        ... (Répéter pour les 7 jours)
      ]
    }
    RÈGLE : Renvoie UNIQUEMENT le JSON valide. Utilise des aliments abordables (riz, lentilles, poulet, légumes de saison).
  `;

  // On augmente max_tokens pour permettre une réponse longue (7 jours)
  return callGroqJson(systemPrompt, 3500);
}

// --- 3. GÉNÉRATEUR SPORT ---
export async function generateWorkoutJSON(userProfile: any, focus: string): Promise<any | null> {
  if (!GROQ_API_KEY) return null;
  const systemPrompt = `
    COACH SPORTIF EXPERT. Génère un programme JSON.
    PROFIL: ${JSON.stringify(userProfile)}. FOCUS: ${focus}.
    Structure: { "title": "...", "days": [{ "day": "Séance 1", "focus": "...", "exercises": [{ "name": "...", "sets": "...", "reps": "...", "rest": 90, "notes": "..." }] }] }
  `;
  return callGroqJson(systemPrompt, 2048);
}

// --- FONCTION UTILITAIRE ---
async function callGroqJson(systemPrompt: string, maxTokens: number = 2048) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: "Génère le JSON complet maintenant." }],
        temperature: 0.2,
        response_format: { type: "json_object" },
        max_tokens: maxTokens // Augmenté pour les longs plans
      })
    });
    const data = await response.json();
    const jsonString = data.choices?.[0]?.message?.content;
    if (!jsonString) return null;
    return JSON.parse(jsonString.replace(/```json/g, '').replace(/```/g, '').trim());
  } catch (e) { console.error("Erreur IA:", e); return null; }
}