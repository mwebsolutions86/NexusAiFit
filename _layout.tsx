import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopWidth: 1,
          borderTopColor: '#222',
          height: 60 + (Platform.OS === 'ios' ? insets.bottom : 10),
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 10,
          paddingTop: 10,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
        },
        tabBarActiveTintColor: '#00f3ff',
        tabBarInactiveTintColor: '#444',
        tabBarLabelStyle: { 
          fontSize: 9, 
          fontWeight: '900', 
          marginTop: 2, 
          letterSpacing: 0.5 
        }
      }}
    >
      {/* 1. COCKPIT (Dashboard) */}
      <Tabs.Screen name="dashboard" options={{
          title: 'COCKPIT',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="view-dashboard" size={24} color={color} />,
      }} />

      {/* 2. SPORT */}
      <Tabs.Screen name="workout" options={{
          title: 'SPORT',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="dumbbell" size={24} color={color} />,
      }} />

      {/* 3. NEURAL (Coach) */}
      <Tabs.Screen name="coach" options={{
          title: 'NEURAL',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="brain" size={24} color={color} />,
      }} />
      
      {/* 4. FUEL (Nutrition) */}
      <Tabs.Screen name="nutrition" options={{
          title: 'FUEL',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="food-apple" size={24} color={color} />,
      }} />

      {/* 5. MODULES (Systems) */}
      <Tabs.Screen name="systems" options={{
          title: 'MODULES',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="grid" size={24} color={color} />,
      }} />

    </Tabs>
  );
}