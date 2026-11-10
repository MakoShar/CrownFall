import React, { useEffect, useRef, useState } from 'react';
import { Swords, BookOpen, GraduationCap, Eye, ChevronRight } from 'lucide-react';

interface SplashScreenProps {
  onPlay: () => void;
  onTutorial: () => void;
  onRules: () => void;
}

const PIECE_NAMES = ['regent', 'champion', 'rider', 'oracle', 'bastion', 'soldier'];
const PIECE_LABELS = ['Regent', 'Champion', 'Rider', 'Oracle', 'Bastion', 'Soldier'];
const PIECE_SUBTITLES = [
  'The Commander',
  'The Supreme Warrior',
  'The Directional Warrior',
  'The Divine Messenger',
  'The Siege Guardian',
  'The Infantry',
];

export const SplashScreen: React.FC<SplashScreenProps> = ({ onPlay, onTutorial, onRules }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [activePiece, setActivePiece] = useState(0);
  const [logoVisible, setLogoVisible] = useState(false);
  const [buttonsVisible, setButtonsVisible] = useState(false);

  // Particle starfield animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const stars = Array.from({ length: 160 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.3,
      speed: Math.random() * 0.4 + 0.05,
      alpha: Math.random(),
      dir: Math.random() > 0.5 ? 1 : -1,
    }));

    // Floating orbs
    const orbs = Array.from({ length: 5 }, (_, i) => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 60 + Math.random() * 100,
      hue: [45, 200, 280, 0, 160][i],
      speed: 0.2 + Math.random() * 0.3,
      angle: Math.random() * Math.PI * 2,
    }));

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Orbs
      orbs.forEach((o) => {
        o.angle += o.speed * 0.01;
        o.x += Math.sin(o.angle) * 0.3;
        o.y += Math.cos(o.angle * 0.7) * 0.2;
        const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        grad.addColorStop(0, `hsla(${o.hue}, 80%, 60%, 0.07)`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Stars
      stars.forEach((s) => {
        s.alpha += s.dir * 0.005;
        if (s.alpha > 1 || s.alpha < 0) s.dir *= -1;
        s.y -= s.speed;
        if (s.y < 0) { s.y = canvas.height; s.x = Math.random() * canvas.width; }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.alpha * 0.6})`;
        ctx.fill();
      });

      t++;
      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Staggered entrance
  useEffect(() => {
    const t1 = setTimeout(() => setLogoVisible(true), 100);
    const t2 = setTimeout(() => setButtonsVisible(true), 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Cycle piece showcase
  useEffect(() => {
    const iv = setInterval(() => setActivePiece((p) => (p + 1) % PIECE_NAMES.length), 2200);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-between overflow-hidden bg-kingdom-obsidian select-none">
      {/* Animated canvas background */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }} />

      {/* Gradient vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" style={{ zIndex: 1 }} />

      {/* Top navigation */}
      <div
        className="relative w-full flex justify-end items-center px-8 pt-6 gap-4"
        style={{ zIndex: 10, opacity: buttonsVisible ? 1 : 0, transition: 'opacity 0.6s ease 0.8s' }}
      >
        <button
          onClick={onRules}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all border border-white/10"
        >
          <BookOpen className="w-4 h-4" /> Codex
        </button>
        <button
          onClick={onTutorial}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all border border-white/10"
        >
          <GraduationCap className="w-4 h-4" /> Academy
        </button>
      </div>

      {/* Center content */}
      <div
        className="relative flex flex-col items-center justify-center flex-1 gap-6 px-6"
        style={{ zIndex: 10 }}
      >
        {/* Logo block */}
        <div
          className="text-center"
          style={{
            opacity: logoVisible ? 1 : 0,
            transform: logoVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity 0.9s ease, transform 0.9s ease',
          }}
        >
          {/* Crown icon */}
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-kingdom-gold to-kingdom-goldDark flex items-center justify-center shadow-regal-gold">
              <img src="/pieces/regent.png" alt="Crown" className="w-14 h-14 object-cover object-top rounded-full" />
            </div>
          </div>
          <h1 className="font-fantasy text-6xl md:text-8xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-kingdom-goldLight via-kingdom-gold to-kingdom-goldDark drop-shadow-[0_2px_30px_rgba(245,158,11,0.5)]">
            CROWNFALL
          </h1>
          <p className="font-fantasy text-lg md:text-2xl tracking-[0.3em] text-kingdom-silver mt-1 uppercase">
            The Last Kingdom
          </p>
          <div className="mt-4 h-px w-64 mx-auto bg-gradient-to-r from-transparent via-kingdom-gold to-transparent opacity-60" />
          <p className="mt-4 text-slate-400 text-sm md:text-base italic max-w-md mx-auto leading-relaxed">
            "Easy to understand. Difficult to master.<br />
            Never surrender until the Regent falls."
          </p>
        </div>

        {/* Piece showcase carousel */}
        <div
          className="flex gap-3 mt-2"
          style={{
            opacity: buttonsVisible ? 1 : 0,
            transition: 'opacity 0.6s ease 0.4s',
          }}
        >
          {PIECE_NAMES.map((name, i) => (
            <button
              key={name}
              onClick={() => setActivePiece(i)}
              className="relative group flex flex-col items-center"
            >
              <div
                className={`w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                  activePiece === i
                    ? 'border-kingdom-gold shadow-regal-gold scale-110'
                    : 'border-white/10 opacity-60 hover:opacity-90 hover:border-white/30'
                }`}
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <img
                  src={`/pieces/${name}.png`}
                  alt={PIECE_LABELS[i]}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              {activePiece === i && (
                <div className="absolute -bottom-6 text-center w-24 left-1/2 -translate-x-1/2">
                  <p className="text-kingdom-gold font-fantasy text-xs font-bold tracking-wider">{PIECE_LABELS[i]}</p>
                </div>
              )}
            </button>
          ))}
        </div>
        {/* Piece subtitle */}
        <div className="h-5 mt-2">
          <p
            className="text-center text-slate-400 text-xs italic"
            style={{ opacity: buttonsVisible ? 1 : 0, transition: 'opacity 0.6s' }}
          >
            {PIECE_SUBTITLES[activePiece]}
          </p>
        </div>

        {/* CTA Buttons */}
        <div
          className="flex flex-col items-center gap-3 mt-4 w-full max-w-xs"
          style={{
            opacity: buttonsVisible ? 1 : 0,
            transform: buttonsVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.6s ease 0.6s, transform 0.6s ease 0.6s',
          }}
        >
          <button
            onClick={onPlay}
            className="w-full flex items-center justify-center gap-3 py-4 px-8 rounded-2xl font-fantasy text-xl font-bold tracking-widest text-black bg-gradient-to-r from-kingdom-goldLight via-kingdom-gold to-kingdom-goldDark hover:from-yellow-300 hover:to-yellow-500 shadow-regal-gold transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Swords className="w-6 h-6" />
            PLAY NOW
            <ChevronRight className="w-6 h-6" />
          </button>
          <div className="flex gap-3 w-full">
            <button
              onClick={onTutorial}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-slate-200 bg-white/8 hover:bg-white/14 border border-white/15 transition-all"
            >
              <GraduationCap className="w-4 h-4 text-kingdom-mana" /> Tutorial
            </button>
            <button
              onClick={onRules}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-slate-200 bg-white/8 hover:bg-white/14 border border-white/15 transition-all"
            >
              <BookOpen className="w-4 h-4 text-kingdom-amethyst" /> Codex
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="relative pb-5 text-center text-slate-600 text-xs"
        style={{ zIndex: 10, opacity: buttonsVisible ? 1 : 0, transition: 'opacity 1s ease 1s' }}
      >
        CROWNFALL: The Last Kingdom &nbsp;•&nbsp; v1.0
      </div>
    </div>
  );
};
