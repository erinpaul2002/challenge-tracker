import { useMemo } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuthStore } from '@/stores/authStore';
import { StreamerProfile, OverlayConfig, ActiveChallenge } from '../types';

export function useOverlayData() {
  const { user, profile: authProfile, hydrated } = useAuthStore();
  const streamerEmail = user?.email ?? authProfile?.email;

  const streamer = useQuery(
    api.auth.getStreamerByEmail,
    streamerEmail ? { email: streamerEmail } : 'skip'
  );

  const profileData = useQuery(
    api.profile.getProfile,
    streamer?._id ? { streamerId: streamer._id } : 'skip'
  );

  const configData = useQuery(
    api.overlay.getOverlayConfig,
    streamer?._id ? { streamerId: streamer._id } : 'skip'
  );

  const challengesData = useQuery(
    api.challenges.getChallengesWithSubsByStreamer,
    streamer?._id ? { streamerId: streamer._id } : 'skip'
  );

  const regenerateOverlayToken = useMutation(api.overlay.regenerateOverlayToken);

  const profile = useMemo<StreamerProfile | null>(() => {
    if (!streamer) return null;

    return {
      id: streamer._id,
      username: profileData?.name ?? streamer.email,
      overlay_token: profileData?.overlayToken ?? streamer.overlayToken,
    };
  }, [profileData?.name, profileData?.overlayToken, streamer]);

  const config = useMemo<OverlayConfig | null>(() => {
    return (configData as OverlayConfig | null | undefined) ?? null;
  }, [configData]);

  const activeChallenges = useMemo<ActiveChallenge[]>(() => {
    const source = challengesData ?? [];

    return source.map((challenge: {
      _id: string;
      title: string;
      description?: string;
      givenBy?: string;
      rewardAmount?: string;
      status: 'active' | 'completed' | 'paused' | 'cancelled';
      _creationTime: number;
      subChallenges: Array<{
        _id: string;
        challengeId: string;
        title: string;
        description?: string;
        currentProgress: number;
        targetLimit: number;
        status: 'active' | 'completed' | 'paused';
      }>;
    }) => {
      const subChallenges = challenge.subChallenges.map((subChallenge: {
        _id: string;
        challengeId: string;
        title: string;
        description?: string;
        currentProgress: number;
        targetLimit: number;
        status: 'active' | 'completed' | 'paused';
      }) => ({
        id: subChallenge._id,
        challenge_id: subChallenge.challengeId,
        title: subChallenge.title,
        description: subChallenge.description,
        current_progress: subChallenge.currentProgress,
        target_limit: subChallenge.targetLimit,
        status: subChallenge.status,
      }));

      const progress = subChallenges.length > 0
        ? (subChallenges.reduce((sum, sub) => sum + (sub.current_progress / sub.target_limit), 0) / subChallenges.length) * 100
        : 0;

      return {
        challenge: {
          id: challenge._id,
          title: challenge.title,
          description: challenge.description,
          given_by: challenge.givenBy,
          reward_amount: challenge.rewardAmount,
          status: challenge.status,
          created_at: new Date(challenge._creationTime).toISOString(),
        },
        subChallenges,
        progress,
        timeLeft: new Date(challenge._creationTime).toLocaleDateString(),
      };
    });
  }, [challengesData]);

  const loading = !hydrated || (Boolean(streamerEmail) && (
    streamer === undefined ||
    profileData === undefined ||
    configData === undefined ||
    challengesData === undefined
  ));

  const generateOverlayToken = async () => {
    try {
      if (!streamer?._id) return;
      await regenerateOverlayToken({ streamerId: streamer._id });
    } catch (error) {
      console.error('Error generating token:', error);
    }
  };

  return {
    profile,
    loading,
    config,
    activeChallenges,
    streamerId: streamer?._id ?? null,
    generateOverlayToken,
  };
}