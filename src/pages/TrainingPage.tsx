import React, { useState } from 'react';
import {
  GraduationCap,
  Copy,
  Check,
  Zap
} from 'lucide-react';
import { Cube3D } from '../components/Cube3D';
import { CubeState } from '../cube/cubeState';

interface TrainerCase {
  id: string;
  name: string;
  category: 'PLL' | 'OLL';
  setup: string; // Moves to setup this case from solved
  algorithm: string; // The standard algorithm to solve it
  description: string;
}

const TRAINING_CASES: TrainerCase[] = [
  {
    id: 't-perm',
    name: 'T-Permutation',
    category: 'PLL',
    setup: "R U R' U' R' F R2 U' R' U' R U R' F'",
    algorithm: "R U R' U' R' F R2 U' R' U' R U R' F'",
    description: 'Swaps two corners (URB & URF) and two edges (UR & UL).'
  },
  {
    id: 'jb-perm',
    name: 'Jb-Permutation',
    category: 'PLL',
    setup: "R U R' F' R U R' U' R' F R2 U' R'",
    algorithm: "R U R' F' R U R' U' R' F R2 U' R'",
    description: 'Swaps adjacent corners and edges cleanly.'
  },
  {
    id: 'y-perm',
    name: 'Y-Permutation',
    category: 'PLL',
    setup: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
    algorithm: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
    description: 'Diagonal corner swap with adjacent edges swap.'
  },
  {
    id: 'sune',
    name: 'OLL 27 (Sune)',
    category: 'OLL',
    setup: "R U R' U R U2 R'",
    algorithm: "R U R' U R U2 R'",
    description: 'Classic 7-move OLL orienting 3 top corners clockwise.'
  },
  {
    id: 'antisune',
    name: 'OLL 26 (Anti-Sune)',
    category: 'OLL',
    setup: "R' U' R U' R' U2 R",
    algorithm: "R' U' R U' R' U2 R",
    description: 'Symmetric counterpart to the Sune algorithm.'
  },
  {
    id: 'h-perm',
    name: 'H-Permutation',
    category: 'PLL',
    setup: "M2 U M2 U2 M2 U M2",
    algorithm: "M2 U M2 U2 M2 U M2",
    description: 'Swaps opposite edge pairs across the cross.'
  }
];

export const TrainingPage: React.FC = () => {
  const [selectedCase, setSelectedCase] = useState<TrainerCase>(TRAINING_CASES[0]);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'PLL' | 'OLL'>('ALL');
  const [copiedAlg, setCopiedAlg] = useState(false);

  // Compute 3D cube preview state for this setup
  const caseFacelets = React.useMemo(() => {
    const cube = new CubeState();
    cube.applyMoves(selectedCase.setup);
    return cube.getFaceletsString();
  }, [selectedCase]);

  const filteredCases = TRAINING_CASES.filter(
    c => categoryFilter === 'ALL' || c.category === categoryFilter
  );

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAlg(true);
      setTimeout(() => setCopiedAlg(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto px-4 py-6 md:px-8 max-w-7xl mx-auto w-full select-none">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border/70">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-text flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" />
            CFOP Algorithm Trainer
          </h2>
          <p className="text-xs md:text-sm text-text-muted mt-0.5">
            Practice essential CFOP algorithms, recognize patterns, and drill your muscle memory
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left Side: Case Selector List */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 p-1 bg-surface rounded-xl border border-border">
            {(['ALL', 'PLL', 'OLL'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  categoryFilter === cat
                    ? 'bg-primary text-background shadow-sm'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {cat === 'ALL' ? 'All Cases' : `${cat} Trainer`}
              </button>
            ))}
          </div>

          {/* List of cases */}
          <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1">
            {filteredCases.map((c) => {
              const isSelected = c.id === selectedCase.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-surface-elevated border-primary/60 shadow-sm'
                      : 'bg-surface border-border hover:border-border/90 hover:bg-surface-elevated/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-text">{c.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/15 text-primary border border-primary/20">
                      {c.category}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-1 truncate">{c.description}</p>
                </div>
              );
            })}
          </div>

          {/* Upcoming Modes Notice */}
          <div className="p-4 rounded-xl bg-surface/60 border border-border/80 text-xs text-text-muted space-y-2">
            <div className="font-semibold text-text flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-warning" />
              Roadmap Training Modes
            </div>
            <p className="leading-relaxed">
              Cross Trainer, F2L Pair Drills, and Real-Time TPS Challenge are currently in development for Phase 4.
            </p>
          </div>
        </div>

        {/* Right Side: Interactive Algorithm Drill Card */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <div className="p-6 rounded-2xl bg-surface border border-border shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-primary">
                  {selectedCase.category} Case
                </span>
                <h3 className="text-xl font-bold text-text mt-0.5">{selectedCase.name}</h3>
              </div>
              <span className="text-xs text-text-muted">{selectedCase.description}</span>
            </div>

            {/* 3D Preview of Scrambled Case */}
            <div className="h-64 w-full bg-background/50 rounded-xl border border-border/60 relative overflow-hidden flex items-center justify-center">
              <Cube3D facelets={caseFacelets} showControls={true} className="w-full h-full" />
            </div>

            {/* Algorithm Display Box */}
            <div className="p-4 rounded-xl bg-surface-elevated border border-border/80 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Solution Algorithm
                </span>
                <button
                  onClick={() => handleCopy(selectedCase.algorithm)}
                  className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                >
                  {copiedAlg ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-success" />
                      <span className="text-success">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="font-mono text-base md:text-lg font-bold text-primary tracking-wide py-1 select-all">
                {selectedCase.algorithm}
              </div>
            </div>

            {/* Scramble to set up */}
            <div className="p-3 bg-background rounded-xl border border-border/60 text-xs font-mono text-text-muted flex items-start gap-2">
              <span className="shrink-0 font-semibold text-text">Setup Scramble:</span>
              <span className="select-all text-text-muted/90">{selectedCase.setup}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
