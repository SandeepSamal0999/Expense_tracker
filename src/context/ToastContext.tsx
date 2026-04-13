import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../constants/colors';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = 'default' | 'warning' | 'error';

export interface ToastOptions {
  text: string;
  subtext?: string;
  onUndo?: () => void;
  type?: ToastType;
}

interface ToastContextType {
  show: (opts: ToastOptions) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

// ─── Internal toast state ─────────────────────────────────────────────────────

interface ActiveToast extends ToastOptions {
  id: number;
}

// ─── Single toast UI ──────────────────────────────────────────────────────────

function ToastBanner({
  toast,
  onDismiss,
}: {
  toast: ActiveToast;
  onDismiss: () => void;
}) {
  const translateY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide up + fade in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 80,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss after 4 s
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 80,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => onDismiss());
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const accentColor =
    toast.type === 'error'
      ? COLORS.danger
      : toast.type === 'warning'
      ? COLORS.warning
      : COLORS.accent;

  const handleUndo = () => {
    toast.onUndo?.();
    onDismiss();
  };

  return (
    <Animated.View
      style={[
        styles.toast,
        { borderLeftColor: accentColor, transform: [{ translateY }], opacity },
      ]}>
      <View style={styles.toastBody}>
        <Text style={styles.toastText} numberOfLines={1}>
          {toast.text}
        </Text>
        {toast.subtext ? (
          <Text style={styles.toastSub} numberOfLines={1}>
            {toast.subtext}
          </Text>
        ) : null}
      </View>
      {toast.onUndo ? (
        <TouchableOpacity style={styles.undoBtn} onPress={handleUndo}>
          <Text style={[styles.undoText, { color: accentColor }]}>Undo</Text>
        </TouchableOpacity>
      ) : null}
    </Animated.View>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);
  const counter = useRef(0);

  const show = useCallback((opts: ToastOptions) => {
    const id = ++counter.current;
    setToasts(prev => [...prev.slice(-1), { id, ...opts }]); // max 2 at a time
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {/* Toast stack rendered above everything else */}
      <View style={styles.container} pointerEvents="box-none">
        {toasts.map(t => (
          <ToastBanner key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90, // above the tab bar
    left: 16,
    right: 16,
    gap: 8,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderLeftWidth: 3,
    borderRadius: 12,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  toastBody: {
    flex: 1,
  },
  toastText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  toastSub: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 2,
  },
  undoBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  undoText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
