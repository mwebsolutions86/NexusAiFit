import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions, Platform , ScrollView} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';

const { width } = Dimensions.get('window');

const TECHNIQUES = [
    { id: 'coherence', name: 'Cohérence', desc: 'Équilibre (5s-5s)', in: 5000, hold: 0, out: 5000, holdOut: 0 },
    { id: 'box', name: 'Box Breathing', desc: 'Focus (4s-4s-4s-4s)', in: 4000, hold: 4000, out: 4000, holdOut: 4000 },
    { id: 'relax', name: '4-7-8', desc: 'Sommeil (4s-7s-8s)', in: 4000, hold: 7000, out: 8000, holdOut: 0 },
];

export default function BreathScreen() {
  const router = useRouter();
  const theme = useTheme();
  
  const [activeTechnique, setActiveTechnique] = useState(TECHNIQUES[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [phaseText, setPhaseText] = useState('PRÊT');
  const [cycles, setCycles] = useState(0);

  // Animation Values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  // Couleur du module (Violet)
  const MODULE_COLOR = '#a855f7';
  const BREATH_GRADIENT: [string, string] = ['#a855f7', '#c084fc'];

  const stopSession = () => {
      setIsRunning(false);
      setPhaseText('PRÊT');
      scaleAnim.stopAnimation();
      opacityAnim.stopAnimation();
      Animated.timing(scaleAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      setCycles(0);
  };

  const runCycle = async () => {
      if (!isRunning) return;

      // 1. INSPIRER
      setPhaseText('INSPIREZ');
      if(Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      Animated.parallel([
          Animated.timing(scaleAnim, {
              toValue: 1.8,
              duration: activeTechnique.in,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true
          }),
          Animated.timing(opacityAnim, { toValue: 0.8, duration: activeTechnique.in, useNativeDriver: true })
      ]).start();

      await new Promise(r => setTimeout(r, activeTechnique.in));
      if (!isRunning) return;

      // 2. RETENIR (POUMONS PLEINS)
      if (activeTechnique.hold > 0) {
          setPhaseText('BLOQUEZ');
          if(Platform.OS !== 'web') Haptics.selectionAsync();
          await new Promise(r => setTimeout(r, activeTechnique.hold));
          if (!isRunning) return;
      }

      // 3. EXPIRER
      setPhaseText('EXPIREZ');
      if(Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      Animated.parallel([
          Animated.timing(scaleAnim, {
              toValue: 1,
              duration: activeTechnique.out,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true
          }),
          Animated.timing(opacityAnim, { toValue: 0.3, duration: activeTechnique.out, useNativeDriver: true })
      ]).start();

      await new Promise(r => setTimeout(r, activeTechnique.out));
      if (!isRunning) return;

      // 4. RETENIR (POUMONS VIDES)
      if (activeTechnique.holdOut > 0) {
          setPhaseText('BLOQUEZ');
          if(Platform.OS !== 'web') Haptics.selectionAsync();
          await new Promise(r => setTimeout(r, activeTechnique.holdOut));
          if (!isRunning) return;
      }

      setCycles(c => c + 1);
  };

  // Boucle principale
  useEffect(() => {
      let mounted = true;
      
      const loop = async () => {
          while (mounted && isRunning) {
              await runCycle();
          }
      };

      if (isRunning) {
          loop();
      }

      return () => { mounted = false; };
  }, [isRunning, activeTechnique]);

  const toggleSession = () => {
      if (isRunning) {
          stopSession();
      } else {
          setIsRunning(true);
      }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1 },
    
    auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
    blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.2 },
  
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    headerTitle: { color: theme.colors.text, fontWeight: 'bold', letterSpacing: 1 },

    content: { flex: 1, justifyContent: 'space-between', padding: 20 },

    // Visualisation
    visualContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    // Cercles concentriques
    circleOuter: {
        position: 'absolute', width: 250, height: 250, borderRadius: 125,
        borderWidth: 2, borderColor: theme.colors.border, opacity: 0.3
    },
    circleMid: {
        position: 'absolute', width: 180, height: 180, borderRadius: 90,
        borderWidth: 1, borderColor: theme.colors.border, opacity: 0.5
    },
    
    // Cercle animé
    breathingCircle: {
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: MODULE_COLOR,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: MODULE_COLOR, shadowOffset: {width:0, height:0}, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10
    },
    
    phaseText: { position: 'absolute', fontSize: 24, fontWeight: '900', color: theme.colors.text, letterSpacing: 2 },
    cycleText: { position: 'absolute', top: '65%', color: theme.colors.textSecondary, fontSize: 12, fontWeight: 'bold' },

    // Controls
    controlsContainer: { marginBottom: 20 },
    
    techScroll: { marginBottom: 30 },
    techCard: { 
        paddingHorizontal: 20, paddingVertical: 15, marginRight: 10, 
        backgroundColor: theme.colors.glass, borderRadius: 16,
        borderWidth: 1, borderColor: theme.colors.border,
        alignItems: 'center', minWidth: 120
    },
    techActive: { borderColor: MODULE_COLOR, backgroundColor: theme.isDark ? 'rgba(168, 85, 247, 0.1)' : '#f3e8ff' },
    techName: { color: theme.colors.text, fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
    techDesc: { color: theme.colors.textSecondary, fontSize: 10 },

    startBtn: { borderRadius: 20, overflow: 'hidden', width: '100%' },
    btnGradient: { padding: 20, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: '900', fontSize: 18, letterSpacing: 1 },
  });

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      
      {theme.isDark && (
        <View style={styles.auroraBg}>
            <View style={[styles.blob, { top: 100, right: -50, backgroundColor: 'rgba(168, 85, 247, 0.15)' }]} />
        </View>
      )}

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>RESPIRATION</Text>
            <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
            
            <View style={styles.visualContainer}>
                <View style={styles.circleOuter} />
                <View style={styles.circleMid} />
                
                <Animated.View 
                    style={[
                        styles.breathingCircle,
                        {
                            transform: [{ scale: scaleAnim }],
                            opacity: opacityAnim
                        }
                    ]}
                />
                
                <Text style={styles.phaseText}>{phaseText}</Text>
                {isRunning && <Text style={styles.cycleText}>CYCLE {cycles}</Text>}
            </View>

            <View style={styles.controlsContainer}>
                {!isRunning && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.techScroll}>
                        {TECHNIQUES.map((t) => (
                            <TouchableOpacity 
                                key={t.id} 
                                style={[styles.techCard, activeTechnique.id === t.id && styles.techActive]}
                                onPress={() => setActiveTechnique(t)}
                            >
                                <Text style={[styles.techName, activeTechnique.id === t.id && {color: MODULE_COLOR}]}>{t.name}</Text>
                                <Text style={styles.techDesc}>{t.desc}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                <TouchableOpacity style={styles.startBtn} onPress={toggleSession}>
                    <LinearGradient 
                        colors={isRunning ? [theme.colors.danger, '#b91c1c'] : BREATH_GRADIENT} 
                        start={{x:0, y:0}} end={{x:1, y:0}} 
                        style={styles.btnGradient}
                    >
                        <Text style={styles.btnText}>{isRunning ? "ARRÊTER" : "COMMENCER"}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

        </View>
      </SafeAreaView>
    </View>
  );
}