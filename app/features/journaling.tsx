import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, Alert, ActivityIndicator, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';

const { width } = Dimensions.get('window');

export default function JournalingScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<any[]>([]);
  
  // Modal d'écriture
  const [isModalVisible, setModalVisible] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [selectedMood, setSelectedMood] = useState('neutral');

  // Couleur du module (Violet)
  const MODULE_COLOR = '#8b5cf6'; 
  const JOURNAL_GRADIENT: [string, string] = ['#8b5cf6', '#a78bfa'];

  const MOODS = [
      { id: 'focus', icon: 'target', label: 'Focus', color: '#3b82f6' },
      { id: 'happy', icon: 'emoticon-happy', label: 'Positif', color: '#22c55e' },
      { id: 'neutral', icon: 'emoticon-neutral', label: 'Neutre', color: '#94a3b8' },
      { id: 'tired', icon: 'battery-low', label: 'Fatigué', color: '#eab308' },
      { id: 'anxious', icon: 'brain', label: 'Stressé', color: '#ef4444' },
  ];

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data } = await supabase
            .from('journal_entries')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });
        
        if (data) setEntries(data);
    } catch (e) { console.log(e); }
  };

  const saveEntry = async () => {
      if (!newContent.trim()) {
          Alert.alert("Vide", "Écrivez quelque chose avant de sauvegarder.");
          return;
      }

      setLoading(true);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { error } = await supabase
            .from('journal_entries')
            .insert({
                user_id: session.user.id,
                content: newContent.trim(),
                mood: selectedMood
            });

        if (error) throw error;
        
        setNewContent('');
        setSelectedMood('neutral');
        setModalVisible(false);
        await fetchEntries();

      } catch (e: any) {
          Alert.alert("Erreur", "Impossible de sauvegarder l'entrée.");
      } finally {
          setLoading(false);
      }
  };

  const deleteEntry = async (id: string) => {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      Alert.alert("Supprimer ?", "Cette action est irréversible.", [
          { text: "Annuler", style: "cancel" },
          { 
              text: "Supprimer", 
              style: "destructive", 
              onPress: async () => {
                  setEntries(prev => prev.filter(e => e.id !== id)); // Optimistic
                  await supabase.from('journal_entries').delete().eq('id', id);
              }
          }
      ]);
  };

  const getMoodIcon = (moodId: string) => {
      const m = MOODS.find(m => m.id === moodId);
      return m ? m : MOODS[2]; // Default neutral
  };

  // --- STYLES DYNAMIQUES ---
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1 },
    
    auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
    blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.2 },
  
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    headerTitle: { color: theme.colors.text, fontWeight: 'bold', letterSpacing: 1 },
    addBtnHeader: { width: 40, height: 40, borderRadius: 20, backgroundColor: MODULE_COLOR, justifyContent: 'center', alignItems: 'center', shadowColor: MODULE_COLOR, shadowOpacity: 0.5, shadowRadius: 8 },

    content: { paddingHorizontal: 20 },

    // Entry Card
    card: { 
        backgroundColor: theme.colors.glass, 
        borderRadius: 20, padding: 20, marginBottom: 15,
        borderWidth: 1, borderColor: theme.colors.border,
        shadowColor: theme.isDark ? 'transparent' : '#000', shadowOffset: {width:0, height:2}, shadowOpacity:0.05, shadowRadius:4, elevation:2
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    dateText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: 'bold' },
    
    moodBadge: { 
        flexDirection: 'row', alignItems: 'center', 
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
        backgroundColor: theme.colors.bg, borderWidth: 1, borderColor: theme.colors.border
    },
    moodText: { fontSize: 10, fontWeight: 'bold', marginLeft: 5 },

    entryText: { color: theme.colors.text, fontSize: 14, lineHeight: 22 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalContent: { 
        backgroundColor: theme.colors.cardBg, 
        borderTopLeftRadius: 30, borderTopRightRadius: 30, 
        padding: 25, height: '80%', 
        borderTopWidth: 1, borderTopColor: theme.colors.border 
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold' },
    
    moodSelector: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
    moodBtn: { alignItems: 'center', opacity: 0.5 },
    moodBtnActive: { opacity: 1, transform: [{scale: 1.1}] },
    moodCircle: { 
        width: 50, height: 50, borderRadius: 25, 
        justifyContent: 'center', alignItems: 'center', 
        marginBottom: 5, borderWidth: 2 
    },
    moodLabel: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold' },

    textInput: { 
        backgroundColor: theme.colors.bg, 
        color: theme.colors.text, 
        padding: 15, borderRadius: 15, 
        flex: 1, textAlignVertical: 'top', fontSize: 16,
        borderWidth: 1, borderColor: theme.colors.border,
        marginBottom: 20
    },
    
    saveBtn: { borderRadius: 15, overflow: 'hidden' },
    btnGradient: { padding: 18, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
    
    emptyState: { alignItems: 'center', marginTop: 50, opacity: 0.5 },
    emptyText: { color: theme.colors.textSecondary, marginTop: 10, textAlign:'center' },
  });

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      
      {theme.isDark && (
        <View style={styles.auroraBg}>
            <View style={[styles.blob, { top: 100, right: -50, backgroundColor: 'rgba(139, 92, 246, 0.15)' }]} />
        </View>
      )}

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>JOURNAL DE BORD</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtnHeader}>
                <MaterialCommunityIcons name="plus" size={24} color="#fff" />
            </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{paddingBottom: 50}} style={styles.content} showsVerticalScrollIndicator={false}>
            
            {entries.length > 0 ? entries.map((item) => {
                const mood = getMoodIcon(item.mood);
                return (
                    <TouchableOpacity key={item.id} style={styles.card} onLongPress={() => deleteEntry(item.id)} activeOpacity={0.9}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.dateText}>
                                {new Date(item.created_at).toLocaleDateString(undefined, {weekday:'long', day:'numeric', month:'long'})}
                                {' • '}
                                {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </Text>
                            <View style={[styles.moodBadge, {borderColor: mood.color}]}>
                                <MaterialCommunityIcons name={mood.icon as any} size={14} color={mood.color} />
                                <Text style={[styles.moodText, {color: mood.color}]}>{mood.label}</Text>
                            </View>
                        </View>
                        <Text style={styles.entryText}>{item.content}</Text>
                    </TouchableOpacity>
                );
            }) : (
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="book-open-blank-variant" size={64} color={theme.colors.textSecondary} />
                    <Text style={styles.emptyText}>Le journal est vide.{'\n'}Commencez par écrire vos pensées.</Text>
                    <TouchableOpacity onPress={() => setModalVisible(true)} style={{marginTop: 20}}>
                        <Text style={{color: MODULE_COLOR, fontWeight: 'bold'}}>ÉCRIRE MAINTENANT</Text>
                    </TouchableOpacity>
                </View>
            )}

        </ScrollView>

        {/* MODAL D'ÉCRITURE */}
        <Modal animationType="slide" transparent={true} visible={isModalVisible} onRequestClose={() => setModalVisible(false)}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>NOUVELLE ENTRÉE</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <MaterialCommunityIcons name="close" size={24} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.moodSelector}>
                        {MOODS.map((m) => (
                            <TouchableOpacity 
                                key={m.id} 
                                style={[styles.moodBtn, selectedMood === m.id && styles.moodBtnActive]}
                                onPress={() => {
                                    if(Platform.OS!=='web') Haptics.selectionAsync();
                                    setSelectedMood(m.id);
                                }}
                            >
                                <View style={[styles.moodCircle, {borderColor: selectedMood === m.id ? m.color : theme.colors.border, backgroundColor: selectedMood === m.id ? m.color + '20' : 'transparent'}]}>
                                    <MaterialCommunityIcons name={m.icon as any} size={28} color={selectedMood === m.id ? m.color : theme.colors.textSecondary} />
                                </View>
                                <Text style={[styles.moodLabel, selectedMood === m.id && {color: m.color}]}>{m.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TextInput 
                        style={styles.textInput} 
                        multiline 
                        placeholder="Qu'avez-vous en tête aujourd'hui ?" 
                        placeholderTextColor={theme.colors.textSecondary}
                        value={newContent}
                        onChangeText={setNewContent}
                        autoFocus
                    />

                    <TouchableOpacity style={styles.saveBtn} onPress={saveEntry} disabled={loading}>
                        <LinearGradient colors={JOURNAL_GRADIENT} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.btnGradient}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>ENREGISTRER</Text>}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

      </SafeAreaView>
    </View>
  );
}