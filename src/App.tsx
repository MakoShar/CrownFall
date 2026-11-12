import React, { useState, useEffect, useRef } from 'react';
import { GameState, createInitialGameState, applyMove, cloneGameState } from './engine/gameState';
import { Piece, Position, isSamePosition, PlayerColor, PieceType, isWhite, isBlue } from './engine/pieces';
import { Move, generateLegalMoves } from './engine/moveGenerator';
import { computeAttackMap, AttackMap } from './engine/attackDetection';
import { AIDifficulty, DIFFICULTY_PRESETS } from './ai/difficulty';
import { chooseAIMove, AIResponse } from './ai/opponent';
import { Board } from './components/Board/Board';
import { PieceActionPanel } from './components/GameControls/PieceActionPanel';
import { MoveHistory } from './components/MoveHistory/MoveHistory';
import { PromotionDialog } from './components/PromotionDialog/PromotionDialog';
import { AIAnalysis } from './components/AIAnalysis/AIAnalysis';
import { TutorialModal } from './components/Tutorial/TutorialModal';
import { RulesModal } from './components/Rules/RulesModal';
import { MatchResultModal } from './components/MatchResult/MatchResultModal';
import { PieceIcon } from './components/Pieces/PieceIcon';
import { SplashScreen } from './components/Screens/SplashScreen';
import { ModeSelectScreen } from './components/Screens/ModeSelectScreen';
import { DifficultySelectScreen } from './components/Screens/DifficultySelectScreen';
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
  Award,
  ChevronLeft,
  GraduationCap,
  Menu,
  X,
} from 'lucide-react';

export type GameMode = 'human_vs_human' | 'human_vs_ai' | 'ai_vs_ai';
type Screen = 'splash' | 'mode_select' | 'difficulty_select' | 'game';

export const App: React.FC = () => {
  // Screen navigation state
  const [screen, setScreen] = useState<Screen>('splash');

  // Game Configuration State
  const [gameMode, setGameMode] = useState<GameMode>('human_vs_ai');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('intermediate');
  const [humanPlayerColor, setHumanPlayerColor] = useState<PlayerColor>('white');
  const [pendingMode, setPendingMode] = useState<GameMode>('human_vs_ai');

  // Game Engine State
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState());
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [showTacticalOverlay, setShowTacticalOverlay] = useState<boolean>(false);

  // Dialog & Modal States
  const [pendingPromotion, setPendingPromotion] = useState<{ move: Move } | null>(null);
  const [pendingBishopTransform, setPendingBishopTransform] = useState<{ move: Move; targetPiece: Piece } | null>(null);
  const [showAIAnalysis, setShowAIAnalysis] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // AI Spectator Mode & Execution States
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [isSpectatorPlaying, setIsSpectatorPlaying] = useState<boolean>(false);
  const [lastAiResponse, setLastAiResponse] = useState<AIResponse | null>(null);

  // Audio / Sound FX (Synthesized Web Audio API with shared singleton context to prevent resource leaks)
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSoundEffect = (type: 'move' | 'capture' | 'bash' | 'convert' | 'victory' | 'check') => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtxClass) return;
        audioCtxRef.current = new AudioCtxClass();
      }
      const audioCtx = audioCtxRef.current;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'check') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.28, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.22);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.22);
      } else if (type === 'move') {
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
      } else if (type === 'victory') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2);
        osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.55);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.55);
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
      turnNumber: gameState.turnNumber,
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
    if (screen !== 'game') return;
    const isGameOver = gameState.status !== 'in_progress' && gameState.status !== 'mutual_regent_response';
    if (isGameOver) return;

    const isAiTurn =
      (gameMode === 'human_vs_ai' && isWhite(gameState.activePlayer) !== isWhite(humanPlayerColor)) ||
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
  }, [gameState, gameMode, humanPlayerColor, aiDifficulty, isSpectatorPlaying, screen]);

  // Handle Board piece click
  const handlePieceClick = (piece: Piece) => {
    const isHumanTurn =
      gameMode === 'human_vs_human' ||
      (gameMode === 'human_vs_ai' && isWhite(gameState.activePlayer) === isWhite(humanPlayerColor));

    if (!isHumanTurn || isAiThinking) return;

    if (isWhite(piece.owner) === isWhite(gameState.activePlayer)) {
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
      (gameMode === 'human_vs_ai' && isWhite(gameState.activePlayer) === isWhite(humanPlayerColor));

    if (!isHumanTurn || isAiThinking || !selectedPiece) return;

    const matchingMove = legalMovesForSelected.find(
      (m) => m.to && m.to.row === pos.row && m.to.col === pos.col
    );

    if (matchingMove) {
      handleMoveAttempt(matchingMove);
    }
  };

  // Inspect move attempt (handle Bishop transformation & Soldier promotion dialogs)
  const handleMoveAttempt = (move: Move) => {
    // 1. Bishop Transformation Check
    if (selectedPiece?.type === 'oracle' && move.targetPieceId && !selectedPiece.specialAbilityState?.hasUsedTransform) {
      const target = gameState.pieces.find((p) => p.id === move.targetPieceId);
      if (target) {
        setPendingBishopTransform({ move, targetPiece: target });
        return;
      }
    }

    // 2. Soldier Promotion Check
    const willReachBaseline =
      selectedPiece?.type === 'soldier' &&
      move.to &&
      ((isWhite(selectedPiece.owner) && move.to.row === 0) ||
        (isBlue(selectedPiece.owner) && move.to.row === 7));

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
      if (nextState.statusReason?.includes('CHECK!') || nextState.statusReason?.includes('CHECKMATE!')) {
        playSoundEffect('check');
      } else if (move.type === 'horse_skip_turn' || move.isBishopTransform) {
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
      targetState.statusReason = undefined;
      targetState.rng.setState(lastEntry.rngState);
      if (isWhite(targetState.activePlayer) && targetState.turnNumber > 1) {
        targetState.turnNumber -= 1;
      }
    }

    setGameState(targetState);
    setSelectedPiece(null);
    setShowResultModal(false);
  };

  // Restart Match (stays on game screen)
  const handleRestart = () => {
    setGameState(createInitialGameState());
    setSelectedPiece(null);
    setShowResultModal(false);
    setIsSpectatorPlaying(false);
    setIsAiThinking(false);
    setLastAiResponse(null);
  };

  // Go back to main menu
  const handleBackToMenu = () => {
    setScreen('splash');
    setShowResultModal(false);
    setIsSpectatorPlaying(false);
    setIsAiThinking(false);
    setSelectedPiece(null);
    setMobileMenuOpen(false);
  };

  // Graveyard / Captured pieces count
  const whitePiecesRemaining = gameState.pieces.filter((p) => isWhite(p.owner));
  const bluePiecesRemaining = gameState.pieces.filter((p) => isBlue(p.owner));

  // ─── SCREEN ROUTING ────────────────────────────────────────────────────────

  if (screen === 'splash') {
    return (
      <>
        <SplashScreen
          onPlay={() => setScreen('mode_select')}
          onTutorial={() => { setScreen('splash'); setShowTutorial(true); }}
          onRules={() => { setScreen('splash'); setShowRules(true); }}
        />
        {showTutorial && <TutorialModal onClose={() => setShowTutorial(false)} />}
        {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      </>
    );
  }

  if (screen === 'mode_select') {
    return (
      <ModeSelectScreen
        onSelectMode={(mode) => {
          setPendingMode(mode);
          if (mode === 'human_vs_human') {
            // No difficulty needed
            setGameMode(mode);
            setGameState(createInitialGameState());
            setSelectedPiece(null);
            setShowResultModal(false);
            setLastAiResponse(null);
            setIsSpectatorPlaying(false);
            setScreen('game');
          } else {
            setPendingMode(mode);
            setScreen('difficulty_select');
          }
        }}
        onBack={() => setScreen('splash')}
      />
    );
  }

  if (screen === 'difficulty_select') {
    return (
      <DifficultySelectScreen
        mode={pendingMode}
        onSelectDifficulty={(diff) => {
          setGameMode(pendingMode);
          setAiDifficulty(diff);
          setGameState(createInitialGameState());
          setSelectedPiece(null);
          setShowResultModal(false);
          setLastAiResponse(null);
          setIsSpectatorPlaying(false);
          setScreen('game');
        }}
        onBack={() => setScreen('mode_select')}
      />
    );
  }

  // ─── GAME SCREEN ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-kingdom-obsidian text-slate-100 flex flex-col font-sans">
      {/* Top Regal Navigation Bar */}
      <header className="px-2.5 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 shadow-xl flex items-center justify-between">
        {/* Left: Logo + back button + Title */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleBackToMenu}
            className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors"
            title="Back to Main Menu"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Menu</span>
          </button>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-kingdom-gold via-amber-600 to-amber-800 flex items-center justify-center shadow-regal-gold border border-amber-300 overflow-hidden shrink-0">
            <img src="/pieces/regent.png" alt="Crown" className="w-full h-full object-cover object-top" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-base sm:text-2xl font-fantasy font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-kingdom-gold to-yellow-500 leading-tight">
                CROWNFALL
              </h1>
              <span className="px-1.5 py-0.2 rounded text-[8px] sm:text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                Chess Edition
              </span>
            </div>
            <p className="text-[9px] sm:text-[10px] tracking-wider uppercase font-semibold text-slate-400 hidden xs:block">
              The Last Kingdom — Classical Chess
            </p>
          </div>
        </div>

        {/* Right Section: Desktop Action Buttons + Mobile Controls & Hamburger */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile Turn Badge */}
          <div className="lg:hidden flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-300">
            <span
              className={`w-2 h-2 rounded-full ${
                isWhite(gameState.activePlayer) ? 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]' : 'bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]'
              }`}
            />
            <span>{isWhite(gameState.activePlayer) ? 'White' : 'Blue'}</span>
            {attackMap.regentThreatened[gameState.activePlayer] && (
              <span className="text-[9px] text-red-400 font-bold tracking-wider animate-pulse">CHECK!</span>
            )}
          </div>

          {/* Mobile Quick Undo Button */}
          <button
            disabled={gameState.history.length === 0 || isAiThinking}
            onClick={handleUndo}
            className="lg:hidden flex items-center justify-center p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 border border-slate-700 transition-colors"
            title="Undo move"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Desktop Global Action Buttons (Hidden on mobile) */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={() => setShowTutorial(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-200 border border-slate-700 transition-colors"
              title="Interactive Academy"
            >
              <GraduationCap className="w-4 h-4 text-kingdom-gold" />
              <span>Academy</span>
            </button>

            <button
              onClick={() => setShowRules(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors"
              title="Rules & Movements Codex"
            >
              <BookOpen className="w-4 h-4" />
              <span>Codex</span>
            </button>

            <button
              onClick={() => setShowAIAnalysis(true)}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-900 to-indigo-900 hover:from-purple-800 hover:to-indigo-800 text-xs font-bold text-purple-200 border border-purple-500/50 shadow-md transition-all"
              title="AI Decision Analysis"
            >
              <Brain className="w-4 h-4 text-purple-300 animate-pulse" />
              <span>AI Analysis</span>
            </button>
          </div>

          {/* Mobile Hamburger Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden flex items-center justify-center p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 shadow-md transition-all active:scale-95"
            title="Open Controls & Game Menu"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Battlefield Workspace: Optimized for Full Screen Device Scaling */}
      <main className="flex-1 w-full max-w-[1750px] mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-3 sm:gap-6 lg:gap-8">
        {/* Left Column: Board + Active Piece Mods Bar */}
        <div className="w-full lg:flex-1 flex flex-col items-center justify-center min-w-0 space-y-2">
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

          {/* Piece Special Action & Mod Panel directly under the board for immediate mobile thumb reach */}
          <div className="w-full max-w-[min(calc(100vw-16px),calc(100vh-140px),840px)]">
            <PieceActionPanel
              selectedPiece={selectedPiece}
              legalMoves={legalMovesForSelected}
              onExecuteMove={executeFinalMove}
              disabled={isAiThinking}
            />
          </div>
        </div>

        {/* Right Column: Command Status, Controls, History & AI Telemetry (Desktop only) */}
        <div className="hidden lg:flex w-full lg:w-[380px] xl:w-[420px] 2xl:w-[450px] flex-shrink-0 flex-col space-y-3 sm:space-y-4 min-w-0">
          {/* 1. Turn & Kingdom Status Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Turn {gameState.turnNumber}
              </span>
              <div className="flex items-center gap-2">
                {attackMap.regentThreatened[gameState.activePlayer] && (
                  <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black tracking-widest border border-red-400 animate-pulse flex items-center gap-1 shadow-lg shadow-red-900/50">
                    <ShieldAlert className="w-3 h-3" />
                    CHECK!
                  </span>
                )}
                {gameState.status === 'mutual_regent_response' && (
                  <span className="px-2 py-0.5 rounded bg-red-900/80 text-yellow-200 text-[10px] font-extrabold border border-red-500 animate-pulse">
                    MUTUAL STRIKE RESPONSE
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 shadow-lg ${
                    isWhite(gameState.activePlayer)
                      ? 'bg-slate-900 border-white/80 shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                      : 'bg-blue-950/80 border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.5)]'
                  }`}
                >
                  <PieceIcon
                    type="regent"
                    owner={gameState.activePlayer}
                    size={42}
                  />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">Active Command</div>
                  <div className="text-lg font-fantasy font-bold text-white capitalize">
                    {isWhite(gameState.activePlayer) ? 'White Side' : 'Blue Side'}
                  </div>
                </div>
              </div>

              {/* Force Counters */}
              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/30 text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-100 flex items-center justify-end gap-1">
                    <span className="w-2 h-2 rounded-full bg-white shadow-sm" />
                    White
                  </div>
                  <div className="text-sm font-mono font-bold text-slate-200">
                    {whitePiecesRemaining.length} <span className="text-xs text-slate-500 font-normal">/ 16</span>
                  </div>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-sky-500/30 text-right">
                  <div className="text-[10px] uppercase font-bold text-sky-400 flex items-center justify-end gap-1">
                    <span className="w-2 h-2 rounded-full bg-sky-400 shadow-sm" />
                    Blue
                  </div>
                  <div className="text-sm font-mono font-bold text-slate-200">
                    {bluePiecesRemaining.length} <span className="text-xs text-slate-500 font-normal">/ 16</span>
                  </div>
                </div>
              </div>
            </div>

            {isAiThinking && (
              <div className="flex items-center gap-2 text-xs text-purple-300 font-semibold bg-purple-950/40 p-2.5 rounded-lg border border-purple-800/50 animate-pulse">
                <Bot className="w-4 h-4 text-purple-400 animate-spin" />
                AI is searching tactical move permutations...
              </div>
            )}
          </div>

          {/* 2. Tactical Overlay Toggle & Game Actions */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
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
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-slate-300 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Undo Move
              </button>
              <button
                onClick={handleRestart}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-red-400" />
                Restart Match
              </button>
            </div>
          </div>

          {/* 3. Game Mode & AI Difficulty Controls */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-kingdom-gold" />
              Game Modes
            </div>

            <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
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

            {/* AI Skill Level Selector */}
            {gameMode !== 'human_vs_human' && (
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span>AI Skill Level:</span>
                  <span className="text-amber-300 font-bold capitalize">{aiDifficulty}</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
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

          {/* 5. Move History (Battle Chronicle) */}
          <MoveHistory history={gameState.history} />

          {/* 6. Last AI Decision Telemetry Card */}
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

          {/* 7. Strategic Doctrine Quote Card */}
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

      {/* Mobile Slide-Over Drawer (Accessible via Hamburger Icon) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Body */}
          <div className="relative w-[90%] max-w-[420px] h-full bg-slate-950 border-l border-slate-800 p-4 sm:p-5 shadow-2xl flex flex-col space-y-4 overflow-y-auto z-10">
            {/* Top Bar with Close Button */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-kingdom-gold via-amber-600 to-amber-800 flex items-center justify-center border border-amber-300 overflow-hidden shrink-0">
                  <img src="/pieces/regent.png" alt="Crown" className="w-full h-full object-cover object-top" />
                </div>
                <div>
                  <h3 className="font-fantasy font-black text-amber-200 text-sm">BATTLE COMMAND</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Controls & Tactics</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                title="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Navigation Cards */}
            <div className="grid grid-cols-3 gap-2 shrink-0">
              <button
                onClick={() => { setMobileMenuOpen(false); setShowTutorial(true); }}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-amber-200 transition-all"
              >
                <GraduationCap className="w-4 h-4 text-kingdom-gold mb-1" />
                Academy
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); setShowRules(true); }}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-slate-300 transition-all"
              >
                <BookOpen className="w-4 h-4 mb-1" />
                Codex
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); setShowAIAnalysis(true); }}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-gradient-to-br from-purple-950 to-indigo-950 hover:from-purple-900 hover:to-indigo-900 border border-purple-500/40 text-[11px] font-semibold text-purple-300 transition-all"
              >
                <Brain className="w-4 h-4 text-purple-300 mb-1 animate-pulse" />
                Analysis
              </button>
            </div>

            {/* Command Controls in Mobile Drawer */}
            <div className="flex flex-col space-y-3 pb-6">
              {/* 1. Turn & Kingdom Status Card */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                    Turn {gameState.turnNumber}
                  </span>
                  <div className="flex items-center gap-2">
                    {attackMap.regentThreatened[gameState.activePlayer] && (
                      <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-black tracking-widest border border-red-400 animate-pulse flex items-center gap-1 shadow-lg shadow-red-900/50">
                        <ShieldAlert className="w-3 h-3" />
                        CHECK!
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 shadow-lg ${
                        isWhite(gameState.activePlayer)
                          ? 'bg-slate-900 border-white/80 shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                          : 'bg-blue-950/80 border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.5)]'
                      }`}
                    >
                      <PieceIcon type="regent" owner={gameState.activePlayer} size={36} />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">Active Command</div>
                      <div className="text-base font-fantasy font-bold text-white capitalize">
                        {isWhite(gameState.activePlayer) ? 'White Side' : 'Blue Side'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-white/30 text-right">
                      <div className="text-[9px] uppercase font-bold text-slate-200">White</div>
                      <div className="text-xs font-mono font-bold text-slate-200">{whitePiecesRemaining.length} / 16</div>
                    </div>
                    <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-sky-500/30 text-right">
                      <div className="text-[9px] uppercase font-bold text-sky-400">Blue</div>
                      <div className="text-xs font-mono font-bold text-slate-200">{bluePiecesRemaining.length} / 16</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Tactical Overlay & Quick Actions */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-kingdom-gold" />
                    Attack-Map Overlay
                  </span>
                  <button
                    onClick={() => setShowTacticalOverlay(!showTacticalOverlay)}
                    className={`px-3 py-0.5 rounded-full text-xs font-bold transition-all ${
                      showTacticalOverlay ? 'bg-kingdom-gold text-black' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {showTacticalOverlay ? 'ON' : 'OFF'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <button
                    disabled={gameState.history.length === 0 || isAiThinking}
                    onClick={() => { setMobileMenuOpen(false); handleUndo(); }}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-slate-300"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Undo Move
                  </button>
                  <button
                    onClick={() => { setMobileMenuOpen(false); handleRestart(); }}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-red-400" />
                    Restart
                  </button>
                </div>
              </div>

              {/* 3. Game Mode & AI Difficulty */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                <div className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-kingdom-gold" />
                  Game Modes
                </div>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => { setGameMode('human_vs_human'); handleRestart(); }}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition-all flex flex-col items-center gap-1 ${
                      gameMode === 'human_vs_human' ? 'bg-amber-500 text-black font-bold' : 'text-slate-400'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    2-Player
                  </button>
                  <button
                    onClick={() => { setGameMode('human_vs_ai'); handleRestart(); }}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition-all flex flex-col items-center gap-1 ${
                      gameMode === 'human_vs_ai' ? 'bg-amber-500 text-black font-bold' : 'text-slate-400'
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5" />
                    Vs AI
                  </button>
                  <button
                    onClick={() => { setGameMode('ai_vs_ai'); handleRestart(); }}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition-all flex flex-col items-center gap-1 ${
                      gameMode === 'ai_vs_ai' ? 'bg-amber-500 text-black font-bold' : 'text-slate-400'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    AI vs AI
                  </button>
                </div>

                {gameMode !== 'human_vs_human' && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                      <span>AI Skill Level:</span>
                      <span className="text-amber-300 font-bold capitalize">{aiDifficulty}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['beginner', 'intermediate', 'expert'] as AIDifficulty[]).map((d) => (
                        <button
                          key={d}
                          onClick={() => setAiDifficulty(d)}
                          className={`py-1 px-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                            aiDifficulty === d ? 'bg-kingdom-gold text-black font-bold' : 'bg-slate-900 text-slate-400'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Move History in Mobile Drawer */}
              <MoveHistory history={gameState.history} />
            </div>
          </div>
        </div>
      )}

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

      {/* Bishop Soul Transmutation Modal */}
      {pendingBishopTransform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative max-w-md w-full bg-slate-900 border-2 border-indigo-500 rounded-2xl p-6 shadow-2xl text-center">
            <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500 text-indigo-300 text-xs font-mono font-bold tracking-widest uppercase mb-2">
              Bishop Active Ability (1/1)
            </div>
            <h3 className="text-xl font-fantasy font-bold text-slate-100 mb-2">
              Soul Transmutation
            </h3>
            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              Your Bishop can transform into the captured <strong className="text-indigo-300 uppercase">{pendingBishopTransform.targetPiece.type}</strong>! The bishop will be replaced by the captured piece at the opponent's position. This ability can only be used once.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  const move = { ...pendingBishopTransform.move, isBishopTransform: true };
                  setPendingBishopTransform(null);
                  executeFinalMove(move);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-950/80 transition-all border border-indigo-400 cursor-pointer"
              >
                Transform into {pendingBishopTransform.targetPiece.type.toUpperCase()}
              </button>
              <button
                onClick={() => {
                  const move = { ...pendingBishopTransform.move, isBishopTransform: false };
                  setPendingBishopTransform(null);
                  executeFinalMove(move);
                }}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              >
                Normal Capture
              </button>
            </div>
          </div>
        </div>
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
