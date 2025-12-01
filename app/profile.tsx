import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../lib/theme';

interface EditData {
  full_name: string;
  age: string;
  weight: string;
  height: string;
  goal: string;
  activity_level: string;
}

interface SubscriptionData {
  currentPlan: string;
  autoRenewal: boolean;
  nextRenewal: string;
  paymentHistory: Array<{
    date: string;
    amount: string;
    status: string;
  }>;
}

interface PrivacySettings {
  dataSharing: boolean;
  profileVisibility: 'public' | 'private' | 'friends';
  emailNotifications: boolean;
  pushNotifications: boolean;
  workoutReminders: boolean;
  cookieTracking: boolean;
}

interface AccountSettings {
  suspensionDays: number;
  isDeactivated: boolean;
}

export default function Profile() {
   const router = useRouter();
   const theme = useTheme();
   const [profile, setProfile] = useState<any>(null);
   const [editing, setEditing] = useState(false);
   const [loading, setLoading] = useState(false);
   const [profileLoading, setProfileLoading] = useState(false);
   
   const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const [editData, setEditData] = useState<EditData>({
    full_name: '',
    age: '',
    weight: '',
    height: '',
    goal: '',
    activity_level: '',
  });

  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    currentPlan: 'FREE',
    autoRenewal: true,
    nextRenewal: '2025-12-15',
    paymentHistory: [
      { date: '2024-11-15', amount: '5.99€', status: 'Réussi' },
    ]
  });

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    dataSharing: true,
    profileVisibility: 'public',
    emailNotifications: true,
    pushNotifications: true,
    workoutReminders: true,
    cookieTracking: false,
  });

  const [accountSettings, setAccountSettings] = useState<AccountSettings>({
    suspensionDays: 0,
    isDeactivated: false,
  });

  const toggleAutoRenewal = () => {
    setSubscriptionData(prev => ({ ...prev, autoRenewal: !prev.autoRenewal }));
  };

  const togglePrivacySetting = (key: keyof typeof privacySettings) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setPrivacySettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateTier = async (newTier: string) => {
    try {
      setShowSubscriptionModal(false);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('profiles')
        .update({ tier: newTier })
        .eq('id', session.user.id);

      if (error) throw error;

      setSubscriptionData(prev => ({ ...prev, currentPlan: newTier }));
      setProfile({ ...profile, tier: newTier });
      
      if (newTier === 'PREMIUM') {
          Alert.alert("Bienvenue au Club", "L'accès Premium est débloqué !");
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
          Alert.alert("Abonnement", "Vous êtes passé au plan Gratuit.");
      }
      
    } catch (e) {
      Alert.alert("Erreur", "Impossible de changer le plan.");
    }
  };

  const handleAccountAction = (action: string) => {
    switch (action) {
      case 'changePlan':
        setShowSubscriptionModal(true);
        break;
      case 'suspend':
        Alert.alert('Suspension', 'Votre compte sera suspendu pour 7 jours.', [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Confirmer', onPress: () => setAccountSettings(prev => ({ ...prev, suspensionDays: 7 })) }
        ]);
        break;
      case 'delete':
        Alert.alert('Suppression définitive', 'ATTENTION : Cette action est irréversible !', [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'SUPPRIMER',
            style: 'destructive',
            onPress: () => Alert.alert('Confirmation requise', 'Tapez "SUPPRIMER" pour confirmer', [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Confirmer', onPress: () => Alert.alert('Supprimé', 'Votre compte a été supprimé.') }
            ])
          }
        ]);
        break;
      case 'logout':
          Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
              { text: 'Annuler', style: 'cancel' },
              { 
                  text: 'Déconnexion', 
                  style: 'destructive',
                  onPress: async () => {
                      await supabase.auth.signOut();
                      router.replace('/auth/index' as any);
                  }
              }
          ]);
          break;
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: userProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;

      if (userProfile) {
        setProfile(userProfile);
        setEditData({
          full_name: userProfile.full_name || '',
          age: userProfile.age ? userProfile.age.toString() : '',
          weight: userProfile.weight ? userProfile.weight.toString() : '',
          height: userProfile.height ? userProfile.height.toString() : '',
          goal: userProfile.goal || '',
          activity_level: userProfile.activity_level || '',
        });
        
        if (userProfile.tier) {
            setSubscriptionData(prev => ({ 
                ...prev, 
                currentPlan: userProfile.tier.toUpperCase() 
            }));
        }
      }
    } catch (error: any) {
      console.log('Erreur profil', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const saveProfile = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const updates = {
        full_name: editData.full_name,
        age: editData.age ? parseInt(editData.age) : null,
        weight: editData.weight ? parseFloat(editData.weight) : null,
        height: editData.height ? parseFloat(editData.height) : null,
        goal: editData.goal,
        activity_level: editData.activity_level,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('profiles').update(updates).eq('id', session.user.id);
      if (error) throw error;
      setProfile({ ...profile, ...updates });
      setEditing(false);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Succès', 'Profil mis à jour avec succès');
    } catch (error: any) {
      Alert.alert('Erreur', 'Impossible de sauvegarder le profil');
    } finally {
      setLoading(false);
    }
  };

  const handleNav = (path: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    router.push(path as any);
  };

  const currentAge = calculateAge(profile?.birth_date);

  // Gestion des couleurs
  const isPremium = subscriptionData.currentPlan === 'PREMIUM';
  const currentPlanColor = isPremium ? '#ffd700' : theme.colors.textSecondary;

  const styles = StyleSheet.create({
   container: { flex: 1, backgroundColor: theme.colors.bg },
   safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? 30 : 0 },
   auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
   blob: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.4 },
   scrollContent: { padding: 20 },
   header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
   backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
   headerTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '900', letterSpacing: 1 },
   editBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
   avatarSection: { alignItems: 'center', marginBottom: 30 },
   avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
   avatarText: { color: '#fff', fontWeight: '900', fontSize: 24 },
   userName: { color: theme.colors.text, fontSize: 24, fontWeight: '900', marginBottom: 5 },
   userAge: { color: theme.colors.textSecondary, fontSize: 16 },
   section: { marginBottom: 30 },
   sectionTitle: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginBottom: 15, marginLeft: 5 },
   inputGroup: { marginBottom: 20 },
   inputLabel: { color: theme.colors.text, fontSize: 12, fontWeight: 'bold', marginBottom: 8, letterSpacing: 1 },
   input: { backgroundColor: theme.colors.glass, borderRadius: 15, padding: 15, color: theme.colors.text, fontSize: 16, borderWidth: 1, borderColor: theme.colors.border },
   inputEditing: { borderColor: theme.colors.primary, backgroundColor: theme.isDark ? 'rgba(0, 243, 255, 0.05)' : '#F0F9FF' },
   rowInputs: { flexDirection: 'row' },
   statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
   statCard: { flex: 1, backgroundColor: theme.colors.glass, borderRadius: 20, padding: 15, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', marginHorizontal: 5, shadowColor: theme.isDark ? 'transparent' : '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: theme.isDark ? 0 : 0.05, shadowRadius: 5, elevation: theme.isDark ? 0 : 2 },
   statValue: { color: theme.colors.text, fontSize: 24, fontWeight: '900', marginTop: 10 },
   statLabel: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold', marginTop: 5, letterSpacing: 1 },
   
   // --- MODIFICATION ICI : On retire les couleurs statiques ---
   subscriptionCard: { 
       backgroundColor: theme.colors.glass, 
       borderRadius: 20, padding: 20, 
       borderWidth: 1, 
       // borderColor: planColor,  <-- RETIRÉ (sera en inline style)
       marginBottom: 20, 
       // shadowColor: planColor, <-- RETIRÉ (sera en inline style)
       shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 3 
   },
   
   subscriptionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
   subscriptionPlan: { color: theme.colors.text, fontSize: 20, fontWeight: '900' },
   planBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
   planBadgeText: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
   subscriptionDetails: { marginBottom: 15 },
   subscriptionText: { color: theme.colors.textSecondary, fontSize: 14, marginBottom: 10 },
   toggleBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
   toggleText: { color: theme.colors.text, fontSize: 14, fontWeight: '600' },
   toggleSwitch: { width: 50, height: 28, borderRadius: 14, backgroundColor: theme.colors.border, justifyContent: 'center', paddingHorizontal: 2 },
   toggleActive: { backgroundColor: theme.colors.primary },
   toggleCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', transform: [{ translateX: 0 }] },
   toggleCircleActive: { transform: [{ translateX: 22 }] },
   subscriptionActions: { paddingTop: 10 },
   upgradeBtn: { backgroundColor: theme.colors.success, borderRadius: 15, padding: 15, alignItems: 'center' },
   upgradeBtnText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
   historyTitle: { color: theme.colors.textSecondary, fontSize: 14, fontWeight: 'bold', marginBottom: 10, letterSpacing: 1 },
   paymentItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.colors.glass, borderRadius: 15, padding: 15, marginBottom: 8, borderWidth: 1, borderColor: theme.colors.border },
   paymentInfo: { flex: 1 },
   paymentDate: { color: theme.colors.text, fontSize: 14, fontWeight: '600' },
   paymentAmount: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 },
   paymentStatus: { color: theme.colors.success, fontSize: 12, fontWeight: 'bold' },
   privacyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
   privacyInfo: { flex: 1 },
   privacyTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '600', marginBottom: 4 },
   privacyDesc: { color: theme.colors.textSecondary, fontSize: 12, lineHeight: 16 },
   privacyValue: { color: theme.colors.primary, fontSize: 16, fontWeight: '600' },
   dangerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.danger + '15', borderRadius: 15, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.danger + '30' },
   dangerBtnText: { color: theme.colors.danger, fontSize: 14, fontWeight: '600', marginLeft: 10, flex: 1 },
   valueBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.glass, borderRadius: 20, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border },
   valueIcon: { width: 40, height: 40, borderRadius: 15, backgroundColor: theme.colors.bg, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
   valueInfo: { flex: 1 },
   valueTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '600', marginBottom: 2 },
   valueDesc: { color: theme.colors.textSecondary, fontSize: 12 },
   actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.glass, borderRadius: 20, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border },
   actionIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: theme.colors.bg, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
   actionText: { color: theme.colors.text, fontSize: 16, fontWeight: '600', flex: 1 },
   saveBtn: { backgroundColor: theme.colors.primary, borderRadius: 25, padding: 18, alignItems: 'center', marginTop: 20 },
   saveBtnDisabled: { opacity: 0.6 },
   saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
   footer: { marginTop: 40, paddingHorizontal: 20, paddingBottom: 30, alignItems: 'center' },
   footerDivider: { height: 1, width: '100%', backgroundColor: theme.colors.border, marginBottom: 20 },
   footerContent: { alignItems: 'center' },
   footerText: { color: theme.colors.text, fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 5 },
   footerSubtext: { color: theme.colors.textSecondary, fontSize: 10, letterSpacing: 1, marginBottom: 15 },
   footerIcons: { flexDirection: 'row', marginBottom: 15 },
   copyright: { color: theme.colors.textSecondary, fontSize: 9 },
   modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
   modalContainer: { width: '85%', backgroundColor: theme.colors.cardBg, borderRadius: 25, padding: 25, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
   modalTitle: { fontSize: 20, fontWeight: '900', marginBottom: 20, color: theme.colors.text, letterSpacing: 0.5 },
   planOption: { width: '100%', padding: 16, borderRadius: 16, marginBottom: 12, alignItems: 'center', borderWidth: 1, backgroundColor: theme.colors.glass },
   planOptionText: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
   cancelButton: { marginTop: 10, padding: 10 },
   cancelText: { color: theme.colors.textSecondary, fontSize: 14, fontWeight: '600' },
 });

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent={true} />
      {theme.isDark && (
        <View style={styles.auroraBg}>
            <View style={[styles.blob, { top: -100, right: -50, backgroundColor: 'rgba(0, 243, 255, 0.15)' }]} />
            <View style={[styles.blob, { top: 200, left: -100, backgroundColor: 'rgba(139, 92, 246, 0.15)' }]} />
        </View>
      )}
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>PROFIL NEXUS</Text>
            <TouchableOpacity onPress={() => setEditing(!editing)} style={styles.editBtn}>
              <MaterialCommunityIcons name={editing ? "check" : "pencil"} size={24} color={editing ? theme.colors.success : theme.colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.avatarSection}>
            <LinearGradient colors={[theme.colors.primary, theme.colors.secondary]} style={styles.avatar}>
              <Text style={styles.avatarText}>{profile?.full_name ? profile.full_name.substring(0, 2).toUpperCase() : 'NX'}</Text>
            </LinearGradient>
            <Text style={styles.userName}>{profile?.full_name || 'INITIÉ NEXUS'}</Text>
            {currentAge && <Text style={styles.userAge}>{currentAge} ans</Text>}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>INFORMATIONS PERSONNELLES</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nom complet</Text>
              <TextInput style={[styles.input, editing && styles.inputEditing]} value={editData.full_name} onChangeText={(text) => setEditData({...editData, full_name: text})} editable={editing} placeholder="Votre nom complet" placeholderTextColor={theme.colors.textSecondary} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Age</Text>
              <TextInput style={[styles.input, editing && styles.inputEditing]} value={editData.age} onChangeText={(text) => setEditData({...editData, age: text})} editable={editing} placeholder="Vôtre âge" placeholderTextColor={theme.colors.textSecondary} keyboardType="numeric" />
            </View>
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, {flex: 1, marginRight: 10}]}>
                <Text style={styles.inputLabel}>Poids (kg)</Text>
                <TextInput style={[styles.input, editing && styles.inputEditing]} value={editData.weight} onChangeText={(text) => setEditData({...editData, weight: text})} editable={editing} keyboardType="numeric" placeholder="70" placeholderTextColor={theme.colors.textSecondary} />
              </View>
              <View style={[styles.inputGroup, {flex: 1}]}>
                <Text style={styles.inputLabel}>Taille (cm)</Text>
                <TextInput style={[styles.input, editing && styles.inputEditing]} value={editData.height} onChangeText={(text) => setEditData({...editData, height: text})} editable={editing} keyboardType="numeric" placeholder="175" placeholderTextColor={theme.colors.textSecondary} />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Objectif</Text>
              <TextInput style={[styles.input, editing && styles.inputEditing]} value={editData.goal} onChangeText={(text) => setEditData({...editData, goal: text})} editable={editing} placeholder="Perte de poids, prise de masse..." placeholderTextColor={theme.colors.textSecondary} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Niveau d'activité</Text>
              <TextInput style={[styles.input, editing && styles.inputEditing]} value={editData.activity_level} onChangeText={(text) => setEditData({...editData, activity_level: text})} editable={editing} placeholder="Sédentaire, Actif, Très actif..." placeholderTextColor={theme.colors.textSecondary} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>STATISTIQUES</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="fire" size={24} color={theme.colors.warning} />
                <Text style={styles.statValue}>{profile?.streak || 0}</Text>
                <Text style={styles.statLabel}>Série jours</Text>
              </View>
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="trophy" size={24} color="#ffd700" />
                <Text style={styles.statValue}>{profile?.points || 0}</Text>
                <Text style={styles.statLabel}>Points</Text>
              </View>
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="calendar" size={24} color={theme.colors.primary} />
                <Text style={styles.statValue}>{Math.floor((profile?.points || 0) / 1000) + 1}</Text>
                <Text style={styles.statLabel}>Niveau</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ABONNEMENT</Text>
            {/* MODIFICATION ICI : Styles dynamiques en ligne */}
            {/* On passe un tableau de styles : [style_fixe, { style_dynamique }] */}
            <View style={[
                styles.subscriptionCard, 
                { borderColor: currentPlanColor, shadowColor: currentPlanColor }
            ]}>
              <View style={styles.subscriptionHeader}>
                <Text style={styles.subscriptionPlan}>{subscriptionData.currentPlan}</Text>
                <View style={[styles.planBadge, { backgroundColor: currentPlanColor }]}>
                  <Text style={styles.planBadgeText}>ACTIF</Text>
                </View>
              </View>
              <View style={styles.subscriptionDetails}>
                <Text style={styles.subscriptionText}>Renouvellement: {subscriptionData.nextRenewal}</Text>
                <TouchableOpacity style={styles.toggleBtn} onPress={toggleAutoRenewal}>
                  <Text style={styles.toggleText}>Renouvellement automatique</Text>
                  <View style={[styles.toggleSwitch, subscriptionData.autoRenewal && styles.toggleActive]}>
                    <View style={[styles.toggleCircle, subscriptionData.autoRenewal && styles.toggleCircleActive]} />
                  </View>
                </TouchableOpacity>
              </View>
              <View style={styles.subscriptionActions}>
                <TouchableOpacity style={styles.upgradeBtn} onPress={() => handleAccountAction('changePlan')}>
                  <Text style={styles.upgradeBtnText}>CHANGER DE PLAN</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.historyTitle}>Historique des paiements</Text>
            {subscriptionData.paymentHistory.map((payment, index) => (
              <View key={index} style={styles.paymentItem}>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentDate}>{payment.date}</Text>
                  <Text style={styles.paymentAmount}>{payment.amount}</Text>
                </View>
                <Text style={[styles.paymentStatus, { color: payment.status === 'Réussi' ? theme.colors.success : theme.colors.danger }]}>
                  {payment.status}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PRÉFÉRENCES</Text>
            <View style={styles.privacyItem}>
              <View style={styles.privacyInfo}>
                <Text style={styles.privacyTitle}>Mode sombre</Text>
                <Text style={styles.privacyDesc}>Basculer entre le mode sombre et clair</Text>
              </View>
              <TouchableOpacity style={styles.toggleBtn} onPress={() => { 
                  if(Platform.OS !== 'web') Haptics.selectionAsync();
                  theme.toggleTheme(); 
              }}>
                <View style={[styles.toggleSwitch, theme.isDark && styles.toggleActive]}>
                  <View style={[styles.toggleCircle, theme.isDark && styles.toggleCircleActive]} />
                </View>
              </TouchableOpacity>
            </View>
            <View style={styles.privacyItem}>
              <View style={styles.privacyInfo}>
                <Text style={styles.privacyTitle}>Partage des données</Text>
                <Text style={styles.privacyDesc}>Autoriser le partage anonyme des statistiques</Text>
              </View>
              <TouchableOpacity style={styles.toggleBtn} onPress={() => togglePrivacySetting('dataSharing')}>
                <View style={[styles.toggleSwitch, privacySettings.dataSharing && styles.toggleActive]}>
                  <View style={[styles.toggleCircle, privacySettings.dataSharing && styles.toggleCircleActive]} />
                </View>
              </TouchableOpacity>
            </View>
            <View style={styles.privacyItem}>
              <View style={styles.privacyInfo}>
                <Text style={styles.privacyTitle}>Visibilité du profil</Text>
                <Text style={styles.privacyDesc}>Contrôler qui peut voir votre profil</Text>
              </View>
              <TouchableOpacity style={styles.toggleBtn} onPress={() => {
                  if (Platform.OS !== 'web') Haptics.selectionAsync();
                  const visibilities: ('public' | 'private' | 'friends')[] = ['public', 'private', 'friends'];
                  const currentIndex = visibilities.indexOf(privacySettings.profileVisibility);
                  const nextIndex = (currentIndex + 1) % visibilities.length;
                  setPrivacySettings(prev => ({ ...prev, profileVisibility: visibilities[nextIndex] }));
                }}>
                <Text style={styles.privacyValue}>
                  {privacySettings.profileVisibility === 'public' ? 'Public' :
                   privacySettings.profileVisibility === 'private' ? 'Privé' : 'Amis'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>VALEUR AJOUTÉE</Text>
            <TouchableOpacity style={styles.valueBtn} onPress={() => Alert.alert('Badges', 'Fonctionnalité à venir')}>
              <View style={styles.valueIcon}>
                <MaterialCommunityIcons name="medal" size={24} color="#ffd700" />
              </View>
              <View style={styles.valueInfo}>
                <Text style={styles.valueTitle}>Badges & Récompenses</Text>
                <Text style={styles.valueDesc}>Découvrez vos achievements débloqués</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.valueBtn} onPress={() => Alert.alert('Export', 'Fonctionnalité à venir')}>
              <View style={styles.valueIcon}>
                <MaterialCommunityIcons name="download" size={24} color={theme.colors.accent} />
              </View>
              <View style={styles.valueInfo}>
                <Text style={styles.valueTitle}>Exporter mes données</Text>
                <Text style={styles.valueDesc}>Téléchargez toutes vos données</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ACTIONS</Text>
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleNav('/profile/legal')}>
              <View style={styles.actionIcon}>
                <MaterialCommunityIcons name="file-document" size={20} color={theme.colors.primary} />
              </View>
              <Text style={styles.actionText}>Conditions générales</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleNav('/profile/support')}>
              <View style={styles.actionIcon}>
                <MaterialCommunityIcons name="help-circle" size={20} color={theme.colors.success} />
              </View>
              <Text style={styles.actionText}>Support & Aide</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          {editing && (
            <TouchableOpacity style={[styles.saveBtn, loading && styles.saveBtnDisabled]} onPress={saveProfile} disabled={loading}>
              <Text style={styles.saveBtnText}>{loading ? 'SAUVEGARDE...' : 'SAUVEGARDER'}</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>GESTION DE COMPTE</Text>
            <TouchableOpacity style={styles.dangerBtn} onPress={() => handleAccountAction('logout')}>
              <MaterialCommunityIcons name="logout" size={20} color={theme.colors.text} />
              <Text style={[styles.dangerBtnText, {color: theme.colors.text}]}>SE DÉCONNECTER</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dangerBtn} onPress={() => handleAccountAction('delete')}>
              <MaterialCommunityIcons name="delete-forever" size={20} color={theme.colors.danger} />
              <Text style={[styles.dangerBtnText, {color: theme.colors.danger}]}>SUPPRESSION DÉFINITIVE</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
          
          <View style={styles.footer}>
            <View style={styles.footerDivider} />
            <View style={styles.footerContent}>
              <Text style={styles.footerText}>NEXUS AI FIT v1.0</Text>
              <Text style={styles.footerSubtext}>SYSTÈME DE GESTION BIOLOGIQUE AVANCÉ</Text>
              <View style={styles.footerIcons}>
                <MaterialCommunityIcons name="shield-check-outline" size={16} color={theme.colors.textSecondary} style={{marginRight: 15}} />
                <MaterialCommunityIcons name="server-network" size={16} color={theme.colors.textSecondary} style={{marginRight: 15}} />
                <MaterialCommunityIcons name="brain" size={16} color={theme.colors.textSecondary} />
              </View>
              <Text style={styles.copyright}>© 2025 NEXUS INC. TOUS DROITS RÉSERVÉS.</Text>
            </View>
          </View>
        </ScrollView>

        {/* MODALE D'ABONNEMENT SIMPLIFIÉE */}
        <Modal animationType="fade" transparent={true} visible={showSubscriptionModal} onRequestClose={() => setShowSubscriptionModal(false)}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>CHOISIR UN ABONNEMENT</Text>
                    
                    <TouchableOpacity style={[styles.planOption, {borderColor: theme.colors.textSecondary}]} onPress={() => updateTier('FREE')}>
                        <Text style={[styles.planOptionText, {color: theme.colors.textSecondary}]}>GRATUIT (0€)</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={[styles.planOption, {borderColor: '#ffd700', backgroundColor: theme.isDark ? 'rgba(255, 215, 0, 0.1)' : '#fffbeb'}]} onPress={() => updateTier('PREMIUM')}>
                        <Text style={[styles.planOptionText, {color: '#ffd700'}]}>PREMIUM (5.99€/mois)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.cancelButton} onPress={() => setShowSubscriptionModal(false)}>
                        <Text style={styles.cancelText}>Annuler</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
      </SafeAreaView>
    </View>
);
}