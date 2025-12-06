import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Platform, 
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons, FontAwesome5, Feather, FontAwesome6 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

// Hooks
import { useTheme } from '../../lib/theme';
import { useSubscription } from '../../hooks/useSubscription'; // Gatekeeper

export default function SystemsScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  
  // Vérification Premium
  const { isPremium } = useSubscription();

  const SECTIONS = [
    {
      id: 'performance',
      title: "PHYSIQUE & PERF.",
      subtitle: "Métriques & Outils",
      items: [
        { id: 'workout_tracker', name: "Tracker", icon: 'dumbbell', lib: MaterialCommunityIcons, route: '/(tabs)/workout', color: colors.primary, isPremium: false },
        { id: 'library', name: "Bibliothèque", icon: 'book-open-variant', lib: MaterialCommunityIcons, route: '/features/exercise-library', color: '#60a5fa', isPremium: false },
        { id: 'workout_log', name: "Historique", icon: 'history', lib: MaterialCommunityIcons, route: '/features/workout_log', color: '#8b5cf6', isPremium: true }, // Premium
        { id: '1rm', name: "Calc. 1RM", icon: 'calculator-variant', lib: MaterialCommunityIcons, route: '/features/calculator1rm', color: '#ec4899', isPremium: false },
        { id: 'timer', name: "Chrono", icon: 'timer-outline', lib: Ionicons, route: '/features/timer', color: colors.warning, isPremium: false },
        { id: 'stretching', name: "Stretching", icon: 'yoga', lib: MaterialCommunityIcons, route: '/features/stretching', color: '#a78bfa', isPremium: false },
        { id: 'posture', name: "AI Posture", icon: 'human-male-board', lib: MaterialCommunityIcons, route: '/features/posture', color: '#f43f5e', isPremium: true }, // Premium
        { id: 'reflex', name: "Réflexes", icon: 'lightning-bolt', lib: MaterialCommunityIcons, route: '/features/reflex', color: '#eab308', isPremium: true }, // Premium
        { id: 'body', name: "Mensurations", icon: 'tape-measure', lib: MaterialCommunityIcons, route: '/features/body', color: colors.textSecondary, isPremium: false },
        { id: 'bodyfat', name: "Taux de Gras", icon: 'percent', lib: MaterialCommunityIcons, route: '/features/body_fat', color: colors.textSecondary, isPremium: false },
        { id: 'bmi', name: "IMC", icon: 'scale-bathroom', lib: MaterialCommunityIcons, route: '/features/bmi', color: colors.textSecondary, isPremium: false },
      ]
    },
    {
      id: 'nutrition',
      title: "NUTRITION",
      subtitle: "Carburant & Analyse",
      items: [
        { id: 'nutrition_plan', name: "Bio-Fuel AI", icon: 'chef-hat', lib: MaterialCommunityIcons, route: '/features/nutrition-plan', color: colors.success, isPremium: true }, // Premium
        { id: 'macros', name: "Macros Calc", icon: 'chart-pie', lib: MaterialCommunityIcons, route: '/features/macros', color: '#10b981', isPremium: false },
        { id: 'tdee', name: "Métabolisme", icon: 'fire', lib: MaterialCommunityIcons, route: '/features/tdee', color: colors.warning, isPremium: false },
        { id: 'water', name: "Hydratation", icon: 'water', lib: Ionicons, route: '/features/water', color: '#3b82f6', isPremium: false },
        { id: 'fasting', name: "Jeûne", icon: 'clock-outline', lib: MaterialCommunityIcons, route: '/features/fasting', color: '#6366f1', isPremium: false },
        { id: 'supps', name: "Suppléments", icon: 'pill', lib: MaterialCommunityIcons, route: '/features/supps', color: '#a855f7', isPremium: false },
        { id: 'shopping', name: "Courses", icon: 'cart-outline', lib: Ionicons, route: '/features/shopping', color: colors.text, isPremium: false },
        { id: 'food_journal', name: "Journal Repas", icon: 'food-apple', lib: MaterialCommunityIcons, route: '/features/food-journal', color: colors.success, isPremium: false },
        { id: 'meal_prep', name: "Meal Prep", icon: 'pot-steam', lib: MaterialCommunityIcons, route: '/features/meal_prep', color: '#14b8a6', isPremium: true }, // Premium
      ]
    },
    {
      id: 'biohacking',
      title: "BIO-HACKING",
      subtitle: "Récupération & Esprit",
      items: [
        { id: 'breath', name: "Respiration", icon: 'lungs', lib: FontAwesome5, route: '/features/breath', color: '#00d4ff', isPremium: true }, // Premium
        { id: 'meditation', name: "Méditation", icon: 'brain', lib: MaterialCommunityIcons, route: '/features/meditation', color: '#a78bfa', isPremium: true }, // Premium
        { id: 'sleep', name: "Sommeil", icon: 'bed-outline', lib: Ionicons, route: '/features/sleep', color: '#8b5cf6', isPremium: true }, // Premium
        { id: 'cold', name: "Froid", icon: 'snowflake', lib: Ionicons, route: '/features/cold', color: '#60a5fa', isPremium: true }, // Premium
        { id: 'stress', name: "Stress", icon: 'pulse', lib: FontAwesome5, route: '/features/stress', color: '#f43f5e', isPremium: true }, // Premium
        { id: 'heart', name: "Cœur", icon: 'heart-pulse', lib: MaterialCommunityIcons, route: '/features/heart', color: '#ef4444', isPremium: true }, // Premium
        { id: 'hrv', name: "VFC", icon: 'waveform', lib: MaterialCommunityIcons, route: '/features/hrv', color: '#10b981', isPremium: true }, // Premium
        { id: 'mood', name: "Humeur", icon: 'emoticon-happy', lib: MaterialCommunityIcons, route: '/features/mood', color: '#f59e0b', isPremium: false },
        { id: 'discharge', name: "Décharge", icon: 'head-snowflake', lib: MaterialCommunityIcons, route: '/features/discharge', color: '#6366f1', isPremium: true }, // Premium
      ]
    },
    {
      id: 'lab',
      title: "LABO FUTURISTE",
      subtitle: "Expérimental & Cognitif",
      items: [
        { id: 'nootropics', name: "Nootropiques", icon: 'flask-outline', lib: Ionicons, route: '/features/nootropics', color: '#8b5cf6', isPremium: true }, // Premium
        { id: 'vision', name: "AI Vision", icon: 'eye-scan', lib: MaterialCommunityIcons, route: '/features/vision', color: colors.primary, isPremium: true }, // Premium
        { id: 'env', name: "Environnement", icon: 'weather-sunny', lib: MaterialCommunityIcons, route: '/features/env', color: '#f97316', isPremium: true }, // Premium
        { id: 'journaling', name: "Journal", icon: 'notebook-outline', lib: MaterialCommunityIcons, route: '/features/journaling', color: colors.textSecondary, isPremium: false },
      ]
    }
  ];

  const handleNavigation = (item: any) => {
    // Logique Gatekeeper
    if (item.isPremium && !isPremium) {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
            "Module Elite Verrouillé 🔒",
            `L'accès au module ${item.name} est réservé aux membres Premium.`,
            [
                { text: "Annuler", style: "cancel" },
                { text: "Débloquer", onPress: () => router.push('/subscription') }
            ]
        );
        return;
    }

    if (Platform.OS !== 'web') Haptics.selectionAsync();
    router.push(item.route);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Background Image subtile */}
      <Image 
        source={require('../../assets/adaptive-icon.png')} 
        style={[StyleSheet.absoluteFillObject, { opacity: 0.03, transform: [{scale: 1.5}] }]}
        blurRadius={50}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              SYSTÈMES
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {t('systems.subtitle') || "La boîte à outils complète de votre biologie."}
            </Text>
          </View>

          {/* CATÉGORIES */}
          {SECTIONS.map((section) => (
            <View key={section.id} style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {section.title}
                </Text>
                <Text style={[styles.sectionSubtitle, { color: colors.primary }]}>
                  {section.subtitle}
                </Text>
              </View>

              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carouselContent}
                decelerationRate="fast"
                snapToInterval={155} 
              >
                {section.items.map((item) => {
                  const IconLib = item.lib;
                  const isLocked = item.isPremium && !isPremium;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => handleNavigation(item)}
                      activeOpacity={0.7}
                      style={styles.cardWrapper}
                    >
                      <BlurView 
                        intensity={isDark ? 30 : 50} 
                        tint={isDark ? "dark" : "light"} 
                        style={[
                            styles.glassCard, 
                            { 
                                borderColor: colors.border,
                                opacity: isLocked ? 0.7 : 1 // Opacité si verrouillé
                            }
                        ]}
                      >
                         <LinearGradient
                            colors={isLocked 
                                ? ['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.1)'] 
                                : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
                            style={StyleSheet.absoluteFillObject}
                          />
                        
                        <View style={[
                            styles.iconContainer, 
                            { backgroundColor: isLocked ? colors.textSecondary + '20' : `${item.color}20` }
                        ]}>
                          <IconLib 
                            name={item.icon as any} 
                            size={28} 
                            color={isLocked ? colors.textSecondary : item.color} 
                          />
                        </View>

                        <View>
                            <Text style={[styles.cardText, { color: colors.text }]} numberOfLines={1}>
                            {item.name}
                            </Text>
                            {isLocked && (
                                <Text style={{fontSize: 9, color: colors.textSecondary, marginTop: 2, fontWeight: 'bold'}}>
                                    PREMIUM ONLY
                                </Text>
                            )}
                        </View>
                        
                        <View style={styles.actionIcon}>
                          {isLocked ? (
                              <Ionicons name="lock-closed" size={14} color={colors.textSecondary} />
                          ) : (
                              <Feather name="arrow-up-right" size={14} color={colors.textSecondary} />
                          )}
                        </View>
                      </BlurView>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ))}
          
          <View style={{ height: 100 }} /> 
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  header: { paddingHorizontal: 20, paddingVertical: 20, marginBottom: 10 },
  headerTitle: { fontSize: 32, fontWeight: '800', letterSpacing: 1, fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' },
  headerSubtitle: { fontSize: 14, opacity: 0.7, marginTop: 5 },
  sectionContainer: { marginBottom: 30 },
  sectionHeader: { paddingHorizontal: 20, marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
  sectionSubtitle: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.8 },
  carouselContent: { paddingHorizontal: 15 },
  cardWrapper: { width: 140, height: 150, marginHorizontal: 5 },
  glassCard: { flex: 1, borderRadius: 24, borderWidth: 1, padding: 15, justifyContent: 'space-between', overflow: 'hidden' },
  iconContainer: { width: 45, height: 45, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  cardText: { fontSize: 14, fontWeight: '700', marginTop: 8 },
  actionIcon: { position: 'absolute', top: 15, right: 15, opacity: 0.6 }
});