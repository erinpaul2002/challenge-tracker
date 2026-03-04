import { useEffect, useMemo, type CSSProperties } from 'react';
import { Target, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { ThemeRendererProps } from '../../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { darken, lighten, blend, toRgba, hexAlpha, injectDynamicKeyframes } from '../../colorUtils';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const STYLE_ID = 'cyberthreat-keyframes';

function ensureKeyframes(colors: ThemeRendererProps['config']['colors']) {
    const primaryGlow = (a: number) => toRgba(colors.iconPrimary, a);
    const secondaryGlow = (a: number) => toRgba(colors.iconSecondary, a);

    injectDynamicKeyframes(STYLE_ID, `
    @keyframes cyberthreat-glitch {
      0%, 91%, 100% { opacity: 0; transform: translateX(0); }
      92% { opacity: 0.55; transform: translateX(1px); }
      94% { opacity: 0; transform: translateX(0); }
      95% { opacity: 0.4; transform: translateX(-2px); }
      98% { opacity: 0; transform: translateX(0); }
    }
    @keyframes cyberthreat-scan {
      0% { transform: translateX(-120%); opacity: 0; }
      15% { opacity: 0.75; }
      60% { opacity: 0.5; }
      100% { transform: translateX(220%); opacity: 0; }
    }
    @keyframes cyberthreat-pulse-cyan {
      0%, 100% { box-shadow: 0 0 6px ${primaryGlow(0.25)}; }
      50% { box-shadow: 0 0 12px ${primaryGlow(0.45)}, 0 0 28px ${primaryGlow(0.12)}; }
    }
    @keyframes cyberthreat-pulse-pink {
      0%, 100% { box-shadow: 0 0 5px ${secondaryGlow(0.3)}; }
      50% { box-shadow: 0 0 10px ${secondaryGlow(0.6)}, 0 0 24px ${secondaryGlow(0.16)}; }
    }
    @keyframes cyberthreat-heart-pop {
      0%, 100% { transform: translateY(0) scale(1); opacity: 0.2; }
      35% { transform: translateY(-3px) scale(1.1); opacity: 0.95; }
      70% { transform: translateY(-1px) scale(1); opacity: 0.45; }
    }
    @keyframes cyberthreat-aberration {
      0%, 100% { filter: hue-rotate(0deg); opacity: 0; }
      20% { opacity: 0.12; }
      40% { opacity: 0.05; }
      80% { opacity: 0.15; }
    }
    `);
}

function PixelHeart({
    className,
    color,
    style,
}: {
    className?: string;
    color: string;
    style?: CSSProperties;
}) {
    return (
        <svg
            className={className}
            style={style}
            viewBox="0 0 12 10"
            xmlns="http://www.w3.org/2000/svg"
            shapeRendering="crispEdges"
            aria-hidden="true"
        >
            <path
                d="M1 2H3V1H5V2H7V1H9V2H11V4H10V6H9V7H8V8H7V9H5V8H4V7H3V6H2V4H1V2Z"
                fill={color}
            />
        </svg>
    );
}

export default function ThemeCyberThreat({ challenge, config, fade }: ThemeRendererProps) {
    const c = config.colors;

    /* ── derived structural palette ─────────────────────────────── */
    const shellHighlight = lighten(c.cardBackground, 0.7);     // outer shell lightest
    const shellMid       = darken(c.cardBackground, 0.07);      // outer shell mid
    const shellLight     = lighten(c.cardBackground, 0.2);      // outer shell light
    const shellDark      = darken(c.cardBackground, 0.12);      // outer shell darkest

    const innerDark1     = lighten(c.progressEmpty, 0.10);      // inner card top
    const innerDark2     = lighten(c.progressEmpty, 0.045);     // inner card mid
    const innerDark3     = lighten(c.progressEmpty, 0.01);      // inner card deepest

    const housingLight   = lighten(c.cardBackground, 0.44);     // progress housing top
    const housingDark    = darken(c.cardBackground, 0.065);     // progress housing bottom

    const trackDark1     = lighten(c.progressEmpty, 0.035);     // progress track top
    const trackDark2     = darken(c.progressEmpty, 0.16);       // progress track bottom

    const unfilled1      = lighten(c.progressEmpty, 0.10);      // unfilled segment top
    const unfilled2      = lighten(c.progressEmpty, 0.062);     // unfilled segment bottom

    const infoBg1        = lighten(c.progressEmpty, 0.038);     // info panel top
    const infoBg2        = c.progressEmpty;                     // info panel bottom

    const whiteHighlight = lighten(c.cardBackground, 1);        // structural white

    useEffect(() => {
        ensureKeyframes(c);
    }, [c]);

    const progressPercent = Math.max(0, Math.min(100, challenge.progress));
    const targetVal = Math.max(1, challenge.subChallenges[0]?.target_limit || 1);
    const currentVal = Math.round((progressPercent / 100) * targetVal);
    const rewardValue = challenge.challenge.reward_amount?.trim();
    const totalCells = 24;
    const filledCells = Math.round((progressPercent / 100) * totalCells);
    const dimmed = c.dimmed || c.dateText;

    const hearts = useMemo(
        () => [
            { top: '4%', left: '-4%', delay: '0.15s', color: c.iconSecondary, size: 14 },
            { top: '7%', right: '-3%', delay: '0.9s', color: c.iconPrimary, size: 12 },
            { bottom: '8%', left: '6%', delay: '0.45s', color: c.iconSecondary, size: 12 },
            { bottom: '14%', right: '4%', delay: '1.1s', color: c.iconSecondary, size: 10 },
        ],
        [c.iconSecondary, c.iconPrimary]
    );

    return (
        <div
            className={cn(
                'relative transition-opacity duration-500',
                fade ? 'opacity-0' : 'opacity-100'
            )}
            style={{
                width: config.layout.width,
                fontFamily: config.fonts.body,
                opacity: config.layout.opacity / 100,
            }}
        >
            <div className="absolute inset-0 pointer-events-none z-40">
                {hearts.map((heart, index) => (
                    <PixelHeart
                        key={index}
                        className="absolute"
                        color={heart.color}
                        style={{
                            ...heart,
                            width: heart.size,
                            height: heart.size - 2,
                            filter: `drop-shadow(0 0 8px ${heart.color})`,
                            animationName: 'cyberthreat-heart-pop',
                            animationDuration: '2.6s',
                            animationTimingFunction: 'ease-in-out',
                            animationIterationCount: 'infinite',
                            animationDelay: heart.delay,
                        }}
                    />
                ))}
            </div>

            <div
                className="absolute -top-[5px] left-[12%] right-[12%] h-[2px] z-30 pointer-events-none"
                style={{
                    background: `linear-gradient(90deg, transparent, ${c.iconSecondary}, transparent)`,
                    animationName: 'cyberthreat-pulse-pink',
                    animationDuration: '2.8s',
                    animationIterationCount: 'infinite',
                }}
            />
            <div
                className="absolute -bottom-[5px] left-[8%] right-[8%] h-[2px] z-30 pointer-events-none"
                style={{
                    background: `linear-gradient(90deg, transparent, ${c.iconPrimary}, transparent)`,
                    animationName: 'cyberthreat-pulse-cyan',
                    animationDuration: '2.8s',
                    animationIterationCount: 'infinite',
                }}
            />
            <div
                className="absolute top-[24%] -left-[4px] w-[2px] h-[52%] z-30 pointer-events-none"
                style={{
                    background: `linear-gradient(180deg, transparent, ${c.iconPrimary}, transparent)`,
                }}
            />
            <div
                className="absolute top-[24%] -right-[4px] w-[2px] h-[52%] z-30 pointer-events-none"
                style={{
                    background: `linear-gradient(180deg, transparent, ${c.iconSecondary}, transparent)`,
                }}
            />

            <div
                className="relative overflow-hidden"
                style={{
                    borderRadius: config.layout.borderRadius,
                    clipPath: 'polygon(4% 0, 96% 0, 100% 10%, 100% 90%, 96% 100%, 4% 100%, 0 90%, 0 10%)',
                    background: `linear-gradient(145deg, ${shellHighlight} 0%, ${shellMid} 35%, ${shellLight} 70%, ${shellDark} 100%)`,
                    boxShadow: `
                        0 0 0 1px ${toRgba(c.border, 0.7)},
                        inset 0 1px 0 ${toRgba(whiteHighlight, 0.95)},
                        inset 0 -2px 3px ${toRgba(c.progressEmpty, 0.25)},
                        0 12px 30px ${toRgba(c.progressEmpty, 0.65)},
                        0 0 24px ${toRgba(c.iconPrimary, 0.08)},
                        0 0 28px ${toRgba(c.iconSecondary, 0.06)}
                    `,
                }}
            >
                <div
                    className="absolute inset-0 pointer-events-none z-[2]"
                    style={{
                        background: `linear-gradient(180deg, ${toRgba(whiteHighlight, 0.55)} 0%, ${toRgba(whiteHighlight, 0.14)} 22%, transparent 48%, ${toRgba(c.progressEmpty, 0.18)} 100%)`,
                    }}
                />
                <div
                    className="absolute inset-[8px] pointer-events-none z-[1]"
                    style={{
                        clipPath: 'polygon(3% 0, 97% 0, 100% 12%, 100% 88%, 97% 100%, 3% 100%, 0 88%, 0 12%)',
                        background: `linear-gradient(155deg, ${innerDark1} 0%, ${innerDark2} 45%, ${innerDark3} 100%)`,
                    }}
                />
                <div
                    className="absolute inset-[8px] pointer-events-none z-[2] opacity-[0.14]"
                    style={{
                        clipPath: 'polygon(3% 0, 97% 0, 100% 12%, 100% 88%, 97% 100%, 3% 100%, 0 88%, 0 12%)',
                        backgroundImage:
                            "url(\"data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 10 10' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='white' stroke-width='0.6'%3E%3Cpath d='M0 2H10M0 7H10M2 0V10M7 0V10'/%3E%3C/g%3E%3C/svg%3E\")",
                        backgroundSize: '10px 10px',
                    }}
                />

                <div
                    className="absolute inset-0 pointer-events-none z-[25]"
                    style={{
                        background:
                            `linear-gradient(0deg, transparent 46%, ${toRgba(c.iconPrimary, 0.14)} 48%, transparent 50%)`,
                        animationName: 'cyberthreat-glitch',
                        animationDuration: '8s',
                        animationIterationCount: 'infinite',
                    }}
                />
                <div
                    className="absolute inset-0 pointer-events-none z-[26] mix-blend-screen"
                    style={{
                        background:
                            `linear-gradient(90deg, ${toRgba(c.iconPrimary, 0.25)}, transparent 35%, transparent 65%, ${toRgba(c.iconSecondary, 0.22)})`,
                        animationName: 'cyberthreat-aberration',
                        animationDuration: '5.6s',
                        animationIterationCount: 'infinite',
                    }}
                />

                <div className="relative z-20 grid grid-cols-[1fr_auto] gap-3 px-5 pt-4">
                    <div
                        className="relative overflow-hidden"
                        style={{
                            clipPath: 'polygon(0 0, 94% 0, 100% 20%, 94% 100%, 0 100%, 0 0)',
                            background: `linear-gradient(160deg, ${toRgba(c.progressEmpty, 0.98)}, ${toRgba(lighten(c.progressEmpty, 0.05), 0.95)})`,
                            border: `1px solid ${c.border}`,
                            boxShadow: `inset 0 0 0 1px ${toRgba(whiteHighlight, 0.08)}, 0 0 12px ${hexAlpha(c.iconPrimary, 0.09)}`,
                            padding: '10px 14px 9px 14px',
                        }}
                    >
                        <div
                            className="uppercase font-black tracking-wider leading-none truncate"
                            style={{
                                color: c.challengeTitle,
                                fontFamily: config.fonts.title,
                                fontSize: config.fonts.titleSize,
                                textShadow: `0 2px 5px ${toRgba(c.progressEmpty, 0.7)}`,
                            }}
                        >
                            {challenge.challenge.title}
                        </div>
                        {config.display.showSubChallenges && challenge.subChallenges.length > 0 && (
                            <>
                                <div
                                    className="uppercase font-bold tracking-[0.18em] mt-1 truncate"
                                    style={{
                                        color: c.subchallengeTitle,
                                        fontSize: Math.max(9, config.fonts.bodySize - 1),
                                        textShadow: `0 0 10px ${hexAlpha(c.iconSecondary, 0.4)}`,
                                    }}
                                >
                                    {challenge.subChallenges[0]?.title || 'HEADLINE'}
                                </div>
                                <div
                                    className="mt-1 h-[2px] w-[76%]"
                                    style={{
                                        background: `linear-gradient(90deg, ${c.iconSecondary}, transparent)`,
                                    }}
                                />
                            </>
                        )}
                    </div>

                    {(config.display.showProgressCount ?? true) && (
                        <div
                            className="relative overflow-hidden flex items-center"
                            style={{
                                clipPath: 'polygon(7% 0, 93% 0, 100% 22%, 100% 78%, 93% 100%, 7% 100%, 0 78%, 0 22%)',
                                background: `linear-gradient(150deg, ${toRgba(c.progressEmpty, 0.98)}, ${toRgba(lighten(c.progressEmpty, 0.035), 0.96)})`,
                                border: `1px solid ${c.border}`,
                                boxShadow: `inset 0 0 0 1px ${toRgba(whiteHighlight, 0.08)}, 0 0 10px ${hexAlpha(c.iconPrimary, 0.18)}`,
                                padding: '9px 16px',
                                minWidth: 138,
                            }}
                        >
                            <span
                                className="font-black tabular-nums tracking-[0.08em] leading-none"
                                style={{
                                    color: c.progressCount,
                                    fontSize: Math.max(24, config.fonts.titleSize + 8),
                                    fontFamily: 'VT323, "JetBrains Mono", monospace',
                                    textShadow: `-1px 0 ${c.iconSecondary}, 1px 0 ${c.iconPrimary}, 0 0 16px ${c.progressCount}`,
                                }}
                            >
                                {currentVal}
                            </span>
                            <span
                                className="px-1 font-bold"
                                style={{
                                    color: hexAlpha(c.progressCount, 0.72),
                                    fontSize: Math.max(18, config.fonts.titleSize + 4),
                                }}
                            >
                                /
                            </span>
                            <span
                                className="font-bold tabular-nums leading-none"
                                style={{
                                    color: c.progressCount,
                                    fontSize: Math.max(20, config.fonts.titleSize + 6),
                                    fontFamily: 'VT323, "JetBrains Mono", monospace',
                                }}
                            >
                                {targetVal}
                            </span>
                        </div>
                    )}
                </div>

                {config.display.showProgressBar && (
                    <div className="relative z-20 px-5 pt-3">
                        <div
                            className="relative overflow-hidden"
                            style={{
                                clipPath: 'polygon(2% 0, 98% 0, 100% 23%, 100% 77%, 98% 100%, 2% 100%, 0 77%, 0 23%)',
                                background: `linear-gradient(180deg, ${housingLight}, ${housingDark})`,
                                border: `1px solid ${c.border}`,
                                padding: 4,
                                boxShadow: `inset 0 1px 0 ${toRgba(whiteHighlight, 0.8)}, 0 3px 12px ${toRgba(c.progressEmpty, 0.25)}`,
                            }}
                        >
                            <div
                                className="relative h-10 overflow-hidden"
                                style={{
                                    background: `linear-gradient(180deg, ${trackDark1}, ${trackDark2})`,
                                    border: `1px solid ${c.border}`,
                                    clipPath: 'polygon(1% 0, 99% 0, 100% 24%, 100% 76%, 99% 100%, 1% 100%, 0 76%, 0 24%)',
                                }}
                            >
                                <div className="absolute inset-0 px-3 flex items-center gap-[3px] z-10">
                                    {Array.from({ length: totalCells }).map((_, i) => {
                                        const filled = i < filledCells;
                                        return (
                                            <motion.div
                                                key={i}
                                                className="h-[62%] flex-1 rounded-[2px]"
                                                initial={{ opacity: 0.2, scaleY: 0.8 }}
                                                animate={{
                                                    opacity: filled ? 1 : 0.16,
                                                    scaleY: 1,
                                                }}
                                                transition={{
                                                    duration: 0.25,
                                                    delay: filled ? i * 0.02 : 0,
                                                }}
                                                style={{
                                                    background: filled
                                                        ? `linear-gradient(180deg, ${c.iconSecondary}, ${c.progressFill})`
                                                        : `linear-gradient(180deg, ${unfilled1}, ${unfilled2})`,
                                                    boxShadow: filled
                                                        ? `0 0 8px ${hexAlpha(c.progressFill, 0.67)}, 0 0 12px ${hexAlpha(c.iconSecondary, 0.33)}`
                                                        : `inset 0 0 3px ${toRgba(c.progressEmpty, 0.6)}`,
                                                }}
                                            />
                                        );
                                    })}
                                </div>

                                <div
                                    className="absolute inset-0 pointer-events-none opacity-45 z-20"
                                    style={{
                                        backgroundImage: `
                                          linear-gradient(to right, ${toRgba(c.iconSecondary, 0.35)} 1px, transparent 1px),
                                          linear-gradient(to top, ${toRgba(c.iconPrimary, 0.22)} 1px, transparent 1px)
                                        `,
                                        backgroundSize: '12px 100%, 100% 8px',
                                    }}
                                />
                                <div
                                    className="absolute top-0 bottom-0 w-[20%] pointer-events-none z-30"
                                    style={{
                                        background: `linear-gradient(90deg, transparent, ${hexAlpha(c.iconPrimary, 0.33)}, transparent)`,
                                        animationName: 'cyberthreat-scan',
                                        animationDuration: '2.4s',
                                        animationTimingFunction: 'linear',
                                        animationIterationCount: 'infinite',
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="relative z-20 px-5 pt-3 pb-4 flex items-center gap-3">
                    {config.display.showGivenBy && challenge.challenge.given_by && (
                        <div
                            className="flex-1 px-3 py-2 min-w-0"
                            style={{
                                clipPath: 'polygon(5% 0, 95% 0, 100% 24%, 100% 76%, 95% 100%, 5% 100%, 0 76%, 0 24%)',
                                background: `linear-gradient(180deg, ${infoBg1}, ${infoBg2})`,
                                border: `1px solid ${c.border}`,
                                boxShadow: `inset 0 0 0 1px ${toRgba(whiteHighlight, 0.06)}, 0 0 10px ${hexAlpha(c.iconPrimary, 0.12)}`,
                            }}
                        >
                            <div
                                className="uppercase font-bold tracking-[0.12em]"
                                style={{
                                    color: dimmed,
                                    fontSize: Math.max(7, config.fonts.bodySize - 4),
                                }}
                            >
                                GIVEN BY
                            </div>
                            <div
                                className="uppercase font-bold tracking-wider truncate"
                                style={{
                                    color: c.viewerName,
                                    fontSize: Math.max(10, config.fonts.bodySize - 1),
                                }}
                            >
                                {challenge.challenge.given_by}
                            </div>
                        </div>
                    )}

                    {(config.display.showReward ?? true) && (
                        <div
                            className="flex-1 px-3 py-2"
                            style={{
                                clipPath: 'polygon(5% 0, 95% 0, 100% 24%, 100% 76%, 95% 100%, 5% 100%, 0 76%, 0 24%)',
                                background: `linear-gradient(180deg, ${infoBg1}, ${infoBg2})`,
                                border: `1px solid ${c.border}`,
                                boxShadow: `inset 0 0 0 1px ${toRgba(whiteHighlight, 0.06)}, 0 0 10px ${hexAlpha(c.iconSecondary, 0.12)}`,
                            }}
                        >
                            <div
                                className="uppercase font-bold tracking-[0.12em]"
                                style={{
                                    color: dimmed,
                                    fontSize: Math.max(7, config.fonts.bodySize - 4),
                                }}
                            >
                                REWARD
                            </div>
                            {rewardValue ? (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <PixelHeart
                                        color={c.iconSecondary}
                                        className="w-[10px] h-[9px]"
                                        style={{
                                            filter: `drop-shadow(0 0 8px ${c.iconSecondary})`,
                                        }}
                                    />
                                    <span
                                        className="font-bold uppercase tracking-wider"
                                        style={{ color: c.viewerName, fontSize: Math.max(10, config.fonts.bodySize - 1) }}
                                    >
                                        {rewardValue}
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <PixelHeart
                                        color={c.iconSecondary}
                                        className="w-[10px] h-[9px]"
                                        style={{
                                            filter: `drop-shadow(0 0 8px ${c.iconSecondary})`,
                                        }}
                                    />
                                    {challenge.subChallenges.map((sub) => {
                                        const isCompleted = sub.status === 'completed';
                                        return (
                                            <div key={sub.id} className="flex items-center gap-1">
                                                <Target
                                                    size={10}
                                                    style={{
                                                        color: isCompleted
                                                            ? c.completedIndicator
                                                            : c.iconPrimary,
                                                    }}
                                                />
                                                <span
                                                    className={cn(
                                                        'font-mono text-[10px] font-bold',
                                                        isCompleted && 'line-through opacity-60'
                                                    )}
                                                    style={{
                                                        color: isCompleted
                                                            ? c.subchallengeCompleted
                                                            : c.challengeTitle,
                                                    }}
                                                >
                                                    {sub.current_progress}/{sub.target_limit}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {config.display.showDate && (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Clock size={10} style={{ color: dimmed }} />
                            <span
                                className="uppercase font-bold tracking-[0.08em]"
                                style={{
                                    color: dimmed,
                                    fontSize: Math.max(8, config.fonts.bodySize - 3),
                                }}
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
