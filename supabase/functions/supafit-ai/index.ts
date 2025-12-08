import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Gestion CORS pour le navigateur/mobile
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Vérification des variables d'environnement
    if (!GROQ_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('Configuration serveur manquante (Clés API)')
    }

    const { type, userProfile, preferences, messages } = await req.json()
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log(`🚀 [NEXUS CORE] Requête reçue : ${type} pour ${userProfile?.full_name || 'Utilisateur'}`);

    // --- 2. GATEKEEPER (Système de Quotas) ---
    // Uniquement pour les générations lourdes (WORKOUT et MEAL), pas le Chat
    if (type === 'WORKOUT' || type === 'MEAL') {
        
        const userId = userProfile.id;
        const tier = (userProfile.tier || 'FREE').toUpperCase();
        // Limites : 7 pour les Pros, 1 pour les Gratuits
        const LIMIT = (tier === 'PREMIUM' || tier === 'PRO' || tier === 'ELITE') ? 7 : 1;
        
        // a. Récupérer ou Créer l'entrée usage
        let { data: usage } = await supabaseAdmin
            .from('user_usage')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (!usage) {
            const { data: newUsage, error: createError } = await supabaseAdmin
                .from('user_usage')
                .insert({ user_id: userId, last_reset_date: new Date().toISOString() })
                .select()
                .single();
            if (createError) throw createError;
            usage = newUsage;
        }

        // b. Vérifier Reset Hebdomadaire
        const lastReset = new Date(usage.last_reset_date);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 3600 * 24));

        if (diffDays >= 7) {
            // C'est une nouvelle semaine, on remet à zéro
            await supabaseAdmin.from('user_usage').update({ 
                workout_gen_count: 0, 
                meal_gen_count: 0, 
                last_reset_date: now.toISOString() 
            }).eq('user_id', userId);
            
            usage.workout_gen_count = 0;
            usage.meal_gen_count = 0;
        }

        // c. Vérification du seuil
        const currentCount = type === 'WORKOUT' ? usage.workout_gen_count : usage.meal_gen_count;
        
        console.log(`🔒 [QUOTA] Tier: ${tier} | Usage: ${currentCount}/${LIMIT}`);

        if (currentCount >= LIMIT) {
            // Renvoie une erreur spécifique que le frontend reconnaîtra
            return new Response(JSON.stringify({ error: "QUOTA_EXCEEDED" }), { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            });
        }
    }

    // --- 3. PRÉPARATION DU PROMPT (L'Intelligence) ---
    
    let systemPrompt = "Tu es NEXUS, une IA d'élite spécialisée en performance humaine et bio-hacking. Tu es direct, précis, motivant et tactique. Tu ne fais jamais d'erreur de syntaxe JSON.";
    let userContent = "";
    let maxTokens = 2500; // Assez pour les gros plans
    let temperature = 0.5;

    switch (type) {
      case 'WORKOUT':
        maxTokens = 4000;
        systemPrompt += ` Génère un plan d'entraînement structuré.
        Format JSON STRICT attendu : { "title": "Nom du programme", "days": [{ "day": "Lundi", "focus": "Pectoraux", "exercises": [{ "name": "...", "sets": "3", "reps": "12", "rest": 60, "notes": "..." }] }] }.
        Profil : ${userProfile.fitness_level}, Objectif : ${userProfile.goal}.`;
        userContent = `Crée un programme complet basé sur ce focus : ${preferences}.`;
        break;

      case 'MEAL':
        maxTokens = 4000;
        
        // 1. On construit une fiche technique précise de l'utilisateur
        const profilBio = `
            - Sexe: ${userProfile.gender || 'Homme'}
            - Poids: ${userProfile.weight || 75} kg
            - Taille: ${userProfile.height || 175} cm
            - Age: ${userProfile.age || 25} ans
            - Objectif: ${userProfile.goal ? userProfile.goal.toUpperCase() : 'MAINTIEN'}
        `;

        systemPrompt += ` Tu es un nutritionniste sportif expert en transformation physique.
        
        RÈGLES CRITIQUES DE CALCUL CALORIQUE :
        1. Analyse le profil biométrique ci-dessous.
        2. Calcule le TDEE (Dépense énergétique journalière).
        3. APPLIQUE L'OBJECTIF :
           - Si "PRISE DE MASSE" (Muscle Gain) : Ajoute STRICTEMENT +300 à +500 kcal au TDEE. (Ex: Si TDEE = 2500, vise 2800-3000 kcal). Ne donne JAMAIS un régime hypocalorique pour une prise de masse.
           - Si "PERTE DE POIDS" (Weight Loss) : Retire -300 à -500 kcal.
        
        STRUCTURE JSON STRICTE :
        { 
            "title": "Nom du Plan (ex: Prise de Masse - 3000 kcal)", 
            "days": [
                { 
                    "day": "Lundi", 
                    "meals": [
                        { 
                            "name": "Petit Déjeuner", 
                            "items": [
                                { "name": "Oeufs entiers", "calories": 210, "protein": 18, "notes": "3 gros oeufs" },
                                { "name": "Avoine", "calories": 150, "protein": 5, "notes": "40g" }
                            ] 
                        }
                    ] 
                }
            ] 
        }
        IMPORTANT : "calories" et "protein" doivent être des NOMBRES (pas de "kcal" ou "g" dans la valeur).`;

        userContent = `Voici mon profil bio-mécanique :
        ${profilBio}
        
        Préférences / Régime spécifique : ${preferences || 'Aucune contrainte'}.
        
        Génère un plan complet sur 7 jours parfaitement calibré pour mon objectif.`;
        break;
      case 'CHAT':
        temperature = 0.7; // Plus créatif pour la conversation
        systemPrompt += ` Tu es l'assistant personnel de l'utilisateur. Ton nom est NEXUS.
        Réponds toujours au format JSON : { "response": "Ta réponse texte ici" }.
        Ne mets jamais de Markdown ou de code block autour du JSON. Juste le JSON brut.`;
        // Le contexte conversationnel est ajouté via 'messages'
        break;
        case 'CHEF':
        maxTokens = 3000;
        systemPrompt += ` Tu es un Chef Gastronomique Étoilé, pionnier de la "Cuisine Performante". 
        Ton style est sophistiqué, créatif mais accessible. Tu refuses la nourriture fade.
        
        Ta mission : Créer une recette EXCEPTIONNELLE basée sur les ingrédients de l'utilisateur.
        
        RÈGLES D'OR :
        1. Visuel & Goût : Décris des textures, des odeurs, des dressages. Ce doit être appétissant.
        2. Santé : Utilise des techniques saines (rôtissage, vapeur, marinades) mais avec des twists de chef (zestes, herbes fraîches, épices torréfiées).
        3. Structure JSON STRICTE :
        {
            "title": "Nom du plat (ex: Suprême de Volaille Basse Température & Crémeux de Patate Douce)",
            "description": "Une phrase d'accroche du chef qui vend le rêve.",
            "ingredients": ["Liste précise avec quantités"],
            "steps": ["Étape 1 détaillée", "Étape 2...", "Étape 3..."],
            "macros_per_serving": { "calories": 500, "protein": 40, "carbs": 50, "fat": 15 },
            "chef_tip": "Le secret du chef pour le dressage ou la cuisson parfaite."
        }`;
        
        userContent = `Voici mes ingrédients disponibles : ${preferences}. 
        Mon profil : ${userProfile.goal}. 
        Fais-moi rêver avec un plat sain.`;
        break;
        
      default: 
        throw new Error(`Module inconnu : ${type}`);
    }

    // Construction du fil de discussion
    let thread = [{ role: "system", content: systemPrompt }];
    
    if (type === 'CHAT' && messages) {
        // On injecte l'historique pour la mémoire
        thread = [...thread, ...messages];
    } else {
        // Pour les générateurs One-Shot
        thread.push({ role: "user", content: userContent });
    }

    // --- 4. APPEL GROQ API ---
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Modèle performant et rapide
        messages: thread,
        temperature: temperature,
        max_tokens: maxTokens,
        response_format: { type: "json_object" } // Force le mode JSON
      })
    })

    if (!response.ok) {
        const txt = await response.text();
        throw new Error(`Groq API Error: ${txt}`);
    }

    const json = await response.json();
    const rawContent = json.choices[0]?.message?.content;

    if (!rawContent) throw new Error("Réponse vide de l'IA");

    console.log("🤖 [NEXUS RAW OUTPUT]:", rawContent.substring(0, 100) + "...");

    // --- 5. NETTOYAGE ET PARSING (Anti-Bug) ---
    let finalResponse;
    
    try {
        // Enlève les balises Markdown éventuelles (```json ... ```) qui font planter le parse
        const cleanContent = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanContent);

        // Validation de la structure pour le CHAT
        if (type === 'CHAT') {
            if (parsed.response) {
                finalResponse = parsed;
            } else {
                // Si l'IA a renvoyé un JSON mais pas la clé "response", on stringify tout
                finalResponse = { response: typeof parsed === 'string' ? parsed : JSON.stringify(parsed) };
            }
        } else {
            // Pour WORKOUT et MEAL, on renvoie l'objet tel quel
            finalResponse = parsed;
        }

    } catch (e) {
        console.warn("⚠️ JSON invalide reçu de l'IA. Tentative de sauvetage.");
        // Si le JSON casse, on renvoie le texte brut dans une structure valide
        finalResponse = { response: rawContent };
    }

    // --- 6. DÉBIT DU QUOTA (Si succès) ---
    if (type === 'WORKOUT' || type === 'MEAL') {
        const columnToInc = type === 'WORKOUT' ? 'workout_gen_count' : 'meal_gen_count';
        
        // On récupère la valeur actuelle pour incrémenter
        let { data: currentUsage } = await supabaseAdmin
            .from('user_usage')
            .select(columnToInc)
            .eq('user_id', userProfile.id)
            .single();
            
        const currentVal = currentUsage ? currentUsage[columnToInc] : 0;

        await supabaseAdmin
            .from('user_usage')
            .update({ [columnToInc]: currentVal + 1 })
            .eq('user_id', userProfile.id);
            
        console.log(`📉 [QUOTA] Débité. Nouveau solde : ${currentVal + 1}`);
    }

    // --- 7. RÉPONSE FINALE ---
    return new Response(JSON.stringify(finalResponse), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error: any) {
    console.error("❌ SERVER ERROR:", error.message);
    // On renvoie une erreur JSON propre pour que l'app ne plante pas
    return new Response(JSON.stringify({ response: `Erreur Système Nexus: ${error.message}`, error: error.message }), { 
        status: 200, // On renvoie 200 pour que le frontend traite le message d'erreur comme du texte
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})