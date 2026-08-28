import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, AlertCircle, Info } from 'lucide-react-native';
import { useTheme, spacing, radius, type as typeScale, type Palette } from '../theme';

type ToastTone = 'success' | 'error' | 'info';

interface ToastValue {
  show: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<ToastTone>('success');

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-16)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (text: string, nextTone: ToastTone = 'success') => {
      if (timer.current) clearTimeout(timer.current);
      setMessage(text);
      setTone(nextTone);

      opacity.setValue(0);
      translateY.setValue(-16);

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          damping: 16,
          stiffness: 180,
          useNativeDriver: true,
        }),
      ]).start();

      timer.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -16,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => setMessage(null));
      }, 2600);
    },
    [opacity, translateY],
  );

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  const toneStyle =
    tone === 'error' ? s.toastError : tone === 'info' ? s.toastInfo : s.toastSuccess;

  const Icon = tone === 'error' ? AlertCircle : tone === 'info' ? Info : Check;

  const iconColor =
    tone === 'error'
      ? colors.dangerSoft
      : tone === 'info'
      ? colors.accentOn
      : colors.primaryOn;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {message && (
        <Animated.View
          pointerEvents="none"
          style={[
            s.wrap,
            { top: insets.top + spacing.sm, opacity, transform: [{ translateY }] },
          ]}>
          <View style={[s.toast, toneStyle]}>
            <View style={s.iconWrap}>
              <Icon color={iconColor} size={15} strokeWidth={2.6} />
            </View>
            <Text style={s.text} numberOfLines={2}>
              {message}
            </Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside a ToastProvider');
  return ctx;
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    wrap: {
      position: 'absolute',
      left: spacing.lg,
      right: spacing.lg,
      zIndex: 999,
    },
    toast: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      borderRadius: radius.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md + 2,
      elevation: 8,
      shadowColor: '#000',
      shadowOpacity: 0.22,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
    },
    toastSuccess: { backgroundColor: c.primary },
    toastError: { backgroundColor: c.danger },
    toastInfo: { backgroundColor: c.accent },

    iconWrap: {
      width: 24,
      height: 24,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.22)',
    },
    text: {
      flex: 1,
      ...typeScale.caption,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });
}