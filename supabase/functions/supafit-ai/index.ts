import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Gérer les requêtes CORS (OPTIONS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Vérification de la clé API
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is missing in Supabase Secrets')
    }

    const { userProfile, preferences, type, userMessage } = await req.json()

    console.log(`Reçu demande type: ${type}`) // Log pour debug

    let systemPrompt = ""
    
    // --- SCÉNARIO 1 : SPORT ---
    if (type === 'WORKOUT') {
      systemPrompt = `Tu es un coach sportif d'élite. Génère un programme d'entraînement intensif et précis au format JSON pour ce profil: ${JSON.stringify(userProfile)}. Focus: ${preferences}. 
      Format JSON strict attendu: { "title": string, "days": [{ "day": string, "focus": string, "exercises": [{ "name": string, "sets": string, "reps": string, "rest": number, "notes": string }] }] }`
    
    // --- SCÉNARIO 2 : NUTRITION ---
    } else if (type === 'MEAL') {
      systemPrompt = `Tu es un nutritionniste expert. Génère un plan de repas 7 jours JSON strict pour ce profil: ${JSON.stringify(userProfile)}. Préférences: ${preferences}.
      Réponds UNIQUEMENT avec ce JSON :
      {
        "title": "Nom du plan",
        "days": [
          {
            "day": "Lundi",
            "total_calories": 2500,
            "meals": [
              { "type": "Petit-déjeuner", "name": "Plat", "calories": 500, "protein": "30g", "ingredients": "..." },
              { "type": "Déjeuner", "name": "Plat", "calories": 800, "protein": "40g", "ingredients": "..." },
              { "type": "Collation", "name": "Plat", "calories": 200, "protein": "15g", "ingredients": "..." },
              { "type": "Dîner", "name": "Plat", "calories": 600, "protein": "35g", "ingredients": "..." }
            ]
          }
        ]
      }`

    // --- SCÉNARIO 3 : MEAL PREP (Chef) ---
    } else if (type === 'MEAL_PREP') {
      systemPrompt = `Tu es un Chef Étoilé renommé, spécialisé dans la "Meal Prep" saine.
      Ton objectif : Créer des recettes d'exception qui se conservent bien, pour ce profil : ${JSON.stringify(userProfile)}.
      Règles : Noms de plats gastronomiques, ingrédients sains, précis sur les calories.
      Format JSON strict attendu :
      {
        "title": "Titre de la collection Gourmet",
        "recipes": [
           { "name": "Nom Gastronomique", "description": "Description appétissante", "calories": number, "protein": "XXg", "prep_time": "XX min", "instructions": "Liste étapes" }
        ]
      }`

    // --- SCÉNARIO 4 : CHAT NEURON ---
    } else if (type === 'CHAT') {
      systemPrompt = `Tu es "NeuroCoach", une IA de coaching sportif et mental.
      Ton style : Empathique, extrêmement motivant, intelligent et concis.
      Profil utilisateur : ${JSON.stringify(userProfile)}.
      
      IMPORTANT : Tu dois répondre au format JSON.
      Structure attendue :
      {
        "response": "Ton texte de réponse ici..."
      }`
    }

    // Préparation des messages
    const messages = [
       { role: "system", content: systemPrompt }
    ];

    if (type === 'CHAT' && userMessage) {
       messages.push({ role: "user", content: userMessage });
    } else {
       messages.push({ role: "user", content: "Génère le JSON maintenant." });
    }

    // Appel API Groq
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${GROQ_API_KEY}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: messages,
        temperature: 0.6,
        response_format: { type: "json_object" } // Force le mode JSON
      })
    })

    // Gestion d'erreur explicite de l'API Groq
    if (!response.ok) {
      const errorData = await response.text();
      console.error("Erreur API Groq:", errorData);
      throw new Error(`Erreur API Groq: ${response.status} - ${errorData}`);
    }

    const data = await response.json()
    
    // Vérification que la réponse contient bien des choix
    if (!data.choices || data.choices.length === 0) {
      throw new Error("L'IA n'a renvoyé aucun contenu.");
    }

    const content = data.choices[0].message.content
    return new Response(content, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error("Erreur Backend:", error.message);
    // On renvoie l'erreur au format JSON pour que le front puisse l'afficher si besoin
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})