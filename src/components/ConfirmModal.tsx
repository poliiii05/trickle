import React, { useMemo } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme, spacing, radius, type as typeScale, type Palette } from '../theme';

export type ConfirmTone = 'primary' | 'blocked' | 'danger';

export default function ConfirmModal({
  visible,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'primary',
  icon,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  icon?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const accent =
    tone === 'danger' ? colors.danger : tone === 'blocked' ? colors.blocked : colors.primary;
  const accentSoft =
    tone === 'danger'
      ? colors.dangerSoft
      : tone === 'blocked'
      ? colors.blockedSoft
      : colors.primarySoft;
  const accentOn =
    tone === 'blocked' ? colors.blockedOn : colors.primaryOn;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}>
      <Pressable style={s.backdrop} onPress={onCancel}>
        <Pressable style={s.card} onPress={e => e.stopPropagation()}>
          {icon && (
            <View style={[s.iconWrap, { backgroundColor: accentSoft }]}>{icon}</View>
          )}

          <Text style={s.title}>{title}</Text>
          <Text style={s.body}>{body}</Text>

          <View style={s.actions}>
            <Pressable onPress={onCancel} style={s.cancelButton}>
              <Text style={s.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={[s.confirmButton, { backgroundColor: accent }]}>
              <Text style={[s.confirmText, { color: accentOn }]}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'center',
      padding: spacing.xl,
    },
    card: {
      backgroundColor: c.bgElevated,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.xl,
      gap: spacing.md,
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    title: { ...typeScale.heading, color: c.text },
    body: { ...typeScale.body, color: c.textMuted, lineHeight: 22 },

    actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
    cancelButton: {
      flex: 1,
      paddingVertical: spacing.md + 2,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.borderStrong,
      alignItems: 'center',
    },
    cancelText: { ...typeScale.body, color: c.text },
    confirmButton: {
      flex: 1,
      paddingVertical: spacing.md + 2,
      borderRadius: radius.md,
      alignItems: 'center',
    },
    confirmText: { ...typeScale.bodyStrong },
  });
}