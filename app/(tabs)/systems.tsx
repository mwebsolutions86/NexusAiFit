import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Dimensions, 
  Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons, FontAwesome5, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Hook personnalisé
import { useTheme } from '../../lib/theme';

export default function SystemsScreen() {
  // CORRECTION ICI : On récupère directement 'colors'
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const SECTIONS = [
    {
      id: 'metabolism',
      title: t('systems.categories.metabolism'),
      subtitle: t('systems.subtitles.metabolism'),
      items: [
        { id: 'nutrition', name: t('systems.modules.nutrition'), icon: 'silverware-fork-knife', lib: MaterialCommunityIcons, route: '/features/nutrition-plan', color: '#4ADE80' },
        { id: 'macros', name: t('systems.modules.macros'), icon: 'chart-pie', lib: MaterialCommunityIcons, route: '/features/macros', color: '#FACC15' },
        { id: 'water', name: t('systems.modules.water'), icon: 'water', lib: Ionicons, route: '/features/water', color: '#60A5FA' },
        { id: 'bodyfat', name: t('systems.modules.bodyfat'), icon: 'body-outline', lib: Ionicons, route: '/features/body_fat', color: '#F472B6' },
        { id: 'bmi', name: t('systems.modules.bmi'), icon: 'scale-bathroom', lib: MaterialCommunityIcons, route: '/features/bmi', color: '#A78BFA' },
        { id: 'tdee', name: t('systems.modules.tdee'), icon: 'fire', lib: MaterialCommunityIcons, route: '/features/tdee', color: '#FB923C' },
        { id: 'fasting', name: t('systems.modules.fasting'), icon: 'timer-off', lib: MaterialCommunityIcons, route: '/features/fasting', color: '#94A3B8' },
      ]
    },
    {
      id: 'performance',
      title: t('systems.categories.performance'),
      subtitle: t('systems.subtitles.performance'),
      items: [
        { id: 'workout_log', name: t('systems.modules.workout_log'), icon: 'dumbbell', lib: MaterialCommunityIcons, route: '/features/workout_log', color: '#EF4444' },
        { id: '1rm', name: t('systems.modules.rm1'), icon: 'calculator-variant', lib: MaterialCommunityIcons, route: '/features/calculator1rm', color: '#F87171' },
        { id: 'timer', name: t('systems.modules.timer'), icon: 'timer-outline', lib: Ionicons, route: '/features/timer', color: '#2DD4BF' },
        { id: 'posture', name: t('systems.modules.posture'), icon: 'human-handsup', lib: MaterialCommunityIcons, route: '/features/posture', color: '#34D399' },
        { id: 'reflex', name: t('systems.modules.reflex'), icon: 'lightning-bolt', lib: MaterialCommunityIcons, route: '/features/reflex', color: '#FBBF24' },
        { id: 'vision', name: t('systems.modules.vision'), icon: 'eye-outline', lib: Ionicons, route: '/features/vision', color: '#818CF8' },
      ]
    },
    {
      id: 'mental',
      title: t('systems.categories.mental'),
      subtitle: t('systems.subtitles.mental'),
      items: [
        { id: 'sleep', name: t('systems.modules.sleep'), icon: 'bed-outline', lib: Ionicons, route: '/features/sleep', color: '#6366F1' },
        { id: 'stress', name: t('systems.modules.stress'), icon: 'brain', lib: MaterialCommunityIcons, route: '/features/stress', color: '#F43F5E' },
        { id: 'meditation', name: t('systems.modules.meditation'), icon: 'flower-tulip', lib: MaterialCommunityIcons, route: '/features/meditation', color: '#D946EF' },
        { id: 'breath', name: t('systems.modules.breath'), icon: 'lungs', lib: FontAwesome5, route: '/features/breath', color: '#0EA5E9' },
        { id: 'cold', name: t('systems.modules.cold'), icon: 'snowflake', lib: Ionicons, route: '/features/cold', color: '#38BDF8' },
        { id: 'nootropics', name: t('systems.modules.nootropics'), icon: 'flask-outline', lib: Ionicons, route: '/features/nootropics', color: '#A3E635' },
        { id: 'journal', name: t('systems.modules.journal'), icon: 'book-open-outline', lib: Ionicons, route: '/features/journaling', color: '#E2E8F0' },
      ]
    },
    {
      id: 'logistics',
      title: t('systems.categories.logistics'),
      subtitle: t('systems.subtitles.logistics'),
      items: [
        { id: 'shopping', name: t('systems.modules.shopping'), icon: 'cart-outline', lib: Ionicons, route: '/features/shopping', color: '#F97316' },
        { id: 'meal_prep', name: t('systems.modules.meal_prep'), icon: 'food-drumstick-outline', lib: MaterialCommunityIcons, route: '/features/meal_prep', color: '#84CC16' },
      ]
    }
  ];

  const handleNavigation = (route: string) => {
    router.push(route as any);
  };

  return (
    // CORRECTION ICI : use theme.colors.bg au lieu de background
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Image 
        source={require('../../assets/adaptive-icon.png')} 
        style={[StyleSheet.absoluteFillObject, { opacity: 0.05 }]}
        blurRadius={80}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {t('systems.title') || "Systèmes"}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {t('systems.subtitle') || "Optimisez chaque aspect de votre biologie."}
            </Text>
          </View>

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
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => handleNavigation(item.route)}
                      activeOpacity={0.7}
                      style={styles.cardWrapper}
                    >
                      {/* CORRECTION ICI : Utilisation de colors.border */}
                      <BlurView intensity={20} tint="dark" style={[styles.glassCard, { borderColor: colors.border }]}>
                         <LinearGradient
                            colors={[ 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
                            style={StyleSheet.absoluteFillObject}
                          />
                        <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
                          <IconLib name={item.icon as any} size={28} color={item.color} />
                        </View>
                        <Text style={[styles.cardText, { color: colors.text }]} numberOfLines={2}>
                          {item.name}
                        </Text>
                        
                        <View style={styles.actionIcon}>
                          <Feather name="arrow-up-right" size={14} color={colors.textSecondary} />
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

// Les styles restent identiques, je les remets pour être sûr
const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  header: { paddingHorizontal: 20, paddingVertical: 20, marginBottom: 10 },
  headerTitle: { fontSize: 32, fontWeight: '800', letterSpacing: 0.5, fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' },
  headerSubtitle: { fontSize: 16, opacity: 0.7, marginTop: 5 },
  sectionContainer: { marginBottom: 30 },
  sectionHeader: { paddingHorizontal: 20, marginBottom: 15 },
  sectionTitle: { fontSize: 22, fontWeight: '700', marginBottom: 2 },
  sectionSubtitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  carouselContent: { paddingHorizontal: 15 },
  cardWrapper: { width: 140, height: 160, marginHorizontal: 5 },
  glassCard: { flex: 1, borderRadius: 24, borderWidth: 1, padding: 15, justifyContent: 'space-between', overflow: 'hidden', backgroundColor: 'rgba(20, 20, 30, 0.4)' },
  iconContainer: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  cardText: { fontSize: 16, fontWeight: '600', marginTop: 10, lineHeight: 22 },
  actionIcon: { position: 'absolute', top: 15, right: 15, opacity: 0.5 }
});