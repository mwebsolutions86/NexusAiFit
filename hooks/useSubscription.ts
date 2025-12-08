import { useUserProfile } from './useUserProfile';

export const useSubscription = () => {
  // On récupère le profil via le hook central
  const { userProfile, isLoading } = useUserProfile();

  // Récupération sécurisée du tier (par défaut 'FREE')
  const tier = userProfile?.tier ? userProfile.tier.toUpperCase() : 'FREE';

  // Logique : Est considéré comme Premium si le tier contient 'PREMIUM', 'PRO', ou 'ELITE'
  // (La vérification est maintenant insensible à la casse grâce au toUpperCase plus haut)
  const isPremium = tier === 'PREMIUM' || tier === 'PRO' || tier === 'ELITE';

  // DEBUG : Décommentez la ligne suivante pour voir ce que la DB renvoie
  // console.log(`👤 [Subscription] Tier: ${tier} | Premium: ${isPremium}`);

  return {
    isPremium,
    isLoading,
    tier: userProfile?.tier || 'FREE'
  };
};