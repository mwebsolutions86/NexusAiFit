import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    // Cette page sert de "tampon" visuel
    // La logique principale de session est gérée par le listener dans _layout.tsx
    // Cependant, on peut ajouter une sécurité ici si le listener ne se déclenche pas assez vite
    
    const checkSession = async () => {
      // Petit délai pour laisser le temps au listener de faire son job
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('gender, goal')
          .eq('id', session.user.id)
          .single();

        if (!profile || !profile.gender || !profile.goal) {
          router.replace('/onboarding');
        } else {
          router.replace('/(tabs)/dashboard');
        }
      } else {
        // Si échec, on renvoie vers l'auth pour réessayer
        // router.replace('/auth/index'); 
      }
    };

    checkSession();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#00f3ff" />
      <Text style={styles.text}>Finalisation de la connexion...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});