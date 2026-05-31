import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRobotStore } from '../store/useRobotStore';
import { colors } from '../theme/colors';

const STATUS_COLOR: Record<string, string> = {
  connected:    colors.statusConnected,
  disconnected: colors.statusDisconnected,
  connecting:   colors.statusConnecting,
  error:        colors.statusError,
};

const STATUS_LABEL: Record<string, string> = {
  connected:    'Live',
  disconnected: 'Offline',
  connecting:   'Connecting',
  error:        'Error',
};

interface StatusBarProps {
  activeGait?: string;
}

export default function RobotStatusBar({ activeGait }: StatusBarProps) {
  const { status, ip } = useRobotStore();
  const dotColor = STATUS_COLOR[status];

  if (status === 'disconnected') return null;  // hide entirely when offline

  return (
    <View style={styles.bar}>
      {/* Connection status */}
      <View style={styles.pill}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <Text style={[styles.label, { color: dotColor }]}>
          {STATUS_LABEL[status]}
        </Text>
      </View>

      {/* IP address */}
      <Text style={styles.ip}>{ip}</Text>

      {/* Active gait */}
      {activeGait && status === 'connected' && (
        <View style={styles.gaitPill}>
          <Text style={styles.gaitLabel}>{activeGait}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: colors.bgSurface,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  ip: {
    fontSize: 11,
    color: colors.textTertiary,
    fontFamily: 'monospace',
    flex: 1,
  },
  gaitPill: {
    backgroundColor: colors.accentMovementTint,
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  gaitLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.accentMovement,
    letterSpacing: 0.3,
    textTransform: 'capitalize',
  },
});
