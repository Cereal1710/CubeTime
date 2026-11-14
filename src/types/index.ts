export type Penalty = 'none' | 'plus2' | 'dnf';

export interface CubeMoveEvent {
  move: string;
  timestampMs: number;
}

export interface Solve {
  id: string;
  sessionId: string;
  puzzle: '333';
  rawTimeMs: number;
  penalty: Penalty;
  scramble: string;
  source: 'keyboard' | 'smart-cube';
  createdAt: string; // ISO string
  moves?: CubeMoveEvent[];
  note?: string;
}

export interface Session {
  id: string;
  name: string;
  puzzle: string;
  createdAt: string;
}

export type InspectionTime = 0 | 15 | 17;
export type TimerPrecision = 'hundredths' | 'thousandths';
export type TimerTriggerMode = 'dual-shift' | 'space';

export interface AppSettings {
  inspection: InspectionTime;
  precision: TimerPrecision;
  holdToReadyMs: number;
  triggerMode: TimerTriggerMode;
  soundEnabled: boolean;
  autoStartOnCubeMove: boolean;
  autoStopOnCubeSolved: boolean;
  accentColor: string;
  show3DPreview: boolean;
}

export type ConnectionStatus =
  | 'disconnected'
  | 'scanning'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'unsupported'
  | 'error';

export interface DeviceInfo {
  name: string;
  mac?: string;
  batteryLevel?: number | null;
  hardwareName?: string;
  hardwareVersion?: string;
  softwareVersion?: string;
  productDate?: string;
  gyroSupported?: boolean;
}

export type TimerState =
  | 'idle'
  | 'holding'
  | 'ready'
  | 'inspection'
  | 'running'
  | 'stopped';

