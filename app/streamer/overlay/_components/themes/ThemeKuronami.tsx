'use client';

import { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Engine } from '@tsparticles/engine';
import { ThemeRendererProps } from '../../types';
import { darken, lighten, toRgba, hexAlpha, injectDynamicKeyframes } from '../../colorUtils';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/* ── Inject keyframes (dynamic) ─────────────────────────── */
const STYLE_ID = 'kuronami-keyframes';
function ensureKeyframes(colors: { iconPrimary: string; iconSecondary: string }) {
    const ip = colors.iconPrimary;
    const is2 = colors.iconSecondary;
    const isLight = lighten(is2, 0.15);
    const isLighter = lighten(is2, 0.35);
    const css = `
    @keyframes kuronami-water-flow {
      0%   { transform: translateX(-100%) scaleY(1); opacity: 0.7; }
      50%  { transform: translateX(-10%) scaleY(1.08); opacity: 1; }
      100% { transform: translateX(150%) scaleY(1); opacity: 0.7; }
    }
    @keyframes kuronami-liquid-ripple {
      0%, 100% { transform: scaleY(1) translateY(0); opacity: 0.6; }
      25%       { transform: scaleY(1.12) translateY(-1px); opacity: 0.9; }
      50%       { transform: scaleY(0.92) translateY(1px); opacity: 0.7; }
      75%       { transform: scaleY(1.06) translateY(-0.5px); opacity: 0.85; }
    }
    @keyframes kuronami-tube-glow {
      0%, 100% { box-shadow: 0 0 8px ${hexAlpha(ip, 0.38)}, 0 0 18px ${hexAlpha(ip, 0.19)}, inset 0 0 6px ${hexAlpha(ip, 0.13)}; }
      50%       { box-shadow: 0 0 14px ${hexAlpha(ip, 0.63)}, 0 0 30px ${hexAlpha(ip, 0.31)}, inset 0 0 10px ${hexAlpha(ip, 0.25)}; }
    }
    @keyframes kuronami-neon-pulse {
      0%, 100% {
        box-shadow:
          0 0 6px ${hexAlpha(is2, 0.5)},
          0 0 14px ${hexAlpha(is2, 0.25)},
          inset 0 0 8px ${hexAlpha(is2, 0.13)};
      }
      50% {
        box-shadow:
          0 0 12px ${hexAlpha(isLight, 0.75)},
          0 0 26px ${hexAlpha(is2, 0.38)},
          inset 0 0 14px ${hexAlpha(is2, 0.25)};
      }
    }
    @keyframes kuronami-number-glow {
      0%, 100% { text-shadow: 0 0 10px ${hexAlpha(isLight, 0.56)}, 0 0 22px ${hexAlpha(is2, 0.31)}; }
      50%       { text-shadow: 0 0 18px ${hexAlpha(isLighter, 0.82)}, 0 0 38px ${hexAlpha(isLight, 0.5)}, 0 0 55px ${hexAlpha(is2, 0.19)}; }
    }
    @keyframes kuronami-leather-sheen {
      0%, 100% { opacity: 0.06; transform: translateY(-100%); }
      50%       { opacity: 0.12; transform: translateY(100%); }
    }
    @keyframes kuronami-rain-fall {
      0%   { transform: translateY(-20px) scaleY(0.6); opacity: 0; }
      20%  { opacity: 0.9; }
      80%  { opacity: 0.7; }
      100% { transform: translateY(60px) scaleY(1.2); opacity: 0; }
    }
    @keyframes kuronami-splash-burst {
      0%   { transform: scale(0) translate(0, 0); opacity: 1; }
      60%  { opacity: 0.8; }
      100% { transform: scale(1.6) translate(var(--dx), var(--dy)); opacity: 0; }
    }
    @keyframes kuronami-progress-shimmer {
      0%   { left: -40%; }
      100% { left: 120%; }
    }
    @keyframes kuronami-border-trace {
      0%   { background-position: 0% 50%; }
      100% { background-position: 200% 50%; }
    }
    @keyframes kuronami-panel-breathe {
      0%, 100% { opacity: 0.55; }
      50%       { opacity: 0.85; }
    }
    @keyframes kuronami-water-bubble {
      0%   { transform: translateY(0) scale(1); opacity: 0.5; }
      50%  { transform: translateY(-4px) scale(1.1); opacity: 0.8; }
      100% { transform: translateY(-10px) scale(0.6); opacity: 0; }
    }
    @keyframes kuronami-top-strip-glow {
      0%, 100% { opacity: 0.35; }
      50%       { opacity: 0.65; }
    }
    `;
    injectDynamicKeyframes(STYLE_ID, css);
}

/* ── Stitched leather side band ─────────────────────────── */
function LeatherBand({ side, cardBg }: { side: 'left' | 'right'; cardBg: string }) {
    const stitchCount = 6;
    return (
        <div
            className="absolute top-[8%] bottom-[8%] z-20 flex flex-col justify-between items-center"
            style={{
                [side]: -18,
                width: 18,
                background: `linear-gradient(${side === 'left' ? '90deg' : '270deg'}, ${darken(cardBg, 0.3)}, ${darken(cardBg, 0.15)}, ${darken(cardBg, 0.35)})`,                
                borderRadius: side === 'left' ? '6px 2px 2px 6px' : '2px 6px 6px 2px',
                boxShadow: side === 'left'
                    ? '-2px 0 8px rgba(0,0,0,0.7), inset 2px 0 4px rgba(255,255,255,0.04)'
                    : '2px 0 8px rgba(0,0,0,0.7), inset -2px 0 4px rgba(255,255,255,0.04)',
                overflow: 'hidden',
            }}
        >
            {/* Leather texture lines */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: `repeating-linear-gradient(
                        0deg,
                        transparent,
                        transparent 3px,
                        rgba(255,255,255,0.025) 3px,
                        rgba(255,255,255,0.025) 4px
                    )`,
                }}
            />
            {/* Sheen highlight */}
            <div
                className="absolute inset-x-0 w-[3px] h-[60%] top-[20%]"
                style={{
                    [side === 'left' ? 'right' : 'left']: 2,
                    background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.08), transparent)',
                    animationName: 'kuronami-leather-sheen',
                    animationDuration: '6s',
                    animationIterationCount: 'infinite',
                    animationTimingFunction: 'ease-in-out',
                }}
            />
            {/* Stitches */}
            {Array.from({ length: stitchCount }).map((_, i) => (
                <div
                    key={i}
                    style={{
                        width: 8,
                        height: 3,
                        borderRadius: 1.5,
                        background: 'rgba(255,255,255,0.18)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.6)',
                        marginTop: i === 0 ? 6 : 0,
                        marginBottom: i === stitchCount - 1 ? 6 : 0,
                    }}
                />
            ))}
        </div>
    );
}

/* ── SVG diagonal-corner chamfer frame ──────────────────── */
function ChamferCorner({ pos, cardBg, glowColor }: { pos: 'tl' | 'tr' | 'bl' | 'br'; cardBg: string; glowColor: string }) {
    const size = 20;
    const cut = 10;
    const isTop = pos[0] === 't';
    const isLeft = pos[1] === 'l';

    // Top-left: cut from top-cut to top, and from left to left-cut
    const paths: Record<typeof pos, string> = {
        tl: `M${cut} 0 L${size} 0 L${size} ${size} L0 ${size} L0 ${cut} Z`,
        tr: `M0 0 L${size - cut} 0 L${size} ${cut} L${size} ${size} L0 ${size} Z`,
        bl: `M0 0 L${size} 0 L${size} ${size} L${cut} ${size} L0 ${size - cut} Z`,
        br: `M0 0 L${size} 0 L${size} ${size - cut} L${size - cut} ${size} L0 ${size} Z`,
    };

    return (
        <div
            className="absolute z-30 pointer-events-none"
            style={{
                [isTop ? 'top' : 'bottom']: 0,
                [isLeft ? 'left' : 'right']: 0,
                width: size,
                height: size,
            }}
        >
            <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
                {/* Fill the corner with chassis color to cover */}
                <path d={paths[pos]} fill={darken(cardBg, 0.3)} />
                {/* Chamfer edge highlight */}
                <line
                    x1={isLeft ? cut : 0} y1={isTop ? 0 : size}
                    x2={isLeft ? 0 : size - cut} y2={isTop ? cut : size}
                    stroke="rgba(180,190,210,0.35)"
                    strokeWidth="0.8"
                />
                {/* Small glow dot at corner tip */}
                <circle
                    cx={isLeft ? cut / 2 : size - cut / 2}
                    cy={isTop ? cut / 2 : size - cut / 2}
                    r="1.5"
                    fill={glowColor}
                    opacity="0.5"
                />
            </svg>
        </div>
    );
}

/* ── X/Y parallelogram display panel ───────────────────── */
function ProgressCounter({
    current,
    target,
    primaryColor,
    fontSize,
    titleFont,
    cardBg,
}: {
    current: number;
    target: number;
    primaryColor: string;
    fontSize: number;
    titleFont: string;
    cardBg: string;
}) {
    const skew = 8; // degrees
    return (
        <div
            className="relative flex items-center justify-center flex-shrink-0"
            style={{ minWidth: 120 }}
        >
            {/* Outer parallelogram neon border */}
            <div
                className="relative px-5 py-2"
                style={{
                    transform: `skewX(-${skew}deg)`,
                    background: `linear-gradient(160deg, ${darken(cardBg, 0.15)}, ${darken(cardBg, 0.35)}, ${darken(cardBg, 0.15)})`,                    
                    border: `1.5px solid ${primaryColor}`,
                    borderRadius: 4,
                    animationName: 'kuronami-neon-pulse',
                    animationDuration: '3.5s',
                    animationIterationCount: 'infinite',
                    animationTimingFunction: 'ease-in-out',
                }}
            >
                {/* Corner accent ticks */}
                {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
                    <div
                        key={c}
                        className="absolute"
                        style={{
                            width: 6, height: 6,
                            [c[0] === 't' ? 'top' : 'bottom']: -1,
                            [c[1] === 'l' ? 'left' : 'right']: -1,
                            borderTop: c[0] === 't' ? `2px solid ${primaryColor}` : 'none',
                            borderBottom: c[0] === 'b' ? `2px solid ${primaryColor}` : 'none',
                            borderLeft: c[1] === 'l' ? `2px solid ${primaryColor}` : 'none',
                            borderRight: c[1] === 'r' ? `2px solid ${primaryColor}` : 'none',
                        }}
                    />
                ))}

                {/* Inner glow overlay */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: `radial-gradient(ellipse at center, ${primaryColor}18 0%, transparent 70%)`,
                        borderRadius: 3,
                    }}
                />

                {/* The numbers (un-skew them) */}
                <div
                    className="relative flex items-baseline gap-0.5"
                    style={{ transform: `skewX(${skew}deg)` }}
                >
                    <span
                        style={{
                            fontFamily: titleFont,
                            color: primaryColor,
                            fontSize: Math.max(26, fontSize + 10),
                            fontWeight: 900,
                            lineHeight: 1,
                            letterSpacing: '-0.02em',
                            animationName: 'kuronami-number-glow',
                            animationDuration: '3.5s',
                            animationIterationCount: 'infinite',
                            animationTimingFunction: 'ease-in-out',
                        }}
                    >
                        {current}
                    </span>
                    <span
                        style={{
                            fontFamily: titleFont,
                            color: `${primaryColor}C0`,
                            fontSize: Math.max(19, fontSize + 5),
                            fontWeight: 700,
                            lineHeight: 1.2,
                        }}
                    >
                        /
                    </span>
                    <span
                        style={{
                            fontFamily: titleFont,
                            color: `${primaryColor}E0`,
                            fontSize: Math.max(22, fontSize + 8),
                            fontWeight: 700,
                            lineHeight: 1,
                        }}
                    >
                        {target}
                    </span>
                </div>
            </div>
        </div>
    );
}

/* ── Liquid tube progress bar ───────────────────────────── */
function LiquidProgressBar({
    percent,
    fillColor,
    borderColor,
    cardBg,
    configBorder,
    emptyColor,
}: {
    percent: number;
    fillColor: string;
    borderColor: string;
    cardBg: string;
    configBorder: string;
    emptyColor: string;
}) {
    const bubblePositions = useMemo(
        () =>
            Array.from({ length: 5 }, (_, i) => ({
                left: `${10 + i * 18}%`,
                delay: `${i * 0.7}s`,
                size: 3 + (i % 3),
            })),
        []
    );

    return (
        <div
            className="relative"
            style={{
                // Outer groove / trough housing
                height: 28,
                borderRadius: 14,
                background: `linear-gradient(180deg, ${lighten(emptyColor, 0.06)} 0%, ${darken(emptyColor, 0.08)} 40%, ${lighten(emptyColor, 0.06)} 100%)`,
                border: `1.5px solid ${borderColor}40`,
                boxShadow: `
                    inset 0 3px 10px rgba(0,0,0,0.8),
                    inset 0 -1px 3px rgba(255,255,255,0.04),
                    0 0 0 1px ${darken(cardBg, 0.7)}
                `,
                overflow: 'hidden',
                padding: '3px',
            }}
        >
            {/* Inner glass tube surface */}
            <div
                className="absolute inset-[3px] rounded-[11px] overflow-hidden"
                style={{
                    background: `linear-gradient(180deg, ${lighten(emptyColor, 0.04)}, ${darken(emptyColor, 0.06)})`,
                    boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.7)',
                }}
            >
                {/* Filled water-liquid portion */}
                <motion.div
                    className="absolute inset-y-0 left-0 rounded-[10px]"
                    initial={{ width: '0%' }}
                    animate={{ width: `${Math.max(percent, 3)}%` }}
                    transition={{ duration: 1.0, ease: [0.25, 0.46, 0.45, 0.94] }}
                    style={{
                        background: `linear-gradient(180deg,
                            ${fillColor}cc 0%,
                            ${fillColor} 40%,
                            ${fillColor}e8 60%,
                            ${fillColor}60 100%
                        )`,
                        animationName: 'kuronami-tube-glow',
                        animationDuration: '2.5s',
                        animationIterationCount: 'infinite',
                        animationTimingFunction: 'ease-in-out',
                        boxShadow: `0 0 10px ${fillColor}80, 0 0 22px ${fillColor}40`,
                    }}
                >
                    {/* Ripple animation on liquid surface */}
                    <div
                        className="absolute inset-0 overflow-hidden rounded-[10px]"
                        style={{
                            animationName: 'kuronami-liquid-ripple',
                            animationDuration: '2s',
                            animationIterationCount: 'infinite',
                            animationTimingFunction: 'ease-in-out',
                        }}
                    >
                        {/* Water surface wave */}
                        <div
                            className="absolute top-0 left-0 right-0 h-[3px]"
                            style={{
                                background: `linear-gradient(90deg, transparent, ${fillColor}ff, rgba(255,255,255,0.5), ${fillColor}ff, transparent)`,
                                borderRadius: '50%',
                            }}
                        />
                    </div>

                    {/* Flowing shimmer sweep */}
                    <div
                        className="absolute inset-0 overflow-hidden rounded-[10px]"
                    >
                        <div
                            className="absolute inset-y-0 w-[35%]"
                            style={{
                                background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)`,
                                animationName: 'kuronami-progress-shimmer',
                                animationDuration: '2.2s',
                                animationTimingFunction: 'linear',
                                animationIterationCount: 'infinite',
                            }}
                        />
                    </div>

                    {/* Bubble particles inside liquid */}
                    {bubblePositions.map((b, i) => (
                        <div
                            key={i}
                            className="absolute"
                            style={{
                                bottom: 2,
                                left: b.left,
                                width: b.size,
                                height: b.size,
                                borderRadius: '50%',
                                background: `rgba(255,255,255,0.4)`,
                                animationName: 'kuronami-water-bubble',
                                animationDuration: `${1.4 + i * 0.3}s`,
                                animationDelay: b.delay,
                                animationIterationCount: 'infinite',
                                animationTimingFunction: 'ease-out',
                            }}
                        />
                    ))}
                </motion.div>

                {/* Glass tube highlight reflection */}
                <div
                    className="absolute top-0 left-[5%] right-[5%] h-[2px] pointer-events-none"
                    style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
                        borderRadius: '50%',
                    }}
                />
                {/* Bottom reflection */}
                <div
                    className="absolute bottom-0 left-[10%] right-[10%] h-[1px] pointer-events-none"
                    style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
                    }}
                />
            </div>

            {/* Left metallic end-cap bullet */}
            <div
                className="absolute left-0 top-0 bottom-0 w-[28px] z-10 pointer-events-none flex items-center justify-center"
                style={{
                    background: `linear-gradient(90deg, ${lighten(configBorder, 0.05)}, ${lighten(configBorder, 0.15)}, ${lighten(configBorder, 0.05)})`,                    
                    borderRadius: '12px 0 0 12px',
                    boxShadow: `2px 0 8px rgba(0,0,0,0.6), inset -1px 0 2px rgba(255,255,255,0.08)`,
                }}
            >
                <div
                    className="w-[8px] h-[8px] rounded-full"
                    style={{
                        background: `radial-gradient(circle at 35% 35%, ${lighten(configBorder, 0.35)}, ${lighten(configBorder, 0.05)})`,                        
                        boxShadow: '0 1px 3px rgba(0,0,0,0.7)',
                    }}
                />
            </div>
            {/* Right end-cap */}
            <div
                className="absolute right-0 top-0 bottom-0 w-[16px] z-10 pointer-events-none"
                style={{
                    background: `linear-gradient(270deg, ${darken(configBorder, 0.25)}, ${darken(configBorder, 0.05)})`,                    
                    borderRadius: '0 12px 12px 0',
                    boxShadow: '-2px 0 6px rgba(0,0,0,0.5)',
                }}
            />
        </div>
    );
}

/* ── Rain drop VFX layer ────────────────────────────────── */
function RainLayer({ color }: { color: string }) {
    const drops = useMemo(
        () =>
            Array.from({ length: 12 }, (_, i) => ({
                left: `${5 + i * 8}%`,
                delay: `${(i * 0.23) % 1.8}s`,
                duration: `${0.7 + (i % 4) * 0.15}s`,
                height: 6 + (i % 5) * 3,
                opacity: 0.5 + (i % 3) * 0.15,
            })),
        []
    );

    return (
        <div className="absolute inset-x-0 top-0 h-16 pointer-events-none overflow-hidden z-40">
            {drops.map((d, i) => (
                <div
                    key={i}
                    className="absolute"
                    style={{
                        left: d.left,
                        top: -d.height,
                        width: 1.5,
                        height: d.height,
                        background: `linear-gradient(180deg, transparent, ${color}cc, ${color})`,
                        borderRadius: 1,
                        opacity: d.opacity,
                        animationName: 'kuronami-rain-fall',
                        animationDuration: d.duration,
                        animationDelay: d.delay,
                        animationIterationCount: 'infinite',
                        animationTimingFunction: 'ease-in',
                    }}
                />
            ))}
        </div>
    );
}

/* ── Metadata bottom panel ──────────────────────────────── */
function MetaPanel({
    label,
    value,
    accentColor,
    labelColor,
    valueColor,
    bodyFont,
    bodySize,
    cardBg,
}: {
    label: string;
    value: string;
    accentColor: string;
    labelColor: string;
    valueColor: string;
    bodyFont: string;
    bodySize: number;
    cardBg: string;
}) {
    return (
        <div
            className="flex-1 flex flex-col px-3 py-2"
            style={{
                background: `linear-gradient(180deg, ${darken(cardBg, 0.15)}, ${darken(cardBg, 0.3)})`,                
                border: `1px solid rgba(180,190,220,0.1)`,
                borderRadius: 4,
                boxShadow: `inset 0 2px 6px rgba(0,0,0,0.6), inset 0 -1px 2px rgba(255,255,255,0.03)`,
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Top accent line */}
            <div
                className="absolute top-0 left-0 right-0 h-[1.5px]"
                style={{
                    background: `linear-gradient(90deg, transparent, ${accentColor}50, transparent)`,
                    animationName: 'kuronami-panel-breathe',
                    animationDuration: '4s',
                    animationIterationCount: 'infinite',
                }}
            />
            <div
                className="uppercase tracking-widest font-semibold"
                style={{
                    fontFamily: bodyFont,
                        color: labelColor,
                    fontSize: Math.max(7, bodySize - 4),
                    letterSpacing: '0.14em',
                    marginBottom: 2,
                }}
            >
                {label}
            </div>
            <div
                className="font-bold uppercase tracking-wide truncate"
                style={{
                    fontFamily: bodyFont,
                        color: valueColor,
                    fontSize: Math.max(9, bodySize),
                    letterSpacing: '0.06em',
                }}
            >
                {value}
            </div>
        </div>
    );
}

/* ── Main Kuronami Theme Component ─────────────────────── */
export default function ThemeKuronami({ challenge, config, fade }: ThemeRendererProps) {
    const [particlesInit, setParticlesInit] = useState(false);

    useEffect(() => {
        ensureKeyframes({ iconPrimary: config.colors.iconPrimary, iconSecondary: config.colors.iconSecondary });
    }, [config.colors.iconPrimary, config.colors.iconSecondary]);

    useEffect(() => {
        initParticlesEngine(async (engine: Engine) => {
            await loadSlim(engine);
        }).then(() => {
            setParticlesInit(true);
        });
    }, []);

    // Micro water droplet particles that cling to the top edge
    const particlesConfig = useMemo(() => ({
        particles: {
            number: { value: 14, density: { enable: true, value_area: 500 } },
            color: { value: [config.colors.progressFill, darken(config.colors.progressFill, 0.15), lighten(config.colors.progressFill, 0.3), darken(config.colors.progressFill, 0.35)] },
            shape: { type: 'circle' as const },
            opacity: {
                value: 0.7,
                random: true,
                animation: { enable: true, speed: 1.5, minimumValue: 0, sync: false },
            },
            size: {
                value: { min: 1, max: 3.5 },
                random: true,
                animation: { enable: true, speed: 1, minimumValue: 0.5, sync: false },
            },
            move: {
                enable: true,
                speed: 1.0,
                direction: 'top' as const,
                random: true,
                straight: false,
                outModes: { default: 'out' as const },
                gravity: { enable: true, acceleration: 0.4 },
            },
            links: { enable: false },
        },
        interactivity: {
            events: {
                onHover: { enable: false },
                onClick: { enable: false },
            },
        },
        detectRetina: true,
        background: { color: 'transparent' },
    }), [config.colors.progressFill]);

    const progressPercent = Math.min(100, Math.max(0, challenge.progress));
    const targetVal = challenge.subChallenges[0]?.target_limit ?? 1;
    const currentVal = Math.min(
        targetVal,
        Math.round((progressPercent / 100) * targetVal)
    );
    const rewardValue = challenge.challenge.reward_amount?.trim();

    const colors = config.colors;
    const primaryColor = colors.iconSecondary;
    const fillColor = colors.progressFill;
    const progressCountColor = colors.progressCount;
    const labelColor = colors.dateText;
    const valueColor = colors.viewerName;
    const titleFont = config.fonts.title || 'Chakra Petch';
    const bodyFont = config.fonts.body || 'Inter';

    return (
        <div
            className={cn(
                'relative transition-opacity duration-500',
                fade ? 'opacity-0' : 'opacity-100'
            )}
            style={{
                width: config.layout.width,
                fontFamily: bodyFont,
                opacity: config.layout.opacity / 100,
            }}
        >
            {/* ── AMBIENT TSParticles water layer ── */}
            {particlesInit && (
                <div className="absolute inset-0 pointer-events-none z-[55] overflow-visible">
                    <Particles
                        id="kuronami-water-particles"
                        options={particlesConfig}
                        className="w-full h-full"
                    />
                </div>
            )}

            {/* ── RAIN DROPS ── */}
            <RainLayer color={fillColor} />

            {/* ── LEATHER SIDE BANDS ── */}
            <LeatherBand side="left" cardBg={colors.cardBackground} />
            <LeatherBand side="right" cardBg={colors.cardBackground} />

            {/* ══════════════════════════════════════
                MAIN CHASSIS
            ══════════════════════════════════════ */}
            <div
                className="relative"
                style={{
                    background: `linear-gradient(
                        170deg,
                        ${lighten(colors.cardBackground, 0.12)} 0%,
                        ${lighten(colors.cardBackground, 0.05)} 20%,
                        ${colors.cardBackground} 50%,
                        ${lighten(colors.cardBackground, 0.05)} 80%,
                        ${lighten(colors.cardBackground, 0.12)} 100%
                    )`,
                    borderRadius: config.layout.borderRadius,
                    boxShadow: `
                        inset 0 1px 0 rgba(255,255,255,0.08),
                        inset 0 -1px 0 rgba(0,0,0,0.5),
                        0 0 0 1.5px rgba(180,195,220,0.18),
                        0 0 0 3px rgba(0,0,0,0.6),
                        0 0 20px ${toRgba(colors.iconPrimary, 0.08)},
                        0 0 40px ${toRgba(colors.iconSecondary, 0.06)},
                        0 12px 50px rgba(0,0,0,0.8)
                    `,
                    overflow: 'visible',
                }}
            >
                {/* Chamfered corners */}
                <ChamferCorner pos="tl" cardBg={colors.cardBackground} glowColor={colors.iconPrimary} />
                <ChamferCorner pos="tr" cardBg={colors.cardBackground} glowColor={colors.iconPrimary} />
                <ChamferCorner pos="bl" cardBg={colors.cardBackground} glowColor={colors.iconPrimary} />
                <ChamferCorner pos="br" cardBg={colors.cardBackground} glowColor={colors.iconPrimary} />

                {/* ── Carbon fiber micro-texture overlay ── */}
                <div
                    className="absolute inset-0 pointer-events-none z-[1] rounded-[inherit] overflow-hidden"
                    style={{
                        backgroundImage: `
                            repeating-linear-gradient(
                                45deg,
                                rgba(255,255,255,0.015) 0px,
                                rgba(255,255,255,0.015) 1px,
                                transparent 1px,
                                transparent 6px
                            ),
                            repeating-linear-gradient(
                                135deg,
                                rgba(255,255,255,0.015) 0px,
                                rgba(255,255,255,0.015) 1px,
                                transparent 1px,
                                transparent 6px
                            )
                        `,
                        backgroundSize: '6px 6px',
                    }}
                />

                {/* ── TOP EDGE glow strip ── */}
                <div
                    className="absolute top-0 left-[6%] right-[6%] h-[2px] z-10 rounded-t"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${fillColor}60, rgba(255,255,255,0.15), ${fillColor}60, transparent)`,
                        animationName: 'kuronami-top-strip-glow',
                        animationDuration: '3s',
                        animationIterationCount: 'infinite',
                    }}
                />
                {/* Bottom edge */}
                <div
                    className="absolute bottom-0 left-[10%] right-[10%] h-[1px] z-10"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${toRgba(colors.progressFill, 0.25)}, transparent)`,
                    }}
                />
                {/* Vertical side accent strips */}
                <div
                    className="absolute top-[12%] left-0 w-[2px] h-[76%] z-10"
                    style={{
                        background: `linear-gradient(180deg, transparent, ${toRgba(colors.progressFill, 0.4)}, ${toRgba(colors.iconSecondary, 0.3)}, transparent)`,
                    }}
                />
                <div
                    className="absolute top-[12%] right-0 w-[2px] h-[76%] z-10"
                    style={{
                        background: `linear-gradient(180deg, transparent, ${toRgba(colors.progressFill, 0.4)}, ${toRgba(colors.iconSecondary, 0.3)}, transparent)`,
                    }}
                />

                {/* ── Diagonal engraved plate lines ── */}
                <div className="absolute inset-0 pointer-events-none z-[2] overflow-hidden rounded-[inherit]">
                    <div
                        className="absolute w-[40%] h-[1px]"
                        style={{
                            top: '24%',
                            left: '2%',
                            background: 'linear-gradient(90deg, transparent, rgba(200,210,230,0.07), transparent)',
                            transform: 'rotate(-1.5deg)',
                        }}
                    />
                    <div
                        className="absolute w-[35%] h-[1px]"
                        style={{
                            bottom: '28%',
                            right: '4%',
                            background: 'linear-gradient(90deg, transparent, rgba(200,210,230,0.05), transparent)',
                            transform: 'rotate(1deg)',
                        }}
                    />
                </div>

                {/* ════════════════
                    ROW 1: Title + X/Y
                ════════════════ */}
                <div
                    className="relative z-10 flex items-center gap-3"
                    style={{ padding: '14px 18px 6px 18px' }}
                >
                    {/* Left: Challenge name */}
                    <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                        <span
                            className="uppercase font-extrabold leading-tight truncate tracking-widest"
                            style={{
                                fontFamily: titleFont,
                                color: colors.challengeTitle,
                                fontSize: config.fonts.titleSize,
                                fontWeight: config.fonts.titleWeight,
                                textShadow: '0 1px 8px rgba(0,0,0,0.9)',
                                letterSpacing: '0.1em',
                            }}
                        >
                            {challenge.challenge.title}
                        </span>

                        {/* Sub-challenge headline */}
                        {config.display.showSubChallenges && challenge.subChallenges.length > 0 && (
                            <div className="flex flex-col gap-0.5">
                                <span
                                    className="uppercase tracking-widest font-bold leading-tight truncate"
                                    style={{
                                        fontFamily: bodyFont,
                                        color: colors.subchallengeTitle,
                                        fontSize: Math.max(9, config.fonts.bodySize - 1),
                                        letterSpacing: '0.12em',
                                        textShadow: `0 0 10px ${fillColor}25`,
                                    }}
                                >
                                    {challenge.subChallenges[0]?.title || 'OBJECTIVE'}
                                </span>
                                {/* Thin purple underline divider */}
                                <div
                                    className="w-full h-[1.5px] mt-0.5"
                                    style={{
                                        background: `linear-gradient(90deg, ${primaryColor}90, ${primaryColor}40, transparent)`,
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Right: X/Y counter display */}
                    {(config.display.showProgressCount ?? true) && (
                        <ProgressCounter
                            current={currentVal}
                            target={targetVal}
                            primaryColor={progressCountColor}
                            fontSize={config.fonts.titleSize}
                            titleFont={titleFont}
                            cardBg={colors.cardBackground}
                        />
                    )}
                </div>

                {/* ════════════════
                    ROW 2: Progress bar
                ════════════════ */}
                {config.display.showProgressBar && (
                    <div className="relative z-10 px-4 py-2">
                        <LiquidProgressBar
                            percent={progressPercent}
                            fillColor={fillColor}
                            borderColor={fillColor}
                            cardBg={colors.cardBackground}
                            configBorder={colors.border}
                            emptyColor={colors.progressEmpty}
                        />
                    </div>
                )}

                {/* ════════════════
                    ROW 3: Given By + Reward
                ════════════════ */}
                <div
                    className="relative z-10 flex gap-2"
                    style={{ padding: '2px 18px 12px 18px' }}
                >
                    {config.display.showGivenBy && challenge.challenge.given_by && (
                        <MetaPanel
                            label="GIVEN BY"
                            value={challenge.challenge.given_by}
                            accentColor={fillColor}
                            labelColor={labelColor}
                            valueColor={valueColor}
                            bodyFont={bodyFont}
                            bodySize={config.fonts.bodySize}
                            cardBg={colors.cardBackground}
                        />
                    )}

                    {(config.display.showReward ?? true) && (
                        <MetaPanel
                            label="REWARD"
                            value={rewardValue || (() => {
                                const sub = challenge.subChallenges[0];
                                if (!sub) return '—';
                                return `${sub.current_progress} / ${sub.target_limit}`;
                            })()}
                            accentColor={primaryColor}
                            labelColor={labelColor}
                            valueColor={valueColor}
                            bodyFont={bodyFont}
                            bodySize={config.fonts.bodySize}
                            cardBg={colors.cardBackground}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
