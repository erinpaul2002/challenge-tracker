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

/* ── Inject keyframes (color-aware) ───────────────────── */
const STYLE_ID = 'araxys-keyframes';
function ensureKeyframes(colors: { iconPrimary: string }) {
    const ip = colors.iconPrimary;
    const css = `
    @keyframes araxys-energy-sweep {
      0% { transform: translateX(-120%); }
      100% { transform: translateX(250%); }
    }
    @keyframes araxys-arc-crackle {
      0%, 100% { opacity: 0.3; transform: scaleX(1); }
      15% { opacity: 1; transform: scaleX(1.05); }
      30% { opacity: 0.5; transform: scaleX(0.98); }
      45% { opacity: 0.9; transform: scaleX(1.02); }
      60% { opacity: 0.4; transform: scaleX(1); }
      75% { opacity: 0.8; transform: scaleX(1.03); }
      90% { opacity: 0.35; transform: scaleX(0.99); }
    }
    @keyframes araxys-scale-breathe {
      0%, 100% { transform: scale(1); opacity: 0.06; }
      50% { transform: scale(1.01); opacity: 0.09; }
    }
    @keyframes araxys-seam-glow {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 0.9; }
    }
    @keyframes araxys-vent-flare {
      0%, 85%, 100% { opacity: 0; transform: scaleY(0.5); }
      90% { opacity: 0.8; transform: scaleY(1); }
      95% { opacity: 0.5; transform: scaleY(0.8); }
    }
    @keyframes araxys-holo-pulse {
      0%, 100% { text-shadow: 0 0 8px ${hexAlpha(ip, 0.5)}, 0 0 16px ${hexAlpha(ip, 0.19)}; }
      50% { text-shadow: 0 0 14px ${hexAlpha(ip, 0.75)}, 0 0 28px ${hexAlpha(ip, 0.38)}, 0 0 40px ${hexAlpha(ip, 0.13)}; }
    }
    @keyframes araxys-corner-glow {
      0%, 100% { box-shadow: 0 0 4px ${hexAlpha(ip, 0.25)}; }
      50% { box-shadow: 0 0 10px ${hexAlpha(ip, 0.5)}, 0 0 20px ${hexAlpha(ip, 0.19)}; }
    }
    `;
    injectDynamicKeyframes(STYLE_ID, css);
}

/* ── Corner wedge decorations ─────────────────────────── */
function AlienCorner({ position, colors }: {
    position: 'tl' | 'tr' | 'bl' | 'br';
    colors: { wedgeFill: string; wedgeStroke: string; accent: string };
}) {
    const isTop = position.startsWith('t');
    const isLeft = position.endsWith('l');
    return (
        <div
            className="absolute z-20"
            style={{
                [isTop ? 'top' : 'bottom']: -1,
                [isLeft ? 'left' : 'right']: -1,
                width: 24,
                height: 24,
            }}
        >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                {/* Angular alien-tech wedge */}
                <path
                    d={
                        isTop && isLeft ? 'M0 10 L0 0 L10 0 L14 3 L3 3 L3 14 L0 10' :
                            isTop && !isLeft ? 'M24 10 L24 0 L14 0 L10 3 L21 3 L21 14 L24 10' :
                                !isTop && isLeft ? 'M0 14 L0 24 L10 24 L14 21 L3 21 L3 10 L0 14' :
                                    'M24 14 L24 24 L14 24 L10 21 L21 21 L21 10 L24 14'
                    }
                    fill={colors.wedgeFill}
                    stroke={colors.wedgeStroke}
                    strokeWidth="0.5"
                />
                {/* Triangular scale accent */}
                <path
                    d={
                        isTop && isLeft ? 'M1 1 L6 1 L1 6 Z' :
                            isTop && !isLeft ? 'M23 1 L18 1 L23 6 Z' :
                                !isTop && isLeft ? 'M1 23 L6 23 L1 18 Z' :
                                    'M23 23 L18 23 L23 18 Z'
                    }
                    fill={colors.accent}
                    opacity="0.6"
                />
                {/* Amber glow dot */}
                <circle
                    cx={isLeft ? 4 : 20}
                    cy={isTop ? 4 : 20}
                    r="1.5"
                    fill={colors.accent}
                    opacity="0.9"
                />
            </svg>
        </div>
    );
}

/* ── Main Araxys Alien Theme Component ─────────────────── */
export default function ThemeAraxys({ challenge, config, fade }: ThemeRendererProps) {
    const [particlesInit, setParticlesInit] = useState(false);

    useEffect(() => {
        ensureKeyframes({ iconPrimary: config.colors.iconPrimary });
    }, [config.colors.iconPrimary]);

    useEffect(() => {
        initParticlesEngine(async (engine: Engine) => {
            await loadSlim(engine);
        }).then(() => {
            setParticlesInit(true);
        });
    }, []);

    // Ambient glowing amber/orange dust particles
    const particlesConfig = useMemo(() => ({
        particles: {
            number: { value: 8, density: { enable: true, value_area: 600 } },
            color: { value: [config.colors.iconPrimary, config.colors.iconSecondary, lighten(config.colors.iconPrimary, 0.25)] },
            shape: { type: 'circle' },
            opacity: { value: 0.6, random: true, anim: { enable: true, speed: 2, opacity_min: 0, sync: false } },
            size: { value: 2, random: true, anim: { enable: true, speed: 0.8, size_min: 0.3, sync: false } },
            move: {
                enable: true,
                speed: 0.8,
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
    }), [config.colors.iconPrimary, config.colors.iconSecondary]);

    const progressPercent = challenge.progress;
    const currentVal = Math.round((progressPercent / 100) * (challenge.subChallenges[0]?.target_limit || 1));
    const targetVal = challenge.subChallenges[0]?.target_limit || 1;
    const rewardValue = challenge.challenge.reward_amount?.trim();
    const dimmed = config.colors.dateText;
    const cornerColors = {
        wedgeFill: lighten(config.colors.cardBackground, 0.12),
        wedgeStroke: config.colors.border,
        accent: config.colors.iconPrimary,
    };

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
            {/* Ambient particle dust */}
            <div className="absolute inset-0 pointer-events-none z-50 overflow-visible">
                {particlesInit && (
                    <Particles
                        id="araxys-dust-particles"
                        options={particlesConfig}
                        className="w-full h-full"
                    />
                )}
            </div>

            {/* ── MAIN CHASSIS — Dark bronze alien alloy ── */}
            <div
                className="relative"
                style={{
                    background: `linear-gradient(165deg, ${lighten(config.colors.cardBackground, 0.08)} 0%, ${config.colors.cardBackground} 35%, ${darken(config.colors.cardBackground, 0.35)} 100%)`,
                    borderRadius: config.layout.borderRadius,
                    boxShadow: `
                        inset 0 1px 0 ${toRgba(lighten(config.colors.iconPrimary, 0.4), 0.06)},
                        inset 0 -1px 0 rgba(0,0,0,0.6),
                        0 0 0 1.5px ${config.colors.border},
                        0 0 0 3px ${darken(config.colors.cardBackground, 0.55)},
                        0 0 20px ${toRgba(config.colors.iconPrimary, 0.1)},
                        0 0 40px ${toRgba(config.colors.iconSecondary, 0.05)},
                        0 12px 40px rgba(0,0,0,0.7)
                    `,
                    overflow: 'hidden',
                }}
            >
                {/* Interlocking triangular scale texture overlay */}
                <div
                    className="absolute inset-0 pointer-events-none z-[1]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 12 L12 0 L24 12 L12 24Z' fill='none' stroke='${config.colors.iconPrimary.replace('#', '%23')}' stroke-width='0.3' opacity='0.12'/%3E%3Cpath d='M6 6 L12 0 L18 6 L12 12Z' fill='none' stroke='${config.colors.iconSecondary.replace('#', '%23')}' stroke-width='0.2' opacity='0.08'/%3E%3C/svg%3E")`,
                        backgroundSize: '24px 24px',
                        animationName: 'araxys-scale-breathe',
                        animationDuration: '6s',
                        animationIterationCount: 'infinite',
                    }}
                />

                {/* Diagonal plate seam lines */}
                <div className="absolute inset-0 pointer-events-none z-[2] overflow-hidden">
                    {/* Top-left to mid seam */}
                    <div
                        className="absolute w-[60%] h-[1px]"
                        style={{
                            top: '30%',
                            left: '-5%',
                            background: `linear-gradient(90deg, transparent, ${config.colors.iconPrimary}30, ${config.colors.iconPrimary}15, transparent)`,
                            transform: 'rotate(-2deg)',
                            animationName: 'araxys-seam-glow',
                            animationDuration: '4s',
                            animationIterationCount: 'infinite',
                        }}
                    />
                    {/* Bottom-right seam */}
                    <div
                        className="absolute w-[50%] h-[1px]"
                        style={{
                            bottom: '35%',
                            right: '-5%',
                            background: `linear-gradient(90deg, transparent, ${config.colors.iconSecondary}25, transparent)`,
                            transform: 'rotate(1.5deg)',
                            animationName: 'araxys-seam-glow',
                            animationDuration: '5s',
                            animationIterationCount: 'infinite',
                            animationDelay: '2s',
                        }}
                    />
                </div>

                {/* Scale vent flares on perimeter */}
                <div className="absolute inset-0 pointer-events-none z-[3] overflow-hidden">
                    {[15, 40, 70, 90].map((pos, i) => (
                        <div
                            key={i}
                            className="absolute"
                            style={{
                                left: `${pos}%`,
                                top: -2,
                                width: 16,
                                height: 8,
                                background: `radial-gradient(ellipse at center bottom, ${config.colors.iconPrimary}60, transparent)`,
                                animationName: 'araxys-vent-flare',
                                animationDuration: `${3 + i * 0.8}s`,
                                animationIterationCount: 'infinite',
                                animationDelay: `${i * 1.2}s`,
                                transformOrigin: 'center bottom',
                            }}
                        />
                    ))}
                </div>

                {/* Corner wedge decorations */}
                <AlienCorner position="tl" colors={cornerColors} />
                <AlienCorner position="tr" colors={cornerColors} />
                <AlienCorner position="bl" colors={cornerColors} />
                <AlienCorner position="br" colors={cornerColors} />

                {/* ── AMBER SEAM-CHANNEL ACCENT STRIPS ── */}
                {/* Top amber channel */}
                <div
                    className="absolute top-0 left-[12%] right-[12%] h-[2px] z-10"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${config.colors.iconPrimary}90, ${config.colors.iconSecondary}70, transparent)`,
                        animationName: 'araxys-seam-glow',
                        animationDuration: '3s',
                        animationIterationCount: 'infinite',
                    }}
                />
                {/* Bottom amber channel */}
                <div
                    className="absolute bottom-0 left-[18%] right-[18%] h-[2px] z-10"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${config.colors.iconSecondary}60, transparent)`,
                    }}
                />
                {/* Left side amber strip */}
                <div
                    className="absolute top-[15%] left-0 w-[2px] h-[70%] z-10"
                    style={{
                        background: `linear-gradient(180deg, transparent, ${config.colors.iconPrimary}80, transparent)`,
                    }}
                />
                {/* Right side amber strip */}
                <div
                    className="absolute top-[15%] right-0 w-[2px] h-[70%] z-10"
                    style={{
                        background: `linear-gradient(180deg, transparent, ${config.colors.iconPrimary}80, transparent)`,
                    }}
                />
                {/* Side amber tabs — alien scale vents */}
                <div
                    className="absolute top-[22%] left-0 w-[4px] h-[18%] z-10 rounded-r"
                    style={{
                        background: `linear-gradient(180deg, ${config.colors.iconPrimary}, ${config.colors.iconSecondary})`,
                        boxShadow: `0 0 8px ${config.colors.iconPrimary}80`,
                        animationName: 'araxys-corner-glow',
                        animationDuration: '3s',
                        animationIterationCount: 'infinite',
                    }}
                />
                <div
                    className="absolute top-[58%] right-0 w-[4px] h-[18%] z-10 rounded-l"
                    style={{
                        background: `linear-gradient(180deg, ${config.colors.iconSecondary}, ${config.colors.iconPrimary})`,
                        boxShadow: `0 0 8px ${config.colors.iconPrimary}80`,
                        animationName: 'araxys-corner-glow',
                        animationDuration: '3s',
                        animationIterationCount: 'infinite',
                        animationDelay: '1.5s',
                    }}
                />

                {/* ── TITLE SECTION ── */}
                <div
                    className="relative z-10 flex justify-between items-start"
                    style={{ padding: '14px 16px 6px 16px' }}
                >
                    {/* Left — Title + sub-objective */}
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <span
                            className="uppercase tracking-wider font-extrabold leading-tight truncate"
                            style={{
                                color: config.colors.challengeTitle,
                                fontFamily: config.fonts.title,
                                fontSize: config.fonts.titleSize,
                                textShadow: '0 1px 4px rgba(0,0,0,0.9)',
                                letterSpacing: '0.08em',
                            }}
                        >
                            {challenge.challenge.title}
                        </span>
                        {/* Sub-headline with amber underline */}
                        {config.display.showSubChallenges && challenge.subChallenges.length > 0 && (
                            <div className="flex flex-col gap-0.5">
                                <span
                                    className="uppercase tracking-wider font-bold"
                                    style={{
                                        color: config.colors.subchallengeTitle,
                                        fontSize: Math.max(9, config.fonts.bodySize - 2),
                                        textShadow: `0 0 8px ${config.colors.iconPrimary}30`,
                                    }}
                                >
                                    {challenge.subChallenges[0]?.title || 'OBJECTIVE'}
                                </span>
                                <div
                                    className="w-full h-[1px]"
                                    style={{
                                        background: `linear-gradient(90deg, ${config.colors.iconPrimary}80, ${config.colors.iconSecondary}40, transparent)`,
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Right — X/Y holographic hard-light display */}
                    {(config.display.showProgressCount ?? true) && (
                        <div
                            className="flex items-center ml-3 flex-shrink-0 px-4 py-2"
                            style={{
                                background: `linear-gradient(180deg, ${darken(config.colors.cardBackground, 0.1)}, ${darken(config.colors.cardBackground, 0.4)})`,
                                border: `1.5px solid ${config.colors.iconPrimary}50`,
                                borderRadius: 4,
                                boxShadow: `
                                inset 0 0 8px ${config.colors.iconPrimary}10,
                                0 0 6px ${config.colors.iconPrimary}20
                            `,
                            }}
                        >
                            <span
                                className="font-extrabold tabular-nums"
                                style={{
                                    fontFamily: config.fonts.title,
                                    color: config.colors.progressCount,
                                    fontSize: Math.max(22, config.fonts.titleSize + 8),
                                    lineHeight: 1,
                                    animationName: 'araxys-holo-pulse',
                                    animationDuration: '3s',
                                    animationIterationCount: 'infinite',
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

                {/* ── PROGRESS BAR — Crackling orange energy beam ── */}
                {config.display.showProgressBar && (
                    <div className="relative mx-4 my-2 z-10">
                        <div
                            className="relative h-8 overflow-hidden"
                            style={{
                                background: `linear-gradient(180deg, ${lighten(config.colors.progressEmpty, 0.06)}, ${darken(config.colors.progressEmpty, 0.08)}, ${lighten(config.colors.progressEmpty, 0.06)})`,
                                border: `1.5px solid ${config.colors.border}`,
                                borderRadius: 6,
                                boxShadow: `
                                    inset 0 2px 8px rgba(0,0,0,0.7),
                                    0 0 0 1px ${darken(config.colors.cardBackground, 0.65)}
                                `,
                            }}
                        >
                            {/* Amber channel borders inside */}
                            <div
                                className="absolute top-0 left-0 right-0 h-[1px] z-10"
                                style={{
                                    background: `linear-gradient(90deg, ${config.colors.iconPrimary}40, ${config.colors.iconPrimary}15, ${config.colors.iconPrimary}40)`,
                                }}
                            />
                            <div
                                className="absolute bottom-0 left-0 right-0 h-[1px] z-10"
                                style={{
                                    background: `linear-gradient(90deg, ${config.colors.iconPrimary}40, ${config.colors.iconPrimary}15, ${config.colors.iconPrimary}40)`,
                                }}
                            />

                            {/* Energy beam fill */}
                            <motion.div
                                className="absolute top-[15%] bottom-[15%] left-[3px] rounded-[3px]"
                                initial={{ width: '0%' }}
                                animate={{ width: `${Math.max(progressPercent, 2)}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                style={{
                                    background: `linear-gradient(180deg,
                                        ${config.colors.progressFill}e0,
                                        ${config.colors.iconPrimary},
                                        ${config.colors.progressFill}c0
                                    )`,
                                    boxShadow: `
                                        0 0 8px ${config.colors.progressFill}90,
                                        0 0 16px ${config.colors.progressFill}40,
                                        0 0 30px ${config.colors.progressFill}20,
                                        inset 0 1px 0 rgba(255,255,255,0.25)
                                    `,
                                }}
                            >
                                {/* Electric arc crackle overlay */}
                                <div
                                    className="absolute inset-0 rounded-[3px] overflow-hidden"
                                    style={{
                                        background: `
                                            repeating-linear-gradient(90deg,
                                                transparent 0px,
                                                rgba(255,255,255,0.15) 1px,
                                                transparent 2px,
                                                transparent 6px
                                            )
                                        `,
                                        animationName: 'araxys-arc-crackle',
                                        animationDuration: '1.5s',
                                        animationIterationCount: 'infinite',
                                    }}
                                />
                                {/* Bright energy sweep */}
                                <div
                                    className="absolute inset-0 overflow-hidden rounded-[3px]"
                                >
                                    <div
                                        className="absolute inset-y-0 w-[30%]"
                                        style={{
                                            background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)`,
                                            animationName: 'araxys-energy-sweep',
                                            animationDuration: '2.5s',
                                            animationTimingFunction: 'linear',
                                            animationIterationCount: 'infinite',
                                        }}
                                    />
                                </div>
                            </motion.div>

                            {/* Side accent bars */}
                            <div
                                className="absolute top-0 bottom-0 left-0 w-[2px] z-10"
                                style={{ background: `${config.colors.iconPrimary}50` }}
                            />
                            <div
                                className="absolute top-0 bottom-0 right-0 w-[2px] z-10"
                                style={{ background: `${config.colors.iconPrimary}50` }}
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
                                background: `linear-gradient(180deg, ${darken(config.colors.cardBackground, 0.15)}, ${darken(config.colors.cardBackground, 0.38)})`,
                                border: `1px solid ${config.colors.border}`,
                                borderRadius: 4,
                                boxShadow: `inset 0 1px 3px rgba(0,0,0,0.5), 0 0 4px ${config.colors.iconPrimary}08`,
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
                                background: `linear-gradient(180deg, ${darken(config.colors.cardBackground, 0.15)}, ${darken(config.colors.cardBackground, 0.38)})`,
                                border: `1px solid ${config.colors.border}`,
                                borderRadius: 4,
                                boxShadow: `inset 0 1px 3px rgba(0,0,0,0.5), 0 0 4px ${config.colors.iconPrimary}08`,
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
                                        style={{ color: config.colors.challengeTitle, fontSize: Math.max(9, config.fonts.bodySize - 1) }}
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
                                                        style={{ color: isCompleted ? config.colors.completedIndicator : config.colors.iconPrimary }}
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
