import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../lib/theme';
import { useTranslation } from 'react-i18next'; // Import

export default function Calculator1RMScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation(); // Hook
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [oneRM, setOneRM] = useState<number | null>(null);

  const calculate = () => {
      const w = parseFloat(weight);
      const r = parseFloat(reps);
      if (w && r) {
          // Formule Epley
          const max = w * (1 + r / 30);
          setOneRM(Math.round(max));
      }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    headerTitle: { color: theme.colors.text, fontWeight: '900', letterSpacing: 1, fontSize: 16 },
    content: { padding: 20 },
    
    resultContainer: { alignItems: 'center', marginBottom: 40 },
    resultCircle: { width: 180, height: 180, borderRadius: 90, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: theme.colors.primary },
    resultValue: { fontSize: 48, fontWeight: '900', color: theme.colors.primary },
    resultLabel: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginTop: 5 },

    inputRow: { flexDirection: 'row', gap: 15, marginBottom: 20 },
    inputBox: { flex: 1 },
    label: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold', marginBottom: 8, marginLeft: 4 },
    input: { backgroundColor: theme.colors.glass, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, padding: 15, color: theme.colors.text, fontWeight: 'bold', fontSize: 18, textAlign: 'center' },

    calcBtn: { width: '100%', borderRadius: 16, overflow: 'hidden', marginTop: 10 },
    btnGradient: { padding: 18, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
    
    tableContainer: { marginTop: 40 },
    tableTitle: { color: theme.colors.text, fontSize: 14, fontWeight: 'bold', marginBottom: 15 },
    tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    tableText: { color: theme.colors.textSecondary, fontWeight: '500' },
    tableVal: { color: theme.colors.text, fontWeight: 'bold' }
  });

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('modules.rm1.title')}</Text>
            <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.resultContainer}>
                <View style={styles.resultCircle}>
                    <Text style={styles.resultValue}>{oneRM || '--'}</Text>
                    <Text style={styles.resultLabel}>{t('modules.rm1.est_max')}</Text>
                </View>
            </View>

            <View style={styles.inputRow}>
                <View style={styles.inputBox}>
                    <Text style={styles.label}>{t('modules.rm1.weight_lifted')}</Text>
                    <TextInput style={styles.input} keyboardType="numeric" placeholder="100" placeholderTextColor={theme.colors.textSecondary} value={weight} onChangeText={setWeight} />
                </View>
                <View style={styles.inputBox}>
                    <Text style={styles.label}>{t('modules.rm1.reps_done')}</Text>
                    <TextInput style={styles.input} keyboardType="numeric" placeholder="5" placeholderTextColor={theme.colors.textSecondary} value={reps} onChangeText={setReps} />
                </View>
            </View>

            <TouchableOpacity style={styles.calcBtn} onPress={calculate}>
                <LinearGradient colors={['#ec4899', '#be185d']} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.btnGradient}>
                    <Text style={styles.btnText}>{t('modules.rm1.calculate')}</Text>
                </LinearGradient>
            </TouchableOpacity>

            {oneRM && (
                <View style={styles.tableContainer}>
                    <Text style={styles.tableTitle}>{t('modules.rm1.percentages')}</Text>
                    {[95, 90, 85, 80, 75, 70, 60].map(pct => (
                        <View key={pct} style={styles.tableRow}>
                            <Text style={styles.tableText}>{pct}% (Hypertrophie/Force)</Text>
                            <Text style={styles.tableVal}>{Math.round(oneRM * (pct/100))} kg</Text>
                        </View>
                    ))}
                </View>
            )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}