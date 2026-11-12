export interface BoardConfig {
  rows: number;
  cols: number;
  goldBaselineRow: number;
  silverBaselineRow: number;
  goldSoldierRow: number;
  silverSoldierRow: number;
  goldBackRow: number;
  silverBackRow: number;
}

export const DEFAULT_BOARD_CONFIG: BoardConfig = {
  rows: 8,
  cols: 8,
  goldBaselineRow: 0,      // Opponent baseline that Gold aims to reach (row 0)
  silverBaselineRow: 7,    // Opponent baseline that Silver aims to reach (row 7)
  goldBackRow: 7,          // Gold kingdom's starting back rank
  goldSoldierRow: 6,       // Gold kingdom's starting infantry rank
  silverBackRow: 0,        // Silver kingdom's starting back rank
  silverSoldierRow: 1,     // Silver kingdom's starting infantry rank
};

export type Direction = 'N' | 'S' | 'E' | 'W';

export const DIRECTION_VECTORS: Record<Direction, { dRow: number; dCol: number }> = {
  N: { dRow: -1, dCol: 0 },
  S: { dRow: 1, dCol: 0 },
  E: { dRow: 0, dCol: 1 },
  W: { dRow: 0, dCol: -1 },
};

export const ALL_8_DIRECTIONS = [
  { dRow: -1, dCol: 0 },   // N
  { dRow: 1, dCol: 0 },    // S
  { dRow: 0, dCol: -1 },   // W
  { dRow: 0, dCol: 1 },    // E
  { dRow: -1, dCol: -1 },  // NW
  { dRow: -1, dCol: 1 },   // NE
  { dRow: 1, dCol: -1 },   // SW
  { dRow: 1, dCol: 1 },    // SE
] as const;

export const ORTHOGONAL_DIRECTIONS = [
  { dRow: -1, dCol: 0 },
  { dRow: 1, dCol: 0 },
  { dRow: 0, dCol: -1 },
  { dRow: 0, dCol: 1 },
] as const;

export const DIAGONAL_DIRECTIONS = [
  { dRow: -1, dCol: -1 },
  { dRow: -1, dCol: 1 },
  { dRow: 1, dCol: -1 },
  { dRow: 1, dCol: 1 },
] as const;

export const KNIGHT_DIRECTIONS = [
  { dRow: -2, dCol: -1 },
  { dRow: -2, dCol: 1 },
  { dRow: -1, dCol: -2 },
  { dRow: -1, dCol: 2 },
  { dRow: 1, dCol: -2 },
  { dRow: 1, dCol: 2 },
  { dRow: 2, dCol: -1 },
  { dRow: 2, dCol: 1 },
] as const;

export function getPawnAttackDirections(owner: 'gold' | 'silver'): { dRow: number; dCol: number }[] {
  const fwd = owner === 'gold' ? -1 : 1;
  return [
    { dRow: fwd, dCol: -1 },
    { dRow: fwd, dCol: 1 },
  ];
}


