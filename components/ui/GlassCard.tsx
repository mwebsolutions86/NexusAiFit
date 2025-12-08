import React from 'react';
import { StyleSheet, TouchableOpacity, StyleProp, ViewStyle, Platform, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../lib/theme';
import * as Haptics from 'expo-haptics';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'default' | 'active' | 'featured';
  intensity?: number;
}

export const GlassCard = ({ 
  children, 
  style, 
  onPress, 
  variant = 'default',
  intensity = 20 
}: GlassCardProps) => {
  const { colors, isDark } = useTheme();

  const isFeatured = variant === 'featured';
  const isActive = variant === 'active';
  
  const getBackgroundColor = () => {
    if (isFeatured) return isDark ? 'rgba(0, 243, 255, 0.15)' : 'rgba(0, 102, 255, 0.1)';
    if (isActive) return colors.primary + '15';
    return isDark ? 'rgba(30,30,40,0.4)' : 'rgba(255,255,255,0.5)';
  };

  const borderColor = (isActive || isFeatured) ? colors.primary + '50' : colors.border;
  const Container = onPress ? TouchableOpacity : View;

  const handlePress = () => {
    if (onPress) {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  return (
    <Container 
      onPress={handlePress} 
      activeOpacity={0.7} 
      style={[styles.container, style]} // Le style externe définit la taille du conteneur
    >
      <BlurView 
        intensity={Platform.OS === 'android' ? intensity + 20 : intensity}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.blurContainer, // FLEX 1 au lieu de height 100%
          { 
            backgroundColor: getBackgroundColor(),
            borderColor: borderColor,
          }
        ]}
      >
        {children}
      </BlurView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    // Pas de height fixe ici, on laisse le parent ou le contenu décider
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },
  blurContainer: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    width: '100%',
    flex: 1, // ✅ CORRECTION MAJEURE : Permet de s'adapter au contenu
  },
});