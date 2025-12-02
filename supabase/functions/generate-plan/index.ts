import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')

    const { userProfile, preferences, type } = await req.json()

    let systemPrompt = ""
    
    // --- SCÉNARIO 1 : SPORT ---
    if (type === 'WORKOUT') {
      systemPrompt = `Tu es un coach sportif expert. Génère un programme JSON pour ce profil: ${JSON.stringify(userProfile)}. Focus: ${preferences}. Format JSON strict attendu: { "title": string, "days": [{ "day": string, "focus": string, "exercises": [{ "name": string, "sets": string, "reps": string, "rest": number, "notes": string }] }] }`
    
    // --- SCÉNARIO 2 : NUTRITION (C'est ce qu'il manquait !) ---
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
    }

    // Appel à l'IA
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Génère le JSON maintenant." }
        ],
        temperature: 0.5,
        response_format: { type: "json_object" }
      })
    })

    const data = await response.json()
    const content = data.choices[0].message.content

    return new Response(content, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})