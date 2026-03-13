'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { useReducedMotion } from '@/app/hooks/useReducedMotion';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/* ── Onboarding step cycle ── */
const ONBOARDING_STEPS = [
  { step: '01', title: 'CREATE CHALLENGE', desc: 'Set up a viewer challenge with a target goal', icon: '🎯' },
  { step: '02', title: 'COPY OBS URL', desc: 'One-click copy your unique overlay link', icon: '🔗' },
  { step: '03', title: 'GO LIVE', desc: 'Your overlay is live for all viewers to see', icon: '📡' },
];

export default function LandingCTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const [activeStep, setActiveStep] = useState(0);
  const [copied, setCopied] = useState(false);

  /* Step cycle */
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % ONBOARDING_STEPS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  /* Copy demo */
  const handleCopyDemo = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* GSAP animations */
  useEffect(() => {
    if (reducedMotion || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 65%',
          toggleActions: 'play none none reverse',
        },
      });

      tl.from('.lc-title', { opacity: 0, y: 30, duration: 0.8, ease: 'power3.out' });
      tl.from('.lc-subtitle', { opacity: 0, y: 15, duration: 0.6 }, '-=0.4');
      tl.from('.lc-buttons', { opacity: 0, y: 20, duration: 0.6 }, '-=0.3');
      tl.from('.lc-onboarding', { opacity: 0, y: 25, duration: 0.7 }, '-=0.3');
      tl.from('.lc-footer', { opacity: 0, duration: 0.5 }, '-=0.2');

      /* Ambient glow pulse */
      gsap.to('.lc-glow', {
        opacity: 0.12,
        scale: 1.1,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section
      ref={sectionRef}
      id="cta"
      className="relative py-24 lg:py-40 min-h-[80vh] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Ambient glow */}
      <div className="lc-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.06] pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--tactical-yellow) 0%, transparent 70%)' }} />

      {/* Subtle grid lines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(242, 201, 76, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(242, 201, 76, 0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto w-full">
                {/* Onboarding mini-card */}
        <div className="lc-onboarding w-full flex justify-center">
          <div className="glass-tactical rounded-sm p-5 w-full max-w-sm mx-auto text-left">
            <div className="text-[9px] font-mono text-dimmed/50 tracking-[0.2em] mb-3">QUICK DEPLOY</div>

            <div className="space-y-3">
              {ONBOARDING_STEPS.map((s, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 py-2 px-2 rounded-sm transition-all duration-500 ${
                    i === activeStep
                      ? 'bg-tactical/5 border border-tactical/20'
                      : 'border border-transparent opacity-40'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-sm flex items-center justify-center text-sm shrink-0 transition-colors duration-500 ${
                    i === activeStep ? 'bg-tactical/15' : 'bg-gunmetal/30'
                  }`}>
                    {s.icon}
                  </div>
                  <div>
                    <div className={`text-xs font-bold tracking-[0.1em] transition-colors duration-500 ${
                      i === activeStep ? 'text-tactical' : 'text-dimmed'
                    }`} style={{ fontFamily: 'var(--font-chakra)' }}>
                      {s.step} — {s.title}
                    </div>
                    <div className={`text-[10px] font-mono leading-relaxed mt-0.5 transition-colors duration-500 ${
                      i === activeStep ? 'text-dimmed' : 'text-dimmed/40'
                    }`}>
                      {s.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* OBS URL demo */}
            <div className="mt-4 pt-3 border-t border-gunmetal/30">
              <button
                onClick={handleCopyDemo}
                className="w-full flex items-center justify-between px-3 py-2 rounded-sm bg-void/60 border border-gunmetal/40 hover:border-tactical/30 transition-colors group cursor-pointer"
              >
                <span className="font-mono text-[10px] text-dimmed/60 truncate mr-2">
                  https://challengetracker.app/overlay/abc12...
                </span>
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-terminal shrink-0" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-dimmed/40 group-hover:text-tactical/60 shrink-0 transition-colors" />
                )}
              </button>
              {copied && (
                <div className="mt-1 text-center font-mono text-[9px] text-terminal/70 tracking-wider">
                  COPIED TO CLIPBOARD
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main headline */}
        <h2 className="lc-title mb-3 mt-6">
          <span className="block text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-[0.08em] text-hud leading-none" style={{ fontFamily: 'var(--font-chakra)' }}>
            CHALLENGE
          </span>
          <span className="block text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-[0.08em] text-tactical leading-none" style={{ fontFamily: 'var(--font-chakra)' }}>
            TRACKER
          </span>
        </h2>

        <p className="lc-subtitle font-mono text-dimmed text-xs tracking-[0.35em] uppercase mb-10">
          TACTICAL ENGAGEMENT SYSTEM
        </p>

        {/* CTA Buttons — styled like PUBG lobby "READY" */}
        <div className="lc-buttons flex flex-col sm:flex-row gap-4 justify-center mb-16 w-full max-w-md mx-auto sm:max-w-none">
          <Link
            href="/login"
            className="group relative bg-tactical text-void font-bold py-4 px-12 tracking-[0.15em] text-lg transition-all duration-300 hover:bg-white hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] w-full sm:w-auto text-center"
            style={{
              fontFamily: 'var(--font-chakra)',
              clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
            }}
          >
            {/* Corner accents */}
            <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-void/30" />
            <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-void/30" />
            SIGN IN
          </Link>

          <Link
            href="/signup"
            className="border border-gunmetal bg-armor/50 hover:border-tactical/50 transition-all duration-300 text-hud font-bold py-4 px-12 tracking-[0.15em] text-lg backdrop-blur-sm w-full sm:w-auto text-center"
            style={{
              fontFamily: 'var(--font-chakra)',
              clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
            }}
          >
            RECRUITMENT
          </Link>
        </div>


      </div>

    </section>
  );
}
