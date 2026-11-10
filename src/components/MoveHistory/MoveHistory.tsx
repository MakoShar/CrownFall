import React from 'react';
import { GameHistoryEntry } from '../../engine/gameState';
import { ScrollText } from 'lucide-react';

interface MoveHistoryProps {
  history: GameHistoryEntry[];
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({ history }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [history.length]);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col h-48 md:h-64 shadow-inner">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-800">
        <ScrollText className="w-4 h-4 text-kingdom-gold" />
        Battle Chronicle ({history.length} Actions)
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto space-y-1.5 py-2 pr-1 font-mono text-xs">
        {history.length === 0 ? (
          <div className="text-slate-500 italic text-center py-6">
            The kingdom stands in quiet formation. Make your opening move.
          </div>
        ) : (
          history.map((entry, index) => {
            const isGold = entry.activePlayer === 'gold';
            return (
              <div
                key={index}
                className="flex items-start gap-2 p-1.5 rounded bg-slate-950/40 hover:bg-slate-800/40 border border-slate-800/60"
              >
                <span className="text-slate-500 font-semibold w-6 text-right shrink-0">
                  {index + 1}.
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold shrink-0 ${
                    isGold
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}
                >
                  {entry.activePlayer}
                </span>
                <span className="text-slate-300 leading-tight">
                  {entry.description}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

