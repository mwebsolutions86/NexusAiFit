import React, { useEffect } from 'react';
import { View, StyleSheet, Platform, Dimensions, TouchableOpacity } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  interpolate, 
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

// Hooks
import { useTheme } from '../../lib/theme';

const { width } = Dimensions.get('window');
const TAB_WIDTH = width - 40; 
const TAB_ITEM_WIDTH = TAB_WIDTH / 5; 

// --- COMPOSANT ICÔNE ---
const TabIcon = ({ name, focused, color, isCenter }: any) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0, { damping: 15, stiffness: 200 });
    opacity.value = withTiming(focused ? 1 : 0.5, { duration: 200 });
  }, [focused]);

  const animatedIconStyle = useAnimatedStyle(() => {
    const baseScale = isCenter ? 1.3 : 1; 
    const activeScale = isCenter ? 1.5 : 1.2;
    const scaleVal = interpolate(scale.value, [0, 1], [baseScale, activeScale]);
    const translateY = interpolate(scale.value, [0, 1], [0, -3]); 
    return {
      transform: [{ scale: scaleVal }, { translateY }],
      opacity: focused ? 1 : (isCenter ? 0.8 : 0.6)
    };
  });

  const animatedDotStyle = useAnimatedStyle(() => ({
    opacity: scale.value,
    transform: [{ scale: scale.value }]
  }));

  return (
    <View style={styles.iconContainer}>
      <Animated.View style={animatedIconStyle}>
        <MaterialCommunityIcons name={name} size={26} color={color} />
      </Animated.View>
      <Animated.View style={[styles.activeDot, { backgroundColor: color }, animatedDotStyle]} />
    </View>
  );
};

// --- TAB BAR DYNAMIQUE ---
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  // ✅ On récupère les couleurs et le mode (Dark/Light)
  const { colors, isDark } = useTheme();
  
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withSpring(state.index * TAB_ITEM_WIDTH, {
      damping: 18, stiffness: 150, mass: 0.5
    });
  }, [state.index]);

  const animatedCursorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }]
  }));

  return (
    <View style={[styles.tabBarContainer, { 
        // ✅ Ombre dynamique : noire en mode sombre, bleutée douce en mode clair
        shadowColor: isDark ? "#000" : "#a0aec0", 
        shadowOpacity: isDark ? 0.6 : 0.25 
    }]}>
      
      {/* ✅ BLURVIEW ADAPTATIF : 'dark' ou 'light' */}
      <BlurView intensity={isDark ? 40 : 80} tint={isDark ? "dark" : "light"} style={[styles.blurContainer, { backgroundColor: colors.nav }]}>
        
        {/* Bordure subtile */}
        <View style={[styles.neonBorder, { borderColor: colors.navBorder }]} />

        {/* CURSEUR LUMINEUX */}
        <Animated.View style={[styles.cursorContainer, { width: TAB_ITEM_WIDTH }, animatedCursorStyle]}>
           <LinearGradient
             // ✅ Dégradé : Blanc/Bleu en light, Cyan/Transparent en dark
             colors={isDark ? [colors.primary + '50', 'transparent'] : [colors.primary + '20', 'transparent']} 
             style={styles.cursorGradient}
             start={{ x: 0.5, y: 0 }}
             end={{ x: 0.5, y: 1 }}
           />
           <View style={[styles.cursorLight, { backgroundColor: colors.primary }]} />
        </Animated.View>

        {/* ONGLETS */}
        <View style={styles.tabsRow}>
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate(route.name);
              }
            };

            let iconName = 'circle';
            let isCenter = false;
            if (route.name === 'dashboard') iconName = 'view-dashboard-outline';
            if (route.name === 'workout') iconName = 'dumbbell';
            if (route.name === 'coach') { iconName = 'brain'; isCenter = true; }
            if (route.name === 'nutrition') iconName = 'food-apple-outline';
            if (route.name === 'systems') iconName = 'cpu-64-bit';

            // ✅ COULEURS ADAPTÉES
            // En mode clair : Actif = Bleu Tech, Inactif = Gris moyen
            // En mode sombre : Actif = Blanc, Inactif = Gris clair
            const activeColor = isFocused 
                ? (isDark ? '#fff' : colors.primary) 
                : (isCenter ? colors.primary : colors.textSecondary);

            return (
              <TouchableOpacity
                key={index}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={onPress}
                style={styles.tabItem}
                activeOpacity={1}
              >
                <TabIcon name={iconName} focused={isFocused} color={activeColor} isCenter={isCenter} />
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
};

export default function TabLayout() {
  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'QG' }} />
      <Tabs.Screen name="workout" options={{ title: 'Sport' }} />
      <Tabs.Screen name="coach" options={{ title: 'Neuro' }} />
      <Tabs.Screen name="nutrition" options={{ title: 'Nutri' }} />
      <Tabs.Screen name="systems" options={{ title: 'Systèmes' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 25 : 15,
    left: 20,
    right: 20,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    // Les ombres sont gérées dynamiquement dans le composant
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 10,
  },
  blurContainer: {
    flex: 1,
    // Background géré dynamiquement
  },
  neonBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 35,
    borderWidth: 1,
  },
  cursorContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  cursorGradient: {
    width: '50%',
    height: '70%',
    opacity: 0.5,
  },
  cursorLight: {
    position: 'absolute',
    top: 0,
    width: 20,
    height: 2,
    borderRadius: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  tabsRow: {
    flexDirection: 'row',
    height: '100%',
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    width: 50,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 6,
    position: 'absolute',
    bottom: 10,
  }
});