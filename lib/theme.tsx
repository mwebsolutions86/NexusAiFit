import { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- PALETTES ---

const DarkTheme = {
  dark: true,
  colors: {
    primary: '#00f3ff',       // Néon Cyan
    bg: '#050508',            // Noir Profond
    glass: 'rgba(20, 20, 30, 0.6)', // Verre Fumé
    card: '#121214',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.5)',
    border: 'rgba(255, 255, 255, 0.1)',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    nav: 'rgba(10, 10, 15, 0.9)', 
    navBorder: 'rgba(255,255,255,0.1)'
  }
};

const LightTheme = {
  dark: false,
  colors: {
    primary: '#0066FF',       // Bleu "Tech" Profond
    bg: '#F0F2F5',            // Gris Platine
    glass: 'rgba(255, 255, 255, 0.85)', // Verre Givré
    card: '#FFFFFF',
    text: '#111827',          // Gunmetal
    textSecondary: '#6B7280', // Gris Cool
    border: 'rgba(0, 0, 0, 0.06)', 
    success: '#059669',
    warning: '#D97706',
    danger: '#DC2626',
    nav: 'rgba(255, 255, 255, 0.95)',
    navBorder: 'rgba(0,0,0,0.05)'
  }
};

// --- CONTEXTE ---

type ThemeType = typeof DarkTheme;

interface ThemeContextProps {
  theme: ThemeType;
  colors: ThemeType['colors'];
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps>({} as any);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      const stored = await AsyncStorage.getItem('nexus_theme');
      if (stored) {
        setIsDark(stored === 'dark');
      } else {
        setIsDark(systemScheme === 'dark');
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newMode = !isDark;
    setIsDark(newMode);
    await AsyncStorage.setItem('nexus_theme', newMode ? 'dark' : 'light');
  };

  const theme = isDark ? DarkTheme : LightTheme;

  return (
    <ThemeContext.Provider value={{ theme, colors: theme.colors, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);