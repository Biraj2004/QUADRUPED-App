import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';
import { robotWS } from '../services/websocket';
import { useRobotStore } from '../store/useRobotStore';

export default function HeadScreen() {
  const insets = useSafeAreaInsets();
  const { status } = useRobotStore();
  const [angle, setAngle] = useState(90);
  const isConnected = status === 'connected';

  const sendAngle = (v: number) => {
    const rounded = Math.round(v);
    setAngle(rounded);
    robotWS.send({ cmd: 'head', angle: rounded });
  };

  const snapTo = (v: number) => sendAngle(v);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Text style={type.heading}>Head Control</Text>
      <Text style={type.subheading}>CH8 — MG90S head rotation servo</Text>

      {/* Angle display */}
      <View style={styles.angleDisplay}>
        <Text style={type.display}>{angle}°</Text>
        <Text style={styles.angleLabel}>
          {angle < 80 ? 'Left' : angle > 100 ? 'Right' : 'Centre'}
        </Text>
      </View>

      {/* Slider */}
      <Slider
        style={{ width: '100%', height: 48 }}
        minimumValue={0}
        maximumValue={180}
        step={1}
        value={angle}
        onValueChange={sendAngle}
        disabled={!isConnected}
        minimumTrackTintColor={colors.accentHead}
        maximumTrackTintColor={colors.bgElevated}
        thumbTintColor={colors.accentHead}
      />
      <View style={styles.sliderLabels}>
        <Text style={type.fieldLabel}>0° (left)</Text>
        <Text style={type.fieldLabel}>180° (right)</Text>
      </View>

      {/* Snap buttons */}
      <View style={styles.snapRow}>
        {[0, 45, 90, 135, 180].map((v) => (
          <TouchableOpacity
            key={v}
            style={[styles.snapBtn, angle === v && styles.snapBtnActive, !isConnected && styles.btnDisabled]}
            onPress={() => snapTo(v)}
            disabled={!isConnected}
            activeOpacity={0.7}
          >
            <Text style={[styles.snapBtnText, type.button, angle === v && styles.snapBtnTextActive]}>
              {v}°
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    paddingHorizontal: 24,
    gap: 20,
  },
  angleDisplay: {
    backgroundColor: colors.bgSurface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(77,189,160,0.22)',
    marginTop: 8,
  },
  angleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 1.5,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -12,
  },
  snapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  snapBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  snapBtnActive: {
    backgroundColor: colors.accentHeadTint,
    borderColor: colors.accentHead,
  },
  snapBtnText: {
    color: colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  snapBtnTextActive: { color: colors.accentHead },
  btnDisabled: { opacity: 0.4 },
});
