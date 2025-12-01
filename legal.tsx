import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Legal() {
  const router = useRouter();

  const sections = [
    {
      title: 'Conditions Générales d\'Utilisation (CGU)',
      content: `
Les présentes conditions générales d'utilisation (CGU) régissent l'utilisation de l'application NexusAiFit.

1. ACCEPTATION DES CONDITIONS
En utilisant NexusAiFit, vous acceptez d'être lié par ces CGU. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser l'application.

2. DESCRIPTION DU SERVICE
NexusAiFit est une application de fitness et nutrition assistée par IA qui fournit des programmes personnalisés, du suivi des performances et des conseils nutritionnels.

3. UTILISATION DU SERVICE
- Vous devez avoir au moins 16 ans pour utiliser l'application
- Les informations fournies doivent être exactes et à jour
- Vous êtes responsable de la confidentialité de votre compte

4. PROPRIÉTÉ INTELLECTUELLE
Tous les contenus de l'application sont la propriété exclusive de NexusAiFit ou de ses partenaires.

5. RESPONSABILITÉ
L'application fournit des conseils généraux. Consultez un professionnel de santé avant de commencer tout programme.

6. MODIFICATION DES CONDITIONS
Nous nous réservons le droit de modifier ces CGU à tout moment.
      `
    },
    {
      title: 'Conditions Générales de Vente (CGV)',
      content: `
Conditions applicables aux achats intégrés dans l'application NexusAiFit.

1. PRODUITS ET SERVICES
- Abonnements premium
- Contenus exclusifs
- Programmes spécialisés

2. PRIX ET PAIEMENT
- Les prix sont affichés en euros TTC
- Paiement sécurisé via les stores
- Remboursement selon les conditions des stores

3. DROIT DE RÉTRACTATION
Conformément à la législation, droit de rétractation de 14 jours pour les achats numériques.

4. SUPPORT CLIENT
Contact: support@nexusai.fit
      `
    },
    {
      title: 'Politique de Confidentialité',
      content: `
NexusAiFit s'engage à protéger votre vie privée et vos données personnelles.

1. DONNÉES COLLECTÉES
- Informations de profil (nom, âge, poids, taille)
- Données de performance sportive
- Historique nutritionnel
- Données d'utilisation de l'application

2. UTILISATION DES DONNÉES
- Personnalisation des programmes
- Amélioration des services
- Statistiques anonymes
- Communication marketing (avec consentement)

3. PARTAGE DES DONNÉES
Vos données ne sont jamais vendues à des tiers. Partage uniquement avec :
- Prestataires techniques (hébergement, analyse)
- Autorités légales si requis

4. SÉCURITÉ
- Chiffrement des données sensibles
- Accès restreint aux données
- Sauvegarde régulière

5. VOS DROITS
Conformément au RGPD :
- Droit d'accès à vos données
- Droit de rectification
- Droit à l'effacement
- Droit à la portabilité

Contact RGPD: privacy@nexusai.fit
      `
    },
    {
      title: 'Mentions Légales',
      content: `
ÉDITEUR DE L'APPLICATION
NexusAiFit
Société [À DÉFINIR]
Adresse: [À DÉFINIR]
Email: contact@nexusai.fit

DIRECTEUR DE PUBLICATION
[À DÉFINIR]

HÉBERGEMENT
Supabase Inc.
Adresse: 548 Market St #35890, San Francisco, CA 94104, États-Unis

PROPRIÉTÉ INTELLECTUELLE
L'application NexusAiFit et son contenu sont protégés par le droit d'auteur.
Toutes les marques sont la propriété de leurs détenteurs respectifs.

RESPONSABILITÉ
L'éditeur ne peut être tenu responsable des dommages directs ou indirects résultant de l'utilisation de l'application.

DROIT APPLICABLE
Ces mentions légales sont soumises au droit français.
      `
    }
  ];

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
          <Text style={styles.headerTitle}>MENTIONS LÉGALES</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {sections.map((section, index) => (
            <View key={index} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionContent}>{section.content.trim()}</Text>
            </View>
          ))}

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
  sectionTitle: { color: '#00f3ff', fontSize: 16, fontWeight: '900', marginBottom: 15, letterSpacing: 1 },
  sectionContent: { color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 20 },
   // Footer Futuriste
  footer: { marginTop: 40, paddingHorizontal: 20, paddingBottom: 30, alignItems: 'center' },
  footerDivider: { height: 1, width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 20 },
  footerContent: { alignItems: 'center' },
  footerText: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 5 },
  footerSubtext: { color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 1, marginBottom: 15 },
  footerIcons: { flexDirection: 'row', marginBottom: 15 },
  copyright: { color: 'rgba(255,255,255,0.2)', fontSize: 9 },
});