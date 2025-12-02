import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';

const { width } = Dimensions.get('window');

export default function WorkoutScreen() {
  const router = useRouter();
  const theme = useTheme();

  const handlePress = (route: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    router.push(route as any);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? 25 : 0 },
    auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
    blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.2 },

    // HEADER LUXE
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 25 },
    headerTitle: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
    headerSub: { fontSize: 22, fontWeight: '300', color: theme.colors.text, marginTop: 2 },
    iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },

    content: { paddingHorizontal: 20, paddingBottom: 100 },
    sectionTitle: { fontSize: 12, fontWeight: '900', color: theme.colors.textSecondary, marginBottom: 12, marginTop: 10, letterSpacing: 2 },

    // CARTE PRINCIPALE (Générateur)
    mainCard: { borderRadius: 24, overflow: 'hidden', marginBottom: 30, height: 140, borderWidth: 1, borderColor: theme.colors.primary + '50' },
    cardGradient: { flex: 1, padding: 20, justifyContent: 'space-between' },
    cardIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    cardTitle: { fontSize: 20, fontWeight: '900', letterSpacing: 0.5, color: '#fff' },
    cardDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '500' },
    cardArrow: { position: 'absolute', right: 20, top: '50%', marginTop: -12 },

    // GRILLE (Style Dashboard)
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    gridItem: { width: (width - 50) / 2, height: 110, backgroundColor: theme.colors.glass, borderRadius: 16, padding: 15, justifyContent: 'space-between', borderWidth: 1, borderColor: theme.colors.border },
    gridHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    gridIconBox: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    gridTitle: { color: theme.colors.text, fontSize: 13, fontWeight: 'bold' },
    gridSub: { color: theme.colors.textSecondary, fontSize: 10, marginTop: 2, letterSpacing: 0.5 },
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent={true} />
      
      {theme.isDark && (
        <View style={styles.auroraBg}>
            <View style={[styles.blob, { top: -100, left: -50, backgroundColor: 'rgba(0, 243, 255, 0.15)' }]} />
            <View style={[styles.blob, { bottom: 0, right: -50, backgroundColor: 'rgba(0, 100, 255, 0.15)' }]} />
        </View>
      )}

      <SafeAreaView style={styles.safeArea}>
        {/* HEADER */}
        <View style={styles.header}>
            <View>
                <Text style={styles.headerTitle}>CENTRE D'ENTRAÎNEMENT</Text>
                <Text style={styles.headerSub}>Performance</Text>
            </View>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/profile')}>
                <Ionicons name="person" size={18} color={theme.colors.text} />
            </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            
            {/* GÉNÉRATEUR IA */}
            <TouchableOpacity style={styles.mainCard} activeOpacity={0.9} onPress={() => handlePress('/features/workout-tracker')}>
                 <LinearGradient
                    colors={[theme.colors.primary, theme.colors.secondary]}
                    start={{x:0, y:0}} end={{x:1, y:1}}
                    style={styles.cardGradient}
                >
                    <View>
                        <View style={styles.cardIconBox}>
                            <MaterialCommunityIcons name="brain" size={24} color="#fff" />
                        </View>
                        <Text style={styles.cardTitle}>PLANIFICATEUR IA</Text>
                        <Text style={styles.cardDesc}>Générez votre semaine d'entraînement.</Text>
                    </View>
                    <View style={styles.cardArrow}>
                        <Ionicons name="arrow-forward" size={24} color="#fff" />
                    </View>
                </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>OUTILS</Text>

            <View style={styles.grid}>
                {/* BIBLIOTHÈQUE */}
                <TouchableOpacity style={styles.gridItem} onPress={() => handlePress('/features/exercise-library')} activeOpacity={0.8}>
                    <View style={styles.gridHeader}>
                        <View style={[styles.gridIconBox, { backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.1)' : '#F3F4F6' }]}>
                            <MaterialCommunityIcons name="book-open-variant" size={18} color={theme.colors.text} />
                        </View>
                        <Ionicons name="arrow-forward" size={16} color={theme.colors.border} />
                    </View>
                    <View>
                        <Text style={styles.gridTitle}>Bibliothèque</Text>
                        <Text style={styles.gridSub}>300+ Exercices</Text>
                    </View>
                </TouchableOpacity>

                {/* CHRONO */}
                <TouchableOpacity style={styles.gridItem} onPress={() => handlePress('/features/timer')} activeOpacity={0.8}>
                    <View style={styles.gridHeader}>
                        <View style={[styles.gridIconBox, { backgroundColor: theme.isDark ? 'rgba(255, 170, 0, 0.2)' : '#FFF8E1' }]}>
                            <MaterialCommunityIcons name="timer-outline" size={18} color={theme.colors.warning} />
                        </View>
                        <Ionicons name="arrow-forward" size={16} color={theme.colors.border} />
                    </View>
                    <View>
                        <Text style={styles.gridTitle}>Chrono Smart</Text>
                        <Text style={styles.gridSub}>Repos & Tabata</Text>
                    </View>
                </TouchableOpacity>

                {/* 1RM */}
                <TouchableOpacity style={styles.gridItem} onPress={() => handlePress('/features/calculator1rm')} activeOpacity={0.8}>
                    <View style={styles.gridHeader}>
                        <View style={[styles.gridIconBox, { backgroundColor: theme.isDark ? 'rgba(244, 114, 182, 0.2)' : '#FCE4EC' }]}>
                            <MaterialCommunityIcons name="calculator" size={18} color="#ec4899" />
                        </View>
                        <Ionicons name="arrow-forward" size={16} color={theme.colors.border} />
                    </View>
                    <View>
                        <Text style={styles.gridTitle}>Calcul 1RM</Text>
                        <Text style={styles.gridSub}>Force Max</Text>
                    </View>
                </TouchableOpacity>

                {/* HISTORIQUE */}
                <TouchableOpacity style={styles.gridItem} onPress={() => handlePress('/features/workout_log')} activeOpacity={0.8}>
                    <View style={styles.gridHeader}>
                        <View style={[styles.gridIconBox, { backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : '#F3F4F6' }]}>
                            <MaterialCommunityIcons name="history" size={18} color={theme.colors.textSecondary} />
                        </View>
                        <Ionicons name="arrow-forward" size={16} color={theme.colors.border} />
                    </View>
                    <View>
                        <Text style={styles.gridTitle}>Historique</Text>
                        <Text style={styles.gridSub}>Vos progrès</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}