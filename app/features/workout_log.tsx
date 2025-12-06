import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../../lib/theme';
import { useWorkoutLogs, LogEntry } from '../../hooks/useWorkoutLogs';
import { ScreenLayout } from '../../components/ui/ScreenLayout';
import { GlassCard } from '../../components/ui/GlassCard';

export default function WorkoutLogScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data: logs, isLoading, refetch } = useWorkoutLogs();

  const renderLogItem = (log: LogEntry) => {
    // exercises_status contient notre tableau d'exercices (grâce au correctif)
    const exercises = Array.isArray(log.exercises_status) ? log.exercises_status : [];
    const totalExercises = exercises.length;

    return (
      <GlassCard key={log.id} style={styles.logCard}>
        <View style={styles.logHeader}>
          <View style={styles.dateBadge}>
             <MaterialCommunityIcons name="calendar-check" size={16} color={theme.colors.primary} />
             <Text style={[styles.dateText, { color: theme.colors.text }]}>{log.log_date}</Text>
          </View>
          <Text style={[styles.exoCount, { color: theme.colors.textSecondary }]}>
            {totalExercises} Exercice{totalExercises > 1 ? 's' : ''}
          </Text>
        </View>

        <Text style={[styles.noteTitle, { color: theme.colors.text }]}>
            {log.session_note || "Séance sans titre"}
        </Text>

        <View style={styles.divider} />

        {/* Aperçu des 3 premiers exercices */}
        {exercises.slice(0, 3).map((ex: any, idx: number) => (
            <View key={idx} style={styles.miniRow}>
                <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} style={{marginRight: 6}} />
                <Text style={[styles.miniText, { color: theme.colors.textSecondary }]}>
                    {ex.name} <Text style={{color: theme.colors.primary}}>({ex.sets}x{ex.reps})</Text>
                </Text>
            </View>
        ))}
        
        {totalExercises > 3 && (
            <Text style={[styles.moreText, { color: theme.colors.textSecondary }]}>
                + {totalExercises - 3} autres...
            </Text>
        )}
      </GlassCard>
    );
  };

  return (
    <ScreenLayout>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>HISTORIQUE</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.backBtn}>
           <Ionicons name="refresh" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isLoading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={{marginTop: 50}} />
        ) : logs && logs.length > 0 ? (
            logs.map(renderLogItem)
        ) : (
            <View style={styles.emptyState}>
                <MaterialCommunityIcons name="history" size={48} color={theme.colors.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                    Aucune séance enregistrée.
                </Text>
                <TouchableOpacity style={styles.startBtn} onPress={() => router.push('/features/workout-tracker')}>
                    <Text style={styles.startBtnText}>Démarrer une séance</Text>
                </TouchableOpacity>
            </View>
        )}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  content: { padding: 20, paddingBottom: 100 },
  
  logCard: { marginBottom: 15, padding: 16 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  dateBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  dateText: { fontWeight: 'bold', fontSize: 12 },
  exoCount: { fontSize: 11, fontWeight: '600' },
  
  noteTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 10 },
  
  miniRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  miniText: { fontSize: 13 },
  moreText: { fontSize: 11, fontStyle: 'italic', marginTop: 4, marginLeft: 20 },
  
  emptyState: { alignItems: 'center', marginTop: 50, gap: 15 },
  emptyText: { fontSize: 14 },
  startBtn: { marginTop: 10, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#0066ff', borderRadius: 20 },
  startBtnText: { color: '#fff', fontWeight: 'bold' }
});