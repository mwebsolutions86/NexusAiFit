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
  const [isLogin, setIsLogin] = useState(true); 
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Fonction de vérification et redirection
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
        // En cas d'erreur (profil non trouvé), on va vers l'onboarding par défaut
        router.replace('/onboarding');
    }
  };

  const handleAuth = async () => {
    if (!email || !password) return Alert.alert("Erreur", "Veuillez remplir tous les champs.");
    
    setLoading(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (isLogin) {
        // --- CONNEXION ---
        const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        if (user) {
            // ✅ Redirection explicite après connexion réussie
            await checkProfileAndRedirect(user.id);
        }

      } else {
        // --- INSCRIPTION ---
        const { data: { session, user }, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (session && user) {
            // Si la session est créée immédiatement (email confirm désactivé), on redirige
            Alert.alert("Bienvenue", "Compte créé ! Commençons votre profil.");
            await checkProfileAndRedirect(user.id);
        } else {
            // Sinon, on demande de vérifier l'email
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

  // Fonction connexion Google
  const handleGoogleLogin = async () => {
     try {
        if (Platform.OS !== 'web') Haptics.selectionAsync();
        
        const redirectUrl = Linking.createURL('/auth/callback');
        console.log("🔗 URL de redirection envoyée à Supabase :", redirectUrl);

        const { data, error } = await supabase.auth.signInWithOAuth({
           provider: 'google',
           options: {
               redirectTo: redirectUrl,
               skipBrowserRedirect: true 
           }
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      
      {/* AETHER BG */}
      <View style={styles.auroraBg}>
          <View style={[styles.blob, { top: -100, right: -50, backgroundColor: 'rgba(0, 243, 255, 0.1)' }]} />
          <View style={[styles.blob, { bottom: 0, left: -50, backgroundColor: 'rgba(139, 92, 246, 0.1)' }]} />
      </View>

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
                        <MaterialCommunityIcons name="email-outline" size={20} color="rgba(255,255,255,0.5)" />
                        <TextInput 
                            style={styles.input} 
                            placeholder="utilisateur@nexus.com" 
                            placeholderTextColor="rgba(255,255,255,0.2)"
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
                        <MaterialCommunityIcons name="lock-outline" size={20} color="rgba(255,255,255,0.5)" />
                        <TextInput 
                            style={styles.input} 
                            placeholder="••••••••" 
                            placeholderTextColor="rgba(255,255,255,0.2)"
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
                        {rememberMe && <Ionicons name="checkmark" size={12} color="#000" />}
                    </View>
                    <Text style={styles.rememberText}>Rester connecté</Text>
                </TouchableOpacity>

                {/* ACTION BUTTON */}
                <TouchableOpacity style={styles.authBtn} onPress={handleAuth} disabled={loading}>
                    <LinearGradient 
                        colors={['#00f3ff', '#0066ff']} 
                        start={{x:0, y:0}} end={{x:1, y:0}} 
                        style={styles.btnGradient}
                    >
                        {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>{isLogin ? "CONNEXION" : "CRÉER COMPTE"}</Text>}
                    </LinearGradient>
                </TouchableOpacity>

                <View style={styles.dividerContainer}>
                    <View style={styles.line} />
                    <Text style={styles.orText}>OU</Text>
                    <View style={styles.line} />
                </View>

                {/* GOOGLE BUTTON */}
                <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin}>
                    <Ionicons name="logo-google" size={20} color="#fff" style={{marginRight: 10}} />
                    <Text style={styles.googleText}>Continuer avec Google</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchBtn}>
                    <Text style={styles.switchText}>
                        {isLogin ? "Pas d'accès ? " : "Déjà membre ? "}
                        <Text style={{ color: '#00f3ff' }}>{isLogin ? "Créer un compte" : "Se connecter"}</Text>
                    </Text>
                </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },
  auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
  blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.2 },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: 2 },
  subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 10, letterSpacing: 2, marginTop: 5 },
  formContainer: { width: '100%' },
  inputWrapper: { marginBottom: 20 },
  label: { color: '#00f3ff', fontSize: 10, fontWeight: 'bold', marginBottom: 8, marginLeft: 4 },
  glassInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(20, 20, 30, 0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 15, height: 55 },
  input: { flex: 1, color: '#fff', marginLeft: 10, fontWeight: 'bold' },
  rememberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginLeft: 4 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: '#00f3ff', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  checkboxActive: { backgroundColor: '#00f3ff' },
  rememberText: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  authBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 0, shadowColor: "#00f3ff", shadowOpacity: 0.3, shadowRadius: 10 },
  btnGradient: { height: 55, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#000', fontWeight: '900', letterSpacing: 1 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  orText: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginHorizontal: 10, fontWeight: 'bold' },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)', height: 55, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  googleText: { color: '#fff', fontWeight: 'bold' },
  switchBtn: { marginTop: 25, alignItems: 'center' },
  switchText: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
});