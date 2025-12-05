import '../lib/i18n'; 
import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { ThemeProvider } from '../lib/theme';
import * as Linking from 'expo-linking';

// --- NOUVEAU : Import React Query ---
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/react-query';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialisation pour l'Auth Google (Deep Linking)
    const handleDeepLink = async (url: string) => {
      if (url && (url.includes('access_token') || url.includes('refresh_token'))) {
        // La session est gérée par Supabase, on laisse faire le flow naturel
      }
    };

    Linking.getInitialURL().then((url) => { 
      if (url) handleDeepLink(url); 
    });
    
    // Simulation de chargement initial rapide
    setIsReady(true);
  }, []);

  if (!isReady) {
      return (
          <View style={{flex:1, backgroundColor:'#000', justifyContent:'center', alignItems:'center'}}>
              <ActivityIndicator color="#00f3ff" size="large" />
          </View>
      );
  }

  return (
    // 1. ENVELOPPE GLOBALE : Moteur de Données
    <QueryClientProvider client={queryClient}>
      
      {/* 2. ENVELOPPE THEME : Design System */}
      <ThemeProvider>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <StatusBar style="light" />
          
          {/* 3. NAVIGATION : Routes */}
          <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
            
            {/* Landing Page */}
            <Stack.Screen name="index" /> 
            
            {/* Auth */}
            <Stack.Screen name="auth/index" options={{ presentation: 'modal' }} />
            <Stack.Screen name="auth/callback" />
            
            {/* Onboarding */}
            <Stack.Screen name="onboarding" />

            {/* Dashboard & Tabs (Le cœur de l'app) */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            {/* Fallback */}
            <Stack.Screen name="+not-found" />
            
          </Stack>
        </View>
      </ThemeProvider>
    </QueryClientProvider>
  );
}