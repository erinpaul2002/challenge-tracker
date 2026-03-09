'use client';

import { useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import {
  Activity,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Target,
  Trophy,
} from 'lucide-react';
import { api } from '@/convex/_generated/api';
import { useAuthStore } from '@/stores/authStore';

type ChallengeStatus = 'active' | 'completed' | 'paused' | 'cancelled';
type SubChallengeStatus = 'active' | 'completed' | 'paused';

type ScoreboardSubChallenge = {
  id: string;
  title: string;
  description?: string;
  currentProgress: number;
  targetLimit: number;
  status: SubChallengeStatus;
};

type ScoreboardChallenge = {
  id: string;
  title: string;
  description?: string;
  status: ChallengeStatus;
  progress: number;
  currentCount: number;
  targetCount: number;
  completedSubChallenges: number;
  totalSubChallenges: number;
  subChallenges: ScoreboardSubChallenge[];
};

const getProgressPercentage = (current: number, target: number) => {
  if (target <= 0) return 0;
  return Math.min(100, Math.max(0, (current / target) * 100));
};

const challengeStatusStyles: Record<ChallengeStatus, string> = {
  active: 'text-tactical border-tactical/40 bg-tactical/10',
  completed: 'text-terminal border-terminal/40 bg-terminal/10',
  paused: 'text-optic border-optic/40 bg-optic/10',
  cancelled: 'text-hostile border-hostile/40 bg-hostile/10',
};

const progressFillStyles: Record<ChallengeStatus | SubChallengeStatus, string> = {
  active: 'from-tactical via-orange to-tactical',
  completed: 'from-terminal via-optic to-terminal',
  paused: 'from-optic via-white/70 to-optic',
  cancelled: 'from-hostile via-orange to-hostile',
};

export default function ScoreboardPage() {
  const { user, profile, hydrated } = useAuthStore();
  const [expandedChallengeIds, setExpandedChallengeIds] = useState<string[]>([]);

  const streamerEmail = user?.email ?? profile?.email;
  const streamer = useQuery(
    api.auth.getStreamerByEmail,
    streamerEmail ? { email: streamerEmail } : 'skip'
  );

  const rawChallenges = useQuery(
    api.challenges.getChallengesWithSubsByStreamer,
    streamer?._id ? { streamerId: streamer._id } : 'skip'
  );

  const challenges = useMemo<ScoreboardChallenge[]>(() => {
    return (rawChallenges ?? []).map((challenge: {
      _id: string;
      title: string;
      description?: string;
      status: ChallengeStatus;
      subChallenges?: Array<{
        _id: string;
        title: string;
        description?: string;
        currentProgress: number;
        targetLimit: number;
        status: SubChallengeStatus;
      }>;
    }) => {
      const subChallenges: ScoreboardSubChallenge[] = (challenge.subChallenges ?? []).map((sub) => ({
        id: sub._id,
        title: sub.title,
        description: sub.description,
        currentProgress: sub.currentProgress,
        targetLimit: sub.targetLimit,
        status: sub.status,
      }));

      const currentCount = subChallenges.reduce((sum, sub) => sum + sub.currentProgress, 0);
      const targetCount = subChallenges.reduce((sum, sub) => sum + sub.targetLimit, 0);
      const completedSubChallenges = subChallenges.filter(
        (sub) => sub.status === 'completed' || sub.currentProgress >= sub.targetLimit
      ).length;
      const totalSubChallenges = subChallenges.length;
      const progress = totalSubChallenges > 0
        ? Math.round(
            subChallenges.reduce(
              (sum, sub) => sum + getProgressPercentage(sub.currentProgress, sub.targetLimit),
              0
            ) / totalSubChallenges
          )
        : challenge.status === 'completed'
          ? 100
          : 0;

      return {
        id: challenge._id,
        title: challenge.title,
        description: challenge.description,
        status: challenge.status,
        progress,
        currentCount,
        targetCount,
        completedSubChallenges,
        totalSubChallenges,
        subChallenges,
      };
    });
  }, [rawChallenges]);

  const loading = !hydrated || (Boolean(streamerEmail) && (streamer === undefined || rawChallenges === undefined));
  const error = !hydrated
    ? null
    : !streamerEmail
      ? 'Unable to resolve logged-in streamer account'
      : streamer === null
        ? 'Streamer profile not found in Convex'
        : null;

  const summary = useMemo(() => {
    const totalChallenges = challenges.length;
    const activeChallenges = challenges.filter((challenge) => challenge.status === 'active').length;
    const totalObjectives = challenges.reduce((sum, challenge) => sum + challenge.totalSubChallenges, 0);
    const averageProgress = totalChallenges > 0
      ? Math.round(challenges.reduce((sum, challenge) => sum + challenge.progress, 0) / totalChallenges)
      : 0;

    return {
      totalChallenges,
      activeChallenges,
      totalObjectives,
      averageProgress,
    };
  }, [challenges]);

  const toggleExpanded = (challengeId: string) => {
    setExpandedChallengeIds((current) =>
      current.includes(challengeId)
        ? current.filter((id) => id !== challengeId)
        : [...current, challengeId]
    );
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="border-b border-gunmetal pb-6">
          <h1 className="text-3xl font-black italic tracking-tighter">SCOREBOARD</h1>
          <p className="text-dimmed text-xs font-mono tracking-widest mt-1">SYNCING_PROGRESS_DATA...</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-armor border border-gunmetal p-3 sm:p-4 animate-pulse">
              <div className="h-3 bg-gunmetal rounded mb-3"></div>
              <div className="h-7 bg-gunmetal rounded mb-2"></div>
              <div className="h-3 bg-gunmetal rounded"></div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-armor border border-gunmetal p-4 animate-pulse">
              <div className="h-4 bg-gunmetal rounded mb-3"></div>
              <div className="h-3 bg-gunmetal rounded mb-3"></div>
              <div className="h-3 bg-gunmetal rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="border-b border-gunmetal pb-6">
          <h1 className="text-3xl font-black italic tracking-tighter">SCOREBOARD</h1>
          <p className="text-dimmed text-xs font-mono tracking-widest mt-1">ERROR_LOADING_PROGRESS</p>
        </div>

        <div className="bg-hostile/5 border border-hostile/30 p-6 tactical-border">
          <p className="text-hostile font-mono text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-3 border-b border-gunmetal pb-4">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter">SCOREBOARD</h1>
          <p className="text-dimmed text-xs font-mono tracking-widest mt-1">
            ALL_CHALLENGES_IN_ONE_TACTICAL_VIEW
          </p>
        </div>

        <div className="bg-armor border border-gunmetal px-3 py-2">
          <div className="text-[8px] font-mono tracking-[0.16em] text-dimmed uppercase">Expanded Cards</div>
          <div className="text-lg font-black italic tracking-tight text-hud mt-0.5 leading-none">
            {expandedChallengeIds.length.toString().padStart(2, '0')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          {
            label: 'TOTAL_CHALLENGES',
            value: summary.totalChallenges.toString().padStart(2, '0'),
            icon: Trophy,
            color: 'text-tactical',
          },
          {
            label: 'ACTIVE_BOARDS',
            value: summary.activeChallenges.toString().padStart(2, '0'),
            icon: Activity,
            color: 'text-terminal',
          },
          {
            label: 'SUB_OBJECTIVES',
            value: summary.totalObjectives.toString().padStart(2, '0'),
            icon: Target,
            color: 'text-optic',
          },
          {
            label: 'AVG_PROGRESS',
            value: `${summary.averageProgress}%`,
            icon: BarChart3,
            color: 'text-orange',
          },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-armor border border-gunmetal p-2 sm:p-2.5 relative overflow-hidden min-h-[72px]"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 84%, 92% 100%, 0 100%)' }}
          >
            <div className="flex items-start justify-between mb-1.5">
              <div className={`p-1 bg-void border border-gunmetal ${item.color}`}>
                <item.icon size={12} />
              </div>
              <div className="text-[7px] font-mono uppercase tracking-[0.12em] text-dimmed">Live</div>
            </div>
            <div className="text-lg sm:text-xl leading-none font-black italic tracking-tighter">{item.value}</div>
            <div className="text-[7px] sm:text-[8px] font-bold text-dimmed tracking-[0.12em] uppercase mt-0.5 line-clamp-1">
              {item.label}
            </div>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-tactical to-transparent opacity-60"></div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="hidden lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(140px,0.8fr)_104px_52px] gap-2 px-2 text-[8px] font-mono tracking-[0.14em] text-dimmed uppercase">
          <span>Challenge</span>
          <span>Progress</span>
          <span>Count</span>
          <span>More</span>
        </div>

        {challenges.length === 0 ? (
          <div className="bg-armor border border-dashed border-gunmetal p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border border-gunmetal bg-void text-tactical">
              <BarChart3 size={24} />
            </div>
            <h2 className="text-xl font-black italic tracking-tight">NO_SCOREBOARD_DATA</h2>
            <p className="mt-2 text-sm text-dimmed max-w-xl mx-auto">
              Create a challenge to populate the scoreboard. Once progress starts rolling in, this page becomes your all-in-one mission control.
            </p>
          </div>
        ) : (
          challenges.map((challenge) => {
            const isExpanded = expandedChallengeIds.includes(challenge.id);
            const countLabel = challenge.totalSubChallenges > 0
              ? `${challenge.completedSubChallenges}/${challenge.totalSubChallenges} `
              : `${challenge.currentCount}/${challenge.targetCount}`;

            return (
              <div
                key={challenge.id}
                className="bg-armor border border-gunmetal overflow-hidden transition-colors hover:border-tactical/60"
              >
                <button
                  type="button"
                  onClick={() => toggleExpanded(challenge.id)}
                  className="w-full text-left p-2 md:p-2.5"
                  aria-expanded={isExpanded}
                >
                  <div className="flex flex-col md:grid md:grid-cols-[minmax(0,1.55fr)_minmax(130px,0.75fr)] lg:grid-cols-[minmax(0,2fr)_minmax(140px,0.8fr)_104px_52px] gap-2 md:gap-2.5 items-start md:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1 mb-1">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 border text-[7px] sm:text-[8px] font-mono tracking-[0.12em] uppercase ${challengeStatusStyles[challenge.status]}`}>
                          <span className="h-1 w-1 rounded-full bg-current"></span>
                          {challenge.status}
                        </span>
                        <span className="text-[7px] sm:text-[8px] font-mono tracking-[0.12em] text-dimmed uppercase">
                          {challenge.totalSubChallenges.toString().padStart(2, '0')} sub-goals
                        </span>
                      </div>

                      <h2 className="text-sm md:text-base font-black italic tracking-tight text-hud truncate leading-tight">
                        {challenge.title}
                      </h2>

                      {challenge.description && (
                        <p className="mt-0.5 text-[10px] text-dimmed line-clamp-1 max-w-3xl hidden xl:block">
                          {challenge.description}
                        </p>
                      )}
                    </div>

                    <div className="w-full">
                      <div className="mb-0.5 flex items-center justify-between text-[7px] sm:text-[8px] font-mono tracking-[0.12em] uppercase text-dimmed">
                        <span>Completion</span>
                        <span className="text-hud">{challenge.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-void border border-gunmetal overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${progressFillStyles[challenge.status]} transition-all duration-500`}
                          style={{ width: `${challenge.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="w-full md:w-auto">
                      <div className="bg-void border border-gunmetal px-2 py-1.5 md:min-w-[104px]">
                        <div className="text-[7px] sm:text-[8px] font-mono tracking-[0.12em] text-dimmed uppercase">Count</div>
                        <div className="mt-0.5 text-[11px] sm:text-xs font-black italic tracking-tight text-hud leading-tight line-clamp-1">{countLabel}</div>
                        <div className="mt-0.5 text-[7px] sm:text-[8px] font-mono text-dimmed uppercase tracking-[0.1em] hidden lg:block">
                          Total {challenge.currentCount}/{challenge.targetCount}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end w-full md:w-auto">
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-chakra font-bold tracking-[0.1em] text-tactical uppercase">
                        Subs
                        {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                      </span>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gunmetal bg-void/40 px-2 md:px-2.5 py-2">
                    {challenge.subChallenges.length > 0 ? (
                      <div className="space-y-1.5">
                        {challenge.subChallenges.map((subChallenge) => {
                          const subProgress = Math.round(
                            getProgressPercentage(subChallenge.currentProgress, subChallenge.targetLimit)
                          );

                          return (
                            <div
                              key={subChallenge.id}
                              className="bg-armor border border-gunmetal p-2 grid grid-cols-1 md:grid-cols-[minmax(0,1.45fr)_minmax(130px,0.8fr)] lg:grid-cols-[minmax(0,1.9fr)_minmax(140px,0.8fr)_90px] gap-2 items-center"
                            >
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1 mb-0.5">
                                  <span className="text-[7px] sm:text-[8px] font-mono tracking-[0.12em] uppercase text-dimmed">Sub</span>
                                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 border text-[7px] sm:text-[8px] font-mono tracking-[0.1em] uppercase ${challengeStatusStyles[subChallenge.status]}`}>
                                    <span className="h-1 w-1 rounded-full bg-current"></span>
                                    {subChallenge.status}
                                  </span>
                                </div>
                                <h3 className="text-[11px] sm:text-xs md:text-sm font-black italic tracking-tight truncate leading-tight">
                                  {subChallenge.title}
                                </h3>
                                {subChallenge.description && (
                                  <p className="mt-0.5 text-[10px] text-dimmed line-clamp-1 hidden xl:block">{subChallenge.description}</p>
                                )}
                              </div>

                              <div className="w-full">
                                <div className="mb-0.5 flex items-center justify-between text-[7px] sm:text-[8px] font-mono tracking-[0.1em] uppercase text-dimmed">
                                  <span>Progress</span>
                                  <span className="text-hud">{subProgress}%</span>
                                </div>
                                <div className="h-1 bg-void border border-gunmetal overflow-hidden">
                                  <div
                                    className={`h-full bg-gradient-to-r ${progressFillStyles[subChallenge.status]} transition-all duration-500`}
                                    style={{ width: `${subProgress}%` }}
                                  />
                                </div>
                              </div>

                              <div className="bg-void border border-gunmetal px-2 py-1.5">
                                <div className="text-[7px] sm:text-[8px] font-mono tracking-[0.12em] text-dimmed uppercase">Count</div>
                                <div className="mt-0.5 text-[11px] sm:text-xs font-black italic tracking-tight text-hud leading-tight">
                                  {subChallenge.currentProgress}/{subChallenge.targetLimit}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="border border-dashed border-gunmetal p-4 text-sm text-dimmed">
                        No sub-challenges configured for this challenge yet.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}