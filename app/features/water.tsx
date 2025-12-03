import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';
import { useTranslation } from 'react-i18next'; // Import

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.6;

export default function WaterScreen() {
    const router = useRouter();
    const theme = useTheme();
    const { t } = useTranslation(); // Hook
    const [intake, setIntake] = useState(0);
    const GOAL = 2500;

    const addWater = () => {
        if (Platform.OS !== 'web') Haptics.selectionAsync();
        setIntake(prev => Math.min(prev + 250, GOAL + 500));
    };

    const percentage = Math.min(intake / GOAL, 1);

    const styles = StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.colors.bg },
        safeArea: { flex: 1 },
        header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
        backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
        headerTitle: { color: theme.colors.text, fontWeight: '900', letterSpacing: 1, fontSize: 16 },
        
        content: { alignItems: 'center', justifyContent: 'center', flex: 1 },
        
        circleContainer: { width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: CIRCLE_SIZE/2, borderWidth: 4, borderColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', marginBottom: 50, overflow: 'hidden' },
        waterFill: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#3b82f6', opacity: 0.3 },
        
        value: { fontSize: 48, fontWeight: '900', color: '#3b82f6' },
        unit: { fontSize: 16, color: theme.colors.textSecondary, fontWeight: 'bold' },
        label: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 5, letterSpacing: 2 },

        addBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', shadowColor: '#3b82f6', shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
        addText: { color: '#fff', fontWeight: 'bold', fontSize: 10, marginTop: 5 },

        statsRow: { flexDirection: 'row', width: '100%', paddingHorizontal: 40, justifyContent: 'space-between', marginBottom: 40 },
        statItem: { alignItems: 'center' },
        statVal: { color: theme.colors.text, fontWeight: 'bold', fontSize: 20 },
        statLab: { color: theme.colors.textSecondary, fontSize: 10, letterSpacing: 1, marginTop: 5 },
    });

    return (
        <View style={styles.container}>
            <StatusBar style={theme.isDark ? "light" : "dark"} />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('modules.water.title')}</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.content}>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statVal}>{GOAL/1000}{t('modules.water.unit')}</Text>
                            <Text style={styles.statLab}>{t('modules.water.goal')}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statVal}>{Math.round((intake/GOAL)*100)}%</Text>
                            <Text style={styles.statLab}>{t('modules.water.current')}</Text>
                        </View>
                    </View>

                    <View style={styles.circleContainer}>
                        <View style={[styles.waterFill, { height: `${percentage * 100}%` }]} />
                        <Text style={styles.value}>{intake}</Text>
                        <Text style={styles.unit}>ML</Text>
                    </View>

                    <TouchableOpacity style={styles.addBtn} onPress={addWater}>
                        <MaterialCommunityIcons name="plus" size={32} color="#fff" />
                        <Text style={styles.addText}>+250ml</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}