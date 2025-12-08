import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Platform, 
  Dimensions, 
  Modal,
  Image,
  Alert,
  KeyboardAvoidingView 
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next'; 
import type { ComponentProps } from 'react';

// Architecture Nexus V1
import { useTheme } from '../../lib/theme';
import { ScreenLayout } from '../../components/ui/ScreenLayout';
import { GlassCard } from '../../components/ui/GlassCard';
import { NeonButton } from '../../components/ui/NeonButton';
import { useBodyMetrics, MetricType } from '../../hooks/useBodyMetrics';

const { width } = Dimensions.get('window');
const MODULE_COLOR = '#8b5cf6'; // Violet pour la Biométrie
const CARD_WIDTH = width * 0.85; 

// FIX TYPING
type MciName = ComponentProps<typeof MaterialCommunityIcons>['name'];
type BodyPartItem = { id: MetricType, label: string, icon: MciName, group: 'trunk' | 'arms' | 'legs' };

// Configuration des zones du corps
const BODY_PARTS: BodyPartItem[] = [
    { id: 'waist', label: 'Taille', icon: 'tape-measure', group: 'trunk' },
    { id: 'chest', label: 'Poitrine', icon: 'tshirt-crew-outline', group: 'trunk' },
    { id: 'hips', label: 'Hanches', icon: 'human-handsdown', group: 'trunk' },
    { id: 'neck', label: 'Cou', icon: 'human-male-height', group: 'trunk' },
    { id: 'shoulders', label: 'Épaules', icon: 'human-male', group: 'trunk' },

    { id: 'biceps', label: 'Biceps', icon: 'arm-flex', group: 'arms' },
    { id: 'forearms', label: 'Avant-bras', icon: 'hand-back-right', group: 'arms' },

    { id: 'thighs', label: 'Cuisses', icon: 'run', group: 'legs' },
    { id: 'calves', label: 'Mollets', icon: 'foot-print', group: 'legs' },
];

const BODY_SECTIONS = [
    { id: 'trunk', title: 'TRONC & CORE', icon: 'shield' as MciName },
    { id: 'arms', title: 'MEMBRES SUPÉRIEURS', icon: 'arm-flex-outline' as MciName },
    { id: 'legs', title: 'MEMBRES INFÉRIEURS', icon: 'shoe-sneaker' as MciName },
];


// --- COMPOSANT : MODAL HISTORIQUE ---
const HistoryDetailModal = ({ type, label, onClose }: { type: MetricType, label: string, onClose: () => void }) => {
    const { colors, isDark } = useTheme();
    const { history, isLoading } = useBodyMetrics(type); 

    return (
        <Modal visible={true} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.historyModalOverlay}>
                <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                
                <GlassCard style={[styles.historyModalContent, { backgroundColor: isDark ? '#111' : '#FFF', borderColor: colors.border }]} intensity={80}>
                    <View style={styles.historyModalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.textSecondary }]}>HISTORIQUE</Text>
                        <TouchableOpacity onPress={onClose} style={{padding: 5}}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.historySubtitle, { color: MODULE_COLOR }]}>{label.toUpperCase()}</Text>

                    <ScrollView style={{maxHeight: width * 0.9, marginTop: 15}} showsVerticalScrollIndicator={false}>
                        {isLoading ? (
                            <Text style={{color: colors.textSecondary, textAlign: 'center', paddingVertical: 20}}>Chargement...</Text>
                        ) : history && history.length > 0 ? (
                            history.map((item: any, index: number) => (
                                <View key={index} style={[styles.historyDetailRow, { borderBottomColor: colors.border, borderBottomWidth: index === history.length -1 ? 0 : 1 }]}>
                                    <Text style={{ color: colors.text, opacity: 0.8 }}>{new Date(item.date).toLocaleDateString()}</Text>
                                    <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 16 }}>{item.value} cm</Text>
                                </View>
                            ))
                        ) : (
                            <Text style={{color: colors.textSecondary, textAlign: 'center', fontStyle: 'italic', paddingVertical: 20}}>Aucune mesure trouvée.</Text>
                        )}
                    </ScrollView>
                </GlassCard>
            </View>
        </Modal>
    );
};

// --- COMPOSANT : CARTE DE MESURE EN PLACE ---
const MeasurementCard = ({ part, latestValue, addMetric, setHistoryModalType, isLastInCarousel }: any) => {
    const { colors, isDark } = useTheme();
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<TextInput>(null);

    // Effet de focus pour le clavier
    useEffect(() => {
        if (isEditing) {
            setInputValue(latestValue ? String(latestValue) : '');
            setTimeout(() => inputRef.current?.focus(), 100); 
        }
    }, [isEditing, latestValue]);

    const handleSave = () => {
        const val = parseFloat(inputValue.replace(',', '.'));
        if (isNaN(val) || val <= 0) {
            Alert.alert("Erreur", "Valeur invalide");
            return;
        }
        
        addMetric.mutate({ type: part.id, value: val }, {
             onSuccess: () => {
                 if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                 setIsEditing(false); // Ferme l'édition
             },
             onError: (e: Error) => { 
                 Alert.alert("Échec de l'enregistrement", e.message || "Problème de connexion/base de données.");
             }
        });
    };

    const handleOpenEdit = () => {
        if (Platform.OS !== 'web') Haptics.selectionAsync();
        setIsEditing(true);
    };

    return (
        <Animated.View 
            layout={Layout.springify()} 
            style={[styles.carouselCardWrapper, { marginRight: isLastInCarousel ? 40 : 15 }]} 
        >
            <GlassCard 
                style={[
                    styles.fullWidthCard, 
                    { 
                        backgroundColor: isDark ? colors.glass : '#FFFFFF',
                        borderColor: isEditing ? MODULE_COLOR : (isDark ? colors.border : 'rgba(0,0,0,0.05)'),
                    }
                ]}
                intensity={isDark ? 20 : 0}
            >
                {!isEditing ? (
                    // MODE AFFICHAGE
                    <View style={styles.cardDisplayContent}>
                        <View style={[styles.iconBox, { backgroundColor: MODULE_COLOR + '15' }]}>
                            <MaterialCommunityIcons name={part.icon} size={30} color={MODULE_COLOR} />
                        </View>
                        
                        <View style={{flex: 1, paddingHorizontal: 15}}>
                            <Text style={[styles.partLabelLarge, { color: colors.textSecondary }]}>{part.label.toUpperCase()}</Text>
                            <Text style={[styles.partValueLarge, { color: colors.text }]}>
                                {latestValue ? `${latestValue} cm` : '--'}
                            </Text>
                        </View>
                        
                        {/* Actions à Droite */}
                        <View style={{flexDirection: 'row', gap: 10}}>
                            {latestValue && (
                                <TouchableOpacity onPress={() => setHistoryModalType(part.id, part.label)} style={[styles.cardActionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6' }]}>
                                    <MaterialCommunityIcons name="history" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={handleOpenEdit} style={[styles.cardActionBtn, { backgroundColor: MODULE_COLOR + '20' }]}>
                                <Ionicons name="add" size={20} color={MODULE_COLOR} />
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    // MODE ÉDITION (In-Place)
                    <View style={styles.editModeContainer}>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                             <Text style={[styles.partLabelLarge, { color: MODULE_COLOR, marginBottom: 10 }]}>{part.label.toUpperCase()}</Text>
                             <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.cancelBtn}>
                                <Ionicons name="close" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputRowContainer}>
                            <TextInput
                                ref={inputRef}
                                style={[styles.editInput, { color: isDark ? '#FFF' : '#000', borderBottomColor: MODULE_COLOR }]}
                                placeholder="0.0"
                                placeholderTextColor={colors.textSecondary}
                                keyboardType="numeric"
                                value={inputValue}
                                onChangeText={setInputValue}
                                returnKeyType="done"
                            />
                            <Text style={[styles.unitLarge, { color: colors.textSecondary }]}>cm</Text>
                        </View>
                        
                        {/* ✅ Bouton Enregistrer (Visible et Actif) */}
                        <NeonButton
                            label="ENREGISTRER"
                            onPress={handleSave}
                            style={{
                                backgroundColor: isDark ? undefined : MODULE_COLOR,
                                borderColor: isDark ? undefined : MODULE_COLOR
                            }}
                        />
                    </View>
                )}
            </GlassCard>
        </Animated.View>
    );
};


export default function BodyScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  
  const { latestMetrics, addMetric } = useBodyMetrics(); 

  // Gestion de la Modal d'Historique
  const [historyModalType, setHistoryModalType] = useState<MetricType | null>(null);
  const [historyModalLabel, setHistoryModalLabel] = useState<string>('');

  const handleSetHistoryModal = (type: MetricType, label: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setHistoryModalType(type);
    setHistoryModalLabel(label);
  };

  const getPartsByGroup = (groupId: 'trunk' | 'arms' | 'legs') => {
    return BODY_PARTS.filter((p: BodyPartItem) => p.group === groupId);
  };
  
  return (
    <ScreenLayout>
        {/* FOND ADAPTATIF */}
        <Image 
            source={require('../../assets/adaptive-icon.png')} 
            style={[StyleSheet.absoluteFillObject, { opacity: isDark ? 0.02 : 0.05, transform: [{scale: 1.5}] }]}
            blurRadius={30}
        />

        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            {/* HEADER STANDARD */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>MENSURATIONS</Text>
                
                {/* BOUTON HISTORIQUE GLOBAL (Dummy pour l'alignement) */}
                <View style={{width: 40}} /> 
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                
                {BODY_SECTIONS.map((section, sectionIndex) => {
                    const parts = getPartsByGroup(section.id as 'trunk' | 'arms' | 'legs');
                    if (parts.length === 0) return null;

                    return (
                        <View key={section.id} style={styles.sectionContainer}>
                            {/* Titre de Section */}
                            <View style={styles.sectionHeader}>
                                <MaterialCommunityIcons name={section.icon} size={16} color={MODULE_COLOR} />
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
                            </View>

                            {/* Carousel Horizontal */}
                            <ScrollView 
                                horizontal 
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingHorizontal: 20, gap: 15 }}
                                decelerationRate="fast"
                                snapToInterval={CARD_WIDTH + 15}
                            >
                                {parts.map((part: BodyPartItem, index: number) => (
                                    <MeasurementCard 
                                        key={part.id}
                                        part={part}
                                        latestValue={latestMetrics?.[part.id]}
                                        addMetric={addMetric}
                                        setHistoryModalType={handleSetHistoryModal} 
                                        isLastInCarousel={index === parts.length - 1}
                                    />
                                ))}
                            </ScrollView>
                        </View>
                    );
                })}

                <View style={{ height: 50 }} />

            </ScrollView>
        </KeyboardAvoidingView>
        
        {/* MODAL HISTORIQUE (S'affiche par-dessus l'écran) */}
        {historyModalType && (
            <HistoryDetailModal 
                type={historyModalType}
                label={historyModalLabel}
                onClose={() => setHistoryModalType(null)}
            />
        )}

    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 10 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  content: { paddingBottom: 20 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  
  // Sections
  sectionContainer: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, marginBottom: 15 },
  sectionTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 1, color: '#fff' },

  // Cards & Carousel
  carouselCardWrapper: { width: CARD_WIDTH },
  fullWidthCard: { padding: 20, borderRadius: 20, height: 180, justifyContent: 'space-between', borderWidth: 1 },
  
  cardDisplayContent: { flex: 1, justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center' },
  cardActionBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },

  iconBox: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  partLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  partLabelLarge: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  partValueLarge: { fontSize: 32, fontWeight: '900' },
  
  addBtn: { position: 'absolute', top: 15, right: 15, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  
  // --- EDIT MODE STYLES ---
  editModeContainer: { flex: 1, justifyContent: 'space-between', paddingVertical: 5 },
  inputRowContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: MODULE_COLOR, paddingBottom: 5, marginBottom: 20 },
  editInput: { fontSize: 36, fontWeight: '900', textAlign: 'center', minWidth: 100, padding: 0 }, 
  unitSmall: { fontSize: 14, fontWeight: 'bold', marginBottom: 5, marginLeft: 5 },
  unitLarge: { fontSize: 16, fontWeight: 'bold', marginBottom: 5, marginLeft: 5 },
  
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 5 },
  
  // --- HISTORY MODAL STYLES ---
  historyModalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  historyModalContent: { width: width * 0.9, padding: 20, borderRadius: 24, borderWidth: 1 },
  historyModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  historySubtitle: { fontSize: 16, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
  historyDetailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  modalTitle: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1 }, 
});