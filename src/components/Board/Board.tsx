import React from 'react';
import { GameState } from '../../engine/gameState';
import { Piece, Position, isSamePosition, positionKey } from '../../engine/pieces';
import { Move } from '../../engine/moveGenerator';
import { AttackMap } from '../../engine/attackDetection';
import { PieceIcon } from '../Pieces/PieceIcon';
import { Crosshair, Flame } from 'lucide-react';

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

  const fileLabels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  return (
    <div className="relative flex flex-col items-center justify-center select-none w-full max-w-[min(calc(100vw-12px),calc(100vh-210px),620px)] mx-auto">
      {/* Outer Stone Frame: Slim padding on mobile so board scales as large as possible */}
      <div className="relative w-full aspect-square p-1 sm:p-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-black border-2 border-slate-700/80 shadow-2xl shadow-black/90 flex items-center justify-center">
        {/* 8x8 Board Grid: Edge-to-edge square grid with embedded corner coordinates */}
        <div
          className="w-full h-full aspect-square grid gap-[1.5px] sm:gap-[2px] bg-slate-950 p-[1.5px] sm:p-[2px] rounded-lg border border-slate-700/60 shadow-inner overflow-hidden"
          style={{
            gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
            gridTemplateRows: `repeat(${config.rows}, 1fr)`,
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
              const isSiegeBashDestination = movesHere.some((m) => m.type === 'siege_bash_two');

              // Checkerboard pattern colors
              const isLightSquare = (row + col) % 2 === 0;
              const baseBg = isLightSquare
                ? 'bg-gradient-to-br from-slate-700/90 to-slate-800/90'
                : 'bg-gradient-to-br from-slate-900 to-black';

              // Check status on Regent (always visible, pulses with red warning aura)
              const isRegentInCheck = pieceOnSquare?.type === 'regent' && (
                (pieceOnSquare.owner === 'gold' && attackMap?.regentThreatened.gold) ||
                (pieceOnSquare.owner === 'silver' && attackMap?.regentThreatened.silver)
              );

              // Tactical overlay indicators
              const isGoldControlled = showTacticalOverlay && attackMap?.controlledSquares.gold.has(key);
              const isSilverControlled = showTacticalOverlay && attackMap?.controlledSquares.silver.has(key);
              const isProtected = showTacticalOverlay && pieceOnSquare && (attackMap?.protectionMap[pieceOnSquare.id]?.length || 0) > 0;
              const isThreatened = showTacticalOverlay && pieceOnSquare && (attackMap?.threatMap[pieceOnSquare.id]?.length || 0) > 0;
              const isPinned = showTacticalOverlay && pieceOnSquare && attackMap?.pinnedUnits.some((p) => p.pieceId === pieceOnSquare.id);

              // Embedded corner coordinates (standard digital chess UI)
              const showRankLabel = col === 0;
              const rankNum = config.rows - row;
              const showFileLabel = row === config.rows - 1;
              const fileLetter = fileLabels[col];

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
                  className={`aspect-square relative flex items-center justify-center transition-all duration-150 cursor-pointer overflow-hidden ${baseBg} ${
                    isRegentInCheck
                      ? 'ring-2 ring-red-500 ring-inset bg-red-950/70 shadow-[0_0_20px_rgba(239,68,68,0.8)]'
                      : isSelected
                      ? 'ring-2 ring-kingdom-gold ring-inset bg-amber-950/40'
                      : isLastMoveFrom || isLastMoveTo
                      ? 'ring-1 ring-amber-500/60 ring-inset bg-amber-900/20'
                      : 'hover:brightness-110 active:brightness-95'
                  }`}
                >
                  {/* Embedded Rank Coordinate (Top-Left corner of column 0) */}
                  {showRankLabel && (
                    <span
                      className={`absolute top-0.5 left-0.5 z-10 text-[8px] sm:text-[10px] font-mono font-bold pointer-events-none select-none leading-none ${
                        isLightSquare ? 'text-slate-900/60' : 'text-slate-400/60'
                      }`}
                    >
                      {rankNum}
                    </span>
                  )}

                  {/* Embedded File Coordinate (Bottom-Right corner of row 7) */}
                  {showFileLabel && (
                    <span
                      className={`absolute bottom-0.5 right-0.5 z-10 text-[8px] sm:text-[10px] font-mono font-bold pointer-events-none select-none leading-none ${
                        isLightSquare ? 'text-slate-900/60' : 'text-slate-400/60'
                      }`}
                    >
                      {fileLetter}
                    </span>
                  )}

                  {/* Tactical Overlay Heatmaps */}
                  {showTacticalOverlay && (
                    <div className="absolute inset-0 pointer-events-none">
                      {isGoldControlled && isSilverControlled && (
                        <div className="absolute inset-0 bg-purple-500/15" />
                      )}
                      {isGoldControlled && !isSilverControlled && (
                        <div className="absolute inset-0 bg-amber-500/15" />
                      )}
                      {!isGoldControlled && isSilverControlled && (
                        <div className="absolute inset-0 bg-blue-500/15" />
                      )}
                    </div>
                  )}

                  {/* Regent in Check Warning Badge */}
                  {isRegentInCheck && (
                    <span className="absolute top-0.5 right-0.5 z-30 px-1 py-0.2 rounded bg-red-600 text-white text-[7px] sm:text-[9px] font-black uppercase tracking-wider border border-red-300 shadow animate-pulse">
                      CHECK!
                    </span>
                  )}

                  {/* Tactical Threat & Protection Badges */}
                  {isThreatened && !isRegentInCheck && (
                    <div
                      title="Threatened by enemy!"
                      className="absolute top-1 right-1 z-10 w-2 h-2 rounded-full bg-red-500 animate-ping"
                    />
                  )}
                  {isPinned && (
                    <div
                      title="Pinned to Regent!"
                      className="absolute bottom-0.5 left-0.5 z-10 px-1 py-0.2 rounded bg-purple-900 text-[7px] sm:text-[8px] font-bold text-purple-200 border border-purple-400"
                    >
                      PIN
                    </div>
                  )}
                  {isProtected && !isThreatened && (
                    <div
                      title="Defended by friendly unit"
                      className="absolute bottom-1 right-1 z-10 w-1.5 h-1.5 rounded-full bg-emerald-400"
                    />
                  )}

                  {/* Legal Move Destination Indicators */}
                  {isLegalDestination && !pieceOnSquare && (
                    <div className="relative flex items-center justify-center z-10">
                      <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emerald-400/80 shadow-md shadow-emerald-400/50 animate-pulse" />
                    </div>
                  )}

                  {isLegalDestination && pieceOnSquare && (
                    <div className="absolute inset-0 z-10 border-2 border-red-500/90 bg-red-950/30 rounded flex items-center justify-center pointer-events-none animate-pulse">
                      <Crosshair className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
                    </div>
                  )}

                  {isSiegeBashDestination && (
                    <div className="absolute inset-0 z-10 border-2 border-orange-500 bg-orange-950/40 rounded flex items-center justify-center pointer-events-none">
                      <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400 animate-bounce" />
                    </div>
                  )}

                  {/* Piece Display: Maximized size for mobile clarity */}
                  {pieceOnSquare && (
                    <div
                      className={`relative z-20 flex items-center justify-center w-full h-full p-0.5 sm:p-1 transition-transform duration-150 ${
                        isSelected ? 'scale-110 drop-shadow-2xl' : 'hover:scale-105'
                      }`}
                    >
                      <PieceIcon
                        type={pieceOnSquare.type}
                        owner={pieceOnSquare.owner}
                        orientation={pieceOnSquare.orientation}
                        isSiegeMode={pieceOnSquare.isSiegeMode}
                        size="100%"
                        className="w-full h-full object-contain"
                      />

                      {/* Special Status Indicator Badges */}
                      {pieceOnSquare.isSiegeMode && (
                        <span
                          title="Siege Mode active!"
                          className="absolute -top-1 -left-1 px-1 py-0.2 text-[7px] sm:text-[8px] font-extrabold uppercase bg-red-700 text-yellow-200 border border-red-400 rounded shadow"
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
  );
};
