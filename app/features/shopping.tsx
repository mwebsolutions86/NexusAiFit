import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  Platform
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../lib/theme';
import { ScreenLayout } from '../../components/ui/ScreenLayout';
import { GlassCard } from '../../components/ui/GlassCard';
import { NeonButton } from '../../components/ui/NeonButton';

import { useShoppingList } from '../../hooks/useShoppingList';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useActivePlans } from '../../hooks/useActivePlans';
import { useAlert } from '../../lib/AlertContext'; // ✅ IMPORT DU SYSTÈME CUSTOM

const getTodayIndex = () => {
  const day = new Date().getDay(); 
  return (day + 6) % 7; 
};

export default function ShoppingScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { showAlert } = useAlert(); // ✅ HOOK POUR L'ALERTE CENTRÉE
  const [newItem, setNewItem] = useState('');

  const { items, isLoading, addItem, toggleItem, deleteItem, generateFromPlan, clearList } = useShoppingList();
  const { userProfile } = useUserProfile();
  const { data: plans } = useActivePlans(userProfile?.id);

  const activeMealPlan = plans?.mealPlan;

  // --- LOGIQUE IMPORT ---
  const handleImportPlan = () => {
    let daysData = null;
    if (activeMealPlan) {
        if (Array.isArray(activeMealPlan.days)) daysData = activeMealPlan.days;
        else if (activeMealPlan.content && Array.isArray(activeMealPlan.content.days)) daysData = activeMealPlan.content.days;
    }

    if (!daysData) {
        // Alerte d'erreur centrée
        showAlert({ title: "Plan Introuvable", message: "Générez d'abord un plan Nutrition.", type: "error" });
        return;
    }

    const todayIndex = getTodayIndex();
    const allIngredients: string[] = [];

    daysData.forEach((day: any, index: number) => {
        if (index < todayIndex) return; 

        day.meals?.forEach((meal: any) => {
            meal.items?.forEach((item: any) => {
                if (item.ingredients && Array.isArray(item.ingredients)) {
                    allIngredients.push(...item.ingredients);
                } else if (item.name) {
                    allIngredients.push(item.name);
                }
            });
        });
    });

    if (allIngredients.length === 0) {
         showAlert({ title: "Aucun ingrédient", message: "Rien à importer pour le reste de la semaine.", type: "warning" });
         return;
    }

    // Succès Silencieux (Vibration)
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    generateFromPlan.mutate(allIngredients);
  };

  const handleAddItem = () => {
    if (!newItem.trim()) return;
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    addItem.mutate(newItem.trim());
    setNewItem('');
  };

  const handleClear = () => {
      // ✅ ALERTE CENTRÉE DE CONFIRMATION
      showAlert({
          title: "Tout supprimer ?",
          message: "Voulez-vous vraiment vider toute la liste ?",
          type: "warning",
          buttons: [
              { text: "Annuler", style: "cancel" },
              { 
                  text: "Supprimer", 
                  style: "destructive", 
                  onPress: () => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      clearList.mutate();
                  } 
              }
          ]
      });
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    const isChecked = item.is_checked;
    return (
      <View style={{ marginBottom: 8 }}>
        <TouchableOpacity 
            onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                toggleItem.mutate({ id: item.id, is_checked: isChecked });
            }}
            onLongPress={() => {
                // Suppression unitaire silencieuse
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                deleteItem.mutate(item.id);
            }}
            activeOpacity={0.7}
        >
            <GlassCard 
                style={[
                    styles.itemCard, 
                    { 
                        backgroundColor: isChecked ? (isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc') : (isDark ? 'rgba(30,30,40,0.6)' : '#FFFFFF'),
                        opacity: isChecked ? 0.6 : 1
                    }
                ]}
            >
                <View style={[
                    styles.checkbox, 
                    { 
                        borderColor: isChecked ? colors.success : (isDark ? colors.border : '#cbd5e1'),
                        backgroundColor: isChecked ? colors.success : 'transparent'
                    }
                ]}>
                    {isChecked && <Ionicons name="checkmark" size={14} color="#FFF" />}
                </View>
                
                <Text style={[
                    styles.itemText, 
                    { 
                        color: isDark ? colors.text : '#1e293b',
                        textDecorationLine: isChecked ? 'line-through' : 'none',
                        opacity: isChecked ? 0.5 : 1
                    }
                ]}>
                    {item.item_name}
                </Text>
            </GlassCard>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScreenLayout>
      <Image source={require('../../assets/adaptive-icon.png')} style={[StyleSheet.absoluteFillObject, { opacity: isDark ? 0.05 : 0.02, transform: [{scale: 1.5}] }]} blurRadius={50} contentFit="cover" />
      <LinearGradient colors={isDark ? [colors.primary, 'transparent'] : ['#bfdbfe', 'transparent']} style={{position:'absolute', top:0, left:0, right:0, height:200, opacity: isDark ? 0.1 : 0.25}} />

      <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={isDark ? colors.text : '#0f172a'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? colors.text : '#0f172a' }]}>LISTE DE COURSES</Text>
          <TouchableOpacity onPress={handleClear} style={styles.backBtn}>
              <Ionicons name="trash-outline" size={24} color={colors.danger} />
          </TouchableOpacity>
      </View>

      <FlatList
        data={items || []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        ListHeaderComponent={
            <View style={{ marginBottom: 20 }}>
                {activeMealPlan && (
                    <NeonButton 
                        label="IMPORTER (JOURS RESTANTS)" 
                        icon="download-outline" 
                        onPress={handleImportPlan} 
                        style={{ backgroundColor: isDark ? undefined : '#eff6ff', borderColor: isDark ? undefined : colors.primary, marginBottom: 15 }}
                        textStyle={{ fontSize: 12, color: isDark ? undefined : colors.primary }}
                    />
                )}
                <GlassCard style={[styles.inputContainer, { backgroundColor: isDark ? 'rgba(20,20,30,0.6)' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0' }]} intensity={80}>
                    <TextInput
                        style={[styles.input, { color: isDark ? colors.text : '#0f172a' }]}
                        placeholder="Ajouter un article..."
                        placeholderTextColor={isDark ? colors.textSecondary : '#94a3b8'}
                        value={newItem}
                        onChangeText={setNewItem}
                        onSubmitEditing={handleAddItem}
                    />
                    <TouchableOpacity onPress={handleAddItem} style={[styles.addBtn, { backgroundColor: newItem.trim() ? colors.primary : (isDark ? '#333' : '#e2e8f0') }]} disabled={!newItem.trim()}>
                        <Ionicons name="add" size={24} color="#FFF" />
                    </TouchableOpacity>
                </GlassCard>
            </View>
        }
        ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 50, opacity: 0.5 }}>
                <MaterialCommunityIcons name="cart-off" size={64} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, marginTop: 10 }}>Votre liste est vide.</Text>
            </View>
        }
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15 },
  headerTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  backBtn: { padding: 5 },
  itemCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 16 },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  itemText: { fontSize: 16, fontWeight: '600' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 5, borderRadius: 16, borderWidth: 1 },
  input: { flex: 1, paddingHorizontal: 15, paddingVertical: 10, fontSize: 16 },
  addBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginLeft: 5 },
});