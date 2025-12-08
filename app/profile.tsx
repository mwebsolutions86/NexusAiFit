import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Modal, 
  TextInput,
  Platform, 
  Alert,
  ActionSheetIOS,
  KeyboardAvoidingView,
  Linking,
  Switch // ✅ Import Switch
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../lib/theme';
import { useUserProfile } from '../hooks/useUserProfile';
import { supabase } from '../lib/supabase';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { GlassCard } from '../components/ui/GlassCard';

// --- COMPOSANT LIGNE (Mis à jour avec Switch) ---
const SettingRow = ({ label, value, icon, color, isLast, onPress, type = 'value', switchValue }: any) => {
    const { colors } = useTheme();
    return (
        <TouchableOpacity 
            onPress={type === 'switch' ? onPress : onPress} 
            activeOpacity={type === 'switch' ? 1 : 0.7} // Pas d'effet clic sur le switch container
            style={[styles.row, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
        >
            <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
                <MaterialCommunityIcons name={icon} size={20} color={color} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {type === 'value' && <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{value}</Text>}
                {type === 'danger' && <Text style={[styles.rowValue, { color: colors.danger }]}>{value}</Text>}
                {type === 'link' && <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />}
                {type === 'editable' && (
                    <>
                        <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{value}</Text>
                        <MaterialCommunityIcons name="pencil" size={14} color={colors.primary} style={{opacity:0.5}} />
                    </>
                )}
                
                {/* ✅ NOUVEAU TYPE : SWITCH */}
                {type === 'switch' && (
                    <Switch 
                        value={switchValue}
                        onValueChange={() => {
                            if(Platform.OS !== 'web') Haptics.selectionAsync();
                            onPress();
                        }}
                        trackColor={{ false: '#767577', true: colors.primary }}
                        thumbColor={'#fff'}
                    />
                )}
            </View>
        </TouchableOpacity>
    );
};

// --- COMPOSANT GROUPE ---
const SettingGroup = ({ title, children }: any) => {
    const { colors } = useTheme();
    return (
        <View style={styles.groupContainer}>
            {title && <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>{title}</Text>}
            <GlassCard style={[styles.groupCard, {backgroundColor: colors.glass, borderColor: colors.border}]} intensity={20}>
                {children}
            </GlassCard>
        </View>
    );
};

export default function ProfileScreen() {
  // ✅ Récupération du toggle et de l'état actuel
  const { colors, toggleTheme, isDark } = useTheme();
  const router = useRouter();
  const { userProfile, refetch, isLoading } = useUserProfile();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<{key: string, label: string, val: string} | null>(null);
  const [tempValue, setTempValue] = useState('');

  // --- ACTIONS ---

  const handleEdit = (key: string, label: string, val: any) => {
      if (Platform.OS !== 'web') Haptics.selectionAsync();
      setEditingField({ key, label, val: String(val) });
      setTempValue(String(val || ''));
      setModalVisible(true);
  };

  const saveEdit = async () => {
      if (!editingField || !userProfile) return;
      try {
          const updates: any = { [editingField.key]: tempValue };
          if (['weight', 'height', 'age'].includes(editingField.key)) {
              updates[editingField.key] = parseFloat(tempValue);
          }
          await supabase.from('profiles').update(updates).eq('id', userProfile.id);
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          refetch();
          setModalVisible(false);
      } catch (e) { Alert.alert("Erreur", "Mise à jour impossible."); }
  };

  const showActionSheet = (field: string, options: string[]) => {
      if (Platform.OS === 'ios') {
          ActionSheetIOS.showActionSheetWithOptions(
            { options: [...options, 'Annuler'], cancelButtonIndex: options.length },
            async (buttonIndex) => {
                if (buttonIndex < options.length) {
                    await supabase.from('profiles').update({ [field]: options[buttonIndex] }).eq('id', userProfile?.id);
                    refetch();
                }
            }
          );
      } else {
          handleEdit(field, field.toUpperCase(), userProfile?.[field]);
      }
  };

  const handleExportData = () => {
      Alert.alert("Exportation", "Données envoyées par email (Simulation).");
  };

  const handleDeleteAccount = async () => {
      Alert.alert("⚠ ZONE DE DANGER", "Suppression définitive.", [
          { text: "Annuler", style: "cancel" },
          { text: "SUPPRIMER", style: "destructive", onPress: async () => { await supabase.auth.signOut(); router.replace('/(auth)/login' as any); } }
      ]);
  };

  const handleSignOut = async () => {
      Alert.alert("Déconnexion", "Quitter Nexus ?", [
          { text: "Annuler", style: "cancel" },
          { text: "Déconnexion", style: "destructive", onPress: async () => { await supabase.auth.signOut(); router.replace('/'); } }
      ]);
  };

  const openUrl = (url: string) => {
      Linking.openURL(url).catch(() => Alert.alert("Erreur", "Lien invalide."));
  };

  if (isLoading || !userProfile) return <View />;

  return (
    <ScreenLayout>
        {/* Image de fond adaptative (Visible en Light, subtile en Dark) */}
        <Image 
            source={require('../assets/adaptive-icon.png')} 
            style={[StyleSheet.absoluteFillObject, { opacity: isDark ? 0.05 : 0.02, transform: [{scale: 1.5}] }]}
            blurRadius={30}
        />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            {/* HEADER */}
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <LinearGradient colors={[colors.primary, isDark ? '#000' : '#ccc']} style={styles.avatarBorder}>
                        <View style={[styles.avatarInner, { backgroundColor: isDark ? '#1a1a1a' : '#f0f0f0', borderColor: isDark ? '#000' : '#fff' }]}>
                            <Text style={[styles.avatarInitial, { color: colors.text }]}>{userProfile.full_name?.charAt(0) || 'U'}</Text>
                        </View>
                    </LinearGradient>
                    <View style={[styles.proBadge, { borderColor: isDark ? '#000' : '#fff' }]}>
                        <Text style={styles.proText}>{userProfile.tier || 'BASIC'}</Text>
                    </View>
                </View>
                <Text style={[styles.userName, { color: colors.text }]}>{userProfile.full_name}</Text>
                <Text style={[styles.userEmail, { color: colors.textSecondary }]}>ID: {userProfile.id.slice(0, 8).toUpperCase()}</Text>
            </View>

            {/* BIOMÉTRIE */}
            <SettingGroup title="DONNÉES BIOMÉTRIQUES">
                <SettingRow label="Poids" value={`${userProfile.weight || '--'} kg`} icon="scale-bathroom" color="#f43f5e" onPress={() => handleEdit('weight', 'Poids (kg)', userProfile.weight)} type="editable" />
                <SettingRow label="Taille" value={`${userProfile.height || '--'} cm`} icon="human-male-height" color="#3b82f6" onPress={() => handleEdit('height', 'Taille (cm)', userProfile.height)} type="editable" />
                <SettingRow label="Âge" value={`${userProfile.age || '--'} ans`} icon="calendar-account" color="#10b981" onPress={() => handleEdit('age', 'Âge', userProfile.age)} type="editable" />
                <SettingRow label="Sexe" value={userProfile.gender || 'Non défini'} icon="gender-male-female" color="#8b5cf6" isLast onPress={() => showActionSheet('gender', ['Homme', 'Femme'])} type="link" />
            </SettingGroup>

            {/* OBJECTIFS */}
            <SettingGroup title="OBJECTIFS TACTIQUES">
                <SettingRow label="Objectif" value={userProfile.goal || 'Non défini'} icon="target" color={colors.primary} onPress={() => showActionSheet('goal', ['Prise de masse', 'Perte de poids', 'Maintien'])} type="link" />
                <SettingRow label="Activité" value={userProfile.activity_level || 'Moyen'} icon="run" color="#f59e0b" isLast onPress={() => showActionSheet('activity_level', ['Sédentaire', 'Actif', 'Athlète'])} type="link" />
            </SettingGroup>

            {/* STATUT */}
            <SettingGroup title="STATUT NEXUS">
                <SettingRow label="Plan Actuel" value={(userProfile.tier || 'GRATUIT').toUpperCase()} icon="star-face" color="#FFD700" type="link" onPress={() => router.push('/subscription' as any)} />
                <SettingRow label="Restaurer" value="" icon="restore" color={colors.textSecondary} isLast onPress={() => Alert.alert("Info", "Restauration...")} type="link" />
            </SettingGroup>

            {/* APPLICATION & THÈME */}
            <SettingGroup title="APPLICATION">
                {/* ✅ LE BOUTON MODE SOMBRE EST ICI */}
                <SettingRow 
                    label="Mode Sombre" 
                    value="" 
                    icon="theme-light-dark" 
                    color={colors.text} 
                    type="switch" 
                    switchValue={isDark} 
                    onPress={toggleTheme} 
                />
                <SettingRow label="Notifications" value="Activé" icon="bell-ring" color={colors.text} type="link" />
                <SettingRow label="Unités" value="Métrique" icon="ruler" color={colors.text} isLast type="link" />
            </SettingGroup>

            {/* LEGAL & AIDE */}
            <SettingGroup title="LÉGAL & AIDE">
                <SettingRow label="Support Client" value="" icon="lifebuoy" color={colors.text} type="link" onPress={() => router.push('/profile/support' as any)} />
                <SettingRow label="Mentions Légales" value="CGU & Confidentialité" icon="file-document-outline" color={colors.textSecondary} isLast type="link" onPress={() => router.push('/profile/legal' as any)} />
            </SettingGroup>

            {/* DANGER */}
            <SettingGroup title="DONNÉES & SÉCURITÉ">
                <SettingRow label="Exporter" value="JSON" icon="database-export" color={colors.primary} type="link" onPress={handleExportData} />
                <SettingRow label="Supprimer compte" value="" icon="delete-alert" color={colors.danger} isLast type="danger" onPress={handleDeleteAccount} />
            </SettingGroup>

            <TouchableOpacity onPress={handleSignOut} style={[styles.logoutBtn, { borderColor: colors.danger + '50', backgroundColor: colors.danger + '10' }]}>
                <Text style={[styles.logoutText, { color: colors.danger }]}>DÉCONNEXION</Text>
            </TouchableOpacity>
            
            <View style={[styles.disclaimerBox, { borderTopColor: colors.border }]}>
                <MaterialCommunityIcons name="alert-decagram" size={16} color={colors.textSecondary} style={{marginBottom: 5}} />
                <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
                    AVERTISSEMENT SYSTÈME : NEXUS est une IA d'assistance. Consultez un médecin avant tout programme.
                </Text>
            </View>

            <Text style={[styles.versionText, { color: colors.textSecondary }]}>NEXUS v1.0.0 • BUILD 2024</Text>
            <View style={{height: 100}} />

        </ScrollView>

        {/* MODALE */}
        <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
            <View style={styles.modalOverlay}>
                <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
                    <GlassCard style={[styles.modalContent, { backgroundColor: isDark ? '#111' : '#fff' }]} intensity={80}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>MODIFIER</Text>
                        <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>{editingField?.label}</Text>
                        <TextInput 
                            style={[styles.modalInput, { color: colors.primary, borderColor: colors.primary }]}
                            value={tempValue} onChangeText={setTempValue} autoFocus
                            keyboardType={['weight', 'height', 'age'].includes(editingField?.key || '') ? 'numeric' : 'default'}
                            selectionColor={colors.primary}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalBtn}><Text style={{color: colors.textSecondary}}>Annuler</Text></TouchableOpacity>
                            <TouchableOpacity onPress={saveEdit} style={[styles.modalBtn, { backgroundColor: colors.primary + '20', borderRadius: 8 }]}><Text style={{color: colors.primary, fontWeight: 'bold'}}>Sauvegarder</Text></TouchableOpacity>
                        </View>
                    </GlassCard>
                </KeyboardAvoidingView>
            </View>
        </Modal>

    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 20 },
  header: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  avatarContainer: { marginBottom: 15 },
  avatarBorder: { width: 100, height: 100, borderRadius: 50, padding: 3, justifyContent: 'center', alignItems: 'center' },
  avatarInner: { width: '100%', height: '100%', borderRadius: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 4 },
  avatarInitial: { fontSize: 40, fontWeight: '900' },
  proBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#FFD700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 2 },
  proText: { fontSize: 10, fontWeight: '900', color: '#000' },
  userName: { fontSize: 24, fontWeight: '900', letterSpacing: 0.5 },
  userEmail: { fontSize: 12, marginTop: 2, opacity: 0.6, letterSpacing: 1 },

  groupContainer: { marginBottom: 25 },
  groupTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 2, marginBottom: 8, marginLeft: 15, opacity: 0.7 },
  groupCard: { padding: 0, borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  iconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  rowLabel: { fontSize: 15, fontWeight: '500', flex: 1 },
  rowValue: { fontSize: 15, marginRight: 5 },

  logoutBtn: { padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, marginTop: 10 },
  logoutText: { fontWeight: '900', letterSpacing: 1 },
  
  disclaimerBox: { marginTop: 30, padding: 20, alignItems: 'center', borderTopWidth: 1 },
  disclaimerText: { fontSize: 10, textAlign: 'center', lineHeight: 14, opacity: 0.6 },

  versionText: { textAlign: 'center', fontSize: 9, marginTop: 10, letterSpacing: 2, opacity: 0.5 },

  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  keyboardView: { width: '100%', alignItems: 'center' },
  modalContent: { width: '85%', padding: 25, borderRadius: 24 },
  modalTitle: { fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 5 },
  modalLabel: { fontSize: 12, textAlign: 'center', marginBottom: 20 },
  modalInput: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', borderBottomWidth: 2, padding: 10, marginBottom: 25 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  modalBtn: { padding: 12, flex: 1, alignItems: 'center' },
});