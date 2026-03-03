'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Clock, Target } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { ThemeRendererProps } from '../../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { darken, lighten, blend, toRgba, hexAlpha, injectDynamicKeyframes } from '../../colorUtils';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const STYLE_ID = 'highroller-royale-clone-v1-keyframes';

function buildKeyframesCSS(colors: Record<string, string>) {
  const gold = colors.iconSecondary;
  const ivoryHighlight = lighten(gold, 0.7);
  const darkBrown = darken(gold, 0.55);
  const medBrown = darken(gold, 0.3);
  const brightIvory = lighten(gold, 0.75);
  const deepBrown = darken(gold, 0.5);
  const goldBrown = darken(gold, 0.25);
  const warmGlow = lighten(gold, 0.6);
  const goldGlow = lighten(gold, 0.2);
  const fullGlow = lighten(gold, 0.7);
  const midGlow = lighten(gold, 0.18);

  return `
    @keyframes hrr-marble-drift {
      0% { background-position: 0% 0%, 0% 0%, 0% 0%; }
      100% { background-position: 180% 130%, 100% 100%, 120% 100%; }
    }

    @keyframes hrr-frame-glow {
      0%, 100% {
        box-shadow:
          inset 0 1px 1px ${toRgba(ivoryHighlight, 0.85)},
          inset 0 -2px 5px ${toRgba(darkBrown, 0.75)},
          0 0 0 2px ${toRgba(medBrown, 0.95)},
          0 22px 42px rgba(0, 0, 0, 0.58);
      }
      50% {
        box-shadow:
          inset 0 1px 2px ${toRgba(brightIvory, 0.95)},
          inset 0 -2px 5px ${toRgba(deepBrown, 0.85)},
          0 0 0 2px ${toRgba(goldBrown, 0.95)},
          0 26px 48px rgba(0, 0, 0, 0.62);
      }
    }

    @keyframes hrr-diamond-glint {
      0%, 100% { opacity: 0.28; }
      14% { opacity: 0.92; }
      28% { opacity: 0.38; }
    }

    @keyframes hrr-progress-flow {
      0% { background-position: 0% 0%; }
      100% { background-position: 180% 0%; }
    }

    @keyframes hrr-counter-glow {
      0%, 100% {
        text-shadow:
          0 0 12px ${toRgba(warmGlow, 0.85)},
          0 0 24px ${toRgba(goldGlow, 0.48)};
      }
      50% {
        text-shadow:
          0 0 16px ${toRgba(fullGlow, 1)},
          0 0 32px ${toRgba(midGlow, 0.7)},
          0 0 50px ${toRgba(gold, 0.35)};
      }
    }
  `;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pseudoRandom(seed: number) {
  const raw = Math.sin(seed * 12.9898) * 43758.5453;
  return raw - Math.floor(raw);
}

function GoldSparkField({ sparkColor }: { sparkColor: string }) {
  const count = 92;
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const respawnTickRef = useRef(0);

  const seed = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocity = new Float32Array(count);
    const sway = new Float32Array(count);
    const phase = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      const idx = i * 3;
      const p1 = pseudoRandom(i * 0.37 + 1.13);
      const p2 = pseudoRandom(i * 0.59 + 2.41);
      const p3 = pseudoRandom(i * 0.83 + 3.19);
      const p4 = pseudoRandom(i * 1.07 + 4.53);
      const p5 = pseudoRandom(i * 1.33 + 5.77);
      const p6 = pseudoRandom(i * 1.61 + 6.31);

      positions[idx] = (p1 - 0.5) * 2.25;
      positions[idx + 1] = (p2 - 0.5) * 1.25;
      positions[idx + 2] = (p3 - 0.5) * 0.25;
      velocity[i] = 0.0009 + p4 * 0.0015;
      sway[i] = 0.0004 + p5 * 0.0008;
      phase[i] = p6 * Math.PI * 2;
    }

    return { positions, velocity, sway, phase };
  }, []);

  const geometry = useMemo(() => {
    const bufferGeometry = new THREE.BufferGeometry();
    bufferGeometry.setAttribute('position', new THREE.BufferAttribute(seed.positions, 3));
    return bufferGeometry;
  }, [seed.positions]);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  useFrame(({ clock }) => {
    const points = pointsRef.current;
    if (!points) return;

    const time = clock.getElapsedTime();
    const positionAttr = points.geometry.getAttribute('position') as THREE.BufferAttribute;
    const positions = positionAttr.array as Float32Array;

    for (let i = 0; i < count; i += 1) {
      const idx = i * 3;
      positions[idx + 1] -= seed.velocity[i];
      positions[idx] += Math.sin(time * 1.1 + seed.phase[i]) * seed.sway[i];

      if (positions[idx + 1] < -0.63) {
        const tick = respawnTickRef.current + 1;
        respawnTickRef.current = tick;
        positions[idx + 1] = 0.63 + pseudoRandom(tick * 0.71 + i) * 0.08;
        positions[idx] = (pseudoRandom(tick * 1.37 + i * 0.53) - 0.5) * 2.25;
        positions[idx + 2] = (pseudoRandom(tick * 1.97 + i * 0.81) - 0.5) * 0.25;
      }
    }

    positionAttr.needsUpdate = true;

    if (materialRef.current) {
      materialRef.current.opacity = 0.6 + 0.22 * Math.sin(time * 1.7);
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        ref={materialRef}
        color={sparkColor}
        size={0.015}
        transparent
        opacity={0.75}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function CornerScrew({ position, colors }: { position: 'tl' | 'tr' | 'bl' | 'br'; colors: Record<string, string> }) {
  const placement = {
    tl: { top: 8, left: 8 },
    tr: { top: 8, right: 8 },
    bl: { bottom: 8, left: 8 },
    br: { bottom: 8, right: 8 },
  } as const;

  const goldHighlight = lighten(colors.iconSecondary, 0.7);
  const goldMed = lighten(colors.iconSecondary, 0.35);
  const goldBase = colors.iconSecondary;
  const goldDark = darken(colors.iconSecondary, 0.35);
  const screwSlot = darken(colors.iconSecondary, 0.6);

  return (
    <div
      className="absolute z-30 rounded-full"
      style={{
        ...placement[position],
        width: 15,
        height: 15,
        border: `1.4px solid ${toRgba(darken(colors.iconSecondary, 0.5), 0.92)}`,
        background:
          `radial-gradient(circle at 34% 34%, ${goldHighlight} 0%, ${goldMed} 28%, ${goldBase} 62%, ${goldDark} 100%)`,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.42)',
      }}
    >
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: 8,
          height: 1.4,
          borderRadius: 999,
          background: toRgba(screwSlot, 0.9),
          transform: 'translate(-50%, -50%) rotate(-26deg)',
        }}
      />
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: 8,
          height: 1.2,
          borderRadius: 999,
          background: toRgba(screwSlot, 0.48),
          transform: 'translate(-50%, -50%) rotate(64deg)',
        }}
      />
    </div>
  );
}

function CenterDiamond({ placement, colors }: { placement: 'top' | 'bottom'; colors: Record<string, string> }) {
  const goldLight = lighten(colors.iconSecondary, 0.6);
  const goldMed = lighten(colors.iconSecondary, 0.25);
  const goldBase = lighten(colors.iconSecondary, 0.05);
  const borderGold = darken(colors.iconSecondary, 0.05);
  const creamLight = lighten(colors.border, 0.6);
  const creamSoft = lighten(colors.border, 0.4);

  return (
    <div
      className="absolute left-1/2 z-30"
      style={{
        [placement]: -5,
        width: 86,
        height: 22,
        transform: 'translateX(-50%)',
        borderRadius: 7,
        border: `2px solid ${borderGold}`,
        background: `linear-gradient(180deg, ${goldLight} 0%, ${goldMed} 46%, ${goldBase} 100%)`,
        boxShadow: '0 2px 7px rgba(0, 0, 0, 0.38), inset 0 1px 1px rgba(255, 255, 255, 0.48)',
      }}
    >
      <div
        className="absolute inset-[3px]"
        style={{
          borderRadius: 4,
          background:
            `linear-gradient(125deg, rgba(255,255,255,0.85), ${toRgba(creamLight, 0.35)}, rgba(255,255,255,0.7)), repeating-linear-gradient(138deg, ${toRgba(lighten(colors.iconPrimary, 0.6), 0.65)} 0 7px, ${toRgba(creamSoft, 0.45)} 7px 14px)`,
        }}
      />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ borderRadius: 4 }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(104deg, transparent 26%, rgba(255,255,255,0.75) 48%, transparent 64%)',
            animation: 'hrr-diamond-glint 5.8s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  );
}

function TourbillonWheel({
  outerRef,
  innerRef,
  colors,
}: {
  outerRef: React.MutableRefObject<HTMLDivElement | null>;
  innerRef: React.MutableRefObject<HTMLDivElement | null>;
  colors: Record<string, string>;
}) {
  const goldBorder = lighten(colors.iconSecondary, 0.3);
  const darkPanel = lighten(colors.cardBackground, 0.12);
  const darkPanelMid = darken(colors.cardBackground, 0.15);
  const darkPanelDeep = darken(colors.cardBackground, 0.6);
  const goldGlow = lighten(colors.iconSecondary, 0.35);
  const spokeLight = lighten(colors.iconSecondary, 0.5);
  const spokeDark = darken(colors.iconSecondary, 0.1);
  const innerBorder = lighten(colors.iconSecondary, 0.35);
  const innerGlow = lighten(colors.iconSecondary, 0.2);
  const innerDark = darken(colors.cardBackground, 0.5);
  const innerSpokeLight = lighten(colors.iconSecondary, 0.4);
  const innerSpokeDark = darken(colors.iconSecondary, 0.15);
  const hubHighlight = lighten(colors.iconSecondary, 0.7);
  const hubMid = lighten(colors.iconSecondary, 0.35);
  const hubBase = lighten(colors.iconSecondary, 0.05);
  const hubGlow = lighten(colors.iconSecondary, 0.45);

  return (
    <div className="relative w-[52px] h-[52px]">
      <div
        ref={outerRef}
        className="absolute inset-0 rounded-full"
        style={{
          border: `2px solid ${goldBorder}`,
          background: `radial-gradient(circle at 34% 28%, ${darkPanel} 0%, ${darkPanelMid} 58%, ${darkPanelDeep} 100%)`,
          boxShadow: `inset 0 0 12px rgba(0, 0, 0, 0.82), 0 0 12px ${toRgba(goldGlow, 0.27)}`,
        }}
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={`outer-spoke-${i}`}
            className="absolute left-1/2 top-1/2 h-[18px] w-[1.4px] origin-bottom"
            style={{
              transform: `translate(-50%, -100%) rotate(${i * 36}deg)`,
              background: `linear-gradient(180deg, ${toRgba(spokeLight, 0.8)}, ${toRgba(spokeDark, 0.52)})`,
            }}
          />
        ))}
      </div>

      <div
        ref={innerRef}
        className="absolute inset-[11px] rounded-full"
        style={{
          border: `1.4px solid ${toRgba(innerBorder, 0.88)}`,
          background: `radial-gradient(circle at 35% 35%, ${toRgba(innerGlow, 0.25)}, ${toRgba(innerDark, 0.95)} 70%)`,
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`inner-spoke-${i}`}
            className="absolute left-1/2 top-1/2 h-[11px] w-[1.2px] origin-bottom"
            style={{
              transform: `translate(-50%, -100%) rotate(${i * 60}deg)`,
              background: `linear-gradient(180deg, ${toRgba(innerSpokeLight, 0.85)}, ${toRgba(innerSpokeDark, 0.45)})`,
            }}
          />
        ))}
      </div>

      <div
        className="absolute left-1/2 top-1/2 w-[8px] h-[8px] rounded-full"
        style={{
          transform: 'translate(-50%, -50%)',
          border: `1px solid ${toRgba(colors.iconSecondary, 0.75)}`,
          background: `radial-gradient(circle at 35% 35%, ${hubHighlight} 0%, ${hubMid} 45%, ${hubBase} 100%)`,
          boxShadow: `0 0 7px ${toRgba(hubGlow, 0.52)}`,
        }}
      />
    </div>
  );
}

export default function ThemeHighRollerRoyaleRevival({ challenge, config, fade }: ThemeRendererProps) {
  const colors = config.colors;

  useEffect(() => {
    injectDynamicKeyframes(STYLE_ID, buildKeyframesCSS(colors));
  }, [colors]);

  const shellRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const sweepRef = useRef<HTMLDivElement>(null);
  const outerWheelRef = useRef<HTMLDivElement>(null);
  const innerWheelRef = useRef<HTMLDivElement>(null);

  const mainSub = challenge.subChallenges[0];
  const progressPercent = clamp(challenge.progress || 0, 0, 100);
  const target = Math.max(1, mainSub?.target_limit ?? 1);
  const currentValue = clamp(
    mainSub?.current_progress ?? Math.round((progressPercent / 100) * target),
    0,
    target
  );

  const [displayValue, setDisplayValue] = useState(currentValue);
  const counterProxyRef = useRef({ value: currentValue });

  const headline = (mainSub?.title || 'Headlines').toUpperCase();
  const rewardText = challenge.challenge.reward_amount?.trim() || (challenge.subChallenges.length
    ? `${challenge.subChallenges.filter((item) => item.status === 'completed').length}/${challenge.subChallenges.length} OBJECTIVES`
    : '---');

  useEffect(() => {
    const context = gsap.context(() => {
      if (shellRef.current) {
        gsap.fromTo(
          shellRef.current,
          { y: 16, opacity: 0, scale: 0.985 },
          { y: 0, opacity: 1, scale: 1, duration: 0.82, ease: 'power3.out' }
        );
      }

      if (outerWheelRef.current) {
        gsap.to(outerWheelRef.current, {
          rotate: 360,
          duration: 8.4,
          ease: 'none',
          repeat: -1,
          transformOrigin: '50% 50%',
        });
      }

      if (innerWheelRef.current) {
        gsap.to(innerWheelRef.current, {
          rotate: -360,
          duration: 4.8,
          ease: 'none',
          repeat: -1,
          transformOrigin: '50% 50%',
        });
      }

      if (sweepRef.current) {
        gsap.set(sweepRef.current, { xPercent: -150 });
        gsap.to(sweepRef.current, {
          xPercent: 420,
          duration: 2.2,
          ease: 'none',
          repeat: -1,
        });
      }
    });

    return () => context.revert();
  }, []);

  useEffect(() => {
    if (!progressFillRef.current) return;

    gsap.to(progressFillRef.current, {
      width: `${Math.max(progressPercent, progressPercent > 0 ? 7 : 0)}%`,
      duration: 0.95,
      ease: 'power3.out',
    });
  }, [progressPercent]);

  useEffect(() => {
    gsap.to(counterProxyRef.current, {
      value: currentValue,
      duration: 0.9,
      ease: 'power2.out',
      onUpdate: () => {
        setDisplayValue(Math.round(counterProxyRef.current.value));
      },
    });
  }, [currentValue]);

  return (
    <div
      className={cn('relative transition-opacity duration-500', fade ? 'opacity-0' : 'opacity-100')}
      style={{
        width: config.layout.width,
        opacity: config.layout.opacity / 100,
        fontFamily: config.fonts.body,
      }}
    >
      <div className="absolute -inset-6 z-0 pointer-events-none">
        <Canvas
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: true }}
          camera={{ position: [0, 0, 1.55], fov: 42 }}
        >
          <GoldSparkField sparkColor={lighten(colors.iconSecondary, 0.45)} />
        </Canvas>
      </div>

      <div
        ref={shellRef}
        className="relative z-10 p-[6px]"
        style={{
          borderRadius: 20,
          clipPath: 'polygon(3.6% 0, 96.4% 0, 100% 10%, 100% 90%, 96.4% 100%, 3.6% 100%, 0 90%, 0 10%)',
          background:
            `linear-gradient(150deg, ${lighten(colors.iconSecondary, 0.5)} 0%, ${lighten(colors.iconSecondary, 0.15)} 28%, ${darken(colors.iconSecondary, 0.25)} 56%, ${lighten(colors.iconSecondary, 0.05)} 80%, ${lighten(colors.iconSecondary, 0.45)} 100%)`,
          animation: 'hrr-frame-glow 5s ease-in-out infinite',
        }}
      >
        <CornerScrew position="tl" colors={colors} />
        <CornerScrew position="tr" colors={colors} />
        <CornerScrew position="bl" colors={colors} />
        <CornerScrew position="br" colors={colors} />

        <CenterDiamond placement="top" colors={colors} />
        <CenterDiamond placement="bottom" colors={colors} />

        <div
          className="relative overflow-hidden px-4 pt-3 pb-3"
          style={{
            borderRadius: 14,
            border: `2px solid ${toRgba(darken(colors.iconSecondary, 0.35), 0.92)}`,
            background:
              `linear-gradient(165deg, ${toRgba(lighten(colors.iconPrimary, 0.7), 0.99)} 0%, ${toRgba(lighten(colors.iconPrimary, 0.55), 0.98)} 52%, ${toRgba(lighten(colors.border, 0.5), 0.98)} 100%)`,
            boxShadow:
              `inset 0 1px 2px rgba(255,255,255,0.8), inset 0 -12px 24px ${toRgba(lighten(colors.iconSecondary, 0.3), 0.22)}`,
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                `radial-gradient(ellipse at 20% 30%, rgba(255,255,255,0.7), transparent 42%), radial-gradient(ellipse at 80% 72%, rgba(255,255,255,0.35), transparent 48%), repeating-linear-gradient(139deg, rgba(255,255,255,0.34) 0 9px, ${toRgba(lighten(colors.border, 0.55), 0.18)} 9px 18px)`,
              backgroundSize: '150% 150%, 130% 130%, 80px 80px',
              animation: 'hrr-marble-drift 16s linear infinite',
            }}
          />

          <div
            className="absolute inset-[7px] rounded-[10px] pointer-events-none"
            style={{ border: `1px solid ${toRgba(colors.iconSecondary, 0.4)}` }}
          />

          <div className="relative z-10 flex items-start gap-3">
            <div className="min-w-0 flex-1 pr-2">
              <div
                className="px-4 py-2"
                style={{
                  borderRadius: '10px 10px 18px 10px',
                  border: `1.5px solid ${toRgba(lighten(colors.iconSecondary, 0.2), 0.7)}`,
                  background:
                    `linear-gradient(180deg, rgba(255, 255, 255, 0.72) 0%, ${toRgba(lighten(colors.border, 0.55), 0.88)} 100%)`,
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.94)',
                }}
              >
                <div
                  className="uppercase truncate font-black leading-none"
                  style={{
                    color: colors.challengeTitle,
                    fontFamily: 'Oswald, Arial Narrow, sans-serif',
                    letterSpacing: '0.045em',
                    fontSize: Math.max(21, config.fonts.titleSize + 7),
                  }}
                >
                  {challenge.challenge.title.toUpperCase()}
                </div>
                <div
                  className="uppercase truncate font-bold mt-1"
                  style={{
                    color: colors.subchallengeTitle,
                    fontFamily: 'Oswald, Arial Narrow, sans-serif',
                    letterSpacing: '0.06em',
                    fontSize: Math.max(18, config.fonts.bodySize + 6),
                  }}
                >
                  {headline}
                </div>
              </div>
            </div>

            {(config.display.showProgressCount ?? true) && (
              <div
                className="shrink-0 px-5 py-2.5"
                style={{
                  minWidth: 150,
                  borderRadius: 18,
                  border: `1.5px solid ${toRgba(lighten(colors.cardBackground, 0.2), 0.7)}`,
                  background: `linear-gradient(180deg, ${toRgba(lighten(colors.cardBackground, 0.18), 0.98)} 0%, ${toRgba(darken(colors.cardBackground, 0.3), 0.98)} 100%)`,
                  boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.11), 0 8px 16px rgba(0,0,0,0.34)',
                }}
              >
                <div
                  className="font-black tabular-nums flex items-center justify-center"
                  style={{
                    fontFamily: 'Times New Roman, serif',
                    lineHeight: 0.88,
                    letterSpacing: '0.02em',
                    color: colors.progressCount,
                    fontSize: Math.max(38, config.fonts.titleSize + 20),
                    animation: 'hrr-counter-glow 2.8s ease-in-out infinite',
                  }}
                >
                  <span>{displayValue}</span>
                  <span className="mx-1.5 opacity-80">/</span>
                  <span className="opacity-92">{target}</span>
                </div>
              </div>
            )}
          </div>

          {config.display.showProgressBar && (
            <div className="relative z-10 mt-2 px-0.5">
              <div
                className="relative rounded-full py-2 pr-3 pl-[74px]"
                style={{
                  border: `3px solid ${darken(colors.iconSecondary, 0.05)}`,
                  background: `linear-gradient(180deg, ${toRgba(lighten(colors.iconSecondary, 0.55), 0.9)} 0%, ${toRgba(lighten(colors.iconSecondary, 0.05), 0.95)} 100%)`,
                  boxShadow:
                    `inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -2px 6px ${toRgba(darken(colors.iconSecondary, 0.45), 0.54)}, 0 4px 10px rgba(0,0,0,0.35)`,
                }}
              >
                <div
                  className="absolute left-[6px] top-1/2 -translate-y-1/2 w-[68px] h-[68px] rounded-full flex items-center justify-center"
                  style={{
                    border: `3px solid ${darken(colors.iconSecondary, 0.05)}`,
                    background:
                      `radial-gradient(circle at 36% 28%, ${toRgba(lighten(colors.iconSecondary, 0.5), 0.58)} 0%, ${toRgba(darken(colors.cardBackground, 0.1), 0.96)} 34%, ${toRgba(darken(colors.cardBackground, 0.7), 1)} 100%)`,
                    boxShadow: `inset 0 2px 12px rgba(0,0,0,0.82), 0 0 16px ${toRgba(lighten(colors.iconSecondary, 0.3), 0.27)}`,
                  }}
                >
                  <TourbillonWheel outerRef={outerWheelRef} innerRef={innerWheelRef} colors={colors} />
                </div>

                <div
                  className="relative h-[32px] rounded-full overflow-hidden"
                  style={{
                    border: `2px solid ${toRgba(darken(colors.iconSecondary, 0.4), 0.96)}`,
                    background: `linear-gradient(180deg, ${lighten(colors.progressEmpty, 0.06)} 0%, ${darken(colors.progressEmpty, 0.08)} 100%)`,
                    boxShadow: 'inset 0 2px 7px rgba(0, 0, 0, 0.78)',
                  }}
                >
                  <div
                    ref={progressFillRef}
                    className="absolute left-[4px] top-[4px] bottom-[4px] rounded-full overflow-hidden"
                    style={{
                      width: `${Math.max(progressPercent, progressPercent > 0 ? 7 : 0)}%`,
                      backgroundImage: `linear-gradient(90deg, ${colors.iconSecondary} 0%, ${colors.iconPrimary} 45%, ${colors.progressFill} 70%, ${colors.iconSecondary} 100%)`,
                      backgroundRepeat: 'repeat',
                      backgroundPosition: '0% 0%',
                      backgroundSize: '190% 100%',
                      boxShadow: `0 0 14px ${hexAlpha(colors.progressFill, 0.4)}, inset 0 1px 0 rgba(255,255,255,0.7)`,
                      animation: 'hrr-progress-flow 4.4s linear infinite',
                    }}
                  >
                    <div
                      className="absolute inset-[1px] rounded-full"
                      style={{ border: '1px solid rgba(255,255,255,0.35)' }}
                    />
                    <div
                      ref={sweepRef}
                      className="absolute inset-y-0 w-[18%]"
                      style={{
                        left: '-36%',
                        background:
                          'linear-gradient(90deg, transparent, rgba(255,255,255,0.82), transparent)',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div
            className={cn(
              'relative z-10 mt-2 grid gap-2',
              config.display.showGivenBy && (config.display.showReward ?? true) ? 'grid-cols-2' : 'grid-cols-1'
            )}
          >
            {config.display.showGivenBy && (
              <div
                className="px-4 py-1.5 rounded-full"
                style={{
                  border: `2px solid ${toRgba(lighten(colors.iconSecondary, 0.15), 0.72)}`,
                  background:
                    `linear-gradient(180deg, ${toRgba(lighten(colors.iconPrimary, 0.7), 0.97)} 0%, ${toRgba(lighten(colors.border, 0.5), 0.95)} 100%)`,
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.78)',
                }}
              >
                <div
                  className="uppercase font-black"
                  style={{
                    color: colors.dateText,
                    fontFamily: 'Oswald, Arial Narrow, sans-serif',
                    letterSpacing: '0.055em',
                    fontSize: Math.max(17, config.fonts.bodySize + 6),
                  }}
                >
                  GIVEN BY
                </div>
                <div
                  className="mt-[2px] uppercase truncate font-semibold tracking-[0.08em]"
                  style={{ color: colors.viewerName, fontSize: Math.max(9, config.fonts.bodySize - 1) }}
                >
                  {challenge.challenge.given_by || 'UNKNOWN'}
                </div>
              </div>
            )}

            {(config.display.showReward ?? true) && (
              <div
                className="px-4 py-1.5 rounded-full"
                style={{
                  border: `2px solid ${toRgba(lighten(colors.iconSecondary, 0.15), 0.72)}`,
                  background:
                    `linear-gradient(180deg, ${toRgba(lighten(colors.iconPrimary, 0.7), 0.97)} 0%, ${toRgba(lighten(colors.border, 0.5), 0.95)} 100%)`,
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.78)',
                }}
              >
                <div
                  className="uppercase font-black"
                  style={{
                    color: colors.dateText,
                    fontFamily: 'Oswald, Arial Narrow, sans-serif',
                    letterSpacing: '0.055em',
                    fontSize: Math.max(17, config.fonts.bodySize + 6),
                  }}
                >
                  REWARD
                </div>
                <div
                  className="mt-[2px] uppercase font-semibold tracking-[0.08em] flex items-center gap-1.5"
                  style={{ color: colors.viewerName, fontSize: Math.max(9, config.fonts.bodySize - 1) }}
                >
                  <Target size={10} color={colors.iconSecondary} />
                  {rewardText}
                </div>
              </div>
            )}
          </div>

          {config.display.showDate && (
            <div className="absolute right-5 bottom-1.5 z-20 flex items-center gap-1.5">
              <Clock size={9} style={{ color: config.colors.dateText }} />
              <span
                className="uppercase font-semibold tracking-[0.12em]"
                style={{
                  color: config.colors.dateText,
                  fontSize: Math.max(7, config.fonts.bodySize - 4),
                }}
              >
                {challenge.timeLeft}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

