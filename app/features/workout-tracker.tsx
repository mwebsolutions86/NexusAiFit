import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
// Vérifie bien ces chemins d'importation selon tes dossiers !
import { useUserProfile } from '../../hooks/useUserProfile';
import { useAIWorkout } from '../../hooks/useAIWorkout';

export default function WorkoutScreen() {
  // 1. On récupère le profil
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();

  // 2. On prépare le hook de génération
  const { generateWorkout, workoutPlan, loading, error } = useAIWorkout();

  // 3. État local pour le choix de l'utilisateur
  const [focus, setFocus] = useState("Full Body");

  // 4. La fonction déclencheur
  const handlePress = () => {
    if (isProfileLoading || !userProfile) {
      Alert.alert("Attendez", "Votre profil charge encore...");
      return;
    }
    
    // C'EST LA CLÉ : On passe les données explicitement
    generateWorkout(userProfile, focus);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Générateur IA</Text>

      {/* Bouton de Test du Focus */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        {['Cardio', 'Musculation', 'Yoga'].map((f) => (
          <TouchableOpacity 
            key={f} 
            onPress={() => setFocus(f)}
            style={{ 
              padding: 10, 
              backgroundColor: focus === f ? 'blue' : '#ddd',
              borderRadius: 8
            }}
          >
            <Text style={{ color: focus === f ? 'white' : 'black' }}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bouton Générer */}
      <TouchableOpacity 
        onPress={handlePress}
        disabled={loading}
        style={{
          backgroundColor: 'black',
          padding: 15,
          borderRadius: 10,
          alignItems: 'center'
        }}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Générer le Programme</Text>
        )}
      </TouchableOpacity>

      {/* Affichage Erreur */}
      {error && (
        <Text style={{ color: 'red', marginTop: 20 }}>Erreur: {error}</Text>
      )}

      {/* Affichage Résultat BRUT pour tester */}
      {workoutPlan && (
        <View style={{ marginTop: 20, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 8 }}>
          <Text style={{ fontWeight: 'bold', color: 'green' }}>PLAN REÇU !</Text>
          <Text>{JSON.stringify(workoutPlan, null, 2)}</Text>
        </View>
      )}
    </ScrollView>
  );
}