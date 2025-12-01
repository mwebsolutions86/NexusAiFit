import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// --- 1. DÉFINITION DES TYPES ---
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

// --- 2. CONFIGURATION DES NIVEAUX D'ACCÈS (MIS À JOUR) ---
const ACCESS_RULES: any = {
    // GRATUIT (Les essentiels)
     FREE: ['water', 'timer', '1rm', 'body_fat', 'exercise-library', 'bmi', 'tdee'], 
    
    // ESSENTIEL (+ Tracking Santé & Perf de base)
    ESSENTIEL: ['water', 'timer', '1rm', 'body_fat', 'exercise-library', 'tdee', 'bmi', 'sleep', 'heart', 'body', 'workout_log', 'stretching', 'breath'], 
    
    // AVANCÉ (+ Nutrition poussée & Mental)
    AVANCE: ['water', 'timer', '1rm', 'body_fat', 'exercise-library', 'tdee', 'bmi', 'sleep', 'heart', 'body', 'workout_log', 'stretching', 'breath', 'stress', 'fasting', 'shopping', 'supps', 'macros', 'mood', 'journaling', 'meal_prep'],
    
    // ÉLITE (Bio-Hacking & Science - Tout débloqué)
    ELITE: ['all']
};

// --- 3. LISTE COMPLÈTE DES 29 MODULES ---
const MODULES: ModuleSection[] = [
  {
    category: "BIO-TRACKING (8)",
    items: [
      { id: 'body_fat', name: 'Masse Grasse', icon: 'water-percent', color: '#ffaa00', status: 'ACTIF' },
      { id: 'sleep', name: 'Analyse Sommeil', icon: 'bed-clock', color: '#8b5cf6', status: 'ACTIF' },
      { id: 'water', name: 'Hydratation', icon: 'water', color: '#3b82f6', status: 'ACTIF' },
      { id: 'tdee', name: 'Métabolisme', icon: 'fire', color: '#f97316', status: 'ACTIF' },
      { id: 'bmi', name: 'Analyse IMC', icon: 'human-handsup', color: '#10b981', status: 'ACTIF' },
      { id: 'heart', name: 'Cardio Freq.', icon: 'heart-pulse', color: '#ef4444', status: 'ACTIF', comingSoon: true },
      { id: 'body', name: 'Body Battery', icon: 'battery-charging-high', color: '#22c55e', status: 'beta', comingSoon: true },
      { id: 'stress', name: 'Niveau Stress', icon: 'brain', color: '#f59e0b', status: 'ACTIF' },
    ]
  },
  {
    category: "PERFORMANCE (6)",
    items: [
      { id: '1rm', name: 'Calculateur 1RM', icon: 'calculator', color: '#ec4899', status: 'ACTIF' },
      { id: 'timer', name: 'Chrono Tactique', icon: 'timer-sand', color: '#fff', status: 'ACTIF' },
      { id: 'workout_log', name: 'Historique Séances', icon: 'notebook-check', color: '#00f3ff', status: 'ACTIF', comingSoon: true },
      { id: 'reflex', name: 'Réflexes', icon: 'lightning-bolt', color: '#eab308', status: 'PRO' },
      { id: 'vision', name: 'Vision Focus', icon: 'eye-circle', color: '#00f3ff', status: 'PRO', comingSoon: true },
      { id: 'posture', name: 'Analyse Posture', icon: 'human-male', color: '#6366f1', status: 'PRO', comingSoon: true },
    ]
  },
  {
    category: "NUTRITION (5)",
    items: [
      { id: 'macros', name: 'Calculateur Macros', icon: 'nutrition', color: '#f97316', status: 'ACTIF' },
      { id: 'fasting', name: 'Jeûne Intermit.', icon: 'clock-fast', color: '#14b8a6', status: 'ACTIF' },
      { id: 'supps', name: 'Stack Suppléments', icon: 'bottle-tonic-plus', color: '#6366f1', status: 'ACTIF' },
      { id: 'shopping', name: 'Liste Courses', icon: 'cart-variant', color: '#10b981', status: 'ACTIF' },
      { id: 'meal_prep', name: 'Idées Meal Prep', icon: 'food-turkey', color: '#f43f5e', status: 'ACTIF', comingSoon: true },
    ]
  },
  {
    category: "RÉCUPÉRATION & MENTAL (5)",
    items: [
      { id: 'breath', name: 'Respiration', icon: 'weather-windy', color: '#a855f7', status: 'ACTIF' },
      { id: 'meditation', name: 'Méditation', icon: 'meditation', color: '#8b5cf6', status: 'PRO', comingSoon: true },
      { id: 'stretching', name: 'Routine Souplesse', icon: 'yoga', color: '#10b981', status: 'ACTIF', comingSoon: true },
      { id: 'mood', name: 'Journal Humeur', icon: 'emoticon-happy', color: '#eab308', status: 'ACTIF' },
      { id: 'journaling', name: 'Journal de Bord', icon: 'book-open-variant', color: '#fff', status: 'PRO', comingSoon: true },
    ]
  },
  {
    category: "BIO-HACKING (5)",
    items: [
      { id: 'cold', name: 'Suivi Froid', icon: 'snowflake', color: '#3b82f6', status: 'PRO', comingSoon: true },
      { id: 'blood', name: 'Analyse Sanguine', icon: 'water-outline', color: '#ef4444', status: 'LOCKED', comingSoon: true },
      { id: 'genetics', name: 'Analyse ADN', icon: 'dna', color: '#f43f5e', status: 'LOCKED', comingSoon: true },
      { id: 'nootropics', name: 'Guide Nootropiques', icon: 'pill', color: '#8b5cf6', status: 'LOCKED', comingSoon: true },
      { id: 'hormones', name: 'Suivi Hormonal', icon: 'chart-bell-curve', color: '#ec4899', status: 'LOCKED', comingSoon: true },
    ]
  }
];

export default function Systems() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [userTier, setUserTier] = useState('FREE');

  // Vérification du niveau d'abonnement à chaque visite
  useFocusEffect(
    useCallback(() => {
      checkUserTier();
    }, [])
  );

  const checkUserTier = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase.from('profiles').select('tier').eq('id', session.user.id).single();
      if (data?.tier) {
          let tier = 'FREE';
          const t = (data.tier || '').toUpperCase();
          if (t === 'ÉLITE' || t === 'ELITE') tier = 'ELITE';
          else if (t === 'AVANCÉ' || t === 'AVANCE') tier = 'AVANCE';
          else if (t === 'ESSENTIEL') tier = 'ESSENTIEL';
          
          setUserTier(tier);
      }
  };

  const isLocked = (moduleId: string, comingSoon?: boolean) => {
      if (comingSoon) return false; // On laisse visible mais marqué "Bientôt"
      if (userTier === 'ELITE') return false; 
      
      const allowedModules = ACCESS_RULES[userTier] || ACCESS_RULES.FREE;
      if (allowedModules.includes('all')) return false;
      
      return !allowedModules.includes(moduleId);
  };

  const handlePress = (module: ModuleItem) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    
    if (module.comingSoon) {
        Alert.alert("EN DÉVELOPPEMENT", `Le module ${module.name} est en cours de calibrage au QG Nexus.`);
        return;
    }

    if (isLocked(module.id, false)) {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        
        let requiredTier = "ESSENTIEL";
        if (ACCESS_RULES.AVANCE.includes(module.id) && !ACCESS_RULES.ESSENTIEL.includes(module.id)) requiredTier = "AVANCÉ";
        if (!ACCESS_RULES.AVANCE.includes(module.id) && !ACCESS_RULES.ESSENTIEL.includes(module.id) && !ACCESS_RULES.FREE.includes(module.id)) requiredTier = "ÉLITE";

        Alert.alert(
            "ACCÈS REFUSÉ", 
            `Le module ${module.name} nécessite l'accréditation ${requiredTier}.`,
            [
                { text: "Annuler", style: "cancel" },
                { text: "VOIR LES OFFRES", onPress: () => router.push('/subscription' as any) } 
            ]
        );
        return;
    }

    // ROUTAGE DYNAMIQUE AVEC LAZY LOADING
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
      // Ajoutez les routes futures ici
    };

    // Lazy loading pour les composants non critiques
    const lazyComponents: { [key: string]: any } = {
      'timer': React.lazy(() => import('../features/timer')),
      '1rm': React.lazy(() => import('../features/calculator1rm')),
      'exercise-library': React.lazy(() => import('../features/exercise-library')),
    };

    const route = moduleRoutes[module.id];
    if (route) {
      router.push(route as any);
      return;
    }
    
    Alert.alert("MODULE ACTIF", `Lancement de la séquence : ${module.name}`);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="transparent" translucent={true} />
      
      <View style={styles.auroraBg}>
          <View style={[styles.blob, { top: -50, left: -100, backgroundColor: 'rgba(0, 243, 255, 0.15)' }]} />
          <View style={[styles.blob, { top: '40%', right: -100, backgroundColor: 'rgba(139, 92, 246, 0.1)' }]} />
          <View style={[styles.blob, { bottom: -100, left: 50, backgroundColor: 'rgba(59, 130, 246, 0.15)' }]} />
      </View>
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <View>
                <Text style={styles.headerTitle}>CENTRE DE COMMANDE</Text>
                <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: userTier === 'ELITE' ? '#d946ef' : (userTier === 'AVANCE' ? '#00f3ff' : (userTier === 'ESSENTIEL' ? '#0aff0a' : '#888')) }]} />
                    <Text style={[styles.statusText, { color: 'rgba(255,255,255,0.7)' }]}>
                        NIVEAU {userTier === 'FREE' ? 'DÉCOUVERTE' : userTier}
                    </Text>
                </View>
            </View>
            <View style={styles.glassIcon}>
                <MaterialCommunityIcons name="grid" size={20} color="#fff" />
            </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="rgba(255,255,255,0.5)" />
                <TextInput 
                    style={styles.searchInput} 
                    placeholder="Rechercher un protocole..." 
                    placeholderTextColor="rgba(255,255,255,0.3)" 
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {MODULES.map((section, index) => (
                <View key={index} style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="folder-outline" size={14} color="rgba(255,255,255,0.6)" />
                        <Text style={styles.sectionTitle}>{section.category}</Text>
                        <View style={styles.line} />
                    </View>
                    
                    <View style={styles.grid}>
                        {section.items.filter(i => i.name.toLowerCase().includes(search.toLowerCase())).map((item, i) => {
                            const locked = isLocked(item.id, item.comingSoon);
                            
                            return (
                                <TouchableOpacity 
                                    key={i} 
                                    style={[styles.moduleCard, locked && styles.moduleLocked]} 
                                    onPress={() => handlePress(item)}
                                    activeOpacity={0.7}
                                >
                                    <LinearGradient
                                        colors={locked ? ['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)'] : ['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']}
                                        style={styles.cardContent}
                                    >
                                            <View style={styles.cardTop}>
                                                <View style={[
                                                    styles.iconContainer, 
                                                    { 
                                                        backgroundColor: locked ? 'rgba(255,255,255,0.05)' : `${item.color}10`, 
                                                        borderColor: locked ? 'rgba(255,255,255,0.1)' : `${item.color}20` 
                                                    }
                                                ]}>
                                                    <MaterialCommunityIcons 
                                                        name={item.icon} 
                                                        size={24} 
                                                        color={locked ? '#666' : item.color} 
                                                    />
                                                </View>
                                                
                                                {locked && !item.comingSoon && (
                                                    <View style={styles.lockBadge}>
                                                        <MaterialCommunityIcons name="lock" size={10} color="#666" />
                                                    </View>
                                                )}

                                                {item.comingSoon && (
                                                     <View style={[styles.statusBadge, {backgroundColor: 'rgba(255,255,255,0.1)'}]}>
                                                        <Text style={[styles.statusBadgeText, {color: '#aaa'}]}>BETA</Text>
                                                     </View>
                                                )}

                                                {!locked && !item.comingSoon && item.status === 'PRO' && (
                                                     <View style={[styles.statusBadge, {borderColor: item.color}]}>
                                                        <Text style={[styles.statusBadgeText, {color: item.color}]}>PRO</Text>
                                                     </View>
                                                )}
                                            </View>
                                            
                                            <Text 
                                                style={[styles.moduleName, locked && {color: '#666'}]} 
                                                numberOfLines={2}
                                            >
                                                {item.name}
                                            </Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? 25 : 0 },
  auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
  blob: { position: 'absolute', width: 350, height: 350, borderRadius: 175, opacity: 0.4 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 20, marginTop: Platform.OS === 'ios' ? 10 : 0 },
  headerTitle: { color: '#fff', fontSize: 12, fontWeight: 'bold', letterSpacing: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  glassIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

  content: { padding: 20, paddingTop: 0 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 15, borderRadius: 16, marginBottom: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', height: 50 },
  searchInput: { flex: 1, color: '#fff', marginLeft: 10, fontSize: 14 },

  section: { marginBottom: 25 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '900', letterSpacing: 1, marginLeft: 8, marginRight: 10 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  moduleCard: { width: (width - 52) / 2, height: 120, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  moduleLocked: { borderColor: 'rgba(255,255,255,0.02)', opacity: 0.7 },
  cardContent: { flex: 1, padding: 15, justifyContent: 'space-between' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  iconContainer: { padding: 10, borderRadius: 14, borderWidth: 1 },
  lockBadge: { position: 'absolute', top: 0, right: 0, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statusBadgeText: { fontSize: 8, fontWeight: '900' },
  moduleName: { color: '#fff', fontSize: 13, fontWeight: '600', lineHeight: 18 },
});