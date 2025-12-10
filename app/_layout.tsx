import '../lib/i18n'; 
import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { ThemeProvider, useTheme } from '../lib/theme'; // Assure-toi d'exporter useTheme
import * as Linking from 'expo-linking';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/react-query';

// ⚡ Composant intermédiaire pour gérer la StatusBar dynamique
const AppContent = () => {
  const { isDark } = useTheme(); // Maintenant on a accès au contexte
  
  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#000' : '#F2F2F7' }}>
      {/* StatusBar adaptative */}
      <StatusBar style={isDark ? "light" : "dark"} />
      
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" /> 
        <Stack.Screen name="auth/index" options={{ presentation: 'modal' }} />
        <Stack.Screen name="auth/callback" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </View>
  );
};

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      if (url && (url.includes('access_token') || url.includes('refresh_token'))) {
        // Deep linking logic
      }
    };
    Linking.getInitialURL().then((url) => { if (url) handleDeepLink(url); });
    setIsReady(true);
  }, []);

  if (!isReady) {
      return (
          <View style={{flex:1, backgroundColor:'#000', justifyContent:'center', alignItems:'center'}}>
              <ActivityIndicator color="#0066FF" size="large" />
          </View>
      );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
}