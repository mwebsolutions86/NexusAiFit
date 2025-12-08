import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  Alert, 
  ActivityIndicator, 
  LayoutAnimation, 
  UIManager,
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  FadeInDown,
  FadeInUp
} from 'react-native-reanimated';

import { supabase } from '../../lib/supabase';
import { useTheme } from '../../lib/theme';
import { useTranslation } from 'react-i18next'; 

// Active LayoutAnimation sur Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

// --- COMPOSANT : HOLO INPUT ---
const HoloInput = ({ 
  icon, 
  placeholder, 
  value, 
  onChangeText, 
  secureTextEntry = false,
  autoCapitalize = 'none',
  keyboardType = 'default'
}: any) => {
  const { colors } = useTheme();
  const focusVal = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      borderColor: withTiming(focusVal.value === 1 ? '#00f3ff' : 'rgba(255,255,255,0.1)'),
      backgroundColor: withTiming(focusVal.value === 1 ? 'rgba(0, 243, 255, 0.05)' : 'rgba(0,0,0,0.3)'),
      transform: [{ scale: withSpring(focusVal.value === 1 ? 1.02 : 1) }]
    };
  });

  return (
    <Animated.View style={[styles.inputWrapper, animatedStyle]}>
      <MaterialCommunityIcons 
        name={icon} 
        size={20} 
        color={focusVal.value === 1 ? '#00f3ff' : 'rgba(255,255,255,0.7)'} 
      />
      <TextInput
        // ✅ CORRECTION : Couleur forcée à BLANC (#FFF) pour la lisibilité
        style={[styles.input, { color: '#FFFFFF' }]} 
        placeholder={placeholder}
        // ✅ CORRECTION : Placeholder gris clair fixe
        placeholderTextColor="rgba(255,255,255,0.5)"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        onFocus={() => {
          focusVal.value = 1;
          if (Platform.OS !== 'web') Haptics.selectionAsync();
        }}
        onBlur={() => {
          focusVal.value = 0;
        }}
      />
    </Animated.View>
  );
};

export default function AuthScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation(); 
  const { colors } = useTheme();
  
  const [isLogin, setIsLogin] = useState(true); 
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // --- ACTIONS ---

  const toggleMode = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsLogin(!isLogin);
    setTermsAccepted(false);
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
    if (!email || !password) {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return Alert.alert("Accès Refusé", "Identifiants manquants.");
    }
    
    if (!isLogin && !termsAccepted) {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return Alert.alert("Protocole Incomplet", "Veuillez accepter le Protocole Utilisateur.");
    }

    setLoading(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      if (isLogin) {
        const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (user) await checkProfileAndRedirect(user.id);
      } else {
        const { data: { session, user }, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (session && user) {
            Alert.alert("Bienvenue, Initié.", "Profil créé. Initialisation...");
            await checkProfileAndRedirect(user.id);
        } else {
            Alert.alert("Lien de Connexion Envoyé", "Vérifiez votre canal email pour activer l'accès.");
            setIsLogin(true);
        }
      }
    } catch (error: any) {
      Alert.alert("Erreur Système", error.message);
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
        Alert.alert("Échec Liaison Google", e.message);
     }
  };

  // --- RENDER ---

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* 1. FOND DEEP SPACE */}
      <LinearGradient
        colors={['#000000', '#0a0a12', '#050505']}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.glowBlob, { top: -150, left: -50, backgroundColor: '#00f3ff', opacity: 0.1 }]} />
      <View style={[styles.glowBlob, { bottom: -150, right: -50, backgroundColor: '#0066ff', opacity: 0.1 }]} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.content}>
            
            {/* EN-TÊTE */}
            <View style={styles.header}>
                <Animated.View entering={FadeInDown.duration(800).springify()}>
                    <MaterialCommunityIcons name="fingerprint" size={60} color="#00f3ff" style={styles.logoIcon} />
                </Animated.View>
                <Text style={styles.title}>NEXUS<Text style={{color: '#00f3ff'}}>.ID</Text></Text>
                <Text style={styles.subtitle}>{isLogin ? "IDENTIFICATION REQUISE" : "NOUVELLE INSCRIPTION"}</Text>
            </View>

            {/* FORMULAIRE */}
            <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.formContainer}>
                
                <HoloInput 
                    icon="email-outline" 
                    placeholder="Identifiant (Email)" 
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                />

                <View style={{ height: 15 }} />

                <HoloInput 
                    icon="lock-outline" 
                    placeholder="Clé de sécurité (Mot de passe)" 
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                {/* CHECKBOX + LIEN LÉGAL */}
                {!isLogin && (
                    <View style={styles.termsRow}>
                        <TouchableOpacity 
                            style={{ flexDirection: 'row', alignItems: 'center' }} 
                            onPress={() => {
                                if (Platform.OS !== 'web') Haptics.selectionAsync();
                                setTermsAccepted(!termsAccepted);
                            }}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.checkbox, termsAccepted && { backgroundColor: '#00f3ff', borderColor: '#00f3ff' }]}>
                                {termsAccepted && <Ionicons name="checkmark" size={12} color="#000" />}
                            </View>
                            <Text style={styles.termsText}>J'accepte le </Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => router.push('/profile/legal')}>
                            <Text style={[styles.termsText, { color: '#00f3ff', fontWeight: 'bold', textDecorationLine: 'underline' }]}>
                                Protocole Utilisateur
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
                <Text style={{ textAlign: 'center', color: '#666', fontSize: 10, marginTop: 20, paddingHorizontal: 20 }}>
  En continuant, vous acceptez nos <Text style={{color: colors.primary}} onPress={() => Linking.openURL('...')}>CGU</Text>. 
  Nexus n'est pas un médecin.
</Text>

                <View style={{ height: 30 }} />

                {/* BOUTON D'ACTION */}
                <TouchableOpacity onPress={handleAuth} disabled={loading} activeOpacity={0.8}>
                    <LinearGradient
                        colors={['#00f3ff', '#0066ff']}
                        start={{x:0, y:0}} end={{x:1, y:0}}
                        style={styles.authBtn}
                    >
                        {loading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <Text style={styles.authBtnText}>{isLogin ? "ACCÉDER AU SYSTÈME" : "INITIALISER LE COMPTE"}</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                {/* SÉPARATEUR */}
                <View style={styles.divider}>
                    <View style={styles.line} />
                    <Text style={styles.orText}>OU ACCÈS VIA</Text>
                    <View style={styles.line} />
                </View>

                {/* BOUTON GOOGLE */}
                <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin}>
                    <Ionicons name="logo-google" size={20} color="#fff" />
                    <Text style={styles.googleText}>GOOGLE LINK</Text>
                </TouchableOpacity>

                {/* SWITCH MODE */}
                <TouchableOpacity onPress={toggleMode} style={styles.switchBtn}>
                    <Text style={styles.switchText}>
                        {isLogin ? "Pas encore de clé ? " : "Déjà initié ? "}
                        <Text style={{ color: '#00f3ff', fontWeight: 'bold' }}>
                            {isLogin ? "Créer un accès" : "Connexion"}
                        </Text>
                    </Text>
                </TouchableOpacity>

            </Animated.View>
                        {/* --- DISCLAIMER LEGAL & MÉDICAL --- */}
            <View style={{ marginTop: 30, paddingHorizontal: 20, paddingBottom: 20, alignItems: 'center' }}>
                
                {/* Ligne de séparation subtile */}
                <View style={{ width: 40, height: 2, backgroundColor: colors.textSecondary, opacity: 0.1, marginBottom: 15 }} />

                <Text style={{ textAlign: 'center', color: colors.textSecondary, fontSize: 10, lineHeight: 16 }}>
                    En continuant, vous acceptez nos{' '}
                    <Text 
                        style={{ color: colors.primary, fontWeight: 'bold' }}
                        onPress={() => router.push('/profile/legal' as any)} // Redirige vers vos mentions légales
                    >
                        Conditions Générales
                    </Text>
                    .
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, opacity: 0.6 }}>
                    <MaterialCommunityIcons name="alert-decagram-outline" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={{ color: colors.textSecondary, fontSize: 9, fontWeight: 'bold' }}>
                        AVERTISSEMENT SYSTÈME
                    </Text>
                </View>

                <Text style={{ textAlign: 'center', color: colors.textSecondary, fontSize: 9, marginTop: 2, opacity: 0.6, maxWidth: 300 }}>
                    Nexus est une Intelligence Artificielle d'optimisation. Elle ne remplace en aucun cas un avis médical professionnel. Consultez un médecin avant de commencer un programme.
                </Text>
            </View>
            
            <View style={{ height: 20 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  glowBlob: {
    position: 'absolute',
    width: width,
    height: width,
    borderRadius: width / 2,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 25,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoIcon: {
    marginBottom: 10,
    textShadowColor: 'rgba(0, 243, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 3,
    marginTop: 5,
    fontWeight: 'bold',
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 55,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    flexWrap: 'wrap',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  termsText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  authBtn: {
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: "#00f3ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  authBtnText: {
    color: '#000', 
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  orText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontWeight: 'bold',
    marginHorizontal: 15,
    letterSpacing: 1,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 55,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 10,
  },
  googleText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  switchBtn: {
    marginTop: 30,
    alignItems: 'center',
  },
  switchText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
});