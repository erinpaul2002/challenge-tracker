'use client';

import { 
  Plus, 
  Search, 
  Filter, 
  ChevronRight, 
  Skull,
  Award,
  Zap,
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuthStore } from '@/stores/authStore';

type Challenge = {
  id: string;
  title: string;
  description?: string;
  given_by?: string;
  reward_amount?: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
};

export default function ChallengesPage() {
  const { user, profile, hydrated } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const streamerEmail = user?.email ?? profile?.email;
  const streamer = useQuery(
    api.auth.getStreamerByEmail,
    streamerEmail ? { email: streamerEmail } : 'skip'
  );

  const rawChallenges = useQuery(
    api.challenges.getChallenges,
    streamer?._id ? { streamerId: streamer._id } : 'skip'
  );

  const challenges = useMemo<Challenge[]>(
    () =>
      (rawChallenges ?? []).map((challenge: {
        _id: string;
        title: string;
        description?: string;
        givenBy?: string;
        rewardAmount?: string;
        status: 'active' | 'completed' | 'paused' | 'cancelled';
      }) => ({
        id: challenge._id,
        title: challenge.title,
        description: challenge.description,
        given_by: challenge.givenBy,
        reward_amount: challenge.rewardAmount,
        status: challenge.status,
      })),
    [rawChallenges]
  );

  const loading = !hydrated || (Boolean(streamerEmail) && (streamer === undefined || rawChallenges === undefined));
  const error = !hydrated
    ? null
    : !streamerEmail
    ? 'Unable to resolve logged-in streamer account'
    : streamer === null
      ? 'Streamer profile not found in Convex'
      : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showStatusDropdown && !(event.target as Element).closest('.status-dropdown')) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showStatusDropdown]);

  const filteredChallenges = challenges.filter(challenge => {
    const matchesSearch = challenge.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && challenge.status === 'active') ||
      (statusFilter === 'completed' && challenge.status === 'completed') ||
      (statusFilter === 'cancelled' && challenge.status === 'cancelled');
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gunmetal pb-6">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter">
              CHALLENGE_LOGS
            </h1>
            <p className="text-dimmed text-xs font-mono tracking-widest mt-1">LOADING_DATA...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-armor border border-gunmetal p-6 animate-pulse">
              <div className="h-4 bg-gunmetal rounded mb-4"></div>
              <div className="h-6 bg-gunmetal rounded mb-2"></div>
              <div className="h-4 bg-gunmetal rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gunmetal pb-6">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter">
              CHALLENGE_LOGS
            </h1>
            <p className="text-dimmed text-xs font-mono tracking-widest mt-1">ERROR_LOADING_DATA</p>
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gunmetal pb-6">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter">
            CHALLENGE_LOGS
          </h1>
          <p className="text-dimmed text-xs font-mono tracking-widest mt-1">TOTAL_RECORDS: {challenges.length}</p>
        </div>
        
        <Link href="/streamer/challenges/new" className="btn-tactical flex items-center gap-2">
          <Plus size={18} />
          CREATE_NEW_CHALLENGE
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dimmed" size={16} />
          <input 
            type="text" 
            placeholder="FILTER_BY_GOAL_NAME..." 
            className="w-full bg-void border border-gunmetal pl-10 pr-4 py-3 font-mono text-sm focus:border-tactical outline-none transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <div className="relative status-dropdown">
            <button 
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="bg-armor border border-gunmetal px-4 py-2 text-xs font-bold font-chakra hover:border-tactical transition-colors flex items-center gap-2"
            >
              <Filter size={14} /> 
              STATUS: {statusFilter === 'all' ? 'ALL' : statusFilter.toUpperCase()}
              <ChevronDown size={12} className={`transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showStatusDropdown && (
              <div className="absolute top-full mt-1 bg-armor border border-gunmetal min-w-[120px] z-10">
                <button 
                  onClick={() => { setStatusFilter('all'); setShowStatusDropdown(false); }}
                  className="w-full text-left px-4 py-2 text-xs font-bold font-chakra hover:bg-void transition-colors"
                >
                  ALL
                </button>
                <button 
                  onClick={() => { setStatusFilter('active'); setShowStatusDropdown(false); }}
                  className="w-full text-left px-4 py-2 text-xs font-bold font-chakra hover:bg-void transition-colors"
                >
                  ACTIVE
                </button>
                <button 
                  onClick={() => { setStatusFilter('completed'); setShowStatusDropdown(false); }}
                  className="w-full text-left px-4 py-2 text-xs font-bold font-chakra hover:bg-void transition-colors"
                >
                  COMPLETED
                </button>
                <button 
                  onClick={() => { setStatusFilter('cancelled'); setShowStatusDropdown(false); }}
                  className="w-full text-left px-4 py-2 text-xs font-bold font-chakra hover:bg-void transition-colors"
                >
                  CANCELLED
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Challenges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredChallenges.map((challenge) => (
          <div 
            key={challenge.id}
            className="bg-armor border border-gunmetal group hover:border-tactical transition-all relative overflow-hidden flex flex-col h-full"
          >
            {/* Status Badge */}
            <div className={`absolute top-0 right-0 px-3 py-1 text-[8px] font-black tracking-[0.2em] font-mono ${
              challenge.status === 'completed' ? 'bg-terminal text-void' :
              challenge.status === 'cancelled' ? 'bg-hostile text-white' : 'bg-tactical text-void'
            }`}>
              {challenge.status.toUpperCase()}
            </div>

            <div className="p-6 flex-1">
              <div className="flex items-center gap-2 mb-4">
                <div className={`p-1.5 ${
                  challenge.status === 'completed' ? 'text-terminal' : 
                  challenge.status === 'cancelled' ? 'text-hostile' : 'text-tactical'
                }`}>
                  {challenge.status === 'completed' ? <Award size={20} /> : 
                   challenge.status === 'cancelled' ? <Skull size={20} /> : <Zap size={20} className="animate-pulse" />}
                </div>
                <div className="text-[10px] font-mono text-dimmed tracking-widest leading-none">
                  
                </div>
              </div>

              <h3 className="font-chakra font-black text-xl italic tracking-tight mb-4 group-hover:text-tactical transition-colors line-clamp-2">
                {challenge.title}
              </h3>

              {challenge.description && (
                <p className="text-sm text-dimmed mb-4 line-clamp-2">
                  {challenge.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4 mt-auto">
                <div className="bg-void p-2 border border-gunmetal">
                  <div className="text-[8px] text-dimmed font-bold tracking-widest uppercase mb-1">REWARD</div>
                  <div className="text-xs font-mono font-bold text-hud">{challenge.reward_amount || 'N/A'}</div>
                </div>
                <div className="bg-void p-2 border border-gunmetal">
                  <div className="text-[8px] text-dimmed font-bold tracking-widest uppercase mb-1">GIVEN BY</div>
                  <div className="text-xs font-mono font-bold text-hud">{challenge.given_by || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-gunmetal p-2 flex items-center justify-end bg-void/50">
              <Link 
                href={`/streamer/challenges/${challenge.id}`}
                className="flex items-center gap-2 text-[10px] font-bold font-chakra text-tactical hover:text-white transition-colors px-3 py-1 group/link"
              >
                ACCESS_INTEL
                <ChevronRight size={12} className="group-hover/link:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            {/* Bottom Glow Effect */}
            <div className={`absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-100 transition-opacity ${
              challenge.status === 'completed' ? 'text-terminal' : 
              challenge.status === 'cancelled' ? 'text-hostile' : 'text-tactical'
            }`}></div>
          </div>
        ))}

        {/* Create New Placeholder */}
        <Link 
          href="/streamer/challenges/new"
          className="border-2 border-dashed border-gunmetal p-8 flex flex-col items-center justify-center text-dimmed hover:text-tactical hover:border-tactical transition-all group min-h-[250px]"
        >
          <div className="w-12 h-12 border border-current flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Plus size={32} />
          </div>
          <span className="font-chakra font-bold tracking-widest">ADD_NEW_ENTRY</span>
        </Link>
      </div>
    </div>
  );
}
