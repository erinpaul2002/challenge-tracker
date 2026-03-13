'use client';

import { useEffect, useRef, useMemo } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '@/app/hooks/useReducedMotion';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/* ── Seeded pseudo-random chat messages ── */
const CHAT_POOL = [
  { user: 'xNova_TTV', msg: 'lmaooo that was insane', color: '#b388ff' },
  { user: 'ghostpepper', msg: 'GG EZ', color: '#ff8a80' },
  { user: 'silentStorm', msg: 'can we get a 1v1?', color: '#82b1ff' },
  { user: 'chat_bot_9k', msg: 'nice spray transfer', color: '#ccff90' },
  { user: 'nightfox_', msg: 'LET\'S GOOO', color: '#ffd180' },
  { user: 'pixelPunk', msg: 'chat is moving so fast', color: '#ea80fc' },
  { user: 'dr_clutch', msg: 'pog pog pog', color: '#80d8ff' },
  { user: 'viper_gg', msg: 'that zone luck though', color: '#ff9e80' },
  { user: 'moonlit_', msg: 'can someone clip that?', color: '#b9f6ca' },
  { user: 'fr0st_b1te', msg: 'W streamer W chat', color: '#84ffff' },
  { user: 'turb0_', msg: 'gg no re', color: '#ffff8d' },
  { user: 'echo_ttv', msg: 'wait what happened', color: '#ff80ab' },
];

const CHALLENGE_MSG = {
  user: 'dragon99',
  msg: '🎯 CHALLENGE: Get 100 headshots with Kar98k — $50 donation!',
};

function buildChatMessages() {
  const msgs: Array<{ user: string; msg: string; color: string; isChallenge?: boolean }> = [];
  for (let i = 0; i < 40; i++) {
    if (i === 8) {
      msgs.push({ ...CHALLENGE_MSG, color: '#f2c94c', isChallenge: true });
    } else {
      msgs.push(CHAT_POOL[i % CHAT_POOL.length]);
    }
  }
  return msgs;
}

export default function LandingProblem() {
  const sectionRef = useRef<HTMLElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const messages = useMemo(() => buildChatMessages(), []);

  useEffect(() => {
    if (reducedMotion || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      /* Left text column stagger */
      const textTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
          once: true,
        },
      });

      textTl.from('.lp-eyebrow', { opacity: 0, y: 20, duration: 0.6 });
      textTl.from('.lp-headline > span', { opacity: 0, y: 30, stagger: 0.15, duration: 0.7, ease: 'power3.out' }, '-=0.3');
      textTl.from('.lp-body', { opacity: 0, y: 20, duration: 0.6 }, '-=0.3');

      /* Chat wall scroll acceleration */
      const chatTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          end: 'bottom 20%',
          scrub: 1,
        },
      });

      chatTl.to('.lp-chat-inner', {
        y: '-50%',
        ease: 'none',
        duration: 1,
      });

      /* Challenge message highlight then bury */
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top 60%',
        end: 'bottom 40%',
        onUpdate: (self) => {
          const p = self.progress;
          const challengeEl = document.querySelector('.lp-challenge-msg') as HTMLElement;
          if (challengeEl) {
            if (p < 0.3) {
              challengeEl.style.opacity = '1';
              challengeEl.style.boxShadow = `0 0 20px rgba(242, 201, 76, ${0.3 - p})`;
            } else {
              challengeEl.style.opacity = `${Math.max(0.15, 1 - (p - 0.3) * 2)}`;
              challengeEl.style.boxShadow = 'none';
            }
          }
        },
      });

      /* "BURIED" text reveal */
      gsap.from('.lp-buried', {
        scrollTrigger: {
          trigger: '.lp-buried',
          start: 'top 85%',
          toggleActions: 'play none none none',
          once: true,
        },
        opacity: 0,
        scale: 1.1,
        duration: 0.5,
        ease: 'power2.out',
      });

      /* Chat wall blur increase */
      gsap.to('.lp-chat-blur', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'center center',
          end: 'bottom 30%',
          scrub: true,
        },
        opacity: 0.7,
        duration: 1,
      });

    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section
      ref={sectionRef}
      id="problem"
      className="relative py-24 lg:py-32 min-h-screen overflow-hidden"
    >
      {/* Very subtle red tint on background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ background: 'radial-gradient(ellipse at 70% 50%, var(--hostile-red), transparent 70%)' }} />

      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Text column */}
          <div>
            <div className="lp-eyebrow flex items-center gap-3 mb-6">
              <div className="w-8 h-px bg-hostile" />
              <span className="font-mono text-[11px] text-hostile tracking-[0.3em] uppercase">THE ZONE</span>
            </div>

            <h2 className="lp-headline text-4xl md:text-5xl lg:text-6xl font-black leading-[0.95] mb-8" style={{ fontFamily: 'var(--font-chakra)' }}>
              <span className="block text-hud">CHALLENGES</span>
              <span className="block text-hud">GET</span>
              <span className="lp-buried block text-hostile" style={{ textShadow: '0 0 30px rgba(255, 42, 42, 0.3)' }}>
                BURIED.
              </span>
            </h2>

            <div className="lp-body space-y-4 max-w-md">
              <p className="font-mono text-dimmed text-sm leading-relaxed">
                In a sea of chat messages, viewer challenges disappear in seconds.
                Mods can&apos;t track them. Streamers can&apos;t see them. Viewers stop trying.
              </p>
              <p className="font-mono text-dimmed text-sm leading-relaxed">
                The zone is closing, and your engagement is stuck outside it.
              </p>
            </div>

            {/* Zone indicator */}
            <div className="mt-8 flex items-center gap-3">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-full border border-hostile/40" />
                <div className="absolute inset-2 rounded-full border border-hostile/60" style={{ animation: 'landing-pulse 2s ease-in-out infinite' }} />
                <div className="absolute inset-[14px] rounded-full bg-hostile/30" />
              </div>
              <span className="font-mono text-[10px] text-hostile/60 tracking-[0.2em] uppercase">
                ZONE CLOSING — ENGAGEMENT AT RISK
              </span>
            </div>
          </div>

          {/* Right: Chat simulation */}
          <div>
            <div className="relative h-[420px] lg:h-[500px] overflow-hidden rounded-sm">
              {/* Chat container */}
              <div className="glass-dark rounded-sm h-full overflow-hidden relative">
                {/* Chat header */}
                <div className="flex items-center gap-2 px-4 py-2 border-b border-gunmetal/50 bg-void/50">
                  <div className="w-2 h-2 rounded-full bg-hostile" style={{ animation: 'landing-pulse 1.5s ease-in-out infinite' }} />
                  <span className="font-mono text-[10px] text-dimmed tracking-[0.2em]">LIVE CHAT</span>
                  <span className="font-mono text-[10px] text-dimmed/40 ml-auto">14.2K viewers</span>
                </div>

                {/* Scrolling chat messages */}
                <div ref={chatRef} className="relative h-full overflow-hidden px-2 py-1">
                  <div className="lp-chat-inner">
                    {messages.map((m, i) => (
                      <div
                        key={i}
                        className={`chat-msg ${m.isChallenge ? 'chat-msg-highlight lp-challenge-msg my-1 py-1.5 px-2 rounded-sm' : ''}`}
                      >
                        <span style={{ color: m.color, fontWeight: 600, fontSize: '12px' }}>{m.user}</span>
                        <span className="text-dimmed/40 mx-1">:</span>
                        <span className={m.isChallenge ? 'text-tactical font-medium' : ''}>{m.msg}</span>
                      </div>
                    ))}
                    {/* Duplicate for seamless loop */}
                    {messages.map((m, i) => (
                      <div
                        key={`dup-${i}`}
                        className={`chat-msg ${m.isChallenge ? 'chat-msg-highlight my-1 py-1.5 px-2 rounded-sm' : ''}`}
                      >
                        <span style={{ color: m.color, fontWeight: 600, fontSize: '12px' }}>{m.user}</span>
                        <span className="text-dimmed/40 mx-1">:</span>
                        <span className={m.isChallenge ? 'text-tactical font-medium' : ''}>{m.msg}</span>
                      </div>
                    ))}
                  </div>

                  {/* Blur overlay that increases */}
                  <div className="lp-chat-blur absolute inset-0 pointer-events-none opacity-0"
                    style={{
                      background: 'linear-gradient(180deg, transparent 20%, rgba(8,8,8,0.6) 60%, rgba(8,8,8,0.9) 100%)',
                    }}
                  />
                </div>

                {/* Bottom "lost" indicator */}
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="font-mono text-[10px] text-hostile/50 tracking-[0.15em]">
                    ⚠ CHALLENGE REQUEST LOST IN CHAT
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
