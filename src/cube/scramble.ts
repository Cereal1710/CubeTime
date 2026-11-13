export interface ScrambleOptions {
  length?: number;
}

const FACES = ['U', 'D', 'R', 'L', 'F', 'B'] as const;
type Face = typeof FACES[number];

const SUFFIXES = ['', "'", '2'] as const;

// Opposite face pairs belonging to the same axis
const AXIS_MAP: Record<Face, number> = {
  U: 0,
  D: 0,
  R: 1,
  L: 1,
  F: 2,
  B: 2,
};

/**
 * Generates a valid WCA-compliant 3x3x3 scramble string.
 * Avoids same-face consecutive moves and opposite-face commuting cancellations.
 */
export function generate3x3Scramble(length: number = 21): string {
  const scrambleMoves: string[] = [];
  let lastFace: Face | null = null;
  let secondLastFace: Face | null = null;

  for (let i = 0; i < length; i++) {
    // Filter available faces
    const availableFaces = FACES.filter(face => {
      // Cannot repeat the exact same face as the immediate predecessor
      if (face === lastFace) return false;

      // If lastFace and face are on the same axis (opposites, like R and L),
      // and secondLastFace was ALSO on that axis, it would cause cancellation (e.g. R L R' -> R R' L)
      if (
        lastFace !== null &&
        secondLastFace !== null &&
        AXIS_MAP[face] === AXIS_MAP[lastFace] &&
        AXIS_MAP[face] === AXIS_MAP[secondLastFace]
      ) {
        return false;
      }

      return true;
    });

    const chosenFace = availableFaces[Math.floor(Math.random() * availableFaces.length)];
    const chosenSuffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];

    scrambleMoves.push(`${chosenFace}${chosenSuffix}`);
    secondLastFace = lastFace;
    lastFace = chosenFace;
  }

  return scrambleMoves.join(' ');
}

