import { create } from 'zustand';
import type { Session, Solve, Penalty } from '../types';
import { solveRepository } from '../database/solveRepository';

interface SessionStore {
  sessions: Session[];
  activeSessionId: string | null;
  solves: Solve[];
  isLoading: boolean;

  init: () => Promise<void>;
  switchSession: (sessionId: string) => Promise<void>;
  createSession: (name: string, puzzle?: string) => Promise<Session>;
  renameSession: (id: string, name: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;

  addSolve: (solve: Solve) => Promise<void>;
  updatePenalty: (solveId: string, penalty: Penalty) => Promise<void>;
  updateNote: (solveId: string, note: string) => Promise<void>;
  deleteSolve: (solveId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  reloadSolves: () => Promise<void>;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  solves: [],
  isLoading: true,

  init: async () => {
    try {
      const defaultSession = await solveRepository.initDefaultSession();
      const sessions = await solveRepository.getSessions();
      const storedActiveId = localStorage.getItem('cubetime-active-session-id');
      const activeId = (storedActiveId && sessions.some(s => s.id === storedActiveId))
        ? storedActiveId
        : defaultSession.id;

      const solves = await solveRepository.getSolvesBySession(activeId);

      set({
        sessions,
        activeSessionId: activeId,
        solves,
        isLoading: false
      });
    } catch (err) {
      console.error('Failed to init session store:', err);
      set({ isLoading: false });
    }
  },

  switchSession: async (sessionId: string) => {
    localStorage.setItem('cubetime-active-session-id', sessionId);
    const solves = await solveRepository.getSolvesBySession(sessionId);
    set({ activeSessionId: sessionId, solves });
  },

  createSession: async (name: string, puzzle = '333') => {
    const newSession = await solveRepository.createSession(name, puzzle);
    const sessions = await solveRepository.getSessions();
    localStorage.setItem('cubetime-active-session-id', newSession.id);
    set({
      sessions,
      activeSessionId: newSession.id,
      solves: []
    });
    return newSession;
  },

  renameSession: async (id: string, name: string) => {
    await solveRepository.renameSession(id, name);
    const sessions = await solveRepository.getSessions();
    set({ sessions });
  },

  deleteSession: async (id: string) => {
    const { sessions, activeSessionId } = get();
    if (sessions.length <= 1) {
      throw new Error('Cannot delete the only remaining session.');
    }

    await solveRepository.deleteSession(id);
    const updatedSessions = await solveRepository.getSessions();
    let nextActiveId = activeSessionId;
    if (activeSessionId === id) {
      nextActiveId = updatedSessions[0].id;
      localStorage.setItem('cubetime-active-session-id', nextActiveId);
    }

    const solves = await solveRepository.getSolvesBySession(nextActiveId!);
    set({
      sessions: updatedSessions,
      activeSessionId: nextActiveId,
      solves
    });
  },

  addSolve: async (solve: Solve) => {
    await solveRepository.addSolve(solve);
    const { activeSessionId } = get();
    if (activeSessionId === solve.sessionId) {
      const solves = await solveRepository.getSolvesBySession(activeSessionId);
      set({ solves });
    }
  },

  updatePenalty: async (solveId: string, penalty: Penalty) => {
    await solveRepository.setPenalty(solveId, penalty);
    const { activeSessionId } = get();
    if (activeSessionId) {
      const solves = await solveRepository.getSolvesBySession(activeSessionId);
      set({ solves });
    }
  },

  updateNote: async (solveId: string, note: string) => {
    await solveRepository.updateSolve(solveId, { note });
    const { activeSessionId } = get();
    if (activeSessionId) {
      const solves = await solveRepository.getSolvesBySession(activeSessionId);
      set({ solves });
    }
  },

  deleteSolve: async (solveId: string) => {
    await solveRepository.deleteSolve(solveId);
    const { activeSessionId } = get();
    if (activeSessionId) {
      const solves = await solveRepository.getSolvesBySession(activeSessionId);
      set({ solves });
    }
  },

  clearAll: async () => {
    await solveRepository.clearAllData();
    const defaultSession = await solveRepository.initDefaultSession();
    const sessions = await solveRepository.getSessions();
    localStorage.setItem('cubetime-active-session-id', defaultSession.id);
    set({
      sessions,
      activeSessionId: defaultSession.id,
      solves: []
    });
  },

  reloadSolves: async () => {
    const { activeSessionId } = get();
    if (activeSessionId) {
      const solves = await solveRepository.getSolvesBySession(activeSessionId);
      const sessions = await solveRepository.getSessions();
      set({ solves, sessions });
    }
  }
}));

