'use client';

import {
  Trophy,
  Target,
  Activity,
  TrendingUp,
  Plus,
  BarChart3,
  Dna
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

type Challenge = {
  id: string;
  title: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
};

export default function DashboardPage() {
  const { user, profile, setProfile, hydrated } = useAuthStore();

  const streamerEmail = user?.email ?? profile?.email;
  const streamer = useQuery(
    api.auth.getStreamerByEmail,
    streamerEmail ? { email: streamerEmail } : 'skip'
  );

  const rawChallenges = useQuery(
    api.challenges.getChallenges,
    streamer?._id ? { streamerId: streamer._id } : 'skip'
  );

  const convexProfile = useQuery(
    api.profile.getProfile,
    streamer?._id ? { streamerId: streamer._id } : 'skip'
  );

  useEffect(() => {
    if (!convexProfile) return;

    setProfile({
      id: convexProfile._id,
      email: convexProfile.email,
      name: convexProfile.name,
      channel_name: convexProfile.channelName,
      overlay_link: convexProfile.overlayLink,
      created_at: new Date(convexProfile._creationTime).toISOString(),
      updated_at: new Date(convexProfile._creationTime).toISOString(),
    });
  }, [convexProfile, setProfile]);

  const challenges = useMemo<Challenge[]>(
    () =>
      (rawChallenges ?? []).map((challenge: {
        _id: string;
        title: string;
        status: 'active' | 'completed' | 'paused' | 'cancelled';
      }) => ({
        id: challenge._id,
        title: challenge.title,
        status: challenge.status,
      })),
    [rawChallenges]
  );

  const loading = !hydrated || (Boolean(streamerEmail) && (streamer === undefined || rawChallenges === undefined));

  // Compute stats from real data
  const totalChallenges = challenges.length;
  const activeChallenges = challenges.filter(c => c.status === 'active').length;
  const completedChallenges = challenges.filter(c => c.status === 'completed').length;
  const successRate = totalChallenges > 0 ? Math.round((completedChallenges / totalChallenges) * 100) : 0;

  const stats = [
    { label: 'TOTAL_CHALLENGES', value: totalChallenges.toString().padStart(2, '0'), icon: Trophy, color: 'text-tactical' },
    { label: 'ACTIVE_CHALLENGES', value: activeChallenges.toString().padStart(2, '0'), icon: Target, color: 'text-optic' },
    { label: 'SUCCESS_RATE', value: `${successRate}%`, icon: TrendingUp, color: 'text-terminal' },
    { label: 'COMPLETED', value: completedChallenges.toString().padStart(2, '0'), icon: Activity, color: 'text-hostile' },
  ];

  // Map challenges to recentChallenges format
  const recentChallenges = challenges.slice(0, 3).map(challenge => ({
    id: challenge.id,
    title: challenge.title,
    status: challenge.status === 'active' ? 'IN_PROGRESS' : challenge.status === 'completed' ? 'COMPLETED' : 'FAILED',
    streamer: user?.email || 'Unknown'
  }));

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="text-center text-hud">LOADING CHALLENGE DATA...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero / Quick Action Section */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-armor p-4 md:p-8 border border-gunmetal tactical-border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-tactical/5 blur-3xl pointer-events-none rounded-full -mr-20 -mt-20"></div>

        <div className="relative z-10 text-center md:text-left">
          <h1 className="text-xl md:text-3xl font-black italic tracking-tighter mb-2">
            WELCOME BACK, <span className="text-tactical">{profile?.name || 'STREAMER'}</span>
          </h1>
        </div>

        <Link
          href="/streamer/challenges"
          className="btn-tactical flex items-center gap-3 group whitespace-nowrap"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          NEW CHALLENGE
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-armor p-6 border border-gunmetal hover:border-gunmetal/80 transition-all group"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 90% 100%, 0 100%)' }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2 bg-void border border-gunmetal ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <BarChart3 size={14} className="text-muted" />
            </div>
            <div className="text-2xl font-black italic tracking-tighter mb-1">{stat.value}</div>
            <div className="text-[10px] font-bold text-dimmed tracking-widest uppercase">{stat.label}</div>

            {/* HUD Scanline effect on hover */}
            <div className="w-full h-0.5 bg-gunmetal mt-4 relative overflow-hidden">
              <div className={`absolute top-0 left-0 h-full w-1/3 bg-current opacity-50 animate-pulse ${stat.color}`}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Recent Challenges List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-gunmetal pb-2">
            <h3 className="text-lg font-bold italic inline-flex items-center gap-2">
              <Dna size={18} className="text-tactical" />
              RECENT_CHALLENGES
            </h3>
            <Link href="/streamer/challenges" className="text-[10px] text-tactical hover:underline font-mono tracking-widest">
              VIEW_ALL_LOGS
            </Link>
          </div>

          <div className="space-y-3">
            {recentChallenges.map((challenge) => (
              <div
                key={challenge.id}
                className="bg-void border border-gunmetal p-4 group hover:border-tactical/50 transition-colors flex items-center relative"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-10 ${challenge.status === 'COMPLETED' ? 'bg-terminal' :
                      challenge.status === 'FAILED' ? 'bg-hostile' : 'bg-tactical animate-pulse'
                    }`}></div>
                  <div>
                    <h4 className="font-bold text-sm tracking-widest">{challenge.title}</h4>
                    <div className="flex items-center gap-4 mt-1">
                      <span className={`text-[10px] font-bold font-mono uppercase ${challenge.status === 'COMPLETED' ? 'text-terminal' :
                          challenge.status === 'FAILED' ? 'text-hostile' : 'text-tactical'
                        }`}>
                        {challenge.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
