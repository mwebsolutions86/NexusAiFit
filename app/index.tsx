import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Dimensions, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Animated, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { Video, ResizeMode } from 'expo-av';
import { useTheme } from '../lib/theme';

const { width, height } = Dimensions.get('window');

// --- DATA STORYTELLING ---
const SLIDES = [
    {
        id: '1',
        video: require('../assets/tabata.mp4'), 
        title: "NE DEVINEZ PLUS.\nCALCULEZ.",
        subtitle: "L'effort est brut. La méthode est scientifique.",
        color: "#00f3ff"
    },
    {
        id: '2',
        video: require('../assets/dashboard.mp4'), 
        title: "VOTRE CORPS EST\nUN ALGORITHME",
        subtitle: "Bio-Tracking temps réel. Analyse Neural. Optimisation continue.",
        color: "#d946ef"
    }
];

// --- COMPOSANTS UI ---

const PricingCard = ({ tier, price, features, isPopular, onSelect }: any) => (
    <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={onSelect} 
        style={[styles.pricingCard, isPopular && styles.pricingCardPopular]}
    >
        <LinearGradient
            colors={isPopular ? ['rgba(0, 243, 255, 0.15)', 'rgba(0,0,0,0.4)'] : ['rgba(255,255,255,0.05)', 'rgba(0,0,0,0)']}
            style={styles.pricingGradient}
        >
            {isPopular && <View style={styles.popularBadge}><Text style={styles.popularText}>RECOMMANDÉ</Text></View>}
            <Text style={styles.tierName}>{tier}</Text>
            <Text style={styles.tierPrice}>{price}<Text style={styles.tierPeriod}>/mois</Text></Text>
            <View style={styles.divider} />
            {features.map((feat: string, i: number) => (
                <View key={i} style={styles.featRow}>
                    <MaterialCommunityIcons name="check-circle" size={16} color={isPopular ? "#00f3ff" : "#888"} />
                    <Text style={[styles.featText, isPopular && {color:'#fff'}]}>{feat}</Text>
                </View>
            ))}
            <View style={[styles.selectBtn, isPopular ? {backgroundColor:'#00f3ff'} : {borderWidth:1, borderColor:'#444'}]}>
                <Text style={[styles.selectBtnText, isPopular ? {color:'#000'} : {color:'#fff'}]}>CHOISIR</Text>
            </View>
        </LinearGradient>
    </TouchableOpacity>
);

const FeatureBlock = ({ icon, title, text }: any) => (
    <View style={styles.featureBlock}>
        <View style={styles.featureIconBg}>
            <MaterialCommunityIcons name={icon} size={28} color="#00f3ff" />
        </View>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureText}>{text}</Text>
    </View>
);

export default function AuthScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'INTRO' | 'AUTH'>('INTRO');
  const [isLogin, setIsLogin] = useState(false); 
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  const handleMainAction = () => {
      if (Platform.OS !== 'web') Haptics.selectionAsync();
      setStep('AUTH');
      setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
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
        Alert.alert("Erreur", "Veuillez remplir tous les champs.");
        return;
    }
    
    if (!isLogin && !agreeTerms) {
        Alert.alert("Accord requis", "Veuillez accepter les conditions et l'avertissement médical.");
        return;
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
            await checkProfileAndRedirect(user.id);
        } else {
            Alert.alert("Vérification", "Un email de confirmation a été envoyé.");
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
     if (!isLogin && !agreeTerms) {
         Alert.alert("Accord requis", "Veuillez cocher la case confirmant que vous acceptez les conditions médicales.");
         return;
     }

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
        Alert.alert("Erreur Google", e.message);
     }
  };

  const scrollToAuth = () => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const renderItem = ({ item, index }: any) => {
      const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
      const translateX = scrollX.interpolate({
          inputRange,
          outputRange: [width * 0.5, 0, -width * 0.5],
      });

      return (
          <View style={{ width, height: height * 0.85, justifyContent:'flex-end' }}>
              <View style={StyleSheet.absoluteFillObject}>
                  <Video
                      source={item.video}
                      style={StyleSheet.absoluteFill}
                      resizeMode={ResizeMode.COVER}
                      isLooping
                      shouldPlay={true}
                      isMuted={true}
                  />
                  <LinearGradient 
                    colors={['transparent', 'rgba(0,0,0,0.6)', '#000']} 
                    style={StyleSheet.absoluteFill} 
                  />
              </View>
              <Animated.View style={[styles.slideContent, { transform: [{ translateX }] }]}>
                  <Text style={[styles.slideTitle, { color: item.color }]}>{item.title}</Text>
                  <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
              </Animated.View>
          </View>
      );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView 
            ref={scrollViewRef}
            contentContainerStyle={{ paddingBottom: 0 }} 
            showsVerticalScrollIndicator={false}
            bounces={false}
        >
            
            {/* 1. HEADER VIDEO */}
            <View style={{height: height * 0.85}}>
                <Animated.FlatList
                    data={SLIDES}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                        { useNativeDriver: false }
                    )}
                    scrollEventThrottle={16}
                />
                <View style={styles.pagination}>
                    {SLIDES.map((_, i) => {
                        const widthDot = scrollX.interpolate({
                            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                            outputRange: [8, 24, 8],
                            extrapolate: 'clamp'
                        });
                        const colorDot = scrollX.interpolate({
                            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                            outputRange: ['#666', '#00f3ff', '#666'],
                            extrapolate: 'clamp'
                        });
                        return <Animated.View key={i} style={[styles.dot, { width: widthDot, backgroundColor: colorDot }]} />;
                    })}
                </View>

                {/* BOUTON FLOTTANT PRINCIPAL */}
              

                <TouchableOpacity style={styles.scrollDownBtn} onPress={scrollToAuth}>
                    <MaterialCommunityIcons name="chevron-down" size={30} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
            </View>

            {/* 2. MANIFESTE */}
            <View style={styles.manifestoContainer}>
                <Text style={styles.manifestoTitle}>L'IA NE DEVINE PAS.{"\n"}ELLE CALCULE.</Text>
                <Text style={styles.manifestoText}>
                    Nexus utilise vos données biologiques pour créer une stratégie chirurgicale.
                </Text>
                <View style={styles.featuresGrid}>
                    <FeatureBlock icon="brain" title="NEURAL COACH" text="Une IA qui apprend de vos échecs pour garantir vos succès." />
                    <FeatureBlock icon="dna" title="BIO-HACKING" text="Sommeil, Stress, VFC. Maîtrisez vos variables invisibles." />
                </View>
            </View>

            {/* 3. PRICING */}
            <View style={styles.pricingContainer}>
                <Text style={styles.sectionLabel}>OFFRES DISPONIBLES</Text>
                
                <PricingCard 
                    tier="DÉCOUVERTE" 
                    price="GRATUIT" 
                    features={['Podomètre & Métriques', 'Journal Hydratation', 'Suivi Poids', 'Chrono Simple', 'Accès Limité']}
                    isPopular={false}
                    onSelect={handleMainAction}
                />

                <PricingCard 
                    tier="PREMIUM" 
                    price="5.99€" 
                    features={['Coach IA Illimité', 'Programmes Sportifs IA', 'Plan Nutritionnel IA', 'Bio-Tracking Complet', 'Outils Élite']}
                    isPopular={true}
                    onSelect={handleMainAction}
                />
            </View>

            {/* 4. AUTHENTIFICATION */}
            <View style={styles.authSection}>
                <LinearGradient colors={['transparent', 'rgba(0, 243, 255, 0.05)']} style={styles.authGradient} />
                
                <View style={{alignItems:'center', marginBottom: 30}}>
                    <MaterialCommunityIcons name="shield-account" size={50} color="#00f3ff" style={{opacity:0.8, marginBottom: 10}} />
                    <Text style={styles.authTitle}>CONNEXION SÉCURISÉE</Text>
                    <Text style={styles.authSub}>Identifiez-vous pour synchroniser vos données.</Text>
                </View>

                <View style={styles.authTabs}>
                    <TouchableOpacity 
                        style={[styles.authTab, !isLogin && styles.authTabActive]} 
                        onPress={() => setIsLogin(false)}
                    >
                        <Text style={[styles.authTabText, !isLogin && styles.authTabTextActive]}>S'INSCRIRE</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.authTab, isLogin && styles.authTabActive]} 
                        onPress={() => setIsLogin(true)}
                    >
                        <Text style={[styles.authTabText, isLogin && styles.authTabTextActive]}>SE CONNECTER</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.inputWrapper}>
                    <Text style={styles.label}>IDENTIFIANT</Text>
                    <View style={styles.glassInput}>
                        <MaterialCommunityIcons name="email" size={20} color="#666" />
                        <TextInput 
                            style={styles.input} 
                            placeholder="agent@nexus.com" 
                            placeholderTextColor="#444"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>
                </View>

                <View style={styles.inputWrapper}>
                    <Text style={styles.label}>CLÉ D'ACCÈS</Text>
                    <View style={styles.glassInput}>
                        <MaterialCommunityIcons name="lock" size={20} color="#666" />
                        <TextInput 
                            style={styles.input} 
                            placeholder="••••••••" 
                            placeholderTextColor="#444"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>
                </View>

                {!isLogin && (
                    <TouchableOpacity 
                        style={styles.termsContainer} 
                        onPress={() => setAgreeTerms(!agreeTerms)}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.checkbox, agreeTerms && styles.checkboxActive]}>
                            {agreeTerms && <Ionicons name="checkmark" size={14} color="#000" />}
                        </View>
                        <Text style={styles.termsText}>
                            Je confirme que Nexus IA ne remplace pas un médecin et j'accepte les <Text style={styles.link} onPress={() => router.push('/legal')}>CGU</Text>.
                        </Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.mainBtn} onPress={handleAuth} disabled={loading}>
                    <LinearGradient colors={['#00f3ff', '#0066ff']} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.btnGradient}>
                        {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.mainBtnText}>{isLogin ? "LANCER LA SESSION" : "REJOINDRE L'ÉLITE"}</Text>}
                    </LinearGradient>
                </TouchableOpacity>

                <View style={styles.dividerContainer}>
                    <View style={styles.line} />
                    <Text style={styles.orText}>OU VIA</Text>
                    <View style={styles.line} />
                </View>

                <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin}>
                    <Ionicons name="logo-google" size={20} color="#fff" style={{marginRight: 10}} />
                    <Text style={styles.googleText}>Continuer avec Google</Text>
                </TouchableOpacity>
            </View>

            {/* 5. FOOTER */}
            <View style={styles.footer}>
                <View style={styles.footerDivider} />
                <View style={styles.footerContent}>
                    <Text style={styles.footerText}>NEXUS AI FIT v1.0</Text>
                    <Text style={styles.footerSubtext}>SYSTÈME DE GESTION BIOLOGIQUE AVANCÉ</Text>
                    <View style={styles.footerIcons}>
                        <MaterialCommunityIcons name="shield-check-outline" size={16} color="#666" style={{marginRight: 15}} />
                        <MaterialCommunityIcons name="server-network" size={16} color="#666" style={{marginRight: 15}} />
                        <MaterialCommunityIcons name="brain" size={16} color="#666" />
                    </View>
                    <Text style={styles.copyright}>© 2025 NEXUS INC. TOUS DROITS RÉSERVÉS.</Text>
                </View>
            </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? 25 : 0 },
  auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
  blob: { position: 'absolute', width: 500, height: 500, borderRadius: 250, opacity: 0.15 },
  
  slideContent: { padding: 30, paddingBottom: 150 },
  slideTitle: { fontSize: 38, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, textShadowColor:'rgba(0,243,255,0.5)', textShadowRadius:20, color: '#fff' },
  slideSubtitle: { fontSize: 16, color: '#eee', fontWeight: '600', lineHeight: 24, maxWidth: '90%' },
  pagination: { position: 'absolute', bottom: 120, flexDirection: 'row', width: '100%', justifyContent: 'center', gap: 8 },
  dot: { height: 8, borderRadius: 4, backgroundColor: '#fff' },
  scrollDownBtn: { position: 'absolute', bottom: 10, width: '100%', alignItems: 'center', opacity: 0.8 },
  scrollText: { color: '#fff', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginBottom: -5 },
  floatCtaContainer: { position: 'absolute', bottom: 30, width: '100%', paddingHorizontal: 20, alignItems: 'center' },
  loginLink: { color: '#888', textAlign: 'center', fontSize: 14, fontWeight:'600' },
  manifestoContainer: { padding: 30, backgroundColor: '#050505' },
  manifestoTitle: { color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 15, lineHeight: 32 },
  manifestoText: { color: '#aaa', fontSize: 16, lineHeight: 26 },
  featuresGrid: { marginTop: 40, gap: 20 },
  featureBlock: { flexDirection: 'column', alignItems: 'flex-start' },
  featureIconBg: { width: 50, height: 50, borderRadius: 15, backgroundColor: 'rgba(0,243,255,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: 'rgba(0,243,255,0.2)' },
  featureTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 5, letterSpacing: 1 },
  featureText: { color: '#888', fontSize: 13, lineHeight: 20 },
  pricingContainer: { padding: 20, backgroundColor: '#000' },
  sectionLabel: { color: '#00f3ff', fontSize: 12, fontWeight: '900', letterSpacing: 3, marginBottom: 30, textAlign: 'center', marginTop: 20 },
  pricingCard: { marginBottom: 20, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#0a0a0a' },
  pricingCardPopular: { borderColor: '#00f3ff', borderWidth: 2, transform: [{scale: 1.02}], shadowColor: "#00f3ff", shadowOpacity: 0.2, shadowRadius: 20 },
  pricingGradient: { padding: 30, alignItems: 'center' },
  popularBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#00f3ff', paddingHorizontal: 15, paddingVertical: 5, borderBottomLeftRadius: 15 },
  popularText: { color: '#000', fontSize: 10, fontWeight: '900' },
  tierName: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 2, marginBottom: 5 },
  tierPrice: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  tierPeriod: { fontSize: 14, color: '#666', fontWeight: 'normal' },
  divider: { width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 20 },
  featRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, width: '100%' },
  featText: { color: '#999', fontSize: 14, marginLeft: 12, fontWeight: '500' },
  selectBtn: { marginTop: 20, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 20 },
  selectBtnText: { fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  authSection: { padding: 30, backgroundColor: '#080808', borderTopWidth: 1, borderTopColor: '#222', paddingBottom: 10 },
  authGradient: { ...StyleSheet.absoluteFillObject },
  authTitle: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 2 },
  authSub: { color: '#666', fontSize: 12, marginTop: 5 },
  authTabs: { flexDirection: 'row', marginBottom: 30, backgroundColor: '#111', borderRadius: 15, padding: 4 },
  authTab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  authTabActive: { backgroundColor: '#222' },
  authTabText: { color: '#666', fontWeight: 'bold', fontSize: 12 },
  authTabTextActive: { color: '#fff' },
  inputWrapper: { marginBottom: 20, width: '100%' },
  label: { color: '#00f3ff', fontSize: 10, fontWeight: 'bold', marginBottom: 8, marginLeft: 4 },
  glassInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 15, height: 55 },
  input: { flex: 1, color: '#fff', marginLeft: 10, fontWeight: 'bold', fontSize: 16 },
  mainBtn: { width: '100%', borderRadius: 16, overflow: 'hidden', marginTop: 10 },
  btnGradient: { height: 60, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  mainBtnText: { color: '#000', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', height: 55, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  googleText: { color: '#fff', fontWeight: 'bold' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 30 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  orText: { color: '#666', fontSize: 10, marginHorizontal: 15, fontWeight: 'bold' },
  termsContainer: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 5, paddingHorizontal: 5, marginBottom: 15 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: '#00f3ff', justifyContent: 'center', alignItems: 'center', marginRight: 10, marginTop: 2 },
  checkboxActive: { backgroundColor: '#00f3ff' },
  termsText: { color: '#aaa', fontSize: 12, flex: 1, lineHeight: 18 },
  link: { color: '#00f3ff', textDecorationLine: 'underline' },
  backBtnAbsolute: { position: 'absolute', top: 50, left: 20, zIndex: 10, padding: 10 },
  footer: { marginTop: 0, paddingHorizontal: 20, paddingBottom: 40, paddingTop: 20, alignItems: 'center', backgroundColor: '#000' },
  footerDivider: { height: 1, width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 30 },
  footerContent: { alignItems: 'center' },
  footerText: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 5 },
  footerSubtext: { color: '#666', fontSize: 10, letterSpacing: 1, marginBottom: 20 },
  footerIcons: { flexDirection: 'row', marginBottom: 20 },
  copyright: { color: '#444', fontSize: 10 },
});