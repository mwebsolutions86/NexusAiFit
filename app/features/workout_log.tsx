import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../lib/theme';

const { width } = Dimensions.get('window');

export default function WorkoutLogScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);

  // Couleur du module (Cyan)
  const MODULE_COLOR = '#00f3ff';

  useFocusEffect(
    useCallback(() => {
      fetchLogs();
    }, [])
  );

  const fetchLogs = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // On récupère tout l'historique
      const { data } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .order('log_date', { ascending: false })
        .limit(20); // Les 20 dernières séances

      if (data) {
          // Traitement pour compter les exos validés
          const processedLogs = data.map(log => {
              const completedCount = log.exercises_status 
                ? Object.values(log.exercises_status).filter(v => v === true).length
                : 0;
              return { ...log, completedCount };
          });
          setLogs(processedLogs);
      }
    } catch (e) {
      console.log("Erreur historique sport", e);
    } finally {
        setLoading(false);
    }
  };

  // --- STYLES DYNAMIQUES ---
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1 },
    
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    headerTitle: { color: theme.colors.text, fontWeight: 'bold', letterSpacing: 1 },

    content: { padding: 20 },

    // Stats Summary
    statsContainer: { flexDirection: 'row', gap: 15, marginBottom: 25 },
    statCard: { 
        flex: 1, backgroundColor: theme.colors.glass, 
        padding: 15, borderRadius: 16, 
        borderWidth: 1, borderColor: theme.colors.border,
        alignItems: 'center'
    },
    statValue: { fontSize: 24, fontWeight: '900', color: theme.colors.text },
    statLabel: { fontSize: 10, color: theme.colors.textSecondary, fontWeight: 'bold', marginTop: 5 },

    // Timeline
    sectionTitle: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 15, marginLeft: 5 },
    
    logCard: { 
        flexDirection: 'row', marginBottom: 15,
        backgroundColor: theme.colors.glass,
        borderRadius: 16, padding: 15,
        borderWidth: 1, borderColor: theme.colors.border,
        shadowColor: theme.isDark ? 'transparent' : '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
    },
    dateBox: { 
        width: 50, height: 50, borderRadius: 12, 
        backgroundColor: theme.isDark ? 'rgba(0, 243, 255, 0.1)' : '#e0f2fe', 
        justifyContent: 'center', alignItems: 'center', marginRight: 15 
    },
    dayText: { fontSize: 18, fontWeight: '900', color: MODULE_COLOR },
    monthText: { fontSize: 10, fontWeight: 'bold', color: MODULE_COLOR, textTransform: 'uppercase' },
    
    logContent: { flex: 1, justifyContent: 'center' },
    logTitle: { color: theme.colors.text, fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
    logSub: { color: theme.colors.textSecondary, fontSize: 12 },
    
    noteContainer: { 
        marginTop: 10, padding: 10, 
        backgroundColor: theme.colors.bg, 
        borderRadius: 8, borderLeftWidth: 2, borderLeftColor: MODULE_COLOR 
    },
    noteText: { color: theme.colors.textSecondary, fontSize: 12, fontStyle: 'italic' },

    emptyState: { alignItems: 'center', marginTop: 50 },
    emptyText: { color: theme.colors.textSecondary, marginTop: 10, fontStyle: 'italic' }
  });

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>HISTORIQUE SÉANCES</Text>
            <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            
            {/* Résumé Rapide */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{logs.length}</Text>
                    <Text style={styles.statLabel}>SÉANCES TOTALES</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={[styles.statValue, {color: MODULE_COLOR}]}>
                        {logs.reduce((acc, curr) => acc + curr.completedCount, 0)}
                    </Text>
                    <Text style={styles.statLabel}>EXERCICES VALIDÉS</Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>TIMELINE</Text>

            {loading ? (
                <ActivityIndicator size="large" color={MODULE_COLOR} style={{marginTop: 30}} />
            ) : logs.length > 0 ? (
                logs.map((log, i) => {
                    const dateObj = new Date(log.log_date);
                    return (
                        <View key={i} style={styles.logCard}>
                            <View style={styles.dateBox}>
                                <Text style={styles.dayText}>{dateObj.getDate()}</Text>
                                <Text style={styles.monthText}>
                                    {dateObj.toLocaleDateString(undefined, {month:'short'})}
                                </Text>
                            </View>
                            
                            <View style={styles.logContent}>
                                <Text style={styles.logTitle}>
                                    {log.completedCount > 0 ? "Séance Active" : "Jour de Repos ?"}
                                </Text>
                                <Text style={styles.logSub}>
                                    {log.completedCount} exercices complétés
                                </Text>
                                
                                {log.session_note && log.session_note.trim() !== '' && (
                                    <View style={styles.noteContainer}>
                                        <Text style={styles.noteText} numberOfLines={2}>
                                            "{log.session_note}"
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    );
                })
            ) : (
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="dumbbell" size={48} color={theme.colors.textSecondary} style={{opacity: 0.5}} />
                    <Text style={styles.emptyText}>Aucune séance enregistrée.</Text>
                </View>
            )}

            <View style={{height: 50}} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}