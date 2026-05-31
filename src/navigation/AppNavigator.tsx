import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../theme/colors';
import { useRobotStore } from '../store/useRobotStore';

import ConnectScreen    from '../screens/ConnectScreen';
import ControlScreen    from '../screens/ControlScreen';
import CalibrationScreen from '../screens/CalibrationScreen';
import HeadScreen       from '../screens/HeadScreen';
import SettingsScreen   from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

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
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#555970',
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tab.Screen
        name="Connect"
        component={ConnectScreen}
        options={{
          tabBarIcon: ({ color }) => <WifiIconWithStatus color={color} />,
          tabBarLabel: 'Connect',
        }}
      />
      <Tab.Screen
        name="Control"
        component={ControlScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="gamepad-variant-outline" size={22} color={color} />
          ),
          tabBarLabel: 'Control',
        }}
      />
      <Tab.Screen
        name="Calibration"
        component={CalibrationScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="tune-variant" size={22} color={color} />
          ),
          tabBarLabel: 'Calibrate',
        }}
      />
      <Tab.Screen
        name="Head"
        component={HeadScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="rotate-3d-variant" size={22} color={color} />
          ),
          tabBarLabel: 'Head',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="cog-outline" size={22} color={color} />
          ),
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
}
