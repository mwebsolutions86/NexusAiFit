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
  Alert,
  Modal,
  ScrollView,
  Image
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Animated, { 
  FadeInLeft, 
  FadeInRight, 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

import { useTheme } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { ScreenLayout } from '../../components/ui/ScreenLayout';

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

// --- COMPOSANTS UI ---

const TypingIndicator = () => {
  const { colors, isDark } = useTheme();
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    opacity.value = withRepeat(withSequence(withTiming(1, { duration: 500 }), withTiming(0.3, { duration: 500 })), -1, true);
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View entering={FadeInLeft} style={[styles.aiBubble, { borderColor: isDark ? colors.primary + '30' : 'rgba(0,0,0,0.05)', backgroundColor: isDark ? 'rgba(20,20,30,0.6)' : '#FFF', paddingVertical: 15 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <MaterialCommunityIcons name="brain" size={16} color={colors.primary} />
        <Animated.Text style={[{ color: colors.primary, fontSize: 12, fontWeight: 'bold' }, animatedStyle]}>NEXUS PROCESSING...</Animated.Text>
      </View>
    </Animated.View>
  );
};

const MessageBubble = ({ item }: { item: Message }) => {
  const { colors, isDark } = useTheme();
  const isUser = item.isUser;
  return (
    <Animated.View entering={isUser ? FadeInRight.springify() : FadeInLeft.springify()} style={[styles.messageRow, isUser ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
      {!isUser && (
        <View style={[styles.avatar, { borderColor: colors.primary, backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : '#fff' }]}>
           <MaterialCommunityIcons name="robot" size={14} color={colors.primary} />
        </View>
      )}
      <View style={[
        isUser ? styles.userBubble : styles.aiBubble, 
        isUser ? { backgroundColor: colors.primary } : { backgroundColor: isDark ? 'rgba(20,20,30,0.6)' : '#FFF', borderColor: isDark ? colors.border : 'rgba(0,0,0,0.05)', borderWidth: 1 }
      ]}>
        <Text style={[styles.messageText, isUser ? { color: '#FFF', fontWeight: '600' } : { color: colors.text }]}>{item.text}</Text>
        <Text style={[styles.timestamp, isUser ? { color: 'rgba(255,255,255,0.7)' } : { color: colors.textSecondary }]}>
           {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </Animated.View>
  );
};

export default function CoachScreen() {
  const { colors, isDark } = useTheme();
  
  // États Chat
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // États Sidebar (Animation Manuelle)
  const [modalVisible, setModalVisible] = useState(false);
  const sidebarX = useSharedValue(-SIDEBAR_WIDTH); 
  const backdropOpacity = useSharedValue(0);

  const flatListRef = useRef<FlatList>(null);

  // --- LOGIQUE ANIMATION SIDEBAR ---
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

  // Styles animés
  const animatedSidebarStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: sidebarX.value }]
  }));
  
  const animatedBackdropStyle = useAnimatedStyle(() => ({
      opacity: backdropOpacity.value
  }));

  // --- INITIALISATION ---
  useEffect(() => {
    loadSessions();
  }, []);

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
        setMessages([{ id: 'intro', text: "Nexus réinitialisé. Nouvelle session prête.", isUser: false, timestamp: new Date() }]);
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

  const sendMessage = async () => {
    if (!input.trim() || loading || !currentSessionId) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const userText = input.trim();
    setInput('');
    const { data: { session: authSession } } = await supabase.auth.getSession();
    if (!authSession) return;

    const newMsg: Message = { id: Date.now().toString(), text: userText, isUser: true, timestamp: new Date() };
    const newHistory = [...messages, newMsg];
    setMessages(newHistory);
    setLoading(true);
    
    if (messages.length <= 1) {
        const newTitle = userText.length > 25 ? userText.substring(0, 25) + '...' : userText;
        await supabase.from('chat_sessions').update({ title: newTitle }).eq('id', currentSessionId);
        setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, title: newTitle } : s));
    }

    try {
      await supabase.from('chat_history').insert({ user_id: authSession.user.id, session_id: currentSessionId, role: 'user', content: userText });
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', authSession.user.id).single();
      const contextMessages = newHistory.slice(-6).map(m => ({ role: m.isUser ? "user" : "assistant", content: m.text }));
      const { data, error } = await supabase.functions.invoke('supafit-ai', { body: { type: 'CHAT', messages: contextMessages, userProfile: profile || {} } });
      if (error) throw error;

      let aiText = typeof data === 'string' ? JSON.parse(data).response : data.response;
      const aiMsg: Message = { id: (Date.now()+1).toString(), text: aiText, isUser: false, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
      await supabase.from('chat_history').insert({ user_id: authSession.user.id, session_id: currentSessionId, role: 'assistant', content: aiText });
      await supabase.from('chat_sessions').update({ updated_at: new Date() }).eq('id', currentSessionId);
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now().toString(), text: "Erreur de liaison.", isUser: false, timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout>
      {/* BACKGROUND */}
      <Image 
          source={require('../../assets/adaptive-icon.png')} 
          style={[StyleSheet.absoluteFillObject, { opacity: isDark ? 0.05 : 0.02, transform: [{scale: 1.5}] }]}
          blurRadius={30}
      />

      {/* HEADER */}
      <BlurView intensity={isDark ? 20 : 80} tint={isDark ? "dark" : "light"} style={styles.header}>
          <TouchableOpacity onPress={openSidebar} style={styles.menuBtn} hitSlop={{top:10, bottom:10, left:10, right:10}}>
             <MaterialCommunityIcons name="menu" size={28} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
              <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                  {(sessions.find(s => s.id === currentSessionId)?.title || "NEXUS").toUpperCase()}
              </Text>
          </View>
          <TouchableOpacity onPress={createNewSession} style={{padding:5}} hitSlop={{top:10, bottom:10, left:10, right:10}}>
             <MaterialCommunityIcons name="plus" size={28} color={colors.primary} />
          </TouchableOpacity>
      </BlurView>

      {/* CHAT */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <MessageBubble item={item} />}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={loading ? <TypingIndicator /> : <View style={{height: 20}} />}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
        <BlurView intensity={isDark ? 50 : 90} tint={isDark ? "dark" : "light"} style={[styles.inputWrapper, { borderTopColor: colors.border }]}>
            <View style={[styles.inputContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)', borderColor: colors.border }]}>
                <TextInput style={[styles.input, { color: colors.text }]} placeholder="Transmettre..." placeholderTextColor={colors.textSecondary} value={input} onChangeText={setInput} multiline />
                <TouchableOpacity onPress={sendMessage} disabled={!input.trim() || loading} style={[styles.sendBtn, { backgroundColor: (!input.trim() || loading) ? colors.textSecondary : colors.primary }]}>
                    <Ionicons name="arrow-up" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </BlurView>
      </KeyboardAvoidingView>

      {/* --- SIDEBAR MODAL (CONFIGURATION ORIGINALE) --- */}
      <Modal 
        visible={modalVisible} 
        transparent 
        statusBarTranslucent 
        animationType="none" // On gère l'anim nous-mêmes
        onRequestClose={closeSidebar}
      >
          {/* BACKDROP */}
          <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
              <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeSidebar} activeOpacity={1}>
                  <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                  <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)' }} />
              </TouchableOpacity>
          </Animated.View>

          {/* DRAWER (Menu Latéral) */}
          <Animated.View 
            style={[
                styles.sidebar, 
                animatedSidebarStyle, 
                // ✅ ADAPTATION COULEURS UNIQUEMENT
                { 
                    backgroundColor: isDark ? '#000' : '#FFF', 
                    borderRightColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' 
                }
            ]}
          >
              <View style={[styles.sidebarHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                  <Text style={[styles.sidebarTitle, { color: colors.text }]}>ARCHIVES</Text>
                  <TouchableOpacity onPress={closeSidebar} hitSlop={{top:15, bottom:15, left:15, right:15}}>
                      <Ionicons name="close" size={28} color={colors.textSecondary} />
                  </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
                  <TouchableOpacity 
                    onPress={createNewSession} 
                    style={[
                        styles.newChatBtn, 
                        { borderColor: colors.primary, backgroundColor: isDark ? colors.primary + '10' : colors.primary + '05' }
                    ]}
                  >
                      <Ionicons name="add" size={22} color={colors.primary} />
                      <Text style={{ color: colors.primary, fontWeight: '900' }}>NOUVELLE SESSION</Text>
                  </TouchableOpacity>

                  <View style={{ height: 30 }} />
                  <Text style={{color: colors.textSecondary, fontSize: 10, fontWeight: 'bold', marginBottom: 15}}>HISTORIQUE ({sessions.length})</Text>

                  {sessions.map((session) => (
                      <TouchableOpacity 
                        key={session.id} 
                        onPress={() => selectSession(session.id)}
                        style={[
                            styles.sessionRow, 
                            session.id === currentSessionId 
                                ? { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' } 
                                : { backgroundColor: isDark ? '#121214' : '#F5F5F7', borderColor: 'transparent' } // ✅ Gris clair en Light Mode
                        ]}
                      >
                          <View style={{flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12}}>
                              <MaterialCommunityIcons name={session.id === currentSessionId ? "message-text" : "message-text-outline"} size={20} color={session.id === currentSessionId ? colors.primary : colors.textSecondary} />
                              <View style={{flex: 1}}>
                                  <Text numberOfLines={1} style={{ color: session.id === currentSessionId ? (isDark ? '#fff' : '#000') : colors.textSecondary, fontWeight: '600' }}>{session.title}</Text>
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
  header: { paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
  menuBtn: { padding: 5 },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'center' },
  statusDot: { width: 6, height: 6, borderRadius: 3, shadowColor: '#00ff00', shadowOpacity: 0.8, shadowRadius: 5 },
  headerTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 1, maxWidth: 200, textAlign: 'center' },
  listContent: { padding: 20, paddingBottom: 20 },
  messageRow: { flexDirection: 'row', marginBottom: 20, alignItems: 'flex-end' },
  avatar: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginRight: 8, marginBottom: 5 },
  userBubble: { padding: 14, borderRadius: 20, borderBottomRightRadius: 4, maxWidth: '80%' },
  aiBubble: { padding: 16, borderRadius: 20, borderBottomLeftRadius: 4, maxWidth: '85%', borderWidth: 1 },
  messageText: { fontSize: 15, lineHeight: 22 },
  timestamp: { fontSize: 9, marginTop: 6, alignSelf: 'flex-end', fontWeight: 'bold' },
  inputWrapper: { paddingHorizontal: 15, paddingVertical: 15, borderTopWidth: 1, paddingBottom: Platform.OS === 'ios' ? 100 : 85 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 25, paddingHorizontal: 15, paddingVertical: 8, borderWidth: 1, marginBottom: 10 },
  input: { flex: 1, maxHeight: 100, fontSize: 16, paddingRight: 10, paddingTop: 5, paddingBottom: 5 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

  // SIDEBAR STYLES (INTACTS)
  backdrop: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  sidebar: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: width * 0.85, 
    // Couleur gérée dynamiquement dans le composant
    borderRightWidth: 1, 
    zIndex: 2, 
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    shadowColor: "#000", shadowOffset: { width: 10, height: 0 }, shadowOpacity: 1, shadowRadius: 50, elevation: 50
  },
  sidebarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, marginTop: 10 },
  sidebarTitle: { fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  newChatBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed' },
  sessionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, marginBottom: 8, borderWidth: 1, borderColor: 'transparent' },
});