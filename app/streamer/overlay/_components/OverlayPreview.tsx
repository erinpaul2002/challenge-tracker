import { createElement } from 'react';
import { MonitorPlay, Target } from 'lucide-react';
import { OverlayConfig, ActiveChallenge, LayoutPosition, THEME_PRESETS } from '../types';
import { getThemeRenderer } from './themes';
import CompletionCelebration from './CompletionCelebration';

interface OverlayPreviewProps {
  tempConfig: OverlayConfig | null;
  activeChallenges: ActiveChallenge[];
  activeIndex: number;
  activeSubIndex: number;
  fade: boolean;
  animationClass: string;
  transitionDurationMs: number;
}

// Map layout position to CSS properties for canvas placement
function getPositionStyles(position: LayoutPosition): React.CSSProperties {
  const map: Record<LayoutPosition, React.CSSProperties> = {
    'top-left': { top: '5%', left: '3%' },
    'top-center': { top: '5%', left: '50%', transform: 'translateX(-50%)' },
    'top-right': { top: '5%', right: '3%' },
    'center-left': { top: '50%', left: '3%', transform: 'translateY(-50%)' },
    'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    'center-right': { top: '50%', right: '3%', transform: 'translateY(-50%)' },
    'bottom-left': { bottom: '5%', left: '3%' },
    'bottom-center': { bottom: '5%', left: '50%', transform: 'translateX(-50%)' },
    'bottom-right': { bottom: '5%', right: '3%' },
  };
  return map[position] || map['bottom-left'];
}

export default function OverlayPreview({
  tempConfig,
  activeChallenges,
  activeIndex,
  activeSubIndex,
  fade,
  animationClass,
  transitionDurationMs,
}: OverlayPreviewProps) {
  if (!tempConfig) return null;

  const themeRenderer = getThemeRenderer(tempConfig.theme);
  const positionStyles = getPositionStyles(tempConfig.layout.position);
  const themeLabel = THEME_PRESETS.find((preset) => preset.name === tempConfig.theme)?.label ?? tempConfig.theme.toUpperCase();
  const activeChallenge = activeChallenges[activeIndex];
  const currentSubChallenge = activeChallenge?.subChallenges?.length
    ? activeChallenge.subChallenges[activeSubIndex % activeChallenge.subChallenges.length]
    : undefined;

  const currentSubProgress = currentSubChallenge
    ? currentSubChallenge.target_limit > 0
      ? Math.min(100, Math.max(0, (currentSubChallenge.current_progress / currentSubChallenge.target_limit) * 100))
      : 0
    : activeChallenge?.progress;

  const isChallengeCompleted = Boolean(
    activeChallenge && (
      activeChallenge.challenge.status === 'completed' ||
      activeChallenge.progress >= 100 ||
      (activeChallenge.subChallenges.length > 0 &&
        activeChallenge.subChallenges.every((sub) =>
          sub.status === 'completed' ||
          (sub.target_limit > 0 && sub.current_progress / sub.target_limit >= 1)
        ))
    )
  );

  const isCurrentSubChallengeCompleted = Boolean(
    !isChallengeCompleted &&
      currentSubChallenge &&
      (currentSubChallenge.status === 'completed' || (currentSubProgress ?? 0) >= 100)
  );

  const completionBadgeLabel = isChallengeCompleted
    ? 'CHALLENGE COMPLETED'
    : isCurrentSubChallengeCompleted
      ? 'SUB-CHALLENGE COMPLETED'
      : null;

  const challengeForRender = activeChallenge
    ? {
        ...activeChallenge,
        subChallenges: currentSubChallenge ? [currentSubChallenge] : [],
        progress: currentSubProgress,
        challenge: {
          ...activeChallenge.challenge,
          title: tempConfig.display.showChallengeTitle === false ? '' : activeChallenge.challenge.title,
          reward_amount:
            tempConfig.display.showReward === false
              ? undefined
              : activeChallenge.challenge.reward_amount,
        },
      }
    : activeChallenge;

  // Use generous width in preview — the actual pixel width only matters on the public overlay
  const overlayWidthPercent = 92;

  return (
    <div className="bg-armor border border-gunmetal overflow-hidden">
      <div className="p-4 bg-gunmetal/20 font-chakra font-black text-sm italic tracking-widest flex items-center gap-2">
        <MonitorPlay size={16} /> LIVE_PREVIEW
      </div>

      {/* OBS Canvas - 16:9 */}
      <div className="border-t border-gunmetal">
        <div
          className="relative overflow-hidden"
          style={{
            aspectRatio: '16/9',
            backgroundColor: tempConfig.colors.background,
            backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(255,255,255,0.02) 0%, transparent 60%)',
          }}
        >
          {/* Grid overlay to simulate OBS */}
          <div className="absolute inset-0 pointer-events-none opacity-20" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '33.33% 33.33%',
          }} />

          {/* Corner markers */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-white/10" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-white/10" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-white/10" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-white/10" />

          {/* "GAME FEED" placeholder text */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-white/5 font-mono text-sm tracking-[0.5em] uppercase">Game Feed</span>
          </div>

          {/* Overlay widget positioned within canvas */}
          {activeChallenges.length === 0 ? (
            <div className="absolute" style={{ ...positionStyles, width: `${overlayWidthPercent}%` }}>
              <div className="border p-4 text-center" style={{ backgroundColor: tempConfig.colors.cardBackground, borderColor: tempConfig.colors.border, borderRadius: tempConfig.layout.borderRadius }}>
                <Target size={24} className="mx-auto mb-2" style={{ color: tempConfig.colors.iconPrimary }} />
                <p className="text-xs font-mono" style={{ color: tempConfig.colors.dateText }}>NO_ACTIVE_CHALLENGES</p>
              </div>
            </div>
          ) : (
            <div
              className="absolute"
              style={{
                ...positionStyles,
                width: `${overlayWidthPercent}%`,
              }}
            >
              <div
                className={`transition-all ${animationClass}`}
                style={{
                  opacity: tempConfig.animations.enabled ? (fade ? 1 : 0) : 1,
                  transitionDuration: `${transitionDurationMs}ms`,
                  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {completionBadgeLabel && (
                  <CompletionCelebration
                    label={completionBadgeLabel}
                    accentColor={tempConfig.colors.completedIndicator}
                    borderColor={tempConfig.colors.border}
                  />
                )}
                {createElement(themeRenderer, {
                  challenge: challengeForRender,
                  config: tempConfig,
                  fade: !fade,
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer stats */}
      <div className="p-3 bg-void/50 border-t border-gunmetal text-[10px] text-dimmed text-center font-mono flex items-center justify-between px-4">
        <span>
          THEME: <span className="text-tactical">{themeLabel}</span>
        </span>
        <span>
          {activeChallenges.length > 0
            ? `${activeIndex + 1}/${activeChallenges.length} CHALLENGES`
            : 'NO CHALLENGES'}
        </span>
        <span>
          {tempConfig.layout.width}×AUTO • {tempConfig.layout.position.toUpperCase().replace('-', '_')}
        </span>
      </div>
    </div>
  );
}
