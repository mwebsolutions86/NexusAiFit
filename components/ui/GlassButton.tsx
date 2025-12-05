import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme';

interface GlassButtonProps {
  onPress: () => void;
  icon: string;
  iconFamily?: 'MaterialCommunityIcons' | 'Ionicons';
  size?: number;
  style?: ViewStyle;
}

export const GlassButton = ({ 
  onPress, 
  icon, 
  iconFamily = 'MaterialCommunityIcons', 
  size = 24,
  style 
}: GlassButtonProps) => {
  const { colors } = useTheme();

  const IconComponent = iconFamily === 'Ionicons' ? Ionicons : MaterialCommunityIcons;

  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={[
        styles.container, 
        { 
          backgroundColor: colors.glass, 
          borderColor: colors.border,
          width: size * 2, // Ratio carré
          height: size * 2,
          borderRadius: size * 0.8 
        }, 
        style
      ]}
    >
      <IconComponent name={icon as any} size={size} color={colors.text} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
});