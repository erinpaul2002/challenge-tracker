'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Crosshair, Trophy, Clock, Target } from 'lucide-react';
import { useReducedMotion } from '@/app/hooks/useReducedMotion';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/* ── Demo challenge data ── */
const CHALLENGES = [
  {
    title: '100 HEADSHOTS IN PUBG',
    sub: 'Kar98k Headshots',
    givenBy: 'dragon99',
    reward: '$50',
    target: 100,
  },
  {
    title: 'WIN 5 SQUAD GAMES',
    sub: 'Erangel Wins',
    givenBy: 'xfire_ttv',
    reward: '$25',
    target: 5,
  },
];

const FEATURES = [
  { icon: Target, label: 'REAL-TIME UPDATES', desc: 'Progress syncs instantly across all viewers' },
  { icon: Clock, label: 'AUTO-ROTATION', desc: 'Cycles through active challenges on configurable intervals' },
  { icon: Trophy, label: 'OBS INTEGRATION', desc: 'One-click browser source — live in under 30 seconds' },
];

export default function LandingOverlay() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const [activeChallenge, setActiveChallenge] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  /* Progress ticking (once revealed) */
  useEffect(() => {
    if (!isRevealed) return;

    const currentTarget = CHALLENGES[activeChallenge].target;
    // Normalize speed: aim for ~6s to complete regardless of target size
    const tickRate = 6000 / currentTarget;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= currentTarget) {
          return 0;
        }
        return prev + 1;
      });
    }, tickRate);
    return () => clearInterval(interval);
  }, [isRevealed, activeChallenge]);

  /* Challenge rotation */
  useEffect(() => {
    if (!isRevealed) return;
    const interval = setInterval(() => {
      setActiveChallenge(prev => (prev + 1) % CHALLENGES.length);
      setProgress(0);
    }, 8000);
    return () => clearInterval(interval);
  }, [isRevealed]);

  /* GSAP animations */
  useEffect(() => {
    if (reducedMotion || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      /* Section entrance trigger */
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top 80%',
        once: true,
        onEnter: () => setIsRevealed(true),
      });

      /* Pinned section with scroll-driven reveal */
      const pinTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=180%',
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
        },
      });

      /* Phase 1: Widget reveal (0 → 0.3) */
      pinTl.from('.lo-widget-wrap', {
        scale: 0.7,
        opacity: 0,
        filter: 'blur(20px)',
        y: 80,
        duration: 0.3,
        ease: 'power2.out',
      }, 0);

      /* Phase 1b: Airdrop smoke */
      pinTl.from('.lo-smoke', {
        opacity: 0,
        scale: 0.5,
        duration: 0.2,
      }, 0);
      pinTl.to('.lo-smoke', {
        opacity: 0,
        scale: 2,
        duration: 0.2,
      }, 0.25);

      /* Phase 2: Headline (0.2 → 0.4) */
      pinTl.from('.lo-headline', {
        opacity: 0,
        y: 30,
        duration: 0.15,
      }, 0.2);

      /* Phase 3: Feature callouts stagger (0.4 → 0.7) */
      pinTl.from('.lo-feature', {
        opacity: 0,
        y: 25,
        stagger: 0.08,
        duration: 0.1,
      }, 0.4);

      /* Phase 4: Glow intensify (0.6 → 0.8) */
      pinTl.to('.lo-glow', {
        opacity: 0.15,
        scale: 1.3,
        duration: 0.2,
      }, 0.6);

      /* Phase 5: Badge appear (0.7 → 0.85) */
      pinTl.from('.lo-badge', {
        opacity: 0,
        scale: 0.8,
        duration: 0.1,
        ease: 'back.out(2)',
      }, 0.75);

    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  const challenge = CHALLENGES[activeChallenge];
  const progressPercent = Math.min(100, (progress / challenge.target) * 100);

  return (
    <section
      ref={sectionRef}
      id="overlay"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
    >
      {/* ── Background glow ── */}
      <div className="lo-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.06] pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--tactical-yellow) 0%, transparent 70%)' }} />

      {/* ── Airdrop smoke effect ── */}
      <div className="lo-smoke absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full pointer-events-none opacity-0"
        style={{ background: 'radial-gradient(circle, rgba(242,201,76,0.15) 0%, transparent 60%)' }} />

      {/* ── Section eyebrow ── */}
      <div className="lo-headline text-center mb-10 px-4 relative z-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-10 h-px bg-gradient-to-r from-transparent to-tactical/40" />
          <span className="font-mono text-[11px] text-tactical/70 tracking-[0.3em] uppercase">AIRDROP INBOUND</span>
          <div className="w-10 h-px bg-gradient-to-l from-transparent to-tactical/40" />
        </div>
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-hud leading-none" style={{ fontFamily: 'var(--font-chakra)' }}>
          NEVER MISS
          <span className="block text-tactical">A BEAT</span>
        </h2>
      </div>

      {/* ── Main Overlay Widget ── */}
      <div className="lo-widget-wrap relative z-10 mb-12 perspective-[1200px] w-full max-w-[440px] px-4">
        <div className="product-frame rounded-sm p-5 w-full relative" style={{ transform: 'rotateY(-1deg) rotateX(1deg)' }}>
          {/* Corner brackets */}
          <div className="tactical-corner tactical-corner--tl" />
          <div className="tactical-corner tactical-corner--tr" />
          <div className="tactical-corner tactical-corner--bl" />
          <div className="tactical-corner tactical-corner--br" />

          {/* Scanline */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-sm opacity-[0.03]">
            <div className="w-full h-full" style={{
              background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(234,234,234,0.3) 2px, rgba(234,234,234,0.3) 4px)',
            }} />
          </div>

          {/* Widget Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-sm bg-tactical/10 border border-tactical/30 flex items-center justify-center">
              <Crosshair className="w-4 h-4 text-tactical" />
            </div>
            <div>
              <div className="font-bold text-base text-hud tracking-wider" style={{ fontFamily: 'var(--font-chakra)' }}>
                {challenge.title}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-mono text-tactical/60 tracking-wider">ACTIVE</span>
                <span className="text-[10px] text-dimmed/30">•</span>
                <span className="text-[10px] font-mono text-dimmed/60">{challenge.reward}</span>
              </div>
            </div>
          </div>

          {/* Sub-challenge */}
          <div className="bg-void/50 rounded-sm p-3 border border-gunmetal/30 mb-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[12px] font-mono text-hud/80">{challenge.sub}</span>
              <span className="text-[13px] font-mono text-tactical font-bold tabular-nums">
                {Math.min(progress, challenge.target)}/{challenge.target}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-3 bg-gunmetal/60 rounded-sm overflow-hidden relative">
              <div
                className="h-full rounded-sm transition-all duration-100 ease-linear"
                style={{
                  width: `${progressPercent}%`,
                  background: progressPercent >= 100
                    ? 'linear-gradient(90deg, #00c853, #00FF41)'
                    : 'linear-gradient(90deg, var(--tactical-yellow-dim), var(--tactical-yellow))',
                }}
              />
              {/* Shine */}
              <div className="absolute inset-0 opacity-15"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'landing-drift 2.5s linear infinite',
                }}
              />

              {/* Completion flash */}
              {progressPercent >= 100 && (
                <div className="absolute inset-0 bg-terminal/20 animate-pulse" />
              )}
            </div>

            {/* Boost-style secondary bar */}
            <div className="flex gap-0.5 mt-2">
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} className="boost-segment rounded-sm">
                  <div
                    className="boost-segment-fill rounded-sm transition-transform duration-200"
                    style={{
                      transform: `scaleX(${progressPercent >= (i + 1) * 10 ? 1 : 0})`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center justify-between pt-2 border-t border-gunmetal/30">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-tactical" style={{ animation: 'landing-pulse 2s ease-in-out infinite' }} />
              <span className="text-[10px] font-mono text-dimmed">{challenge.givenBy}</span>
            </div>
            {progressPercent >= 100 ? (
              <div className="flex items-center gap-1">
                <Trophy className="w-3 h-3 text-terminal" />
                <span className="text-[10px] font-mono text-terminal tracking-wider font-bold">COMPLETED</span>
              </div>
            ) : (
              <span className="text-[10px] font-mono text-dimmed/40 tracking-wider">LIVE ON STREAM</span>
            )}
          </div>
        </div>

        {/* Ambient glow behind widget */}
        <div className="absolute -inset-8 -z-10 rounded-lg"
          style={{
            background: 'radial-gradient(ellipse, rgba(242, 201, 76, 0.06) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* ── Legendary badge ── */}
      <div className="lo-badge flex items-center gap-2 mb-10 px-4 py-2 rounded-sm bg-tactical/5 border border-tactical/20">
        <div className="w-3 h-3 rounded-full bg-tactical/40" />
        <span className="font-mono text-[10px] text-tactical/80 tracking-[0.15em] uppercase">
          LEGENDARY LOOT — OBS BROWSER SOURCE
        </span>
      </div>

      {/* ── Feature callouts ── */}
      <div className="relative z-10 w-full max-w-4xl px-6">
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((feat, i) => (
            <div key={i} className="lo-feature text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-sm border border-gunmetal/50 bg-armor/50 mb-3">
                <feat.icon className="w-5 h-5 text-tactical/80" />
              </div>
              <div className="font-bold text-sm text-hud tracking-[0.1em] mb-1" style={{ fontFamily: 'var(--font-chakra)' }}>
                {feat.label}
              </div>
              <p className="font-mono text-[11px] text-dimmed leading-relaxed">
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom decorative line ── */}
      <div className="mt-16 w-32 h-px bg-gradient-to-r from-transparent via-tactical/20 to-transparent" />
    </section>
  );
}
