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
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500 text-amber-400">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-fantasy font-bold text-amber-100">
                  Codex of Crownfall
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30 uppercase">
                  Blue vs White Edition
                </span>
              </div>
              <p className="text-xs text-slate-400">
                White and Black squares board. Chess armed with specialized unit abilities.
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
            <h3 className="text-sm font-fantasy font-bold text-amber-400 uppercase tracking-wider">
              1. Sides & Battlefield
            </h3>
            <p className="text-slate-300">
              Two sides clash across the board: <strong>White</strong> (starts at bottom) and <strong>Blue</strong> (starts at top). The board is crafted with crisp <strong>white and black squares</strong>. Standard Chess check, checkmate, and stalemate rules apply.
            </p>
          </div>

          {/* Section: The Six Pieces */}
          <div className="space-y-4">
            <h3 className="text-sm font-fantasy font-bold text-amber-400 uppercase tracking-wider">
              2. Unit Roster & Special Abilities
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Regent */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-amber-500/40">
                    <PieceIcon type="regent" owner="white" size={38} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-amber-200 text-sm">Regent</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300">KING</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">PASSIVE</span>
                    </div>
                    <div className="text-[11px] text-slate-400">Royal Surge</div>
                  </div>
                </div>
                <p className="text-slate-300">
                  • <strong>Movement:</strong> Moves <strong>up to two spaces at a time</strong> in any of the 8 directions.<br />
                  • <strong>Constraint:</strong> Cannot jump over other pieces (intermediate square must be clear).<br />
                  • <strong>Defense:</strong> Standard King check & checkmate rules apply.
                </p>
              </div>

              {/* Champion */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-purple-500/40">
                    <PieceIcon type="champion" owner="white" size={38} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-amber-200 text-sm">Champion</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300">QUEEN</span>
                    </div>
                    <div className="text-[11px] text-slate-400">Supreme Power</div>
                  </div>
                </div>
                <p className="text-slate-300">
                  • <strong>Status:</strong> Already overpowered!<br />
                  • <strong>Movement:</strong> Any distance in all 8 directions (orthogonal and diagonal).
                </p>
              </div>

              {/* Bastion */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-orange-500/40">
                    <PieceIcon type="bastion" owner="white" size={38} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-amber-200 text-sm">Bastion</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-orange-500/20 text-orange-300">ROOK</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">PASSIVE</span>
                    </div>
                    <div className="text-[11px] text-slate-400">Rampart Leap</div>
                  </div>
                </div>
                <p className="text-slate-300">
                  • <strong>Movement:</strong> Slides any distance along unobstructed ranks and files.<br />
                  • <strong>Passive Ability:</strong> Can <strong>jump over a nearby (adjacent) piece by one square</strong> along orthogonal lines. Cannot move across empty squares and jump at the same time.<br />
                  • <strong>Restriction:</strong> The jump applies to directly adjacent obstacles (distance 1); it cannot slide through empty squares and jump in the same turn.
                </p>
              </div>

              {/* Oracle */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-indigo-500/40">
                    <PieceIcon type="oracle" owner="white" size={38} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-amber-200 text-sm">Oracle</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300">BISHOP</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-500/30 text-indigo-200">ACTIVE</span>
                    </div>
                    <div className="text-[11px] text-slate-400">Soul Transmutation</div>
                  </div>
                </div>
                <p className="text-slate-300">
                  • <strong>Movement:</strong> Moves diagonally any distance.<br />
                  • <strong>Active Ability:</strong> Can <strong>transform into any piece it captures</strong> (usable once per game). The bishop is replaced by the captured piece at the opponent's position.
                </p>
              </div>

              {/* Rider */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-sky-500/40">
                    <PieceIcon type="rider" owner="white" size={38} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-amber-200 text-sm">Rider</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-500/20 text-sky-300">HORSE (KNIGHT)</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-500/30 text-sky-200">ACTIVE</span>
                    </div>
                    <div className="text-[11px] text-slate-400">Temporal Gallop</div>
                  </div>
                </div>
                <p className="text-slate-300">
                  • <strong>Movement:</strong> Jumps in an L-shape (2 by 1) over other pieces.<br />
                  • <strong>Active Ability:</strong> Has the option to <strong>skip the opponent's turn once</strong>! After using this ability, the horse rests and cannot move on the next turn.
                </p>
              </div>

              {/* Soldier */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-emerald-500/40">
                    <PieceIcon type="soldier" owner="white" size={38} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-amber-200 text-sm">Soldier</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300">SOLDIER (PAWN)</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">PASSIVE</span>
                    </div>
                    <div className="text-[11px] text-slate-400">Lateral Advance</div>
                  </div>
                </div>
                <p className="text-slate-300">
                  • <strong>Passive Ability:</strong> Can <strong>move forward, left, and right</strong> too (and capture diagonally forward or sideways).<br />
                  • <strong>Forward March:</strong> Moves 1 space forward (or 2 spaces from the starting rank).<br />
                  • <strong>Promotion:</strong> Reaching the 8th rank promotes into Queen, Rook, Bishop, or Knight.
                </p>
              </div>
            </div>
          </div>

          {/* Section: Check & Checkmate */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-red-500/30 space-y-2">
            <h3 className="text-sm font-fantasy font-bold text-red-400 uppercase tracking-wider">
              3. Check & Checkmate Doctrine
            </h3>
            <p className="text-slate-300">
              The Sovereign Regent must be guarded under standard chess principles:
            </p>
            <ol className="list-decimal pl-5 space-y-1 text-slate-300">
              <li><strong>Check:</strong> When a King is threatened, it is in CHECK and must escape immediately.</li>
              <li><strong>Mandatory Defense:</strong> Any move that leaves or places your own King in check is strictly illegal.</li>
              <li><strong>Checkmate:</strong> If a King is in check with no legal moves to escape: CHECKMATE! Victory is instantaneous.</li>
              <li><strong>Stalemate:</strong> If a player has no legal moves and is not in check, the match ends in a DRAW.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
