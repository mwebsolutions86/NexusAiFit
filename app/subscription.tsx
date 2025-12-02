import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert, Platform, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next'; // Import

const { width, height } = Dimensions.get('window');

export default function SubscriptionScreen() {
  const router = useRouter();
  const { t } = useTranslation(); // Hook
  const [loading, setLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        const { data } = await supabase.from('profiles').select('tier').eq('id', session.user.id).single();
        const tier = (data?.tier || 'FREE').toUpperCase();
        setIsPremium(['PREMIUM', 'ELITE', 'AVANCE'].includes(tier));
    }
  };

  const handlePurchase = async () => {
    setLoading(true);
    setTimeout(async () => {
        setLoading(false);
        Alert.alert(t('subscription.alert_pay_title'), t('subscription.alert_pay_msg'), [{ text: "OK" }]);
        const { data: { session } } = await supabase.auth.getSession();
        if(session) {
            await supabase.from('profiles').update({ tier: 'PREMIUM' }).eq('id', session.user.id);
            setIsPremium(true);
        }
    }, 1500);
  };

  const handleRestore = () => {
    Alert.alert(t('subscription.alert_restore'), t('subscription.alert_restore_msg'));
  };

  const handleManage = () => {
      if (Platform.OS === 'ios') {
          Linking.openURL('https://apps.apple.com/account/subscriptions');
      } else {
          Linking.openURL('https://play.google.com/store/account/subscriptions');
      }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    background: { position: 'absolute', width: width, height: height },
    closeBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },
    content: { flex: 1, padding: 24, paddingTop: 80 },
    header: { alignItems: 'center', marginBottom: 40 },
    badge: { backgroundColor: '#FFD700', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 20 },
    badgeText: { fontSize: 12, fontWeight: '900', color: '#000', letterSpacing: 2 },
    title: { fontSize: 32, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 10 },
    subtitle: { fontSize: 16, color: '#ccc', textAlign: 'center', lineHeight: 24 },
    activeCard: { backgroundColor: 'rgba(255,215,0,0.1)', borderWidth: 1, borderColor: '#FFD700', borderRadius: 20, padding: 20, marginBottom: 30 },
    activeTitle: { color: '#FFD700', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
    activeSub: { color: '#fff', fontSize: 14, marginBottom: 20 },
    features: { marginBottom: 40 },
    featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
    featureText: { color: '#fff', fontSize: 16, marginLeft: 15, fontWeight: '500' },
    footer: { marginTop: 'auto', paddingBottom: 40 },
    price: { fontSize: 24, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 20 },
    ctaBtn: { width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 15 },
    btnGradient: { paddingVertical: 18, alignItems: 'center' },
    btnText: { fontSize: 16, fontWeight: '900', color: '#000', letterSpacing: 1 },
    secondaryBtn: { paddingVertical: 15, alignItems: 'center' },
    secondaryText: { color: '#999', fontSize: 14, textDecorationLine: 'underline' },
    legalRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 10 },
    legalText: { color: '#666', fontSize: 12 }
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.background} />
      
      <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#fff" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
              <View style={styles.badge}>
                  <Text style={styles.badgeText}>{isPremium ? t('subscription.status_badge') : t('subscription.badge')}</Text>
              </View>
              <Text style={styles.title}>{isPremium ? t('subscription.title_pro') : t('subscription.title_free')}</Text>
              {!isPremium && <Text style={styles.subtitle}>{t('subscription.subtitle')}</Text>}
          </View>

          {isPremium ? (
              <View style={styles.activeCard}>
                  <Text style={styles.activeTitle}>{t('subscription.active_title')}</Text>
                  <Text style={styles.activeSub}>{t('subscription.active_renewal')}</Text>
                  
                  <TouchableOpacity style={styles.ctaBtn} onPress={handleManage}>
                      <LinearGradient colors={['#333', '#555']} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.btnGradient}>
                          <Text style={[styles.btnText, {color:'#fff'}]}>{t('subscription.manage_btn')}</Text>
                      </LinearGradient>
                  </TouchableOpacity>
                  <Text style={{color:'#999', fontSize:12, textAlign:'center'}}>{t('subscription.manage_info')}</Text>
              </View>
          ) : (
              <View>
                 <View style={styles.features}>
                    {[
                        t('subscription.features.coach'),
                        t('subscription.features.plans'),
                        t('subscription.features.bio'),
                        t('subscription.features.recipes'),
                        t('subscription.features.support')
                    ].map((feat, i) => (
                        <View key={i} style={styles.featureRow}>
                            <MaterialCommunityIcons name="check-circle" size={24} color="#FFD700" />
                            <Text style={styles.featureText}>{feat}</Text>
                        </View>
                    ))}
                </View>
                
                <View style={styles.footer}>
                    <Text style={styles.price}>5.99€ <Text style={{fontSize:16, color:'#ccc'}}>{t('subscription.price_month')}</Text></Text>
                    
                    <TouchableOpacity style={styles.ctaBtn} onPress={handlePurchase} disabled={loading}>
                        <LinearGradient colors={['#FFD700', '#FFA500']} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.btnGradient}>
                            {loading ? <ActivityIndicator color="#000"/> : <Text style={styles.btnText}>{t('subscription.btn_start')}</Text>}
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleRestore} style={styles.secondaryBtn}>
                        <Text style={styles.secondaryText}>{t('subscription.btn_restore')}</Text>
                    </TouchableOpacity>
                </View>
              </View>
          )}

          <View style={styles.legalRow}>
              <TouchableOpacity onPress={() => router.push('/profile/legal')}><Text style={styles.legalText}>{t('subscription.legal_terms')}</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/profile/legal')}><Text style={styles.legalText}>{t('subscription.legal_privacy')}</Text></TouchableOpacity>
          </View>

      </ScrollView>
    </View>
  );
}