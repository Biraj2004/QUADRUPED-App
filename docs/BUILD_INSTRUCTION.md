# BUILD_INSTRUCTION.md
## Quadruped Robot — Mobile Control App

> **Project:** 8-DOF Quadruped Robot Controller  
> **Hardware:** ESP32 + PCA9685 + 9× MG90S Servos  
> **App Stack:** React Native (Expo) + TypeScript  
> **Prepared by:** Biraj Sarkar · [github.com/Biraj2004](https://github.com/Biraj2004)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Design Principles](#2-design-principles)
3. [Colour System](#3-colour-system)
4. [Project Structure](#4-project-structure)
5. [Prerequisites](#5-prerequisites)
6. [Initialise the Project](#6-initialise-the-project)
7. [Install Dependencies](#7-install-dependencies)
8. [App Entry Point](#8-app-entry-point)
9. [Navigation Setup](#9-navigation-setup)
10. [Global Styles & Theme](#10-global-styles--theme)
11. [WebSocket Service](#11-websocket-service)
12. [Screen 1 — Connect](#12-screen-1--connect)
13. [Screen 2 — Control](#13-screen-2--control)
14. [Screen 3 — Calibration](#14-screen-3--calibration)
15. [Screen 4 — Head Control](#15-screen-4--head-control)
16. [Screen 5 — Settings](#16-screen-5--settings)
17. [Reusable Components](#17-reusable-components)
18. [ESP32 Firmware (Arduino)](#18-esp32-firmware-arduino)
19. [JSON Command Reference](#19-json-command-reference)
20. [Running the App](#20-running-the-app)
21. [Build for Production](#21-build-for-production)
22. [Troubleshooting](#22-troubleshooting)
23. [Roadmap](#23-roadmap)

---

## 1. Overview

This document describes how to build a **minimal, functional React Native (Expo) mobile app** that controls the quadruped robot over a local WiFi WebSocket connection.

The app covers:

- Connecting to the ESP32 WebSocket server by IP address
- Real-time directional movement control via a D-pad
- Gait selection (Walk, Trot, Turn, Stand)
- Per-servo calibration (9 sliders, one per PCA9685 channel)
- Head rotation control (CH8)
- Settings panel (gait timing, step height, persistent storage)

The app does **not** require a cloud backend, login, or internet access. Everything runs on your local WiFi network.

---

## 2. Design Principles

- **Minimal UI.** Only controls that directly map to robot hardware.
- **Dark theme.** Easier to read in lab / workshop conditions; easier on the eyes during testing sessions.
- **Colour encodes function.** One accent colour per concern — movement, calibration, head, system.
- **No animations beyond feedback.** Button press feedback only. No decorative motion.
- **Large touch targets.** Minimum 48×48 dp for all interactive elements. Fingers, not mice.
- **Instant feedback.** Every command sends immediately on touch; no "submit" step for real-time controls.

---

## 3. Colour System

All colours are defined once in `src/theme/colors.ts` and imported everywhere.

```
Background (primary)     #0F1117   — near-black, main screen bg
Background (surface)     #1A1D27   — cards, panels
Background (elevated)    #242838   — sliders, inputs
Border                   #2E3347   — subtle dividers

Text (primary)           #E8EAF0   — headings, values
Text (secondary)         #8B8FA8   — labels, placeholders
Text (disabled)          #4A4E65   — inactive elements

Accent — Movement        #4A90D9   — blue  · D-pad, gait buttons
Accent — Calibration     #E8A838   — amber · servo sliders
Accent — Head            #4DBDA0   — teal  · head control
Accent — System          #A78BFA   — violet· settings, connection
Accent — Danger          #E05C5C   — red   · disconnect, reset

Status — Connected       #4DBDA0   — same teal as head accent
Status — Disconnected    #E05C5C   — same red as danger
Status — Connecting      #E8A838   — same amber as calibration
```

**Rule:** never use a colour outside its assigned concern. The blue `#4A90D9` is only used for movement controls. If you add a new feature, add a new accent entry in `colors.ts`.

---

## 4. Project Structure

```
quadruped-app/
├── app.json
├── App.tsx
├── tsconfig.json
├── package.json
│
└── src/
    ├── theme/
    │   ├── colors.ts
    │   └── typography.ts
    │
    ├── services/
    │   └── websocket.ts          ← singleton WS manager
    │
    ├── store/
    │   └── useRobotStore.ts      ← Zustand global state
    │
    ├── navigation/
    │   └── AppNavigator.tsx
    │
    ├── screens/
    │   ├── ConnectScreen.tsx
    │   ├── ControlScreen.tsx
    │   ├── CalibrationScreen.tsx
    │   ├── HeadScreen.tsx
    │   └── SettingsScreen.tsx
    │
    └── components/
        ├── DPad.tsx
        ├── GaitButton.tsx
        ├── ServoSlider.tsx
        ├── StatusBar.tsx
        └── SectionCard.tsx
```

---

## 5. Prerequisites

Install the following before starting:

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 18.x | https://nodejs.org |
| npm | ≥ 9.x | bundled with Node |
| Expo CLI | latest | `npm install -g expo-cli` |
| EAS CLI (optional, for builds) | latest | `npm install -g eas-cli` |
| Expo Go app | latest | Android / iOS store |
| Android Studio (optional) | latest | for emulator testing |

Your phone and the ESP32 **must be on the same WiFi network** during testing.

---

## 6. Initialise the Project

```bash
npx create-expo-app quadruped-app --template blank-typescript
cd quadruped-app
```

Edit `app.json`:

```json
{
  "expo": {
    "name": "Quadruped",
    "slug": "quadruped-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "backgroundColor": "#0F1117"
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#0F1117"
      }
    },
    "ios": {
      "supportsTablet": false
    }
  }
}
```

---

## 7. Install Dependencies

```bash
npm install @react-navigation/native @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
npm install @react-native-async-storage/async-storage
npm install zustand
npm install react-native-gesture-handler
npx expo install react-native-slider
```

All packages are JavaScript-only or have Expo-managed native modules. No ejecting required.

---

## 8. App Entry Point

**`App.tsx`**

```tsx
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/theme/colors';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="light" backgroundColor={colors.bgPrimary} />
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

---

## 9. Navigation Setup

**`src/navigation/AppNavigator.tsx`**

```tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { colors } from '../theme/colors';

import ConnectScreen    from '../screens/ConnectScreen';
import ControlScreen    from '../screens/ControlScreen';
import CalibrationScreen from '../screens/CalibrationScreen';
import HeadScreen       from '../screens/HeadScreen';
import SettingsScreen   from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

// Simple text icons — replace with vector icons if desired
const icon = (label: string, focused: boolean, color: string) => (
  <Text style={{ fontSize: 18, color }}>{label}</Text>
);

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgSurface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.accentMovement,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tab.Screen
        name="Connect"
        component={ConnectScreen}
        options={{ tabBarIcon: ({ color, focused }) => icon('⬡', focused, color), tabBarLabel: 'Connect' }}
      />
      <Tab.Screen
        name="Control"
        component={ControlScreen}
        options={{ tabBarIcon: ({ color, focused }) => icon('✛', focused, color), tabBarLabel: 'Control' }}
      />
      <Tab.Screen
        name="Calibration"
        component={CalibrationScreen}
        options={{ tabBarIcon: ({ color, focused }) => icon('⊞', focused, color), tabBarLabel: 'Calibrate' }}
      />
      <Tab.Screen
        name="Head"
        component={HeadScreen}
        options={{ tabBarIcon: ({ color, focused }) => icon('◎', focused, color), tabBarLabel: 'Head' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarIcon: ({ color, focused }) => icon('⚙', focused, color), tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
}
```

---

## 10. Global Styles & Theme

**`src/theme/colors.ts`**

```ts
export const colors = {
  // Backgrounds
  bgPrimary:  '#0F1117',
  bgSurface:  '#1A1D27',
  bgElevated: '#242838',

  // Borders
  border: '#2E3347',

  // Text
  textPrimary:   '#E8EAF0',
  textSecondary: '#8B8FA8',
  textDisabled:  '#4A4E65',

  // Accents
  accentMovement:    '#4A90D9',  // blue   — movement / D-pad
  accentCalibration: '#E8A838',  // amber  — servo sliders
  accentHead:        '#4DBDA0',  // teal   — head control
  accentSystem:      '#A78BFA',  // violet — settings / connect
  accentDanger:      '#E05C5C',  // red    — disconnect / reset

  // Status
  statusConnected:    '#4DBDA0',
  statusDisconnected: '#E05C5C',
  statusConnecting:   '#E8A838',
} as const;
```

**`src/theme/typography.ts`**

```ts
import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const type = StyleSheet.create({
  heading: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  subheading: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
  label: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  mono: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: colors.textSecondary,
  },
});
```

---

## 11. WebSocket Service

This is a singleton that manages the single WebSocket connection to the ESP32.

**`src/services/websocket.ts`**

```ts
type StatusCallback = (status: 'connected' | 'disconnected' | 'connecting' | 'error') => void;
type MessageCallback = (data: Record<string, unknown>) => void;

class RobotWebSocket {
  private ws: WebSocket | null = null;
  private url: string = '';
  private onStatusChange: StatusCallback | null = null;
  private onMessage: MessageCallback | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = false;

  setCallbacks(onStatus: StatusCallback, onMsg: MessageCallback) {
    this.onStatusChange = onStatus;
    this.onMessage = onMsg;
  }

  connect(ip: string, port = 81) {
    this.url = `ws://${ip}:${port}/ws`;
    this.shouldReconnect = true;
    this._connect();
  }

  private _connect() {
    this.onStatusChange?.('connecting');
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.onStatusChange?.('connected');
    };

    this.ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data as string);
        this.onMessage?.(data);
      } catch {
        // ignore malformed messages
      }
    };

    this.ws.onerror = () => {
      this.onStatusChange?.('error');
    };

    this.ws.onclose = () => {
      this.onStatusChange?.('disconnected');
      if (this.shouldReconnect) {
        this.reconnectTimer = setTimeout(() => this._connect(), 3000);
      }
    };
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }

  send(payload: Record<string, unknown>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Export singleton
export const robotWS = new RobotWebSocket();
```

---

## 12. Global State

**`src/store/useRobotStore.ts`**

```ts
import { create } from 'zustand';

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

interface RobotState {
  ip: string;
  port: number;
  status: ConnectionStatus;
  // Calibration: offsets in degrees for CH0–CH8
  servoOffsets: number[];
  // Settings
  stepHeight: number;
  gaitSpeed: number;   // ms per step cycle
  // Actions
  setIp: (ip: string) => void;
  setPort: (port: number) => void;
  setStatus: (s: ConnectionStatus) => void;
  setServoOffset: (channel: number, value: number) => void;
  setStepHeight: (v: number) => void;
  setGaitSpeed: (v: number) => void;
}

export const useRobotStore = create<RobotState>((set) => ({
  ip: '192.168.1.100',
  port: 81,
  status: 'disconnected',
  servoOffsets: Array(9).fill(0),
  stepHeight: 30,
  gaitSpeed: 300,

  setIp: (ip) => set({ ip }),
  setPort: (port) => set({ port }),
  setStatus: (status) => set({ status }),
  setServoOffset: (channel, value) =>
    set((state) => {
      const offsets = [...state.servoOffsets];
      offsets[channel] = value;
      return { servoOffsets: offsets };
    }),
  setStepHeight: (stepHeight) => set({ stepHeight }),
  setGaitSpeed: (gaitSpeed) => set({ gaitSpeed }),
}));
```

---

## 13. Screen 1 — Connect

**`src/screens/ConnectScreen.tsx`**

This screen lets the user enter the ESP32's IP address, connect, and see connection status.

```tsx
import React, { useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { type as typo } from '../theme/typography';
import { robotWS } from '../services/websocket';
import { useRobotStore } from '../store/useRobotStore';

const STATUS_COLOR: Record<string, string> = {
  connected:    colors.statusConnected,
  disconnected: colors.statusDisconnected,
  connecting:   colors.statusConnecting,
  error:        colors.accentDanger,
};

export default function ConnectScreen() {
  const insets = useSafeAreaInsets();
  const { ip, port, status, setIp, setPort, setStatus } = useRobotStore();

  useEffect(() => {
    robotWS.setCallbacks(setStatus, () => {});
  }, []);

  const handleConnect = () => {
    robotWS.connect(ip, port);
  };

  const handleDisconnect = () => {
    robotWS.disconnect();
    setStatus('disconnected');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Text style={typo.heading}>Robot Connection</Text>
      <Text style={[typo.subheading, { marginTop: 4 }]}>
        Connect to your ESP32 over local WiFi
      </Text>

      {/* Status pill */}
      <View style={[styles.statusPill, { borderColor: STATUS_COLOR[status] }]}>
        {status === 'connecting' && (
          <ActivityIndicator size="small" color={STATUS_COLOR[status]} style={{ marginRight: 8 }} />
        )}
        <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[status] }]} />
        <Text style={[styles.statusText, { color: STATUS_COLOR[status] }]}>
          {status.toUpperCase()}
        </Text>
      </View>

      {/* IP Input */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>ESP32 IP ADDRESS</Text>
        <TextInput
          style={styles.input}
          value={ip}
          onChangeText={setIp}
          placeholder="192.168.1.100"
          placeholderTextColor={colors.textDisabled}
          keyboardType="numeric"
          editable={status !== 'connecting' && status !== 'connected'}
        />
      </View>

      {/* Port Input */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>WEBSOCKET PORT</Text>
        <TextInput
          style={styles.input}
          value={String(port)}
          onChangeText={(v) => setPort(Number(v))}
          placeholder="81"
          placeholderTextColor={colors.textDisabled}
          keyboardType="numeric"
          editable={status !== 'connecting' && status !== 'connected'}
        />
      </View>

      {/* Connect / Disconnect */}
      {status === 'connected' ? (
        <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={handleDisconnect}>
          <Text style={styles.btnText}>DISCONNECT</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary]}
          onPress={handleConnect}
          disabled={status === 'connecting'}
        >
          <Text style={styles.btnText}>
            {status === 'connecting' ? 'CONNECTING...' : 'CONNECT'}
          </Text>
        </TouchableOpacity>
      )}

      <Text style={styles.hint}>
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
    width: 8, height: 8, borderRadius: 4,
  },
  statusText: {
    fontSize: 12, fontWeight: '600', letterSpacing: 1,
  },
  fieldGroup: { gap: 6 },
  fieldLabel: { ...typo.label },
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
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  hint: {
    color: colors.textDisabled,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
  },
});
```

---

## 14. Screen 2 — Control

**`src/screens/ControlScreen.tsx`**

The primary screen. D-pad for movement and gait selector buttons.

```tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { type as typo } from '../theme/typography';
import { robotWS } from '../services/websocket';
import { useRobotStore } from '../store/useRobotStore';
import DPad from '../components/DPad';
import GaitButton from '../components/GaitButton';

const GAITS = ['walk', 'trot', 'turn_left', 'turn_right', 'stand'];
const GAIT_LABELS: Record<string, string> = {
  walk: 'Walk', trot: 'Trot',
  turn_left: '↺ Turn L', turn_right: '↻ Turn R', stand: 'Stand',
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
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Text style={typo.heading}>Movement Control</Text>
      {!isConnected && (
        <Text style={styles.notConnected}>
          Not connected — go to the Connect tab first.
        </Text>
      )}

      {/* Gait selector */}
      <View style={styles.section}>
        <Text style={typo.label}>GAIT</Text>
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

      {/* D-pad */}
      <View style={styles.dpadContainer}>
        <DPad onPress={sendMove} disabled={!isConnected} />
      </View>

      {/* Live params */}
      <View style={styles.paramsRow}>
        <View style={styles.paramBox}>
          <Text style={typo.label}>GAIT SPEED</Text>
          <Text style={typo.value}>{gaitSpeed} ms</Text>
        </View>
        <View style={styles.paramBox}>
          <Text style={typo.label}>STEP HEIGHT</Text>
          <Text style={typo.value}>{stepHeight} mm</Text>
        </View>
        <View style={styles.paramBox}>
          <Text style={typo.label}>GAIT</Text>
          <Text style={typo.value}>{GAIT_LABELS[activeGait]}</Text>
        </View>
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
  notConnected: {
    color: colors.accentDanger,
    fontSize: 13,
    backgroundColor: '#2A1418',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.accentDanger + '55',
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
```

---

## 15. Screen 3 — Calibration

**`src/screens/CalibrationScreen.tsx`**

Nine servo sliders, one per PCA9685 channel. Sends offset values immediately to ESP32.

```tsx
import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { type as typo } from '../theme/typography';
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
        <View>
          <Text style={typo.heading}>Servo Calibration</Text>
          <Text style={typo.subheading}>Offset range: −45° to +45°</Text>
        </View>
        <TouchableOpacity
          style={[styles.saveBtn, !isConnected && styles.btnDisabled]}
          onPress={saveAll}
          disabled={!isConnected}
        >
          <Text style={styles.saveBtnText}>SAVE</Text>
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
            // CH8 head uses teal accent, rest use amber
            accentColor={i === 8 ? colors.accentHead : colors.accentCalibration}
          />
        ))}

        <TouchableOpacity
          style={[styles.resetBtn, !isConnected && styles.btnDisabled]}
          onPress={resetAll}
          disabled={!isConnected}
        >
          <Text style={styles.resetBtnText}>RESET ALL TO 0°</Text>
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
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  resetBtn: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.accentDanger + '88',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  resetBtnText: {
    color: colors.accentDanger,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  btnDisabled: { opacity: 0.4 },
});
```

---

## 16. Screen 4 — Head Control

**`src/screens/HeadScreen.tsx`**

Dedicated screen for the CH8 head servo.

```tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { type as typo } from '../theme/typography';
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
      <Text style={typo.heading}>Head Control</Text>
      <Text style={typo.subheading}>CH8 — MG90S head rotation servo</Text>

      {/* Angle display */}
      <View style={styles.angleDisplay}>
        <Text style={styles.angleValue}>{angle}°</Text>
        <Text style={styles.angleLabel}>
          {angle < 80 ? '← LEFT' : angle > 100 ? 'RIGHT →' : 'CENTRE'}
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
        <Text style={typo.label}>0° (left)</Text>
        <Text style={typo.label}>180° (right)</Text>
      </View>

      {/* Snap buttons */}
      <View style={styles.snapRow}>
        {[0, 45, 90, 135, 180].map((v) => (
          <TouchableOpacity
            key={v}
            style={[styles.snapBtn, angle === v && styles.snapBtnActive, !isConnected && styles.btnDisabled]}
            onPress={() => snapTo(v)}
            disabled={!isConnected}
          >
            <Text style={[styles.snapBtnText, angle === v && styles.snapBtnTextActive]}>
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
    borderColor: colors.accentHead + '44',
    marginTop: 8,
  },
  angleValue: {
    fontSize: 64,
    fontWeight: '700',
    color: colors.accentHead,
    fontVariant: ['tabular-nums'],
  },
  angleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 1.5,
    marginTop: 4,
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
    backgroundColor: colors.accentHead + '22',
    borderColor: colors.accentHead,
  },
  snapBtnText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  snapBtnTextActive: { color: colors.accentHead },
  btnDisabled: { opacity: 0.4 },
});
```

---

## 17. Screen 5 — Settings

**`src/screens/SettingsScreen.tsx`**

Gait speed and step height sliders, plus persistent storage via AsyncStorage.

```tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { type as typo } from '../theme/typography';
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
  }, []);

  const save = async () => {
    await AsyncStorage.multiSet([
      ['gaitSpeed', String(gaitSpeed)],
      ['stepHeight', String(stepHeight)],
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Text style={typo.heading}>Settings</Text>

      {/* Gait Speed */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={typo.subheading}>Gait Speed</Text>
          <Text style={[typo.value, { color: colors.accentSystem }]}>{gaitSpeed} ms</Text>
        </View>
        <Text style={styles.hint}>Milliseconds per step cycle. Lower = faster.</Text>
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
          <Text style={typo.label}>100 ms (fast)</Text>
          <Text style={typo.label}>800 ms (slow)</Text>
        </View>
      </View>

      {/* Step Height */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={typo.subheading}>Step Height</Text>
          <Text style={[typo.value, { color: colors.accentSystem }]}>{stepHeight} mm</Text>
        </View>
        <Text style={styles.hint}>How high the leg lifts during a step.</Text>
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
          <Text style={typo.label}>10 mm</Text>
          <Text style={typo.label}>60 mm</Text>
        </View>
      </View>

      {/* Connection info (read-only) */}
      <View style={styles.card}>
        <Text style={typo.subheading}>Current Connection</Text>
        <Text style={[typo.mono, { marginTop: 8 }]}>IP:    {ip}</Text>
        <Text style={typo.mono}>PORT:  {port}</Text>
        <Text style={[typo.mono, { marginTop: 4 }]}>URL:   ws://{ip}:{port}/ws</Text>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={save}>
        <Text style={styles.saveBtnText}>SAVE SETTINGS</Text>
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
    color: colors.textDisabled,
    fontSize: 12,
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
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
```

---

## 18. Reusable Components

### `src/components/DPad.tsx`

```tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  onPress: (dir: string) => void;
  disabled?: boolean;
}

const BTN_SIZE = 72;

export default function DPad({ onPress, disabled = false }: Props) {
  const btn = (dir: string, label: string) => (
    <TouchableOpacity
      style={[styles.btn, disabled && styles.disabled]}
      onPress={() => onPress(dir)}
      disabled={disabled}
      activeOpacity={0.65}
    >
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <View style={styles.row}>{btn('forward', '▲')}</View>
      <View style={styles.row}>
        {btn('left', '◀')}
        <View style={styles.centre}><Text style={styles.centreLabel}>■</Text></View>
        {btn('right', '▶')}
      </View>
      <View style={styles.row}>{btn('backward', '▼')}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: 6 },
  row: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  btn: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: 12,
    backgroundColor: colors.accentMovement + '22',
    borderWidth: 1.5,
    borderColor: colors.accentMovement + '88',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.35 },
  label: { fontSize: 22, color: colors.accentMovement },
  centre: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: 12,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centreLabel: { fontSize: 16, color: colors.border },
});
```

### `src/components/GaitButton.tsx`

```tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
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
      onPress={onPress}
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
    backgroundColor: colors.accentMovement + '22',
    borderColor: colors.accentMovement,
  },
  disabled: { opacity: 0.35 },
  label: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  activeLabel: { color: colors.accentMovement, fontWeight: '700' },
});
```

### `src/components/ServoSlider.tsx`

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { colors } from '../theme/colors';
import { type as typo } from '../theme/typography';

interface Props {
  label: string;
  value: number;
  disabled?: boolean;
  accentColor?: string;
  onChange: (v: number) => void;
}

export default function ServoSlider({
  label, value, disabled = false, accentColor = colors.accentCalibration, onChange,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={typo.subheading}>{label}</Text>
        <Text style={[typo.value, { color: accentColor }]}>
          {value > 0 ? `+${value}°` : `${value}°`}
        </Text>
      </View>
      <Slider
        style={{ width: '100%', height: 40 }}
        minimumValue={-45}
        maximumValue={45}
        step={1}
        value={value}
        onValueChange={(v) => onChange(Math.round(v))}
        disabled={disabled}
        minimumTrackTintColor={accentColor}
        maximumTrackTintColor={colors.bgElevated}
        thumbTintColor={accentColor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgSurface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
});
```

---

## 19. ESP32 Firmware (Arduino)

Below is the complete Arduino sketch. Install these libraries via the Arduino Library Manager before compiling:

- `ESPAsyncWebServer` by lacamera
- `AsyncTCP` by lacamera
- `Adafruit PWM Servo Driver Library`
- `ArduinoJson` by Benoit Blanchon

```cpp
#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <AsyncWebSocket.h>
#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>
#include <ArduinoJson.h>
#include <Preferences.h>

// ── WiFi Configuration ──────────────────────────────────────────────────────
// Option A: ESP32 creates its own Access Point (recommended for first test)
const char* AP_SSID = "QuadrupedRobot";
const char* AP_PASS = "robot1234";

// Option B: Connect to existing router (comment out AP block below, use this)
// const char* WIFI_SSID = "YOUR_SSID";
// const char* WIFI_PASS = "YOUR_PASSWORD";

// ── Hardware ─────────────────────────────────────────────────────────────────
Adafruit_PWMServoDriver pca = Adafruit_PWMServoDriver(0x40);
AsyncWebServer server(80);
AsyncWebSocket ws("/ws");
Preferences prefs;

// ── Servo Configuration ──────────────────────────────────────────────────────
#define SERVO_FREQ     50      // 50 Hz for MG90S
#define SERVO_MIN      150     // ~0°   pulse count
#define SERVO_MAX      600     // ~180° pulse count
#define SERVO_NEUTRAL  375     // ~90°  pulse count

int offsets[9] = {0};          // calibration offsets in degrees, CH0–CH8

// Convert degrees (0–180) to PCA9685 pulse count, applying channel offset
int degreesToPulse(int deg, int channel) {
  int adjusted = constrain(deg + offsets[channel], 0, 180);
  return map(adjusted, 0, 180, SERVO_MIN, SERVO_MAX);
}

void setServo(int ch, int deg) {
  pca.setPWM(ch, 0, degreesToPulse(deg, ch));
}

// ── Gait Stubs ───────────────────────────────────────────────────────────────
// Replace these with your actual inverse-kinematics gait sequences
void gaitStand()     { for (int i = 0; i < 8; i++) setServo(i, 90); }
void gaitWalk()      { /* TODO: implement walking gait */ }
void gaitTrot()      { /* TODO: implement trot gait */   }
void gaitTurnLeft()  { /* TODO: implement left turn */   }
void gaitTurnRight() { /* TODO: implement right turn */  }

void executeMove(const char* dir) {
  if      (strcmp(dir, "forward")  == 0) gaitWalk();
  else if (strcmp(dir, "backward") == 0) gaitWalk();  // reverse TBD
  else if (strcmp(dir, "left")     == 0) gaitTurnLeft();
  else if (strcmp(dir, "right")    == 0) gaitTurnRight();
}

// ── Save / Load Calibration ──────────────────────────────────────────────────
void loadCalibration() {
  prefs.begin("calib", true);
  for (int i = 0; i < 9; i++) {
    String key = "ch" + String(i);
    offsets[i] = prefs.getInt(key.c_str(), 0);
  }
  prefs.end();
}

void saveCalibration() {
  prefs.begin("calib", false);
  for (int i = 0; i < 9; i++) {
    String key = "ch" + String(i);
    prefs.putInt(key.c_str(), offsets[i]);
  }
  prefs.end();
}

// ── WebSocket Message Handler ────────────────────────────────────────────────
void handleMessage(const char* payload) {
  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, payload);
  if (err) return;

  const char* cmd = doc["cmd"];

  if (strcmp(cmd, "move") == 0) {
    executeMove(doc["dir"]);
  }
  else if (strcmp(cmd, "gait") == 0) {
    const char* gait = doc["gait"];
    if      (strcmp(gait, "walk")       == 0) gaitWalk();
    else if (strcmp(gait, "trot")       == 0) gaitTrot();
    else if (strcmp(gait, "turn_left")  == 0) gaitTurnLeft();
    else if (strcmp(gait, "turn_right") == 0) gaitTurnRight();
    else if (strcmp(gait, "stand")      == 0) gaitStand();
  }
  else if (strcmp(cmd, "calibrate") == 0) {
    int ch  = doc["channel"];
    int val = doc["offset"];
    if (ch >= 0 && ch <= 8) {
      offsets[ch] = constrain(val, -45, 45);
      setServo(ch, 90);  // apply new offset at neutral position
    }
  }
  else if (strcmp(cmd, "save_calibration") == 0) {
    // Accept offsets array from app if provided
    if (doc.containsKey("offsets")) {
      JsonArray arr = doc["offsets"].as<JsonArray>();
      for (int i = 0; i < min((int)arr.size(), 9); i++) {
        offsets[i] = constrain((int)arr[i], -45, 45);
      }
    }
    saveCalibration();
  }
  else if (strcmp(cmd, "head") == 0) {
    int angle = doc["angle"];
    setServo(8, constrain(angle, 0, 180));
  }
}

void onWsEvent(AsyncWebSocket* s, AsyncWebSocketClient* c,
               AwsEventType type, void* arg, uint8_t* data, size_t len) {
  if (type == WS_EVT_DATA) {
    AwsFrameInfo* info = (AwsFrameInfo*)arg;
    if (info->final && info->opcode == WS_TEXT) {
      char buf[256];
      size_t copyLen = min(len, sizeof(buf) - 1);
      memcpy(buf, data, copyLen);
      buf[copyLen] = '\0';
      handleMessage(buf);
    }
  }
}

// ── Setup ─────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);

  // Start WiFi AP
  WiFi.softAP(AP_SSID, AP_PASS);
  Serial.print("AP IP: ");
  Serial.println(WiFi.softAPIP());   // usually 192.168.4.1

  // PCA9685
  Wire.begin(21, 22);
  pca.begin();
  pca.setOscillatorFrequency(27000000);
  pca.setPWMFreq(SERVO_FREQ);
  delay(10);

  // Load saved calibration
  loadCalibration();

  // Stand on startup
  gaitStand();

  // WebSocket
  ws.onEvent(onWsEvent);
  server.addHandler(&ws);
  server.begin();

  Serial.println("WebSocket server started on port 80, path /ws");
}

void loop() {
  ws.cleanupClients();
  // Future: read IMU, sonar, etc. and broadcast telemetry
}
```

> **Note on port:** The sketch uses port 80 (HTTP server handles the WS upgrade). Set port to `80` in the app's Connect screen, or change `AsyncWebServer server(80)` to `AsyncWebServer server(81)` and update accordingly. Both work; just be consistent.

> **AP IP address:** When using Access Point mode, the ESP32's IP is always `192.168.4.1`. Enter this in the Connect screen.

---

## 20. JSON Command Reference

All commands from app → ESP32 are JSON strings sent over WebSocket.

| Command | Payload | Description |
|---------|---------|-------------|
| `move` | `{"cmd":"move","dir":"forward"}` | Execute movement in direction (`forward`, `backward`, `left`, `right`) |
| `gait` | `{"cmd":"gait","gait":"walk","speed":300,"stepHeight":30}` | Switch gait mode |
| `calibrate` | `{"cmd":"calibrate","channel":0,"offset":-5}` | Set single servo offset (−45 to +45 degrees) |
| `save_calibration` | `{"cmd":"save_calibration","offsets":[-5,2,0,0,3,-1,0,0,0]}` | Persist all offsets to NVS |
| `head` | `{"cmd":"head","angle":90}` | Set head servo angle (0–180 degrees) |

Valid `gait` values: `walk`, `trot`, `turn_left`, `turn_right`, `stand`

Valid `dir` values: `forward`, `backward`, `left`, `right`

---

## 21. Running the App

```bash
# Start Expo dev server
npx expo start

# Press 'a' for Android emulator
# Press 'i' for iOS simulator
# Or scan the QR code with Expo Go on your phone
```

**Testing sequence:**

1. Flash the ESP32 firmware via Arduino IDE.
2. On your phone, connect to the `QuadrupedRobot` WiFi network (password: `robot1234`).
3. Launch the app via Expo Go.
4. Go to the **Connect** tab, enter IP `192.168.4.1` and port `80`.
5. Tap **CONNECT** — status pill should turn teal.
6. Go to **Calibration** — move a slider, the corresponding servo should move.
7. Proceed to **Control** for movement.

---

## 22. Build for Production

### Android APK (for direct install)

```bash
npx eas build --platform android --profile preview
```

This produces a `.apk` file you can install directly on your Android phone without the Play Store. Requires a free Expo account.

### Local build (no EAS account)

```bash
npx expo run:android
```

Requires Android Studio and a connected device or running emulator.

---

## 23. Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Status stuck on "CONNECTING" | Wrong IP or ESP32 not running | Verify IP in Serial Monitor; check WiFi network |
| Servo does not move on slider change | V+ rail not powered | Provide 5V directly to PCA9685 V+ terminal (see project notes) |
| I2C device not found | Wrong SDA/SCL pins | Confirm GPIO21=SDA, GPIO22=SCL |
| App crashes on launch | Missing dependency | Run `npx expo install` to fix native module versions |
| Slider sends no command | Not connected | Status must be "connected" (teal) before sliders are active |
| Calibration not saved after restart | `save_calibration` not sent | Tap SAVE button on Calibration screen before powering off |
| Head servo not responding | CH8 not mapped | Verify CH8 is connected to PCA9685 channel 8 header |
| WebSocket disconnects frequently | Auto-reconnect fires every 3s | Normal behaviour — app reconnects automatically |

---

*Prepared by [Biraj Sarkar](https://github.com/Biraj2004) · birajsarkar67@gmail.com*  
*Project: Quadruped Robot — CGEC 2023–27*
