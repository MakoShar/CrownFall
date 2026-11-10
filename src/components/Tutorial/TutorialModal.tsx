import React, { useState } from 'react';
import { TUTORIAL_SCENARIOS, TutorialScenario } from '../../tutorials/tutorialData';
import { GameState, applyMove } from '../../engine/gameState';
import { Move, generateLegalMoves } from '../../engine/moveGenerator';
import { Board } from '../Board/Board';
import { Piece, Position } from '../../engine/pieces';
import { BookOpen, CheckCircle, ChevronLeft, ChevronRight, HelpCircle, RefreshCw, X } from 'lucide-react';
import { PromotionDialog } from '../PromotionDialog/PromotionDialog';
import { ConversionDialog } from '../ConversionDialog/ConversionDialog';
import { PieceActionPanel } from '../GameControls/PieceActionPanel';

interface TutorialModalProps {
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const scenario: TutorialScenario = TUTORIAL_SCENARIOS[currentStepIndex];

  const [scenarioState, setScenarioState] = useState<GameState>(() => scenario.createScenarioState());
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [feedback, setFeedback] = useState<{ isSuccess: boolean; message: string } | null>(null);
  const [showHint, setShowHint] = useState<boolean>(false);

  // Dialog states
  const [pendingPromotion, setPendingPromotion] = useState<{ move: Move } | null>(null);
  const [pendingConversion, setPendingConversion] = useState<{ move: Move; oraclePiece: Piece; targetPiece: Piece } | null>(null);

  // Reset when step changes
  const loadScenario = (index: number) => {
    setCurrentStepIndex(index);
    const newScen = TUTORIAL_SCENARIOS[index];
    setScenarioState(newScen.createScenarioState());
    setSelectedPiece(null);
    setFeedback(null);
    setShowHint(false);
    setPendingPromotion(null);
    setPendingConversion(null);
  };

  const handleReset = () => {
    loadScenario(currentStepIndex);
  };

  // Legal moves for selected piece
  const legalMoves = React.useMemo(() => {
    if (!selectedPiece) return [];
    const all = generateLegalMoves(scenarioState.pieces, scenarioState.activePlayer, {
      isMutualResponse: scenarioState.status === 'mutual_regent_response',
      config: scenarioState.config,
    });
    return all.filter((m) => m.pieceId === selectedPiece.id);
  }, [selectedPiece, scenarioState]);

  const handlePieceClick = (piece: Piece) => {
    if (piece.owner === scenarioState.activePlayer) {
      setSelectedPiece(piece);
    } else if (selectedPiece) {
      // Attempt capture
      const matchingMove = legalMoves.find((m) => m.targetPieceId === piece.id);
      if (matchingMove) {
        executeTutorialMove(matchingMove);
      }
    }
  };

  const handleSquareClick = (pos: Position) => {
    if (!selectedPiece) return;
    const matchingMove = legalMoves.find((m) => m.to && m.to.row === pos.row && m.to.col === pos.col);
    if (matchingMove) {
      executeTutorialMove(matchingMove);
    }
  };

  const executeTutorialMove = (move: Move) => {
    // Check if Oracle capture needs dialog
    if (selectedPiece?.type === 'oracle' && move.targetPieceId && !move.oracleAction) {
      const target = scenarioState.pieces.find((p) => p.id === move.targetPieceId);
      if (target && target.type !== 'champion' && target.type !== 'regent' && target.type !== 'oracle') {
        setPendingConversion({ move, oraclePiece: selectedPiece, targetPiece: target });
        return;
      }
    }

    // Check if Soldier promotion needs dialog
    if (selectedPiece?.type === 'soldier' && move.to?.row === 0 && !move.promotionChoice) {
      setPendingPromotion({ move });
      return;
    }

    applyFinalTutorialMove(move);
  };

  const applyFinalTutorialMove = (move: Move) => {
    try {
      const stateBefore = scenarioState;
      const { nextState } = applyMove(scenarioState, move);
      setScenarioState(nextState);
      setSelectedPiece(null);

      // Validate against scenario goal
      const val = scenario.validateMove(move, stateBefore, nextState);
      setFeedback({ isSuccess: val.isSuccess, message: val.feedback });
    } catch (err: any) {
      setFeedback({ isSuccess: false, message: err.message || 'Illegal action' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 md:p-6 overflow-hidden">
      <div className="relative w-full max-w-5xl h-[92vh] flex flex-col bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-kingdom-gold/20 border border-kingdom-gold text-kingdom-gold">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-fantasy font-bold text-amber-100">
                Interactive Academy — Chapter {scenario.stepNumber} of {TUTORIAL_SCENARIOS.length}
              </h2>
              <p className="text-xs text-slate-400">
                Learn the sacred rules, unit disciplines, and tactical maneuvers of CROWNFALL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Reset Scenario"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Step Selector Ribbon */}
        <div className="flex overflow-x-auto py-2.5 px-6 bg-slate-900/90 border-b border-slate-800 gap-1.5 scrollbar-thin">
          {TUTORIAL_SCENARIOS.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => loadScenario(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                idx === currentStepIndex
                  ? 'bg-kingdom-gold text-black font-bold shadow'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {idx + 1}. {s.title.split('—')[0].trim()}
            </button>
          ))}
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Lesson Instructions & Feedback */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-xs uppercase font-bold tracking-widest text-kingdom-gold">
                {scenario.subtitle}
              </div>
              <h3 className="text-lg font-fantasy font-bold text-slate-100">
                {scenario.title}
              </h3>
              <p className="text-xs text-slate-400 italic">
                "{scenario.lore}"
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Objective
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {scenario.instructions}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 leading-relaxed">
              <strong className="text-slate-300">Tactical Rule:</strong> {scenario.mechanicNote}
            </div>

            {/* Hint & Feedback Banner */}
            {feedback && (
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  feedback.isSuccess
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200 shadow-lg shadow-emerald-900/30'
                    : 'bg-red-950/80 border-red-500/50 text-red-200'
                }`}
              >
                {feedback.isSuccess && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
                <div className="text-xs">
                  <div className="font-bold mb-0.5">
                    {feedback.isSuccess ? 'Mastery Achieved!' : 'Tactical Guidance'}
                  </div>
                  <div>{feedback.message}</div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setShowHint(!showHint)}
                className="flex items-center gap-1.5 text-xs text-amber-400/90 hover:text-amber-300 font-semibold"
              >
                <HelpCircle className="w-4 h-4" />
                {showHint ? 'Hide Hint' : 'Need a Hint?'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentStepIndex === 0}
                  onClick={() => loadScenario(currentStepIndex - 1)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-bold text-slate-300 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </button>
                <button
                  disabled={currentStepIndex === TUTORIAL_SCENARIOS.length - 1}
                  onClick={() => loadScenario(currentStepIndex + 1)}
                  className="px-4 py-1.5 rounded-lg bg-kingdom-gold hover:bg-amber-400 disabled:opacity-40 text-xs font-bold text-black flex items-center gap-1 shadow"
                >
                  Next Lesson
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {showHint && (
              <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-amber-200 animate-in fade-in">
                💡 <span className="font-semibold">Hint:</span> {scenario.hint}
              </div>
            )}
          </div>

          {/* Right Column: Mini Interactive Board & Controls */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center">
            <Board
              gameState={scenarioState}
              selectedPiece={selectedPiece}
              legalMoves={legalMoves}
              attackMap={null}
              showTacticalOverlay={false}
              onPieceClick={handlePieceClick}
              onSquareClick={handleSquareClick}
              isInteractive={true}
            />

            <PieceActionPanel
              selectedPiece={selectedPiece}
              legalMoves={legalMoves}
              onExecuteMove={executeTutorialMove}
            />
          </div>
        </div>

        {/* Dialogs */}
        {pendingPromotion && (
          <PromotionDialog
            owner="gold"
            onSelect={(choice) => {
              const fullMove = { ...pendingPromotion.move, promotionChoice: choice };
              setPendingPromotion(null);
              applyFinalTutorialMove(fullMove);
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
              applyFinalTutorialMove(fullMove);
            }}
          />
        )}
      </div>
    </div>
  );
};

