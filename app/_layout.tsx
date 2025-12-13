import '../lib/i18n'; 
import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { ThemeProvider, useTheme } from '../lib/theme'; 
// ✅ On importe le Provider corrigé
import { AlertProvider } from '../lib/AlertContext'; 
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/react-query';

const AppContent = () => {
  const { isDark } = useTheme(); 
  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#000' : '#F2F2F7' }}>
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
        {/* ✅ L'AlertProvider englobe TOUTE l'application ici */}
        <AlertProvider>
            <AppContent />
        </AlertProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}