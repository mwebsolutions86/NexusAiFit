import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../lib/theme';
import { useShoppingList } from '../../hooks/useShoppingList';
import { ScreenLayout } from '../../components/ui/ScreenLayout';
import { GlassCard } from '../../components/ui/GlassCard';

export default function ShoppingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { items, isLoading, toggleItem, addItem, clearList, generateFromPlan, isGenerating } = useShoppingList();
  
  const [newItemName, setNewItemName] = useState('');

  // --- ACTIONS ---

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    try {
        await addItem(newItemName);
        setNewItemName('');
    } catch (e) {
        Alert.alert("Erreur", "Impossible d'ajouter l'article.");
    }
  };

  const handleGenerate = async () => {
    Alert.alert(
        "Importer le Plan ?",
        "Cela va ajouter tous les ingrédients de votre plan nutritionnel actif à la liste.",
        [
            { text: "Annuler", style: "cancel" },
            { 
                text: "Importer", 
                onPress: async () => {
                    try {
                        await generateFromPlan();
                        Alert.alert("Succès", "Liste générée !");
                    } catch (e) {
                        Alert.alert("Erreur", "Avez-vous un plan nutritionnel actif ?");
                    }
                } 
            }
        ]
    );
  };

  const handleClear = () => {
    Alert.alert(
        "Tout effacer ?",
        "Cette action est irréversible.",
        [
            { text: "Annuler", style: "cancel" },
            { text: "Effacer", style: "destructive", onPress: () => clearList() }
        ]
    );
  };

  return (
    <ScreenLayout>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>SHOPPING LIST</Text>
        <TouchableOpacity onPress={handleClear} style={styles.backBtn}>
           <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        
        {/* BARRE D'AJOUT RAPIDE */}
        <GlassCard style={styles.inputCard}>
            <TextInput 
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="Ajouter un article..."
                placeholderTextColor={theme.colors.textSecondary}
                value={newItemName}
                onChangeText={setNewItemName}
                onSubmitEditing={handleAddItem}
            />
            <TouchableOpacity onPress={handleAddItem} style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
        </GlassCard>

        {/* BOUTON MAGIC IMPORT */}
        {(!items || items.length === 0) && (
            <TouchableOpacity 
                style={[styles.magicBtn, { borderColor: theme.colors.success }]} 
                onPress={handleGenerate}
                disabled={isGenerating}
            >
                {isGenerating ? <ActivityIndicator color={theme.colors.success}/> : (
                    <>
                        <MaterialCommunityIcons name="creation" size={20} color={theme.colors.success} />
                        <Text style={[styles.magicText, { color: theme.colors.success }]}>
                            Importer depuis mon Plan Nutrition
                        </Text>
                    </>
                )}
            </TouchableOpacity>
        )}

        {/* LISTE DES COURSES */}
        <View style={styles.listContainer}>
            {isLoading ? (
                <ActivityIndicator color={theme.colors.primary} style={{marginTop: 50}} />
            ) : items?.map((item) => (
                <TouchableOpacity 
                    key={item.id} 
                    style={[
                        styles.itemRow, 
                        { borderBottomColor: theme.colors.border },
                        item.is_checked && { opacity: 0.5 }
                    ]}
                    onPress={() => {
                        if (Platform.OS !== 'web') Haptics.selectionAsync();
                        toggleItem(item);
                    }}
                >
                    <View style={[
                        styles.checkbox, 
                        { borderColor: item.is_checked ? theme.colors.textSecondary : theme.colors.primary },
                        item.is_checked && { backgroundColor: theme.colors.textSecondary, borderColor: theme.colors.textSecondary }
                    ]}>
                        {item.is_checked && <Ionicons name="checkmark" size={14} color="#000" />}
                    </View>
                    
                    <Text style={[
                        styles.itemText, 
                        { color: theme.colors.text },
                        item.is_checked && { textDecorationLine: 'line-through', color: theme.colors.textSecondary }
                    ]}>
                        {item.item_name}
                    </Text>
                </TouchableOpacity>
            ))}

            {items && items.length > 0 && items.every(i => i.is_checked) && (
                <Text style={[styles.allDone, { color: theme.colors.success }]}>
                    Tout est prêt ! Bon appétit. 🛒
                </Text>
            )}
        </View>

      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  content: { padding: 20, paddingBottom: 100 },
  
  inputCard: { flexDirection: 'row', alignItems: 'center', padding: 10, paddingLeft: 15, marginBottom: 20 },
  input: { flex: 1, fontSize: 16, height: 40 },
  addBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  
  magicBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', marginBottom: 20, gap: 10 },
  magicText: { fontWeight: 'bold', fontSize: 14 },

  listContainer: { marginTop: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1 },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, marginRight: 15, justifyContent: 'center', alignItems: 'center' },
  itemText: { fontSize: 16, fontWeight: '500' },
  
  allDone: { textAlign: 'center', marginTop: 30, fontSize: 14, fontStyle: 'italic', fontWeight: 'bold' }
});