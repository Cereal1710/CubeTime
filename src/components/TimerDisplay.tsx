import React, { useEffect, useState, useRef, useCallback } from 'react';
import type { Penalty, TimerState } from '../types';
import { timerEngine } from '../timer/timerEngine';
import { formatTime } from '../statistics/averages';
import { useSettingsStore } from '../stores/useSettingsStore';
import { sound } from '../utils/sound';

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
  const [isLeftDown, setIsLeftDown] = useState<boolean>(false);
  const [isRightDown, setIsRightDown] = useState<boolean>(false);

  const { precision, inspection, holdToReadyMs } = useSettingsStore();

  const leftDownRef = useRef(false);
  const rightDownRef = useRef(false);
  const bothDownRef = useRef(false);

  useEffect(() => {
    // Ensure timerEngine has current settings
    timerEngine.holdToReadyMs = holdToReadyMs || 500;
    timerEngine.inspectionTime = inspection;

    const unsubscribe = timerEngine.subscribe({
      onStateChange: (state) => {
        setTimerState(state);
        if (state === 'ready') {
          sound.playMoveTick();
        } else if (state === 'running') {
          sound.playStartBeep();
        }
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
  }, [onSolveComplete, holdToReadyMs, inspection]);

  // Check if both triggers are down
  const updateBothTriggers = useCallback(() => {
    const isBoth = leftDownRef.current && rightDownRef.current;
    if (isBoth && !bothDownRef.current) {
      bothDownRef.current = true;
      timerEngine.handleTriggerDown();
    } else if (!isBoth && bothDownRef.current) {
      bothDownRef.current = false;
      timerEngine.handleTriggerUp();
    }
  }, []);

  // Keyboard Event Handlers
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
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
        leftDownRef.current = false;
        rightDownRef.current = false;
        bothDownRef.current = false;
        setIsLeftDown(false);
        setIsRightDown(false);
        return;
      }

      // Track Left Shift and Right Shift keys (both required to start & stop)
      if (e.code === 'ShiftLeft') {
        e.preventDefault();
        if (!leftDownRef.current) {
          leftDownRef.current = true;
          setIsLeftDown(true);
          updateBothTriggers();
        }
      } else if (e.code === 'ShiftRight') {
        e.preventDefault();
        if (!rightDownRef.current) {
          rightDownRef.current = true;
          setIsRightDown(true);
          updateBothTriggers();
        }
      }
    },
    [updateBothTriggers]
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

      if (e.code === 'ShiftLeft') {
        e.preventDefault();
        leftDownRef.current = false;
        setIsLeftDown(false);
        updateBothTriggers();
      } else if (e.code === 'ShiftRight') {
        e.preventDefault();
        rightDownRef.current = false;
        setIsRightDown(false);
        updateBothTriggers();
      }
    },
    [updateBothTriggers]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Touch screen multi-touch anywhere on the main area
  const handleTouchStart = (e: React.TouchEvent) => {
    // 2-finger touch automatically engages both hands!
    if (e.touches.length >= 2) {
      leftDownRef.current = true;
      rightDownRef.current = true;
      setIsLeftDown(true);
      setIsRightDown(true);
      updateBothTriggers();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      leftDownRef.current = false;
      rightDownRef.current = false;
      setIsLeftDown(false);
      setIsRightDown(false);
      updateBothTriggers();
    }
  };

  // Stackmat Pad click/touch triggers (Left pad and Right pad)
  const handleLeftPadDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    leftDownRef.current = true;
    setIsLeftDown(true);
    updateBothTriggers();
  };

  const handleLeftPadUp = (e: React.PointerEvent) => {
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
    leftDownRef.current = false;
    setIsLeftDown(false);
    updateBothTriggers();
  };

  const handleRightPadDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    rightDownRef.current = true;
    setIsRightDown(true);
    updateBothTriggers();
  };

  const handleRightPadUp = (e: React.PointerEvent) => {
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
    rightDownRef.current = false;
    setIsRightDown(false);
    updateBothTriggers();
  };

  // Color selection based on timer state
  const getTimerColorClass = () => {
    switch (timerState) {
      case 'holding':
        return 'text-danger scale-[0.98] transition-transform drop-shadow-[0_0_20px_rgba(239,68,68,0.3)]';
      case 'ready':
        return 'text-success scale-105 transition-transform drop-shadow-[0_0_25px_rgba(34,197,94,0.4)]';
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
        return 'GIỮ 500MS ĐỂ SẴN SÀNG...';
      case 'ready':
        if (inspection > 0 && timerEngine.getElapsedMs() === 0 && !inspectionText) {
          return '🟢 SẴN SÀNG — THẢ TAY ĐỂ BẮT ĐẦU INSPECTION!';
        }
        return '🟢 SẴN SÀNG — THẢ TAY ĐỂ BẮT ĐẦU TÍNH GIỜ!';
      case 'inspection':
        return `INSPECTION — ${inspectionText}`;
      case 'running':
        return 'ĐANG GIẢI... (ĐẶT CẢ 2 TAY LÊN L-SHIFT VÀ R-SHIFT ĐỂ DỪNG GIỜ)';
      case 'stopped':
        return 'HOÀN THÀNH LƯỢT GIẢI';
      case 'idle':
      default:
        if (inspection > 0) {
          return 'GIỮ ĐỒNG THỜI 2 NÚT L-SHIFT VÀ R-SHIFT (500MS) ĐỂ INSPECTION';
        }
        return 'GIỮ ĐỒNG THỜI 2 NÚT L-SHIFT VÀ R-SHIFT (500MS) ĐỂ SẴN SÀNG';
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full flex flex-col items-center justify-center select-none py-6 md:py-10 rounded-2xl transition-colors ${className}`}
    >
      {/* State Status Banner */}
      <div className="mb-2 h-7 flex items-center text-center px-4">
        <span
          className={`text-xs md:text-sm font-bold tracking-wider uppercase transition-all ${
            timerState === 'ready'
              ? 'text-success animate-bounce'
              : timerState === 'holding'
              ? 'text-danger'
              : timerState === 'inspection'
              ? 'text-warning'
              : timerState === 'running'
              ? 'text-primary opacity-80'
              : 'text-text-muted opacity-80'
          }`}
        >
          {getSubheaderMessage()}
        </span>
      </div>

      {/* Main Big Numeric Timer */}
      <div
        className={`font-mono text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] font-extrabold tracking-tight tabular-nums select-none ${getTimerColorClass()}`}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {timerState === 'inspection'
          ? inspectionText
          : formatTime(displayMs, precision)}
      </div>

      {/* Dual Shift / Stackmat Two-Hand Pads */}
      <div className="mt-6 w-full max-w-lg flex items-center justify-between gap-4 px-4">
        {/* Left Hand Pad (L-Shift) */}
        <div
          onPointerDown={handleLeftPadDown}
          onPointerUp={handleLeftPadUp}
          onPointerLeave={handleLeftPadUp}
          onPointerCancel={handleLeftPadUp}
          className={`flex-1 p-3.5 rounded-2xl border-2 flex flex-col items-center justify-center cursor-pointer touch-none transition-all ${
            isLeftDown
              ? timerState === 'ready'
                ? 'bg-success/20 border-success text-success shadow-lg shadow-success/20 scale-[0.98]'
                : 'bg-danger/20 border-danger text-danger shadow-lg shadow-danger/20 scale-[0.98]'
              : 'bg-surface hover:bg-surface-elevated border-border text-text-muted'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isLeftDown ? (timerState === 'ready' ? 'bg-success' : 'bg-danger') : 'bg-border'}`} />
            <span className="font-bold text-sm">Tay Trái</span>
          </div>
          <span className="text-[11px] font-mono mt-1 opacity-80">[L-Shift]</span>
        </div>

        {/* Center Hand Status Indicator */}
        <div className="shrink-0 flex flex-col items-center justify-center px-2">
          {isLeftDown && isRightDown ? (
            <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              timerState === 'ready' ? 'bg-success text-background animate-pulse' : 'bg-danger text-background'
            }`}>
              {timerState === 'ready' ? 'READY (THẢ RA)' : 'GIỮ 500MS...'}
            </div>
          ) : isLeftDown || isRightDown ? (
            <div className="px-2.5 py-1 rounded-full bg-warning/20 border border-warning/40 text-warning text-[10px] font-semibold text-center">
              CẦN CẢ 2 TAY
            </div>
          ) : (
            <div className="text-[10px] text-text-muted/60 text-center font-medium">
              STACKMAT
            </div>
          )}
        </div>

        {/* Right Hand Pad (R-Shift) */}
        <div
          onPointerDown={handleRightPadDown}
          onPointerUp={handleRightPadUp}
          onPointerLeave={handleRightPadUp}
          onPointerCancel={handleRightPadUp}
          className={`flex-1 p-3.5 rounded-2xl border-2 flex flex-col items-center justify-center cursor-pointer touch-none transition-all ${
            isRightDown
              ? timerState === 'ready'
                ? 'bg-success/20 border-success text-success shadow-lg shadow-success/20 scale-[0.98]'
                : 'bg-danger/20 border-danger text-danger shadow-lg shadow-danger/20 scale-[0.98]'
              : 'bg-surface hover:bg-surface-elevated border-border text-text-muted'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isRightDown ? (timerState === 'ready' ? 'bg-success' : 'bg-danger') : 'bg-border'}`} />
            <span className="font-bold text-sm">Tay Phải</span>
          </div>
          <span className="text-[11px] font-mono mt-1 opacity-80">[R-Shift]</span>
        </div>
      </div>

      {/* Helpful Hint Footer */}
      <div className="mt-3 text-[11px] text-text-muted/70 text-center">
        <span>Bắt đầu & Dừng: Giữ đồng thời cả 2 phím <strong>L-Shift</strong> và <strong>R-Shift</strong> (Mô phỏng Stackmat thi đấu)</span>
      </div>
    </div>
  );
};
