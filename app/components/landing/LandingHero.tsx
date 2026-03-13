'use client';

import { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Crosshair } from 'lucide-react';
import { useReducedMotion } from '@/app/hooks/useReducedMotion';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/* ── Compass data ── */
const COMPASS_POINTS = ['W', '·', '·', '·', 'NW', '·', '·', '·', 'N', '·', '·', '·', 'NE', '·', '·', '·', 'E', '·', '·', '·', 'SE', '·', '·', '·', 'S', '·', '·', '·', 'SW', '·', '·', '·'];

/* ── Kill feed events (cycling) ── */
const KILL_FEED = [
  { user: 'dragon99', verb: 'created challenge', target: '100 Headshots', color: '#f2c94c' },
  { user: 'mod_sarah', verb: '+1 progress', target: 'Kar98k Headshots (47→48)', color: '#00FF41' },
  { user: 'xfire_ttv', verb: 'donated challenge', target: 'Win 5 Squads', color: '#f2c94c' },
  { user: 'mod_sarah', verb: 'completed', target: '100 Headshots', color: '#00FF41' },
  { user: 'nightowl_', verb: 'created challenge', target: 'Flare Gun Kill', color: '#f2c94c' },
  { user: 'mod_jay', verb: '+1 progress', target: 'AWM Eliminations (12→13)', color: '#00FF41' },
];

/* ── Minimap dots ── */
const MINIMAP_DOTS = [
  { x: 32, y: 38, pulse: true },
  { x: 68, y: 24, pulse: false },
  { x: 48, y: 72, pulse: true },
  { x: 78, y: 58, pulse: false },
  { x: 22, y: 62, pulse: true },
  { x: 55, y: 45, pulse: true },
];

export default function LandingHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const [visibleFeeds, setVisibleFeeds] = useState<number[]>([0, 1, 2]);
  const [overlayProgress, setOverlayProgress] = useState(47);

  /* Kill feed rotation */
  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleFeeds(prev => prev.map(i => (i + 1) % KILL_FEED.length));
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  /* Overlay progress tick */
  useEffect(() => {
    const interval = setInterval(() => {
      setOverlayProgress(prev => prev >= 53 ? 47 : prev + 1);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

  /* GSAP entrance + parallax */
  useIsomorphicLayoutEffect(() => {
    if (reducedMotion || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      /* Compass */
      tl.from('.lh-compass', { y: -40, opacity: 0, duration: 0.7 });

      /* Status bar (top right) */
      tl.from('.lh-status', { opacity: 0, x: 20, duration: 0.6 }, '-=0.3');

      /* Title lines */
      tl.from('.lh-title-1', {
        opacity: 0,
        y: 40,
        letterSpacing: '0.4em',
        duration: 1.1,
        ease: 'power4.out',
      }, '-=0.2');

      tl.from('.lh-title-2', {
        opacity: 0,
        y: 40,
        letterSpacing: '0.4em',
        duration: 1.1,
        ease: 'power4.out',
      }, '-=0.7');

      /* Subtitle line */
      tl.from('.lh-subtitle', { opacity: 0, y: 15, duration: 0.7 }, '-=0.4');

      /* Decorative line draw */
      tl.from('.lh-line-left', { scaleX: 0, duration: 0.6, transformOrigin: 'right center' }, '-=0.3');
      tl.from('.lh-line-right', { scaleX: 0, duration: 0.6, transformOrigin: 'left center' }, '-=0.6');

      /* CTA Buttons */
      tl.fromTo('.lh-cta-buttons > a', { 
        opacity: 0, 
        y: 20, 
        scale: 0.95
      }, {
        opacity: 1, 
        y: 0, 
        scale: 1,
        stagger: 0.15, 
        duration: 0.7,
        ease: 'back.out(1.2)'
      }, '-=0.3');

      /* Overlay widget */
      tl.from('.lh-widget', {
        scale: 0.88,
        opacity: 0,
        y: 50,
        rotateY: -3,
        duration: 1.2,
        ease: 'power2.out',
      }, '-=0.6');

      /* Minimap */
      tl.from('.lh-minimap', { opacity: 0, scale: 0.7, duration: 0.8, ease: 'back.out(1.4)' }, '-=0.7');

      /* Kill feed */
      tl.from('.lh-killfeed', { opacity: 0, x: 30, duration: 0.6 }, '-=0.5');

      /* Bottom features */
      tl.from('.lh-features > div', { opacity: 0, y: 20, stagger: 0.12, duration: 0.6 }, '-=0.3');

      /* Scroll indicator */
      tl.from('.lh-scroll', { opacity: 0, y: -10, duration: 0.5 }, '-=0.2');

      /* Parallax on scroll out */
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
        onUpdate: (self) => {
          const p = self.progress;
          gsap.set('.lh-widget', { y: p * 120, opacity: 1 - p * 0.6 });
          gsap.set('.lh-minimap', { opacity: 1 - p * 1.2 });
          gsap.set('.lh-compass', { opacity: 1 - p * 1.5 });
          gsap.set('.lh-killfeed', { opacity: 1 - p * 1.3, x: p * 40 });
          gsap.set('.lh-title-1', { y: p * -30 });
          gsap.set('.lh-title-2', { y: p * -20 });
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  const handleScrollDown = useCallback(() => {
    const nextSection = document.getElementById('problem');
    nextSection?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative min-h-screen flex flex-col overflow-hidden"
    >
      {/* ── Ambient background ── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, var(--tactical-yellow) 0%, transparent 70%)' }} />
        {/* Top atmospheric haze */}
        <div className="absolute top-0 left-0 right-0 h-[40vh] opacity-30"
          style={{ background: 'linear-gradient(180deg, rgba(242, 201, 76, 0.04) 0%, transparent 100%)' }} />
      </div>

      {/* ── Compass Bar ── */}
      <div className="lh-compass compass-bar-container fixed top-0 left-0 right-0 z-40 flex items-center justify-center overflow-hidden select-none">
        <div className="flex items-center gap-0" style={{ fontSize: '10px', letterSpacing: '0.1em' }}>
          {COMPASS_POINTS.map((label, i) => (
            <div key={i} className="flex flex-col items-center" style={{ width: label === '·' ? 20 : 32 }}>
              <div
                className={`${
                  label !== '·'
                    ? label === 'N'
                      ? 'text-tactical font-bold'
                      : 'text-hud/70 font-medium'
                    : 'text-gunmetal'
                }`}
                style={{ fontFamily: 'var(--font-mono)', fontSize: label === '·' ? '6px' : '10px' }}
              >
                {label}
              </div>
              <div className={`w-px ${label !== '·' ? 'h-2 bg-hud/30' : 'h-1 bg-gunmetal/40'}`} />
            </div>
          ))}
        </div>
        {/* Center bearing indicator */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-transparent border-t-tactical" />
      </div>

      {/* ── Status bar (top right) ── */}
      <div className="lh-status fixed top-10 right-6 z-40 hidden lg:flex flex-col items-end gap-1">
        <div className="flex items-center gap-2 font-mono text-[10px] text-dimmed tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-terminal animate-pulse" />
          SYSTEM_ONLINE
        </div>
        <div className="font-mono text-[10px] text-dimmed/60 tracking-wider">
          ERANGEL // 2026.03.13
        </div>
      </div>

      {/* ── Main Hero Content ── */}
      <div className="flex-1 flex flex-col items-center justify-center relative px-4 pt-12">
        {/* Title Block */}
        <div className="text-center mb-6 mt-8 lg:mt-0">
          <h1 className="leading-none">
            <span className="lh-title-1 block text-[clamp(3rem,10vw,8rem)] font-black tracking-[0.12em] text-hud" style={{ fontFamily: 'var(--font-chakra)' }}>
              CHALLENGE
            </span>
            <span className="lh-title-2 block text-[clamp(3rem,10vw,8rem)] font-black tracking-[0.12em] text-tactical" style={{ fontFamily: 'var(--font-chakra)' }}>
              TRACKER
            </span>
          </h1>

          {/* Decorative lines + subtitle */}
          <div className="flex items-center justify-center gap-4 mt-5">
            <div className="lh-line-left w-16 h-px bg-gradient-to-l from-tactical/40 to-transparent" />
            <p className="lh-subtitle font-mono text-dimmed text-[11px] tracking-[0.35em] uppercase whitespace-nowrap">
              TACTICAL ENGAGEMENT SYSTEM
            </p>
            <div className="lh-line-right w-16 h-px bg-gradient-to-r from-tactical/40 to-transparent" />
          </div>

          {/* CTA Buttons */}
          <div className="lh-cta-buttons flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 w-auto mx-auto">
            <a
              href="/login"
              className="group relative px-8 py-3 font-bold tracking-[0.15em] text-[13px] uppercase transition-all duration-300 w-auto min-w-[200px] text-center"
              style={{ fontFamily: 'var(--font-chakra)' }}
            >
              {/* Background with border effect */}
              <div className="absolute inset-0 bg-tactical/10 border border-tactical/40 group-hover:border-tactical group-hover:bg-tactical/20 transition-all duration-300" />
              <div className="absolute inset-0 bg-tactical/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ 
                background: 'radial-gradient(circle at center, var(--tactical-yellow), transparent)' 
              }} />
              {/* Corner accents */}
              <div className="tactical-corner tactical-corner--tl opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="tactical-corner tactical-corner--br opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
              {/* Button text */}
              <span className="relative text-tactical group-hover:text-hud transition-colors duration-300">
                Sign In
              </span>
            </a>

            <a
              href="/signup"
              className="group relative px-8 py-3 font-bold tracking-[0.15em] text-[13px] uppercase transition-all duration-300 w-auto min-w-[200px] text-center"
              style={{ fontFamily: 'var(--font-chakra)' }}
            >
              {/* Solid background */}
              <div className="absolute inset-0 bg-tactical group-hover:bg-tactical-bright transition-all duration-300" style={{
                boxShadow: '0 0 0 rgba(242, 201, 76, 0), inset 0 0 0 rgba(242, 201, 76, 0)',
              }} />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ 
                boxShadow: '0 0 20px rgba(242, 201, 76, 0.4), inset 0 0 20px rgba(242, 201, 76, 0.1)' 
              }} />
              {/* Corner accents */}
              <div className="tactical-corner tactical-corner--tl !border-gunmetal" />
              <div className="tactical-corner tactical-corner--br !border-gunmetal" />
              {/* Button text */}
              <span className="relative text-gunmetal font-black">
                Join as Streamer
              </span>
            </a>
          </div>
        </div>

        {/* ── Floating Overlay Widget Preview ── */}
        <div className="lh-widget mt-6 lg:mt-0 lg:absolute lg:right-[5%] lg:bottom-[15%] perspective-[1000px] z-50">
          <motion.div
            drag
            dragConstraints={sectionRef}
            dragElastic={0.1}
            dragMomentum={true}
            whileHover={{ scale: 1.02 }}
            whileDrag={{
              scale: 1.05,
              boxShadow: '0 0 25px rgba(242, 201, 76, 0.6), inset 0 0 10px rgba(242, 201, 76, 0.2)',
              borderColor: 'var(--tactical-yellow)',
              cursor: 'grabbing',
              rotateY: 0,
            }}
            initial={{ rotateY: -2 }}
            className="product-frame rounded-sm p-4 w-[320px] relative cursor-grab bg-gunmetal/90 backdrop-blur-sm"
          >
            {/* Corner brackets */}
            <div className="tactical-corner tactical-corner--tl" />
            <div className="tactical-corner tactical-corner--tr" />
            <div className="tactical-corner tactical-corner--bl" />
            <div className="tactical-corner tactical-corner--br" />

            {/* Scanline overlay */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.04]">
              <div className="w-full h-full" style={{
                background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(234,234,234,0.3) 2px, rgba(234,234,234,0.3) 4px)',
              }} />
            </div>

            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <Crosshair className="w-4 h-4 text-tactical" />
              <span className="font-bold text-sm text-hud tracking-wider" style={{ fontFamily: 'var(--font-chakra)' }}>
                100 HEADSHOTS IN PUBG
              </span>
            </div>

            {/* Sub-challenge */}
            <div className="mb-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-mono text-hud/80">Kar98k Headshots</span>
                <span className="text-[11px] font-mono text-tactical font-bold">{overlayProgress}/100</span>
              </div>
              {/* Progress bar */}
              <div className="h-2 bg-gunmetal rounded-sm overflow-hidden relative">
                <div
                  className="h-full rounded-sm transition-all duration-700 ease-out"
                  style={{
                    width: `${overlayProgress}%`,
                    background: 'linear-gradient(90deg, var(--tactical-yellow-dim), var(--tactical-yellow))',
                  }}
                />
                {/* Animated shine */}
                <div className="absolute inset-0 opacity-20"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                    animation: 'landing-drift 2s linear infinite',
                    backgroundSize: '200% 100%',
                  }}
                />
              </div>
            </div>

            {/* Meta row */}
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-gunmetal/50">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-tactical" style={{ animation: 'landing-pulse 2s ease-in-out infinite' }} />
                <span className="text-[10px] font-mono text-dimmed">dragon99</span>
              </div>
              <span className="text-[10px] font-mono text-tactical/60 tracking-wider">ACTIVE</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Minimap (desktop) ── */}
      <div className="lh-minimap fixed bottom-24 left-6 z-30 hidden lg:block">
        <div className="minimap-ring w-[110px] h-[110px] relative">
          {/* Grid lines */}
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gunmetal/30" />
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gunmetal/30" />
            {/* Radar sweep */}
            <div
              className="absolute top-1/2 left-1/2 w-1/2 h-px origin-left"
              style={{
                background: 'linear-gradient(90deg, var(--tactical-yellow), transparent)',
                opacity: 0.4,
                animation: 'landing-radar 4s linear infinite',
              }}
            />
          </div>
          {/* Dots */}
          {MINIMAP_DOTS.map((dot, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: dot.pulse ? 5 : 3,
                height: dot.pulse ? 5 : 3,
                left: `${dot.x}%`,
                top: `${dot.y}%`,
                background: dot.pulse ? 'var(--tactical-yellow)' : 'var(--dimmed-gray)',
                boxShadow: dot.pulse ? '0 0 6px var(--tactical-yellow)' : 'none',
                animation: dot.pulse ? 'landing-pulse 2.5s ease-in-out infinite' : 'none',
                animationDelay: `${i * 0.4}s`,
              }}
            />
          ))}
          {/* Center player dot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-hud rounded-full border border-tactical" />
          {/* Label */}
          <div className="absolute -bottom-5 left-0 right-0 text-center font-mono text-[8px] text-dimmed/50 tracking-[0.2em]">
            ZONE MAP
          </div>
        </div>
      </div>

      {/* ── Kill Feed (desktop) ── */}
      <div className="lh-killfeed fixed top-14 right-6 z-30 hidden lg:flex flex-col gap-1 w-[280px]">
        {visibleFeeds.map((feedIdx, i) => {
          const event = KILL_FEED[feedIdx];
          return (
            <div
              key={`${feedIdx}-${i}`}
              className="killfeed-item font-mono transition-all duration-500 ease-out"
              style={{ opacity: 1 - i * 0.25, borderLeftColor: event.color }}
            >
              <span className="text-hud/80">{event.user}</span>
              <span className="text-dimmed mx-1">{event.verb}</span>
              <span style={{ color: event.color }}>{event.target}</span>
            </div>
          );
        })}
      </div>

      {/* ── Bottom Feature Strip ── */}
      <div className="lh-features relative z-10 pb-20 px-4">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-6 py-6 border-y border-gunmetal/30">
          {[
            { num: '01', label: 'Real-time Overlay' },
            { num: '02', label: 'Mod Delegation' },
            { num: '03', label: 'OBS Integration' },
          ].map(feat => (
            <div key={feat.num} className="text-center">
              <div className="text-tactical font-black text-xl mb-1 italic" style={{ fontFamily: 'var(--font-chakra)' }}>
                {feat.num} {'//'}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-hud/70">
                {feat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Scroll indicator ── */}
      <button
        onClick={handleScrollDown}
        className="lh-scroll absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 group cursor-pointer bg-transparent border-none"
      >
        <span className="font-mono text-[10px] text-dimmed/60 tracking-[0.3em] group-hover:text-tactical/60 transition-colors">
          SCROLL TO DEPLOY
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" className="text-dimmed/40 group-hover:text-tactical/50 transition-colors animate-bounce">
          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </button>
    </section>
  );
}
