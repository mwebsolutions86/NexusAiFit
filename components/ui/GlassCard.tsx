import React from 'react';
import { StyleSheet, TouchableOpacity, View, StyleProp, ViewStyle, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../lib/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  onLongPress?: () => void;
  variant?: 'default' | 'active' | 'featured' | 'neon';
  intensity?: number; // Gardé pour compatibilité, mais ignoré pour la perf
  expand?: boolean;
}

export const GlassCard = ({ 
  children, 
  style, 
  onPress,
  onLongPress, 
  variant = 'default',
  expand = false
}: GlassCardProps) => {
  const { colors, isDark } = useTheme();

  // 🎨 COULEURS SIMPLIFIÉES (Sans Blur = Zéro Crash)
  // On utilise des opacités pour simuler le verre sans le coût GPU
  const getBackgroundColor = () => {
    if (variant === 'featured') return isDark ? 'rgba(0, 243, 255, 0.1)' : 'rgba(0, 102, 255, 0.08)';
    if (variant === 'neon') return isDark ? 'rgba(20, 20, 30, 0.9)' : 'rgba(255, 255, 255, 0.95)';
    // Défaut : Fond semi-transparent solide
    return isDark ? 'rgba(30, 30, 35, 0.85)' : 'rgba(255, 255, 255, 0.95)';
  };

  const getBorderColor = () => {
    if (variant === 'featured') return colors.primary;
    if (variant === 'neon') return isDark ? colors.border : 'rgba(0,0,0,0.05)';
    return isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  };

  const Container = (onPress || onLongPress) ? TouchableOpacity : View;

  return (
    <Container 
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      style={[
          styles.container, 
          { 
              backgroundColor: getBackgroundColor(),
              borderColor: getBorderColor(),
              borderWidth: 1,
          },
          // Ombre légère pour le relief
          isDark ? styles.darkShadow : styles.lightShadow,
          expand && { flex: 1 },
          style
      ]}
    >
        {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden', // Important pour le border radius
  },
  darkShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4, // Android Perf OK
  },
  lightShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2, // Android Perf OK
  },
});