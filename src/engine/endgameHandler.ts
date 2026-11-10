import { PlayerColor, Piece } from './pieces';
import { isRegentThreatened } from './attackDetection';
import { BoardConfig, DEFAULT_BOARD_CONFIG } from '../config/boardConfig';

export type GameStatus =
  | 'in_progress'
  | 'mutual_regent_response'
  | 'gold_victory'
  | 'silver_victory'
  | 'draw';

export interface EndgameCheckResult {
  newStatus: GameStatus;
  winner: PlayerColor | 'draw' | null;
  reason: string;
}

export function handleRegentCapture(
  capturingPlayer: PlayerColor,
  piecesAfterCapture: Piece[],
  config: BoardConfig = DEFAULT_BOARD_CONFIG
): EndgameCheckResult {
  // Capturing player just captured opponent's Regent.
  // Check if capturing player's own Regent is currently threatened.
  const isCapturerRegentThreatened = isRegentThreatened(piecesAfterCapture, capturingPlayer, config);

  if (!isCapturerRegentThreatened) {
    // Normal immediate win!
    return {
      newStatus: capturingPlayer === 'gold' ? 'gold_victory' : 'silver_victory',
      winner: capturingPlayer,
      reason: `${capturingPlayer.toUpperCase()} captured the opposing Regent while their own Regent remained secure!`,
    };
  }

  // Capturing player's Regent IS threatened!
  // Trigger Mutual Regent Capture transition
  return {
    newStatus: 'mutual_regent_response',
    winner: null,
    reason: `MUTUAL THREAT! ${capturingPlayer.toUpperCase()} captured the Regent, but their own Regent is under direct threat! The opponent has one final response turn to strike back!`,
  };
}
