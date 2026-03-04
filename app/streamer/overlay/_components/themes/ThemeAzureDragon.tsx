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

type Colors = ThemeRendererProps['config']['colors'];

/* ── Inject keyframes once ─────────────────────────────── */
const STYLE_ID = 'azuredragon-keyframes';
function ensureKeyframes(colors: Colors) {
    injectDynamicKeyframes(STYLE_ID, `
    @keyframes azure-mist-left {
      0% { opacity: 0.15; transform: translateX(0) scaleX(1); }
      50% { opacity: 0.3; transform: translateX(-8px) scaleX(1.2); }
      100% { opacity: 0.15; transform: translateX(0) scaleX(1); }
    }
    @keyframes azure-mist-right {
      0% { opacity: 0.12; transform: translateX(0) scaleX(1); }
      50% { opacity: 0.25; transform: translateX(8px) scaleX(1.15); }
      100% { opacity: 0.12; transform: translateX(0) scaleX(1); }
    }
    @keyframes azure-gold-pulse {
      0%, 100% { text-shadow: 0 0 6px ${hexAlpha(colors.iconSecondary, 0.38)}, 0 0 14px ${hexAlpha(colors.iconSecondary, 0.13)}; }
      50% { text-shadow: 0 0 10px ${hexAlpha(colors.iconSecondary, 0.63)}, 0 0 24px ${hexAlpha(colors.iconSecondary, 0.31)}, 0 0 40px ${hexAlpha(colors.iconSecondary, 0.13)}; }
    }
    @keyframes azure-scale-shimmer {
      0% { background-position: 0% 50%; }
      100% { background-position: 200% 50%; }
    }
    @keyframes azure-glint {
      0%, 90%, 100% { opacity: 0; }
      95% { opacity: 0.6; }
    }
    `);
}

/* ── Gold filigree corner ornament ─────────────────────── */
function FiligreeCorner({ position, colors }: { position: 'tl' | 'tr' | 'bl' | 'br'; colors: Colors }) {
    const isTop = position.startsWith('t');
    const isLeft = position.endsWith('l');
    const rotation = isTop && isLeft ? 0 : isTop && !isLeft ? 90 : !isTop && isLeft ? 270 : 180;
    return (
        <div
            className="absolute z-20 pointer-events-none"
            style={{
                [isTop ? 'top' : 'bottom']: 3,
                [isLeft ? 'left' : 'right']: 3,
                width: 28,
                height: 28,
                transform: `rotate(${rotation}deg)`,
            }}
        >
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                {/* Ornate corner with curves */}
                <path
                    d="M2 2 L2 14 C2 14 4 12 6 14 C8 16 6 18 6 18 L6 26 C6 28 8 30 10 30 L18 30 C18 30 16 28 18 26 C20 24 22 26 22 26 L30 26"
                    stroke={colors.border}
                    strokeWidth="1.5"
                    fill="none"
                    opacity="0.9"
                />
                {/* Inner leaf detail */}
                <path
                    d="M4 4 C4 8 6 10 10 10 C6 10 4 12 4 16"
                    stroke={lighten(colors.border, 0.11)}
                    strokeWidth="1"
                    fill="none"
                    opacity="0.6"
                />
                {/* Small jade dot */}
                <circle cx="5" cy="5" r="2" fill={darken(colors.iconPrimary, 0.31)} opacity="0.5" />
            </svg>
        </div>
    );
}

/* ── Jade inlay dot ────────────────────────────────────── */
function JadeDot({ className, colors }: { className?: string; colors: Colors }) {
    return (
        <div
            className={cn('absolute w-2 h-2 rounded-full z-20', className)}
            style={{
                background: `radial-gradient(circle at 35% 35%, ${lighten(colors.iconPrimary, 0.15)}, ${darken(colors.iconPrimary, 0.39)}, ${darken(colors.iconPrimary, 0.55)})`,
                boxShadow: `inset 0 1px 1px rgba(255,255,255,0.2), 0 0 4px ${toRgba(colors.iconPrimary, 0.3)}`,
            }}
        />
    );
}

/* ── Main Azure Dragon Theme Component ─────────────────── */
export default function ThemeAzureDragon({ challenge, config, fade }: ThemeRendererProps) {
    const [particlesInit, setParticlesInit] = useState(false);
    const colors = config.colors;

    useEffect(() => {
        ensureKeyframes(colors);
    }, [colors]);

    useEffect(() => {
        initParticlesEngine(async (engine: Engine) => {
            await loadSlim(engine);
        }).then(() => {
            setParticlesInit(true);
        });
    }, []);

    // Derived structural colors from cardBackground
    const cardBgLight = lighten(colors.cardBackground, 0.08);
    const cardBgDark = darken(colors.cardBackground, 0.29);
    const panelBgTop = lighten(colors.cardBackground, 0.04);
    const panelBgBottom = darken(colors.cardBackground, 0.38);
    const panelBgBottomAlt = darken(colors.cardBackground, 0.36);
    const grooveDark = darken(colors.progressEmpty, 0.08);
    const grooveMid = lighten(colors.progressEmpty, 0.06);
    const borderHighlight = lighten(colors.border, 0.5);

    // Derived jade/accent colors from iconPrimary
    const jadeMid = darken(colors.iconPrimary, 0.47);
    const jadeDark = darken(colors.iconPrimary, 0.55);
    const jadeLight = lighten(colors.iconPrimary, 0.17);

    // Encoded colors for SVG data URIs
    const iconSecondaryEncoded = encodeURIComponent(colors.iconSecondary);
    const borderEncoded = encodeURIComponent(colors.border);
    const jadeLightEncoded = encodeURIComponent(lighten(colors.iconPrimary, 0.15));

    // Ethereal cyan mist / sparkle particles
    const particlesConfig = useMemo(() => ({
        particles: {
            number: { value: 8, density: { enable: true, value_area: 400 } },
            color: { value: [colors.iconPrimary, lighten(colors.iconPrimary, 0.17), lighten(colors.iconPrimary, 0.33), colors.border] },
            shape: { type: 'circle' },
            opacity: { value: 0.6, random: true, anim: { enable: true, speed: 1.5, opacity_min: 0, sync: false } },
            size: { value: 2.5, random: true, anim: { enable: true, speed: 1, size_min: 0.5, sync: false } },
            move: {
                enable: true,
                speed: 0.4,
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
    }), [colors.iconPrimary, colors.border]);

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
            {/* ── Ethereal cyan mist aura (left + right) ── */}
            <div
                className="absolute -left-6 top-[10%] bottom-[10%] w-16 pointer-events-none z-0"
                style={{
                    background: `radial-gradient(ellipse at 80% 50%, ${toRgba(colors.iconPrimary, 0.19)}, transparent 70%)`,
                    filter: 'blur(8px)',
                    animationName: 'azure-mist-left',
                    animationDuration: '5s',
                    animationIterationCount: 'infinite',
                }}
            />
            <div
                className="absolute -right-6 top-[10%] bottom-[10%] w-16 pointer-events-none z-0"
                style={{
                    background: `radial-gradient(ellipse at 20% 50%, ${toRgba(colors.iconPrimary, 0.19)}, transparent 70%)`,
                    filter: 'blur(8px)',
                    animationName: 'azure-mist-right',
                    animationDuration: '6s',
                    animationIterationCount: 'infinite',
                }}
            />

            {/* Sparkle particles */}
            <div className="absolute inset-0 pointer-events-none z-50 overflow-visible">
                {particlesInit && (
                    <Particles
                        id="azure-sparkles"
                        options={particlesConfig}
                        className="w-full h-full"
                    />
                )}
            </div>

            {/* ── MAIN CHASSIS — Dark mahogany with gold border ── */}
            <div
                className="relative z-10"
                style={{
                    background: `linear-gradient(160deg, ${cardBgLight} 0%, ${colors.cardBackground} 40%, ${cardBgDark} 100%)`,
                    borderRadius: config.layout.borderRadius,
                    border: `2.5px solid ${colors.border}`,
                    boxShadow: `
                        inset 0 1px 0 ${toRgba(borderHighlight, 0.1)},
                        inset 0 -1px 0 rgba(0,0,0,0.4),
                        0 0 0 1px rgba(0,0,0,0.5),
                        0 0 20px ${toRgba(colors.iconPrimary, 0.1)},
                        0 12px 40px rgba(0,0,0,0.5)
                    `,
                    overflow: 'hidden',
                }}
            >
                {/* Wood grain texture */}
                <div
                    className="absolute inset-0 pointer-events-none z-[1] opacity-[0.05]"
                    style={{
                        backgroundImage: `repeating-linear-gradient(
                            90deg,
                            transparent,
                            transparent 20px,
                            ${toRgba(colors.border, 0.15)} 20px,
                            ${toRgba(colors.border, 0.15)} 21px
                        )`,
                    }}
                />

                {/* Inner gold border bevel */}
                <div
                    className="absolute inset-[3px] pointer-events-none z-[2] rounded"
                    style={{
                        border: `1px solid ${hexAlpha(colors.border, 0.19)}`,
                    }}
                />

                {/* Gold filigree corners */}
                <FiligreeCorner position="tl" colors={colors} />
                <FiligreeCorner position="tr" colors={colors} />
                <FiligreeCorner position="bl" colors={colors} />
                <FiligreeCorner position="br" colors={colors} />

                {/* Gold glint animation */}
                <div
                    className="absolute top-0 left-[20%] w-[60%] h-[1px] pointer-events-none z-30"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${hexAlpha(colors.border, 0.5)}, transparent)`,
                        animationName: 'azure-glint',
                        animationDuration: '6s',
                        animationIterationCount: 'infinite',
                    }}
                />

                {/* ── TOP SECTION: Title + X/Y ── */}
                <div
                    className="relative z-10 flex justify-between items-start"
                    style={{ padding: '14px 18px 8px 18px' }}
                >
                    {/* Left — Challenge title with carved engraving style */}
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <div
                            className="px-3 py-1.5 rounded"
                            style={{
                                background: `linear-gradient(180deg, ${panelBgTop}, ${panelBgBottom})`,
                                border: `1px solid ${hexAlpha(colors.border, 0.31)}`,
                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                            }}
                        >
                            <span
                                className="uppercase tracking-wider font-extrabold leading-tight truncate block"
                                style={{
                                    color: colors.challengeTitle,
                                    fontFamily: config.fonts.title,
                                    fontSize: config.fonts.titleSize,
                                    textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                                }}
                            >
                                {challenge.challenge.title}
                            </span>
                            {/* Sub-headline */}
                            {config.display.showSubChallenges && challenge.subChallenges.length > 0 && (
                                <span
                                    className="uppercase tracking-wider font-bold mt-0.5 block"
                                    style={{
                                        color: colors.subchallengeTitle,
                                        fontSize: Math.max(8, config.fonts.bodySize - 3),
                                    }}
                                >
                                    {challenge.subChallenges[0]?.title || 'OBJECTIVE'}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Right — X/Y in gold medallion */}
                    {(config.display.showProgressCount ?? true) && (
                        <div
                            className="flex items-center ml-3 flex-shrink-0 px-4 py-2"
                            style={{
                                background: `linear-gradient(180deg, ${panelBgTop}, ${panelBgBottom})`,
                                border: `2px solid ${colors.border}`,
                                borderRadius: 6,
                                boxShadow: `inset 0 2px 6px rgba(0,0,0,0.6), 0 0 10px ${hexAlpha(colors.progressCount, 0.13)}`,
                                animationName: 'azure-gold-pulse',
                                animationDuration: '4s',
                                animationIterationCount: 'infinite',
                            }}
                        >
                            <span
                                className="font-extrabold tabular-nums"
                                style={{
                                    fontFamily: config.fonts.title,
                                    color: colors.progressCount,
                                    fontSize: Math.max(22, config.fonts.titleSize + 8),
                                    lineHeight: 1,
                                    filter: `drop-shadow(0 0 4px ${hexAlpha(colors.progressCount, 0.38)})`,
                                }}
                            >
                                {currentVal}
                            </span>
                            <span
                                className="mx-1"
                                style={{
                                    color: hexAlpha(colors.progressCount, 0.72),
                                    fontSize: Math.max(18, config.fonts.titleSize + 4),
                                }}
                            >/</span>
                            <span
                                className="font-bold tabular-nums"
                                style={{
                                    color: hexAlpha(colors.progressCount, 0.92),
                                    fontSize: Math.max(20, config.fonts.titleSize + 6),
                                    lineHeight: 1,
                                }}
                            >
                                {targetVal}
                            </span>
                        </div>
                    )}
                </div>

                {/* ── JADE INLAY STRIP ── */}
                <div className="relative mx-5 my-1 z-10">
                    <div
                        className="h-4 rounded-sm overflow-hidden relative"
                        style={{
                            background: `linear-gradient(180deg, ${jadeMid}, ${jadeDark}, ${jadeMid})`,
                            border: `1px solid ${hexAlpha(colors.border, 0.25)}`,
                            boxShadow: `inset 0 1px 2px rgba(0,0,0,0.3), 0 1px 0 ${toRgba(borderHighlight, 0.05)}`,
                        }}
                    >
                        {/* Cloud/scroll pattern on jade */}
                        <div
                            className="absolute inset-0 opacity-20"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='20' viewBox='0 0 60 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10 Q15 4 20 10 Q25 16 30 10 Q35 4 40 10 Q45 16 50 10' fill='none' stroke='${jadeLightEncoded}' stroke-width='1.5'/%3E%3C/svg%3E")`,
                                backgroundSize: '60px 20px',
                                backgroundRepeat: 'repeat-x',
                            }}
                        />
                        <JadeDot className="top-1 left-2" colors={colors} />
                        <JadeDot className="top-1 right-2" colors={colors} />
                    </div>
                </div>

                {/* ── PROGRESS BAR — Jade groove with scale-pattern fluid ── */}
                {config.display.showProgressBar && (
                    <div className="relative mx-5 mb-2 z-10">
                        {/* Recessed jade groove */}
                        <div
                            className="relative h-7 rounded-full overflow-hidden"
                            style={{
                                background: `linear-gradient(180deg, ${grooveDark}, ${grooveMid}, ${grooveDark})`,
                                border: `1.5px solid ${hexAlpha(colors.border, 0.38)}`,
                                boxShadow: `inset 0 2px 6px rgba(0,0,0,0.7), 0 1px 0 ${toRgba(borderHighlight, 0.05)}`,
                            }}
                        >
                            {/* Luminous jade/teal fill */}
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(2, progressPercent)}%` }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                                className="absolute top-0 bottom-0 left-0 z-[2] rounded-full"
                                style={{
                                    background: `linear-gradient(90deg, ${jadeMid}, ${colors.progressFill}, ${jadeLight})`,
                                    boxShadow: `0 0 12px ${hexAlpha(colors.progressFill, 0.5)}, 0 0 25px ${hexAlpha(colors.progressFill, 0.19)}`,
                                }}
                            >
                                {/* Dragon scale pattern overlay */}
                                <motion.div
                                    className="absolute inset-0 opacity-40"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='8' fill='none' stroke='${iconSecondaryEncoded}' stroke-width='0.8' opacity='0.4'/%3E%3Ccircle cx='0' cy='0' r='8' fill='none' stroke='${iconSecondaryEncoded}' stroke-width='0.8' opacity='0.4'/%3E%3Ccircle cx='20' cy='0' r='8' fill='none' stroke='${iconSecondaryEncoded}' stroke-width='0.8' opacity='0.4'/%3E%3Ccircle cx='0' cy='20' r='8' fill='none' stroke='${iconSecondaryEncoded}' stroke-width='0.8' opacity='0.4'/%3E%3Ccircle cx='20' cy='20' r='8' fill='none' stroke='${iconSecondaryEncoded}' stroke-width='0.8' opacity='0.4'/%3E%3C/svg%3E")`,
                                        backgroundSize: '14px 14px',
                                        animationName: 'azure-scale-shimmer',
                                        animationDuration: '6s',
                                        animationTimingFunction: 'linear',
                                        animationIterationCount: 'infinite',
                                    }}
                                />
                                {/* Glass-lacquer highlight */}
                                <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/15 to-transparent rounded-t-full" />
                            </motion.div>

                            {/* Unfilled dragon scale pattern (subtle) */}
                            <div
                                className="absolute inset-0 opacity-10"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='8' fill='none' stroke='${borderEncoded}' stroke-width='0.5'/%3E%3C/svg%3E")`,
                                    backgroundSize: '12px 12px',
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* ── BOTTOM SECTION: Given By + Reward ── */}
                <div
                    className="relative z-10 flex gap-3"
                    style={{ padding: '6px 18px 14px 18px' }}
                >
                    {/* Given By */}
                    {config.display.showGivenBy && challenge.challenge.given_by && (
                        <div
                            className="flex-1 flex items-center px-3 py-2"
                            style={{
                                background: `linear-gradient(180deg, ${panelBgTop}, ${panelBgBottomAlt})`,
                                border: `1.5px solid ${hexAlpha(colors.border, 0.31)}`,
                                borderRadius: 20,
                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                            }}
                        >
                            <div className="w-full text-center">
                                <div
                                    className="uppercase tracking-wider font-bold"
                                    style={{
                                        color: colors.dateText,
                                        fontSize: Math.max(7, config.fonts.bodySize - 4),
                                        letterSpacing: '0.12em',
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
                            className="flex-1 flex items-center px-3 py-2"
                            style={{
                                background: `linear-gradient(180deg, ${panelBgTop}, ${panelBgBottomAlt})`,
                                border: `1.5px solid ${hexAlpha(colors.border, 0.31)}`,
                                borderRadius: 20,
                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                            }}
                        >
                            <div className="w-full text-center">
                                <div
                                    className="uppercase tracking-wider font-bold"
                                    style={{
                                        color: colors.dateText,
                                        fontSize: Math.max(7, config.fonts.bodySize - 4),
                                        letterSpacing: '0.12em',
                                    }}
                                >REWARD</div>
                                {rewardValue ? (
                                    <span
                                        className="font-bold uppercase tracking-wider"
                                        style={{ color: colors.subchallengeTitle, fontSize: Math.max(9, config.fonts.bodySize - 1) }}
                                    >
                                        {rewardValue}
                                    </span>
                                ) : (
                                    <div className="flex items-center justify-center gap-1.5">
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
                                                        style={{ color: isCompleted ? colors.subchallengeCompleted : colors.subchallengeTitle }}
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
                </div>

                {/* Date display */}
                {config.display.showDate && (
                    <div
                        className="absolute bottom-2 right-5 flex items-center gap-1 z-20"
                    >
                        <Clock size={9} style={{ color: colors.dateText }} />
                        <span
                            className="uppercase font-bold tracking-wider"
                            style={{ color: colors.dateText, fontSize: Math.max(7, config.fonts.bodySize - 4) }}
                        >
                            {challenge.timeLeft}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
