import { CubeState } from './cubeState';
import type { CubeMoveEvent } from '../types';

export class SolveReplay {
  readonly scramble: string;
  readonly moves: CubeMoveEvent[];
  private states: string[] = [];

  constructor(scramble: string, moves: CubeMoveEvent[]) {
    this.scramble = scramble;
    this.moves = moves;
    this.computeAllStates();
  }

  private computeAllStates(): void {
    const cube = new CubeState();
    cube.applyMoves(this.scramble);
    this.states = [cube.getFaceletsString()];

    for (const m of this.moves) {
      cube.applyMove(m.move);
      this.states.push(cube.getFaceletsString());
    }
  }

  getTotalSteps(): number {
    return this.moves.length;
  }

  getStateAtStep(step: number): string {
    const clamped = Math.max(0, Math.min(step, this.states.length - 1));
    return this.states[clamped];
  }

  getMoveAtStep(step: number): CubeMoveEvent | null {
    if (step <= 0 || step > this.moves.length) return null;
    return this.moves[step - 1];
  }

  calculateTPS(totalTimeMs: number): number | null {
    if (totalTimeMs <= 0 || this.moves.length === 0) return null;
    return Number((this.moves.length / (totalTimeMs / 1000)).toFixed(2));
  }
}

