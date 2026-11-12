import {
  BoardConfig,
  DEFAULT_BOARD_CONFIG,
  ALL_8_DIRECTIONS,
  ORTHOGONAL_DIRECTIONS,
  DIAGONAL_DIRECTIONS,
  KNIGHT_DIRECTIONS,
  getPawnAttackDirections,
} from '../config/boardConfig';
import { Piece, Position, PlayerColor, isSamePosition, positionKey } from './pieces';
import { isWithinBoard, getPieceAt } from './board';

export interface AttackMap {
  controlledSquares: {
    gold: Set<string>;
    silver: Set<string>;
  };
  protectionMap: {
    // pieceId -> array of pieceIds that protect it
    [pieceId: string]: string[];
  };
  threatMap: {
    // pieceId -> array of enemy pieceIds that threaten it
    [pieceId: string]: string[];
  };
  pinnedUnits: {
    pieceId: string;
    pinnerId: string;
    pinnedToRegentId: string;
  }[];
  forks: {
    attackerId: string;
    threatenedPieceIds: string[];
  }[];
  regentThreatened: {
    gold: boolean;
    silver: boolean;
  };
}

export function getPieceRawAttackSquares(
  piece: Piece,
  allPieces: Piece[],
  config: BoardConfig = DEFAULT_BOARD_CONFIG
): { attackSquares: Position[]; protectedSquares: Position[] } {
  const attackSquares: Position[] = [];
  const protectedSquares: Position[] = [];

  const addRay = (dRow: number, dCol: number) => {
    let r = piece.position.row + dRow;
    let c = piece.position.col + dCol;

    while (isWithinBoard({ row: r, col: c }, config)) {
      const occupant = getPieceAt(allPieces, { row: r, col: c });
      if (!occupant) {
        attackSquares.push({ row: r, col: c });
      } else {
        if (occupant.owner === piece.owner) {
          protectedSquares.push({ row: r, col: c });
        } else {
          attackSquares.push({ row: r, col: c });
        }
        break; // Ray blocked
      }
      r += dRow;
      c += dCol;
    }
  };

  switch (piece.type) {
    case 'regent':
      // King: 8 surrounding squares
      for (const dir of ALL_8_DIRECTIONS) {
        const target = { row: piece.position.row + dir.dRow, col: piece.position.col + dir.dCol };
        if (isWithinBoard(target, config)) {
          const occupant = getPieceAt(allPieces, target);
          if (!occupant) {
            attackSquares.push(target);
          } else if (occupant.owner === piece.owner) {
            protectedSquares.push(target);
          } else {
            attackSquares.push(target);
          }
        }
      }
      break;

    case 'champion':
      // Queen: All 8 orthogonal and diagonal rays
      for (const dir of ALL_8_DIRECTIONS) {
        addRay(dir.dRow, dir.dCol);
      }
      break;

    case 'bastion':
      // Rook: 4 orthogonal rays
      for (const dir of ORTHOGONAL_DIRECTIONS) {
        addRay(dir.dRow, dir.dCol);
      }
      break;

    case 'oracle':
      // Bishop: 4 diagonal rays
      for (const dir of DIAGONAL_DIRECTIONS) {
        addRay(dir.dRow, dir.dCol);
      }
      break;

    case 'rider':
      // Knight: 8 L-shape jumps
      for (const jump of KNIGHT_DIRECTIONS) {
        const target = { row: piece.position.row + jump.dRow, col: piece.position.col + jump.dCol };
        if (isWithinBoard(target, config)) {
          const occupant = getPieceAt(allPieces, target);
          if (!occupant) {
            attackSquares.push(target);
          } else if (occupant.owner === piece.owner) {
            protectedSquares.push(target);
          } else {
            attackSquares.push(target);
          }
        }
      }
      break;

    case 'soldier': {
      // Pawn: 2 diagonal forward attack squares
      const dirs = getPawnAttackDirections(piece.owner);
      for (const dir of dirs) {
        const target = { row: piece.position.row + dir.dRow, col: piece.position.col + dir.dCol };
        if (isWithinBoard(target, config)) {
          const occupant = getPieceAt(allPieces, target);
          if (!occupant) {
            attackSquares.push(target);
          } else if (occupant.owner === piece.owner) {
            protectedSquares.push(target);
          } else {
            attackSquares.push(target);
          }
        }
      }
      break;
    }
  }

  return { attackSquares, protectedSquares };
}

export function computeAttackMap(
  pieces: Piece[],
  config: BoardConfig = DEFAULT_BOARD_CONFIG
): AttackMap {
  const controlledGold = new Set<string>();
  const controlledSilver = new Set<string>();
  const protectionMap: Record<string, string[]> = {};
  const threatMap: Record<string, string[]> = {};

  for (const piece of pieces) {
    protectionMap[piece.id] = [];
    threatMap[piece.id] = [];
  }

  for (const piece of pieces) {
    const { attackSquares, protectedSquares } = getPieceRawAttackSquares(piece, pieces, config);
    const targetSet = piece.owner === 'gold' ? controlledGold : controlledSilver;

    for (const sq of attackSquares) {
      targetSet.add(positionKey(sq));
      const targetPiece = getPieceAt(pieces, sq);
      if (targetPiece && targetPiece.owner !== piece.owner) {
        threatMap[targetPiece.id].push(piece.id);
      }
    }

    for (const sq of protectedSquares) {
      targetSet.add(positionKey(sq));
      const protectedPiece = getPieceAt(pieces, sq);
      if (protectedPiece && protectedPiece.owner === piece.owner) {
        protectionMap[protectedPiece.id].push(piece.id);
      }
    }
  }

  // Detect forks (a single piece threatening 2 or more distinct enemy pieces)
  const forks: AttackMap['forks'] = [];
  for (const piece of pieces) {
    const threatenedEnemyIds: string[] = [];
    for (const other of pieces) {
      if (other.owner !== piece.owner && threatMap[other.id].includes(piece.id)) {
        threatenedEnemyIds.push(other.id);
      }
    }
    if (threatenedEnemyIds.length >= 2) {
      forks.push({
        attackerId: piece.id,
        threatenedPieceIds: threatenedEnemyIds,
      });
    }
  }

  // Detect pins to Regent
  const pinnedUnits: AttackMap['pinnedUnits'] = [];
  for (const player of ['gold', 'silver'] as PlayerColor[]) {
    const regent = pieces.find((p) => p.owner === player && p.type === 'regent');
    if (!regent) continue;

    // Check sliding ray attackers from opponent (champion, oracle, rider)
    const enemySliding = pieces.filter(
      (p) =>
        p.owner !== player &&
        (p.type === 'champion' || p.type === 'oracle' || p.type === 'rider')
    );

    for (const enemy of enemySliding) {
      const dRow = Math.sign(regent.position.row - enemy.position.row);
      const dCol = Math.sign(regent.position.col - enemy.position.col);

      // Check if enemy aligns with Regent
      const isOrthogonal = (dRow === 0 && dCol !== 0) || (dRow !== 0 && dCol === 0);
      const isDiagonal = Math.abs(regent.position.row - enemy.position.row) === Math.abs(regent.position.col - enemy.position.col) && dRow !== 0;

      let canPin = false;
      if (enemy.type === 'champion' && (isOrthogonal || isDiagonal)) canPin = true;
      if (enemy.type === 'oracle' && isDiagonal) canPin = true;
      if (enemy.type === 'rider') {
        if ((enemy.orientation === 'N' || enemy.orientation === 'S') && dCol === 0 && dRow !== 0) canPin = true;
        if ((enemy.orientation === 'E' || enemy.orientation === 'W') && dRow === 0 && dCol !== 0) canPin = true;
      }

      if (canPin) {
        let r = enemy.position.row + dRow;
        let c = enemy.position.col + dCol;
        const intervening: Piece[] = [];

        while (isWithinBoard({ row: r, col: c }, config)) {
          if (r === regent.position.row && c === regent.position.col) {
            break;
          }
          const occ = getPieceAt(pieces, { row: r, col: c });
          if (occ) intervening.push(occ);
          r += dRow;
          c += dCol;
        }

        // If exactly 1 friendly piece intervenes between enemy and friendly Regent, it is pinned!
        if (intervening.length === 1 && intervening[0].owner === player) {
          pinnedUnits.push({
            pieceId: intervening[0].id,
            pinnerId: enemy.id,
            pinnedToRegentId: regent.id,
          });
        }
      }
    }
  }

  // Regent threat check
  const goldRegent = pieces.find((p) => p.owner === 'gold' && p.type === 'regent');
  const silverRegent = pieces.find((p) => p.owner === 'silver' && p.type === 'regent');

  return {
    controlledSquares: {
      gold: controlledGold,
      silver: controlledSilver,
    },
    protectionMap,
    threatMap,
    pinnedUnits,
    forks,
    regentThreatened: {
      gold: goldRegent ? threatMap[goldRegent.id]?.length > 0 : false,
      silver: silverRegent ? threatMap[silverRegent.id]?.length > 0 : false,
    },
  };
}

export function isRegentThreatened(
  pieces: Piece[],
  player: PlayerColor,
  config: BoardConfig = DEFAULT_BOARD_CONFIG
): boolean {
  const regent = pieces.find((p) => p.owner === player && p.type === 'regent');
  if (!regent) return false;

  for (const piece of pieces) {
    if (piece.owner === player) continue;
    const { attackSquares } = getPieceRawAttackSquares(piece, pieces, config);
    if (attackSquares.some((sq) => isSamePosition(sq, regent.position))) {
      return true;
    }
  }
  return false;
}

