import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../lib/theme';

const NOOTROPICS_DB = [
    // --- FOCUS & ÉNERGIE ---
    { name: 'Caféine + L-Théanine', tag: 'Focus', desc: 'Le combo classique. Énergie sans nervosité ni crash.', dose: '100mg + 200mg' },
    { name: 'Alpha GPC', tag: 'Focus', desc: 'Source de choline hautement biodisponible pour la mémoire de travail.', dose: '300mg' },
    { name: 'N-Acetyl L-Tyrosine (NALT)', tag: 'Focus', desc: 'Acide aminé pour la production de dopamine en période de stress.', dose: '500mg' },
    { name: 'Citicoline (CDP-Choline)', tag: 'Énergie', desc: 'Améliore la concentration et les niveaux d\'énergie.', dose: '250mg' },
    { name: 'Huperzine A', tag: 'Concentration', desc: 'Inhibiteur de l\'acétylcholinestérase. Optimise la concentration sur la durée.', dose: '200mcg' },
    
    // --- MÉMOIRE & APPRENTISSAGE ---
    { name: 'Bacopa Monnieri', tag: 'Mémoire', desc: 'Améliore la rétention d\'information à long terme. Effet après quelques semaines.', dose: '300mg' },
    { name: 'Lion\'s Mane', tag: 'Mémoire', desc: 'Champignon pour la neurogenèse et la fonction cognitive.', dose: '1000mg' },
    { name: 'Gingko Biloba', tag: 'Mémoire', desc: 'Améliore la circulation sanguine cérébrale et la clarté mentale.', dose: '120mg' },
    { name: 'Phosphatidylserine', tag: 'Mémoire', desc: 'Lipide essentiel pour l\'intégrité des membranes neuronales.', dose: '300mg' },
    { name: 'Uridine Monophosphate', tag: 'Neuro', desc: 'Nécessaire à la réparation des synapses.', dose: '250mg' },
    
    // --- ADAPTOGÈNES & STRESS ---
    { name: 'Ashwagandha', tag: 'Stress', desc: 'Réduit le cortisol, l\'hormone du stress, et l\'anxiété.', dose: '600mg' },
    { name: 'Rhodiola Rosea', tag: 'Stress', desc: 'Adaptogène puissant contre la fatigue physique et mentale.', dose: '500mg' },
    { name: 'Panax Ginseng', tag: 'Énergie', desc: 'Améliore les performances cognitives et réduit la fatigue.', dose: '400mg' },
    
    // --- HUMEUR & SOMMEIL ---
    { name: 'Magnésium L-Thréonate', tag: 'Sommeil', desc: 'Forme de magnésium qui passe la barrière hémato-encéphalique. Calmant.', dose: '145mg' },
    { name: 'L-Tryptophane / 5-HTP', tag: 'Humeur', desc: 'Précurseur de sérotonine (bien-être) et de mélatonine.', dose: '500mg' },
    { name: 'Créatine', tag: 'Énergie', desc: 'Réduit la fatigue mentale dans les tâches complexes.', dose: '5g' },
    
    // --- ANTIOXYDANTS / PROTECTEURS ---
    { name: 'NAC (N-Acétylcystéine)', tag: 'Santé', desc: 'Antioxydant qui protège le cerveau des dommages oxydatifs.', dose: '600mg' },
    { name: 'PQQ', tag: 'Mitochondries', desc: 'Améliore la croissance de nouvelles mitochondries (énergie cellulaire).', dose: '20mg' },
    { name: 'Thé vert (EGCG)', tag: 'Antioxydant', desc: 'Puissant antioxydant. Améliore la mémoire et la fonction exécutive.', dose: '400mg' },
];

export default function NootropicsScreen() {
  const router = useRouter();
  const theme = useTheme();

  const MODULE_COLOR = '#8b5cf6'; 

  const addToStack = async (item: any) => {
      try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;

          const { error } = await supabase.from('user_supplements').insert({
              user_id: session.user.id,
              name: item.name,
              dosage: item.dose,
              frequency: 'Besoin'
          });

          if (!error) {
              Alert.alert("Ajouté", `${item.name} a été ajouté à votre stack de suppléments.`);
          } else {
              Alert.alert("Erreur", "Impossible d'ajouter ce supplément.");
          }
      } catch (e) { console.log(e); }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1 },
    auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
    blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.15 },
  
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    headerTitle: { color: theme.colors.text, fontWeight: 'bold', letterSpacing: 1 },
    
    content: { padding: 20 },

    card: { 
        backgroundColor: theme.colors.glass, 
        borderRadius: 16, padding: 15, marginBottom: 15,
        borderWidth: 1, borderColor: theme.colors.border,
        shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 2
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    title: { color: theme.colors.text, fontSize: 16, fontWeight: '900' },
    tagBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: MODULE_COLOR + '20', borderWidth: 1, borderColor: MODULE_COLOR },
    tagText: { color: MODULE_COLOR, fontSize: 10, fontWeight: 'bold' },
    
    desc: { color: theme.colors.textSecondary, fontSize: 13, marginBottom: 15, lineHeight: 18 },
    
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 10 },
    dose: { color: theme.colors.text, fontWeight: 'bold', fontSize: 12 },
    
    addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    addText: { color: MODULE_COLOR, fontSize: 10, fontWeight: 'bold', marginLeft: 5 }
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
            <Text style={styles.headerTitle}>GUIDE NOOTROPIQUES</Text>
            <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {NOOTROPICS_DB.map((item, i) => (
                <View key={i} style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.title}>{item.name}</Text>
                        <View style={styles.tagBadge}>
                            <Text style={styles.tagText}>{item.tag}</Text>
                        </View>
                    </View>
                    <Text style={styles.desc}>{item.desc}</Text>
                    <View style={styles.footer}>
                        <Text style={styles.dose}>Dose: {item.dose}</Text>
                        <TouchableOpacity style={styles.addBtn} onPress={() => addToStack(item)}>
                            <MaterialCommunityIcons name="plus" size={14} color={MODULE_COLOR} />
                            <Text style={styles.addText}>AJOUTER AU STACK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
            <View style={{ height: 50 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}