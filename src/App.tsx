import React, { useState, useEffect, useRef } from 'react';
import { GameState, createInitialGameState, applyMove, cloneGameState } from './engine/gameState';
import { Piece, Position, isSamePosition, PlayerColor, PieceType } from './engine/pieces';
import { Move, generateLegalMoves } from './engine/moveGenerator';
import { computeAttackMap, AttackMap } from './engine/attackDetection';
import { AIDifficulty, DIFFICULTY_PRESETS } from './ai/difficulty';
import { chooseAIMove, AIResponse } from './ai/opponent';
import { Board } from './components/Board/Board';
import { PieceActionPanel } from './components/GameControls/PieceActionPanel';
import { MoveHistory } from './components/MoveHistory/MoveHistory';
import { PromotionDialog } from './components/PromotionDialog/PromotionDialog';
import { ConversionDialog } from './components/ConversionDialog/ConversionDialog';
import { AIAnalysis } from './components/AIAnalysis/AIAnalysis';
import { TutorialModal } from './components/Tutorial/TutorialModal';
import { RulesModal } from './components/Rules/RulesModal';
import { MatchResultModal } from './components/MatchResult/MatchResultModal';
import { PieceIcon } from './components/Pieces/PieceIcon';
import {
  Brain,
  BookOpen,
  HelpCircle,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  ShieldAlert,
  Swords,
  Crown,
  Eye,
  Settings,
  Sparkles,
  Users,
  Bot,
  Flame,
  Award
} from 'lucide-react';

export type GameMode = 'human_vs_human' | 'human_vs_ai' | 'ai_vs_ai';

export const App: React.FC = () => {
  // Game Configuration State
  const [gameMode, setGameMode] = useState<GameMode>('human_vs_ai');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('intermediate');
  const [humanPlayerColor, setHumanPlayerColor] = useState<PlayerColor>('gold');

  // Game Engine State
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState());
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [showTacticalOverlay, setShowTacticalOverlay] = useState<boolean>(false);

  // Dialog & Modal States
  const [pendingPromotion, setPendingPromotion] = useState<{ move: Move } | null>(null);
  const [pendingConversion, setPendingConversion] = useState<{ move: Move; oraclePiece: Piece; targetPiece: Piece } | null>(null);
  const [showAIAnalysis, setShowAIAnalysis] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);

  // AI Spectator Mode & Execution States
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [isSpectatorPlaying, setIsSpectatorPlaying] = useState<boolean>(false);
  const [lastAiResponse, setLastAiResponse] = useState<AIResponse | null>(null);

  // Audio / Sound FX (Synthesized Web Audio API for zero external dependency reliability)
  const playSoundEffect = (type: 'move' | 'capture' | 'bash' | 'convert' | 'victory') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'move') {
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
      } else if (type === 'capture' || type === 'bash') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.18);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.18);
      } else if (type === 'convert') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      }
    } catch {
      // Audio not supported or blocked
    }
  };

  // Compute live attack map
  const attackMap = React.useMemo<AttackMap>(() => {
    return computeAttackMap(gameState.pieces, gameState.config);
  }, [gameState.pieces, gameState.config]);

  // Compute legal moves for selected piece
  const legalMovesForSelected = React.useMemo<Move[]>(() => {
    if (!selectedPiece) return [];
    const all = generateLegalMoves(gameState.pieces, gameState.activePlayer, {
      isMutualResponse: gameState.status === 'mutual_regent_response',
      config: gameState.config,
    });
    return all.filter((m) => m.pieceId === selectedPiece.id);
  }, [selectedPiece, gameState]);

  // Trigger Match Result Modal when game ends
  useEffect(() => {
    if (gameState.status !== 'in_progress' && gameState.status !== 'mutual_regent_response') {
      setShowResultModal(true);
      playSoundEffect('victory');
    }
  }, [gameState.status]);

  // AI Turn Triggering (Human vs AI or AI vs AI)
  useEffect(() => {
    const isGameOver = gameState.status !== 'in_progress' && gameState.status !== 'mutual_regent_response';
    if (isGameOver) return;

    const isAiTurn =
      (gameMode === 'human_vs_ai' && gameState.activePlayer !== humanPlayerColor) ||
      (gameMode === 'ai_vs_ai' && isSpectatorPlaying);

    if (isAiTurn && !isAiThinking) {
      setIsAiThinking(true);
      const timer = setTimeout(() => {
        try {
          const aiRes = chooseAIMove(gameState, aiDifficulty);
          setLastAiResponse(aiRes);
          executeFinalMove(aiRes.move);
        } catch (err) {
          console.error('AI decision error:', err);
        } finally {
          setIsAiThinking(false);
        }
      }, gameMode === 'ai_vs_ai' ? 500 : 400);

      return () => clearTimeout(timer);
    }
  }, [gameState, gameMode, humanPlayerColor, aiDifficulty, isSpectatorPlaying]);

  // Handle Board piece click
  const handlePieceClick = (piece: Piece) => {
    const isHumanTurn =
      gameMode === 'human_vs_human' ||
      (gameMode === 'human_vs_ai' && gameState.activePlayer === humanPlayerColor);

    if (!isHumanTurn || isAiThinking) return;

    if (piece.owner === gameState.activePlayer) {
      setSelectedPiece(piece);
    } else if (selectedPiece) {
      // Attempt capture
      const matchingMove = legalMovesForSelected.find((m) => m.targetPieceId === piece.id);
      if (matchingMove) {
        handleMoveAttempt(matchingMove);
      }
    }
  };

  // Handle Board square click
  const handleSquareClick = (pos: Position) => {
    const isHumanTurn =
      gameMode === 'human_vs_human' ||
      (gameMode === 'human_vs_ai' && gameState.activePlayer === humanPlayerColor);

    if (!isHumanTurn || isAiThinking || !selectedPiece) return;

    const matchingMove = legalMovesForSelected.find(
      (m) => m.to && m.to.row === pos.row && m.to.col === pos.col
    );

    if (matchingMove) {
      handleMoveAttempt(matchingMove);
    }
  };

  // Inspect move attempt (handle Oracle choice & Promotion dialogs)
  const handleMoveAttempt = (move: Move) => {
    // 1. Oracle Conversion Check
    if (selectedPiece?.type === 'oracle' && move.targetPieceId && !move.oracleAction) {
      const target = gameState.pieces.find((p) => p.id === move.targetPieceId);
      if (target && target.type !== 'champion' && target.type !== 'regent' && target.type !== 'oracle') {
        setPendingConversion({ move, oraclePiece: selectedPiece, targetPiece: target });
        return;
      }
    }

    // 2. Soldier Promotion Check
    const willReachBaseline =
      selectedPiece?.type === 'soldier' &&
      move.to &&
      ((selectedPiece.owner === 'gold' && move.to.row === 0) ||
        (selectedPiece.owner === 'silver' && move.to.row === 7));

    if (willReachBaseline && !move.promotionChoice) {
      setPendingPromotion({ move });
      return;
    }

    executeFinalMove(move);
  };

  // Execute confirmed move through engine
  const executeFinalMove = (move: Move) => {
    try {
      const { nextState } = applyMove(gameState, move);
      setGameState(nextState);
      setSelectedPiece(null);

      // Play audio cue
      if (move.type === 'bastion_bash' || move.type === 'siege_bash_two') {
        playSoundEffect('bash');
      } else if (move.oracleAction === 'convert') {
        playSoundEffect('convert');
      } else if (move.targetPieceId) {
        playSoundEffect('capture');
      } else {
        playSoundEffect('move');
      }
    } catch (err: any) {
      alert(`Invalid move: ${err.message}`);
    }
  };

  // Undo Move
  const handleUndo = () => {
    if (gameState.history.length === 0 || isAiThinking) return;

    // In human vs AI, undo 2 turns to bring back human turn
    const stepsToUndo = gameMode === 'human_vs_ai' && gameState.history.length >= 2 ? 2 : 1;
    let targetState = cloneGameState(gameState);

    for (let i = 0; i < stepsToUndo; i++) {
      if (targetState.history.length === 0) break;
      const lastEntry = targetState.history.pop()!;
      targetState.pieces = lastEntry.piecesSnapshot;
      targetState.activePlayer = lastEntry.activePlayer;
      targetState.status = 'in_progress';
      targetState.winner = null;
      targetState.rng.setState(lastEntry.rngState);
      if (targetState.activePlayer === 'gold' && targetState.turnNumber > 1) {
        targetState.turnNumber -= 1;
      }
    }

    setGameState(targetState);
    setSelectedPiece(null);
    setShowResultModal(false);
  };

  // Restart Match
  const handleRestart = () => {
    setGameState(createInitialGameState());
    setSelectedPiece(null);
    setShowResultModal(false);
    setIsSpectatorPlaying(false);
    setLastAiResponse(null);
  };

  // Graveyard / Captured pieces count
  const goldPiecesRemaining = gameState.pieces.filter((p) => p.owner === 'gold');
  const silverPiecesRemaining = gameState.pieces.filter((p) => p.owner === 'silver');

  return (
    <div className="min-h-screen bg-kingdom-obsidian text-slate-100 flex flex-col font-sans">
      {/* Top Regal Navigation Bar */}
      <header className="px-4 py-3 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-kingdom-gold via-amber-600 to-amber-800 flex items-center justify-center shadow-regal-gold border border-amber-300">
            <Crown className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-fantasy font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-kingdom-gold to-yellow-500">
              CROWNFALL
            </h1>
            <p className="text-[10px] tracking-widest uppercase font-semibold text-slate-400">
              The Last Kingdom — Original Tactical Strategy
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTutorial(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-200 border border-slate-700 transition-colors"
          >
            <BookOpen className="w-4 h-4 text-kingdom-gold" />
            <span className="hidden sm:inline">Interactive</span> Academy
          </button>

          <button
            onClick={() => setShowRules(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Codex</span> Rules
          </button>

          <button
            onClick={() => setShowAIAnalysis(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-900 to-indigo-900 hover:from-purple-800 hover:to-indigo-800 text-xs font-bold text-purple-200 border border-purple-500/50 shadow-md transition-all"
          >
            <Brain className="w-4 h-4 text-purple-300 animate-pulse" />
            AI Analysis
          </button>
        </div>
      </header>

      {/* Main Battlefield Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Match Controls, Turn Indicator, Mode Select */}
        <div className="lg:col-span-3 space-y-4">
          {/* Turn Status Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Turn {gameState.turnNumber}
              </span>
              {gameState.status === 'mutual_regent_response' && (
                <span className="px-2 py-0.5 rounded bg-red-900/80 text-yellow-200 text-[10px] font-extrabold border border-red-500 animate-pulse">
                  MUTUAL STRIKE
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 shadow-lg ${
                  gameState.activePlayer === 'gold'
                    ? 'bg-amber-950/60 border-kingdom-gold text-kingdom-gold shadow-regal-gold'
                    : 'bg-blue-950/60 border-blue-400 text-blue-300'
                }`}
              >
                <PieceIcon
                  type="regent"
                  owner={gameState.activePlayer}
                  size={36}
                />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Active Kingdom</div>
                <div className="text-lg font-fantasy font-bold text-amber-200 capitalize">
                  {gameState.activePlayer} Kingdom
                </div>
              </div>
            </div>

            {isAiThinking && (
              <div className="mt-3 flex items-center gap-2 text-xs text-purple-300 font-semibold bg-purple-950/40 p-2 rounded-lg border border-purple-800/50">
                <Bot className="w-4 h-4 text-purple-400 animate-spin" />
                AI pondering tactical permutations...
              </div>
            )}
          </div>

          {/* Game Mode & AI Difficulty Controls */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-kingdom-gold" />
              Game Modes
            </div>

            <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => { setGameMode('human_vs_human'); handleRestart(); }}
                className={`py-2 rounded-lg text-xs font-semibold transition-all flex flex-col items-center gap-1 ${
                  gameMode === 'human_vs_human'
                    ? 'bg-amber-500 text-black font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                2-Player
              </button>
              <button
                onClick={() => { setGameMode('human_vs_ai'); handleRestart(); }}
                className={`py-2 rounded-lg text-xs font-semibold transition-all flex flex-col items-center gap-1 ${
                  gameMode === 'human_vs_ai'
                    ? 'bg-amber-500 text-black font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bot className="w-4 h-4" />
                Vs AI
              </button>
              <button
                onClick={() => { setGameMode('ai_vs_ai'); handleRestart(); }}
                className={`py-2 rounded-lg text-xs font-semibold transition-all flex flex-col items-center gap-1 ${
                  gameMode === 'ai_vs_ai'
                    ? 'bg-amber-500 text-black font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-4 h-4" />
                AI vs AI
              </button>
            </div>

            {/* Difficulty Selector */}
            {gameMode !== 'human_vs_human' && (
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span>AI Skill Level:</span>
                  <span className="text-amber-300 font-bold capitalize">{aiDifficulty}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {(['beginner', 'intermediate', 'expert'] as AIDifficulty[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setAiDifficulty(d)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                        aiDifficulty === d
                          ? 'bg-kingdom-gold text-black font-bold shadow'
                          : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 italic mt-1">
                  {DIFFICULTY_PRESETS[aiDifficulty].description}
                </p>
              </div>
            )}

            {/* Spectator Controls for AI vs AI */}
            {gameMode === 'ai_vs_ai' && (
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => setIsSpectatorPlaying(!isSpectatorPlaying)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all shadow ${
                    isSpectatorPlaying
                      ? 'bg-red-700 hover:bg-red-600 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isSpectatorPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isSpectatorPlaying ? 'Pause Spectator' : 'Auto Play Match'}
                </button>
              </div>
            )}
          </div>

          {/* Tactical Overlay Toggle & Action Buttons */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-kingdom-gold" />
                Tactical Attack-Map Overlay
              </span>
              <button
                onClick={() => setShowTacticalOverlay(!showTacticalOverlay)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  showTacticalOverlay
                    ? 'bg-kingdom-gold text-black'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {showTacticalOverlay ? 'ON' : 'OFF'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Visualizes controlled zones, protected units, pinned lines, and threatened pieces.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              <button
                disabled={gameState.history.length === 0 || isAiThinking}
                onClick={handleUndo}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-slate-300 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Undo Move
              </button>
              <button
                onClick={handleRestart}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-red-400" />
                Restart
              </button>
            </div>
          </div>
        </div>

        {/* Center Column: The Battlefield Grid & Special Piece Controls */}
        <div className="lg:col-span-6 flex flex-col items-center">
          {/* Silver Kingdom Army Graveyard / Remaining Counter */}
          <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-950/80 rounded-xl border border-slate-800/80 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-400 shadow-md shadow-blue-400/50" />
              <span className="text-xs font-fantasy font-bold text-blue-200">Silver Kingdom</span>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Forces: <strong className="text-blue-300">{silverPiecesRemaining.length}</strong> / 16
            </div>
          </div>

          {/* Interactive Board */}
          <Board
            gameState={gameState}
            selectedPiece={selectedPiece}
            legalMoves={legalMovesForSelected}
            attackMap={attackMap}
            showTacticalOverlay={showTacticalOverlay}
            onPieceClick={handlePieceClick}
            onSquareClick={handleSquareClick}
            isInteractive={!isAiThinking && (gameState.status === 'in_progress' || gameState.status === 'mutual_regent_response')}
          />

          {/* Piece Special Action Panel (Rider Rotations, Bastion BASH, Soldier Sacrifice) */}
          <PieceActionPanel
            selectedPiece={selectedPiece}
            legalMoves={legalMovesForSelected}
            onExecuteMove={executeFinalMove}
            disabled={isAiThinking}
          />

          {/* Gold Kingdom Army Graveyard / Remaining Counter */}
          <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-950/80 rounded-xl border border-slate-800/80 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-400 shadow-md shadow-amber-400/50" />
              <span className="text-xs font-fantasy font-bold text-amber-200">Gold Kingdom</span>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Forces: <strong className="text-amber-300">{goldPiecesRemaining.length}</strong> / 16
            </div>
          </div>
        </div>

        {/* Right Column: Move History & Real-Time Tactical AI Feedback */}
        <div className="lg:col-span-3 space-y-4">
          <MoveHistory history={gameState.history} />

          {/* Last AI Decision Telemetry Card */}
          {lastAiResponse && (
            <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/30 space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-purple-300 flex items-center gap-1">
                  <Brain className="w-3.5 h-3.5 text-purple-400" />
                  AI Decision Engine
                </span>
                <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300">
                  {lastAiResponse.executionTimeMs} ms
                </span>
              </div>
              <div className="text-xs text-slate-300 font-mono space-y-1">
                <div>• Algorithm: <strong className="text-amber-300 capitalize">{lastAiResponse.algorithm.replace('_', ' ')}</strong></div>
                <div>• Search Depth: <strong className="text-blue-300">{lastAiResponse.depth} plies</strong></div>
                <div>• Evaluated Nodes: <strong className="text-emerald-300">{lastAiResponse.evaluatedNodes}</strong></div>
                {lastAiResponse.prunedBranches > 0 && (
                  <div>• Pruned Branches: <strong className="text-red-400">{lastAiResponse.prunedBranches}</strong></div>
                )}
                <div>• Position Score: <strong className="text-yellow-300">{lastAiResponse.evaluationScore}</strong></div>
              </div>
            </div>
          )}

          {/* Tactical Advice & Quotes */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="font-bold text-amber-300 uppercase tracking-wider text-[11px] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-kingdom-gold" />
              Strategic Doctrine
            </div>
            <p className="italic leading-relaxed">
              "Never surrender until the Regent falls. Use Rider axes to control files, unleash Bastion BASH to displace defenders, and look for divine conversions."
            </p>
          </div>
        </div>
      </main>

      {/* Interactive Dialogs */}
      {pendingPromotion && (
        <PromotionDialog
          owner={gameState.activePlayer}
          onSelect={(choice) => {
            const fullMove = { ...pendingPromotion.move, promotionChoice: choice };
            setPendingPromotion(null);
            executeFinalMove(fullMove);
          }}
        />
      )}

      {pendingConversion && (
        <ConversionDialog
          oraclePiece={pendingConversion.oraclePiece}
          targetPiece={pendingConversion.targetPiece}
          onChoice={(choice) => {
            const fullMove = { ...pendingConversion.move, oracleAction: choice };
            setPendingConversion(null);
            executeFinalMove(fullMove);
          }}
        />
      )}

      {/* AI Analysis Modal */}
      {showAIAnalysis && (
        <AIAnalysis
          gameState={gameState}
          onClose={() => setShowAIAnalysis(false)}
        />
      )}

      {/* Interactive Academy Tutorial Modal */}
      {showTutorial && (
        <TutorialModal
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* Rules Modal */}
      {showRules && (
        <RulesModal
          onClose={() => setShowRules(false)}
        />
      )}

      {/* Match Result Modal */}
      {showResultModal && (
        <MatchResultModal
          status={gameState.status}
          winner={gameState.winner}
          reason={gameState.statusReason}
          turnNumber={gameState.turnNumber}
          totalActions={gameState.history.length}
          onPlayAgain={handleRestart}
          onInspectBoard={() => setShowResultModal(false)}
          onOpenAIAnalysis={() => {
            setShowResultModal(false);
            setShowAIAnalysis(true);
          }}
        />
      )}
    </div>
  );
};
