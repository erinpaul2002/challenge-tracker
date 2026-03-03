import { useState, useEffect, useMemo, useRef } from 'react';
import { ActiveChallenge, OverlayConfig, EntranceAnimation } from '../types';

function getEntranceClass(type: EntranceAnimation): string {
  const map: Record<EntranceAnimation, string> = {
    'slide-left': 'opacity-0 -translate-x-8',
    'slide-right': 'opacity-0 translate-x-8',
    'slide-up': 'opacity-0 translate-y-8',
    'fade': 'opacity-0',
    'scale': 'opacity-0 scale-75',
    'glitch': 'opacity-0 translate-x-1 -translate-y-1',
  };
  return map[type] || 'opacity-0';
}

export function useOverlayAnimation(
  activeChallenges: ActiveChallenge[],
  tempConfig: OverlayConfig | null
) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeSubIndex, setActiveSubIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [transitionDurationMs, setTransitionDurationMs] = useState(500);
  const activeChallengesRef = useRef<ActiveChallenge[]>([]);
  const activeIndexRef = useRef(0);
  const activeSubIndexRef = useRef(0);
  const isTransitioningRef = useRef(false);
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

  // Replay selected animation style in live preview whenever animation settings change.
  // This allows previewing animation even when only one challenge is active.
  useEffect(() => {
    if (!tempConfig?.animations.enabled || activeChallenges.length === 0) return;

    const duration = tempConfig.animations.duration || 500;
    let revealTimeout: ReturnType<typeof setTimeout> | null = null;

    const startTimeout = setTimeout(() => {
      // Reset instantly to the hidden pose for the selected animation style,
      // then animate into view with the configured duration.
      setTransitionDurationMs(0);
      setFade(false);

      revealTimeout = setTimeout(() => {
        setTransitionDurationMs(duration);
        setFade(true);
      }, 40);
    }, 0);

    return () => {
      clearTimeout(startTimeout);
      if (revealTimeout) clearTimeout(revealTimeout);
    };
  }, [
    tempConfig?.animations.enabled,
    tempConfig?.animations.entranceType,
    tempConfig?.animations.duration,
    tempConfig?.layout.position,
    activeChallenges.length,
  ]);

  useEffect(() => {
    if (!tempConfig?.animations.enabled || activeChallenges.length === 0) return;

    const duration = Math.max(0, tempConfig.animations.duration || 500);
    const rotationInterval = tempConfig.animations.rotationInterval;

    let switchTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let showTimeoutId: ReturnType<typeof setTimeout> | null = null;

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
      setTransitionDurationMs(duration);
      setFade(false);

      switchTimeoutId = setTimeout(() => {
        const nextChallengeIndex = (safeChallengeIndex + 1) % challengeCount;
        activeIndexRef.current = nextChallengeIndex;
        activeSubIndexRef.current = 0;
        setActiveIndex(nextChallengeIndex);
        setActiveSubIndex(0);

        showTimeoutId = setTimeout(() => {
          setFade(true);
          isTransitioningRef.current = false;
        }, 40);
      }, duration);
    }, rotationInterval);

    return () => {
      clearInterval(interval);
      if (switchTimeoutId) clearTimeout(switchTimeoutId);
      if (showTimeoutId) clearTimeout(showTimeoutId);
      isTransitioningRef.current = false;
    };
  }, [
    activeChallenges.length,
    challengeShapeKey,
    tempConfig?.animations.enabled,
    tempConfig?.animations.rotationInterval,
    tempConfig?.animations.duration,
  ]);

  const animationClass = useMemo(() => {
    if (!tempConfig?.animations.enabled) return '';
    if (fade) return 'opacity-100 translate-x-0 translate-y-0 scale-100';

    const entrance = tempConfig.animations.entranceType || 'slide-left';
    return getEntranceClass(entrance);
  }, [fade, tempConfig?.animations.enabled, tempConfig?.animations.entranceType]);

  const safeActiveIndex = activeChallenges.length > 0
    ? activeIndex % activeChallenges.length
    : 0;

  const currentSubCount = Math.max(1, activeChallenges[safeActiveIndex]?.subChallenges?.length ?? 0);
  const safeActiveSubIndex = activeSubIndex % currentSubCount;

  return {
    activeIndex: safeActiveIndex,
    activeSubIndex: safeActiveSubIndex,
    fade,
    animationClass,
    transitionDurationMs,
  };
}