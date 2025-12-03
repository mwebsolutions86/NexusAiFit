import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');
type GameState = 'IDLE' | 'WAITING' | 'READY' | 'TOO_EARLY' | 'RESULT';

export default function ReflexScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  
  const [state, setState] = useState<GameState>('IDLE');
  const [time, setTime] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  
  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const MODULE_COLOR = '#eab308';

  useEffect(() => {
    fetchHistory();
    return () => clearTimers();
  }, []);

  const fetchHistory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data } = await supabase.from('body_metrics').select('date, value, created_at').eq('user_id', session.user.id).eq('type', 'reflex_ms').order('created_at', { ascending: false }).limit(5);
        if (data) setHistory(data);
      } catch (e) { console.log(e); }
  };

  const clearTimers = () => { if (timerRef.current) clearTimeout(timerRef.current); };

  const startGame = () => {
      if (Platform.OS !== 'web') Haptics.selectionAsync();
      setState('WAITING');
      const randomDelay = Math.floor(Math.random() * 3000) + 2000;
      timerRef.current = setTimeout(() => { setState('READY'); startTimeRef.current = Date.now(); }, randomDelay);
  };

  const handlePress = () => {
      if (state === 'IDLE' || state === 'RESULT' || state === 'TOO_EARLY') {
          startGame();
      } else if (state === 'WAITING') {
          clearTimers(); setState('TOO_EARLY');
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else if (state === 'READY') {
          const endTime = Date.now();
          const reactionTime = endTime - startTimeRef.current;
          setTime(reactionTime);
          setState('RESULT');
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          saveResult(reactionTime);
      }
  };

  const saveResult = async (ms: number) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        await supabase.from('body_metrics').insert({ user_id: session.user.id, type: 'reflex_ms', value: ms, date: new Date().toISOString().split('T')[0] });
        fetchHistory();
      } catch (e) { console.log(e); }
  };

  const getBackgroundColor = () => {
      switch (state) {
          case 'WAITING': return '#ef4444';
          case 'READY': return '#22c55e';
          case 'TOO_EARLY': return '#f59e0b';
          case 'RESULT': return theme.colors.bg;
          default: return theme.colors.bg;
      }
  };

  // TEXTES DYNAMIQUES
  const getMainText = () => {
      switch (state) {
          case 'IDLE': return t('modules.reflex.idle');
          case 'WAITING': return t('modules.reflex.waiting');
          case 'READY': return t('modules.reflex.ready');
          case 'TOO_EARLY': return t('modules.reflex.too_early');
          default: return "";
      }
  };

  const getSubText = () => {
      switch (state) {
          case 'IDLE': return t('modules.reflex.idle_sub');
          case 'TOO_EARLY': return t('modules.reflex.retry');
          case 'RESULT': return t('modules.reflex.result_label');
          default: return "";
      }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: getBackgroundColor() },
    safeArea: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: state === 'IDLE' || state === 'RESULT' ? theme.colors.glass : 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: state === 'IDLE' || state === 'RESULT' ? theme.colors.border : 'transparent' },
    headerTitle: { color: state === 'IDLE' || state === 'RESULT' ? theme.colors.text : '#fff', fontWeight: 'bold', letterSpacing: 1 },
    gameArea: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    bigIcon: { marginBottom: 20 },
    bigText: { fontSize: 32, fontWeight: '900', textAlign: 'center', color: state === 'IDLE' || state === 'RESULT' ? theme.colors.text : '#fff' },
    subText: { fontSize: 14, textAlign: 'center', marginTop: 10, color: state === 'IDLE' || state === 'RESULT' ? theme.colors.textSecondary : 'rgba(255,255,255,0.8)' },
    resultValue: { fontSize: 64, fontWeight: '900', color: theme.colors.primary, marginTop: 20 },
    resultUnit: { fontSize: 20, fontWeight: 'bold', color: theme.colors.textSecondary, marginBottom: 30 },
    historyContainer: { width: '100%', padding: 20, backgroundColor: theme.colors.cardBg, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
    historyTitle: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: 'bold', marginBottom: 15 },
    historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    historyDate: { color: theme.colors.textSecondary, fontSize: 12 },
    historyVal: { color: theme.colors.text, fontWeight: 'bold', fontSize: 14 },
    retryBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30, marginTop: 20 }
  });

  return (
    <TouchableOpacity style={styles.container} activeOpacity={1} onPress={handlePress}>
      <StatusBar style={state === 'IDLE' || state === 'RESULT' ? (theme.isDark ? "light" : "dark") : "light"} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={state === 'IDLE' || state === 'RESULT' ? theme.colors.text : '#fff'} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('modules.reflex.title')}</Text>
            <View style={{ width: 40 }} />
        </View>

        <View style={styles.gameArea}>
            {state !== 'RESULT' && (
                <MaterialCommunityIcons 
                    name={state === 'IDLE' ? "lightning-bolt" : state === 'WAITING' ? "timer-sand" : state === 'READY' ? "cursor-default-click" : "alert-circle"} 
                    size={80} 
                    color={state === 'IDLE' ? MODULE_COLOR : '#fff'} 
                    style={styles.bigIcon} 
                />
            )}
            
            {state !== 'RESULT' && <Text style={styles.bigText}>{getMainText()}</Text>}
            {state !== 'RESULT' && state !== 'WAITING' && state !== 'READY' && <Text style={styles.subText}>{getSubText()}</Text>}

            {state === 'RESULT' && (
                <>
                    <Text style={styles.subText}>{t('modules.reflex.result_label')}</Text>
                    <Text style={styles.resultValue}>{time}</Text>
                    <Text style={styles.resultUnit}>ms</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={startGame}>
                        <Text style={{color: '#fff', fontWeight: 'bold'}}>{t('modules.reflex.retry')}</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>

        {(state === 'IDLE' || state === 'RESULT') && (
            <View style={styles.historyContainer}>
                <Text style={styles.historyTitle}>{t('modules.reflex.history')}</Text>
                {history.map((item, i) => (
                    <View key={i} style={styles.historyItem}>
                        <Text style={styles.historyDate}>
                            {new Date(item.created_at || new Date()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </Text>
                        <Text style={styles.historyVal}>{Math.round(item.value)} ms</Text>
                    </View>
                ))}
            </View>
        )}
      </SafeAreaView>
    </TouchableOpacity>
  );
}