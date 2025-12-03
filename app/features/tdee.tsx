import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../lib/theme';
import { useTranslation } from 'react-i18next'; // Import

export default function TDEEScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation(); // Hook
  
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [activity, setActivity] = useState(1.2);
  const [tdee, setTdee] = useState<number | null>(null);

  const ACTIVITIES = [
      { labelKey: 'modules.tdee.sedentary', value: 1.2 },
      { labelKey: 'modules.tdee.light', value: 1.375 },
      { labelKey: 'modules.tdee.moderate', value: 1.55 },
      { labelKey: 'modules.tdee.active', value: 1.725 },
      { labelKey: 'modules.tdee.athlete', value: 1.9 }
  ];

  const calculateTDEE = () => {
      const w = parseFloat(weight);
      const h = parseFloat(height);
      const a = parseFloat(age);
      
      if (w && h && a) {
          // Formule Mifflin-St Jeor (Homme par défaut pour l'exemple)
          const bmr = 10 * w + 6.25 * h - 5 * a + 5;
          setTdee(Math.round(bmr * activity));
      }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    headerTitle: { color: theme.colors.text, fontWeight: '900', letterSpacing: 1, fontSize: 16 },
    content: { padding: 20 },
    
    resultCard: { alignItems: 'center', backgroundColor: theme.colors.glass, padding: 30, borderRadius: 20, marginBottom: 30, borderWidth: 1, borderColor: theme.colors.primary },
    resultValue: { fontSize: 48, fontWeight: '900', color: theme.colors.primary },
    resultUnit: { color: theme.colors.textSecondary, fontSize: 12, letterSpacing: 1, fontWeight: 'bold' },

    row: { flexDirection: 'row', gap: 15, marginBottom: 20 },
    inputBox: { flex: 1 },
    label: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold', marginBottom: 5, marginLeft: 5 },
    input: { backgroundColor: theme.colors.glass, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, padding: 15, color: theme.colors.text, fontWeight: 'bold', fontSize: 16, textAlign: 'center' },
    
    activityLabel: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
    activityBtn: { padding: 15, borderRadius: 12, backgroundColor: theme.colors.glass, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 8 },
    activityBtnActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '20' },
    activityText: { color: theme.colors.text, fontWeight: '500', fontSize: 12 },

    calcBtn: { width: '100%', borderRadius: 16, overflow: 'hidden', marginTop: 20 },
    btnGradient: { padding: 18, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
    
    goalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, width: '100%' },
    goalItem: { alignItems: 'center' },
    goalVal: { color: theme.colors.text, fontWeight: 'bold', fontSize: 16 },
    goalLabel: { color: theme.colors.textSecondary, fontSize: 10, marginTop: 2 }
  });

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('modules.tdee.title')}</Text>
            <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.resultCard}>
                <Text style={styles.resultValue}>{tdee || '--'}</Text>
                <Text style={styles.resultUnit}>{t('modules.tdee.kcal')}</Text>
                
                {tdee && (
                    <View style={styles.goalRow}>
                        <View style={styles.goalItem}>
                            <Text style={[styles.goalVal, {color: theme.colors.success}]}>{tdee - 500}</Text>
                            <Text style={styles.goalLabel}>{t('modules.tdee.cutting')}</Text>
                        </View>
                        <View style={styles.goalItem}>
                            <Text style={[styles.goalVal, {color: theme.colors.text}]}>{tdee}</Text>
                            <Text style={styles.goalLabel}>{t('modules.tdee.maintenance')}</Text>
                        </View>
                        <View style={styles.goalItem}>
                            <Text style={[styles.goalVal, {color: theme.colors.danger}]}>{tdee + 500}</Text>
                            <Text style={styles.goalLabel}>{t('modules.tdee.bulking')}</Text>
                        </View>
                    </View>
                )}
            </View>

            <View style={styles.row}>
                <View style={styles.inputBox}>
                    <Text style={styles.label}>{t('modules.bmi.input_weight')}</Text>
                    <TextInput style={styles.input} keyboardType="numeric" placeholder="75" placeholderTextColor={theme.colors.textSecondary} value={weight} onChangeText={setWeight} />
                </View>
                <View style={styles.inputBox}>
                    <Text style={styles.label}>{t('modules.bmi.input_height')}</Text>
                    <TextInput style={styles.input} keyboardType="numeric" placeholder="180" placeholderTextColor={theme.colors.textSecondary} value={height} onChangeText={setHeight} />
                </View>
                <View style={styles.inputBox}>
                    <Text style={styles.label}>{t('profile.label_age')}</Text>
                    <TextInput style={styles.input} keyboardType="numeric" placeholder="25" placeholderTextColor={theme.colors.textSecondary} value={age} onChangeText={setAge} />
                </View>
            </View>

            <Text style={styles.activityLabel}>{t('modules.tdee.activity')}</Text>
            {ACTIVITIES.map((act, i) => (
                <TouchableOpacity 
                    key={i} 
                    style={[styles.activityBtn, activity === act.value && styles.activityBtnActive]} 
                    onPress={() => setActivity(act.value)}
                >
                    <Text style={[styles.activityText, activity === act.value && {color: theme.colors.primary, fontWeight:'bold'}]}>
                        {t(act.labelKey)}
                    </Text>
                </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.calcBtn} onPress={calculateTDEE}>
                <LinearGradient colors={[theme.colors.primary, theme.colors.secondary]} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.btnGradient}>
                    <Text style={styles.btnText}>{t('modules.tdee.calculate')}</Text>
                </LinearGradient>
            </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}