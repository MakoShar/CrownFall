import { BoardConfig, DEFAULT_BOARD_CONFIG, ALL_8_DIRECTIONS, DIAGONAL_DIRECTIONS } from '../config/boardConfig';
import { Piece, Position, PlayerColor, PieceType, isSamePosition, positionKey, clonePiece } from './pieces';
import { isWithinBoard, getPieceAt, isOpponentBaseline } from './board';
import { getLegalBashTargets, getConsecutiveSiegeBashTargets, getSoldierLeapMoves } from './bastionAbilities';
import { getLegalRotations } from './riderOrientation';
import { isConvertibleByOracle } from './conversionHandler';
import { VALID_PROMOTION_CHOICES } from './promotionHandler';

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
  secondTargetPieceId?: string;
  newOrientation?: 'N' | 'S' | 'E' | 'W';
  oracleAction?: 'capture' | 'convert';
  promotionChoice?: PieceType;
  isSoldierLeap?: boolean;
  leapedPieceIds?: string[];
}

export function generateLegalMoves(
  pieces: Piece[],
  activePlayer: PlayerColor,
  options?: {
    isMutualResponse?: boolean; // When true, only moves that capture opposing Regent are legal
    expandChoices?: boolean;    // When true, enumerate oracle conversion and promotion choices
    config?: BoardConfig;
  }
): Move[] {
  const config = options?.config ?? DEFAULT_BOARD_CONFIG;
  const isMutual = options?.isMutualResponse ?? false;
  const expandChoices = options?.expandChoices ?? true;

  const opponentRegent = pieces.find((p) => p.owner !== activePlayer && p.type === 'regent');
  const playerPieces = pieces.filter((p) => p.owner === activePlayer);
  const moves: Move[] = [];

  const addRayMoves = (piece: Piece, dRow: number, dCol: number) => {
    let r = piece.position.row + dRow;
    let c = piece.position.col + dCol;

    while (isWithinBoard({ row: r, col: c }, config)) {
      const occupant = getPieceAt(pieces, { row: r, col: c });
      if (!occupant) {
        if (!isMutual) {
          moves.push({
            type: 'move',
            pieceId: piece.id,
            from: piece.position,
            to: { row: r, col: c },
          });
        }
      } else {
        if (occupant.owner !== activePlayer) {
          // Can capture
          if (isMutual) {
            if (occupant.type === 'regent') {
              moves.push({
                type: 'move',
                pieceId: piece.id,
                from: piece.position,
                to: { row: r, col: c },
                targetPieceId: occupant.id,
              });
            }
          } else {
            if (piece.type === 'oracle' && isConvertibleByOracle(occupant) && expandChoices) {
              moves.push({
                type: 'move',
                pieceId: piece.id,
                from: piece.position,
                to: { row: r, col: c },
                targetPieceId: occupant.id,
                oracleAction: 'capture',
              });
              moves.push({
                type: 'move',
                pieceId: piece.id,
                from: piece.position,
                to: { row: r, col: c },
                targetPieceId: occupant.id,
                oracleAction: 'convert',
              });
            } else {
              moves.push({
                type: 'move',
                pieceId: piece.id,
                from: piece.position,
                to: { row: r, col: c },
                targetPieceId: occupant.id,
              });
            }
          }
        }
        break; // Blocked by piece
      }
      r += dRow;
      c += dCol;
    }
  };

  for (const piece of playerPieces) {
    switch (piece.type) {
      case 'regent': {
        for (const dir of ALL_8_DIRECTIONS) {
          const target = { row: piece.position.row + dir.dRow, col: piece.position.col + dir.dCol };
          if (isWithinBoard(target, config)) {
            const occupant = getPieceAt(pieces, target);
            if (!occupant) {
              if (!isMutual) {
                moves.push({
                  type: 'move',
                  pieceId: piece.id,
                  from: piece.position,
                  to: target,
                });
              }
            } else if (occupant.owner !== activePlayer) {
              if (!isMutual || occupant.type === 'regent') {
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
        }
        break;
      }

      case 'champion': {
        for (const dir of ALL_8_DIRECTIONS) {
          addRayMoves(piece, dir.dRow, dir.dCol);
        }
        break;
      }

      case 'oracle': {
        for (const dir of DIAGONAL_DIRECTIONS) {
          addRayMoves(piece, dir.dRow, dir.dCol);
        }
        break;
      }

      case 'rider': {
        // Linear movement along facing direction
        if (piece.orientation === 'N' || piece.orientation === 'S') {
          addRayMoves(piece, -1, 0);
          addRayMoves(piece, 1, 0);
        } else if (piece.orientation === 'E' || piece.orientation === 'W') {
          addRayMoves(piece, 0, -1);
          addRayMoves(piece, 0, 1);
        }

        // Rotations consume turn (not allowed in mutual regent response)
        if (!isMutual) {
          const rotations = getLegalRotations(piece);
          for (const newOrientation of rotations) {
            moves.push({
              type: 'rider_rotate',
              pieceId: piece.id,
              from: piece.position,
              newOrientation,
            });
          }
        }
        break;
      }

      case 'bastion': {
        // Normal 1-step moves
        for (const dir of ALL_8_DIRECTIONS) {
          const target = { row: piece.position.row + dir.dRow, col: piece.position.col + dir.dCol };
          if (isWithinBoard(target, config)) {
            const occupant = getPieceAt(pieces, target);
            if (!occupant) {
              if (!isMutual) {
                moves.push({
                  type: 'move',
                  pieceId: piece.id,
                  from: piece.position,
                  to: target,
                });
              }
            } else if (occupant.owner !== activePlayer) {
              if (!isMutual || occupant.type === 'regent') {
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
        }

        // BASH actions
        if (!isMutual) {
          const bashTargets = getLegalBashTargets(piece, pieces, config);
          for (const target of bashTargets) {
            moves.push({
              type: 'bastion_bash',
              pieceId: piece.id,
              from: piece.position,
              targetPieceId: target.id,
            });
          }
        }

        // Siege Mode special abilities
        if (piece.isSiegeMode) {
          // Ability 1: Enhanced 2-consecutive BASH
          const siegeBashTargets = getConsecutiveSiegeBashTargets(piece, pieces, config);
          for (const sTarget of siegeBashTargets) {
            if (!isMutual || sTarget.firstTarget.type === 'regent' || sTarget.secondTarget.type === 'regent') {
              moves.push({
                type: 'siege_bash_two',
                pieceId: piece.id,
                from: piece.position,
                to: sTarget.landingPosition,
                targetPieceId: sTarget.firstTarget.id,
                secondTargetPieceId: sTarget.secondTarget.id,
              });
            }
          }

          // Ability 2: Soldier Leap
          const leapMoves = getSoldierLeapMoves(piece, pieces, config);
          for (const lMove of leapMoves) {
            if (!isMutual || (lMove.targetToCapture && lMove.targetToCapture.type === 'regent')) {
              moves.push({
                type: 'move',
                pieceId: piece.id,
                from: piece.position,
                to: lMove.destination,
                targetPieceId: lMove.targetToCapture?.id,
                isSoldierLeap: true,
                leapedPieceIds: lMove.jumpedSoldiers.map((s) => s.id),
              });
            }
          }
        }
        break;
      }

      case 'soldier': {
        // Normal 1-step moves in 8 directions
        for (const dir of ALL_8_DIRECTIONS) {
          const target = { row: piece.position.row + dir.dRow, col: piece.position.col + dir.dCol };
          if (isWithinBoard(target, config)) {
            const occupant = getPieceAt(pieces, target);
            const willReachBaseline = isOpponentBaseline(target, piece.owner, config);

            if (!occupant) {
              if (!isMutual) {
                if (willReachBaseline && expandChoices) {
                  for (const promo of VALID_PROMOTION_CHOICES) {
                    moves.push({
                      type: 'move',
                      pieceId: piece.id,
                      from: piece.position,
                      to: target,
                      promotionChoice: promo,
                    });
                  }
                } else {
                  moves.push({
                    type: 'move',
                    pieceId: piece.id,
                    from: piece.position,
                    to: target,
                  });
                }
              }
            } else if (occupant.owner !== activePlayer) {
              if (!isMutual || occupant.type === 'regent') {
                if (willReachBaseline && expandChoices) {
                  for (const promo of VALID_PROMOTION_CHOICES) {
                    moves.push({
                      type: 'move',
                      pieceId: piece.id,
                      from: piece.position,
                      to: target,
                      targetPieceId: occupant.id,
                      promotionChoice: promo,
                    });
                  }
                } else {
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
          }
        }

        // Friendly Soldier Elimination
        if (!isMutual) {
          moves.push({
            type: 'soldier_sacrifice',
            pieceId: piece.id,
            from: piece.position,
          });
        }
        break;
      }
    }
  }

  return moves;
}
