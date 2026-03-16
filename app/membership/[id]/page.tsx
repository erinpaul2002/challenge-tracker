'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

function getPositionStyles(position: string): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    'bottom-left': { justifyContent: 'flex-start', alignItems: 'flex-end' },
    'bottom-right': { justifyContent: 'flex-end', alignItems: 'flex-end' },
    'top-left': { justifyContent: 'flex-start', alignItems: 'flex-start' },
    'top-right': { justifyContent: 'flex-end', alignItems: 'flex-start' },
  };
  return map[position] || map['bottom-left'];
}



type MembershipThemeColors = {
  cardBg: string;
  border: string;
  title: string;
  month: string;
  value: string;
  target: string;
  progressText: string;
  progressFill: string;
  progressTrack: string;
  streamer: string;
};

type MembershipCustomImageConfig = {
  cardBackgroundImageStorageId?: string;
  cardBackgroundImageUrl?: string;
  cardBackgroundImageOpacity?: number;
  cardBackgroundImageSize?: 'cover' | 'contain';
  cardBackgroundImagePosition?: string;
  cardBackgroundImageRepeat?: 'no-repeat' | 'repeat';
};

const formatMonthForThemeTitle = (monthKey: string): string => {
  const [year, month] = monthKey.split('-').map((value) => Number.parseInt(value, 10));
  if (!year || !month) return monthKey;

  const monthText = new Intl.DateTimeFormat(undefined, {
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)));

  return `${monthText}, ${year}`;
};

function renderMembershipThemeCard({
  colors,
  monthKey,
  currentCount,
  targetCount,
  progress,
  customImage,
}: {
  colors: MembershipThemeColors;
  monthKey: string;
  currentCount: number;
  targetCount: number;
  progress: number;
  customImage?: MembershipCustomImageConfig;
}) {
  const pct = Math.round(progress);
  const showImage = Boolean(customImage?.cardBackgroundImageUrl);

  return (
    <div className="relative min-h-[170px] p-5 flex flex-col overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}>
      {showImage && (
        <>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url(${customImage?.cardBackgroundImageUrl})`,
              backgroundSize: customImage?.cardBackgroundImageSize || 'cover',
              backgroundPosition: customImage?.cardBackgroundImagePosition || 'center',
              backgroundRepeat: customImage?.cardBackgroundImageRepeat || 'no-repeat',
              opacity: Math.max(0, Math.min(100, customImage?.cardBackgroundImageOpacity ?? 100)) / 100,
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(165deg, rgba(10,15,19,0.22) 0%, rgba(6,9,14,0.78) 100%)',
            }}
          />
        </>
      )}

      <div className="relative z-10 text-sm font-semibold tracking-wide" style={{ color: colors.title }}>
        Membership Goal : {formatMonthForThemeTitle(monthKey)}
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl font-black leading-none" style={{ color: colors.value }}>
            {currentCount}
            <span className="mx-2 text-3xl font-semibold" style={{ color: colors.progressText }}>/</span>
            <span className="text-5xl font-bold" style={{ color: colors.target }}>{targetCount}</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 h-1" style={{ backgroundColor: colors.progressTrack }}>
        <div className="h-full" style={{ width: `${pct}%`, backgroundColor: colors.progressFill }} />
      </div>
    </div>
  );
}

export default function MembershipOverlayPage() {
  const params = useParams();
  const token = params.id as string;

  const membership = useQuery(
    api.memberships.getMembershipByToken,
    token ? { token } : 'skip'
  );

  const overlayConfig = useQuery(
    api.memberships.getMembershipOverlayConfigByToken,
    token ? { token } : 'skip'
  );

  const progress = useMemo(() => {
    if (!membership || membership.targetCount <= 0) return 0;
    return Math.min(100, Math.max(0, (membership.currentCount / membership.targetCount) * 100));
  }, [membership]);

  if (!membership || !overlayConfig) {
    return <div className="w-full h-screen bg-transparent" />;
  }

  const positionStyles = getPositionStyles(overlayConfig?.layout.position ?? 'bottom-left');

  return (
    <div className="w-full h-screen bg-transparent flex" style={{ ...positionStyles, padding: `${overlayConfig?.layout.padding ?? 24}px` }}>
      <div
        className="border shadow-[0_0_24px_rgba(0,0,0,0.35)] backdrop-blur-sm transition-all duration-300"
        style={{
          width: `${overlayConfig?.layout.width ?? 420}px`,
          borderColor: overlayConfig?.colors.border,
          backgroundColor: overlayConfig?.colors.cardBg,
        }}
      >
        {renderMembershipThemeCard({
          colors: overlayConfig.colors,
          monthKey: membership.monthKey,
          currentCount: membership.currentCount,
          targetCount: membership.targetCount,
          progress,
          customImage: overlayConfig.custom as MembershipCustomImageConfig,
        })}
      </div>
    </div>
  );
}
