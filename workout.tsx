import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';

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

    auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
    blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.2 },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 10, marginTop: Platform.OS === 'ios' ? 10 : 0 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerTitle: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },

    content: { padding: 20, paddingTop: 10 },
    subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 15, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },

    // Main Card (Generator)
    mainCard: { marginBottom: 25, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0, 243, 255, 0.3)' },
    cardGradient: { flexDirection: 'row', alignItems: 'center', padding: 20 },
    iconContainer: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    textContainer: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5, marginBottom: 4 },
    cardDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 12, lineHeight: 16 },

    // Grid Layout
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 15 },

    // Small Cards
    smallCard: { width: '47%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', marginBottom: 15 },
    iconBox: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    smallCardTitle: { color: '#fff', fontSize: 12, fontWeight: '900', marginBottom: 2 },
    smallCardDesc: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* BACKGROUND */}
      <View style={styles.auroraBg}>
          <View style={[styles.blob, { top: -100, left: -50, backgroundColor: 'rgba(0, 243, 255, 0.15)' }]} />
          <View style={[styles.blob, { bottom: 0, right: -50, backgroundColor: 'rgba(0, 100, 255, 0.15)' }]} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        
        {/* HEADER */}
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <MaterialCommunityIcons name="dumbbell" size={24} color="#00f3ff" />
                <Text style={styles.headerTitle}>CENTRE D'ENTRAÎNEMENT</Text>
            </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            
            <Text style={styles.subtitle}>OUTILS DE PERFORMANCE</Text>

            {/* 1. GÉNÉRATEUR DE PROGRAMME (IA) - LE PLUS IMPORTANT */}
            <TouchableOpacity style={styles.mainCard} activeOpacity={0.9} onPress={() => handlePress('/features/workout-tracker')}>
                 <LinearGradient
                    colors={['rgba(0, 243, 255, 0.2)', 'rgba(0, 100, 255, 0.1)']}
                    start={{x:0, y:0}} end={{x:1, y:1}}
                    style={styles.cardGradient}
                >
                    <View style={[styles.iconContainer, { backgroundColor: '#00f3ff', borderColor: '#00f3ff' }]}>
                        <MaterialCommunityIcons name="brain" size={32} color="#000" />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={[styles.cardTitle, { color: '#00f3ff' }]}>GÉNÉRATEUR IA</Text>
                        <Text style={styles.cardDesc}>Créez votre programme de la semaine sur mesure.</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#00f3ff" />
                </LinearGradient>
            </TouchableOpacity>

            <View style={styles.grid}>
                {/* 2. BIBLIOTHÈQUE */}
                <TouchableOpacity style={styles.smallCard} onPress={() => handlePress('/features/exercise-library')} activeOpacity={0.9}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
                        <MaterialCommunityIcons name="book-open-variant" size={28} color="#fff" />
                    </View>
                    <Text style={styles.smallCardTitle}>BIBLIOTHÈQUE</Text>
                    <Text style={styles.smallCardDesc}>300+ Exercices</Text>
                </TouchableOpacity>

                {/* 3. CHRONO TACTIQUE */}
                <TouchableOpacity style={styles.smallCard} onPress={() => handlePress('/features/timer')} activeOpacity={0.9}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 170, 0, 0.2)' }]}>
                        <MaterialCommunityIcons name="timer-outline" size={28} color="#ffaa00" />
                    </View>
                    <Text style={[styles.smallCardTitle, { color: '#ffaa00' }]}>CHRONO SMART</Text>
                    <Text style={styles.smallCardDesc}>Repos & Tabata</Text>
                </TouchableOpacity>

                {/* 4. CALCULATEUR 1RM */}
                <TouchableOpacity style={styles.smallCard} onPress={() => handlePress('/features/calculator1rm')} activeOpacity={0.9}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(244, 114, 182, 0.2)' }]}>
                        <MaterialCommunityIcons name="calculator" size={28} color="#f472b6" />
                    </View>
                    <Text style={[styles.smallCardTitle, { color: '#f472b6' }]}>CALCUL 1RM</Text>
                    <Text style={styles.smallCardDesc}>Force Max</Text>
                </TouchableOpacity>

                {/* 5. HISTORIQUE (Bientôt) */}
                <TouchableOpacity style={[styles.smallCard, {opacity: 0.5}]} onPress={() => Alert.alert("Bientôt", "L'historique arrive dans la v2")} activeOpacity={0.9}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
                        <MaterialCommunityIcons name="history" size={28} color="#888" />
                    </View>
                    <Text style={[styles.smallCardTitle, { color: '#888' }]}>HISTORIQUE</Text>
                    <Text style={styles.smallCardDesc}>Vos performances</Text>
                </TouchableOpacity>
            </View>

            <View style={{ height: 100 }} />
        </ScrollView>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? 25 : 0 },

  auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
  blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.2 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 10, marginTop: Platform.OS === 'ios' ? 10 : 0 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },

  content: { padding: 20, paddingTop: 10 },
  subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 15, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },

  // Main Card (Generator)
  mainCard: { marginBottom: 25, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0, 243, 255, 0.3)' },
  cardGradient: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  iconContainer: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  textContainer: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5, marginBottom: 4 },
  cardDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 12, lineHeight: 16 },

  // Grid Layout
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 15 },

  // Small Cards
  smallCard: { width: '47%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', marginBottom: 15 },
  iconBox: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  smallCardTitle: { color: '#fff', fontSize: 12, fontWeight: '900', marginBottom: 2 },
  smallCardDesc: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
});