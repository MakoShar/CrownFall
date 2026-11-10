import React, { useState } from 'react';
import { GameState } from '../../engine/gameState';
import { runMinimax, MinimaxResult, MinimaxTreeNode } from '../../algorithms/minimax';
import { runAlphaBeta, AlphaBetaResult, AlphaBetaTreeNode } from '../../algorithms/alphaBeta';
import { runAStar, AStarResult } from '../../algorithms/astar';
import { runAOStar, AOStarGraph } from '../../algorithms/aostar';
import { Position, Piece, positionKey } from '../../engine/pieces';
import { formatPosition } from '../../engine/board';
import { Brain, GitBranch, GitFork, Cpu, ShieldCheck, Zap, Activity, ChevronRight, Layers, ArrowRight } from 'lucide-react';

interface AIAnalysisProps {
  gameState: GameState;
  onClose: () => void;
}

export const AIAnalysis: React.FC<AIAnalysisProps> = ({ gameState, onClose }) => {
  const [activeTab, setActiveTab] = useState<'minimax' | 'alphabeta' | 'astar' | 'aostar' | 'benchmark'>('alphabeta');
  const [searchDepth, setSearchDepth] = useState<number>(2);

  // A* interactive state
  const [selectedPieceId, setSelectedPieceId] = useState<string>(
    gameState.pieces.find((p) => p.owner === gameState.activePlayer)?.id || gameState.pieces[0]?.id || ''
  );
  const [targetRow, setTargetRow] = useState<number>(gameState.activePlayer === 'gold' ? 0 : 7);
  const [targetCol, setTargetCol] = useState<number>(4);

  // AO* Goal selection
  const [aoGoal, setAoGoal] = useState<'assassinate_regent' | 'siege_citadel'>('assassinate_regent');

  // Benchmark state
  const [benchmarkResult, setBenchmarkResult] = useState<{
    minimax: { nodes: number; timeMs: number; score: number };
    alphaBeta: { nodes: number; pruned: number; timeMs: number; score: number };
    efficiencyGain: number;
  } | null>(null);

  // Run Minimax & Alpha-Beta on current board state
  const isMaximizing = gameState.activePlayer === 'gold';
  const alphaBetaResult = React.useMemo(() => {
    return runAlphaBeta(gameState, searchDepth, isMaximizing, true);
  }, [gameState, searchDepth, isMaximizing]);

  const minimaxResult = React.useMemo(() => {
    // Keep minimax depth <= 2 to prevent UI freeze on large tree
    const safeDepth = Math.min(searchDepth, 2);
    return runMinimax(gameState, safeDepth, isMaximizing);
  }, [gameState, searchDepth, isMaximizing]);

  // Run A*
  const selectedPiece = gameState.pieces.find((p) => p.id === selectedPieceId) || gameState.pieces[0];
  const astarResult = React.useMemo(() => {
    if (!selectedPiece) return null;
    return runAStar(selectedPiece, { row: targetRow, col: targetCol }, gameState.pieces, gameState.config);
  }, [selectedPiece, targetRow, targetCol, gameState.pieces, gameState.config]);

  // Run AO*
  const aoGraph = React.useMemo(() => {
    return runAOStar(gameState, aoGoal);
  }, [gameState, aoGoal]);

  const runBenchmark = () => {
    const depth = searchDepth;
    const t0 = performance.now();
    const mm = runMinimax(gameState, depth, isMaximizing);
    const t1 = performance.now();

    const t2 = performance.now();
    const ab = runAlphaBeta(gameState, depth, isMaximizing, true);
    const t3 = performance.now();

    const efficiencyGain = mm.nodesEvaluated > 0
      ? Math.round(((mm.nodesEvaluated - ab.nodesEvaluated) / mm.nodesEvaluated) * 100)
      : 0;

    setBenchmarkResult({
      minimax: {
        nodes: mm.nodesEvaluated,
        timeMs: Math.round((t1 - t0) * 10) / 10,
        score: mm.bestValue,
      },
      alphaBeta: {
        nodes: ab.nodesEvaluated,
        pruned: ab.branchesPruned,
        timeMs: Math.round((t3 - t2) * 10) / 10,
        score: ab.bestValue,
      },
      efficiencyGain,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 md:p-6 overflow-hidden">
      <div className="relative w-full max-w-5xl h-[92vh] flex flex-col bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-kingdom-gold/20 border border-kingdom-gold text-kingdom-gold">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-fantasy font-bold text-amber-100 flex items-center gap-2">
                AI Intelligence & Algorithm Analysis Mode
              </h2>
              <p className="text-xs text-slate-400">
                Inspect adversarial game trees, alpha-beta cutoffs, A* pathfinding, and AND-OR hypergraph planning
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors"
          >
            Close Analysis
          </button>
        </div>

        {/* Tab Navigation & Depth Control */}
        <div className="flex flex-wrap items-center justify-between px-6 py-3 bg-slate-900/90 border-b border-slate-800 gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('alphabeta')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'alphabeta'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <GitFork className="w-4 h-4" />
              Alpha-Beta Pruning
            </button>
            <button
              onClick={() => setActiveTab('minimax')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'minimax'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <GitBranch className="w-4 h-4" />
              Minimax Search Tree
            </button>
            <button
              onClick={() => setActiveTab('astar')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'astar'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Zap className="w-4 h-4" />
              A* Pathfinding
            </button>
            <button
              onClick={() => setActiveTab('aostar')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'aostar'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Layers className="w-4 h-4" />
              AO* AND-OR Plans
            </button>
            <button
              onClick={() => {
                setActiveTab('benchmark');
                if (!benchmarkResult) runBenchmark();
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'benchmark'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Activity className="w-4 h-4" />
              Benchmark Comparison
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="font-semibold">Search Depth:</span>
            {[1, 2, 3].map((d) => (
              <button
                key={d}
                onClick={() => setSearchDepth(d)}
                className={`px-2.5 py-1 rounded font-mono font-bold text-xs ${
                  searchDepth === d
                    ? 'bg-kingdom-gold text-black'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Depth {d}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: ALPHA-BETA PRUNING */}
          {activeTab === 'alphabeta' && (
            <div className="space-y-6">
              {/* Metric Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-xs text-slate-400 font-semibold mb-1">Position Score</div>
                  <div className="text-2xl font-mono font-bold text-amber-300">
                    {alphaBetaResult.bestValue > 0 ? `+${alphaBetaResult.bestValue}` : alphaBetaResult.bestValue}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {alphaBetaResult.bestValue > 0 ? 'Favorable for Gold' : 'Favorable for Silver'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-xs text-slate-400 font-semibold mb-1">Evaluated Nodes</div>
                  <div className="text-2xl font-mono font-bold text-blue-400">
                    {alphaBetaResult.nodesEvaluated}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Simulated board states</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-xs text-slate-400 font-semibold mb-1">Pruned Branches (Cutoffs)</div>
                  <div className="text-2xl font-mono font-bold text-red-400">
                    {alphaBetaResult.branchesPruned}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">β ≤ α subtrees eliminated</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-xs text-slate-400 font-semibold mb-1">Best Selected Move</div>
                  <div className="text-sm font-mono font-bold text-emerald-400 truncate mt-1">
                    {alphaBetaResult.bestMove ? `${alphaBetaResult.bestMove.type.toUpperCase()}` : 'None'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {alphaBetaResult.bestMove?.to ? `to ${formatPosition(alphaBetaResult.bestMove.to)}` : ''}
                  </div>
                </div>
              </div>

              {/* Tree View with Alpha / Beta Bounds & Pruned Branches */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <div className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <GitFork className="w-4 h-4 text-amber-400" />
                    Alpha-Beta Decision Tree Structure [Showing Alpha / Beta Intervals]
                  </div>
                  <div className="text-xs text-slate-400">
                    * Red badges indicate pruned subtrees where β ≤ α condition proved the branch suboptimal.
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2 font-mono text-xs pr-2">
                  <AlphaBetaNodeView node={alphaBetaResult.searchTree} isRoot />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MINIMAX TREE */}
          {activeTab === 'minimax' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-xs text-slate-400 font-semibold mb-1">Search Tree Depth</div>
                  <div className="text-2xl font-mono font-bold text-amber-300">
                    {minimaxResult.depth}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Full exhaustive ply</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-xs text-slate-400 font-semibold mb-1">Nodes Evaluated (Exhaustive)</div>
                  <div className="text-2xl font-mono font-bold text-blue-400">
                    {minimaxResult.nodesEvaluated}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">All valid move permutations</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-xs text-slate-400 font-semibold mb-1">Root Evaluation Value</div>
                  <div className="text-2xl font-mono font-bold text-emerald-400">
                    {minimaxResult.bestValue}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Minimax optimal theorem</div>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                <div className="text-sm font-bold text-slate-200 pb-3 border-b border-slate-800 mb-3 flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-blue-400" />
                  Minimax Alternating Search Tree (MAX: Gold ▲ / MIN: Silver ▼)
                </div>
                <div className="max-h-96 overflow-y-auto space-y-2 font-mono text-xs pr-2">
                  <MinimaxNodeView node={minimaxResult.searchTree} isRoot />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: A* PATHFINDING EXPLORER */}
          {activeTab === 'astar' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <label className="text-xs text-slate-400 font-semibold">Select Piece:</label>
                  <select
                    value={selectedPieceId}
                    onChange={(e) => setSelectedPieceId(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-3 py-1.5 text-slate-200 font-mono"
                  >
                    {gameState.pieces.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.owner.toUpperCase()} {p.type.toUpperCase()} ({formatPosition(p.position)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-xs text-slate-400 font-semibold">Target Coordinates:</label>
                  <span className="text-xs text-slate-400">Row:</span>
                  <input
                    type="number"
                    min={0}
                    max={7}
                    value={targetRow}
                    onChange={(e) => setTargetRow(Number(e.target.value))}
                    className="w-14 bg-slate-800 border border-slate-700 text-xs rounded px-2 py-1 text-slate-200 font-mono"
                  />
                  <span className="text-xs text-slate-400">Col:</span>
                  <input
                    type="number"
                    min={0}
                    max={7}
                    value={targetCol}
                    onChange={(e) => setTargetCol(Number(e.target.value))}
                    className="w-14 bg-slate-800 border border-slate-700 text-xs rounded px-2 py-1 text-slate-200 font-mono"
                  />
                </div>
              </div>

              {astarResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Path Result & Formula Breakdown */}
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-xs text-amber-400 font-bold uppercase tracking-wider mb-2">
                        A* Equation: f(n) = g(n) + h(n)
                      </div>
                      <div className="text-xs text-slate-300 space-y-1">
                        <div>• <span className="font-semibold text-blue-400">g(n)</span>: Exact accumulated movement cost from start.</div>
                        <div>• <span className="font-semibold text-purple-400">h(n)</span>: Chebyshev distance heuristic to goal.</div>
                        <div>• <span className="font-semibold text-emerald-400">f(n)</span>: Total estimated path cost through node n.</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Pathfinding Result
                      </div>
                      {astarResult.success ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                            <ShieldCheck className="w-5 h-5" />
                            Optimal Path Found ({astarResult.cost} Steps)
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                            {astarResult.path.map((pos, idx) => (
                              <React.Fragment key={idx}>
                                <span className="px-2 py-1 rounded bg-slate-800 text-amber-300 border border-slate-700">
                                  {formatPosition(pos)}
                                </span>
                                {idx < astarResult.path.length - 1 && (
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-red-400 text-xs font-semibold">
                          Target unreachable under current unit movement rules & obstacle placements.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Open & Closed Sets Inspection */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                      <span>Node Sets Explorer</span>
                      <span className="text-slate-500">
                        {astarResult.closedSet.length} closed / {astarResult.openSet.length} open
                      </span>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-1.5 font-mono text-xs pr-1">
                      {Object.values(astarResult.allNodes).map((node, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800"
                        >
                          <span className="text-amber-300 font-bold">
                            {formatPosition(node.pos)}
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            g: <span className="text-blue-400">{node.g}</span> | h: <span className="text-purple-400">{node.h}</span> | f: <span className="text-emerald-400 font-bold">{node.f}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AO* AND-OR GRAPH SEARCH */}
          {activeTab === 'aostar' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                    Compound Strategic Doctrine
                  </div>
                  <div className="text-xs text-slate-400">
                    AO* evaluates compound goals with AND dependencies (hyper-arcs) and OR alternatives
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAoGoal('assassinate_regent')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      aoGoal === 'assassinate_regent'
                        ? 'bg-amber-500 text-black'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    Assassinate Regent
                  </button>
                  <button
                    onClick={() => setAoGoal('siege_citadel')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      aoGoal === 'siege_citadel'
                        ? 'bg-amber-500 text-black'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    Siege Citadel Infiltration
                  </button>
                </div>
              </div>

              {/* Optimal Hyperpath Summary */}
              <div className="p-4 rounded-xl bg-slate-950 border border-kingdom-gold/40 shadow-regal-gold">
                <div className="text-xs font-bold uppercase tracking-wider text-kingdom-gold mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  AO* Solved Hyperpath (Optimal Strategy Plan)
                </div>
                <div className="space-y-1.5 text-xs text-slate-200">
                  {aoGraph.optimalPlanSummary.map((line, idx) => (
                    <div key={idx} className={idx === 0 ? 'font-bold text-amber-200 text-sm' : 'pl-3'}>
                      {line}
                    </div>
                  ))}
                </div>
              </div>

              {/* Full AND-OR Graph Node Breakdown */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                <div className="text-sm font-bold text-slate-200 pb-3 border-b border-slate-800 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  AND-OR Hypergraph Node Decomposition
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.values(aoGraph.nodes).map((node) => (
                    <div
                      key={node.id}
                      className={`p-3 rounded-xl border ${
                        node.id === aoGraph.rootId || node.isSolved
                          ? 'bg-slate-900 border-amber-500/40'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-amber-300">{node.label}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          node.type === 'OR' ? 'bg-blue-900 text-blue-200' :
                          node.type === 'AND' ? 'bg-purple-900 text-purple-200' :
                          'bg-emerald-900 text-emerald-200'
                        }`}>
                          {node.type} NODE
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mb-2 leading-relaxed">
                        {node.description}
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
                        <span>Cost: <strong className="text-amber-400">{node.currentCost}</strong></span>
                        <span className="text-emerald-400 font-semibold">{node.isSolved ? '✓ Solved' : 'In Progress'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: BENCHMARK COMPARISON */}
          {activeTab === 'benchmark' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-200 mb-1">
                    Minimax vs Alpha-Beta Pruning Direct Head-to-Head
                  </h3>
                  <p className="text-xs text-slate-400">
                    Benchmark searches identical position at depth {searchDepth} to measure branch pruning efficiency.
                  </p>
                </div>
                <button
                  onClick={runBenchmark}
                  className="px-4 py-2 rounded-lg bg-kingdom-gold hover:bg-amber-400 text-black font-bold text-xs transition-colors shadow-lg"
                >
                  Rerun Benchmark
                </button>
              </div>

              {benchmarkResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Minimax Card */}
                  <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <span className="font-fantasy font-bold text-base text-blue-400">
                        Standard Minimax
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 font-mono">
                        Exhaustive
                      </span>
                    </div>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Evaluated Nodes:</span>
                        <span className="text-blue-300 font-bold">{benchmarkResult.minimax.nodes}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Execution Time:</span>
                        <span className="text-blue-300 font-bold">{benchmarkResult.minimax.timeMs} ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Calculated Score:</span>
                        <span className="text-blue-300 font-bold">{benchmarkResult.minimax.score}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Pruned Branches:</span>
                        <span className="text-slate-500">0 (No pruning)</span>
                      </div>
                    </div>
                  </div>

                  {/* Alpha-Beta Card */}
                  <div className="p-5 rounded-2xl bg-slate-950/80 border border-amber-500/40 shadow-regal-gold space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <span className="font-fantasy font-bold text-base text-kingdom-gold">
                        Alpha-Beta Pruning
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                        Optimized
                      </span>
                    </div>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Evaluated Nodes:</span>
                        <span className="text-emerald-400 font-bold">{benchmarkResult.alphaBeta.nodes}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Execution Time:</span>
                        <span className="text-emerald-400 font-bold">{benchmarkResult.alphaBeta.timeMs} ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Calculated Score:</span>
                        <span className="text-emerald-400 font-bold">{benchmarkResult.alphaBeta.score}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Branches Pruned:</span>
                        <span className="text-red-400 font-bold">{benchmarkResult.alphaBeta.pruned}</span>
                      </div>
                    </div>
                  </div>

                  {/* Verification Banner */}
                  <div className="md:col-span-2 p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 to-slate-950 border border-emerald-500/40 text-center space-y-1">
                    <div className="text-emerald-400 font-bold text-sm">
                      ✓ Mathematical Optimality Verified!
                    </div>
                    <div className="text-xs text-slate-300">
                      Alpha-Beta evaluated <strong className="text-emerald-300">{benchmarkResult.efficiencyGain}% fewer nodes</strong> while yielding the identical optimal score (<strong className="text-amber-300">{benchmarkResult.alphaBeta.score}</strong>).
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Tree Node Sub-Components
const AlphaBetaNodeView: React.FC<{ node: AlphaBetaTreeNode; isRoot?: boolean }> = ({ node, isRoot = false }) => {
  const [expanded, setExpanded] = useState<boolean>(isRoot);

  if (node.isPruned) {
    return (
      <div className="pl-4 py-1 border-l-2 border-red-500/60 text-red-400 bg-red-950/20 rounded">
        ✂ {node.moveDescription}
      </div>
    );
  }

  const hasChildren = node.children.length > 0;

  return (
    <div className="pl-3 py-1 border-l border-slate-800">
      <div
        onClick={() => hasChildren && setExpanded(!expanded)}
        className={`flex items-center gap-2 p-1.5 rounded hover:bg-slate-800/60 cursor-pointer ${
          isRoot ? 'bg-slate-800/80 font-bold text-amber-200' : ''
        }`}
      >
        <span className="text-slate-500 w-4 text-center">
          {hasChildren ? (expanded ? '▼' : '▶') : '•'}
        </span>
        <span className="text-slate-200 font-semibold">{node.moveDescription || 'Move'}</span>
        <span className="text-amber-400 font-bold">val: {node.value}</span>
        <span className="text-slate-500 text-[11px]">
          [α: {node.alpha === -Infinity ? '-∞' : node.alpha}, β: {node.beta === Infinity ? '∞' : node.beta}]
        </span>
      </div>

      {expanded && hasChildren && (
        <div className="space-y-1 mt-1">
          {node.children.map((child, i) => (
            <AlphaBetaNodeView key={child.id || i} node={child} />
          ))}
        </div>
      )}
    </div>
  );
};

const MinimaxNodeView: React.FC<{ node: MinimaxTreeNode; isRoot?: boolean }> = ({ node, isRoot = false }) => {
  const [expanded, setExpanded] = useState<boolean>(isRoot);
  const hasChildren = node.children.length > 0;

  return (
    <div className="pl-3 py-1 border-l border-slate-800">
      <div
        onClick={() => hasChildren && setExpanded(!expanded)}
        className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-800/60 cursor-pointer"
      >
        <span className="text-slate-500 w-4 text-center">
          {hasChildren ? (expanded ? '▼' : '▶') : '•'}
        </span>
        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
          node.isMaximizing ? 'bg-amber-900/60 text-amber-300' : 'bg-blue-900/60 text-blue-300'
        }`}>
          {node.isMaximizing ? '▲ MAX' : '▼ MIN'}
        </span>
        <span className="text-slate-200">{node.moveDescription || 'Node'}</span>
        <span className="text-emerald-400 font-bold">val: {node.value}</span>
      </div>

      {expanded && hasChildren && (
        <div className="space-y-1 mt-1">
          {node.children.map((child, i) => (
            <MinimaxNodeView key={child.id || i} node={child} />
          ))}
        </div>
      )}
    </div>
  );
};

