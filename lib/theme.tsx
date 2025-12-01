import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'react-native';

// Définition du type pour le contexte
type ThemeContextType = {
  isDark: boolean;
  toggleTheme: () => void;
  colors: {
    primary: string;
    secondary: string; // Ajout pour les dégradés secondaires
    bg: string;
    text: string;
    textSecondary: string;
    cardBg: string;
    glass: string; // Nouvelle propriété pour l'effet de transparence adaptatif
    border: string;
    accent: string;
    success: string;
    warning: string;
    danger: string;
    icon: string; // Couleur par défaut des icônes
  };
};

// Valeurs par défaut
const themes = {
  dark: {
    isDark: true,
    colors: {
      primary: '#00f3ff', // Cyan Néon
      secondary: '#0066ff', // Bleu profond
      bg: '#000000',
      text: '#ffffff',
      textSecondary: 'rgba(255,255,255,0.6)',
      cardBg: '#121212', 
      glass: 'rgba(20, 20, 30, 0.6)', // Verre sombre
      border: 'rgba(255,255,255,0.1)',
      accent: '#4ade80',
      success: '#4ade80',
      warning: '#ffaa00',
      danger: '#ff6b6b',
      icon: '#ffffff',
    },
  },
  light: {
    isDark: false,
    colors: {
      primary: '#0066ff', // Bleu électrique (plus lisible sur fond blanc que le cyan clair)
      secondary: '#00f3ff', 
      bg: '#F2F4F7', // Gris très léger "Laboratoire"
      text: '#111827', // Noir doux (Charcoal)
      textSecondary: '#6B7280', // Gris moyen
      cardBg: '#FFFFFF',
      glass: 'rgba(255, 255, 255, 0.8)', // Verre blanc givré
      border: '#E5E7EB', // Gris clair
      accent: '#10b981',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      icon: '#1f2937', // Icônes sombres
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
    
    // Met à jour la couleur de la StatusBar en fonction du thème
    // Note: sur Expo Router, on gère souvent la StatusBar dans les pages, 
    // mais ceci est une sécurité globale.
    
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