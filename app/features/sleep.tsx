import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  Platform,
  useColorScheme,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Moon, Sun, Clock, BarChart2, BedDouble, ChevronRight } from 'lucide-react-native';
import { supabase } from '../../lib/supabase'; // Assure-toi que ce chemin est correct

const { width } = Dimensions.get('window');

// --- Configuration des Thèmes ---
const THEMES = {
  dark: {
    background: '#0F172A',
    card: '#1E293B',
    primary: '#818CF8',
    accent: '#C084FC',
    text: '#F8FAFC',
    subtext: '#94A3B8',
    border: '#334155',
    successBg: 'rgba(74, 222, 128, 0.2)',
  },
  light: {
    background: '#F1F5F9', // Gris très clair bleuté
    card: '#FFFFFF',
    primary: '#6366F1',    // Indigo un peu plus vif
    accent: '#A855F7',     // Violet
    text: '#1E293B',       // Bleu nuit (pour le texte)
    subtext: '#64748B',    // Gris moyen
    border: '#E2E8F0',
    successBg: 'rgba(74, 222, 128, 0.2)',
  }
};

export default function SleepScreen() {
  const scheme = useColorScheme(); // 'light' ou 'dark'
  const isDark = scheme === 'dark';
  const theme = isDark ? THEMES.dark : THEMES.light;

  // États
  const [loading, setLoading] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isAsleep, setIsAsleep] = useState(false);
  
  // Stats (simulées pour l'instant, à calculer via DB plus tard)
  const [sleepScore, setSleepScore] = useState(0);
  const [lastDuration, setLastDuration] = useState("-- h -- m");

  // Charger l'état initial
  useEffect(() => {
    fetchCurrentStatus();
    fetchLastNightStats();
  }, []);

  // 1. Vérifier si une session est en cours
  const fetchCurrentStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // On cherche une session qui a un start_time mais PAS de end_time
      const { data, error } = await supabase
        .from('sleep_sessions')
        .select('*')
        .eq('user_id', user.id)
        .is('end_time', null)
        .order('start_time', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setIsAsleep(true);
        setCurrentSessionId(data.id);
      } else {
        setIsAsleep(false);
        setCurrentSessionId(null);
      }
    } catch (error) {
      console.log('Pas de session active trouvée');
    } finally {
      setLoading(false);
    }
  };

  // 2. Récupérer la dernière nuit terminée
  const fetchLastNightStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('sleep_sessions')
      .select('*')
      .eq('user_id', user.id)
      .not('end_time', 'is', null) // Session terminée
      .order('end_time', { ascending: false })
      .limit(1)
      .single();

    if (data && data.start_time && data.end_time) {
      const start = new Date(data.start_time);
      const end = new Date(data.end_time);
      const diffMs = end.getTime() - start.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      setLastDuration(`${hours}h ${minutes}m`);
      setSleepScore(data.quality_score || 85); // Score par défaut ou calculé
    }
  };

  // 3. Action du bouton Principal
  const handleSleepToggle = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (!isAsleep) {
      // DÉMARRER LE SOMMEIL
      const { data, error } = await supabase
        .from('sleep_sessions')
        .insert([{ 
          user_id: user.id, 
          start_time: new Date().toISOString() 
        }])
        .select()
        .single();

      if (error) Alert.alert("Erreur", error.message);
      else {
        setIsAsleep(true);
        setCurrentSessionId(data.id);
      }
    } else {
      // RÉVEIL (Finir la session)
      if (!currentSessionId) return;

      const { error } = await supabase
        .from('sleep_sessions')
        .update({ 
          end_time: new Date().toISOString(),
          quality_score: Math.floor(Math.random() * (100 - 70) + 70) // Simulation score
        })
        .eq('id', currentSessionId);

      if (error) {
        Alert.alert("Erreur", error.message);
      } else {
        setIsAsleep(false);
        setCurrentSessionId(null);
        fetchLastNightStats(); // Mettre à jour l'affichage
      }
    }
    setLoading(false);
  };

  if (loading && !isAsleep && !lastDuration) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: theme.subtext }]}>
            {isAsleep ? "Bonne nuit," : "Bonjour,"}
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>Moniteur de Sommeil</Text>
        </View>
        <TouchableOpacity style={[styles.historyButton, { backgroundColor: theme.card }]}>
          <BarChart2 color={theme.text} size={24} />
        </TouchableOpacity>
      </View>

      {/* Main Card */}
      <View style={[styles.mainCard, { backgroundColor: theme.card, shadowColor: isDark ? "#000" : "#ccc" }]}>
        <View style={styles.circleContainer}>
          <View style={[styles.outerCircle, { borderColor: theme.border }]}>
            <View style={styles.innerCircle}>
              {isAsleep ? (
                 <Moon color={theme.accent} size={40} strokeWidth={1.5} />
              ) : (
                 <Sun color={theme.primary} size={40} strokeWidth={1.5} />
              )}
              
              <Text style={[styles.durationText, { color: theme.text }]}>
                {isAsleep ? "Zzz..." : lastDuration}
              </Text>
              <Text style={[styles.durationLabel, { color: theme.subtext }]}>
                {isAsleep ? "Enregistrement en cours" : "Dernière nuit"}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={[
            styles.actionButton, 
            { backgroundColor: isAsleep ? theme.accent : theme.primary },
            loading && { opacity: 0.7 }
          ]}
          onPress={handleSleepToggle}
          disabled={loading}
        >
          {loading ? (
             <ActivityIndicator color="#FFF" />
          ) : (
             <Text style={styles.actionButtonText}>
               {isAsleep ? "Je suis réveillé" : "Commencer la nuit"}
             </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Aperçu de la nuit dernière</Text>
      
      <View style={styles.statsGrid}>
        {/* Score Card */}
        <View style={[styles.statCard, { flex: 2, backgroundColor: theme.card }]}>
          <View style={styles.statHeader}>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>Qualité</Text>
            <View style={[styles.badge, { backgroundColor: theme.successBg }]}>
              <Text style={{ color: '#4ADE80', fontSize: 12, fontWeight: 'bold' }}>
                {sleepScore > 80 ? "Excellent" : "Moyen"}
              </Text>
            </View>
          </View>
          <Text style={[styles.statValue, { color: theme.text }]}>{sleepScore}%</Text>
          <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
            <View style={[styles.progressBarFill, { width: `${sleepScore}%`, backgroundColor: '#4ADE80' }]} />
          </View>
        </View>

        {/* Deep Sleep Card */}
        <View style={[styles.statCard, { flex: 1, backgroundColor: theme.card }]}>
          <BedDouble color={theme.primary} size={24} style={{ marginBottom: 8 }} />
          <Text style={[styles.statLabel, { color: theme.subtext }]}>Profond</Text>
          <Text style={[styles.statValueSmall, { color: theme.text }]}>1h 45m</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
         <View style={[styles.rowCard, { backgroundColor: theme.card }]}>
            <View style={styles.rowContent}>
                <Clock color={theme.subtext} size={20} />
                <View style={{ marginLeft: 12 }}>
                    <Text style={[styles.statLabel, { color: theme.subtext }]}>Dette de sommeil</Text>
                    <Text style={[styles.statValueSmall, { color: theme.text }]}>-30 min</Text>
                </View>
            </View>
            <ChevronRight color={theme.subtext} size={20} />
         </View>
      </View>

      <View style={{ height: 100 }} /> 
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  historyButton: {
    padding: 10,
    borderRadius: 12,
  },
  mainCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 30,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, // Réduit pour le mode clair
    shadowRadius: 10,
    elevation: 5,
  },
  circleContainer: {
    marginBottom: 24,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationText: {
    fontSize: 42,
    fontWeight: 'bold',
    marginTop: 10,
  },
  durationLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  actionButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  statValueSmall: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    marginTop: 12,
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  rowCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowContent: {
      flexDirection: 'row',
      alignItems: 'center',
  }
});