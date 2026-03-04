'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import {
    Sword,
    Target,
    CheckCircle2,
    Skull,
    ChevronRight,
    RefreshCw,
    Plus,
    Activity
} from 'lucide-react';

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

const statusFilters = ['all', 'active', 'completed', 'cancelled'] as const;

export default function StreamModePage() {
    const router = useRouter();
    const [streamerId, setStreamerId] = useState<Id<'streamers'> | null>(null);
    const [sessionChecked, setSessionChecked] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<string>('all');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        try {
            const session = localStorage.getItem('moderator_session');
            if (!session) {
                router.push('/login');
                setSessionChecked(true);
                return;
            }

            const parsedSession = JSON.parse(session) as { streamer_id?: string };
            if (!parsedSession.streamer_id) {
                setError('Invalid moderator session. Please sign in again.');
                setSessionChecked(true);
                return;
            }

            setStreamerId(parsedSession.streamer_id as Id<'streamers'>);
            setError(null);
        } catch (err) {
            setError('Invalid moderator session. Please sign in again.');
            console.error('Error reading moderator session:', err);
        } finally {
            setSessionChecked(true);
        }
    }, [router]);

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

    const handleRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 400);
    };

    const filteredChallenges = challenges.filter(
        (c) => activeFilter === 'all' || c.status === activeFilter
    );

    const activeCount = challenges.filter((c) => c.status === 'active').length;
    const completedCount = challenges.filter((c) => c.status === 'completed').length;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-terminal';
            case 'cancelled': return 'bg-hostile';
            case 'paused': return 'bg-alert';
            default: return 'bg-tactical';
        }
    };

    const getStatusTextColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-terminal';
            case 'cancelled': return 'text-hostile';
            case 'paused': return 'text-alert';
            default: return 'text-tactical';
        }
    };

    if (loading) {
        return (
            <div className="p-4 space-y-3">
                {/* Filter skeleton */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-8 w-20 bg-armor border border-gunmetal animate-pulse shrink-0 rounded-sm"></div>
                    ))}
                </div>
                {/* Card skeletons */}
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-armor border border-gunmetal p-4 animate-pulse">
                        <div className="h-4 bg-gunmetal rounded w-3/4 mb-3"></div>
                        <div className="h-2 bg-gunmetal rounded w-full mb-2"></div>
                        <div className="h-3 bg-gunmetal rounded w-1/2"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Skull size={40} className="text-hostile" />
                <p className="text-hostile text-sm font-mono">{error}</p>
                <button onClick={handleRefresh} className="btn-tactical py-2 px-6 text-xs">
                    RETRY
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-full">
            {/* Stats bar */}
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-4 text-[10px] font-bold font-mono">
                    <div className="flex items-center gap-1.5 text-tactical">
                        <Target size={12} />
                        <span>{activeCount} ACTIVE</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-terminal">
                        <CheckCircle2 size={12} />
                        <span>{completedCount} DONE</span>
                    </div>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="p-2 text-dimmed hover:text-tactical transition-colors"
                >
                    <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Filter pills */}
            <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-none">
                {statusFilters.map((filter) => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-4 py-1.5 text-[10px] font-chakra font-bold uppercase tracking-wider shrink-0 transition-all border ${activeFilter === filter
                                ? 'bg-tactical/15 border-tactical text-tactical'
                                : 'bg-armor border-gunmetal text-dimmed hover:text-hud'
                            }`}
                    >
                        {filter === 'all' ? `ALL (${challenges.length})` : filter.toUpperCase()}
                    </button>
                ))}
            </div>

            {/* Challenge list */}
            <div className="flex-1 px-4 pb-4 space-y-3">
                {filteredChallenges.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                        <div className="p-4 border border-gunmetal bg-armor">
                            <Sword size={32} className="text-dimmed" />
                        </div>
                        <p className="text-dimmed text-xs font-mono tracking-widest uppercase">
                            NO_CHALLENGES_FOUND
                        </p>
                        <Link
                            href="/moderator/stream/new"
                            className="btn-tactical py-2 px-6 text-xs flex items-center gap-2"
                        >
                            <Plus size={14} />
                            CREATE_CHALLENGE
                        </Link>
                    </div>
                ) : (
                    filteredChallenges.map((challenge) => (
                        <Link
                            key={challenge.id}
                            href={`/moderator/stream/${challenge.id}`}
                            className="block bg-armor border border-gunmetal hover:border-tactical/50 active:border-tactical transition-all relative group"
                        >
                            {/* Left accent bar */}
                            <div className={`absolute top-0 left-0 w-1 h-full ${getStatusColor(challenge.status)}`}></div>

                            <div className="p-4 pl-5">
                                {/* Top row: title + chevron */}
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <h3 className="text-sm font-chakra font-bold italic tracking-tight uppercase text-hud group-hover:text-tactical transition-colors leading-tight">
                                        {challenge.title}
                                    </h3>
                                    <ChevronRight size={16} className="text-dimmed shrink-0 mt-0.5 group-hover:text-tactical transition-colors" />
                                </div>

                                {/* Info row */}
                                <div className="flex items-center gap-3 text-[10px] font-mono text-dimmed flex-wrap">
                                    <span className={`font-bold uppercase ${getStatusTextColor(challenge.status)}`}>
                                        {challenge.status === 'active' && '● '}{challenge.status}
                                    </span>
                                    {challenge.given_by && (
                                        <>
                                            <span className="text-gunmetal">|</span>
                                            <span>BY: {challenge.given_by}</span>
                                        </>
                                    )}
                                    {challenge.reward_amount && (
                                        <>
                                            <span className="text-gunmetal">|</span>
                                            <span className="text-tactical">{challenge.reward_amount}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>

            {/* Floating create button */}
            <Link
                href="/moderator/stream/new"
                className="fixed bottom-20 right-4 w-14 h-14 bg-tactical text-void flex items-center justify-center shadow-[0_4px_20px_rgba(242,201,76,0.3)] hover:bg-white active:scale-95 transition-all z-20"
                style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}
            >
                <Plus size={24} strokeWidth={2.5} />
            </Link>
        </div>
    );
}
