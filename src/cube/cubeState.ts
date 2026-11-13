export type FaceName = 'U' | 'R' | 'F' | 'D' | 'L' | 'B';

export const FACE_NAMES: FaceName[] = ['U', 'R', 'F', 'D', 'L', 'B'];

export const FACE_COLORS: Record<FaceName, string> = {
  U: '#FFFFFF', // White
  D: '#FFD500', // Yellow
  F: '#009B48', // Green
  B: '#0046AD', // Blue
  L: '#FF5800', // Orange
  R: '#B71234', // Red
};

export const SOLVED_FACELETS = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';

/**
 * 3x3 Cube state representation.
 * Array of 54 characters representing stickers in U1-U9, R1-R9, F1-F9, D1-D9, L1-L9, B1-B9 order.
 */
export class CubeState {
  private facelets: FaceName[];

  constructor(initialFacelets?: string) {
    if (initialFacelets && initialFacelets.length === 54) {
      this.facelets = initialFacelets.split('') as FaceName[];
    } else {
      this.facelets = SOLVED_FACELETS.split('') as FaceName[];
    }
  }

  clone(): CubeState {
    const copy = new CubeState();
    copy.facelets = [...this.facelets];
    return copy;
  }

  reset(): void {
    this.facelets = SOLVED_FACELETS.split('') as FaceName[];
  }

  getFaceletsString(): string {
    return this.facelets.join('');
  }

  setFromFacelets(faceletsStr: string): void {
    if (faceletsStr.length === 54) {
      this.facelets = faceletsStr.split('') as FaceName[];
    }
  }

  /**
   * Check if the cube is solved.
   * A cube is solved if all stickers on each face have the same color as the center sticker of that face.
   */
  isSolved(): boolean {
    for (let faceIdx = 0; faceIdx < 6; faceIdx++) {
      const offset = faceIdx * 9;
      const centerColor = this.facelets[offset + 4];
      for (let i = 0; i < 9; i++) {
        if (this.facelets[offset + i] !== centerColor) {
          return false;
        }
      }
    }
    return true;
  }

  getFacelet(face: FaceName, index: number): FaceName {
    const faceOffset = FACE_NAMES.indexOf(face) * 9;
    return this.facelets[faceOffset + index];
  }

  /**
   * Rotates a 3x3 face clockwise.
   * 0 1 2       6 3 0
   * 3 4 5  ==>  7 4 1
   * 6 7 8       8 5 2
   */
  private rotateFaceCW(faceOffset: number): void {
    const f = this.facelets;
    const temp0 = f[faceOffset + 0];
    const temp1 = f[faceOffset + 1];

    f[faceOffset + 0] = f[faceOffset + 6];
    f[faceOffset + 1] = f[faceOffset + 3];
    f[faceOffset + 6] = f[faceOffset + 8];
    f[faceOffset + 3] = f[faceOffset + 7];
    f[faceOffset + 8] = f[faceOffset + 2];
    f[faceOffset + 7] = f[faceOffset + 5];
    f[faceOffset + 2] = temp0;
    f[faceOffset + 5] = temp1;
  }

  /**
   * Apply a standard single move (e.g. U, U', U2, R, R', R2, etc.)
   */
  applyMove(move: string): void {
    const trimmed = move.trim();
    if (!trimmed) return;

    const face = trimmed[0].toUpperCase() as FaceName;
    const modifier = trimmed.slice(1);

    const turns = modifier === '2' ? 2 : modifier === "'" ? 3 : 1;

    for (let t = 0; t < turns; t++) {
      this.applyBaseMoveCW(face);
    }
  }

  /**
   * Apply a sequence of moves (e.g. "R U R' U'")
   */
  applyMoves(movesStr: string): void {
    const tokens = movesStr.trim().split(/\s+/);
    for (const token of tokens) {
      if (token) {
        this.applyMove(token);
      }
    }
  }

  private applyBaseMoveCW(face: FaceName): void {
    const f = this.facelets;
    // Offsets: U: 0, R: 9, F: 18, D: 27, L: 36, B: 45
    const uOffset = 0;
    const rOffset = 9;
    const fOffset = 18;
    const dOffset = 27;
    const lOffset = 36;
    const bOffset = 45;

    switch (face) {
      case 'U': {
        this.rotateFaceCW(uOffset);
        // Adjacent strips: F(0,1,2), L(0,1,2), B(0,1,2), R(0,1,2)
        // CW: F -> L -> B -> R -> F
        const temp = [f[fOffset], f[fOffset + 1], f[fOffset + 2]];
        f[fOffset] = f[rOffset];
        f[fOffset + 1] = f[rOffset + 1];
        f[fOffset + 2] = f[rOffset + 2];

        f[rOffset] = f[bOffset];
        f[rOffset + 1] = f[bOffset + 1];
        f[rOffset + 2] = f[bOffset + 2];

        f[bOffset] = f[lOffset];
        f[bOffset + 1] = f[lOffset + 1];
        f[bOffset + 2] = f[lOffset + 2];

        f[lOffset] = temp[0];
        f[lOffset + 1] = temp[1];
        f[lOffset + 2] = temp[2];
        break;
      }
      case 'D': {
        this.rotateFaceCW(dOffset);
        // CW: F(6,7,8) -> R(6,7,8) -> B(6,7,8) -> L(6,7,8) -> F(6,7,8)
        const temp = [f[fOffset + 6], f[fOffset + 7], f[fOffset + 8]];
        f[fOffset + 6] = f[lOffset + 6];
        f[fOffset + 7] = f[lOffset + 7];
        f[fOffset + 8] = f[lOffset + 8];

        f[lOffset + 6] = f[bOffset + 6];
        f[lOffset + 7] = f[bOffset + 7];
        f[lOffset + 8] = f[bOffset + 8];

        f[bOffset + 6] = f[rOffset + 6];
        f[bOffset + 7] = f[rOffset + 7];
        f[bOffset + 8] = f[rOffset + 8];

        f[rOffset + 6] = temp[0];
        f[rOffset + 7] = temp[1];
        f[rOffset + 8] = temp[2];
        break;
      }
      case 'R': {
        this.rotateFaceCW(rOffset);
        // Adjacent strips: U(2,5,8), B(6,3,0), D(2,5,8), F(2,5,8)
        const temp = [f[uOffset + 2], f[uOffset + 5], f[uOffset + 8]];
        f[uOffset + 2] = f[fOffset + 2];
        f[uOffset + 5] = f[fOffset + 5];
        f[uOffset + 8] = f[fOffset + 8];

        f[fOffset + 2] = f[dOffset + 2];
        f[fOffset + 5] = f[dOffset + 5];
        f[fOffset + 8] = f[dOffset + 8];

        f[dOffset + 2] = f[bOffset + 6];
        f[dOffset + 5] = f[bOffset + 3];
        f[dOffset + 8] = f[bOffset + 0];

        f[bOffset + 6] = temp[0];
        f[bOffset + 3] = temp[1];
        f[bOffset + 0] = temp[2];
        break;
      }
      case 'L': {
        this.rotateFaceCW(lOffset);
        // Adjacent strips: U(0,3,6), F(0,3,6), D(0,3,6), B(8,5,2)
        const temp = [f[uOffset + 0], f[uOffset + 3], f[uOffset + 6]];
        f[uOffset + 0] = f[bOffset + 8];
        f[uOffset + 3] = f[bOffset + 5];
        f[uOffset + 6] = f[bOffset + 2];

        f[bOffset + 8] = f[dOffset + 0];
        f[bOffset + 5] = f[dOffset + 3];
        f[bOffset + 2] = f[dOffset + 6];

        f[dOffset + 0] = f[fOffset + 0];
        f[dOffset + 3] = f[fOffset + 3];
        f[dOffset + 6] = f[fOffset + 6];

        f[fOffset + 0] = temp[0];
        f[fOffset + 3] = temp[1];
        f[fOffset + 6] = temp[2];
        break;
      }
      case 'F': {
        this.rotateFaceCW(fOffset);
        // Adjacent strips: U(6,7,8), R(0,3,6), D(2,1,0), L(8,5,2)
        const temp = [f[uOffset + 6], f[uOffset + 7], f[uOffset + 8]];
        f[uOffset + 6] = f[lOffset + 8];
        f[uOffset + 7] = f[lOffset + 5];
        f[uOffset + 8] = f[lOffset + 2];

        f[lOffset + 8] = f[dOffset + 2];
        f[lOffset + 5] = f[dOffset + 1];
        f[lOffset + 2] = f[dOffset + 0];

        f[dOffset + 2] = f[rOffset + 0];
        f[dOffset + 1] = f[rOffset + 3];
        f[dOffset + 0] = f[rOffset + 6];

        f[rOffset + 0] = temp[0];
        f[rOffset + 3] = temp[1];
        f[rOffset + 6] = temp[2];
        break;
      }
      case 'B': {
        this.rotateFaceCW(bOffset);
        // Adjacent strips: U(2,1,0), L(0,3,6), D(6,7,8), R(8,5,2)
        const temp = [f[uOffset + 2], f[uOffset + 1], f[uOffset + 0]];
        f[uOffset + 2] = f[rOffset + 8];
        f[uOffset + 1] = f[rOffset + 5];
        f[uOffset + 0] = f[rOffset + 2];

        f[rOffset + 8] = f[dOffset + 6];
        f[rOffset + 5] = f[dOffset + 7];
        f[rOffset + 2] = f[dOffset + 8];

        f[dOffset + 6] = f[lOffset + 0];
        f[dOffset + 7] = f[lOffset + 3];
        f[dOffset + 8] = f[lOffset + 6];

        f[lOffset + 0] = temp[0];
        f[lOffset + 3] = temp[1];
        f[lOffset + 6] = temp[2];
        break;
      }
    }
  }
}
