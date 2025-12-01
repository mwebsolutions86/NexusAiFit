import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, Alert, ActivityIndicator, KeyboardAvoidingView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';

const { width } = Dimensions.get('window');

export default function SuppsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [supps, setSupps] = useState<any[]>([]);
  
  // Inputs
  const [newName, setNewName] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [newFreq, setNewFreq] = useState('');

  // Filtre de catégorie pour l'ajout rapide
  const [selectedCategory, setSelectedCategory] = useState('TOUT');

  // Couleur du module (Indigo)
  const MODULE_COLOR = '#6366f1'; 
  const SUPP_GRADIENT: [string, string] = ['#6366f1', '#818cf8'];

  // --- BIBLIOTHÈQUE MASSIVE ---
  const CATEGORIES = ['TOUT', 'MUSCLE', 'SANTÉ', 'ÉNERGIE', 'SOMMEIL', 'ARTICULATIONS', 'CERVEAU'];

  const ESSENTIALS = [
      // --- MUSCLE & FORCE ---
      { cat: 'MUSCLE', name: 'Créatine Monohydrate', dosage: '5g', freq: 'Quotidien' },
      { cat: 'MUSCLE', name: 'Whey Isolate', dosage: '30g', freq: 'Post-workout' },
      { cat: 'MUSCLE', name: 'Caséine', dosage: '30g', freq: 'Avant dormir' },
      { cat: 'MUSCLE', name: 'BCAA 2:1:1', dosage: '10g', freq: 'Intra-workout' },
      { cat: 'MUSCLE', name: 'EAA (Acides Aminés)', dosage: '10g', freq: 'Intra-workout' },
      { cat: 'MUSCLE', name: 'L-Glutamine', dosage: '5g', freq: 'Post-workout' },
      { cat: 'MUSCLE', name: 'Mass Gainer', dosage: '100g', freq: 'Collation' },
      { cat: 'MUSCLE', name: 'HMB', dosage: '3g', freq: 'Avant sport' },
      { cat: 'MUSCLE', name: 'Beta-Ecdystérone', dosage: '500mg', freq: 'Matin' },

      // --- PERFORMANCE & ÉNERGIE ---
      { cat: 'ÉNERGIE', name: 'Pre-Workout', dosage: '1 dose', freq: '30min avant sport' },
      { cat: 'ÉNERGIE', name: 'Caféine', dosage: '200mg', freq: 'Besoin' },
      { cat: 'ÉNERGIE', name: 'Beta-Alanine', dosage: '3g', freq: 'Pré-workout' },
      { cat: 'ÉNERGIE', name: 'L-Citrulline', dosage: '6g', freq: 'Pré-workout' },
      { cat: 'ÉNERGIE', name: 'L-Arginine', dosage: '3g', freq: 'Pré-workout' },
      { cat: 'ÉNERGIE', name: 'Electrolytes', dosage: '1 dose', freq: 'Pendant sport' },
      { cat: 'ÉNERGIE', name: 'Maltodextrine', dosage: '30g', freq: 'Intra-workout' },
      { cat: 'ÉNERGIE', name: 'Cluster Dextrin', dosage: '25g', freq: 'Intra-workout' },
      { cat: 'ÉNERGIE', name: 'L-Carnitine', dosage: '2g', freq: 'Avant cardio' },
      { cat: 'ÉNERGIE', name: 'Taurine', dosage: '2g', freq: 'Pré-workout' },

      // --- SANTÉ GÉNÉRALE ---
      { cat: 'SANTÉ', name: 'Multivitamine', dosage: '1 cap', freq: 'Matin' },
      { cat: 'SANTÉ', name: 'Omega-3', dosage: '2g', freq: 'Matin/Soir' },
      { cat: 'SANTÉ', name: 'Vitamine D3', dosage: '2000-5000UI', freq: 'Matin' },
      { cat: 'SANTÉ', name: 'Vitamine C', dosage: '500mg', freq: 'Matin' },
      { cat: 'SANTÉ', name: 'Magnésium Bisglycinate', dosage: '300mg', freq: 'Soir' },
      { cat: 'SANTÉ', name: 'Zinc Picolinate', dosage: '15mg', freq: 'Soir' },
      { cat: 'SANTÉ', name: 'Fer', dosage: '14mg', freq: 'Matin' },
      { cat: 'SANTÉ', name: 'Probiotiques', dosage: '1 cap', freq: 'Matin à jeun' },
      { cat: 'SANTÉ', name: 'Spiruline', dosage: '5g', freq: 'Matin' },
      { cat: 'SANTÉ', name: 'Greens (Poudre)', dosage: '1 dose', freq: 'Matin' },
      { cat: 'SANTÉ', name: 'Vinaigre de Cidre', dosage: '1 c.à.s', freq: 'Avant repas' },
      { cat: 'SANTÉ', name: 'CoQ10', dosage: '100mg', freq: 'Matin' },

      // --- ARTICULATIONS & OS ---
      { cat: 'ARTICULATIONS', name: 'Collagène Peptides', dosage: '10g', freq: 'Matin' },
      { cat: 'ARTICULATIONS', name: 'Glucosamine', dosage: '1500mg', freq: 'Matin' },
      { cat: 'ARTICULATIONS', name: 'Chondroïtine', dosage: '1200mg', freq: 'Matin' },
      { cat: 'ARTICULATIONS', name: 'MSM', dosage: '3g', freq: 'Matin' },
      { cat: 'ARTICULATIONS', name: 'Curcuma (Curcumine)', dosage: '500mg', freq: 'Repas' },
      { cat: 'ARTICULATIONS', name: 'Calcium', dosage: '500mg', freq: 'Soir' },

      // --- SOMMEIL & STRESS ---
      { cat: 'SOMMEIL', name: 'ZMA', dosage: '1 dose', freq: '30min avant dormir' },
      { cat: 'SOMMEIL', name: 'Mélatonine', dosage: '1mg', freq: 'Avant dormir' },
      { cat: 'SOMMEIL', name: 'Ashwagandha', dosage: '600mg', freq: 'Soir' },
      { cat: 'SOMMEIL', name: 'Glycine', dosage: '3g', freq: 'Avant dormir' },
      { cat: 'SOMMEIL', name: 'GABA', dosage: '500mg', freq: 'Soir' },
      { cat: 'SOMMEIL', name: 'Valériane', dosage: '400mg', freq: 'Soir' },
      { cat: 'SOMMEIL', name: 'CBD (Huile)', dosage: '10-20mg', freq: 'Soir' },
      { cat: 'SOMMEIL', name: 'L-Théanine', dosage: '200mg', freq: 'Avec caféine ou Soir' },

      // --- CERVEAU & FOCUS (NOOTROPIQUES) ---
      { cat: 'CERVEAU', name: 'Lion\'s Mane', dosage: '1000mg', freq: 'Matin' },
      { cat: 'CERVEAU', name: 'Alpha GPC', dosage: '300mg', freq: 'Matin' },
      { cat: 'CERVEAU', name: 'Tyrosine', dosage: '2g', freq: 'Matin à jeun' },
      { cat: 'CERVEAU', name: 'Bacopa Monnieri', dosage: '300mg', freq: 'Repas' },
      { cat: 'CERVEAU', name: 'Gingko Biloba', dosage: '120mg', freq: 'Matin' },
  ];

  useEffect(() => {
    fetchSupps();
  }, []);

  const fetchSupps = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data } = await supabase
            .from('user_supplements')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });
        
        if (data) setSupps(data);
    } catch (e) { console.log(e); }
  };

  const addSupp = async (nameArg?: string, dosageArg?: string, freqArg?: string) => {
      const n = nameArg || newName;
      const d = dosageArg || newDosage;
      const f = freqArg || newFreq;

      if (!n.trim()) {
          Alert.alert("Info manquante", "Le nom du supplément est requis.");
          return;
      }
      
      if (Platform.OS !== 'web') Haptics.selectionAsync();
      
      if (!nameArg) {
          setNewName('');
          setNewDosage('');
          setNewFreq('');
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase
            .from('user_supplements')
            .insert({
                user_id: session.user.id,
                name: n.trim(),
                dosage: d.trim(),
                frequency: f.trim()
            })
            .select()
            .single();

        if (error) throw error;
        if (data) setSupps(prev => [data, ...prev]);

      } catch (e: any) {
          Alert.alert("Erreur", "Impossible d'ajouter le supplément.");
      }
  };

  const deleteSupp = async (id: string) => {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSupps(supps.filter(i => i.id !== id)); 
      try {
          await supabase.from('user_supplements').delete().eq('id', id);
      } catch (e) { console.log(e); }
  };

  // Filtrer les suggestions
  const filteredEssentials = selectedCategory === 'TOUT' 
    ? ESSENTIALS 
    : ESSENTIALS.filter(s => s.cat === selectedCategory);

  // --- STYLES DYNAMIQUES ---
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1 },
    
    auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
    blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.2 },
  
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    headerTitle: { color: theme.colors.text, fontWeight: 'bold', letterSpacing: 1 },

    content: { flex: 1, paddingHorizontal: 20 },

    // Form
    formCard: { 
        backgroundColor: theme.colors.glass, 
        padding: 20, borderRadius: 20, marginBottom: 20,
        borderWidth: 1, borderColor: theme.colors.border,
        shadowColor: "#000", shadowOffset: {width:0, height:2}, shadowOpacity:0.05, shadowRadius:4, elevation:2
    },
    inputLabel: { color: MODULE_COLOR, fontSize: 10, fontWeight: 'bold', marginBottom: 5, marginLeft: 5 },
    input: { 
        backgroundColor: theme.isDark ? 'rgba(0,0,0,0.3)' : theme.colors.bg, 
        borderRadius: 12, padding: 12, marginBottom: 15,
        color: theme.colors.text, fontSize: 16, borderWidth: 1, borderColor: theme.colors.border
    },
    rowInputs: { flexDirection: 'row', gap: 10 },
    
    addBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 5 },
    btnGradient: { padding: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
    btnText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 },

    // Quick Add Categories
    sectionTitle: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 15, marginLeft: 5, marginTop: 10 },
    
    catScroll: { marginBottom: 15 },
    catBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, marginRight: 8, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.glass },
    catBtnActive: { backgroundColor: MODULE_COLOR, borderColor: MODULE_COLOR },
    catText: { fontSize: 10, fontWeight: 'bold', color: theme.colors.textSecondary },
    catTextActive: { color: '#fff' },

    // Chips (Flex Wrap)
    chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 25 },
    chip: { 
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, 
        backgroundColor: theme.colors.glass, borderWidth: 1, borderColor: theme.colors.border,
        flexDirection: 'row', alignItems: 'center'
    },
    chipText: { color: theme.colors.text, fontSize: 11, fontWeight: '600' },
    chipDose: { color: theme.colors.textSecondary, fontSize: 10, marginLeft: 4 },

    // List
    suppCard: { 
        flexDirection: 'row', alignItems: 'center', 
        backgroundColor: theme.colors.glass, 
        padding: 15, borderRadius: 16, marginBottom: 10,
        borderWidth: 1, borderColor: theme.colors.border 
    },
    iconBox: { 
        width: 40, height: 40, borderRadius: 12, 
        backgroundColor: MODULE_COLOR + '20', 
        justifyContent: 'center', alignItems: 'center', marginRight: 15 
    },
    suppInfo: { flex: 1 },
    suppName: { color: theme.colors.text, fontSize: 16, fontWeight: 'bold' },
    suppDetails: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 },
    suppBadge: { 
        backgroundColor: theme.colors.bg, paddingHorizontal: 8, paddingVertical: 4, 
        borderRadius: 6, borderWidth: 1, borderColor: theme.colors.border 
    },
    suppDosage: { color: MODULE_COLOR, fontSize: 10, fontWeight: 'bold' },
    
    deleteBtn: { padding: 10 }
  });

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      
      {theme.isDark && (
        <View style={styles.auroraBg}>
            <View style={[styles.blob, { top: 100, right: -50, backgroundColor: 'rgba(99, 102, 241, 0.15)' }]} />
        </View>
      )}

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>STACK SUPPLÉMENTS</Text>
            <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={{paddingBottom: 50}} style={styles.content} showsVerticalScrollIndicator={false}>
            
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <View style={styles.formCard}>
                    <Text style={styles.inputLabel}>AJOUT MANUEL</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="Ex: Vitamine C" 
                        placeholderTextColor={theme.colors.textSecondary}
                        value={newName} onChangeText={setNewName}
                    />
                    
                    <View style={styles.rowInputs}>
                        <View style={{flex: 1}}>
                            <TextInput 
                                style={styles.input} 
                                placeholder="Dosage (ex: 1g)" 
                                placeholderTextColor={theme.colors.textSecondary}
                                value={newDosage} onChangeText={setNewDosage}
                            />
                        </View>
                        <View style={{flex: 1}}>
                            <TextInput 
                                style={styles.input} 
                                placeholder="Fréq. (ex: Matin)" 
                                placeholderTextColor={theme.colors.textSecondary}
                                value={newFreq} onChangeText={setNewFreq}
                            />
                        </View>
                    </View>

                    <TouchableOpacity style={styles.addBtn} onPress={() => addSupp()} disabled={loading}>
                        <LinearGradient colors={SUPP_GRADIENT} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.btnGradient}>
                            <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                            <Text style={styles.btnText}>AJOUTER</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            <Text style={styles.sectionTitle}>BIBLIOTHÈQUE RAPIDE</Text>
            
            {/* Filtres Catégories */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                {CATEGORIES.map(cat => (
                    <TouchableOpacity 
                        key={cat} 
                        style={[styles.catBtn, selectedCategory === cat && styles.catBtnActive]}
                        onPress={() => {
                            if(Platform.OS!=='web') Haptics.selectionAsync();
                            setSelectedCategory(cat);
                        }}
                    >
                        <Text style={[styles.catText, selectedCategory === cat && styles.catTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Liste des suggestions (Wrap) */}
            <View style={styles.chipsContainer}>
                {filteredEssentials.map((item, index) => (
                    <TouchableOpacity 
                        key={index} 
                        style={styles.chip}
                        onPress={() => addSupp(item.name, item.dosage, item.freq)}
                    >
                        <MaterialCommunityIcons name="plus-circle" size={14} color={MODULE_COLOR} style={{marginRight:4}} />
                        <Text style={styles.chipText}>{item.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={[styles.sectionTitle, {marginTop: 20}]}>MON STACK ({supps.length})</Text>
            {supps.length > 0 ? supps.map((item) => (
                <View key={item.id} style={styles.suppCard}>
                    <View style={styles.iconBox}>
                        <MaterialCommunityIcons name="bottle-tonic-plus" size={20} color={MODULE_COLOR} />
                    </View>
                    <View style={styles.suppInfo}>
                        <Text style={styles.suppName}>{item.name}</Text>
                        <Text style={styles.suppDetails}>{item.frequency || 'Fréquence non définie'}</Text>
                    </View>
                    <View style={styles.suppBadge}>
                        <Text style={styles.suppDosage}>{item.dosage || '--'}</Text>
                    </View>
                    <TouchableOpacity onPress={() => deleteSupp(item.id)} style={styles.deleteBtn}>
                        <MaterialCommunityIcons name="close" size={18} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            )) : (
                <View style={{alignItems:'center', marginTop: 30, opacity: 0.5}}>
                    <MaterialCommunityIcons name="bottle-tonic-outline" size={48} color={theme.colors.textSecondary} />
                    <Text style={{color: theme.colors.textSecondary, marginTop: 10}}>Votre stack est vide.</Text>
                </View>
            )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}