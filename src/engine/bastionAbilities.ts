import { BoardConfig, DEFAULT_BOARD_CONFIG, ALL_8_DIRECTIONS } from '../config/boardConfig';
import { Piece, Position, isSamePosition, clonePiece, clonePosition } from './pieces';
import { isWithinBoard, getPieceAt, isOpponentBaseline } from './board';
import { SeededRNG } from '../utils/seededRng';

export interface BashResult {
  bastionId: string;
  targetId: string;
  targetPushedTo: Position | null; // null if destroyed
  targetDestroyed: boolean;
  updatedPieces: Piece[];
}

export function getSurroundingEmptySquares(
  center: Position,
  pieces: Piece[],
  config: BoardConfig = DEFAULT_BOARD_CONFIG
): Position[] {
  const result: Position[] = [];
  for (const dir of ALL_8_DIRECTIONS) {
    const candidate: Position = { row: center.row + dir.dRow, col: center.col + dir.dCol };
    if (isWithinBoard(candidate, config) && !getPieceAt(pieces, candidate)) {
      result.push(candidate);
    }
  }
  return result;
}

export function getLegalBashTargets(
  bastion: Piece,
  pieces: Piece[],
  config: BoardConfig = DEFAULT_BOARD_CONFIG
): Piece[] {
  const targets: Piece[] = [];
  for (const dir of ALL_8_DIRECTIONS) {
    const adjPos: Position = { row: bastion.position.row + dir.dRow, col: bastion.position.col + dir.dCol };
    if (isWithinBoard(adjPos, config)) {
      const occupant = getPieceAt(pieces, adjPos);
      if (occupant && occupant.owner !== bastion.owner) {
        targets.push(occupant);
      }
    }
  }
  return targets;
}

export function executeBash(
  bastionId: string,
  targetId: string,
  pieces: Piece[],
  rng: SeededRNG,
  config: BoardConfig = DEFAULT_BOARD_CONFIG
): BashResult {
  const bastion = pieces.find((p) => p.id === bastionId);
  const target = pieces.find((p) => p.id === targetId);
  if (!bastion || !target) {
    throw new Error('Bastion or target piece not found for BASH');
  }

  const surroundingEmpty = getSurroundingEmptySquares(target.position, pieces, config);
  let updatedPieces: Piece[];
  let pushedTo: Position | null = null;
  let targetDestroyed = false;

  if (surroundingEmpty.length === 0) {
    // If no valid empty surrounding square exists, the target is destroyed
    targetDestroyed = true;
    updatedPieces = pieces
      .filter((p) => p.id !== targetId)
      .map(clonePiece);
  } else {
    // Pick an empty square deterministically using the seeded RNG
    // Sort array first to ensure determinism regardless of order in memory
    surroundingEmpty.sort((a, b) => a.row !== b.row ? a.row - b.row : a.col - b.col);
    pushedTo = rng.pick(surroundingEmpty)!;
    updatedPieces = pieces.map((p) => {
      if (p.id === targetId) {
        const updated = clonePiece(p);
        updated.position = clonePosition(pushedTo!);
        return updated;
      }
      return clonePiece(p);
    });
  }

  return {
    bastionId,
    targetId,
    targetPushedTo: pushedTo,
    targetDestroyed,
    updatedPieces,
  };
}

export interface ConsecutiveSiegeTarget {
  dir: { dRow: number; dCol: number };
  firstTarget: Piece;
  secondTarget: Piece;
  landingPosition: Position; // Same as secondTarget.position
}

export function getConsecutiveSiegeBashTargets(
  bastion: Piece,
  pieces: Piece[],
  config: BoardConfig = DEFAULT_BOARD_CONFIG
): ConsecutiveSiegeTarget[] {
  if (!bastion.isSiegeMode) return [];

  const results: ConsecutiveSiegeTarget[] = [];

  for (const dir of ALL_8_DIRECTIONS) {
    const pos1 = { row: bastion.position.row + dir.dRow, col: bastion.position.col + dir.dCol };
    const pos2 = { row: bastion.position.row + dir.dRow * 2, col: bastion.position.col + dir.dCol * 2 };

    if (!isWithinBoard(pos1, config) || !isWithinBoard(pos2, config)) continue;

    const occ1 = getPieceAt(pieces, pos1);
    const occ2 = getPieceAt(pieces, pos2);

    if (occ1 && occ1.owner !== bastion.owner && occ2 && occ2.owner !== bastion.owner) {
      results.push({
        dir,
        firstTarget: occ1,
        secondTarget: occ2,
        landingPosition: pos2,
      });
    }
  }

  return results;
}

export interface SoldierLeapMove {
  destination: Position;
  jumpedSoldiers: Piece[];
  targetToCapture?: Piece;
}

export function getSoldierLeapMoves(
  bastion: Piece,
  pieces: Piece[],
  config: BoardConfig = DEFAULT_BOARD_CONFIG
): SoldierLeapMove[] {
  if (!bastion.isSiegeMode) return [];

  const moves: SoldierLeapMove[] = [];

  for (const dir of ALL_8_DIRECTIONS) {
    // Check 1: Jump over 1 soldier
    const pos1 = { row: bastion.position.row + dir.dRow, col: bastion.position.col + dir.dCol };
    const land1 = { row: bastion.position.row + dir.dRow * 2, col: bastion.position.col + dir.dCol * 2 };

    if (isWithinBoard(pos1, config) && isWithinBoard(land1, config)) {
      const occ1 = getPieceAt(pieces, pos1);
      if (occ1 && occ1.type === 'soldier') {
        const destPiece = getPieceAt(pieces, land1);
        if (!destPiece || destPiece.owner !== bastion.owner) {
          moves.push({
            destination: land1,
            jumpedSoldiers: [occ1],
            targetToCapture: destPiece && destPiece.owner !== bastion.owner ? destPiece : undefined,
          });
        }

        // Check 2: Jump over 2 consecutive soldiers
        const pos2 = land1; // pos2 is at step 2
        const land2 = { row: bastion.position.row + dir.dRow * 3, col: bastion.position.col + dir.dCol * 3 };

        if (occ1 && isWithinBoard(land2, config)) {
          const occ2 = getPieceAt(pieces, pos2);
          if (occ2 && occ2.type === 'soldier') {
            const destPiece2 = getPieceAt(pieces, land2);
            if (!destPiece2 || destPiece2.owner !== bastion.owner) {
              moves.push({
                destination: land2,
                jumpedSoldiers: [occ1, occ2],
                targetToCapture: destPiece2 && destPiece2.owner !== bastion.owner ? destPiece2 : undefined,
              });
            }
          }
        }
      }
    }
  }

  return moves;
}

export function checkAndApplySiegeMode(
  piece: Piece,
  config: BoardConfig = DEFAULT_BOARD_CONFIG
): boolean {
  if (piece.type === 'bastion' && !piece.isSiegeMode) {
    if (isOpponentBaseline(piece.position, piece.owner, config)) {
      piece.isSiegeMode = true;
      return true;
    }
  }
  return false;
}

