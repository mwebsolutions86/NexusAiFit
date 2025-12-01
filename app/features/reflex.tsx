import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';

const { width } = Dimensions.get('window');

type GameState = 'IDLE' | 'WAITING' | 'READY' | 'TOO_EARLY' | 'RESULT';

export default function ReflexScreen() {
  const router = useRouter();
  const theme = useTheme();
  
  const [state, setState] = useState<GameState>('IDLE');
  const [time, setTime] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Couleur du module (Jaune)
  const MODULE_COLOR = '#eab308';

  useEffect(() => {
    fetchHistory();
    return () => clearTimers();
  }, []);

  const fetchHistory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data } = await supabase
            .from('body_metrics')
            .select('date, value')
            .eq('user_id', session.user.id)
            .eq('type', 'reflex_ms')
            .order('created_at', { ascending: false }) // On veut les essais précis, pas juste la date
            .limit(5);

        if (data) setHistory(data);
      } catch (e) { console.log(e); }
  };

  const clearTimers = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
  };

  const startGame = () => {
      if (Platform.OS !== 'web') Haptics.selectionAsync();
      setState('WAITING');
      
      // Délai aléatoire entre 2 et 5 secondes
      const randomDelay = Math.floor(Math.random() * 3000) + 2000;
      
      timerRef.current = setTimeout(() => {
          setState('READY');
          startTimeRef.current = Date.now();
      }, randomDelay);
  };

  const handlePress = () => {
      if (state === 'IDLE' || state === 'RESULT' || state === 'TOO_EARLY') {
          startGame();
      } else if (state === 'WAITING') {
          // Trop tôt !
          clearTimers();
          setState('TOO_EARLY');
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else if (state === 'READY') {
          // Succès !
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

        await supabase.from('body_metrics').insert({
            user_id: session.user.id,
            type: 'reflex_ms',
            value: ms,
            date: new Date().toISOString().split('T')[0]
        });
        
        fetchHistory();
      } catch (e) { console.log(e); }
  };

  const getBackgroundColor = () => {
      switch (state) {
          case 'WAITING': return '#ef4444'; // Rouge (Attente)
          case 'READY': return '#22c55e';   // Vert (Go!)
          case 'TOO_EARLY': return '#f59e0b'; // Orange (Fail)
          case 'RESULT': return theme.colors.bg; // Retour au calme
          default: return theme.colors.bg;
      }
  };

  // --- STYLES DYNAMIQUES ---
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: getBackgroundColor() },
    safeArea: { flex: 1 },
    
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    backBtn: { 
        width: 40, height: 40, borderRadius: 20, 
        backgroundColor: state === 'IDLE' || state === 'RESULT' ? theme.colors.glass : 'rgba(0,0,0,0.2)', 
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: state === 'IDLE' || state === 'RESULT' ? theme.colors.border : 'transparent'
    },
    headerTitle: { color: state === 'IDLE' || state === 'RESULT' ? theme.colors.text : '#fff', fontWeight: 'bold', letterSpacing: 1 },
  
    gameArea: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    
    bigIcon: { marginBottom: 20 },
    bigText: { 
        fontSize: 32, fontWeight: '900', textAlign: 'center', 
        color: state === 'IDLE' || state === 'RESULT' ? theme.colors.text : '#fff' 
    },
    subText: { 
        fontSize: 14, textAlign: 'center', marginTop: 10,
        color: state === 'IDLE' || state === 'RESULT' ? theme.colors.textSecondary : 'rgba(255,255,255,0.8)' 
    },

    resultValue: { fontSize: 64, fontWeight: '900', color: theme.colors.primary, marginTop: 20 },
    resultUnit: { fontSize: 20, fontWeight: 'bold', color: theme.colors.textSecondary, marginBottom: 30 },

    // History
    historyContainer: { width: '100%', padding: 20, backgroundColor: theme.colors.cardBg, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
    historyTitle: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: 'bold', marginBottom: 15 },
    historyItem: { 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border 
    },
    historyDate: { color: theme.colors.textSecondary, fontSize: 12 },
    historyVal: { color: theme.colors.text, fontWeight: 'bold', fontSize: 14 },
  });

  return (
    <TouchableOpacity 
        style={styles.container} 
        activeOpacity={1} 
        onPress={handlePress}
    >
      <StatusBar style={state === 'IDLE' || state === 'RESULT' ? (theme.isDark ? "light" : "dark") : "light"} />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={state === 'IDLE' || state === 'RESULT' ? theme.colors.text : '#fff'} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>TEST RÉFLEXES</Text>
            <View style={{ width: 40 }} />
        </View>

        <View style={styles.gameArea}>
            {state === 'IDLE' && (
                <>
                    <MaterialCommunityIcons name="lightning-bolt" size={80} color={MODULE_COLOR} style={styles.bigIcon} />
                    <Text style={styles.bigText}>TAPEZ QUAND L'ÉCRAN DEVIENT VERT</Text>
                    <Text style={styles.subText}>Touchez l'écran pour commencer</Text>
                </>
            )}

            {state === 'WAITING' && (
                <>
                    <MaterialCommunityIcons name="timer-sand" size={80} color="#fff" style={styles.bigIcon} />
                    <Text style={styles.bigText}>ATTENDEZ...</Text>
                </>
            )}

            {state === 'READY' && (
                <>
                    <MaterialCommunityIcons name="cursor-default-click" size={80} color="#fff" style={styles.bigIcon} />
                    <Text style={styles.bigText}>TAPEZ MAINTENANT !</Text>
                </>
            )}

            {state === 'TOO_EARLY' && (
                <>
                    <MaterialCommunityIcons name="alert-circle" size={80} color="#fff" style={styles.bigIcon} />
                    <Text style={styles.bigText}>TROP TÔT !</Text>
                    <Text style={styles.subText}>Touchez pour réessayer</Text>
                </>
            )}

            {state === 'RESULT' && (
                <>
                    <Text style={styles.subText}>TEMPS DE RÉACTION</Text>
                    <Text style={styles.resultValue}>{time}</Text>
                    <Text style={styles.resultUnit}>millisecondes</Text>
                    
                    <TouchableOpacity 
                        style={{
                            backgroundColor: theme.colors.primary, 
                            paddingHorizontal: 30, paddingVertical: 15, 
                            borderRadius: 30, marginTop: 20
                        }}
                        onPress={startGame}
                    >
                        <Text style={{color: '#fff', fontWeight: 'bold'}}>RÉESSAYER</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>

        {(state === 'IDLE' || state === 'RESULT') && (
            <View style={styles.historyContainer}>
                <Text style={styles.historyTitle}>DERNIERS ESSAIS</Text>
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