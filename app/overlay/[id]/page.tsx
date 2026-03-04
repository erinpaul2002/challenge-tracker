'use client';

import { useEffect, useRef, useState, useMemo, createElement } from 'react';
import { Target } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

// Import shared types and theme renderers
import {
  OverlayConfig,
  ActiveChallenge,
  DEFAULT_OVERLAY_CONFIG,
  mergeWithDefaults,
} from '../../streamer/overlay/types';
import { getThemeRenderer } from '../../streamer/overlay/_components/themes';

function getEntranceClass(type: string, visible: boolean): string {
  if (visible) return 'opacity-100 translate-x-0 translate-y-0 scale-100';
  const map: Record<string, string> = {
    'slide-left': 'opacity-0 -translate-x-8',
    'slide-right': 'opacity-0 translate-x-8',
    'slide-up': 'opacity-0 translate-y-8',
    'fade': 'opacity-0',
    'scale': 'opacity-0 scale-75',
    'glitch': 'opacity-0 translate-x-1 -translate-y-1',
  };
  return map[type] || 'opacity-0';
}

function getPositionStyles(position: string): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    'top-left': { position: 'fixed', top: 0, left: 0 },
    'top-center': { position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)' },
    'top-right': { position: 'fixed', top: 0, right: 0 },
    'center-left': { position: 'fixed', top: '50%', left: 0, transform: 'translateY(-50%)' },
    'center': { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    'center-right': { position: 'fixed', top: '50%', right: 0, transform: 'translateY(-50%)' },
    'bottom-left': { position: 'fixed', bottom: 0, left: 0 },
    'bottom-center': { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)' },
    'bottom-right': { position: 'fixed', bottom: 0, right: 0 },
  };
  return map[position] || map['bottom-left'];
}

export default function OverlayPage() {
  const params = useParams();
  const token = params.id as string;

  const [activeIndex, setActiveIndex] = useState(0);
  const [activeSubIndex, setActiveSubIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const activeChallengesRef = useRef<ActiveChallenge[]>([]);
  const activeIndexRef = useRef(0);
  const activeSubIndexRef = useRef(0);
  const isTransitioningRef = useRef(false);
  const overlayData = useQuery(
    api.overlay.getOverlayByToken,
    token ? { token } : 'skip'
  );

  const overlayConfig = useQuery(
    api.overlay.getOverlayConfigByToken,
    token ? { token } : 'skip'
  );

  const config = useMemo<OverlayConfig>(() => {
    return mergeWithDefaults(overlayConfig ?? DEFAULT_OVERLAY_CONFIG);
  }, [overlayConfig]);

  const activeChallenges = useMemo<ActiveChallenge[]>(() => {
    const source = overlayData?.challenges ?? [];
    return source.map((ch: {
      id: string;
      title: string;
      description?: string;
      given_by?: string;
      status: 'active' | 'completed' | 'paused' | 'cancelled';
      created_at: string;
      reward_amount?: string;
      sub_challenges?: Array<{
        id: string;
        title: string;
        description?: string;
        current_progress: number;
        target_limit: number;
        status: 'active' | 'completed' | 'paused';
      }>;
    }) => ({
      challenge: {
        id: ch.id,
        title: ch.title,
        description: ch.description,
        given_by: ch.given_by,
        reward_amount: (ch as { reward_amount?: string }).reward_amount,
        status: ch.status,
        created_at: ch.created_at,
      },
      subChallenges: (ch.sub_challenges || []).map((sub: {
        id: string;
        title: string;
        description?: string;
        current_progress: number;
        target_limit: number;
        status: 'active' | 'completed' | 'paused';
      }) => ({
        ...sub,
        challenge_id: ch.id,
      })),
      progress: ch.sub_challenges?.length
        ? (ch.sub_challenges.reduce((sum: number, sub: {
          current_progress: number;
          target_limit: number;
        }) => sum + (sub.current_progress / sub.target_limit), 0) / ch.sub_challenges.length) * 100
        : 0,
      timeLeft: new Date(ch.created_at).toLocaleDateString(),
    }));
  }, [overlayData]);

  const loading = token ? overlayData === undefined || overlayConfig === undefined : false;
  const error = token && overlayData === null ? 'Invalid or expired overlay token' : null;
  const challengeShapeKey = useMemo(
    () => activeChallenges.map((c) => `${c.challenge.id}:${Math.max(1, c.subChallenges.length)}`).join('|'),
    [activeChallenges]
  );

  useEffect(() => {
    activeChallengesRef.current = activeChallenges;
  }, [activeChallenges]);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    activeSubIndexRef.current = activeSubIndex;
  }, [activeSubIndex]);

  // Rotation interval is for sub-challenge steps.
  // Challenge transition animates only after all sub-challenges are cycled.
  useEffect(() => {
    if (!config?.animations.enabled || activeChallenges.length === 0) return;

    const transitionDuration = Math.max(0, config.animations.duration || 500);
    const rotationInterval = config.animations.rotationInterval;

    let switchTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let revealTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const interval = setInterval(() => {
      if (isTransitioningRef.current) return;

      const challenges = activeChallengesRef.current;
      const challengeCount = challenges.length;
      if (challengeCount === 0) return;

      const safeChallengeIndex = activeIndexRef.current % challengeCount;
      const currentChallenge = challenges[safeChallengeIndex];
      const subCount = Math.max(1, currentChallenge?.subChallenges.length ?? 0);
      const safeSubIndex = activeSubIndexRef.current % subCount;
      const hasMoreSubsInCurrentChallenge = safeSubIndex < subCount - 1;

      // Sub-challenge step: no transition animation.
      if (hasMoreSubsInCurrentChallenge) {
        const nextSubIndex = safeSubIndex + 1;
        activeSubIndexRef.current = nextSubIndex;
        setActiveSubIndex(nextSubIndex);
        return;
      }

      // If there's only one challenge, loop sub-challenges without animation.
      if (challengeCount <= 1) {
        activeSubIndexRef.current = 0;
        setActiveSubIndex(0);
        return;
      }

      // Challenge step: animate transition.
      isTransitioningRef.current = true;
      setFade(false);
      switchTimeoutId = setTimeout(() => {
        const nextChallengeIndex = (safeChallengeIndex + 1) % challengeCount;
        activeIndexRef.current = nextChallengeIndex;
        activeSubIndexRef.current = 0;
        setActiveIndex(nextChallengeIndex);
        setActiveSubIndex(0);

        revealTimeoutId = setTimeout(() => {
          setFade(true);
          isTransitioningRef.current = false;
        }, 40);
      }, transitionDuration);
    }, rotationInterval);

    return () => {
      clearInterval(interval);
      if (switchTimeoutId) clearTimeout(switchTimeoutId);
      if (revealTimeoutId) clearTimeout(revealTimeoutId);
      isTransitioningRef.current = false;
    };
  }, [
    activeChallenges.length,
    challengeShapeKey,
    config?.animations.enabled,
    config?.animations.rotationInterval,
    config?.animations.duration,
  ]);

  const animationClass = useMemo(() => {
    if (!config?.animations.enabled) return '';
    return getEntranceClass(config.animations.entranceType || 'slide-left', fade);
  }, [fade, config?.animations.enabled, config?.animations.entranceType]);

  const safeActiveIndex = activeChallenges.length > 0
    ? activeIndex % activeChallenges.length
    : 0;

  const safeSubCount = Math.max(1, activeChallenges[safeActiveIndex]?.subChallenges.length ?? 0);
  const safeActiveSubIndex = activeSubIndex % safeSubCount;

  // Loading state
  if (loading) {
    return <div className="w-full h-screen" style={{ backgroundColor: config.colors.background }} />;
  }

  // Error state
  if (error) {
    return (
      <div className="w-full h-screen" style={{ backgroundColor: config.colors.background }}>
        <div style={{ ...getPositionStyles(config.layout.position), width: config.layout.width, padding: config.layout.padding }}>
          <div className="border p-4 text-center" style={{ backgroundColor: config.colors.cardBackground, borderColor: config.colors.border, borderRadius: config.layout.borderRadius }}>
            <Target className="w-8 h-8 mx-auto mb-2" style={{ color: config.colors.iconPrimary }} />
            <p className="text-xs font-mono" style={{ color: config.colors.dateText }}>OVERLAY_ERROR</p>
            <p className="text-[10px] font-mono mt-1" style={{ color: config.colors.dateText }}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // No active challenges
  if (activeChallenges.length === 0) {
    return <div className="w-full h-screen" style={{ backgroundColor: config.colors.background }} />;
  }

  // Render the theme
  const activeChallenge = activeChallenges[safeActiveIndex];
  const currentSubChallenge =
    activeChallenge.subChallenges.length > 0
      ? activeChallenge.subChallenges[safeActiveSubIndex % activeChallenge.subChallenges.length]
      : undefined;

  const currentSubProgress = currentSubChallenge
    ? currentSubChallenge.target_limit > 0
      ? Math.min(100, Math.max(0, (currentSubChallenge.current_progress / currentSubChallenge.target_limit) * 100))
      : 0
    : activeChallenge.progress;

  const challenge = {
    ...activeChallenge,
    subChallenges: currentSubChallenge ? [currentSubChallenge] : [],
    progress: currentSubProgress,
    challenge: {
      ...activeChallenge.challenge,
      title: config.display.showChallengeTitle === false ? '' : activeChallenge.challenge.title,
      reward_amount:
        config.display.showReward === false
          ? undefined
          : activeChallenge.challenge.reward_amount,
    },
  };
  const positionStyles = getPositionStyles(config.layout.position);

  return (
    <div className="w-full h-screen" style={{ backgroundColor: config.colors.background }}>
      <div
        style={{
          ...positionStyles,
          width: config.layout.width,
          padding: config.layout.padding,
          opacity: config.layout.opacity / 100,
        }}
      >
        <div
          className={`transition-all ${animationClass}`}
          style={{
            transitionDuration: `${Math.max(0, config.animations.duration || 500)}ms`,
            willChange: 'opacity, transform',
          }}
        >
          {createElement(getThemeRenderer(config.theme), {
            challenge,
            config,
            fade: !fade,
          })}
        </div>
      </div>
    </div>
  );
}
