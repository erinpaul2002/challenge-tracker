import { useMemo, useEffect, useState } from 'react';
import { Crosshair, Clock, Trophy, User } from 'lucide-react';
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

/* ── Inject PUBG-style keyframes ──────────────────────── */
const STYLE_ID = 'pubg-default-keyframes';
function ensureKeyframes(colors: ThemeRendererProps['config']['colors']) {
    const css = `
    @keyframes pubg-scanline {
      0% { transform: translateY(-100%); }
      100% { transform: translateY(100%); }
    }
    @keyframes pubg-zone-pulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
    @keyframes pubg-ammo-glow {
      0%, 100% { text-shadow: 0 0 4px ${hexAlpha(colors.progressCount, 0.4)}; }
      50% { text-shadow: 0 0 12px ${hexAlpha(colors.progressCount, 0.8)}, 0 0 24px ${hexAlpha(colors.progressCount, 0.3)}; }
    }
    @keyframes pubg-stripe-scroll {
      0% { background-position: 0 0; }
      100% { background-position: 40px 0; }
    }
    @keyframes pubg-dust {
      0% { transform: translateX(-10%) translateY(5%); opacity: 0.3; }
      50% { opacity: 0.5; }
      100% { transform: translateX(10%) translateY(-5%); opacity: 0.3; }
    }
    `;
    injectDynamicKeyframes(STYLE_ID, css);
}

/* ── Tactical corner bracket SVG ──────────────────────── */
function TacticalCorner({ position, color }: { position: 'tl' | 'tr' | 'bl' | 'br'; color: string }) {
    const isTop = position.startsWith('t');
    const isLeft = position.endsWith('l');
    return (
        <div
            className="absolute z-20 pointer-events-none"
            style={{
                [isTop ? 'top' : 'bottom']: -1,
                [isLeft ? 'left' : 'right']: -1,
                width: 18,
                height: 18,
            }}
        >
            <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                {isTop && isLeft && (
                    <path d="M0 0 L7 0 M0 0 L0 7" stroke={color} strokeWidth="2" />
                )}
                {isTop && !isLeft && (
                    <path d="M18 0 L11 0 M18 0 L18 7" stroke={color} strokeWidth="2" />
                )}
                {!isTop && isLeft && (
                    <path d="M0 18 L7 18 M0 18 L0 11" stroke={color} strokeWidth="2" />
                )}
                {!isTop && !isLeft && (
                    <path d="M18 18 L11 18 M18 18 L18 11" stroke={color} strokeWidth="2" />
                )}
            </svg>
        </div>
    );
}

export default function ThemeDefault({ challenge, config, fade }: ThemeRendererProps) {
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

    // Dust/debris particles — like a battleground environment
    const particlesConfig = useMemo(() => ({
        particles: {
            number: { value: 10, density: { enable: true, value_area: 400 } },
            color: { value: [config.colors.progressFill, config.colors.iconSecondary, '#c8b06a'] },
            shape: { type: 'circle' },
            opacity: { value: 0.4, random: true, anim: { enable: true, speed: 0.8, opacity_min: 0.05, sync: false } },
            size: { value: 2, random: true, anim: { enable: true, speed: 1, size_min: 0.3, sync: false } },
            move: {
                enable: true,
                speed: 0.6,
                direction: 'right' as const,
                random: true,
                straight: false,
                out_mode: 'out' as const,
                bounce: false,
                attract: { enable: false, rotateX: 600, rotateY: 1200 },
                gravity: { enable: true, acceleration: 2 }
            },
        },
        interactivity: { events: { onhover: { enable: false }, onclick: { enable: false }, resize: { enable: true } } },
        retina_detect: true,
        background: { color: 'transparent' },
    }), [config.colors.progressFill, config.colors.iconSecondary]);

    const progressPercent = challenge.progress;
    const currentVal = Math.round((progressPercent / 100) * (challenge.subChallenges[0]?.target_limit || 1));
    const targetVal = challenge.subChallenges[0]?.target_limit || 1;
    const activeSubTitle = challenge.subChallenges[0]?.title?.trim();
    const rewardValue = challenge.challenge.reward_amount?.trim();

    return (
        <div
            className={cn(
                "relative overflow-hidden transition-opacity duration-500",
                fade ? "opacity-0" : "opacity-100"
            )}
            style={{
                width: config.layout.width,
                fontFamily: config.fonts.body,
                opacity: config.layout.opacity / 100,
            }}
        >
            {/* Dust particles overlay */}
            <div className="absolute inset-0 pointer-events-none z-50 overflow-visible">
                {particlesInit && (
                    <Particles
                        id="pubg-dust-particles"
                        options={particlesConfig}
                        className="w-full h-full"
                    />
                )}
            </div>

            {/* ── MAIN CONTAINER — Military crate / tactical HUD ── */}
            <div
                className="relative"
                style={{
                    background: `linear-gradient(175deg, ${lighten(config.colors.cardBackground, 0.06)} 0%, ${config.colors.cardBackground} 40%, ${darken(config.colors.cardBackground, 0.3)} 100%)`,
                    borderRadius: config.layout.borderRadius,
                    border: `1.5px solid ${config.colors.border}`,
                    boxShadow: `
                        inset 0 1px 0 ${toRgba('#ffffff', 0.04)},
                        inset 0 -2px 0 ${toRgba('#000000', 0.4)},
                        0 0 0 1px ${darken(config.colors.cardBackground, 0.5)},
                        0 8px 32px ${toRgba('#000000', 0.6)},
                        0 0 60px ${toRgba(config.colors.progressFill, 0.04)}
                    `,
                    overflow: 'hidden',
                    padding: config.layout.padding,
                }}
            >
                {/* Tactical corner brackets */}
                <TacticalCorner position="tl" color={config.colors.iconPrimary} />
                <TacticalCorner position="tr" color={config.colors.iconPrimary} />
                <TacticalCorner position="bl" color={config.colors.iconPrimary} />
                <TacticalCorner position="br" color={config.colors.iconPrimary} />

                {/* Camo/terrain noise texture */}
                <div
                    className="absolute inset-0 pointer-events-none z-[1] opacity-[0.03]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        backgroundSize: '60px 60px',
                    }}
                />

                {/* Diagonal hazard stripe accent along the top */}
                <div
                    className="absolute top-0 left-0 right-0 h-[3px] z-[2] pointer-events-none"
                    style={{
                        background: `repeating-linear-gradient(
                            -45deg,
                            ${config.colors.progressFill},
                            ${config.colors.progressFill} 4px,
                            transparent 4px,
                            transparent 8px
                        )`,
                        opacity: 0.7,
                        animationName: 'pubg-stripe-scroll',
                        animationDuration: '2s',
                        animationTimingFunction: 'linear',
                        animationIterationCount: 'infinite',
                    }}
                />

                {/* Scanline sweep */}
                <div className="absolute inset-0 pointer-events-none z-[3] overflow-hidden">
                    <div
                        className="absolute left-0 right-0 h-12 opacity-[0.04]"
                        style={{
                            background: `linear-gradient(180deg, transparent, ${config.colors.progressFill}, transparent)`,
                            animationName: 'pubg-scanline',
                            animationDuration: '6s',
                            animationTimingFunction: 'linear',
                            animationIterationCount: 'infinite',
                        }}
                    />
                </div>

                {/* ── HEADER — Mission briefing style ── */}
                <div className="flex justify-between items-start mb-3 relative z-10">
                    <div className="flex flex-col gap-1">
                        {/* Mission/challenge title */}
                        <div className="flex items-center gap-2">
                            <Crosshair
                                size={14}
                                style={{ color: config.colors.iconPrimary }}
                                className="flex-shrink-0"
                            />
                            <span
                                className="uppercase tracking-[0.2em] font-black"
                                style={{
                                    color: config.colors.challengeTitle,
                                    fontFamily: config.fonts.title,
                                    fontSize: config.fonts.titleSize,
                                    letterSpacing: '0.15em',
                                }}
                            >
                                {challenge.challenge.title}
                            </span>
                        </div>

                        {/* Active sub-challenge title (cycles one-by-one from overlay page) */}
                        {config.display.showSubChallenges && activeSubTitle && (
                            <div
                                className="uppercase tracking-[0.08em] font-semibold pl-6"
                                style={{
                                    color: config.colors.subchallengeTitle,
                                    fontSize: Math.max(10, config.fonts.bodySize - 1),
                                }}
                            >
                                {activeSubTitle}
                            </div>
                        )}
                    </div>

                    {/* Ammo-counter style progress */}
                    <div className="flex flex-col items-end gap-1">
                        {(config.display.showProgressCount ?? true) && (
                            <div
                                className="flex items-baseline gap-0.5 font-mono font-black"
                                style={{
                                    color: config.colors.progressCount,
                                    fontFamily: config.fonts.title,
                                    fontSize: Math.max(18, config.fonts.titleSize + 6),
                                    animationName: 'pubg-ammo-glow',
                                    animationDuration: '3s',
                                    animationTimingFunction: 'ease-in-out',
                                    animationIterationCount: 'infinite',
                                }}
                            >
                                <span>{currentVal}</span>
                                <span className="text-[0.55em] mx-0.5" style={{ color: config.colors.dateText }}>/</span>
                                <span className="text-[0.7em] opacity-70">{targetVal}</span>
                            </div>
                        )}

                        {config.display.showDate && (
                            <div
                                className="flex items-center gap-1.5 uppercase font-mono font-bold tracking-wider"
                                style={{
                                    color: config.colors.dateText,
                                    fontSize: Math.max(8, config.fonts.bodySize - 3),
                                }}
                            >
                                <Clock size={10} />
                                <span>{challenge.timeLeft}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── PROGRESS BAR — Blue zone / shrinking circle style ── */}
                {config.display.showProgressBar && (
                    <div className="relative mb-4 mt-3 z-10">
                        {/* Bar track */}
                        <div
                            className="relative h-5 overflow-hidden"
                            style={{
                                backgroundColor: config.colors.progressEmpty,
                                borderRadius: 3,
                                border: `1px solid ${config.colors.border}`,
                                boxShadow: `inset 0 2px 6px ${toRgba('#000000', 0.5)}`,
                            }}
                        >
                            {/* Segmented grid lines for a military readout feel */}
                            <div className="absolute inset-0 z-[5] pointer-events-none flex">
                                {Array.from({ length: 20 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="flex-1 border-r"
                                        style={{
                                            borderColor: toRgba(config.colors.border, 0.15),
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Fill */}
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(1, progressPercent)}%` }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                                className="absolute top-0 bottom-0 left-0 z-[2]"
                                style={{
                                    background: `linear-gradient(90deg, ${darken(config.colors.progressFill, 0.3)}, ${config.colors.progressFill})`,
                                    boxShadow: `0 0 12px ${hexAlpha(config.colors.progressFill, 0.5)}, inset 0 1px 0 ${toRgba('#ffffff', 0.15)}`,
                                    borderRadius: 2,
                                }}
                            >
                                {/* Inner glow stripe */}
                                <div
                                    className="absolute inset-0 opacity-30"
                                    style={{
                                        background: `linear-gradient(180deg, transparent 0%, ${toRgba('#ffffff', 0.2)} 40%, ${toRgba('#ffffff', 0.2)} 60%, transparent 100%)`,
                                    }}
                                />
                            </motion.div>

                            {/* Pulsing edge at fill end */}
                            <motion.div
                                initial={{ left: '0%' }}
                                animate={{ left: `${Math.max(1, progressPercent)}%` }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                                className="absolute top-0 bottom-0 w-1 z-[6]"
                                style={{
                                    background: config.colors.progressFill,
                                    boxShadow: `0 0 8px ${config.colors.progressFill}, 0 0 16px ${hexAlpha(config.colors.progressFill, 0.5)}`,
                                    animationName: 'pubg-zone-pulse',
                                    animationDuration: '1.5s',
                                    animationTimingFunction: 'ease-in-out',
                                    animationIterationCount: 'infinite',
                                    marginLeft: -2,
                                }}
                            />
                        </div>

                        {/* Percentage label below bar */}
                        <div
                            className="text-right mt-1 font-mono font-bold uppercase tracking-wider"
                            style={{
                                color: config.colors.progressFill,
                                fontSize: 9,
                                opacity: 0.7,
                            }}
                        >
                            {Math.round(progressPercent)}% — Zone Closing
                        </div>
                    </div>
                )}

                {/* ── BOTTOM INFO STRIP — Viewer + Reward (dog-tag style) ── */}
                {((config.display.showGivenBy && challenge.challenge.given_by) || (config.display.showReward ?? true)) && (
                    <div
                        className="flex gap-2 mt-3 relative z-10"
                    >
                        {/* Given By / Viewer */}
                        {config.display.showGivenBy && challenge.challenge.given_by && (
                            <div
                                className="flex-1 flex items-center gap-2 px-3 py-2"
                                style={{
                                    background: `linear-gradient(180deg, ${lighten(config.colors.cardBackground, 0.04)}, ${darken(config.colors.cardBackground, 0.15)})`,
                                    border: `1px solid ${config.colors.border}`,
                                    borderRadius: 4,
                                    boxShadow: `inset 0 1px 3px ${toRgba('#000000', 0.4)}`,
                                }}
                            >
                                <User size={12} style={{ color: config.colors.iconSecondary, opacity: 0.7 }} />
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
                                className="flex-1 flex items-center gap-2 px-3 py-2"
                                style={{
                                    background: `linear-gradient(180deg, ${lighten(config.colors.cardBackground, 0.04)}, ${darken(config.colors.cardBackground, 0.15)})`,
                                    border: `1px solid ${config.colors.border}`,
                                    borderRadius: 4,
                                    boxShadow: `inset 0 1px 3px ${toRgba('#000000', 0.4)}`,
                                }}
                            >
                                <Trophy size={12} style={{ color: config.colors.progressFill, opacity: 0.8 }} />
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
                                            style={{
                                                color: config.colors.progressFill,
                                                fontSize: Math.max(9, config.fonts.bodySize - 1),
                                            }}
                                        >
                                            {rewardValue}
                                        </span>
                                    ) : (
                                        <span
                                            className="font-mono uppercase tracking-wider opacity-40"
                                            style={{
                                                color: config.colors.dateText,
                                                fontSize: Math.max(8, config.fonts.bodySize - 2),
                                            }}
                                        >
                                            TBD
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Bottom accent line */}
                <div
                    className="absolute bottom-0 left-0 right-0 h-[2px] z-[2]"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${hexAlpha(config.colors.progressFill, 0.3)}, transparent)`,
                    }}
                />
            </div>
        </div>
    );
}
