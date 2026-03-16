'use client';

import { LoaderCircle, Minus, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

interface ChallengeOption {
  id: string;
  title: string;
  givenBy?: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  subChallenges: SubChallengeOption[];
}

interface SubChallengeOption {
  id: string;
  title: string;
  description?: string;
  currentProgress: number;
  targetLimit: number;
  status: 'active' | 'completed' | 'paused';
}

const getModeratorSession = () => {
  if (typeof window === 'undefined') {
    return { streamerId: null, sessionToken: null };
  }

  const rawSession = localStorage.getItem('moderator_session');
  const cookieToken = document.cookie
    .split('; ')
    .find((row) => row.startsWith('moderator_session='))
    ?.split('=')[1];

  if (!rawSession) {
    return {
      streamerId: null,
      sessionToken: cookieToken ? decodeURIComponent(cookieToken) : null,
    };
  }

  try {
    const parsed = JSON.parse(rawSession) as {
      streamer_id?: string;
      session_token?: string;
      sessionToken?: string;
    };

    return {
      streamerId: parsed.streamer_id ?? null,
      sessionToken:
        parsed.session_token ??
        parsed.sessionToken ??
        (cookieToken ? decodeURIComponent(cookieToken) : null),
    };
  } catch {
    return {
      streamerId: null,
      sessionToken: rawSession,
    };
  }
};

const getProgressPercentage = (currentProgress: number, targetLimit: number) => {
  if (targetLimit <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((currentProgress / targetLimit) * 100)));
};

export default function GlobalProgressUpdatePanel() {
  const [streamerId, setStreamerId] = useState<Id<'streamers'> | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [selectedChallengeId, setSelectedChallengeId] = useState('');
  const [selectedSubChallengeId, setSelectedSubChallengeId] = useState('');
  const [stepAmount, setStepAmount] = useState('1');
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const updateSubChallengeMutation = useMutation(api.challenges.updateSubChallenge);

  useEffect(() => {
    const session = getModeratorSession();
    setStreamerId(session.streamerId as Id<'streamers'> | null);
    setSessionToken(session.sessionToken);
    setSessionChecked(true);
  }, []);

  const rawChallenges = useQuery(
    api.challenges.getChallengesWithSubsByStreamer,
    streamerId ? { streamerId } : 'skip'
  );

  const challenges = useMemo<ChallengeOption[]>(() => {
    return (rawChallenges ?? []).map((challenge: {
      _id: string;
      title: string;
      givenBy?: string;
      status: 'active' | 'completed' | 'paused' | 'cancelled';
      subChallenges: Array<{
        _id: string;
        title: string;
        description?: string;
        currentProgress: number;
        targetLimit: number;
        status: 'active' | 'completed' | 'paused';
      }>;
    }) => ({
      id: challenge._id,
      title: challenge.title,
      givenBy: challenge.givenBy,
      status: challenge.status,
      subChallenges: challenge.subChallenges.map((subChallenge) => ({
        id: subChallenge._id,
        title: subChallenge.title,
        description: subChallenge.description,
        currentProgress: subChallenge.currentProgress,
        targetLimit: subChallenge.targetLimit,
        status: subChallenge.status,
      })),
    }));
  }, [rawChallenges]);

  const selectedChallenge = useMemo(
    () => challenges.find((challenge) => challenge.id === selectedChallengeId) ?? null,
    [challenges, selectedChallengeId]
  );

  const selectedSubChallenge = useMemo(
    () => selectedChallenge?.subChallenges.find((sub) => sub.id === selectedSubChallengeId) ?? null,
    [selectedChallenge, selectedSubChallengeId]
  );

  const normalizedStepAmount = useMemo(() => {
    const parsed = Number.parseInt(stepAmount, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }, [stepAmount]);

  useEffect(() => {
    if (challenges.length === 0) {
      setSelectedChallengeId('');
      return;
    }

    if (!selectedChallengeId || !challenges.some((challenge) => challenge.id === selectedChallengeId)) {
      setSelectedChallengeId(challenges[0].id);
    }
  }, [challenges, selectedChallengeId]);

  useEffect(() => {
    if (!selectedChallenge || selectedChallenge.subChallenges.length === 0) {
      setSelectedSubChallengeId('');
      return;
    }

    if (
      !selectedSubChallengeId ||
      !selectedChallenge.subChallenges.some((subChallenge) => subChallenge.id === selectedSubChallengeId)
    ) {
      setSelectedSubChallengeId(selectedChallenge.subChallenges[0].id);
    }
  }, [selectedChallenge, selectedSubChallengeId]);

  useEffect(() => {
    if (!feedback) return;

    const timeoutId = window.setTimeout(() => setFeedback(null), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  const handleAdjustProgress = async (direction: -1 | 1) => {
    if (!selectedSubChallenge || !sessionToken || isUpdating) return;

    const nextProgress = Math.max(
      0,
      Math.min(
        selectedSubChallenge.targetLimit,
        selectedSubChallenge.currentProgress + direction * normalizedStepAmount
      )
    );

    if (nextProgress === selectedSubChallenge.currentProgress) {
      return;
    }

    setIsUpdating(true);
    setFeedback(null);

    try {
      await updateSubChallengeMutation({
        sessionToken,
        subChallengeId: selectedSubChallenge.id as Id<'subChallenges'>,
        currentProgress: nextProgress,
        status: nextProgress >= selectedSubChallenge.targetLimit ? 'completed' : 'active',
      });

      setFeedback({
        type: 'success',
        message: `Updated to ${nextProgress}/${selectedSubChallenge.targetLimit}`,
      });
    } catch (error) {
      console.error('Failed to update moderator progress:', error);
      setFeedback({
        type: 'error',
        message: 'Unable to update progress right now.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const progressPercentage = selectedSubChallenge
    ? getProgressPercentage(selectedSubChallenge.currentProgress, selectedSubChallenge.targetLimit)
    : 0;

  const isLoading = !sessionChecked || (Boolean(streamerId) && rawChallenges === undefined);

  return (
    <div className="space-y-6">
      <div className="border border-gunmetal bg-armor p-5 md:p-6 shadow-2xl">

        <div className="space-y-6 pt-5">
          {isLoading ? (
            <div className="flex min-h-64 items-center justify-center gap-3 text-sm font-bold text-dimmed">
              <LoaderCircle size={18} className="animate-spin" />
              Loading challenge feed...
            </div>
          ) : !sessionToken || !streamerId ? (
            <div className="border border-hostile/30 bg-hostile/5 px-4 py-5 text-sm text-hostile">
              Moderator session unavailable. Please sign in again to update challenge progress.
            </div>
          ) : challenges.length === 0 ? (
            <div className="border border-gunmetal bg-void px-4 py-5 text-sm text-dimmed">
              No challenges found for this moderator session yet.
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.22em] text-dimmed">
                    Challenge
                  </label>
                  <select
                    value={selectedChallengeId}
                    onChange={(event) => setSelectedChallengeId(event.target.value)}
                    className="w-full border border-gunmetal bg-void px-4 py-3 text-sm font-bold text-hud outline-none transition-colors focus:border-tactical"
                  >
                    {challenges.map((challenge) => (
                      <option key={challenge.id} value={challenge.id}>
                        {challenge.givenBy ? `${challenge.title} [${challenge.givenBy}]` : challenge.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.22em] text-dimmed">
                    Objective
                  </label>
                  <select
                    value={selectedSubChallengeId}
                    onChange={(event) => setSelectedSubChallengeId(event.target.value)}
                    disabled={!selectedChallenge || selectedChallenge.subChallenges.length === 0}
                    className="w-full border border-gunmetal bg-void px-4 py-3 text-sm font-bold text-hud outline-none transition-colors focus:border-tactical disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {(selectedChallenge?.subChallenges ?? []).map((subChallenge) => (
                      <option key={subChallenge.id} value={subChallenge.id}>
                        {subChallenge.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedSubChallenge ? (
                <div className="space-y-5 border border-gunmetal bg-void p-5 md:p-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-tactical">
                        {selectedChallenge?.title}
                      </div>
                      <h4 className="mt-2 text-xl font-black italic tracking-tight text-hud">
                        {selectedSubChallenge.title}
                      </h4>
                      {selectedSubChallenge.description && (
                        <p className="mt-2 max-w-2xl text-sm text-dimmed">
                          {selectedSubChallenge.description}
                        </p>
                      )}
                    </div>

                    <div className="min-w-[132px] border border-gunmetal bg-armor px-4 py-3 text-center">
                      <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-dimmed">Count</div>
                      <div className="mt-1 text-2xl font-black italic text-hud">
                        {selectedSubChallenge.currentProgress}
                        <span className="ml-1 text-sm text-dimmed">/ {selectedSubChallenge.targetLimit}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.22em] text-dimmed">
                      <span>Progress</span>
                      <span className="text-tactical">{progressPercentage}%</span>
                    </div>
                    <div className="h-4 overflow-hidden border border-gunmetal bg-armor">
                      <div
                        className="h-full bg-gradient-to-r from-tactical via-terminal to-tactical transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-[1fr_180px_1fr] md:items-end">
                    <button
                      onClick={() => handleAdjustProgress(-1)}
                      disabled={isUpdating || selectedSubChallenge.currentProgress <= 0}
                      className="flex h-16 items-center justify-center gap-3 border border-gunmetal bg-armor text-lg font-black text-hud transition-all hover:border-tactical hover:text-tactical disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isUpdating ? <LoaderCircle size={20} className="animate-spin" /> : <Minus size={20} />}
                      <span>DECREMENT</span>
                    </button>

                    <div className="space-y-2 text-center">
                      <label className="block text-[10px] font-bold uppercase tracking-[0.22em] text-dimmed">
                        Step amount
                      </label>
                      <input
                        type="number"
                        min="1"
                        inputMode="numeric"
                        value={stepAmount}
                        onChange={(event) => setStepAmount(event.target.value)}
                        onBlur={() => setStepAmount(String(normalizedStepAmount))}
                        className="h-16 w-full border border-tactical bg-void px-4 text-center text-2xl font-black italic text-hud outline-none transition-colors focus:border-terminal"
                      />
                    </div>

                    <button
                      onClick={() => handleAdjustProgress(1)}
                      disabled={isUpdating || selectedSubChallenge.currentProgress >= selectedSubChallenge.targetLimit}
                      className="flex h-16 items-center justify-center gap-3 border border-gunmetal bg-armor text-lg font-black text-hud transition-all hover:border-tactical hover:text-tactical disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isUpdating ? <LoaderCircle size={20} className="animate-spin" /> : <Plus size={20} />}
                      <span>INCREMENT</span>
                    </button>
                  </div>

                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <p className="text-xs text-dimmed">
                      Each tap updates the count by <span className="font-bold text-hud">{normalizedStepAmount}</span>.
                    </p>

                    {feedback && (
                      <div
                        className={`border px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] ${
                          feedback.type === 'success'
                            ? 'border-terminal/40 bg-terminal/10 text-terminal'
                            : 'border-hostile/40 bg-hostile/10 text-hostile'
                        }`}
                      >
                        {feedback.message}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border border-gunmetal bg-void px-4 py-5 text-sm text-dimmed">
                  This challenge does not have any objectives yet.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}