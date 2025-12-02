import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme';
import { Audio } from 'expo-av';
import { useTranslation } from 'react-i18next'; // <-- NOUVEL IMPORT

const { width } = Dimensions.get('window');
const TIMER_SIZE = width * 0.7;

export default function TimerScreen() {
    const router = useRouter();
    const theme = useTheme();
    const { t } = useTranslation(); // <-- HOOK
    
    const [mode, setMode] = useState<'REST' | 'TABATA'>('REST');
    const [isRunning, setIsRunning] = useState(false);
    const [time, setTime] = useState(60); 
    
    const [rounds, setRounds] = useState(8);
    const [workTime, setWorkTime] = useState(20);
    const [restTime, setRestTime] = useState(10);
    const [currentRound, setCurrentRound] = useState(1);
    const [isWorkPhase, setIsWorkPhase] = useState(true);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const soundObject = useRef(new Audio.Sound());

    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            soundObject.current.unloadAsync();
        };
    }, []);
    
    const playSound = async () => {
        try {
            await soundObject.current.loadAsync(require('../../assets/sounds/tick.mp3'));
            await soundObject.current.playFromPositionAsync(0);
        } catch (error) {
            console.log("Erreur son:", error);
        }
    };
    
    useEffect(() => {
        if (!isRunning) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }

        intervalRef.current = setInterval(() => {
            setTime(prevTime => {
                if (prevTime > 1) {
                    if (prevTime <= 4) playSound();
                    return prevTime - 1;
                } else {
                    if (mode === 'REST') {
                        setIsRunning(false);
                        return 0;
                    } else {
                        if (isWorkPhase) {
                            if (currentRound < rounds) {
                                setIsWorkPhase(false);
                                return restTime;
                            } else {
                                setIsRunning(false);
                                return 0;
                            }
                        } else {
                            setIsWorkPhase(true);
                            setCurrentRound(prev => prev + 1);
                            return workTime;
                        }
                    }
                }
            });
        }, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning, mode, rounds, workTime, restTime, isWorkPhase, currentRound]);
    
    const formatTime = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleStartStop = () => {
        if (!isRunning && mode === 'TABATA') {
             setTime(workTime);
             setCurrentRound(1);
             setIsWorkPhase(true);
        }
        setIsRunning(prev => !prev);
    };
    
    const handleReset = () => {
        setIsRunning(false);
        setTime(mode === 'REST' ? 60 : workTime);
        setCurrentRound(1);
        setIsWorkPhase(true);
    };

    const styles = StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.colors.bg },
        safeArea: { flex: 1 },
        header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
        backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
        headerTitle: { color: theme.colors.text, fontWeight: '900', letterSpacing: 1, fontSize: 16 },

        modeContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 30, paddingHorizontal: 20 },
        modeBtn: { flex: 1, paddingVertical: 15, alignItems: 'center', borderRadius: 15, marginHorizontal: 5, backgroundColor: theme.colors.glass },
        modeBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary, borderWidth: 1 },
        modeText: { color: theme.colors.textSecondary, fontWeight: 'bold' },
        modeTextActive: { color: '#fff' },

        timerContainer: { justifyContent: 'center', alignItems: 'center', marginVertical: 40 },
        timerCircle: { width: TIMER_SIZE, height: TIMER_SIZE, borderRadius: TIMER_SIZE / 2, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.cardBg, borderWidth: 5, borderColor: theme.colors.primary + '50' },
        timerText: { fontSize: 80, fontWeight: '900', color: theme.colors.text },
        phaseText: { fontSize: 18, fontWeight: 'bold', color: isWorkPhase ? theme.colors.success : theme.colors.danger, marginTop: 10 },
        roundText: { fontSize: 14, color: theme.colors.textSecondary, fontWeight: 'bold' },
        
        commandContainer: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 40 },
        cmdBtn: { paddingVertical: 15, paddingHorizontal: 30, borderRadius: 12, alignItems: 'center' },
        cmdText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

        configContainer: { paddingHorizontal: 20, gap: 15 },
        configRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.colors.glass, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border },
        configLabel: { color: theme.colors.text, fontSize: 14, fontWeight: 'bold' },
        configValue: { color: theme.colors.primary, fontSize: 18, fontWeight: 'bold' },
        configUnit: { color: theme.colors.textSecondary, fontSize: 12, marginLeft: 5 }
    });

    return (
        <View style={styles.container}>
            <StatusBar style={theme.isDark ? "light" : "dark"} />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('timer.title')}</Text> {/* TRADUCTION */}
                    <View style={{ width: 40 }} />
                </View>
                
                <ScrollView>
                    <View style={styles.modeContainer}>
                        <TouchableOpacity 
                            style={[styles.modeBtn, mode === 'REST' && styles.modeBtnActive]}
                            onPress={() => { setMode('REST'); handleReset(); }}
                        >
                            <Text style={[styles.modeText, mode === 'REST' && styles.modeTextActive]}>{t('timer.mode_rest')}</Text> {/* TRADUCTION */}
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.modeBtn, mode === 'TABATA' && styles.modeBtnActive]}
                            onPress={() => { setMode('TABATA'); handleReset(); }}
                        >
                            <Text style={[styles.modeText, mode === 'TABATA' && styles.modeTextActive]}>{t('timer.mode_tabata')}</Text> {/* TRADUCTION */}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.timerContainer}>
                        <View style={[styles.timerCircle, { borderColor: isRunning ? theme.colors.primary : theme.colors.border }]}>
                            <Text style={styles.timerText}>{formatTime(time)}</Text>
                            {mode === 'TABATA' && (
                                <>
                                    <Text style={styles.phaseText}>
                                        {isWorkPhase ? t('timer.work').toUpperCase() : t('timer.rest').toUpperCase()}
                                    </Text>
                                    <Text style={styles.roundText}>
                                        {currentRound} / {rounds} {t('timer.rounds')} {/* TRADUCTION */}
                                    </Text>
                                </>
                            )}
                        </View>
                    </View>
                    
                    <View style={styles.commandContainer}>
                        <TouchableOpacity 
                            style={[styles.cmdBtn, { backgroundColor: isRunning ? theme.colors.danger : theme.colors.success }]}
                            onPress={handleStartStop}
                        >
                            <Text style={styles.cmdText}>
                                {isRunning ? t('timer.stop').toUpperCase() : t('timer.start').toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.cmdBtn, { backgroundColor: theme.colors.textSecondary }]}
                            onPress={handleReset}
                        >
                            <Text style={styles.cmdText}>{t('timer.reset').toUpperCase()}</Text>
                        </TouchableOpacity>
                    </View>

                    {mode === 'TABATA' && (
                        <View style={styles.configContainer}>
                            <View style={styles.configRow}>
                                <Text style={styles.configLabel}>{t('timer.rounds')}</Text>
                                <Text style={styles.configValue}>{rounds}</Text>
                            </View>
                            <View style={styles.configRow}>
                                <Text style={styles.configLabel}>{t('timer.work')}</Text>
                                <Text style={styles.configValue}>{workTime} <Text style={styles.configUnit}>SEC</Text></Text>
                            </View>
                            <View style={styles.configRow}>
                                <Text style={styles.configLabel}>{t('timer.rest')}</Text>
                                <Text style={styles.configValue}>{restTime} <Text style={styles.configUnit}>SEC</Text></Text>
                            </View>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}