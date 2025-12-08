import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../lib/theme';
import { useNutritionLog } from '../../hooks/useNutritionLog';
import { useNutritionMutations } from '../../hooks/useNutritionMutations';
import { GlassCard } from '../../components/ui/GlassCard';
import { ConsumedItem } from '../../types/nutrition';

const { width } = Dimensions.get('window');

interface FoodJournalProps {
  date: string;
}

export default function FoodJournal({ date }: FoodJournalProps) {
  const { colors } = useTheme();
  
  const { data: log, isLoading } = useNutritionLog(date);
  const { toggleItem } = useNutritionMutations(date);

  if (isLoading) {
    return (
      <View style={{ padding: 20 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Chargement du journal...</Text>
      </View>
    );
  }

  // Si vide
  if (!log || !log.meals_status || log.meals_status.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="food-variant-off" size={32} color={colors.textSecondary} style={{ opacity: 0.5 }} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Aucune donnée tactique pour ce jour.
        </Text>
      </View>
    );
  }

  // 1. Regroupement par Repas
  const groupedMeals: Record<string, ConsumedItem[]> = {};
  log.meals_status.forEach((item: ConsumedItem) => {
      const mealName = item.mealName || "AUTRES";
      if (!groupedMeals[mealName]) groupedMeals[mealName] = [];
      groupedMeals[mealName].push(item);
  });

  // 2. Conversion en tableau pour le map
  const mealsArray = Object.entries(groupedMeals);

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 20, gap: 15 }}
        decelerationRate="fast"
        snapToInterval={width * 0.75 + 15} // Largeur carte + gap
        style={{ overflow: 'visible' }} // Permet de voir les cartes suivantes sur les bords
      >
        {mealsArray.map(([mealName, items], index) => {
            // Calcul des totaux par repas
            const mealCals = items.reduce((acc, i) => acc + (i.calories || 0), 0);
            const mealProt = items.reduce((acc, i) => acc + (i.protein || 0), 0);

            return (
                <Animated.View 
                    key={index} 
                    entering={FadeInRight.delay(index * 100).springify()}
                >
                    <GlassCard 
                        style={{ width: width * 0.75, padding: 0, overflow: 'hidden' }} // Carte plus compacte
                        intensity={20}
                    >
                        {/* EN-TÊTE DU REPAS */}
                        <View style={[styles.cardHeader, { backgroundColor: colors.primary + '15', borderBottomColor: colors.border }]}>
                            <View>
                                <Text style={[styles.mealTitle, { color: colors.text }]}>{mealName.toUpperCase()}</Text>
                                <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2 }}>{items.length} ALIMENTS</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={[styles.mealMacro, { color: colors.primary }]}>{mealCals} KCAL</Text>
                                <Text style={{ fontSize: 9, color: colors.textSecondary, fontWeight:'bold' }}>{mealProt}g PROT</Text>
                            </View>
                        </View>

                        {/* LISTE DES ALIMENTS */}
                        <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled> 
                            {items.map((item, i) => (
                                <TouchableOpacity 
                                    key={i}
                                    style={[
                                        styles.itemRow, 
                                        { borderBottomColor: colors.border, borderBottomWidth: i === items.length - 1 ? 0 : 1 }
                                    ]}
                                    onPress={() => {
                                        if (Platform.OS !== 'web') Haptics.selectionAsync();
                                        toggleItem.mutate({ item, mealName: item.mealName, currentLog: log });
                                    }}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                                        <Text style={{ fontSize: 10, color: colors.textSecondary }}>
                                            {item.calories} kcal • {item.protein}g prot
                                        </Text>
                                    </View>
                                    
                                    {/* Bouton de suppression (Croix) */}
                                    <View style={[styles.deleteBtn, { backgroundColor: colors.danger + '15' }]}>
                                        <Ionicons name="close" size={12} color={colors.danger} />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </GlassCard>
                </Animated.View>
            );
        })}
      </ScrollView>
      
      {/* Indicateur de Swipe si plusieurs repas */}
      {mealsArray.length > 1 && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10, opacity: 0.5 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 9, marginRight: 5 }}>GLISSER POUR VOIR L'HISTORIQUE</Text>
              <Ionicons name="arrow-forward" size={10} color={colors.textSecondary} />
          </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 10, marginBottom: 10 },
  
  emptyContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 30, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.1)', 
    borderRadius: 16,
    borderStyle: 'dashed'
  },
  emptyText: { marginTop: 10, fontSize: 12, fontStyle: 'italic' },

  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 15, 
    borderBottomWidth: 1 
  },
  mealTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  mealMacro: { fontSize: 13, fontWeight: '900' },

  itemRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, 
    paddingHorizontal: 15 
  },
  itemName: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  
  deleteBtn: { 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginLeft: 10
  }
});