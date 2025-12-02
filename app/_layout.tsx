import '../lib/i18n'; 
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { ThemeProvider } from '../lib/theme';
import * as Linking from 'expo-linking';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialisation minimale pour l'Auth Google
    const handleDeepLink = async (url: string) => {
      if (url && (url.includes('access_token') || url.includes('refresh_token'))) {
        // La session sera gérée par Supabase automatiquement ou via le AuthScreen
      }
    };
    Linking.getInitialURL().then((url) => { if (url) handleDeepLink(url); });
    
    // On laisse l'app se charger
    setIsReady(true);
  }, []);

  if (!isReady) {
      return (
          <View style={{flex:1, backgroundColor:'#000', justifyContent:'center', alignItems:'center'}}>
              <ActivityIndicator color="#00f3ff" />
          </View>
      );
  }

  return (
    <ThemeProvider>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <StatusBar style="light" />
        
        {/* STACK : Empêche la barre de navigation de s'afficher sur la Landing Page */}
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          
          {/* 1. Landing Page */}
          <Stack.Screen name="index" /> 
          
          {/* 2. Auth (Le dossier app/auth/index.tsx) */}
          <Stack.Screen name="auth/index" options={{ presentation: 'modal' }} />
          <Stack.Screen name="auth/callback" />
          
          {/* 3. Onboarding */}
          <Stack.Screen name="onboarding" />

          {/* 4. Dashboard (Le dossier app/(tabs)/) -> C'est LUI qui a la barre de nav */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          {/* 5. Fallback */}
          <Stack.Screen name="+not-found" />
          
        </Stack>
      </View>
    </ThemeProvider>
  );
}