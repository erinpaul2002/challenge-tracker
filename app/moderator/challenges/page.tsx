'use client';

import {
  Sword,
  Search,
  ChevronRight,
  CheckCircle2,
  Skull,
  Activity,
  Filter,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

interface Challenge {
  id: string;
  title: string;
  description?: string;
  given_by?: string;
  deadline?: string;
  reward_amount?: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export default function ModeratorChallenges() {
  const [streamerId, setStreamerId] = useState<Id<'streamers'> | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    try {
      const session = localStorage.getItem('moderator_session');
      if (!session) {
        setError('No moderator session found');
        setSessionChecked(true);
        return;
      }

      const parsed = JSON.parse(session) as { streamer_id?: string };
      if (!parsed.streamer_id) {
        setError('Invalid moderator session. Please sign in again.');
        setSessionChecked(true);
        return;
      }

      setStreamerId(parsed.streamer_id as Id<'streamers'>);
      setError(null);
    } catch (err) {
      console.error('Error reading moderator session:', err);
      setError('Invalid moderator session. Please sign in again.');
    } finally {
      setSessionChecked(true);
    }
  }, []);

  const rawChallenges = useQuery(
    api.challenges.getChallenges,
    streamerId ? { streamerId } : 'skip'
  );

  const challenges = useMemo<Challenge[]>(() => {
    return (rawChallenges ?? []).map((challenge: {
      _id: string;
      title: string;
      description?: string;
      givenBy?: string;
      deadline?: string;
      rewardAmount?: string;
      status: 'active' | 'completed' | 'paused' | 'cancelled';
      _creationTime: number;
    }) => ({
      id: challenge._id,
      title: challenge.title,
      description: challenge.description,
      given_by: challenge.givenBy,
      deadline: challenge.deadline,
      reward_amount: challenge.rewardAmount,
      status: challenge.status,
      created_at: new Date(challenge._creationTime).toISOString(),
      updated_at: new Date(challenge._creationTime).toISOString(),
    }));
  }, [rawChallenges]);

  const loading = !sessionChecked || (Boolean(streamerId) && rawChallenges === undefined);

  const filteredChallenges = challenges.filter(challenge =>
    challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (statusFilter === 'all' || challenge.status === statusFilter)
  );

  const completedCount = challenges.filter(c => c.status === 'completed').length;
  const failedCount = challenges.filter(c => c.status === 'cancelled').length;

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 font-mono">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gunmetal pb-6">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter text-hud">
              CHALLENGE_DATABASE
            </h1>
            <p className="text-dimmed text-xs font-mono tracking-widest mt-1 uppercase">LOADING_DATA...</p>
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-armor border border-gunmetal p-4 animate-pulse">
              <div className="h-4 bg-gunmetal rounded mb-2"></div>
              <div className="h-6 bg-gunmetal rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 font-mono">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gunmetal pb-6">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter text-hud">
              CHALLENGE_DATABASE
            </h1>
            <p className="text-dimmed text-xs font-mono tracking-widest mt-1 uppercase">ERROR_LOADING_DATA</p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-hostile mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-tactical"
          >
            RETRY
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-mono">
      {/* List Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gunmetal pb-6">
        <div>
          <h1 className="text-xl md:text-3xl font-black italic tracking-tighter text-hud">
            CHALLENGE_DATABASE
          </h1>
          <p className="text-dimmed text-[10px] md:text-xs font-mono tracking-widest mt-1 uppercase">MODERATOR_ACCESS_GRANTED // STATUS: OK</p>
        </div>

        <div className="flex items-center gap-4 text-[10px] font-bold">
          <div className="flex items-center gap-1.5 text-terminal border-r border-gunmetal pr-4">
            <CheckCircle2 size={12} /> {completedCount.toString().padStart(2, '0')} COMPLETED
          </div>
          <div className="flex items-center gap-1.5 text-hostile">
            <Skull size={12} /> {failedCount.toString().padStart(2, '0')} CANCELLED
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dimmed" size={16} />
          <input
            type="text"
            placeholder="SEARCH_CHALLENGE_LOGS..."
            className="w-full bg-void border border-gunmetal pl-10 pr-4 py-3 text-sm font-mono focus:border-tactical outline-none transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/moderator/challenges/new"
            className="bg-tactical text-void px-4 md:px-6 py-2 flex items-center gap-2 hover:bg-white transition-all group font-chakra font-black italic"
          >
            <Sword size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">CREATE_CHALLENGE</span>
          </Link>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-armor border border-gunmetal px-4 py-2 text-sm font-mono focus:border-tactical outline-none transition-colors text-hud"
          >
            <option value="all">ALL_STATUSES</option>
            <option value="active">ACTIVE</option>
            <option value="completed">COMPLETED</option>
            <option value="cancelled">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Modern List View */}
      <div className="grid grid-cols-1 gap-4">
        {filteredChallenges.map((challenge) => (
          <div
            key={challenge.id}
            className="bg-armor border border-gunmetal hover:border-tactical/50 transition-all group relative"
          >
            {/* Intensity Bar */}
            <div className={`absolute top-0 left-0 w-1 h-full ${challenge.status === 'completed' ? 'bg-terminal' :
                challenge.status === 'cancelled' ? 'bg-hostile' : 'bg-tactical'
              }`}></div>

            <div className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1 flex gap-6">
                <div className="hidden sm:flex flex-col items-center justify-center border-r border-gunmetal pr-6 min-w-[100px]">
                  <span className="text-[8px] text-dimmed font-bold tracking-[0.3em] uppercase mb-1">SECURITY_ID</span>
                  <span className="text-xs font-black italic font-chakra text-hud">MOD-{challenge.id.slice(0, 8).toUpperCase()}</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold font-chakra italic tracking-tight uppercase group-hover:text-tactical transition-colors">
                      {challenge.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 md:gap-4 text-[10px] text-dimmed font-mono flex-wrap">
                    <span className="flex items-center gap-1"><Activity size={10} /> CHALLENGE</span>
                    <span className="bg-void px-2 border border-gunmetal">TIMESTAMP: {new Date(challenge.created_at).toLocaleDateString()}</span>
                    {challenge.given_by && (
                      <span className="bg-void px-2 border border-gunmetal">GIVEN BY: {challenge.given_by}</span>
                    )}
                  </div>
                  {challenge.description && (
                    <p className="text-sm text-dimmed mt-2">{challenge.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-gunmetal pt-4 md:pt-0">
                <div className="flex flex-col items-end">
                  <span className="text-[8px] text-dimmed font-bold tracking-[0.2em] uppercase">CURR_STATUS</span>
                  <div className={`text-xs font-black italic uppercase ${challenge.status === 'completed' ? 'text-terminal' :
                      challenge.status === 'cancelled' ? 'text-hostile' : 'text-tactical animate-pulse'
                    }`}>
                    {challenge.status}
                  </div>
                </div>

                <Link
                  href={`/moderator/challenges/${challenge.id}`}
                  className="btn-tactical py-2 md:py-3 px-4 md:px-6 text-[10px] flex items-center gap-2 group/btn shadow-[5px_5px_0px_rgba(242,201,76,0.1)]"
                >
                  ACCESS_NODE
                  <ArrowUpRight size={14} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Top Right Decorative Tag */}
            <div className="absolute top-0 right-0 p-1 opacity-20 pointer-events-none">
              <div className="text-[7px] font-mono leading-none border-b border-r border-hud/20 px-1">DATA_0x77A</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
