import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../lib/theme';
import { useTranslation } from 'react-i18next';

const NOOTROPICS_DB = [
    { name: 'Caféine + L-Théanine', tag: 'Focus', desc: 'Énergie calme.', dose: '100mg+200mg' },
    { name: 'Alpha GPC', tag: 'Focus', desc: 'Mémoire & Puissance.', dose: '300mg' },
    { name: 'Ashwagandha', tag: 'Stress', desc: 'Réduit le cortisol.', dose: '600mg' },
    { name: 'Créatine', tag: 'Énergie', desc: 'Performance mentale.', dose: '5g' },
    { name: 'Lion\'s Mane', tag: 'Neuro', desc: 'Neurogenèse.', dose: '1000mg' },
    { name: 'Rhodiola Rosea', tag: 'Stress', desc: 'Anti-fatigue.', dose: '500mg' },
    { name: 'Bacopa Monnieri', tag: 'Mémoire', desc: 'Apprentissage.', dose: '300mg' },
    { name: 'Magnésium Thréonate', tag: 'Sommeil', desc: 'Détente cérébrale.', dose: '145mg' }
];

export default function NootropicsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();

  const MODULE_COLOR = '#8b5cf6'; 

  const addToStack = async (item: any) => {
      try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;
          await supabase.from('user_supplements').insert({ user_id: session.user.id, name: item.name, dosage: item.dose, frequency: 'Besoin' });
          Alert.alert("Ajouté", `${item.name} ajouté au stack.`);
      } catch (e) { console.log(e); }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    headerTitle: { color: theme.colors.text, fontWeight: 'bold', letterSpacing: 1 },
    content: { padding: 20 },
    card: { backgroundColor: theme.colors.glass, borderRadius: 16, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: theme.colors.border },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    title: { color: theme.colors.text, fontSize: 16, fontWeight: '900' },
    tagBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: MODULE_COLOR + '20', borderWidth: 1, borderColor: MODULE_COLOR },
    tagText: { color: MODULE_COLOR, fontSize: 10, fontWeight: 'bold' },
    desc: { color: theme.colors.textSecondary, fontSize: 13, marginBottom: 15 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 10 },
    dose: { color: theme.colors.text, fontWeight: 'bold', fontSize: 12 },
    addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    addText: { color: MODULE_COLOR, fontSize: 10, fontWeight: 'bold', marginLeft: 5 }
  });

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} /></TouchableOpacity>
            <Text style={styles.headerTitle}>{t('modules.nootropics.title')}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {NOOTROPICS_DB.map((item, i) => (
                <View key={i} style={styles.card}>
                    <View style={styles.cardHeader}><Text style={styles.title}>{item.name}</Text><View style={styles.tagBadge}><Text style={styles.tagText}>{item.tag}</Text></View></View>
                    <Text style={styles.desc}>{item.desc}</Text>
                    <View style={styles.footer}>
                        <Text style={styles.dose}>{item.dose}</Text>
                        <TouchableOpacity style={styles.addBtn} onPress={() => addToStack(item)}>
                            <MaterialCommunityIcons name="plus" size={14} color={MODULE_COLOR} />
                            <Text style={styles.addText}>{t('modules.nootropics.add_stack')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}