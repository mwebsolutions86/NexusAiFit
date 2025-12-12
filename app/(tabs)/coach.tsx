import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform, 
  Dimensions, 
  Keyboard,
  Alert,
  Modal,
  ScrollView
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Animated, { 
  FadeInLeft, 
  FadeInRight, 
  FadeInUp,
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useTheme } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { ScreenLayout } from '../../components/ui/ScreenLayout';
import { GlassCard } from '../../components/ui/GlassCard';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.85;

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface Session {
  id: string;
  title: string;
  created_at: string;
}

const QUICK_ACTIONS = [
  { icon: "dumbbell", text: "Optimiser mon squat" },
  { icon: "food-apple", text: "Idée snack 30g prot." },
  { icon: "sleep", text: "Mieux dormir" },
  { icon: "brain", text: "Boost énergie" },
];

const TypingIndicator = () => {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    opacity.value = withRepeat(withSequence(withTiming(1, { duration: 500 }), withTiming(0.3, { duration: 500 })), -1, true);
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View entering={FadeInLeft} style={{ marginLeft: 20, marginBottom: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ color: colors.primary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 }}>NEXUS ANALYSE</Text>
        <Animated.View style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary }, animatedStyle]} />
      </View>
    </Animated.View>
  );
};

const MessageBubble = ({ item }: { item: Message }) => {
  const { colors, isDark } = useTheme();
  const isUser = item.isUser;
  return (
    <Animated.View 
        entering={isUser ? FadeInRight.springify() : FadeInLeft.springify()} 
        style={[styles.messageRow, isUser ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}
    >
      {!isUser && (
        <View style={[styles.avatar, { borderColor: colors.primary + '50', backgroundColor: colors.primary + '10' }]}>
           <MaterialCommunityIcons name="robot" size={16} color={colors.primary} />
        </View>
      )}
      <View style={[
        styles.bubble, 
        isUser 
            ? { 
                backgroundColor: colors.primary, 
                borderBottomRightRadius: 4,
                shadowColor: colors.primary,
                shadowOpacity: isDark ? 0.3 : 0.2,
                shadowRadius: 8,
                elevation: 4
              } 
            : { 
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF', 
                borderBottomLeftRadius: 4,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'
              }
      ]}>
        <Text style={[styles.messageText, { color: isUser ? '#FFF' : (isDark ? colors.text : '#1e293b') }]}>{item.text}</Text>
        <Text style={[styles.timestamp, { color: isUser ? 'rgba(255,255,255,0.7)' : (isDark ? colors.textSecondary : '#94a3b8') }]}>
           {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </Animated.View>
  );
};

export default function CoachScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter(); 
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  const [modalVisible, setModalVisible] = useState(false);
  const sidebarX = useSharedValue(-SIDEBAR_WIDTH); 
  const backdropOpacity = useSharedValue(0);

  const flatListRef = useRef<FlatList>(null);

  const openSidebar = () => {
      setModalVisible(true);
      sidebarX.value = withSpring(0, { damping: 20, stiffness: 90 }); 
      backdropOpacity.value = withTiming(1, { duration: 300 });
  };

  const closeSidebar = () => {
      sidebarX.value = withTiming(-SIDEBAR_WIDTH, { duration: 300 }, () => {
          runOnJS(setModalVisible)(false);
      });
      backdropOpacity.value = withTiming(0, { duration: 300 });
  };

  const animatedSidebarStyle = useAnimatedStyle(() => ({ transform: [{ translateX: sidebarX.value }] }));
  const animatedBackdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

  useEffect(() => { loadSessions(); }, []);

  const loadSessions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('chat_sessions').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
    if (data) {
        setSessions(data);
        if (!currentSessionId && data.length > 0) selectSession(data[0].id);
        else if (data.length === 0) createNewSession();
    }
  };

  const createNewSession = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { data } = await supabase.from('chat_sessions').insert({ user_id: user.id, title: 'Nouvelle Session' }).select().single();
    if (data) {
        setSessions([data, ...sessions]);
        setCurrentSessionId(data.id);
        setMessages([{ id: 'intro', text: "Système Nexus en ligne. Prêt à optimiser vos performances.", isUser: false, timestamp: new Date() }]);
        closeSidebar();
    }
  };

  const selectSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    closeSidebar();
    setLoading(true);
    const { data } = await supabase.from('chat_history').select('*').eq('session_id', sessionId).order('created_at', { ascending: true });
    if (data && data.length > 0) {
        setMessages(data.map(m => ({ id: m.id, text: m.content, isUser: m.role === 'user', timestamp: new Date(m.created_at) })));
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    } else {
        setMessages([{ id: 'intro', text: "Nexus prêt. Aucun historique.", isUser: false, timestamp: new Date() }]);
    }
    setLoading(false);
  };

  const deleteSession = async (sessionId: string) => {
      Alert.alert("Supprimer ?", "Irréversible.", [
          { text: "Annuler", style: "cancel" },
          { text: "Supprimer", style: "destructive", onPress: async () => {
              await supabase.from('chat_sessions').delete().eq('id', sessionId);
              const newSessions = sessions.filter(s => s.id !== sessionId);
              setSessions(newSessions);
              if (currentSessionId === sessionId) {
                  if (newSessions.length > 0) selectSession(newSessions[0].id);
                  else createNewSession();
              }
          }}
      ]);
  };

  // --- COEUR DE LA CORRECTION : Envoi et Nettoyage ---
  const sendMessage = async (textToUse?: string) => {
    const text = textToUse || input;
    if (!text.trim() || loading || !currentSessionId) return;
    
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const userText = text.trim();
    setInput('');
    Keyboard.dismiss();

    const { data: { session: authSession } } = await supabase.auth.getSession();
    if (!authSession) return;

    // 1. Ajouter le message utilisateur
    const newMsg: Message = { id: Date.now().toString(), text: userText, isUser: true, timestamp: new Date() };
    const newHistory = [...messages, newMsg];
    setMessages(newHistory);
    setLoading(true);
    
    // Mise à jour du titre si c'est le début
    if (messages.length <= 1) {
        const newTitle = userText.length > 25 ? userText.substring(0, 25) + '...' : userText;
        await supabase.from('chat_sessions').update({ title: newTitle }).eq('id', currentSessionId);
        setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, title: newTitle } : s));
    }

    try {
      await supabase.from('chat_history').insert({ user_id: authSession.user.id, session_id: currentSessionId, role: 'user', content: userText });
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', authSession.user.id).single();
      
      const contextMessages = newHistory.slice(-6).map(m => ({ role: m.isUser ? "user" : "assistant", content: m.text }));
      
      // Appel API
      const { data, error } = await supabase.functions.invoke('supafit-ai', { 
          body: { type: 'CHAT', messages: contextMessages, userProfile: profile || {} } 
      });
      
      if (error) throw error;

      // --- 🛡️ ZONE DE NETTOYAGE JSON ROBUSTE ---
      let aiText = "Je n'ai pas compris.";

      // A. Normalisation : data peut être une string ou un objet
      let rawData = data;
      if (typeof data === 'string') {
          try { rawData = JSON.parse(data); } catch { rawData = { response: data }; }
      }

      // B. Récupération prioritaire du champ 'response' (standard) ou 'reponse' (hallucination FR)
      if (rawData?.response) aiText = rawData.response;
      else if (rawData?.reponse) aiText = rawData.reponse;
      else if (rawData?.message) aiText = rawData.message;
      else if (typeof rawData === 'string') aiText = rawData; // Fallback ultime

      // C. DOUBLE PARSING (Le Fix Magique) : 
      // Si aiText est une string qui ressemble à du JSON (ex: '{"reponse":"Bonjour"}'), on la re-parse.
      if (typeof aiText === 'string') {
          const trimmed = aiText.trim();
          if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
              try {
                  const nested = JSON.parse(trimmed);
                  if (nested.response) aiText = nested.response;
                  else if (nested.reponse) aiText = nested.reponse;
                  else if (nested.message) aiText = nested.message;
              } catch (e) {
                  // Ce n'était pas du JSON valide, on garde le texte tel quel (ex: "Attention {sujet}...")
              }
          }
      }
      // ------------------------------------------

      const aiMsg: Message = { id: (Date.now()+1).toString(), text: aiText, isUser: false, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
      
      await supabase.from('chat_history').insert({ user_id: authSession.user.id, session_id: currentSessionId, role: 'assistant', content: aiText });
      await supabase.from('chat_sessions').update({ updated_at: new Date() }).eq('id', currentSessionId);

    } catch (e) {
      console.error("Erreur Chat:", e);
      setMessages(prev => [...prev, { id: Date.now().toString(), text: "Connexion neuronale interrompue.", isUser: false, timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const renderSuggestions = () => {
      if (messages.length > 2) return null;
      return (
          <Animated.View entering={FadeInUp.delay(300)} style={styles.suggestionsContainer}>
              <Text style={[styles.suggestionTitle, { color: isDark ? colors.textSecondary : '#64748b' }]}>COMMANDES RAPIDES</Text>
              <View style={styles.chipGrid}>
                  {QUICK_ACTIONS.map((action, i) => (
                      <TouchableOpacity 
                          key={i} 
                          onPress={() => sendMessage(action.text)}
                          style={[styles.chip, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0' }]}
                      >
                          <MaterialCommunityIcons name={action.icon as any} size={14} color={colors.primary} />
                          <Text style={[styles.chipText, { color: isDark ? colors.text : '#334155' }]}>{action.text}</Text>
                      </TouchableOpacity>
                  ))}
              </View>
          </Animated.View>
      );
  };

  return (
    <ScreenLayout>
      <Image 
          source={require('../../assets/adaptive-icon.png')} 
          style={[StyleSheet.absoluteFillObject, { opacity: isDark ? 0.05 : 0.02, transform: [{scale: 1.5}] }]}
          blurRadius={40}
          contentFit="cover"
      />
      <LinearGradient 
          colors={isDark ? [colors.primary, 'transparent'] : ['#bfdbfe', 'transparent']} 
          style={{position:'absolute', top:0, left:0, right:0, height:200, opacity: isDark ? 0.1 : 0.25}} 
      />

      <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
          <TouchableOpacity 
            onPress={() => router.navigate('/dashboard')} 
            style={styles.menuBtn}
            hitSlop={{top:15, bottom:15, left:15, right:15}}
          >
              <Ionicons name="arrow-back" size={28} color={colors.text} />
          </TouchableOpacity>
          
          <View style={{alignItems: 'center'}}>
              <Text style={[styles.headerTitle, { color: isDark ? colors.text : '#0f172a' }]}>
                  {sessions.find(s => s.id === currentSessionId)?.title.toUpperCase().slice(0, 15) || "NEXUS AI"}
              </Text>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                  <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                  <Text style={[styles.headerSub, { color: isDark ? colors.textSecondary : '#64748b' }]}>ONLINE</Text>
              </View>
          </View>

          <TouchableOpacity onPress={openSidebar} style={styles.menuBtn}>
              <MaterialCommunityIcons name="history" size={28} color={colors.primary} />
          </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <MessageBubble item={item} />}
          contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]} 
          ListFooterComponent={
              <>
                  {loading && <TypingIndicator />}
                  {renderSuggestions()}
                  <View style={{height: 20}} />
              </>
          }
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={[
            styles.inputWrapper, 
            { paddingBottom: Math.max(insets.bottom, 20) + 10 } 
        ]}>
            <GlassCard 
                style={[
                    styles.inputContainer, 
                    { 
                        backgroundColor: isDark ? 'rgba(20,20,30,0.8)' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
                        shadowColor: "#000",
                        shadowOpacity: isDark ? 0 : 0.05,
                        shadowRadius: 10,
                        elevation: isDark ? 0 : 5
                    }
                ]}
                intensity={isDark ? 40 : 80}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                    <TextInput 
                        style={[styles.input, { color: colors.text }]} 
                        placeholder="Posez une question tactique..." 
                        placeholderTextColor={isDark ? colors.textSecondary : '#94a3b8'} 
                        value={input} 
                        onChangeText={setInput} 
                        multiline 
                    />
                    <TouchableOpacity 
                        onPress={() => sendMessage()} 
                        disabled={!input.trim() || loading} 
                        style={[
                            styles.sendBtn, 
                            { 
                                backgroundColor: (!input.trim() || loading) 
                                    ? (isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9') 
                                    : colors.primary 
                            }
                        ]}
                    >
                        <Ionicons 
                            name="arrow-up" 
                            size={20} 
                            color={(!input.trim() || loading) ? (isDark ? colors.textSecondary : '#cbd5e1') : '#fff'} 
                        />
                    </TouchableOpacity>
                </View>
            </GlassCard>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={modalVisible} transparent statusBarTranslucent animationType="none" onRequestClose={closeSidebar}>
          <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
              <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeSidebar} activeOpacity={1}>
                  <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                  <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} />
              </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[styles.sidebar, animatedSidebarStyle, { backgroundColor: isDark ? '#050508' : '#F8FAFC', borderRightColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0' }]}>
              <View style={[styles.sidebarHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0' }]}>
                  <Text style={[styles.sidebarTitle, { color: colors.text }]}>ARCHIVES</Text>
                  <TouchableOpacity onPress={closeSidebar} hitSlop={{top:15, bottom:15, left:15, right:15}}>
                      <Ionicons name="close" size={28} color={colors.textSecondary} />
                  </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ padding: 20 }}>
                  <TouchableOpacity onPress={createNewSession} style={[styles.newChatBtn, { borderColor: colors.primary, backgroundColor: isDark ? colors.primary + '10' : '#eff6ff' }]}>
                      <Ionicons name="add" size={22} color={colors.primary} />
                      <Text style={{ color: colors.primary, fontWeight: '900' }}>NOUVELLE SESSION</Text>
                  </TouchableOpacity>

                  <View style={{ height: 30 }} />
                  <Text style={{color: isDark ? colors.textSecondary : '#64748b', fontSize: 10, fontWeight: 'bold', marginBottom: 15}}>HISTORIQUE</Text>

                  {sessions.map((session) => (
                      <TouchableOpacity 
                        key={session.id} 
                        onPress={() => selectSession(session.id)}
                        style={[styles.sessionRow, session.id === currentSessionId ? { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' } : { backgroundColor: isDark ? '#121214' : '#FFFFFF', borderColor: isDark ? 'transparent' : '#e2e8f0' }]}
                      >
                          <View style={{flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12}}>
                              <MaterialCommunityIcons name="message-text-outline" size={20} color={session.id === currentSessionId ? colors.primary : colors.textSecondary} />
                              <View style={{flex: 1}}>
                                  <Text numberOfLines={1} style={{ color: session.id === currentSessionId ? (isDark ? '#fff' : '#0f172a') : (isDark ? colors.textSecondary : '#64748b'), fontWeight: '600' }}>{session.title}</Text>
                                  <Text style={{fontSize: 10, color: colors.textSecondary, opacity: 0.5}}>{new Date(session.created_at).toLocaleDateString()}</Text>
                              </View>
                          </View>
                          {session.id === currentSessionId && (
                              <TouchableOpacity onPress={() => deleteSession(session.id)} style={{padding: 8}}>
                                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                              </TouchableOpacity>
                          )}
                      </TouchableOpacity>
                  ))}
              </ScrollView>
          </Animated.View>
      </Modal>

    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 60 : 40,
      paddingBottom: 15,
      borderBottomWidth: 1,
      zIndex: 10,
  },
  menuBtn: { padding: 5 },
  headerTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  headerSub: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },

  listContent: { padding: 20 },
  messageRow: { flexDirection: 'row', marginBottom: 20, alignItems: 'flex-end', maxWidth: '100%' },
  avatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  
  bubble: { padding: 16, borderRadius: 20, maxWidth: '80%' },
  messageText: { fontSize: 15, lineHeight: 22 },
  timestamp: { fontSize: 10, marginTop: 6, alignSelf: 'flex-end', fontWeight: 'bold' },

  suggestionsContainer: { marginTop: 20, paddingHorizontal: 10 },
  suggestionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 15, textAlign: 'center', opacity: 0.7 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '600' },

  inputWrapper: { paddingHorizontal: 15, paddingTop: 10 },
  inputContainer: { borderRadius: 30, paddingHorizontal: 5, paddingVertical: 5, borderWidth: 1 },
  input: { flex: 1, maxHeight: 100, fontSize: 16, paddingHorizontal: 15, paddingVertical: 10 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 5 },

  backdrop: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  sidebar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: SIDEBAR_WIDTH, borderRightWidth: 1, zIndex: 2, paddingTop: Platform.OS === 'ios' ? 60 : 40, shadowColor: "#000", shadowOffset: { width: 10, height: 0 }, shadowOpacity: 0.3, shadowRadius: 50, elevation: 50 },
  sidebarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, marginTop: 10 },
  sidebarTitle: { fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  newChatBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed' },
  sessionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, marginBottom: 8, borderWidth: 1 },
});