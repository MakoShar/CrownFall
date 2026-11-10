import { EvaluationWeights, DEFAULT_EVAL_WEIGHTS } from './evaluation';

export type AIDifficulty = 'beginner' | 'intermediate' | 'expert';

export interface AIDifficultyConfig {
  name: AIDifficulty;
  label: string;
  depth: number;
  useAlphaBeta: boolean;
  useMoveOrdering: boolean;
  weights: EvaluationWeights;
  description: string;
}

export const DIFFICULTY_PRESETS: Record<AIDifficulty, AIDifficultyConfig> = {
  beginner: {
    name: 'beginner',
    label: 'Apprentice (Beginner)',
    depth: 1,
    useAlphaBeta: false,
    useMoveOrdering: false,
    weights: {
      material: 1.0,
      boardControl: 0,
      protection: 0,
      threats: 5,
      regentSafety: 20,
      advancement: 2,
      siegeBonus: 50,
    },
    description: 'Shallow search with basic material calculations and straightforward maneuvers.',
  },
  intermediate: {
    name: 'intermediate',
    label: 'Tactician (Intermediate)',
    depth: 2,
    useAlphaBeta: true,
    useMoveOrdering: true,
    weights: {
      material: 1.0,
      boardControl: 8,
      protection: 10,
      threats: 20,
      regentSafety: 40,
      advancement: 10,
      siegeBonus: 150,
    },
    description: 'Alpha-Beta pruned tree search with positional control and promotion foresight.',
  },
  expert: {
    name: 'expert',
    label: 'Grandmaster (Expert)',
    depth: 3,
    useAlphaBeta: true,
    useMoveOrdering: true,
    weights: {
      material: 1.0,
      boardControl: 15,
      protection: 25,
      threats: 45,
      regentSafety: 80,
      advancement: 20,
      siegeBonus: 250,
    },
    description: 'Deep Alpha-Beta pruning with move ordering, threat anticipation, Oracle conversion timing, and Bastion siege strategy.',
  },
};

