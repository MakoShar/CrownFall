import React from 'react';
import { GameState } from '../../engine/gameState';
import { Piece, Position, isSamePosition, positionKey, PlayerColor } from '../../engine/pieces';
import { Move } from '../../engine/moveGenerator';
import { AttackMap } from '../../engine/attackDetection';
import { PieceIcon } from '../Pieces/PieceIcon';
import { ShieldAlert, Crosshair, Sparkles, Flame, Eye } from 'lucide-react';

interface BoardProps {
  gameState: GameState;
  selectedPiece: Piece | null;
  legalMoves: Move[];
  attackMap: AttackMap | null;
  showTacticalOverlay: boolean;
  onSquareClick: (pos: Position) => void;
  onPieceClick: (piece: Piece) => void;
  isInteractive: boolean;
}

export const Board: React.FC<BoardProps> = ({
  gameState,
  selectedPiece,
  legalMoves,
  attackMap,
  showTacticalOverlay,
  onSquareClick,
  onPieceClick,
  isInteractive,
}) => {
  const { config, pieces, history } = gameState;
  const lastMove = history.length > 0 ? history[history.length - 1].move : null;

  // Map moves for quick lookup on destination square
  const movesByDest = React.useMemo(() => {
    const map = new Map<string, Move[]>();
    for (const m of legalMoves) {
      if (m.to) {
        const key = positionKey(m.to);
        const list = map.get(key) || [];
        list.push(m);
        map.set(key, list);
      }
    }
    return map;
  }, [legalMoves]);

  // Files a..h and ranks 8..1
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].slice(0, config.cols);
  const ranks = Array.from({ length: config.rows }, (_, i) => config.rows - i);

  return (
    <div className="relative flex flex-col items-center select-none p-2 md:p-4">
      {/* Outer Stone Frame */}
      <div className="relative p-2 md:p-3 rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-black border-2 border-slate-700 shadow-2xl shadow-black/80">
        {/* Top File Labels */}
        <div className="grid grid-flow-col auto-cols-fr text-center text-xs font-mono font-semibold text-slate-500 pb-1">
          {files.map((f) => (
            <div key={f}>{f.toUpperCase()}</div>
          ))}
        </div>

        {/* Board Core with Side Rank Labels */}
        <div className="flex">
          {/* Left Rank Labels */}
          <div className="grid grid-flow-row auto-rows-fr items-center text-xs font-mono font-semibold text-slate-500 pr-2">
            {ranks.map((r) => (
              <div key={r} className="flex items-center justify-center h-full">
                {r}
              </div>
            ))}
          </div>

          {/* Grid Container */}
          <div
            className="grid gap-[2px] bg-slate-950 p-[2px] rounded-lg border border-slate-700/60 shadow-inner"
            style={{
              gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
              width: 'min(84vw, 560px)',
              height: 'min(84vw, 560px)',
            }}
          >
            {Array.from({ length: config.rows }).map((_, row) =>
              Array.from({ length: config.cols }).map((_, col) => {
                const pos: Position = { row, col };
                const key = positionKey(pos);
                const pieceOnSquare = pieces.find((p) => isSamePosition(p.position, pos));
                const isSelected = selectedPiece && isSamePosition(selectedPiece.position, pos);

                // Last move highlights
                const isLastMoveFrom = lastMove && isSamePosition(lastMove.from, pos);
                const isLastMoveTo = lastMove && lastMove.to && isSamePosition(lastMove.to, pos);

                // Legal moves landing here
                const movesHere = movesByDest.get(key) || [];
                const isLegalDestination = movesHere.length > 0;
                const isCaptureDestination = movesHere.some((m) => m.targetPieceId);
                const isBashDestination = movesHere.some((m) => m.type === 'bastion_bash');
                const isSiegeBashDestination = movesHere.some((m) => m.type === 'siege_bash_two');
                const isLeapDestination = movesHere.some((m) => m.isSoldierLeap);

                // Checkerboard pattern colors
                const isLightSquare = (row + col) % 2 === 0;
                const baseBg = isLightSquare
                  ? 'bg-gradient-to-br from-slate-700/90 to-slate-800/90'
                  : 'bg-gradient-to-br from-slate-900 to-black';

                // Tactical overlay indicators
                const isGoldControlled = showTacticalOverlay && attackMap?.controlledSquares.gold.has(key);
                const isSilverControlled = showTacticalOverlay && attackMap?.controlledSquares.silver.has(key);
                const isProtected = showTacticalOverlay && pieceOnSquare && (attackMap?.protectionMap[pieceOnSquare.id]?.length || 0) > 0;
                const isThreatened = showTacticalOverlay && pieceOnSquare && (attackMap?.threatMap[pieceOnSquare.id]?.length || 0) > 0;
                const isPinned = showTacticalOverlay && pieceOnSquare && attackMap?.pinnedUnits.some((p) => p.pieceId === pieceOnSquare.id);

                return (
                  <div
                    key={key}
                    onClick={() => {
                      if (!isInteractive) return;
                      if (pieceOnSquare) {
                        onPieceClick(pieceOnSquare);
                      } else {
                        onSquareClick(pos);
                      }
                    }}
                    className={`relative flex items-center justify-center transition-all duration-150 cursor-pointer overflow-hidden ${baseBg} ${
                      isSelected
                        ? 'ring-2 ring-kingdom-gold ring-inset bg-amber-950/40'
                        : isLastMoveFrom || isLastMoveTo
                        ? 'ring-1 ring-amber-500/60 ring-inset bg-amber-900/20'
                        : 'hover:brightness-110'
                    }`}
                  >
                    {/* Tactical Overlay Heatmaps */}
                    {showTacticalOverlay && (
                      <div className="absolute inset-0 pointer-events-none">
                        {isGoldControlled && isSilverControlled && (
                          <div className="absolute inset-0 bg-purple-500/15" />
                        )}
                        {isGoldControlled && !isSilverControlled && (
                          <div className="absolute inset-0 bg-amber-500/15" />
                        )}
                        {isSilverControlled && !isGoldControlled && (
                          <div className="absolute inset-0 bg-blue-500/15" />
                        )}
                      </div>
                    )}

                    {/* Threat & Protection Badges */}
                    {isThreatened && (
                      <div
                        title="Threatened by enemy!"
                        className="absolute top-0.5 right-0.5 z-10 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"
                      />
                    )}
                    {isPinned && (
                      <div
                        title="Pinned to Regent!"
                        className="absolute bottom-0.5 left-0.5 z-10 px-1 py-0.2 rounded bg-purple-900 text-[9px] font-bold text-purple-200 border border-purple-400"
                      >
                        PIN
                      </div>
                    )}
                    {isProtected && !isThreatened && (
                      <div
                        title="Defended by friendly unit"
                        className="absolute bottom-0.5 right-0.5 z-10 w-1.5 h-1.5 rounded-full bg-emerald-400"
                      />
                    )}

                    {/* Legal Move Indicators */}
                    {isLegalDestination && !pieceOnSquare && (
                      <div className="relative flex items-center justify-center z-10">
                        <div className="w-3.5 h-3.5 rounded-full bg-emerald-400/80 shadow-md shadow-emerald-400/50 animate-pulse" />
                      </div>
                    )}

                    {isLegalDestination && pieceOnSquare && (
                      <div className="absolute inset-0 z-10 border-2 border-red-500/90 bg-red-950/30 rounded flex items-center justify-center pointer-events-none animate-pulse">
                        <Crosshair className="w-6 h-6 text-red-400" />
                      </div>
                    )}

                    {isSiegeBashDestination && (
                      <div className="absolute inset-0 z-10 border-2 border-orange-500 bg-orange-950/40 rounded flex items-center justify-center pointer-events-none">
                        <Flame className="w-6 h-6 text-orange-400 animate-bounce" />
                      </div>
                    )}

                    {/* Piece Display */}
                    {pieceOnSquare && (
                      <div
                        className={`relative z-20 flex items-center justify-center w-full h-full p-1 transition-transform duration-200 ${
                          isSelected ? 'scale-110 drop-shadow-2xl' : 'hover:scale-105'
                        }`}
                      >
                        <PieceIcon
                          type={pieceOnSquare.type}
                          owner={pieceOnSquare.owner}
                          orientation={pieceOnSquare.orientation}
                          isSiegeMode={pieceOnSquare.isSiegeMode}
                          size={46}
                        />

                        {/* Special Status Indicator Badges */}
                        {pieceOnSquare.isSiegeMode && (
                          <span
                            title="Siege Mode active!"
                            className="absolute -top-1 -left-1 px-1 py-0.2 text-[8px] font-extrabold uppercase bg-red-700 text-yellow-200 border border-red-400 rounded shadow"
                          >
                            SIEGE
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
