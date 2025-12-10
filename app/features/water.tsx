import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp, useSharedValue, withSpring } from 'react-native-reanimated';

import { ScreenLayout } from '../../components/ui/ScreenLayout';
import { useTheme } from '../../lib/theme';
import { useNutritionLog } from '../../hooks/useNutritionLog';
import { useNutritionMutations } from '../../hooks/useNutritionMutations';

// --- CONFIGURATION ---
const DAILY_GOAL = 2500; // Objectif 2.5L
const CUP_SIZES = [150, 250, 500];

export default function WaterScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const today = new Date().toISOString().split('T')[0];

  const { data: log, isLoading } = useNutritionLog(today);
  const { addWater } = useNutritionMutations(today);

  const currentAmount = log?.water_ml || 0;
  const progress = Math.min(currentAmount / DAILY_GOAL, 1);
  const percentage = Math.round(progress * 100);

  const waveHeight = useSharedValue(0);
  useEffect(() => {
    waveHeight.value = withSpring(progress * 100, { damping: 15 });
  }, [progress]);

  const handleAdd = (amount: number) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // ✅ CORRECTION ICI : Ajout de "|| null"
    addWater.mutate({ amount, currentLog: log || null });
  };

  // COULEURS LIGHT MODE
  const gaugeBorder = isDark ? '#06b6d430' : '#cffafe';
  const gaugeBg = isDark ? '#000' : '#fff';
  const waterColor = '#06b6d4';
  const btnBg = isDark ? '#1e293b' : '#fff';
  const btnBorder = isDark ? '#334155' : '#e2e8f0';

  return (
    <ScreenLayout>
        <Image 
            source={require('../../assets/adaptive-icon.png')} 
            style={[StyleSheet.absoluteFillObject, { opacity: isDark ? 0.05 : 0.02 }]}
            blurRadius={50}
        />
        
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: isDark ? '#ffffff10' : '#00000005', borderColor: isDark ? 'transparent' : '#e5e7eb', borderWidth: 1 }]}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>HYDRATATION</Text>
            <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 50, flexGrow: 1, justifyContent: 'center' }}>
            
            <Animated.View entering={FadeInUp.springify()} style={{ alignItems: 'center', marginBottom: 40 }}>
                <View style={[styles.gaugeContainer, { borderColor: gaugeBorder, backgroundColor: gaugeBg }]}>
                    <View style={[styles.waterFill, { height: `${percentage}%`, backgroundColor: waterColor }]}>
                         <LinearGradient colors={['rgba(255,255,255,0.3)', 'transparent']} style={{height: 20}} />
                    </View>
                    
                    <View style={styles.gaugeInfo}>
                        <Text style={[styles.percentage, { color: percentage > 50 ? '#fff' : colors.text }]}>
                            {percentage}%
                        </Text>
                        <Text style={[styles.mlText, { color: percentage > 50 ? 'rgba(255,255,255,0.9)' : colors.textSecondary }]}>
                            {currentAmount} / {DAILY_GOAL} ml
                        </Text>
                    </View>
                </View>
            </Animated.View>

            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20 }}>
                {CUP_SIZES.map((size, index) => (
                    <Animated.View key={size} entering={FadeInDown.delay(index * 100).springify()}>
                        <TouchableOpacity 
                            onPress={() => handleAdd(size)}
                            style={[
                                styles.addButton, 
                                { 
                                    backgroundColor: btnBg,
                                    borderColor: btnBorder,
                                    shadowColor: waterColor,
                                    shadowOpacity: isDark ? 0 : 0.1
                                }
                            ]}
                        >
                            <Ionicons name="water" size={24} color={waterColor} />
                            <Text style={[styles.addText, { color: colors.text }]}>+{size}ml</Text>
                        </TouchableOpacity>
                    </Animated.View>
                ))}
            </View>

        </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    marginBottom: 20,
  },
  headerTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  gaugeContainer: {
    width: 220,
    height: 350,
    borderRadius: 110,
    borderWidth: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    position: 'relative',
    shadowColor: "#06b6d4",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  waterFill: {
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  gaugeInfo: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  percentage: { fontSize: 48, fontWeight: '900' },
  mlText: { fontSize: 14, fontWeight: '600', marginTop: 5 },
  addButton: {
    width: 80,
    height: 100,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  addText: { fontSize: 12, fontWeight: 'bold' }
});