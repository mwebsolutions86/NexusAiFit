import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { generateAIResponse } from '../../lib/groq';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../lib/theme';

// --- TYPES ---
type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
};

export default function CoachScreen() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  // Message d'accueil par défaut
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Système NEXUS activé. Je suis prêt à optimiser vos performances. Quelle est la mission aujourd'hui ?",
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);

  // Scroll automatique vers le bas
  useEffect(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput(''); // Vider le champ immédiatement
    if (Platform.OS !== 'web') Haptics.selectionAsync();

    // 1. Ajouter le message utilisateur à la liste
    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: userMsg,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newUserMessage]);

    // 2. Appel à l'IA
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Même si pas de session (mode démo), on tente de répondre
      // Dans une vraie app, on forcerait la connexion ici
      const userId = session?.user?.id || 'demo-user';

      // Appel à la fonction sécurisée dans lib/groq.ts
      // Note: Le prompt système est déjà géré dans lib/groq.ts
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

  // Rendu d'un message (Bulle)
  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[
        styles.messageRow, 
        { justifyContent: isUser ? 'flex-end' : 'flex-start' }
      ]}>
        {!isUser && (
            <View style={styles.aiAvatar}>
                <MaterialCommunityIcons name="brain" size={16} color="#000" />
            </View>
        )}
        
        <View style={[
            styles.messageBubble, 
            isUser ? styles.userBubble : styles.aiBubble
        ]}>
            <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
            {item.text}
            </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="transparent" translucent={true} />

      {/* BACKGROUND AURORA (Violet pour le thème Neural) */}
      <View style={styles.auroraBg}>
          <View style={[styles.blob, { top: 100, left: -50, backgroundColor: 'rgba(139, 92, 246, 0.15)' }]} />
          <View style={[styles.blob, { bottom: 200, right: -50, backgroundColor: 'rgba(0, 243, 255, 0.1)' }]} />
      </View>

      <SafeAreaView style={styles.safeArea}>

        {/* HEADER */}
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <View style={styles.onlineDot} />
                <Text style={styles.headerTitle}>NEURAL COACH V1.0</Text>
            </View>
            <TouchableOpacity>
                <MaterialCommunityIcons name="dots-horizontal" size={24} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
        </View>

        {/* LISTE DES MESSAGES */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          style={styles.messagesList}
        />

        {/* ZONE DE SAISIE */}
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 + insets.bottom : insets.bottom}
        >
            <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 80 }]}>
                <View style={styles.glassInput}>
                    <TextInput
                        style={styles.input}
                        placeholder="Posez une question sur votre plan..."
                        placeholderTextColor="rgba(255,255,255,0.3)"
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
                            <ActivityIndicator color="#000" size="small" />
                        ) : (
                            <MaterialCommunityIcons name="send" size={20} color={!input.trim() ? "#666" : "#000"} />
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },
  
  auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
  blob: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.4 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 15, paddingTop: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: '#fff', fontWeight: '900', letterSpacing: 1, fontSize: 12 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#d946ef', marginRight: 8, shadowColor: '#d946ef', shadowRadius: 5, shadowOpacity: 1 }, // Violet néon

  listContent: { padding: 20, paddingBottom: 20 },

  messagesList: { flex: 1 },

  messageRow: { flexDirection: 'row', marginBottom: 15, alignItems: 'flex-end' },
  
  messageBubble: { maxWidth: '80%', padding: 15, borderRadius: 20 },
  
  userBubble: { 
    backgroundColor: '#d946ef', // Violet pour l'utilisateur (thème Neural)
    borderBottomRightRadius: 4,
  },
  aiBubble: { 
    backgroundColor: 'rgba(30, 30, 40, 0.8)', 
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderTopLeftRadius: 4,
    marginLeft: 10
  },
  
  aiAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  
  messageText: { fontSize: 14, lineHeight: 20 },
  userText: { color: '#000', fontWeight: '600' },
  aiText: { color: '#fff' },

  inputContainer: { padding: 15, backgroundColor: '#000', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  glassInput: { 
    flexDirection: 'row', alignItems: 'flex-end', 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderRadius: 25, paddingHorizontal: 5, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  input: { flex: 1, color: '#fff', paddingHorizontal: 15, paddingVertical: 10, maxHeight: 100, minHeight: 40 },
  
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#d946ef', justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  sendBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.1)' },
});