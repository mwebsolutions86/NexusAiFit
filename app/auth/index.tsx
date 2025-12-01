import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Dimensions, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { useTheme } from '../../lib/theme';

export default function AuthScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [isLogin, setIsLogin] = useState(true); 
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

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
            Alert.alert("Bienvenue", "Compte créé ! Commençons votre profil.");
            await checkProfileAndRedirect(user.id);
        } else {
            Alert.alert("Succès", "Veuillez vérifier vos emails pour activer le compte.");
            setIsLogin(true);
        }
      }
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
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
        if (data?.url) {
            const res = await Linking.openURL(data.url);
            if (!res) throw new Error("Impossible d'ouvrir le navigateur");
        }
     } catch (e: any) {
        Alert.alert("Erreur Google Auth", e.message);
     }
  };

  // --- STYLES DYNAMIQUES ---
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1 },
    
    // Aurora uniquement en Dark Mode
    auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
    blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.2 },
    
    header: { alignItems: 'center', marginBottom: 40 },
    title: { color: theme.colors.text, fontSize: 32, fontWeight: '900', letterSpacing: 2 },
    subtitle: { color: theme.colors.textSecondary, fontSize: 10, letterSpacing: 2, marginTop: 5 },
    
    formContainer: { width: '100%' },
    inputWrapper: { marginBottom: 20 },
    label: { color: theme.colors.primary, fontSize: 10, fontWeight: 'bold', marginBottom: 8, marginLeft: 4 },
    
    glassInput: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      backgroundColor: theme.colors.glass, 
      borderWidth: 1, 
      borderColor: theme.colors.border, 
      borderRadius: 12, 
      paddingHorizontal: 15, 
      height: 55,
      // Ombres en mode clair pour le relief
      shadowColor: theme.isDark ? 'transparent' : '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0 : 0.05,
      shadowRadius: 4,
      elevation: theme.isDark ? 0 : 2,
    },
    
    input: { flex: 1, color: theme.colors.text, marginLeft: 10, fontWeight: 'bold' },
    
    rememberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginLeft: 4 },
    checkbox: { 
      width: 18, 
      height: 18, 
      borderRadius: 4, 
      borderWidth: 1, 
      borderColor: theme.colors.primary, 
      justifyContent: 'center', 
      alignItems: 'center', 
      marginRight: 10,
      backgroundColor: theme.isDark ? 'transparent' : theme.colors.cardBg 
    },
    checkboxActive: { backgroundColor: theme.colors.primary },
    rememberText: { color: theme.colors.textSecondary, fontSize: 12 },
    
    authBtn: { 
      borderRadius: 12, 
      overflow: 'hidden', 
      marginTop: 0, 
      shadowColor: theme.colors.primary, 
      shadowOpacity: 0.3, 
      shadowRadius: 10 
    },
    btnGradient: { height: 55, justifyContent: 'center', alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: '900', letterSpacing: 1 },
    
    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    line: { flex: 1, height: 1, backgroundColor: theme.colors.border },
    orText: { color: theme.colors.textSecondary, fontSize: 10, marginHorizontal: 10, fontWeight: 'bold' },
    
    googleBtn: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: theme.colors.glass, 
      height: 55, 
      borderRadius: 12, 
      borderWidth: 1, 
      borderColor: theme.colors.border,
      shadowColor: theme.isDark ? 'transparent' : '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0 : 0.05,
      shadowRadius: 4,
      elevation: theme.isDark ? 0 : 2,
    },
    googleText: { color: theme.colors.text, fontWeight: 'bold' },
    
    switchBtn: { marginTop: 25, alignItems: 'center' },
    switchText: { color: theme.colors.textSecondary, fontSize: 12 },
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent={true} />
      
      {/* AETHER BG - Visible uniquement en Dark Mode */}
      {theme.isDark && (
        <View style={styles.auroraBg}>
            <View style={[styles.blob, { top: -100, right: -50, backgroundColor: 'rgba(0, 243, 255, 0.1)' }]} />
            <View style={[styles.blob, { bottom: 0, left: -50, backgroundColor: 'rgba(139, 92, 246, 0.1)' }]} />
        </View>
      )}

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, justifyContent: 'center' }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
            
            <View style={styles.header}>
                <Text style={styles.title}>NEXUS.ID</Text>
                <Text style={styles.subtitle}>{isLogin ? "IDENTIFICATION REQUISE" : "INITIALISATION PROTOCOLE"}</Text>
            </View>

            <View style={styles.formContainer}>
                {/* EMAIL */}
                <View style={styles.inputWrapper}>
                    <Text style={styles.label}>IDENTIFIANT (EMAIL)</Text>
                    <View style={styles.glassInput}>
                        <MaterialCommunityIcons name="email-outline" size={20} color={theme.colors.textSecondary} />
                        <TextInput 
                            style={styles.input} 
                            placeholder="utilisateur@nexus.com" 
                            placeholderTextColor={theme.colors.textSecondary}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>
                </View>

                {/* PASSWORD */}
                <View style={styles.inputWrapper}>
                    <Text style={styles.label}>CLÉ DE SÉCURITÉ</Text>
                    <View style={styles.glassInput}>
                        <MaterialCommunityIcons name="lock-outline" size={20} color={theme.colors.textSecondary} />
                        <TextInput 
                            style={styles.input} 
                            placeholder="••••••••" 
                            placeholderTextColor={theme.colors.textSecondary}
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>
                </View>

                {/* OPTION RESTER CONNECTÉ */}
                <TouchableOpacity 
                    style={styles.rememberRow} 
                    onPress={() => setRememberMe(!rememberMe)}
                    activeOpacity={0.8}
                >
                    <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                        {rememberMe && <Ionicons name="checkmark" size={12} color="#fff" />}
                    </View>
                    <Text style={styles.rememberText}>Rester connecté</Text>
                </TouchableOpacity>

                {/* ACTION BUTTON */}
                <TouchableOpacity style={styles.authBtn} onPress={handleAuth} disabled={loading}>
                    <LinearGradient 
                        colors={[theme.colors.primary, theme.colors.secondary]} 
                        start={{x:0, y:0}} end={{x:1, y:0}} 
                        style={styles.btnGradient}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{isLogin ? "CONNEXION" : "CRÉER COMPTE"}</Text>}
                    </LinearGradient>
                </TouchableOpacity>

                <View style={styles.dividerContainer}>
                    <View style={styles.line} />
                    <Text style={styles.orText}>OU</Text>
                    <View style={styles.line} />
                </View>

                {/* GOOGLE BUTTON */}
                <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin}>
                    <Ionicons name="logo-google" size={20} color={theme.colors.text} style={{marginRight: 10}} />
                    <Text style={styles.googleText}>Continuer avec Google</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchBtn}>
                    <Text style={styles.switchText}>
                        {isLogin ? "Pas d'accès ? " : "Déjà membre ? "}
                        <Text style={{ color: theme.colors.primary }}>{isLogin ? "Créer un compte" : "Se connecter"}</Text>
                    </Text>
                </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}