import { useMemo, useEffect, useState, useRef } from 'react';
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

/* ── Inject keyframes (re-injected when colors change) ── */
const STYLE_ID = 'spectrum-keyframes';
function buildSpectrumCSS(c: Record<string, string>) {
    const primary = c.iconPrimary || '#00e0ff';
    return `
    @keyframes spectrum-rgb-cycle {
      0% { color: #ff4080; }
      16% { color: #ff8040; }
      33% { color: #e0e020; }
      50% { color: #40e060; }
      66% { color: #40c0ff; }
      83% { color: #c040ff; }
      100% { color: #ff4080; }
    }
    @keyframes spectrum-prism-sweep {
      0% { transform: translateX(-150%); }
      100% { transform: translateX(300%); }
    }
    @keyframes spectrum-glow-pulse {
      0%, 100% { box-shadow: 0 0 8px ${toRgba(primary, 0.15)}, 0 0 0 1px ${toRgba(primary, 0.3)}; }
      50% { box-shadow: 0 0 16px ${toRgba(primary, 0.25)}, 0 0 0 1px ${toRgba(primary, 0.5)}; }
    }
    @keyframes spectrum-eq-bounce {
      0%, 100% { transform: scaleY(0.85); }
      25% { transform: scaleY(1.0); }
      50% { transform: scaleY(0.7); }
      75% { transform: scaleY(0.95); }
    }
    @keyframes spectrum-edge-glow {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.8; }
    }
    @keyframes spectrum-chroma-border {
      0% { border-color: #ff408060; }
      16% { border-color: #ff804060; }
      33% { border-color: #e0e02060; }
      50% { border-color: #40e06060; }
      66% { border-color: #40c0ff60; }
      83% { border-color: #c040ff60; }
      100% { border-color: #ff408060; }
    }
    `;
}

/* ── Rainbow color helpers ─────────────────────────────── */
const RAINBOW = ['#ff4080', '#ff6040', '#ffb020', '#e0e020', '#40e060', '#20d0a0', '#40c0ff', '#6080ff', '#a050ff', '#c040ff', '#ff40c0'];

function getRainbowColor(index: number, total: number): string {
    const pos = (index / total) * (RAINBOW.length - 1);
    const lower = Math.floor(pos);
    const upper = Math.min(lower + 1, RAINBOW.length - 1);
    const t = pos - lower;
    const lc = RAINBOW[lower];
    const uc = RAINBOW[upper];
    const r = Math.round(parseInt(lc.slice(1, 3), 16) * (1 - t) + parseInt(uc.slice(1, 3), 16) * t);
    const g = Math.round(parseInt(lc.slice(3, 5), 16) * (1 - t) + parseInt(uc.slice(3, 5), 16) * t);
    const b = Math.round(parseInt(lc.slice(5, 7), 16) * (1 - t) + parseInt(uc.slice(5, 7), 16) * t);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/* ── Main Spectrum Theme Component ─────────────────────── */
export default function ThemeSpectrum({ challenge, config, fade }: ThemeRendererProps) {
    const [particlesInit, setParticlesInit] = useState(false);
    const colors = config.colors;
    const dimmed = colors.dateText || '#6a7088';
    const progressAccent = colors.progressFill || colors.iconPrimary;

    useEffect(() => {
        injectDynamicKeyframes(STYLE_ID, buildSpectrumCSS(colors));
    }, [colors]);

    useEffect(() => {
        initParticlesEngine(async (engine: Engine) => {
            await loadSlim(engine);
        }).then(() => {
            setParticlesInit(true);
        });
    }, []);

    // Prismatic laser fleck particles
    const particlesConfig = useMemo(() => ({
        particles: {
            number: { value: 5, density: { enable: true, value_area: 600 } },
            color: { value: [RAINBOW[0], RAINBOW[4], RAINBOW[6], RAINBOW[9], RAINBOW[2]] },
            shape: { type: 'circle' },
            opacity: { value: 0.5, random: true, anim: { enable: true, speed: 3, opacity_min: 0, sync: false } },
            size: { value: 1.5, random: true, anim: { enable: true, speed: 0.5, size_min: 0.3, sync: false } },
            move: {
                enable: true,
                speed: 0.6,
                direction: 'none' as const,
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
    }), []);

    const progressPercent = challenge.progress;
    const currentVal = Math.round((progressPercent / 100) * (challenge.subChallenges[0]?.target_limit || 1));
    const targetVal = challenge.subChallenges[0]?.target_limit || 1;
    const rewardValue = challenge.challenge.reward_amount?.trim();
    const totalBars = 28;
    const filledBars = Math.round((progressPercent / 100) * totalBars);

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
            {/* Prismatic laser fleck particles */}
            <div className="absolute inset-0 pointer-events-none z-50 overflow-visible">
                {particlesInit && (
                    <Particles
                        id="spectrum-prism-particles"
                        options={particlesConfig}
                        className="w-full h-full"
                    />
                )}
            </div>

            {/* ── MAIN CHASSIS — Glossy white ceramic ── */}
            <div
                className="relative"
                style={{
                    background: `linear-gradient(170deg, ${lighten(colors.cardBackground, 0.3)} 0%, ${colors.cardBackground} 40%, ${darken(colors.cardBackground, 0.05)} 100%)`,
                    borderRadius: config.layout.borderRadius,
                    boxShadow: `
                        inset 0 1px 0 ${toRgba(lighten(colors.cardBackground, 0.5), 0.9)},
                        inset 0 -1px 0 ${toRgba(darken(colors.cardBackground, 0.8), 0.06)},
                        0 0 0 1px ${colors.border},
                        0 0 0 3px ${toRgba(lighten(colors.cardBackground, 0.5), 0.15)},
                        0 4px 16px ${toRgba(darken(colors.cardBackground, 0.8), 0.15)},
                        0 12px 40px ${toRgba(darken(colors.cardBackground, 0.8), 0.2)}
                    `,
                    overflow: 'hidden',
                }}
            >
                {/* Subtle ceramic gloss highlight */}
                <div
                    className="absolute inset-0 pointer-events-none z-[1]"
                    style={{
                        background: `linear-gradient(180deg, ${toRgba(lighten(colors.cardBackground, 0.5), 0.4)} 0%, transparent 35%, transparent 70%, ${toRgba(lighten(colors.cardBackground, 0.5), 0.1)} 100%)`,
                        borderRadius: config.layout.borderRadius,
                    }}
                />

                {/* Prismatic sweep reflection */}
                <div className="absolute inset-0 pointer-events-none z-[2] overflow-hidden" style={{ borderRadius: config.layout.borderRadius }}>
                    <div
                        className="absolute inset-y-0 w-[20%]"
                        style={{
                            background: `linear-gradient(90deg, transparent, ${toRgba(lighten(colors.cardBackground, 0.5), 0.15)}, transparent)`,
                            animationName: 'spectrum-prism-sweep',
                            animationDuration: '6s',
                            animationTimingFunction: 'linear',
                            animationIterationCount: 'infinite',
                        }}
                    />
                </div>

                {/* Chrome edge glow — left */}
                <div
                    className="absolute top-[15%] left-0 w-[1.5px] h-[70%] z-10"
                    style={{
                        background: `linear-gradient(180deg, transparent, ${toRgba(colors.iconPrimary, 0.5)}, ${toRgba(colors.progressCount, 0.5)}, transparent)`,
                        animationName: 'spectrum-edge-glow',
                        animationDuration: '3s',
                        animationIterationCount: 'infinite',
                    }}
                />
                {/* Chrome edge glow — right */}
                <div
                    className="absolute top-[15%] right-0 w-[1.5px] h-[70%] z-10"
                    style={{
                        background: `linear-gradient(180deg, transparent, ${toRgba(colors.iconSecondary, 0.5)}, ${toRgba(colors.iconPrimary, 0.5)}, transparent)`,
                        animationName: 'spectrum-edge-glow',
                        animationDuration: '3s',
                        animationIterationCount: 'infinite',
                        animationDelay: '1.5s',
                    }}
                />

                {/* Top chrome trim */}
                <div
                    className="absolute top-0 left-[10%] right-[10%] h-[1.5px] z-10"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${progressAccent}80, transparent)`,
                    }}
                />

                {/* ── TITLE SECTION ── */}
                <div
                    className="relative z-10 flex justify-between items-start"
                    style={{ padding: '14px 16px 6px 16px' }}
                >
                    {/* Left — Title + sub-headline */}
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <span
                            className="uppercase tracking-wider font-extrabold leading-tight truncate"
                            style={{
                                color: colors.challengeTitle,
                                fontFamily: config.fonts.title,
                                fontSize: config.fonts.titleSize,
                                textShadow: `0 1px 0 ${toRgba(lighten(colors.cardBackground, 0.5), 0.5)}`,
                            }}
                        >
                            {challenge.challenge.title}
                        </span>
                        {/* Sub-headline */}
                        {config.display.showSubChallenges && challenge.subChallenges.length > 0 && (
                            <div className="flex flex-col gap-0.5">
                                <span
                                    className="uppercase tracking-wider font-bold"
                                    style={{
                                        color: colors.subchallengeTitle,
                                        fontSize: Math.max(9, config.fonts.bodySize - 2),
                                    }}
                                >
                                    {challenge.subChallenges[0]?.title || 'OBJECTIVE'}
                                </span>
                                <div
                                    className="w-full h-[1px]"
                                    style={{
                                        background: `linear-gradient(90deg, ${colors.border}, transparent)`,
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Right — X/Y counter in dark inset panel */}
                    {(config.display.showProgressCount ?? true) && (
                        <div
                            className="flex items-center ml-3 flex-shrink-0 px-4 py-2"
                            style={{
                                background: `linear-gradient(180deg, ${colors.viewerName}, ${colors.progressEmpty})`,
                                borderRadius: 8,
                                boxShadow: `inset 0 1px 4px ${toRgba(darken(colors.progressEmpty, 0.5), 0.4)}, 0 1px 0 ${toRgba(lighten(colors.cardBackground, 0.5), 0.3)}`,
                                animationName: 'spectrum-chroma-border',
                                animationDuration: '6s',
                                animationIterationCount: 'infinite',
                                borderWidth: '1.5px',
                                borderStyle: 'solid',
                            }}
                        >
                            <span
                                className="font-extrabold tabular-nums"
                                style={{
                                    fontFamily: config.fonts.title,
                                    fontSize: Math.max(22, config.fonts.titleSize + 8),
                                    lineHeight: 1,
                                    animationName: 'spectrum-rgb-cycle',
                                    animationDuration: '4s',
                                    animationIterationCount: 'infinite',
                                    animationTimingFunction: 'linear',
                                }}
                            >
                                {currentVal}
                            </span>
                            <span
                                className="mx-1 font-bold"
                                style={{
                                    color: `${colors.progressCount || colors.challengeTitle}B3`,
                                    fontSize: Math.max(18, config.fonts.titleSize + 4),
                                    textShadow: '0 0 3px rgba(0,0,0,0.35)',
                                }}
                            >/</span>
                            <span
                                className="font-bold tabular-nums"
                                style={{
                                    color: `${colors.progressCount || colors.challengeTitle}EB`,
                                    fontSize: Math.max(20, config.fonts.titleSize + 6),
                                    lineHeight: 1,
                                }}
                            >
                                {targetVal}
                            </span>
                        </div>
                    )}
                </div>

                {/* ── PROGRESS BAR — Rainbow equalizer ── */}
                {config.display.showProgressBar && (
                    <div className="relative mx-4 my-2 z-10">
                        <div
                            className="relative overflow-hidden"
                            style={{
                                height: 36,
                                display: 'flex',
                                alignItems: 'flex-end',
                                gap: 2,
                                padding: '4px 6px',
                                background: `linear-gradient(180deg, ${lighten(colors.progressEmpty, 0.05)}, ${darken(colors.progressEmpty, 0.05)}, ${lighten(colors.progressEmpty, 0.05)})`,
                                borderRadius: 8,
                                boxShadow: `
                                    inset 0 2px 6px ${toRgba(darken(colors.progressEmpty, 0.5), 0.5)},
                                    0 1px 0 ${toRgba(lighten(colors.cardBackground, 0.5), 0.3)},
                                    0 0 0 1px ${colors.border}
                                `,
                            }}
                        >
                            {/* Equalizer bars */}
                            {Array.from({ length: totalBars }).map((_, i) => {
                                const isFilled = i < filledBars;
                                const color = getRainbowColor(i, totalBars);
                                const maxBarHeight = 28; // 36px container - 8px padding
                                // Varied heights for equalizer look
                                const barPx = isFilled
                                    ? Math.round(maxBarHeight * (0.5 + Math.sin(i * 0.8) * 0.25 + Math.cos(i * 1.3) * 0.15))
                                    : 4;
                                return (
                                    <motion.div
                                        key={i}
                                        style={{
                                            flex: 1,
                                            borderRadius: '2px 2px 1px 1px',
                                            minWidth: 0,
                                            background: isFilled
                                                ? color
                                                : colors.progressEmpty,
                                            boxShadow: isFilled
                                                ? `0 0 8px ${color}, 0 0 14px ${color}90, 0 0 2px ${color}`
                                                : 'none',
                                            filter: isFilled ? 'brightness(1.3) saturate(1.3)' : 'none',
                                            animationName: isFilled ? 'spectrum-eq-bounce' : 'none',
                                            animationDuration: `${0.6 + (i % 5) * 0.15}s`,
                                            animationIterationCount: 'infinite',
                                            animationDelay: `${(i % 7) * 0.1}s`,
                                            animationTimingFunction: 'ease-in-out',
                                            transformOrigin: 'bottom',
                                        }}
                                        initial={{ height: 3 }}
                                        animate={{
                                            height: Math.max(barPx, 3),
                                            opacity: isFilled ? 1 : 0.12,
                                        }}
                                        transition={{
                                            duration: 0.4,
                                            delay: isFilled ? i * 0.03 : 0,
                                        }}
                                    />
                                );
                            })}
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
                                background: `linear-gradient(180deg, ${lighten(colors.cardBackground, 0.2)}, ${darken(colors.cardBackground, 0.02)})`,
                                border: `1px solid ${colors.border}`,
                                borderRadius: 8,
                                boxShadow: `inset 0 1px 0 ${toRgba(lighten(colors.cardBackground, 0.5), 0.6)}, 0 1px 3px ${toRgba(darken(colors.cardBackground, 0.8), 0.06)}`,
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
                                background: `linear-gradient(180deg, ${lighten(colors.cardBackground, 0.2)}, ${darken(colors.cardBackground, 0.02)})`,
                                border: `1px solid ${colors.border}`,
                                borderRadius: 8,
                                boxShadow: `inset 0 1px 0 ${toRgba(lighten(colors.cardBackground, 0.5), 0.6)}, 0 1px 3px ${toRgba(darken(colors.cardBackground, 0.8), 0.06)}`,
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
                                        style={{ color: colors.challengeTitle, fontSize: Math.max(9, config.fonts.bodySize - 1) }}
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
                                                        style={{ color: isCompleted ? colors.completedIndicator : colors.iconSecondary }}
                                                    />
                                                    <span
                                                        className={cn("font-mono text-[10px] font-bold", isCompleted && "line-through opacity-50")}
                                                        style={{ color: isCompleted ? colors.subchallengeCompleted : colors.challengeTitle }}
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
