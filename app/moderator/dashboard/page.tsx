'use client';

import {
  Trophy,
  Target,
  Activity,
  Sword,
  TrendingUp,
  Terminal,
  ChevronRight,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

interface Challenge {
  id: string;
  title: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
}

interface ModeratorSession {
  moderator_id: string;
  streamer_id: string;
  streamer_name: string;
  streamer_channel: string;
  created_at: string;
}

export default function ModeratorDashboard() {
  const router = useRouter();
  const [moderatorSession, setModeratorSession] = useState<ModeratorSession | null>(null);
  const [streamerName, setStreamerName] = useState('STREAMER');
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    const checkModeratorAuth = () => {
      const session = localStorage.getItem('moderator_session');
      if (!session) {
        router.push('/login');
        setSessionChecked(true);
        return null;
      }

      try {
        const parsedSession = JSON.parse(session) as ModeratorSession;
        setModeratorSession(parsedSession);
        setSessionChecked(true);
        return parsedSession;
      } catch (error) {
        console.error('Invalid moderator session:', error);
        localStorage.removeItem('moderator_session');
        router.push('/login');
        setSessionChecked(true);
        return null;
      }
    };

    const session = checkModeratorAuth();
    if (session) {
      setStreamerName(session.streamer_name || session.streamer_channel || 'STREAMER');
    }
  }, [router]);

  const rawChallenges = useQuery(
    api.challenges.getChallenges,
    moderatorSession?.streamer_id
      ? { streamerId: moderatorSession.streamer_id as Id<'streamers'> }
      : 'skip'
  );

  const challenges = useMemo<Challenge[]>(() => {
    return (rawChallenges ?? []).map((challenge: {
      _id: string;
      title: string;
      status: 'active' | 'completed' | 'paused' | 'cancelled';
    }) => ({
      id: challenge._id,
      title: challenge.title,
      status: challenge.status,
    }));
  }, [rawChallenges]);

  const loading = !sessionChecked || (Boolean(moderatorSession?.streamer_id) && rawChallenges === undefined);

  // Compute stats
  const totalChallenges = challenges.length;
  const activeChallenges = challenges.filter(c => c.status === 'active').length;
  const completedChallenges = challenges.filter(c => c.status === 'completed').length;
  const successRate = totalChallenges > 0 ? Math.round((completedChallenges / totalChallenges) * 100) : 0;

  const stats = [
    { label: 'TOTAL_CHALLENGES', value: totalChallenges.toString(), icon: Trophy, color: 'text-tactical' },
    { label: 'ACTIVE_CHALLENGES', value: activeChallenges.toString(), icon: Target, color: 'text-optic' },
    { label: 'SUCCESS_RATE', value: `${successRate}%`, icon: TrendingUp, color: 'text-terminal' },
    { label: 'COMPLETED', value: completedChallenges.toString(), icon: Activity, color: 'text-hostile' },
  ];

  // Map challenges to recent active challenges format
  const recentActiveChallenges = challenges.filter(c => c.status === 'active').slice(0, 5).map(challenge => ({
    id: challenge.id,
    title: challenge.title
  }));

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 font-mono">
        <div className="text-center text-hud">LOADING MODERATOR DATA...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-mono">
      {/* Live Stream Section */}
      <div className="bg-armor p-4 md:p-6 border border-gunmetal relative overflow-hidden flex flex-col md:flex-row items-center gap-4 md:gap-6">
        <div className="absolute top-0 left-0 w-1 h-full bg-tactical"></div>
        <div className="p-3 md:p-4 bg-void border border-gunmetal text-tactical">
          <Terminal size={28} className="md:w-8 md:h-8" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-lg md:text-2xl font-black italic tracking-tighter mb-1 text-hud">
            LIVE_STREAM: <span className="text-tactical">{streamerName.toUpperCase()}</span> IS LIVE
          </h1>
          <p className="text-dimmed text-xs font-mono uppercase tracking-widest leading-relaxed">

          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
          <Link
            href="/moderator/challenges/new"
            className="btn-tactical py-2 px-4 md:py-3 md:px-6 flex items-center gap-2 text-xs md:text-sm"
          >
            <Sword size={14} />
            CREATE_CHALLENGE
          </Link>
          <Link
            href="/moderator/challenges"
            className="btn-secondary py-2 px-4 md:py-3 md:px-6 flex items-center gap-2 text-xs md:text-sm border border-gunmetal hover:border-tactical transition-colors"
          >
            OPEN_CHALLENGE_LOGS
          </Link>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-armor p-3 md:p-6 border border-gunmetal hover:border-gunmetal/80 transition-all group"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 90% 100%, 0 100%)' }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2 bg-void border border-gunmetal ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <BarChart3 size={14} className="text-muted" />
            </div>
            <div className="text-lg md:text-2xl font-black italic tracking-tighter mb-1">{stat.value}</div>
            <div className="text-[9px] md:text-[10px] font-bold text-dimmed tracking-widest uppercase">{stat.label}</div>

            {/* HUD Scanline effect on hover */}
            <div className="w-full h-0.5 bg-gunmetal mt-4 relative overflow-hidden">
              <div className={`absolute top-0 left-0 h-full w-1/3 bg-current opacity-50 animate-pulse ${stat.color}`}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Active Challenges */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-gunmetal pb-2">
            <h3 className="text-lg font-bold italic tracking-tight flex items-center gap-2">
              <Sword size={18} className="text-tactical" />
              ACTIVE_CHALLENGES
            </h3>
          </div>

          <div className="space-y-3">
            {recentActiveChallenges.map((challenge) => (
              <div
                key={challenge.id}
                className="bg-void border border-gunmetal p-3 md:p-5 flex items-center justify-between hover:border-tactical transition-all group"
                style={{ clipPath: 'polygon(0 0, 98% 0, 100% 20%, 100% 100%, 2% 100%, 0 80%)' }}
              >
                <div className="flex items-center gap-4">
                  <div className="text-xs font-black bg-tactical/10 text-tactical px-2 py-1 border border-tactical/20">
                    ID:{challenge.id.slice(0, 4)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold font-chakra tracking-widest text-hud uppercase">{challenge.title}</h4>
                    <div className="text-[10px] text-dimmed font-mono mt-1">STATUS: ACTIVE</div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <Link
                    href={`/moderator/challenges/${challenge.id}`}
                    className="p-2 border border-gunmetal text-dimmed hover:text-tactical hover:border-tactical transition-all"
                  >
                    <ChevronRight size={18} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
