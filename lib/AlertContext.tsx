import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from './theme';
import { Ionicons } from '@expo/vector-icons';

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

  const getIcon = (type: AlertType = 'info') => {
    switch (type) {
      case 'success': return { name: 'checkmark-circle', color: colors.success };
      case 'error': return { name: 'alert-circle', color: colors.danger };
      case 'warning': return { name: 'warning', color: colors.warning };
      default: return { name: 'information-circle', color: colors.primary };
    }
  };

  const iconData = config ? getIcon(config.type) : { name: 'help', color: '#fff' };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <Modal transparent visible={visible} animationType="fade" statusBarTranslucent onRequestClose={hideAlert}>
        {visible && config && (
          <View style={styles.overlay}>
            <View style={styles.backdrop} />
            <View style={[styles.alertCard, { backgroundColor: isDark ? '#1e1e24' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0' }]}>
                
                <View style={[styles.iconContainer, { backgroundColor: iconData.color + '20' }]}>
                     <Ionicons name={iconData.name as any} size={36} color={iconData.color} />
                </View>

                <Text style={[styles.title, { color: isDark ? '#fff' : '#0f172a' }]}>{config.title}</Text>
                <Text style={[styles.message, { color: isDark ? '#94a3b8' : '#64748b' }]}>{config.message}</Text>

                <View style={styles.buttonRow}>
                    {config.buttons?.map((btn, index) => {
                        const isCancel = btn.style === 'cancel';
                        const isDestructive = btn.style === 'destructive';
                        return (
                            <TouchableOpacity 
                                key={index}
                                onPress={() => { hideAlert(); if (btn.onPress) btn.onPress(); }}
                                style={[styles.button, { backgroundColor: isCancel ? 'transparent' : (isDestructive ? colors.danger : colors.primary), borderWidth: isCancel ? 1 : 0, borderColor: isDark ? '#333' : '#e2e8f0' }]}
                            >
                                <Text style={[styles.buttonText, { color: isCancel ? (isDark ? '#fff' : '#334155') : '#fff' }]}>{btn.text}</Text>
                            </TouchableOpacity>
                        );
                    })}
                    {(!config.buttons || config.buttons.length === 0) && (
                        <TouchableOpacity onPress={hideAlert} style={[styles.button, { backgroundColor: colors.primary }]}>
                            <Text style={[styles.buttonText, { color: '#fff' }]}>OK</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
          </View>
        )}
      </Modal>
    </AlertContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  alertCard: { width: '100%', maxWidth: 300, borderRadius: 24, padding: 24, alignItems: 'center', borderWidth: 1, elevation: 20 },
  iconContainer: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  message: { fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  buttonRow: { flexDirection: 'row', gap: 10, width: '100%', justifyContent: 'center' },
  button: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontWeight: '700', fontSize: 14 }
});