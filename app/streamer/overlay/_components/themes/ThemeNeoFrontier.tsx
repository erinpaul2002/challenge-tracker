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

/* ── Inject keyframes (re-injects when colors change) ──── */
const STYLE_ID = 'neofrontier-keyframes';
function ensureKeyframes(colors: { iconPrimary: string; iconSecondary: string }) {
    const { iconPrimary, iconSecondary } = colors;
    const css = `
    @keyframes neofrontier-neon-pulse {
      0%, 100% { opacity: 0.6; box-shadow: 0 0 6px ${hexAlpha(iconPrimary, 0.38)}, 0 0 12px ${hexAlpha(iconPrimary, 0.19)}; }
      50% { opacity: 1; box-shadow: 0 0 14px ${hexAlpha(iconPrimary, 0.63)}, 0 0 28px ${hexAlpha(iconPrimary, 0.31)}, 0 0 40px ${hexAlpha(iconSecondary, 0.15)}; }
    }
    @keyframes neofrontier-crosshair-scan {
      0% { transform: translateX(-20px); opacity: 0; }
      15% { opacity: 0.7; }
      50% { transform: translateX(0); opacity: 0.5; }
      85% { opacity: 0.7; }
      100% { transform: translateX(20px); opacity: 0; }
    }
    @keyframes neofrontier-hologram-flicker {
      0%, 100% { opacity: 1; }
      92% { opacity: 1; }
      93% { opacity: 0.4; }
      94% { opacity: 1; }
      96% { opacity: 0.6; }
      97% { opacity: 1; }
    }
    @keyframes neofrontier-number-glow {
      0%, 100% { text-shadow: 0 0 8px ${hexAlpha(iconPrimary, 0.69)}, 0 0 16px ${hexAlpha(iconPrimary, 0.31)}, 0 2px 6px #000; }
      50% { text-shadow: 0 0 16px ${hexAlpha(iconPrimary, 0.94)}, 0 0 30px ${hexAlpha(iconPrimary, 0.56)}, 0 0 50px ${hexAlpha(iconSecondary, 0.25)}, 0 2px 6px #000; }
    }
    @keyframes neofrontier-bullet-load {
      0% { transform: translateX(-150%); }
      100% { transform: translateX(300%); }
    }
    @keyframes neofrontier-frame-glow {
      0%, 100% { box-shadow: 0 0 6px ${hexAlpha(iconPrimary, 0.08)}, 0 0 12px ${hexAlpha(iconPrimary, 0.03)}; }
      50% { box-shadow: 0 0 14px ${hexAlpha(iconPrimary, 0.19)}, 0 0 28px ${hexAlpha(iconPrimary, 0.08)}, 0 0 40px ${hexAlpha(iconPrimary, 0.03)}; }
    }
    @keyframes neofrontier-spark-drift {
      0% { opacity: 0; transform: translateY(0) translateX(0); }
      20% { opacity: 0.6; }
      100% { opacity: 0; transform: translateY(-14px) translateX(6px); }
    }
    `;
    injectDynamicKeyframes(STYLE_ID, css);
}

/* ── Main Neo Frontier Theme Component ─────────────────── */
export default function ThemeNeoFrontier({ challenge, config, fade }: ThemeRendererProps) {
    const [particlesInit, setParticlesInit] = useState(false);
    const colors = config.colors;

    /** Encode a hex color for use inside SVG data-URIs (%23 instead of #) */
    const enc = (hex: string) => hex.replace('#', '%23');

    useEffect(() => {
        ensureKeyframes({ iconPrimary: colors.iconPrimary, iconSecondary: colors.iconSecondary });
    }, [colors.iconPrimary, colors.iconSecondary]);

    useEffect(() => {
        initParticlesEngine(async (engine: Engine) => {
            await loadSlim(engine);
        }).then(() => {
            setParticlesInit(true);
        });
    }, []);

    // Cyan spark particles — colors derived from iconPrimary
    const particlesConfig = useMemo(() => ({
        particles: {
            number: { value: 10, density: { enable: true, value_area: 500 } },
            color: {
                value: [
                    colors.iconPrimary,
                    blend(colors.iconPrimary, colors.iconSecondary, 0.15),
                    lighten(colors.iconPrimary, 0.25),
                    lighten(colors.iconPrimary, 0.50),
                    colors.iconSecondary,
                ],
            },
            shape: { type: 'circle' },
            opacity: { value: 0.7, random: true, anim: { enable: true, speed: 1.2, opacity_min: 0, sync: false } },
            size: { value: 2, random: true, anim: { enable: true, speed: 0.5, size_min: 0.2, sync: false } },
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
    }), [colors.iconPrimary, colors.iconSecondary]);

    const progressPercent = challenge.progress;
    const currentVal = Math.round((progressPercent / 100) * (challenge.subChallenges[0]?.target_limit || 1));
    const targetVal = challenge.subChallenges[0]?.target_limit || 1;
    const rewardValue = challenge.challenge.reward_amount?.trim();

    // Number of bullet segments for progress bar
    const totalSegments = 12;
    const filledSegments = Math.round((progressPercent / 100) * totalSegments);

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
            {/* Cyan spark particles */}
            <div className="absolute inset-0 pointer-events-none z-50 overflow-visible"
                style={{ top: -20, bottom: -10, left: -10, right: -10 }}>
                {particlesInit && (
                    <Particles
                        id="neofrontier-spark-particles"
                        options={particlesConfig}
                        className="w-full h-full"
                    />
                )}
            </div>

            {/* ══════ OUTER FRAME — Heavy brass/copper border ══════ */}
            <div
                className="relative"
                style={{
                    padding: '6px',
                    background: `linear-gradient(160deg, ${colors.border} 0%, ${darken(colors.border, 0.20)} 25%, ${darken(colors.border, 0.35)} 50%, ${darken(colors.border, 0.20)} 75%, ${colors.border} 100%)`,
                    borderRadius: 6,
                    boxShadow: `
                        0 0 0 2px ${darken(colors.cardBackground, 0.15)},
                        0 0 0 3px ${hexAlpha(lighten(colors.border, 0.08), 0.56)},
                        0 0 30px ${toRgba(colors.iconPrimary, 0.08)},
                        0 0 60px ${toRgba(colors.iconSecondary, 0.04)},
                        0 16px 50px rgba(0,0,0,0.8)
                    `,
                    animationName: 'neofrontier-frame-glow',
                    animationDuration: '4s',
                    animationTimingFunction: 'ease-in-out',
                    animationIterationCount: 'infinite',
                }}
            >
                {/* Metallic top accent bar */}
                <div className="absolute top-0 left-[8%] right-[8%] h-[3px] z-20"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${lighten(colors.border, 0.35)}, ${lighten(colors.border, 0.45)}, ${lighten(colors.border, 0.35)}, transparent)`,
                    }}
                />
                {/* Metallic bottom accent bar */}
                <div className="absolute bottom-0 left-[8%] right-[8%] h-[3px] z-20"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${lighten(colors.border, 0.20)}, ${lighten(colors.border, 0.35)}, ${lighten(colors.border, 0.20)}, transparent)`,
                    }}
                />
                {/* Left metallic edge */}
                <div className="absolute top-[8%] bottom-[8%] left-0 w-[3px] z-20"
                    style={{
                        background: `linear-gradient(180deg, transparent, ${lighten(colors.border, 0.35)}, ${lighten(colors.border, 0.45)}, ${lighten(colors.border, 0.35)}, transparent)`,
                    }}
                />
                {/* Right metallic edge */}
                <div className="absolute top-[8%] bottom-[8%] right-0 w-[3px] z-20"
                    style={{
                        background: `linear-gradient(180deg, transparent, ${lighten(colors.border, 0.35)}, ${lighten(colors.border, 0.45)}, ${lighten(colors.border, 0.35)}, transparent)`,
                    }}
                />

                {/* ── CYAN NEON TUBE accents on frame ── */}
                {/* Left neon tube */}
                <div className="absolute top-[12%] bottom-[12%] left-[3px] w-[3px] z-20"
                    style={{
                        background: `linear-gradient(180deg, transparent, ${hexAlpha(colors.iconPrimary, 0.56)}, ${hexAlpha(colors.iconPrimary, 0.75)}, ${hexAlpha(colors.iconPrimary, 0.56)}, transparent)`,
                        boxShadow: `0 0 8px ${colors.iconPrimary}, 0 0 16px ${hexAlpha(colors.iconPrimary, 0.25)}`,
                        borderRadius: 2,
                        animationName: 'neofrontier-neon-pulse',
                        animationDuration: '3s',
                        animationIterationCount: 'infinite',
                    }}
                />
                {/* Right neon tube */}
                <div className="absolute top-[12%] bottom-[12%] right-[3px] w-[3px] z-20"
                    style={{
                        background: `linear-gradient(180deg, transparent, ${hexAlpha(colors.iconPrimary, 0.56)}, ${hexAlpha(colors.iconPrimary, 0.75)}, ${hexAlpha(colors.iconPrimary, 0.56)}, transparent)`,
                        boxShadow: `0 0 8px ${colors.iconPrimary}, 0 0 16px ${hexAlpha(colors.iconPrimary, 0.25)}`,
                        borderRadius: 2,
                        animationName: 'neofrontier-neon-pulse',
                        animationDuration: '3s',
                        animationIterationCount: 'infinite',
                        animationDelay: '1.5s',
                    }}
                />
                {/* Top neon accent */}
                <div className="absolute top-[3px] left-[15%] right-[15%] h-[2px] z-20"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${hexAlpha(colors.iconPrimary, 0.44)}, ${hexAlpha(colors.iconPrimary, 0.63)}, ${hexAlpha(colors.iconPrimary, 0.44)}, transparent)`,
                        boxShadow: `0 0 6px ${hexAlpha(colors.iconPrimary, 0.50)}`,
                        animationName: 'neofrontier-neon-pulse',
                        animationDuration: '3.5s',
                        animationIterationCount: 'infinite',
                        animationDelay: '0.5s',
                    }}
                />
                {/* Bottom neon accent */}
                <div className="absolute bottom-[3px] left-[15%] right-[15%] h-[2px] z-20"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${hexAlpha(colors.iconPrimary, 0.38)}, ${hexAlpha(colors.iconPrimary, 0.56)}, ${hexAlpha(colors.iconPrimary, 0.38)}, transparent)`,
                        boxShadow: `0 0 5px ${hexAlpha(colors.iconPrimary, 0.38)}`,
                        animationName: 'neofrontier-neon-pulse',
                        animationDuration: '4s',
                        animationIterationCount: 'infinite',
                        animationDelay: '1s',
                    }}
                />

                {/* ── CORNER BOLTS — Brass rivets ── */}
                {[{ top: -4, left: -4 }, { top: -4, right: -4 }, { bottom: -4, left: -4 }, { bottom: -4, right: -4 }].map((pos, i) => (
                    <div key={`bolt-${i}`} className="absolute z-30" style={pos}>
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                            <circle cx="14" cy="14" r="10" fill={colors.border} stroke={lighten(colors.border, 0.18)} strokeWidth="1.5" />
                            <circle cx="14" cy="14" r="7" fill={darken(colors.border, 0.20)} stroke={lighten(colors.border, 0.08)} strokeWidth="0.8" />
                            <circle cx="14" cy="14" r="3.5" fill={colors.iconPrimary} opacity="0.3" />
                            <line x1="10" y1="14" x2="18" y2="14" stroke={lighten(colors.border, 0.18)} strokeWidth="1.2" />
                            <line x1="14" y1="10" x2="14" y2="18" stroke={lighten(colors.border, 0.18)} strokeWidth="1.2" />
                        </svg>
                    </div>
                ))}

                {/* ── SIDE CLAMP PROTRUSIONS — Tech clamps ── */}
                {/* Left side clamp */}
                <div className="absolute z-30" style={{ top: '30%', left: -7 }}>
                    <svg width="12" height="36" viewBox="0 0 12 36" fill="none">
                        <rect x="0" y="2" width="10" height="32" rx="2" fill={darken(colors.border, 0.20)} stroke={lighten(colors.border, 0.08)} strokeWidth="0.6" />
                        <rect x="3" y="6" width="4" height="24" rx="1" fill={colors.iconPrimary} opacity="0.4" />
                        <rect x="3" y="6" width="4" height="24" rx="1" fill="none" stroke={colors.iconPrimary} strokeWidth="0.3" opacity="0.6" />
                    </svg>
                </div>
                {/* Right side clamp */}
                <div className="absolute z-30" style={{ top: '30%', right: -7 }}>
                    <svg width="12" height="36" viewBox="0 0 12 36" fill="none">
                        <rect x="2" y="2" width="10" height="32" rx="2" fill={darken(colors.border, 0.20)} stroke={lighten(colors.border, 0.08)} strokeWidth="0.6" />
                        <rect x="5" y="6" width="4" height="24" rx="1" fill={colors.iconPrimary} opacity="0.4" />
                        <rect x="5" y="6" width="4" height="24" rx="1" fill="none" stroke={colors.iconPrimary} strokeWidth="0.3" opacity="0.6" />
                    </svg>
                </div>

                {/* ══════ INNER BODY — Mixed wood + tech surface ══════ */}
                <div
                    className="relative overflow-hidden"
                    style={{
                        background: `linear-gradient(155deg, ${lighten(colors.cardBackground, 0.10)} 0%, ${lighten(colors.cardBackground, 0.05)} 30%, ${lighten(colors.cardBackground, 0.02)} 55%, ${lighten(colors.cardBackground, 0.05)} 80%, ${lighten(colors.cardBackground, 0.10)} 100%)`,
                        borderRadius: 3,
                        boxShadow: `
                            inset 0 2px 6px rgba(0,0,0,0.6),
                            inset 0 -1px 3px rgba(0,0,0,0.4)
                        `,
                    }}
                >
                    {/* Walnut wood grain texture (left side — cowboy grip) */}
                    <div
                        className="absolute top-0 left-0 bottom-0 pointer-events-none z-[1]"
                        style={{
                            width: '45%',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='20' viewBox='0 0 60 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10 Q15 6 30 10 Q45 14 60 10' fill='none' stroke='${enc(lighten(colors.border, 0.25))}' stroke-width='0.6' opacity='0.15'/%3E%3Cpath d='M0 5 Q15 2 30 5 Q45 8 60 5' fill='none' stroke='${enc(lighten(colors.border, 0.12))}' stroke-width='0.4' opacity='0.1'/%3E%3Cpath d='M0 15 Q15 12 30 15 Q45 18 60 15' fill='none' stroke='${enc(lighten(colors.border, 0.32))}' stroke-width='0.5' opacity='0.12'/%3E%3C/svg%3E")`,
                            backgroundSize: '60px 20px',
                            background: `
                                url("data:image/svg+xml,%3Csvg width='60' height='20' viewBox='0 0 60 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10 Q15 6 30 10 Q45 14 60 10' fill='none' stroke='${enc(lighten(colors.border, 0.25))}' stroke-width='0.6' opacity='0.15'/%3E%3Cpath d='M0 5 Q15 2 30 5 Q45 8 60 5' fill='none' stroke='${enc(lighten(colors.border, 0.12))}' stroke-width='0.4' opacity='0.1'/%3E%3Cpath d='M0 15 Q15 12 30 15 Q45 18 60 15' fill='none' stroke='${enc(lighten(colors.border, 0.32))}' stroke-width='0.5' opacity='0.12'/%3E%3C/svg%3E"),
                                linear-gradient(180deg, ${hexAlpha(darken(colors.border, 0.25), 0.13)}, ${darken(colors.border, 0.35)} 50%, ${hexAlpha(darken(colors.border, 0.25), 0.13)})
                            `,
                        }}
                    />

                    {/* Sci-fi tech panel texture (right side) */}
                    <div
                        className="absolute top-0 right-0 bottom-0 pointer-events-none z-[1]"
                        style={{
                            width: '55%',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='30' height='30' fill='none' stroke='${enc(colors.iconPrimary)}' stroke-width='0.2' opacity='0.05'/%3E%3Cline x1='0' y1='15' x2='30' y2='15' stroke='${enc(colors.iconPrimary)}' stroke-width='0.15' opacity='0.04'/%3E%3Cline x1='15' y1='0' x2='15' y2='30' stroke='${enc(colors.iconPrimary)}' stroke-width='0.15' opacity='0.04'/%3E%3C/svg%3E")`,
                            backgroundSize: '30px 30px',
                        }}
                    />

                    {/* Scratch marks on brass */}
                    <div className="absolute inset-0 pointer-events-none z-[2] overflow-hidden">
                        <div className="absolute" style={{
                            top: '20%', left: '5%', width: '35%', height: '1px',
                            background: `linear-gradient(90deg, transparent, ${hexAlpha(lighten(colors.border, 0.35), 0.13)}, ${hexAlpha(lighten(colors.border, 0.45), 0.19)}, transparent)`,
                            transform: 'rotate(-3deg)',
                        }} />
                        <div className="absolute" style={{
                            top: '55%', left: '10%', width: '25%', height: '1px',
                            background: `linear-gradient(90deg, transparent, ${hexAlpha(lighten(colors.border, 0.20), 0.13)}, transparent)`,
                            transform: 'rotate(2deg)',
                        }} />
                        <div className="absolute" style={{
                            top: '38%', right: '5%', width: '30%', height: '1px',
                            background: `linear-gradient(90deg, transparent, ${hexAlpha(colors.iconPrimary, 0.06)}, ${hexAlpha(colors.iconPrimary, 0.09)}, transparent)`,
                            transform: 'rotate(-2deg)',
                        }} />
                        <div className="absolute" style={{
                            top: '72%', right: '15%', width: '20%', height: '1px',
                            background: `linear-gradient(90deg, transparent, ${hexAlpha(colors.iconPrimary, 0.03)}, transparent)`,
                            transform: 'rotate(4deg)',
                        }} />
                    </div>

                    {/* Ambient copper/brass glow pools */}
                    <div className="absolute inset-0 pointer-events-none z-[3]" style={{
                        background: `
                            radial-gradient(ellipse at 15% 30%, ${hexAlpha(lighten(colors.border, 0.25), 0.08)} 0%, transparent 45%),
                            radial-gradient(ellipse at 80% 50%, ${hexAlpha(colors.iconPrimary, 0.03)} 0%, transparent 40%),
                            radial-gradient(ellipse at 50% 80%, ${hexAlpha(colors.border, 0.06)} 0%, transparent 50%)
                        `,
                    }} />

                    {/* Cyan spark accents */}
                    <div className="absolute inset-0 pointer-events-none z-[5] overflow-visible">
                        {[12, 42, 72, 88].map((pos, i) => (
                            <div key={`spark-${i}`} className="absolute" style={{
                                left: `${pos}%`, top: -4, width: 8, height: 8,
                                background: `radial-gradient(ellipse at center, ${toRgba(colors.iconPrimary, 0.3)}, transparent)`,
                                animationName: 'neofrontier-spark-drift',
                                animationDuration: `${2.5 + i * 0.8}s`,
                                animationIterationCount: 'infinite',
                                animationDelay: `${i * 0.6}s`,
                            }} />
                        ))}
                    </div>

                    {/* ══════ TITLE SECTION ══════ */}
                    <div className="relative z-10 flex justify-between items-start"
                        style={{ padding: '16px 18px 8px 18px' }}>
                        {/* Left — Title + sub-objective */}
                        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                            {/* Crosshair targeting element on title */}
                            <div className="relative">
                                <div className="absolute left-[-8px] top-1/2 -translate-y-1/2 pointer-events-none" style={{
                                    animationName: 'neofrontier-crosshair-scan',
                                    animationDuration: '4s',
                                    animationIterationCount: 'infinite',
                                }}>
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                        <circle cx="7" cy="7" r="5" stroke={colors.iconPrimary} strokeWidth="0.8" opacity="0.5" />
                                        <line x1="0" y1="7" x2="4" y2="7" stroke={colors.iconPrimary} strokeWidth="0.6" opacity="0.6" />
                                        <line x1="10" y1="7" x2="14" y2="7" stroke={colors.iconPrimary} strokeWidth="0.6" opacity="0.6" />
                                        <line x1="7" y1="0" x2="7" y2="4" stroke={colors.iconPrimary} strokeWidth="0.6" opacity="0.6" />
                                        <line x1="7" y1="10" x2="7" y2="14" stroke={colors.iconPrimary} strokeWidth="0.6" opacity="0.6" />
                                    </svg>
                                </div>
                                <span
                                    className="uppercase tracking-wider font-extrabold leading-tight truncate block"
                                    style={{
                                                        color: colors.challengeTitle,
                                        fontFamily: config.fonts.title,
                                        fontSize: config.fonts.titleSize + 1,
                                        textShadow: `0 0 10px ${toRgba(colors.iconPrimary, 0.15)}, 0 2px 4px rgba(0,0,0,0.9)`,
                                        letterSpacing: '0.1em',
                                    }}
                                >
                                    {challenge.challenge.title}
                                </span>
                            </div>
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
                                        background: `linear-gradient(90deg, ${hexAlpha(lighten(colors.border, 0.40), 0.63)}, ${hexAlpha(lighten(colors.border, 0.15), 0.31)}, transparent)`,
                                    }} />
                                </div>
                            )}
                        </div>

                        {/* Right — X/Y Hexagonal holographic display */}
                        {(config.display.showProgressCount ?? true) && (
                            <div className="flex items-center ml-3 flex-shrink-0 relative" style={{
                                animationName: 'neofrontier-hologram-flicker',
                                animationDuration: '6s',
                                animationIterationCount: 'infinite',
                            }}>
                                {/* Hexagonal housing */}
                                <div className="relative px-5 py-3" style={{
                                    background: `linear-gradient(180deg, ${colors.cardBackground}, ${darken(colors.cardBackground, 0.20)})`,
                                    border: `2px solid ${hexAlpha(lighten(colors.border, 0.08), 0.50)}`,
                                    borderRadius: 4,
                                    clipPath: 'polygon(10% 0%, 90% 0%, 100% 20%, 100% 80%, 90% 100%, 10% 100%, 0% 80%, 0% 20%)',
                                    boxShadow: `
                                    inset 0 0 15px ${hexAlpha(colors.iconPrimary, 0.03)},
                                    0 0 10px ${hexAlpha(colors.iconPrimary, 0.06)},
                                    0 0 20px ${hexAlpha(colors.iconPrimary, 0.03)}
                                `,
                                }}>
                                    {/* Inner glow ring */}
                                    <div className="absolute inset-[3px] pointer-events-none" style={{
                                        border: `1px solid ${hexAlpha(colors.iconPrimary, 0.13)}`,
                                        clipPath: 'polygon(10% 0%, 90% 0%, 100% 20%, 100% 80%, 90% 100%, 10% 100%, 0% 80%, 0% 20%)',
                                    }} />

                                    <span className="font-extrabold tabular-nums" style={{
                                        fontFamily: config.fonts.title,
                                        color: colors.progressCount,
                                        fontSize: Math.max(26, config.fonts.titleSize + 12),
                                        lineHeight: 1,
                                        animationName: 'neofrontier-number-glow',
                                        animationDuration: '3s',
                                        animationIterationCount: 'infinite',
                                    }}>
                                        {currentVal}
                                    </span>
                                    <span className="mx-1.5 font-bold" style={{
                                        color: hexAlpha(colors.progressCount, 0.72),
                                        fontSize: Math.max(20, config.fonts.titleSize + 6),
                                    }}>/</span>
                                    <span className="font-bold tabular-nums" style={{
                                        color: hexAlpha(colors.progressCount, 0.92),
                                        fontSize: Math.max(22, config.fonts.titleSize + 8),
                                        lineHeight: 1,
                                    }}>
                                        {targetVal}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ══════ PROGRESS BAR — Holographic bullet chamber segments ══════ */}
                    {config.display.showProgressBar && (
                        <div className="relative mx-4 my-3 z-10">
                            {/* Recessed brass channel housing */}
                            <div className="relative h-9 overflow-hidden" style={{
                                background: `linear-gradient(180deg, ${colors.progressEmpty}, ${darken(colors.progressEmpty, 0.45)}, ${colors.progressEmpty})`,
                                border: `2px solid ${hexAlpha(colors.border, 0.50)}`,
                                borderRadius: 20,
                                boxShadow: `
                                    inset 0 3px 10px rgba(0,0,0,0.9),
                                    inset 0 -1px 4px rgba(0,0,0,0.5),
                                    0 0 0 1px ${darken(colors.progressEmpty, 0.60)},
                                    0 0 8px ${hexAlpha(colors.iconPrimary, 0.03)}
                                `,
                            }}>
                                {/* Subtle inner edge glow */}
                                <div className="absolute top-[1px] left-[2%] right-[2%] h-[1px] z-10" style={{
                                    background: `linear-gradient(90deg, transparent, ${hexAlpha(colors.iconPrimary, 0.08)}, transparent)`,
                                }} />
                                <div className="absolute bottom-[1px] left-[2%] right-[2%] h-[1px] z-10" style={{
                                    background: `linear-gradient(90deg, transparent, ${hexAlpha(colors.iconPrimary, 0.06)}, transparent)`,
                                }} />

                                {/* ── SEGMENTED BULLET-CHAMBER FILL ── */}
                                <div className="absolute top-[4px] bottom-[4px] left-[4px] right-[4px] flex gap-[3px] items-stretch">
                                    {Array.from({ length: totalSegments }).map((_, i) => {
                                        const isFilled = i < filledSegments;
                                        return (
                                            <motion.div
                                                key={`seg-${i}`}
                                                className="flex-1 rounded-[3px]"
                                                initial={{ opacity: 0, scaleY: 0.3 }}
                                                animate={{
                                                    opacity: isFilled ? 1 : 0.15,
                                                    scaleY: isFilled ? 1 : 0.6,
                                                }}
                                                transition={{
                                                    duration: 0.4,
                                                    delay: isFilled ? i * 0.05 : 0,
                                                    ease: 'easeOut',
                                                }}
                                                style={{
                                                    background: isFilled
                                                        ? `linear-gradient(180deg, ${colors.iconPrimary}, ${colors.progressFill}, ${colors.iconSecondary}, ${colors.progressFill}, ${colors.iconPrimary})`
                                                        : `linear-gradient(180deg, ${colors.progressEmpty}, ${colors.cardBackground}, ${colors.progressEmpty})`,
                                                    boxShadow: isFilled
                                                        ? `0 0 8px ${hexAlpha(colors.progressFill, 0.50)}, 0 0 16px ${hexAlpha(colors.progressFill, 0.25)}, inset 0 1px 0 ${toRgba(lighten(colors.iconPrimary, 0.50), 0.3)}`
                                                        : 'inset 0 1px 3px rgba(0,0,0,0.4)',
                                                    border: isFilled
                                                        ? `1px solid ${hexAlpha(colors.progressFill, 0.38)}`
                                                        : `1px solid ${hexAlpha(colors.border, 0.13)}`,
                                                }}
                                            />
                                        );
                                    })}
                                </div>

                                {/* Bright sweep across filled segments */}
                                <div className="absolute inset-0 overflow-hidden rounded-[16px]">
                                    <div className="absolute inset-y-0 w-[15%]" style={{
                                        background: `linear-gradient(90deg, transparent, ${toRgba(lighten(colors.iconPrimary, 0.50), 0.2)}, transparent)`,
                                        animationName: 'neofrontier-bullet-load',
                                        animationDuration: '3s',
                                        animationTimingFunction: 'linear',
                                        animationIterationCount: 'infinite',
                                    }} />
                                </div>

                                {/* Bullet tip indicator at progress edge */}
                                <motion.div
                                    className="absolute top-[2px] bottom-[2px] w-[6px] z-20"
                                    initial={{ left: '4px' }}
                                    animate={{ left: `${Math.max(3, (progressPercent / 100) * 92 + 3)}%` }}
                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                    style={{
                                        background: `linear-gradient(180deg, ${lighten(colors.border, 0.55)}, ${lighten(colors.border, 0.30)}, ${lighten(colors.border, 0.15)}, ${lighten(colors.border, 0.30)}, ${lighten(colors.border, 0.55)})`,
                                        borderRadius: '0 4px 4px 0',
                                        boxShadow: `0 0 4px ${hexAlpha(colors.iconPrimary, 0.25)}, 2px 0 8px ${hexAlpha(colors.iconPrimary, 0.13)}`,
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* ══════ BOTTOM SECTION: Given By + Reward ══════ */}
                    <div className="relative z-10 flex gap-3" style={{ padding: '4px 18px 14px 18px' }}>
                        {/* Given By */}
                        {config.display.showGivenBy && challenge.challenge.given_by && (
                            <div className="flex-1 flex items-center px-4 py-2" style={{
                                background: `linear-gradient(180deg, ${colors.cardBackground}, ${darken(colors.cardBackground, 0.30)})`,
                                border: `1.5px solid ${hexAlpha(lighten(colors.border, 0.08), 0.38)}`,
                                borderRadius: 4,
                                boxShadow: `inset 0 1px 5px rgba(0,0,0,0.6), 0 0 6px ${hexAlpha(colors.iconPrimary, 0.02)}`,
                                clipPath: 'polygon(4% 0%, 96% 0%, 100% 30%, 100% 100%, 0% 100%, 0% 30%)',
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
                                background: `linear-gradient(180deg, ${colors.cardBackground}, ${darken(colors.cardBackground, 0.30)})`,
                                border: `1.5px solid ${hexAlpha(lighten(colors.border, 0.08), 0.38)}`,
                                borderRadius: 4,
                                boxShadow: `inset 0 1px 5px rgba(0,0,0,0.6), 0 0 6px ${hexAlpha(colors.iconPrimary, 0.02)}`,
                                clipPath: 'polygon(4% 0%, 96% 0%, 100% 30%, 100% 100%, 0% 100%, 0% 30%)',
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
