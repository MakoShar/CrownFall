import { BoardConfig, DEFAULT_BOARD_CONFIG } from '../config/boardConfig';
import { Piece, PlayerColor, clonePiece, clonePosition, Position } from './pieces';
import { SeededRNG } from '../utils/seededRng';
import { Move, generateLegalMoves } from './moveGenerator';
import { executeBash, checkAndApplySiegeMode } from './bastionAbilities';
import { executeRiderRotation } from './riderOrientation';
import { executeOracleCapture } from './conversionHandler';
import { executePromotion, canSoldierPromote } from './promotionHandler';
import { GameStatus, handleRegentCapture } from './endgameHandler';
import { createInitialPieces } from '../config/startingFormation';
import { getPieceAt, formatPosition } from './board';

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
}): GameState {
  const config = options?.config ?? DEFAULT_BOARD_CONFIG;
  const rng = new SeededRNG(options?.seed ?? 42);
  const pieces = options?.customPieces ? options.customPieces.map(clonePiece) : createInitialPieces(config);

  return {
    pieces,
    activePlayer: 'gold',
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
  const opponent: PlayerColor = player === 'gold' ? 'silver' : 'gold';
  let moveDescription = '';

  const movingPiece = next.pieces.find((p) => p.id === move.pieceId);
  if (!movingPiece && move.type !== 'soldier_sacrifice') {
    throw new Error(`Piece with id ${move.pieceId} not found`);
  }

  // Handle Mutual Regent Response legality
  if (state.status === 'mutual_regent_response') {
    // Only legal move that captures the opponent's Regent is permitted!
    const targetPiece = move.targetPieceId ? next.pieces.find((p) => p.id === move.targetPieceId) : undefined;
    const isCapturingRegent = targetPiece && targetPiece.type === 'regent' && targetPiece.owner === opponent;

    if (!isCapturingRegent) {
      throw new Error('During Mutual Regent Response, only moves that capture the opposing Regent are permitted!');
    }
  }

  // Branch on Move Type
  switch (move.type) {
    case 'rider_rotate': {
      if (!move.newOrientation) throw new Error('newOrientation required for rider_rotate');
      next.pieces = executeRiderRotation(move.pieceId, move.newOrientation, next.pieces);
      moveDescription = `${player.toUpperCase()} Rider turned facing to ${move.newOrientation}.`;
      break;
    }

    case 'soldier_sacrifice': {
      next.pieces = next.pieces.filter((p) => p.id !== move.pieceId);
      moveDescription = `${player.toUpperCase()} sacrificed Soldier at ${formatPosition(move.from)} to clear the rank.`;
      break;
    }

    case 'bastion_bash': {
      if (!move.targetPieceId) throw new Error('targetPieceId required for bastion_bash');
      const bashRes = executeBash(move.pieceId, move.targetPieceId, next.pieces, next.rng, next.config);
      next.pieces = bashRes.updatedPieces;

      if (bashRes.targetDestroyed) {
        moveDescription = `${player.toUpperCase()} Bastion CRUSHED trapped enemy via BASH!`;
        // Check if trapped target was Regent!
        const trappedWasRegent = state.pieces.find((p) => p.id === move.targetPieceId)?.type === 'regent';
        if (trappedWasRegent) {
          const eg = handleRegentCapture(player, next.pieces, next.config);
          next.status = eg.newStatus;
          next.winner = eg.winner;
          next.statusReason = eg.reason;
        }
      } else {
        moveDescription = `${player.toUpperCase()} Bastion BASHED enemy to ${formatPosition(bashRes.targetPushedTo!)}.`;
      }
      break;
    }

    case 'siege_bash_two': {
      if (!move.targetPieceId || !move.secondTargetPieceId || !move.to) {
        throw new Error('siege_bash_two requires targetPieceId, secondTargetPieceId, and destination');
      }

      const t1 = next.pieces.find((p) => p.id === move.targetPieceId);
      const t2 = next.pieces.find((p) => p.id === move.secondTargetPieceId);
      const capturedRegent = (t1?.type === 'regent' || t2?.type === 'regent');

      // Both destroyed, Bastion moves to target 2's square
      next.pieces = next.pieces
        .filter((p) => p.id !== move.targetPieceId && p.id !== move.secondTargetPieceId)
        .map((p) => {
          if (p.id === move.pieceId) {
            const advanced = clonePiece(p);
            advanced.position = clonePosition(move.to!);
            return advanced;
          }
          return clonePiece(p);
        });

      moveDescription = `${player.toUpperCase()} Siege Bastion unleashed Enhanced BASH, destroying 2 units and advancing to ${formatPosition(move.to)}!`;

      if (capturedRegent) {
        if (state.status === 'mutual_regent_response') {
          // Counter-capture during mutual response -> DRAW!
          next.status = 'draw';
          next.winner = 'draw';
          next.statusReason = 'Mutual Regent Capture! Both Regents have fallen — the battle ends in an honorable DRAW!';
        } else {
          const eg = handleRegentCapture(player, next.pieces, next.config);
          next.status = eg.newStatus;
          next.winner = eg.winner;
          next.statusReason = eg.reason;
        }
      }
      break;
    }

    case 'move': {
      if (!move.to) throw new Error('destination "to" required for move');
      const targetPiece = move.targetPieceId ? next.pieces.find((p) => p.id === move.targetPieceId) : undefined;
      const isCapturingRegent = targetPiece && targetPiece.type === 'regent';

      if (movingPiece!.type === 'oracle' && targetPiece) {
        const oracleRes = executeOracleCapture(
          movingPiece!,
          targetPiece,
          next.pieces,
          move.oracleAction ?? 'capture'
        );
        next.pieces = oracleRes.updatedPieces;
        moveDescription = oracleRes.message;
      } else {
        // Normal move or capture
        if (targetPiece) {
          next.pieces = next.pieces.filter((p) => p.id !== targetPiece.id);
          moveDescription = `${player.toUpperCase()} ${movingPiece!.type} captured ${targetPiece.type} at ${formatPosition(move.to)}.`;
        } else {
          moveDescription = `${player.toUpperCase()} ${movingPiece!.type} moved to ${formatPosition(move.to)}.`;
        }

        // Advance moving piece to destination
        next.pieces = next.pieces.map((p) => {
          if (p.id === movingPiece!.id) {
            const moved = clonePiece(p);
            moved.position = clonePosition(move.to!);
            return moved;
          }
          return clonePiece(p);
        });
      }

      // Check Bastion baseline for permanent Siege Mode activation
      const pieceAfter = next.pieces.find((p) => p.id === movingPiece!.id);
      if (pieceAfter && pieceAfter.type === 'bastion') {
        if (checkAndApplySiegeMode(pieceAfter, next.config)) {
          moveDescription += ` [BASTION ENTERED SIEGE MODE!]`;
        }
      }

      // Check Soldier Promotion
      if (pieceAfter && pieceAfter.type === 'soldier' && canSoldierPromote(pieceAfter, next.config)) {
        if (move.promotionChoice) {
          next.pieces = executePromotion(pieceAfter.id, move.promotionChoice, next.pieces);
          moveDescription += ` [Promoted to ${move.promotionChoice.toUpperCase()}!]`;
        }
      }

      // Endgame Check for Regent Capture
      if (isCapturingRegent) {
        if (state.status === 'mutual_regent_response') {
          // Player B successfully counter-captured Player A's Regent -> DRAW!
          next.status = 'draw';
          next.winner = 'draw';
          next.statusReason = 'Mutual Regent Capture! Both Regents have fallen in mutual combat — the match ends in a DRAW!';
        } else {
          const eg = handleRegentCapture(player, next.pieces, next.config);
          next.status = eg.newStatus;
          next.winner = eg.winner;
          next.statusReason = eg.reason;

          if (eg.newStatus === 'mutual_regent_response') {
            // Verify if the opponent actually has any legal counter-moves that capture the Regent!
            const counterMoves = generateLegalMoves(next.pieces, opponent, {
              isMutualResponse: true,
              config: next.config,
            });
            if (counterMoves.length === 0) {
              // No legal Regent capture available for opponent -> Capturing player wins immediately!
              next.status = player === 'gold' ? 'gold_victory' : 'silver_victory';
              next.winner = player;
              next.statusReason = `${player.toUpperCase()} wins immediately! Regent captured, and opponent has no legal counter-capture available!`;
            }
          }
        }
      }
      break;
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
    next.activePlayer = opponent;
    if (next.activePlayer === 'gold') {
      next.turnNumber += 1;
    }
  } else if (next.status === 'mutual_regent_response') {
    // During mutual response, active player becomes the opponent for their single final response
    next.activePlayer = opponent;
  }

  return { nextState: next, log: moveDescription };
}

