import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Les données restent "fraîches" 5 minutes (pas de re-fetch inutile)
      staleTime: 1000 * 60 * 5,
      // Garbage collection : on garde les données inutilisées 30 min en mémoire
      gcTime: 1000 * 60 * 30,
      // Si une requête échoue, on ne réessaie pas immédiatement (évite les boucles sur 404/401)
      retry: false,
      // Refetch automatique si l'utilisateur quitte l'app et revient
      refetchOnWindowFocus: true,
    },
  },
});