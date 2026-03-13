'use client';

import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Zap, Shield, Gauge, Radio } from 'lucide-react';
import { useReducedMotion } from '@/app/hooks/useReducedMotion';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/* ── Stat blocks styled like PUBG match summary ── */
const STATS = [
  {
    icon: Zap,
    label: 'REAL-TIME\nOVERLAY',
    desc: 'Live challenge progress visible to every viewer on stream',
    accent: 'tactical',
  },
  {
    icon: Shield,
    label: 'MODERATOR\nCONTROL',
    desc: 'Delegate progress updates to trusted mods with full undo support',
    accent: 'terminal',
  },
  {
    icon: Gauge,
    label: 'OBS READY\nIN 30 SEC',
    desc: 'Copy one URL. Paste into OBS. Your overlay is live — that fast',
    accent: 'tactical',
  },
  {
    icon: Radio,
    label: 'OFFLINE\nQUEUE',
    desc: 'Actions queue locally and sync automatically when reconnected',
    accent: 'alert',
  },
];

function AnimatedCounter({ target, suffix, isActive }: { target: number; suffix?: string; isActive: boolean }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!isActive) return;
    let frame: number;
    const duration = 1500;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, isActive]);

  return (
    <span className="tabular-nums">{value}{suffix}</span>
  );
}

export default function LandingStats() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const [isActive, setIsActive] = useState(false);

  const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

  useIsomorphicLayoutEffect(() => {
    if (reducedMotion || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      /* Section entrance */
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 65%',
          toggleActions: 'play none none reverse',
          onEnter: () => setIsActive(true),
        },
      });

      tl.fromTo('.ls-header', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 });
      tl.fromTo('.ls-divider', { scaleX: 0 }, { scaleX: 1, duration: 0.5, transformOrigin: 'center' }, '-=0.3');
      tl.fromTo('.ls-card', {
        opacity: 0,
        y: 30
      }, {
        opacity: 1,
        y: 0,
        stagger: 0.12,
        duration: 0.6,
        ease: 'power3.out',
      }, '-=0.2');
      tl.fromTo('.ls-bottom', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.2');

    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section
      ref={sectionRef}
      id="stats"
      className="relative py-24 lg:py-32 overflow-hidden"
    >
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        {/* Header — PUBG match summary style */}
        <div className="ls-header text-center mb-4">
          <div className="font-mono text-[10px] text-dimmed/50 tracking-[0.3em] mb-2">MATCH SUMMARY</div>
          <h2 className="text-3xl md:text-5xl font-black text-hud tracking-wider" style={{ fontFamily: 'var(--font-chakra)' }}>
            BUILT FOR <span className="text-tactical">REAL STREAMS</span>
          </h2>
        </div>

        {/* Decorative divider */}
        <div className="ls-divider w-full max-w-md mx-auto mb-12">
          <div className="h-px bg-gradient-to-r from-transparent via-gunmetal to-transparent" />
          <div className="flex justify-center -mt-1.5">
            <div className="w-3 h-3 rotate-45 border border-gunmetal bg-void" />
          </div>
        </div>

        {/* Stat grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((stat, i) => {
            const accentColor =
              stat.accent === 'terminal' ? 'var(--terminal-green)' :
              stat.accent === 'alert' ? 'var(--alert-amber)' :
              'var(--tactical-yellow)';

            return (
              <div
                key={i}
                className="ls-card group relative bg-armor/40 border border-gunmetal/40 rounded-sm p-5 hover:border-opacity-80 transition-all duration-300"
                style={{
                  '--card-accent': accentColor,
                } as React.CSSProperties}
              >
                {/* Top accent line */}
                <div
                  className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${accentColor}40, transparent)` }}
                />

                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-sm border flex items-center justify-center mb-4"
                  style={{
                    borderColor: `${accentColor}30`,
                    background: `${accentColor}08`,
                  }}
                >
                  <stat.icon className="w-5 h-5" style={{ color: accentColor }} />
                </div>

                {/* Label (multi-line) */}
                <div
                  className="font-black text-lg leading-tight tracking-[0.08em] mb-3 whitespace-pre-line"
                  style={{ fontFamily: 'var(--font-chakra)', color: accentColor }}
                >
                  {stat.label}
                </div>

                {/* Description */}
                <p className="font-mono text-[11px] text-dimmed leading-relaxed">
                  {stat.desc}
                </p>

                {/* Corner detail */}
                <div className="absolute bottom-2 right-2 font-mono text-[8px] text-gunmetal tracking-wider">
                  0{i + 1}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom metric strip */}
        <div className="ls-bottom mt-12 pt-8 border-t border-gunmetal/30">
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto text-center">
            <div>
              <div className="text-2xl md:text-3xl font-black text-tactical" style={{ fontFamily: 'var(--font-chakra)' }}>
                {reducedMotion ? '< 500' : <AnimatedCounter target={500} suffix="" isActive={isActive} />}
                <span className="text-lg">ms</span>
              </div>
              <div className="font-mono text-[10px] text-dimmed tracking-[0.15em] mt-1">SYNC LATENCY</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-black text-terminal" style={{ fontFamily: 'var(--font-chakra)' }}>
                {reducedMotion ? '30' : <AnimatedCounter target={30} isActive={isActive} />}
                <span className="text-lg">s</span>
              </div>
              <div className="font-mono text-[10px] text-dimmed tracking-[0.15em] mt-1">SETUP TIME</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-black text-alert" style={{ fontFamily: 'var(--font-chakra)' }}>
                {reducedMotion ? '17' : <AnimatedCounter target={17} isActive={isActive} />}
              </div>
              <div className="font-mono text-[10px] text-dimmed tracking-[0.15em] mt-1">OVERLAY THEMES</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
