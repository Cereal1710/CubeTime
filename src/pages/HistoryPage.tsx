import React, { useState, useMemo } from 'react';
import {
  History,
  Filter,
  ArrowUpDown,
  Search,
  Trash2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Box,
  Clock,
  X,
  Check
} from 'lucide-react';
import { Cube3D } from '../components/Cube3D';
import { SolveReplay } from '../cube/replay';
import { useSessionStore } from '../stores/useSessionStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { formatSolveTime, getEffectiveTime } from '../statistics/averages';
import type { Solve, Penalty } from '../types';

export const HistoryPage: React.FC = () => {
  const { solves, sessions, updatePenalty, updateNote, deleteSolve } = useSessionStore();
  const { precision } = useSettingsStore();

  const [selectedSessionFilter, setSelectedSessionFilter] = useState<string>('all');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'fastest' | 'slowest'>('newest');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Solve for Modal Detail & 3D Replay
  const [activeSolve, setActiveSolve] = useState<Solve | null>(null);

  // Filtered & Sorted Solves
  const processedSolves = useMemo(() => {
    let result = [...solves];

    if (selectedSessionFilter !== 'all') {
      result = result.filter(s => s.sessionId === selectedSessionFilter);
    }

    if (selectedSourceFilter !== 'all') {
      result = result.filter(s => s.source === selectedSourceFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        s =>
          s.scramble.toLowerCase().includes(q) ||
          (s.note && s.note.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'fastest') {
        return getEffectiveTime(a) - getEffectiveTime(b);
      }
      if (sortBy === 'slowest') {
        return getEffectiveTime(b) - getEffectiveTime(a);
      }
      return 0;
    });

    return result;
  }, [solves, selectedSessionFilter, selectedSourceFilter, sortBy, searchQuery]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto px-4 py-6 md:px-8 max-w-7xl mx-auto w-full select-none">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/70">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-text flex items-center gap-2">
            <History className="w-6 h-6 text-primary" />
            Solve History
          </h2>
          <p className="text-xs md:text-sm text-text-muted mt-0.5">
            View, filter, manage, and replay all recorded speedcubing attempts
          </p>
        </div>

        <div className="text-xs text-text-muted">
          Showing <strong className="text-text font-mono">{processedSolves.length}</strong> of{' '}
          <strong className="text-text font-mono">{solves.length}</strong> solves
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 my-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search scramble or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-border pl-9 pr-3 py-2 rounded-xl text-xs text-text placeholder-text-muted/60 focus:outline-none focus:border-primary"
          />
        </div>

        {/* Session Filter */}
        <div className="flex items-center gap-2 bg-surface border border-border px-3 py-1.5 rounded-xl text-xs">
          <Filter className="w-4 h-4 text-primary shrink-0" />
          <select
            value={selectedSessionFilter}
            onChange={(e) => setSelectedSessionFilter(e.target.value)}
            className="w-full bg-transparent text-text focus:outline-none cursor-pointer font-medium"
          >
            <option value="all">All Sessions</option>
            {sessions.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Source Filter */}
        <div className="flex items-center gap-2 bg-surface border border-border px-3 py-1.5 rounded-xl text-xs">
          <span className="text-text-muted shrink-0">Source:</span>
          <select
            value={selectedSourceFilter}
            onChange={(e) => setSelectedSourceFilter(e.target.value)}
            className="w-full bg-transparent text-text focus:outline-none cursor-pointer font-medium"
          >
            <option value="all">All Sources</option>
            <option value="keyboard">Keyboard Timer</option>
            <option value="smart-cube">GAN Smart Cube</option>
          </select>
        </div>

        {/* Sort Filter */}
        <div className="flex items-center gap-2 bg-surface border border-border px-3 py-1.5 rounded-xl text-xs">
          <ArrowUpDown className="w-4 h-4 text-primary shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="w-full bg-transparent text-text focus:outline-none cursor-pointer font-medium"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="fastest">Fastest First</option>
            <option value="slowest">Slowest First</option>
          </select>
        </div>
      </div>

      {/* Solves Table */}
      {processedSolves.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-text-muted bg-surface/40 rounded-2xl border border-border">
          <Clock className="w-10 h-10 opacity-30 text-primary mb-2" />
          <h4 className="font-semibold text-text text-sm">No Solves Found</h4>
          <p className="text-xs text-text-muted mt-1">Try adjusting your filters or record new solves.</p>
        </div>
      ) : (
        <div className="flex-1 bg-surface border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-elevated/70 text-text-muted uppercase tracking-wider text-[10px] border-b border-border">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Penalty</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4 hidden md:table-cell">Scramble</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {processedSolves.map((solve, idx) => {
                  const moveCount = solve.moves?.length || 0;
                  const tps = (moveCount > 0 && solve.rawTimeMs > 0)
                    ? (moveCount / (solve.rawTimeMs / 1000)).toFixed(1)
                    : null;

                  return (
                    <tr
                      key={solve.id}
                      onClick={() => setActiveSolve(solve)}
                      className="hover:bg-surface-elevated cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-text-muted font-medium">
                        {processedSolves.length - idx}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-sm text-text">
                        {formatSolveTime(solve, precision)}
                      </td>

                      <td className="py-3 px-4">
                        {solve.penalty === 'plus2' && (
                          <span className="px-1.5 py-0.5 rounded bg-warning/15 text-warning font-semibold text-[10px]">
                            +2s
                          </span>
                        )}
                        {solve.penalty === 'dnf' && (
                          <span className="px-1.5 py-0.5 rounded bg-danger/15 text-danger font-semibold text-[10px]">
                            DNF
                          </span>
                        )}
                        {solve.penalty === 'none' && (
                          <span className="text-text-muted/60">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-background border border-border/80 text-[11px] text-text-muted capitalize">
                          {solve.source === 'smart-cube' ? 'GAN BLE' : 'Keyboard'}
                        </span>
                        {tps && (
                          <span className="ml-1.5 text-[10px] text-primary font-mono font-medium">
                            {tps} TPS
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-text-muted hidden md:table-cell max-w-xs truncate">
                        {solve.scramble}
                      </td>

                      <td className="py-3 px-4 text-text-muted hidden sm:table-cell whitespace-nowrap">
                        {new Date(solve.createdAt).toLocaleDateString()}{' '}
                        <span className="opacity-70 text-[10px]">
                          {new Date(solve.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSolve(solve);
                          }}
                          className="px-2.5 py-1 rounded bg-surface-elevated hover:bg-primary hover:text-background text-text font-medium text-xs transition-colors"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Solve Detail & 3D Replay Modal */}
      {activeSolve && (
        <SolveDetailModal
          solve={activeSolve}
          onClose={() => setActiveSolve(null)}
          onUpdatePenalty={async (pen) => {
            await updatePenalty(activeSolve.id, pen);
            setActiveSolve({ ...activeSolve, penalty: pen });
          }}
          onUpdateNote={async (note) => {
            await updateNote(activeSolve.id, note);
            setActiveSolve({ ...activeSolve, note });
          }}
          onDelete={async () => {
            if (confirm('Are you sure you want to delete this solve permanently?')) {
              await deleteSolve(activeSolve.id);
              setActiveSolve(null);
            }
          }}
        />
      )}
    </div>
  );
};

// Modal for Solve Details & 3D Interactive Replay
const SolveDetailModal: React.FC<{
  solve: Solve;
  onClose: () => void;
  onUpdatePenalty: (pen: Penalty) => Promise<void>;
  onUpdateNote: (note: string) => Promise<void>;
  onDelete: () => Promise<void>;
}> = ({ solve, onClose, onUpdatePenalty, onUpdateNote, onDelete }) => {
  const { precision } = useSettingsStore();
  const [noteText, setNoteText] = useState(solve.note || '');
  const [isSavedNote, setIsSavedNote] = useState(false);

  // 3D Replay Setup
  const replay = useMemo(() => {
    return new SolveReplay(solve.scramble, solve.moves || []);
  }, [solve]);

  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const totalSteps = replay.getTotalSteps();
  const faceletsAtStep = replay.getStateAtStep(currentStep);
  const moveAtStep = replay.getMoveAtStep(currentStep);

  // Playback loop
  React.useEffect(() => {
    if (!isPlaying) return;

    if (currentStep >= totalSteps) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStep((prev) => {
        if (prev + 1 >= totalSteps) {
          setIsPlaying(false);
          return totalSteps;
        }
        return prev + 1;
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, totalSteps]);

  const handleSaveNote = async () => {
    await onUpdateNote(noteText);
    setIsSavedNote(true);
    setTimeout(() => setIsSavedNote(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="font-mono text-2xl font-bold text-text">
              {formatSolveTime(solve, precision)}
            </span>
            <span className="text-xs text-text-muted">
              ({new Date(solve.createdAt).toLocaleString()})
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-elevated transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Scramble Panel */}
          <div>
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Scramble
            </span>
            <div className="mt-1 p-3 bg-background rounded-xl border border-border font-mono text-xs md:text-sm text-text leading-relaxed">
              {solve.scramble}
            </div>
          </div>

          {/* Penalty & Management Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface-elevated/70 rounded-xl border border-border">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Penalty:</span>
              {(['none', 'plus2', 'dnf'] as Penalty[]).map((pen) => (
                <button
                  key={pen}
                  onClick={() => onUpdatePenalty(pen)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase transition-colors ${
                    solve.penalty === pen
                      ? pen === 'dnf'
                        ? 'bg-danger text-background font-bold'
                        : pen === 'plus2'
                        ? 'bg-warning text-background font-bold'
                        : 'bg-primary text-background font-bold'
                      : 'bg-surface text-text-muted hover:text-text border border-border'
                  }`}
                >
                  {pen === 'none' ? 'None' : pen === 'plus2' ? '+2' : 'DNF'}
                </button>
              ))}
            </div>

            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-danger/15 hover:bg-danger/25 text-danger border border-danger/30 text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Solve</span>
            </button>
          </div>

          {/* 3D Replay & Move Sequence Section */}
          <div className="p-4 bg-surface-elevated/40 rounded-2xl border border-border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-2">
                <Box className="w-4 h-4 text-primary" />
                3D Solve Replay {totalSteps > 0 && `(${totalSteps} recorded turns)`}
              </h4>

              {totalSteps > 0 && (
                <span className="text-xs font-mono text-text-muted">
                  Step {currentStep} / {totalSteps}
                </span>
              )}
            </div>

            {/* 3D Viewer for Replay */}
            <div className="h-56 w-full bg-background/60 rounded-xl border border-border/80 relative overflow-hidden flex items-center justify-center">
              <Cube3D facelets={faceletsAtStep} showControls={true} className="w-full h-full" />
            </div>

            {/* Replay Controls */}
            {totalSteps > 0 ? (
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentStep(0);
                    }}
                    title="Jump to start"
                    className="p-1.5 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-text-muted hover:text-text text-xs"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentStep(Math.max(0, currentStep - 1));
                    }}
                    disabled={currentStep === 0}
                    className="px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-elevated disabled:opacity-40 border border-border text-text text-xs font-semibold"
                  >
                    Prev
                  </button>

                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary text-background text-xs font-bold shadow-sm"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isPlaying ? 'Pause' : 'Play'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentStep(Math.min(totalSteps, currentStep + 1));
                    }}
                    disabled={currentStep >= totalSteps}
                    className="px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-elevated disabled:opacity-40 border border-border text-text text-xs font-semibold"
                  >
                    Next
                  </button>

                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentStep(totalSteps);
                    }}
                    title="Jump to end"
                    className="p-1.5 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-text-muted hover:text-text text-xs"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>

                {moveAtStep && (
                  <div className="font-mono text-sm font-bold text-primary px-2.5 py-1 bg-surface rounded-lg border border-border">
                    Move: {moveAtStep.move}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-2 text-center text-xs text-text-muted">
                Keyboard solves do not have move-by-move sensor tracking. Connect a GAN Smart Cube to record every turn.
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Notes
              </span>
              {isSavedNote && (
                <span className="text-xs text-success flex items-center gap-1 font-semibold">
                  <Check className="w-3.5 h-3.5" /> Saved
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Add a note (e.g. Full Step, PLL skip, easy cross...)"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveNote();
                }}
                className="flex-1 bg-background border border-border px-3 py-2 rounded-xl text-xs text-text focus:outline-none focus:border-primary"
              />
              <button
                onClick={handleSaveNote}
                className="px-4 py-2 bg-surface-elevated hover:bg-border text-text rounded-xl text-xs font-semibold transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
