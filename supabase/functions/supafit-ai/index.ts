import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const ALLOWED_ORIGINS = Deno.env.get('ALLOWED_ORIGINS') || '*'

const getCorsHeaders = (origin: string | null) => {
  const allowAll = ALLOWED_ORIGINS === '*';
  const isAllowed = allowAll || (origin && ALLOWED_ORIGINS.split(',').includes(origin));
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin || '*' : 'null',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    if (!GROQ_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Config serveur manquante');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Token manquant");

    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    
    if (authError || !user) {
        return new Response(JSON.stringify({ error: "Session expirée" }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let body;
    try { body = await req.json(); } catch { throw new Error("JSON Body invalide"); }
    const { type, userProfile, preferences, messages } = body;

    let systemPrompt = "Tu es NEXUS, IA d'élite en performance. Format JSON STRICT. Pas de markdown.";
    let userContent = "";
    let maxTokens = 2500;
    let temperature = 0.5;

    switch (type) {
      // 🛡️ AJOUT DES ACCOLADES { } POUR ISOLER LE SCOPE
      case 'WORKOUT': {
        maxTokens = 4000;
        const daysCount = Number(userProfile.training_days) || 3;
        // On récupère 'goal' ici sans conflit avec les autres cases
        const goal = (userProfile.goal || 'general').toLowerCase();
        const level = (userProfile.fitness_level || 'beginner').toLowerCase();

        // LOGIQUE TACTIQUE
        let splitType = "Full Body";
        if (daysCount === 4) splitType = "Upper / Lower";
        else if (daysCount >= 5) splitType = "PPL (Push Pull Legs)";

        let repRange = "10-12";
        let restTime = 90;
        if (goal.includes('strength')) { repRange = "3-5"; restTime = 180; }
        else if (goal.includes('loss')) { repRange = "15-20"; restTime = 45; }

        console.log(`🏋️‍♂️ [TACTICAL] Split: ${splitType} | Days: ${daysCount}`);

        systemPrompt += ` Génère un plan d'entraînement de ${daysCount} jours.
        Structure imposée : ${splitType}.
        Reps: ${repRange}. Repos: ${restTime}s.
        FORMAT JSON STRICT : { "title": "Programme", "days": [{ "day": "J1", "focus": "...", "exercises": [{ "name": "...", "sets": "4", "reps": "${repRange}", "rest": ${restTime}, "notes": "..." }] }] }`;
        userContent = `Objectif: ${preferences || 'Global'}.`;
        break;
      }

      case 'MEAL': {
        maxTokens = 4000;
        const weight = Number(userProfile.weight) || 75;
        const height = Number(userProfile.height) || 175;
        const age = Number(userProfile.age) || 25;
        const gender = (userProfile.gender || 'male').toLowerCase();
        // On récupère 'goal' ici aussi sans conflit
        const goal = (userProfile.goal || 'maintenance').toLowerCase();

        // LOGIQUE NUTRITION (Mifflin-St Jeor)
        let bmr = 10 * weight + 6.25 * height - 5 * age + ((gender === 'female') ? -161 : 5);
        const tdee = Math.round(bmr * 1.375); // Activité modérée par défaut
        
        let targetCals = tdee;
        if (goal.includes('gain') || goal.includes('masse')) targetCals += 400;
        else if (goal.includes('loss') || goal.includes('perte')) targetCals -= 400;

        console.log(`🍎 [CALCULATOR] Cible: ${targetCals} kcal`);

        systemPrompt += ` Plan nutrition de ${targetCals} kcal (±50).
        FORMAT JSON STRICT : { "title": "Plan ${targetCals}kcal", "days": [{ "day": "Lundi", "meals": [{ "name": "...", "items": [{ "name": "...", "calories": 500, "protein": 30, "notes": "..." }] }] }] }
        IMPORTANT: 'calories' et 'protein' doivent être des NOMBRES.`;
        userContent = `Préférences: ${preferences || 'Aucune'}.`;
        break;
      }

      case 'CHAT': {
        temperature = 0.7;
        systemPrompt += ` Réponds uniquement en JSON : { "response": "Ta réponse ici" }.`;
        break;
      }

      case 'CHEF': {
        maxTokens = 3000;
        systemPrompt += ` Recette de chef. JSON: { "title": "", "ingredients": [], "steps": [], "macros_per_serving": {"calories": 0, "protein": 0}, "chef_tip": "" }.`;
        userContent = `Ingrédients: ${preferences}`;
        break;
      }

      default: throw new Error("Module inconnu");
    }

    let thread = [{ role: "system", content: systemPrompt }];
    if (type === 'CHAT' && messages) thread = [...thread, ...messages];
    else thread.push({ role: "user", content: userContent });

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: thread, temperature, max_tokens: maxTokens, response_format: { type: "json_object" } })
    });

    if (!response.ok) throw new Error(`Groq API Error: ${await response.text()}`);
    
    const json = await response.json();
    const cleanContent = json.choices[0]?.message?.content.replace(/```json/g, '').replace(/```/g, '').trim();
    let finalResponse = JSON.parse(cleanContent);
    if (type === 'CHAT' && !finalResponse.response) finalResponse = { response: JSON.stringify(finalResponse) };

    return new Response(JSON.stringify(finalResponse), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error("❌ SERVER ERROR:", error.message);
    // On renvoie 200 avec un objet error pour que le frontend puisse le lire facilement
    return new Response(JSON.stringify({ error: error.message }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
})