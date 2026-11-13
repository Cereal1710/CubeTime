import type { ConnectionStatus, DeviceInfo, CubeMoveEvent } from '../types';
import { GanCubeAdapter } from './GanCubeAdapter';
import type { SmartCubeAdapter } from './SmartCubeAdapter';
import { cubeEngine } from '../cube/cubeEngine';
import { timerEngine } from '../timer/timerEngine';

export function isWebBluetoothSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'bluetooth' in navigator &&
    typeof (navigator as unknown as { bluetooth?: { requestDevice?: unknown } }).bluetooth?.requestDevice === 'function'
  );
}

export type ConnectionStateListener = (state: {
  status: ConnectionStatus;
  deviceInfo: DeviceInfo | null;
  lastEvent?: string;
  error?: string;
}) => void;

class SmartCubeManager {
  private adapter: SmartCubeAdapter;
  private status: ConnectionStatus = 'disconnected';
  private deviceInfo: DeviceInfo | null = null;
  private lastEvent?: string;
  private error?: string;
  private listeners: Set<ConnectionStateListener> = new Set();

  public autoStartOnCubeMove: boolean = true;
  public autoStopOnCubeSolved: boolean = true;

  constructor() {
    this.adapter = new GanCubeAdapter();
    if (!isWebBluetoothSupported()) {
      this.status = 'unsupported';
    }

    // Set up adapter listeners
    this.adapter.onMove((event: CubeMoveEvent) => {
      this.lastEvent = `Move: ${event.move}`;
      this.notify();

      // Update cube engine with move
      cubeEngine.applyMove(event.move, event.timestampMs);

      // Handle Timer Auto Start
      const timerState = timerEngine.getState();
      if (
        this.autoStartOnCubeMove &&
        (timerState === 'idle' || timerState === 'inspection' || timerState === 'ready')
      ) {
        timerEngine.startFromSmartCube();
      }

      // Handle Timer Auto Stop
      if (this.autoStopOnCubeSolved && timerEngine.getState() === 'running') {
        if (cubeEngine.isSolved()) {
          timerEngine.stop();
        }
      }
    });

    this.adapter.onFacelets((facelets: string) => {
      cubeEngine.setFacelets(facelets);
      if (this.autoStopOnCubeSolved && timerEngine.getState() === 'running') {
        if (cubeEngine.isSolved()) {
          timerEngine.stop();
        }
      }
    });

    this.adapter.onBattery((level: number) => {
      if (this.deviceInfo) {
        this.deviceInfo = { ...this.deviceInfo, batteryLevel: level };
      }
      this.lastEvent = `Battery: ${level}%`;
      this.notify();
    });

    this.adapter.onDisconnect(() => {
      this.status = 'disconnected';
      this.deviceInfo = null;
      this.lastEvent = 'Device disconnected';
      this.notify();
    });
  }

  subscribe(listener: ConnectionStateListener): () => void {
    this.listeners.add(listener);
    listener({
      status: this.status,
      deviceInfo: this.deviceInfo,
      lastEvent: this.lastEvent,
      error: this.error,
    });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const state = {
      status: this.status,
      deviceInfo: this.deviceInfo,
      lastEvent: this.lastEvent,
      error: this.error,
    };
    for (const l of this.listeners) {
      l(state);
    }
  }

  async connect(): Promise<void> {
    if (!isWebBluetoothSupported()) {
      this.status = 'unsupported';
      this.error = 'Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or an Android Chromium browser.';
      this.notify();
      return;
    }

    try {
      this.status = 'scanning';
      this.error = undefined;
      this.notify();

      await this.adapter.connect();

      this.status = 'connected';
      this.deviceInfo = await this.adapter.getDeviceInfo();
      this.lastEvent = 'Connected successfully';
      this.notify();
    } catch (err: unknown) {
      console.warn('Cube connection failed:', err);
      const message = err instanceof Error ? err.message : String(err);

      if (message.includes('User cancelled') || message.includes('cancelled')) {
        this.status = 'disconnected';
        this.error = 'Bluetooth device pairing was cancelled.';
      } else {
        this.status = 'error';
        this.error = message || 'Failed to connect to GAN Cube.';
      }
      this.notify();
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.adapter.disconnect();
    } finally {
      this.status = 'disconnected';
      this.deviceInfo = null;
      this.lastEvent = 'Disconnected';
      this.notify();
    }
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  getDeviceInfo(): DeviceInfo | null {
    return this.deviceInfo;
  }
}

export const smartCubeManager = new SmartCubeManager();

