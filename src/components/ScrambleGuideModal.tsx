import React, { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  X,
  Sparkles,
  Volume2,
  VolumeX,
  Bluetooth,
  AlertCircle,
  HelpCircle,
  Flame
} from 'lucide-react';
import { Cube3D } from './Cube3D';
import { CubeState } from '../cube/cubeState';
import { smartCubeManager } from '../bluetooth/connection';
import { useSmartCubeStore } from '../stores/useSmartCubeStore';
import { sound } from '../utils/sound';

interface ScrambleGuideModalProps {
  scramble: string;
  isOpen: boolean;
  onClose: () => void;
  onReadyToSolve?: () => void;
}

interface MoveExplanation {
  move: string;
  face: string;
  faceNameVi: string;
  faceColor: string;
  direction: 'CW' | 'CCW' | 'DOUBLE';
  directionTextVi: string;
  turnDegrees: string;
}

function getMoveDetails(move: string): MoveExplanation {
  const trimmed = move.trim();
  if (!trimmed) {
    return {
      move: '',
      face: '',
      faceNameVi: '',
      faceColor: '#666',
      direction: 'CW',
      directionTextVi: '',
      turnDegrees: '0°'
    };
  }

  const face = trimmed[0].toUpperCase();
  const modifier = trimmed.slice(1);

  let direction: 'CW' | 'CCW' | 'DOUBLE' = 'CW';
  let directionTextVi = 'Thuận chiều kim đồng hồ (90°)';
  let turnDegrees = '90° CW ↻';

  if (modifier === "'") {
    direction = 'CCW';
    directionTextVi = 'Ngược chiều kim đồng hồ (90°)';
    turnDegrees = '90° CCW ↺';
  } else if (modifier === '2') {
    direction = 'DOUBLE';
    directionTextVi = 'Xoay nửa vòng 180°';
    turnDegrees = '180° ⤾';
  }

  const faceInfoMap: Record<string, { vi: string; color: string }> = {
    U: { vi: 'Mặt Trên (Trắng / White)', color: '#FFFFFF' },
    D: { vi: 'Mặt Dưới (Vàng / Yellow)', color: '#FFD500' },
    F: { vi: 'Mặt Trước (Xanh lá / Green)', color: '#009B48' },
    B: { vi: 'Mặt Sau (Xanh dương / Blue)', color: '#0046AD' },
    L: { vi: 'Mặt Trái (Cam / Orange)', color: '#FF5800' },
    R: { vi: 'Mặt Phải (Đỏ / Red)', color: '#B71234' },
  };

  const info = faceInfoMap[face] || { vi: `Mặt ${face}`, color: '#38BDF8' };

  return {
    move: trimmed,
    face,
    faceNameVi: info.vi,
    faceColor: info.color,
    direction,
    directionTextVi,
    turnDegrees
  };
}

export const ScrambleGuideModal: React.FC<ScrambleGuideModalProps> = ({
  scramble,
  isOpen,
  onClose,
  onReadyToSolve,
}) => {
  const { status: bluetoothStatus } = useSmartCubeStore();
  const isBluetoothConnected = bluetoothStatus === 'connected';

  const moves = useMemo(() => {
    return scramble.trim().split(/\s+/).filter(Boolean);
  }, [scramble]);

  const totalMoves = moves.length;
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [autoSpeedMs, setAutoSpeedMs] = useState<number>(1000);
  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  const [wrongMoveWarning, setWrongMoveWarning] = useState<string | null>(null);

  // Precompute 3D states after each move
  const states = useMemo(() => {
    const list: string[] = [];
    const cube = new CubeState();
    list.push(cube.getFaceletsString());

    for (const m of moves) {
      cube.applyMove(m);
      list.push(cube.getFaceletsString());
    }
    return list;
  }, [moves]);

  // Reset step whenever scramble opens/changes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setIsPlaying(false);
      setWrongMoveWarning(null);
    }
  }, [isOpen, scramble]);

  const currentMove = currentStep < totalMoves ? moves[currentStep] : null;
  const currentDetails = currentMove ? getMoveDetails(currentMove) : null;
  const currentFacelets = states[currentStep] || states[0];
  const isFinished = currentStep >= totalMoves && totalMoves > 0;

  // Sound & completion trigger
  const advanceStep = useCallback(() => {
    setCurrentStep((prev) => {
      const next = prev + 1;
      if (!soundMuted) {
        sound.playMoveTick();
      }
      if (next >= totalMoves) {
        setIsPlaying(false);
        if (!soundMuted) {
          sound.playCompleteChime();
        }
        try {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 }
          });
        } catch {
          // ignore
        }
        return totalMoves;
      }
      return next;
    });
  }, [totalMoves, soundMuted]);

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying || isFinished) return;

    const timer = setTimeout(() => {
      advanceStep();
    }, autoSpeedMs);

    return () => clearTimeout(timer);
  }, [isPlaying, isFinished, autoSpeedMs, advanceStep]);

  // GAN Smart Cube move listener integration!
  useEffect(() => {
    if (!isOpen || !isBluetoothConnected || isFinished) return;

    const unsub = smartCubeManager.subscribe((state) => {
      if (!state.lastEvent || !state.lastEvent.startsWith('Move: ')) return;
      const physicalMove = state.lastEvent.replace('Move: ', '').trim();

      if (currentMove) {
        // Compare physical move with expected scramble move
        if (physicalMove === currentMove) {
          setWrongMoveWarning(null);
          advanceStep();
        } else {
          setWrongMoveWarning(`Đã xoay "${physicalMove}" — Lượt cần xoay: "${currentMove}"`);
          if (!soundMuted) {
            sound.playErrorBuzz();
          }
        }
      }
    });

    return () => unsub();
  }, [isOpen, isBluetoothConnected, isFinished, currentMove, advanceStep, soundMuted]);

  // Keyboard controls (Arrow keys)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setIsPlaying(false);
        if (currentStep < totalMoves) advanceStep();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setIsPlaying(false);
        setCurrentStep((prev) => Math.max(0, prev - 1));
      } else if (e.key === ' ' && !isFinished) {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep, totalMoves, isFinished, advanceStep, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none overflow-y-auto">
      <div className="w-full max-w-4xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface-elevated/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-text flex items-center gap-2">
                Hệ Thống Hướng Dẫn Scramble
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold border border-primary/30">
                  CubeStation Guide
                </span>
              </h3>
              <p className="text-xs text-text-muted">
                Làm theo từng bước xoay trên khối Rubik của bạn (Trắng trên, Xanh lá trước)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bluetooth Live Sync Badge */}
            {isBluetoothConnected ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/15 border border-success/30 text-success text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span>GAN Smart Sync</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-elevated border border-border text-text-muted text-xs">
                <Bluetooth className="w-3.5 h-3.5 opacity-60" />
                <span>Manual Guide</span>
              </div>
            )}

            {/* Sound toggle */}
            <button
              onClick={() => setSoundMuted(!soundMuted)}
              title={soundMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
              className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-elevated transition-colors"
            >
              {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-primary" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-elevated transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scramble Timeline Pills */}
        <div className="px-5 py-3 border-b border-border bg-background/50 overflow-x-auto flex items-center gap-1.5 scrollbar-thin">
          {moves.map((m, idx) => {
            const isPast = idx < currentStep;
            const isCurrent = idx === currentStep;

            return (
              <button
                key={idx}
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStep(idx);
                }}
                className={`shrink-0 px-2.5 py-1 rounded-lg font-mono text-xs font-semibold transition-all ${
                  isCurrent
                    ? 'bg-primary text-background font-bold shadow-lg shadow-primary/30 scale-110 ring-2 ring-primary'
                    : isPast
                    ? 'bg-success/15 text-success border border-success/30 line-through opacity-70'
                    : 'bg-surface-elevated text-text-muted border border-border hover:text-text'
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-background h-1.5 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(currentStep / Math.max(1, totalMoves)) * 100}%` }}
          />
        </div>

        {/* Main Content Area: Left (Move details & instruction), Right (3D interactive cube) */}
        <div className="flex-1 p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left Column: Big Move Display & Guidance */}
          <div className="md:col-span-6 flex flex-col justify-center gap-4">
            {!isFinished && currentDetails ? (
              <div className="p-6 rounded-2xl bg-surface-elevated/70 border border-border flex flex-col items-center text-center shadow-inner relative overflow-hidden">
                {/* Glow background based on face color */}
                <div
                  className="absolute -top-10 -right-10 w-36 h-36 rounded-full opacity-15 blur-2xl pointer-events-none"
                  style={{ backgroundColor: currentDetails.faceColor }}
                />

                <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                  Bước {currentStep + 1} / {totalMoves}
                </div>

                {/* Big Move Notation */}
                <div
                  className="font-mono text-7xl sm:text-8xl font-extrabold tracking-tight my-2 drop-shadow-md"
                  style={{ color: currentDetails.faceColor === '#FFFFFF' ? '#F1F5F9' : currentDetails.faceColor }}
                >
                  {currentDetails.move}
                </div>

                {/* Plain Text Description */}
                <div className="mt-1 flex flex-col items-center gap-1">
                  <span className="text-sm font-bold text-text">
                    {currentDetails.faceNameVi}
                  </span>
                  <span className="text-xs text-primary font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                    {currentDetails.directionTextVi} ({currentDetails.turnDegrees})
                  </span>
                </div>

                {/* Wrong move alert banner if detected by smart cube */}
                {wrongMoveWarning && (
                  <div className="mt-3 p-2.5 bg-danger/15 border border-danger/30 rounded-xl text-xs text-danger font-semibold flex items-center gap-2 animate-bounce">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{wrongMoveWarning}</span>
                  </div>
                )}

                {/* GAN Smart sync tip */}
                {isBluetoothConnected && (
                  <div className="mt-4 text-[11px] text-success/90 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Cảm biến GAN tự động nhận diện và nhảy bước khi bạn xoay đúng</span>
                  </div>
                )}
              </div>
            ) : (
              /* Scramble Finished Banner */
              <div className="p-6 rounded-2xl bg-success/15 border border-success/30 flex flex-col items-center text-center gap-3 shadow-lg">
                <div className="w-14 h-14 rounded-full bg-success/20 flex items-center justify-center text-success animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-text">
                  Scramble Đã Hoàn Tất!
                </h4>
                <p className="text-xs text-text-muted max-w-xs">
                  Khối Rubik của bạn đã được xáo trộn chính xác theo scramble. Sẵn sàng bắt đầu giải đố!
                </p>
                <button
                  onClick={() => {
                    onClose();
                    onReadyToSolve?.();
                  }}
                  className="mt-2 px-6 py-2.5 bg-success hover:bg-success/90 text-background font-bold text-sm rounded-xl shadow-lg shadow-success/25 transition-all flex items-center gap-2"
                >
                  <Flame className="w-4 h-4" />
                  <span>Bắt Đầu Solve Ngay</span>
                </button>
              </div>
            )}

            {/* Standard Cube Orientation Guide Card */}
            <div className="p-3.5 rounded-xl bg-background border border-border/80 text-xs text-text-muted">
              <div className="font-semibold text-text mb-1 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-primary" />
                Quy ước hướng cầm Rubik chuẩn WCA:
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                <div>• <strong>U (Trắng)</strong>: Hướng lên trên</div>
                <div>• <strong>F (Xanh lá)</strong>: Hướng ra trước mặt</div>
                <div>• <strong>R (Đỏ)</strong>: Bên tay phải</div>
                <div>• <strong>L (Cam)</strong>: Bên tay trái</div>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Cube Viewer */}
          <div className="md:col-span-6 flex flex-col items-center justify-center">
            <div className="w-full h-72 sm:h-80 bg-background/60 rounded-2xl border border-border/80 relative overflow-hidden flex items-center justify-center p-2 shadow-inner">
              <Cube3D
                facelets={currentFacelets}
                highlightMove={currentMove || undefined}
                showControls={true}
                className="w-full h-full"
              />
            </div>
            <span className="text-[11px] text-text-muted/70 mt-2">
              Kéo chuột hoặc vuốt để xoay góc nhìn 3D khối Rubik
            </span>
          </div>
        </div>

        {/* Footer Navigation Toolbar */}
        <div className="px-5 py-3.5 border-t border-border bg-surface-elevated/40 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Reset button */}
          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentStep(0);
              setWrongMoveWarning(null);
            }}
            title="Quay lại đầu"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-xs text-text-muted hover:text-text transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Về ban đầu</span>
          </button>

          {/* Center: Prev, Play/Pause, Next */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentStep((prev) => Math.max(0, prev - 1));
                setWrongMoveWarning(null);
              }}
              disabled={currentStep === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-elevated disabled:opacity-40 border border-border text-xs font-semibold text-text transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Bước trước (←)</span>
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={isFinished}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-40 text-background text-xs font-bold transition-all shadow-md shadow-primary/20"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'Tạm dừng' : 'Tự động chạy'}</span>
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                if (currentStep < totalMoves) advanceStep();
                setWrongMoveWarning(null);
              }}
              disabled={isFinished}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-elevated disabled:opacity-40 border border-border text-xs font-semibold text-text transition-colors"
            >
              <span>Bước kế (→)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Speed selector */}
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <span>Tốc độ:</span>
            {[
              { label: '0.8s', ms: 800 },
              { label: '1.2s', ms: 1200 },
              { label: '2.0s', ms: 2000 }
            ].map((spd) => (
              <button
                key={spd.ms}
                onClick={() => setAutoSpeedMs(spd.ms)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                  autoSpeedMs === spd.ms
                    ? 'bg-primary text-background border-primary'
                    : 'bg-surface border-border text-text-muted hover:text-text'
                }`}
              >
                {spd.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

