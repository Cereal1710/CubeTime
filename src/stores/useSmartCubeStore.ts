import { create } from 'zustand';
import type { ConnectionStatus, DeviceInfo } from '../types';
import { smartCubeManager, isWebBluetoothSupported } from '../bluetooth/connection';

interface SmartCubeStoreState {
  status: ConnectionStatus;
  deviceInfo: DeviceInfo | null;
  lastEvent?: string;
  error?: string;
  isSupported: boolean;

  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export const useSmartCubeStore = create<SmartCubeStoreState>((set) => {
  const supported = isWebBluetoothSupported();

  // Subscribe to smart cube manager events
  smartCubeManager.subscribe((state) => {
    set({
      status: state.status,
      deviceInfo: state.deviceInfo,
      lastEvent: state.lastEvent,
      error: state.error,
    });
  });

  return {
    status: supported ? 'disconnected' : 'unsupported',
    deviceInfo: null,
    lastEvent: undefined,
    error: supported ? undefined : 'Web Bluetooth is not supported in this browser.',
    isSupported: supported,

    connect: async () => {
      await smartCubeManager.connect();
    },

    disconnect: async () => {
      await smartCubeManager.disconnect();
    }
  };
});

