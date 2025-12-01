import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';

const { width } = Dimensions.get('window');

export default function WaterScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  
  // Données
  const [intake, setIntake] = useState(0);
  const [target, setTarget] = useState(2500);
  const [history, setHistory] = useState<any[]>([]);
  const [todayRecordId, setTodayRecordId] = useState<string | null>(null);

  // --- CORRECTION ICI : Typage explicite pour LinearGradient ---
  const WATER_GRADIENT = ['#3b82f6', '#60a5fa'] as const;
  const PRIMARY_COLOR = '#3b82f6';

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const todayStr = new Date().toISOString().split('T')[0];

      // 1. Récupérer la consommation du jour
      const { data: todayData } = await supabase
        .from('body_metrics')
        .select('id, value')
        .eq('user_id', session.user.id)
        .eq('type', 'water')
        .eq('date', todayStr)
        .maybeSingle();

      if (todayData) {
        setIntake(Number(todayData.value));
        setTodayRecordId(todayData.id);
      } else {
        setIntake(0);
        setTodayRecordId(null);
      }

      // 2. Historique
      const { data: histData } = await supabase
        .from('body_metrics')
        .select('date, value')
        .eq('user_id', session.user.id)
        .eq('type', 'water')
        .neq('date', todayStr)
        .order('date', { ascending: false })
        .limit(5);

      if (histData) setHistory(histData);

    } catch (e) {
      console.log("Erreur chargement water", e);
    }
  };

  const addWater = async (amount: number) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const newIntake = intake + amount;
    setIntake(newIntake); 

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const todayStr = new Date().toISOString().split('T')[0];

      if (todayRecordId) {
        const { error } = await supabase
          .from('body_metrics')
          .update({ value: newIntake })
          .eq('id', todayRecordId);
        
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('body_metrics')
          .insert({
            user_id: session.user.id,
            type: 'water',
            date: todayStr,
            value: newIntake
          })
          .select()
          .single();

        if (error) throw error;
        if (data) setTodayRecordId(data.id);
      }
    } catch (e: any) {
      Alert.alert("Erreur", "Impossible de sauvegarder l'hydratation.");
      setIntake(intake);
    }
  };

  const progress = target > 0 ? Math.min(intake / target, 1) : 0;
  const percentage = target > 0 ? Math.round((intake / target) * 100) : 0;

  // --- STYLES DYNAMIQUES ---
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1 },
    
    auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
    blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.2 },
  
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    headerTitle: { color: theme.colors.text, fontWeight: 'bold', letterSpacing: 1 },
  
    content: { padding: 20 },

    // Gauge Card
    gaugeCard: {
        backgroundColor: theme.colors.glass,
        borderRadius: 30, padding: 30,
        alignItems: 'center', marginBottom: 30,
        borderWidth: 1, borderColor: PRIMARY_COLOR,
        shadowColor: PRIMARY_COLOR,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: theme.isDark ? 0.3 : 0.1, 
        shadowRadius: 15,
        elevation: 5
    },
    gaugeValue: { fontSize: 56, fontWeight: '900', color: theme.colors.text },
    gaugeUnit: { fontSize: 16, color: theme.colors.textSecondary, fontWeight: 'bold', marginTop: -5, marginBottom: 20 },
    
    progressBarBg: { 
        width: '100%', height: 12, 
        backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', 
        borderRadius: 6, overflow: 'hidden', marginBottom: 15 
    },
    progressBarFill: { height: '100%', borderRadius: 6 },
    
    targetText: { color: PRIMARY_COLOR, fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },

    // Quick Add
    sectionTitle: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 15, marginLeft: 5 },
    addGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 30 },
    addBtn: { 
        width: '48%', 
        backgroundColor: theme.colors.glass, 
        borderRadius: 20, padding: 15, 
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: theme.colors.border,
        shadowColor: theme.isDark ? 'transparent' : '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
    },
    addIcon: { marginRight: 10 },
    addLabel: { color: theme.colors.text, fontWeight: '900', fontSize: 16 },
    addUnit: { color: theme.colors.textSecondary, fontSize: 12 },

    // History
    historyItem: { 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 15, backgroundColor: theme.colors.glass, borderRadius: 15, marginBottom: 10,
        borderWidth: 1, borderColor: theme.colors.border 
    },
    historyDate: { color: theme.colors.textSecondary, fontWeight: '600' },
    historyVal: { color: theme.colors.text, fontWeight: 'bold' },
    historyBar: { width: 80, height: 6, backgroundColor: theme.colors.border, borderRadius: 3, marginLeft: 10, overflow: 'hidden' },
    historyFill: { height: '100%', backgroundColor: PRIMARY_COLOR, borderRadius: 3 }
  });

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      
      {theme.isDark && (
        <View style={styles.auroraBg}>
            <View style={[styles.blob, { top: 100, right: -50, backgroundColor: 'rgba(59, 130, 246, 0.15)' }]} />
        </View>
      )}

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>HYDRATATION</Text>
            <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            
            <View style={styles.gaugeCard}>
                <MaterialCommunityIcons name="water" size={32} color={PRIMARY_COLOR} style={{marginBottom: 10}} />
                <Text style={styles.gaugeValue}>{intake}</Text>
                <Text style={styles.gaugeUnit}>ML CONSOMMÉS</Text>
                
                <View style={styles.progressBarBg}>
                    <LinearGradient 
                        colors={WATER_GRADIENT} 
                        start={{x:0, y:0}} end={{x:1, y:0}} 
                        style={[styles.progressBarFill, { width: `${progress * 100}%` }]} 
                    />
                </View>
                
                <Text style={styles.targetText}>{percentage}% DE L'OBJECTIF ({target} ML)</Text>
            </View>

            <Text style={styles.sectionTitle}>AJOUTER UNE DOSE</Text>
            <View style={styles.addGrid}>
                <TouchableOpacity style={styles.addBtn} onPress={() => addWater(150)}>
                    <MaterialCommunityIcons name="cup" size={24} color={theme.colors.textSecondary} style={styles.addIcon} />
                    <View>
                        <Text style={styles.addLabel}>+150</Text>
                        <Text style={styles.addUnit}>Verre</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.addBtn} onPress={() => addWater(250)}>
                    <MaterialCommunityIcons name="cup-water" size={24} color={PRIMARY_COLOR} style={styles.addIcon} />
                    <View>
                        <Text style={styles.addLabel}>+250</Text>
                        <Text style={styles.addUnit}>Grand Verre</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.addBtn} onPress={() => addWater(500)}>
                    <MaterialCommunityIcons name="bottle-soda" size={24} color={PRIMARY_COLOR} style={styles.addIcon} />
                    <View>
                        <Text style={styles.addLabel}>+500</Text>
                        <Text style={styles.addUnit}>Gourde</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.addBtn} onPress={() => addWater(1000)}>
                    <MaterialCommunityIcons name="bottle-tonic-plus" size={24} color="#8b5cf6" style={styles.addIcon} />
                    <View>
                        <Text style={styles.addLabel}>+1000</Text>
                        <Text style={styles.addUnit}>Bouteille</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>DERNIERS JOURS</Text>
            {history.length > 0 ? history.map((item, i) => (
                <View key={i} style={styles.historyItem}>
                    <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString(undefined, {weekday:'short', day:'numeric'})}</Text>
                    <View style={{flexDirection:'row', alignItems:'center'}}>
                        <Text style={styles.historyVal}>{item.value} ml</Text>
                        <View style={styles.historyBar}>
                            <View style={[styles.historyFill, { width: `${Math.min((item.value / target) * 100, 100)}%` }]} />
                        </View>
                    </View>
                </View>
            )) : (
                <Text style={{color: theme.colors.textSecondary, fontStyle:'italic', marginLeft: 5}}>Aucune donnée récente.</Text>
            )}

            <View style={{ height: 50 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}