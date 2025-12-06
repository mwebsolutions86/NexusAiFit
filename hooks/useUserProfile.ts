import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase'; // Vérifie ton chemin vers supabase

export function useUserProfile() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchProfile() {
      try {
        // 1. On récupère l'utilisateur connecté
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          if (isMounted) {
             setIsLoading(false);
             setUserProfile(null);
          }
          return;
        }

        // 2. On récupère son profil dans la table 'profiles'
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (isMounted) {
          console.log("👤 [useUserProfile] Profil chargé :", data?.id); // Log de vérification
          setUserProfile(data);
        }

      } catch (err: any) {
        console.error("❌ [useUserProfile] Erreur:", err.message);
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchProfile();

    return () => { isMounted = false; };
  }, []);

  // On renvoie un objet simple
  return { userProfile, isLoading, error };
}