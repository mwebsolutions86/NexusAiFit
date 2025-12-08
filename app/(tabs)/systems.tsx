import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  Platform,
  Dimensions,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Animated, { FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// Hooks & UI
import { useTheme } from '../../lib/theme';
import { useSubscription } from '../../hooks/useSubscription';
import { ScreenLayout } from '../../components/ui/ScreenLayout';
import { GlassCard } from '../../components/ui/GlassCard';

const { width } = Dimensions.get('window');

export default function SystemsScreen() {
  const { colors, isDark } = useTheme(); // ✅ Ajout isDark pour l'adaptation
  const { t } = useTranslation();
  const router = useRouter();
  
  const { isPremium } = useSubscription();

  // --- CONFIGURATION DES MODULES ---
  const SECTIONS = [
    {
      id: 'performance',
      title: "PHYSIQUE & PERF.",
      subtitle: "Métriques, Suivi & Calculs",
      items: [
        { name: "Tracker Séance", route: '/features/workout-tracker', icon: 'dumbbell', lib: MaterialCommunityIcons, color: colors.primary, isPremium: false },
        { name: "Historique", route: '/features/workout_log', icon: 'history', lib: MaterialCommunityIcons, color: '#8b5cf6', isPremium: true },
        { name: "Bibliothèque", route: '/features/exercise-library', icon: 'book-open-variant', lib: MaterialCommunityIcons, color: '#60a5fa', isPremium: false },
        { name: "Force Max (1RM)", route: '/features/calculator1rm', icon: 'arm-flex', lib: MaterialCommunityIcons, color: '#ec4899', isPremium: false },
        { name: "Chrono / Timer", route: '/features/timer', icon: 'timer-outline', lib: Ionicons, color: '#f59e0b', isPremium: false },
        { name: "Stretching", route: '/features/stretching', icon: 'yoga', lib: MaterialCommunityIcons, color: '#a78bfa', isPremium: false },
        { name: "Posture IA", route: '/features/posture', icon: 'human-male-board', lib: MaterialCommunityIcons, color: '#f43f5e', isPremium: true },
        { name: "Réflexes", route: '/features/reflex', icon: 'lightning-bolt', lib: MaterialCommunityIcons, color: '#eab308', isPremium: true },
        { name: "Mensurations", route: '/features/body', icon: 'tape-measure', lib: MaterialCommunityIcons, color: colors.textSecondary, isPremium: false },
        { name: "Masse Grasse", route: '/features/body_fat', icon: 'percent', lib: MaterialCommunityIcons, color: colors.textSecondary, isPremium: false },
        { name: "IMC / BMI", route: '/features/bmi', icon: 'scale-bathroom', lib: MaterialCommunityIcons, color: colors.textSecondary, isPremium: false },
      ]
    },
    {
      id: 'nutrition',
      title: "CARBURANT",
      subtitle: "Nutrition & Analyse Métabolique",
      items: [
        { name: "Plan Nutrition", route: '/features/nutrition-plan', icon: 'chef-hat', lib: MaterialCommunityIcons, color: colors.success, isPremium: true },
        { name: "Journal Repas", route: '/features/food-journal', icon: 'notebook-edit', lib: MaterialCommunityIcons, color: colors.success, isPremium: false },
        { name: "Calcul Macros", route: '/features/macros', icon: 'chart-pie', lib: MaterialCommunityIcons, color: '#10b981', isPremium: false },
        { name: "Métabolisme (TDEE)", route: '/features/tdee', icon: 'fire', lib: MaterialCommunityIcons, color: '#f97316', isPremium: false },
        { name: "Hydratation", route: '/features/water', icon: 'water', lib: Ionicons, color: '#3b82f6', isPremium: false },
        { name: "Jeûne", route: '/features/fasting', icon: 'timer-sand', lib: MaterialCommunityIcons, color: '#6366f1', isPremium: false },
        { name: "Compléments", route: '/features/supps', icon: 'bottle-tonic-plus', lib: MaterialCommunityIcons, color: '#a855f7', isPremium: false },
        { name: "Liste Courses", route: '/features/shopping', icon: 'cart-outline', lib: Ionicons, color: colors.text, isPremium: false },
        { name: "Meal Prep", route: '/features/meal_prep', icon: 'pot-steam', lib: MaterialCommunityIcons, color: '#14b8a6', isPremium: true },
      ]
    },
    {
      id: 'biohacking',
      title: "BIO-HACKING",
      subtitle: "Récupération, Sommeil & Esprit",
      items: [
        { name: "Respiration", route: '/features/breath', icon: 'weather-windy', lib: MaterialCommunityIcons, color: '#06b6d4', isPremium: true },
        { name: "Méditation", route: '/features/meditation', icon: 'spa', lib: MaterialCommunityIcons, color: '#a78bfa', isPremium: true },
        { name: "Sommeil", route: '/features/sleep', icon: 'bed-outline', lib: Ionicons, color: '#8b5cf6', isPremium: true },
        { name: "Thérapie Froid", route: '/features/cold', icon: 'snowflake', lib: MaterialCommunityIcons, color: '#3b82f6', isPremium: true },
        { name: "Gestion Stress", route: '/features/stress', icon: 'leaf', lib: MaterialCommunityIcons, color: '#f43f5e', isPremium: true },
        { name: "Santé Cœur", route: '/features/heart', icon: 'heart-pulse', lib: MaterialCommunityIcons, color: '#ef4444', isPremium: true },
        { name: "VFC / HRV", route: '/features/hrv', icon: 'waveform', lib: MaterialCommunityIcons, color: '#10b981', isPremium: true },
        { name: "Humeur", route: '/features/mood', icon: 'emoticon-happy-outline', lib: MaterialCommunityIcons, color: '#f59e0b', isPremium: false },
        { name: "Vide-Tête", route: '/features/discharge', icon: 'brain', lib: MaterialCommunityIcons, color: '#6366f1', isPremium: true },
      ]
    },
    {
      id: 'lab',
      title: "LABO FUTURISTE",
      subtitle: "Cognitif & Environnement",
      items: [
        { name: "Nootropiques", route: '/features/nootropics', icon: 'flask-outline', lib: Ionicons, color: '#8b5cf6', isPremium: true },
        { name: "Scanner Vision", route: '/features/vision', icon: 'camera-metering-center', lib: MaterialCommunityIcons, color: colors.primary, isPremium: true },
        { name: "Environnement", route: '/features/env', icon: 'weather-sunny', lib: MaterialCommunityIcons, color: '#f97316', isPremium: true },
        { name: "Journal Perso", route: '/features/journaling', icon: 'book-open-page-variant', lib: MaterialCommunityIcons, color: colors.textSecondary, isPremium: false },
      ]
    }
  ];

  const handleNavigation = (item: any) => {
    if (item.isPremium && !isPremium) {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
            "ACCÈS RESTREINT 🔒",
            `Le module ${item.name} est réservé aux membres Elite.`,
            [
                { text: "Annuler", style: "cancel" },
                { text: "Débloquer", onPress: () => router.push('/subscription') }
            ]
        );
        return;
    }

    if (Platform.OS !== 'web') Haptics.selectionAsync();
    router.push(item.route as any);
  };

  return (
    <ScreenLayout>
        {/* FOND GRAPHIQUE (Adaptatif) */}
        <Image 
            source={require('../../assets/adaptive-icon.png')} 
            style={[StyleSheet.absoluteFillObject, { opacity: isDark ? 0.02 : 0.05, transform: [{scale: 1.5}] }]}
            blurRadius={20}
        />

        {/* HEADER */}
        <View style={styles.header}>
            <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>SYSTÈMES</Text>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                    Arsenal complet d'optimisation.
                </Text>
            </View>
            <View style={[styles.badge, { borderColor: isPremium ? colors.primary : colors.textSecondary }]}>
                <Text style={[styles.badgeText, { color: isPremium ? colors.primary : colors.textSecondary }]}>
                    {isPremium ? "ELITE" : "BASIC"}
                </Text>
            </View>
        </View>

        <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            {SECTIONS.map((section, sectionIndex) => (
                <View key={section.id} style={styles.sectionContainer}>
                    
                    <View style={styles.sectionHeader}>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                            <View style={{width: 3, height: 16, backgroundColor: colors.primary, borderRadius: 2}} />
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
                        </View>
                        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{section.subtitle}</Text>
                    </View>

                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.carouselContent}
                        decelerationRate="fast"
                        snapToInterval={187} 
                    >
                        {section.items.map((item, index) => {
                            const IconLib = item.lib;
                            const isLocked = item.isPremium && !isPremium;

                            return (
                                <Animated.View 
                                    key={item.route} 
                                    entering={FadeInRight.delay(index * 50 + sectionIndex * 100).springify()}
                                >
                                    <TouchableOpacity
                                        onPress={() => handleNavigation(item)}
                                        activeOpacity={0.8}
                                        style={{ marginRight: 12 }}
                                    >
                                        <GlassCard 
                                            style={[
                                                styles.card,
                                                // ✅ ADAPTATION COULEURS :
                                                { 
                                                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
                                                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                                    shadowColor: isDark ? undefined : "#000",
                                                    shadowOpacity: isDark ? 0 : 0.05,
                                                    shadowRadius: 10,
                                                    elevation: isDark ? 0 : 3
                                                }
                                            ]}
                                            intensity={isLocked ? 10 : (isDark ? 25 : 0)} // Pas de flou en Light
                                        >
                                            {/* Icône */}
                                            <View style={[
                                                styles.iconBox, 
                                                { 
                                                    backgroundColor: isLocked 
                                                        ? (isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6') 
                                                        : item.color + '15',
                                                    borderColor: isLocked ? 'transparent' : item.color + '30',
                                                    borderWidth: 1
                                                }
                                            ]}>
                                                <IconLib 
                                                    name={item.icon as any} 
                                                    size={34} 
                                                    color={isLocked ? colors.textSecondary : item.color} 
                                                    style={isLocked ? { opacity: 0.4 } : {}}
                                                />
                                            </View>

                                            {/* Nom Module */}
                                            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                                                <Text 
                                                    style={[
                                                        styles.cardName, 
                                                        { color: isLocked ? colors.textSecondary : colors.text, opacity: isLocked ? 0.7 : 1 }
                                                    ]} 
                                                    numberOfLines={3} 
                                                >
                                                    {item.name}
                                                </Text>
                                                
                                                {/* Badge Lock */}
                                                {isLocked && (
                                                    <View style={styles.lockBadge}>
                                                        <Ionicons name="lock-closed" size={10} color={colors.textSecondary} />
                                                        <Text style={{color: colors.textSecondary, fontSize: 9, fontWeight: 'bold'}}>VERROUILLÉ</Text>
                                                    </View>
                                                )}
                                            </View>

                                            {item.isPremium && !isLocked && (
                                                <View style={styles.premiumDot} />
                                            )}
                                        </GlassCard>
                                    </TouchableOpacity>
                                </Animated.View>
                            );
                        })}
                    </ScrollView>
                </View>
            ))}
            
            <View style={{ height: 120 }} />
        </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      paddingHorizontal: 20, 
      paddingTop: 20, 
      paddingBottom: 10 
  },
  headerTitle: { fontSize: 26, fontWeight: '900', letterSpacing: 2 },
  headerSubtitle: { fontSize: 10, marginTop: 4 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  scrollContent: { paddingBottom: 60 },
  
  sectionContainer: { marginBottom: 40 },
  sectionHeader: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      paddingHorizontal: 20, 
      marginBottom: 20 
  },
  sectionTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  sectionSubtitle: { fontSize: 10, fontWeight: 'bold', opacity: 0.6 },

  carouselContent: { paddingHorizontal: 20, paddingRight: 10 },
  
  card: { 
      width: 175, 
      height: 240, 
      padding: 20, 
      justifyContent: 'space-between', 
      borderRadius: 26,
      borderWidth: 1,
      // borderColor: 'rgba(255,255,255,0.1)' // Géré dynamiquement
  },
  iconBox: { 
      width: 60, 
      height: 60, 
      borderRadius: 20, 
      justifyContent: 'center', 
      alignItems: 'center' 
  },
  cardName: { 
      fontSize: 15, 
      fontWeight: 'bold', 
      marginTop: 15, 
      lineHeight: 22, 
      letterSpacing: 0.5 
  },
  
  lockBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, opacity: 0.6 },
  premiumDot: { position: 'absolute', top: 20, right: 20, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFD700', shadowColor: '#FFD700', shadowOpacity: 0.6, shadowRadius: 5 }
});