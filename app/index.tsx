import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, ScrollView, Animated, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import * as Haptics from 'expo-haptics';
import { Video, ResizeMode } from 'expo-av';
import { useTheme } from '../lib/theme';
import { useTranslation } from 'react-i18next';
import i18n from '../lib/i18n';

const { width, height } = Dimensions.get('window');

const FeatureBlock = ({ icon, title, text }: any) => (
    <View style={styles.featureBlock}>
        <View style={styles.featureIconBg}>
            <MaterialCommunityIcons name={icon} size={28} color="#00f3ff" />
        </View>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureText}>{text}</Text>
    </View>
);

const PricingCard = ({ tier, price, features, isPopular, onSelect, btnText }: any) => (
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
            <Text style={styles.tierPrice}>{price}</Text>
            <View style={styles.divider} />
            {features.map((feat: string, i: number) => (
                <View key={i} style={styles.featRow}>
                    <MaterialCommunityIcons name="check-circle" size={16} color={isPopular ? "#00f3ff" : "#888"} />
                    <Text style={[styles.featText, isPopular && {color:'#fff'}]}>{feat}</Text>
                </View>
            ))}
            <View style={[styles.selectBtn, isPopular ? {backgroundColor:'#00f3ff'} : {borderWidth:1, borderColor:'#444'}]}>
                <Text style={[styles.selectBtnText, isPopular ? {color:'#000'} : {color:'#fff'}]}>{btnText}</Text>
            </View>
        </LinearGradient>
    </TouchableOpacity>
);

export default function LandingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // SLIDES DÉFINIS À L'INTÉRIEUR POUR TRADUCTION
  const SLIDES = [
    {
        id: '1',
        video: require('../assets/tabata.mp4'), 
        title: t('landing.slides.title1'), 
        subtitle: t('landing.slides.sub1'),
        color: "#00f3ff"
    },
    {
        id: '2',
        video: require('../assets/dashboard.mp4'), 
        title: t('landing.slides.title2'), 
        subtitle: t('landing.slides.sub2'),
        color: "#d946ef"
    }
  ];

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            router.replace('/(tabs)/dashboard' as any);
        } else {
            setIsCheckingSession(false);
        }
    } catch (e) {
        setIsCheckingSession(false);
    }
  };

  const handleMainAction = () => {
      if (Platform.OS !== 'web') Haptics.selectionAsync();
      router.push('/auth/' as any);
  };

  const scrollToContent = () => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const toggleLanguage = () => {
      if (Platform.OS !== 'web') Haptics.selectionAsync();
      const current = i18n.language;
      const next = current === 'fr' ? 'en' : (current === 'en' ? 'ar' : 'fr');
      i18n.changeLanguage(next);
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

  if (isCheckingSession) {
      return (
          <View style={{flex:1, backgroundColor:'#000', justifyContent:'center', alignItems:'center'}}>
              <ActivityIndicator color="#00f3ff" size="large" />
          </View>
      );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage}>
          <Text style={styles.langText}>{i18n.language ? i18n.language.toUpperCase() : 'FR'}</Text>
      </TouchableOpacity>

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

              <View style={styles.floatCtaContainer}>
                  <TouchableOpacity style={styles.mainBtn} onPress={handleMainAction} activeOpacity={0.8}>
                      <LinearGradient colors={['#00f3ff', '#0066ff']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.btnGradient}>
                          <Text style={styles.mainBtnText}>{t('landing.start_btn')}</Text>
                          <Ionicons name="arrow-forward" size={20} color="#fff" />
                      </LinearGradient>
                  </TouchableOpacity>
                  
                
              </View>

              <TouchableOpacity style={styles.scrollDownBtn} onPress={scrollToContent}>
                  <MaterialCommunityIcons name="chevron-down" size={30} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
          </View>

          {/* 2. MANIFESTE */}
          <View style={styles.manifestoContainer}>
              <Text style={styles.manifestoTitle}>{t('landing.title')}</Text>
              <Text style={styles.manifestoText}>{t('landing.subtitle')}</Text>
              <View style={styles.featuresGrid}>
                  <FeatureBlock icon="brain" title={t('landing.features.brain_title')} text={t('landing.features.brain_text')} />
                  <FeatureBlock icon="dna" title={t('landing.features.bio_title')} text={t('landing.features.bio_text')} />
              </View>
              <Text style={[styles.loginLink, {marginTop: 40, fontSize: 10, opacity: 0.6}]}>{t('landing.legal')}</Text>
          </View>

          {/* 3. PRICING */}
          <View style={styles.pricingContainer}>
              <Text style={styles.sectionLabel}>{t('landing.pricing.title')}</Text>
              
              <PricingCard 
                  tier={t('landing.pricing.discovery.tier')}
                  price={t('landing.pricing.discovery.price')}
                  features={[
                      t('landing.pricing.discovery.f1'),
                      t('landing.pricing.discovery.f2'),
                      t('landing.pricing.discovery.f3'),
                      t('landing.pricing.discovery.f4'),
                      t('landing.pricing.discovery.f5')
                  ]}
                  isPopular={false}
                  onSelect={handleMainAction}
                  btnText={t('landing.pricing.select_btn')}
              />

              <PricingCard 
                  tier={t('landing.pricing.premium.tier')}
                  price={t('landing.pricing.premium.price') + t('landing.pricing.premium.period')}
                  features={[
                      t('landing.pricing.premium.f1'),
                      t('landing.pricing.premium.f2'),
                      t('landing.pricing.premium.f3'),
                      t('landing.pricing.premium.f4'),
                      t('landing.pricing.premium.f5')
                  ]}
                  isPopular={true}
                  onSelect={handleMainAction}
                  btnText={t('landing.pricing.select_btn')}
              />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  langBtn: { position: 'absolute', top: 50, right: 20, zIndex: 100, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  langText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  slideContent: { padding: 30, paddingBottom: 150 },
  slideTitle: { fontSize: 38, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, textShadowColor:'rgba(0,243,255,0.5)', textShadowRadius:20, color: '#fff' },
  slideSubtitle: { fontSize: 16, color: '#eee', fontWeight: '600', lineHeight: 24, maxWidth: '90%' },
  pagination: { position: 'absolute', bottom: 130, flexDirection: 'row', width: '100%', justifyContent: 'center', gap: 8 },
  dot: { height: 8, borderRadius: 4, backgroundColor: '#fff' },
  scrollDownBtn: { position: 'absolute', bottom: -40, width: '100%', alignItems: 'center', opacity: 0.8 },
  floatCtaContainer: { position: 'absolute', bottom: 40, width: '100%', paddingHorizontal: 20, alignItems: 'center' },
  loginLink: { color: '#888', textAlign: 'center', fontSize: 14, fontWeight:'600' },
  manifestoContainer: { padding: 30, backgroundColor: '#050505', paddingBottom: 50 },
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
  mainBtn: { width: '100%', borderRadius: 16, overflow: 'hidden', marginTop: 10, shadowColor: '#00f3ff', shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  btnGradient: { height: 60, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  mainBtnText: { color: '#000', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  footer: { marginTop: 0, paddingHorizontal: 20, paddingBottom: 40, paddingTop: 20, alignItems: 'center', backgroundColor: '#000' },
  footerDivider: { height: 1, width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 30 },
  footerContent: { alignItems: 'center' },
  footerText: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 5 },
  footerSubtext: { color: '#666', fontSize: 10, letterSpacing: 1, marginBottom: 20 },
  footerIcons: { flexDirection: 'row', marginBottom: 20 },
  copyright: { color: '#444', fontSize: 10 },
});