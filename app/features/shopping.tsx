import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Platform, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';
import { useTranslation } from 'react-i18next';

export default function ShoppingScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [newItem, setNewItem] = useState('');
  const MODULE_COLOR = '#10b981';

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data } = await supabase.from('shopping_items').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
        if (data) setItems(data);
    } catch (e) { console.log(e); }
  };

  const addItem = async (nameArg?: string) => {
      const nameToAdd = nameArg || newItem;
      if (!nameToAdd.trim()) return;
      if (Platform.OS !== 'web') Haptics.selectionAsync();
      if (!nameArg) setNewItem('');

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data, error } = await supabase.from('shopping_items').insert({ user_id: session.user.id, item_name: nameToAdd.trim(), is_checked: false }).select().single();
        if (error) throw error;
        if (data) setItems(prev => [data, ...prev]);
      } catch (e: any) { console.log("Erreur ajout", e); }
  };

  const toggleItem = async (id: string, currentStatus: boolean) => {
      if (Platform.OS !== 'web') Haptics.selectionAsync();
      setItems(items.map(i => i.id === id ? { ...i, is_checked: !currentStatus } : i));
      try { await supabase.from('shopping_items').update({ is_checked: !currentStatus }).eq('id', id); } catch (e) { console.log(e); }
  };

  const deleteItem = async (id: string) => {
      setItems(items.filter(i => i.id !== id));
      try { await supabase.from('shopping_items').delete().eq('id', id); } catch (e) { console.log(e); }
  };

  const aggregateIngredients = (rawIngredients: string[]) => {
      const map = new Map<string, number>();
      const others: string[] = [];
      rawIngredients.forEach(ing => {
          const match = ing.match(/^([\d.,]+)\s*(.*)$/);
          if (match) {
              const qty = parseFloat(match[1].replace(',', '.'));
              const name = match[2].trim().toLowerCase();
              if (!isNaN(qty)) { const currentQty = map.get(name) || 0; map.set(name, currentQty + qty); } 
              else { others.push(ing); }
          } else { others.push(ing); }
      });
      const aggregated: string[] = [];
      map.forEach((qty, name) => { aggregated.push(`${Math.round(qty * 100) / 100} ${name}`); });
      return [...aggregated, ...others];
  };

  const importFromMealPlan = async () => {
      // CORRECTION : Usage direct de chaînes de caractères dans Alert
      Alert.alert(
          t('modules.shopping.import_confirm_title'), 
          t('modules.shopping.import_confirm_msg'),
          [
              { text: t('modules.journal.btn_cancel'), style: "cancel" },
              { text: t('modules.shopping.import_btn'), onPress: processImport }
          ]
      );
  };

  const processImport = async () => {
      setLoading(true);
      try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;
          const { data: plan } = await supabase.from('meal_plans').select('content').eq('user_id', session.user.id).eq('is_active', true).single();
          if (!plan?.content?.days) { Alert.alert("Info", t('modules.shopping.empty')); return; }

          const currentDayIndex = (new Date().getDay() + 6) % 7;
          const remainingDays = plan.content.days.slice(currentDayIndex);
          let rawIngredients: string[] = [];
          
          remainingDays.forEach((day: any) => {
              day.meals?.forEach((meal: any) => {
                  if (meal.ingredients) rawIngredients = [...rawIngredients, ...meal.ingredients];
              });
          });

          if (rawIngredients.length === 0) { Alert.alert("Info", t('modules.shopping.import_empty')); return; }
          const finalIngredients = aggregateIngredients(rawIngredients);
          const newItems = finalIngredients.map(ing => ({ user_id: session.user.id, item_name: ing, is_checked: false }));
          await supabase.from('shopping_items').insert(newItems);
          await fetchItems();
          Alert.alert("Succès", `${finalIngredients.length} ${t('modules.shopping.import_success')}`);
      } catch (e: any) { Alert.alert("Erreur", e.message); } finally { setLoading(false); }
  };

  const clearList = async () => {
      Alert.alert(t('modules.journal.delete_title'), t('modules.journal.delete_msg'), [{ text: t('modules.journal.btn_cancel'), style: "cancel" }, { text: t('modules.journal.btn_delete'), style: "destructive", onPress: async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if(session) { await supabase.from('shopping_items').delete().eq('user_id', session.user.id); setItems([]); }
      }}]);
  };

  const activeItems = items.filter(i => !i.is_checked);
  const checkedItems = items.filter(i => i.is_checked);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    safeArea: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    headerTitle: { color: theme.colors.text, fontWeight: '900', letterSpacing: 1, fontSize: 16 },
    actionBtnHeader: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    contentContainer: { paddingHorizontal: 20, paddingBottom: 50 },
    inputContainer: { flexDirection: 'row', marginBottom: 20, backgroundColor: theme.colors.glass, borderRadius: 16, padding: 5, borderWidth: 1, borderColor: theme.colors.border },
    input: { flex: 1, paddingHorizontal: 15, paddingVertical: 12, color: theme.colors.text, fontSize: 16 },
    addBtn: { backgroundColor: MODULE_COLOR, width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    actionBar: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, backgroundColor: theme.colors.glass, borderWidth: 1, borderColor: theme.colors.border },
    actionText: { color: theme.colors.text, fontWeight: 'bold', fontSize: 12, marginLeft: 8 },
    sectionTitle: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
    itemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.glass, padding: 15, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: theme.colors.border },
    itemChecked: { opacity: 0.6, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#f3f4f6' },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: theme.colors.textSecondary, marginRight: 15, justifyContent: 'center', alignItems: 'center' },
    checkboxActive: { backgroundColor: MODULE_COLOR, borderColor: MODULE_COLOR },
    itemText: { flex: 1, color: theme.colors.text, fontSize: 15, fontWeight: '500' },
    itemTextChecked: { textDecorationLine: 'line-through', color: theme.colors.textSecondary },
    deleteBtn: { padding: 5 },
    emptyState: { alignItems: 'center', marginTop: 50, opacity: 0.5 },
    emptyText: { color: theme.colors.textSecondary, marginTop: 10 }
  });

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('modules.shopping.title')}</Text>
            <TouchableOpacity onPress={clearList} style={styles.actionBtnHeader}>
                <MaterialCommunityIcons name="trash-can-outline" size={20} color={theme.colors.danger} />
            </TouchableOpacity>
        </View>

        <View style={{paddingHorizontal: 20}}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <View style={styles.inputContainer}>
                    <TextInput style={styles.input} placeholder={t('modules.shopping.add_ph')} placeholderTextColor={theme.colors.textSecondary} value={newItem} onChangeText={setNewItem} onSubmitEditing={() => addItem()} />
                    <TouchableOpacity style={styles.addBtn} onPress={() => addItem()}><MaterialCommunityIcons name="plus" size={24} color="#fff" /></TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
            <View style={styles.actionBar}>
                <TouchableOpacity style={styles.actionBtn} onPress={importFromMealPlan} disabled={loading}>
                    {loading ? <ActivityIndicator size="small" color={MODULE_COLOR} /> : ( <> <MaterialCommunityIcons name="download" size={20} color={MODULE_COLOR} /> <Text style={styles.actionText}>{t('modules.shopping.import_btn')}</Text> </> )}
                </TouchableOpacity>
            </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
            {activeItems.length > 0 && <View>{activeItems.map((item) => (<TouchableOpacity key={item.id} style={styles.itemCard} onPress={() => toggleItem(item.id, item.is_checked)}><View style={styles.checkbox} /><Text style={styles.itemText}>{item.item_name}</Text><TouchableOpacity onPress={() => deleteItem(item.id)} style={styles.deleteBtn}><MaterialCommunityIcons name="close" size={18} color={theme.colors.textSecondary} /></TouchableOpacity></TouchableOpacity>))}</View>}
            {checkedItems.length > 0 && <View><Text style={styles.sectionTitle}>{t('modules.shopping.done_title')} ({checkedItems.length})</Text>{checkedItems.map((item) => (<TouchableOpacity key={item.id} style={[styles.itemCard, styles.itemChecked]} onPress={() => toggleItem(item.id, item.is_checked)}><View style={[styles.checkbox, styles.checkboxActive]}><MaterialCommunityIcons name="check" size={14} color="#fff" /></View><Text style={[styles.itemText, styles.itemTextChecked]}>{item.item_name}</Text><TouchableOpacity onPress={() => deleteItem(item.id)} style={styles.deleteBtn}><MaterialCommunityIcons name="close" size={18} color={theme.colors.textSecondary} /></TouchableOpacity></TouchableOpacity>))}</View>}
            {items.length === 0 && !loading && <View style={styles.emptyState}><MaterialCommunityIcons name="cart-outline" size={64} color={theme.colors.textSecondary} /><Text style={styles.emptyText}>{t('modules.shopping.empty')}</Text></View>}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}