import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, Animated, Easing, ActivityIndicator , ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';

const { width } = Dimensions.get('window');

// États "Neuros"
const NEURO_STATES = [
    { 
        id: 1, label: 'DÉCHARGÉ', color: '#475569', speed: 3000, icon: 'battery-10',
        desc: 'Épuisement / Apathie',
        chem: { dopamine: 10, serotonin: 20, cortisol: 30, adrenaline: 10 }
    },
    { 
        id: 2, label: 'ANXIEUX', color: '#ef4444', speed: 400, icon: 'flash-alert',
        desc: 'Stress / Surcharge',
        chem: { dopamine: 40, serotonin: 10, cortisol: 95, adrenaline: 90 }
    },
    { 
        id: 3, label: 'ÉQUILIBRE', color: '#22c55e', speed: 2000, icon: 'leaf',
        desc: 'Calme / Stabilité',
        chem: { dopamine: 50, serotonin: 80, cortisol: 20, adrenaline: 30 }
    },
    { 
        id: 4, label: 'FLOW', color: '#8b5cf6', speed: 1000, icon: 'brain',
        desc: 'Concentration / Créativité',
        chem: { dopamine: 85, serotonin: 60, cortisol: 40, adrenaline: 50 }
    },
    { 
        id: 5, label: 'SURVOLTÉ', color: '#eab308', speed: 600, icon: 'lightning-bolt',
        desc: 'Euphorie / Haute Énergie',
        chem: { dopamine: 95, serotonin: 70, cortisol: 30, adrenaline: 90 }
    },
];

export default function MoodScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  
  const [selectedState, setSelectedState] = useState(NEURO_STATES[2]); // Start at Equilibrium
  const [history, setHistory] = useState<any[]>([]);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  // Barres Neuro (Animées)
  const animDopa = useRef(new Animated.Value(0)).current;
  const animSero = useRef(new Animated.Value(0)).current;
  const animCort = useRef(new Animated.Value(0)).current;
  const animAdre = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchHistory();
    startPulse();
    updateNeuroBars();
  }, [selectedState]);

  // Animation de pulsation (L'Orbe)
  const startPulse = () => {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);

      Animated.loop(
          Animated.sequence([
              Animated.timing(pulseAnim, {
                  toValue: 1.15,
                  duration: selectedState.speed,
                  easing: Easing.inOut(Easing.ease),
                  useNativeDriver: true
              }),
              Animated.timing(pulseAnim, {
                  toValue: 1,
                  duration: selectedState.speed,
                  easing: Easing.inOut(Easing.ease),
                  useNativeDriver: true
              })
          ])
      ).start();
      
      // Rotation lente continue
      Animated.loop(
          Animated.timing(rotateAnim, {
              toValue: 1,
              duration: 10000, // 10 sec pour un tour
              easing: Easing.linear,
              useNativeDriver: true
          })
      ).start();
  };

  const updateNeuroBars = () => {
      Animated.parallel([
          Animated.timing(animDopa, { toValue: selectedState.chem.dopamine, duration: 800, useNativeDriver: false }),
          Animated.timing(animSero, { toValue: selectedState.chem.serotonin, duration: 800, useNativeDriver: false }),
          Animated.timing(animCort, { toValue: selectedState.chem.cortisol, duration: 800, useNativeDriver: false }),
          Animated.timing(animAdre, { toValue: selectedState.chem.adrenaline, duration: 800, useNativeDriver: false }),
      ]).start();
  };

  const fetchHistory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data } = await supabase
            .from('body_metrics')
            .select('date, value')
            .eq('user_id', session.user.id)
            .eq('type', 'mood_level')
            .order('created_at', { ascending: false })
            .limit(5);

        if (data) setHistory(data);
      } catch (e) { console.log(e); }
  };

  const handleSelect = (state: any) => {
      if (state.id === selectedState.id) return;
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setSelectedState(state);
  };

  const saveMood = async () => {
      setLoading(true);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        await supabase.from('body_metrics').insert({
            user_id: session.user.id,
            type: 'mood_level',
            value: selectedState.id,
            date: new Date().toISOString().split('T')[0]
        });
        
        await fetchHistory();

      } catch (error: any) {
          // Silencieux
      } finally {
          setLoading(false);
      }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  // Composant Barre Neuro
  const NeuroBar = ({ label, anim, color }: any) => (
      <View style={styles.neuroRow}>
          <Text style={styles.neuroLabel}>{label}</Text>
          <View style={styles.barTrack}>
              <Animated.View 
                style={[
                    styles.barFill, 
                    { 
                        backgroundColor: color,
                        width: anim.interpolate({
                            inputRange: [0, 100],
                            outputRange: ['0%', '100%']
                        }) 
                    }
                ]} 
              />
          </View>
      </View>
  );

  // --- STYLES DYNAMIQUES ---
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1 },
    
    auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
    blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.15 },
  
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    headerTitle: { color: theme.colors.text, fontWeight: 'bold', letterSpacing: 1 },
  
    content: { padding: 20 },

    // VISUALIZER
    visualizerContainer: { alignItems: 'center', justifyContent: 'center', height: 300, marginBottom: 20 },
    
    orbContainer: { 
        width: 200, height: 200, justifyContent: 'center', alignItems: 'center',
        position: 'relative'
    },
    orbCore: {
        width: 120, height: 120, borderRadius: 60,
        position: 'absolute', zIndex: 2
    },
    orbGlow: {
        width: 200, height: 200, borderRadius: 100,
        position: 'absolute', zIndex: 1, opacity: 0.5
    },
    // Anneau rotatif Tech
    orbRing: {
        width: 240, height: 240, borderRadius: 120,
        borderWidth: 2, borderColor: theme.colors.border,
        borderStyle: 'dashed', position: 'absolute', zIndex: 0
    },

    stateLabel: { fontSize: 32, fontWeight: '900', color: theme.colors.text, marginTop: 40, letterSpacing: 2 },
    stateDesc: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 5, fontStyle: 'italic' },

    // NEURO STATS
    neuroContainer: { 
        backgroundColor: theme.colors.glass, padding: 20, borderRadius: 20,
        borderWidth: 1, borderColor: theme.colors.border, marginBottom: 30
    },
    neuroTitle: { color: theme.colors.text, fontSize: 12, fontWeight: 'bold', marginBottom: 15, letterSpacing: 1 },
    neuroRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    neuroLabel: { color: theme.colors.textSecondary, width: 80, fontSize: 10, fontWeight: 'bold' },
    barTrack: { flex: 1, height: 6, backgroundColor: theme.colors.bg, borderRadius: 3, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 3 },

    // SELECTOR
    selectorContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    selectorBtn: { 
        width: 50, height: 50, borderRadius: 15, 
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: theme.colors.border,
        backgroundColor: theme.colors.glass
    },
    selectorBtnActive: { borderWidth: 2, transform: [{scale: 1.1}] },

    saveBtn: { borderRadius: 20, overflow: 'hidden', marginBottom: 30 },
    btnGradient: { padding: 18, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1 },

    // History
    historyItem: { 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 15, backgroundColor: theme.colors.glass, borderRadius: 15, marginBottom: 10,
        borderWidth: 1, borderColor: theme.colors.border 
    },
    historyDate: { color: theme.colors.textSecondary, fontWeight: '600' },
    historyBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    historyText: { color: '#000', fontWeight: 'bold', fontSize: 10 }
  });

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      
      {theme.isDark && (
        <View style={styles.auroraBg}>
            <View style={[styles.blob, { top: 100, left: -50, backgroundColor: selectedState.color + '20' }]} />
            <View style={[styles.blob, { bottom: 0, right: -50, backgroundColor: selectedState.color + '20' }]} />
        </View>
      )}

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>ÉTAT NEURAL</Text>
            <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            
            {/* VISUALIZER */}
            <View style={styles.visualizerContainer}>
                <Animated.View style={[styles.orbRing, { transform: [{rotate: spin}], borderColor: selectedState.color, opacity: 0.3 }]} />
                
                <Animated.View style={[styles.orbContainer, { transform: [{ scale: pulseAnim }] }]}>
                    <LinearGradient
                        colors={[selectedState.color, 'transparent']}
                        style={styles.orbGlow}
                        start={{x:0.5, y:0.5}} end={{x:1, y:1}}
                    />
                    <View style={[styles.orbCore, { backgroundColor: selectedState.color, shadowColor: selectedState.color, shadowOpacity: 0.8, shadowRadius: 30 }]} />
                </Animated.View>

                <Text style={styles.stateLabel}>{selectedState.label}</Text>
                <Text style={styles.stateDesc}>{selectedState.desc}</Text>
            </View>

            {/* SELECTOR */}
            <View style={styles.selectorContainer}>
                {NEURO_STATES.map((state) => (
                    <TouchableOpacity 
                        key={state.id} 
                        style={[
                            styles.selectorBtn, 
                            selectedState.id === state.id && { borderColor: state.color, backgroundColor: state.color + '20' }
                        ]}
                        onPress={() => handleSelect(state)}
                    >
                        <MaterialCommunityIcons 
                            name={state.icon as any} 
                            size={24} 
                            color={selectedState.id === state.id ? state.color : theme.colors.textSecondary} 
                        />
                    </TouchableOpacity>
                ))}
            </View>

            {/* NEURO ANALYSIS */}
            <View style={styles.neuroContainer}>
                <Text style={styles.neuroTitle}>ESTIMATION BIOCHIMIQUE</Text>
                <NeuroBar label="DOPAMINE" anim={animDopa} color="#3b82f6" />
                <NeuroBar label="SÉROTONINE" anim={animSero} color="#22c55e" />
                <NeuroBar label="CORTISOL" anim={animCort} color="#ef4444" />
                <NeuroBar label="ADRÉNALINE" anim={animAdre} color="#eab308" />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={saveMood} disabled={loading}>
                <LinearGradient colors={[selectedState.color, '#000000']} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.btnGradient}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>CALIBRER LE SYSTÈME</Text>}
                </LinearGradient>
            </TouchableOpacity>

            {/* HISTORY */}
            <Text style={{color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold', marginBottom: 10, marginLeft: 5}}>HISTORIQUE</Text>
            {history.map((item, i) => {
                // Trouver l'état correspondant à la valeur
                const state = NEURO_STATES.find(s => s.id === Number(item.value)) || NEURO_STATES[2];
                return (
                    <View key={i} style={styles.historyItem}>
                        <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString()}</Text>
                        <View style={[styles.historyBadge, {backgroundColor: state.color}]}>
                            <Text style={styles.historyText}>{state.label}</Text>
                        </View>
                    </View>
                );
            })}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}