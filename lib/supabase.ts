import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Remplacez par vos vraies clés (si elles ne sont pas dans .env)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL !
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY !

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, // C'est ici que la magie opère
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});