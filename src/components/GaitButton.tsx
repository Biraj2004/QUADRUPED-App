import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';

interface Props {
  label: string;
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
}

export default function GaitButton({ label, active, disabled = false, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.btn, active && styles.active, disabled && styles.disabled]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  active: {
    backgroundColor: colors.accentMovementTint,
    borderColor: colors.accentMovement,
  },
  disabled: { opacity: 0.35 },
  label: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  activeLabel: { color: colors.accentMovement, fontWeight: '700' },
});
