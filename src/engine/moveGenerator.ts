import {
  BoardConfig,
  DEFAULT_BOARD_CONFIG,
  ALL_8_DIRECTIONS,
  ORTHOGONAL_DIRECTIONS,
  DIAGONAL_DIRECTIONS,
  KNIGHT_DIRECTIONS,
} from '../config/boardConfig';
import { Piece, Position, PlayerColor, PieceType, clonePiece, clonePosition, isWhite } from './pieces';
import { isWithinBoard, getPieceAt, isOpponentBaseline } from './board';
import { VALID_PROMOTION_CHOICES } from './promotionHandler';
import { isRegentThreatened } from './attackDetection';

export type MoveType =
  | 'move'
  | 'soldier_sacrifice'
  | 'horse_skip_turn'
  | 'rider_rotate'
  | 'bastion_bash'
  | 'siege_bash_two';

export interface Move {
  type: MoveType;
  pieceId: string;
  from: Position;
  to?: Position;
  targetPieceId?: string;
  promotionChoice?: PieceType;
  isBishopTransform?: boolean;
  isRookJump?: boolean;
  isKingTwoStep?: boolean;
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
    turnNumber?: number;
  }
): Move[] {
  const config = options?.config ?? DEFAULT_BOARD_CONFIG;
  const expandChoices = options?.expandChoices ?? true;
  const turnNumber = options?.turnNumber;

  const playerPieces = pieces.filter((p) => isWhite(p.owner) === isWhite(activePlayer));
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
        if (isWhite(occupant.owner) !== isWhite(activePlayer)) {
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
        // King: Passive ability - moves up to 2 spaces (cannot jump over pieces)
        for (const dir of ALL_8_DIRECTIONS) {
          const step1 = { row: piece.position.row + dir.dRow, col: piece.position.col + dir.dCol };
          if (isWithinBoard(step1, config)) {
            const occ1 = getPieceAt(pieces, step1);
            if (!occ1) {
              // 1 space move
              moves.push({
                type: 'move',
                pieceId: piece.id,
                from: piece.position,
                to: step1,
              });

              // 2 spaces move (only if intermediate step1 is unobstructed)
              const step2 = { row: piece.position.row + 2 * dir.dRow, col: piece.position.col + 2 * dir.dCol };
              if (isWithinBoard(step2, config)) {
                const occ2 = getPieceAt(pieces, step2);
                if (!occ2) {
                  moves.push({
                    type: 'move',
                    pieceId: piece.id,
                    from: piece.position,
                    to: step2,
                    isKingTwoStep: true,
                  });
                } else if (isWhite(occ2.owner) !== isWhite(activePlayer)) {
                  moves.push({
                    type: 'move',
                    pieceId: piece.id,
                    from: piece.position,
                    to: step2,
                    targetPieceId: occ2.id,
                    isKingTwoStep: true,
                  });
                }
              }
            } else if (isWhite(occ1.owner) !== isWhite(activePlayer)) {
              // 1 space capture (cannot continue to step 2)
              moves.push({
                type: 'move',
                pieceId: piece.id,
                from: piece.position,
                to: step1,
                targetPieceId: occ1.id,
              });
            }
          }
        }
        break;
      }

      case 'champion': {
        // Queen: Overpowered - standard 8 rays (orthogonal & diagonal)
        for (const dir of ALL_8_DIRECTIONS) {
          addRayMoves(piece, dir.dRow, dir.dCol);
        }
        break;
      }

      case 'bastion': {
        // Rook: Passive ability - can jump over a nearby (adjacent) piece by one square.
        // Cannot move along empty squares and jump at the same time!
        for (const dir of ORTHOGONAL_DIRECTIONS) {
          const adjPos = { row: piece.position.row + dir.dRow, col: piece.position.col + dir.dCol };
          if (!isWithinBoard(adjPos, config)) continue;

          const adjOcc = getPieceAt(pieces, adjPos);
          if (adjOcc) {
            // Case 1: Immediately adjacent (nearby) piece!
            // Direct capture of the adjacent piece if enemy:
            if (isWhite(adjOcc.owner) !== isWhite(activePlayer)) {
              moves.push({
                type: 'move',
                pieceId: piece.id,
                from: piece.position,
                to: adjPos,
                targetPieceId: adjOcc.id,
              });
            }

            // Passive jump: can leap over this nearby piece by 1 square to land at adjPos + dir (distance 2)!
            const jumpPos = { row: adjPos.row + dir.dRow, col: adjPos.col + dir.dCol };
            if (isWithinBoard(jumpPos, config)) {
              const jumpOcc = getPieceAt(pieces, jumpPos);
              if (!jumpOcc) {
                moves.push({
                  type: 'move',
                  pieceId: piece.id,
                  from: piece.position,
                  to: jumpPos,
                  isRookJump: true,
                });
              } else if (isWhite(jumpOcc.owner) !== isWhite(activePlayer)) {
                moves.push({
                  type: 'move',
                  pieceId: piece.id,
                  from: piece.position,
                  to: jumpPos,
                  targetPieceId: jumpOcc.id,
                  isRookJump: true,
                });
              }
            }
          } else {
            // Case 2: Adjacent square is empty! The Rook moves normally along the ray.
            // Since it is moving through empty space, it CANNOT jump!
            let r = adjPos.row;
            let c = adjPos.col;
            while (isWithinBoard({ row: r, col: c }, config)) {
              const occ = getPieceAt(pieces, { row: r, col: c });
              if (!occ) {
                moves.push({
                  type: 'move',
                  pieceId: piece.id,
                  from: piece.position,
                  to: { row: r, col: c },
                });
              } else {
                if (isWhite(occ.owner) !== isWhite(activePlayer)) {
                  moves.push({
                    type: 'move',
                    pieceId: piece.id,
                    from: piece.position,
                    to: { row: r, col: c },
                    targetPieceId: occ.id,
                  });
                }
                break; // Stopped by obstacle, no jumping allowed after moving!
              }
              r += dir.dRow;
              c += dir.dCol;
            }
          }
        }
        break;
      }

      case 'oracle': {
        // Bishop: Active ability - can transform into any piece they capture (once per game)
        const canTransform = !piece.specialAbilityState?.hasUsedTransform;

        for (const dir of DIAGONAL_DIRECTIONS) {
          let r = piece.position.row + dir.dRow;
          let c = piece.position.col + dir.dCol;

          while (isWithinBoard({ row: r, col: c }, config)) {
            const occ = getPieceAt(pieces, { row: r, col: c });
            if (!occ) {
              moves.push({
                type: 'move',
                pieceId: piece.id,
                from: piece.position,
                to: { row: r, col: c },
              });
            } else {
              if (isWhite(occ.owner) !== isWhite(activePlayer)) {
                // Standard capture
                moves.push({
                  type: 'move',
                  pieceId: piece.id,
                  from: piece.position,
                  to: { row: r, col: c },
                  targetPieceId: occ.id,
                });

                // Active ability: Transform on capture
                if (canTransform && expandChoices) {
                  moves.push({
                    type: 'move',
                    pieceId: piece.id,
                    from: piece.position,
                    to: { row: r, col: c },
                    targetPieceId: occ.id,
                    isBishopTransform: true,
                  });
                }
              }
              break; // Blocked
            }
            r += dir.dRow;
            c += dir.dCol;
          }
        }
        break;
      }

      case 'rider': {
        // Horse (Knight): Active ability - option to skip opponent's turn once; rests on next turn
        const isResting =
          piece.specialAbilityState?.skipTurnCooldownUntilTurn !== undefined &&
          turnNumber !== undefined &&
          turnNumber < piece.specialAbilityState.skipTurnCooldownUntilTurn;

        if (!isResting) {
          // Standard 8 L-shape jumps
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
              } else if (isWhite(occupant.owner) !== isWhite(activePlayer)) {
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

          // Active ability: Skip opponent's turn once
          if (!piece.specialAbilityState?.hasUsedSkipTurn) {
            moves.push({
              type: 'horse_skip_turn',
              pieceId: piece.id,
              from: piece.position,
            });
          }
        }
        break;
      }

      case 'soldier': {
        // Soldier (Pawn): Friendly elimination enabled for soldiers only
        const fwd = isWhite(piece.owner) ? -1 : 1;
        const startRow = isWhite(piece.owner) ? config.goldSoldierRow : config.silverSoldierRow;

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
            if (occupant && isWhite(occupant.owner) !== isWhite(activePlayer)) {
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

        // Lateral moves: Left and Right (Passive ability)
        for (const dCol of [-1, 1]) {
          const latPos = { row: piece.position.row, col: piece.position.col + dCol };
          if (isWithinBoard(latPos, config)) {
            const occupant = getPieceAt(pieces, latPos);
            const willPromote = isOpponentBaseline(latPos, piece.owner, config);
            if (!occupant) {
              // Move to empty square on left / right
              if (willPromote && expandChoices) {
                for (const promo of VALID_PROMOTION_CHOICES) {
                  moves.push({
                    type: 'move',
                    pieceId: piece.id,
                    from: piece.position,
                    to: latPos,
                    promotionChoice: promo,
                  });
                }
              } else {
                moves.push({
                  type: 'move',
                  pieceId: piece.id,
                  from: piece.position,
                  to: latPos,
                  promotionChoice: willPromote ? 'champion' : undefined,
                });
              }
            } else if (isWhite(occupant.owner) !== isWhite(activePlayer)) {
              // Capture enemy piece on left / right
              if (willPromote && expandChoices) {
                for (const promo of VALID_PROMOTION_CHOICES) {
                  moves.push({
                    type: 'move',
                    pieceId: piece.id,
                    from: piece.position,
                    to: latPos,
                    targetPieceId: occupant.id,
                    promotionChoice: promo,
                  });
                }
              } else {
                moves.push({
                  type: 'move',
                  pieceId: piece.id,
                  from: piece.position,
                  to: latPos,
                  targetPieceId: occupant.id,
                  promotionChoice: willPromote ? 'champion' : undefined,
                });
              }
            }
          }
        }

        // Friendly Elimination ability: Soldier can eliminate itself
        moves.push({
          type: 'soldier_sacrifice',
          pieceId: piece.id,
          from: piece.position,
        });
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
  if (move.type === 'soldier_sacrifice') {
    return pieces.filter((p) => p.id !== move.pieceId);
  }

  if (move.type === 'horse_skip_turn') {
    return pieces;
  }

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
        } else if (c.type === 'oracle' && move.isBishopTransform && move.targetPieceId) {
          const target = pieces.find((tp) => tp.id === move.targetPieceId);
          if (target) {
            c.type = target.type;
          }
        }
        return c;
      }
      return p;
    });
}
