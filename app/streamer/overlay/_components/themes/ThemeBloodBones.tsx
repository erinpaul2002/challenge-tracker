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
const STYLE_ID = 'bloodbones-keyframes';

function buildKeyframesCSS(c: {
    iconSecondary: string;
    border: string;
}): string {
    const bloodGlow = lighten(c.iconSecondary, 0.1);
    return `
    @keyframes bloodbones-pulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
    @keyframes bloodbones-mist {
      0% { opacity: 0.3; transform: translateY(0) scaleX(1) scaleY(1); }
      40% { opacity: 0.15; transform: translateY(8px) scaleX(1.6) scaleY(1.3); }
      100% { opacity: 0; transform: translateY(18px) scaleX(2.2) scaleY(1.6); }
    }
    @keyframes bloodbones-mist-drift {
      0% { opacity: 0.25; transform: translate(0, 0) scale(1); }
      50% { opacity: 0.1; transform: translate(-8px, 10px) scale(1.5); }
      100% { opacity: 0; transform: translate(-14px, 22px) scale(2); }
    }
    @keyframes bloodbones-crimson-glow {
      0%, 100% { box-shadow: inset 0 0 8px ${toRgba(c.iconSecondary, 0.3)}, 0 0 6px ${toRgba(c.iconSecondary, 0.2)}; }
      50% { box-shadow: inset 0 0 16px ${toRgba(bloodGlow, 0.5)}, 0 0 14px ${toRgba(bloodGlow, 0.35)}; }
    }
    @keyframes bloodbones-vial-flow {
      0% { background-position: 0% 50%; }
      100% { background-position: 200% 50%; }
    }
    @keyframes bloodbones-drip {
      0% { transform: translateY(-2px); opacity: 0; }
      20% { opacity: 0.8; }
      100% { transform: translateY(14px); opacity: 0; }
    }
    @keyframes bloodbones-flicker {
      0%, 100% { opacity: 0.7; text-shadow: 0 0 8px ${toRgba(bloodGlow, 0.5)}; }
      30% { opacity: 1; text-shadow: 0 0 14px ${toRgba(bloodGlow, 0.8)}, 0 0 4px ${toRgba(bloodGlow, 0.4)}; }
      60% { opacity: 0.6; text-shadow: 0 0 6px ${toRgba(bloodGlow, 0.3)}; }
      80% { opacity: 0.95; text-shadow: 0 0 12px ${toRgba(bloodGlow, 0.7)}; }
    }
    @keyframes bloodbones-bone-gleam {
      0%, 85%, 100% { opacity: 0; }
      90% { opacity: 0.3; }
    }
    `;
}

/* ── Bone spike corner decoration ──────────────────────── */
function BoneSpike({ position, boneLight, boneMid, boneDark, strokeColor, strokeLight, centerFill }: {
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    boneLight: string;
    boneMid: string;
    boneDark: string;
    strokeColor: string;
    strokeLight: string;
    centerFill: string;
}) {
    const isTop = position.includes('top');
    const isLeft = position.includes('left');
    const rotation = isTop
        ? (isLeft ? 0 : 90)
        : (isLeft ? 270 : 180);

    return (
        <div
            className="absolute z-20"
            style={{
                [isTop ? 'top' : 'bottom']: -6,
                [isLeft ? 'left' : 'right']: -6,
                width: 36,
                height: 36,
                transform: `rotate(${rotation}deg)`,
            }}
        >
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                {/* Main spike */}
                <path
                    d="M6,34 L4,18 Q3,10 8,6 L18,2 Q14,10 12,18 Q10,26 6,34 Z"
                    fill="url(#boneGrad)"
                    stroke={strokeColor}
                    strokeWidth="0.8"
                />
                {/* Secondary spike */}
                <path
                    d="M20,6 L28,4 Q22,10 18,16 Z"
                    fill="url(#boneGrad)"
                    stroke={strokeColor}
                    strokeWidth="0.5"
                />
                {/* Carved detail line */}
                <path
                    d="M8,28 Q7,20 10,12"
                    stroke={strokeLight}
                    strokeWidth="0.6"
                    fill="none"
                />
                {/* Gothic trefoil at corner */}
                <circle cx="14" cy="14" r="5" fill="url(#boneGrad)" stroke={strokeColor} strokeWidth="0.6" />
                <circle cx="14" cy="14" r="2.5" fill={centerFill} />
                <defs>
                    <linearGradient id="boneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={boneLight} />
                        <stop offset="40%" stopColor={boneMid} />
                        <stop offset="100%" stopColor={boneDark} />
                    </linearGradient>
                </defs>
            </svg>
            {/* Gleam */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.15), transparent 50%)',
                    animationName: 'bloodbones-bone-gleam',
                    animationDuration: '10s',
                    animationIterationCount: 'infinite',
                    animationDelay: `${rotation * 0.02}s`,
                }}
            />
        </div>
    );
}

/* ── Ornate bone frame border ─────────────────────────── */
function BoneFrame({ boneLight, boneMid, boneDark, borderLine, grooveColor, crackColor }: {
    boneLight: string;
    boneMid: string;
    boneDark: string;
    borderLine: string;
    grooveColor: string;
    crackColor: string;
}) {
    const boneGradH = `linear-gradient(90deg, ${boneDark}, ${boneLight}, ${boneMid}, ${boneLight}, ${boneDark})`;
    const boneGradV = `linear-gradient(180deg, ${boneDark}, ${boneLight}, ${boneMid}, ${boneLight}, ${boneDark})`;
    const grooveGradH = `linear-gradient(90deg, transparent, ${grooveColor}, transparent)`;
    const grooveGradV = `linear-gradient(180deg, transparent, ${grooveColor}, transparent)`;

    return (
        <>
            {/* Top border */}
            <div
                className="absolute top-0 left-6 right-6 z-10"
                style={{
                    height: 8,
                    background: boneGradH,
                    borderBottom: `1px solid ${borderLine}`,
                    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.15), 0 2px 4px rgba(0,0,0,0.5)',
                }}
            >
                {/* Carved groove */}
                <div
                    className="absolute top-1.5 left-4 right-4 h-[1px]"
                    style={{ background: grooveGradH }}
                />
                {/* Crack detail */}
                <div
                    className="absolute top-0 left-[30%] w-[1px] h-full opacity-20"
                    style={{ background: crackColor }}
                />
            </div>
            {/* Bottom border */}
            <div
                className="absolute bottom-0 left-6 right-6 z-10"
                style={{
                    height: 8,
                    background: boneGradH,
                    borderTop: `1px solid ${borderLine}`,
                    boxShadow: 'inset 0 -1px 2px rgba(255,255,255,0.1), 0 -2px 4px rgba(0,0,0,0.5)',
                }}
            >
                <div
                    className="absolute bottom-1.5 left-4 right-4 h-[1px]"
                    style={{ background: grooveGradH }}
                />
            </div>
            {/* Left border */}
            <div
                className="absolute top-6 bottom-6 left-0 z-10"
                style={{
                    width: 8,
                    background: boneGradV,
                    borderRight: `1px solid ${borderLine}`,
                    boxShadow: 'inset 1px 0 2px rgba(255,255,255,0.1), 2px 0 4px rgba(0,0,0,0.5)',
                }}
            >
                <div
                    className="absolute top-4 bottom-4 left-1.5 w-[1px]"
                    style={{ background: grooveGradV }}
                />
            </div>
            {/* Right border */}
            <div
                className="absolute top-6 bottom-6 right-0 z-10"
                style={{
                    width: 8,
                    background: boneGradV,
                    borderLeft: `1px solid ${borderLine}`,
                    boxShadow: 'inset -1px 0 2px rgba(255,255,255,0.1), -2px 0 4px rgba(0,0,0,0.5)',
                }}
            >
                <div
                    className="absolute top-4 bottom-4 right-1.5 w-[1px]"
                    style={{ background: grooveGradV }}
                />
            </div>
        </>
    );
}

/* ── Crimson Aura Badge (X/Y display) ─────────────────── */
function CrimsonBadge({
    value,
    maxValue,
    color,
    fontFamily,
    fontSize,
    badgeBg,
    badgeBorder,
    badgeDeep,
    boneRing,
    velvetGlow,
    boneTrim,
}: {
    value: number;
    maxValue: number;
    color: string;
    fontFamily: string;
    fontSize: number;
    badgeBg: string;
    badgeBorder: string;
    badgeDeep: string;
    boneRing: string;
    velvetGlow: string;
    boneTrim: string;
}) {
    return (
        <div
            className="relative flex items-center justify-center"
            style={{
                width: 72,
                height: 56,
                background: `linear-gradient(135deg, ${badgeBg}, ${darken(badgeBg, 0.2)}, ${badgeBg})`,
                borderRadius: 8,
                border: `2px solid ${badgeBorder}`,
                boxShadow: `
                    inset 0 2px 6px rgba(0,0,0,0.6),
                    0 0 0 2px ${badgeDeep},
                    0 0 0 4px ${boneRing},
                    0 0 12px ${toRgba(badgeBorder, 0.3)}
                `,
                animationName: 'bloodbones-crimson-glow',
                animationDuration: '3s',
                animationIterationCount: 'infinite',
            }}
        >
            {/* Inner velvet texture */}
            <div
                className="absolute inset-1 rounded-md opacity-30"
                style={{
                    background: `radial-gradient(ellipse at 50% 40%, ${velvetGlow}, transparent 70%)`,
                }}
            />
            {/* Bone edge trim */}
            <div
                className="absolute inset-0 rounded-md pointer-events-none"
                style={{
                    border: `1px solid ${boneTrim}`,
                }}
            />
            {/* Numbers */}
            <div className="relative z-10 flex items-baseline gap-0.5">
                <span
                    className="font-extrabold tabular-nums"
                    style={{
                        fontFamily,
                        color,
                        fontSize: Math.max(18, fontSize + 4),
                        lineHeight: 1,
                        animationName: 'bloodbones-flicker',
                        animationDuration: '4s',
                        animationIterationCount: 'infinite',
                    }}
                >
                    {value}
                </span>
                <span
                    style={{
                        color: hexAlpha(color, 0.72),
                        fontSize: Math.max(14, fontSize),
                        fontFamily,
                    }}
                >/</span>
                <span
                    className="font-bold tabular-nums"
                    style={{
                        color: hexAlpha(color, 0.90),
                        fontSize: Math.max(16, fontSize + 2),
                        fontFamily,
                        lineHeight: 1,
                    }}
                >
                    {maxValue}
                </span>
            </div>
        </div>
    );
}

/* ── Main Blood & Bones Theme Component ─────────────────── */
export default function ThemeBloodBones({ challenge, config, fade }: ThemeRendererProps) {
    const [particlesInit, setParticlesInit] = useState(false);
    const colors = config.colors;

    /* ── Derived palette ── */
    const boneLight     = lighten(colors.border, 0.15);
    const boneMid       = colors.border;
    const boneDark      = darken(colors.border, 0.2);
    const boneCap       = darken(colors.border, 0.15);
    const grooveColor   = darken(colors.border, 0.35);
    const borderLine    = darken(colors.border, 0.4);
    const capBorder     = darken(colors.border, 0.45);
    const boneRing      = darken(colors.border, 0.35);
    const boneTrim      = toRgba(lighten(colors.border, 0.2), 0.15);

    const crackColor      = lighten(colors.cardBackground, 0.12);
    const darkPanel       = lighten(colors.cardBackground, 0.08);
    const deepDark        = darken(colors.cardBackground, 0.3);
    const velvetDark      = lighten(colors.cardBackground, 0.15);
    const velvetMid       = lighten(colors.cardBackground, 0.1);
    const velvetDeep      = lighten(colors.cardBackground, 0.04);

    const bloodVelvet       = toRgba(darken(colors.iconSecondary, 0.3), 0.5);
    const badgeBorderColor  = blend(colors.cardBackground, colors.iconSecondary, 0.3);
    const titleBorder       = blend(colors.cardBackground, colors.iconSecondary, 0.25);
    const subBorder         = blend(colors.cardBackground, colors.iconSecondary, 0.15);
    const vialBorder        = blend(colors.cardBackground, colors.iconSecondary, 0.35);
    const spikeStroke       = lighten(colors.cardBackground, 0.12);
    const spikeStrokeLight  = lighten(colors.cardBackground, 0.18);
    const centerFill        = darken(colors.cardBackground, 0.1);

    useEffect(() => {
        injectDynamicKeyframes(STYLE_ID, buildKeyframesCSS({
            iconSecondary: colors.iconSecondary,
            border: colors.border,
        }));
    }, [colors.iconSecondary, colors.border]);

    useEffect(() => {
        initParticlesEngine(async (engine: Engine) => {
            await loadSlim(engine);
        }).then(() => {
            setParticlesInit(true);
        });
    }, []);

    // Blood-red mist particles
    const particlesConfig = useMemo(() => ({
        particles: {
            number: { value: 18, density: { enable: true, value_area: 350 } },
            color: { value: [
                colors.iconSecondary,
                darken(colors.iconSecondary, 0.15),
                lighten(colors.iconSecondary, 0.15),
                darken(colors.iconSecondary, 0.3),
                lighten(colors.iconSecondary, 0.1),
            ] },
            shape: { type: 'circle' },
            opacity: { value: 0.5, random: true, anim: { enable: true, speed: 1.5, opacity_min: 0, sync: false } },
            size: { value: 4, random: true, anim: { enable: true, speed: 1, size_min: 1, sync: false } },
            move: {
                enable: true,
                speed: 0.8,
                direction: 'bottom' as const,
                random: true,
                straight: false,
                out_mode: 'out' as const,
                bounce: false,
                attract: { enable: false, rotateX: 600, rotateY: 1200 },
            },
        },
        interactivity: { events: { onhover: { enable: false }, onclick: { enable: false }, resize: { enable: true } } },
        retina_detect: true,
        background: { color: 'transparent' },
    }), [colors.iconSecondary]);

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
            {/* Blood mist particles */}
            <div className="absolute inset-0 pointer-events-none z-50 overflow-visible">
                {particlesInit && (
                    <Particles
                        id="bloodbones-mist"
                        options={particlesConfig}
                        className="w-full h-full"
                    />
                )}
            </div>

            {/* ── MAIN CHASSIS — Gothic reliquary box ── */}
            <div
                className="relative"
                style={{
                    background: `linear-gradient(170deg, ${darkPanel} 0%, ${colors.cardBackground} 40%, ${darken(colors.cardBackground, 0.2)} 100%)`,
                    borderRadius: config.layout.borderRadius,
                    boxShadow: `
                        inset 0 1px 0 ${toRgba(lighten(colors.border, 0.2), 0.04)},
                        inset 0 -2px 0 rgba(0,0,0,0.5),
                        0 0 0 3px ${deepDark},
                        0 0 0 5px ${boneRing},
                        0 0 0 7px ${deepDark},
                        0 14px 40px rgba(0,0,0,0.7),
                        0 0 40px ${toRgba(darken(colors.iconSecondary, 0.15), 0.15)}
                    `,
                    overflow: 'visible',
                    padding: 8,
                }}
            >
                {/* Bone frame border */}
                <BoneFrame
                    boneLight={boneLight}
                    boneMid={boneMid}
                    boneDark={boneDark}
                    borderLine={borderLine}
                    grooveColor={grooveColor}
                    crackColor={crackColor}
                />

                {/* Bone spike corners */}
                <BoneSpike position="top-left" boneLight={boneLight} boneMid={boneMid} boneDark={boneDark} strokeColor={spikeStroke} strokeLight={spikeStrokeLight} centerFill={centerFill} />
                <BoneSpike position="top-right" boneLight={boneLight} boneMid={boneMid} boneDark={boneDark} strokeColor={spikeStroke} strokeLight={spikeStrokeLight} centerFill={centerFill} />
                <BoneSpike position="bottom-left" boneLight={boneLight} boneMid={boneMid} boneDark={boneDark} strokeColor={spikeStroke} strokeLight={spikeStrokeLight} centerFill={centerFill} />
                <BoneSpike position="bottom-right" boneLight={boneLight} boneMid={boneMid} boneDark={boneDark} strokeColor={spikeStroke} strokeLight={spikeStrokeLight} centerFill={centerFill} />

                {/* Inner content area with velvet background */}
                <div
                    className="relative overflow-hidden"
                    style={{
                        borderRadius: Math.max(2, config.layout.borderRadius - 4),
                    }}
                >
                    {/* Blood-red velvet background */}
                    <div
                        className="absolute inset-0 z-0"
                        style={{
                            background: `
                                radial-gradient(ellipse at 30% 30%, ${toRgba(darken(colors.iconSecondary, 0.3), 0.6)}, transparent 60%),
                                radial-gradient(ellipse at 70% 70%, ${toRgba(darken(colors.iconSecondary, 0.4), 0.4)}, transparent 60%),
                                linear-gradient(170deg, ${velvetDark}, ${velvetMid}, ${velvetDeep})
                            `,
                        }}
                    />
                    {/* Velvet fabric texture */}
                    <div
                        className="absolute inset-0 z-[1] opacity-[0.05] pointer-events-none"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='8' height='8' viewBox='0 0 8 8' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='4' cy='4' r='0.8' fill='white'/%3E%3C/svg%3E")`,
                            backgroundSize: '8px 8px',
                        }}
                    />
                    {/* Vine/thorn overlay pattern */}
                    <div
                        className="absolute inset-0 z-[2] opacity-[0.06] pointer-events-none"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,15 Q8,8 15,15 Q22,22 30,15' fill='none' stroke='white' stroke-width='0.5'/%3E%3Cpath d='M15,0 Q8,8 15,15 Q22,22 15,30' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E")`,
                            backgroundSize: '30px 30px',
                        }}
                    />

                    {/* ── TOP SECTION: Title + Crimson Badge ── */}
                    <div
                        className="relative z-10 flex justify-between items-center mx-4 mt-3"
                        style={{ padding: '6px 0' }}
                    >
                        {/* Left — Challenge title in dark panel */}
                        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                            {/* Title panel */}
                            <div
                                className="flex items-center gap-3 px-3 py-1.5"
                                style={{
                                    background: `linear-gradient(90deg, ${toRgba(darken(colors.cardBackground, 0.3), 0.85)}, ${toRgba(darken(colors.cardBackground, 0.2), 0.7)})`,
                                    borderRadius: 4,
                                    border: `1px solid ${titleBorder}`,
                                    clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)',
                                }}
                            >
                                <span
                                    className="uppercase tracking-wider font-extrabold leading-tight truncate"
                                    style={{
                                        color: config.colors.challengeTitle,
                                        fontFamily: config.fonts.title,
                                        fontSize: config.fonts.titleSize,
                                        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                                        letterSpacing: '0.07em',
                                    }}
                                >
                                    {challenge.challenge.title}
                                </span>
                            </div>

                            {/* Sub-headline in sinister tag */}
                            {config.display.showSubChallenges && challenge.subChallenges.length > 0 && (
                                <div
                                    className="inline-flex items-center self-start px-3 py-0.5"
                                    style={{
                                        background: `linear-gradient(90deg, ${toRgba(darken(colors.cardBackground, 0.3), 0.8)}, ${toRgba(darken(colors.cardBackground, 0.2), 0.6)})`,
                                        borderRadius: 3,
                                        border: `1px solid ${subBorder}`,
                                        clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)',
                                    }}
                                >
                                    <span
                                        className="uppercase tracking-wider font-bold"
                                        style={{
                                            color: config.colors.subchallengeTitle,
                                            fontSize: Math.max(8, config.fonts.bodySize - 2),
                                        }}
                                    >
                                        {challenge.subChallenges[0]?.title || 'RELIQUARY'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Right — Crimson aura badge */}
                        {(config.display.showProgressCount ?? true) && (
                            <div className="ml-3 flex-shrink-0">
                                <CrimsonBadge
                                    value={currentVal}
                                    maxValue={targetVal}
                                    color={config.colors.progressCount}
                                    fontFamily={config.fonts.title}
                                    fontSize={config.fonts.titleSize}
                                    badgeBg={lighten(colors.cardBackground, 0.1)}
                                    badgeBorder={badgeBorderColor}
                                    badgeDeep={deepDark}
                                    boneRing={boneRing}
                                    velvetGlow={bloodVelvet}
                                    boneTrim={boneTrim}
                                />
                            </div>
                        )}
                    </div>

                    {/* ── PROGRESS BAR — Glass vial with crimson liquid ── */}
                    {config.display.showProgressBar && (
                        <div className="relative mx-4 my-2.5 z-10">
                            {/* Tarnished silver vial housing */}
                            <div
                                className="relative h-8 flex items-center overflow-hidden"
                                style={{
                                    background: `linear-gradient(180deg, ${lighten(colors.progressEmpty, 0.06)}, ${darken(colors.progressEmpty, 0.08)}, ${lighten(colors.progressEmpty, 0.06)})`,
                                    border: `2px solid ${vialBorder}`,
                                    borderRadius: 14,
                                    boxShadow: `
                                        inset 0 3px 8px rgba(0,0,0,0.7),
                                        0 1px 0 ${toRgba(lighten(colors.border, 0.2), 0.06)},
                                        0 0 0 1px ${darkPanel}
                                    `,
                                }}
                            >
                                {/* Glass vial inner highlight */}
                                <div
                                    className="absolute inset-0 rounded-xl pointer-events-none z-10"
                                    style={{
                                        background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.2) 100%)',
                                    }}
                                />

                                {/* Crimson liquid fill */}
                                <motion.div
                                    className="absolute top-1 bottom-1 left-1 rounded-xl overflow-hidden"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.max(0, progressPercent - 1)}%` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    style={{
                                        background: `linear-gradient(90deg, ${hexAlpha(colors.progressFill, 0.25)}, ${hexAlpha(colors.progressFill, 0.56)}, ${colors.progressFill})`,
                                        boxShadow: `0 0 10px ${hexAlpha(colors.progressFill, 0.31)}, inset 0 1px 2px rgba(255,255,255,0.1)`,
                                    }}
                                >
                                    {/* Swirling crimson liquid effect */}
                                    <div
                                        className="absolute inset-0"
                                        style={{
                                            backgroundImage: `linear-gradient(90deg,
                                                transparent 0%,
                                                ${toRgba(lighten(colors.progressFill, 0.5), 0.3)} 15%,
                                                transparent 30%,
                                                ${toRgba(lighten(colors.progressFill, 0.4), 0.2)} 45%,
                                                transparent 60%,
                                                ${toRgba(lighten(colors.progressFill, 0.45), 0.25)} 75%,
                                                transparent 100%
                                            )`,
                                            backgroundSize: '200% 100%',
                                            animationName: 'bloodbones-vial-flow',
                                            animationDuration: '4s',
                                            animationIterationCount: 'infinite',
                                            animationTimingFunction: 'linear',
                                        }}
                                    />
                                    {/* Liquid surface highlight */}
                                    <div
                                        className="absolute top-0 left-0 right-0 h-1/3"
                                        style={{
                                            background: 'linear-gradient(180deg, rgba(255,255,255,0.12), transparent)',
                                        }}
                                    />
                                </motion.div>

                                {/* Vial end caps */}
                                <div
                                    className="absolute left-0 top-0 bottom-0 w-2 rounded-l-xl z-20"
                                    style={{
                                        background: `linear-gradient(90deg, ${grooveColor}, ${boneCap}, ${grooveColor})`,
                                        borderRight: `1px solid ${capBorder}`,
                                    }}
                                />
                                <div
                                    className="absolute right-0 top-0 bottom-0 w-2 rounded-r-xl z-20"
                                    style={{
                                        background: `linear-gradient(90deg, ${grooveColor}, ${boneCap}, ${grooveColor})`,
                                        borderLeft: `1px solid ${capBorder}`,
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* ── BOTTOM SECTION: Given By + Reward ── */}
                    <div
                        className="relative z-10 flex gap-2 mx-4 mb-3"
                        style={{ padding: '4px 0' }}
                    >
                        {/* Given By */}
                        {config.display.showGivenBy && challenge.challenge.given_by && (
                            <div
                                className="flex-1 flex items-center px-3 py-1.5"
                                style={{
                                    background: `linear-gradient(180deg, ${toRgba(darken(colors.cardBackground, 0.3), 0.85)}, ${toRgba(darken(colors.cardBackground, 0.4), 0.9)})`,
                                    border: `1px solid ${hexAlpha(colors.border, 0.38)}`,
                                    borderRadius: 4,
                                    boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6)',
                                    clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)',
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
                                    background: `linear-gradient(180deg, ${toRgba(darken(colors.cardBackground, 0.3), 0.85)}, ${toRgba(darken(colors.cardBackground, 0.4), 0.9)})`,
                                    border: `1px solid ${hexAlpha(colors.border, 0.38)}`,
                                    borderRadius: 4,
                                    boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6)',
                                    clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)',
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
                </div>

                {/* Blood-red mist rolling off the bottom */}
                <div
                    className="absolute -bottom-3 left-[10%] w-[30%] h-6 pointer-events-none z-30 rounded-full"
                    style={{
                        background: `radial-gradient(ellipse, ${toRgba(darken(colors.iconSecondary, 0.1), 0.35)}, transparent 70%)`,
                        animationName: 'bloodbones-mist',
                        animationDuration: '4s',
                        animationIterationCount: 'infinite',
                    }}
                />
                <div
                    className="absolute -bottom-2 left-[40%] w-[25%] h-5 pointer-events-none z-30 rounded-full"
                    style={{
                        background: `radial-gradient(ellipse, ${toRgba(colors.iconSecondary, 0.3)}, transparent 70%)`,
                        animationName: 'bloodbones-mist-drift',
                        animationDuration: '5s',
                        animationIterationCount: 'infinite',
                        animationDelay: '1s',
                    }}
                />
                <div
                    className="absolute -bottom-4 right-[15%] w-[28%] h-7 pointer-events-none z-30 rounded-full"
                    style={{
                        background: `radial-gradient(ellipse, ${toRgba(darken(colors.iconSecondary, 0.2), 0.3)}, transparent 70%)`,
                        animationName: 'bloodbones-mist',
                        animationDuration: '6s',
                        animationIterationCount: 'infinite',
                        animationDelay: '2s',
                    }}
                />
            </div>
        </div>
    );
}
