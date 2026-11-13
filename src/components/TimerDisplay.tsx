import React, { useEffect, useState, useRef, useCallback } from 'react';
import type { Penalty, TimerState } from '../types';
import { timerEngine } from '../timer/timerEngine';
import { formatTime } from '../statistics/averages';
import { useSettingsStore } from '../stores/useSettingsStore';

interface TimerDisplayProps {
  onSolveComplete: (rawTimeMs: number, penalty: Penalty) => void;
  className?: string;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  onSolveComplete,
  className = '',
}) => {
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [displayMs, setDisplayMs] = useState<number>(0);
  const [inspectionText, setInspectionText] = useState<string>('');
  const { precision, inspection } = useSettingsStore();

  const isSpaceDownRef = useRef(false);

  useEffect(() => {
    const unsubscribe = timerEngine.subscribe({
      onStateChange: (state) => {
        setTimerState(state);
      },
      onTimeUpdate: (ms) => {
        setDisplayMs(ms);
      },
      onInspectionTick: (_secondsLeft, statusText) => {
        setInspectionText(statusText);
      },
      onSolveComplete: (rawTimeMs, penalty) => {
        onSolveComplete(rawTimeMs, penalty);
      },
    });

    return () => {
      unsubscribe();
    };
  }, [onSolveComplete]);

  // Keyboard Event Listener
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea or dialog
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.code === 'Escape') {
        timerEngine.cancel();
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (!isSpaceDownRef.current) {
          isSpaceDownRef.current = true;
          timerEngine.handleTriggerDown();
        }
      }
    },
    []
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        isSpaceDownRef.current = false;
        timerEngine.handleTriggerUp();
      }
    },
    []
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Touch Handlers for Mobile / Touch screens
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only respond to primary mouse click or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    timerEngine.handleTriggerDown();
  };

  const handlePointerUp = () => {
    timerEngine.handleTriggerUp();
  };

  // Color selection based on state
  const getTimerColorClass = () => {
    switch (timerState) {
      case 'holding':
        return 'text-danger scale-[0.98] transition-transform';
      case 'ready':
        return 'text-success scale-105 transition-transform';
      case 'inspection':
        return 'text-warning';
      case 'running':
        return 'text-primary';
      case 'stopped':
      case 'idle':
      default:
        return 'text-text';
    }
  };

  const getSubheaderMessage = () => {
    switch (timerState) {
      case 'holding':
        return 'Hold to ready...';
      case 'ready':
        return 'RELEASE TO START';
      case 'inspection':
        return `INSPECTION — ${inspectionText}`;
      case 'running':
        return 'SOLVING... (Press space or tap anywhere to stop)';
      case 'stopped':
        return 'SOLVE COMPLETE';
      case 'idle':
      default:
        if (inspection > 0) {
          return 'Hold Space or Tap to start inspection';
        }
        return 'Hold Space or Tap to ready';
    }
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`relative w-full flex flex-col items-center justify-center cursor-pointer select-none py-10 md:py-16 rounded-2xl transition-colors ${className}`}
    >
      {/* State Status Banner */}
      <div className="mb-3 h-7 flex items-center">
        <span
          className={`text-xs md:text-sm font-semibold tracking-widest uppercase transition-opacity ${
            timerState === 'ready'
              ? 'text-success animate-bounce'
              : timerState === 'holding'
              ? 'text-danger'
              : timerState === 'inspection'
              ? 'text-warning'
              : timerState === 'running'
              ? 'text-primary opacity-80'
              : 'text-text-muted opacity-70'
          }`}
        >
          {getSubheaderMessage()}
        </span>
      </div>

      {/* Main Big Numeric Timer */}
      <div
        className={`font-mono text-7xl sm:text-8xl md:text-9xl lg:text-[10.5rem] font-extrabold tracking-tight tabular-nums select-none ${getTimerColorClass()}`}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {timerState === 'inspection'
          ? inspectionText
          : formatTime(displayMs, precision)}
      </div>

      {/* Subtle touch hint */}
      <div className="mt-4 text-[11px] text-text-muted/60 text-center pointer-events-none">
        {timerState === 'idle' && (
          <span>Press [Space] on keyboard or touch anywhere</span>
        )}
      </div>
    </div>
  );
};

