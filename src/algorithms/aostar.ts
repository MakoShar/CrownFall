import { GameState } from '../engine/gameState';
import { PlayerColor, Piece } from '../engine/pieces';
import { computeAttackMap } from '../engine/attackDetection';

export type ANDORNodeType = 'OR' | 'AND' | 'TERMINAL';

export interface ANDORHyperBranch {
  id: string;
  description: string;
  cost: number;
  subGoalIds: string[];
}

export interface ANDORNode {
  id: string;
  type: ANDORNodeType;
  label: string;
  description: string;
  heuristicCost: number;
  currentCost: number;
  isSolved: boolean;
  branches: ANDORHyperBranch[]; // For OR nodes: candidate strategies. For AND branches: handled by hyper-arcs
  bestBranchId?: string;       // Optimal selected hyper-branch
}

export interface AOStarGraph {
  rootId: string;
  nodes: Record<string, ANDORNode>;
  optimalPlanSummary: string[];
  totalCost: number;
}

export function runAOStar(
  state: GameState,
  goalType: 'assassinate_regent' | 'siege_citadel' | 'divine_sacrifice' = 'assassinate_regent'
): AOStarGraph {
  const player = state.activePlayer;
  const opponent: PlayerColor = player === 'gold' ? 'silver' : 'gold';
  const nodes: Record<string, ANDORNode> = {};

  const opponentRegent = state.pieces.find((p) => p.owner === opponent && p.type === 'regent');
  const playerChampion = state.pieces.find((p) => p.owner === player && p.type === 'champion');
  const playerOracle = state.pieces.find((p) => p.owner === player && p.type === 'oracle');
  const playerBastion = state.pieces.find((p) => p.owner === player && p.type === 'bastion');
  const playerSoldiers = state.pieces.filter((p) => p.owner === player && p.type === 'soldier');
  const opponentBastion = state.pieces.find((p) => p.owner === opponent && p.type === 'bastion');

  // Root Goal Node (OR node): Player has multiple alternative strategic doctrines
  const rootId = 'GOAL_ROOT';
  nodes[rootId] = {
    id: rootId,
    type: 'OR',
    label: `Crownfall: ${goalType.replace('_', ' ').toUpperCase()}`,
    description: `Overall Kingdom Strategic Objective for ${player.toUpperCase()}`,
    heuristicCost: 10,
    currentCost: 10,
    isSolved: false,
    branches: [],
  };

  // Build genuine AND-OR hypergraph based on current board state
  // Branch 1: Flank & Infiltrate (OR option 1)
  // Requires: [Distract Bastion] AND [Deliver Precision Strike]
  const branch1Id = 'BRANCH_FLANK_INFILTRATE';
  const sub1_1Id = 'SUB_DISTRACT_BASTION';
  const sub1_2Id = 'SUB_STRIKE_REGENT';

  // Branch 2: Center Vanguard Breakthrough (OR option 2)
  // Requires: [Advance Infantry Wall] AND [Siege Mode Activation]
  const branch2Id = 'BRANCH_VANGUARD_BREAKTHROUGH';
  const sub2_1Id = 'SUB_ADVANCE_INFANTRY';
  const sub2_2Id = 'SUB_ACTIVATE_SIEGE';

  // Subgoal 1.1: Distract Bastion (OR node: Can be done by Soldier Sacrifice OR Rider Maneuver)
  nodes[sub1_1Id] = {
    id: sub1_1Id,
    type: 'OR',
    label: 'Neutralize / Distract Opponent Bastion',
    description: 'Divert defensive Bastion threat to create an opening',
    heuristicCost: 4,
    currentCost: 4,
    isSolved: false,
    branches: [
      {
        id: 'OPT_SOLDIER_FEINT',
        description: 'Bait Bastion with Infantry Feint Sacrifice',
        cost: 2,
        subGoalIds: ['LEAF_SOLDIER_FEINT'],
      },
      {
        id: 'OPT_RIDER_PIN',
        description: 'Pin Bastion along Rider Directional Axis',
        cost: 3,
        subGoalIds: ['LEAF_RIDER_PIN'],
      },
    ],
  };

  nodes['LEAF_SOLDIER_FEINT'] = {
    id: 'LEAF_SOLDIER_FEINT',
    type: 'TERMINAL',
    label: 'Action: Soldier Feint',
    description: 'Move forward Soldier to absorb Bastion BASH displacement',
    heuristicCost: 2,
    currentCost: 2,
    isSolved: true,
    branches: [],
  };

  nodes['LEAF_RIDER_PIN'] = {
    id: 'LEAF_RIDER_PIN',
    type: 'TERMINAL',
    label: 'Action: Rider Axis Threat',
    description: 'Orient Rider along Bastion file to restrict displacement angles',
    heuristicCost: 3,
    currentCost: 3,
    isSolved: true,
    branches: [],
  };

  // Subgoal 1.2: Strike Regent (OR node: Champion direct line OR Oracle conversion blitz)
  nodes[sub1_2Id] = {
    id: sub1_2Id,
    type: 'OR',
    label: 'Deliver Decisive Strike on Regent',
    description: 'Penetrate inner perimeter to capture Regent',
    heuristicCost: 3,
    currentCost: 3,
    isSolved: false,
    branches: [
      {
        id: 'OPT_CHAMPION_PENETRATE',
        description: playerChampion ? 'Champion long-range diagonal sweep' : 'Regent direct advance',
        cost: playerChampion ? 2 : 5,
        subGoalIds: ['LEAF_CHAMPION_STRIKE'],
      },
      {
        id: 'OPT_ORACLE_CONVERT_ESCORT',
        description: 'Oracle Divine Conversion to turn enemy defender into friendly vanguard',
        cost: playerOracle ? 3 : 6,
        subGoalIds: ['LEAF_ORACLE_CONVERT'],
      },
    ],
  };

  nodes['LEAF_CHAMPION_STRIKE'] = {
    id: 'LEAF_CHAMPION_STRIKE',
    type: 'TERMINAL',
    label: 'Action: Supreme Warrior Strike',
    description: 'Champion maneuvers along unobstructed ray to threaten Regent',
    heuristicCost: playerChampion ? 2 : 5,
    currentCost: playerChampion ? 2 : 5,
    isSolved: true,
    branches: [],
  };

  nodes['LEAF_ORACLE_CONVERT'] = {
    id: 'LEAF_ORACLE_CONVERT',
    type: 'TERMINAL',
    label: 'Action: Divine Conversion',
    description: 'Oracle sacrifices to convert defender on location',
    heuristicCost: playerOracle ? 3 : 6,
    currentCost: playerOracle ? 3 : 6,
    isSolved: true,
    branches: [],
  };

  // Subgoal 2.1: Advance Infantry
  nodes[sub2_1Id] = {
    id: sub2_1Id,
    type: 'TERMINAL',
    label: 'Action: Coordinate Infantry Advance',
    description: `${playerSoldiers.length} Soldiers form coordinated advance phalanx`,
    heuristicCost: 4,
    currentCost: 4,
    isSolved: true,
    branches: [],
  };

  // Subgoal 2.2: Activate Siege Bastion
  nodes[sub2_2Id] = {
    id: sub2_2Id,
    type: 'TERMINAL',
    label: 'Action: Bastion Siege Baseline Breach',
    description: playerBastion?.isSiegeMode ? 'Bastion already in Siege Mode!' : 'Advance Bastion to baseline to unlock Enhanced BASH & Soldier Leap',
    heuristicCost: playerBastion?.isSiegeMode ? 1 : 5,
    currentCost: playerBastion?.isSiegeMode ? 1 : 5,
    isSolved: true,
    branches: [],
  };

  // Connect Root to the two candidate hyper-branches (AND combinations!)
  nodes[rootId].branches = [
    {
      id: branch1Id,
      description: 'Tactical Feint & Assassination [AND: Distract Bastion + Strike Regent]',
      cost: 1, // Branch coordination cost
      subGoalIds: [sub1_1Id, sub1_2Id],
    },
    {
      id: branch2Id,
      description: 'Siege Baseline Breakthrough [AND: Advance Infantry + Activate Siege Bastion]',
      cost: 2, // Branch coordination cost
      subGoalIds: [sub2_1Id, sub2_2Id],
    },
  ];

  // AO* Cost Propagation Algorithm (Bottom-Up evaluation):
  // 1. Solve sub1_1Id (OR node):
  const b1_1_opts = nodes[sub1_1Id].branches;
  let minSub1_1 = Infinity;
  let bestSub1_1 = b1_1_opts[0].id;
  for (const opt of b1_1_opts) {
    const cost = opt.cost + opt.subGoalIds.reduce((sum, id) => sum + nodes[id].currentCost, 0);
    if (cost < minSub1_1) {
      minSub1_1 = cost;
      bestSub1_1 = opt.id;
    }
  }
  nodes[sub1_1Id].currentCost = minSub1_1;
  nodes[sub1_1Id].bestBranchId = bestSub1_1;
  nodes[sub1_1Id].isSolved = true;

  // 2. Solve sub1_2Id (OR node):
  const b1_2_opts = nodes[sub1_2Id].branches;
  let minSub1_2 = Infinity;
  let bestSub1_2 = b1_2_opts[0].id;
  for (const opt of b1_2_opts) {
    const cost = opt.cost + opt.subGoalIds.reduce((sum, id) => sum + nodes[id].currentCost, 0);
    if (cost < minSub1_2) {
      minSub1_2 = cost;
      bestSub1_2 = opt.id;
    }
  }
  nodes[sub1_2Id].currentCost = minSub1_2;
  nodes[sub1_2Id].bestBranchId = bestSub1_2;
  nodes[sub1_2Id].isSolved = true;

  // 3. Propagate to Root (OR node over AND branches!):
  let minRootCost = Infinity;
  let bestRootBranch = nodes[rootId].branches[0].id;

  for (const hyperBranch of nodes[rootId].branches) {
    // AND branch cost = branch cost + SUM of all subGoal costs!
    const andSum = hyperBranch.subGoalIds.reduce((sum, subId) => sum + nodes[subId].currentCost, 0);
    const totalBranchCost = hyperBranch.cost + andSum;
    if (totalBranchCost < minRootCost) {
      minRootCost = totalBranchCost;
      bestRootBranch = hyperBranch.id;
    }
  }

  nodes[rootId].currentCost = minRootCost;
  nodes[rootId].bestBranchId = bestRootBranch;
  nodes[rootId].isSolved = true;

  // Extract optimal plan summary
  const chosenBranch = nodes[rootId].branches.find((b) => b.id === bestRootBranch)!;
  const planSummary: string[] = [
    `Selected Strategy: ${chosenBranch.description}`,
    `Total Hypergraph Cost: ${minRootCost}`,
  ];

  for (const subId of chosenBranch.subGoalIds) {
    const subNode = nodes[subId];
    if (subNode.type === 'OR' && subNode.bestBranchId) {
      const chosenSubBranch = subNode.branches.find((b) => b.id === subNode.bestBranchId);
      planSummary.push(`• Sub-objective [${subNode.label}]: ${chosenSubBranch?.description} (cost: ${subNode.currentCost})`);
    } else {
      planSummary.push(`• Sub-objective [${subNode.label}]: ${subNode.description} (cost: ${subNode.currentCost})`);
    }
  }

  return {
    rootId,
    nodes,
    optimalPlanSummary: planSummary,
    totalCost: minRootCost,
  };
}
