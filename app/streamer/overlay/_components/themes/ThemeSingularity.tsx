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

/* ── Keyframe style ID ─────────────────────────────────── */
const STYLE_ID = 'singularity-keyframes';

function buildKeyframesCSS(c: { iconPrimary: string; progressFill: string; iconSecondary: string }): string {
    return `
    @keyframes singularity-shard-float {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      25% { transform: translateY(-3px) rotate(0.5deg); }
      50% { transform: translateY(-5px) rotate(-0.3deg); }
      75% { transform: translateY(-2px) rotate(0.2deg); }
    }
    @keyframes singularity-edge-pulse {
      0%, 100% { opacity: 0.5; box-shadow: 0 0 8px ${hexAlpha(c.iconPrimary, 0.25)}, 0 0 16px ${hexAlpha(c.progressFill, 0.125)}; }
      50% { opacity: 1; box-shadow: 0 0 16px ${hexAlpha(c.iconPrimary, 0.63)}, 0 0 32px ${hexAlpha(c.progressFill, 0.375)}, 0 0 48px ${hexAlpha(c.iconSecondary, 0.19)}; }
    }
    @keyframes singularity-vortex-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes singularity-number-warp {
      0%, 100% { transform: perspective(200px) rotateY(0deg) skewX(0deg); text-shadow: 0 0 10px #ffffffb0, 0 0 20px ${hexAlpha(c.iconPrimary, 0.375)}, 0 0 40px ${hexAlpha(c.progressFill, 0.19)}; }
      25% { transform: perspective(200px) rotateY(1.5deg) skewX(-0.5deg); text-shadow: 0 0 14px #fffffff0, 0 0 28px ${hexAlpha(c.iconPrimary, 0.56)}, 0 0 50px ${hexAlpha(c.progressFill, 0.31)}; }
      50% { transform: perspective(200px) rotateY(-1deg) skewX(0.3deg); text-shadow: 0 0 10px #ffffffb0, 0 0 20px ${hexAlpha(c.iconPrimary, 0.375)}, 0 0 40px ${hexAlpha(c.progressFill, 0.19)}; }
      75% { transform: perspective(200px) rotateY(0.5deg) skewX(-0.2deg); text-shadow: 0 0 18px #fffffff0, 0 0 32px ${hexAlpha(c.iconPrimary, 0.63)}, 0 0 60px ${hexAlpha(c.iconSecondary, 0.25)}; }
    }
    @keyframes singularity-accretion-glow {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.7; }
    }
    @keyframes singularity-stardust-drift {
      0% { opacity: 0; transform: translate(0, 0) scale(1); }
      20% { opacity: 0.8; }
      100% { opacity: 0; transform: translate(-20px, 10px) scale(0.3); }
    }
    @keyframes singularity-shard-detach {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      30% { transform: translate(2px, -2px) rotate(1deg); }
      60% { transform: translate(-1px, 1px) rotate(-0.5deg); }
    }
    @keyframes singularity-inner-glow {
      0%, 100% { box-shadow: inset 0 0 20px ${hexAlpha(c.iconPrimary, 0.03)}, inset 0 0 40px ${hexAlpha(c.progressFill, 0.02)}; }
      50% { box-shadow: inset 0 0 30px ${hexAlpha(c.iconPrimary, 0.08)}, inset 0 0 60px ${hexAlpha(c.progressFill, 0.06)}; }
    }
    @keyframes singularity-bar-sweep {
      0% { transform: translateX(-200%); }
      100% { transform: translateX(400%); }
    }
    `;
}

/* ── Main Singularity Theme Component ─────────────────── */
export default function ThemeSingularity({ challenge, config, fade }: ThemeRendererProps) {
    const [particlesInit, setParticlesInit] = useState(false);
    const colors = config.colors;

    useEffect(() => {
        injectDynamicKeyframes(STYLE_ID, buildKeyframesCSS(colors));
    }, [colors.iconPrimary, colors.progressFill, colors.iconSecondary]);

    useEffect(() => {
        initParticlesEngine(async (engine: Engine) => {
            await loadSlim(engine);
        }).then(() => {
            setParticlesInit(true);
        });
    }, []);

    /* Derived structural colors */
    const cardBg = colors.cardBackground;
    const cardBgLight1 = lighten(cardBg, 0.02);
    const cardBgLight2 = lighten(cardBg, 0.03);
    const cardBgLight3 = lighten(cardBg, 0.04);
    const cardBgDark1 = darken(cardBg, 0.15);
    const cardBgDark2 = darken(cardBg, 0.3);
    const cardBgDark3 = darken(cardBg, 0.5);
    const borderDark = darken(colors.border, 0.35);
    const borderLight = lighten(colors.border, 0.15);

    // Stardust particles that drift inward (cosmic dust sucked by singularity)
    const particlesConfig = useMemo(() => ({
        particles: {
            number: { value: 18, density: { enable: true, value_area: 400 } },
            color: { value: [colors.iconPrimary, colors.iconSecondary, colors.progressFill, '#ffffff', blend(colors.iconPrimary, colors.progressFill, 0.5), lighten(colors.iconSecondary, 0.2)] },
            shape: { type: 'circle' },
            opacity: { value: 0.6, random: true, anim: { enable: true, speed: 0.8, opacity_min: 0, sync: false } },
            size: { value: 1.8, random: true, anim: { enable: true, speed: 0.4, size_min: 0.2, sync: false } },
            move: {
                enable: true,
                speed: 0.35,
                direction: 'none' as const,
                random: true,
                straight: false,
                out_mode: 'out' as const,
                bounce: false,
                attract: { enable: true, rotateX: 800, rotateY: 1200 },
                gravity: { enable: false },
            },
        },
        interactivity: { events: { onhover: { enable: false }, onclick: { enable: false }, resize: { enable: true } } },
        retina_detect: true,
        background: { color: 'transparent' },
    }), [colors.iconPrimary, colors.iconSecondary, colors.progressFill]);

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
            {/* Stardust particles */}
            <div className="absolute inset-0 pointer-events-none z-50 overflow-visible"
                style={{ top: -30, bottom: -20, left: -20, right: -20 }}>
                {particlesInit && (
                    <Particles
                        id="singularity-cosmic-particles"
                        options={particlesConfig}
                        className="w-full h-full"
                    />
                )}
            </div>

            {/* ══════ FLOATING SHARD FRAGMENTS — No solid border ══════ */}
            {/* Top-left shard */}
            <div className="absolute z-30 pointer-events-none" style={{
                top: -8, left: -6, width: 50, height: 35,
                animationName: 'singularity-shard-float',
                animationDuration: '5s',
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite',
            }}>
                <svg width="50" height="35" viewBox="0 0 50 35" fill="none">
                    <polygon points="8,32 2,18 18,2 42,0 50,12 38,30" fill={cardBgLight2} stroke={colors.iconPrimary} strokeWidth="0.8" opacity="0.85" />
                    <polygon points="8,32 2,18 18,2 42,0 50,12 38,30" fill="none" stroke={colors.iconSecondary} strokeWidth="0.3" opacity="0.4"
                        strokeDasharray="3,6" />
                </svg>
            </div>

            {/* Top-right shard */}
            <div className="absolute z-30 pointer-events-none" style={{
                top: -10, right: -8, width: 45, height: 38,
                animationName: 'singularity-shard-float',
                animationDuration: '6s',
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite',
                animationDelay: '1.5s',
            }}>
                <svg width="45" height="38" viewBox="0 0 45 38" fill="none">
                    <polygon points="5,10 20,0 43,5 45,25 30,36 8,30" fill={cardBgLight1} stroke={colors.iconPrimary} strokeWidth="0.8" opacity="0.8" />
                    <polygon points="5,10 20,0 43,5 45,25 30,36 8,30" fill="none" stroke={lighten(colors.iconSecondary, 0.2)} strokeWidth="0.3" opacity="0.3"
                        strokeDasharray="2,5" />
                </svg>
            </div>

            {/* Bottom-left shard */}
            <div className="absolute z-30 pointer-events-none" style={{
                bottom: -10, left: -5, width: 40, height: 30,
                animationName: 'singularity-shard-detach',
                animationDuration: '7s',
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite',
                animationDelay: '0.8s',
            }}>
                <svg width="40" height="30" viewBox="0 0 40 30" fill="none">
                    <polygon points="5,5 25,0 40,10 35,28 12,30 0,18" fill={cardBgLight1} stroke={colors.progressFill} strokeWidth="0.8" opacity="0.75" />
                </svg>
            </div>

            {/* Bottom-right shard */}
            <div className="absolute z-30 pointer-events-none" style={{
                bottom: -8, right: -6, width: 42, height: 32,
                animationName: 'singularity-shard-float',
                animationDuration: '5.5s',
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite',
                animationDelay: '2s',
            }}>
                <svg width="42" height="32" viewBox="0 0 42 32" fill="none">
                    <polygon points="2,12 15,0 40,4 42,22 28,32 6,28" fill={cardBgLight3} stroke={colors.iconPrimary} strokeWidth="0.7" opacity="0.8" />
                    <polygon points="2,12 15,0 40,4 42,22 28,32 6,28" fill="none" stroke={colors.iconSecondary} strokeWidth="0.25" opacity="0.35"
                        strokeDasharray="4,8" />
                </svg>
            </div>

            {/* Mid-left micro shard */}
            <div className="absolute z-30 pointer-events-none" style={{
                top: '40%', left: -10, width: 22, height: 18,
                animationName: 'singularity-shard-detach',
                animationDuration: '6s',
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite',
                animationDelay: '3s',
            }}>
                <svg width="22" height="18" viewBox="0 0 22 18" fill="none">
                    <polygon points="3,2 18,0 22,10 14,18 0,14" fill={cardBgLight1} stroke={colors.iconPrimary} strokeWidth="0.6" opacity="0.6" />
                </svg>
            </div>

            {/* Mid-right micro shard */}
            <div className="absolute z-30 pointer-events-none" style={{
                top: '55%', right: -8, width: 20, height: 16,
                animationName: 'singularity-shard-float',
                animationDuration: '4.5s',
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite',
                animationDelay: '2.5s',
            }}>
                <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
                    <polygon points="2,3 12,0 20,6 16,16 4,14" fill={cardBgLight2} stroke={colors.iconSecondary} strokeWidth="0.6" opacity="0.55" />
                </svg>
            </div>

            {/* ══════ MAIN CARD BODY — Void-black surface ══════ */}
            <div
                className="relative"
                style={{
                    padding: '3px',
                    background: `linear-gradient(160deg, ${hexAlpha(colors.border, 0.25)} 0%, ${hexAlpha(borderDark, 0.25)} 25%, ${hexAlpha(cardBgLight2, 0.25)} 50%, ${hexAlpha(borderDark, 0.25)} 75%, ${hexAlpha(colors.border, 0.25)} 100%)`,
                    borderRadius: 6,
                    boxShadow: `
                        0 0 30px ${toRgba(colors.iconPrimary, 0.08)},
                        0 0 60px ${toRgba(colors.progressFill, 0.04)},
                        0 16px 50px rgba(0,0,0,0.85)
                    `,
                    animationName: 'singularity-edge-pulse',
                    animationDuration: '4s',
                    animationTimingFunction: 'ease-in-out',
                    animationIterationCount: 'infinite',
                }}
            >
                {/* Cosmic purple edge glow lines */}
                <div className="absolute top-0 left-[5%] right-[5%] h-[2px] z-20"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${hexAlpha(colors.iconPrimary, 0.375)}, ${hexAlpha(colors.iconSecondary, 0.5)}, ${hexAlpha(colors.iconPrimary, 0.375)}, transparent)`,
                        boxShadow: `0 0 8px ${hexAlpha(colors.iconPrimary, 0.25)}`,
                        animationName: 'singularity-accretion-glow',
                        animationDuration: '3s',
                        animationIterationCount: 'infinite',
                    }}
                />
                <div className="absolute bottom-0 left-[5%] right-[5%] h-[2px] z-20"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${hexAlpha(colors.progressFill, 0.31)}, ${hexAlpha(colors.iconPrimary, 0.44)}, ${hexAlpha(colors.progressFill, 0.31)}, transparent)`,
                        boxShadow: `0 0 6px ${hexAlpha(colors.progressFill, 0.19)}`,
                        animationName: 'singularity-accretion-glow',
                        animationDuration: '3.5s',
                        animationIterationCount: 'infinite',
                        animationDelay: '1s',
                    }}
                />
                {/* Side purple edge glows */}
                <div className="absolute top-[8%] bottom-[8%] left-0 w-[2px] z-20"
                    style={{
                        background: `linear-gradient(180deg, transparent, ${hexAlpha(colors.iconPrimary, 0.31)}, ${hexAlpha(colors.iconSecondary, 0.44)}, ${hexAlpha(colors.iconPrimary, 0.31)}, transparent)`,
                        boxShadow: `0 0 6px ${hexAlpha(colors.iconPrimary, 0.19)}`,
                        animationName: 'singularity-accretion-glow',
                        animationDuration: '4s',
                        animationIterationCount: 'infinite',
                        animationDelay: '0.5s',
                    }}
                />
                <div className="absolute top-[8%] bottom-[8%] right-0 w-[2px] z-20"
                    style={{
                        background: `linear-gradient(180deg, transparent, ${hexAlpha(colors.progressFill, 0.31)}, ${hexAlpha(colors.iconPrimary, 0.44)}, ${hexAlpha(colors.progressFill, 0.31)}, transparent)`,
                        boxShadow: `0 0 6px ${hexAlpha(colors.progressFill, 0.19)}`,
                        animationName: 'singularity-accretion-glow',
                        animationDuration: '3.8s',
                        animationIterationCount: 'infinite',
                        animationDelay: '2s',
                    }}
                />

                {/* ── Corner energy nodes — cosmic purple glowing dots ── */}
                {[
                    { top: -5, left: -5 },
                    { top: -5, right: -5 },
                    { bottom: -5, left: -5 },
                    { bottom: -5, right: -5 },
                ].map((pos, i) => (
                    <div key={`node-${i}`} className="absolute z-30" style={pos}>
                        <div style={{
                            width: 10, height: 10, borderRadius: '50%',
                            background: `radial-gradient(circle, ${hexAlpha(colors.iconPrimary, 0.5)}, ${hexAlpha(colors.progressFill, 0.25)}, transparent)`,
                            boxShadow: `0 0 8px ${hexAlpha(colors.iconPrimary, 0.375)}, 0 0 16px ${hexAlpha(colors.progressFill, 0.19)}`,
                            animationName: 'singularity-accretion-glow',
                            animationDuration: `${2.5 + i * 0.5}s`,
                            animationIterationCount: 'infinite',
                            animationDelay: `${i * 0.4}s`,
                        }} />
                    </div>
                ))}

                {/* ══════ INNER BODY — Absolute void surface ══════ */}
                <div
                    className="relative overflow-hidden"
                    style={{
                        background: `linear-gradient(155deg, ${cardBgLight2} 0%, ${cardBg} 30%, ${cardBgDark2} 55%, ${cardBg} 80%, ${cardBgLight2} 100%)`,
                        borderRadius: 4,
                        boxShadow: `
                            inset 0 2px 8px rgba(0,0,0,0.8),
                            inset 0 -1px 4px rgba(0,0,0,0.5)
                        `,
                        animationName: 'singularity-inner-glow',
                        animationDuration: '5s',
                        animationTimingFunction: 'ease-in-out',
                        animationIterationCount: 'infinite',
                    }}
                >
                    {/* Subtle dark matter texture — geometric facets */}
                    <div
                        className="absolute inset-0 pointer-events-none z-[1]"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon points='20,0 40,15 30,40 10,40 0,15' fill='none' stroke='${colors.iconPrimary.replace('#', '%23')}' stroke-width='0.15' opacity='0.06'/%3E%3C/svg%3E")`,
                            backgroundSize: '40px 40px',
                        }}
                    />

                    {/* Deep cosmic ambient glow pools */}
                    <div className="absolute inset-0 pointer-events-none z-[3]" style={{
                        background: `
                            radial-gradient(ellipse at 20% 30%, ${hexAlpha(colors.iconPrimary, 0.03)} 0%, transparent 50%),
                            radial-gradient(ellipse at 80% 60%, ${hexAlpha(colors.iconSecondary, 0.02)} 0%, transparent 45%),
                            radial-gradient(ellipse at 50% 90%, ${hexAlpha(colors.progressFill, 0.03)} 0%, transparent 50%)
                        `,
                    }} />

                    {/* Gravitational distortion lines */}
                    <div className="absolute inset-0 pointer-events-none z-[2] overflow-hidden">
                        <div className="absolute" style={{
                            top: '25%', left: '10%', width: '80%', height: '1px',
                            background: `linear-gradient(90deg, transparent, ${hexAlpha(colors.iconPrimary, 0.06)}, ${hexAlpha(colors.iconSecondary, 0.09)}, ${hexAlpha(colors.iconPrimary, 0.06)}, transparent)`,
                            transform: 'rotate(-1deg)',
                        }} />
                        <div className="absolute" style={{
                            top: '65%', left: '5%', width: '90%', height: '1px',
                            background: `linear-gradient(90deg, transparent, ${hexAlpha(colors.progressFill, 0.06)}, ${hexAlpha(colors.iconPrimary, 0.08)}, ${hexAlpha(colors.progressFill, 0.06)}, transparent)`,
                            transform: 'rotate(0.5deg)',
                        }} />
                    </div>

                    {/* Drifting stardust motes */}
                    <div className="absolute inset-0 pointer-events-none z-[5] overflow-visible">
                        {[15, 35, 55, 75, 90].map((pos, i) => (
                            <div key={`dust-${i}`} className="absolute" style={{
                                left: `${pos}%`, top: `${20 + i * 12}%`, width: 4, height: 4,
                                background: `radial-gradient(circle, ${toRgba(colors.iconPrimary, 0.5)}, transparent)`,
                                borderRadius: '50%',
                                animationName: 'singularity-stardust-drift',
                                animationDuration: `${3 + i * 0.7}s`,
                                animationIterationCount: 'infinite',
                                animationDelay: `${i * 0.8}s`,
                            }} />
                        ))}
                    </div>

                    {/* ══════ TITLE SECTION ══════ */}
                    <div className="relative z-10 flex justify-between items-start"
                        style={{ padding: '16px 18px 8px 18px' }}>
                        {/* Left — Title + sub-objective */}
                        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                            <span
                                className="uppercase tracking-wider font-extrabold leading-tight truncate block"
                                style={{
                                    color: colors.challengeTitle,
                                    fontFamily: config.fonts.title,
                                    fontSize: config.fonts.titleSize + 1,
                                    textShadow: `0 0 12px ${toRgba(colors.iconPrimary, 0.2)}, 0 2px 4px rgba(0,0,0,0.9)`,
                                    letterSpacing: '0.1em',
                                }}
                            >
                                {challenge.challenge.title}
                            </span>
                            {config.display.showSubChallenges && challenge.subChallenges.length > 0 && (
                                <div className="flex flex-col gap-0.5">
                                    <span className="uppercase tracking-wider font-bold" style={{
                                        color: colors.subchallengeTitle,
                                        fontSize: Math.max(9, config.fonts.bodySize - 2),
                                        textShadow: `0 0 6px ${hexAlpha(colors.iconPrimary, 0.06)}`,
                                    }}>
                                        {challenge.subChallenges[0]?.title || 'OBJECTIVE'}
                                    </span>
                                    <div className="w-[70%] h-[1px]" style={{
                                        background: `linear-gradient(90deg, ${hexAlpha(colors.iconPrimary, 0.25)}, ${hexAlpha(colors.progressFill, 0.125)}, transparent)`,
                                    }} />
                                </div>
                            )}
                        </div>

                        {/* Right — X/Y Gravitational warped display */}
                        {(config.display.showProgressCount ?? true) && (
                            <div className="flex items-center ml-3 flex-shrink-0 relative" style={{
                                animationName: 'singularity-number-warp',
                                animationDuration: '8s',
                                animationTimingFunction: 'ease-in-out',
                                animationIterationCount: 'infinite',
                            }}>
                                {/* Dark matter housing */}
                                <div className="relative px-5 py-3" style={{
                                    background: `linear-gradient(180deg, ${lighten(cardBg, 0.05)}, ${darken(cardBg, 0.1)})`,
                                    border: `2px solid ${hexAlpha(borderLight, 0.375)}`,
                                    borderRadius: 6,
                                    boxShadow: `
                                    inset 0 0 20px ${hexAlpha(colors.iconPrimary, 0.03)},
                                    0 0 12px ${hexAlpha(colors.iconPrimary, 0.08)},
                                    0 0 24px ${hexAlpha(colors.progressFill, 0.03)}
                                `,
                                }}>
                                    {/* Inner glow ring */}
                                    <div className="absolute inset-[3px] pointer-events-none" style={{
                                        border: `1px solid ${hexAlpha(colors.iconPrimary, 0.08)}`,
                                        borderRadius: 4,
                                    }} />

                                    <span className="font-extrabold tabular-nums" style={{
                                        fontFamily: config.fonts.title,
                                        color: colors.progressCount,
                                        fontSize: Math.max(26, config.fonts.titleSize + 12),
                                        lineHeight: 1,
                                        textShadow: `0 0 12px ${hexAlpha(colors.iconPrimary, 0.5)}, 0 0 24px ${hexAlpha(colors.progressFill, 0.25)}, 0 0 4px #ffffff90`,
                                    }}>
                                        {currentVal}
                                    </span>
                                    <span className="mx-1.5 font-bold" style={{
                                        color: `${colors.progressCount}B3`,
                                        fontSize: Math.max(20, config.fonts.titleSize + 6),
                                    }}>/</span>
                                    <span className="font-bold tabular-nums" style={{
                                        color: `${colors.progressCount}EB`,
                                        fontSize: Math.max(23, config.fonts.titleSize + 9),
                                        lineHeight: 1,
                                        textShadow: `0 0 6px ${hexAlpha(colors.progressFill, 0.30)}`,
                                    }}>
                                        {targetVal}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ══════ PROGRESS BAR — Singularity vortex accretion bar ══════ */}
                    {config.display.showProgressBar && (
                        <div className="relative mx-4 my-3 z-10">
                            {/* Void channel housing */}
                            <div className="relative h-9 overflow-hidden" style={{
                                background: `linear-gradient(180deg, ${lighten(colors.progressEmpty, 0.06)}, ${darken(colors.progressEmpty, 0.08)}, ${lighten(colors.progressEmpty, 0.06)})`,
                                border: `2px solid ${hexAlpha(colors.border, 0.375)}`,
                                borderRadius: 20,
                                boxShadow: `
                                    inset 0 3px 12px rgba(0,0,0,0.95),
                                    inset 0 -1px 4px rgba(0,0,0,0.5),
                                    0 0 0 1px ${darken(cardBg, 0.4)},
                                    0 0 10px ${hexAlpha(colors.iconPrimary, 0.02)}
                                `,
                            }}>
                                {/* Inner edge cosmic glow */}
                                <div className="absolute top-[1px] left-[2%] right-[2%] h-[1px] z-10" style={{
                                    background: `linear-gradient(90deg, transparent, ${hexAlpha(colors.iconPrimary, 0.07)}, transparent)`,
                                }} />
                                <div className="absolute bottom-[1px] left-[2%] right-[2%] h-[1px] z-10" style={{
                                    background: `linear-gradient(90deg, transparent, ${hexAlpha(colors.progressFill, 0.06)}, transparent)`,
                                }} />

                                {/* ── FILL — Cosmic energy with gradient and glow ── */}
                                <motion.div
                                    className="absolute top-[4px] bottom-[4px] left-[4px] rounded-[14px]"
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${Math.max(0, progressPercent - 2)}%` }}
                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                    style={{
                                        background: `linear-gradient(180deg, ${colors.iconPrimary}, ${colors.progressFill}, ${colors.iconSecondary}, ${colors.progressFill}, ${colors.iconPrimary})`,
                                        boxShadow: `
                                            0 0 10px ${hexAlpha(colors.progressFill, 0.5)},
                                            0 0 20px ${hexAlpha(colors.iconSecondary, 0.31)},
                                            0 0 40px ${hexAlpha(colors.progressFill, 0.15)},
                                            inset 0 1px 0 ${toRgba(lighten(colors.iconPrimary, 0.4), 0.35)}
                                        `,
                                    }}
                                />

                                {/* Bright sweep across fill */}
                                <div className="absolute inset-0 overflow-hidden rounded-[16px]">
                                    <div className="absolute inset-y-0 w-[15%]" style={{
                                        background: `linear-gradient(90deg, transparent, ${toRgba(lighten(colors.iconPrimary, 0.4), 0.2)}, transparent)`,
                                        animationName: 'singularity-bar-sweep',
                                        animationDuration: '3.5s',
                                        animationTimingFunction: 'linear',
                                        animationIterationCount: 'infinite',
                                    }} />
                                </div>

                                {/* ── VORTEX at progress edge — swirling black hole ── */}
                                <motion.div
                                    className="absolute top-1/2 z-20"
                                    initial={{ left: '4px' }}
                                    animate={{ left: `${Math.max(2, (progressPercent / 100) * 93 + 2)}%` }}
                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                    style={{
                                        transform: 'translateY(-50%)',
                                    }}
                                >
                                    <div style={{
                                        width: 28, height: 28,
                                        position: 'relative',
                                    }}>
                                        {/* Outer accretion disk */}
                                        <div className="absolute inset-0" style={{
                                            borderRadius: '50%',
                                            background: `conic-gradient(from 0deg, ${hexAlpha(colors.iconPrimary, 0.25)}, ${hexAlpha(colors.iconSecondary, 0.31)}, ${hexAlpha(colors.progressFill, 0.375)}, ${hexAlpha(colors.iconPrimary, 0.19)}, ${hexAlpha(colors.iconSecondary, 0.25)}, ${hexAlpha(colors.progressFill, 0.31)}, ${hexAlpha(colors.iconPrimary, 0.25)})`,
                                            animationName: 'singularity-vortex-spin',
                                            animationDuration: '2s',
                                            animationTimingFunction: 'linear',
                                            animationIterationCount: 'infinite',
                                            boxShadow: `0 0 10px ${hexAlpha(colors.iconPrimary, 0.25)}, 0 0 20px ${hexAlpha(colors.progressFill, 0.125)}`,
                                        }} />
                                        {/* Inner event horizon */}
                                        <div className="absolute" style={{
                                            top: 6, left: 6, right: 6, bottom: 6,
                                            borderRadius: '50%',
                                            background: `radial-gradient(circle, #000000 40%, ${darken(cardBg, 0.3)} 70%, ${blend(cardBg, colors.progressFill, 0.1)})`,
                                            boxShadow: '0 0 6px #000',
                                        }} />
                                        {/* Core singularity dot */}
                                        <div className="absolute" style={{
                                            top: '50%', left: '50%',
                                            width: 4, height: 4,
                                            marginTop: -2, marginLeft: -2,
                                            borderRadius: '50%',
                                            background: colors.iconPrimary,
                                            boxShadow: `0 0 6px ${colors.iconPrimary}, 0 0 12px ${hexAlpha(colors.iconSecondary, 0.375)}`,
                                        }} />
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    )}

                    {/* ══════ BOTTOM SECTION: Given By + Reward ══════ */}
                    <div className="relative z-10 flex gap-3" style={{ padding: '4px 18px 14px 18px' }}>
                        {/* Given By */}
                        {config.display.showGivenBy && challenge.challenge.given_by && (
                            <div className="flex-1 flex items-center px-4 py-2" style={{
                                background: `linear-gradient(180deg, ${cardBgLight2}, ${cardBgDark1})`,
                                border: `1.5px solid ${hexAlpha(lighten(colors.border, 0.1), 0.25)}`,
                                borderRadius: 4,
                                boxShadow: `inset 0 1px 6px rgba(0,0,0,0.7), 0 0 6px ${hexAlpha(colors.iconPrimary, 0.02)}`,
                            }}>
                                <div>
                                    <div className="uppercase tracking-wider font-bold" style={{
                                        color: colors.dateText,
                                        fontSize: Math.max(8, config.fonts.bodySize - 3),
                                        letterSpacing: '0.12em',
                                        textShadow: `0 0 4px ${hexAlpha(colors.iconPrimary, 0.06)}`,
                                    }}>GIVEN BY</div>
                                    <div className="uppercase tracking-wider font-bold" style={{
                                        color: colors.viewerName,
                                        fontSize: Math.max(10, config.fonts.bodySize),
                                    }}>
                                        {challenge.challenge.given_by}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Reward */}
                        {(config.display.showReward ?? true) && (
                            <div className="flex-1 flex items-center px-4 py-2" style={{
                                background: `linear-gradient(180deg, ${cardBgLight2}, ${cardBgDark1})`,
                                border: `1.5px solid ${hexAlpha(lighten(colors.border, 0.1), 0.25)}`,
                                borderRadius: 4,
                                boxShadow: `inset 0 1px 6px rgba(0,0,0,0.7), 0 0 6px ${hexAlpha(colors.iconPrimary, 0.02)}`,
                            }}>
                                <div>
                                    <div className="uppercase tracking-wider font-bold" style={{
                                        color: colors.dateText,
                                        fontSize: Math.max(8, config.fonts.bodySize - 3),
                                        letterSpacing: '0.12em',
                                        textShadow: `0 0 4px ${hexAlpha(colors.iconPrimary, 0.06)}`,
                                    }}>REWARD</div>
                                    {rewardValue ? (
                                        <span
                                            className="font-bold uppercase tracking-wider"
                                            style={{ color: colors.viewerName, fontSize: Math.max(10, config.fonts.bodySize) }}
                                        >
                                            {rewardValue}
                                        </span>
                                    ) : (
                                        <div className="flex items-center gap-1.5">
                                            {challenge.subChallenges.map((sub) => {
                                                const isCompleted = sub.status === 'completed';
                                                return (
                                                    <div key={sub.id} className="flex items-center gap-1">
                                                        <Target size={10} style={{
                                                            color: isCompleted ? colors.completedIndicator : colors.iconSecondary,
                                                        }} />
                                                        <span
                                                            className={cn("font-mono text-[10px] font-bold", isCompleted && "line-through opacity-50")}
                                                            style={{ color: isCompleted ? colors.subchallengeCompleted : colors.viewerName }}
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
                                <Clock size={10} style={{ color: colors.dateText }} />
                                <span className="uppercase font-bold tracking-wider"
                                    style={{ color: colors.dateText, fontSize: Math.max(8, config.fonts.bodySize - 3) }}>
                                    {challenge.timeLeft}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
