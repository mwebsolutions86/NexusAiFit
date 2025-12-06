import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../lib/theme';
import { useTranslation } from 'react-i18next';
import i18n from '../lib/i18n';


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
   const { t } = useTranslation();
   const [profile, setProfile] = useState<any>(null);
   const [editing, setEditing] = useState(false);
   const [loading, setLoading] = useState(false);

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
      Alert.alert(t('profile.alerts.success'), t('profile.alerts.saved'));
    } catch (error: any) {
      Alert.alert(t('profile.alerts.error'), 'Impossible de sauvegarder.');
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = () => {
      if (Platform.OS !== 'web') Haptics.selectionAsync();
      const current = i18n.language;
      const next = current === 'fr' ? 'en' : (current === 'en' ? 'ar' : 'fr');
      i18n.changeLanguage(next);
  };

  // --- CORRECTION DU LOGOUT ---
  const handleLogout = () => {
      Alert.alert(t('profile.logout'), t('profile.alerts.confirm_logout'), [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Oui', style: 'destructive', onPress: async () => {
              try {
                  await supabase.auth.signOut();
                  // Redirection vers la racine (Landing Page)
                  router.replace('/'); 
              } catch (error) {
                  console.error("Erreur logout:", error);
                  // On force la redirection même en cas d'erreur
                  router.replace('/');
              }
          }}
      ]);
  };

  const handleDeactivate = () => Alert.alert("Action", "Compte désactivé (Simulé)");
  const handleDelete = () => Alert.alert("Action", "Suppression (Simulé)");

  const isPremium = (profile?.tier || 'FREE') === 'PREMIUM';
  const tierColor = isPremium ? '#FFD700' : theme.colors.textSecondary;
  const currentLevel = Math.floor((profile?.points || 0) / 1000) + 1;
  const currentStyles = styles(theme);

  return (
    <View style={currentStyles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <SafeAreaView style={{flex:1}}>
        <ScrollView contentContainerStyle={currentStyles.content} showsVerticalScrollIndicator={false}>
          
          <View style={currentStyles.header}>
            <TouchableOpacity onPress={() => router.back()} style={currentStyles.iconBtn}>
              <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={currentStyles.headerTitle}>{t('profile.title')}</Text>
            <TouchableOpacity onPress={() => setEditing(!editing)} style={currentStyles.iconBtn}>
              <Ionicons name={editing ? "checkmark" : "pencil"} size={20} color={editing ? theme.colors.success : theme.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={currentStyles.idCard}>
            <LinearGradient colors={isPremium ? ['#FFD700', '#FFA500'] : [theme.colors.border, theme.colors.glass]} style={currentStyles.avatarRing}>
                <View style={currentStyles.avatarContainer}>
                    <Text style={currentStyles.avatarText}>{profile?.full_name ? profile.full_name.substring(0, 2).toUpperCase() : 'NX'}</Text>
                </View>
            </LinearGradient>
            <Text style={currentStyles.userName}>{profile?.full_name || t('profile.default_name')}</Text>
            <View style={[currentStyles.badge, {borderColor: tierColor}]}>
                <Text style={[currentStyles.badgeText, {color: tierColor}]}>{isPremium ? t('profile.member_elite') : t('profile.member_standard')}</Text>
            </View>
          </View>

          <View style={currentStyles.statsRow}>
              <View style={currentStyles.statItem}>
                  <Text style={currentStyles.statValue}>{profile?.streak || 0}</Text>
                  <Text style={currentStyles.statLabel}>{t('profile.stat_streak')}</Text>
              </View>
              <View style={[currentStyles.statItem, {borderLeftWidth:1, borderRightWidth:1, borderColor:theme.colors.border}]}>
                  <Text style={currentStyles.statValue}>{currentLevel}</Text>
                  <Text style={currentStyles.statLabel}>{t('profile.stat_level')}</Text>
              </View>
              <View style={currentStyles.statItem}>
                  <Text style={currentStyles.statValue}>{profile?.weight || '--'}</Text>
                  <Text style={currentStyles.statLabel}>{t('profile.stat_weight')}</Text>
              </View>
          </View>

          <Text style={currentStyles.sectionTitle}>{t('profile.section_sub')}</Text>
          <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/subscription' as any)} style={currentStyles.subCard}>
            <LinearGradient colors={isPremium ? ['#FFD700', '#B8860B'] : [theme.colors.glass, theme.colors.cardBg]} start={{x:0, y:0}} end={{x:1, y:1}} style={currentStyles.subGradient}>
                <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start'}}>
                    <MaterialCommunityIcons name="check-decagram" size={24} color={isPremium ? '#FFF' : theme.colors.textSecondary} />
                    <Text style={[currentStyles.subPrice, isPremium && {color:'#FFF'}]}>{isPremium ? '5.99€' : t('profile.sub_free')}</Text>
                </View>
                <View>
                    <Text style={[currentStyles.subName, isPremium && {color:'#FFF'}]}>{isPremium ? t('profile.member_elite') : t('profile.default_name')}</Text>
                    <Text style={[currentStyles.subDesc, isPremium && {color:'rgba(255,255,255,0.8)'}]}>{isPremium ? t('profile.sub_manage') : t('profile.sub_action')}</Text>
                </View>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={currentStyles.sectionTitle}>{t('profile.section_physique')}</Text>
          <View style={currentStyles.formContainer}>
              <View style={currentStyles.inputRow}>
                  <View style={{flex:1}}>
                      <Text style={currentStyles.label}>{t('profile.label_weight')}</Text>
                      <TextInput style={[currentStyles.input, editing && currentStyles.inputEditable]} value={editData.weight} onChangeText={t => setEditData({...editData, weight: t})} editable={editing} keyboardType="numeric" />
                  </View>
                  <View style={{width:15}}/>
                  <View style={{flex:1}}>
                      <Text style={currentStyles.label}>{t('profile.label_height')}</Text>
                      <TextInput style={[currentStyles.input, editing && currentStyles.inputEditable]} value={editData.height} onChangeText={t => setEditData({...editData, height: t})} editable={editing} keyboardType="numeric" />
                  </View>
              </View>
          </View>

          {editing && (
            <TouchableOpacity style={currentStyles.saveBtn} onPress={saveProfile} disabled={loading}>
                <Text style={currentStyles.saveBtnText}>{loading ? t('profile.btn_saving') : t('profile.btn_save')}</Text>
            </TouchableOpacity>
          )}

          <Text style={currentStyles.sectionTitle}>{t('profile.section_settings')}</Text>
          <View style={currentStyles.settingsContainer}>
              <TouchableOpacity style={currentStyles.settingRow} onPress={theme.toggleTheme}>
                  <Text style={currentStyles.settingText}>{t('profile.theme')}</Text>
                  <Ionicons name={theme.isDark ? "moon" : "sunny"} size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity style={currentStyles.settingRow} onPress={toggleLanguage}>
                  <Text style={currentStyles.settingText}>{t('profile.language')}</Text>
                  <View style={{flexDirection:'row', alignItems:'center', gap:5}}>
                      <Text style={{color:theme.colors.primary, fontWeight:'900', fontSize:12}}>{i18n.language.toUpperCase()}</Text>
                      <Ionicons name="language" size={18} color={theme.colors.textSecondary} />
                  </View>
              </TouchableOpacity>

              <TouchableOpacity style={currentStyles.settingRow} onPress={() => router.push('/profile/support')}>
                  <Text style={currentStyles.settingText}>{t('profile.support')}</Text>
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={currentStyles.settingRow} onPress={() => router.push('/profile/legal')}>
                  <Text style={currentStyles.settingText}>{t('profile.legal')}</Text>
                  <Ionicons name="document-text-outline" size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={currentStyles.settingRow} onPress={handleLogout}>
                  <Text style={[currentStyles.settingText, {color: theme.colors.danger}]}>{t('profile.logout')}</Text>
                  <MaterialCommunityIcons name="logout" size={18} color={theme.colors.danger} />
              </TouchableOpacity>
          </View>

          <Text style={[currentStyles.sectionTitle, {color:theme.colors.danger, marginTop:30}]}>{t('profile.section_danger')}</Text>
          <View style={[currentStyles.settingsContainer, {borderColor: theme.colors.danger+'50'}]}>
              <TouchableOpacity style={currentStyles.settingRow} onPress={handleDeactivate}>
                  <Text style={currentStyles.settingText}>{t('profile.deactivate')}</Text>
                  <MaterialCommunityIcons name="pause-circle-outline" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={[currentStyles.settingRow, {borderBottomWidth:0}]} onPress={handleDelete}>
                  <Text style={[currentStyles.settingText, {color: theme.colors.danger}]}>{t('profile.delete')}</Text>
                  <MaterialCommunityIcons name="delete-forever-outline" size={20} color={theme.colors.danger} />
              </TouchableOpacity>
          </View>

          <View style={{padding: 20, alignItems: 'center', opacity: 0.6, marginTop: 20}}>
              <Text style={{color: theme.colors.textSecondary, fontSize: 10, fontWeight: '900'}}>{t('profile.footer.version')}</Text>
              <Text style={{color: theme.colors.textSecondary, fontSize: 8, marginTop: 5}}>{t('profile.footer.copyright')}</Text>
          </View>

          <View style={{height: 50}}/>
        </ScrollView>
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
    statsRow: { flexDirection: 'row', backgroundColor: theme.colors.glass, borderRadius: 16, padding: 15, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 30 },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 20, fontWeight: '900', color: theme.colors.text },
    statLabel: { fontSize: 10, color: theme.colors.textSecondary, marginTop: 2, fontWeight: 'bold' },
});