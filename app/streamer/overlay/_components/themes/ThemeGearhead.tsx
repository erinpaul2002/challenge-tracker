import { useMemo, useEffect, useState } from 'react';
import { Target, Clock } from 'lucide-react';
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

/* ── Inject keyframes dynamically based on config colors ── */
const STYLE_ID = 'gearhead-keyframes';
function buildKeyframesCSS(colors: { iconPrimary: string; iconSecondary: string }) {
    return `
    @keyframes gearhead-piston {
      0%, 100% { transform: translateY(0); }
      25% { transform: translateY(-3px); }
      50% { transform: translateY(2px); }
      75% { transform: translateY(-1px); }
    }
    @keyframes gearhead-steam {
      0% { opacity: 0.35; transform: translateY(0) scaleX(1); }
      40% { opacity: 0.18; transform: translateY(-12px) scaleX(1.5); }
      100% { opacity: 0; transform: translateY(-28px) scaleX(2.2); }
    }
    @keyframes gearhead-steam-drift {
      0% { opacity: 0.25; transform: translate(0, 0) scale(1); }
      50% { opacity: 0.12; transform: translate(6px, -14px) scale(1.4); }
      100% { opacity: 0; transform: translate(10px, -30px) scale(2); }
    }
    @keyframes gearhead-gauge-pulse {
      0%, 100% { box-shadow: inset 0 0 6px ${toRgba(colors.iconPrimary, 0.2)}, 0 0 4px ${toRgba(colors.iconPrimary, 0.15)}; }
      50% { box-shadow: inset 0 0 12px ${toRgba(colors.iconPrimary, 0.4)}, 0 0 10px ${toRgba(colors.iconPrimary, 0.3)}; }
    }
    @keyframes gearhead-needle {
      0%, 100% { transform: rotate(-2deg); }
      50% { transform: rotate(2deg); }
    }
    @keyframes gearhead-heat-shimmer {
      0%, 100% { opacity: 0.03; }
      50% { opacity: 0.07; }
    }
    @keyframes gearhead-bolt-gleam {
      0%, 80%, 100% { opacity: 0; }
      90% { opacity: 0.5; }
    }
    `;
}

/* ── Hex bolt decoration ───────────────────────────────── */
function HexBolt({ className, size = 14, cardBg, borderColor }: { className?: string; size?: number; cardBg: string; borderColor: string }) {
    const boltStroke = darken(cardBg, 0.3);
    const boltCenter = lighten(cardBg, 0.02);
    const slotColor = lighten(cardBg, 0.08);
    const gradStart = lighten(borderColor, 0.15);
    const gradEnd = darken(borderColor, 0.15);
    return (
        <div
            className={cn('absolute z-20', className)}
            style={{ width: size, height: size }}
        >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <polygon
                    points="12,1 22,6.5 22,17.5 12,23 2,17.5 2,6.5"
                    fill="url(#gearBoltGrad)"
                    stroke={boltStroke}
                    strokeWidth="1.5"
                />
                <circle cx="12" cy="12" r="4.5" fill={boltCenter} />
                {/* Cross slot */}
                <line x1="9" y1="12" x2="15" y2="12" stroke={slotColor} strokeWidth="1.5" />
                <line x1="12" y1="9" x2="12" y2="15" stroke={slotColor} strokeWidth="1.5" />
                {/* Gleam highlight */}
                <circle
                    cx="9" cy="9" r="2"
                    fill="white"
                    opacity="0.06"
                />
                <defs>
                    <radialGradient id="gearBoltGrad" cx="35%" cy="30%">
                        <stop offset="0%" stopColor={gradStart} />
                        <stop offset="100%" stopColor={gradEnd} />
                    </radialGradient>
                </defs>
            </svg>
            {/* Bolt gleam animation overlay */}
            <div
                className="absolute inset-0 rounded-full"
                style={{
                    background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent 60%)',
                    animationName: 'gearhead-bolt-gleam',
                    animationDuration: '8s',
                    animationIterationCount: 'infinite',
                }}
            />
        </div>
    );
}

/* ── Exhaust pipe decoration ──────────────────────────── */
function ExhaustPipe({ className, delay = 0, borderColor, cardBg }: { className?: string; delay?: number; borderColor: string; cardBg: string }) {
    const pipeBody = lighten(borderColor, 0.1);
    const pipeMid = lighten(borderColor, 0.2);
    const pipeBorder = darken(borderColor, 0.35);
    const openTop = darken(cardBg, 0.3);
    const openBot = darken(cardBg, 0.1);
    return (
        <div className={cn('absolute z-30', className)}>
            {/* Pipe body */}
            <div
                style={{
                    width: 14,
                    height: 22,
                    background: `linear-gradient(90deg, ${pipeBody}, ${pipeMid}, ${pipeBody})`,
                    borderRadius: '3px 3px 0 0',
                    border: `1px solid ${pipeBorder}`,
                    boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.5), 0 -1px 3px rgba(0,0,0,0.4)',
                    position: 'relative',
                }}
            >
                {/* Heat-blued titanium tint */}
                <div
                    className="absolute inset-0 rounded-t-[3px]"
                    style={{
                        background: 'linear-gradient(180deg, rgba(80,100,160,0.3), rgba(120,80,40,0.2), transparent)',
                    }}
                />
                {/* Pipe opening */}
                <div
                    className="absolute top-0 left-1 right-1 h-[3px] rounded-t-[2px]"
                    style={{
                        background: `linear-gradient(180deg, ${openTop}, ${openBot})`,
                    }}
                />
            </div>
            {/* Steam wisps */}
            <div
                className="absolute -top-4 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, rgba(200,210,220,0.3), transparent 70%)',
                    animationName: 'gearhead-steam',
                    animationDuration: '3s',
                    animationIterationCount: 'infinite',
                    animationDelay: `${delay}s`,
                }}
            />
            <div
                className="absolute -top-2 left-1/2 -translate-x-1/3 w-4 h-4 rounded-full pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, rgba(200,210,220,0.2), transparent 70%)',
                    animationName: 'gearhead-steam-drift',
                    animationDuration: '4s',
                    animationIterationCount: 'infinite',
                    animationDelay: `${delay + 0.8}s`,
                }}
            />
        </div>
    );
}

/* ── Tachometer Gauge Number Display ──────────────────── */
function TachoGauge({
    value,
    maxValue,
    color,
    fontFamily,
    fontSize,
    borderColor,
    cardBg,
    accentWarm,
}: {
    value: number;
    maxValue: number;
    color: string;
    fontFamily: string;
    fontSize: number;
    borderColor: string;
    cardBg: string;
    accentWarm: string;
}) {
    const ratio = Math.min(value / maxValue, 1);
    const needleAngle = -120 + ratio * 240;
    const gaugeOuter = lighten(cardBg, 0.08);
    const gaugeInner = darken(cardBg, 0.2);
    const gaugeBorder = darken(borderColor, 0.1);
    const ringOuter = darken(cardBg, 0.2);
    const ringMid = borderColor;
    const capLight = lighten(borderColor, 0.1);
    const capDark = darken(borderColor, 0.2);

    return (
        <div
            className="relative flex items-center justify-center"
            style={{
                width: 68,
                height: 68,
                background: `radial-gradient(circle at 50% 45%, ${gaugeOuter}, ${gaugeInner})`,
                borderRadius: '50%',
                border: `3px solid ${gaugeBorder}`,
                boxShadow: `
                    inset 0 2px 8px rgba(0,0,0,0.7),
                    0 0 0 2px ${ringOuter},
                    0 0 0 4px ${ringMid},
                    0 4px 12px rgba(0,0,0,0.5)
                `,
                animationName: 'gearhead-gauge-pulse',
                animationDuration: '4s',
                animationIterationCount: 'infinite',
            }}
        >
            {/* Glass cover reflection */}
            <div
                className="absolute inset-1 rounded-full z-10 pointer-events-none"
                style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%)',
                }}
            />
            {/* Tick marks */}
            {Array.from({ length: 9 }).map((_, i) => {
                const angle = -120 + i * 30;
                const isRed = i >= 7;
                return (
                    <div
                        key={i}
                        className="absolute"
                        style={{
                            width: 2,
                            height: 6,
                            background: isRed ? accentWarm : lighten(borderColor, 0.15),
                            top: 4,
                            left: '50%',
                            transformOrigin: '50% 30px',
                            transform: `translateX(-50%) rotate(${angle}deg)`,
                        }}
                    />
                );
            })}
            {/* Needle */}
            <div
                className="absolute z-10"
                style={{
                    width: 2,
                    height: 22,
                    background: `linear-gradient(180deg, ${color}, ${accentWarm})`,
                    bottom: '50%',
                    left: '50%',
                    transformOrigin: '50% 100%',
                    transform: `translateX(-50%) rotate(${needleAngle}deg)`,
                    borderRadius: '1px 1px 0 0',
                    boxShadow: `0 0 6px ${hexAlpha(color, 0.38)}`,
                    transition: 'transform 0.8s cubic-bezier(0.42, 0, 0.2, 1.2)',
                }}
            />
            {/* Center cap */}
            <div
                className="absolute z-20"
                style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${capLight}, ${capDark})`,
                    border: `1px solid ${ringOuter}`,
                }}
            />
            {/* Digital readout */}
            <div
                className="absolute bottom-2.5 flex items-baseline gap-0.5"
                style={{ zIndex: 20 }}
            >
                <span
                    className="font-extrabold tabular-nums"
                    style={{
                        fontFamily,
                        color,
                        fontSize: Math.max(11, fontSize - 4),
                        lineHeight: 1,
                        textShadow: `0 0 6px ${color}60`,
                    }}
                >
                    {value}
                </span>
                <span
                    style={{
                        color: `${color}A0`,
                        fontSize: Math.max(8, fontSize - 7),
                    }}
                >/</span>
                <span
                    style={{
                        color: `${color}D0`,
                        fontSize: Math.max(9, fontSize - 6),
                    }}
                >
                    {maxValue}
                </span>
            </div>
        </div>
    );
}

/* ── Main Gear Head Theme Component ───────────────────── */
export default function ThemeGearhead({ challenge, config, fade }: ThemeRendererProps) {
    const [particlesInit, setParticlesInit] = useState(false);

    useEffect(() => {
        injectDynamicKeyframes(STYLE_ID, buildKeyframesCSS({ iconPrimary: config.colors.iconPrimary, iconSecondary: config.colors.iconSecondary }));
    }, [config.colors.iconPrimary, config.colors.iconSecondary]);

    useEffect(() => {
        initParticlesEngine(async (engine: Engine) => {
            await loadSlim(engine);
        }).then(() => {
            setParticlesInit(true);
        });
    }, []);

    // Orange spark particles (grinding / engine sparks)
    const particlesConfig = useMemo(() => ({
        particles: {
            number: { value: 16, density: { enable: true, value_area: 300 } },
            color: { value: [config.colors.iconSecondary, lighten(config.colors.iconSecondary, 0.2), lighten(config.colors.iconSecondary, 0.35), darken(config.colors.iconSecondary, 0.2), lighten(config.colors.iconSecondary, 0.5)] },
            shape: { type: 'circle' },
            opacity: { value: 0.85, random: true, anim: { enable: true, speed: 3, opacity_min: 0, sync: false } },
            size: { value: 2.2, random: true, anim: { enable: true, speed: 2, size_min: 0.3, sync: false } },
            move: {
                enable: true,
                speed: 2.5,
                direction: 'top' as const,
                random: true,
                straight: false,
                out_mode: 'out' as const,
                bounce: false,
                attract: { enable: false, rotateX: 600, rotateY: 1200 },
                gravity: { enable: true, acceleration: 3 },
            },
        },
        interactivity: { events: { onhover: { enable: false }, onclick: { enable: false }, resize: { enable: true } } },
        retina_detect: true,
        background: { color: 'transparent' },
    }), [config.colors.iconSecondary]);

    const progressPercent = challenge.progress;
    const currentVal = Math.round((progressPercent / 100) * (challenge.subChallenges[0]?.target_limit || 1));
    const targetVal = challenge.subChallenges[0]?.target_limit || 1;
    const rewardValue = challenge.challenge.reward_amount?.trim();

    // Piston segment progress
    const totalPistons = 12;
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
                        id="gearhead-sparks"
                        options={particlesConfig}
                        className="w-full h-full"
                    />
                )}
            </div>

            {/* ── EXHAUST PIPES — Steam venting from top ── */}
            <ExhaustPipe className="-top-5 left-[25%]" delay={0} borderColor={config.colors.border} cardBg={config.colors.cardBackground} />
            <ExhaustPipe className="-top-5 left-[45%]" delay={1.2} borderColor={config.colors.border} cardBg={config.colors.cardBackground} />
            <ExhaustPipe className="-top-5 left-[65%]" delay={0.5} borderColor={config.colors.border} cardBg={config.colors.cardBackground} />

            {/* ── MAIN CHASSIS — Heavy engine block ── */}
            <div
                className="relative"
                style={{
                    background: `linear-gradient(170deg, ${lighten(config.colors.cardBackground, 0.08)} 0%, ${config.colors.cardBackground} 35%, ${darken(config.colors.cardBackground, 0.2)} 100%)`,
                    borderRadius: config.layout.borderRadius,
                    boxShadow: `
                        inset 0 1px 0 rgba(255,255,255,0.05),
                        inset 0 -2px 0 rgba(0,0,0,0.5),
                        0 0 0 2px ${darken(config.colors.cardBackground, 0.2)},
                        0 0 0 4px ${config.colors.border},
                        0 0 0 6px ${darken(config.colors.cardBackground, 0.2)},
                        0 14px 40px rgba(0,0,0,0.7)
                    `,
                    overflow: 'hidden',
                }}
            >
                {/* Engine block cross-hatch texture */}
                <div
                    className="absolute inset-0 pointer-events-none z-[1] opacity-[0.04]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' xmlns='http://www.w3.org/2000/svg'%3E%3Cline x1='0' y1='0' x2='12' y2='12' stroke='white' stroke-width='0.4'/%3E%3Cline x1='12' y1='0' x2='0' y2='12' stroke='white' stroke-width='0.4'/%3E%3C/svg%3E")`,
                        backgroundSize: '12px 12px',
                    }}
                />

                {/* Oil stain patches */}
                <div
                    className="absolute top-[10%] left-[5%] w-[25%] h-[40%] pointer-events-none z-[2] opacity-[0.12]"
                    style={{
                        background: `radial-gradient(ellipse at 30% 40%, ${darken(config.colors.cardBackground, 0.2)}, transparent 70%)`,
                    }}
                />
                <div
                    className="absolute bottom-[5%] right-[8%] w-[30%] h-[35%] pointer-events-none z-[2] opacity-[0.10]"
                    style={{
                        background: `radial-gradient(ellipse at 60% 70%, ${darken(config.colors.cardBackground, 0.35)}, transparent 70%)`,
                    }}
                />

                {/* Heat shimmer overlay */}
                <div
                    className="absolute inset-0 pointer-events-none z-[3]"
                    style={{
                        background: 'linear-gradient(0deg, transparent 40%, rgba(100,120,180,0.04) 60%, transparent 80%)',
                        animationName: 'gearhead-heat-shimmer',
                        animationDuration: '3s',
                        animationIterationCount: 'infinite',
                    }}
                />

                {/* Corner hex bolts */}
                <HexBolt className="top-2 left-3" size={14} cardBg={config.colors.cardBackground} borderColor={config.colors.border} />
                <HexBolt className="top-2 right-3" size={14} cardBg={config.colors.cardBackground} borderColor={config.colors.border} />
                <HexBolt className="bottom-2 left-3" size={14} cardBg={config.colors.cardBackground} borderColor={config.colors.border} />
                <HexBolt className="bottom-2 right-3" size={14} cardBg={config.colors.cardBackground} borderColor={config.colors.border} />

                {/* ── HAZARD WARNING STRIPE ── */}
                <div
                    className="relative mx-5 mt-3 h-[6px] z-10 overflow-hidden"
                    style={{
                        borderRadius: 2,
                        background: `repeating-linear-gradient(
                            -45deg,
                            ${config.colors.iconSecondary},
                            ${config.colors.iconSecondary} 6px,
                            ${darken(config.colors.cardBackground, 0.2)} 6px,
                            ${darken(config.colors.cardBackground, 0.2)} 12px
                        )`,
                        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15), 0 1px 3px rgba(0,0,0,0.4)',
                    }}
                >
                    {/* Worn texture */}
                    <div
                        className="absolute inset-0 opacity-25"
                        style={{
                            background: 'linear-gradient(90deg, rgba(0,0,0,0.4), transparent 20%, transparent 80%, rgba(0,0,0,0.4))',
                        }}
                    />
                </div>

                {/* Side metal bracket — left */}
                <div
                    className="absolute top-[15%] bottom-[15%] left-0 z-10"
                    style={{
                        width: 10,
                        background: `linear-gradient(180deg, ${lighten(config.colors.border, 0.1)}, ${darken(config.colors.border, 0.1)}, ${lighten(config.colors.border, 0.1)})`,
                        borderRight: `1px solid ${darken(config.colors.border, 0.25)}`,
                        boxShadow: 'inset -1px 0 2px rgba(0,0,0,0.3), 2px 0 4px rgba(0,0,0,0.3)',
                    }}
                >
                    {[0.2, 0.4, 0.6, 0.8].map(ratio => (
                        <div
                            key={ratio}
                            className="absolute left-1 right-1 h-[1px]"
                            style={{ top: `${ratio * 100}%`, background: 'rgba(0,0,0,0.25)' }}
                        />
                    ))}
                </div>
                {/* Side metal bracket — right (with accent) */}
                <div
                    className="absolute top-[15%] bottom-[15%] right-0 z-10"
                    style={{
                        width: 12,
                        background: `linear-gradient(180deg, ${config.colors.iconSecondary}, ${darken(config.colors.iconSecondary, 0.15)}, ${config.colors.iconSecondary})`,
                        borderLeft: `1px solid ${darken(config.colors.iconSecondary, 0.3)}`,
                        boxShadow: 'inset 1px 0 2px rgba(255,255,255,0.1), -2px 0 4px rgba(0,0,0,0.3)',
                    }}
                >
                    {/* Ventilation slits */}
                    {[0.15, 0.3, 0.45, 0.6, 0.75, 0.85].map(ratio => (
                        <div
                            key={ratio}
                            className="absolute left-2 right-1 h-[2px]"
                            style={{
                                top: `${ratio * 100}%`,
                                background: darken(config.colors.cardBackground, 0.2),
                                borderRadius: 1,
                            }}
                        />
                    ))}
                    {/* Worn paint patch */}
                    <div
                        className="absolute top-[60%] left-0 right-0 h-[20%] opacity-40"
                        style={{ background: `linear-gradient(180deg, transparent, ${darken(config.colors.iconSecondary, 0.3)}, transparent)` }}
                    />
                </div>

                {/* ── TOP SECTION: Title + Tachometer ── */}
                <div
                    className="relative z-10 flex justify-between items-center mx-5 mt-2"
                    style={{ padding: '6px 0' }}
                >
                    {/* Left — Challenge title in stamped metal panel */}
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <span
                            className="uppercase tracking-wider font-extrabold leading-tight truncate"
                            style={{
                                color: config.colors.challengeTitle,
                                fontFamily: config.fonts.title,
                                fontSize: config.fonts.titleSize,
                                textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.4)',
                                letterSpacing: '0.08em',
                            }}
                        >
                            {challenge.challenge.title}
                        </span>
                        {/* Sub-headline in hazard-yellow stamped tag */}
                        {config.display.showSubChallenges && challenge.subChallenges.length > 0 && (
                            <div
                                className="inline-flex items-center self-start px-2 py-0.5"
                                style={{
                                    background: `linear-gradient(90deg, ${hexAlpha(config.colors.iconSecondary, 0.8)}, ${config.colors.iconSecondary})`,
                                    borderRadius: 2,
                                    boxShadow: 'inset 0 -1px 1px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.3)',
                                }}
                            >
                                <span
                                    className="uppercase tracking-wider font-extrabold"
                                    style={{
                                        color: darken(config.colors.cardBackground, 0.2),
                                        fontSize: Math.max(8, config.fonts.bodySize - 2),
                                    }}
                                >
                                    {challenge.subChallenges[0]?.title || 'ENGINE STATUS'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Right — Tachometer gauge display */}
                    {(config.display.showProgressCount ?? true) && (
                        <div className="ml-3 flex-shrink-0">
                            <TachoGauge
                                value={currentVal}
                                maxValue={targetVal}
                                color={config.colors.progressCount}
                                fontFamily={config.fonts.title}
                                fontSize={config.fonts.titleSize}
                                borderColor={config.colors.border}
                                cardBg={config.colors.cardBackground}
                                accentWarm={config.colors.iconSecondary}
                            />
                        </div>
                    )}
                </div>

                {/* ── PROGRESS BAR — Pumping Pistons ── */}
                {config.display.showProgressBar && (
                    <div className="relative mx-5 my-2 z-10">
                        {/* Recessed engine cylinder housing */}
                        <div
                            className="relative h-10 flex items-center overflow-hidden"
                            style={{
                                background: `linear-gradient(180deg, ${lighten(config.colors.progressEmpty, 0.06)}, ${darken(config.colors.progressEmpty, 0.08)}, ${lighten(config.colors.progressEmpty, 0.06)})`,
                                border: `2px solid ${config.colors.border}`,
                                borderRadius: 5,
                                boxShadow: 'inset 0 3px 10px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.03)',
                            }}
                        >
                            {/* Piston segments */}
                            <div className="flex items-stretch gap-[2px] px-1.5 h-[70%] w-full">
                                {Array.from({ length: totalPistons }).map((_, i) => {
                                    const isFilled = i < filledPistons;
                                    return (
                                        <motion.div
                                            key={i}
                                            className="relative flex-1 rounded-[2px] overflow-hidden"
                                            style={{
                                                background: isFilled
                                                    ? `linear-gradient(180deg, ${config.colors.progressFill}, ${config.colors.progressFill}90, ${config.colors.progressFill}60)`
                                                    : `linear-gradient(180deg, ${lighten(config.colors.progressEmpty, 0.05)}, ${darken(config.colors.progressEmpty, 0.05)})`,
                                                border: `1px solid ${isFilled ? hexAlpha(config.colors.progressFill, 0.31) : darken(config.colors.border, 0.15)}`,
                                                boxShadow: isFilled
                                                    ? `0 0 8px ${config.colors.progressFill}40, inset 0 1px 2px rgba(255,255,255,0.1)`
                                                    : 'inset 0 1px 3px rgba(0,0,0,0.5)',
                                                animationName: isFilled ? 'gearhead-piston' : 'none',
                                                animationDuration: `${0.6 + i * 0.15}s`,
                                                animationIterationCount: 'infinite',
                                                animationDelay: `${i * 0.1}s`,
                                                animationTimingFunction: 'ease-in-out',
                                            }}
                                            initial={{ scaleY: 0 }}
                                            animate={{ scaleY: 1 }}
                                            transition={{ duration: 0.3, delay: i * 0.05 }}
                                        >
                                            {/* Piston head cross-bar */}
                                            {isFilled && (
                                                <div
                                                    className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[2px]"
                                                    style={{
                                                        background: `linear-gradient(90deg, transparent, ${config.colors.progressFill}, transparent)`,
                                                        opacity: 0.6,
                                                    }}
                                                />
                                            )}
                                            {/* Cylinder reflection */}
                                            {isFilled && (
                                                <div
                                                    className="absolute top-0 left-0 right-0 h-1/3"
                                                    style={{
                                                        background: 'linear-gradient(180deg, rgba(255,255,255,0.12), transparent)',
                                                    }}
                                                />
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Piston rod assembly at end */}
                            <div
                                className="absolute right-1 top-1/2 -translate-y-1/2 z-10 flex items-center"
                                style={{
                                    width: 28,
                                    height: '80%',
                                }}
                            >
                                {/* Piston cylinder head */}
                                <div
                                    className="relative w-full h-full rounded-[3px]"
                                    style={{
                                        background: `linear-gradient(90deg, ${config.colors.border}, ${lighten(config.colors.border, 0.15)}, ${config.colors.border})`,
                                        border: `1px solid ${darken(config.colors.border, 0.1)}`,
                                        boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.08), 0 2px 4px rgba(0,0,0,0.5)',
                                    }}
                                >
                                    {/* Riblines */}
                                    <div className="absolute top-[25%] left-1 right-1 h-[1px] bg-black/30" />
                                    <div className="absolute top-[50%] left-1 right-1 h-[1px] bg-black/30" />
                                    <div className="absolute top-[75%] left-1 right-1 h-[1px] bg-black/30" />
                                    {/* Heat-blued titanium tint */}
                                    <div
                                        className="absolute inset-0 rounded-[3px] opacity-30"
                                        style={{
                                            background: 'linear-gradient(180deg, rgba(80,100,180,0.4), transparent, rgba(120,80,40,0.3))',
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Progress percentage overlay */}
                            <div
                                className="absolute bottom-0.5 left-2 z-20"
                                style={{
                                    fontSize: 8,
                                    fontFamily: config.fonts.title,
                                    color: `${config.colors.progressFill}70`,
                                    letterSpacing: '0.1em',
                                }}
                            >
                                {Math.round(progressPercent)}%
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
                                background: `linear-gradient(180deg, ${lighten(config.colors.cardBackground, 0.02)}, ${darken(config.colors.cardBackground, 0.1)})`,
                                border: `1px solid ${hexAlpha(config.colors.border, 0.38)}`,
                                borderRadius: 4,
                                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6)',
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
                                background: `linear-gradient(180deg, ${lighten(config.colors.cardBackground, 0.02)}, ${darken(config.colors.cardBackground, 0.1)})`,
                                border: `1px solid ${hexAlpha(config.colors.border, 0.38)}`,
                                borderRadius: 4,
                                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6)',
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
                                                <div key={sub.id} className="flex items-center gap-1">
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

                    {/* Date */}
                    {config.display.showDate && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                            <Clock size={10} style={{ color: config.colors.dateText }} />
                            <span
                                className="uppercase font-bold tracking-wider"
                                style={{ color: config.colors.dateText, fontSize: Math.max(8, config.fonts.bodySize - 3) }}
                            >
                                {challenge.timeLeft}
                            </span>
                        </div>
                    )}
                </div>

                {/* Bottom hazard stripe */}
                <div
                    className="relative mx-5 mb-3 h-[4px] z-10 overflow-hidden"
                    style={{
                        borderRadius: 2,
                        background: `repeating-linear-gradient(
                            -45deg,
                            ${config.colors.iconSecondary},
                            ${config.colors.iconSecondary} 4px,
                            ${darken(config.colors.cardBackground, 0.2)} 4px,
                            ${darken(config.colors.cardBackground, 0.2)} 8px
                        )`,
                        opacity: 0.6,
                    }}
                />
            </div>
        </div>
    );
}
