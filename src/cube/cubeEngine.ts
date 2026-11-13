import { CubeState } from './cubeState';
import type { CubeMoveEvent } from '../types';

export type CubeStateListener = (facelets: string, isSolved: boolean) => void;

export class CubeEngine {
  private state: CubeState;
  private listeners: Set<CubeStateListener> = new Set();
  private moveHistory: CubeMoveEvent[] = [];

  constructor() {
    this.state = new CubeState();
  }

  getState(): CubeState {
    return this.state.clone();
  }

  getFacelets(): string {
    return this.state.getFaceletsString();
  }

  isSolved(): boolean {
    return this.state.isSolved();
  }

  subscribe(listener: CubeStateListener): () => void {
    this.listeners.add(listener);
    listener(this.getFacelets(), this.isSolved());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const facelets = this.getFacelets();
    const solved = this.isSolved();
    for (const listener of this.listeners) {
      listener(facelets, solved);
    }
  }

  reset(): void {
    this.state.reset();
    this.moveHistory = [];
    this.notify();
  }

  applyScramble(scramble: string): void {
    this.state.reset();
    this.state.applyMoves(scramble);
    this.moveHistory = [];
    this.notify();
  }

  applyMove(move: string, timestampMs?: number): void {
    this.state.applyMove(move);
    this.moveHistory.push({
      move,
      timestampMs: timestampMs ?? performance.now()
    });
    this.notify();
  }

  setFacelets(facelets: string): void {
    this.state.setFromFacelets(facelets);
    this.notify();
  }

  getMoveHistory(): CubeMoveEvent[] {
    return [...this.moveHistory];
  }
}

export const cubeEngine = new CubeEngine();
