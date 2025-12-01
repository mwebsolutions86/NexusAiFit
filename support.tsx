import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function Support() {
  const router = useRouter();
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [bugReport, setBugReport] = useState('');
  const [sending, setSending] = useState(false);

  const faqData = [
    {
      question: "Comment créer un programme d'entraînement personnalisé ?",
      answer: "Accédez à l'onglet 'SPORT' et utilisez l'IA Coach pour générer un programme adapté à vos objectifs, niveau et disponibilités."
    },
    {
      question: "Comment suivre ma progression ?",
      answer: "Tous vos entraînements sont automatiquement sauvegardés. Consultez vos statistiques dans le dashboard et l'historique des séances."
    },
    {
      question: "Puis-je modifier mon plan nutritionnel ?",
      answer: "Oui, rendez-vous dans l'onglet 'NUTRITION' pour ajuster vos repas, calories cibles et préférences alimentaires."
    },
    {
      question: "Comment calculer mon 1RM ?",
      answer: "Utilisez l'outil 'Calculateur 1RM' dans les modules pour estimer votre force maximale sur chaque exercice."
    },
    {
      question: "L'application fonctionne-t-elle hors ligne ?",
      answer: "Certaines fonctionnalités nécessitent une connexion internet (IA Coach, synchronisation). Les programmes téléchargés fonctionnent hors ligne."
    },
    {
      question: "Comment contacter le support ?",
      answer: "Utilisez le formulaire de signalement ci-dessous ou contactez-nous à support@nexusai.fit"
    }
  ];

  const contactMethods = [
    {
      icon: 'email',
      label: 'Email Support',
      value: 'support@nexusai.fit',
      action: () => Linking.openURL('mailto:support@nexusai.fit')
    },
    {
      icon: 'web',
      label: 'Site Web',
      value: 'www.nexusai.fit',
      action: () => Linking.openURL('https://www.nexusai.fit')
    },
    {
      icon: 'discord',
      label: 'Communauté Discord',
      value: 'Rejoignez-nous',
      action: () => Linking.openURL('https://discord.gg/nexusai')
    }
  ];

  const submitBugReport = async () => {
    if (!bugReport.trim()) {
      Alert.alert('Erreur', 'Veuillez décrire le problème rencontré.');
      return;
    }

    setSending(true);
    try {
      // Simulation d'envoi - à remplacer par l'API réelle
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Merci !', 'Votre signalement a été envoyé. Nous vous répondrons sous 24h.');
      setBugReport('');

    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'envoyer le signalement. Réessayez plus tard.');
    } finally {
      setSending(false);
    }
  };

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
    if (Platform.OS !== 'web') Haptics.selectionAsync();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

      <View style={styles.auroraBg}>
        <View style={[styles.blob, { top: -100, right: -50, backgroundColor: 'rgba(0, 243, 255, 0.15)' }]} />
        <View style={[styles.blob, { top: 200, left: -100, backgroundColor: 'rgba(139, 92, 246, 0.15)' }]} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#00f3ff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>SUPPORT & AIDE</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >

          {/* FAQ */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>QUESTIONS FRÉQUENTES</Text>

            {faqData.map((faq, index) => (
              <TouchableOpacity
                key={index}
                style={styles.faqItem}
                onPress={() => toggleFAQ(index)}
                activeOpacity={0.8}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <MaterialCommunityIcons
                    name={expandedFAQ === index ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="rgba(255,255,255,0.6)"
                  />
                </View>

                {expandedFAQ === index && (
                  <Text style={styles.faqAnswer}>{faq.answer}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* SIGNALEMENT BUG */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SIGNALER UN PROBLÈME</Text>

            <Text style={styles.bugDescription}>
              Rencontrez-vous un bug ou une erreur ? Décrivez le problème ci-dessous et nous le corrigerons rapidement.
            </Text>

            <TextInput
              style={styles.bugInput}
              value={bugReport}
              onChangeText={setBugReport}
              placeholder="Décrivez le problème rencontré..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.submitBtn, sending && styles.submitBtnDisabled]}
              onPress={submitBugReport}
              disabled={sending}
            >
              <Text style={styles.submitBtnText}>
                {sending ? 'ENVOI...' : 'ENVOYER LE SIGNALEMENT'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* CONTACT */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>NOUS CONTACTER</Text>

            {contactMethods.map((method, index) => (
              <TouchableOpacity
                key={index}
                style={styles.contactItem}
                onPress={method.action}
                activeOpacity={0.8}
              >
                <View style={styles.contactIcon}>
                  <MaterialCommunityIcons name={method.icon as any} size={20} color="#00f3ff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactLabel}>{method.label}</Text>
                  <Text style={styles.contactValue}>{method.value}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 100 }} />
          {/* PIED DE PAGE FUTURISTE */}
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
      </SafeAreaView>
    </View>
  );
  
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? 30 : 0 },
  auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
  blob: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.4 },
  scrollContent: { padding: 20 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1 },

  section: { marginBottom: 30 },
  sectionTitle: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginBottom: 15, marginLeft: 5 },

  faqItem: { backgroundColor: 'rgba(20, 20, 30, 0.6)', borderRadius: 15, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1, marginRight: 10 },
  faqAnswer: { color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 18, marginTop: 10 },

  bugDescription: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 15, lineHeight: 20 },
  bugInput: { backgroundColor: 'rgba(20, 20, 30, 0.6)', borderRadius: 15, padding: 15, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', height: 120, textAlignVertical: 'top' },

  submitBtn: { backgroundColor: '#00f3ff', borderRadius: 25, padding: 18, alignItems: 'center', marginTop: 15 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#000', fontSize: 14, fontWeight: '900', letterSpacing: 1 },

  contactItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(20, 20, 30, 0.6)', borderRadius: 15, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  contactIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  contactLabel: { color: '#fff', fontSize: 14, fontWeight: '600' },
  contactValue: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  // Footer Futuriste
  footer: { marginTop: 40, paddingHorizontal: 20, paddingBottom: 30, alignItems: 'center' },
  footerDivider: { height: 1, width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 20 },
  footerContent: { alignItems: 'center' },
  footerText: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 5 },
  footerSubtext: { color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 1, marginBottom: 15 },
  footerIcons: { flexDirection: 'row', marginBottom: 15 },
  copyright: { color: 'rgba(255,255,255,0.2)', fontSize: 9 },
});