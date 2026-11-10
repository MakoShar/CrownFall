import { GameState } from '../engine/gameState';
import { Piece, PlayerColor } from '../engine/pieces';
import { computeAttackMap, isRegentThreatened } from '../engine/attackDetection';
import { BoardConfig, DEFAULT_BOARD_CONFIG } from '../config/boardConfig';

export const PIECE_VALUES: Record<string, number> = {
  regent: 100000,
  champion: 1000,
  oracle: 450,
  bastion: 350,
  rider: 320,
  soldier: 100,
};

export interface EvaluationWeights {
  material: number;
  boardControl: number;
  protection: number;
  threats: number;
  regentSafety: number;
  advancement: number;
  siegeBonus: number;
}

export const DEFAULT_EVAL_WEIGHTS: EvaluationWeights = {
  material: 1.0,
  boardControl: 10.0,
  protection: 15.0,
  threats: 25.0,
  regentSafety: 50.0,
  advancement: 12.0,
  siegeBonus: 200.0,
};

export function evaluatePosition(
  state: GameState,
  weights: EvaluationWeights = DEFAULT_EVAL_WEIGHTS
): number {
  // Check terminal conditions
  if (state.status === 'gold_victory') return 1000000;
  if (state.status === 'silver_victory') return -1000000;
  if (state.status === 'draw') return 0;

  let score = 0;
  const config = state.config;

  // 1. Material & Piece-Specific Position
  for (const piece of state.pieces) {
    const baseValue = PIECE_VALUES[piece.type] || 100;
    let pieceValue = baseValue;

    // Bastion Siege mode bonus
    if (piece.type === 'bastion' && piece.isSiegeMode) {
      pieceValue += weights.siegeBonus;
    }

    // Soldier advancement bonus towards baseline
    if (piece.type === 'soldier') {
      const distanceToBaseline = piece.owner === 'gold'
        ? piece.position.row // Row 0 is gold's target
        : (config.rows - 1 - piece.position.row); // Row 7 is silver's target
      const advancementProgress = (config.rows - 1 - distanceToBaseline);
      pieceValue += advancementProgress * weights.advancement;
    }

    // Rider orientation alignment
    if (piece.type === 'rider') {
      if (piece.owner === 'gold' && piece.orientation === 'N') pieceValue += 15;
      if (piece.owner === 'silver' && piece.orientation === 'S') pieceValue += 15;
    }

    if (piece.owner === 'gold') {
      score += pieceValue * weights.material;
    } else {
      score -= pieceValue * weights.material;
    }
  }

  // 2. Attack Map: Board Control, Protections, and Threats
  const attackMap = computeAttackMap(state.pieces, config);

  const goldControl = attackMap.controlledSquares.gold.size;
  const silverControl = attackMap.controlledSquares.silver.size;
  score += (goldControl - silverControl) * weights.boardControl;

  // Protection & Threat evaluations
  for (const piece of state.pieces) {
    const protectors = attackMap.protectionMap[piece.id]?.length || 0;
    const threats = attackMap.threatMap[piece.id]?.length || 0;
    const baseVal = PIECE_VALUES[piece.type] || 100;

    const protectionDelta = protectors * weights.protection;
    const threatDelta = threats > 0 ? (threats * weights.threats * (baseVal / 300)) : 0;

    if (piece.owner === 'gold') {
      score += protectionDelta;
      score -= threatDelta;
    } else {
      score -= protectionDelta;
      score += threatDelta;
    }
  }

  // 3. Regent Safety
  if (attackMap.regentThreatened.gold) {
    score -= weights.regentSafety * 10;
  }
  if (attackMap.regentThreatened.silver) {
    score += weights.regentSafety * 10;
  }

  return score;
}
