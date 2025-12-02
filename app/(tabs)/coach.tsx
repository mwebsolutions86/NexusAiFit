import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { generateAIResponse } from '../../lib/groq';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../lib/theme';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next'; // Import

type Message = { id: string; text: string; sender: 'user' | 'ai'; timestamp: Date; };

export default function CoachScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation(); // Hook
  
  // On prend en compte la hauteur de la barre d'onglets flottante + une marge
  const TAB_BAR_HEIGHT = 90 + (Platform.OS === 'ios' ? insets.bottom : 10);
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  
  // Message d'intro par défaut
  const [messages, setMessages] = useState<Message[]>([
      { id: '1', text: t('coach.intro'), sender: 'ai', timestamp: new Date() }
  ]);

  useFocusEffect(useCallback(() => { checkPremiumAccess(); }, []));

  const checkPremiumAccess = async () => {
      setCheckingAccess(true);
      try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) { setIsPremium(false); setCheckingAccess(false); return; }
          const { data } = await supabase.from('profiles').select('tier').eq('id', session.user.id).single();
          const tier = (data?.tier || '').toUpperCase();
          setIsPremium(['PREMIUM', 'ELITE', 'AVANCE', 'ESSENTIEL'].includes(tier));
      } catch (error) { setIsPremium(false); } finally { setCheckingAccess(false); }
  };

  useEffect(() => { 
      if (isPremium) setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100); 
  }, [messages, isPremium]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput(''); 
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    
    setMessages(prev => [...prev, { id: Date.now().toString(), text: userMsg, sender: 'user', timestamp: new Date() }]);
    setLoading(true);
    
    try {
      // Ici, on utilise un prompt système pour donner le rôle au coach
      const aiReply = await generateAIResponse("Tu es un coach sportif d'élite (préparateur physique, nutritionniste, expert en bio-mécanique). Tes réponses doivent être concises, motivantes, précises et orientées vers l'action. Tu ne remplaces pas un médecin. Tu tutoies l'utilisateur.", userMsg);
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), text: aiReply || t('coach.error_server'), sender: 'ai', timestamp: new Date() }]);
    } catch (error) { 
        setMessages(prev => [...prev, { id: (Date.now()+1).toString(), text: t('coach.error_network'), sender: 'ai', timestamp: new Date() }]);
    } finally { setLoading(false); }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    auroraBg: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
    blob: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.15 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    headerTitle: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase' },
    headerSub: { fontSize: 20, fontWeight: '300', color: theme.colors.text, marginTop: 2 },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.success, marginLeft: 8, marginTop: 4 },
    
    // MODIFICATION : Padding du bas ajusté pour laisser la place à l'input
    listContent: { padding: 20, paddingBottom: TAB_BAR_HEIGHT + 80 }, 
    
    messageRow: { flexDirection: 'row', marginBottom: 20, alignItems: 'flex-end' },
    messageBubble: { maxWidth: '80%', padding: 16, borderRadius: 20 },
    userBubble: { backgroundColor: theme.colors.primary, borderBottomRightRadius: 2 },
    userText: { color: '#fff', fontSize: 14, lineHeight: 20 },
    aiBubble: { backgroundColor: theme.colors.glass, borderWidth: 1, borderColor: theme.colors.border, borderBottomLeftRadius: 2 },
    aiText: { color: theme.colors.text, fontSize: 14, lineHeight: 20 },
    aiAvatar: { width: 28, height: 28, borderRadius: 10, backgroundColor: theme.colors.glass, justifyContent:'center', alignItems:'center', marginRight:10, borderWidth:1, borderColor: theme.colors.border },
    
    // MODIFICATION : L'input est maintenant en position absolue en bas
    inputContainer: { position: 'absolute', bottom: TAB_BAR_HEIGHT - 20, left: 0, right: 0, width: '100%', backgroundColor: theme.colors.bg, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingHorizontal: 15, paddingTop: 15, paddingBottom: 15 },
    glassInput: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: theme.colors.glass, borderRadius: 24, padding: 5, borderWidth: 1, borderColor: theme.colors.border, minHeight: 50 },
    input: { flex: 1, color: theme.colors.text, paddingHorizontal: 15, paddingVertical: 12, fontSize: 15, maxHeight: 100 },
    sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
    
    lockedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
    lockIconBox: { width: 80, height: 80, borderRadius: 25, backgroundColor: theme.isDark ? 'rgba(255, 215, 0, 0.1)' : '#fffbeb', justifyContent: 'center', alignItems: 'center', marginBottom: 25, borderWidth: 1, borderColor: '#FFD700' },
    lockedTitle: { fontSize: 22, fontWeight: '900', color: theme.colors.text, marginBottom: 10, letterSpacing: 1, textAlign: 'center' },
    lockedDesc: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 40, lineHeight: 22 },
    upgradeBtn: { width: '100%', borderRadius: 16, overflow: 'hidden' },
    btnGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
    btnText: { color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  });

  if (checkingAccess) return <View style={[styles.container, {justifyContent:'center', alignItems:'center'}]}><ActivityIndicator color={theme.colors.primary} /></View>;

  if (!isPremium) {
      return (
        <View style={styles.container}>
            <StatusBar style={theme.isDark ? "light" : "dark"} />
            <SafeAreaView style={{flex:1}}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>{t('tabs.neural')}</Text> 
                        <Text style={styles.headerSub}>{t('dashboard.mod_coach')}</Text>
                    </View>
                </View>
                
                <View style={styles.lockedContainer}>
                    <View style={styles.lockIconBox}>
                        <MaterialCommunityIcons name="lock" size={32} color="#FFD700" />
                    </View>
                    <Text style={styles.lockedTitle}>{t('coach.locked_title')}</Text>
                    <Text style={styles.lockedDesc}>{t('coach.locked_desc')}</Text>
                    <TouchableOpacity style={styles.upgradeBtn} onPress={() => router.push('/subscription' as any)}>
                        <LinearGradient colors={['#FFD700', '#FFA500']} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.btnGradient}>
                            <Text style={styles.btnText}>{t('coach.btn_unlock')}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
      );
  }

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} backgroundColor="transparent" translucent={true} />
      
      {theme.isDark && (
        <View style={styles.auroraBg}>
            <View style={[styles.blob, { top: 100, left: -50, backgroundColor: 'rgba(139, 92, 246, 0.1)' }]} />
            <View style={[styles.blob, { bottom: 200, right: -50, backgroundColor: 'rgba(0, 243, 255, 0.1)' }]} />
        </View>
      )}

      <SafeAreaView style={{flex:1}} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
            <View>
                <Text style={styles.headerTitle}>{t('tabs.neural')}</Text>
                <View style={{flexDirection:'row', alignItems:'center'}}>
                    <Text style={styles.headerSub}>{t('dashboard.mod_coach')}</Text>
                    <View style={styles.statusDot} />
                </View>
            </View>
            <TouchableOpacity><MaterialCommunityIcons name="dots-horizontal" size={24} color={theme.colors.textSecondary} /></TouchableOpacity>
        </View>

        <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === "ios" ? "padding" : undefined} 
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
            <View style={{ flex: 1 }}>
                <FlatList
                  ref={flatListRef}
                  data={messages}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => (
                    <View style={[styles.messageRow, { justifyContent: item.sender === 'user' ? 'flex-end' : 'flex-start' }]}>
                        {item.sender === 'ai' && (
                            <View style={styles.aiAvatar}>
                                <MaterialCommunityIcons name="robot" size={16} color={theme.colors.primary}/>
                            </View>
                        )}
                        <View style={[styles.messageBubble, item.sender === 'user' ? styles.userBubble : styles.aiBubble]}>
                            <Text style={item.sender === 'user' ? styles.userText : styles.aiText}>{item.text}</Text>
                        </View>
                    </View>
                  )}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                />
            </View>

            <View style={styles.inputContainer}>
                <View style={styles.glassInput}>
                    <TextInput 
                        style={styles.input} 
                        placeholder={t('coach.placeholder')} 
                        placeholderTextColor={theme.colors.textSecondary} 
                        value={input} 
                        onChangeText={setInput} 
                        multiline 
                    />
                    <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={loading || !input.trim()}>
                        {loading ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="arrow-up" size={20} color="#fff" />}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}