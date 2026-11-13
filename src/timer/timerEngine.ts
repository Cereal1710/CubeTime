import type { Penalty, TimerState, InspectionTime } from '../types';
import { InspectionTimer } from './inspection';

export interface TimerListener {
  onStateChange: (state: TimerState) => void;
  onTimeUpdate: (elapsedMs: number) => void;
  onInspectionTick: (secondsLeft: number, statusText: string) => void;
  onSolveComplete: (rawTimeMs: number, penalty: Penalty) => void;
}

export class TimerEngine {
  private state: TimerState = 'idle';
  private startTime: number = 0;
  private elapsedMs: number = 0;
  private animFrameId: number | null = null;
  private holdTimeoutId: number | null = null;
  private inspectionTimer = new InspectionTimer();
  private pendingPenalty: Penalty = 'none';
  private isHoldingFromInspection: boolean = false;

  // Configurable options
  public holdToReadyMs: number = 300;
  public inspectionTime: InspectionTime = 0;

  private listeners: Set<TimerListener> = new Set();

  getState(): TimerState {
    return this.state;
  }

  getElapsedMs(): number {
    if (this.state === 'running') {
      return performance.now() - this.startTime;
    }
    return this.elapsedMs;
  }

  subscribe(listener: TimerListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setState(newState: TimerState): void {
    this.state = newState;
    for (const l of this.listeners) {
      l.onStateChange(newState);
    }
  }

  private updateTime(ms: number): void {
    this.elapsedMs = ms;
    for (const l of this.listeners) {
      l.onTimeUpdate(ms);
    }
  }

  /**
   * Called on Space down or Touch down
   */
  handleTriggerDown(): void {
    if (this.state === 'running') {
      this.stop();
      return;
    }

    if (this.state === 'idle' || this.state === 'stopped') {
      if (this.inspectionTime > 0) {
        // Start inspection directly on tap/press if in idle/stopped
        this.startInspection();
        return;
      }

      this.isHoldingFromInspection = false;
      this.startHolding();
      return;
    }

    if (this.state === 'inspection') {
      this.isHoldingFromInspection = true;
      this.startHolding();
      return;
    }
  }

  /**
   * Called on Space up or Touch up
   */
  handleTriggerUp(): void {
    if (this.holdTimeoutId !== null) {
      clearTimeout(this.holdTimeoutId);
      this.holdTimeoutId = null;
    }

    if (this.state === 'holding') {
      // Released too early (didn't reach ready)
      if (this.isHoldingFromInspection) {
        this.setState('inspection');
      } else {
        this.setState('idle');
      }
      return;
    }

    if (this.state === 'ready') {
      this.startRunning();
      return;
    }
  }

  private startHolding(): void {
    this.setState('holding');
    this.holdTimeoutId = window.setTimeout(() => {
      if (this.state === 'holding') {
        this.setState('ready');
      }
    }, this.holdToReadyMs);
  }

  private startInspection(): void {
    this.setState('inspection');
    this.updateTime(0);
    this.pendingPenalty = 'none';

    this.inspectionTimer.start(this.inspectionTime, (secondsLeft, statusText) => {
      for (const l of this.listeners) {
        l.onInspectionTick(secondsLeft, statusText);
      }
    });
  }

  private startRunning(): void {
    if (this.state === 'ready') {
      const inspResult = this.inspectionTimer.stop();
      this.pendingPenalty = inspResult.penalty;
    }

    this.startTime = performance.now();
    this.setState('running');

    const tick = () => {
      if (this.state !== 'running') return;
      const current = performance.now() - this.startTime;
      this.updateTime(current);
      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  /**
   * External start (e.g. Smart Cube first move)
   */
  startFromSmartCube(): void {
    if (this.state === 'running') return;
    if (this.state === 'inspection' || this.state === 'ready') {
      const inspResult = this.inspectionTimer.stop();
      this.pendingPenalty = inspResult.penalty;
    } else {
      this.pendingPenalty = 'none';
    }

    this.startTime = performance.now();
    this.setState('running');

    const tick = () => {
      if (this.state !== 'running') return;
      const current = performance.now() - this.startTime;
      this.updateTime(current);
      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  /**
   * Stop running timer
   */
  stop(): void {
    if (this.state !== 'running') return;

    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    const finalRawTimeMs = Math.round(performance.now() - this.startTime);
    this.updateTime(finalRawTimeMs);
    this.setState('stopped');

    const penalty = this.pendingPenalty;
    this.pendingPenalty = 'none';

    for (const l of this.listeners) {
      l.onSolveComplete(finalRawTimeMs, penalty);
    }
  }

  /**
   * Cancel inspection or holding
   */
  cancel(): void {
    if (this.holdTimeoutId !== null) {
      clearTimeout(this.holdTimeoutId);
      this.holdTimeoutId = null;
    }
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.inspectionTimer.cancel();
    this.pendingPenalty = 'none';
    this.isHoldingFromInspection = false;
    this.setState('idle');
  }

  resetTime(): void {
    this.updateTime(0);
  }
}

export const timerEngine = new TimerEngine();
