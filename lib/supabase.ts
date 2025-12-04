import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Remplacez par vos vraies clés (si elles ne sont pas dans .env)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://tszwhzbmdboconntitfi.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzendoemJtZGJvY29ubnRpdGZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NjUxNjMsImV4cCI6MjA3OTM0MTE2M30.kn55Xge44uqpokbyI_BYEEBl4UCUSTSq5P2q-whJbAA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, // C'est ici que la magie opère
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});