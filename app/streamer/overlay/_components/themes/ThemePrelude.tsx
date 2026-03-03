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

/* ── Inline keyframes (injected dynamically) ──────────── */
const STYLE_ID = 'prelude-keyframes';
function ensureKeyframes(colors: { iconPrimary: string }) {
    const css = `
    @keyframes prelude-lightning-left {
      0%, 100% { opacity: 0; }
      10% { opacity: 1; }
      12% { opacity: 0.3; }
      14% { opacity: 0.9; }
      18% { opacity: 0; }
      50% { opacity: 0; }
      52% { opacity: 0.8; }
      54% { opacity: 0.2; }
      56% { opacity: 0.7; }
      60% { opacity: 0; }
    }
    @keyframes prelude-lightning-right {
      0%, 100% { opacity: 0; }
      30% { opacity: 0; }
      32% { opacity: 0.9; }
      34% { opacity: 0.2; }
      36% { opacity: 1; }
      40% { opacity: 0; }
      70% { opacity: 0; }
      72% { opacity: 0.6; }
      74% { opacity: 0.1; }
      76% { opacity: 0.8; }
      80% { opacity: 0; }
    }
    @keyframes prelude-flicker {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
    @keyframes prelude-heat-shimmer {
      0% { transform: translateX(0) scaleY(1); }
      25% { transform: translateX(2px) scaleY(1.02); }
      50% { transform: translateX(-1px) scaleY(0.98); }
      75% { transform: translateX(1px) scaleY(1.01); }
      100% { transform: translateX(0) scaleY(1); }
    }
    @keyframes prelude-glow-pulse {
      0%, 100% { text-shadow: 0 0 8px ${toRgba(colors.iconPrimary, 0.5)}, 0 0 20px ${toRgba(colors.iconPrimary, 0.25)}; }
      50% { text-shadow: 0 0 14px ${toRgba(colors.iconPrimary, 0.8)}, 0 0 30px ${toRgba(colors.iconPrimary, 0.5)}, 0 0 50px ${toRgba(colors.iconPrimary, 0.19)}; }
    }
    @keyframes prelude-spark-drift {
      0% { transform: translateY(0) scale(1); opacity: 1; }
      100% { transform: translateY(-20px) scale(0); opacity: 0; }
    }
    `;
    injectDynamicKeyframes(STYLE_ID, css);
}

/* ── Lightning SVG bolt paths ──────────────────────────── */
function LightningBolt({ side, color }: { side: 'left' | 'right'; color: string }) {
    const isLeft = side === 'left';
    return (
        <div
            className="absolute pointer-events-none z-30"
            style={{
                [isLeft ? 'left' : 'right']: -4,
                top: '15%',
                bottom: '15%',
                width: 24,
                animation: isLeft
                    ? 'prelude-lightning-left 3s infinite'
                    : 'prelude-lightning-right 3.5s infinite',
                filter: `drop-shadow(0 0 6px ${color})`,
            }}
        >
            <svg viewBox="0 0 24 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path
                    d={isLeft
                        ? 'M12 0 L18 20 L10 22 L20 45 L8 48 L16 65 L12 80'
                        : 'M12 0 L6 18 L14 22 L4 42 L16 46 L8 68 L12 80'}
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.9"
                />
                <path
                    d={isLeft
                        ? 'M12 0 L18 20 L10 22 L20 45 L8 48 L16 65 L12 80'
                        : 'M12 0 L6 18 L14 22 L4 42 L16 46 L8 68 L12 80'}
                    stroke="white"
                    strokeWidth="0.5"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.5"
                />
            </svg>
        </div>
    );
}

/* ── Rivet decoration ──────────────────────────────────── */
function Rivet({ className, borderColor }: { className?: string; borderColor: string }) {
    return (
        <div
            className={cn('absolute w-2.5 h-2.5 rounded-full z-20', className)}
            style={{
                background: `radial-gradient(circle at 35% 35%, ${lighten(borderColor, 0.15)}, ${darken(borderColor, 0.4)})`,
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15), 0 1px 2px rgba(0,0,0,0.6)',
            }}
        />
    );
}

/* ── Vent grille decoration ────────────────────────────── */
function VentGrille({ className, borderColor }: { className?: string; borderColor: string }) {
    return (
        <div className={cn('flex gap-[2px]', className)}>
            {Array.from({ length: 6 }).map((_, i) => (
                <div
                    key={i}
                    className="h-full rounded-[1px]"
                    style={{
                        width: 3,
                        background: `linear-gradient(180deg, ${darken(borderColor, 0.4)} 0%, ${darken(borderColor, 0.6)} 50%, ${darken(borderColor, 0.4)} 100%)`,
                        boxShadow: 'inset 0 0 2px rgba(0,0,0,0.8)',
                    }}
                />
            ))}
        </div>
    );
}

/* ── Main Prelude Theme Component ──────────────────────── */
export default function ThemePrelude({ challenge, config, fade }: ThemeRendererProps) {
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

    // Hot spark embers particle config
    const particlesConfig = useMemo(() => ({
        particles: {
            number: { value: 12, density: { enable: true, value_area: 300 } },
            color: { value: [config.colors.iconSecondary, lighten(config.colors.iconSecondary, 0.2), lighten(config.colors.iconSecondary, 0.4), config.colors.iconPrimary] },
            shape: { type: 'circle' },
            opacity: { value: 0.9, random: true, anim: { enable: true, speed: 2, opacity_min: 0, sync: false } },
            size: { value: 2, random: true, anim: { enable: true, speed: 1.5, size_min: 0.3, sync: false } },
            move: {
                enable: true,
                speed: 1.5,
                direction: 'top' as const,
                random: true,
                straight: false,
                out_mode: 'out' as const,
                bounce: false,
                attract: { enable: false, rotateX: 600, rotateY: 1200 },
                gravity: { enable: false },
            },
            life: {
                duration: { sync: false, value: 2 },
                count: 0,
            },
        },
        interactivity: { events: { onhover: { enable: false }, onclick: { enable: false }, resize: { enable: true } } },
        retina_detect: true,
        background: { color: 'transparent' },
    }), [config.colors]);

    const progressPercent = challenge.progress;
    const currentVal = Math.round((progressPercent / 100) * (challenge.subChallenges[0]?.target_limit || 1));
    const targetVal = challenge.subChallenges[0]?.target_limit || 1;
    const rewardValue = challenge.challenge.reward_amount?.trim();

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
            {/* ── Spark Particles across full card ── */}
            <div className="absolute inset-0 pointer-events-none z-40 overflow-visible">
                {particlesInit && (
                    <Particles
                        id="prelude-sparks"
                        options={particlesConfig}
                        className="w-full h-full"
                    />
                )}
            </div>

            {/* ── MAIN CHASSIS ── */}
            <div
                className="relative"
                style={{
                    background: `linear-gradient(170deg, ${lighten(config.colors.cardBackground, 0.05)} 0%, ${config.colors.cardBackground} 40%, ${darken(config.colors.cardBackground, 0.3)} 100%)`,
                    borderRadius: config.layout.borderRadius,
                    boxShadow: `
                        inset 0 1px 0 rgba(255,200,150,0.08),
                        inset 0 -1px 0 rgba(0,0,0,0.4),
                        0 0 0 1px ${config.colors.border},
                        0 0 0 3px ${darken(config.colors.cardBackground, 0.5)},
                        0 0 30px ${toRgba(config.colors.iconPrimary, 0.15)},
                        0 20px 50px rgba(0,0,0,0.6)
                    `,
                    overflow: 'hidden',
                }}
            >
                {/* Metallic grain overlay */}
                <div
                    className="absolute inset-0 pointer-events-none z-[1] opacity-[0.04]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    }}
                />

                {/* Copper accent border lines */}
                <div className="absolute top-0 left-4 right-4 h-[1px] z-10" style={{ background: `linear-gradient(90deg, transparent, ${config.colors.border}, transparent)` }} />
                <div className="absolute bottom-0 left-4 right-4 h-[1px] z-10" style={{ background: `linear-gradient(90deg, transparent, ${config.colors.border}80, transparent)` }} />

                {/* Lightning bolts */}
                <LightningBolt side="left" color={config.colors.progressCount} />
                <LightningBolt side="right" color={config.colors.progressCount} />

                {/* Corner rivets */}
                <Rivet className="top-2 left-2" borderColor={config.colors.border} />
                <Rivet className="top-2 right-2" borderColor={config.colors.border} />
                <Rivet className="bottom-2 left-2" borderColor={config.colors.border} />
                <Rivet className="bottom-2 right-2" borderColor={config.colors.border} />

                {/* ── TOP SECTION: Title + X/Y ── */}
                <div
                    className="relative z-10 flex justify-between items-start"
                    style={{ padding: '14px 16px 10px 16px' }}
                >
                    {/* Left — Challenge Title */}
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <span
                            className="uppercase tracking-widest font-extrabold leading-tight truncate"
                            style={{
                                color: config.colors.challengeTitle,
                                fontFamily: config.fonts.title,
                                fontSize: config.fonts.titleSize,
                                textShadow: '0 2px 4px rgba(0,0,0,0.6)',
                                letterSpacing: '0.08em',
                            }}
                        >
                            {challenge.challenge.title}
                        </span>
                        {/* "HEADLINES" sub-label as a brutalist stamped tag */}
                        {config.display.showSubChallenges && challenge.subChallenges.length > 0 && (
                            <div
                                className="mt-1 inline-flex items-center self-start px-2 py-0.5"
                                style={{
                                    background: `linear-gradient(90deg, ${lighten(config.colors.cardBackground, 0.08)}, ${lighten(config.colors.cardBackground, 0.02)})`,
                                    border: `1px solid ${config.colors.border}60`,
                                    clipPath: 'polygon(0 0, 100% 0, 96% 100%, 4% 100%)',
                                }}
                            >
                                <span
                                    className="uppercase tracking-wider font-bold"
                                    style={{
                                        color: config.colors.subchallengeTitle,
                                        fontSize: Math.max(8, config.fonts.bodySize - 3),
                                        textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                                    }}
                                >
                                    {challenge.subChallenges[0]?.title || 'OBJECTIVE'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Right — X/Y Counter with plasma glow */}
                    <div className="flex flex-col items-end gap-1 ml-3 flex-shrink-0">
                        {(config.display.showProgressCount ?? true) && (
                            <div
                                className="relative flex items-baseline font-extrabold"
                                style={{
                                    fontFamily: config.fonts.title,
                                    animation: 'prelude-glow-pulse 3s infinite',
                                }}
                            >
                                <span
                                    style={{
                                        color: config.colors.progressCount,
                                        fontSize: Math.max(22, config.fonts.titleSize + 8),
                                        lineHeight: 1,
                                        filter: `drop-shadow(0 0 6px ${config.colors.progressCount}80)`,
                                    }}
                                >
                                    {currentVal}
                                </span>
                                <span
                                    className="mx-0.5"
                                    style={{
                                        color: `${config.colors.progressCount}B3`,
                                        fontSize: Math.max(18, config.fonts.titleSize + 4),
                                    }}
                                >/</span>
                                <span
                                    style={{
                                        color: config.colors.progressCount,
                                        fontSize: Math.max(20, config.fonts.titleSize + 6),
                                        opacity: 1,
                                        filter: `drop-shadow(0 0 4px ${config.colors.progressCount}50)`,
                                    }}
                                >
                                    {targetVal}
                                </span>
                            </div>
                        )}
                        {config.display.showDate && (
                            <div
                                className="flex items-center gap-1 uppercase font-bold tracking-widest"
                                style={{ color: config.colors.dateText, fontSize: Math.max(8, config.fonts.bodySize - 3) }}
                            >
                                <Clock size={9} />
                                <span>{challenge.timeLeft}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Purple energy glow line between sections ── */}
                <div
                    className="relative mx-3 h-[2px] z-10"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${config.colors.progressCount}60, ${config.colors.progressCount}, ${config.colors.progressCount}60, transparent)`,
                        boxShadow: `0 0 8px ${config.colors.progressCount}40, 0 0 20px ${config.colors.progressCount}20`,
                        animation: 'prelude-flicker 2s infinite',
                    }}
                />

                {/* ── MIDDLE SECTION: Molten Progress Bar ── */}
                {config.display.showProgressBar && (
                    <div className="relative px-3 py-3 z-10">
                        {/* Reactor trench container */}
                        <div
                            className="relative h-7 overflow-hidden"
                            style={{
                                background: `linear-gradient(180deg, ${lighten(config.colors.progressEmpty, 0.05)}, ${darken(config.colors.progressEmpty, 0.08)}, ${lighten(config.colors.progressEmpty, 0.05)})`,
                                border: `1.5px solid ${config.colors.border}80`,
                                borderRadius: 3,
                                boxShadow: `
                                    inset 0 2px 6px rgba(0,0,0,0.8),
                                    inset 0 -1px 3px rgba(0,0,0,0.6),
                                    0 0 0 1px rgba(0,0,0,0.4)
                                `,
                            }}
                        >
                            {/* Inner bevel */}
                            <div
                                className="absolute inset-[2px] rounded-[2px] pointer-events-none z-[1]"
                                style={{
                                    border: '1px solid rgba(255,200,150,0.06)',
                                }}
                            />

                            {/* Molten lava fill */}
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(2, progressPercent)}%` }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                                className="absolute top-0 bottom-0 left-0 z-[2]"
                                style={{
                                    background: `linear-gradient(90deg, ${darken(config.colors.progressFill, 0.45)}, ${config.colors.progressFill}, ${lighten(config.colors.progressFill, 0.15)}, ${config.colors.progressFill})`,
                                    boxShadow: `0 0 15px ${config.colors.progressFill}90, 0 0 30px ${config.colors.progressFill}40`,
                                    borderRadius: 2,
                                }}
                            >
                                {/* Lava surface texture */}
                                <motion.div
                                    className="absolute inset-0"
                                    animate={{ backgroundPosition: ['0% 0%', '100% 0%'] }}
                                    transition={{ repeat: Infinity, ease: 'linear', duration: 4 }}
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3CradialGradient id='lg'%3E%3Cstop offset='0' stop-color='%23ffcc00' stop-opacity='0.5'/%3E%3Cstop offset='1' stop-color='%23ff4500' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Ccircle cx='30' cy='20' r='15' fill='url(%23lg)'/%3E%3Ccircle cx='80' cy='15' r='10' fill='url(%23lg)'/%3E%3Ccircle cx='140' cy='25' r='12' fill='url(%23lg)'/%3E%3Ccircle cx='180' cy='18' r='8' fill='url(%23lg)'/%3E%3C/svg%3E")`,
                                        backgroundSize: '200px 100%',
                                        backgroundRepeat: 'repeat-x',
                                        mixBlendMode: 'screen',
                                    }}
                                />
                                {/* Heat shimmer */}
                                <div
                                    className="absolute inset-0 opacity-30"
                                    style={{
                                        background: 'linear-gradient(0deg, transparent 0%, rgba(255,200,100,0.3) 40%, transparent 60%, rgba(255,150,50,0.2) 80%, transparent 100%)',
                                        animation: 'prelude-heat-shimmer 2s infinite',
                                    }}
                                />
                                {/* Top highlight */}
                                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-b from-white/20 to-transparent" />
                            </motion.div>

                            {/* Segmented stabilization rings */}
                            <div className="absolute inset-0 flex items-center justify-between px-1 z-[3] pointer-events-none">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="h-[70%] rounded-[1px]"
                                        style={{
                                            width: 4,
                                            background: `linear-gradient(180deg, ${toRgba(config.colors.border, 0.7)}, ${toRgba(darken(config.colors.border, 0.4), 0.9)}, ${toRgba(config.colors.border, 0.7)})`,
                                            boxShadow: `1px 0 1px rgba(0,0,0,0.5), -1px 0 1px ${toRgba(lighten(config.colors.border, 0.5), 0.05)}`,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Purple energy glow line between sections ── */}
                <div
                    className="relative mx-3 h-[1px] z-10"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${config.colors.progressCount}40, transparent)`,
                    }}
                />

                {/* ── BOTTOM SECTION: Given By + Reward ── */}
                <div
                    className="relative z-10 flex gap-2"
                    style={{ padding: '8px 12px 12px 12px' }}
                >
                    {/* Given By panel */}
                    {config.display.showGivenBy && challenge.challenge.given_by && (
                        <div
                            className="flex-1 flex items-center px-3 py-1.5"
                            style={{
                                background: `linear-gradient(135deg, ${lighten(config.colors.cardBackground, 0.02)}, ${darken(config.colors.cardBackground, 0.15)})`,
                                border: `1px solid ${config.colors.border}60`,
                                borderRadius: 2,
                                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
                            }}
                        >
                            <div>
                                <div
                                    className="uppercase tracking-wider font-bold"
                                    style={{
                                        color: config.colors.dateText,
                                        fontSize: Math.max(7, config.fonts.bodySize - 4),
                                        letterSpacing: '0.1em',
                                    }}
                                >GIVEN BY</div>
                                <div
                                    className="uppercase tracking-wider font-bold"
                                    style={{
                                        color: config.colors.viewerName,
                                        fontSize: Math.max(9, config.fonts.bodySize - 2),
                                    }}
                                >
                                    {challenge.challenge.given_by}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reward / Sub-challenges panel */}
                    {(config.display.showReward ?? true) && (
                        <div
                            className="flex-1 flex items-center px-3 py-1.5"
                            style={{
                                background: `linear-gradient(135deg, ${lighten(config.colors.cardBackground, 0.02)}, ${darken(config.colors.cardBackground, 0.15)})`,
                                border: `1px solid ${config.colors.border}60`,
                                borderRadius: 2,
                                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
                            }}
                        >
                            <div>
                                <div
                                    className="uppercase tracking-wider font-bold"
                                    style={{
                                        color: config.colors.dateText,
                                        fontSize: Math.max(7, config.fonts.bodySize - 4),
                                        letterSpacing: '0.1em',
                                    }}
                                >REWARD</div>
                                {rewardValue ? (
                                    <span
                                        className="font-bold uppercase tracking-wider"
                                        style={{ color: config.colors.subchallengeTitle, fontSize: Math.max(9, config.fonts.bodySize - 1) }}
                                    >
                                        {rewardValue}
                                    </span>
                                ) : (
                                    <div className="flex items-center gap-1.5">
                                        {challenge.subChallenges.map((sub) => {
                                            const isCompleted = sub.status === 'completed';
                                            return (
                                                <div
                                                    key={sub.id}
                                                    className="flex items-center gap-1"
                                                >
                                                    <Target
                                                        size={10}
                                                        style={{ color: isCompleted ? config.colors.completedIndicator : config.colors.iconSecondary }}
                                                    />
                                                    <span
                                                        className={cn("font-mono text-[10px] font-bold", isCompleted && "line-through opacity-50")}
                                                        style={{ color: isCompleted ? config.colors.subchallengeCompleted : config.colors.subchallengeTitle }}
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

                    {/* Vent grille (decorative) */}
                    <div className="flex-shrink-0 flex items-center">
                        <VentGrille className="h-[24px]" borderColor={config.colors.border} />
                    </div>
                </div>
            </div>
        </div>
    );
}
