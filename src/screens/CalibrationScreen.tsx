import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';
import { robotWS } from '../services/websocket';
import { useRobotStore } from '../store/useRobotStore';
import ServoSlider from '../components/ServoSlider';

const CHANNEL_NAMES = [
  'CH0 — Front Left Hip',
  'CH1 — Front Left Knee',
  'CH2 — Front Right Hip',
  'CH3 — Front Right Knee',
  'CH4 — Rear Left Hip',
  'CH5 — Rear Left Knee',
  'CH6 — Rear Right Hip',
  'CH7 — Rear Right Knee',
  'CH8 — Head Rotation',
];

export default function CalibrationScreen() {
  const insets = useSafeAreaInsets();
  const { servoOffsets, setServoOffset, status } = useRobotStore();
  const isConnected = status === 'connected';

  const handleChange = (channel: number, value: number) => {
    setServoOffset(channel, value);
    robotWS.send({ cmd: 'calibrate', channel, offset: value });
  };

  const resetAll = () => {
    for (let i = 0; i < 9; i++) {
      setServoOffset(i, 0);
      robotWS.send({ cmd: 'calibrate', channel: i, offset: 0 });
    }
  };

  const saveAll = () => {
    robotWS.send({ cmd: 'save_calibration', offsets: servoOffsets });
  };

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={type.heading}>Servo Calibration</Text>
          <Text style={type.subheading}>Offset range: −45° to +45°</Text>
        </View>
        <TouchableOpacity
          style={[styles.saveBtn, !isConnected && styles.btnDisabled]}
          onPress={saveAll}
          disabled={!isConnected}
          activeOpacity={0.7}
        >
          <Text style={[styles.saveBtnText, type.button]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {CHANNEL_NAMES.map((name, i) => (
          <ServoSlider
            key={i}
            label={name}
            value={servoOffsets[i]}
            disabled={!isConnected}
            onChange={(v) => handleChange(i, v)}
            accentColor={i === 8 ? colors.accentHead : colors.accentCalibration}
          />
        ))}

        <TouchableOpacity
          style={[styles.resetBtn, !isConnected && styles.btnDisabled]}
          onPress={resetAll}
          disabled={!isConnected}
          activeOpacity={0.7}
        >
          <Text style={[styles.resetBtnText, type.button]}>Reset all to 0°</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },
  scroll: { gap: 4, paddingBottom: 32 },
  saveBtn: {
    backgroundColor: colors.accentCalibration,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  saveBtnText: {
    color: '#0F0E0A',
    fontWeight: '700',
  },
  resetBtn: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(224,92,92,0.5)',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  resetBtnText: {
    color: colors.accentDanger,
    fontWeight: '600',
  },
  btnDisabled: { opacity: 0.4 },
});
