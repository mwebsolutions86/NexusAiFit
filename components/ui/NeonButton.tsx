import React from 'react';
import { Text, StyleSheet, TouchableOpacity, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme';

interface NeonButtonProps {
  label: string;
  onPress: () => void;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>; // CORRECTION ICI
  variant?: 'primary' | 'danger';
}

export const NeonButton = ({ 
  label, 
  onPress, 
  icon, 
  loading = false, 
  disabled = false,
  style,
  variant = 'primary'
}: NeonButtonProps) => {
  const { colors } = useTheme();

  // CORRECTION: On force le type pour rassurer TypeScript que c'est bien un tuple valide pour le dégradé
  const gradientColors: [string, string, ...string[]] = variant === 'danger' 
    ? [colors.danger, '#991b1b'] 
    : [colors.primary, colors.secondary];

  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[styles.container, style, { opacity: disabled ? 0.5 : 1 }]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            {icon && (
              <MaterialCommunityIcons 
                name={icon} 
                size={20} 
                color="#fff" 
                style={{ marginRight: 8 }} 
              />
            )}
            <Text style={styles.text}>{label.toUpperCase()}</Text>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
});