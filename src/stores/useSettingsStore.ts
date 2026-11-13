import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings, InspectionTime, TimerPrecision } from '../types';
import { timerEngine } from '../timer/timerEngine';
import { smartCubeManager } from '../bluetooth/connection';

interface SettingsStore extends AppSettings {
  setInspection: (val: InspectionTime) => void;
  setPrecision: (val: TimerPrecision) => void;
  setHoldToReadyMs: (val: number) => void;
  setSoundEnabled: (val: boolean) => void;
  setAutoStartOnCubeMove: (val: boolean) => void;
  setAutoStopOnCubeSolved: (val: boolean) => void;
  setAccentColor: (val: string) => void;
  setShow3DPreview: (val: boolean) => void;
  resetDefaults: () => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  inspection: 15,
  precision: 'hundredths',
  holdToReadyMs: 500,
  soundEnabled: true,
  autoStartOnCubeMove: true,
  autoStopOnCubeSolved: true,
  accentColor: '#38BDF8',
  show3DPreview: true,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setInspection: (inspection) => {
        timerEngine.inspectionTime = inspection;
        set({ inspection });
      },

      setPrecision: (precision) => set({ precision }),

      setHoldToReadyMs: (holdToReadyMs) => {
        timerEngine.holdToReadyMs = holdToReadyMs;
        set({ holdToReadyMs });
      },

      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),

      setAutoStartOnCubeMove: (autoStartOnCubeMove) => {
        smartCubeManager.autoStartOnCubeMove = autoStartOnCubeMove;
        set({ autoStartOnCubeMove });
      },

      setAutoStopOnCubeSolved: (autoStopOnCubeSolved) => {
        smartCubeManager.autoStopOnCubeSolved = autoStopOnCubeSolved;
        set({ autoStopOnCubeSolved });
      },

      setAccentColor: (accentColor) => set({ accentColor }),

      setShow3DPreview: (show3DPreview) => set({ show3DPreview }),

      resetDefaults: () => {
        const d = DEFAULT_SETTINGS;
        timerEngine.inspectionTime = d.inspection;
        timerEngine.holdToReadyMs = d.holdToReadyMs;
        smartCubeManager.autoStartOnCubeMove = d.autoStartOnCubeMove;
        smartCubeManager.autoStopOnCubeSolved = d.autoStopOnCubeSolved;
        set({ ...d });
      }
    }),
    {
      name: 'cubetime-settings',
      onRehydrateStorage: () => (state) => {
        if (state) {
          timerEngine.inspectionTime = state.inspection;
          timerEngine.holdToReadyMs = state.holdToReadyMs;
          smartCubeManager.autoStartOnCubeMove = state.autoStartOnCubeMove;
          smartCubeManager.autoStopOnCubeSolved = state.autoStopOnCubeSolved;
        }
      }
    }
  )
);
