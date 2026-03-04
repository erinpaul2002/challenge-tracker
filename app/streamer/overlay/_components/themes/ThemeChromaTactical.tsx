import { useMemo, useEffect, useState } from 'react';
import { Target, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Engine } from '@tsparticles/engine';
import { ThemeRendererProps } from '../../types';
import { darken, lighten, blend, toRgba, hexAlpha, injectDynamicKeyframes } from '../../colorUtils';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/* ── Inject keyframes once ─────────────────────────────── */
const STYLE_ID = 'chroma-keyframes';
function ensureKeyframes(colors: ThemeRendererProps['config']['colors']) {
    const css = `
    @keyframes chroma-data-stream {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(200%); }
    }
    @keyframes chroma-glitch {
      0%, 93%, 100% { opacity: 0; }
      94% { opacity: 0.8; transform: translateX(2px); }
      96% { opacity: 0; }
      97% { opacity: 0.6; transform: translateX(-3px); }
      99% { opacity: 0; }
    }
    @keyframes chroma-neon-pulse-cyan {
      0%, 100% { box-shadow: 0 0 4px ${hexAlpha(colors.iconPrimary, 0.25)}, inset 0 0 4px ${hexAlpha(colors.iconPrimary, 0.06)}; }
      50% { box-shadow: 0 0 12px ${hexAlpha(colors.iconPrimary, 0.5)}, 0 0 24px ${hexAlpha(colors.iconPrimary, 0.13)}, inset 0 0 8px ${hexAlpha(colors.iconPrimary, 0.13)}; }
    }
    @keyframes chroma-neon-pulse-magenta {
      0%, 100% { box-shadow: 0 0 4px ${hexAlpha(colors.iconSecondary, 0.25)}; }
      50% { box-shadow: 0 0 10px ${hexAlpha(colors.iconSecondary, 0.5)}, 0 0 20px ${hexAlpha(colors.iconSecondary, 0.13)}; }
    }
    @keyframes chroma-cell-charge {
      0%, 100% { filter: brightness(1); }
      50% { filter: brightness(1.4); }
    }
    @keyframes chroma-scan {
      0% { top: 0%; }
      100% { top: 100%; }
    }
    `;
    injectDynamicKeyframes(STYLE_ID, css);
}

/* ── Corner notch decoration ───────────────────────────── */
function CornerNotch({ position, colors }: { position: 'tl' | 'tr' | 'bl' | 'br'; colors: ThemeRendererProps['config']['colors'] }) {
    const isTop = position.startsWith('t');
    const isLeft = position.endsWith('l');
    return (
        <div
            className="absolute z-20"
            style={{
                [isTop ? 'top' : 'bottom']: -1,
                [isLeft ? 'left' : 'right']: -1,
                width: 20,
                height: 20,
            }}
        >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path
                    d={
                        isTop && isLeft ? 'M0 8 L0 0 L8 0 L12 4 L4 4 L4 12 L0 8' :
                            isTop && !isLeft ? 'M24 8 L24 0 L16 0 L12 4 L20 4 L20 12 L24 8' :
                                !isTop && isLeft ? 'M0 16 L0 24 L8 24 L12 20 L4 20 L4 12 L0 16' :
                                    'M24 16 L24 24 L16 24 L12 20 L20 20 L20 12 L24 16'
                    }
                    fill={colors.border}
                    stroke={lighten(colors.border, 0.08)}
                    strokeWidth="0.5"
                />
                {/* Small neon dot */}
                <circle
                    cx={isLeft ? 3 : 21}
                    cy={isTop ? 3 : 21}
                    r="1.5"
                    fill={isTop ? colors.iconSecondary : colors.iconPrimary}
                    opacity="0.8"
                />
            </svg>
        </div>
    );
}

/* ── Main Chroma Tactical Theme Component ──────────────── */
export default function ThemeChromaTactical({ challenge, config, fade }: ThemeRendererProps) {
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

    // Glitch/data-particle effects
    const particlesConfig = useMemo(() => ({
        particles: {
            number: { value: 6, density: { enable: true, value_area: 500 } },
            color: { value: [config.colors.iconPrimary, config.colors.iconSecondary] },
            shape: { type: 'square' },
            opacity: { value: 0.7, random: true, anim: { enable: true, speed: 4, opacity_min: 0, sync: false } },
            size: { value: 2, random: true, anim: { enable: true, speed: 1, size_min: 0.5, sync: false } },
            move: {
                enable: true,
                speed: 1.5,
                direction: 'right' as const,
                random: true,
                straight: true,
                out_mode: 'out' as const,
                bounce: false,
                attract: { enable: false, rotateX: 600, rotateY: 1200 },
                gravity: { enable: false },
            },
        },
        interactivity: { events: { onhover: { enable: false }, onclick: { enable: false }, resize: { enable: true } } },
        retina_detect: true,
        background: { color: 'transparent' },
    }), [config.colors.iconPrimary, config.colors.iconSecondary]);

    const progressPercent = challenge.progress;
    const currentVal = Math.round((progressPercent / 100) * (challenge.subChallenges[0]?.target_limit || 1));
    const targetVal = challenge.subChallenges[0]?.target_limit || 1;
    const rewardValue = challenge.challenge.reward_amount?.trim();
    const dimmed = config.colors.dateText;
    const totalCells = 14;
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
            {/* Data-stream particles */}
            <div className="absolute inset-0 pointer-events-none z-50 overflow-visible">
                {particlesInit && (
                    <Particles
                        id="chroma-data-particles"
                        options={particlesConfig}
                        className="w-full h-full"
                    />
                )}
            </div>

            {/* ── MAIN CHASSIS — Carbon-fiber + gunmetal ── */}
            <div
                className="relative"
                style={{
                    background: `linear-gradient(170deg, ${lighten(config.colors.cardBackground, 0.05)} 0%, ${config.colors.cardBackground} 30%, ${darken(config.colors.cardBackground, 0.4)} 100%)`,  
                    borderRadius: config.layout.borderRadius,
                    boxShadow: `
                        inset 0 1px 0 rgba(255,255,255,0.04),
                        inset 0 -1px 0 rgba(0,0,0,0.5),
                        0 0 0 1.5px ${config.colors.border},
                        0 0 0 3px ${darken(config.colors.cardBackground, 0.3)},
                        0 0 20px ${toRgba(config.colors.iconPrimary, 0.08)},
                        0 0 40px ${toRgba(config.colors.iconSecondary, 0.05)},
                        0 12px 40px rgba(0,0,0,0.6)
                    `,
                    overflow: 'hidden',
                }}
            >
                {/* Carbon-fiber weave texture */}
                <div
                    className="absolute inset-0 pointer-events-none z-[1] opacity-[0.04]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='8' height='8' viewBox='0 0 8 8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0 L4 4 M4 0 L0 4 M4 4 L8 8 M8 4 L4 8' stroke='white' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`,
                        backgroundSize: '8px 8px',
                    }}
                />

                {/* Horizontal data-stream lines */}
                <div className="absolute inset-0 pointer-events-none z-[3] overflow-hidden">
                    <div
                        className="absolute h-[1px] w-[40%] top-[25%]"
                        style={{
                            background: `linear-gradient(90deg, transparent, ${config.colors.iconPrimary}40, transparent)`,
                            animationName: 'chroma-data-stream',
                            animationDuration: '4s',
                            animationTimingFunction: 'linear',
                            animationIterationCount: 'infinite',
                        }}
                    />
                    <div
                        className="absolute h-[1px] w-[30%] top-[65%]"
                        style={{
                            background: `linear-gradient(90deg, transparent, ${config.colors.iconSecondary}30, transparent)`,
                            animationName: 'chroma-data-stream',
                            animationDuration: '6s',
                            animationTimingFunction: 'linear',
                            animationIterationCount: 'infinite',
                            animationDelay: '2s',
                        }}
                    />
                    <div
                        className="absolute h-[1px] w-[25%] top-[45%]"
                        style={{
                            background: `linear-gradient(90deg, transparent, ${config.colors.iconPrimary}25, transparent)`,
                            animationName: 'chroma-data-stream',
                            animationDuration: '5s',
                            animationTimingFunction: 'linear',
                            animationIterationCount: 'infinite',
                            animationDelay: '1s',
                        }}
                    />
                </div>

                {/* Glitch overlay */}
                <div
                    className="absolute inset-0 pointer-events-none z-[4]"
                    style={{
                        background: `linear-gradient(0deg, transparent 48%, ${config.colors.iconPrimary}08 49%, transparent 51%)`,
                        animationName: 'chroma-glitch',
                        animationDuration: '8s',
                        animationIterationCount: 'infinite',
                    }}
                />

                {/* Corner notches */}
                <CornerNotch position="tl" colors={config.colors} />
                <CornerNotch position="tr" colors={config.colors} />
                <CornerNotch position="bl" colors={config.colors} />
                <CornerNotch position="br" colors={config.colors} />

                {/* ── NEON ACCENT STRIPS ── */}
                {/* Top magenta strip */}
                <div
                    className="absolute top-0 left-[15%] right-[15%] h-[2px] z-10"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${config.colors.iconSecondary}, transparent)`,
                        animationName: 'chroma-neon-pulse-magenta',
                        animationDuration: '3s',
                        animationIterationCount: 'infinite',
                    }}
                />
                {/* Bottom magenta strip */}
                <div
                    className="absolute bottom-0 left-[20%] right-[20%] h-[2px] z-10"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${config.colors.iconSecondary}80, transparent)`,
                    }}
                />
                {/* Left cyan strip */}
                <div
                    className="absolute top-[20%] left-0 w-[2px] h-[60%] z-10"
                    style={{
                        background: `linear-gradient(180deg, transparent, ${config.colors.iconPrimary}, transparent)`,
                    }}
                />
                {/* Right cyan strip */}
                <div
                    className="absolute top-[20%] right-0 w-[2px] h-[60%] z-10"
                    style={{
                        background: `linear-gradient(180deg, transparent, ${config.colors.iconPrimary}, transparent)`,
                    }}
                />
                {/* Side magenta tabs */}
                <div
                    className="absolute top-[25%] left-0 w-[4px] h-[20%] z-10 rounded-r"
                    style={{
                        background: config.colors.iconSecondary,
                        boxShadow: `0 0 8px ${config.colors.iconSecondary}80`,
                    }}
                />
                <div
                    className="absolute top-[55%] right-0 w-[4px] h-[20%] z-10 rounded-l"
                    style={{
                        background: config.colors.iconSecondary,
                        boxShadow: `0 0 8px ${config.colors.iconSecondary}80`,
                    }}
                />

                {/* ── TITLE SECTION ── */}
                <div
                    className="relative z-10 flex justify-between items-start"
                    style={{ padding: '14px 16px 6px 16px' }}
                >
                    {/* Left — Title + subtitle */}
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <span
                            className="uppercase tracking-wider font-extrabold leading-tight truncate"
                            style={{
                                color: config.colors.challengeTitle,
                                fontFamily: config.fonts.title,
                                fontSize: config.fonts.titleSize,
                                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                            }}
                        >
                            {challenge.challenge.title}
                        </span>
                        {/* Sub-headline with magenta underline */}
                        {config.display.showSubChallenges && challenge.subChallenges.length > 0 && (
                            <div className="flex flex-col gap-0.5">
                                <span
                                    className="uppercase tracking-wider font-bold"
                                    style={{
                                        color: config.colors.subchallengeTitle,
                                        fontSize: Math.max(9, config.fonts.bodySize - 2),
                                        textShadow: `0 0 8px ${config.colors.iconSecondary}40`,
                                    }}
                                >
                                    {challenge.subChallenges[0]?.title || 'OBJECTIVE'}
                                </span>
                                <div
                                    className="w-full h-[1px]"
                                    style={{
                                        background: `linear-gradient(90deg, ${config.colors.iconSecondary}, transparent)`,
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Right — X/Y in neon-bordered HUD display */}
                    {(config.display.showProgressCount ?? true) && (
                        <div
                            className="flex items-center ml-3 flex-shrink-0 px-4 py-2"
                            style={{
                                background: `linear-gradient(180deg, ${lighten(config.colors.cardBackground, 0.02)}, ${darken(config.colors.cardBackground, 0.4)})`,
                                border: `1.5px solid ${config.colors.iconPrimary}60`,
                                borderRadius: 4,
                                animationName: 'chroma-neon-pulse-cyan',
                                animationDuration: '3s',
                                animationIterationCount: 'infinite',
                            }}
                        >
                            <span
                                className="font-extrabold tabular-nums"
                                style={{
                                    fontFamily: config.fonts.title,
                                    color: config.colors.progressCount,
                                    fontSize: Math.max(22, config.fonts.titleSize + 8),
                                    lineHeight: 1,
                                    textShadow: `0 0 10px ${config.colors.progressCount}80, 0 0 20px ${config.colors.progressCount}30`,
                                }}
                            >
                                {currentVal}
                            </span>
                            <span
                                className="mx-1 font-bold"
                                style={{
                                    color: `${config.colors.progressCount}B3`,
                                    fontSize: Math.max(18, config.fonts.titleSize + 4),
                                }}
                            >/</span>
                            <span
                                className="font-bold tabular-nums"
                                style={{
                                    color: config.colors.progressCount,
                                    fontSize: Math.max(20, config.fonts.titleSize + 6),
                                    lineHeight: 1,
                                }}
                            >
                                {targetVal}
                            </span>
                        </div>
                    )}
                </div>

                {/* ── PROGRESS BAR — Neon power-cell channel ── */}
                {config.display.showProgressBar && (
                    <div className="relative mx-4 my-2 z-10">
                        <div
                            className="relative h-8 flex items-center gap-[2px] px-[5px] overflow-hidden"
                            style={{
                                background: `linear-gradient(180deg, ${lighten(config.colors.progressEmpty, 0.01)}, ${darken(config.colors.progressEmpty, 0.2)}, ${lighten(config.colors.progressEmpty, 0.01)})`,
                                border: `1.5px solid ${config.colors.border}`,
                                borderRadius: 6,
                                boxShadow: `inset 0 2px 6px rgba(0,0,0,0.6)`,
                            }}
                        >
                            {/* Neon power cells */}
                            {Array.from({ length: totalCells }).map((_, i) => {
                                const isFilled = i < filledCells;
                                return (
                                    <motion.div
                                        key={i}
                                        className="flex-1 h-[60%] rounded-[2px]"
                                        initial={{ opacity: 0, scale: 0.7 }}
                                        animate={{
                                            opacity: isFilled ? 1 : 0.1,
                                            scale: 1,
                                        }}
                                        transition={{
                                            duration: 0.3,
                                            delay: isFilled ? i * 0.05 : 0,
                                        }}
                                        style={{
                                            background: isFilled
                                                ? `linear-gradient(180deg, ${config.colors.progressFill}, ${darken(config.colors.progressFill, 0.2)}, ${config.colors.progressFill})`
                                                : `linear-gradient(180deg, ${lighten(config.colors.progressEmpty, 0.06)}, ${lighten(config.colors.progressEmpty, 0.04)})`,  
                                            boxShadow: isFilled
                                                ? `0 0 6px ${config.colors.progressFill}80, inset 0 1px 0 rgba(255,255,255,0.2)`
                                                : 'inset 0 1px 2px rgba(0,0,0,0.4)',
                                            animationName: isFilled ? 'chroma-cell-charge' : 'none',
                                            animationDuration: '2s',
                                            animationIterationCount: 'infinite',
                                            animationDelay: `${i * 0.12}s`,
                                        }}
                                    />
                                );
                            })}

                            {/* Magenta accent lines on progress bar sides */}
                            <div
                                className="absolute top-0 bottom-0 left-0 w-[2px] z-10"
                                style={{ background: `${config.colors.iconSecondary}50` }}
                            />
                            <div
                                className="absolute top-0 bottom-0 right-0 w-[2px] z-10"
                                style={{ background: `${config.colors.iconSecondary}50` }}
                            />
                        </div>
                    </div>
                )}

                {/* ── BOTTOM SECTION: Given By + Reward ── */}
                <div
                    className="relative z-10 flex gap-2"
                    style={{ padding: '4px 16px 12px 16px' }}
                >
                    {/* Given By */}
                    {config.display.showGivenBy && challenge.challenge.given_by && (
                        <div
                            className="flex-1 flex items-center px-3 py-1.5"
                            style={{
                                background: `linear-gradient(180deg, ${lighten(config.colors.cardBackground, 0.03)}, ${darken(config.colors.cardBackground, 0.15)})`,  
                                border: `1px solid ${config.colors.border}`,
                                borderRadius: 4,
                                boxShadow: `inset 0 1px 3px rgba(0,0,0,0.5), 0 0 4px ${config.colors.iconSecondary}10`,
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
                                        color: config.colors.viewerName,
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
                                background: `linear-gradient(180deg, ${lighten(config.colors.cardBackground, 0.03)}, ${darken(config.colors.cardBackground, 0.15)})`,  
                                border: `1px solid ${config.colors.border}`,
                                borderRadius: 4,
                                boxShadow: `inset 0 1px 3px rgba(0,0,0,0.5), 0 0 4px ${config.colors.iconSecondary}10`,
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
                                        style={{ color: config.colors.viewerName, fontSize: Math.max(9, config.fonts.bodySize - 1) }}
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

                    {/* Date */}
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
