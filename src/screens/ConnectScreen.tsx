import React, { useEffect } from 'react';
import {
  View, Text, TextInput, Pressable,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';
import { robotWS } from '../services/websocket';
import { useRobotStore } from '../store/useRobotStore';

const STATUS_COLOR: Record<string, string> = {
  connected:    colors.statusConnected,
  disconnected: colors.statusDisconnected,
  connecting:   colors.statusConnecting,
  error:        colors.statusError,
};

export default function ConnectScreen() {
  const insets = useSafeAreaInsets();
  const { ip, port, status, setIp, setPort, setStatus } = useRobotStore();

  useEffect(() => {
    robotWS.setCallbacks(setStatus, () => {});
  }, [setStatus]);

  // Haptic feedback on connection status change (CMD-08)
  useEffect(() => {
    if (status === 'connected') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (status === 'error') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [status]);

  const handleConnect = () => {
    robotWS.connect(ip, port);
  };

  const handleDisconnect = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    robotWS.disconnect();
    setStatus('disconnected');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Text style={type.heading}>Robot Connection</Text>
      <Text style={[type.subheading, { marginTop: 4 }]}>
        Connect to your ESP32 over local WiFi
      </Text>

      {/* Status pill (CMD-04) */}
      <View style={[styles.statusPill, { borderColor: STATUS_COLOR[status] }]}>
        {status === 'connecting' ? (
          <ActivityIndicator size="small" color={STATUS_COLOR[status]} />
        ) : (
          <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[status] }]} />
        )}
        <Text style={[styles.statusText, { color: STATUS_COLOR[status] }]}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Text>
      </View>

      {/* IP Input */}
      <View style={styles.fieldGroup}>
        <Text style={type.fieldLabel}>ESP32 IP Address</Text>
        <TextInput
          style={styles.input}
          value={ip}
          onChangeText={setIp}
          placeholder="192.168.4.1"
          placeholderTextColor={colors.textDisabled}
          keyboardType="numeric"
          editable={status !== 'connecting' && status !== 'connected'}
        />
      </View>

      {/* Port Input */}
      <View style={styles.fieldGroup}>
        <Text style={type.fieldLabel}>WebSocket Port</Text>
        <TextInput
          style={styles.input}
          value={String(port || '')}
          onChangeText={(v) => {
            const num = parseInt(v, 10);
            setPort(isNaN(num) ? 0 : num);
          }}
          placeholder="80"
          placeholderTextColor={colors.textDisabled}
          keyboardType="numeric"
          editable={status !== 'connecting' && status !== 'connected'}
        />
      </View>

      {/* Connect / Disconnect Buttons (CMD-09) */}
      {status === 'connected' ? (
        <Pressable
          style={({ pressed }) => [
            styles.btn,
            styles.btnDanger,
            pressed && { transform: [{ scale: 0.97 }] },
          ]}
          onPress={handleDisconnect}
        >
          <Text style={[styles.btnText, type.button]}>Disconnect</Text>
        </Pressable>
      ) : (
        <Pressable
          style={({ pressed }) => [
            styles.btn,
            styles.btnPrimary,
            (status === 'connecting' || pressed) && { transform: [{ scale: 0.97 }] },
            status === 'connecting' && { opacity: 0.7 },
          ]}
          onPress={handleConnect}
          disabled={status === 'connecting'}
        >
          <Text style={[styles.btnText, type.button]}>
            {status === 'connecting' ? 'Connecting…' : 'Connect'}
          </Text>
        </Pressable>
      )}

      <Text style={[styles.hint, type.hint]}>
        Ensure your phone and the ESP32 are on the same WiFi network.{'\n'}
        The ESP32 WebSocket server must be running on port {port}.
      </Text>
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
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 4,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fieldGroup: { gap: 6 },
  input: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  btn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  btnPrimary: { backgroundColor: colors.accentSystem },
  btnDanger:  { backgroundColor: colors.accentDanger },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  hint: {
    textAlign: 'center',
    marginTop: 8,
  },
});
