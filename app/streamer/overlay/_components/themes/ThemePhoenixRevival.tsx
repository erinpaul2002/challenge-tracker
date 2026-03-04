import { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Engine } from '@tsparticles/engine';
import { ThemeRendererProps } from '../../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { darken, lighten, toRgba, hexAlpha, injectDynamicKeyframes } from '../../colorUtils';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/* ── Build dynamic keyframes CSS ───────────────────────── */
const STYLE_ID = 'phoenix-revival-keyframes';

function buildKeyframesCSS(colors: Record<string, string>): string {
    const fire = colors.iconSecondary;
    const fireBright = lighten(fire, 0.2);
    const gold = colors.iconPrimary;
    const goldBright = lighten(gold, 0.15);

    return `
    @keyframes pr-breathe {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.006); }
    }
    @keyframes pr-fire-pulse {
      0%, 100% { opacity: 0.85; filter: brightness(1); }
      25% { opacity: 1; filter: brightness(1.25); }
      60% { opacity: 0.9; filter: brightness(1.1); }
    }
    @keyframes pr-ember-glow {
      0%, 100% { box-shadow: 0 0 8px 3px ${hexAlpha(fire, 0.56)}, 0 0 16px 4px ${hexAlpha(gold, 0.31)}; }
      50% { box-shadow: 0 0 16px 6px ${hexAlpha(gold, 0.75)}, 0 0 32px 10px ${hexAlpha(fire, 0.38)}, 0 0 48px 14px ${hexAlpha(fireBright, 0.19)}; }
    }
    @keyframes pr-gold-glow {
      0%, 100% { text-shadow: 0 0 12px ${hexAlpha(gold, 0.69)}, 0 0 24px ${hexAlpha(fire, 0.38)}; }
      50% { text-shadow: 0 0 20px ${hexAlpha(goldBright, 0.88)}, 0 0 40px ${hexAlpha(gold, 0.63)}, 0 0 60px ${hexAlpha(fire, 0.25)}; }
    }
    @keyframes pr-flame-rim {
      0%, 100% { opacity: 0.8; transform: scaleX(1); }
      40% { opacity: 1; transform: scaleX(1.02); }
      70% { opacity: 0.85; transform: scaleX(0.99); }
    }
    @keyframes pr-sweep {
      0% { transform: translateX(-140%); opacity: 0; }
      20% { opacity: 1; }
      80% { opacity: 0.6; }
      100% { transform: translateX(300%); opacity: 0; }
    }
    @keyframes pr-wing-shimmer {
      0%, 100% { opacity: 0.85; filter: brightness(1); }
      50% { opacity: 1; filter: brightness(1.15) drop-shadow(0 0 4px ${hexAlpha(gold, 0.31)}); }
    }
    @keyframes pr-corner-glow {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
    @keyframes pr-bar-flicker {
      0%, 100% { opacity: 0.9; }
      30% { opacity: 1; }
      65% { opacity: 0.85; }
    }
    @keyframes pr-feather-shimmer {
      0%, 100% { filter: brightness(1) drop-shadow(0 0 3px ${hexAlpha(gold, 0.19)}); }
      50% { filter: brightness(1.2) drop-shadow(0 0 6px ${hexAlpha(gold, 0.44)}); }
    }
    @keyframes pr-side-glow {
      0%, 80%, 100% { opacity: 0.35; }
      88% { opacity: 0.9; }
      93% { opacity: 0.55; }
    }
    `;
}

/* ── Metallic Corner Bracket ────────────────────────────── */
interface PhoenixCornerColors {
    border: string;
    iconPrimary: string;
}

function PhoenixCorner({ position, colors }: { position: 'tl' | 'tr' | 'bl' | 'br'; colors: PhoenixCornerColors }) {
    const isTop = position.startsWith('t');
    const isLeft = position.endsWith('l');

    const metalLight = lighten(colors.border, 0.35);
    const metalMid = lighten(colors.border, 0.1);
    const metalDark = darken(colors.border, 0.15);
    const goldBright = lighten(colors.iconPrimary, 0.15);
    const goldStd = colors.iconPrimary;
    const goldDim = darken(colors.iconPrimary, 0.3);
    const goldAccent = darken(colors.iconPrimary, 0.1);
    const goldGlow = lighten(colors.iconPrimary, 0.2);

    return (
        <div
            className="absolute z-30"
            style={{
                [isTop ? 'top' : 'bottom']: -1,
                [isLeft ? 'left' : 'right']: -1,
                width: 28,
                height: 28,
            }}
        >
            <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full"
                style={{
                    animationName: 'pr-corner-glow',
                    animationDuration: '3s',
                    animationIterationCount: 'infinite',
                }}>
                <defs>
                    <linearGradient id={`pr-metal-${position}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={metalLight} />
                        <stop offset="40%" stopColor={metalMid} />
                        <stop offset="100%" stopColor={metalDark} />
                    </linearGradient>
                    <linearGradient id={`pr-gold-${position}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={goldBright} />
                        <stop offset="50%" stopColor={goldStd} />
                        <stop offset="100%" stopColor={goldDim} />
                    </linearGradient>
                </defs>
                {/* Outer bracket */}
                <path
                    d={
                        isTop && isLeft
                            ? 'M0 12 L0 0 L12 0 L12 3 L3 3 L3 12 Z'
                            : isTop && !isLeft
                                ? 'M28 12 L28 0 L16 0 L16 3 L25 3 L25 12 Z'
                                : !isTop && isLeft
                                    ? 'M0 16 L0 28 L12 28 L12 25 L3 25 L3 16 Z'
                                    : 'M28 16 L28 28 L16 28 L16 25 L25 25 L25 16 Z'
                    }
                    fill={`url(#pr-metal-${position})`}
                    stroke={hexAlpha(goldStd, 0.38)}
                    strokeWidth="0.5"
                />
                {/* Gold accent diagonal */}
                <path
                    d={
                        isTop && isLeft
                            ? 'M5 5 L9 5 L5 9 Z'
                            : isTop && !isLeft
                                ? 'M23 5 L19 5 L23 9 Z'
                                : !isTop && isLeft
                                    ? 'M5 23 L9 23 L5 19 Z'
                                    : 'M23 23 L19 23 L23 19 Z'
                    }
                    fill={goldAccent}
                    opacity="0.9"
                />
                {/* Glowing accent dot */}
                <circle
                    cx={isLeft ? 6 : 22}
                    cy={isTop ? 6 : 22}
                    r="2"
                    fill={goldGlow}
                    style={{ filter: `drop-shadow(0 0 3px ${hexAlpha(goldGlow, 0.50)})` }}
                />
            </svg>
        </div>
    );
}

/* ── Top Wing Decoration ────────────────────────────────── */
interface TopWingsColors {
    border: string;
    cardBackground: string;
    iconSecondary: string;
    iconPrimary: string;
}

function TopWings({ colors }: { colors: TopWingsColors }) {
    /* Feather palette — derived from border */
    const featherLight = lighten(colors.border, 0.3);
    const featherMid = lighten(colors.border, 0.15);
    const featherBright = lighten(colors.border, 0.4);
    const featherPale = lighten(colors.border, 0.5);
    const featherStroke = lighten(colors.border, 0.2);
    const featherLineShaft = lighten(colors.border, 0.32);
    const featherBarb = lighten(colors.border, 0.28);
    const featherBarbDim = lighten(colors.border, 0.12);
    const featherInnerStroke = lighten(colors.border, 0.25);
    const featherSecondary = lighten(colors.border, 0.35);
    const featherSecondaryDim = lighten(colors.border, 0.2);
    const featherSecondaryStroke = lighten(colors.border, 0.15);
    const featherTertiaryStroke = darken(colors.border, 0.05);

    /* Center block — derived from cardBackground */
    const centerLight = lighten(colors.cardBackground, 0.25);
    const centerMid = lighten(colors.cardBackground, 0.15);
    const centerDark = lighten(colors.cardBackground, 0.08);
    const centerDetail = darken(colors.cardBackground, 0.1);

    /* Fire — derived from iconSecondary */
    const fire = colors.iconSecondary;
    const fireMid = lighten(fire, 0.2);

    /* Gold — derived from iconPrimary */
    const gold = colors.iconPrimary;
    const goldAccent = hexAlpha(gold, 0.38);
    const goldAccentMid = hexAlpha(gold, 0.50);
    const goldAccentDim = hexAlpha(gold, 0.44);

    return (
        <div
            className="absolute left-0 right-0 pointer-events-none z-40"
            style={{ top: -36, height: 60 }}
        >
            <svg
                viewBox="0 0 560 80"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
                style={{
                    animationName: 'pr-wing-shimmer',
                    animationDuration: '4s',
                    animationIterationCount: 'infinite',
                }}
            >
                <defs>
                    <linearGradient id="pr-feather-l" x1="0%" y1="0%" x2="100%" y2="60%">
                        <stop offset="0%" stopColor={featherLight} stopOpacity="0.7" />
                        <stop offset="30%" stopColor={featherMid} stopOpacity="0.9" />
                        <stop offset="65%" stopColor={featherBright} stopOpacity="1" />
                        <stop offset="100%" stopColor={featherPale} stopOpacity="0.6" />
                    </linearGradient>
                    <linearGradient id="pr-feather-r" x1="100%" y1="0%" x2="0%" y2="60%">
                        <stop offset="0%" stopColor={featherLight} stopOpacity="0.7" />
                        <stop offset="30%" stopColor={featherMid} stopOpacity="0.9" />
                        <stop offset="65%" stopColor={featherBright} stopOpacity="1" />
                        <stop offset="100%" stopColor={featherPale} stopOpacity="0.6" />
                    </linearGradient>
                    <linearGradient id="pr-center-block" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={centerLight} />
                        <stop offset="50%" stopColor={centerMid} />
                        <stop offset="100%" stopColor={centerDark} />
                    </linearGradient>
                    <linearGradient id="pr-fire-top" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={fire} stopOpacity="0.9" />
                        <stop offset="50%" stopColor={fireMid} stopOpacity="0.6" />
                        <stop offset="100%" stopColor={gold} stopOpacity="0" />
                    </linearGradient>
                    <filter id="pr-feather-glow">
                        <feGaussianBlur stdDeviation="1.5" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <filter id="pr-fire-blur">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>

                {/* === LEFT WING === */}
                {/* Main feather 1 — outermost left */}
                <path d="M20 72 Q10 45 35 20 Q30 40 40 55 Q35 62 20 72Z" fill="url(#pr-feather-l)" stroke={featherStroke} strokeWidth="0.4" filter="url(#pr-feather-glow)" />
                <line x1="27" y1="64" x2="36" y2="28" stroke={featherLineShaft} strokeWidth="0.5" opacity="0.6" />
                <line x1="22" y1="68" x2="32" y2="32" stroke={featherBarbDim} strokeWidth="0.4" opacity="0.4" />
                {/* Feather barbs left 1 */}
                {[30, 36, 42, 48, 54].map((y, i) => (
                    <line key={i} x1={27 + i * 0.5} y1={y} x2={27 + i * 0.5 - 6} y2={y + 2} stroke={featherBarb} strokeWidth="0.35" opacity="0.45" />
                ))}

                {/* Main feather 2 */}
                <path d="M50 68 Q42 40 68 18 Q60 38 65 52 Q58 62 50 68Z" fill="url(#pr-feather-l)" stroke={featherStroke} strokeWidth="0.4" filter="url(#pr-feather-glow)" />
                <line x1="58" y1="60" x2="66" y2="24" stroke={featherLineShaft} strokeWidth="0.5" opacity="0.6" />
                {[28, 34, 40, 46, 52].map((y, i) => (
                    <line key={i} x1={58 + i * 0.4} y1={y} x2={58 + i * 0.4 - 7} y2={y + 3} stroke={featherBarb} strokeWidth="0.35" opacity="0.45" />
                ))}

                {/* Main feather 3 */}
                <path d="M82 64 Q76 36 102 16 Q94 36 97 50 Q91 60 82 64Z" fill="url(#pr-feather-l)" stroke={featherStroke} strokeWidth="0.4" filter="url(#pr-feather-glow)" />
                <line x1="90" y1="57" x2="98" y2="22" stroke={featherLineShaft} strokeWidth="0.5" opacity="0.6" />
                {[26, 32, 38, 44, 50].map((y, i) => (
                    <line key={i} x1={90 + i * 0.4} y1={y} x2={90 + i * 0.4 - 6} y2={y + 2} stroke={featherBarb} strokeWidth="0.35" opacity="0.45" />
                ))}

                {/* Main feather 4 — inner left */}
                <path d="M116 60 Q112 34 136 18 Q128 36 130 48 Q125 57 116 60Z" fill="url(#pr-feather-l)" stroke={featherInnerStroke} strokeWidth="0.4" filter="url(#pr-feather-glow)" />
                <line x1="123" y1="54" x2="130" y2="24" stroke={featherLineShaft} strokeWidth="0.5" opacity="0.6" />

                {/* Secondary smaller feathers — left mid */}
                <path d="M148 58 Q146 35 164 22 Q158 36 159 46 Q154 54 148 58Z" fill={featherSecondary} stroke={featherSecondaryStroke} strokeWidth="0.3" opacity="0.7" filter="url(#pr-feather-glow)" />
                <path d="M172 56 Q172 34 186 24 Q182 36 182 45 Q178 52 172 56Z" fill={featherSecondary} stroke={featherSecondaryStroke} strokeWidth="0.3" opacity="0.6" filter="url(#pr-feather-glow)" />
                <path d="M194 55 Q195 36 206 27 Q203 38 202 46 Q199 52 194 55Z" fill={featherSecondaryDim} stroke={featherTertiaryStroke} strokeWidth="0.3" opacity="0.5" filter="url(#pr-feather-glow)" />

                {/* Fire tips — left outer feathers */}
                <ellipse cx="30" cy="22" rx="5" ry="8" fill="url(#pr-fire-top)" filter="url(#pr-fire-blur)" opacity="0.8"
                    style={{ animationName: 'pr-fire-pulse', animationDuration: '1.8s', animationIterationCount: 'infinite' }} />
                <ellipse cx="58" cy="20" rx="5" ry="9" fill="url(#pr-fire-top)" filter="url(#pr-fire-blur)" opacity="0.9"
                    style={{ animationName: 'pr-fire-pulse', animationDuration: '2.1s', animationIterationCount: 'infinite', animationDelay: '0.3s' }} />
                <ellipse cx="90" cy="18" rx="5" ry="8" fill="url(#pr-fire-top)" filter="url(#pr-fire-blur)" opacity="0.75"
                    style={{ animationName: 'pr-fire-pulse', animationDuration: '1.6s', animationIterationCount: 'infinite', animationDelay: '0.6s' }} />
                <ellipse cx="120" cy="20" rx="4" ry="7" fill="url(#pr-fire-top)" filter="url(#pr-fire-blur)" opacity="0.6"
                    style={{ animationName: 'pr-fire-pulse', animationDuration: '2.4s', animationIterationCount: 'infinite', animationDelay: '0.9s' }} />

                {/* === CENTER BLOCK === */}
                <rect x="218" y="8" width="124" height="22" rx="4" fill="url(#pr-center-block)" stroke={goldAccent} strokeWidth="1" />
                {/* Center block inner detail */}
                <rect x="224" y="12" width="112" height="14" rx="3" fill={centerDetail} opacity="0.8" />
                {/* Center notch */}
                <path d="M265 8 L280 2 L295 8" fill="url(#pr-center-block)" stroke={goldAccentMid} strokeWidth="0.8" />
                {/* Center hex accents */}
                <polygon points="255,16 260,13 265,16 265,22 260,25 255,22" fill="none" stroke={goldAccentDim} strokeWidth="0.7" opacity="0.7" />
                <polygon points="295,16 300,13 305,16 305,22 300,25 295,22" fill="none" stroke={goldAccentDim} strokeWidth="0.7" opacity="0.7" />
                {/* Center gold line */}
                <line x1="270" y1="19" x2="290" y2="19" stroke={hexAlpha(lighten(gold, 0.2), 0.38)} strokeWidth="0.8" />

                {/* === RIGHT WING === (mirror of left) */}
                {/* Main feather 1 — outermost right */}
                <path d="M540 72 Q550 45 525 20 Q530 40 520 55 Q525 62 540 72Z" fill="url(#pr-feather-r)" stroke={featherStroke} strokeWidth="0.4" filter="url(#pr-feather-glow)" />
                <line x1="533" y1="64" x2="524" y2="28" stroke={featherLineShaft} strokeWidth="0.5" opacity="0.6" />
                {[30, 36, 42, 48, 54].map((y, i) => (
                    <line key={i} x1={533 - i * 0.5} y1={y} x2={533 - i * 0.5 + 6} y2={y + 2} stroke={featherBarb} strokeWidth="0.35" opacity="0.45" />
                ))}

                {/* Main feather 2 */}
                <path d="M510 68 Q518 40 492 18 Q500 38 495 52 Q502 62 510 68Z" fill="url(#pr-feather-r)" stroke={featherStroke} strokeWidth="0.4" filter="url(#pr-feather-glow)" />
                <line x1="502" y1="60" x2="494" y2="24" stroke={featherLineShaft} strokeWidth="0.5" opacity="0.6" />
                {[28, 34, 40, 46, 52].map((y, i) => (
                    <line key={i} x1={502 - i * 0.4} y1={y} x2={502 - i * 0.4 + 7} y2={y + 3} stroke={featherBarb} strokeWidth="0.35" opacity="0.45" />
                ))}

                {/* Main feather 3 */}
                <path d="M478 64 Q484 36 458 16 Q466 36 463 50 Q469 60 478 64Z" fill="url(#pr-feather-r)" stroke={featherStroke} strokeWidth="0.4" filter="url(#pr-feather-glow)" />
                <line x1="470" y1="57" x2="462" y2="22" stroke={featherLineShaft} strokeWidth="0.5" opacity="0.6" />
                {[26, 32, 38, 44, 50].map((y, i) => (
                    <line key={i} x1={470 - i * 0.4} y1={y} x2={470 - i * 0.4 + 6} y2={y + 2} stroke={featherBarb} strokeWidth="0.35" opacity="0.45" />
                ))}

                {/* Main feather 4 — inner right */}
                <path d="M444 60 Q448 34 424 18 Q432 36 430 48 Q435 57 444 60Z" fill="url(#pr-feather-r)" stroke={featherInnerStroke} strokeWidth="0.4" filter="url(#pr-feather-glow)" />
                <line x1="437" y1="54" x2="430" y2="24" stroke={featherLineShaft} strokeWidth="0.5" opacity="0.6" />

                {/* Secondary smaller feathers — right mid */}
                <path d="M412 58 Q414 35 396 22 Q402 36 401 46 Q406 54 412 58Z" fill={featherSecondary} stroke={featherSecondaryStroke} strokeWidth="0.3" opacity="0.7" filter="url(#pr-feather-glow)" />
                <path d="M388 56 Q388 34 374 24 Q378 36 378 45 Q382 52 388 56Z" fill={featherSecondary} stroke={featherSecondaryStroke} strokeWidth="0.3" opacity="0.6" filter="url(#pr-feather-glow)" />
                <path d="M366 55 Q365 36 354 27 Q357 38 358 46 Q361 52 366 55Z" fill={featherSecondaryDim} stroke={featherTertiaryStroke} strokeWidth="0.3" opacity="0.5" filter="url(#pr-feather-glow)" />

                {/* Fire tips — right outer feathers */}
                <ellipse cx="530" cy="22" rx="5" ry="8" fill="url(#pr-fire-top)" filter="url(#pr-fire-blur)" opacity="0.8"
                    style={{ animationName: 'pr-fire-pulse', animationDuration: '1.8s', animationIterationCount: 'infinite' }} />
                <ellipse cx="502" cy="20" rx="5" ry="9" fill="url(#pr-fire-top)" filter="url(#pr-fire-blur)" opacity="0.9"
                    style={{ animationName: 'pr-fire-pulse', animationDuration: '2.1s', animationIterationCount: 'infinite', animationDelay: '0.4s' }} />
                <ellipse cx="470" cy="18" rx="5" ry="8" fill="url(#pr-fire-top)" filter="url(#pr-fire-blur)" opacity="0.75"
                    style={{ animationName: 'pr-fire-pulse', animationDuration: '1.6s', animationIterationCount: 'infinite', animationDelay: '0.7s' }} />
                <ellipse cx="440" cy="20" rx="4" ry="7" fill="url(#pr-fire-top)" filter="url(#pr-fire-blur)" opacity="0.6"
                    style={{ animationName: 'pr-fire-pulse', animationDuration: '2.4s', animationIterationCount: 'infinite', animationDelay: '1s' }} />

                {/* Bottom fade — blends into card */}
                <rect x="0" y="60" width="560" height="20" fill="url(#pr-bottom-fade)" />
                <defs>
                    <linearGradient id="pr-bottom-fade" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="transparent" stopOpacity="0" />
                        <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
}

/* ── Side Wing Accents ───────────────────────────────────── */
interface SideFeathersColors {
    border: string;
}

function SideFeathers({ side, colors }: { side: 'left' | 'right'; colors: SideFeathersColors }) {
    const isLeft = side === 'left';

    const gradLight = lighten(colors.border, 0.3);
    const gradMid = lighten(colors.border, 0.15);
    const gradBright = lighten(colors.border, 0.33);
    const sideStroke = hexAlpha(lighten(colors.border, 0.2), 0.38);
    const sideLine = hexAlpha(lighten(colors.border, 0.32), 0.31);

    return (
        <div
            className="absolute top-[15%] pointer-events-none z-40"
            style={{
                [isLeft ? 'left' : 'right']: -22,
                width: 30,
                height: '65%',
                animationName: 'pr-wing-shimmer',
                animationDuration: '5s',
                animationIterationCount: 'infinite',
                animationDelay: isLeft ? '0s' : '0.8s',
            }}
        >
            <svg
                viewBox="0 0 30 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
                style={{ transform: isLeft ? 'none' : 'scaleX(-1)' }}
            >
                <defs>
                    <linearGradient id={`pr-side-g-${side}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={gradLight} stopOpacity="0.4" />
                        <stop offset="50%" stopColor={gradMid} stopOpacity="0.8" />
                        <stop offset="100%" stopColor={gradBright} stopOpacity="0.5" />
                    </linearGradient>
                </defs>
                {/* 3 side feathers */}
                <path d="M28 15 Q0 30 10 60 Q20 40 28 25Z" fill={`url(#pr-side-g-${side})`} stroke={sideStroke} strokeWidth="0.4" />
                <line x1="15" y1="50" x2="27" y2="20" stroke={sideLine} strokeWidth="0.4" />
                <path d="M28 45 Q2 58 12 85 Q22 65 28 55Z" fill={`url(#pr-side-g-${side})`} stroke={sideStroke} strokeWidth="0.4" />
                <line x1="16" y1="78" x2="27" y2="50" stroke={sideLine} strokeWidth="0.4" />
                <path d="M28 75 Q4 86 14 108 Q22 90 28 82Z" fill={`url(#pr-side-g-${side})`} stroke={sideStroke} strokeWidth="0.4" opacity="0.7" />
            </svg>
        </div>
    );
}

/* ── Inline Feather SVG for progress bar ────────────────── */
interface BarFeatherColors {
    border: string;
    iconPrimary: string;
}

function BarFeather({ colors }: { colors: BarFeatherColors }) {
    const gradBase = lighten(colors.border, 0.4);
    const gradMid = lighten(colors.border, 0.28);
    const gradBright = lighten(colors.border, 0.5);
    const gradPale = lighten(colors.iconPrimary, 0.3);
    const quillStroke = lighten(colors.border, 0.35);
    const barbStroke = hexAlpha(lighten(colors.border, 0.32), 0.56);
    const tipGlow = lighten(colors.iconPrimary, 0.15);

    return (
        <svg viewBox="0 0 80 26" fill="none" xmlns="http://www.w3.org/2000/svg"
            className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none z-10"
            style={{
                width: 72, height: 22,
                animationName: 'pr-feather-shimmer',
                animationDuration: '3s',
                animationIterationCount: 'infinite',
            }}
        >
            <defs>
                <linearGradient id="pr-bar-feather" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={gradBase} />
                    <stop offset="40%" stopColor={gradMid} />
                    <stop offset="80%" stopColor={gradBright} />
                    <stop offset="100%" stopColor={gradPale} />
                </linearGradient>
                <filter id="pr-feather-soft">
                    <feGaussianBlur stdDeviation="0.5" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
            </defs>
            {/* Central quill */}
            <line x1="4" y1="13" x2="76" y2="13" stroke={quillStroke} strokeWidth="1.2" opacity="0.8" />
            {/* Barbs — upper */}
            {[10, 16, 22, 28, 34, 40, 46, 52, 58, 64, 70].map((x, i) => (
                <line key={`u${i}`} x1={x} y1="13" x2={x - 7} y2={13 - 5 + i * 0.3} stroke={barbStroke} strokeWidth="0.6" />
            ))}
            {/* Barbs — lower */}
            {[10, 16, 22, 28, 34, 40, 46, 52, 58, 64, 70].map((x, i) => (
                <line key={`d${i}`} x1={x} y1="13" x2={x - 7} y2={13 + 5 - i * 0.3} stroke={barbStroke} strokeWidth="0.6" />
            ))}
            {/* Feather outline shape */}
            <path d="M6 13 Q20 4 50 6 Q70 7 76 13 Q70 19 50 20 Q20 22 6 13Z"
                stroke="url(#pr-bar-feather)" strokeWidth="0.8" fill="none" opacity="0.6" filter="url(#pr-feather-soft)" />
            {/* Tip glow */}
            <circle cx="75" cy="13" r="2.5" fill={tipGlow} opacity="0.7" style={{ filter: `drop-shadow(0 0 4px ${hexAlpha(tipGlow, 0.50)})` }} />
        </svg>
    );
}

/* ── Main PhoenixRevival Theme Component ────────────────── */
export default function ThemePhoenixRevival({ challenge, config, fade }: ThemeRendererProps) {
    const [particlesInit, setParticlesInit] = useState(false);
    const colors = config.colors;

    /* Derived color palette */
    const fire = colors.iconSecondary;
    const gold = colors.iconPrimary;
    const goldBright = lighten(gold, 0.15);
    const border = colors.border;
    const bg = colors.cardBackground;
    const fill = colors.progressFill;

    useEffect(() => {
        injectDynamicKeyframes(STYLE_ID, buildKeyframesCSS(colors));
    }, [colors]);

    useEffect(() => {
        initParticlesEngine(async (engine: Engine) => {
            await loadSlim(engine);
        }).then(() => {
            setParticlesInit(true);
        });
    }, []);

    /* Rising ash / ember particles */
    const particlesConfig = useMemo(() => ({
        particles: {
            number: { value: 16, density: { enable: true, value_area: 900 } },
            color: { value: [gold, fire, darken(fire, 0.1), goldBright, darken(fire, 0.2)] },
            shape: { type: 'circle' },
            opacity: {
                value: 0.65,
                random: true,
                anim: { enable: true, speed: 2, opacity_min: 0, sync: false },
            },
            size: {
                value: 2,
                random: true,
                anim: { enable: true, speed: 1, size_min: 0.4, sync: false },
            },
            move: {
                enable: true,
                speed: 1,
                direction: 'top' as const,
                random: true,
                straight: false,
                out_mode: 'out' as const,
                bounce: false,
                attract: { enable: false, rotateX: 600, rotateY: 1200 },
                gravity: { enable: false },
            },
        },
        interactivity: {
            events: {
                onhover: { enable: false },
                onclick: { enable: false },
                resize: { enable: true },
            },
        },
        retina_detect: true,
        background: { color: 'transparent' },
    }), [gold, fire, goldBright]);

    const progressPercent = challenge.progress;
    const subChallenge = challenge.subChallenges[0];
    const currentVal = subChallenge
        ? subChallenge.current_progress
        : Math.round((progressPercent / 100) * 10);
    const targetVal = subChallenge?.target_limit ?? 10;

    /* Gold shimmer pattern as data URI for progress fill */
    const goldShimmerSVG = encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="20">
            <defs>
                <linearGradient id="gs" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="${gold}" stop-opacity="0.15"/>
                    <stop offset="50%" stop-color="${fire}" stop-opacity="0.1"/>
                    <stop offset="100%" stop-color="${goldBright}" stop-opacity="0.15"/>
                </linearGradient>
            </defs>
            <rect width="40" height="20" fill="url(#gs)"/>
            <line x1="0" y1="10" x2="40" y2="10" stroke="${gold}" stroke-width="0.3" opacity="0.2"/>
        </svg>
    `);

    /* Scale texture SVG for inner card */
    const scaleTextureSVG = encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><ellipse cx='20' cy='20' rx='18' ry='14' fill='none' stroke='${gold}' stroke-width='0.15' opacity='0.04'/><ellipse cx='0' cy='0' rx='18' ry='14' fill='none' stroke='${gold}' stroke-width='0.15' opacity='0.03'/><ellipse cx='40' cy='40' rx='18' ry='14' fill='none' stroke='${gold}' stroke-width='0.15' opacity='0.03'/></svg>`
    );

    /* ── Pre-computed style values ── */
    const frameOuter = `linear-gradient(160deg, ${lighten(bg, 0.12)} 0%, ${lighten(bg, 0.06)} 40%, ${darken(bg, 0.05)} 100%)`;
    const frameBoxShadow = `
        0 0 0 1px ${lighten(bg, 0.2)},
        0 0 0 2px ${lighten(bg, 0.05)},
        inset 0 0 8px ${toRgba(gold, 0.06)},
        0 0 20px ${toRgba(fire, 0.15)},
        0 0 50px ${toRgba(darken(fire, 0.2), 0.07)},
        0 16px 50px rgba(0,0,0,0.85)
    `;
    const innerCardBg = `
        radial-gradient(ellipse at 25% 35%, ${hexAlpha(lighten(bg, 0.12), 0.06)} 0%, transparent 55%),
        radial-gradient(ellipse at 75% 65%, ${hexAlpha(lighten(bg, 0.08), 0.06)} 0%, transparent 50%),
        linear-gradient(165deg, ${lighten(bg, 0.05)} 0%, ${darken(bg, 0.02)} 40%, ${darken(bg, 0.15)} 100%)
    `;
    const topGoldStrip = `linear-gradient(90deg, transparent, ${hexAlpha(gold, 0.63)}, ${hexAlpha(goldBright, 0.69)}, ${hexAlpha(gold, 0.63)}, transparent)`;
    const bottomGoldStrip = `linear-gradient(90deg, transparent, ${hexAlpha(darken(fire, 0.15), 0.50)}, ${hexAlpha(fire, 0.56)}, ${hexAlpha(darken(fire, 0.15), 0.50)}, transparent)`;
    const leftEdgeGlow = `linear-gradient(180deg, transparent, ${hexAlpha(gold, 0.50)}, ${hexAlpha(gold, 0.50)}, transparent)`;
    const rightEdgeGlow = `linear-gradient(180deg, transparent, ${hexAlpha(darken(fire, 0.15), 0.50)}, ${hexAlpha(darken(fire, 0.15), 0.50)}, transparent)`;
    const counterBg = `linear-gradient(160deg, ${lighten(bg, 0.04)} 0%, ${darken(bg, 0.08)} 100%)`;
    const panelBg = `linear-gradient(160deg, ${lighten(bg, 0.03)} 0%, ${darken(bg, 0.05)} 100%)`;
    const fireRingGlow = `
        0 0 0 2px ${hexAlpha(fire, 0.38)},
        0 0 8px 2px ${hexAlpha(darken(fire, 0.1), 0.63)},
        0 0 18px 4px ${hexAlpha(darken(fire, 0.2), 0.31)},
        0 0 32px 6px ${hexAlpha(darken(fire, 0.35), 0.13)}
    `;
    const flameEdgeTop = `linear-gradient(180deg, transparent, ${hexAlpha(fire, 0.44)}, ${hexAlpha(darken(fire, 0.1), 0.69)})`;
    const flameEdgeBottom = `linear-gradient(0deg, transparent, ${hexAlpha(fire, 0.44)}, ${hexAlpha(darken(fire, 0.1), 0.69)})`;
    const barTrackBg = `linear-gradient(180deg, ${lighten(colors.progressEmpty, 0.06)} 0%, ${darken(colors.progressEmpty, 0.08)} 55%, ${lighten(colors.progressEmpty, 0.06)} 100%)`;
    const barTrackShadow = `
        inset 0 3px 12px rgba(0,0,0,0.85),
        inset 0 -1px 4px ${toRgba(gold, 0.05)}
    `;
    const progressFillBg = `
        url("data:image/svg+xml,${goldShimmerSVG}"),
        linear-gradient(180deg,
            ${hexAlpha(goldBright, 0.91)} 0%,
            ${fill} 25%,
            ${darken(fill, 0.2)} 55%,
            ${lighten(fill, 0.1)} 80%,
            ${hexAlpha(gold, 0.88)} 100%
        )
    `;
    const progressFillShadow = `
        0 0 12px ${hexAlpha(colors.progressFill, 0.69)},
        0 0 24px ${hexAlpha(colors.progressFill, 0.38)},
        0 0 44px ${hexAlpha(colors.progressFill, 0.15)},
        inset 0 1px 0 ${toRgba(lighten(gold, 0.3), 0.4)},
        inset 0 -1px 0 ${toRgba(darken(fire, 0.3), 0.3)}
    `;
    const tipGradient = `linear-gradient(180deg, ${lighten(gold, 0.3)}, ${lighten(fire, 0.25)}, ${darken(fire, 0.05)})`;
    const tipShadow = `0 0 10px ${hexAlpha(lighten(fire, 0.25), 0.81)}, 0 0 20px ${hexAlpha(fire, 0.44)}`;
    const ambientGlowTop = `radial-gradient(ellipse at center, ${hexAlpha(gold, 0.06)} 0%, transparent 70%)`;
    const ambientGlowBottom = `radial-gradient(ellipse at center, ${hexAlpha(fire, 0.08)} 0%, transparent 70%)`;
    const shimmerSweep = `linear-gradient(90deg, transparent, ${toRgba(lighten(gold, 0.35), 0.4)}, transparent)`;

    return (
        <div
            className={cn(
                'relative transition-opacity duration-500',
                fade ? 'opacity-0' : 'opacity-100'
            )}
            style={{
                width: config.layout.width,
                fontFamily: config.fonts.body,
                opacity: config.layout.opacity / 100,
                /* Extra top space for the wing decoration */
                paddingTop: 38,
            }}
        >
            {/* Rising ember particles */}
            <div className="absolute inset-0 pointer-events-none z-50 overflow-visible">
                {particlesInit && (
                    <Particles
                        id="phoenix-revival-embers"
                        options={particlesConfig}
                        className="w-full h-full"
                    />
                )}
            </div>

            {/* ══ OUTER FRAME — Heavy gunmetal/bronze chassis ══ */}
            <div
                className="relative"
                style={{
                    background: frameOuter,
                    borderRadius: Math.max(config.layout.borderRadius, 6),
                    padding: '3px',
                    boxShadow: frameBoxShadow,
                    animationName: 'pr-breathe',
                    animationDuration: '5.5s',
                    animationIterationCount: 'infinite',
                    animationTimingFunction: 'ease-in-out',
                }}
            >
                {/* Top Wing Decoration */}
                <TopWings colors={{ border, cardBackground: bg, iconSecondary: fire, iconPrimary: gold }} />

                {/* Side Feather Accents */}
                <SideFeathers side="left" colors={{ border }} />
                <SideFeathers side="right" colors={{ border }} />

                {/* Frame edge accent — top gold strip */}
                <div
                    className="absolute top-0 left-[8%] right-[8%] h-[2px] z-20 rounded-full"
                    style={{
                        background: topGoldStrip,
                        animationName: 'pr-flame-rim',
                        animationDuration: '3.5s',
                        animationIterationCount: 'infinite',
                    }}
                />
                {/* Frame edge accent — bottom strip */}
                <div
                    className="absolute bottom-0 left-[12%] right-[12%] h-[1.5px] z-20 rounded-full"
                    style={{
                        background: bottomGoldStrip,
                        animationName: 'pr-flame-rim',
                        animationDuration: '4.5s',
                        animationIterationCount: 'infinite',
                        animationDelay: '1.8s',
                    }}
                />
                {/* Left edge glow */}
                <div
                    className="absolute left-0 top-[10%] h-[80%] w-[2px] z-20"
                    style={{
                        background: leftEdgeGlow,
                        animationName: 'pr-side-glow',
                        animationDuration: '4s',
                        animationIterationCount: 'infinite',
                    }}
                />
                {/* Right edge glow */}
                <div
                    className="absolute right-0 top-[10%] h-[80%] w-[2px] z-20"
                    style={{
                        background: rightEdgeGlow,
                        animationName: 'pr-side-glow',
                        animationDuration: '4.5s',
                        animationIterationCount: 'infinite',
                        animationDelay: '2s',
                    }}
                />

                {/* ══ INNER CARD — Dark gunmetal body ══ */}
                <div
                    className="relative overflow-hidden"
                    style={{
                        background: innerCardBg,
                        borderRadius: Math.max(config.layout.borderRadius - 1, 4),
                        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.7)',
                    }}
                >
                    {/* Subtle scale texture overlay */}
                    <div
                        className="absolute inset-0 z-[1] pointer-events-none"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,${scaleTextureSVG}")`,
                            backgroundSize: '40px 40px',
                        }}
                    />

                    {/* Ambient gold glow — center top radial */}
                    <div
                        className="absolute top-0 left-[25%] right-[25%] h-[35%] z-[2] pointer-events-none"
                        style={{
                            background: ambientGlowTop,
                            animationName: 'pr-fire-pulse',
                            animationDuration: '5s',
                            animationIterationCount: 'infinite',
                        }}
                    />
                    {/* Ambient gold glow — bottom radial */}
                    <div
                        className="absolute bottom-0 left-[20%] right-[20%] h-[28%] z-[2] pointer-events-none"
                        style={{
                            background: ambientGlowBottom,
                            animationName: 'pr-fire-pulse',
                            animationDuration: '4s',
                            animationIterationCount: 'infinite',
                            animationDelay: '2s',
                        }}
                    />

                    {/* Inner corner brackets */}
                    <PhoenixCorner position="tl" colors={{ border, iconPrimary: gold }} />
                    <PhoenixCorner position="tr" colors={{ border, iconPrimary: gold }} />
                    <PhoenixCorner position="bl" colors={{ border, iconPrimary: gold }} />
                    <PhoenixCorner position="br" colors={{ border, iconPrimary: gold }} />

                    {/* ══ TITLE ROW ══ */}
                    <div
                        className="relative z-10 flex justify-between items-start"
                        style={{ padding: '14px 20px 6px 20px' }}
                    >
                        {/* Left — Challenge Title */}
                        <div className="flex flex-col gap-1 flex-1 min-w-0 pr-4">
                            <span
                                className="uppercase font-extrabold leading-tight tracking-wider truncate"
                                style={{
                                    color: colors.challengeTitle,
                                    fontFamily: config.fonts.title,
                                    fontSize: config.fonts.titleSize,
                                    textShadow: `0 1px 8px rgba(0,0,0,0.95), 0 0 16px ${hexAlpha(gold, 0.19)}`,
                                    letterSpacing: '0.07em',
                                }}
                            >
                                {challenge.challenge.title}
                            </span>

                            {/* Gold underline */}
                            <div
                                className="w-full h-[1.5px]"
                                style={{
                                    background: `linear-gradient(90deg, ${hexAlpha(gold, 0.50)}, ${hexAlpha(fire, 0.25)}, transparent)`,
                                    animationName: 'pr-flame-rim',
                                    animationDuration: '4s',
                                    animationIterationCount: 'infinite',
                                }}
                            />

                            {/* Sub-challenge label */}
                            {config.display.showSubChallenges && challenge.subChallenges.length > 0 && (
                                <span
                                    className="uppercase font-bold tracking-wider truncate"
                                    style={{
                                        color: colors.subchallengeTitle,
                                        fontSize: Math.max(9, config.fonts.bodySize - 2),
                                        textShadow: `0 0 8px ${hexAlpha(gold, 0.15)}`,
                                    }}
                                >
                                    {challenge.subChallenges[0]?.title || 'OBJECTIVE'}
                                </span>
                            )}
                        </div>

                        {/* Right — X/Y Golden Counter */}
                        {(config.display.showProgressCount ?? true) && (
                            <div
                                className="flex items-center flex-shrink-0 px-4 py-2"
                                style={{
                                    background: counterBg,
                                    border: `1.5px solid ${hexAlpha(gold, 0.44)}`,
                                    borderRadius: 6,
                                    boxShadow: `
                                    inset 0 0 12px ${toRgba(gold, 0.08)},
                                    0 0 12px ${hexAlpha(gold, 0.21)},
                                    0 0 24px ${hexAlpha(gold, 0.07)}
                                `,
                                    animationName: 'pr-ember-glow',
                                    animationDuration: '3s',
                                    animationIterationCount: 'infinite',
                                }}
                            >
                                <span
                                    className="font-extrabold tabular-nums"
                                    style={{
                                        fontFamily: config.fonts.title,
                                        color: colors.progressCount,
                                        fontSize: Math.max(26, config.fonts.titleSize + 12),
                                        lineHeight: 1,
                                        animationName: 'pr-gold-glow',
                                        animationDuration: '2.5s',
                                        animationIterationCount: 'infinite',
                                    }}
                                >
                                    {currentVal}
                                </span>
                                <span
                                    className="mx-1 font-bold"
                                    style={{
                                        color: hexAlpha(colors.progressCount, 0.72),
                                        fontSize: Math.max(20, config.fonts.titleSize + 6),
                                        lineHeight: 1,
                                    }}
                                >
                                    /
                                </span>
                                <span
                                    className="font-bold tabular-nums"
                                    style={{
                                        color: hexAlpha(colors.progressCount, 0.92),
                                        fontSize: Math.max(22, config.fonts.titleSize + 8),
                                        lineHeight: 1,
                                    }}
                                >
                                    {targetVal}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* ══ PROGRESS BAR — Fire-ringed feather vein ══ */}
                    {config.display.showProgressBar && (
                        <div className="relative mx-4 my-2 z-10">
                            {/* Outer fire glow ring */}
                            <div
                                className="absolute inset-0 rounded-2xl pointer-events-none z-20"
                                style={{
                                    boxShadow: fireRingGlow,
                                    borderRadius: 18,
                                    animationName: 'pr-fire-pulse',
                                    animationDuration: '2s',
                                    animationIterationCount: 'infinite',
                                }}
                            />

                            {/* Flame edge — top */}
                            <div
                                className="absolute -top-[3px] left-[3%] right-[3%] h-[8px] z-[25] pointer-events-none overflow-hidden"
                                style={{
                                    background: flameEdgeTop,
                                    filter: 'blur(2px)',
                                    animationName: 'pr-bar-flicker',
                                    animationDuration: '1.5s',
                                    animationIterationCount: 'infinite',
                                }}
                            />
                            {/* Flame edge — bottom */}
                            <div
                                className="absolute -bottom-[3px] left-[3%] right-[3%] h-[8px] z-[25] pointer-events-none overflow-hidden"
                                style={{
                                    background: flameEdgeBottom,
                                    filter: 'blur(2px)',
                                    animationName: 'pr-bar-flicker',
                                    animationDuration: '2s',
                                    animationIterationCount: 'infinite',
                                    animationDelay: '0.5s',
                                }}
                            />

                            {/* Bar track */}
                            <div
                                className="relative overflow-hidden"
                                style={{
                                    height: 36,
                                    background: barTrackBg,
                                    border: `1.5px solid ${hexAlpha(border, 0.56)}`,
                                    borderRadius: 18,
                                    boxShadow: barTrackShadow,
                                }}
                            >
                                {/* Feather decoration inside bar */}
                                <BarFeather colors={{ border, iconPrimary: gold }} />

                                {/* Progress fill — orange to gold gradient */}
                                <motion.div
                                    className="absolute top-[5px] bottom-[5px] left-[4px] rounded-[12px]"
                                    initial={{ width: '0%' }}
                                    animate={{ width: `calc(${Math.max(progressPercent, 2)}% - 4px)` }}
                                    transition={{ duration: 1.2, ease: 'easeOut' }}
                                    style={{
                                        backgroundImage: progressFillBg,
                                        backgroundRepeat: 'repeat, no-repeat',
                                        backgroundPosition: '0 0, 0 0',
                                        backgroundSize: '40px 20px, 100% 100%',
                                        boxShadow: progressFillShadow,
                                        animationName: 'pr-fire-pulse',
                                        animationDuration: '2.5s',
                                        animationIterationCount: 'infinite',
                                    }}
                                >
                                    {/* Shimmer sweep */}
                                    <div className="absolute inset-0 rounded-[12px] overflow-hidden">
                                        <div
                                            className="absolute inset-y-0 w-[30%]"
                                            style={{
                                                background: shimmerSweep,
                                                animationName: 'pr-sweep',
                                                animationDuration: '2.5s',
                                                animationTimingFunction: 'ease-in-out',
                                                animationIterationCount: 'infinite',
                                            }}
                                        />
                                    </div>
                                </motion.div>

                                {/* Progress dot track — embers/circles above fill */}
                                <div className="absolute inset-0 flex items-center justify-end pr-3 z-20 pointer-events-none">
                                    {Array.from({ length: 7 }).map((_, i) => {
                                        const dotPercent = ((i + 1) / 7) * 100;
                                        const lit = progressPercent >= dotPercent;
                                        return (
                                            <div
                                                key={i}
                                                className="rounded-full mx-[3px] flex-shrink-0"
                                                style={{
                                                    width: 7,
                                                    height: 7,
                                                    background: lit
                                                        ? `radial-gradient(circle, ${goldBright}, ${fire})`
                                                        : darken(bg, 0.15),
                                                    boxShadow: lit
                                                        ? `0 0 6px ${hexAlpha(gold, 0.50)}, 0 0 12px ${hexAlpha(fire, 0.25)}`
                                                        : 'none',
                                                    border: `1px solid ${hexAlpha(lit ? gold : lighten(bg, 0.1), 0.56)}`,
                                                    transition: 'all 0.3s ease',
                                                }}
                                            />
                                        );
                                    })}
                                </div>

                                {/* Glowing tip at fill edge */}
                                <motion.div
                                    className="absolute top-[3px] bottom-[3px] w-[4px] rounded-full z-10"
                                    initial={{ left: '2%' }}
                                    animate={{ left: `calc(${Math.max(progressPercent, 2)}% - 6px)` }}
                                    transition={{ duration: 1.2, ease: 'easeOut' }}
                                    style={{
                                        background: tipGradient,
                                        boxShadow: tipShadow,
                                        animationName: 'pr-ember-glow',
                                        animationDuration: '1.8s',
                                        animationIterationCount: 'infinite',
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* ══ BOTTOM ROW — Given By + Reward ══ */}
                    <div
                        className="relative z-10 flex gap-3"
                        style={{ padding: '4px 20px 14px 20px' }}
                    >
                        {/* Given By */}
                        {config.display.showGivenBy && (
                            <div
                                className="flex-1 flex flex-col px-4 py-2"
                                style={{
                                    background: panelBg,
                                    border: `1px solid ${hexAlpha(border, 0.56)}`,
                                    borderRadius: 24,
                                    boxShadow: `
                                        inset 0 1px 6px rgba(0,0,0,0.6),
                                        0 0 6px ${toRgba(gold, 0.05)}
                                    `,
                                }}
                            >
                                <span
                                    className="uppercase tracking-widest font-bold"
                                    style={{
                                        color: colors.dateText || hexAlpha(colors.viewerName, 0.38),
                                        fontSize: Math.max(8, config.fonts.bodySize - 3),
                                        letterSpacing: '0.14em',
                                    }}
                                >
                                    GIVEN BY
                                </span>
                                <span
                                    className="font-bold uppercase tracking-wide truncate mt-0.5"
                                    style={{
                                        color: colors.viewerName,
                                        fontSize: Math.max(10, config.fonts.bodySize),
                                        textShadow: `0 0 8px ${toRgba(gold, 0.15)}`,
                                    }}
                                >
                                    {challenge.challenge.given_by || '—'}
                                </span>
                            </div>
                        )}

                        {/* Reward */}
                        {(config.display.showReward ?? true) && (
                            <div
                                className="flex-1 flex flex-col px-4 py-2"
                                style={{
                                    background: panelBg,
                                    border: `1px solid ${hexAlpha(border, 0.56)}`,
                                    borderRadius: 24,
                                    boxShadow: `
                                    inset 0 1px 6px rgba(0,0,0,0.6),
                                    0 0 6px ${toRgba(gold, 0.05)}
                                `,
                                }}
                            >
                                <span
                                    className="uppercase tracking-widest font-bold"
                                    style={{
                                        color: colors.dateText || hexAlpha(colors.viewerName, 0.38),
                                        fontSize: Math.max(8, config.fonts.bodySize - 3),
                                        letterSpacing: '0.14em',
                                    }}
                                >
                                    REWARD
                                </span>
                                <span
                                    className="font-bold uppercase tracking-wide truncate mt-0.5"
                                    style={{
                                        color: colors.viewerName,
                                        fontSize: Math.max(10, config.fonts.bodySize),
                                        textShadow: `0 0 8px ${toRgba(gold, 0.15)}`,
                                    }}
                                >
                                    {challenge.challenge.reward_amount || '—'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
