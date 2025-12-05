import React from 'react';
import { View, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../lib/theme';

interface GlassCardProps {
  children: React.ReactNode;
  // CORRECTION : On utilise StyleProp<ViewStyle> pour accepter les tableaux de styles [style1, style2]
  style?: StyleProp<ViewStyle>; 
  onPress?: () => void;
  variant?: 'default' | 'active';
}

export const GlassCard = ({ children, style, onPress, variant = 'default' }: GlassCardProps) => {
  const { colors, isDark } = useTheme();

  const isActive = variant === 'active';
  const borderColor = isActive ? colors.primary : colors.border;
  const backgroundColor = isActive ? colors.primary + '10' : colors.glass;

  // Assemblage du style de base + style dynamique + style passé en props
  const containerStyle: StyleProp<ViewStyle> = [
    styles.card,
    {
      backgroundColor,
      borderColor,
      shadowColor: isDark ? 'transparent' : '#000',
    },
    style 
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={containerStyle} onPress={onPress} activeOpacity={0.8}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 0,
  },
});