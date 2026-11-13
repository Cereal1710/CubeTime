import type { CubeMoveEvent, DeviceInfo } from '../types';

export type Unsubscribe = () => void;

export interface SmartCubeAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getDeviceInfo(): Promise<DeviceInfo | null>;
  getCurrentFacelets(): Promise<string | null>;
  onMove(callback: (event: CubeMoveEvent) => void): Unsubscribe;
  onFacelets(callback: (facelets: string) => void): Unsubscribe;
  onBattery(callback: (level: number) => void): Unsubscribe;
  onDisconnect(callback: () => void): Unsubscribe;
  getBatteryLevel(): Promise<number | null>;
  isConnected(): boolean;
}

