import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../lib/theme';

// Types complets correspondants à la base de données
interface EditData {
  full_name: string;
  age: string;
  weight: string;
  height: string;
  gender: 'male' | 'female' | '';
  goal: string;
  activity_level: string;
  experience_level: string;
  equipment: string;
  training_days: string;
}

export default function ProfileScreen() {
   const router = useRouter();
   const theme = useTheme();
   const [profile, setProfile] = useState<any>(null);
   const [editing, setEditing] = useState(false);
   const [loading, setLoading] = useState(false);
   const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // État local pour l'édition
  const [editData, setEditData] = useState<EditData>({
    full_name: '', age: '', weight: '', height: '', gender: '',
    goal: '', activity_level: '', experience_level: '', equipment: '', training_days: ''
  });

  useFocusEffect(useCallback(() => { fetchProfile(); }, []));

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();

      if (data) {
        setProfile(data);
        setEditData({
          full_name: data.full_name || '',
          age: data.age?.toString() || '',
          weight: data.weight?.toString() || '',
          height: data.height?.toString() || '',
          gender: data.gender || 'male',
          goal: data.goal || '',
          activity_level: data.activity_level || '',
          experience_level: data.experience_level || '',
          equipment: data.equipment || '',
          training_days: data.training_days?.toString() || '3'
        });
      }
    } catch (error) { console.log('Erreur profil', error); }
  };

  const saveProfile = async () => {
    if (loading) return;
    setLoading(true);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const updates = {
        full_name: editData.full_name,
        age: parseInt(editData.age) || null,
        weight: parseFloat(editData.weight) || null,
        height: parseFloat(editData.height) || null,
        gender: editData.gender,
        goal: editData.goal,
        activity_level: editData.activity_level,
        experience_level: editData.experience_level,
        equipment: editData.equipment,
        training_days: parseInt(editData.training_days) || 3,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').update(updates).eq('id', session.user.id);
      if (error) throw error;
      
      setProfile({ ...profile, ...updates });
      setEditing(false);
      Alert.alert("Succès", "Profil mis à jour.");
    } catch (error: any) {
      Alert.alert('Erreur', 'Impossible de sauvegarder.');
    } finally {
      setLoading(false);
    }
  };

  const updateTier = async (newTier: string) => {
    setShowSubscriptionModal(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await supabase.from('profiles').update({ tier: newTier }).eq('id', session.user.id);
      setProfile({ ...profile, tier: newTier });
      if (newTier === 'PREMIUM') Alert.alert("Bienvenue", "Accès Elite activé.");
    } catch (e) { Alert.alert("Erreur", "Mise à jour impossible."); }
  };

  const handleLogout = () => {
      Alert.alert('Déconnexion', 'Confirmer ?', [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Oui', style: 'destructive', onPress: async () => {
              await supabase.auth.signOut();
              router.replace('/auth/index' as any);
          }}
      ]);
  };

  const isPremium = (profile?.tier || 'FREE') === 'PREMIUM';
  const tierColor = isPremium ? '#FFD700' : theme.colors.textSecondary;
  const currentStyles = styles(theme);

  return (
    <View style={currentStyles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <SafeAreaView style={{flex:1}}>
        <ScrollView contentContainerStyle={currentStyles.content} showsVerticalScrollIndicator={false}>
          
          {/* HEADER */}
          <View style={currentStyles.header}>
            <TouchableOpacity onPress={() => router.back()} style={currentStyles.iconBtn}>
              <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={currentStyles.headerTitle}>MON PROFIL</Text>
            <TouchableOpacity onPress={() => setEditing(!editing)} style={currentStyles.iconBtn}>
              <Ionicons name={editing ? "checkmark" : "pencil"} size={20} color={editing ? theme.colors.success : theme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* IDENTITÉ VISUELLE */}
          <View style={currentStyles.idCard}>
            <LinearGradient 
                colors={isPremium ? ['#FFD700', '#FFA500'] : [theme.colors.border, theme.colors.glass]} 
                style={currentStyles.avatarRing}
            >
                <View style={currentStyles.avatarContainer}>
                    <Text style={currentStyles.avatarText}>
                        {profile?.full_name ? profile.full_name.substring(0, 2).toUpperCase() : 'NX'}
                    </Text>
                </View>
            </LinearGradient>
            <Text style={currentStyles.userName}>{profile?.full_name || 'Utilisateur'}</Text>
            <View style={[currentStyles.badge, {borderColor: tierColor}]}>
                <Text style={[currentStyles.badgeText, {color: tierColor}]}>{isPremium ? 'ELITE MEMBER' : 'STANDARD MEMBER'}</Text>
            </View>
          </View>

          {/* FORMULAIRE COMPLET */}
          <Text style={currentStyles.sectionTitle}>PHYSIQUE & SANTÉ</Text>
          <View style={currentStyles.formContainer}>
              <View style={currentStyles.inputRow}>
                  <View style={{flex:1}}>
                      <Text style={currentStyles.label}>POIDS (KG)</Text>
                      <TextInput style={[currentStyles.input, editing && currentStyles.inputEditable]} value={editData.weight} onChangeText={t => setEditData({...editData, weight: t})} editable={editing} keyboardType="numeric" />
                  </View>
                  <View style={{width:15}}/>
                  <View style={{flex:1}}>
                      <Text style={currentStyles.label}>TAILLE (CM)</Text>
                      <TextInput style={[currentStyles.input, editing && currentStyles.inputEditable]} value={editData.height} onChangeText={t => setEditData({...editData, height: t})} editable={editing} keyboardType="numeric" />
                  </View>
              </View>
              <View style={{marginTop: 15}}>
                  <Text style={currentStyles.label}>ÂGE</Text>
                  <TextInput style={[currentStyles.input, editing && currentStyles.inputEditable]} value={editData.age} onChangeText={t => setEditData({...editData, age: t})} editable={editing} keyboardType="numeric" />
              </View>
          </View>

          <Text style={currentStyles.sectionTitle}>CONFIGURATION SPORTIVE</Text>
          <View style={currentStyles.formContainer}>
              <View style={{marginBottom:15}}>
                  <Text style={currentStyles.label}>NIVEAU D'EXPÉRIENCE</Text>
                  <TextInput style={[currentStyles.input, editing && currentStyles.inputEditable]} value={editData.experience_level} onChangeText={t => setEditData({...editData, experience_level: t})} editable={editing} placeholder="Débutant, Intermédiaire..." placeholderTextColor={theme.colors.textSecondary} />
              </View>
              <View style={{marginBottom:15}}>
                  <Text style={currentStyles.label}>MATÉRIEL DISPONIBLE</Text>
                  <TextInput style={[currentStyles.input, editing && currentStyles.inputEditable]} value={editData.equipment} onChangeText={t => setEditData({...editData, equipment: t})} editable={editing} placeholder="Salle, Maison, Poids du corps..." placeholderTextColor={theme.colors.textSecondary} />
              </View>
              <View style={currentStyles.inputRow}>
                  <View style={{flex:1}}>
                      <Text style={currentStyles.label}>OBJECTIF</Text>
                      <TextInput style={[currentStyles.input, editing && currentStyles.inputEditable]} value={editData.goal} onChangeText={t => setEditData({...editData, goal: t})} editable={editing} />
                  </View>
                  <View style={{width:15}}/>
                  <View style={{flex:1}}>
                      <Text style={currentStyles.label}>SÉANCES / SEM</Text>
                      <TextInput style={[currentStyles.input, editing && currentStyles.inputEditable]} value={editData.training_days} onChangeText={t => setEditData({...editData, training_days: t})} editable={editing} keyboardType="numeric" />
                  </View>
              </View>
          </View>

          {editing && (
            <TouchableOpacity style={currentStyles.saveBtn} onPress={saveProfile} disabled={loading}>
                <Text style={currentStyles.saveBtnText}>{loading ? 'SAUVEGARDE...' : 'ENREGISTRER LES MODIFICATIONS'}</Text>
            </TouchableOpacity>
          )}

          {/* ABONNEMENT */}
          <Text style={currentStyles.sectionTitle}>ABONNEMENT</Text>
          <TouchableOpacity activeOpacity={0.9} onPress={() => setShowSubscriptionModal(true)} style={currentStyles.subCard}>
            <LinearGradient colors={isPremium ? ['#FFD700', '#B8860B'] : [theme.colors.glass, theme.colors.cardBg]} start={{x:0, y:0}} end={{x:1, y:1}} style={currentStyles.subGradient}>
                <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                    <MaterialCommunityIcons name="check-decagram" size={24} color={isPremium ? '#FFF' : theme.colors.textSecondary} />
                    <Text style={[currentStyles.subPrice, isPremium && {color:'#FFF'}]}>{isPremium ? '5.99€' : 'GRATUIT'}</Text>
                </View>
                <View>
                    <Text style={[currentStyles.subName, isPremium && {color:'#FFF'}]}>{isPremium ? 'NEXUS ELITE' : 'DÉCOUVERTE'}</Text>
                    <Text style={[currentStyles.subDesc, isPremium && {color:'rgba(255,255,255,0.8)'}]}>{isPremium ? 'Accès illimité' : 'Accès limité. Touchez pour upgrader.'}</Text>
                </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* ACTIONS */}
          <Text style={currentStyles.sectionTitle}>PARAMÈTRES</Text>
          <View style={currentStyles.settingsContainer}>
              <TouchableOpacity style={currentStyles.settingRow} onPress={theme.toggleTheme}>
                  <Text style={currentStyles.settingText}>Mode Sombre / Clair</Text>
                  <Ionicons name={theme.isDark ? "moon" : "sunny"} size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={currentStyles.settingRow} onPress={() => router.push('/profile/support')}>
                  <Text style={currentStyles.settingText}>Support & Aide</Text>
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={currentStyles.settingRow} onPress={() => router.push('/profile/legal')}>
                  <Text style={currentStyles.settingText}>Mentions Légales & CGU</Text>
                  <Ionicons name="document-text-outline" size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={[currentStyles.settingRow, {borderBottomWidth:0}]} onPress={handleLogout}>
                  <Text style={[currentStyles.settingText, {color: theme.colors.danger}]}>Déconnexion</Text>
                  <MaterialCommunityIcons name="logout" size={18} color={theme.colors.danger} />
              </TouchableOpacity>
          </View>

          <View style={{height: 50}}/>
        </ScrollView>

        {/* MODAL */}
        <Modal animationType="fade" transparent={true} visible={showSubscriptionModal} onRequestClose={() => setShowSubscriptionModal(false)}>
            <View style={currentStyles.modalOverlay}>
                <View style={currentStyles.modalContainer}>
                    <Text style={currentStyles.modalTitle}>CHOISIR VOTRE NIVEAU</Text>
                    <TouchableOpacity style={currentStyles.planOption} onPress={() => updateTier('FREE')}>
                        <Text style={{color: theme.colors.textSecondary, fontWeight:'bold'}}>DÉCOUVERTE (Gratuit)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[currentStyles.planOption, {borderColor: '#FFD700', backgroundColor: theme.isDark ? '#FFD70020' : '#FFF8E1'}]} onPress={() => updateTier('PREMIUM')}>
                        <Text style={{color: '#FFD700', fontWeight:'bold'}}>ELITE (5.99€/mois)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{marginTop:15}} onPress={() => setShowSubscriptionModal(false)}>
                        <Text style={{color: theme.colors.textSecondary}}>Annuler</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = (theme: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
    iconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    headerTitle: { color: theme.colors.text, fontSize: 14, fontWeight: '900', letterSpacing: 2 },
    content: { padding: 20, paddingTop: 0 },
    idCard: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
    avatarRing: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    avatarContainer: { width: 94, height: 94, borderRadius: 47, backgroundColor: theme.colors.bg, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 32, fontWeight: '900', color: theme.colors.text },
    userName: { fontSize: 24, fontWeight: 'bold', color: theme.colors.text, marginBottom: 5 },
    badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
    badgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    sectionTitle: { fontSize: 11, fontWeight: '900', color: theme.colors.textSecondary, marginBottom: 12, letterSpacing: 1.5, marginLeft: 5 },
    subCard: { height: 140, borderRadius: 20, overflow: 'hidden', marginBottom: 30 },
    subGradient: { flex: 1, padding: 20, justifyContent: 'space-between' },
    subPrice: { fontSize: 18, fontWeight: '900', color: theme.colors.text },
    subName: { fontSize: 22, fontWeight: 'bold', color: theme.colors.text, letterSpacing: 1 },
    subDesc: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 5 },
    formContainer: { backgroundColor: theme.colors.glass, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 30 },
    inputRow: { flexDirection: 'row' },
    label: { fontSize: 10, fontWeight: 'bold', color: theme.colors.textSecondary, marginBottom: 8, marginLeft: 2 },
    input: { backgroundColor: theme.colors.bg, borderRadius: 12, padding: 12, color: theme.colors.textSecondary, fontSize: 14, borderWidth: 1, borderColor: 'transparent' },
    inputEditable: { borderColor: theme.colors.primary, color: theme.colors.text, borderWidth: 1 },
    saveBtn: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 30 },
    saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
    settingsContainer: { backgroundColor: theme.colors.glass, borderRadius: 20, paddingHorizontal: 20, borderWidth: 1, borderColor: theme.colors.border },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    settingText: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
    modalContainer: { width: '85%', backgroundColor: theme.colors.cardBg, borderRadius: 24, padding: 25, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    modalTitle: { fontSize: 16, fontWeight: '900', color: theme.colors.text, marginBottom: 20, letterSpacing: 1 },
    planOption: { width: '100%', padding: 15, borderRadius: 12, borderWidth: 1, alignItems: 'center', marginBottom: 10 },
});