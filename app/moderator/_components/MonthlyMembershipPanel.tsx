'use client';

import { LoaderCircle, Minus, Plus, Users, Target } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

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

const formatMonthKey = (monthKey: string): string => {
  const [year, month] = monthKey.split('-').map((value) => Number.parseInt(value, 10));
  if (!year || !month) return monthKey;
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

export default function MonthlyMembershipPanel() {
  const [streamerId, setStreamerId] = useState<Id<'streamers'> | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [stepAmount, setStepAmount] = useState('1');
  const [targetInput, setTargetInput] = useState('0');
  const [isUpdatingCount, setIsUpdatingCount] = useState(false);
  const [isUpdatingTarget, setIsUpdatingTarget] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const updateMembershipMutation = useMutation(api.memberships.updateMonthlyMembership);

  useEffect(() => {
    const session = getModeratorSession();
    setStreamerId(session.streamerId as Id<'streamers'> | null);
    setSessionToken(session.sessionToken);
    setSessionChecked(true);
  }, []);

  const membership = useQuery(
    api.memberships.getCurrentMembershipByStreamer,
    streamerId ? { streamerId } : 'skip'
  );

  useEffect(() => {
    if (membership?.targetCount !== undefined) {
      setTargetInput(String(membership.targetCount));
    }
  }, [membership?.targetCount]);

  useEffect(() => {
    if (!feedback) return;

    const timeoutId = window.setTimeout(() => setFeedback(null), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  const normalizedStepAmount = useMemo(() => {
    const parsed = Number.parseInt(stepAmount, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }, [stepAmount]);

  const normalizedTarget = useMemo(() => {
    const parsed = Number.parseInt(targetInput, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }, [targetInput]);

  const progressPercentage = useMemo(() => {
    if (!membership || membership.targetCount <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((membership.currentCount / membership.targetCount) * 100)));
  }, [membership]);

  const handleAdjustCount = async (direction: -1 | 1) => {
    if (!streamerId || !sessionToken || !membership || isUpdatingCount) return;

    setIsUpdatingCount(true);
    setFeedback(null);

    try {
      const result = await updateMembershipMutation({
        sessionToken,
        streamerId,
        countDelta: direction * normalizedStepAmount,
      });

      setFeedback({
        type: 'success',
        message: `Count updated: ${result.currentCount}`,
      });
    } catch (error) {
      console.error('Failed to update membership count:', error);
      setFeedback({ type: 'error', message: 'Unable to update count right now.' });
    } finally {
      setIsUpdatingCount(false);
    }
  };

  const handleSaveTarget = async () => {
    if (!streamerId || !sessionToken || isUpdatingTarget) return;

    setIsUpdatingTarget(true);
    setFeedback(null);

    try {
      const result = await updateMembershipMutation({
        sessionToken,
        streamerId,
        targetCount: normalizedTarget,
      });

      setFeedback({
        type: 'success',
        message: `Target saved: ${result.targetCount}`,
      });
    } catch (error) {
      console.error('Failed to update membership target:', error);
      setFeedback({ type: 'error', message: 'Unable to update target right now.' });
    } finally {
      setIsUpdatingTarget(false);
    }
  };

  const isLoading = !sessionChecked || (Boolean(streamerId) && membership === undefined);

  return (
    <div className="border border-gunmetal bg-armor p-5 md:p-6 shadow-2xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-gunmetal pb-4">
        <div>
          <div className="inline-flex items-center gap-2 border border-tactical/30 bg-tactical/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-tactical">
            <Users size={12} />
            Membership Counter
          </div>
          <p className="mt-2 text-xs text-dimmed">
            Monthly membership progress. Counter automatically resets to 0 at the start of each month.
          </p>
        </div>

        {membership && (
          <div className="border border-gunmetal bg-void px-3 py-2 text-right">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-dimmed">Cycle</div>
            <div className="text-sm font-black italic text-hud">{formatMonthKey(membership.monthKey)}</div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex min-h-36 items-center justify-center gap-3 text-sm font-bold text-dimmed">
          <LoaderCircle size={18} className="animate-spin" />
          Loading membership data...
        </div>
      ) : !sessionToken || !streamerId ? (
        <div className="border border-hostile/30 bg-hostile/5 px-4 py-5 text-sm text-hostile">
          Moderator session unavailable. Please sign in again to update membership data.
        </div>
      ) : !membership ? (
        <div className="border border-gunmetal bg-void px-4 py-5 text-sm text-dimmed">
          No membership data found yet.
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border border-gunmetal bg-void p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-dimmed">Current Count</div>
              <div className="mt-2 text-3xl font-black italic text-hud">{membership.currentCount}</div>
            </div>
            <div className="border border-gunmetal bg-void p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-dimmed">Monthly Target</div>
              <div className="mt-2 text-3xl font-black italic text-hud">{membership.targetCount}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-dimmed">
              <span>Progress</span>
              <span className="text-tactical">{progressPercentage}%</span>
            </div>
            <div className="h-4 overflow-hidden border border-gunmetal bg-void">
              <div
                className="h-full bg-gradient-to-r from-tactical via-terminal to-tactical transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_180px_1fr] md:items-end">
            <button
              onClick={() => handleAdjustCount(-1)}
              disabled={isUpdatingCount || membership.currentCount <= 0}
              className="flex h-16 items-center justify-center gap-3 border border-gunmetal bg-armor text-lg font-black text-hud transition-all hover:border-tactical hover:text-tactical disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUpdatingCount ? <LoaderCircle size={20} className="animate-spin" /> : <Minus size={20} />}
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
              onClick={() => handleAdjustCount(1)}
              disabled={isUpdatingCount}
              className="flex h-16 items-center justify-center gap-3 border border-gunmetal bg-armor text-lg font-black text-hud transition-all hover:border-tactical hover:text-tactical disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUpdatingCount ? <LoaderCircle size={20} className="animate-spin" /> : <Plus size={20} />}
              <span>INCREMENT</span>
            </button>
          </div>

          <div className="border border-gunmetal bg-void p-4">
            <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-dimmed">
              <Target size={12} />
              Update Monthly Target
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={targetInput}
                onChange={(event) => setTargetInput(event.target.value)}
                onBlur={() => setTargetInput(String(normalizedTarget))}
                className="h-12 w-full border border-gunmetal bg-armor px-4 text-lg font-black italic text-hud outline-none transition-colors focus:border-tactical"
              />
              <button
                onClick={handleSaveTarget}
                disabled={isUpdatingTarget}
                className="btn-tactical h-12 px-6 text-[10px] uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUpdatingTarget ? 'SAVING...' : 'SAVE_TARGET'}
              </button>
            </div>
          </div>

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
      )}
    </div>
  );
}
