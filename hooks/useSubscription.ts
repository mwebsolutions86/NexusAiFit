import { useUserProfile } from './useUserProfile';

export const useSubscription = () => {
  const { data: profile, isLoading } = useUserProfile();

  // Logique : Est considéré comme Premium si le tier est 'PREMIUM' ou 'PRO'
  // Vous pouvez adapter selon vos valeurs en base (ex: 'paid', 'subscriber')
  const isPremium = profile?.tier === 'PREMIUM' || profile?.tier === 'PRO';

  return {
    isPremium,
    isLoading,
    tier: profile?.tier || 'FREE'
  };
};