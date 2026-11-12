import {
  BoardConfig,
  DEFAULT_BOARD_CONFIG,
  ALL_8_DIRECTIONS,
  ORTHOGONAL_DIRECTIONS,
  DIAGONAL_DIRECTIONS,
  KNIGHT_DIRECTIONS,
} from '../config/boardConfig';
import { Piece, Position, PlayerColor, PieceType, clonePiece, clonePosition } from './pieces';
import { isWithinBoard, getPieceAt, isOpponentBaseline } from './board';
import { VALID_PROMOTION_CHOICES } from './promotionHandler';
import { isRegentThreatened } from './attackDetection';

export type MoveType =
  | 'move'
  | 'rider_rotate'
  | 'bastion_bash'
  | 'siege_bash_two'
  | 'soldier_sacrifice';

export interface Move {
  type: MoveType;
  pieceId: string;
  from: Position;
  to?: Position;
  targetPieceId?: string;
  promotionChoice?: PieceType;
  // Retained for backward type compatibility
  newOrientation?: 'N' | 'S' | 'E' | 'W';
  oracleAction?: 'capture' | 'convert';
  secondTargetPieceId?: string;
  isSoldierLeap?: boolean;
  leapedPieceIds?: string[];
}

export function generateLegalMoves(
  pieces: Piece[],
  activePlayer: PlayerColor,
  options?: {
    isMutualResponse?: boolean;
    expandChoices?: boolean;
    config?: BoardConfig;
  }
): Move[] {
  const config = options?.config ?? DEFAULT_BOARD_CONFIG;
  const expandChoices = options?.expandChoices ?? true;

  const playerPieces = pieces.filter((p) => p.owner === activePlayer);
  const moves: Move[] = [];

  const addRayMoves = (piece: Piece, dRow: number, dCol: number) => {
    let r = piece.position.row + dRow;
    let c = piece.position.col + dCol;

    while (isWithinBoard({ row: r, col: c }, config)) {
      const occupant = getPieceAt(pieces, { row: r, col: c });
      if (!occupant) {
        moves.push({
          type: 'move',
          pieceId: piece.id,
          from: piece.position,
          to: { row: r, col: c },
        });
      } else {
        if (occupant.owner !== activePlayer) {
          moves.push({
            type: 'move',
            pieceId: piece.id,
            from: piece.position,
            to: { row: r, col: c },
            targetPieceId: occupant.id,
          });
        }
        break; // Blocked
      }
      r += dRow;
      c += dCol;
    }
  };

  for (const piece of playerPieces) {
    switch (piece.type) {
      case 'regent': {
        // King: 1 square in all 8 directions
        for (const dir of ALL_8_DIRECTIONS) {
          const target = { row: piece.position.row + dir.dRow, col: piece.position.col + dir.dCol };
          if (isWithinBoard(target, config)) {
            const occupant = getPieceAt(pieces, target);
            if (!occupant) {
              moves.push({
                type: 'move',
                pieceId: piece.id,
                from: piece.position,
                to: target,
              });
            } else if (occupant.owner !== activePlayer) {
              moves.push({
                type: 'move',
                pieceId: piece.id,
                from: piece.position,
                to: target,
                targetPieceId: occupant.id,
              });
            }
          }
        }
        break;
      }

      case 'champion': {
        // Queen: 8 rays (orthogonal & diagonal)
        for (const dir of ALL_8_DIRECTIONS) {
          addRayMoves(piece, dir.dRow, dir.dCol);
        }
        break;
      }

      case 'bastion': {
        // Rook: 4 orthogonal rays
        for (const dir of ORTHOGONAL_DIRECTIONS) {
          addRayMoves(piece, dir.dRow, dir.dCol);
        }
        break;
      }

      case 'oracle': {
        // Bishop: 4 diagonal rays
        for (const dir of DIAGONAL_DIRECTIONS) {
          addRayMoves(piece, dir.dRow, dir.dCol);
        }
        break;
      }

      case 'rider': {
        // Knight: 8 L-shape jumps
        for (const jump of KNIGHT_DIRECTIONS) {
          const target = { row: piece.position.row + jump.dRow, col: piece.position.col + jump.dCol };
          if (isWithinBoard(target, config)) {
            const occupant = getPieceAt(pieces, target);
            if (!occupant) {
              moves.push({
                type: 'move',
                pieceId: piece.id,
                from: piece.position,
                to: target,
              });
            } else if (occupant.owner !== activePlayer) {
              moves.push({
                type: 'move',
                pieceId: piece.id,
                from: piece.position,
                to: target,
                targetPieceId: occupant.id,
              });
            }
          }
        }
        break;
      }

      case 'soldier': {
        // Pawn: moves forward 1 step, 2 steps from starting row, captures diagonally
        const fwd = piece.owner === 'gold' ? -1 : 1;
        const startRow = piece.owner === 'gold' ? config.goldSoldierRow : config.silverSoldierRow;

        // 1 step forward
        const step1 = { row: piece.position.row + fwd, col: piece.position.col };
        if (isWithinBoard(step1, config) && !getPieceAt(pieces, step1)) {
          const willPromote = isOpponentBaseline(step1, piece.owner, config);
          if (willPromote && expandChoices) {
            for (const promo of VALID_PROMOTION_CHOICES) {
              moves.push({
                type: 'move',
                pieceId: piece.id,
                from: piece.position,
                to: step1,
                promotionChoice: promo,
              });
            }
          } else {
            moves.push({
              type: 'move',
              pieceId: piece.id,
              from: piece.position,
              to: step1,
              promotionChoice: willPromote ? 'champion' : undefined,
            });
          }

          // 2 steps forward from starting row
          if (piece.position.row === startRow) {
            const step2 = { row: piece.position.row + 2 * fwd, col: piece.position.col };
            if (isWithinBoard(step2, config) && !getPieceAt(pieces, step2)) {
              moves.push({
                type: 'move',
                pieceId: piece.id,
                from: piece.position,
                to: step2,
              });
            }
          }
        }

        // Diagonal forward captures
        for (const dCol of [-1, 1]) {
          const diag = { row: piece.position.row + fwd, col: piece.position.col + dCol };
          if (isWithinBoard(diag, config)) {
            const occupant = getPieceAt(pieces, diag);
            if (occupant && occupant.owner !== activePlayer) {
              const willPromote = isOpponentBaseline(diag, piece.owner, config);
              if (willPromote && expandChoices) {
                for (const promo of VALID_PROMOTION_CHOICES) {
                  moves.push({
                    type: 'move',
                    pieceId: piece.id,
                    from: piece.position,
                    to: diag,
                    targetPieceId: occupant.id,
                    promotionChoice: promo,
                  });
                }
              } else {
                moves.push({
                  type: 'move',
                  pieceId: piece.id,
                  from: piece.position,
                  to: diag,
                  targetPieceId: occupant.id,
                  promotionChoice: willPromote ? 'champion' : undefined,
                });
              }
            }
          }
        }
        break;
      }
    }
  }

  // Filter out any move that leaves or puts own Regent in check
  return moves.filter((m) => {
    const after = simulateMovePieces(pieces, m, config);
    return !isRegentThreatened(after, activePlayer, config);
  });
}

export function simulateMovePieces(
  pieces: Piece[],
  move: Move,
  config: BoardConfig = DEFAULT_BOARD_CONFIG
): Piece[] {
  if (!move.to) return pieces;
  const moving = pieces.find((p) => p.id === move.pieceId);
  if (!moving) return pieces;

  return pieces
    .filter((p) => p.id !== move.targetPieceId)
    .map((p) => {
      if (p.id === moving.id) {
        const c = clonePiece(p);
        c.position = clonePosition(move.to!);
        if (c.type === 'soldier' && move.promotionChoice) {
          c.type = move.promotionChoice;
        }
        return c;
      }
      return p;
    });
}
