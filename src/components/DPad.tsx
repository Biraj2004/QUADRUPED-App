import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';

interface DPadProps {
  onPress: (dir: string) => void;
  onRelease: () => void;
  disabled?: boolean;
}

const BTN_SIZE = 72;

function DirButton({
  dir,
  label,
  onDown,
  onUp,
  disabled,
}: {
  dir: string;
  label: string;
  onDown: (dir: string) => void;
  onUp: () => void;
  disabled: boolean;
}) {
  return (
    <Pressable
      onPressIn={() => {
        if (disabled) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onDown(dir);
      }}
      onPressOut={() => {
        if (disabled) return;
        onUp();
      }}
      style={({ pressed }) => [
        styles.btn,
        pressed && !disabled && styles.btnActive,
        disabled && styles.btnDisabled,
      ]}
    >
      <Text style={styles.arrow}>{label}</Text>
    </Pressable>
  );
}

export default function DPad({ onPress, onRelease, disabled = false }: DPadProps) {
  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <DirButton dir="forward" label="▲" onDown={onPress} onUp={onRelease} disabled={disabled} />
      </View>

      <View style={styles.row}>
        <DirButton dir="left" label="◀" onDown={onPress} onUp={onRelease} disabled={disabled} />

        {/* Centre — stop command */}
        <Pressable
          onPressIn={() => {
            if (disabled) return;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onPress('stop');
          }}
          style={({ pressed }) => [
            styles.centre,
            pressed && styles.centreActive,
            disabled && styles.btnDisabled,
          ]}
        >
          <Text style={styles.stopIcon}>■</Text>
          <Text style={styles.stopLabel}>stop</Text>
        </Pressable>

        <DirButton dir="right" label="▶" onDown={onPress} onUp={onRelease} disabled={disabled} />
      </View>

      <View style={styles.row}>
        <DirButton dir="backward" label="▼" onDown={onPress} onUp={onRelease} disabled={disabled} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: 6 },
  row:  { flexDirection: 'row', gap: 6, justifyContent: 'center' },

  btn: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: 14,
    backgroundColor: colors.accentMovementTint,
    borderWidth: 0.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActive: {
    transform: [{ scale: 0.93 }],
    backgroundColor: 'rgba(74,144,217,0.24)',
    borderColor: colors.accentMovement,
  },
  btnDisabled: { opacity: 0.4 },
  arrow: { fontSize: 22, color: colors.accentMovement },

  centre: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: 14,
    backgroundColor: colors.bgElevated,
    borderWidth: 0.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  centreActive: {
    backgroundColor: colors.accentDangerTint,
    borderColor: colors.accentDanger,
  },
  stopIcon:  { fontSize: 14, color: colors.textTertiary },
  stopLabel: { fontSize: 9, color: colors.textTertiary, letterSpacing: 0.5, textTransform: 'uppercase' },
});
