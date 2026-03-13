'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Plus, Minus, Check, Keyboard, Wifi, WifiOff } from 'lucide-react';
import { useReducedMotion } from '@/app/hooks/useReducedMotion';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const KEYBINDS = [
  { key: 'Space', action: 'Increment Progress' },
  { key: 'Bksp', action: 'Decrement Progress' },
  { key: 'Tab', action: 'Next Challenge' },
];

export default function LandingModerator() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const [recentActions, setRecentActions] = useState<Array<{ type: string; detail: string }>>([
    { type: 'confirm', detail: 'Connected to session #8492' },
  ]);
  const [progressVal, setProgressVal] = useState(48);
  const [showToast, setShowToast] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isActive, setIsActive] = useState(false);

  const handleUpdate = (delta: number) => {
    setProgressVal((prev) => {
      const next = Math.min(Math.max(prev + delta, 0), 100);
      if (next !== prev) {
        setRecentActions((prevActs) =>
          [
            {
              type: delta > 0 ? 'increment' : 'decrement',
              detail: `Kar98k Headshots: ${prev} → ${next}`,
            },
            ...prevActs,
          ].slice(0, 4)
        );
        if (delta > 0) {
          setShowToast(true);
          setTimeout(() => setShowToast(false), 1500);
        }
      }
      return next;
    });
  };

  /* specific keyboard support (optional, but nice) */
  useEffect(() => {
    if (!isActive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleUpdate(1);
      } else if (e.code === 'Backspace') {
        handleUpdate(-1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  /* Offline toggle demo */
  useEffect(() => {
    if (!isActive) return;
    const timeout = setTimeout(() => {
      setIsOnline(false);
      setTimeout(() => setIsOnline(true), 3000);
    }, 10000);
    return () => clearTimeout(timeout);
  }, [isActive]);

  /* GSAP animations */
  useEffect(() => {
    if (reducedMotion || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      /* Staggered entrance */
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
          once: true,
          onEnter: () => setIsActive(true),
        },
      });

      tl.from('.lm-eyebrow', { opacity: 0, y: 15, duration: 0.5 });
      tl.from('.lm-headline > span', { opacity: 0, y: 25, stagger: 0.12, duration: 0.6, ease: 'power3.out' }, '-=0.2');
      tl.from('.lm-body', { opacity: 0, y: 15, duration: 0.5 }, '-=0.2');

      /* Dashboard panel */
      tl.from('.lm-dashboard', {
        opacity: 0,
        x: 60,
        rotateY: -5,
        duration: 0.9,
        ease: 'power2.out',
      }, '-=0.4');

      /* Keybinds */
      tl.from('.lm-keybind', {
        opacity: 0,
        y: 15,
        stagger: 0.1,
        duration: 0.4,
      }, '-=0.3');

    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion]);



  return (
    <section
      ref={sectionRef}
      id="moderator"
      className="relative py-24 lg:py-32 min-h-screen overflow-hidden"
    >
      {/* Subtle background accent */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ background: 'radial-gradient(ellipse at 30% 50%, var(--terminal-green), transparent 60%)' }} />

      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Text */}
          <div>
            <div className="lm-eyebrow flex items-center gap-3 mb-6">
              <div className="w-8 h-px bg-terminal/60" />
              <span className="font-mono text-[11px] text-terminal/70 tracking-[0.3em] uppercase">SQUAD COMMAND</span>
            </div>

            <h2 className="lm-headline text-4xl md:text-5xl lg:text-6xl font-black leading-[0.95] mb-8" style={{ fontFamily: 'var(--font-chakra)' }}>
              <span className="block text-hud">COMMAND</span>
              <span className="block text-terminal" style={{ textShadow: '0 0 30px rgba(0, 255, 65, 0.2)' }}>
                EXECUTED.
              </span>
            </h2>

            <div className="lm-body space-y-4 max-w-md">
              <p className="font-mono text-dimmed text-sm leading-relaxed">
                Your moderators get a precision control panel.
                One click to update progress. One click to undo.
                Every action logged. Every change synced in real-time.
              </p>
              <p className="font-mono text-dimmed text-sm leading-relaxed">
                Works offline too. Actions queue up and sync when reconnected.
              </p>
            </div>

            {/* Keybind indicators */}
            <div className="mt-8 space-y-2">
              {KEYBINDS.map((kb, i) => (
                <div key={i} className="lm-keybind flex items-center gap-3">
                  <kbd className="inline-flex items-center gap-1 px-2 py-1 rounded-sm bg-armor border border-gunmetal/60 font-mono text-[11px] text-hud/70 min-w-[56px] justify-center">
                    <Keyboard className="w-3 h-3 text-tactical/50" />
                    {kb.key}
                  </kbd>
                  <span className="font-mono text-[11px] text-dimmed">{kb.action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Dashboard demo */}
          <div className="lm-dashboard perspective-[1000px]">
            <div className="product-frame rounded-sm p-5 relative" style={{ transform: 'rotateY(-2deg)' }}>
              <div className="tactical-corner tactical-corner--tl" />
              <div className="tactical-corner tactical-corner--tr" />
              <div className="tactical-corner tactical-corner--bl" />
              <div className="tactical-corner tactical-corner--br" />

              {/* Dashboard header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gunmetal/40">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-terminal" style={{ animation: 'landing-pulse 2s ease-in-out infinite' }} />
                  <span className="font-bold text-sm text-hud tracking-wider" style={{ fontFamily: 'var(--font-chakra)' }}>
                    MOD DASHBOARD
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {isOnline ? (
                    <>
                      <Wifi className="w-3 h-3 text-terminal/60" />
                      <span className="text-[9px] font-mono text-terminal/60">SYNCED</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 text-alert/60" />
                      <span className="text-[9px] font-mono text-alert/60">QUEUED</span>
                    </>
                  )}
                </div>
              </div>

              {/* Active challenge card */}
              <div className="bg-void/60 rounded-sm p-3 border border-gunmetal/30 mb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-mono text-hud/80">100 HEADSHOTS IN PUBG</span>
                  <span className="text-[10px] font-mono text-tactical/60">ACTIVE</span>
                </div>
                <div className="text-xs font-mono text-dimmed mb-2">Kar98k Headshots</div>

                {/* Progress */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gunmetal/60 rounded-sm overflow-hidden">
                    <div
                      className="h-full rounded-sm transition-all duration-500"
                      style={{
                        width: `${progressVal}%`,
                        background: 'linear-gradient(90deg, var(--tactical-yellow-dim), var(--tactical-yellow))',
                      }}
                    />
                  </div>
                  <span className="font-mono text-sm text-tactical font-bold tabular-nums w-16 text-right">
                    {progressVal}/100
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => handleUpdate(1)}
                  className="flex-1 flex items-center justify-center py-2.5 rounded-sm font-mono text-xs font-bold transition-all duration-200 bg-tactical/10 text-tactical border border-tactical/30 hover:bg-tactical/20 active:scale-[0.98]"
                  title="Increment Progress"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleUpdate(-1)}
                  className="flex-1 flex items-center justify-center py-2.5 rounded-sm bg-armor border border-gunmetal/50 font-mono text-[10px] text-dimmed hover:border-hud/30 hover:text-hud transition-colors active:scale-[0.98]"
                  title="Decrement Progress"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>

              {/* Action log */}
              <div className="border-t border-gunmetal/30 pt-3">
                <div className="text-[9px] font-mono text-dimmed/50 tracking-[0.15em] mb-2">RECENT ACTIONS</div>
                <div className="space-y-1.5">
                  {recentActions.map((action, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] font-mono">
                      <div className={`w-1 h-1 rounded-full ${action.type === 'confirm' ? 'bg-terminal' : action.type === 'decrement' ? 'bg-alert' : 'bg-tactical'}`} />
                      <span className={action.type === 'confirm' ? 'text-terminal/70' : 'text-dimmed'}>
                        {action.detail}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Toast notification */}
              <div
                className={`absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-terminal/10 border border-terminal/30 transition-all duration-300 ${
                  showToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
                }`}
              >
                <Check className="w-3 h-3 text-terminal" />
                <span className="text-[10px] font-mono text-terminal">SYNCED</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
