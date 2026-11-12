import {
  BoardConfig,
  DEFAULT_BOARD_CONFIG,
  ALL_8_DIRECTIONS,
  ORTHOGONAL_DIRECTIONS,
  DIAGONAL_DIRECTIONS,
  KNIGHT_DIRECTIONS,
  getPawnAttackDirections,
} from '../config/boardConfig';
import { Piece, Position, PlayerColor, isSamePosition, positionKey, isWhite, isBlue } from './pieces';
import { isWithinBoard, getPieceAt } from './board';

export interface AttackMap {
  controlledSquares: {
    gold: Set<string>;
    silver: Set<string>;
    white: Set<string>;
    blue: Set<string>;
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
    white: boolean;
    blue: boolean;
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
      // King: Passive ability - moves up to 2 spaces (cannot jump over pieces)
      for (const dir of ALL_8_DIRECTIONS) {
        const step1 = { row: piece.position.row + dir.dRow, col: piece.position.col + dir.dCol };
        if (isWithinBoard(step1, config)) {
          const occ1 = getPieceAt(allPieces, step1);
          if (!occ1) {
            attackSquares.push(step1);
            // Can extend to step 2 because intermediate square is empty!
            const step2 = { row: piece.position.row + 2 * dir.dRow, col: piece.position.col + 2 * dir.dCol };
            if (isWithinBoard(step2, config)) {
              const occ2 = getPieceAt(allPieces, step2);
              if (!occ2) {
                attackSquares.push(step2);
              } else if (isWhite(occ2.owner) === isWhite(piece.owner)) {
                protectedSquares.push(step2);
              } else {
                attackSquares.push(step2);
              }
            }
          } else if (isWhite(occ1.owner) === isWhite(piece.owner)) {
            protectedSquares.push(step1);
          } else {
            attackSquares.push(step1);
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
      // Rook: 4 orthogonal rays + Passive ability to jump over a nearby (adjacent) piece by 1 square.
      // Rook cannot move and jump at the same time!
      for (const dir of ORTHOGONAL_DIRECTIONS) {
        const adjPos = { row: piece.position.row + dir.dRow, col: piece.position.col + dir.dCol };
        if (!isWithinBoard(adjPos, config)) continue;

        const adjOcc = getPieceAt(allPieces, adjPos);
        if (adjOcc) {
          // Immediately adjacent (nearby) piece
          if (isWhite(adjOcc.owner) === isWhite(piece.owner)) {
            protectedSquares.push(adjPos);
          } else {
            attackSquares.push(adjPos);
          }
          // Passive jump: can leap over this nearby piece by 1 square to land at distance 2!
          const jumpSq = { row: adjPos.row + dir.dRow, col: adjPos.col + dir.dCol };
          if (isWithinBoard(jumpSq, config)) {
            const jumpOcc = getPieceAt(allPieces, jumpSq);
            if (!jumpOcc) {
              attackSquares.push(jumpSq);
            } else if (isWhite(jumpOcc.owner) === isWhite(piece.owner)) {
              protectedSquares.push(jumpSq);
            } else {
              attackSquares.push(jumpSq);
            }
          }
        } else {
          // Adjacent square is empty! The Rook slides normally through empty space.
          // Since it moves through empty space, it CANNOT jump!
          let r = adjPos.row;
          let c = adjPos.col;
          while (isWithinBoard({ row: r, col: c }, config)) {
            const occ = getPieceAt(allPieces, { row: r, col: c });
            if (!occ) {
              attackSquares.push({ row: r, col: c });
            } else {
              if (isWhite(occ.owner) === isWhite(piece.owner)) {
                protectedSquares.push({ row: r, col: c });
              } else {
                attackSquares.push({ row: r, col: c });
              }
              break; // Ray blocked! No jumping after moving!
            }
            r += dir.dRow;
            c += dir.dCol;
          }
        }
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
          } else if (isWhite(occupant.owner) === isWhite(piece.owner)) {
            protectedSquares.push(target);
          } else {
            attackSquares.push(target);
          }
        }
      }
      // Lateral attack squares: Left & Right (Passive ability)
      for (const dCol of [-1, 1]) {
        const target = { row: piece.position.row, col: piece.position.col + dCol };
        if (isWithinBoard(target, config)) {
          const occupant = getPieceAt(allPieces, target);
          if (!occupant) {
            attackSquares.push(target);
          } else if (isWhite(occupant.owner) === isWhite(piece.owner)) {
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
    const targetSet = isWhite(piece.owner) ? controlledGold : controlledSilver;

    for (const sq of attackSquares) {
      targetSet.add(positionKey(sq));
      const targetPiece = getPieceAt(pieces, sq);
      if (targetPiece && isWhite(targetPiece.owner) !== isWhite(piece.owner)) {
        threatMap[targetPiece.id].push(piece.id);
      }
    }

    for (const sq of protectedSquares) {
      targetSet.add(positionKey(sq));
      const protectedPiece = getPieceAt(pieces, sq);
      if (protectedPiece && isWhite(protectedPiece.owner) === isWhite(piece.owner)) {
        protectionMap[protectedPiece.id].push(piece.id);
      }
    }
  }

  // Detect forks (a single piece threatening 2 or more distinct enemy pieces)
  const forks: AttackMap['forks'] = [];
  for (const piece of pieces) {
    const threatenedEnemyIds: string[] = [];
    for (const other of pieces) {
      if (isWhite(other.owner) !== isWhite(piece.owner) && threatMap[other.id]?.includes(piece.id)) {
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
  for (const player of ['white', 'blue'] as PlayerColor[]) {
    const regent = pieces.find((p) => isWhite(p.owner) === isWhite(player) && p.type === 'regent');
    if (!regent) continue;

    // Check sliding ray attackers from opponent (champion, oracle, bastion)
    const enemySliding = pieces.filter(
      (p) =>
        isWhite(p.owner) !== isWhite(player) &&
        (p.type === 'champion' || p.type === 'oracle' || p.type === 'bastion')
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
      if (enemy.type === 'bastion' && isOrthogonal) canPin = true;

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
        if (intervening.length === 1 && isWhite(intervening[0].owner) === isWhite(player)) {
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
  const whiteRegent = pieces.find((p) => isWhite(p.owner) && p.type === 'regent');
  const blueRegent = pieces.find((p) => isBlue(p.owner) && p.type === 'regent');

  return {
    controlledSquares: {
      gold: controlledGold,
      silver: controlledSilver,
      white: controlledGold,
      blue: controlledSilver,
    },
    protectionMap,
    threatMap,
    pinnedUnits,
    forks,
    regentThreatened: {
      gold: whiteRegent ? (threatMap[whiteRegent.id]?.length || 0) > 0 : false,
      silver: blueRegent ? (threatMap[blueRegent.id]?.length || 0) > 0 : false,
      white: whiteRegent ? (threatMap[whiteRegent.id]?.length || 0) > 0 : false,
      blue: blueRegent ? (threatMap[blueRegent.id]?.length || 0) > 0 : false,
    },
  };
}

export function isRegentThreatened(
  pieces: Piece[],
  player: PlayerColor,
  config: BoardConfig = DEFAULT_BOARD_CONFIG
): boolean {
  const regent = pieces.find((p) => isWhite(p.owner) === isWhite(player) && p.type === 'regent');
  if (!regent) return false;

  for (const piece of pieces) {
    if (isWhite(piece.owner) === isWhite(player)) continue;
    const { attackSquares } = getPieceRawAttackSquares(piece, pieces, config);
    if (attackSquares.some((sq) => isSamePosition(sq, regent.position))) {
      return true;
    }
  }
  return false;
}

