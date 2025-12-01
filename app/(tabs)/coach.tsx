import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { generateAIResponse } from '../../lib/groq';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../lib/theme';
import { useRouter, useFocusEffect } from 'expo-router';

// --- TYPES ---
type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
};

export default function CoachScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // État pour l'accès Premium
  const [isPremium, setIsPremium] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 90 : 70;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Système NEXUS activé. Je suis prêt à optimiser vos performances. Quelle est la mission aujourd'hui ?",
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);

  // VÉRIFICATION DE L'ACCÈS À CHAQUE FOIS QU'ON VIENT SUR L'ONGLET
  useFocusEffect(
    useCallback(() => {
      checkPremiumAccess();
    }, [])
  );

  const checkPremiumAccess = async () => {
      setCheckingAccess(true);
      try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
              setIsPremium(false);
              setCheckingAccess(false);
              return;
          }

          const { data } = await supabase
            .from('profiles')
            .select('tier')
            .eq('id', session.user.id)
            .single();
          
          // On vérifie si le tier est PREMIUM (ou les anciens noms pour compatibilité)
          const tier = (data?.tier || '').toUpperCase();
          const hasAccess = ['PREMIUM', 'ELITE', 'AVANCE', 'ESSENTIEL'].includes(tier);
          
          setIsPremium(hasAccess);
      } catch (error) {
          console.log("Erreur vérification premium", error);
          setIsPremium(false);
      } finally {
          setCheckingAccess(false);
      }
  };

  useEffect(() => {
    if (isPremium) {
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, isPremium]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput(''); 
    if (Platform.OS !== 'web') Haptics.selectionAsync();

    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: userMsg,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newUserMessage]);

    setLoading(true);
    try {
      const aiReply = await generateAIResponse("Réponds de manière concise et motivante.", userMsg);
      
      const finalResponse = aiReply || "Désolé, mes systèmes neuronaux ne répondent pas. Vérifiez votre connexion.";

      const newAiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: finalResponse,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, newAiMessage]);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    } catch (error) {
      console.log("Erreur Coach:", error);
      Alert.alert("Erreur", "Impossible de contacter le serveur IA.");
    } finally {
      setLoading(false);
    }
  };

  // --- STYLES DYNAMIQUES ---
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1 },
    auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
    blob: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.4 },
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 20, paddingBottom: 15, paddingTop: 10,
      borderBottomWidth: 1, borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.bg, zIndex: 10,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    headerTitle: { color: theme.colors.text, fontWeight: '900', letterSpacing: 1, fontSize: 12 },
    onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.success, marginRight: 8 },
    listContent: { padding: 20, paddingBottom: 20 },
    messagesList: { flex: 1 },
    messageRow: { flexDirection: 'row', marginBottom: 15, alignItems: 'flex-end' },
    messageBubble: { maxWidth: '80%', padding: 15, borderRadius: 20 },
    userBubble: { 
      backgroundColor: theme.colors.primary, borderBottomRightRadius: 4,
      shadowColor: theme.isDark ? 'transparent' : theme.colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: theme.isDark ? 0 : 0.3, shadowRadius: 4, elevation: 2,
    },
    aiBubble: { 
      backgroundColor: theme.colors.cardBg, borderWidth: 1, borderColor: theme.colors.border,
      borderTopLeftRadius: 4, marginLeft: 10,
      shadowColor: theme.isDark ? 'transparent' : '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: theme.isDark ? 0 : 0.05, shadowRadius: 2, elevation: 1,
    },
    aiAvatar: { 
        width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.cardBg, 
        justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border
    },
    messageText: { fontSize: 14, lineHeight: 20 },
    userText: { color: theme.isDark ? '#000' : '#fff', fontWeight: '600' },
    aiText: { color: theme.colors.text },
    inputContainer: { 
        padding: 15, backgroundColor: theme.colors.bg, borderTopWidth: 1, borderTopColor: theme.colors.border,
        paddingBottom: TAB_BAR_HEIGHT + 10, shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 5, zIndex: 20,
    },
    glassInput: { 
      flexDirection: 'row', alignItems: 'flex-end', backgroundColor: theme.colors.cardBg, 
      borderRadius: 25, paddingHorizontal: 5, paddingVertical: 5, borderWidth: 1, borderColor: theme.colors.border,
    },
    input: { flex: 1, color: theme.colors.text, paddingHorizontal: 15, paddingVertical: 10, maxHeight: 100, minHeight: 40 },
    sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
    sendBtnDisabled: { backgroundColor: theme.colors.border, opacity: 0.5 },

    // --- STYLES PAYWALL ---
    lockedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
    lockIconBox: { 
        width: 80, height: 80, borderRadius: 40, 
        backgroundColor: theme.isDark ? 'rgba(255, 215, 0, 0.1)' : '#fffbeb',
        borderWidth: 1, borderColor: '#ffd700',
        justifyContent: 'center', alignItems: 'center', marginBottom: 20,
        shadowColor: "#ffd700", shadowOpacity: 0.3, shadowRadius: 15, elevation: 10
    },
    lockedTitle: { fontSize: 24, fontWeight: '900', color: theme.colors.text, textAlign: 'center', marginBottom: 10, letterSpacing: 1 },
    lockedDesc: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 30, lineHeight: 22 },
    upgradeBtn: { width: '100%', borderRadius: 25, overflow: 'hidden', shadowColor: "#ffd700", shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
    btnGradient: { paddingVertical: 18, alignItems: 'center' },
    btnText: { color: '#000', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  });

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.messageRow, { justifyContent: isUser ? 'flex-end' : 'flex-start' }]}>
        {!isUser && (
            <View style={styles.aiAvatar}>
                <MaterialCommunityIcons name="brain" size={16} color={theme.colors.text} />
            </View>
        )}
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
            <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>{item.text}</Text>
        </View>
      </View>
    );
  };

  if (checkingAccess) {
      return <View style={[styles.container, {justifyContent:'center', alignItems:'center'}]}><ActivityIndicator color={theme.colors.primary} /></View>;
  }

  // --- ECRAN VERROUILLÉ (PAYWALL) ---
  if (!isPremium) {
      return (
        <View style={styles.container}>
            <StatusBar style={theme.isDark ? "light" : "dark"} />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>NEURAL COACH</Text>
                </View>
                
                <View style={styles.lockedContainer}>
                    <View style={styles.lockIconBox}>
                        <MaterialCommunityIcons name="lock" size={40} color="#ffd700" />
                    </View>
                    
                    <Text style={styles.lockedTitle}>MODULE PREMIUM</Text>
                    <Text style={styles.lockedDesc}>
                        Le Neural Coach est une IA avancée capable d'analyser vos données et de vous conseiller en temps réel.
                        {'\n\n'}
                        Débloquez cette fonctionnalité et bien plus encore avec l'abonnement Premium.
                    </Text>

                    <TouchableOpacity style={styles.upgradeBtn} onPress={() => router.push('/profile')}>
                        <LinearGradient 
                            colors={['#ffd700', '#f59e0b']} 
                            start={{x:0, y:0}} end={{x:1, y:0}} 
                            style={styles.btnGradient}
                        >
                            <Text style={styles.btnText}>DÉBLOQUER (5.99€/MOIS)</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
      );
  }

  // --- ECRAN NORMAL (CHAT) ---
  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} backgroundColor="transparent" translucent={true} />

      {theme.isDark && (
        <View style={styles.auroraBg}>
            <View style={[styles.blob, { top: 100, left: -50, backgroundColor: 'rgba(139, 92, 246, 0.15)' }]} />
            <View style={[styles.blob, { bottom: 200, right: -50, backgroundColor: 'rgba(0, 243, 255, 0.1)' }]} />
        </View>
      )}

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>

        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <View style={styles.onlineDot} />
                <Text style={styles.headerTitle}>NEURAL COACH V1.0</Text>
            </View>
            <TouchableOpacity>
                <MaterialCommunityIcons name="dots-horizontal" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          style={styles.messagesList}
        />

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}>
            <View style={styles.inputContainer}>
                <View style={styles.glassInput}>
                    <TextInput
                        style={styles.input}
                        placeholder="Posez une question..."
                        placeholderTextColor={theme.colors.textSecondary}
                        value={input}
                        onChangeText={setInput}
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
                        onPress={handleSend}
                        disabled={!input.trim() || loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={theme.isDark ? "#000" : "#fff"} size="small" />
                        ) : (
                            <MaterialCommunityIcons name="send" size={20} color={theme.isDark ? "#000" : "#fff"} />
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>

      </SafeAreaView>
    </View>
  );
}