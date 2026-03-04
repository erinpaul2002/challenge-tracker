import { useMemo, useEffect, useState } from 'react';
import { Target, Clock } from 'lucide-react';
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

/* ── Inject keyframes (re-injects when colors change) ─── */
const STYLE_ID = 'scrappunk-keyframes';
function ensureKeyframes(colors: { progressCount: string; progressFill: string }) {
    const css = `
    @keyframes scrappunk-spark {
      0% { opacity: 1; transform: translateY(0) scale(1); }
      100% { opacity: 0; transform: translateY(-18px) translateX(4px) scale(0.3); }
    }
    @keyframes scrappunk-flicker {
      0%, 100% { opacity: 0.7; }
      30% { opacity: 1; }
      60% { opacity: 0.5; }
      80% { opacity: 0.9; }
    }
    @keyframes scrappunk-piston {
      0%, 100% { transform: scaleX(1); }
      50% { transform: scaleX(1.06); }
    }
    @keyframes scrappunk-smoke {
      0% { opacity: 0.15; transform: translateY(0) scale(1); }
      50% { opacity: 0.08; transform: translateY(-6px) scale(1.3); }
      100% { opacity: 0; transform: translateY(-14px) scale(1.6); }
    }
    @keyframes scrappunk-counter-glow {
      0%, 100% { box-shadow: inset 0 0 4px ${toRgba(colors.progressCount, 0.2)}, 0 0 3px ${toRgba(colors.progressFill, 0.15)}; }
      50% { box-shadow: inset 0 0 8px ${toRgba(colors.progressCount, 0.4)}, 0 0 8px ${toRgba(colors.progressFill, 0.25)}; }
    }
    `;
    injectDynamicKeyframes(STYLE_ID, css);
}

/* ── Hex bolt decoration ───────────────────────────────── */
interface HexBoltColors { stroke: string; center: string; gradLight: string; gradDark: string }

function HexBolt({ className, size = 12, colors }: { className?: string; size?: number; colors: HexBoltColors }) {
    return (
        <div
            className={cn('absolute z-20', className)}
            style={{ width: size, height: size }}
        >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <polygon
                    points="12,1 22,6.5 22,17.5 12,23 2,17.5 2,6.5"
                    fill="url(#boltGrad)"
                    stroke={colors.stroke}
                    strokeWidth="1.5"
                />
                <circle cx="12" cy="12" r="4" fill={colors.center} />
                <defs>
                    <radialGradient id="boltGrad" cx="40%" cy="35%">
                        <stop offset="0%" stopColor={colors.gradLight} />
                        <stop offset="100%" stopColor={colors.gradDark} />
                    </radialGradient>
                </defs>
            </svg>
        </div>
    );
}

/* ── Side brace decoration ─────────────────────────────── */
interface SideBraceColors { bgTop: string; bgMid: string; borderColor: string; boltColor: string; highlight: string }

function SideBrace({ side, colors }: { side: 'left' | 'right'; colors: SideBraceColors }) {
    const isLeft = side === 'left';
    return (
        <div
            className="absolute top-[10%] bottom-[10%] z-10"
            style={{
                [isLeft ? 'left' : 'right']: -4,
                width: 14,
                background: `linear-gradient(180deg, ${colors.bgTop}, ${colors.bgMid}, ${colors.bgTop})`,
                borderRadius: 3,
                border: `1px solid ${colors.borderColor}`,
                boxShadow: `
                    inset ${isLeft ? '' : '-'}1px 0 1px ${toRgba(colors.highlight, 0.08)},
                    ${isLeft ? '-' : ''}2px 0 4px rgba(0,0,0,0.4)
                `,
            }}
        >
            {/* Brace bolts */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.boltColor, boxShadow: `inset 0 1px 1px ${toRgba(colors.highlight, 0.1)}` }} />
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.boltColor, boxShadow: `inset 0 1px 1px ${toRgba(colors.highlight, 0.1)}` }} />
            {/* Ribbing lines */}
            <div className="absolute top-1/3 left-1 right-1 h-[1px] bg-black/20" />
            <div className="absolute top-1/2 left-1 right-1 h-[1px] bg-black/20" />
            <div className="absolute top-2/3 left-1 right-1 h-[1px] bg-black/20" />
        </div>
    );
}

/* ── Main Scrap Punk Theme Component ───────────────────── */
export default function ThemeScrappunk({ challenge, config, fade }: ThemeRendererProps) {
    const [particlesInit, setParticlesInit] = useState(false);
    const c = config.colors;

    /* Derived structural colors */
    const d = useMemo(() => ({
        cardLighter: lighten(c.cardBackground, 0.12),
        cardDarker: darken(c.cardBackground, 0.18),
        cardDarkAlt: darken(c.cardBackground, 0.08),
        cardVeryDark: darken(c.cardBackground, 0.3),
        cardSubDark: darken(c.cardBackground, 0.15),
        railDark: darken(c.cardBackground, 0.5),
        railDarker: darken(c.cardBackground, 0.65),
        hazardDark: darken(c.cardBackground, 0.35),
        boltDark: darken(c.cardBackground, 0.12),
        borderDark: darken(c.border, 0.35),
        borderMedDark: darken(c.border, 0.25),
        borderLight: lighten(c.border, 0.2),
        borderMed: blend(c.border, c.cardBackground, 0.4),
        flipActive: blend(c.cardBackground, c.border, 0.15),
        flipActiveDark: blend(c.cardBackground, c.border, 0.05),
        rustLight: blend(c.progressFill, c.border, 0.5),
        rustDark: darken(c.border, 0.2),
        sparkColors: [
            c.iconSecondary,
            lighten(c.iconSecondary, 0.2),
            lighten(c.iconPrimary, 0.15),
            darken(c.iconSecondary, 0.15),
        ],
    }), [c]);

    const hexBoltColors: HexBoltColors = useMemo(() => ({
        stroke: c.progressEmpty,
        center: c.cardBackground,
        gradLight: d.borderLight,
        gradDark: d.borderDark,
    }), [c, d]);

    const sideBraceColors: SideBraceColors = useMemo(() => ({
        bgTop: d.borderMed,
        bgMid: d.borderDark,
        borderColor: d.boltDark,
        boltColor: d.boltDark,
        highlight: c.iconPrimary,
    }), [c, d]);

    useEffect(() => {
        ensureKeyframes({ progressCount: c.progressCount, progressFill: c.progressFill });
    }, [c.progressCount, c.progressFill]);

    useEffect(() => {
        initParticlesEngine(async (engine: Engine) => {
            await loadSlim(engine);
        }).then(() => {
            setParticlesInit(true);
        });
    }, []);

    // Orange/amber spark particles
    const particlesConfig = useMemo(() => ({
        particles: {
            number: { value: 14, density: { enable: true, value_area: 250 } },
            color: { value: d.sparkColors },
            shape: { type: 'circle' },
            opacity: { value: 0.9, random: true, anim: { enable: true, speed: 3, opacity_min: 0, sync: false } },
            size: { value: 2.5, random: true, anim: { enable: true, speed: 2, size_min: 0.3, sync: false } },
            move: {
                enable: true,
                speed: 2,
                direction: 'top-right' as const,
                random: true,
                straight: false,
                out_mode: 'out' as const,
                bounce: false,
                attract: { enable: false, rotateX: 600, rotateY: 1200 },
                gravity: { enable: true, acceleration: 2 },
            },
        },
        interactivity: { events: { onhover: { enable: false }, onclick: { enable: false }, resize: { enable: true } } },
        retina_detect: true,
        background: { color: 'transparent' },
    }), [d.sparkColors]);

    const progressPercent = challenge.progress;
    const currentVal = Math.round((progressPercent / 100) * (challenge.subChallenges[0]?.target_limit || 1));
    const targetVal = challenge.subChallenges[0]?.target_limit || 1;
    const rewardValue = challenge.challenge.reward_amount?.trim();

    // Flip-counter digit display: pad with leading zeros for visual
    const counterStr = String(currentVal).padStart(3, '0');
    const targetStr = String(targetVal).padStart(2, '0');
    const allDigits = [...counterStr, ...targetStr];

    // Piston segment progress
    const totalPistons = 10;
    const filledPistons = Math.round((progressPercent / 100) * totalPistons);

    return (
        <div
            className={cn(
                "relative transition-opacity duration-500",
                fade ? "opacity-0" : "opacity-100"
            )}
            style={{
                width: config.layout.width,
                fontFamily: config.fonts.body,
                opacity: config.layout.opacity / 100,
            }}
        >
            {/* Spark particles */}
            <div className="absolute inset-0 pointer-events-none z-50 overflow-visible">
                {particlesInit && (
                    <Particles
                        id="scrappunk-sparks"
                        options={particlesConfig}
                        className="w-full h-full"
                    />
                )}
            </div>

            {/* ── MAIN CHASSIS — Rusted steel ── */}
            <div
                className="relative"
                style={{
                    background: `linear-gradient(170deg, ${d.cardLighter} 0%, ${c.cardBackground} 40%, ${d.cardDarker} 100%)`,
                    borderRadius: config.layout.borderRadius,
                    boxShadow: `
                        inset 0 1px 0 ${toRgba(c.iconPrimary, 0.06)},
                        inset 0 -2px 0 rgba(0,0,0,0.4),
                        0 0 0 2px ${c.progressEmpty},
                        0 0 0 4px ${d.borderDark},
                        0 12px 40px rgba(0,0,0,0.6)
                    `,
                    overflow: 'hidden',
                }}
            >
                {/* Diamond-plate texture overlay */}
                <div
                    className="absolute inset-0 pointer-events-none z-[1] opacity-[0.06]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 2 L14 10 L10 18 L6 10 Z' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E")`,
                        backgroundSize: '20px 20px',
                    }}
                />

                {/* Rust stain patches */}
                <div
                    className="absolute top-0 right-0 w-[40%] h-[30%] pointer-events-none z-[2] opacity-20"
                    style={{
                        background: `radial-gradient(ellipse at 80% 20%, ${d.rustLight}, transparent 70%)`,
                    }}
                />
                <div
                    className="absolute bottom-0 left-0 w-[35%] h-[25%] pointer-events-none z-[2] opacity-15"
                    style={{
                        background: `radial-gradient(ellipse at 20% 80%, ${d.rustDark}, transparent 70%)`,
                    }}
                />

                {/* Side braces */}
                <SideBrace side="left" colors={sideBraceColors} />
                <SideBrace side="right" colors={sideBraceColors} />

                {/* Corner hex bolts */}
                <HexBolt className="top-2 left-3" size={14} colors={hexBoltColors} />
                <HexBolt className="top-2 right-3" size={14} colors={hexBoltColors} />
                <HexBolt className="bottom-2 left-3" size={14} colors={hexBoltColors} />
                <HexBolt className="bottom-2 right-3" size={14} colors={hexBoltColors} />

                {/* ── HAZARD STRIPE BAR ── */}
                <div
                    className="relative mx-5 mt-3 h-5 z-10 overflow-hidden"
                    style={{
                        borderRadius: 2,
                        background: `repeating-linear-gradient(
                            -45deg,
                            ${c.iconPrimary},
                            ${c.iconPrimary} 8px,
                            ${d.hazardDark} 8px,
                            ${d.hazardDark} 16px
                        )`,
                        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15), 0 2px 4px rgba(0,0,0,0.4)',
                    }}
                >
                    {/* Worn texture on stripes */}
                    <div
                        className="absolute inset-0 opacity-20"
                        style={{
                            background: 'linear-gradient(90deg, rgba(0,0,0,0.3), transparent 30%, transparent 70%, rgba(0,0,0,0.3))',
                        }}
                    />
                </div>

                {/* ── TOP SECTION: Title + X/Y ── */}
                <div
                    className="relative z-10 flex justify-between items-start mx-5 mt-2"
                    style={{ padding: '6px 0' }}
                >
                    {/* Left — Challenge title in stamped panel */}
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <span
                            className="uppercase tracking-wider font-extrabold leading-tight truncate"
                            style={{
                                color: c.challengeTitle,
                                fontFamily: config.fonts.title,
                                fontSize: config.fonts.titleSize,
                                textShadow: '0 2px 3px rgba(0,0,0,0.7)',
                                letterSpacing: '0.06em',
                            }}
                        >
                            {challenge.challenge.title}
                        </span>
                        {/* Sub-headline in hazard-yellow stamped tag */}
                        {config.display.showSubChallenges && challenge.subChallenges.length > 0 && (
                            <div
                                className="inline-flex items-center self-start px-2 py-0.5"
                                style={{
                                    background: `linear-gradient(90deg, ${hexAlpha(c.progressCount, 0.8)}, ${c.progressCount})`,
                                    borderRadius: 2,
                                    boxShadow: 'inset 0 -1px 1px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.3)',
                                }}
                            >
                                <span
                                    className="uppercase tracking-wider font-extrabold"
                                    style={{
                                        color: c.progressEmpty,
                                        fontSize: Math.max(8, config.fonts.bodySize - 2),
                                    }}
                                >
                                    {challenge.subChallenges[0]?.title || 'HAZARD'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Right — X/Y in industrial bordered box */}
                    {(config.display.showProgressCount ?? true) && (
                        <div
                            className="flex items-center ml-3 flex-shrink-0 px-3 py-1.5"
                            style={{
                                background: `linear-gradient(180deg, ${c.cardBackground}, ${d.hazardDark})`,
                                border: `2px solid ${c.border}`,
                                borderRadius: 4,
                                boxShadow: `inset 0 2px 4px rgba(0,0,0,0.5), 0 1px 0 ${toRgba(c.iconPrimary, 0.05)}`,
                            }}
                        >
                            <span
                                className="font-extrabold tabular-nums"
                                style={{
                                    fontFamily: config.fonts.title,
                                    color: c.progressCount,
                                    fontSize: Math.max(18, config.fonts.titleSize + 4),
                                    lineHeight: 1,
                                    textShadow: `0 0 6px ${hexAlpha(c.progressCount, 0.38)}`,
                                }}
                            >
                                {currentVal}
                            </span>
                            <span
                                className="mx-1 font-bold"
                                style={{ color: hexAlpha(c.progressCount, 0.72), fontSize: Math.max(15, config.fonts.titleSize + 1) }}
                            >/</span>
                            <span
                                className="font-bold tabular-nums"
                                style={{
                                    color: hexAlpha(c.progressCount, 0.92),
                                    fontSize: Math.max(17, config.fonts.titleSize + 3),
                                    lineHeight: 1,
                                }}
                            >
                                {targetVal}
                            </span>
                        </div>
                    )}
                </div>

                {/* ── PROGRESS BAR — Flip-counter / Piston rail ── */}
                {config.display.showProgressBar && (
                    <div className="relative mx-5 my-2 z-10">
                        {/* Recessed rail container */}
                        <div
                            className="relative h-9 flex items-center overflow-hidden"
                            style={{
                                background: `linear-gradient(180deg, ${d.railDark}, ${d.railDarker}, ${d.railDark})`,
                                border: `2px solid ${c.border}`,
                                borderRadius: 4,
                                boxShadow: `inset 0 3px 8px rgba(0,0,0,0.7), 0 1px 0 ${toRgba(c.iconPrimary, 0.04)}`,
                            }}
                        >
                            {/* Flip-counter digits */}
                            <div className="flex items-center gap-[3px] px-2 h-full w-full">
                                {allDigits.map((digit, i) => {
                                    const isTarget = i >= counterStr.length;
                                    return (
                                        <motion.div
                                            key={i}
                                            className="relative flex items-center justify-center rounded-[2px]"
                                            style={{
                                                flex: 1,
                                                height: '75%',
                                                background: isTarget
                                                    ? `linear-gradient(180deg, ${c.cardBackground}, ${d.cardSubDark})`
                                                    : `linear-gradient(180deg, ${d.flipActive}, ${d.flipActiveDark})`,
                                                border: `1px solid ${isTarget ? d.borderDark : c.border}`,
                                                animationName: !isTarget ? 'scrappunk-counter-glow' : 'none',
                                                animationDuration: '3s',
                                                animationIterationCount: 'infinite',
                                                animationDelay: `${i * 0.2}s`,
                                            }}
                                            initial={{ rotateX: -90 }}
                                            animate={{ rotateX: 0 }}
                                            transition={{ duration: 0.4, delay: i * 0.08 }}
                                        >
                                            {/* Flip divider line */}
                                            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-black/40 z-10" />
                                            <span
                                                className="font-extrabold tabular-nums z-20"
                                                style={{
                                                    fontFamily: config.fonts.title,
                                                    color: isTarget ? hexAlpha(c.progressCount, 0.31) : c.progressCount,
                                                    fontSize: Math.max(14, config.fonts.titleSize),
                                                    textShadow: isTarget ? 'none' : `0 0 6px ${hexAlpha(c.progressCount, 0.31)}`,
                                                }}
                                            >
                                                {digit}
                                            </span>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Piston progress underlayer */}
                            <div className="absolute bottom-0 left-0 right-0 h-[3px] flex gap-[1px] px-1">
                                {Array.from({ length: totalPistons }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="flex-1 rounded-[1px]"
                                        style={{
                                            background: i < filledPistons
                                                ? `linear-gradient(90deg, ${c.progressFill}, ${c.progressCount})`
                                                : c.progressEmpty,
                                            boxShadow: i < filledPistons
                                                ? `0 0 4px ${hexAlpha(c.progressFill, 0.38)}`
                                                : 'none',
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── BOTTOM SECTION: Given By + Reward ── */}
                <div
                    className="relative z-10 flex gap-2 mx-5 mb-3"
                    style={{ padding: '4px 0' }}
                >
                    {/* Given By */}
                    {config.display.showGivenBy && challenge.challenge.given_by && (
                        <div
                            className="flex-1 flex items-center px-3 py-1.5"
                            style={{
                                background: `linear-gradient(180deg, ${d.cardDarkAlt}, ${d.cardVeryDark})`,
                                border: `1px solid ${hexAlpha(c.border, 0.38)}`,
                                borderRadius: 3,
                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                            }}
                        >
                            <div>
                                <div
                                    className="uppercase tracking-wider font-bold"
                                    style={{
                                        color: c.dateText,
                                        fontSize: Math.max(7, config.fonts.bodySize - 4),
                                        letterSpacing: '0.1em',
                                    }}
                                >GIVEN BY</div>
                                <div
                                    className="uppercase tracking-wider font-bold"
                                    style={{
                                        color: c.viewerName,
                                        fontSize: Math.max(9, config.fonts.bodySize - 1),
                                    }}
                                >
                                    {challenge.challenge.given_by}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reward */}
                    {(config.display.showReward ?? true) && (
                        <div
                            className="flex-1 flex items-center px-3 py-1.5"
                            style={{
                                background: `linear-gradient(180deg, ${d.cardDarkAlt}, ${d.cardVeryDark})`,
                                border: `1px solid ${hexAlpha(c.border, 0.38)}`,
                                borderRadius: 3,
                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                            }}
                        >
                            <div>
                                <div
                                    className="uppercase tracking-wider font-bold"
                                    style={{
                                        color: c.dateText,
                                        fontSize: Math.max(7, config.fonts.bodySize - 4),
                                        letterSpacing: '0.1em',
                                    }}
                                >REWARD</div>
                                {rewardValue ? (
                                    <span
                                        className="font-bold uppercase tracking-wider"
                                        style={{ color: c.subchallengeTitle, fontSize: Math.max(9, config.fonts.bodySize - 1) }}
                                    >
                                        {rewardValue}
                                    </span>
                                ) : (
                                    <div className="flex items-center gap-1.5">
                                        {challenge.subChallenges.map((sub) => {
                                            const isCompleted = sub.status === 'completed';
                                            return (
                                                <div key={sub.id} className="flex items-center gap-1">
                                                    <Target
                                                        size={10}
                                                        style={{ color: isCompleted ? c.completedIndicator : c.iconSecondary }}
                                                    />
                                                    <span
                                                        className={cn("font-mono text-[10px] font-bold", isCompleted && "line-through opacity-50")}
                                                        style={{ color: isCompleted ? c.subchallengeCompleted : c.subchallengeTitle }}
                                                    >
                                                        {sub.current_progress}/{sub.target_limit}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Date */}
                    {config.display.showDate && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                            <Clock size={10} style={{ color: c.dateText }} />
                            <span
                                className="uppercase font-bold tracking-wider"
                                style={{ color: c.dateText, fontSize: Math.max(8, config.fonts.bodySize - 3) }}
                            >
                                {challenge.timeLeft}
                            </span>
                        </div>
                    )}
                </div>

                {/* Diesel smoke wisps (decorative) */}
                <div
                    className="absolute bottom-1 right-8 w-6 h-6 rounded-full pointer-events-none z-30"
                    style={{
                        background: `radial-gradient(circle, ${toRgba(c.border, 0.15)}, transparent 70%)`,
                        animationName: 'scrappunk-smoke',
                        animationDuration: '4s',
                        animationIterationCount: 'infinite',
                    }}
                />
                <div
                    className="absolute bottom-1 right-14 w-4 h-4 rounded-full pointer-events-none z-30"
                    style={{
                        background: `radial-gradient(circle, ${toRgba(c.border, 0.1)}, transparent 70%)`,
                        animationName: 'scrappunk-smoke',
                        animationDuration: '5s',
                        animationIterationCount: 'infinite',
                        animationDelay: '1.5s',
                    }}
                />
            </div>
        </div>
    );
}
