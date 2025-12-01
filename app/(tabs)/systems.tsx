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

// --- NOUVELLE CONFIGURATION D'ACCÈS (BINAIRE) ---
const ACCESS_RULES: any = {
    // GRATUIT : Les outils de base uniquement
    FREE: [
        'bmi', 'tdee', 'water',     // Santé simple
        '1rm', 'timer',            // Outils sportifs
        'breath',                 // Respiration simple
        'exercise-library',      // Bibliothèque
        'shopping'              // Liste de courses
      ],
    
    // PREMIUM : Accès total
    PREMIUM: ['all']
};

// --- LISTE DES MODULES ---
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
              // Mappage pour compatibilité ancien système -> nouveau
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
      
      const allowedModules = ACCESS_RULES.FREE;
      return !allowedModules.includes(moduleId);
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
            `Passez à la version Premium pour débloquer ${module.name} et tout le potentiel de NexusAiFit.`,
            [
                { text: "Annuler", style: "cancel" },
                { text: "VOIR L'OFFRE (5.99€)", onPress: () => router.push('/profile' as any) } 
            ]
        );
        return;
    }

    const moduleRoutes: { [key: string]: string } = {
      'body_fat': '/features/body_fat',
      'water': '/features/water',
      'timer': '/features/timer',
      '1rm': '/features/calculator1rm',
      'tdee': '/features/tdee',
      'bmi': '/features/bmi',
      'macros': '/features/macros',
      'meditation': '/features/meditation',
      'mood': '/features/mood',
      'food-journal': '/features/food-journal',
      'exercise-library': '/features/exercise-library',
      'sleep': '/features/sleep',
      'stress': '/features/stress',
      'heart': '/features/heart',
      'body': '/features/body',
      'workout_log': '/features/workout_log',
      'reflex': '/features/reflex',
      'vision': '/features/vision',
      'posture': '/features/posture',
      'shopping': '/features/shopping',
      'supps': '/features/supps',
      'fasting': '/features/fasting',
      'meal_prep': '/features/meal_prep',
      'breath': '/features/breath',
      'stretching': '/features/stretching',
      'journaling': '/features/journaling',
      'cold': '/features/cold',
      'nootropics': '/features/nootropics',
      'env': '/features/env',
      'hrv': '/features/hrv',
      'discharge': '/features/discharge',
    };

    const route = moduleRoutes[module.id];
    if (route) {
      router.push(route as any);
      return;
    }
  };

  // ... (Styles inchangés, assurez-vous qu'ils utilisent theme.colors)
  // Je garde les styles du fichier précédent pour la concision, 
  // assurez-vous juste de bien avoir les imports et le reste du composant comme avant.
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? 25 : 0 },
    auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
    blob: { position: 'absolute', width: 350, height: 350, borderRadius: 175, opacity: 0.4 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 20, marginTop: Platform.OS === 'ios' ? 10 : 0 },
    headerTitle: { color: theme.colors.text, fontSize: 12, fontWeight: 'bold', letterSpacing: 2 },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    statusText: { fontSize: 10, fontWeight: 'bold', color: theme.colors.textSecondary },
    glassIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    content: { padding: 20, paddingTop: 0 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.glass, paddingHorizontal: 15, borderRadius: 16, marginBottom: 30, borderWidth: 1, borderColor: theme.colors.border, height: 50 },
    searchInput: { flex: 1, color: theme.colors.text, marginLeft: 10, fontSize: 14 },
    section: { marginBottom: 25 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: '900', letterSpacing: 1, marginLeft: 8, marginRight: 10 },
    line: { flex: 1, height: 1, backgroundColor: theme.colors.border },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    moduleCard: { width: (width - 52) / 2, height: 120, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.glass, shadowColor: theme.isDark ? 'transparent' : '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: theme.isDark ? 0 : 0.05, shadowRadius: 6, elevation: theme.isDark ? 0 : 2 },
    moduleLocked: { borderColor: theme.colors.border, opacity: 0.7, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#f0f0f0' },
    cardContent: { flex: 1, padding: 15, justifyContent: 'space-between' },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    iconContainer: { padding: 10, borderRadius: 14, borderWidth: 1 },
    lockBadge: { position: 'absolute', top: 0, right: 0, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    statusBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.glass },
    statusBadgeText: { fontSize: 8, fontWeight: '900' },
    moduleName: { color: theme.colors.text, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  });

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} backgroundColor="transparent" translucent={true} />
      {theme.isDark && (
        <View style={styles.auroraBg}>
            <View style={[styles.blob, { top: -50, left: -100, backgroundColor: 'rgba(0, 243, 255, 0.15)' }]} />
            <View style={[styles.blob, { top: '40%', right: -100, backgroundColor: 'rgba(139, 92, 246, 0.1)' }]} />
            <View style={[styles.blob, { bottom: -100, left: 50, backgroundColor: 'rgba(59, 130, 246, 0.15)' }]} />
        </View>
      )}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <View>
                <Text style={styles.headerTitle}>CENTRE DE COMMANDE</Text>
                <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: userTier === 'PREMIUM' ? '#ffd700' : theme.colors.textSecondary }]} />
                    <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
                        {userTier === 'FREE' ? 'DÉCOUVERTE' : 'MEMBRE PREMIUM'}
                    </Text>
                </View>
            </View>
            <View style={styles.glassIcon}>
                <MaterialCommunityIcons name="grid" size={20} color={theme.colors.text} />
            </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
                <TextInput style={styles.searchInput} placeholder="Rechercher un protocole..." placeholderTextColor={theme.colors.textSecondary} value={search} onChangeText={setSearch} />
            </View>

            {MODULES.map((section, index) => (
                <View key={index} style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="folder-outline" size={14} color={theme.colors.textSecondary} />
                        <Text style={styles.sectionTitle}>{section.category}</Text>
                        <View style={styles.line} />
                    </View>
                    <View style={styles.grid}>
                        {section.items.filter(i => i.name.toLowerCase().includes(search.toLowerCase())).map((item, i) => {
                            const locked = isLocked(item.id, item.comingSoon);
                            return (
                                <TouchableOpacity key={i} style={[styles.moduleCard, locked && styles.moduleLocked]} onPress={() => handlePress(item)} activeOpacity={0.7}>
                                    <LinearGradient colors={theme.isDark ? (locked ? ['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)'] : ['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']) : ['transparent', 'transparent']} style={styles.cardContent}>
                                            <View style={styles.cardTop}>
                                                <View style={[styles.iconContainer, { backgroundColor: locked ? theme.colors.cardBg : (theme.isDark ? `${item.color}15` : `${item.color}20`), borderColor: locked ? theme.colors.border : (theme.isDark ? `${item.color}30` : 'transparent') }]}>
                                                    <MaterialCommunityIcons name={item.icon} size={24} color={locked ? theme.colors.textSecondary : item.color} />
                                                </View>
                                                {locked && !item.comingSoon && (
                                                    <View style={styles.lockBadge}>
                                                        <MaterialCommunityIcons name="lock" size={10} color="#fff" />
                                                    </View>
                                                )}
                                                {item.comingSoon && (
                                                     <View style={[styles.statusBadge, {backgroundColor: theme.colors.border}]}>
                                                        <Text style={[styles.statusBadgeText, {color: theme.colors.textSecondary}]}>BETA</Text>
                                                     </View>
                                                )}
                                                {!locked && !item.comingSoon && item.status === 'PREMIUM' && (
                                                     <View style={[styles.statusBadge, {borderColor: '#ffd700'}]}>
                                                        <Text style={[styles.statusBadgeText, {color: '#ffd700'}]}>PRO</Text>
                                                     </View>
                                                )}
                                            </View>
                                            <Text style={[styles.moduleName, locked && {color: theme.colors.textSecondary}]} numberOfLines={2}>{item.name}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            ))}
            <View style={{height: 100}} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}