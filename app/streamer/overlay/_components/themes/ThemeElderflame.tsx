import { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Engine } from '@tsparticles/engine';
import { ThemeRendererProps } from '../../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { darken, lighten, blend, toRgba, hexAlpha, injectDynamicKeyframes } from '../../colorUtils';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/* ── Build dynamic keyframes CSS ───────────────────────── */
const STYLE_ID = 'elderflame-keyframes';

function buildKeyframesCSS(colors: Record<string, string>): string {
    const fire = colors.iconSecondary;
    const fireBright = lighten(fire, 0.15);
    const fireDark = darken(fire, 0.15);

    return `
    @keyframes ef-lava-pulse {
      0%, 100% { opacity: 0.75; filter: brightness(1); }
      30% { opacity: 0.95; filter: brightness(1.2); }
      60% { opacity: 0.80; filter: brightness(1.05); }
    }
    @keyframes ef-crack-glow {
      0%, 100% { opacity: 0.5; }
      40% { opacity: 0.9; }
      70% { opacity: 0.65; }
    }
    @keyframes ef-breathe {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.008); }
    }
    @keyframes ef-ember-glow {
      0%, 100% { box-shadow: 0 0 6px 2px ${hexAlpha(fire, 0.5)}; }
      50% { box-shadow: 0 0 14px 5px ${hexAlpha(fireBright, 0.75)}, 0 0 28px 8px ${hexAlpha(fire, 0.25)}; }
    }
    @keyframes ef-lava-flow {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes ef-sweep {
      0% { transform: translateX(-120%); opacity: 0; }
      20% { opacity: 1; }
      80% { opacity: 0.6; }
      100% { transform: translateX(280%); opacity: 0; }
    }
    @keyframes ef-corner-pulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
    @keyframes ef-number-glow {
      0%, 100% { text-shadow: 0 0 10px ${hexAlpha(fire, 0.69)}, 0 0 20px ${hexAlpha(fire, 0.31)}; }
      50% { text-shadow: 0 0 18px ${hexAlpha(fireBright, 0.88)}, 0 0 36px ${hexAlpha(fire, 0.63)}, 0 0 52px ${hexAlpha(fireDark, 0.19)}; }
    }
    @keyframes ef-side-flicker {
      0%, 85%, 100% { opacity: 0.4; }
      90% { opacity: 1; }
      95% { opacity: 0.7; }
    }
    `;
}

/* ── Heavy Metal Corner Bracket ────────────────────────── */
interface DragonCornerColors {
    border: string;
    iconSecondary: string;
}

function DragonCorner({ position, colors }: { position: 'tl' | 'tr' | 'bl' | 'br'; colors: DragonCornerColors }) {
    const isTop = position.startsWith('t');
    const isLeft = position.endsWith('l');

    const metalStroke = lighten(colors.border, 0.35);
    const metalInsetFill = darken(colors.border, 0.3);
    const metalInsetStroke = colors.border;
    const accentFill = colors.iconSecondary;
    const accentGlow = lighten(colors.iconSecondary, 0.05);
    const accentDim = darken(colors.iconSecondary, 0.08);
    const metalGradLight = lighten(colors.border, 0.3);
    const metalGradMid = colors.border;
    const metalGradDark = darken(colors.border, 0.2);

    return (
        <div
            className="absolute z-30"
            style={{
                [isTop ? 'top' : 'bottom']: -2,
                [isLeft ? 'left' : 'right']: -2,
                width: 32,
                height: 32,
            }}
        >
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                {/* Outer corner bracket — thick metallic */}
                <path
                    d={
                        isTop && isLeft
                            ? 'M0 14 L0 0 L14 0 L14 4 L4 4 L4 14 Z'
                            : isTop && !isLeft
                                ? 'M32 14 L32 0 L18 0 L18 4 L28 4 L28 14 Z'
                                : !isTop && isLeft
                                    ? 'M0 18 L0 32 L14 32 L14 28 L4 28 L4 18 Z'
                                    : 'M32 18 L32 32 L18 32 L18 28 L28 28 L28 18 Z'
                    }
                    fill="url(#ef-metal-grad)"
                    stroke={metalStroke}
                    strokeWidth="0.5"
                />
                {/* Inner inset step */}
                <path
                    d={
                        isTop && isLeft
                            ? 'M2 12 L2 2 L12 2 L12 5 L5 5 L5 12 Z'
                            : isTop && !isLeft
                                ? 'M30 12 L30 2 L20 2 L20 5 L27 5 L27 12 Z'
                                : !isTop && isLeft
                                    ? 'M2 20 L2 30 L12 30 L12 27 L5 27 L5 20 Z'
                                    : 'M30 20 L30 30 L20 30 L20 27 L27 27 L27 20 Z'
                    }
                    fill={metalInsetFill}
                    stroke={metalInsetStroke}
                    strokeWidth="0.5"
                    opacity="0.8"
                />
                {/* Diagonal notch accent */}
                <path
                    d={
                        isTop && isLeft
                            ? 'M6 6 L10 6 L6 10 Z'
                            : isTop && !isLeft
                                ? 'M26 6 L22 6 L26 10 Z'
                                : !isTop && isLeft
                                    ? 'M6 26 L10 26 L6 22 Z'
                                    : 'M26 26 L22 26 L26 22 Z'
                    }
                    fill={accentFill}
                    opacity="0.7"
                />
                {/* Glowing accent dot */}
                <circle
                    cx={isLeft ? 7 : 25}
                    cy={isTop ? 7 : 25}
                    r="2.5"
                    fill={accentGlow}
                    style={{
                        animationName: 'ef-corner-pulse',
                        animationDuration: '2.5s',
                        animationIterationCount: 'infinite',
                        filter: `drop-shadow(0 0 4px ${hexAlpha(accentGlow, 0.5)})`,
                    }}
                />
                {/* Small secondary dot */}
                <circle
                    cx={isLeft ? 13 : 19}
                    cy={isTop ? 7 : 25}
                    r="1"
                    fill={accentDim}
                    opacity="0.6"
                />
                <circle
                    cx={isLeft ? 7 : 25}
                    cy={isTop ? 13 : 19}
                    r="1"
                    fill={accentDim}
                    opacity="0.6"
                />
                <defs>
                    <linearGradient id="ef-metal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={metalGradLight} />
                        <stop offset="40%" stopColor={metalGradMid} />
                        <stop offset="100%" stopColor={metalGradDark} />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
}

/* ── Lava Crack SVG overlay ─────────────────────────────── */
// Uses a fixed internal viewBox so crack paths stay proportional;
// the SVG stretches to 100% × 100% of the parent via preserveAspectRatio="none".
const CRACK_W = 430;
const CRACK_H = 140;

interface LavaCracksColors {
    iconSecondary: string;
}

function LavaCracks({ colors }: { colors: LavaCracksColors }) {
    const fire = colors.iconSecondary;
    const fireBright = lighten(fire, 0.1);
    const fireDark = darken(fire, 0.15);
    const fireDarker = darken(fire, 0.05);
    const fireMid = lighten(fire, 0.05);

    return (
        <svg
            className="absolute inset-0 pointer-events-none z-[2]"
            width="100%"
            height="100%"
            viewBox={`0 0 ${CRACK_W} ${CRACK_H}`}
            preserveAspectRatio="none"
            style={{
                animationName: 'ef-crack-glow',
                animationDuration: '4s',
                animationIterationCount: 'infinite',
            }}
        >
            <defs>
                <filter id="ef-glow-filter">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <linearGradient id="ef-crack1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={fireDark} stopOpacity="0" />
                    <stop offset="30%" stopColor={fire} stopOpacity="0.9" />
                    <stop offset="60%" stopColor={fireBright} stopOpacity="0.7" />
                    <stop offset="100%" stopColor={fireDark} stopOpacity="0" />
                </linearGradient>
                <linearGradient id="ef-crack2" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={fireDarker} stopOpacity="0" />
                    <stop offset="40%" stopColor={fireMid} stopOpacity="0.8" />
                    <stop offset="100%" stopColor={fireDark} stopOpacity="0" />
                </linearGradient>
            </defs>
            {/* Main diagonal crack — top-left to center */}
            <path
                d={`M${CRACK_W * 0.08} ${CRACK_H * 0.05} L${CRACK_W * 0.22} ${CRACK_H * 0.28} L${CRACK_W * 0.18} ${CRACK_H * 0.42} L${CRACK_W * 0.32} ${CRACK_H * 0.55} L${CRACK_W * 0.28} ${CRACK_H * 0.75} L${CRACK_W * 0.38} ${CRACK_H * 0.95}`}
                stroke="url(#ef-crack1)"
                strokeWidth="1.5"
                fill="none"
                filter="url(#ef-glow-filter)"
            />
            {/* Branch crack 1 */}
            <path
                d={`M${CRACK_W * 0.22} ${CRACK_H * 0.28} L${CRACK_W * 0.35} ${CRACK_H * 0.35} L${CRACK_W * 0.48} ${CRACK_H * 0.25}`}
                stroke={fire}
                strokeWidth="0.8"
                fill="none"
                opacity="0.6"
                filter="url(#ef-glow-filter)"
            />
            {/* Right-side crack */}
            <path
                d={`M${CRACK_W * 0.92} ${CRACK_H * 0.08} L${CRACK_W * 0.76} ${CRACK_H * 0.22} L${CRACK_W * 0.82} ${CRACK_H * 0.45} L${CRACK_W * 0.68} ${CRACK_H * 0.60} L${CRACK_W * 0.74} ${CRACK_H * 0.92}`}
                stroke="url(#ef-crack2)"
                strokeWidth="1.2"
                fill="none"
                filter="url(#ef-glow-filter)"
            />
            {/* Center radiating crack */}
            <path
                d={`M${CRACK_W * 0.50} ${CRACK_H * 0.10} L${CRACK_W * 0.46} ${CRACK_H * 0.38} L${CRACK_W * 0.53} ${CRACK_H * 0.55} L${CRACK_W * 0.49} ${CRACK_H * 0.88}`}
                stroke={fireDarker}
                strokeWidth="0.7"
                fill="none"
                opacity="0.5"
                filter="url(#ef-glow-filter)"
            />
            {/* Short branch cracks */}
            <path
                d={`M${CRACK_W * 0.46} ${CRACK_H * 0.38} L${CRACK_W * 0.38} ${CRACK_H * 0.50}`}
                stroke={fire} strokeWidth="0.5" fill="none" opacity="0.45" filter="url(#ef-glow-filter)"
            />
            <path
                d={`M${CRACK_W * 0.53} ${CRACK_H * 0.55} L${CRACK_W * 0.63} ${CRACK_H * 0.65}`}
                stroke={fire} strokeWidth="0.5" fill="none" opacity="0.45" filter="url(#ef-glow-filter)"
            />
        </svg>
    );
}

/* ── Main Elderflame Theme Component ────────────────────── */
export default function ThemeElderflame({ challenge, config, fade }: ThemeRendererProps) {
    const [particlesInit, setParticlesInit] = useState(false);

    const c = config.colors;

    /* ── Derived fire / lava palette ── */
    const fire = c.iconSecondary;
    const fireBright = lighten(fire, 0.15);
    const fireMid = lighten(fire, 0.08);
    const fireDark = darken(fire, 0.15);
    const fireDeep = darken(fire, 0.1);
    const fireGlow = lighten(fire, 0.5);
    const fireDarker = darken(fire, 0.05);

    /* ── Derived card / volcanic palette ── */
    const cardBase = c.cardBackground;
    const cardLight = lighten(cardBase, 0.08);
    const cardMid = darken(cardBase, 0.15);
    const cardDark = darken(cardBase, 0.3);
    const cardDeep = darken(cardBase, 0.5);

    /* ── Derived border / metal palette ── */
    const metalBase = c.border;

    useEffect(() => {
        injectDynamicKeyframes(STYLE_ID, buildKeyframesCSS(c));
    }, [c]);

    useEffect(() => {
        initParticlesEngine(async (engine: Engine) => {
            await loadSlim(engine);
        }).then(() => {
            setParticlesInit(true);
        });
    }, []);

    /* Rising ember / ash particles */
    const particlesConfig = useMemo(() => ({
        particles: {
            number: { value: 14, density: { enable: true, value_area: 800 } },
            color: { value: [fire, lighten(fire, 0.1), darken(fire, 0.2), lighten(fire, 0.3), darken(fire, 0.05)] },
            shape: { type: 'circle' },
            opacity: {
                value: 0.7,
                random: true,
                anim: { enable: true, speed: 2.5, opacity_min: 0, sync: false },
            },
            size: {
                value: 2.5,
                random: true,
                anim: { enable: true, speed: 1.5, size_min: 0.5, sync: false },
            },
            move: {
                enable: true,
                speed: 1.2,
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
    }), [fire]);

    const progressPercent = challenge.progress;
    const subChallenge = challenge.subChallenges[0];
    const currentVal = subChallenge
        ? subChallenge.current_progress
        : Math.round((progressPercent / 100) * 10);
    const targetVal = subChallenge?.target_limit ?? 10;
    const dimmed = c.dateText || (c as Record<string, string>).dimmed || lighten(cardBase, 0.35);

    /* Honeycomb SVG for progress bar fill — inlined as data URI */
    const honeycombSVG = encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="24">
            <polygon points="14,2 22,7 22,17 14,22 6,17 6,7" fill="none" stroke="${fireBright}" stroke-width="0.8" opacity="0.5"/>
            <polygon points="0,12 6,7 6,17" fill="none" stroke="${fireMid}" stroke-width="0.8" opacity="0.4"/>
            <polygon points="28,12 22,7 22,17" fill="none" stroke="${fireMid}" stroke-width="0.8" opacity="0.4"/>
        </svg>
    `);

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
            }}
        >
            {/* Rising ember particles */}
            <div className="absolute inset-0 pointer-events-none z-50 overflow-visible">
                {particlesInit && (
                    <Particles
                        id="elderflame-embers"
                        options={particlesConfig}
                        className="w-full h-full"
                    />
                )}
            </div>

            {/* ══ OUTER FRAME — Heavy volcanic metal ══ */}
            <div
                className="relative"
                style={{
                    /* Multi-layer metal border mimicking image: thick dark-silver outer ring with orange glow */
                    background: `linear-gradient(160deg, ${cardLight} 0%, ${cardMid} 40%, ${cardDark} 100%)`,
                    borderRadius: Math.max(config.layout.borderRadius, 6),
                    padding: '3px',
                    boxShadow: `
                        0 0 0 1px ${metalBase},
                        0 0 0 2px ${darken(cardBase, 0.35)},
                        inset 0 0 6px ${toRgba(fire, 0.08)},
                        0 0 24px ${toRgba(fireDarker, 0.18)},
                        0 0 48px ${toRgba(fireDeep, 0.08)},
                        0 14px 48px rgba(0,0,0,0.8)
                    `,
                    animationName: 'ef-breathe',
                    animationDuration: '5s',
                    animationIterationCount: 'infinite',
                    animationTimingFunction: 'ease-in-out',
                }}
            >
                {/* Frame edge accent — top strip */}
                <div
                    className="absolute top-0 left-[10%] right-[10%] h-[2.5px] z-20 rounded-full"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${hexAlpha(fire, 0.63)}, ${hexAlpha(fireBright, 0.75)}, ${hexAlpha(fire, 0.63)}, transparent)`,
                        animationName: 'ef-crack-glow',
                        animationDuration: '3s',
                        animationIterationCount: 'infinite',
                    }}
                />
                {/* Frame edge accent — bottom strip */}
                <div
                    className="absolute bottom-0 left-[15%] right-[15%] h-[2px] z-20 rounded-full"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${hexAlpha(fireDarker, 0.63)}, ${hexAlpha(fireMid, 0.69)}, ${hexAlpha(fireDarker, 0.63)}, transparent)`,
                        animationName: 'ef-crack-glow',
                        animationDuration: '4s',
                        animationIterationCount: 'infinite',
                        animationDelay: '1.5s',
                    }}
                />
                {/* Left edge vertical glow */}
                <div
                    className="absolute left-0 top-[12%] h-[76%] w-[2.5px] z-20"
                    style={{
                        background: `linear-gradient(180deg, transparent, ${hexAlpha(fire, 0.56)}, ${hexAlpha(fire, 0.56)}, transparent)`,
                        animationName: 'ef-side-flicker',
                        animationDuration: '3.5s',
                        animationIterationCount: 'infinite',
                    }}
                />
                {/* Right edge vertical glow */}
                <div
                    className="absolute right-0 top-[12%] h-[76%] w-[2.5px] z-20"
                    style={{
                        background: `linear-gradient(180deg, transparent, ${hexAlpha(fireDeep, 0.63)}, ${hexAlpha(fireDeep, 0.63)}, transparent)`,
                        animationName: 'ef-side-flicker',
                        animationDuration: '4s',
                        animationIterationCount: 'infinite',
                        animationDelay: '2s',
                    }}
                />

                {/* ══ INNER CARD — Volcanic rock / charcoal base ══ */}
                <div
                    className="relative overflow-hidden"
                    style={{
                        background: `
                            radial-gradient(ellipse at 30% 40%, ${toRgba(blend(cardBase, fire, 0.15), 0.094)} 0%, transparent 60%),
                            radial-gradient(ellipse at 70% 60%, ${toRgba(blend(cardBase, fire, 0.08), 0.094)} 0%, transparent 55%),
                            linear-gradient(165deg, ${cardMid} 0%, ${darken(cardBase, 0.2)} 40%, ${cardDeep} 100%)
                        `,
                        borderRadius: Math.max(config.layout.borderRadius - 1, 4),
                        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.6)',
                    }}
                >
                    {/* Volcanic rock texture overlay */}
                    <div
                        className="absolute inset-0 z-[1] pointer-events-none"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' fill='none'/%3E%3Cpath d='M0 24 Q8 20 16 26 Q24 32 32 22 Q40 12 48 20' stroke='%23ffffff' stroke-width='0.2' fill='none' opacity='0.04'/%3E%3Cpath d='M0 36 Q10 30 20 38 Q30 46 38 36 Q44 28 48 34' stroke='%23ffffff' stroke-width='0.15' fill='none' opacity='0.03'/%3E%3Cpath d='M8 0 Q12 10 8 20 Q4 30 10 40 Q14 46 8 48' stroke='%23ffffff' stroke-width='0.15' fill='none' opacity='0.03'/%3E%3Cpath d='M32 0 Q28 12 34 24 Q38 34 32 44 Q28 48 32 48' stroke='%23ffffff' stroke-width='0.15' fill='none' opacity='0.03'/%3E%3C/svg%3E")`,
                            backgroundSize: '48px 48px',
                        }}
                    />

                    {/* Lava crack SVG overlay */}
                    <LavaCracks colors={{ iconSecondary: fire }} />

                    {/* Ambient orange lava glow — bottom radial */}
                    <div
                        className="absolute bottom-0 left-[20%] right-[20%] h-[30%] z-[3] pointer-events-none"
                        style={{
                            background: `radial-gradient(ellipse at center, ${toRgba(fire, 0.125)} 0%, transparent 70%)`,
                            animationName: 'ef-lava-pulse',
                            animationDuration: '4s',
                            animationIterationCount: 'infinite',
                        }}
                    />
                    {/* Ambient orange lava glow — top radial */}
                    <div
                        className="absolute top-0 left-[30%] right-[30%] h-[25%] z-[3] pointer-events-none"
                        style={{
                            background: `radial-gradient(ellipse at center, ${toRgba(fireDarker, 0.063)} 0%, transparent 70%)`,
                            animationName: 'ef-lava-pulse',
                            animationDuration: '5s',
                            animationIterationCount: 'infinite',
                            animationDelay: '2s',
                        }}
                    />

                    {/* Corner brackets on inner card */}
                    <DragonCorner position="tl" colors={{ border: metalBase, iconSecondary: fire }} />
                    <DragonCorner position="tr" colors={{ border: metalBase, iconSecondary: fire }} />
                    <DragonCorner position="bl" colors={{ border: metalBase, iconSecondary: fire }} />
                    <DragonCorner position="br" colors={{ border: metalBase, iconSecondary: fire }} />

                    {/* ══ TITLE ROW ══ */}
                    <div
                        className="relative z-10 flex justify-between items-start"
                        style={{ padding: '14px 18px 6px 18px' }}
                    >
                        {/* Left — Challenge title */}
                        <div className="flex flex-col gap-1 flex-1 min-w-0 pr-3">
                            <span
                                className="uppercase font-extrabold leading-tight tracking-wider truncate"
                                style={{
                                    color: c.challengeTitle,
                                    fontFamily: config.fonts.title,
                                    fontSize: config.fonts.titleSize,
                                    textShadow: '0 1px 6px rgba(0,0,0,0.95), 0 0 12px rgba(0,0,0,0.6)',
                                    letterSpacing: '0.06em',
                                }}
                            >
                                {challenge.challenge.title}
                            </span>

                            {/* Sub-objective line with lava underline */}
                            {config.display.showSubChallenges && challenge.subChallenges.length > 0 && (
                                <div className="flex flex-col gap-0.5">
                                    <span
                                        className="uppercase font-bold tracking-wider truncate"
                                        style={{
                                            color: c.subchallengeTitle,
                                            fontSize: Math.max(9, config.fonts.bodySize - 2),
                                            textShadow: `0 0 8px ${hexAlpha(c.iconPrimary, 0.188)}`,
                                        }}
                                    >
                                        {challenge.subChallenges[0]?.title || 'OBJECTIVE'}
                                    </span>
                                    {/* Thin lava underline */}
                                    <div
                                        className="w-full h-[1.5px]"
                                        style={{
                                            background: `linear-gradient(90deg, ${hexAlpha(c.iconPrimary, 0.565)}, ${hexAlpha(c.iconSecondary, 0.314)}, transparent)`,
                                            animationName: 'ef-crack-glow',
                                            animationDuration: '3s',
                                            animationIterationCount: 'infinite',
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Right — X/Y blazing counter */}
                        {(config.display.showProgressCount ?? true) && (
                            <div
                                className="flex items-center flex-shrink-0 px-4 py-2"
                                style={{
                                    background: `linear-gradient(160deg, ${cardMid} 0%, ${cardDark} 100%)`,
                                    border: `1.5px solid ${hexAlpha(c.iconPrimary, 0.376)}`,
                                    borderRadius: 6,
                                    boxShadow: `
                                    inset 0 0 10px ${toRgba(fire, 0.08)},
                                    0 0 10px ${hexAlpha(c.iconPrimary, 0.188)},
                                    0 0 20px ${hexAlpha(c.iconPrimary, 0.063)}
                                `,
                                    animationName: 'ef-ember-glow',
                                    animationDuration: '3s',
                                    animationIterationCount: 'infinite',
                                }}
                            >
                                <span
                                    className="font-extrabold tabular-nums"
                                    style={{
                                        fontFamily: config.fonts.title,
                                        color: c.progressCount,
                                        fontSize: Math.max(24, config.fonts.titleSize + 10),
                                        lineHeight: 1,
                                        animationName: 'ef-number-glow',
                                        animationDuration: '2.5s',
                                        animationIterationCount: 'infinite',
                                    }}
                                >
                                    {currentVal}
                                </span>
                                <span
                                    className="mx-1 font-bold"
                                    style={{
                                        color: hexAlpha(c.progressCount, 0.72),
                                        fontSize: Math.max(18, config.fonts.titleSize + 4),
                                        lineHeight: 1,
                                    }}
                                >
                                    /
                                </span>
                                <span
                                    className="font-bold tabular-nums"
                                    style={{
                                        color: hexAlpha(c.progressCount, 0.92),
                                        fontSize: Math.max(20, config.fonts.titleSize + 6),
                                        lineHeight: 1,
                                    }}
                                >
                                    {targetVal}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* ══ PROGRESS BAR — Lava vein with honeycomb fill ══ */}
                    {config.display.showProgressBar && (
                        <div className="relative mx-4 my-2 z-10">
                            {/* Outer track — recessed dark groove */}
                            <div
                                className="relative overflow-hidden"
                                style={{
                                    height: 32,
                                    background: `linear-gradient(180deg, ${lighten(c.progressEmpty, 0.06)} 0%, ${darken(c.progressEmpty, 0.08)} 50%, ${lighten(c.progressEmpty, 0.06)} 100%)`,
                                    border: `1.5px solid ${c.border}`,
                                    borderRadius: 18,
                                    boxShadow: `
                                        inset 0 3px 10px rgba(0,0,0,0.8),
                                        inset 0 -1px 3px ${toRgba(fire, 0.06)},
                                        0 0 0 1px ${darken(cardBase, 0.45)}
                                    `,
                                }}
                            >
                                {/* Inner shadow rim on top */}
                                <div
                                    className="absolute top-0 left-0 right-0 h-[3px] z-10"
                                    style={{
                                        background: `linear-gradient(90deg, transparent, ${toRgba(fire, 0.2)}, ${toRgba(fire, 0.1)}, transparent)`,
                                    }}
                                />

                                {/* Lava fill — honeycomb + gradient */}
                                <motion.div
                                    className="absolute top-[6px] bottom-[6px] left-[4px] rounded-[12px]"
                                    initial={{ width: '0%' }}
                                    animate={{ width: `calc(${Math.max(progressPercent, 2)}% - 4px)` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    style={{
                                        background: `
                                            url("data:image/svg+xml,${honeycombSVG}"),
                                            linear-gradient(180deg,
                                                ${hexAlpha(fireBright, 0.91)} 0%,
                                                ${fire} 30%,
                                                ${fireDeep} 60%,
                                                ${fireDarker} 80%,
                                                ${hexAlpha(fireMid, 0.88)} 100%
                                            )
                                        `,
                                        backgroundSize: '28px 20px, 100% 100%',
                                        boxShadow: `
                                            0 0 10px ${hexAlpha(c.progressFill, 0.69)},
                                            0 0 22px ${hexAlpha(c.progressFill, 0.376)},
                                            0 0 40px ${hexAlpha(c.progressFill, 0.145)},
                                            inset 0 1px 0 ${toRgba(lighten(fire, 0.45), 0.3)},
                                            inset 0 -1px 0 ${toRgba(darken(fire, 0.2), 0.3)}
                                        `,
                                        animationName: 'ef-lava-pulse',
                                        animationDuration: '3s',
                                        animationIterationCount: 'infinite',
                                    }}
                                >
                                    {/* Bright lava sweep */}
                                    <div className="absolute inset-0 rounded-[12px] overflow-hidden">
                                        <div
                                            className="absolute inset-y-0 w-[35%]"
                                            style={{
                                                background: `linear-gradient(90deg, transparent, ${toRgba(fireGlow, 0.35)}, transparent)`,
                                                animationName: 'ef-sweep',
                                                animationDuration: '3s',
                                                animationTimingFunction: 'ease-in-out',
                                                animationIterationCount: 'infinite',
                                            }}
                                        />
                                    </div>
                                </motion.div>

                                {/* Glowing trail at fill edge */}
                                <motion.div
                                    className="absolute top-[4px] bottom-[4px] w-[3px] rounded-full z-10"
                                    initial={{ left: '2%' }}
                                    animate={{ left: `calc(${Math.max(progressPercent, 2)}% - 6px)` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    style={{
                                        background: `linear-gradient(180deg, ${fireGlow}, ${fireBright}, ${fireDark})`,
                                        boxShadow: `0 0 8px ${hexAlpha(fireBright, 0.75)}, 0 0 16px ${hexAlpha(fire, 0.5)}`,
                                        animationName: 'ef-ember-glow',
                                        animationDuration: '1.5s',
                                        animationIterationCount: 'infinite',
                                    }}
                                />

                                {/* Bottom glow rim */}
                                <div
                                    className="absolute bottom-0 left-0 right-0 h-[2px] z-10"
                                    style={{
                                        background: `linear-gradient(90deg, transparent, ${toRgba(fireDarker, 0.3)}, transparent)`,
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* ══ BOTTOM ROW — Given By + Reward ══ */}
                    <div
                        className="relative z-10 flex gap-3"
                        style={{ padding: '4px 18px 14px 18px' }}
                    >
                        {/* Given By */}
                        {config.display.showGivenBy && (
                            <div
                                className="flex-1 flex flex-col px-3 py-2"
                                style={{
                                    background: `linear-gradient(160deg, ${cardMid} 0%, ${cardDark} 100%)`,
                                    border: `1px solid ${c.border}`,
                                    borderRadius: 22,
                                    boxShadow: `
                                        inset 0 1px 4px rgba(0,0,0,0.5),
                                        0 0 6px ${toRgba(fire, 0.06)}
                                    `,
                                }}
                            >
                                <span
                                    className="uppercase tracking-widest font-bold"
                                    style={{
                                        color: dimmed,
                                        fontSize: Math.max(8, config.fonts.bodySize - 3),
                                        letterSpacing: '0.12em',
                                    }}
                                >
                                    GIVEN BY
                                </span>
                                <span
                                    className="font-bold uppercase tracking-wide truncate"
                                    style={{
                                        color: c.viewerName,
                                        fontSize: Math.max(10, config.fonts.bodySize),
                                        textShadow: `0 0 6px ${toRgba(lighten(fire, 0.2), 0.2)}`,
                                    }}
                                >
                                    {challenge.challenge.given_by || '—'}
                                </span>
                            </div>
                        )}

                        {/* Reward */}
                        {(config.display.showReward ?? true) && (
                            <div
                                className="flex-1 flex flex-col px-3 py-2"
                                style={{
                                    background: `linear-gradient(160deg, ${cardMid} 0%, ${cardDark} 100%)`,
                                    border: `1px solid ${c.border}`,
                                    borderRadius: 22,
                                    boxShadow: `
                                    inset 0 1px 4px rgba(0,0,0,0.5),
                                    0 0 6px ${toRgba(fire, 0.06)}
                                `,
                                }}
                            >
                                <span
                                    className="uppercase tracking-widest font-bold"
                                    style={{
                                        color: dimmed,
                                        fontSize: Math.max(8, config.fonts.bodySize - 3),
                                        letterSpacing: '0.12em',
                                    }}
                                >
                                    REWARD
                                </span>
                                <span
                                    className="font-bold uppercase tracking-wide truncate"
                                    style={{
                                        color: c.viewerName,
                                        fontSize: Math.max(10, config.fonts.bodySize),
                                        textShadow: `0 0 6px ${toRgba(lighten(fire, 0.2), 0.2)}`,
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
