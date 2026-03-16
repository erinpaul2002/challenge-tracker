import { Clock, Trophy, User, Crosshair } from 'lucide-react';
import { ThemeRendererProps } from '../../types';
import { darken, lighten, toRgba } from '../../colorUtils';

export default function ThemeCustomImageCard({ challenge, config, fade }: ThemeRendererProps) {
  const colors = config.colors;
  const progressPercent = Math.max(0, Math.min(100, challenge.progress));
  const current = challenge.subChallenges[0]?.current_progress ?? Math.round((progressPercent / 100) * (challenge.subChallenges[0]?.target_limit ?? 1));
  const target = challenge.subChallenges[0]?.target_limit ?? 1;
  const showImage = Boolean(config.custom?.cardBackgroundImageUrl);

  return (
    <div
      className="relative overflow-hidden transition-opacity duration-500"
      style={{
        width: config.layout.width,
        opacity: fade ? 0 : 1,
      }}
    >
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: config.layout.borderRadius,
          border: config.layout.showBorder ? `1px solid ${colors.border}` : 'none',
          padding: config.layout.padding,
          backgroundColor: colors.cardBackground,
          boxShadow: `0 12px 32px ${toRgba('#000000', 0.45)}, 0 0 24px ${toRgba(colors.iconPrimary, 0.12)}`,
        }}
      >
        {showImage && (
          <>
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `url(${config.custom?.cardBackgroundImageUrl})`,
                backgroundSize: config.custom?.cardBackgroundImageSize || 'cover',
                backgroundPosition: config.custom?.cardBackgroundImagePosition || 'center',
                backgroundRepeat: config.custom?.cardBackgroundImageRepeat || 'no-repeat',
                opacity: Math.max(0, Math.min(100, config.custom?.cardBackgroundImageOpacity ?? 100)) / 100,
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(165deg, ${toRgba(colors.cardBackground, 0.24)} 0%, ${toRgba(darken(colors.cardBackground, 0.28), 0.8)} 100%)`,
              }}
            />
          </>
        )}

        {!showImage && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(165deg, ${lighten(colors.cardBackground, 0.06)} 0%, ${colors.cardBackground} 45%, ${darken(colors.cardBackground, 0.2)} 100%)`,
            }}
          />
        )}

        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {config.display.showChallengeTitle !== false && (
              <div className="flex items-start gap-2">
                <Crosshair size={14} style={{ color: colors.iconPrimary }} className="mt-[2px] shrink-0" />
                <h3
                  className="font-black uppercase leading-tight break-words"
                  style={{
                    color: colors.challengeTitle,
                    fontFamily: config.fonts.title,
                    fontWeight: config.fonts.titleWeight,
                    fontSize: config.fonts.titleSize,
                  }}
                >
                  {challenge.challenge.title}
                </h3>
              </div>
            )}

            {config.display.showSubChallenges && challenge.subChallenges[0]?.title && (
              <p
                className="mt-1 uppercase"
                style={{
                  color: challenge.subChallenges[0]?.status === 'completed' ? colors.subchallengeCompleted : colors.subchallengeTitle,
                  fontFamily: config.fonts.body,
                  fontSize: config.fonts.bodySize,
                }}
              >
                {challenge.subChallenges[0].title}
              </p>
            )}
          </div>

          {(config.display.showProgressCount ?? true) && (
            <div
              className="font-black font-mono tracking-wide shrink-0"
              style={{
                color: colors.progressCount,
                fontSize: Math.max(16, config.fonts.titleSize + 5),
              }}
            >
              {current}
              <span style={{ color: colors.dateText }}>/</span>
              <span className="opacity-80">{target}</span>
            </div>
          )}
        </div>

        {config.display.showProgressBar && (
          <div className="relative mt-4 h-3 overflow-hidden" style={{ backgroundColor: colors.progressEmpty, borderRadius: 999, border: `1px solid ${toRgba(colors.border, 0.55)}` }}>
            <div
              className="h-full"
              style={{
                width: `${Math.max(1, progressPercent)}%`,
                background: `linear-gradient(90deg, ${darken(colors.progressFill, 0.25)} 0%, ${colors.progressFill} 100%)`,
                boxShadow: `0 0 12px ${toRgba(colors.progressFill, 0.45)}`,
                transition: 'width 500ms ease',
              }}
            />
          </div>
        )}

        <div className="relative z-10 mt-4 grid grid-cols-2 gap-2">
          {config.display.showGivenBy && challenge.challenge.given_by && (
            <div className="flex items-center gap-2 px-2.5 py-2" style={{ borderRadius: 6, border: `1px solid ${toRgba(colors.border, 0.6)}`, backgroundColor: toRgba(colors.cardBackground, 0.58) }}>
              <User size={12} style={{ color: colors.iconSecondary }} />
              <div className="min-w-0">
                <div className="text-[10px] uppercase" style={{ color: colors.dateText }}>Given by</div>
                <div className="truncate" style={{ color: colors.viewerName, fontSize: Math.max(11, config.fonts.bodySize - 1) }}>{challenge.challenge.given_by}</div>
              </div>
            </div>
          )}

          {(config.display.showReward ?? true) && (
            <div className="flex items-center gap-2 px-2.5 py-2" style={{ borderRadius: 6, border: `1px solid ${toRgba(colors.border, 0.6)}`, backgroundColor: toRgba(colors.cardBackground, 0.58) }}>
              <Trophy size={12} style={{ color: colors.iconPrimary }} />
              <div className="min-w-0">
                <div className="text-[10px] uppercase" style={{ color: colors.dateText }}>Reward</div>
                <div className="truncate" style={{ color: colors.viewerName, fontSize: Math.max(11, config.fonts.bodySize - 1) }}>{challenge.challenge.reward_amount || 'TBD'}</div>
              </div>
            </div>
          )}
        </div>

        {config.display.showDate && (
          <div className="relative z-10 mt-3 flex items-center gap-1.5" style={{ color: colors.dateText, fontSize: Math.max(10, config.fonts.bodySize - 2) }}>
            <Clock size={11} />
            <span>{challenge.timeLeft}</span>
          </div>
        )}
      </div>
    </div>
  );
}
