import { Direction } from '../config/boardConfig';

export type { Direction };
export type PieceType = 'regent' | 'champion' | 'rider' | 'oracle' | 'bastion' | 'soldier';
export type PlayerColor = 'white' | 'blue' | 'gold' | 'silver';

export function isWhite(color: PlayerColor): boolean {
  return color === 'white' || color === 'gold';
}

export function isBlue(color: PlayerColor): boolean {
  return color === 'blue' || color === 'silver';
}

export interface Position {
  row: number;
  col: number;
}

export interface PieceSpecialAbilityState {
  hasUsedSkipTurn?: boolean;
  skipTurnCooldownUntilTurn?: number; // Horse cannot move on the next turn after using skip
  hasUsedTransform?: boolean;         // Bishop can only transform once
  originalType?: PieceType;
  [key: string]: unknown;
}

export interface Piece {
  id: string;
  type: PieceType;
  owner: PlayerColor;
  position: Position;
  originalPosition: Position;
  orientation?: Direction;             // Rider: 'N' | 'S' | 'E' | 'W'
  isSiegeMode?: boolean;               // Bastion: true once baseline reached
  promotionEligible?: boolean;         // Soldier: reached baseline
  specialAbilityState?: PieceSpecialAbilityState;
}

export function isSamePosition(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

export function positionKey(pos: Position): string {
  return `${pos.row},${pos.col}`;
}

export function parsePositionKey(key: string): Position {
  const [row, col] = key.split(',').map(Number);
  return { row, col };
}

export function clonePosition(pos: Position): Position {
  return { row: pos.row, col: pos.col };
}

export function clonePiece(piece: Piece): Piece {
  return {
    ...piece,
    position: clonePosition(piece.position),
    originalPosition: clonePosition(piece.originalPosition),
    specialAbilityState: piece.specialAbilityState ? { ...piece.specialAbilityState } : undefined,
  };
}

let pieceIdCounter = 0;
export function resetPieceIdCounter(): void {
  pieceIdCounter = 0;
}

export function createPiece(
  type: PieceType,
  owner: PlayerColor,
  position: Position,
  options?: {
    id?: string;
    orientation?: Direction;
    isSiegeMode?: boolean;
    promotionEligible?: boolean;
    originalPosition?: Position;
  }
): Piece {
  const id = options?.id ?? `${owner}_${type}_${++pieceIdCounter}`;
  return {
    id,
    type,
    owner,
    position: clonePosition(position),
    originalPosition: options?.originalPosition ? clonePosition(options.originalPosition) : clonePosition(position),
    orientation: options?.orientation ?? (type === 'rider' ? (isWhite(owner) ? 'N' : 'S') : undefined),
    isSiegeMode: options?.isSiegeMode ?? false,
    promotionEligible: options?.promotionEligible ?? false,
    specialAbilityState: {},
  };
}
