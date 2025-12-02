import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../../lib/theme';
import { useTranslation } from 'react-i18next'; // <-- NOUVEL IMPORT

export default function ShoppingListScreen() {
    const router = useRouter();
    const theme = useTheme();
    const { t } = useTranslation(); // <-- HOOK
    const [newItem, setNewItem] = useState('');
    const [list, setList] = useState(['Protéine Whey', 'Légumes Verts', 'Poisson']); 
    const [loading, setLoading] = useState(false); 

    const handleAddItem = () => {
        if (newItem.trim()) {
            setList([...list, newItem.trim()]);
            setNewItem('');
        }
    };

    const handleToggleItem = (index: number) => {
        const newList = list.filter((_, i) => i !== index);
        setList(newList);
    };

    const styles = StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.colors.bg },
        safeArea: { flex: 1 },
        
        header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
        backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
        headerTitle: { color: theme.colors.text, fontWeight: '900', letterSpacing: 1, fontSize: 16 },

        inputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
        inputBox: { flexDirection: 'row', alignItems: 'center', flex: 1, backgroundColor: theme.colors.glass, borderRadius: 12, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: theme.colors.border },
        input: { flex: 1, color: theme.colors.text, marginLeft: 10, fontSize: 16 },
        addBtn: { width: 50, height: 50, borderRadius: 12, backgroundColor: theme.colors.success, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },

        list: { flex: 1 },
        itemCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.colors.glass, padding: 15, borderRadius: 12, marginHorizontal: 20, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border },
        itemText: { color: theme.colors.text, fontSize: 16 },
        deleteBtn: { padding: 5 },

        emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
        emptyTitle: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold', marginTop: 10 },
        emptySub: { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 5 }
    });

    return (
        <View style={styles.container}>
            <StatusBar style={theme.isDark ? "light" : "dark"} />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('shopping.title')}</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.inputContainer}>
                    <View style={styles.inputBox}>
                        <MaterialCommunityIcons name="cart-plus" size={20} color={theme.colors.textSecondary} />
                        <TextInput 
                            style={styles.input} 
                            placeholder={t('shopping.add_ph')} 
                            placeholderTextColor={theme.colors.textSecondary}
                            value={newItem}
                            onChangeText={setNewItem}
                            onSubmitEditing={handleAddItem}
                        />
                    </View>
                    <TouchableOpacity style={styles.addBtn} onPress={handleAddItem}>
                        <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {list.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="shopping-search" size={60} color={theme.colors.textSecondary} style={{opacity: 0.5}} />
                        <Text style={styles.emptyTitle}>{t('shopping.empty')}</Text>
                        <Text style={styles.emptySub}>{t('shopping.empty_sub')}</Text>
                    </View>
                ) : (
                    <FlatList
                        data={list}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item, index }) => (
                            <View style={styles.itemCard}>
                                <Text style={styles.itemText}>{item}</Text>
                                <TouchableOpacity onPress={() => handleToggleItem(index)} style={styles.deleteBtn}>
                                    <MaterialCommunityIcons name="close" size={24} color={theme.colors.danger} />
                                </TouchableOpacity>
                            </View>
                        )}
                        style={styles.list}
                    />
                )}
            </SafeAreaView>
        </View>
    );
}