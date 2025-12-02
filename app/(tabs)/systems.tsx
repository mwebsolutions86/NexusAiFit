import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';

const { width } = Dimensions.get('window');

interface ModuleItem {
  id: string;
  name: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  status?: string;      
  comingSoon?: boolean; 
}

interface ModuleSection {
  category: string;
  items: ModuleItem[];
}

// --- CONFIGURATION D'ACCÈS (INCHANGÉE) ---
const ACCESS_RULES: any = {
    FREE: ['bmi', 'tdee', 'water', '1rm', 'timer', 'breath', 'exercise-library', 'shopping'],
    PREMIUM: ['all']
};

// --- LISTE DES MODULES (INCHANGÉE) ---
const MODULES: ModuleSection[] = [
  {
    category: "BIO-TRACKING",
    items: [
      { id: 'body_fat', name: 'Masse Grasse', icon: 'water-percent', color: '#ffaa00', status: 'PREMIUM' },
      { id: 'water', name: 'Hydratation', icon: 'water', color: '#3b82f6', status: 'ACTIF' },
      { id: 'tdee', name: 'Métabolisme', icon: 'fire', color: '#f97316', status: 'ACTIF' },
      { id: 'bmi', name: 'Analyse IMC', icon: 'human-handsup', color: '#10b981', status: 'ACTIF' },
      { id: 'sleep', name: 'Analyse Sommeil', icon: 'bed-clock', color: '#8b5cf6', status: 'PREMIUM' },
      { id: 'stress', name: 'Niveau Stress', icon: 'brain', color: '#f59e0b', status: 'PREMIUM' },
      { id: 'heart', name: 'Cardio Fréq.', icon: 'heart-pulse', color: '#ef4444', status: 'PREMIUM' },
      { id: 'body', name: 'Body Battery', icon: 'lightning-bolt', color: '#22c55e', status: 'PREMIUM' },
    ]
  },
  {
    category: "PERFORMANCE",
    items: [
      { id: '1rm', name: 'Calculateur 1RM', icon: 'calculator', color: '#ec4899', status: 'ACTIF' },
      { id: 'timer', name: 'Chrono Tactique', icon: 'timer-sand', color: '#6366f1', status: 'ACTIF' },
      { id: 'workout_log', name: 'Historique Séances', icon: 'notebook-check', color: '#00f3ff', status: 'PREMIUM' },
      { id: 'reflex', name: 'Test Réflexes', icon: 'cursor-default-click', color: '#eab308', status: 'PREMIUM' },
      { id: 'vision', name: 'Vision Focus', icon: 'eye-circle', color: '#00f3ff', status: 'PREMIUM' },
      { id: 'posture', name: 'Analyse Posture', icon: 'human-male', color: '#6366f1', status: 'PREMIUM' },
    ]
  },
  {
    category: "NUTRITION",
    items: [
      { id: 'macros', name: 'Calculateur Macros', icon: 'nutrition', color: '#f97316', status: 'PREMIUM' },
      { id: 'shopping', name: 'Liste Courses', icon: 'cart-variant', color: '#10b981', status: 'ACTIF' },
      { id: 'supps', name: 'Stack Suppléments', icon: 'bottle-tonic-plus', color: '#6366f1', status: 'PREMIUM' },
      { id: 'fasting', name: 'Jeûne Intermit.', icon: 'clock-fast', color: '#14b8a6', status: 'PREMIUM' },
      { id: 'meal_prep', name: 'Chef Meal Prep', icon: 'chef-hat', color: '#f43f5e', status: 'PREMIUM' },
    ]
  },
  {
    category: "RÉCUPÉRATION & BIO-HACKING",
    items: [
      { id: 'breath', name: 'Respiration', icon: 'weather-windy', color: '#a855f7', status: 'ACTIF' },
      { id: 'stretching', name: 'Routine Souplesse', icon: 'yoga', color: '#2dd4bf', status: 'PREMIUM' },
      { id: 'mood', name: 'État Neural', icon: 'emoticon-happy', color: '#eab308', status: 'PREMIUM' },
      { id: 'meditation', name: 'Méditation Zen', icon: 'meditation', color: '#8b5cf6', status: 'PREMIUM' },
      { id: 'journaling', name: 'Journal de Bord', icon: 'book-open-variant', color: '#6366f1', status: 'PREMIUM' },
      { id: 'cold', name: 'Suivi Froid', icon: 'snowflake', color: '#0ea5e9', status: 'PREMIUM' },
      { id: 'nootropics', name: 'Guide Nootropiques', icon: 'pill', color: '#8b5cf6', status: 'PREMIUM' },
      { id: 'env', name: 'Scanner Environ.', icon: 'radar', color: '#06b6d4', status: 'PREMIUM' },
      { id: 'hrv', name: 'Optimisation VFC', icon: 'sine-wave', color: '#d946ef', status: 'PREMIUM' },
      { id: 'discharge', name: 'Neuro-Décharge', icon: 'flash-off', color: '#94a3b8', status: 'PREMIUM' },
    ]
  }
];

export default function Systems() {
  const router = useRouter();
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const [userTier, setUserTier] = useState('FREE');

  useFocusEffect(
    useCallback(() => {
      checkUserTier();
    }, [])
  );

  const checkUserTier = async () => {
      try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;

          const { data } = await supabase.from('profiles').select('tier').eq('id', session.user.id).single();
          
          if (data?.tier) {
              let tier = 'FREE';
              const t = (data.tier || '').toUpperCase();
              if (['PREMIUM', 'ELITE', 'AVANCE', 'ESSENTIEL'].includes(t)) tier = 'PREMIUM';
              setUserTier(tier);
          }
      } catch (e) {
          console.log("Erreur chargement tier", e);
      }
  };

  const isLocked = (moduleId: string, comingSoon?: boolean) => {
      if (comingSoon) return false;
      if (userTier === 'PREMIUM') return false; 
      return !ACCESS_RULES.FREE.includes(moduleId);
  };

  const handlePress = (module: ModuleItem) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    
    if (module.comingSoon) {
        Alert.alert("Bientôt", "Module en cours de développement.");
        return;
    }

    if (isLocked(module.id, false)) {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
            "MODULE PREMIUM", 
            `Passez à la version Elite pour débloquer ${module.name}.`,
            [
                { text: "Annuler", style: "cancel" },
                { text: "DÉBLOQUER", onPress: () => router.push('/profile' as any) } 
            ]
        );
        return;
    }

    const moduleRoutes: { [key: string]: string } = {
      'body_fat': '/features/body_fat', 'water': '/features/water', 'timer': '/features/timer',
      '1rm': '/features/calculator1rm', 'tdee': '/features/tdee', 'bmi': '/features/bmi',
      'macros': '/features/macros', 'meditation': '/features/meditation', 'mood': '/features/mood',
      'food-journal': '/features/food-journal', 'exercise-library': '/features/exercise-library',
      'sleep': '/features/sleep', 'stress': '/features/stress', 'heart': '/features/heart',
      'body': '/features/body', 'workout_log': '/features/workout_log', 'reflex': '/features/reflex',
      'vision': '/features/vision', 'posture': '/features/posture', 'shopping': '/features/shopping',
      'supps': '/features/supps', 'fasting': '/features/fasting', 'meal_prep': '/features/meal_prep',
      'breath': '/features/breath', 'stretching': '/features/stretching', 'journaling': '/features/journaling',
      'cold': '/features/cold', 'nootropics': '/features/nootropics', 'env': '/features/env',
      'hrv': '/features/hrv', 'discharge': '/features/discharge',
    };

    const route = moduleRoutes[module.id];
    if (route) router.push(route as any);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? 25 : 0 },
    auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
    blob: { position: 'absolute', width: 350, height: 350, borderRadius: 175, opacity: 0.3 },
    
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 20 },
    headerTitle: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase' },
    headerSub: { fontSize: 22, fontWeight: '300', color: theme.colors.text, marginTop: 2 },
    
    tierBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: userTier === 'PREMIUM' ? '#FFD70020' : theme.colors.glass, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: userTier === 'PREMIUM' ? '#FFD700' : theme.colors.border },
    tierText: { fontSize: 10, fontWeight: '900', color: userTier === 'PREMIUM' ? '#FFD700' : theme.colors.textSecondary, letterSpacing: 1 },

    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.glass, paddingHorizontal: 15, borderRadius: 16, marginBottom: 30, marginHorizontal: 20, borderWidth: 1, borderColor: theme.colors.border, height: 50 },
    searchInput: { flex: 1, color: theme.colors.text, marginLeft: 10, fontSize: 15 },

    content: { paddingHorizontal: 20, paddingBottom: 100 },
    section: { marginBottom: 30 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { color: theme.colors.textSecondary, fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginLeft: 10 },
    line: { width: 3, height: 12, backgroundColor: theme.colors.primary, borderRadius: 2 },
    
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    
    // --- DESIGN LUXE ADAPTATIF ---
    moduleCard: { 
        width: (width - 52) / 2, 
        height: 110, 
        borderRadius: 20, 
        overflow: 'hidden', 
        borderWidth: 1, 
        // Bordure plus visible en mode clair
        borderColor: theme.isDark ? theme.colors.border : '#E5E7EB', 
        backgroundColor: theme.colors.glass, 
        // Ombres renforcées en mode clair pour détacher la carte
        shadowColor: theme.isDark ? 'transparent' : '#000', 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: theme.isDark ? 0 : 0.08, 
        shadowRadius: 8, 
        elevation: theme.isDark ? 0 : 3 
    },
    cardContent: { flex: 1, padding: 15, justifyContent: 'space-between' },
    
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    iconContainer: { width: 38, height: 38, borderRadius: 12, justifyContent:'center', alignItems:'center' },
    
    lockBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: theme.colors.cardBg, padding: 4, borderRadius: 8 },
    proBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#FFD700', backgroundColor: '#FFD70010' },
    proText: { fontSize: 8, fontWeight: '900', color: '#FFD700' },
    
    moduleName: { color: theme.colors.text, fontSize: 13, fontWeight: 'bold', lineHeight: 18 },
    lockedText: { color: theme.colors.textSecondary }
  });

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} backgroundColor="transparent" translucent={true} />
      {theme.isDark && (
        <View style={styles.auroraBg}>
            <View style={[styles.blob, { top: -50, left: -100, backgroundColor: 'rgba(0, 243, 255, 0.15)' }]} />
            <View style={[styles.blob, { bottom: -100, right: -50, backgroundColor: 'rgba(139, 92, 246, 0.15)' }]} />
        </View>
      )}
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <View>
                <Text style={styles.headerTitle}>SYSTÈMES</Text>
                <Text style={styles.headerSub}>Centre de Commande</Text>
            </View>
            <View style={styles.tierBadge}>
                <Text style={styles.tierText}>{userTier === 'PREMIUM' ? 'ELITE' : 'STANDARD'}</Text>
            </View>
        </View>

        <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
            <TextInput 
                style={styles.searchInput} 
                placeholder="Rechercher un protocole..." 
                placeholderTextColor={theme.colors.textSecondary} 
                value={search} 
                onChangeText={setSearch} 
            />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {MODULES.map((section, index) => (
                <View key={index} style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.line} />
                        <Text style={styles.sectionTitle}>{section.category}</Text>
                    </View>
                    <View style={styles.grid}>
                        {section.items.filter(i => i.name.toLowerCase().includes(search.toLowerCase())).map((item, i) => {
                            const locked = isLocked(item.id, item.comingSoon);
                            return (
                                <TouchableOpacity 
                                    key={i} 
                                    style={[
                                        styles.moduleCard, 
                                        locked && {
                                            opacity: 0.8, 
                                            borderColor: theme.colors.border,
                                            backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#F3F4F6' // Fond grisé pour locked en mode clair
                                        }
                                    ]} 
                                    onPress={() => handlePress(item)} 
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient 
                                        // --- DÉGRADÉ ADAPTATIF LUXE ---
                                        colors={theme.isDark 
                                            ? (locked ? ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.02)'] : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']) 
                                            : (locked ? ['transparent', 'transparent'] : ['#ffffff', 'rgba(255,255,255,0.5)']) // Blanc pur vers léger transp. pour mode clair
                                        }
                                        style={styles.cardContent}
                                    >
                                            <View style={styles.cardTop}>
                                                <View style={[styles.iconContainer, { backgroundColor: locked ? theme.colors.textSecondary + '15' : item.color + '20' }]}>
                                                    <MaterialCommunityIcons name={item.icon} size={20} color={locked ? theme.colors.textSecondary : item.color} />
                                                </View>
                                                
                                                {locked && !item.comingSoon && (
                                                    <View style={styles.lockBadge}>
                                                        <MaterialCommunityIcons name="lock" size={12} color={theme.colors.textSecondary} />
                                                    </View>
                                                )}
                                                
                                                {!locked && item.status === 'PREMIUM' && (
                                                     <View style={styles.proBadge}>
                                                        <Text style={styles.proText}>PRO</Text>
                                                     </View>
                                                )}
                                            </View>
                                            <Text style={[styles.moduleName, locked && styles.lockedText]} numberOfLines={2}>{item.name}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}