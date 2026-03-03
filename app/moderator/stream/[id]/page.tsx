'use client';

import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import {
    ArrowLeft,
    Plus,
    Minus,
    Trophy,
    Skull,
    X,
    Edit3,
    Save,
    Trash2,
    Target,
    Activity
} from 'lucide-react';

interface SubChallenge {
    id: string;
    challenge_id: string;
    title: string;
    description?: string;
    current_progress: number;
    target_limit: number;
    status: 'active' | 'completed' | 'paused';
}

export default function StreamChallengeDetail({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const challengeId = resolvedParams.id as Id<'challenges'>;

    const challengeFromQuery = useQuery(api.challenges.getChallengeWithSubs, {
        challengeId,
    });

    const updateChallengeMutation = useMutation(api.challenges.updateChallenge);
    const createSubChallengeMutation = useMutation(api.challenges.createSubChallenge);
    const updateSubChallengeMutation = useMutation(api.challenges.updateSubChallenge);

    const [challenge, setChallenge] = useState<any>(null);
    const [subChallenges, setSubChallenges] = useState<SubChallenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Quick-add sub-challenge
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [newSubTitle, setNewSubTitle] = useState('');
    const [newSubTarget, setNewSubTarget] = useState(1);

    // Challenge actions
    const [completingChallenge, setCompletingChallenge] = useState(false);
    const [failingChallenge, setFailingChallenge] = useState(false);
    const [activatingChallenge, setActivatingChallenge] = useState(false);

    // Toast feedback
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 2000);
    };

    const calculateActualProgress = (subs: SubChallenge[]) => {
        if (subs.length === 0) return 0;
        const totalProgress = subs.reduce((sum, sub) => {
            const subProgress = Math.min((sub.current_progress / sub.target_limit) * 100, 100);
            return sum + subProgress;
        }, 0);
        return Math.round(totalProgress / subs.length);
    };

    const hasModeratorSession = () => {
        const session = localStorage.getItem('moderator_session');
        if (!session) {
            router.push('/login');
            return false;
        }
        return true;
    };

    useEffect(() => {
        if (!hasModeratorSession()) {
            setLoading(false);
            return;
        }

        if (challengeFromQuery === undefined) {
            setLoading(true);
            return;
        }

        if (challengeFromQuery === null) {
            setChallenge(null);
            setSubChallenges([]);
            setError('Challenge not found');
            setLoading(false);
            return;
        }

        const mappedSubChallenges: SubChallenge[] = challengeFromQuery.subChallenges.map((sub: {
            _id: string;
            challengeId: string;
            title: string;
            description?: string;
            currentProgress: number;
            targetLimit: number;
            status: 'active' | 'completed' | 'paused';
        }) => ({
            id: sub._id,
            challenge_id: sub.challengeId,
            title: sub.title,
            description: sub.description,
            current_progress: sub.currentProgress,
            target_limit: sub.targetLimit,
            status: sub.status,
        }));

        setSubChallenges(mappedSubChallenges);
        setChallenge({
            id: challengeFromQuery._id,
            title: challengeFromQuery.title,
            description: challengeFromQuery.description,
            given_by: challengeFromQuery.givenBy,
            deadline: challengeFromQuery.deadline,
            reward_amount: challengeFromQuery.rewardAmount,
            status: challengeFromQuery.status,
            progress: calculateActualProgress(mappedSubChallenges),
        });
        setError(null);
        setLoading(false);
    }, [challengeFromQuery, router]);

    const updateSubProgress = async (subId: string, increment: number) => {
        const subChallenge = subChallenges.find(s => s.id === subId);
        if (!subChallenge) return;

        const newProgress = Math.max(0, Math.min(subChallenge.target_limit, subChallenge.current_progress + increment));
        if (newProgress === subChallenge.current_progress) return;

        try {
            await updateSubChallengeMutation({
                subChallengeId: subId as Id<'subChallenges'>,
                currentProgress: newProgress,
                status: newProgress >= subChallenge.target_limit ? 'completed' : 'active',
            });

            setSubChallenges(prev => {
                const updatedSubs: SubChallenge[] = prev.map((sub): SubChallenge =>
                    sub.id === subId
                        ? {
                            ...sub,
                            current_progress: newProgress,
                            status: (newProgress >= sub.target_limit ? 'completed' : 'active') as SubChallenge['status'],
                        }
                        : sub
                );
                setChallenge((prevChallenge: any) => prevChallenge ? { ...prevChallenge, progress: calculateActualProgress(updatedSubs) } : prevChallenge);
                return updatedSubs;
            });

            showToast(`${newProgress}/${subChallenge.target_limit}`);
        } catch (err) {
            console.error('Failed to update progress:', err);
            showToast('Update failed', 'error');
        }
    };

    const addQuickSubChallenge = async () => {
        if (!newSubTitle.trim() || newSubTarget < 1) return;

        try {
            const subChallengeId = await createSubChallengeMutation({
                challengeId,
                title: newSubTitle.trim(),
                targetLimit: newSubTarget,
            });

            setSubChallenges(prev => {
                const updatedSubs: SubChallenge[] = [{
                    id: subChallengeId,
                    challenge_id: challengeId,
                    title: newSubTitle.trim(),
                    current_progress: 0,
                    target_limit: newSubTarget,
                    status: 'active',
                }, ...prev];
                setChallenge((prevChallenge: any) => prevChallenge ? { ...prevChallenge, progress: calculateActualProgress(updatedSubs) } : prevChallenge);
                return updatedSubs;
            });
            setNewSubTitle('');
            setNewSubTarget(1);
            setShowQuickAdd(false);
            showToast('Objective added');
        } catch (err) {
            console.error('Failed to add sub-challenge:', err);
            showToast('Failed to add', 'error');
        }
    };

    const completeChallenge = async () => {
        if (!challenge || completingChallenge) return;
        setCompletingChallenge(true);
        try {
            await updateChallengeMutation({
                challengeId,
                status: 'completed',
            });
            setChallenge((prev: any) => prev ? { ...prev, status: 'completed' } : null);
            showToast('CHALLENGE COMPLETED! 🏆');
        } catch (error) {
            showToast('Failed to complete', 'error');
        } finally {
            setCompletingChallenge(false);
        }
    };

    const failChallenge = async () => {
        if (!challenge || failingChallenge) return;
        setFailingChallenge(true);
        try {
            await updateChallengeMutation({
                challengeId,
                status: 'cancelled',
            });
            setChallenge((prev: any) => prev ? { ...prev, status: 'cancelled' } : null);
            showToast('CHALLENGE ELIMINATED ☠');
        } catch (error) {
            showToast('Failed to cancel', 'error');
        } finally {
            setFailingChallenge(false);
        }
    };

    const activateChallenge = async () => {
        if (!challenge || activatingChallenge) return;
        setActivatingChallenge(true);
        try {
            await updateChallengeMutation({
                challengeId,
                status: 'active',
            });
            setChallenge((prev: any) => prev ? { ...prev, status: 'active' } : null);
            showToast('CHALLENGE REACTIVATED');
        } catch {
            showToast('Failed to activate', 'error');
        } finally {
            setActivatingChallenge(false);
        }
    };

    if (loading) {
        return (
            <div className="p-4 space-y-4">
                <div className="h-6 bg-gunmetal rounded animate-pulse w-1/3"></div>
                <div className="bg-armor border border-gunmetal p-6 animate-pulse space-y-3">
                    <div className="h-6 bg-gunmetal rounded w-3/4"></div>
                    <div className="h-3 bg-gunmetal rounded w-1/2"></div>
                    <div className="h-2 bg-gunmetal rounded w-full mt-4"></div>
                </div>
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-armor border border-gunmetal p-4 animate-pulse">
                        <div className="h-4 bg-gunmetal rounded w-2/3 mb-2"></div>
                        <div className="h-3 bg-gunmetal rounded w-1/3"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (error || !challenge) {
        return (
            <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Skull size={40} className="text-hostile" />
                <p className="text-hostile text-sm font-mono">{error || 'Challenge not found'}</p>
                <Link href="/moderator/stream" className="btn-tactical py-2 px-6 text-xs">
                    BACK_TO_LIST
                </Link>
            </div>
        );
    }

    const statusColor = challenge.status === 'completed' ? 'text-terminal' : challenge.status === 'cancelled' ? 'text-hostile' : 'text-tactical';
    const statusBg = challenge.status === 'completed' ? 'bg-terminal/10 border-terminal/30' : challenge.status === 'cancelled' ? 'bg-hostile/10 border-hostile/30' : 'bg-tactical/10 border-tactical/30';

    return (
        <div className="flex flex-col min-h-full pb-4">
            {/* Toast notification */}
            {toast && (
                <div className={`fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 text-xs font-mono font-bold tracking-wider animate-in fade-in slide-in-from-top-2 duration-200 ${toast.type === 'error' ? 'bg-hostile text-white' : 'bg-tactical text-void'
                    }`}>
                    {toast.message}
                </div>
            )}

            {/* Back navigation */}
            <div className="px-4 pt-3 pb-2">
                <Link
                    href="/moderator/stream"
                    className="inline-flex items-center gap-2 text-dimmed hover:text-tactical transition-colors text-xs font-bold tracking-widest"
                >
                    <ArrowLeft size={14} />
                    CHALLENGES
                </Link>
            </div>

            {/* Challenge header card */}
            <div className="mx-4 mb-4 bg-armor border border-gunmetal relative overflow-hidden">
                {/* Status accent */}
                <div className={`absolute top-0 left-0 w-1 h-full ${challenge.status === 'completed' ? 'bg-terminal' : challenge.status === 'cancelled' ? 'bg-hostile' : 'bg-tactical'
                    }`}></div>

                <div className="p-4 pl-5">
                    {/* Status badge */}
                    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 border text-[10px] font-bold uppercase tracking-wider mb-2 ${statusBg} ${statusColor}`}>
                        {challenge.status === 'active' && <Activity size={10} className="animate-pulse" />}
                        {challenge.status}
                    </div>

                    <h1 className="text-xl font-chakra font-black italic tracking-tight uppercase text-hud mb-3 leading-tight">
                        {challenge.title}
                    </h1>

                    {/* Meta info */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono text-dimmed mb-4">
                        {challenge.given_by && <span>BY: <span className="text-hud">{challenge.given_by}</span></span>}
                        {challenge.reward_amount && <span>REWARD: <span className="text-tactical">{challenge.reward_amount}</span></span>}
                        {challenge.deadline && <span>DEADLINE: <span className="text-alert">{challenge.deadline}</span></span>}
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-dimmed tracking-widest">PROGRESS</span>
                            <span className="text-tactical font-chakra text-sm">{challenge.progress || 0}%</span>
                        </div>
                        <div className="h-2 bg-void border border-gunmetal relative overflow-hidden">
                            <div
                                className="h-full bg-tactical transition-all duration-500 relative"
                                style={{ width: `${challenge.progress || 0}%` }}
                            >
                                <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sub-challenges section */}
            <div className="px-4 mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold text-dimmed tracking-widest uppercase">
                    OBJECTIVES ({subChallenges.length})
                </span>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowQuickAdd(true)}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] border border-tactical/50 text-tactical active:bg-tactical/10 transition-all"
                    >
                        <Plus size={10} />
                        ADD
                    </button>
                </div>
            </div>

            {/* Sub-challenge list */}
            <div className="px-4 space-y-2 flex-1">
                {subChallenges.map((sub) => (
                    <div
                        key={sub.id}
                        className={`border transition-all ${sub.status === 'completed'
                                ? 'bg-terminal/5 border-terminal/20'
                                : 'bg-armor border-gunmetal'
                            }`}
                    >
                        <div className="p-3">
                            {/* Title row */}
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`text-sm font-bold uppercase tracking-wide flex-1 leading-tight ${sub.status === 'completed' ? 'text-terminal line-through opacity-60' : 'text-hud'
                                    }`}>
                                    {sub.title}
                                </span>
                                {sub.status === 'completed' && (
                                    <span className="text-[9px] font-black text-terminal tracking-widest">✓</span>
                                )}
                            </div>

                            {/* Progress controls */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => updateSubProgress(sub.id, -1)}
                                        className="w-11 h-11 flex items-center justify-center border border-gunmetal bg-void text-dimmed hover:text-tactical hover:border-tactical active:bg-tactical/10 transition-all"
                                    >
                                        <Minus size={18} />
                                    </button>
                                    <div className="min-w-[70px] text-center">
                                        <span className="text-base font-bold font-chakra text-hud">
                                            {sub.current_progress}
                                        </span>
                                        <span className="text-dimmed text-xs">/{sub.target_limit}</span>
                                    </div>
                                    <button
                                        onClick={() => updateSubProgress(sub.id, 1)}
                                        className="w-11 h-11 flex items-center justify-center border border-gunmetal bg-void text-dimmed hover:text-tactical hover:border-tactical active:bg-tactical/10 transition-all"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-dimmed font-mono">
                                        {Math.round((sub.current_progress / sub.target_limit) * 100)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Action buttons */}
            <div className="px-4 pt-4">
                {challenge.status === 'active' ? (
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={completeChallenge}
                            disabled={completingChallenge}
                            className="flex items-center justify-center gap-2 py-4 border border-terminal/30 bg-terminal/5 text-terminal active:bg-terminal active:text-void transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {completingChallenge ? (
                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Trophy size={20} />
                            )}
                            <span className="text-xs font-black italic uppercase">
                                {completingChallenge ? 'PROCESSING' : 'COMPLETE'}
                            </span>
                        </button>
                        <button
                            onClick={failChallenge}
                            disabled={failingChallenge}
                            className="flex items-center justify-center gap-2 py-4 border border-hostile/30 bg-hostile/5 text-hostile active:bg-hostile active:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {failingChallenge ? (
                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Skull size={20} />
                            )}
                            <span className="text-xs font-black italic uppercase">
                                {failingChallenge ? 'PROCESSING' : 'ELIMINATE'}
                            </span>
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={activateChallenge}
                        disabled={activatingChallenge}
                        className="w-full flex items-center justify-center gap-2 py-4 border border-tactical/30 bg-tactical/5 text-tactical active:bg-tactical active:text-void transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {activatingChallenge ? (
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <Activity size={20} />
                        )}
                        <span className="text-xs font-black italic uppercase">
                            {activatingChallenge ? 'PROCESSING' : 'ACTIVATE'}
                        </span>
                    </button>
                )}
            </div>

            {/* Quick-add modal / bottom sheet */}
            {showQuickAdd && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center">
                    <div className="bg-armor border-t border-x border-gunmetal w-full max-w-lg p-5 pb-8 animate-in slide-in-from-bottom duration-200"
                        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-sm font-chakra font-black italic text-hud uppercase tracking-tight">
                                ADD_OBJECTIVE
                            </h3>
                            <button
                                onClick={() => setShowQuickAdd(false)}
                                className="w-8 h-8 flex items-center justify-center text-dimmed hover:text-hostile transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-dimmed mb-1.5 tracking-widest">TITLE</label>
                                <input
                                    type="text"
                                    value={newSubTitle}
                                    onChange={(e) => setNewSubTitle(e.target.value)}
                                    className="w-full bg-void border border-gunmetal px-4 py-3 text-sm font-mono text-hud placeholder-dimmed focus:border-tactical focus:outline-none"
                                    placeholder="e.g. GET 10 HEADSHOTS"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-dimmed mb-1.5 tracking-widest">TARGET_LIMIT</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={newSubTarget}
                                    onChange={(e) => setNewSubTarget(parseInt(e.target.value) || 1)}
                                    className="w-full bg-void border border-gunmetal px-4 py-3 text-sm font-mono text-hud focus:border-tactical focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    onClick={() => setShowQuickAdd(false)}
                                    className="py-3 border border-gunmetal text-dimmed text-xs font-bold active:bg-void transition-all"
                                >
                                    CANCEL
                                </button>
                                <button
                                    onClick={addQuickSubChallenge}
                                    disabled={!newSubTitle.trim() || newSubTarget < 1}
                                    className="py-3 bg-tactical text-void text-xs font-bold active:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    ADD_OBJECTIVE
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
