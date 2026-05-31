# DESIGN_COMMANDS.md
## Quadruped Robot App — Design Improvement Commands

> **Derived from:** Staff design review against Linear / Raycast / Vercel / Arc standards  
> **Applies to:** `BUILD_INSTRUCTION.md` (React Native / Expo)  
> **Prepared by:** Biraj Sarkar · [github.com/Biraj2004](https://github.com/Biraj2004)  
> **Status:** 4 critical · 9 warnings · 12 commands total

---

## How to use this document

Each command is self-contained. It states exactly **one** file to change, the **exact lines** to replace, and the **reason** grounded in the review finding. Work top to bottom — commands are ordered by impact, not by file. Critical commands must be done before warnings.

Severity legend:

```
[CRITICAL]  Breaks function or user mental model. Do first.
[WARNING]   Degrades polish. Do second.
[INFO]      Housekeeping. Do when convenient.
```

---

## CMD-01 · Separate status tokens from accent tokens

**Severity:** `[CRITICAL]`  
**File:** `src/theme/colors.ts`  
**Finding:** `statusConnected` shares `#4DBDA0` with `accentHead`. `statusConnecting` shares `#E8A838` with `accentCalibration`. A user sees teal on the Connect screen and teal on the Head screen — the colour no longer means anything specific. Status and function must be independent token families.

**Replace the entire `colors.ts` file with:**

```ts
export const colors = {

  // ── Backgrounds ─────────────────────────────────────────────────────────
  bgPrimary:  '#0F1117',     // page background
  bgSurface:  '#1F2233',     // cards, panels          ← raised from #1A1D27
  bgElevated: '#272B3F',     // inputs, slider tracks  ← raised from #242838

  // ── Borders ──────────────────────────────────────────────────────────────
  border:       'rgba(255,255,255,0.07)',   // default — replaces hard #2E3347
  borderStrong: 'rgba(255,255,255,0.13)',   // hover / focus ring
  borderFocus:  'rgba(255,255,255,0.22)',   // active text input

  // ── Text ─────────────────────────────────────────────────────────────────
  textPrimary:   '#E8EAF0',
  textSecondary: '#8B8FA8',
  textTertiary:  '#4A4E65',
  textDisabled:  '#363A52',

  // ── Accents — one per UI concern, never reused ────────────────────────────
  accentMovement:    '#4A90D9',   // blue   · D-pad + move buttons ONLY
  accentCalibration: '#E8A838',   // amber  · servo sliders ONLY
  accentHead:        '#4DBDA0',   // teal   · head screen ONLY
  accentSystem:      '#A78BFA',   // violet · settings + connect CTA
  accentDanger:      '#E05C5C',   // red    · destructive actions

  // Tint variants — for active backgrounds and pressed states
  accentMovementTint:    'rgba(74,144,217,0.12)',
  accentCalibrationTint: 'rgba(232,168,56,0.12)',
  accentHeadTint:        'rgba(77,189,160,0.12)',
  accentSystemTint:      'rgba(167,139,250,0.12)',
  accentDangerTint:      'rgba(224,92,92,0.12)',

  // ── Status — intentionally distinct from all accents ─────────────────────
  statusConnected:    '#22C55E',   // green  · unambiguously "good"
  statusDisconnected: '#E05C5C',   // red
  statusConnecting:   '#F59E0B',   // amber  · distinct from accentCalibration
  statusError:        '#E05C5C',

} as const;
```

**Verify:** after this change, no status key should share a hex value with any accent key. Run a quick search for `#4DBDA0` — it must appear only under `accentHead`, never under any `status*` key.

---

## CMD-02 · Fix the type scale and remove ALL CAPS from interactive elements

**Severity:** `[CRITICAL]`  
**File:** `src/theme/typography.ts`  
**Finding #1:** `heading` is 18px/600 — a body size, not a screen heading. On a 390px phone, screen titles need 22px minimum. The scale has a flat 4px step between every level; it needs a wider range.  
**Finding #2:** ALL CAPS with `letterSpacing: 1` is applied to buttons, status text, angle labels, and calibration actions. ALL CAPS is appropriate for one token only: 11px metadata field labels. Every interactive element — buttons, confirmations, readouts — must be sentence case.

**Replace the entire `typography.ts` file with:**

```ts
import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const type = StyleSheet.create({

  // Hero display — angle readouts, large stats
  display: {
    fontSize: 28,
    fontWeight: '500',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 34,
    fontVariant: ['tabular-nums'],
  },

  // Screen-level headings
  heading: {
    fontSize: 22,
    fontWeight: '500',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    lineHeight: 28,
  },

  // Card titles, section titles
  subheading: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.textSecondary,
    letterSpacing: 0.1,
    lineHeight: 22,
  },

  // Metadata labels — THE ONLY TOKEN that may use ALL CAPS
  fieldLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textTertiary,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    lineHeight: 16,
  },

  // Button text — sentence case, no tracking
  button: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
    letterSpacing: 0.1,
    lineHeight: 20,
  },

  // Live numeric values
  value: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    lineHeight: 20,
    fontVariant: ['tabular-nums'],
  },

  // Monospace — connection strings, addresses
  mono: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: colors.textSecondary,
    lineHeight: 18,
  },

  // Hint / caption text
  hint: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textDisabled,
    lineHeight: 18,
    letterSpacing: 0.1,
  },

});
```

**Downstream changes required after this command:**

Every place `type.label` was used must be replaced. Search the codebase for `typo.label` and replace:

- If it wraps a field name like "ESP32 IP ADDRESS" → change to `type.fieldLabel`
- If it wraps button text → change to `type.button` and remove `textTransform: 'uppercase'`
- If it wraps status text (CONNECTED, DISCONNECTED) → change to sentence case in the string itself, use `type.subheading`

---

## CMD-03 · Replace TouchableOpacity in DPad with Pressable + onPressIn/Out

**Severity:** `[CRITICAL]`  
**File:** `src/components/DPad.tsx`  
**Finding:** `TouchableOpacity` fires `onPress` after the gesture completes — typically 80–120ms after the finger makes contact. For a D-pad controlling a physical robot, this latency is felt. The correct primitive is `Pressable` with `onPressIn` (fire move command immediately on contact) and `onPressOut` (fire stop command on release). Additionally, the centre button currently renders a dead zone — it must send a `stop` command.

**Replace the entire `DPad.tsx` file with:**

```tsx
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
```

**Also update `ControlScreen.tsx`:** the `DPad` call must now pass `onRelease`:

```tsx
// Before
<DPad onPress={sendMove} disabled={!isConnected} />

// After
<DPad
  onPress={sendMove}
  onRelease={() => robotWS.send({ cmd: 'move', dir: 'stop' })}
  disabled={!isConnected}
/>
```

**Install expo-haptics** if not already present:

```bash
npx expo install expo-haptics
```

---

## CMD-04 · Fix ConnectScreen status pill — spinner and dot must not coexist

**Severity:** `[CRITICAL]`  
**File:** `src/screens/ConnectScreen.tsx`  
**Finding:** During connecting state, both the `ActivityIndicator` and the status dot render simultaneously. The dot becomes redundant noise next to a spinner. The rule is: show spinner OR dot, never both at the same time.

**Replace the status pill JSX block:**

```tsx
// BEFORE — both render during 'connecting'
<View style={[styles.statusPill, { borderColor: STATUS_COLOR[status] }]}>
  {status === 'connecting' && (
    <ActivityIndicator size="small" color={STATUS_COLOR[status]} style={{ marginRight: 8 }} />
  )}
  <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[status] }]} />
  <Text style={[styles.statusText, { color: STATUS_COLOR[status] }]}>
    {status.toUpperCase()}
  </Text>
</View>

// AFTER — exclusive render, sentence case text
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
```

---

## CMD-05 · Debounce ServoSlider to prevent WebSocket flooding

**Severity:** `[WARNING]`  
**File:** `src/components/ServoSlider.tsx`  
**Finding:** `onValueChange` fires at every slider tick — up to 60 events per second per slider. With 9 sliders, the theoretical maximum is 540 JSON messages per second. The ESP32's `AsyncWebSocket` handler and JSON parser cannot keep pace. Commands will be dropped and the calibration session will feel unreliable. A 50ms throttle reduces this to 20 msgs/sec per slider, still fast enough to feel live.

**Replace the `ServoSlider.tsx` file with:**

```tsx
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
```

**Why the flat row instead of the card wrapper:** 9 cards × ~76px each = 684px before header and buttons — this forces scrolling on most phones. The flat row design is 52px per channel, giving 468px total — comfortably on-screen on a 390pt iPhone 13.

---

## CMD-06 · Replace Unicode tab icons with vector icons

**Severity:** `[WARNING]`  
**File:** `src/navigation/AppNavigator.tsx`  
**Finding:** Unicode glyphs (⬡ ✛ ⊞ ◎ ⚙) render at inconsistent weights and baselines across Android and iOS. They do not receive colour tinting correctly from React Navigation's `tabBarActiveTintColor`. `@expo/vector-icons` is already included in the Expo SDK — zero extra install.

**At the top of `AppNavigator.tsx`, add the import:**

```tsx
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
```

**Replace the `icon` helper function and all `tabBarIcon` props:**

```tsx
// Remove this:
const icon = (label: string, focused: boolean, color: string) => (
  <Text style={{ fontSize: 18, color }}>{label}</Text>
);

// Replace all tabBarIcon entries with:

// Connect tab
tabBarIcon: ({ color, size }) => (
  <MaterialCommunityIcons name="wifi" size={22} color={color} />
)

// Control tab
tabBarIcon: ({ color, size }) => (
  <MaterialCommunityIcons name="gamepad-variant-outline" size={22} color={color} />
)

// Calibration tab
tabBarIcon: ({ color, size }) => (
  <MaterialCommunityIcons name="tune-variant" size={22} color={color} />
)

// Head tab
tabBarIcon: ({ color, size }) => (
  <MaterialCommunityIcons name="rotate-3d-variant" size={22} color={color} />
)

// Settings tab
tabBarIcon: ({ color, size }) => (
  <MaterialCommunityIcons name="cog-outline" size={22} color={color} />
)
```

**Also fix the active tint — blue only means movement in this app:**

```tsx
// Before
tabBarActiveTintColor: colors.accentMovement,

// After
tabBarActiveTintColor: '#FFFFFF',
tabBarInactiveTintColor: '#555970',
```

---

## CMD-07 · Add a persistent connection status dot to the Connect tab icon

**Severity:** `[WARNING]`  
**File:** `src/navigation/AppNavigator.tsx`  
**Finding:** When the robot disconnects while the user is on the Control screen, there is no visible signal. Status information must be permanently visible in the navigation chrome.

**Add this helper component inside `AppNavigator.tsx` (above the navigator):**

```tsx
import { useRobotStore } from '../store/useRobotStore';
import { colors } from '../theme/colors';

const STATUS_DOT_COLOR: Record<string, string> = {
  connected:    colors.statusConnected,
  connecting:   colors.statusConnecting,
  disconnected: colors.statusDisconnected,
  error:        colors.statusError,
};

function WifiIconWithStatus({ color }: { color: string }) {
  const status = useRobotStore((s) => s.status);
  const dotColor = STATUS_DOT_COLOR[status];
  return (
    <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}>
      <MaterialCommunityIcons name="wifi" size={22} color={color} />
      <View style={{
        position: 'absolute',
        bottom: 1,
        right: 1,
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: dotColor,
        borderWidth: 1.5,
        borderColor: colors.bgSurface,
      }} />
    </View>
  );
}
```

**Replace the Connect tab's `tabBarIcon`:**

```tsx
// Before
tabBarIcon: ({ color }) => (
  <MaterialCommunityIcons name="wifi" size={22} color={color} />
)

// After
tabBarIcon: ({ color }) => <WifiIconWithStatus color={color} />
```

---

## CMD-08 · Add haptic feedback to GaitButton and the Connect button

**Severity:** `[WARNING]`  
**Files:** `src/components/GaitButton.tsx`, `src/screens/ConnectScreen.tsx`  
**Finding:** Mode changes (gait switch, connect/disconnect) have no physical confirmation. Haptics is the single highest perceived-quality return for the least code.

**In `GaitButton.tsx`, add at the top:**

```tsx
import * as Haptics from 'expo-haptics';
```

**Wrap the `onPress` call:**

```tsx
// Before
onPress={onPress}

// After
onPress={() => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  onPress();
}}
```

**In `ConnectScreen.tsx`, update `handleConnect` and `handleDisconnect`:**

```tsx
import * as Haptics from 'expo-haptics';

const handleConnect = () => {
  robotWS.connect(ip, port);
  // success haptic fires in the onopen callback via setStatus → useEffect
};

// Add a useEffect to fire haptic on status change:
useEffect(() => {
  if (status === 'connected') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } else if (status === 'error') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
}, [status]);

const handleDisconnect = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  robotWS.disconnect();
  setStatus('disconnected');
};
```

---

## CMD-09 · Add Pressable scale feedback to the Connect / Disconnect button

**Severity:** `[WARNING]`  
**File:** `src/screens/ConnectScreen.tsx`  
**Finding:** The primary CTA button has no press animation — it just changes text. A `scale(0.97)` transform on press is the smallest change with the highest perceived-quality return.

**Replace `TouchableOpacity` buttons in `ConnectScreen` with `Pressable`:**

```tsx
// Disconnect button — replace TouchableOpacity
<Pressable
  style={({ pressed }) => [
    styles.btn,
    styles.btnDanger,
    pressed && { transform: [{ scale: 0.97 }] },
  ]}
  onPress={handleDisconnect}
>
  <Text style={[styles.btnText, { ...type.button }]}>Disconnect</Text>
</Pressable>

// Connect button — replace TouchableOpacity
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
  <Text style={[styles.btnText, { ...type.button }]}>
    {status === 'connecting' ? 'Connecting…' : 'Connect'}
  </Text>
</Pressable>
```

Note the ellipsis character `…` replacing `...` — correct typographic convention.

---

## CMD-10 · Implement the missing StatusBar component

**Severity:** `[WARNING]`  
**File:** `src/components/StatusBar.tsx` ← create this file (currently declared in §4 but unimplemented)  
**Finding:** The file appears in the project structure but has no code. A persistent header showing connection state, active gait, and ping is the highest-value missing component — it makes the app feel like a dashboard, not a form.

**Create `src/components/StatusBar.tsx`:**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
```

**Usage in `ControlScreen.tsx`:**

```tsx
import RobotStatusBar from '../components/StatusBar';

// Add just below the safe area view opening tag, before the screen heading:
<RobotStatusBar activeGait={activeGait} />
```

---

## CMD-11 · Remove SectionCard from project structure or implement it

**Severity:** `[INFO]`  
**File:** `src/components/SectionCard.tsx` and `§4 Project Structure` in `BUILD_INSTRUCTION.md`  
**Finding:** `SectionCard` appears in the declared project structure but has no implementation and is not imported anywhere. Either implement it or remove it from the structure declaration to avoid confusion.

**Option A — Remove (recommended if not immediately needed):**

Delete the `SectionCard.tsx` entry from the project tree in `BUILD_INSTRUCTION.md §4`.

**Option B — Implement a minimal version:**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
}

export default function SectionCard({ title, children }: SectionCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 0.5,
    borderColor: colors.border,
    gap: 12,
  },
  title: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textTertiary,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
});
```

---

## CMD-12 · Consider merging the Head tab into the Control screen

**Severity:** `[INFO]`  
**File:** `src/navigation/AppNavigator.tsx`  
**Finding:** iOS HIG specifies a hard maximum of 5 tabs. The app is currently at exactly 5. Adding any future screen (e.g. Telemetry for IMU/sonar data in Phase 8) would require removing a tab. Head control is the logical candidate to merge, as it is rarely adjusted mid-session once calibrated.

**Recommended approach:** Replace the standalone Head tab with a bottom sheet or a secondary segment on the Control screen:

```tsx
// Inside ControlScreen, after the DPad:
<View style={styles.headRow}>
  <Text style={styles.headRowLabel}>Head</Text>
  <Slider
    style={{ flex: 1, height: 36 }}
    minimumValue={0} maximumValue={180} step={1}
    value={headAngle}
    onValueChange={sendHead}
    minimumTrackTintColor={colors.accentHead}
    maximumTrackTintColor={colors.bgElevated}
    thumbTintColor={colors.accentHead}
  />
  <Text style={[styles.headAngleVal, { color: colors.accentHead }]}>{headAngle}°</Text>
</View>
```

This frees the 5th tab for Telemetry when sensors are added in Phase 8, without rearranging the navigation structure.

---

## Completion checklist

Work through commands in order. Mark each as done.

```
[ ] CMD-01  Separate status tokens from accent tokens
[ ] CMD-02  Fix type scale, remove ALL CAPS from interactive elements
[ ] CMD-03  DPad → Pressable + onPressIn/Out + stop centre
[ ] CMD-04  Status pill — spinner OR dot, not both
[ ] CMD-05  ServoSlider debounce to 50ms
[ ] CMD-06  Replace Unicode tab icons with MaterialCommunityIcons
[ ] CMD-07  Connection status dot on Connect tab icon
[ ] CMD-08  Haptic feedback — gait change, connect, disconnect
[ ] CMD-09  Connect button — Pressable scale press animation
[ ] CMD-10  Implement RobotStatusBar component
[ ] CMD-11  Resolve SectionCard declaration vs implementation
[ ] CMD-12  Evaluate merging Head tab into Control screen
```

After completing CMD-01 through CMD-04, do a visual pass with Expo Go. The app should feel noticeably closer to Linear quality before any styling work has touched the screens directly. Commands 05–12 are the polish layer on top of that corrected foundation.

---

*Prepared by [Biraj Sarkar](https://github.com/Biraj2004) · birajsarkar67@gmail.com*  
*Project: Quadruped Robot — CGEC 2023–27*
