import React, { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Folder,
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { TimerDisplay } from '../components/TimerDisplay';
import { ScrambleDisplay } from '../components/ScrambleDisplay';
import { ScrambleGuideModal } from '../components/ScrambleGuideModal';
import { StatCard } from '../components/StatCard';
import { Cube3D } from '../components/Cube3D';
import { generate3x3Scramble } from '../cube/scramble';
import { cubeEngine } from '../cube/cubeEngine';
import { useSessionStore } from '../stores/useSessionStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { computeSessionMetrics } from '../statistics/metrics';
import { formatTime } from '../statistics/averages';
import type { Penalty, Solve } from '../types';

export const TimerPage: React.FC = () => {
  const {
    sessions,
    activeSessionId,
    solves,
    switchSession,
    createSession,
    renameSession,
    deleteSession,
    addSolve,
    updatePenalty,
    deleteSolve,
  } = useSessionStore();

  const { precision, show3DPreview, triggerMode, holdToReadyMs } = useSettingsStore();

  const [currentScramble, setCurrentScramble] = useState<string>('');
  const [facelets, setFacelets] = useState<string>(cubeEngine.getFacelets());
  const [sessionMenuOpen, setSessionMenuOpen] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editSessionName, setEditSessionName] = useState('');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Generate initial scramble
  const handleGenerateScramble = useCallback(() => {
    const scr = generate3x3Scramble(21);
    setCurrentScramble(scr);
    cubeEngine.applyScramble(scr);
  }, []);

  useEffect(() => {
    handleGenerateScramble();
  }, [handleGenerateScramble]);

  // Subscribe to live cube engine facelets
  useEffect(() => {
    const unsub = cubeEngine.subscribe((newFacelets) => {
      setFacelets(newFacelets);
    });
    return unsub;
  }, []);

  // Compute metrics for active session
  const metrics = useMemo(() => computeSessionMetrics(solves), [solves]);

  const activeSession = useMemo(
    () => sessions.find(s => s.id === activeSessionId) || sessions[0],
    [sessions, activeSessionId]
  );

  // Last solve
  const lastSolve = useMemo(
    () => (solves.length > 0 ? solves[solves.length - 1] : null),
    [solves]
  );

  // Handle solve completed
  const handleSolveComplete = async (rawTimeMs: number, penalty: Penalty) => {
    if (!activeSessionId) return;

    // Check if new PB
    const previousBest = metrics.bestSingle;
    let finalTime = rawTimeMs;
    if (penalty === 'plus2') finalTime += 2000;

    const isPB =
      penalty !== 'dnf' &&
      (previousBest === null || finalTime < previousBest) &&
      solves.length > 0;

    const newSolve: Solve = {
      id: 'solve-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      sessionId: activeSessionId,
      puzzle: '333',
      rawTimeMs,
      penalty,
      scramble: currentScramble,
      source: 'keyboard',
      createdAt: new Date().toISOString(),
      moves: cubeEngine.getMoveHistory(),
    };

    await addSolve(newSolve);

    if (isPB) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }
    }

    // Advance to next scramble
    handleGenerateScramble();
  };

  // Quick penalty modification for the last solve
  const handleSetLastPenalty = async (pen: Penalty) => {
    if (!lastSolve) return;
    const nextPen = lastSolve.penalty === pen ? 'none' : pen;
    await updatePenalty(lastSolve.id, nextPen);
  };

  const handleDeleteLastSolve = async () => {
    if (!lastSolve) return;
    await deleteSolve(lastSolve.id);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto px-4 py-4 md:px-8 max-w-7xl mx-auto w-full select-none">
      {/* Top Header: Puzzle Selector & Session Dropdown */}
      <header className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-3">
          {/* Puzzle Tag */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-elevated border border-border text-xs font-semibold text-text">
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span>3x3x3</span>
          </div>

          {/* Session Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setSessionMenuOpen(!sessionMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-sm font-medium text-text transition-colors"
            >
              <Folder className="w-4 h-4 text-primary" />
              <span className="font-semibold">{activeSession?.name || 'Session'}</span>
              <span className="text-xs text-text-muted">({solves.length})</span>
              <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
            </button>

            {sessionMenuOpen && (
              <div className="absolute left-0 mt-1.5 w-64 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden py-1">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider border-b border-border">
                  Sessions
                </div>
                <div className="max-h-56 overflow-y-auto py-1">
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      className={`flex items-center justify-between px-3 py-1.5 hover:bg-surface-elevated text-sm transition-colors ${
                        s.id === activeSessionId ? 'text-primary font-semibold bg-primary/10' : 'text-text'
                      }`}
                    >
                      {editingSessionId === s.id ? (
                        <input
                          type="text"
                          value={editSessionName}
                          onChange={(e) => setEditSessionName(e.target.value)}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              if (editSessionName.trim()) {
                                await renameSession(s.id, editSessionName);
                              }
                              setEditingSessionId(null);
                            } else if (e.key === 'Escape') {
                              setEditingSessionId(null);
                            }
                          }}
                          autoFocus
                          className="bg-background px-2 py-0.5 rounded border border-primary text-xs w-full mr-2"
                        />
                      ) : (
                        <span
                          onClick={() => {
                            switchSession(s.id);
                            setSessionMenuOpen(false);
                          }}
                          className="flex-1 cursor-pointer truncate"
                        >
                          {s.name}
                        </span>
                      )}

                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSessionId(s.id);
                            setEditSessionName(s.name);
                          }}
                          title="Rename session"
                          className="p-1 hover:text-primary text-text-muted rounded"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        {sessions.length > 1 && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm(`Delete session "${s.name}" and all its solves?`)) {
                                await deleteSession(s.id);
                              }
                            }}
                            title="Delete session"
                            className="p-1 hover:text-danger text-text-muted rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {isCreatingSession ? (
                  <div className="p-2 border-t border-border flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Session name..."
                      value={newSessionName}
                      onChange={(e) => setNewSessionName(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter' && newSessionName.trim()) {
                          await createSession(newSessionName);
                          setNewSessionName('');
                          setIsCreatingSession(false);
                          setSessionMenuOpen(false);
                        } else if (e.key === 'Escape') {
                          setIsCreatingSession(false);
                        }
                      }}
                      autoFocus
                      className="flex-1 bg-background px-2.5 py-1 rounded-lg border border-border text-xs text-text focus:outline-none focus:border-primary"
                    />
                    <button
                      onClick={async () => {
                        if (newSessionName.trim()) {
                          await createSession(newSessionName);
                          setNewSessionName('');
                          setIsCreatingSession(false);
                          setSessionMenuOpen(false);
                        }
                      }}
                      className="px-2.5 py-1 bg-primary text-background rounded-lg text-xs font-semibold"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsCreatingSession(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 border-t border-border hover:bg-surface-elevated text-xs font-medium text-primary transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create New Session</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick info or solve counter */}
        <div className="text-xs text-text-muted flex items-center gap-2">
          <span>Solves: <strong className="text-text font-mono">{solves.length}</strong></span>
        </div>
      </header>

      {/* Scramble Display Section */}
      <div className="mt-4">
        <ScrambleDisplay
          scramble={currentScramble}
          onNewScramble={handleGenerateScramble}
          onOpenGuide={() => setIsGuideOpen(true)}
        />
      </div>

      {/* Scramble Assistant / Guide Modal */}
      <ScrambleGuideModal
        scramble={currentScramble}
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onReadyToSolve={() => setIsGuideOpen(false)}
      />

      {/* Main Center Area: Timer Display with optional 3D Preview */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-4 my-2">
        {/* Main Big Timer */}
        <div className="flex-1 w-full flex flex-col items-center justify-center">
          <TimerDisplay onSolveComplete={handleSolveComplete} />

          {/* Quick Last Solve Penalty & Management Bar */}
          {lastSolve && (
            <div className="flex items-center gap-2 bg-surface/80 border border-border px-3 py-1.5 rounded-xl shadow-sm -mt-4 mb-4">
              <span className="text-xs text-text-muted mr-1">Last solve:</span>
              <span className="font-mono text-sm font-semibold text-text">
                {formatTime(lastSolve.rawTimeMs, precision)}
              </span>

              <div className="h-3 w-[1px] bg-border mx-1" />

              <button
                onClick={() => handleSetLastPenalty('plus2')}
                className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors ${
                  lastSolve.penalty === 'plus2'
                    ? 'bg-warning text-background font-bold'
                    : 'bg-surface-elevated text-text-muted hover:text-warning'
                }`}
              >
                +2
              </button>

              <button
                onClick={() => handleSetLastPenalty('dnf')}
                className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors ${
                  lastSolve.penalty === 'dnf'
                    ? 'bg-danger text-background font-bold'
                    : 'bg-surface-elevated text-text-muted hover:text-danger'
                }`}
              >
                DNF
              </button>

              <button
                onClick={handleDeleteLastSolve}
                title="Delete this solve"
                className="p-1 rounded text-text-muted hover:text-danger hover:bg-danger/10 transition-colors ml-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* 3D Cube Preview (collapsible) */}
        {show3DPreview && (
          <div className="w-64 h-64 lg:w-72 lg:h-72 shrink-0 bg-surface/60 border border-border/80 rounded-2xl p-2 shadow-inner flex flex-col">
            <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider px-2 pt-1 flex items-center justify-between">
              <span>Live Cube</span>
              {cubeEngine.isSolved() ? (
                <span className="text-success text-[10px] flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3 h-3" /> Solved
                </span>
              ) : (
                <span className="text-warning text-[10px]">Scrambled</span>
              )}
            </div>
            <div className="flex-1 w-full h-full">
              <Cube3D facelets={facelets} showControls={true} />
            </div>
          </div>
        )}
      </div>

      {/* Small Summary Cards Footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-auto pt-4 border-t border-border/60">
        <StatCard
          label="Best Single"
          value={formatTime(metrics.bestSingle, precision)}
          isPB={metrics.bestSingle !== null && solves.length > 0}
        />
        <StatCard
          label="Current Ao5"
          value={formatTime(metrics.currentAo5, precision)}
          subtext={metrics.bestAo5 ? `Best: ${formatTime(metrics.bestAo5, precision)}` : undefined}
        />
        <StatCard
          label="Current Ao12"
          value={formatTime(metrics.currentAo12, precision)}
          subtext={metrics.bestAo12 ? `Best: ${formatTime(metrics.bestAo12, precision)}` : undefined}
        />
        <StatCard
          label="Session Mean"
          value={formatTime(metrics.sessionMean, precision)}
          subtext={metrics.averageTPS ? `TPS: ${metrics.averageTPS}` : `${metrics.completedSolves}/${metrics.totalSolves} done`}
        />
      </div>

      {/* Keyboard hints */}
      <footer className="mt-3 text-center text-[11px] text-text-muted/60">
        {triggerMode === 'dual-shift' ? (
          <span>L-Shift & R-Shift: Giữ {holdToReadyMs}ms để sẵn sàng • Thả tay để Inspection / Tính giờ • Đặt cả 2 Shift để Dừng • Esc: Hủy</span>
        ) : (
          <span>Phím Space: Giữ {holdToReadyMs}ms để sẵn sàng • Thả tay để Inspection / Tính giờ • Nhấn Space để Dừng • Esc: Hủy</span>
        )}
      </footer>
    </div>
  );
};
