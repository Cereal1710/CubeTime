import { connectGanCube, type GanCubeConnection, type GanCubeEvent } from 'gan-web-bluetooth';
import type { Subscription } from 'rxjs';
import type { SmartCubeAdapter, Unsubscribe } from './SmartCubeAdapter';
import type { CubeMoveEvent, DeviceInfo } from '../types';

export class GanCubeAdapter implements SmartCubeAdapter {
  private connection: GanCubeConnection | null = null;
  private subscription: Subscription | null = null;
  private currentDeviceInfo: DeviceInfo | null = null;
  private currentFacelets: string | null = null;
  private batteryLevel: number | null = null;

  private moveCallbacks: Set<(event: CubeMoveEvent) => void> = new Set();
  private faceletsCallbacks: Set<(facelets: string) => void> = new Set();
  private batteryCallbacks: Set<(level: number) => void> = new Set();
  private disconnectCallbacks: Set<() => void> = new Set();

  isConnected(): boolean {
    return this.connection !== null;
  }

  async connect(): Promise<void> {
    if (this.connection) {
      await this.disconnect();
    }

    // Call gan-web-bluetooth connection initializer
    // This triggers navigator.bluetooth.requestDevice
    const connection = await connectGanCube();
    this.connection = connection;

    this.currentDeviceInfo = {
      name: connection.deviceName || 'GAN Smart Cube',
      mac: connection.deviceMAC || undefined,
      batteryLevel: null,
    };

    // Subscribe to GAN cube events
    this.subscription = connection.events$.subscribe({
      next: (event: GanCubeEvent) => {
        this.handleEvent(event);
      },
      error: (err: unknown) => {
        console.error('GAN Cube event stream error:', err);
        this.handleDisconnect();
      },
      complete: () => {
        this.handleDisconnect();
      }
    });

    // Request initial hardware, battery, and facelets information
    try {
      await connection.sendCubeCommand({ type: 'REQUEST_HARDWARE' });
      await connection.sendCubeCommand({ type: 'REQUEST_BATTERY' });
      await connection.sendCubeCommand({ type: 'REQUEST_FACELETS' });
    } catch (e) {
      console.warn('Failed to send initial diagnostic commands to GAN cube:', e);
    }
  }

  private handleEvent(event: GanCubeEvent): void {
    switch (event.type) {
      case 'MOVE': {
        const moveEvent: CubeMoveEvent = {
          move: event.move,
          timestampMs: event.localTimestamp ?? performance.now()
        };
        for (const cb of this.moveCallbacks) {
          cb(moveEvent);
        }
        break;
      }

      case 'FACELETS': {
        this.currentFacelets = event.facelets;
        for (const cb of this.faceletsCallbacks) {
          cb(event.facelets);
        }
        break;
      }

      case 'BATTERY': {
        this.batteryLevel = event.batteryLevel;
        if (this.currentDeviceInfo) {
          this.currentDeviceInfo.batteryLevel = event.batteryLevel;
        }
        for (const cb of this.batteryCallbacks) {
          cb(event.batteryLevel);
        }
        break;
      }

      case 'HARDWARE': {
        if (this.currentDeviceInfo) {
          this.currentDeviceInfo.hardwareName = event.hardwareName;
          this.currentDeviceInfo.hardwareVersion = event.hardwareVersion;
          this.currentDeviceInfo.softwareVersion = event.softwareVersion;
          this.currentDeviceInfo.productDate = event.productDate;
          this.currentDeviceInfo.gyroSupported = event.gyroSupported;
        }
        break;
      }

      case 'DISCONNECT': {
        this.handleDisconnect();
        break;
      }
    }
  }

  private handleDisconnect(): void {
    if (!this.connection) return;
    this.cleanUp();
    for (const cb of this.disconnectCallbacks) {
      cb();
    }
  }

  private cleanUp(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.connection = null;
    this.currentDeviceInfo = null;
    this.currentFacelets = null;
    this.batteryLevel = null;
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.disconnect();
      } catch (e) {
        console.warn('Error during GAN cube disconnect:', e);
      }
    }
    this.cleanUp();
  }

  async getDeviceInfo(): Promise<DeviceInfo | null> {
    return this.currentDeviceInfo;
  }

  async getCurrentFacelets(): Promise<string | null> {
    return this.currentFacelets;
  }

  async getBatteryLevel(): Promise<number | null> {
    return this.batteryLevel;
  }

  onMove(callback: (event: CubeMoveEvent) => void): Unsubscribe {
    this.moveCallbacks.add(callback);
    return () => {
      this.moveCallbacks.delete(callback);
    };
  }

  onFacelets(callback: (facelets: string) => void): Unsubscribe {
    this.faceletsCallbacks.add(callback);
    return () => {
      this.faceletsCallbacks.delete(callback);
    };
  }

  onBattery(callback: (level: number) => void): Unsubscribe {
    this.batteryCallbacks.add(callback);
    return () => {
      this.batteryCallbacks.delete(callback);
    };
  }

  onDisconnect(callback: () => void): Unsubscribe {
    this.disconnectCallbacks.add(callback);
    return () => {
      this.disconnectCallbacks.delete(callback);
    };
  }
}

