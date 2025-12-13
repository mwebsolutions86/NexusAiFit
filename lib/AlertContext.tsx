import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  Platform 
} from 'react-native';
import { useTheme } from './theme';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertOptions {
  title: string;
  message: string;
  type?: AlertType;
  buttons?: { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' | 'default' }[];
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error("useAlert error");
  return context;
};

const hexToRgba = (hex: string | undefined, opacity: number) => {
  if (!hex) return `rgba(128, 128, 128, ${opacity})`;
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return hex;
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const { colors, isDark } = useTheme();
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertOptions | null>(null);

  const showAlert = (options: AlertOptions) => {
    setConfig(options);
    setVisible(true);
  };

  const hideAlert = () => {
    setVisible(false);
    setTimeout(() => setConfig(null), 200);
  };

  const getIconData = (type: AlertType = 'info') => {
    switch (type) {
      case 'success': return { name: 'checkmark-circle', color: colors.success || '#10b981' };
      case 'error': return { name: 'alert-circle', color: colors.danger || '#ef4444' };
      case 'warning': return { name: 'warning', color: colors.warning || '#f59e0b' };
      default: return { name: 'information-circle', color: colors.primary || '#3b82f6' };
    }
  };

  const iconData = config ? getIconData(config.type) : { name: 'help', color: '#fff' };
  const iconBgColor = hexToRgba(iconData.color, 0.15);

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      {/* ✅ MODALE SYSTÈME :
         On utilise "transparent" et "statusBarTranslucent" pour couvrir tout l'écran 
         y compris la barre d'état, ce qui est crucial pour le centrage sur Android.
      */}
      <Modal 
        visible={visible} 
        transparent={true} 
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={hideAlert}
      >
        {/* CONTAINER PLEIN ÉCRAN FORCÉ */}
        <View style={styles.fullScreenContainer}>
            
            {/* BACKDROP FLOU/SOMBRE */}
            <TouchableOpacity 
                style={styles.backdrop} 
                activeOpacity={1} 
                onPress={hideAlert} 
            />

            {/* CARTE D'ALERTE CENTRÉE */}
            {config && (
                <View style={[
                    styles.alertCard, 
                    { 
                        backgroundColor: isDark ? '#18181b' : '#ffffff',
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' 
                    }
                ]}>
                    <View style={[styles.iconCircle, { backgroundColor: iconBgColor }]}>
                        <Ionicons name={iconData.name as any} size={32} color={iconData.color} />
                    </View>

                    <Text style={[styles.title, { color: isDark ? '#fff' : '#111827' }]}>{config.title}</Text>
                    <Text style={[styles.message, { color: isDark ? '#a1a1aa' : '#4b5563' }]}>{config.message}</Text>

                    <View style={styles.buttonRow}>
                        {config.buttons?.map((btn, index) => {
                            const isCancel = btn.style === 'cancel';
                            const isDestructive = btn.style === 'destructive';
                            let btnBg = isDestructive ? (colors.danger || '#ef4444') : (colors.primary || '#3b82f6');
                            let btnText = '#ffffff';

                            if (isCancel) {
                                btnBg = 'transparent';
                                btnText = isDark ? '#a1a1aa' : '#4b5563';
                            }

                            return (
                                <TouchableOpacity 
                                    key={index}
                                    onPress={() => { hideAlert(); if (btn.onPress) btn.onPress(); }}
                                    style={[styles.button, { backgroundColor: btnBg, borderWidth: isCancel ? 1 : 0, borderColor: isDark ? '#3f3f46' : '#e5e7eb' }]}
                                >
                                    <Text style={[styles.buttonText, { color: btnText }]}>{btn.text}</Text>
                                </TouchableOpacity>
                            );
                        })}
                        {(!config.buttons || config.buttons.length === 0) && (
                            <TouchableOpacity onPress={hideAlert} style={[styles.button, { backgroundColor: colors.primary || '#3b82f6' }]}>
                                <Text style={[styles.buttonText, { color: '#fff' }]}>OK</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}
        </View>
      </Modal>
    </AlertContext.Provider>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    width: width,   // Largeur forcée de l'écran
    height: height, // Hauteur forcée de l'écran
    justifyContent: 'center', // Centre Vertical
    alignItems: 'center',     // Centre Horizontal
    position: 'absolute',     // S'assure de flotter au dessus de tout
    top: 0,
    left: 0,
    zIndex: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject, // Remplit tout le conteneur parent
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  alertCard: {
    width: width * 0.85, // 85% de la largeur de l'écran
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    // Ombres pour détacher du fond (Effet Modal)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20, // Très haut z-index visuel sur Android
  },
  iconCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  message: { fontSize: 15, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  buttonRow: { flexDirection: 'row', gap: 12, width: '100%', justifyContent: 'center' },
  button: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontWeight: '700', fontSize: 15 }
});