import { Tabs } from 'expo-router';
import { Platform, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/theme';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();

  // Hauteur de la barre flottante
  const BAR_HEIGHT = 70;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true, 
        tabBarStyle: {
          position: 'absolute',
          // MODIFICATION ICI : On descend la barre (était 25/20)
          bottom: Platform.OS === 'ios' ? 15 : 10, 
          left: 20,
          right: 20,
          height: BAR_HEIGHT,
          borderRadius: 35, 
          backgroundColor: theme.colors.glass,
          borderTopWidth: 0, 
          borderWidth: 1,
          borderColor: theme.colors.border, 
          elevation: 10, 
          shadowColor: "#000", 
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
          paddingBottom: 0, 
          paddingTop: 0,
        },
        tabBarActiveTintColor: theme.colors.primary, 
        tabBarInactiveTintColor: theme.colors.textSecondary, 
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: 'bold',
          marginBottom: 10, 
          letterSpacing: 0.5
        },
        tabBarItemStyle: {
          height: BAR_HEIGHT,
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 5
        }
      }}
    >
      {/* 1. COCKPIT */}
      <Tabs.Screen name="dashboard" options={{
          title: t('tabs.cockpit'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && { backgroundColor: theme.colors.primary + '15' }]}>
               <MaterialCommunityIcons name={focused ? "view-dashboard" : "view-dashboard-outline"} size={24} color={color} />
            </View>
          ),
      }} />

      {/* 2. SPORT */}
      <Tabs.Screen name="workout" options={{
          title: t('tabs.sport'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && { backgroundColor: theme.colors.primary + '15' }]}>
               <MaterialCommunityIcons name={focused ? "dumbbell" : "dumbbell"} size={24} color={color} />
            </View>
          ),
      }} />

      {/* 3. NEURAL (Coach) */}
      <Tabs.Screen name="coach" options={{
          title: t('tabs.neural'),
          tabBarIcon: ({ color, focused }) => (
            <View>
                {focused && <View style={[styles.glow, { backgroundColor: theme.colors.primary }]} />}
                <MaterialCommunityIcons name="brain" size={28} color={color} />
            </View>
          ),
      }} />
      
      {/* 4. FUEL (Nutrition) */}
      <Tabs.Screen name="nutrition" options={{
          title: t('tabs.fuel'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && { backgroundColor: theme.colors.primary + '15' }]}>
               <MaterialCommunityIcons name={focused ? "food-apple" : "food-apple-outline"} size={24} color={color} />
            </View>
          ),
      }} />

      {/* 5. MODULES */}
      <Tabs.Screen name="systems" options={{
          title: t('tabs.modules'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && { backgroundColor: theme.colors.primary + '15' }]}>
               <MaterialCommunityIcons name={focused ? "grid" : "grid-large"} size={24} color={color} />
            </View>
          ),
      }} />

    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    opacity: 0.2,
    transform: [{ scale: 1.2 }],
    top: -6,
    left: -6
  }
});