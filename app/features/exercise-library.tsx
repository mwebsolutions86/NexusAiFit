import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Platform, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';
import { EXERCISES_DB } from './exercises_db'; 
import { useTranslation } from 'react-i18next'; // Import

const FILTERS = [
    { id: 'Tous', icon: 'apps', labelKey: 'library.filters.all' },
    { id: 'Pectoraux', icon: 'arm-flex', labelKey: 'library.filters.chest' },
    { id: 'Dos', icon: 'human-handsup', labelKey: 'library.filters.back' }, 
    { id: 'Jambes', icon: 'walk', labelKey: 'library.filters.legs' },
    { id: 'Épaules', icon: 'human-male', labelKey: 'library.filters.shoulders' },
    { id: 'Bras', icon: 'arm-flex-outline', labelKey: 'library.filters.arms' },
    { id: 'Abdominaux', icon: 'human-male-height-variant', labelKey: 'library.filters.abs' }, 
    { id: 'Cardio', icon: 'run', labelKey: 'library.filters.cardio' }
];

export default function ExerciseLibraryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation(); // Hook
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tous');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredExercises = useMemo(() => {
    return EXERCISES_DB.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = activeFilter === 'Tous' || ex.muscle === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [search, activeFilter]);

  const toggleExpand = (id: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setExpandedId(expandedId === id ? null : id);
  };

  const openVideoDemo = (exerciseName: string) => {
      if (Platform.OS !== 'web') Haptics.selectionAsync();
      const query = encodeURIComponent(`${exerciseName} technique musculation execution`);
      const url = `https://www.youtube.com/results?search_query=${query}`;
      Linking.openURL(url);
  };

  const getDifficultyColor = (diff: string) => {
    switch(diff) {
        case 'Débutant': return theme.colors.success; 
        case 'Intermédiaire': return theme.colors.warning; 
        case 'Avancé': return '#f97316'; 
        case 'Expert': return theme.colors.danger; 
        default: return theme.colors.text;
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1 },
    auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
    blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.2 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 15 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    headerTitle: { color: theme.colors.text, fontWeight: '900', letterSpacing: 1, fontSize: 16 },
    headerSub: { color: theme.colors.primary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginTop: 2 },
    searchContainer: { paddingHorizontal: 20, marginBottom: 15 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.glass, borderRadius: 16, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: theme.colors.border, shadowColor: theme.isDark ? 'transparent' : '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: theme.isDark ? 0 : 0.05, shadowRadius: 4, elevation: 2 },
    searchInput: { flex: 1, color: theme.colors.text, marginLeft: 10, fontSize: 16 },
    filtersContent: { paddingHorizontal: 20, gap: 10, paddingBottom: 10 }, 
    filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.colors.glass, borderWidth: 1, borderColor: theme.colors.border, height: 40, justifyContent: 'center' }, 
    filterChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    filterText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: 'bold' },
    filterTextActive: { color: '#fff' },
    listContent: { padding: 20, paddingTop: 5, paddingBottom: 40 },
    card: { borderRadius: 20, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.glass, shadowColor: theme.isDark ? 'transparent' : '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: theme.isDark ? 0 : 0.05, shadowRadius: 4, elevation: 1 },
    cardGradient: { padding: 15 },
    cardExpanded: { borderColor: theme.colors.primary },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: theme.colors.bg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    exName: { color: theme.colors.text, fontSize: 16, fontWeight: 'bold' },
    exSubtitle: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
    badgeText: { fontSize: 9, fontWeight: '900' },
    cardBody: { marginTop: 15 },
    divider: { height: 1, backgroundColor: theme.colors.border, marginBottom: 15 },
    instructionLabel: { color: theme.colors.primary, fontSize: 10, fontWeight: 'bold', marginBottom: 5, letterSpacing: 1 },
    instructionText: { color: theme.colors.text, fontSize: 14, lineHeight: 22 },
    actionsRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
    videoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, backgroundColor: '#ff000015', borderRadius: 12, borderWidth: 1, borderColor: '#ff000040' },
    videoBtnText: { color: '#ff0000', fontWeight: 'bold', fontSize: 12, marginLeft: 8 },
    addBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, backgroundColor: theme.colors.primary + '15', borderRadius: 12, borderWidth: 1, borderColor: theme.colors.primary + '30' },
    addBtnText: { color: theme.colors.primary, fontWeight: 'bold', fontSize: 12, marginLeft: 8 },
    emptyState: { alignItems: 'center', marginTop: 50 },
    emptyText: { color: theme.colors.textSecondary, marginTop: 10, fontWeight: 'bold' },
  });

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      
      {theme.isDark && (
        <View style={styles.auroraBg}>
            <View style={[styles.blob, { top: -100, left: -50, backgroundColor: 'rgba(0, 243, 255, 0.1)' }]} /> 
            <View style={[styles.blob, { bottom: 0, right: -50, backgroundColor: 'rgba(59, 130, 246, 0.1)' }]} />
        </View>
      )}

      <SafeAreaView style={styles.safeArea}>
        
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <View>
                <Text style={styles.headerTitle}>{t('library.title')}</Text>
                <Text style={styles.headerSub}>{filteredExercises.length} {t('library.available')}</Text>
            </View>
            <View style={{ width: 40 }} />
        </View>

        <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
                <TextInput 
                    style={styles.searchInput} 
                    placeholder={t('library.search_ph')} // TRADUCTION
                    placeholderTextColor={theme.colors.textSecondary}
                    value={search}
                    onChangeText={setSearch}
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>
        </View>

        <View style={{ height: 60 }}>
            <FlatList 
                data={FILTERS}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersContent}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={[styles.filterChip, activeFilter === item.id && styles.filterChipActive]}
                        onPress={() => {
                            if (Platform.OS !== 'web') Haptics.selectionAsync();
                            setActiveFilter(item.id);
                        }}
                    >
                        <MaterialCommunityIcons 
                            name={item.icon as any} 
                            size={16} 
                            color={activeFilter === item.id ? '#fff' : theme.colors.textSecondary} 
                            style={{marginRight: 6}}
                        />
                        <Text style={[styles.filterText, activeFilter === item.id && styles.filterTextActive]}>
                            {t(item.labelKey)} {/* TRADUCTION FILTRE */}
                        </Text>
                    </TouchableOpacity>
                )}
            />
        </View>

        <FlatList
            data={filteredExercises}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            renderItem={({ item }) => {
                const isExpanded = expandedId === item.id;
                const diffColor = getDifficultyColor(item.difficulty);

                return (
                    <TouchableOpacity 
                        style={[styles.card, isExpanded && styles.cardExpanded]} 
                        onPress={() => toggleExpand(item.id)}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                             colors={theme.isDark 
                                ? (isExpanded ? ['rgba(0, 243, 255, 0.05)', 'rgba(0, 0, 0, 0)'] : ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.01)'])
                                : ['transparent', 'transparent']
                             }
                             style={styles.cardGradient}
                        >
                            <View style={styles.cardHeader}>
                                <View style={[styles.iconBox, { borderColor: diffColor + '40' }]}>
                                    <MaterialCommunityIcons name="dumbbell" size={20} color={diffColor} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.exName}>{item.name}</Text>
                                    <Text style={styles.exSubtitle}>{item.muscle} • {item.equipment}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <View style={[styles.badge, { backgroundColor: theme.isDark ? diffColor + '20' : diffColor + '15', borderColor: diffColor }]}>
                                        <Text style={[styles.badgeText, { color: diffColor }]}>
                                            {item.difficulty.toUpperCase().slice(0, 3)}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {isExpanded && (
                                <View style={styles.cardBody}>
                                    <View style={styles.divider} />
                                    <Text style={styles.instructionLabel}>{t('library.protocol')}</Text>
                                    <Text style={styles.instructionText}>{item.instructions}</Text>
                                    <View style={styles.actionsRow}>
                                        <TouchableOpacity style={styles.videoBtn} onPress={() => openVideoDemo(item.name)}>
                                            <MaterialCommunityIcons name="youtube" size={20} color="#ff0000" />
                                            <Text style={styles.videoBtnText}>{t('library.btn_video')}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.addBtn}>
                                            <MaterialCommunityIcons name="plus" size={20} color={theme.colors.primary} />
                                            <Text style={styles.addBtnText}>{t('library.btn_add')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                );
            }}
            ListEmptyComponent={
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="dumbbell" size={48} color={theme.colors.textSecondary} />
                    <Text style={styles.emptyText}>{t('library.empty_search')} "{search}"</Text>
                </View>
            }
        />
      </SafeAreaView>
    </View>
  );
}