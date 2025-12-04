import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { getLocales } from 'expo-localization';

const resources = {
  fr: {
    translation: {
      // --- BASES ---
      landing: { 
        title: "TRANSFORMEZ VOTRE CORPS\nAVEC L'INTELLIGENCE ARTIFICIELLE", 
        subtitle: "Coach Sportif • Nutritionniste • Bio-Tracker", 
        start_btn: "COMMENCER L'AVENTURE", 
        login_btn: "J'ai déjà un compte", 
        legal: "En continuant, vous acceptez nos CGU et confirmez que Nexus ne remplace pas un médecin.",
        
        // Slides Carrousel
        slides: {
            title1: "NE DEVINEZ PLUS.\nCALCULEZ.",
            sub1: "L'effort est brut. La méthode est scientifique.",
            title2: "VOTRE CORPS EST\nUN ALGORITHME",
            sub2: "Bio-Tracking temps réel. Analyse Neural."
        },
        // Features
        features: {
            brain_title: "NEURAL COACH",
            brain_text: "Une IA qui apprend de vos échecs pour garantir vos succès.",
            bio_title: "BIO-HACKING",
            bio_text: "Sommeil, Stress, VFC. Maîtrisez vos variables invisibles."
        },
        // Pricing
        pricing: {
            title: "OFFRES DISPONIBLES",
            select_btn: "CHOISIR",
            discovery: {
                tier: "DÉCOUVERTE",
                price: "GRATUIT",
                f1: "Podomètre & Métriques",
                f2: "Journal Hydratation",
                f3: "Suivi Poids",
                f4: "Chrono Simple",
                f5: "Accès Limité"
            },
            premium: {
                tier: "PREMIUM",
                price: "5.99€",
                period: "/mois",
                f1: "Coach IA Illimité",
                f2: "Programmes Sportifs IA",
                f3: "Plan Nutritionnel IA",
                f4: "Bio-Tracking Complet",
                f5: "Outils Élite"
            }
        }
      },
      auth: { welcome: "BIENVENUE", subtitle: "Connectez-vous au système", email_placeholder: "Adresse Email", password_placeholder: "Mot de passe", login_action: "SE CONNECTER", signup_action: "S'INSCRIRE", or: "OU", google: "CONTINUER AVEC GOOGLE", switch_to_signup: "Pas encore de compte ? Créer un profil", switch_to_login: "Déjà membre ? Se connecter", error_title: "Authentification échouée" },
      onboarding: { step1: "TON OBJECTIF ULTIME ?", step2: "TON NIVEAU ACTUEL ?", step3: "TON MATÉRIEL ?", next: "SUIVANT", finish: "TERMINER & GÉNÉRER", goals: { lose_weight: "Perte de Poids", muscle: "Prise de Masse", endurance: "Endurance & Cardio", strength: "Force Athlétique" }, levels: { beginner: "Débutant (0-1 an)", intermediate: "Intermédiaire (1-3 ans)", advanced: "Avancé (+3 ans)" }, equip: { gym: "Salle de Sport Complète", home: "Maison (Haltères/Elastiques)", bodyweight: "Poids du corps (Street)" } },
      tabs: { cockpit: "COCKPIT", sport: "SPORT", neural: "NEURAL", fuel: "FUEL", modules: "MODULES" },
      
      // --- DASHBOARD ---
      dashboard: { greeting: "BONJOUR", stats_nutri: "NUTRITION", stats_work: "ENTRAÎNEMENT", unit_sessions: "SÉANCES (7J)", unit_kcal: "KCAL / JOUR", section_active: "EN COURS", section_explore: "EXPLORER", active_badge: "PLAN ACTIF", no_plan_title: "Aucun programme", no_plan_desc: "Créez votre plan personnalisé avec l'IA.", card_focus: "Focus", card_sess: "séances", mod_nutri: "Nutrition", mod_nutri_sub: "Plan actif", mod_gen: "Générer", mod_lib: "Bibliothèque", mod_lib_sub: "+200 mouvements", mod_hist: "Historique", mod_hist_sub: "Vos progrès", mod_coach: "Neural Coach", mod_coach_sub: "Discussion IA" },
      
      // --- PROFIL ---
      profile: { language: "Langue", title: "PROFIL NEXUS", default_name: "INITIÉ NEXUS", section_info: "INFORMATIONS PERSONNELLES", label_name: "Nom complet", ph_name: "Votre nom complet", label_age: "ÂGE", ph_age: "Vôtre âge", label_weight: "POIDS (KG)", label_height: "TAILLE (CM)", label_goal: "OBJECTIF", ph_goal: "Perte de poids...", label_level: "NIVEAU D'EXPÉRIENCE", label_equip: "MATÉRIEL DISPONIBLE", label_freq: "SÉANCES / SEM", section_physique: "PHYSIQUE & SANTÉ", section_config: "CONFIGURATION SPORTIVE", section_stats: "STATISTIQUES", stat_streak: "Jours Streak", stat_points: "Points", stat_level: "Niveau", stat_weight: "Kg Actuel", section_sub: "ABONNEMENT", badge_active: "ACTIF", sub_renewal: "Renouvellement :", sub_auto: "Renouvellement automatique", member_elite: "MEMBRE ELITE", member_standard: "MEMBRE STANDARD", sub_free: "GRATUIT", sub_desc_free: "Accès limité. Touchez pour upgrader.", sub_desc_premium: "Accès illimité IA", sub_action: "Passer à la vitesse supérieure", sub_manage: "Gérer mon abonnement", btn_save: "ENREGISTRER LES MODIFICATIONS", btn_saving: "SAUVEGARDE...", section_settings: "PARAMÈTRES", theme: "Mode Sombre / Clair", support: "Support & Aide", legal: "Mentions Légales & CGU", logout: "Déconnexion", section_danger: "ZONE DE DANGER", deactivate: "Désactiver le compte", delete: "Supprimer mon compte", alerts: { welcome: "Bienvenue au Club", welcome_msg: "L'accès Premium est débloqué !", sub_downgrade: "Vous êtes passé au plan Gratuit.", error: "Erreur", error_plan: "Impossible de changer le plan.", confirm_logout: "Voulez-vous vraiment vous déconnecter ?", success: "Succès", saved: "Profil mis à jour avec succès" }, footer: { version: "NEXUS AI FIT v1.0", system: "SYSTÈME DE GESTION BIOLOGIQUE AVANCÉ", copyright: "© 2025 NEXUS INC. TOUS DROITS RÉSERVÉS." } },
      
      // --- COACH ---
      coach: { intro: "Système NEXUS activé. Je suis prêt à optimiser vos performances. Quelle est la mission aujourd'hui ?", locked_title: "ACCÈS CLASSÉ DÉFENSE", locked_desc: "Le Neural Coach analyse vos performances en temps réel. Cette technologie est réservée aux membres Elite.", btn_unlock: "ACTIVER L'ACCÈS ELITE", placeholder: "Posez une question...", error_network: "Erreur de communication avec le QG.", error_server: "Désolé, mes systèmes neuronaux ne répondent pas." },
      
      // --- NUTRITION (Principal) ---
     nutrition: { 
        title: "FUEL", 
        subtitle: "Nutrition", 
        consumed: "CONSOMMÉ", 
        target: "CIBLE", 
        ia_title: "DIÉTÉTICIEN IA", 
        ia_desc: "Générez une semaine de repas complète, adaptée à votre métabolisme et vos goûts.", 
        pref_label: "PRÉFÉRENCES", 
        pref_ph: "Ex: Végétarien, Budget étudiant, Sans gluten...", 
        btn_generate: "GÉNÉRER LE PLAN", 
        btn_regen: "RÉGÉNÉRER LE PLAN", 
        alert_title: "Nouveau Menu Prêt", 
        alert_msg: "Votre plan a été généré et calibré.", 
        alert_error: "Impossible de générer le plan.", 
        alert_zone: "Hors Zone", 
        alert_zone_msg: "Concentrez-vous sur le plan d'aujourd'hui." 
      },
      // --- SYSTÈMES (Menu) ---
      systems: {
        title: "Systèmes",
        subtitle: "Optimisez chaque aspect de votre biologie.",
        categories: {
          metabolism: "Bio-Métabolisme",
          performance: "Performance Physique",
          mental: "Neuro & Récupération",
          logistics: "Logistique"
        },
        subtitles: {
          metabolism: "Nutrition, Hydratation & Composition",
          performance: "Force, Endurance & Outils",
          mental: "Sommeil, Stress & Bio-Hacking",
          logistics: "Organisation & Achats"
        },
        modules: {
          nutrition: "Plan Nutrition",
          macros: "Macros",
          water: "Hydratation",
          bodyfat: "Body Fat %",
          bmi: "IMC / BMI",
          tdee: "Dépense (TDEE)",
          fasting: "Jeûne",
          workout_log: "Journal Sport",
          rm1: "Calculateur 1RM",
          timer: "Chrono / Tabata",
          posture: "Posture AI",
          reflex: "Réflexes",
          vision: "Vision",
          sleep: "Sommeil",
          stress: "Gestion Stress",
          meditation: "Méditation",
          breath: "Respiration",
          cold: "Cold Exposure",
          nootropics: "Nootropiques",
          journal: "Journal",
          shopping: "Courses",
          meal_prep: "Meal Prep",
          env: "Environnement",
          hrv: "VFC / HRV",
          discharge: "Décharge"
        }
      },
      // --- ABONNEMENT ---
      subscription: { badge: "NEXUS ELITE", status_badge: "STATUT : MEMBRE ELITE", title_free: "DÉPASSEZ VOS LIMITES", title_pro: "VOTRE ABONNEMENT", subtitle: "Débloquez l'intelligence artificielle complète pour une transformation physique accélérée.", active_title: "Abonnement Actif", active_renewal: "Prochain renouvellement : 01/01/2026", manage_btn: "GÉRER / ANNULER", manage_info: "Vous allez être redirigé vers les réglages de votre Store pour gérer l'abonnement.", features: { coach: "Coach IA Illimité (Chat)", plans: "Plans Nutrition & Sport 100% Perso", bio: "Analyse Biométrique (VFC, Sommeil)", recipes: "Recettes & Listes de Courses", support: "Support Prioritaire" }, price_month: "/ mois", btn_start: "COMMENCER L'ESSAI", btn_restore: "Restaurer les achats", legal_terms: "Conditions Générales", legal_privacy: "Confidentialité", alert_pay_title: "Paiement (Simulation)", alert_pay_msg: "En production, ceci ouvrira Apple Pay / Google Pay via RevenueCat.", alert_restore: "Restauration", alert_restore_msg: "Recherche d'abonnements existants..." },
      
      // --- MODULES RACINES (Car utilisés hors du dossier features/modules parfois) ---
      workout_tracker: { 
        title: "WORKOUT TRACKER", 
        available_moves: "MOUVEMENTS DISPONIBLES", 
        ia_title: "GÉNÉRATEUR DE PROGRAMME", 
        ia_desc: "L'IA va créer une semaine d'entraînement adaptée à votre matériel et votre niveau.", 
        label_focus: "FOCUS PARTICULIER (Optionnel)", 
        ph_focus: "Ex: Pecs, Fessiers, Cardio...", 
        btn_generate: "GÉNÉRER LE PROGRAMME", 
        plan_active: "PLAN ACTIF", 
        btn_finish: "TERMINER LA SÉANCE", 
        btn_regen: "GÉNÉRER UN NOUVEAU PROGRAMME", 
        alert_ready_title: "Programme Prêt", 
        alert_ready_msg: "Votre semaine d'entraînement a été générée !", 
        alert_empty_title: "Séance vide", 
        alert_empty_msg: "Cochez au moins un exercice.", 
        alert_saved_title: "Séance Enregistrée ! 🚀", 
        alert_saved_msg: "Bravo, votre historique a été mis à jour.", 
        btn_history: "Voir l'historique", 
        week_sessions: "SÉANCES / SEMAINE", 
        day_session: "SÉANCE", 
        exos_count: "EXOS", 
        btn_demo: "DÉMO VIDÉO", 
        protocol: "PROTOCOLE D'EXÉCUTION :" 
      },
      timer: { title: "CHRONO TACTIQUE", mode_rest: "REPOS", mode_tabata: "TABATA", start: "DÉMARRER", stop: "ARRÊTER", reset: "RESET", rounds: "ROUNDS", work: "TRAVAIL", rest: "REPOS" },
      library: { title: "BIBLIOTHÈQUE NEXUS", available: "MOUVEMENTS DISPONIBLES", search_ph: "Rechercher un exercice...", filters: { all: "Tous", chest: "Pectoraux", back: "Dos", legs: "Jambes", shoulders: "Épaules", arms: "Bras", abs: "Abdominaux", cardio: "Cardio" }, protocol: "PROTOCOLE D'EXÉCUTION :", btn_video: "VOIR DÉMO", btn_add: "AJOUTER", empty_search: "Aucun exercice trouvé pour" },
      history: { title: "HISTORIQUE SÉANCES", stats_total: "SÉANCES TOTALES", stats_valid: "EXERCICES VALIDÉS", timeline: "TIMELINE", session_active: "Séance Active", session_rest: "Jour de Repos ?", completed_ex: "exercices complétés", empty: "Aucune séance enregistrée." },

      // --- MODULES INTERNES (Sous 'modules') ---
      modules: {
        shopping: { title: "LISTE DE COURSES", add_ph: "Ajouter un article...", empty: "Votre liste est vide.", empty_sub: "Ajoutez des articles manuellement ou importez depuis votre plan nutritionnel.", import_btn: "IMPORTER LE PLAN", clear_btn: "VIDER", add_btn: "AJOUTER", done_title: "TERMINÉ", import_success: "ingrédients ajoutés.", import_empty: "Aucun ingrédient trouvé.", import_confirm_title: "Importer ?", import_confirm_msg: "Cela ajoutera les ingrédients nécessaires pour le reste de la semaine.", clear_confirm_title: "Confirmation", clear_confirm_msg: "Tout supprimer ?" },
        mealprep: { title: "MEAL PREP (PRO)", tab_chef: "CHEF IA", tab_book: "LIVRE DE RECETTES", input_label: "VOS ENVIES / CONTRAINTES", input_ph: "Ex: 3 déjeuners riches en protéines, pas de poisson...", btn_generate: "GÉNÉRER LES IDÉES", suggestions: "SUGGESTIONS DU CHEF", ingredients: "INGRÉDIENTS", prep: "PRÉPARATION", storage: "CONSERVATION", empty: "Aucune recette sauvegardée." },
        body_fat: { title: "MASSE GRASSE", result_label: "ESTIMATION BF", input_info: "ENTREZ VOS MESURES", history_title: "HISTORIQUE RÉCENT", gender_m: "HOMME", gender_f: "FEMME", neck: "COU (CM)", waist: "TAILLE (NOMBRIL)", hip: "HANCHES", btn_calculate: "CALCULER", interp: { essential: "Essentiel (Danger)", athlete: "Athlète", fitness: "Fitness", average: "Moyen", obese: "Obèse" } },
        reflex: { title: "TEST RÉFLEXES", idle: "TAPEZ QUAND L'ÉCRAN DEVIENT VERT", idle_sub: "Touchez l'écran pour commencer", waiting: "ATTENDEZ...", ready: "TAPEZ MAINTENANT !", too_early: "TROP TÔT !", result_label: "TEMPS DE RÉACTION", retry: "RÉESSAYER", history: "DERNIERS ESSAIS" },
        journal: { title: "JOURNAL DE BORD", write_btn: "ÉCRIRE MAINTENANT", new_entry: "NOUVELLE ENTRÉE", save: "ENREGISTRER", empty: "Le journal est vide.\nCommencez par écrire vos pensées.", placeholder: "Qu'avez-vous en tête aujourd'hui ?", moods: { focus: "Focus", happy: "Positif", neutral: "Neutre", tired: "Fatigué", anxious: "Stressé" }, alert_empty: "Vide", alert_empty_msg: "Écrivez quelque chose.", delete_title: "Supprimer ?", delete_msg: "Cette action est irréversible.", btn_cancel: "Annuler", btn_delete: "Supprimer" },
        breath: { title: "RESPIRATION", start: "COMMENCER", stop: "ARRÊTER", inhale: "INSPIREZ", hold: "BLOQUEZ", exhale: "EXPIREZ", cycle: "CYCLE", tech: { coherence_name: "Cohérence", coherence_desc: "Équilibre (5s-5s)", box_name: "Box Breathing", box_desc: "Focus (4s-4s-4s-4s)", relax_name: "4-7-8", relax_desc: "Sommeil (4s-7s-8s)" } },
        hrv: { title: "OPTIMISATION VFC", scan_btn: "MESURER VFC", scanning: "MESURE EN COURS...", status_label: "ÉTAT", power_label: "PUISSANCE", history_title: "HISTORIQUE VFC", advice_title: "DIAGNOSTIC IA", coherence: "COHÉRENCE", stress: "STRESS", power_high: "HAUTE", power_low: "BASSE", place_finger: "Placez votre doigt sur la caméra pour la mesure optique.", advices: { high: "Système nerveux parasympathique dominant. Récupération optimale.", mid: "Équilibre autonome modéré. État physiologique stable.", low: "Dominante sympathique (Stress). Privilégiez le repos." } },
        heart: { title: "CARDIO FRÉQUENCE", scan_btn: "LANCER SYNC WATCH", new_scan: "NOUVELLE MESURE", measuring: "MESURE EN COURS...", zones_title: "ZONES D'ENTRAÎNEMENT", history_title: "HISTORIQUE RHR", unit: "BPM", desc: "Utilise les capteurs de votre appareil ou synchronise avec Google Fit / Apple Health.", alert_title: "Mesure Réussie", alert_msg: "BPM enregistré.", zones: { warmup: "Échauffement", fatburn: "Brûle Graisse", aerobic: "Aérobie", anaerobic: "Anaérobie", max: "Maximal" } },
        stress: { title: "NIVEAU DE STRESS", ready: "PRÊT", ready_desc: "Appuyez pour lancer l'analyse biométrique.", scanning: "MESURE EN COURS...", scan_btn: "LANCER SCAN BIO", score_label: "SCORE GLOBAL", history: "DERNIERS JOURS", status: { relaxed: "RELAXÉ", moderate: "MODÉRÉ", high: "ÉLEVÉ", critical: "CRITIQUE" }, metrics: { noise: "BRUIT", light: "LUMIÈRE", air: "AIR" } },
        sleep: { title: "ANALYSE SOMMEIL", question: "Combien d'heures avez-vous dormi ?", quality: "QUALITÉ DU REPOS", save: "ENREGISTRER", history: "HISTORIQUE (7 JOURS)", status: { critical: "CRITIQUE", poor: "INSUFFISANT", good: "OPTIMAL", excessive: "EXCESSIF" }, unit: "HEURES" },
        meditation: { title: "MÉDITATION", start: "DÉMARRER SÉANCE", pause: "PAUSE", duration: "DURÉE", ambiance: "AMBIANCE", history_title: "DERNIÈRES SÉANCES", sounds: { silence: "Silence", rain: "Pluie", waves: "Océan", forest: "Forêt" } },
        bmi: { title: "ANALYSE IMC", calculate: "CALCULER L'IMC", result: "VOTRE IMC", underweight: "Insuffisance pondérale", normal: "Poids normal", overweight: "Surpoids", obese: "Obésité", input_weight: "POIDS (KG)", input_height: "TAILLE (CM)" },
        tdee: { title: "MÉTABOLISME TOTAL", calculate: "CALCULER TDEE", activity: "NIVEAU D'ACTIVITÉ", sedentary: "Sédentaire", light: "Légèrement Actif", moderate: "Modérément Actif", active: "Très Actif", athlete: "Athlète", maintenance: "MAINTIEN", cutting: "SÈCHE (-500)", bulking: "MASSE (+500)", kcal: "Kcal/jour" },
        supps: { title: "STACK SUPPLÉMENTS", manual_title: "AJOUT MANUEL", input_name: "Nom (ex: Vitamine C)", input_dose: "Dosage", input_freq: "Fréq.", btn_add: "AJOUTER", quick_title: "BIBLIOTHÈQUE RAPIDE", my_stack: "MON STACK", empty: "Votre stack est vide." },
        
        rm1: { title: "CALCULATEUR 1RM", calculate: "CALCULER MAX", weight_lifted: "POIDS (KG)", reps_done: "RÉPÉTITIONS", est_max: "ESTIMATION 1RM", percentages: "CHARGES DE TRAVAIL" },
        vision: { title: "VISION FOCUS", time: "TEMPS", score: "SCORE", start: "START", replay: "REJOUER", instruction: "Tapez les cibles le plus vite possible !", history: "MEILLEURS SCORES" },
        discharge: { title: "NEURO-DÉCHARGE", start: "INITIER DÉCHARGE", stop: "ARRÊTER SESSION", history: "DERNIÈRES SESSIONS", modes: { gamma: "GAMMA (Reset)", alpha: "ALPHA (Calme)", theta: "THETA (Sleep)" } },
        env: { title: "SUIVI ENVIRONNEMENT", scan_btn: "LANCER SCAN", scanning: "SCAN EN COURS...", score: "SCORE GLOBAL", noise: "BRUIT", light: "LUMIÈRE", air: "AIR", diag: "DIAGNOSTIC IA", history: "HISTORIQUE SCORES" },
        posture: { title: "ANALYSE POSTURE", score: "SCORE", auto_diag: "AUTO-DIAGNOSTIC", checks: { head: "Cou de Texto", head_sub: "L'oreille est en avant de l'épaule", shoulders: "Épaules Enroulées", shoulders_sub: "Les épaules tombent vers l'avant", pelvic: "Cambrures Excessives", pelvic_sub: "Le bas du dos est très creusé" }, btn_analyze: "ANALYSER", history: "SUIVI POSTURAL", advice: { perfect: "Posture parfaite !", good: "Bonne posture globale.", average: "Attention, des déséquilibres.", bad: "Posture à corriger en priorité." } },
        macros: { title: "CALCULATEUR MACROS", target_title: "CIBLE JOURNALIÈRE", section_goal: "OBJECTIF", section_split: "RÉPARTITION", info: "Ces valeurs sont calculées sur la base de votre TDEE.", goals: { cut: "SÈCHE", maintain: "MAINTIEN", bulk: "MASSE" }, splits: { balanced: "ÉQUILIBRÉ", low: "LOW CARB", high: "HIGH CARB" } },
        fasting: { title: "JEÛNE INTERMITTENT", fasting_label: "EN JEÛNE", eating_label: "FENÊTRE ALIMENTAIRE", target_badge: "OBJECTIF :", btn_start: "DÉMARRER LE JEÛNE", btn_stop: "ROMPRE LE JEÛNE", section_proto: "CHOISIR UN PROTOCOLE", section_history: "HISTORIQUE RÉCENT", alerts: { stop_title: "Rompre le jeûne ?", stop_msg: "Terminer la session ?", finish_title: "Jeûne Terminé", finish_msg: "Bravo ! Vous avez jeûné" } },
        mood: { title: "ÉTAT NEURAL", neuro_title: "ESTIMATION BIOCHIMIQUE", history_title: "HISTORIQUE", btn_calibrate: "CALIBRER LE SYSTÈME", states: { discharged: "DÉCHARGÉ", anxious: "ANXIEUX", balance: "ÉQUILIBRE", flow: "FLOW", hyped: "SURVOLTÉ" } },
        body: { title: "BODY BATTERY", status_badge: "OPTIMAL", factors_title: "FACTEURS DU JOUR", tips_title: "ANALYSE IA", history_title: "HISTORIQUE (7 JOURS)", factors: { sleep: "Sommeil", stress: "Stress", sport: "Sport" } },
        cold: { title: "IMMERSION FROID", timer_label: "EXPOSITION EN COURS", ready: "PRÊT", temp_label: "Température Eau", btn_finish: "TERMINER", history_title: "HISTORIQUE D'EXPOSITION" },
        stretching: {
          title: "ROUTINES SOUPLESSE", protocols: "PROTOCOLES SYSTÈME", history: "HISTORIQUE", next: "SUIVANT :", demo: "VOIR DÉMO", end: "TERMINÉ",
          routines: { morning_title: "ACTIVATION NEURALE", morning_desc: "Réveil musculaire.", post_title: "RÉCUPÉRATION", post_desc: "Après effort.", spine_title: "ALIGNEMENT", spine_desc: "Dos." },
          exercises: { cervical: "Rotations Cervicales", shoulders: "Enroulement Épaules", catcow: "Chat-Vache", twist: "Torsions", fold: "Flexion Avant", quad: "Quadriceps", hamstring: "Ischios", calf: "Mollets", child: "Posture de l'Enfant", cobra: "Cobra", hang: "Suspension" }
        },
        nootropics: { title: "GUIDE NOOTROPIQUES", add_stack: "AJOUTER AU STACK" }
      }
    }
  },
  en: {
    translation: {
      landing: { title: "TRANSFORM YOUR BODY\nWITH AI", subtitle: "Sports Coach • Nutritionist • Bio-Tracker", start_btn: "START JOURNEY", login_btn: "I have an account", legal: "By continuing, you accept TOS.",
          slides: { title1: "STOP GUESSING.\nCALCULATE.", sub1: "Effort is raw. Method is scientific.", title2: "YOUR BODY IS\nAN ALGORITHM", sub2: "Real-time Bio-Tracking. Neural Analysis." },
          features: { brain_title: "NEURAL COACH", brain_text: "AI that learns from your failures.", bio_title: "BIO-HACKING", bio_text: "Sleep, Stress, HRV. Master invisible variables." },
          pricing: { title: "AVAILABLE OFFERS", select_btn: "CHOOSE", discovery: { tier: "DISCOVERY", price: "FREE", f1: "Metrics & Pedometer", f2: "Hydration Log", f3: "Weight Tracking", f4: "Simple Timer", f5: "Limited Access" }, premium: { tier: "PREMIUM", price: "5.99€", period: "/month", f1: "Unlimited AI Coach", f2: "AI Workout Plans", f3: "AI Nutrition Plans", f4: "Full Bio-Tracking", f5: "Elite Tools" } }
      },
      auth: { welcome: "WELCOME", subtitle: "Log in to system", email_placeholder: "Email", password_placeholder: "Password", login_action: "LOG IN", signup_action: "SIGN UP", or: "OR", google: "CONTINUE WITH GOOGLE", switch_to_signup: "No account? Create one", switch_to_login: "Member? Log in", error_title: "Auth failed" },
      onboarding: { step1: "ULTIMATE GOAL?", step2: "CURRENT LEVEL?", step3: "EQUIPMENT?", next: "NEXT", finish: "FINISH", goals: { lose_weight: "Weight Loss", muscle: "Muscle Gain", endurance: "Endurance", strength: "Power" }, levels: { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" }, equip: { gym: "Gym", home: "Home", bodyweight: "Bodyweight" } },
      tabs: { cockpit: "COCKPIT", sport: "SPORT", neural: "NEURAL", fuel: "FUEL", modules: "MODULES" },
      dashboard: { greeting: "HELLO", stats_nutri: "NUTRITION", stats_work: "WORKOUT", unit_sessions: "SESSIONS (7D)", unit_kcal: "KCAL / DAY", section_active: "ACTIVE", section_explore: "EXPLORE", active_badge: "ACTIVE PLAN", no_plan_title: "No plan", no_plan_desc: "Create your plan with AI.", card_focus: "Focus", card_sess: "sessions", mod_nutri: "Nutrition", mod_nutri_sub: "Active plan", mod_gen: "Generate", mod_lib: "Library", mod_lib_sub: "+200 exercises", mod_hist: "History", mod_hist_sub: "Progress", mod_coach: "Neural Coach", mod_coach_sub: "AI Chat" },
      profile: { language: "Language", title: "PROFILE", default_name: "INITIATE", section_info: "PERSONAL INFO", label_name: "Full Name", ph_name: "Name", label_age: "AGE", ph_age: "Age", label_weight: "WEIGHT (KG)", label_height: "HEIGHT (CM)", label_goal: "GOAL", ph_goal: "Goal...", label_level: "LEVEL", ph_level: "Level...", section_config: "SPORT CONFIG", label_exp: "EXPERIENCE", label_equip: "EQUIPMENT", label_freq: "SESSIONS/WEEK", section_physique: "BODY & HEALTH", section_stats: "STATS", stat_streak: "Streak", stat_points: "Points", stat_level: "Level", stat_weight: "Current Kg", section_sub: "SUBSCRIPTION", badge_active: "ACTIVE", sub_renewal: "Renewal:", sub_auto: "Auto-renewal", member_elite: "ELITE MEMBER", member_standard: "STANDARD MEMBER", sub_free: "FREE", sub_desc_free: "Limited access.", sub_desc_premium: "Unlimited access", sub_action: "Upgrade", sub_manage: "Manage", btn_save: "SAVE", btn_saving: "SAVING...", section_settings: "SETTINGS", theme: "Dark/Light Mode", support: "Support", legal: "Legal", logout: "Logout", section_danger: "DANGER ZONE", deactivate: "Deactivate", delete: "Delete", alerts: { welcome: "Welcome", welcome_msg: "Premium unlocked!", sub_downgrade: "Free mode", error: "Error", error_plan: "Plan error", confirm_logout: "Logout?", success: "Success", saved: "Saved" }, footer: { version: "v1.0", system: "BIO MANAGEMENT SYSTEM", copyright: "© 2025 NEXUS" } },
      coach: { intro: "NEXUS System Online. Ready to optimize performance. What is your mission?", locked_title: "RESTRICTED ACCESS", locked_desc: "Neural Coach reserved for Elite members.", btn_unlock: "ACTIVATE ELITE ACCESS", placeholder: "Ask a question...", error_network: "Network error.", error_server: "Systems not responding." },
      nutrition: { 
        title: "FUEL", 
        subtitle: "Nutrition", 
        consumed: "CONSUMED", 
        target: "TARGET", 
        ia_title: "DIETICIAN AI", 
        ia_desc: "Generate a full weekly meal plan adapted to your goals.", 
        pref_label: "PREFERENCES", 
        pref_ph: "Ex: Vegetarian, Low budget...", 
        btn_generate: "GENERATE PLAN", 
        btn_regen: "REGENERATE PLAN", 
        alert_title: "Menu Ready", 
        alert_msg: "Your plan has been generated.", 
        alert_error: "Generation failed.", 
        alert_zone: "Wrong Zone", 
        alert_zone_msg: "Focus on today's plan." 
      },
      subscription: { badge: "NEXUS ELITE", status_badge: "STATUS: ELITE", title_free: "BREAK LIMITS", title_pro: "YOUR SUBSCRIPTION", subtitle: "Unlock full AI.", active_title: "Active", active_renewal: "Renews: 01/01/2026", manage_btn: "MANAGE / CANCEL", manage_info: "Redirecting to Store.", features: { coach: "Unlimited Coach", plans: "Custom Plans", bio: "Bio-Metrics", recipes: "Recipes", support: "Support" }, price_month: "/ month", btn_start: "START TRIAL", btn_restore: "Restore", legal_terms: "Terms", legal_privacy: "Privacy", alert_pay_title: "Payment", alert_pay_msg: "Production uses RevenueCat.", alert_restore: "Restore", alert_restore_msg: "Searching..." },
      workout_tracker: { 
        title: "WORKOUT TRACKER", 
        available_moves: "MOVEMENTS AVAILABLE", 
        ia_title: "PROGRAM GENERATOR", 
        ia_desc: "AI will create a weekly plan based on your equipment and level.", 
        label_focus: "PARTICULAR FOCUS (Optional)", 
        ph_focus: "Ex: Chest, Glutes, Cardio...", 
        btn_generate: "GENERATE PROGRAM", 
        plan_active: "ACTIVE PLAN", 
        btn_finish: "FINISH SESSION", 
        btn_regen: "GENERATE NEW PROGRAM", 
        alert_ready_title: "Program Ready", 
        alert_ready_msg: "Your workout week is ready!", 
        alert_empty_title: "Empty Session", 
        alert_empty_msg: "Check at least one exercise.", 
        alert_saved_title: "Session Saved!", 
        alert_saved_msg: "History updated.", 
        btn_history: "View History", 
        week_sessions: "SESSIONS / WEEK", 
        day_session: "SESSION", 
        exos_count: "EXERCISES", 
        btn_demo: "VIDEO DEMO", 
        protocol: "EXECUTION PROTOCOL:" 
      },
      shopping: { title: "SHOPPING LIST", add_ph: "Add item...", empty: "List empty.", empty_sub: "Add items manually or import from plan.", import_btn: "IMPORT PLAN", clear_btn: "CLEAR", add_btn: "ADD", done_title: "DONE", import_success: "items added.", import_empty: "No ingredients found." },
      timer: { title: "TACTICAL TIMER", mode_rest: "REST", mode_tabata: "TABATA", start: "START", stop: "STOP", reset: "RESET", rounds: "ROUNDS", work: "WORK", rest: "REST" },
      library: { title: "NEXUS LIBRARY", available: "MOVEMENTS", search_ph: "Search...", filters: { all: "All", chest: "Chest", back: "Back", legs: "Legs", shoulders: "Shoulders", arms: "Arms", abs: "Abs", cardio: "Cardio" }, protocol: "PROTOCOL:", btn_video: "VIDEO", btn_add: "ADD", empty_search: "No results" },
      history: { title: "WORKOUT LOGS", stats_total: "TOTAL SESSIONS", stats_valid: "VALIDATED EXOS", timeline: "TIMELINE", session_active: "Active", session_rest: "Rest", completed_ex: "completed", empty: "No logs." },
      systems: {
        title: "Systems",
        subtitle: "Optimize every aspect of your biology.",
        categories: {
          metabolism: "Bio-Metabolism",
          performance: "Physical Performance",
          mental: "Neuro & Recovery",
          logistics: "Logistics"
        },
        subtitles: {
          metabolism: "Nutrition, Hydration & Composition",
          performance: "Strength, Endurance & Tools",
          mental: "Sleep, Stress & Bio-Hacking",
          logistics: "Organization & Shopping"
        },
        modules: {
          nutrition: "Nutrition Plan",
          macros: "Macros",
          water: "Hydration",
          bodyfat: "Body Fat %",
          bmi: "BMI",
          tdee: "TDEE Burn",
          fasting: "Fasting",
          workout_log: "Workout Log",
          rm1: "1RM Calc",
          timer: "Timer / Tabata",
          posture: "Posture AI",
          reflex: "Reflexes",
          vision: "Vision",
          sleep: "Sleep",
          stress: "Stress Mgmt",
          meditation: "Meditation",
          breath: "Breathing",
          cold: "Cold Exposure",
          nootropics: "Nootropics",
          journal: "Journal",
          shopping: "Groceries",
          meal_prep: "Meal Prep",
          env: "Environment",
          hrv: "HRV",
          discharge: "Discharge"
        }
      },

      modules: {
        water: { title: "HYDRATION", goal: "GOAL", current: "CURRENT", add: "ADD 250ML", history: "TODAY'S HISTORY", unit: "L" },
        shopping: { title: "SHOPPING LIST", add_ph: "Add item...", empty: "List empty.", empty_sub: "Add items manually or import from plan.", import_btn: "IMPORT PLAN (Remaining)", clear_btn: "CLEAR", add_btn: "ADD", done_title: "DONE", import_success: "items added.", import_empty: "No ingredients found.", import_confirm_title: "Import?", import_confirm_msg: "Adds ingredients for the rest of the week.", clear_confirm_title: "Clear?", clear_confirm_msg: "Delete everything?" },
        mealprep: { title: "MEAL PREP", tab_chef: "AI CHEF", tab_book: "RECIPE BOOK", input_label: "YOUR NEEDS / CONSTRAINTS", input_ph: "Ex: 3 high protein lunches...", btn_generate: "GENERATE IDEAS", suggestions: "CHEF SUGGESTIONS", ingredients: "INGREDIENTS", prep: "PREPARATION", storage: "STORAGE", empty: "No saved recipes." },
        body_fat: { title: "BODY FAT", result_label: "ESTIMATED BF", input_info: "ENTER MEASUREMENTS", history_title: "RECENT HISTORY", gender_m: "MALE", gender_f: "FEMALE", neck: "NECK (CM)", waist: "WAIST (NAVEL)", hip: "HIPS", btn_calculate: "CALCULATE", interp: { essential: "Essential", athlete: "Athlete", fitness: "Fitness", average: "Average", obese: "Obese" } },
        supps: { title: "SUPPLEMENT STACK", manual_title: "MANUAL ADD", input_name: "Name (e.g. Vitamin C)", input_dose: "Dosage", input_freq: "Freq.", btn_add: "ADD", quick_title: "QUICK LIBRARY", my_stack: "MY STACK", empty: "Your stack is empty." },
        stretching: { title: "STRETCHING ROUTINES", protocols: "SYSTEM PROTOCOLS", history: "HISTORY", next: "NEXT:", demo: "WATCH DEMO", end: "FINISHED", routines: { morning_title: "NEURAL ACTIVATION", morning_desc: "Awakening.", post_title: "SYSTEM COOLDOWN", post_desc: "Recovery.", spine_title: "SPINAL ALIGNMENT", spine_desc: "Back relief." }, exercises: { cervical: "Cervical Rotations", shoulders: "Shoulder Rolls", catcow: "Cat-Cow", twist: "Twists", fold: "Forward Fold", quad: "Quad Stretch", hamstring: "Hamstring", calf: "Calf", child: "Child's Pose", cobra: "Cobra", hang: "Dead Hang" } },
        nootropics: { title: "NOOTROPICS GUIDE", add_stack: "ADD TO STACK" },
        reflex: { title: "REFLEX TEST", idle: "TAP WHEN GREEN", idle_sub: "Tap screen to start", waiting: "WAIT...", ready: "TAP NOW!", too_early: "TOO EARLY!", result_label: "REACTION TIME", retry: "RETRY", history: "LATEST TRIES" },
        breath: { title: "BREATHING", start: "START", stop: "STOP", inhale: "INHALE", hold: "HOLD", exhale: "EXHALE", cycle: "CYCLE", tech: { coherence_name: "Coherence", coherence_desc: "Balance", box_name: "Box Breathing", box_desc: "Focus", relax_name: "4-7-8", relax_desc: "Sleep" } },
        hrv: { title: "HRV OPTIMIZATION", scan_btn: "MEASURE HRV", scanning: "MEASURING...", status_label: "STATE", power_label: "POWER", history_title: "HRV HISTORY", advice_title: "AI DIAGNOSIS", coherence: "COHERENCE", stress: "STRESS", power_high: "HIGH", power_low: "LOW", place_finger: "Place finger on camera.", advices: { high: "Parasympathetic dominance.", mid: "Moderate balance.", low: "Sympathetic dominance." } },
        heart: { title: "HEART RATE", scan_btn: "SYNC WATCH", new_scan: "NEW MEASURE", measuring: "MEASURING...", zones_title: "TRAINING ZONES", history_title: "RHR HISTORY", unit: "BPM", desc: "Uses device sensors.", alert_title: "Success", alert_msg: "BPM saved.", zones: { warmup: "Warmup", fatburn: "Fat Burn", aerobic: "Aerobic", anaerobic: "Anaerobic", max: "Max" } },
        stress: { title: "STRESS LEVEL", ready: "READY", ready_desc: "Tap to start.", scanning: "SCANNING...", scan_btn: "START BIO SCAN", score_label: "GLOBAL SCORE", history: "RECENT DAYS", status: { relaxed: "RELAXED", moderate: "MODERATE", high: "HIGH", critical: "CRITICAL" }, metrics: { noise: "NOISE", light: "LIGHT", air: "AIR" } },
        sleep: { title: "SLEEP ANALYSIS", question: "How many hours?", quality: "QUALITY", save: "SAVE", history: "HISTORY", status: { critical: "CRITICAL", poor: "POOR", good: "OPTIMAL", excessive: "EXCESSIVE" }, unit: "HOURS" },
        meditation: { title: "MEDITATION", duration: "DURATION", ambiance: "AMBIANCE", start: "START SESSION", pause: "PAUSE", history_title: "LATEST SESSIONS", sounds: { silence: "Silence", rain: "Rain", waves: "Waves", forest: "Forest" } },
        journal: { title: "JOURNAL", write_btn: "WRITE NOW", new_entry: "NEW ENTRY", save: "SAVE", empty: "Journal is empty.", placeholder: "What's on your mind?", moods: { focus: "Focus", happy: "Positive", neutral: "Neutral", tired: "Tired", anxious: "Stressed" }, alert_empty: "Empty", alert_empty_msg: "Write something.", delete_title: "Delete?", delete_msg: "This cannot be undone.", btn_cancel: "Cancel", btn_delete: "Delete" },
        bmi: { title: "BMI ANALYSIS", calculate: "CALCULATE BMI", result: "YOUR BMI", underweight: "Underweight", normal: "Normal weight", overweight: "Overweight", obese: "Obesity", input_weight: "WEIGHT (KG)", input_height: "HEIGHT (CM)" },
        tdee: { title: "TOTAL METABOLISM", calculate: "CALCULATE TDEE", activity: "ACTIVITY LEVEL", sedentary: "Sedentary", light: "Lightly Active", moderate: "Moderately Active", active: "Very Active", athlete: "Athlete", maintenance: "MAINTENANCE", cutting: "CUTTING (-500)", bulking: "BULKING (+500)", kcal: "Kcal/day" },
        rm1: { title: "1RM CALCULATOR", calculate: "CALCULATE", weight_lifted: "WEIGHT (KG)", reps_done: "REPS", est_max: "ESTIMATED 1RM", percentages: "WORKING LOADS" },
        vision: { title: "VISION FOCUS", time: "TIME", score: "SCORE", start: "START", replay: "REPLAY", instruction: "Tap targets as fast as possible!", history: "BEST SCORES" },
        discharge: { title: "NEURO-DISCHARGE", start: "INITIATE DISCHARGE", stop: "STOP SESSION", history: "LATEST SESSIONS", modes: { gamma: "GAMMA (Reset)", alpha: "ALPHA (Calm)", theta: "THETA (Sleep)" } },
        env: { title: "ENV MONITORING", scan_btn: "START SCAN", scanning: "SCANNING...", score: "GLOBAL SCORE", noise: "NOISE", light: "LIGHT", air: "AIR", diag: "AI DIAGNOSIS", history: "SCORE HISTORY" },
        posture: { title: "POSTURE ANALYSIS", score: "SCORE", auto_diag: "SELF-CHECK", checks: { head: "Tech Neck", head_sub: "Ear is in front", shoulders: "Rounded Shoulders", shoulders_sub: "Slouching forward", pelvic: "Pelvic Tilt", pelvic_sub: "Arched back" }, btn_analyze: "ANALYZE", history: "POSTURE TRACKING", advice: { perfect: "Perfect!", good: "Good.", average: "Imbalances.", bad: "Correct now." } },
        macros: { title: "MACRO CALCULATOR", target_title: "DAILY TARGET", section_goal: "GOAL", section_split: "SPLIT", info: "Values based on your TDEE.", goals: { cut: "CUT", maintain: "MAINTAIN", bulk: "BULK" }, splits: { balanced: "BALANCED", low: "LOW CARB", high: "HIGH CARB" } },
        fasting: { title: "INTERMITTENT FASTING", fasting_label: "FASTING", eating_label: "EATING WINDOW", target_badge: "TARGET:", btn_start: "START FAST", btn_stop: "BREAK FAST", section_proto: "CHOOSE PROTOCOL", section_history: "RECENT HISTORY", alerts: { stop_title: "Break fast?", stop_msg: "End session?", finish_title: "Fast Complete", finish_msg: "Great job!" } },
        mood: { title: "NEURAL STATE", neuro_title: "BIOCHEMICAL ESTIMATE", history_title: "HISTORY", btn_calibrate: "CALIBRATE SYSTEM", states: { discharged: "DISCHARGED", anxious: "ANXIOUS", balance: "BALANCE", flow: "FLOW", hyped: "HYPED" } },
        body: { title: "BODY BATTERY", status_badge: "OPTIMAL", factors_title: "DAILY FACTORS", tips_title: "AI ANALYSIS", history_title: "HISTORY (7 DAYS)", factors: { sleep: "Sleep", stress: "Stress", sport: "Sport" } },
        cold: { title: "COLD IMMERSION", timer_label: "EXPOSURE ACTIVE", ready: "READY", temp_label: "Water Temp", btn_finish: "FINISH", history_title: "EXPOSURE HISTORY" }
      }
    }
  },
  ar: {
    translation: {
      landing: { title: "حول جسمك بالذكاء الاصطناعي", subtitle: "مدرب • تغذية • تتبع", start_btn: "ابدأ", login_btn: "دخول", legal: "بالمتابعة توافق على الشروط.",
          slides: { title1: "لا تخمن.\nاحسب.", sub1: "الجهد خام. الطريقة علمية.", title2: "جسمك هو\nخوارزمية", sub2: "تتبع حيوي فوري. تحليل عصبي." },
          features: { brain_title: "مدرب عصبي", brain_text: "ذكاء يتعلم من أخطائك.", bio_title: "اختراق بيولوجي", bio_text: "نوم، إجهاد، VFC." },
          pricing: { title: "العروض المتاحة", select_btn: "اختر", discovery: { tier: "اكتشاف", price: "مجاني", f1: "مقاييس وخطوات", f2: "سجل ترطيب", f3: "تتبع وزن", f4: "مؤقت بسيط", f5: "وصول محدود" }, premium: { tier: "نخبة", price: "5.99€", period: "/شهر", f1: "مدرب ذكي غير محدود", f2: "برامج رياضية ذكية", f3: "خطط تغذية ذكية", f4: "تتبع حيوي كامل", f5: "أدوات النخبة" } }
      },
      auth: { welcome: "مرحباً", subtitle: "تسجيل الدخول", email_placeholder: "البريد", password_placeholder: "كلمة المرور", login_action: "دخول", signup_action: "تسجيل", or: "أو", google: "جوجل", switch_to_signup: "حساب جديد", switch_to_login: "دخول", error_title: "خطأ" },
      onboarding: { step1: "الهدف؟", step2: "المستوى؟", step3: "المعدات؟", next: "التالي", finish: "إنهاء", goals: { lose_weight: "وزن", muscle: "عضلات", endurance: "تحمل", strength: "قوة" }, levels: { beginner: "مبتدئ", intermediate: "متوسط", advanced: "متقدم" }, equip: { gym: "جيم", home: "منزل", bodyweight: "وزن جسم" } },
      tabs: { cockpit: "الرئيسية", sport: "رياضة", neural: "عصبي", fuel: "وقود", modules: "وحدات" },
      dashboard: { greeting: "مرحباً", stats_nutri: "تغذية", stats_work: "تدريب", unit_sessions: "جلسات", unit_kcal: "سعرة", section_active: "جاري", section_explore: "استكشاف", active_badge: "نشط", no_plan_title: "لا توجد خطة", no_plan_desc: "أنشئ خطة.", card_focus: "تركيز", card_sess: "جلسات", mod_nutri: "تغذية", mod_nutri_sub: "نشط", mod_gen: "توليد", mod_lib: "مكتبة", mod_lib_sub: "+200", mod_hist: "سجل", mod_hist_sub: "تقدم", mod_coach: "مدرب", mod_coach_sub: "محادثة" },
      profile: { language: "اللغة", title: "ملفي", default_name: "عضو", section_info: "معلومات", label_name: "الاسم", ph_name: "اسمك", label_age: "العمر", ph_age: "عمرك", label_weight: "الوزن", label_height: "الطول", label_goal: "الهدف", ph_goal: "هدف...", label_level: "النشاط", ph_level: "مستوى...", section_config: "إعدادات", label_exp: "خبرة", label_equip: "معدات", label_freq: "جلسات", section_physique: "جسم", section_stats: "إحصاءات", stat_streak: "أيام", stat_points: "نقاط", stat_level: "مستوى", stat_weight: "وزن", section_sub: "اشتراك", badge_active: "نشط", sub_renewal: "تجديد", sub_auto: "تلقائي", member_elite: "نخبة", member_standard: "عادي", sub_free: "مجاني", sub_desc_free: "محدود", sub_desc_premium: "غير محدود", sub_action: "ترقية", sub_manage: "إدارة", btn_save: "حفظ", btn_saving: "جاري...", section_settings: "إعدادات", theme: "سمة", support: "دعم", legal: "قانوني", logout: "خروج", section_danger: "خطر", deactivate: "تعطيل", delete: "حذف", alerts: { welcome: "مرحباً", welcome_msg: "تم الفتح", sub_downgrade: "مجاني", error: "خطأ", error_plan: "فشل", confirm_logout: "خروج؟", success: "نجاح", saved: "حفظ" }, footer: { version: "v1.0", system: "نظام", copyright: "حقوق" } },
      coach: { intro: "نظام نيكسس نشط. جاهز لتحسين الأداء. ما هي المهمة؟", locked_title: "وصول مقيد", locked_desc: "التحليل العصبي للمحترفين فقط.", btn_unlock: "تفعيل النخبة", placeholder: "اطرح سؤالاً...", error_network: "خطأ في الاتصال.", error_server: "الأنظمة لا تستجيب." },
      nutrition: { 
        title: "الوقود", 
        subtitle: "التغذية", 
        consumed: "تم استهلاكه", 
        target: "الهدف", 
        ia_title: "خبير التغذية", 
        ia_desc: "أنشئ خطة وجبات أسبوعية كاملة.", 
        pref_label: "تفضيلات", 
        pref_ph: "مثال: نباتي، ميزانية منخفضة...", 
        btn_generate: "توليد الخطة", 
        btn_regen: "إعادة التوليد", 
        alert_title: "القائمة جاهزة", 
        alert_msg: "تم إنشاء خطتك.", 
        alert_error: "فشل التوليد.", 
        alert_zone: "منطقة خاطئة", 
        alert_zone_msg: "ركز على خطة اليوم." 
      },
      systems: {
        title: "الأنظمة",
        subtitle: "حسن كل جانب من جوانب بيولوجيتك.",
        categories: {
          metabolism: "التمثيل الغذائي",
          performance: "الأداء البدني",
          mental: "الذهن والتعافي",
          logistics: "اللوجستيات"
        },
        subtitles: {
          metabolism: "تغذية، ترطيب وتكوين",
          performance: "قوة، تحمل وأدوات",
          mental: "نوم، إجهاد وتحسين حيوي",
          logistics: "تنظيم ومشتريات"
        },
        modules: {
          nutrition: "خطة التغذية",
          macros: "الماكروز",
          water: "الترطيب",
          bodyfat: "نسبة الدهون",
          bmi: "مؤشر الكتلة (BMI)",
          tdee: "حرق السعرات (TDEE)",
          fasting: "الصيام",
          workout_log: "سجل التمارين",
          rm1: "حاسبة 1RM",
          timer: "مؤقت / تاباتا",
          posture: "تحليل الوضعية",
          reflex: "رد الفعل",
          vision: "التركيز البصري",
          sleep: "النوم",
          stress: "إدارة التوتر",
          meditation: "التأمل",
          breath: "التنفس",
          cold: "التعرض للبرد",
          nootropics: "المنشطات الذهنية",
          journal: "اليوميات",
          shopping: "تسوّق",
          meal_prep: "تجهيز الوجبات",
          env: "البيئة",
          hrv: "تقلب القلب (HRV)",
          discharge: "تفريغ عصبي"
        }
      },

      subscription: { badge: "نيكسس إيليت", status_badge: "الحالة: عضو نخبة", title_free: "تجاوز الحدود", title_pro: "اشتراكك", subtitle: "افتح ذكاءً اصطناعياً كاملاً لتحول جسدي متسارع.", active_title: "اشتراك نشط", active_renewal: "التجديد القادم: 01/01/2026", manage_btn: "إدارة / إلغاء", manage_info: "سيتم تحويلك لإعدادات المتجر.", features: { coach: "مدرب ذكي غير محدود", plans: "خطط مخصصة 100%", bio: "تحليل حيوي", recipes: "وصفات وقوائم", support: "دعم ذو أولوية" }, price_month: "/ شهر", btn_start: "ابدأ التجربة", btn_restore: "استعادة المشتريات", legal_terms: "الشروط", legal_privacy: "الخصوصية", alert_pay_title: "دفع (محاكاة)", alert_pay_msg: "في الإنتاج عبر RevenueCat.", alert_restore: "استعادة", alert_restore_msg: "جاري البحث..." },
      workout_tracker: { 
        title: "متتبع التمارين", 
        available_moves: "حركات متاحة", 
        ia_title: "مولد البرامج", 
        ia_desc: "الذكاء الاصطناعي سينشئ خطة أسبوعية.", 
        label_focus: "تركيز خاص (اختياري)", 
        ph_focus: "مثال: صدر، أرداف، كارديو...", 
        btn_generate: "توليد البرنامج", 
        plan_active: "الخطة النشطة", 
        btn_finish: "إنهاء الجلسة", 
        btn_regen: "توليد برنامج جديد", 
        alert_ready_title: "البرنامج جاهز", 
        alert_ready_msg: "تم إنشاء أسبوع التدريب الخاص بك!", 
        alert_empty_title: "جلسة فارغة", 
        alert_empty_msg: "اختر تمرينًا واحدًا على الأقل.", 
        alert_saved_title: "تم حفظ الجلسة!", 
        alert_saved_msg: "تم تحديث السجل.", 
        btn_history: "عرض السجل", 
        week_sessions: "جلسات / أسبوع", 
        day_session: "جلسة", 
        exos_count: "تمارين", 
        btn_demo: "فيديو توضيحي", 
        protocol: "بروتوكول التنفيذ:" 
      },
      shopping: { title: "قائمة التسوق", add_ph: "أضف عنصراً...", empty: "القائمة فارغة.", empty_sub: "أضف عناصر أو استورد من الخطة.", import_btn: "استيراد الخطة", clear_btn: "مسح", add_btn: "أضف", done_title: "مكتمل", import_success: "تمت الإضافة.", import_empty: "لا توجد مكونات." },
      timer: { title: "المؤقت التكتيكي", mode_rest: "راحة", mode_tabata: "تاباتا", start: "ابدأ", stop: "توقف", reset: "إعادة", rounds: "جولات", work: "عمل", rest: "راحة" },
      library: { title: "مكتبة نيكسس", available: "حركة متاحة", search_ph: "بحث...", filters: { all: "الكل", chest: "صدر", back: "ظهر", legs: "أرجل", shoulders: "أكتاف", arms: "أذرع", abs: "بطن", cardio: "كارديو" }, protocol: "البروتوكول:", btn_video: "فيديو", btn_add: "إضافة", empty_search: "لا نتائج لـ" },
      history: { title: "سجل التمارين", stats_total: "مجموع الجلسات", stats_valid: "تمارين مكتملة", timeline: "الجدول الزمني", session_active: "جلسة نشطة", session_rest: "راحة", completed_ex: "تمارين", empty: "لا سجل." },
      
      modules: {
        water: { title: "الترطيب", goal: "الهدف", current: "الحالي", add: "إضافة 250مل", history: "سجل اليوم", unit: "لتر" },
        shopping: { title: "قائمة التسوق", add_ph: "أضف عنصراً...", empty: "القائمة فارغة.", empty_sub: "أضف عناصر أو استورد من الخطة.", import_btn: "استيراد الخطة", clear_btn: "مسح", add_btn: "أضف", done_title: "مكتمل", import_success: "تمت الإضافة.", import_empty: "لا توجد مكونات.", import_confirm_title: "استيراد؟", import_confirm_msg: "سيتم إضافة المكونات لبقية الأسبوع.", clear_confirm_title: "تأكيد", clear_confirm_msg: "حذف الكل؟" },
        mealprep: { title: "تحضير الوجبات", tab_chef: "الطاهي الذكي", tab_book: "كتاب الوصفات", input_label: "رغباتك / قيودك", input_ph: "مثال: وجبات غنية بالبروتين...", btn_generate: "توليد أفكار", suggestions: "اقتراحات الشيف", ingredients: "المكونات", prep: "التحضير", storage: "التخزين", empty: "لا توجد وصفات." },
        body_fat: { title: "نسبة الدهون", result_label: "تقدير الدهون", input_info: "أدخل القياسات", history_title: "السجل الحديث", gender_m: "رجل", gender_f: "امرأة", neck: "الرقبة", waist: "الخصر", hip: "الورك", btn_calculate: "حساب", interp: { essential: "خطر", athlete: "رياضي", fitness: "لياقة", average: "متوسط", obese: "سمنة" } },
        supps: { title: "المكملات الغذائية", manual_title: "إضافة يدوية", input_name: "الاسم (مثل: فيتامين سي)", input_dose: "الجرعة", input_freq: "التكرار", btn_add: "إضافة", quick_title: "مكتبة سريعة", my_stack: "مكملاتي", empty: "قائمتك فارغة." },
        stretching: { 
          title: "روتين الإطالة", protocols: "بروتوكولات النظام", history: "السجل", next: "التالي:", demo: "فيديو", end: "انتهى",
          routines: { morning_title: "تنشيط عصبي", morning_desc: "إيقاظ العضلات والمفاصل.", post_title: "تبريد النظام", post_desc: "الاستشفاء بعد الجهد.", spine_title: "استقامة العمود الفقري", spine_desc: "تخفيف ضغط الظهر." },
          exercises: { cervical: "دوران الرقبة", shoulders: "دوران الأكتاف", catcow: "القطة والبقرة", twist: "التواء الجذع", fold: "الانحناء للأمام", quad: "عضلات الفخذ", hamstring: "أوتار الركبة", calf: "عضلات الساق", child: "وضعية الطفل", cobra: "وضعية الكوبرا", hang: "التعلق الميت" }
        },
        nootropics: { title: "دليل المنشطات الذهنية", add_stack: "إضافة للقائمة" },
        reflex: { title: "اختبار رد الفعل", idle: "اضغط عند اللون الأخضر", idle_sub: "المس للبدء", waiting: "انتظر...", ready: "اضغط الآن!", too_early: "مبكر جداً!", result_label: "وقت الاستجابة", retry: "إعادة المحاولة", history: "آخر المحاولات" },
        breath: { title: "التنفس", start: "ابدأ", stop: "توقف", inhale: "شهيق", hold: "حبس", exhale: "زفير", cycle: "دورة", tech: { coherence_name: "التناغم", coherence_desc: "توازن (5ث-5ث)", box_name: "المربع", box_desc: "تركيز (4ث-4ث-4ث-4ث)", relax_name: "4-7-8", relax_desc: "نوم (4ث-7ث-8ث)" }, sounds: { silence: "صامت", rain: "مطر", waves: "أمواج", forest: "غابة" } },
        hrv: { title: "تحسين VFC", scan_btn: "قياس VFC", scanning: "جاري القياس...", status_label: "الحالة", power_label: "القوة", history_title: "سجل VFC", advice_title: "تشخيص الذكاء الاصطناعي", coherence: "تناغم", stress: "إجهاد", power_high: "عالية", power_low: "منخفضة", place_finger: "ضع إصبعك على الكاميرا.", advices: { high: "هيمنة الجهاز الباراسمبثاوي.", mid: "توازن متوسط.", low: "هيمنة الجهاز السمبثاوي." } },
        heart: { title: "معدل القلب", scan_btn: "مزامنة الساعة", new_scan: "قياس جديد", measuring: "جاري القياس...", zones_title: "مناطق التدريب", history_title: "سجل النبض", unit: "نبضة/د", desc: "يستخدم حساسات الجهاز.", alert_title: "نجاح", alert_msg: "تم حفظ النبض.", zones: { warmup: "إحماء", fatburn: "حرق الدهون", aerobic: "هوائي", anaerobic: "لاهوائي", max: "أقصى جهد" } },
        stress: { title: "مستوى الإجهاد", ready: "جاهز", ready_desc: "اضغط لبدء المسح.", scanning: "جاري المسح...", scan_btn: "بدء المسح", score_label: "النتيجة العامة", history: "الأيام الأخيرة", status: { relaxed: "مسترخي", moderate: "متوسط", high: "مرتفع", critical: "حرج" }, metrics: { noise: "ضوضاء", light: "إضاءة", air: "هواء" } },
        sleep: { title: "تحليل النوم", question: "كم ساعة نمت؟", quality: "جودة النوم", save: "حفظ", history: "سجل (7 أيام)", status: { critical: "حرج", poor: "غير كاف", good: "مثالي", excessive: "مفرط" }, unit: "ساعات" },
        meditation: { title: "التأمل", duration: "المدة", ambiance: "الأجواء", start: "بدء الجلسة", pause: "إيقاف مؤقت", history_title: "آخر الجلسات", sounds: { silence: "صامت", rain: "مطر", waves: "أمواج", forest: "غابة" } },
        journal: { title: "سجل اليوميات", write_btn: "اكتب الآن", new_entry: "تدوين جديد", save: "حفظ", empty: "السجل فارغ.", placeholder: "ماذا يدور في ذهنك؟", moods: { focus: "تركيز", happy: "إيجابي", neutral: "محايد", tired: "متعب", anxious: "قلق" }, alert_empty: "فارغ", alert_empty_msg: "اكتب شيئاً.", delete_title: "حذف؟", delete_msg: "لا يمكن التراجع.", btn_cancel: "إلغاء", btn_delete: "حذف" },
        bmi: { title: "تحليل كتلة الجسم", calculate: "حساب المؤشر", result: "مؤشرك", underweight: "نقص الوزن", normal: "وزن طبيعي", overweight: "زيادة الوزن", obese: "سمنة", input_weight: "الوزن (كجم)", input_height: "الطول (سم)" },
        tdee: { title: "معدل الأيض الكلي", calculate: "حساب الاحتياج", activity: "مستوى النشاط", sedentary: "خامل (لا تمارين)", light: "نشاط خفيف", moderate: "نشاط متوسط", active: "نشيط جداً", athlete: "رياضي", maintenance: "المحافظة", cutting: "تنشيف", bulking: "تضخيم", kcal: "سعرة/يوم" },
        rm1: { title: "حاسبة القوة القصوى", calculate: "حساب الماكس", weight_lifted: "الوزن المرفوع", reps_done: "التكرارات", est_max: "تقدير 1RM", percentages: "أحمال التدريب" },
        vision: { title: "التركيز البصري", time: "الوقت", score: "النتيجة", start: "ابدأ", replay: "إعادة", instruction: "اضغط على الأهداف!", history: "أفضل النتائج" },
        discharge: { title: "التفريغ العصبي", start: "بدء التفريغ", stop: "إيقاف", history: "آخر الجلسات", modes: { gamma: "جامـا (إعادة ضبط)", alpha: "ألفـا (هدوء)", theta: "ثيتـا (نوم)" } },
        env: { title: "مراقبة البيئة", scan_btn: "بدء المسح", scanning: "جاري المسح...", score: "النتيجة العامة", noise: "الضوضاء", light: "الإضاءة", air: "الهواء", diag: "التشخيص", history: "سجل النتائج" },
        posture: { title: "تحليل الوضعية", score: "النتيجة", auto_diag: "تشخيص ذاتي", checks: { head: "رقبة النص", head_sub: "رأس للأمام", shoulders: "أكتاف منحنية", shoulders_sub: "أكتاف ساقطة", pelvic: "ميل الحوض", pelvic_sub: "تقوس الظهر" }, btn_analyze: "تحليل", history: "تتبع الوضعية", advice: { perfect: "مثالي", good: "جيد", average: "متوسط", bad: "سيء" } },
        macros: { title: "حاسبة الماكروز", target_title: "الهدف اليومي", section_goal: "الهدف", section_split: "التوزيع", info: "القيم مبنية على معدل الأيض.", goals: { cut: "تنشيف", maintain: "محافظة", bulk: "تضخيم" }, splits: { balanced: "متوازن", low: "كارب منخفض", high: "كارب عالي" } },
        fasting: { title: "الصيام المتقطع", fasting_label: "صائم", eating_label: "نافذة الأكل", target_badge: "الهدف:", btn_start: "بدء الصيام", btn_stop: "كسر الصيام", section_proto: "اختر بروتوكول", section_history: "السجل الحديث", alerts: { stop_title: "كسر الصيام؟", stop_msg: "إنهاء الجلسة؟", finish_title: "تم الصيام", finish_msg: "عمل رائع!" } },
        mood: { title: "الحالة العصبية", neuro_title: "تقدير كيميائي", history_title: "السجل", btn_calibrate: "معايرة النظام", states: { discharged: "مفرغ", anxious: "قلق", balance: "توازن", flow: "تدفق", hyped: "مفرط النشاط" } },
        body: { title: "طاقة الجسم", status_badge: "مثالي", factors_title: "عوامل اليوم", tips_title: "تحليل الذكاء الاصطناعي", history_title: "سجل (7 أيام)", factors: { sleep: "نوم", stress: "إجهاد", sport: "رياضة" } },
        cold: { title: "الغمر البارد", timer_label: "التعرض نشط", ready: "جاهز", temp_label: "درجة الماء", btn_finish: "إنهاء", history_title: "سجل التعرض" }
      }
    }
  }
};

const deviceLanguage = Localization.getLocales()[0]?.languageCode ?? 'fr';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getLocales()[0]?.languageCode ?? 'fr', // Valeur temporaire
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;