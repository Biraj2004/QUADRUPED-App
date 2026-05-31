import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';
import { robotWS } from '../services/websocket';
import { useRobotStore } from '../store/useRobotStore';
import DPad from '../components/DPad';
import GaitButton from '../components/GaitButton';
import RobotStatusBar from '../components/StatusBar';

const GAITS = ['walk', 'trot', 'turn_left', 'turn_right', 'stand'];
const GAIT_LABELS: Record<string, string> = {
  walk: 'Walk',
  trot: 'Trot',
  turn_left: 'Turn L',
  turn_right: 'Turn R',
  stand: 'Stand',
};

export default function ControlScreen() {
  const insets = useSafeAreaInsets();
  const { status, gaitSpeed, stepHeight } = useRobotStore();
  const [activeGait, setActiveGait] = React.useState('stand');
  const isConnected = status === 'connected';

  const sendGait = (gait: string) => {
    setActiveGait(gait);
    robotWS.send({ cmd: 'gait', gait, speed: gaitSpeed, stepHeight });
  };

  const sendMove = (dir: string) => {
    robotWS.send({ cmd: 'move', dir });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Persistent Status Bar (CMD-10) */}
      <RobotStatusBar activeGait={GAIT_LABELS[activeGait]} />

      <View style={styles.content}>
        <Text style={type.heading}>Movement Control</Text>
        {!isConnected && (
          <Text style={styles.notConnected}>
            Not connected — go to the Connect tab first.
          </Text>
        )}

        {/* Gait selector */}
        <View style={styles.section}>
          <Text style={type.fieldLabel}>Gait Mode</Text>
          <View style={styles.gaitRow}>
            {GAITS.map((g) => (
              <GaitButton
                key={g}
                label={GAIT_LABELS[g]}
                active={activeGait === g}
                disabled={!isConnected}
                onPress={() => sendGait(g)}
              />
            ))}
          </View>
        </View>

        {/* D-pad (CMD-03) */}
        <View style={styles.dpadContainer}>
          <DPad
            onPress={sendMove}
            onRelease={() => robotWS.send({ cmd: 'move', dir: 'stop' })}
            disabled={!isConnected}
          />
        </View>

        {/* Live params */}
        <View style={styles.paramsRow}>
          <View style={styles.paramBox}>
            <Text style={type.fieldLabel}>Gait Speed</Text>
            <Text style={type.value}>{gaitSpeed} ms</Text>
          </View>
          <View style={styles.paramBox}>
            <Text style={type.fieldLabel}>Step Height</Text>
            <Text style={type.value}>{stepHeight} mm</Text>
          </View>
          <View style={styles.paramBox}>
            <Text style={type.fieldLabel}>Active Gait</Text>
            <Text style={type.value}>{GAIT_LABELS[activeGait]}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 20,
  },
  notConnected: {
    color: colors.accentDanger,
    fontSize: 13,
    backgroundColor: 'rgba(224,92,92,0.1)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(224,92,92,0.22)',
  },
  section: { gap: 8 },
  gaitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dpadContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paramsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  paramBox: {
    flex: 1,
    backgroundColor: colors.bgSurface,
    borderRadius: 10,
    padding: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
