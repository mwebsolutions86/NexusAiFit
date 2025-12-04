import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { useTheme } from '../../lib/theme';
import { useTranslation } from 'react-i18next'; 
import i18n from '../../lib/i18n';

export default function AuthScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation(); 
  const [isLogin, setIsLogin] = useState(true); 
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // NOUVEAU : État pour la case à cocher
  const [termsAccepted, setTermsAccepted] = useState(false);

  const toggleLanguage = () => {
      const current = i18n.language;
      const next = current === 'fr' ? 'en' : (current === 'en' ? 'ar' : 'fr');
      i18n.changeLanguage(next);
  };

  const checkProfileAndRedirect = async (userId: string) => {
    try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('gender, goal')
          .eq('id', userId)
          .single();

        if (!profile || !profile.gender || !profile.goal) {
            router.replace('/onboarding');
        } else {
            router.replace('/(tabs)/dashboard');
        }
    } catch (error) {
        router.replace('/onboarding');
    }
  };

  const handleAuth = async () => {
    if (!email || !password) return Alert.alert("Erreur", "Veuillez remplir tous les champs.");
    
    // NOUVEAU : Vérification des conditions lors de l'inscription
    if (!isLogin && !termsAccepted) {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return Alert.alert(
            "Conditions Requises", 
            "Veuillez accepter les conditions d'utilisation et confirmer que NexusAiFit ne remplace pas un avis médical pour continuer."
        );
    }

    setLoading(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (isLogin) {
        const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (user) await checkProfileAndRedirect(user.id);
      } else {
        const { data: { session, user }, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (session && user) {
            Alert.alert(t('alerts.welcome'), t('alerts.welcome_msg'));
            await checkProfileAndRedirect(user.id);
        } else {
            Alert.alert(t('alerts.success'), "Email de confirmation envoyé.");
            setIsLogin(true);
        }
      }
    } catch (error: any) {
      Alert.alert(t('auth.error_title'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
     try {
        if (Platform.OS !== 'web') Haptics.selectionAsync();
        const redirectUrl = Linking.createURL('/auth/callback');
        const { data, error } = await supabase.auth.signInWithOAuth({
           provider: 'google',
           options: { redirectTo: redirectUrl, skipBrowserRedirect: true }
        });
        if (error) throw error;
        if (data?.url) await Linking.openURL(data.url);
     } catch (e: any) {
        Alert.alert("Erreur Google Auth", e.message);
     }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1 },
    auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
    blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.2 },
    
    langBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    langText: { color: '#fff', fontWeight: 'bold', fontSize: 10 },

    header: { alignItems: 'center', marginBottom: 40, marginTop: 60 },
    title: { color: theme.colors.text, fontSize: 32, fontWeight: '900', letterSpacing: 2 },
    subtitle: { color: theme.colors.textSecondary, fontSize: 10, letterSpacing: 2, marginTop: 5 },
    formContainer: { width: '100%' },
    inputWrapper: { marginBottom: 20 },
    label: { color: theme.colors.primary, fontSize: 10, fontWeight: 'bold', marginBottom: 8, marginLeft: 4 },
    glassInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.glass, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, paddingHorizontal: 15, height: 55 },
    input: { flex: 1, color: theme.colors.text, marginLeft: 10, fontWeight: 'bold' },
    authBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 10 },
    btnGradient: { height: 55, justifyContent: 'center', alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: '900', letterSpacing: 1 },
    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    line: { flex: 1, height: 1, backgroundColor: theme.colors.border },
    orText: { color: theme.colors.textSecondary, fontSize: 10, marginHorizontal: 10, fontWeight: 'bold' },
    googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.glass, height: 55, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border },
    googleText: { color: theme.colors.text, fontWeight: 'bold' },
    switchBtn: { marginTop: 25, alignItems: 'center' },
    switchText: { color: theme.colors.textSecondary, fontSize: 12 },

    // NOUVEAUX STYLES POUR LA CASE À COCHER
    termsContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20, marginTop: 5 },
    checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: theme.colors.textSecondary, marginRight: 10, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
    checkboxActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    termsText: { flex: 1, color: theme.colors.textSecondary, fontSize: 11, lineHeight: 16 },
    linkText: { color: theme.colors.primary, fontWeight: 'bold' }
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent={true} />
      
      {theme.isDark && (
        <View style={styles.auroraBg}>
            <View style={[styles.blob, { top: -100, right: -50, backgroundColor: 'rgba(0, 243, 255, 0.1)' }]} />
            <View style={[styles.blob, { bottom: 0, left: -50, backgroundColor: 'rgba(139, 92, 246, 0.1)' }]} />
        </View>
      )}

      <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage}>
          <Text style={styles.langText}>{i18n.language.toUpperCase()}</Text>
      </TouchableOpacity>

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, justifyContent: 'center' }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
            
            <View style={styles.header}>
                <Text style={styles.title}>NEXUS.ID</Text>
                <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>
            </View>

            <View style={styles.formContainer}>
                <View style={styles.inputWrapper}>
                    <Text style={styles.label}>IDENTIFIANT</Text>
                    <View style={styles.glassInput}>
                        <MaterialCommunityIcons name="email-outline" size={20} color={theme.colors.textSecondary} />
                        <TextInput 
                            style={styles.input} 
                            placeholder={t('auth.email_placeholder')} 
                            placeholderTextColor={theme.colors.textSecondary}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>
                </View>

                <View style={styles.inputWrapper}>
                    <Text style={styles.label}>CLÉ DE SÉCURITÉ</Text>
                    <View style={styles.glassInput}>
                        <MaterialCommunityIcons name="lock-outline" size={20} color={theme.colors.textSecondary} />
                        <TextInput 
                            style={styles.input} 
                            placeholder={t('auth.password_placeholder')} 
                            placeholderTextColor={theme.colors.textSecondary}
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>
                </View>

                {/* NOUVEAU : CASE À COCHER (Visible uniquement lors de l'inscription) */}
                {!isLogin && (
                    <TouchableOpacity 
                        style={styles.termsContainer} 
                        onPress={() => {
                            if (Platform.OS !== 'web') Haptics.selectionAsync();
                            setTermsAccepted(!termsAccepted);
                        }}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.checkbox, termsAccepted && styles.checkboxActive]}>
                            {termsAccepted && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
                        </View>
                        <Text style={styles.termsText}>
                            J'accepte les <Text style={styles.linkText}>CGU</Text> et je reconnais que NexusAiFit ne remplace pas un avis médical.
                        </Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.authBtn} onPress={handleAuth} disabled={loading}>
                    <LinearGradient colors={[theme.colors.primary, theme.colors.secondary]} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.btnGradient}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{isLogin ? t('auth.login_action') : t('auth.signup_action')}</Text>}
                    </LinearGradient>
                </TouchableOpacity>

                <View style={styles.dividerContainer}>
                    <View style={styles.line} />
                    <Text style={styles.orText}>{t('auth.or')}</Text>
                    <View style={styles.line} />
                </View>

                <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin}>
                    <Ionicons name="logo-google" size={20} color={theme.colors.text} style={{marginRight: 10}} />
                    <Text style={styles.googleText}>{t('auth.google')}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => {
                    setIsLogin(!isLogin);
                    setTermsAccepted(false); // Reset checkbox on switch
                }} style={styles.switchBtn}>
                    <Text style={styles.switchText}>
                        {isLogin ? t('auth.switch_to_signup') : t('auth.switch_to_login')}
                    </Text>
                </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}