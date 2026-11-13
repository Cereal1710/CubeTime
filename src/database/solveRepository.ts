import { db } from './db';
import type { Solve, Session, Penalty } from '../types';

export const solveRepository = {
  async initDefaultSession(): Promise<Session> {
    const existing = await db.sessions.toArray();
    if (existing.length > 0) {
      return existing[0];
    }
    const defaultSession: Session = {
      id: 'session-default',
      name: 'Main Session',
      puzzle: '333',
      createdAt: new Date().toISOString()
    };
    await db.sessions.add(defaultSession);
    return defaultSession;
  },

  async getSessions(): Promise<Session[]> {
    return await db.sessions.orderBy('createdAt').toArray();
  },

  async createSession(name: string, puzzle: string = '333'): Promise<Session> {
    const session: Session = {
      id: 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      name: name.trim() || 'New Session',
      puzzle,
      createdAt: new Date().toISOString()
    };
    await db.sessions.add(session);
    return session;
  },

  async renameSession(id: string, newName: string): Promise<void> {
    await db.sessions.update(id, { name: newName.trim() });
  },

  async deleteSession(id: string): Promise<void> {
    // Delete solves belonging to this session
    await db.solves.where('sessionId').equals(id).delete();
    await db.sessions.delete(id);
  },

  async getSolvesBySession(sessionId: string): Promise<Solve[]> {
    const solves = await db.solves.where('sessionId').equals(sessionId).sortBy('createdAt');
    return solves;
  },

  async getAllSolves(): Promise<Solve[]> {
    return await db.solves.orderBy('createdAt').toArray();
  },

  async addSolve(solve: Solve): Promise<void> {
    await db.solves.add(solve);
  },

  async updateSolve(id: string, updates: Partial<Solve>): Promise<void> {
    await db.solves.update(id, updates);
  },

  async setPenalty(id: string, penalty: Penalty): Promise<void> {
    await db.solves.update(id, { penalty });
  },

  async deleteSolve(id: string): Promise<void> {
    await db.solves.delete(id);
  },

  async clearAllData(): Promise<void> {
    await db.solves.clear();
    await db.sessions.clear();
    await this.initDefaultSession();
  },

  async exportJSON(): Promise<string> {
    const sessions = await db.sessions.toArray();
    const solves = await db.solves.toArray();
    return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), sessions, solves }, null, 2);
  },

  async exportCSV(sessionId?: string): Promise<string> {
    const solves = sessionId ? await this.getSolvesBySession(sessionId) : await this.getAllSolves();
    const headers = ['ID', 'Session ID', 'Puzzle', 'Raw Time (ms)', 'Formatted Time', 'Penalty', 'Final Time (ms)', 'Scramble', 'Source', 'Date', 'TPS', 'Moves Count', 'Note'];
    const rows = solves.map((s, idx) => {
      let finalTimeMs: number | string = s.rawTimeMs;
      let formatted = (s.rawTimeMs / 1000).toFixed(2);
      if (s.penalty === 'plus2') {
        finalTimeMs = s.rawTimeMs + 2000;
        formatted = ((s.rawTimeMs + 2000) / 1000).toFixed(2) + '+';
      } else if (s.penalty === 'dnf') {
        finalTimeMs = 'DNF';
        formatted = 'DNF';
      }

      const moveCount = s.moves?.length || 0;
      const tps = (moveCount > 0 && s.rawTimeMs > 0) ? (moveCount / (s.rawTimeMs / 1000)).toFixed(2) : '';

      return [
        idx + 1,
        `"${s.sessionId}"`,
        s.puzzle,
        s.rawTimeMs,
        `"${formatted}"`,
        s.penalty,
        finalTimeMs,
        `"${s.scramble.replace(/"/g, '""')}"`,
        s.source,
        `"${s.createdAt}"`,
        tps,
        moveCount,
        `"${(s.note || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  },

  async importJSON(jsonStr: string): Promise<{ sessionCount: number; solveCount: number }> {
    const data = JSON.parse(jsonStr);
    if (!data || (!Array.isArray(data.solves) && !Array.isArray(data.sessions))) {
      throw new Error('Invalid backup file format');
    }

    let sessionCount = 0;
    let solveCount = 0;

    if (Array.isArray(data.sessions)) {
      for (const s of data.sessions) {
        if (s.id && s.name) {
          await db.sessions.put(s);
          sessionCount++;
        }
      }
    }

    if (Array.isArray(data.solves)) {
      for (const solve of data.solves) {
        if (solve.id && solve.rawTimeMs !== undefined) {
          await db.solves.put(solve);
          solveCount++;
        }
      }
    }

    return { sessionCount, solveCount };
  }
};

