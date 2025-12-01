import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

// ⚠️ REMPLACE CES VALEURS PAR CELLES DE TON DASHBOARD SUPABASE
const supabaseUrl = 'https://tszwhzbmdboconntitfi.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzendoemJtZGJvY29ubnRpdGZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NjUxNjMsImV4cCI6MjA3OTM0MTE2M30.kn55Xge44uqpokbyI_BYEEBl4UCUSTSq5P2q-whJbAA'; // Copie ta clé "anon" / "public" ici

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Gestion du rafraîchissement automatique des tokens
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});