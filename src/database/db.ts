import Dexie, { type Table } from 'dexie';
import type { Solve, Session } from '../types';

export class CubeTimeDatabase extends Dexie {
  solves!: Table<Solve, string>;
  sessions!: Table<Session, string>;

  constructor() {
    super('CubeTimeDB');
    this.version(1).stores({
      solves: 'id, sessionId, puzzle, createdAt, rawTimeMs, penalty',
      sessions: 'id, name, createdAt'
    });
  }
}

export const db = new CubeTimeDatabase();

