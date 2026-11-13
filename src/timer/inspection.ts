import type { InspectionTime, Penalty } from '../types';

export interface InspectionResult {
  penalty: Penalty;
  elapsedMs: number;
}

export type InspectionCallback = (secondsLeft: number, statusText: string) => void;

export class InspectionTimer {
  private startTime: number = 0;
  private durationSec: number = 15;
  private timerId: number | null = null;
  private onTick: InspectionCallback | null = null;

  start(durationSec: InspectionTime, onTick?: InspectionCallback): void {
    this.stop();
    this.durationSec = durationSec;
    this.startTime = performance.now();
    this.onTick = onTick || null;

    if (this.onTick) {
      this.onTick(this.durationSec, `${this.durationSec}`);
    }

    this.timerId = window.setInterval(() => {
      const elapsedSec = (performance.now() - this.startTime) / 1000;
      const remainingSec = Math.max(0, Math.ceil(this.durationSec - elapsedSec));

      let status = `${remainingSec}`;
      if (this.durationSec === 15) {
        if (elapsedSec >= 15 && elapsedSec <= 17) {
          status = '+2 Penalty';
        } else if (elapsedSec > 17) {
          status = 'DNF';
        } else if (elapsedSec >= 12) {
          status = '12s (Go!)';
        } else if (elapsedSec >= 8) {
          status = '8s';
        }
      }

      if (this.onTick) {
        this.onTick(remainingSec, status);
      }
    }, 100);
  }

  stop(): InspectionResult {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }

    if (this.startTime === 0) {
      return { penalty: 'none', elapsedMs: 0 };
    }

    const elapsedMs = performance.now() - this.startTime;
    const elapsedSec = elapsedMs / 1000;

    let penalty: Penalty = 'none';
    if (this.durationSec > 0) {
      if (elapsedSec > 17) {
        penalty = 'dnf';
      } else if (elapsedSec > 15) {
        penalty = 'plus2';
      }
    }

    this.startTime = 0;
    return { penalty, elapsedMs };
  }

  cancel(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.startTime = 0;
  }
}

