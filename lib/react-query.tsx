import { QueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { persistQueryClient } from '@tanstack/react-query-persist-client';

// 1. Configuration du "Moteur de Cache"
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Temps de fraîcheur : 5 min (on ne refetch pas si < 5min)
      staleTime: 1000 * 60 * 5,
      // Garbage collection : 24h (on garde les données en mémoire longtemps pour le offline)
      gcTime: 1000 * 60 * 60 * 24, 
      retry: 1,
      refetchOnWindowFocus: true, // Rafraîchir quand l'app revient au premier plan
      refetchOnReconnect: true,   // Rafraîchir quand le net revient
    },
  },
});

// 2. Configuration du "Stockage Physique"
const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  // Sécurité : On peut throttle les écritures pour ne pas ralentir l'UI
  throttleTime: 1000, 
});

// 3. Activation de la Persistance (Le "Cortex")
// Cela charge automatiquement le cache au démarrage de l'app
persistQueryClient({
  queryClient,
  persister: asyncStoragePersister,
  maxAge: 1000 * 60 * 60 * 24 * 7, // Persister pendant 7 jours
  dehydrateOptions: {
    // On peut choisir d'ignorer certaines clés sensibles ou trop lourdes ici si besoin
    shouldDehydrateQuery: (query) => {
        const queryState = query.state;
        if (queryState.error) return false; // Ne pas sauvegarder les erreurs
        return true;
    }
  },
});