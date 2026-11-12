import { BoardConfig, DEFAULT_BOARD_CONFIG } from '../config/boardConfig';
import { Piece, PlayerColor, clonePiece, clonePosition, Position, isWhite, isBlue } from './pieces';
import { SeededRNG } from '../utils/seededRng';
import { Move, generateLegalMoves } from './moveGenerator';
import { executePromotion, canSoldierPromote } from './promotionHandler';
import { GameStatus } from './endgameHandler';
import { createInitialPieces } from '../config/startingFormation';
import { formatPosition } from './board';
import { isRegentThreatened } from './attackDetection';

export interface GameHistoryEntry {
  move: Move;
  activePlayer: PlayerColor;
  description: string;
  piecesSnapshot: Piece[];
  rngState: number;
}

export interface PendingOracleChoice {
  oraclePiece: Piece;
  targetPiece: Piece;
  to: Position;
}

export interface PendingPromotionChoice {
  soldierPiece: Piece;
  to: Position;
  targetPieceId?: string;
}

export interface GameState {
  pieces: Piece[];
  activePlayer: PlayerColor;
  turnNumber: number;
  status: GameStatus;
  winner: PlayerColor | 'draw' | null;
  statusReason?: string;
  config: BoardConfig;
  rng: SeededRNG;
  history: GameHistoryEntry[];
  pendingOracleChoice?: PendingOracleChoice;
  pendingPromotionChoice?: PendingPromotionChoice;
}

export function createInitialGameState(options?: {
  config?: BoardConfig;
  seed?: number;
  customPieces?: Piece[];
  activePlayer?: PlayerColor;
}): GameState {
  const config = options?.config ?? DEFAULT_BOARD_CONFIG;
  const rng = new SeededRNG(options?.seed ?? 42);
  const pieces = options?.customPieces ? options.customPieces.map(clonePiece) : createInitialPieces(config);
  const activePlayer: PlayerColor =
    options?.activePlayer ?? (pieces.some((p) => p.owner === 'gold') ? 'gold' : 'white');

  return {
    pieces,
    activePlayer,
    turnNumber: 1,
    status: 'in_progress',
    winner: null,
    config,
    rng,
    history: [],
  };
}

export function cloneGameState(state: GameState): GameState {
  return {
    pieces: state.pieces.map(clonePiece),
    activePlayer: state.activePlayer,
    turnNumber: state.turnNumber,
    status: state.status,
    winner: state.winner,
    statusReason: state.statusReason,
    config: { ...state.config },
    rng: state.rng.clone(),
    history: [...state.history],
    pendingOracleChoice: state.pendingOracleChoice ? {
      oraclePiece: clonePiece(state.pendingOracleChoice.oraclePiece),
      targetPiece: clonePiece(state.pendingOracleChoice.targetPiece),
      to: clonePosition(state.pendingOracleChoice.to),
    } : undefined,
    pendingPromotionChoice: state.pendingPromotionChoice ? {
      soldierPiece: clonePiece(state.pendingPromotionChoice.soldierPiece),
      to: clonePosition(state.pendingPromotionChoice.to),
      targetPieceId: state.pendingPromotionChoice.targetPieceId,
    } : undefined,
  };
}

export function applyMove(state: GameState, move: Move): { nextState: GameState; log: string } {
  if (state.status !== 'in_progress' && state.status !== 'mutual_regent_response') {
    throw new Error(`Cannot make a move in game status: ${state.status}`);
  }

  const next = cloneGameState(state);
  const initialRngState = state.rng.getState();
  const player = state.activePlayer;
  const isWhitePlayer = isWhite(player);
  const opponent: PlayerColor = isWhitePlayer
    ? (player === 'gold' ? 'silver' : 'blue')
    : (player === 'silver' ? 'gold' : 'white');
  let moveDescription = '';
  let skipOpponentTurn = false;

  const movingPiece = next.pieces.find((p) => p.id === move.pieceId);
  if (!movingPiece && move.type !== 'soldier_sacrifice') {
    throw new Error(`Piece with id ${move.pieceId} not found`);
  }

  if (move.type === 'soldier_sacrifice') {
    next.pieces = next.pieces.filter((p) => p.id !== move.pieceId);
    moveDescription = `${player.toUpperCase()} eliminated friendly Soldier at ${formatPosition(move.from)}.`;
  } else if (move.type === 'horse_skip_turn') {
    skipOpponentTurn = true;
    next.pieces = next.pieces.map((p) => {
      if (p.id === move.pieceId) {
        const h = clonePiece(p);
        h.specialAbilityState = {
          ...h.specialAbilityState,
          hasUsedSkipTurn: true,
          // Horse rests on next turn
          skipTurnCooldownUntilTurn: next.turnNumber + 2,
        };
        return h;
      }
      return clonePiece(p);
    });
    moveDescription = `${player.toUpperCase()} Horse activated active ability: SKIPPED ${opponent.toUpperCase()}'s turn!`;
  } else {
    // Standard move or capture
    if (!move.to) {
      throw new Error('destination "to" required for move');
    }

    const targetPiece = move.targetPieceId ? next.pieces.find((p) => p.id === move.targetPieceId) : undefined;

    // Remove captured piece if any
    if (targetPiece) {
      next.pieces = next.pieces.filter((p) => p.id !== targetPiece.id);
      if (move.isBishopTransform) {
        moveDescription = `${player.toUpperCase()} Bishop captured ${targetPiece.type} at ${formatPosition(move.to)} and TRANSFORMED into a ${targetPiece.type.toUpperCase()}!`;
      } else {
        moveDescription = `${player.toUpperCase()} ${movingPiece!.type} captured ${targetPiece.type} at ${formatPosition(move.to)}.`;
      }
    } else {
      if (move.isKingTwoStep) {
        moveDescription = `${player.toUpperCase()} King surged 2 spaces to ${formatPosition(move.to)}.`;
      } else if (move.isRookJump) {
        moveDescription = `${player.toUpperCase()} Rook jumped over nearby piece to ${formatPosition(move.to)}.`;
      } else {
        moveDescription = `${player.toUpperCase()} ${movingPiece!.type} moved to ${formatPosition(move.to)}.`;
      }
    }

    // Advance moving piece to destination
    next.pieces = next.pieces.map((p) => {
      if (p.id === movingPiece!.id) {
        const moved = clonePiece(p);
        moved.position = clonePosition(move.to!);
        if (move.isBishopTransform && targetPiece) {
          moved.type = targetPiece.type;
          moved.specialAbilityState = {
            ...moved.specialAbilityState,
            hasUsedTransform: true,
            originalType: 'oracle',
          };
        }
        return moved;
      }
      return clonePiece(p);
    });

    // Handle pawn promotion if moving piece reaches baseline
    const pieceAfter = next.pieces.find((p) => p.id === movingPiece!.id);
    if (pieceAfter && pieceAfter.type === 'soldier' && canSoldierPromote(pieceAfter, next.config)) {
      const promo = move.promotionChoice ?? 'champion';
      next.pieces = executePromotion(pieceAfter.id, promo, next.pieces);
      moveDescription += ` [Promoted to ${promo.toUpperCase()}!]`;
    }
  }

  // Check & Checkmate detection according to normal chess rules
  if (next.status === 'in_progress') {
    const opponentRegent = next.pieces.find((p) => isWhite(p.owner) !== isWhitePlayer && p.type === 'regent');
    if (opponentRegent) {
      const opponentInCheck = isRegentThreatened(next.pieces, opponent, next.config);
      const opponentLegalMoves = generateLegalMoves(next.pieces, opponent, {
        config: next.config,
        turnNumber: next.turnNumber,
      });

      if (opponentLegalMoves.length === 0) {
        if (opponentInCheck) {
          next.status = isWhitePlayer
            ? (player === 'gold' ? 'gold_victory' : ('white_victory' as any))
            : (player === 'silver' ? 'silver_victory' : ('blue_victory' as any));
          next.winner = player;
          next.statusReason = `CHECKMATE! ${opponent.toUpperCase()} Regent is trapped in check with no escape. ${player.toUpperCase()} Kingdom wins!`;
          moveDescription += ` [CHECKMATE!]`;
        } else {
          next.status = 'draw';
          next.winner = 'draw';
          next.statusReason = `STALEMATE! ${opponent.toUpperCase()} Kingdom has no legal moves. The match ends in a DRAW!`;
          moveDescription += ` [STALEMATE!]`;
        }
      } else if (opponentInCheck) {
        moveDescription += ` [CHECK!]`;
        next.statusReason = `${opponent.toUpperCase()} Regent is in CHECK!`;
      }
    }
  }

  // Turn switching & history recording
  next.history.push({
    move,
    activePlayer: player,
    description: moveDescription,
    piecesSnapshot: state.pieces.map(clonePiece),
    rngState: initialRngState,
  });

  if (next.status === 'in_progress') {
    if (skipOpponentTurn) {
      // Active player gets another turn immediately!
      next.turnNumber += 1;
    } else {
      next.activePlayer = opponent;
      if (isWhite(next.activePlayer)) {
        next.turnNumber += 1;
      }
    }
  }

  return { nextState: next, log: moveDescription };
}

