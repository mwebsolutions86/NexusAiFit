import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import * as Haptics from 'expo-haptics';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function CoachScreen() {
  const theme = useTheme();
  // IMPORTANT : On initialise les styles avec le thème actuel
  const currentStyles = styles(theme);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Message initial
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Salut ! Je suis NeuroCoach. Prêt à exploser tes records aujourd'hui ?",
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const flatListRef = useRef<FlatList>(null);

  // Scroll automatique vers le bas à chaque nouveau message
  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsgText = input.trim();
    setInput(''); // On vide le champ direct
    
    // 1. Création du message utilisateur
    const newUserMsg: Message = {
      id: Date.now().toString(),
      text: userMsgText,
      isUser: true,
      timestamp: new Date(),
    };
    
    // On met à jour l'affichage local immédiatement
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Pas de session");

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      // 2. PRÉPARATION DE L'HISTORIQUE (Le secret pour la mémoire)
      // On prend les 8 derniers messages et on les formate pour l'IA
      // On convertit "isUser" en "user"/"assistant"
      const conversationHistory = updatedMessages.slice(-10).map(msg => ({
        role: msg.isUser ? "user" : "assistant",
        content: msg.text
      }));

      // 3. Appel au Backend
      const { data, error } = await supabase.functions.invoke('supafit-ai', {
        body: {
          type: 'CHAT',
          messages: conversationHistory, // On envoie l'historique !
          userProfile: profile || {},
          preferences: "Style direct"
        }
      });

      if (error) throw error;

      // 4. Traitement de la réponse
      let aiText = "Hmm, je réfléchis...";
      
      // Robustesse : on gère si c'est une string ou un objet
      if (typeof data === 'string') {
          try {
             const parsed = JSON.parse(data);
             aiText = parsed.response || data;
          } catch (e) {
             aiText = data;
          }
      } else if (data && data.response) {
          aiText = data.response;
      } else if (typeof data === 'object') {
          aiText = JSON.stringify(data);
      }

      const newAiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: aiText,
        isUser: false,
        timestamp: new Date(),
      };

      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setMessages(prev => [...prev, newAiMsg]);

    } catch (error) {
      console.error(error);
      Alert.alert("Oups", "Problème de connexion avec le coach.");
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.isUser;
    return (
      <View style={[
        currentStyles.messageContainer,
        isUser ? currentStyles.userContainer : currentStyles.aiContainer
      ]}>
        {!isUser && (
          <View style={[currentStyles.avatar, { backgroundColor: theme.colors.primary }]}>
             <Ionicons name="fitness" size={16} color="#FFF" />
          </View>
        )}
        <View style={[
          currentStyles.bubble,
          isUser ? { backgroundColor: theme.colors.primary } : { backgroundColor: theme.colors.cardBg, borderWidth: 1, borderColor: theme.colors.border }
        ]}>
          <Text style={[
            currentStyles.messageText,
            isUser ? { color: '#FFF' } : { color: theme.colors.text }
          ]}>
            {item.text}
          </Text>
          <Text style={[
             currentStyles.timestamp,
             isUser ? { color: 'rgba(255,255,255,0.7)' } : { color: theme.colors.textSecondary }
          ]}>
             {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}> 
        
        {/* Header */}
        <View style={currentStyles.header}>
            <Text style={currentStyles.headerTitle}>NEURO COACH</Text>
            <View style={currentStyles.onlineBadge}>
                <View style={currentStyles.dot} />
                <Text style={currentStyles.onlineText}>Connecté</Text>
            </View>
        </View>

        {/* Zone de Chat */}
        <View style={{ flex: 1 }}>
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={item => item.id}
              renderItem={renderItem}
              contentContainerStyle={{ padding: 20 }}
              showsVerticalScrollIndicator={false}
            />
        </View>

        {/* Zone de Saisie (Fixée au dessus de la barre de navigation) */}
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={currentStyles.inputWrapper}>
            <View style={currentStyles.inputContainer}>
              <TextInput
                style={currentStyles.input}
                placeholder="Pose ta question..."
                placeholderTextColor={theme.colors.textSecondary}
                value={input}
                onChangeText={setInput}
                multiline
              />
              <TouchableOpacity 
                  style={[currentStyles.sendBtn, (!input.trim() || loading) && { opacity: 0.5 }]} 
                  onPress={sendMessage}
                  disabled={!input.trim() || loading}
              >
                {loading ? (
                    <ActivityIndicator color="#FFF" size="small" />
                ) : (
                    <Ionicons name="arrow-up" size={20} color="#FFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>

      </SafeAreaView>
    </View>
  );
}

const styles = (theme: any) => StyleSheet.create({
  header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.bg,
  },
  headerTitle: {
      fontSize: 16,
      fontWeight: '900',
      letterSpacing: 1,
      color: theme.colors.text,
  },
  onlineBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.glass,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.success + '50',
  },
  dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.success,
      marginRight: 6,
  },
  onlineText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: theme.colors.success,
  },
  messageContainer: {
      marginBottom: 20,
      flexDirection: 'row',
      maxWidth: '85%',
  },
  userContainer: {
      alignSelf: 'flex-end',
      justifyContent: 'flex-end',
  },
  aiContainer: {
      alignSelf: 'flex-start',
  },
  avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
      marginTop: 10,
  },
  bubble: {
      padding: 15,
      borderRadius: 20,
      maxWidth: '100%',
  },
  messageText: {
      fontSize: 15,
      lineHeight: 22,
  },
  timestamp: {
      fontSize: 10,
      marginTop: 5,
      alignSelf: 'flex-end',
  },
  // Style important pour faire remonter le clavier au dessus de la barre de nav
  inputWrapper: {
      backgroundColor: theme.colors.bg,
      padding: 15,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      // Marge en bas pour compenser la TabBar flottante
      paddingBottom: Platform.OS === 'ios' ? 95 : 85, 
  },
  inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.glass,
      borderRadius: 25,
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
  },
  input: {
      flex: 1,
      color: theme.colors.text,
      fontSize: 15,
      maxHeight: 100,
      paddingRight: 10,
  },
  sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
  },
});