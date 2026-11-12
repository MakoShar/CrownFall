import React from 'react';
import { PieceIcon } from '../Pieces/PieceIcon';
import { X, Crown, Shield, Swords, Sparkles, Zap, User } from 'lucide-react';

interface RulesModalProps {
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-hidden">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-kingdom-gold/20 border border-kingdom-gold text-kingdom-gold">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-fantasy font-bold text-amber-100">
                  Codex of Crownfall
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                  Standard Chess Rules
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Classical Chess fundamentals. Pure piece movements without special abilities.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs leading-relaxed">
          {/* Section: Philosophy */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <h3 className="text-sm font-fantasy font-bold text-kingdom-gold uppercase tracking-wider">
              1. Standard Chess Foundation
            </h3>
            <p className="text-slate-300">
              <strong>CROWNFALL</strong> runs on complete standard chess mechanics: <strong>Check, Checkmate, and Stalemate</strong> govern victory and defeat. Every unit moves and captures identically to traditional chess pieces. Special ability mods are currently disabled.
            </p>
          </div>

          {/* Section: The Six Pieces */}
          <div className="space-y-4">
            <h3 className="text-sm font-fantasy font-bold text-kingdom-gold uppercase tracking-wider">
              2. Unit Roster & Movement
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Regent */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-amber-500/40">
                    <PieceIcon type="regent" owner="gold" size={38} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-amber-200 text-sm">Regent</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300">KING</span>
                    </div>
                    <div className="text-[11px] text-slate-400">The Royal Sovereign</div>
                  </div>
                </div>
                <p className="text-slate-300">
                  • <strong>Movement:</strong> 1 square in any of the 8 directions.<br />
                  • <strong>Check & Mate:</strong> Cannot step into or remain in check. Checkmate ends the match immediately!
                </p>
              </div>

              {/* Champion */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-purple-500/40">
                    <PieceIcon type="champion" owner="gold" size={38} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-amber-200 text-sm">Champion</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300">QUEEN</span>
                    </div>
                    <div className="text-[11px] text-slate-400">Supreme Battlefield Dominance</div>
                  </div>
                </div>
                <p className="text-slate-300">
                  • <strong>Movement:</strong> Any number of squares in all 8 directions (orthogonal and diagonal).<br />
                  • <strong>Capture:</strong> Captures any opposing piece along its unobstructed path.
                </p>
              </div>

              {/* Bastion */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-orange-500/40">
                    <PieceIcon type="bastion" owner="gold" size={38} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-amber-200 text-sm">Bastion</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-orange-500/20 text-orange-300">ROOK</span>
                    </div>
                    <div className="text-[11px] text-slate-400">Heavy Castle Rampart</div>
                  </div>
                </div>
                <p className="text-slate-300">
                  • <strong>Movement:</strong> Any number of squares horizontally or vertically along ranks and files.<br />
                  • <strong>Capture:</strong> Linear orthogonal capture.
                </p>
              </div>

              {/* Oracle */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-indigo-500/40">
                    <PieceIcon type="oracle" owner="gold" size={38} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-amber-200 text-sm">Oracle</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300">BISHOP</span>
                    </div>
                    <div className="text-[11px] text-slate-400">Sacred Diagonal Seer</div>
                  </div>
                </div>
                <p className="text-slate-300">
                  • <strong>Movement:</strong> Any number of squares along diagonals.<br />
                  • <strong>Capture:</strong> Diagonal capture like a standard chess Bishop.
                </p>
              </div>

              {/* Rider */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-sky-500/40">
                    <PieceIcon type="rider" owner="gold" size={38} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-amber-200 text-sm">Rider</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-500/20 text-sky-300">KNIGHT</span>
                    </div>
                    <div className="text-[11px] text-slate-400">Mounted Cavalier</div>
                  </div>
                </div>
                <p className="text-slate-300">
                  • <strong>Movement:</strong> Jumps in an L-shape (2 squares in one direction, 1 square perpendicular).<br />
                  • <strong>Leap:</strong> Can leap over other pieces on the board.
                </p>
              </div>

              {/* Soldier */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-emerald-500/40">
                    <PieceIcon type="soldier" owner="gold" size={38} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-amber-200 text-sm">Soldier</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300">PAWN</span>
                    </div>
                    <div className="text-[11px] text-slate-400">Infantry Vanguard</div>
                  </div>
                </div>
                <p className="text-slate-300">
                  • <strong>Movement:</strong> Moves 1 square straight forward (or 2 squares forward on its first move).<br />
                  • <strong>Capture:</strong> Captures 1 square diagonally forward.<br />
                  • <strong>Promotion:</strong> Reaching the 8th rank promotes into Queen (Champion), Rook (Bastion), Bishop (Oracle), or Knight (Rider).
                </p>
              </div>
            </div>
          </div>

          {/* Section: Check & Checkmate */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-red-500/30 space-y-2">
            <h3 className="text-sm font-fantasy font-bold text-red-400 uppercase tracking-wider">
              3. Check & Checkmate — Chess Defense Doctrine
            </h3>
            <p className="text-slate-300">
              The Kingdom must defend its sovereign Regent under standard chess principles:
            </p>
            <ol className="list-decimal pl-5 space-y-1 text-slate-300">
              <li><strong>Check:</strong> When a Regent is threatened by any enemy unit, it is in CHECK. The commander must escape on their turn.</li>
              <li><strong>Mandatory Defense:</strong> Any move that leaves or places your own Regent in check is strictly illegal.</li>
              <li><strong>Escaping Check:</strong> You must escape check by moving the Regent to safety, capturing the checking attacker, or blocking the line of attack.</li>
              <li><strong>Checkmate:</strong> If your Regent is in check and no legal move can escape: CHECKMATE! The attacking Kingdom wins immediately.</li>
              <li><strong>Stalemate:</strong> If a player has no legal moves but is NOT in check, the match concludes in a DRAW.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
