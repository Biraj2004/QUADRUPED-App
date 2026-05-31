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
  setServoOffsets: (offsets: number[]) => void;
  setStepHeight: (v: number) => void;
  setGaitSpeed: (v: number) => void;
}

export const useRobotStore = create<RobotState>((set) => ({
  ip: '192.168.4.1', // Default to ESP32 Access Point IP
  port: 80,          // Default to HTTP/WS port 80
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
  setServoOffsets: (servoOffsets) => set({ servoOffsets }),
  setStepHeight: (stepHeight) => set({ stepHeight }),
  setGaitSpeed: (gaitSpeed) => set({ gaitSpeed }),
}));
