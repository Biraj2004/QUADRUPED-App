import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { colors } from '../theme/colors';

function useThrottle<T>(fn: (v: T) => void, ms: number) {
  const last = useRef(0);
  return useCallback(
    (v: T) => {
      const now = Date.now();
      if (now - last.current >= ms) {
        last.current = now;
        fn(v);
      }
    },
    [fn, ms],
  );
}

interface ServoSliderProps {
  label: string;
  value: number;
  disabled?: boolean;
  accentColor?: string;
  onChange: (v: number) => void;
}

export default function ServoSlider({
  label,
  value,
  disabled = false,
  accentColor = colors.accentCalibration,
  onChange,
}: ServoSliderProps) {
  const throttledChange = useThrottle(onChange, 50);

  return (
    <View style={styles.row}>
      <View style={styles.meta}>
        <Text style={styles.name} numberOfLines={1}>{label}</Text>
        <Text style={[styles.val, { color: accentColor }]}>
          {value > 0 ? `+${value}°` : `${value}°`}
        </Text>
      </View>
      <Slider
        style={{ flex: 1, height: 32 }}
        minimumValue={-45}
        maximumValue={45}
        step={1}
        value={value}
        onValueChange={(v) => throttledChange(Math.round(v))}
        disabled={disabled}
        minimumTrackTintColor={accentColor}
        maximumTrackTintColor={colors.bgElevated}
        thumbTintColor={accentColor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  meta: {
    width: 158,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
    marginRight: 6,
  },
  val: {
    fontSize: 13,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    minWidth: 36,
    textAlign: 'right',
  },
});
