import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Définition du type pour le contexte
type ThemeContextType = {
  isDark: boolean;
  toggleTheme: () => void;
  colors: {
    primary: string;
    bg: string;
    text: string;
    textSecondary: string;
    cardBg: string;
    border: string;
    accent: string;
    success: string;
    warning: string;
    danger: string;
  };
};

// Valeurs par défaut
const themes = {
  dark: {
    isDark: true,
    colors: {
      primary: '#00f3ff',
      bg: '#000',
      text: '#fff',
      textSecondary: 'rgba(255,255,255,0.6)',
      cardBg: 'rgba(20, 20, 30, 0.6)',
      border: 'rgba(255,255,255,0.08)',
      accent: '#4ade80',
      success: '#4ade80',
      warning: '#ffaa00',
      danger: '#ff6b6b',
    },
  },
  light: {
    isDark: false,
    colors: {
      primary: '#0066ff',
      bg: '#f8fafc',
      text: '#1e293b',
      textSecondary: '#64748b',
      cardBg: '#ffffff',
      border: '#e2e8f0',
      accent: '#10b981',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
    },
  },
};

// Création du contexte avec le type
export const ThemeContext = createContext<ThemeContextType>({
  ...themes.dark,
  toggleTheme: () => {},
});

// Hook personnalisé pour utiliser le thème
export const useTheme = () => useContext(ThemeContext);

// Provider
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTheme, setCurrentTheme] = useState(themes.dark);

  useEffect(() => {
    // Charger le thème sauvegardé au démarrage
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme === 'light') {
          setCurrentTheme(themes.light);
        }
      } catch (error) {
        console.log('Erreur chargement thème:', error);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = currentTheme.isDark ? themes.light : themes.dark;
    setCurrentTheme(newTheme);

    try {
      await AsyncStorage.setItem('theme', newTheme.isDark ? 'dark' : 'light');
    } catch (error) {
      console.log('Erreur sauvegarde thème:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ ...currentTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};