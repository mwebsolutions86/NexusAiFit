import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';

export default function Support() {
  const router = useRouter();
  const theme = useTheme();
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

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? 30 : 0 },
    
    auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
    blob: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.4 },
    
    scrollContent: { padding: 20 },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    headerTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '900', letterSpacing: 1 },

    section: { marginBottom: 30 },
    sectionTitle: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginBottom: 15, marginLeft: 5 },

    faqItem: { 
        backgroundColor: theme.colors.glass, 
        borderRadius: 15, padding: 15, marginBottom: 10, 
        borderWidth: 1, borderColor: theme.colors.border,
        shadowColor: theme.isDark ? 'transparent' : '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: theme.isDark ? 0 : 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    faqQuestion: { color: theme.colors.text, fontSize: 14, fontWeight: '600', flex: 1, marginRight: 10 },
    faqAnswer: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 10 },

    bugDescription: { color: theme.colors.textSecondary, fontSize: 14, marginBottom: 15, lineHeight: 20 },
    bugInput: { 
        backgroundColor: theme.colors.glass, 
        borderRadius: 15, padding: 15, 
        color: theme.colors.text, fontSize: 16, 
        borderWidth: 1, borderColor: theme.colors.border, 
        height: 120, textAlignVertical: 'top' 
    },

    submitBtn: { backgroundColor: theme.colors.primary, borderRadius: 25, padding: 18, alignItems: 'center', marginTop: 15 },
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },

    contactItem: { 
        flexDirection: 'row', alignItems: 'center', 
        backgroundColor: theme.colors.glass, 
        borderRadius: 15, padding: 15, marginBottom: 10, 
        borderWidth: 1, borderColor: theme.colors.border,
        shadowColor: theme.isDark ? 'transparent' : '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: theme.isDark ? 0 : 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    contactIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: theme.colors.bg, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    contactLabel: { color: theme.colors.text, fontSize: 14, fontWeight: '600' },
    contactValue: { color: theme.colors.textSecondary, fontSize: 12 },

    footer: { marginTop: 40, paddingHorizontal: 20, paddingBottom: 30, alignItems: 'center' },
    footerDivider: { height: 1, width: '100%', backgroundColor: theme.colors.border, marginBottom: 20 },
    footerContent: { alignItems: 'center' },
    footerText: { color: theme.colors.text, fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 5 },
    footerSubtext: { color: theme.colors.textSecondary, fontSize: 10, letterSpacing: 1, marginBottom: 15 },
    footerIcons: { flexDirection: 'row', marginBottom: 15 },
    copyright: { color: theme.colors.textSecondary, fontSize: 9 },
  });

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />

      {theme.isDark && (
        <View style={styles.auroraBg}>
            <View style={[styles.blob, { top: -100, right: -50, backgroundColor: 'rgba(0, 243, 255, 0.15)' }]} />
            <View style={[styles.blob, { top: 200, left: -100, backgroundColor: 'rgba(139, 92, 246, 0.15)' }]} />
        </View>
      )}

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.primary} />
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
                    color={theme.colors.textSecondary}
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
              placeholderTextColor={theme.colors.textSecondary}
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
                  <MaterialCommunityIcons name={method.icon as any} size={20} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactLabel}>{method.label}</Text>
                  <Text style={styles.contactValue}>{method.value}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 100 }} />

          {/* PIED DE PAGE */}
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
      </SafeAreaView>
    </View>
  );
}