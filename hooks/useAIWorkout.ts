import { useState } from 'react';
import { generateWorkoutJSON } from '../lib/groq'; // On s'assure que le chemin est bon

export function useAIWorkout() {
  const [loading, setLoading] = useState(false);
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Cette fonction prend OBLIGATOIREMENT 2 arguments
  const generateWorkout = async (profile: any, focus: string) => {
    
    console.log("🚀 [useAIWorkout] Tentative de génération...");
    
    // SÉCURITÉ 1 : Vérifier les données avant d'appeler le serveur
    if (!profile) {
      console.error("⛔ [useAIWorkout] STOP : Profil manquant !");
      setError("Profil utilisateur introuvable. Attendez le chargement.");
      return;
    }
    if (!focus) {
      console.error("⛔ [useAIWorkout] STOP : Focus manquant !");
      setError("Veuillez sélectionner un objectif.");
      return;
    }

    setLoading(true);
    setError(null);
    setWorkoutPlan(null); // Reset du plan précédent

    try {
      console.log(`📤 Envoi vers l'IA -> Focus: ${focus}, Age: ${profile.age || '?'}`);

      // Appel à la fonction dans lib/groq.ts
      const data = await generateWorkoutJSON(profile, focus);

      if (!data) throw new Error("Réponse vide du serveur");
      if (data.error) throw new Error(data.error);

      console.log("✅ [useAIWorkout] Succès ! Plan reçu.");
      setWorkoutPlan(data);
    
    } catch (err: any) {
      console.error("❌ [useAIWorkout] Erreur:", err);
      setError(err.message || "Erreur de génération");
    } finally {
      setLoading(false);
    }
  };

  return { 
    generateWorkout, 
    workoutPlan, 
    loading, 
    error,
    resetWorkout: () => setWorkoutPlan(null) 
  };
}