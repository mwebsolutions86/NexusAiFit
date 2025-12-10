import React from 'react';
import { StyleSheet, TouchableOpacity, StyleProp, ViewStyle, Platform, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../lib/theme';
import * as Haptics from 'expo-haptics';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  onLongPress?: () => void;
  variant?: 'default' | 'active' | 'featured' | 'neon' | 'ghost';
  intensity?: number;
  expand?: boolean;
}

export const GlassCard = ({ 
  children, 
  style, 
  onPress,
  onLongPress, 
  variant = 'default',
  intensity = 30,
  expand = false
}: GlassCardProps) => {
  const { colors, isDark } = useTheme();

  const isNeon = variant === 'neon';
  const isFeatured = variant === 'featured';
  
  const getBackgroundColor = () => {
    if (isFeatured) return isDark ? 'rgba(0, 243, 255, 0.08)' : 'rgba(0, 102, 255, 0.08)';
    if (isNeon) return isDark ? 'rgba(20, 20, 30, 0.7)' : 'rgba(255, 255, 255, 0.9)';
    // Light Mode : Fond très clean, quasi opaque pour lisibilité
    return isDark ? 'rgba(30, 30, 40, 0.5)' : 'rgba(255, 255, 255, 0.85)';
  };

  const getBorderColors = () => {
    if (isFeatured) return [colors.primary + (isDark ? '80' : '40'), colors.primary + '10'];
    if (isNeon) return isDark 
        ? [colors.border, colors.primary + '40'] 
        : ['rgba(0,0,0,0.08)', colors.primary + '20']; 
    // Bordure standard très fine en light
    return isDark ? [colors.border, colors.border] : ['rgba(0,0,0,0.06)', 'rgba(0,0,0,0.02)'];
  };

  const Container = (onPress || onLongPress) ? TouchableOpacity : View;

  const handlePress = () => {
    if (onPress) {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const handleLongPress = () => {
    if (onLongPress) {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      onLongPress();
    }
  };

  return (
    <Container 
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={500}
      activeOpacity={0.85} 
      style={[
          styles.container, 
          style,
          // ❌ SUPPRESSION DE L'OMBRE EN LIGHT MODE
          // On ne garde l'ombre que pour le Dark Mode (si nécessaire) ou on l'enlève partout pour le style "Glass" pur
          isDark && styles.darkShadow 
      ]}
    >
        <LinearGradient
            colors={getBorderColors() as any}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={[
                styles.borderGradient,
                expand && { flex: 1 }
            ]}
        >
            <BlurView 
                intensity={Platform.OS === 'android' ? intensity + 20 : intensity}
                tint={isDark ? 'dark' : 'light'}
                style={[
                    styles.blurContainer, 
                    { backgroundColor: getBackgroundColor() },
                    expand && { flex: 1 }
                ]}
            >
                {children}
            </BlurView>
        </LinearGradient>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    marginVertical: 6,
    // Pas d'ombre par défaut, c'est le "Flat Glass"
  },
  darkShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  borderGradient: {
    borderRadius: 24,
    padding: 1,
  },
  blurContainer: {
    padding: 20,
    borderRadius: 23,
    width: '100%',
    overflow: 'hidden', 
  },
});