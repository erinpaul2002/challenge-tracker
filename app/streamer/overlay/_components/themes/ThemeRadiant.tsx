import { useMemo, useEffect, useState } from 'react';
import { Target, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Engine } from '@tsparticles/engine';
import { ThemeRendererProps, OverlayConfig } from '../../types';
import { darken, lighten, toRgba, hexAlpha, injectDynamicKeyframes } from '../../colorUtils';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/* ── Inject keyframes (color-aware) ────────────────────── */
const STYLE_ID = 'radiant-keyframes';
function ensureKeyframes(colors: OverlayConfig['colors']) {
    const css = `
    @keyframes radiant-scanline {
      0% { transform: translateY(-100%); }
      100% { transform: translateY(100%); }
    }
    @keyframes radiant-cell-glow {
      0%, 100% { filter: brightness(1); }
      50% { filter: brightness(1.3); }
    }
    @keyframes radiant-sparkle {
      0%, 100% { opacity: 0; transform: scale(0); }
      50% { opacity: 1; transform: scale(1); }
    }
    @keyframes radiant-top-beam {
      0%, 100% { opacity: 0.3; box-shadow: 0 0 6px ${toRgba(colors.iconPrimary, 0.25)}; }
      50% { opacity: 0.8; box-shadow: 0 0 14px ${toRgba(colors.iconPrimary, 0.5)}; }
    }
    @keyframes radiant-counter-pulse {
      0%, 100% { box-shadow: 0 0 4px ${toRgba(colors.iconSecondary, 0.25)}, inset 0 0 6px rgba(0,0,0,0.3); }
      50% { box-shadow: 0 0 10px ${toRgba(colors.iconSecondary, 0.37)}, 0 0 20px ${toRgba(colors.iconSecondary, 0.13)}, inset 0 0 6px rgba(0,0,0,0.3); }
    }
    `;
    injectDynamicKeyframes(STYLE_ID, css);
}

/* ── Corner screw decoration ───────────────────────────── */
function CornerScrew({ className, colors }: { className?: string; colors: OverlayConfig['colors'] }) {
    return (
        <div
            className={cn('absolute w-3 h-3 rounded-full z-20', className)}
            style={{
                background: `radial-gradient(circle at 40% 35%, ${lighten(colors.border, 0.45)}, ${darken(colors.border, 0.22)}, ${darken(colors.border, 0.45)})`,
                boxShadow: `inset 0 1px 1px rgba(255,255,255,0.4), 0 1px 3px ${toRgba(colors.border, 0.4)}`,
            }}
        >
            {/* Cross-head screw slot */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[5px] h-[1px] bg-black/30 rounded-full" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[1px] h-[5px] bg-black/30 rounded-full" />
            </div>
        </div>
    );
}

/* ── Stepped corner block ──────────────────────────────── */
function SteppedCorner({ position, colors }: { position: 'tl' | 'tr' | 'bl' | 'br'; colors: OverlayConfig['colors'] }) {
    const isTop = position.startsWith('t');
    const isLeft = position.endsWith('l');
    return (
        <div
            className="absolute z-10"
            style={{
                [isTop ? 'top' : 'bottom']: -2,
                [isLeft ? 'left' : 'right']: -2,
                width: 18,
                height: 18,
            }}
        >
            {/* stepped block shape via overlapping rectangles */}
            <div
                className="absolute"
                style={{
                    [isTop ? 'top' : 'bottom']: 0,
                    [isLeft ? 'left' : 'right']: 0,
                    width: 14,
                    height: 14,
                    background: `linear-gradient(135deg, ${lighten(colors.border, 0.5)}, ${lighten(colors.border, 0.15)})`,
                    borderRadius: isTop && isLeft ? '6px 2px 2px 2px'
                        : isTop && !isLeft ? '2px 6px 2px 2px'
                            : !isTop && isLeft ? '2px 2px 2px 6px'
                                : '2px 2px 6px 2px',
                    boxShadow: `inset 0 1px 1px rgba(255,255,255,0.3), 0 1px 3px ${toRgba(colors.border, 0.3)}`,
                }}
            />
            <div
                className="absolute"
                style={{
                    [isTop ? 'top' : 'bottom']: 4,
                    [isLeft ? 'left' : 'right']: 4,
                    width: 10,
                    height: 10,
                    background: `linear-gradient(135deg, ${lighten(colors.border, 0.3)}, ${colors.border})`,
                    borderRadius: 2,
                    boxShadow: 'inset 0 -1px 1px rgba(0,0,0,0.2)',
                }}
            />
        </div>
    );
}

/* ── Main Radiant Arcade Theme Component ───────────────── */
export default function ThemeRadiant({ challenge, config, fade }: ThemeRendererProps) {
    const [particlesInit, setParticlesInit] = useState(false);

    useEffect(() => {
        ensureKeyframes(config.colors);
    }, [config.colors]);

    useEffect(() => {
        initParticlesEngine(async (engine: Engine) => {
            await loadSlim(engine);
        }).then(() => {
            setParticlesInit(true);
        });
    }, []);

    const colors = config.colors;

    // Pixel sparkle particles
    const particlesConfig = useMemo(() => ({
        particles: {
            number: { value: 10, density: { enable: true, value_area: 400 } },
            color: { value: ['#ffffff', colors.iconPrimary, colors.progressFill] },
            shape: { type: 'star' },
            opacity: { value: 0.8, random: true, anim: { enable: true, speed: 3, opacity_min: 0, sync: false } },
            size: { value: 3, random: true, anim: { enable: true, speed: 2, size_min: 0.5, sync: false } },
            move: {
                enable: true,
                speed: 0.5,
                direction: 'top' as const,
                random: true,
                straight: false,
                out_mode: 'out' as const,
                bounce: false,
                attract: { enable: false, rotateX: 600, rotateY: 1200 },
                gravity: { enable: false },
            },
        },
        interactivity: { events: { onhover: { enable: false }, onclick: { enable: false }, resize: { enable: true } } },
        retina_detect: true,
        background: { color: 'transparent' },
    }), [colors.iconPrimary, colors.progressFill]);

    const progressPercent = challenge.progress;
    const currentVal = Math.round((progressPercent / 100) * (challenge.subChallenges[0]?.target_limit || 1));
    const targetVal = challenge.subChallenges[0]?.target_limit || 1;
    const rewardValue = challenge.challenge.reward_amount?.trim();
    const dimmed = colors.dateText;
    const totalCells = 16;
    const filledCells = Math.round((progressPercent / 100) * totalCells);

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
            {/* Sparkle particles above the card */}
            <div className="absolute -top-6 left-0 right-0 h-12 pointer-events-none z-50 overflow-visible">
                {particlesInit && (
                    <Particles
                        id="radiant-sparkles"
                        options={particlesConfig}
                        className="w-full h-full"
                    />
                )}
            </div>

            {/* ── MAIN CHASSIS — Glossy white polymer ── */}
            <div
                className="relative"
                style={{
                    background: `linear-gradient(180deg, ${lighten(colors.cardBackground, 0.15)} 0%, ${colors.cardBackground} 30%, ${darken(colors.cardBackground, 0.05)} 100%)`,
                    borderRadius: config.layout.borderRadius,
                    boxShadow: `
                        inset 0 2px 0 rgba(255,255,255,0.6),
                        inset 0 -2px 2px rgba(0,0,0,0.15),
                        0 0 0 1.5px ${config.colors.border},
                        0 8px 30px rgba(0,0,0,0.4),
                        0 2px 8px rgba(0,0,0,0.3)
                    `,
                    overflow: 'hidden',
                }}
            >
                {/* Glossy highlight reflection */}
                <div
                    className="absolute top-0 left-0 right-0 h-[40%] pointer-events-none z-[1]"
                    style={{
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 60%, transparent 100%)',
                        borderRadius: `${config.layout.borderRadius}px ${config.layout.borderRadius}px 0 0`,
                    }}
                />

                {/* CRT scanline overlay */}
                <div
                    className="absolute inset-0 pointer-events-none z-[2] opacity-[0.03]"
                    style={{
                        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
                        animation: 'radiant-scanline 8s linear infinite',
                    }}
                />

                {/* Top center beam accent */}
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-[3px] rounded-b z-20"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${config.colors.iconPrimary}, transparent)`,
                        animation: 'radiant-top-beam 3s infinite',
                    }}
                />

                {/* Stepped corner blocks */}
                <SteppedCorner position="tl" colors={colors} />
                <SteppedCorner position="tr" colors={colors} />
                <SteppedCorner position="bl" colors={colors} />
                <SteppedCorner position="br" colors={colors} />

                {/* Corner screws */}
                <CornerScrew className="top-3 left-3" colors={colors} />
                <CornerScrew className="top-3 right-3" colors={colors} />
                <CornerScrew className="bottom-3 left-3" colors={colors} />
                <CornerScrew className="bottom-3 right-3" colors={colors} />

                {/* Cyan accent strips on sides */}
                <div className="absolute top-[30%] left-0 w-[3px] h-[40%] z-10" style={{ background: `linear-gradient(180deg, transparent, ${hexAlpha(colors.iconPrimary, 0.5)}, transparent)` }} />
                <div className="absolute top-[30%] right-0 w-[3px] h-[40%] z-10" style={{ background: `linear-gradient(180deg, transparent, ${hexAlpha(colors.iconPrimary, 0.5)}, transparent)` }} />

                {/* ── INNER DARK PANEL ── */}
                <div
                    className="relative mx-4 mt-4 mb-2 z-10"
                    style={{
                        background: `linear-gradient(180deg, ${colors.progressEmpty}, ${darken(colors.progressEmpty, 0.2)}, ${colors.progressEmpty})`,
                        borderRadius: 6,
                        border: `1px solid ${lighten(colors.progressEmpty, 0.15)}`,
                        boxShadow: `inset 0 2px 6px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.1)`,
                        padding: '10px 14px',
                    }}
                >
                    {/* ── Top row: Challenge Name + X/Y ── */}
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                            <span
                                className="uppercase tracking-wider font-extrabold leading-tight truncate"
                                style={{
                                    color: colors.challengeTitle,
                                    fontFamily: config.fonts.title,
                                    fontSize: config.fonts.titleSize,
                                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.6)',
                                }}
                            >
                                {challenge.challenge.title}
                            </span>
                            {/* Sub-headline label */}
                            {config.display.showSubChallenges && challenge.subChallenges.length > 0 && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div
                                        className="w-3 h-[2px] rounded-full"
                                        style={{ background: config.colors.iconSecondary }}
                                    />
                                    <span
                                        className="uppercase tracking-wider font-bold"
                                        style={{
                                            color: colors.subchallengeTitle,
                                            fontSize: Math.max(8, config.fonts.bodySize - 3),
                                        }}
                                    >
                                        {challenge.subChallenges[0]?.title || 'OBJECTIVE'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* X/Y Counter — Dot-matrix LED style */}
                        {(config.display.showProgressCount ?? true) && (
                            <div
                                className="flex items-center gap-0 ml-3 flex-shrink-0 px-3 py-1.5"
                                style={{
                                    background: `linear-gradient(180deg, ${darken(colors.progressEmpty, 0.25)}, ${darken(colors.progressEmpty, 0.5)})`,
                                    border: `1.5px solid ${hexAlpha(colors.progressCount, 0.5)}`,
                                    borderRadius: 4,
                                    animation: 'radiant-counter-pulse 3s infinite',
                                }}
                            >
                                <span
                                    className="font-extrabold tabular-nums"
                                    style={{
                                        fontFamily: config.fonts.title,
                                        color: config.colors.progressCount,
                                        fontSize: Math.max(18, config.fonts.titleSize + 4),
                                        lineHeight: 1,
                                        textShadow: `0 0 8px ${toRgba(colors.progressCount, 0.5)}`,
                                        letterSpacing: '0.05em',
                                    }}
                                >
                                    {currentVal}
                                </span>
                                <span
                                    className="mx-0.5 font-bold"
                                    style={{
                                        color: hexAlpha(colors.progressCount, 0.72),
                                        fontSize: Math.max(16, config.fonts.titleSize + 2),
                                    }}
                                >/</span>
                                <span
                                    className="font-bold tabular-nums"
                                    style={{
                                        color: hexAlpha(colors.progressCount, 0.92),
                                        fontSize: Math.max(17, config.fonts.titleSize + 3),
                                        lineHeight: 1,
                                    }}
                                >
                                    {targetVal}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Dot-matrix sub-count indicator (small dots between rows) */}
                    {config.display.showSubChallenges && challenge.subChallenges.length > 0 && (
                        <div className="flex items-center justify-center gap-2 mt-2 mb-1">
                            {challenge.subChallenges.map((sub) => (
                                <div key={sub.id} className="flex items-center gap-1">
                                    {Array.from({ length: sub.target_limit }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-1.5 h-1.5 rounded-[1px]"
                                            style={{
                                                backgroundColor: i < sub.current_progress
                                                    ? config.colors.iconSecondary
                                                    : lighten(colors.progressEmpty, 0.15),
                                                boxShadow: i < sub.current_progress
                                                    ? `0 0 3px ${toRgba(colors.iconSecondary, 0.37)}`
                                                    : 'none',
                                            }}
                                        />
                                    ))}
                                    <span
                                        className="text-[9px] font-bold ml-0.5"
                                        style={{ color: config.colors.iconSecondary }}
                                    >
                                        ×
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Progress bar — Modular light cells ── */}
                {config.display.showProgressBar && (
                    <div className="relative mx-4 mb-2 z-10">
                        {/* Diffuser channel container */}
                        <div
                            className="relative h-8 flex items-center gap-[2px] px-[4px] overflow-hidden"
                            style={{
                                background: `linear-gradient(180deg, ${darken(colors.progressEmpty, 0.25)}, ${darken(colors.progressEmpty, 0.4)}, ${darken(colors.progressEmpty, 0.25)})`,
                                borderRadius: 5,
                                border: `1px solid ${lighten(colors.progressEmpty, 0.15)}`,
                                boxShadow: `inset 0 2px 6px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.1)`,
                            }}
                        >
                            {/* Cyan accent lines at sides of progress bar */}
                            <div
                                className="absolute top-1 bottom-1 left-0 w-[2px] rounded-r z-10"
                                style={{ background: hexAlpha(colors.iconPrimary, 0.37) }}
                            />
                            <div
                                className="absolute top-1 bottom-1 right-0 w-[2px] rounded-l z-10"
                                style={{ background: hexAlpha(colors.iconPrimary, 0.37) }}
                            />

                            {/* Light cells */}
                            {Array.from({ length: totalCells }).map((_, i) => {
                                const isFilled = i < filledCells;
                                return (
                                    <motion.div
                                        key={i}
                                        className="flex-1 h-[65%] rounded-[2px]"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{
                                            opacity: isFilled ? 1 : 0.15,
                                            scale: 1,
                                        }}
                                        transition={{
                                            duration: 0.3,
                                            delay: isFilled ? i * 0.05 : 0,
                                        }}
                                        style={{
                                            background: isFilled
                                                ? `linear-gradient(180deg, ${colors.progressFill}, ${darken(colors.progressFill, 0.1)}, ${colors.progressFill})`
                                                : `linear-gradient(180deg, ${colors.progressEmpty}, ${darken(colors.progressEmpty, 0.15)})`,
                                            boxShadow: isFilled
                                                ? `0 0 6px ${toRgba(colors.progressFill, 0.5)}, inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.2)`
                                                : 'inset 0 1px 2px rgba(0,0,0,0.3)',
                                            animationName: isFilled ? 'radiant-cell-glow' : 'none',
                                            animationDuration: '2s',
                                            animationIterationCount: 'infinite',
                                            animationDelay: `${i * 0.1}s`,
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── Bottom row: Given By + Reward ── */}
                <div className="flex gap-2 mx-4 mb-4 z-10 relative">
                    {/* Given By */}
                    {config.display.showGivenBy && challenge.challenge.given_by && (
                        <div
                            className="flex-1 flex items-center px-3 py-1.5"
                            style={{
                                background: `linear-gradient(180deg, ${lighten(colors.cardBackground, 0.1)}, ${darken(colors.cardBackground, 0.05)})`,
                                borderRadius: 5,
                                border: `1px solid ${colors.border}`,
                                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.5), 0 1px 3px ${toRgba(colors.border, 0.15)}`,
                            }}
                        >
                            <div>
                                <div
                                    className="uppercase tracking-wider font-bold"
                                    style={{
                                        color: dimmed,
                                        fontSize: Math.max(7, config.fonts.bodySize - 4),
                                        letterSpacing: '0.1em',
                                    }}
                                >GIVEN BY</div>
                                <div
                                    className="uppercase tracking-wider font-bold"
                                    style={{
                                        color: colors.viewerName,
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
                                background: `linear-gradient(180deg, ${lighten(colors.cardBackground, 0.1)}, ${darken(colors.cardBackground, 0.05)})`,
                                borderRadius: 5,
                                border: `1px solid ${colors.border}`,
                                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.5), 0 1px 3px ${toRgba(colors.border, 0.15)}`,
                            }}
                        >
                            <div>
                                <div
                                    className="uppercase tracking-wider font-bold"
                                    style={{
                                        color: dimmed,
                                        fontSize: Math.max(7, config.fonts.bodySize - 4),
                                        letterSpacing: '0.1em',
                                    }}
                                >REWARD</div>
                                {rewardValue ? (
                                    <span
                                        className="font-bold uppercase tracking-wider"
                                        style={{ color: colors.viewerName, fontSize: Math.max(9, config.fonts.bodySize - 1) }}
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
                                                        style={{ color: isCompleted ? config.colors.completedIndicator : config.colors.iconSecondary }}
                                                    />
                                                    <span
                                                        className={cn("font-mono text-[10px] font-bold", isCompleted && "line-through opacity-50")}
                                                        style={{ color: isCompleted ? config.colors.subchallengeCompleted : config.colors.challengeTitle }}
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

                    {/* Date display */}
                    {config.display.showDate && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                            <Clock size={10} style={{ color: dimmed }} />
                            <span
                                className="uppercase font-bold tracking-wider"
                                style={{ color: dimmed, fontSize: Math.max(8, config.fonts.bodySize - 3) }}
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
