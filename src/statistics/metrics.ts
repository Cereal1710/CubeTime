import type { Solve } from '../types';
import {
  calculateAoN,
  calculateBestAoN,
  calculateBestSingle,
  calculateSessionMean,
  getEffectiveTime
} from './averages';

export interface SessionMetrics {
  totalSolves: number;
  completedSolves: number;
  dnfCount: number;
  bestSingle: number | null;
  bestSingleSolve: Solve | null;
  currentAo5: number | null;
  currentAo12: number | null;
  bestAo5: number | null;
  bestAo12: number | null;
  bestAo100: number | null;
  sessionMean: number | null;
  averageTPS: number | null;
}

export function computeSessionMetrics(solves: Solve[]): SessionMetrics {
  const totalSolves = solves.length;
  const dnfCount = solves.filter(s => s.penalty === 'dnf').length;
  const completedSolves = totalSolves - dnfCount;

  const bestSingleSolve = calculateBestSingle(solves);
  const bestSingle = bestSingleSolve ? getEffectiveTime(bestSingleSolve) : null;

  const currentAo5 = calculateAoN(solves, 5);
  const currentAo12 = calculateAoN(solves, 12);
  const bestAo5 = calculateBestAoN(solves, 5);
  const bestAo12 = calculateBestAoN(solves, 12);
  const bestAo100 = calculateBestAoN(solves, 100);
  const sessionMean = calculateSessionMean(solves);

  // TPS Calculation: only for solves with recorded moves and rawTimeMs > 0
  let totalMoves = 0;
  let totalTimeMsWithMoves = 0;

  for (const s of solves) {
    if (s.moves && s.moves.length > 0 && s.rawTimeMs > 0 && s.penalty !== 'dnf') {
      totalMoves += s.moves.length;
      totalTimeMsWithMoves += s.rawTimeMs;
    }
  }

  const averageTPS = totalTimeMsWithMoves > 0
    ? Number((totalMoves / (totalTimeMsWithMoves / 1000)).toFixed(2))
    : null;

  return {
    totalSolves,
    completedSolves,
    dnfCount,
    bestSingle,
    bestSingleSolve,
    currentAo5,
    currentAo12,
    bestAo5,
    bestAo12,
    bestAo100,
    sessionMean,
    averageTPS
  };
}

export interface ChartAttemptPoint {
  index: number;
  timeSeconds: number | null;
  ao5Seconds: number | null;
  ao12Seconds: number | null;
  tps?: number | null;
  date: string;
  isPB?: boolean;
}

export function generateChartData(solves: Solve[]): ChartAttemptPoint[] {
  let runningBest = Infinity;

  return solves.map((solve, i) => {
    const effective = getEffectiveTime(solve);
    const timeSec = isFinite(effective) ? Number((effective / 1000).toFixed(2)) : null;

    let isPB = false;
    if (timeSec !== null && effective < runningBest) {
      runningBest = effective;
      isPB = i > 0; // only consider PB after at least 1 previous solve
    }

    const currentSolvesUpToNow = solves.slice(0, i + 1);
    const ao5 = calculateAoN(currentSolvesUpToNow, 5);
    const ao12 = calculateAoN(currentSolvesUpToNow, 12);

    let tps: number | null = null;
    if (solve.moves && solve.moves.length > 0 && solve.rawTimeMs > 0 && solve.penalty !== 'dnf') {
      tps = Number((solve.moves.length / (solve.rawTimeMs / 1000)).toFixed(2));
    }

    return {
      index: i + 1,
      timeSeconds: timeSec,
      ao5Seconds: ao5 !== null && isFinite(ao5) ? Number((ao5 / 1000).toFixed(2)) : null,
      ao12Seconds: ao12 !== null && isFinite(ao12) ? Number((ao12 / 1000).toFixed(2)) : null,
      tps,
      date: new Date(solve.createdAt).toLocaleDateString(),
      isPB
    };
  });
}

export interface DistributionBucket {
  range: string;
  count: number;
}

export function generateDistribution(solves: Solve[]): DistributionBucket[] {
  const buckets: { [key: string]: number } = {
    '< 10s': 0,
    '10s - 15s': 0,
    '15s - 20s': 0,
    '20s - 25s': 0,
    '25s - 30s': 0,
    '30s - 45s': 0,
    '45s - 60s': 0,
    '60s+': 0
  };

  for (const s of solves) {
    const effective = getEffectiveTime(s);
    if (!isFinite(effective)) continue;
    const sec = effective / 1000;

    if (sec < 10) buckets['< 10s']++;
    else if (sec < 15) buckets['10s - 15s']++;
    else if (sec < 20) buckets['15s - 20s']++;
    else if (sec < 25) buckets['20s - 25s']++;
    else if (sec < 30) buckets['25s - 30s']++;
    else if (sec < 45) buckets['30s - 45s']++;
    else if (sec < 60) buckets['45s - 60s']++;
    else buckets['60s+']++;
  }

  return Object.entries(buckets).map(([range, count]) => ({ range, count }));
}

