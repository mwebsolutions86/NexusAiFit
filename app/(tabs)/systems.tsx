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

} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

// Hooks & UI
import { useTheme } from '../../lib/theme';
import { useSubscription } from '../../hooks/useSubscription';
import { ScreenLayout } from '../../components/ui/ScreenLayout';
import { GlassCard } from '../../components/ui/GlassCard';

const { width } = Dimensions.get('window');

export default function SystemsScreen() {
  const { colors, isDark } = useTheme();
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

  // --- COULEURS HARMONISÉES ---
  const headerTitleColor = isDark ? colors.text : '#0f172a';
  const subtitleColor = isDark ? colors.textSecondary : '#64748b';
  
  const cardBg = isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0';
  const iconBgLocked = isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9';

  return (
    <ScreenLayout>
        {/* FOND (Même que Workout/Dashboard) */}
        <Image 
            source={require('../../assets/adaptive-icon.png')} 
            style={[StyleSheet.absoluteFillObject, { opacity: isDark ? 0.05 : 0.02, transform: [{scale: 1.5}] }]}
            blurRadius={40}
            contentFit="cover"
        />
        <LinearGradient 
            colors={isDark ? [colors.primary, 'transparent'] : ['#bfdbfe', 'transparent']} 
            style={{position:'absolute', top:0, left:0, right:0, height:200, opacity: isDark ? 0.1 : 0.25}} 
        />

        {/* HEADER */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
            <View>
                <Text style={[styles.headerTitle, { color: headerTitleColor }]}>SYSTÈMES</Text>
                <Text style={[styles.headerSubtitle, { color: subtitleColor }]}>
                    ARSENAL COMPLET D'OPTIMISATION
                </Text>
            </View>
            <View style={[
                styles.badge, 
                { 
                    borderColor: isPremium ? colors.primary : colors.textSecondary,
                    backgroundColor: isDark ? 'transparent' : (isPremium ? colors.primary + '10' : '#f1f5f9')
                }
            ]}>
                <Text style={[styles.badgeText, { color: isPremium ? colors.primary : (isDark ? colors.textSecondary : '#64748b') }]}>
                    {isPremium ? "ELITE" : "BASIC"}
                </Text>
            </View>
        </Animated.View>

        <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            {SECTIONS.map((section, sectionIndex) => (
                <View key={section.id} style={styles.sectionContainer}>
                    
                    {/* Titre Section */}
                    <View style={styles.sectionHeader}>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                            <View style={{width: 3, height: 16, backgroundColor: colors.primary, borderRadius: 2}} />
                            <Text style={[styles.sectionTitle, { color: isDark ? colors.text : '#1e293b' }]}>
                                {section.title}
                            </Text>
                        </View>
                        <Text style={[styles.sectionSubtitle, { color: subtitleColor }]}>{section.subtitle}</Text>
                    </View>

                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.carouselContent}
                        decelerationRate="fast"
                        snapToInterval={170} 
                    >
                        {section.items.map((item, index) => {
                            const IconLib = item.lib;
                            const isLocked = item.isPremium && !isPremium;
                            const iconColor = isLocked ? (isDark ? colors.textSecondary : '#94a3b8') : item.color;
                            
                            const iconBg = isLocked 
                                ? iconBgLocked 
                                : (isDark ? item.color + '15' : item.color + '10');

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
                                            // ✅ FIX: expand={true} pour que la carte soit pleine
                                            expand={true}
                                            style={{ 
                                                width: 160, 
                                                height: 200, 
                                                // ❌ Pas de padding ici, GlassCard le gère en interne
                                                // On laisse GlassCard gérer le layout
                                                borderRadius: 24,
                                                backgroundColor: cardBg,
                                                borderColor: cardBorder,
                                                shadowOpacity: 0,
                                                elevation: 0
                                            }}
                                            variant="default"
                                        >
                                            {/* Conteneur Interne avec Flex pour espacer Icone et Texte */}
                                            <View style={{ flex: 1, justifyContent: 'space-between' }}>
                                                
                                                {/* Icône */}
                                                <View style={[
                                                    styles.iconBox, 
                                                    { 
                                                        backgroundColor: iconBg,
                                                        borderColor: isLocked ? 'transparent' : (isDark ? item.color + '30' : 'transparent'),
                                                        borderWidth: 1
                                                    }
                                                ]}>
                                                    <IconLib 
                                                        name={item.icon as any} 
                                                        size={30} 
                                                        color={iconColor} 
                                                        style={isLocked ? { opacity: 0.6 } : {}}
                                                    />
                                                </View>

                                                {/* Info & Titre */}
                                                <View>
                                                    <Text 
                                                        style={[
                                                            styles.cardName, 
                                                            { 
                                                                color: isLocked ? (isDark ? colors.textSecondary : '#94a3b8') : (isDark ? colors.text : '#0f172a'), 
                                                                opacity: isLocked ? 0.8 : 1 
                                                            }
                                                        ]} 
                                                        numberOfLines={2} 
                                                    >
                                                        {item.name}
                                                    </Text>
                                                    
                                                    {/* Badge Lock */}
                                                    {isLocked && (
                                                        <View style={styles.lockBadge}>
                                                            <Ionicons name="lock-closed" size={10} color={isDark ? colors.textSecondary : '#94a3b8'} />
                                                            <Text style={{color: isDark ? colors.textSecondary : '#94a3b8', fontSize: 9, fontWeight: 'bold'}}>VERROUILLÉ</Text>
                                                        </View>
                                                    )}
                                                </View>
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
            
            <View style={{ height: 100 }} />
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
  headerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  headerSubtitle: { fontSize: 10, fontWeight: 'bold', marginTop: 4, letterSpacing: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  scrollContent: { paddingBottom: 60 },
  
  sectionContainer: { marginBottom: 30 },
  sectionHeader: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      paddingHorizontal: 20, 
      marginBottom: 15 
  },
  sectionTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  sectionSubtitle: { fontSize: 10, fontWeight: 'bold', opacity: 0.6 },

  carouselContent: { paddingHorizontal: 20, paddingRight: 10 },
  
  iconBox: { 
      width: 54, 
      height: 54, 
      borderRadius: 18, 
      justifyContent: 'center', 
      alignItems: 'center' 
  },
  cardName: { 
      fontSize: 14, 
      fontWeight: 'bold', 
      marginTop: 15, 
      lineHeight: 18, 
      letterSpacing: 0.3 
  },
  
  lockBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  premiumDot: { position: 'absolute', top: 20, right: 20, width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFD700', shadowColor: '#FFD700', shadowOpacity: 0.6, shadowRadius: 5 }
});