import { Position, Piece, isSamePosition, positionKey } from '../engine/pieces';
import { BoardConfig, DEFAULT_BOARD_CONFIG, ALL_8_DIRECTIONS } from '../config/boardConfig';
import { isWithinBoard, getPieceAt } from '../engine/board';

export interface AStarNode {
  pos: Position;
  g: number; // Cost from start
  h: number; // Heuristic cost to goal
  f: number; // Total estimated cost = g + h
  parent?: AStarNode;
}

export interface AStarResult {
  path: Position[];
  cost: number;
  openSet: AStarNode[];
  closedSet: AStarNode[];
  allNodes: Record<string, AStarNode>;
  success: boolean;
  unitType: string;
}

export function heuristicDistance(a: Position, b: Position): number {
  // Chebyshev distance (max of dRow, dCol) because diagonal and orthogonal moves are equal cost in 8-directional movement
  return Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col));
}

export function runAStar(
  piece: Piece,
  targetPos: Position,
  pieces: Piece[],
  config: BoardConfig = DEFAULT_BOARD_CONFIG
): AStarResult {
  const startPos = piece.position;
  const openMap: Map<string, AStarNode> = new Map();
  const closedMap: Map<string, AStarNode> = new Map();
  const allNodes: Record<string, AStarNode> = {};

  const startNode: AStarNode = {
    pos: startPos,
    g: 0,
    h: heuristicDistance(startPos, targetPos),
    f: heuristicDistance(startPos, targetPos),
  };

  const startKey = positionKey(startPos);
  openMap.set(startKey, startNode);
  allNodes[startKey] = startNode;

  while (openMap.size > 0) {
    // Find node with lowest f score
    let currentKey = '';
    let currentNode: AStarNode | null = null;
    let minF = Infinity;

    for (const [key, node] of openMap.entries()) {
      if (node.f < minF) {
        minF = node.f;
        currentNode = node;
        currentKey = key;
      }
    }

    if (!currentNode) break;

    // Check if goal reached
    if (isSamePosition(currentNode.pos, targetPos)) {
      const path: Position[] = [];
      let curr: AStarNode | undefined = currentNode;
      while (curr) {
        path.unshift(curr.pos);
        curr = curr.parent;
      }

      return {
        path,
        cost: currentNode.g,
        openSet: Array.from(openMap.values()),
        closedSet: Array.from(closedMap.values()),
        allNodes,
        success: true,
        unitType: piece.type,
      };
    }

    openMap.delete(currentKey);
    closedMap.set(currentKey, currentNode);

    // Expand neighbors according to piece movement constraints
    const neighbors: Position[] = getPieceNeighbors(piece, currentNode.pos, pieces, config);

    for (const neighbor of neighbors) {
      const neighborKey = positionKey(neighbor);
      if (closedMap.has(neighborKey)) continue;

      const tentativeG = currentNode.g + 1;
      const existing = openMap.get(neighborKey);

      if (!existing || tentativeG < existing.g) {
        const h = heuristicDistance(neighbor, targetPos);
        const node: AStarNode = {
          pos: neighbor,
          g: tentativeG,
          h,
          f: tentativeG + h,
          parent: currentNode,
        };
        openMap.set(neighborKey, node);
        allNodes[neighborKey] = node;
      }
    }
  }

  // Path not found
  return {
    path: [],
    cost: Infinity,
    openSet: Array.from(openMap.values()),
    closedSet: Array.from(closedMap.values()),
    allNodes,
    success: false,
    unitType: piece.type,
  };
}

function getPieceNeighbors(
  piece: Piece,
  currentPos: Position,
  pieces: Piece[],
  config: BoardConfig
): Position[] {
  const neighbors: Position[] = [];

  switch (piece.type) {
    case 'rider': {
      // Moves along current facing axis
      const dirs = (piece.orientation === 'N' || piece.orientation === 'S')
        ? [{ dRow: -1, dCol: 0 }, { dRow: 1, dCol: 0 }]
        : [{ dRow: 0, dCol: -1 }, { dRow: 0, dCol: 1 }];

      for (const d of dirs) {
        const nextPos = { row: currentPos.row + d.dRow, col: currentPos.col + d.dCol };
        if (isWithinBoard(nextPos, config)) {
          const occ = getPieceAt(pieces, nextPos);
          if (!occ || occ.owner !== piece.owner) {
            neighbors.push(nextPos);
          }
        }
      }
      break;
    }

    case 'oracle': {
      // Diagonals
      const dirs = [
        { dRow: -1, dCol: -1 },
        { dRow: -1, dCol: 1 },
        { dRow: 1, dCol: -1 },
        { dRow: 1, dCol: 1 },
      ];
      for (const d of dirs) {
        const nextPos = { row: currentPos.row + d.dRow, col: currentPos.col + d.dCol };
        if (isWithinBoard(nextPos, config)) {
          const occ = getPieceAt(pieces, nextPos);
          if (!occ || occ.owner !== piece.owner) {
            neighbors.push(nextPos);
          }
        }
      }
      break;
    }

    default: {
      // 8 directions (Soldier, Regent, Bastion, Champion step)
      for (const d of ALL_8_DIRECTIONS) {
        const nextPos = { row: currentPos.row + d.dRow, col: currentPos.col + d.dCol };
        if (isWithinBoard(nextPos, config)) {
          const occ = getPieceAt(pieces, nextPos);
          if (!occ || occ.owner !== piece.owner) {
            neighbors.push(nextPos);
          }
        }
      }
      break;
    }
  }

  return neighbors;
}
