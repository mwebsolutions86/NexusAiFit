import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  ScrollView, 
  TouchableOpacity, 
  Platform, 
  Alert, 
  Dimensions,
  Image 
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next'; 

import { useTheme } from '../../lib/theme';
import { ScreenLayout } from '../../components/ui/ScreenLayout';
import { GlassCard } from '../../components/ui/GlassCard';
import { NeonButton } from '../../components/ui/NeonButton';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useBodyMetrics } from '../../hooks/useBodyMetrics';

const MODULE_COLOR = '#10b981'; // Vert Santé

export default function BmiScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  
  // Données
  const { userProfile } = useUserProfile();
  // On spécifie qu'on veut l'historique 'bmi', mais le mutation addMetric reste générique
  const { history, addMetric, isLoading } = useBodyMetrics('bmi');

  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bmi, setBmi] = useState<number | null>(null);

  // Initialisation auto
  useEffect(() => {
      if (userProfile) {
          if (userProfile.weight) setWeight(userProfile.weight.toString());
          if (userProfile.height) setHeight(userProfile.height.toString());
      }
  }, [userProfile]);

  // Animation Jauge
  const cursorPosition = useSharedValue(0);

  const calculate = async () => {
      const w = parseFloat(weight);
      const h = parseFloat(height);

      if (!w || !h) {
          Alert.alert("Données manquantes", "Veuillez entrer votre poids et taille.");
          return;
      }

      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Calcul IMC
      const heightInMeters = h / 100;
      const bmiCalc = w / (heightInMeters * heightInMeters);
      const finalBmi = Math.round(bmiCalc * 10) / 10;

      setBmi(finalBmi);
      
      // Animation Curseur
      const percent = Math.min(Math.max(((finalBmi - 15) / (35 - 15)) * 100, 0), 100);
      cursorPosition.value = withSpring(percent);

      // ✅ CORRECTION ICI : On passe un objet { type, value }
      addMetric.mutate({ type: 'bmi', value: finalBmi });
  };

  const getInterpretation = (val: number) => {
      if (val < 18.5) return { text: "MAIGREUR", color: '#3b82f6' }; 
      if (val < 25) return { text: "NORMAL", color: '#10b981' }; 
      if (val < 30) return { text: "SURPOIDS", color: '#f59e0b' }; 
      return { text: "OBÉSITÉ", color: '#ef4444' }; 
  };

  const interpretation = bmi ? getInterpretation(bmi) : null;
  const cursorStyle = useAnimatedStyle(() => ({ left: `${cursorPosition.value}%` }));
  const statusColor = interpretation?.color || MODULE_COLOR;

  return (
    <ScreenLayout>
        <Image 
            source={require('../../assets/adaptive-icon.png')} 
            style={[StyleSheet.absoluteFillObject, { opacity: isDark ? 0.02 : 0.05, transform: [{scale: 1.5}] }]}
            blurRadius={30}
        />

        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>IMC / BMI</Text>
            <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            
            {/* RÉSULTAT */}
            <GlassCard 
                style={[
                    styles.resultCard, 
                    { 
                        backgroundColor: isDark ? colors.glass : '#FFFFFF',
                        borderColor: interpretation ? interpretation.color : (isDark ? colors.border : 'rgba(0,0,0,0.05)'),
                        shadowColor: statusColor,
                        shadowOpacity: isDark ? 0 : 0.15,
                        shadowRadius: 15,
                        elevation: isDark ? 0 : 5
                    }
                ]}
                intensity={isDark ? 30 : 0}
            >
                {bmi ? (
                    <View style={{ alignItems: 'center', width: '100%' }}>
                        <Text style={[styles.resultValue, { color: colors.text }]}>{bmi}</Text>
                        <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>VOTRE INDICE</Text>
                        
                        <View style={[styles.badge, { backgroundColor: interpretation?.color + '20', borderColor: interpretation?.color }]}>
                            <Text style={[styles.badgeText, { color: interpretation?.color }]}>{interpretation?.text}</Text>
                        </View>

                        <View style={styles.gaugeTrack}>
                            <View style={[styles.gaugeSegment, { backgroundColor: '#3b82f6', flex: 1 }]} /> 
                            <View style={[styles.gaugeSegment, { backgroundColor: '#10b981', flex: 2 }]} /> 
                            <View style={[styles.gaugeSegment, { backgroundColor: '#f59e0b', flex: 1.5 }]} /> 
                            <View style={[styles.gaugeSegment, { backgroundColor: '#ef4444', flex: 1.5 }]} /> 
                            <Animated.View style={[styles.cursor, { borderColor: colors.text }, cursorStyle]}>
                                <View style={{width: 8, height: 8, borderRadius: 4, backgroundColor: colors.text}} />
                            </Animated.View>
                        </View>
                    </View>
                ) : (
                    <View style={{ alignItems: 'center', padding: 20 }}>
                        <MaterialCommunityIcons name="scale-bathroom" size={48} color={MODULE_COLOR} style={{ opacity: 0.5 }} />
                        <Text style={{ color: colors.textSecondary, marginTop: 10 }}>Entrez vos mesures pour calculer.</Text>
                    </View>
                )}
            </GlassCard>

            {/* FORMULAIRE */}
            <View style={styles.formContainer}>
                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={[styles.label, { color: colors.text }]}>POIDS (kg)</Text>
                        <TextInput 
                            style={[
                                styles.input, 
                                { 
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff', 
                                    color: colors.text, 
                                    borderColor: colors.border 
                                }
                            ]}
                            keyboardType="numeric"
                            value={weight}
                            onChangeText={setWeight}
                            placeholder="70"
                            placeholderTextColor={colors.textSecondary}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.label, { color: colors.text }]}>TAILLE (cm)</Text>
                        <TextInput 
                            style={[
                                styles.input, 
                                { 
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff', 
                                    color: colors.text, 
                                    borderColor: colors.border 
                                }
                            ]}
                            keyboardType="numeric"
                            value={height}
                            onChangeText={setHeight}
                            placeholder="175"
                            placeholderTextColor={colors.textSecondary}
                        />
                    </View>
                </View>

                {/* BOUTON (Style Solide forcé en Mode Clair) */}
                <NeonButton 
                    label="CALCULER & SAUVEGARDER" 
                    onPress={calculate} 
                    loading={addMetric.isPending}
                    icon="calculator"
                    style={{ 
                        marginTop: 20, 
                        backgroundColor: isDark ? undefined : MODULE_COLOR,
                        borderColor: isDark ? undefined : MODULE_COLOR,
                    }}
                />
            </View>

            {/* HISTORIQUE */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>HISTORIQUE RÉCENT</Text>
            
            {history && history.length > 0 ? (
                history.map((item: any, index: number) => (
                    <Animated.View key={index} entering={FadeInDown.delay(index * 100)}>
                        <GlassCard 
                            style={[
                                styles.historyRow, 
                                { 
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#fff',
                                    borderColor: isDark ? colors.border : 'rgba(0,0,0,0.05)',
                                    shadowColor: "#000",
                                    shadowOpacity: isDark ? 0 : 0.03,
                                    shadowRadius: 5,
                                    elevation: isDark ? 0 : 1
                                }
                            ]} 
                            intensity={0}
                        >
                            <Text style={{ color: colors.textSecondary }}>{new Date(item.date).toLocaleDateString()}</Text>
                            <View style={{flexDirection:'row', alignItems:'center', gap:5}}>
                                <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 16 }}>{item.value}</Text>
                                <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
                            </View>
                        </GlassCard>
                    </Animated.View>
                ))
            ) : (
                <Text style={{ color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center', marginTop: 20 }}>
                    Aucune donnée enregistrée.
                </Text>
            )}

            <View style={{ height: 50 }} />
        </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 10 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  content: { padding: 20 },

  resultCard: { padding: 25, borderRadius: 24, marginBottom: 25, borderWidth: 1 },
  resultValue: { fontSize: 56, fontWeight: '900', letterSpacing: -2 },
  resultLabel: { fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 15 },
  
  badge: { paddingHorizontal: 15, paddingVertical: 5, borderRadius: 12, borderWidth: 1, marginBottom: 25 },
  badgeText: { fontWeight: '900', fontSize: 12, letterSpacing: 1 },

  gaugeTrack: { flexDirection: 'row', height: 8, width: '100%', borderRadius: 4, overflow: 'visible', marginTop: 10 },
  gaugeSegment: { height: '100%', marginHorizontal: 1, borderRadius: 2 },
  cursor: { position: 'absolute', top: -6, marginLeft: -6, width: 12, height: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderRadius: 4 },

  formContainer: { marginBottom: 30 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 10, fontWeight: 'bold', marginBottom: 8, marginLeft: 5 },
  input: { height: 50, borderRadius: 16, paddingHorizontal: 15, fontSize: 16, fontWeight: 'bold', borderWidth: 1 },

  sectionTitle: { fontSize: 12, fontWeight: '900', marginBottom: 15, marginLeft: 5, letterSpacing: 1 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, marginBottom: 10, borderRadius: 16, borderWidth: 1 },
});