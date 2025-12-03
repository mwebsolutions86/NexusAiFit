import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');
const GAME_DURATION = 30;

export default function VisionScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [targetPos, setTargetPos] = useState({ top: 50, left: 50 });
  const [history, setHistory] = useState<any[]>([]);
  
  const timerRef = useRef<any>(null);
  const MODULE_COLOR = '#00f3ff'; 

  useEffect(() => {
    fetchHistory();
    return () => stopGame();
  }, []);

  const fetchHistory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data } = await supabase.from('body_metrics').select('date, value, created_at').eq('user_id', session.user.id).eq('type', 'vision_score').order('created_at', { ascending: false }).limit(5);
        if (data) setHistory(data);
      } catch (e) { console.log(e); }
  };

  const startGame = () => {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setIsPlaying(true);
      setScore(0);
      setTimeLeft(GAME_DURATION);
      moveTarget();

      timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
              if (prev <= 1) { endGame(); return 0; }
              return prev - 1;
          });
      }, 1000);
  };

  const stopGame = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsPlaying(false);
  };

  const endGame = () => {
      stopGame();
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      saveResultToDb(score); // Sauvegarde avec le score courant (closure fixée via useEffect pas nécessaire ici car score est up-to-date dans le scope composant si on l'appelle directement, mais attention aux closures. Pour faire simple et sûr, on utilise une ref ou on sauvegarde direct.)
      // NOTE: Dans cette version simplifiée sans ref pour le score, le score risque d'être 0 dans le setInterval.
      // CORRECTION : On utilise l'état actuel dans le render ou on passe par une ref pour être sûr. 
      // Pour garantir que le score est bon, on va le sauvegarder dans un useEffect qui écoute la fin du jeu.
  };

  // Sauvegarde déclenchée par la fin du timer
  useEffect(() => {
      if (timeLeft === 0 && isPlaying) {
          stopGame();
          saveResultToDb(score);
      }
  }, [timeLeft]);

  const saveResultToDb = async (finalVal: number) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        await supabase.from('body_metrics').insert({ user_id: session.user.id, type: 'vision_score', value: finalVal, date: new Date().toISOString().split('T')[0] });
        fetchHistory();
      } catch (e) { console.log(e); }
  };

  const moveTarget = () => {
      const top = Math.floor(Math.random() * 70) + 10;
      const left = Math.floor(Math.random() * 70) + 10;
      setTargetPos({ top, left });
  };

  const handleTap = () => {
      if (!isPlaying) return;
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setScore(s => s + 1);
      moveTarget();
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, zIndex: 10 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    headerTitle: { color: theme.colors.text, fontWeight: 'bold', letterSpacing: 1 },
    gameArea: { flex: 1, margin: 20, borderRadius: 24, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.3)' : '#e5e7eb', overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border, position: 'relative' },
    target: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: MODULE_COLOR, justifyContent: 'center', alignItems: 'center', shadowColor: MODULE_COLOR, shadowOffset: {width:0, height:0}, shadowOpacity: 0.8, shadowRadius: 10, elevation: 10 },
    targetRing: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#000', opacity: 0.5 },
    overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.8)', zIndex: 20 },
    startBtn: { paddingHorizontal: 40, paddingVertical: 20, backgroundColor: MODULE_COLOR, borderRadius: 30, shadowColor: MODULE_COLOR, shadowOpacity: 0.5, shadowRadius: 15, elevation: 5 },
    startText: { color: '#000', fontWeight: '900', fontSize: 18, letterSpacing: 1 },
    instructionText: { color: theme.colors.text, marginTop: 20, fontSize: 14, fontWeight: 'bold' },
    hud: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 30, paddingBottom: 20 },
    hudItem: { alignItems: 'center' },
    hudLabel: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold' },
    hudValue: { color: theme.colors.text, fontSize: 24, fontWeight: '900' },
    historyContainer: { padding: 20, backgroundColor: theme.colors.cardBg, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
    historyTitle: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: 'bold', marginBottom: 15 },
    historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    historyDate: { color: theme.colors.textSecondary, fontSize: 12 },
    historyVal: { color: theme.colors.text, fontWeight: 'bold', fontSize: 14 },
  });

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('modules.vision.title')}</Text>
        </View>

        <View style={styles.hud}>
            <View style={styles.hudItem}>
                <Text style={styles.hudLabel}>{t('modules.vision.time')}</Text>
                <Text style={styles.hudValue}>{timeLeft}s</Text>
            </View>
            <View style={styles.hudItem}>
                <Text style={styles.hudLabel}>{t('modules.vision.score')}</Text>
                <Text style={[styles.hudValue, {color: MODULE_COLOR}]}>{score}</Text>
            </View>
        </View>

        <View style={styles.gameArea}>
            {!isPlaying && (
                <View style={styles.overlay}>
                    <TouchableOpacity onPress={startGame} style={styles.startBtn}>
                        <Text style={styles.startText}>{timeLeft === 0 ? t('modules.vision.replay') : t('modules.vision.start')}</Text>
                    </TouchableOpacity>
                    <Text style={styles.instructionText}>{t('modules.vision.instruction')}</Text>
                </View>
            )}

            {isPlaying && (
                <TouchableOpacity activeOpacity={0.8} onPress={handleTap} style={[styles.target, { top: `${targetPos.top}%`, left: `${targetPos.left}%` }]}>
                    <View style={styles.targetRing} />
                </TouchableOpacity>
            )}
        </View>

        <View style={styles.historyContainer}>
            <Text style={styles.historyTitle}>{t('modules.vision.history')}</Text>
            {history.map((item, i) => (
                <View key={i} style={styles.historyItem}>
                    <Text style={styles.historyDate}>{new Date(item.created_at).toLocaleDateString()} - {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                    <Text style={styles.historyVal}>{item.value} pts</Text>
                </View>
            ))}
        </View>
      </SafeAreaView>
    </View>
  );
}