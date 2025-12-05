import React from 'react';
import { View, StyleSheet, Platform, ViewStyle, StatusBar as RNStatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../lib/theme';

interface ScreenLayoutProps {
  children: React.ReactNode;
  style?: ViewStyle;
  withSafeArea?: boolean; // Parfois on veut gérer le safe area manuellement (ex: listes)
  edges?: ('top' | 'right' | 'bottom' | 'left')[]; // Pour affiner le SafeArea
}

export const ScreenLayout = ({ 
  children, 
  style, 
  withSafeArea = true,
  edges = ['top', 'left', 'right'] 
}: ScreenLayoutProps) => {
  const { colors, isDark } = useTheme();

  const Wrapper = withSafeArea ? SafeAreaView : View;
  const wrapperProps = withSafeArea ? { edges } : {};

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Effet Aurora Global - Ne s'affiche qu'en mode Dark pour l'ambiance Cyberpunk */}
      {isDark && (
        <View style={styles.auroraContainer}>
          <View style={[styles.blob, { top: -100, right: -50, backgroundColor: colors.primary + '15' }]} />
          <View style={[styles.blob, { bottom: 0, left: -50, backgroundColor: colors.secondary + '15' }]} />
        </View>
      )}

      <Wrapper 
        style={[styles.content, style]} 
        {...wrapperProps}
      >
        {children}
      </Wrapper>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  auroraContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.4, // Ajusté pour être subtil mais visible
  },
  content: {
    flex: 1,
  },
});