import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';
import { useRobotStore } from '../store/useRobotStore';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { gaitSpeed, stepHeight, setGaitSpeed, setStepHeight, ip, port } = useRobotStore();

  useEffect(() => {
    // Load persisted settings on mount
    AsyncStorage.multiGet(['gaitSpeed', 'stepHeight']).then((pairs) => {
      pairs.forEach(([key, val]) => {
        if (!val) return;
        if (key === 'gaitSpeed') setGaitSpeed(Number(val));
        if (key === 'stepHeight') setStepHeight(Number(val));
      });
    });
  }, [setGaitSpeed, setStepHeight]);

  const save = async () => {
    await AsyncStorage.multiSet([
      ['gaitSpeed', String(gaitSpeed)],
      ['stepHeight', String(stepHeight)],
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Text style={type.heading}>Settings</Text>

      {/* Gait Speed */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={type.subheading}>Gait speed</Text>
          <Text style={[type.value, { color: colors.accentSystem }]}>{gaitSpeed} ms</Text>
        </View>
        <Text style={[styles.hint, type.hint]}>Milliseconds per step cycle. Lower is faster.</Text>
        <Slider
          style={{ width: '100%', height: 44 }}
          minimumValue={100}
          maximumValue={800}
          step={10}
          value={gaitSpeed}
          onValueChange={setGaitSpeed}
          minimumTrackTintColor={colors.accentSystem}
          maximumTrackTintColor={colors.bgElevated}
          thumbTintColor={colors.accentSystem}
        />
        <View style={styles.sliderLabels}>
          <Text style={type.fieldLabel}>100 ms (fast)</Text>
          <Text style={type.fieldLabel}>800 ms (slow)</Text>
        </View>
      </View>

      {/* Step Height */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={type.subheading}>Step height</Text>
          <Text style={[type.value, { color: colors.accentSystem }]}>{stepHeight} mm</Text>
        </View>
        <Text style={[styles.hint, type.hint]}>How high the leg lifts during a step.</Text>
        <Slider
          style={{ width: '100%', height: 44 }}
          minimumValue={10}
          maximumValue={60}
          step={1}
          value={stepHeight}
          onValueChange={setStepHeight}
          minimumTrackTintColor={colors.accentSystem}
          maximumTrackTintColor={colors.bgElevated}
          thumbTintColor={colors.accentSystem}
        />
        <View style={styles.sliderLabels}>
          <Text style={type.fieldLabel}>10 mm</Text>
          <Text style={type.fieldLabel}>60 mm</Text>
        </View>
      </View>

      {/* Connection info (read-only) */}
      <View style={styles.card}>
        <Text style={type.subheading}>Current connection</Text>
        <Text style={[type.mono, { marginTop: 8 }]}>IP:    {ip}</Text>
        <Text style={type.mono}>PORT:  {port}</Text>
        <Text style={[type.mono, { marginTop: 4 }]}>URL:   ws://{ip}:{port}/ws</Text>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={save} activeOpacity={0.7}>
        <Text style={[styles.saveBtnText, type.button]}>Save settings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    paddingHorizontal: 24,
    gap: 16,
  },
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -6,
  },
  hint: {
    marginTop: 2,
    marginBottom: 4,
  },
  saveBtn: {
    backgroundColor: colors.accentSystem,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
