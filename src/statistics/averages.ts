import type { Solve } from '../types';

/**
 * Returns effective time in milliseconds considering penalties.
 * Returns Infinity for DNF.
 */
export function getEffectiveTime(solve: Solve): number {
  if (solve.penalty === 'dnf') return Infinity;
  if (solve.penalty === 'plus2') return solve.rawTimeMs + 2000;
  return solve.rawTimeMs;
}

/**
 * Formats milliseconds into mm:ss.xx or s.xx format
 */
export function formatTime(
  ms: number | null | undefined,
  precision: 'hundredths' | 'thousandths' = 'hundredths',
  showPlus: boolean = false
): string {
  if (ms === null || ms === undefined) return '--';
  if (!isFinite(ms)) return 'DNF';

  const isNegative = ms < 0;
  const absMs = Math.abs(ms);

  const totalSeconds = Math.floor(absMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const remainderMs = absMs % 1000;

  const decimals = precision === 'thousandths'
    ? Math.floor(remainderMs).toString().padStart(3, '0')
    : Math.floor(remainderMs / 10).toString().padStart(2, '0');

  let formatted = '';
  if (minutes > 0) {
    formatted = `${minutes}:${seconds.toString().padStart(2, '0')}.${decimals}`;
  } else {
    formatted = `${seconds}.${decimals}`;
  }

  if (isNegative) formatted = '-' + formatted;
  if (showPlus) formatted += '+';
  return formatted;
}

/**
 * Formats a Solve object directly with its penalty
 */
export function formatSolveTime(solve: Solve, precision: 'hundredths' | 'thousandths' = 'hundredths'): string {
  if (solve.penalty === 'dnf') return 'DNF';
  const effective = getEffectiveTime(solve);
  return formatTime(effective, precision, solve.penalty === 'plus2');
}

/**
 * Calculates WCA-compliant Average of N (AoN)
 * Returns null if not enough solves.
 * Returns Infinity if result is DNF.
 */
export function calculateAoN(solves: Solve[], n: number): number | null {
  if (solves.length < n) return null;

  // Take the last n solves (or provided slice)
  const slice = solves.slice(-n);
  const effectiveTimes = slice.map(getEffectiveTime);

  // Number of elements to trim from both ends
  let trimCount = 1;
  if (n >= 100) {
    trimCount = Math.round(n * 0.05);
  } else if (n >= 5) {
    trimCount = 1;
  } else {
    // For n=3 (Mo3)
    trimCount = 0;
  }

  // Count DNFs
  const dnfCount = effectiveTimes.filter(t => !isFinite(t)).length;
  if (dnfCount > trimCount) {
    return Infinity; // DNF
  }

  // Sort ascending
  const sorted = [...effectiveTimes].sort((a, b) => a - b);
  const trimmed = sorted.slice(trimCount, sorted.length - trimCount);

  if (trimmed.length === 0) return null;

  const sum = trimmed.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / trimmed.length);
}

/**
 * Calculates best AoN in the entire history of solves
 */
export function calculateBestAoN(solves: Solve[], n: number): number | null {
  if (solves.length < n) return null;

  let best: number | null = null;
  for (let i = 0; i <= solves.length - n; i++) {
    const windowSolves = solves.slice(i, i + n);
    const avg = calculateAoN(windowSolves, n);
    if (avg !== null && isFinite(avg)) {
      if (best === null || avg < best) {
        best = avg;
      }
    }
  }

  return best;
}

/**
 * Calculate best single time
 */
export function calculateBestSingle(solves: Solve[]): Solve | null {
  let bestSolve: Solve | null = null;
  let bestTime = Infinity;

  for (const s of solves) {
    const effective = getEffectiveTime(s);
    if (isFinite(effective) && effective < bestTime) {
      bestTime = effective;
      bestSolve = s;
    }
  }

  return bestSolve;
}

/**
 * Calculate overall session average (excluding DNFs from standard mean)
 */
export function calculateSessionMean(solves: Solve[]): number | null {
  const validTimes = solves.map(getEffectiveTime).filter(isFinite);
  if (validTimes.length === 0) return null;
  const sum = validTimes.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / validTimes.length);
}

