'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import {
    ArrowLeft,
    Zap,
    Plus,
    Trash2,
    Target
} from 'lucide-react';

interface CreateChallengeData {
    title: string;
    description?: string;
    given_by?: string;
    deadline?: string;
    reward_amount?: string;
}

interface SubChallengeFormData {
    id: string;
    title: string;
    target_limit: number;
}

export default function StreamNewChallenge() {
    const router = useRouter();
    const createChallengeMutation = useMutation(api.challenges.createChallenge);

    const [formData, setFormData] = useState<CreateChallengeData>({
        title: '',
        description: '',
        given_by: '',
        deadline: '',
        reward_amount: '',
    });

    const [subChallenges, setSubChallenges] = useState<SubChallengeFormData[]>([
        { id: 'default-1', title: '', target_limit: 1 }
    ]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const addSubChallenge = () => {
        setSubChallenges(prev => [...prev, {
            id: `sub-${Date.now()}`,
            title: '',
            target_limit: 1,
        }]);
    };

    const removeSubChallenge = (id: string) => {
        if (subChallenges.length > 1) {
            setSubChallenges(prev => prev.filter(sub => sub.id !== id));
        }
    };

    const updateSubChallenge = (id: string, field: keyof SubChallengeFormData, value: string | number) => {
        setSubChallenges(prev => prev.map(sub =>
            sub.id === id ? { ...sub, [field]: value } : sub
        ));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const validSubChallenges = subChallenges.filter(sub => sub.title.trim());
        if (validSubChallenges.length === 0) {
            setError('At least one objective title is required');
            setIsSubmitting(false);
            return;
        }

        try {
            const session = localStorage.getItem('moderator_session');
            if (!session) {
                router.push('/login');
                return;
            }

            const parsedSession = JSON.parse(session) as { streamer_id?: string };
            if (!parsedSession.streamer_id) {
                setError('Invalid moderator session. Please sign in again.');
                setIsSubmitting(false);
                return;
            }

            await createChallengeMutation({
                streamerId: parsedSession.streamer_id as Id<'streamers'>,
                title: formData.title.trim(),
                description: formData.description?.trim() || undefined,
                givenBy: formData.given_by?.trim() || undefined,
                deadline: formData.deadline?.trim() || undefined,
                rewardAmount: formData.reward_amount?.trim() || undefined,
                subChallenges: validSubChallenges.map(({ id, ...sub }) => ({
                    title: sub.title.trim(),
                    targetLimit: sub.target_limit,
                })),
            });

            router.push('/moderator/stream');
        } catch (err) {
            setError('Failed to create challenge');
            console.error('Error creating challenge:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col min-h-full">
            {/* Back navigation */}
            <div className="px-4 pt-3 pb-2">
                <Link
                    href="/moderator/stream"
                    className="inline-flex items-center gap-2 text-dimmed hover:text-tactical transition-colors text-xs font-bold tracking-widest"
                >
                    <ArrowLeft size={14} />
                    BACK
                </Link>
            </div>

            {/* Title */}
            <div className="px-4 pb-4">
                <h1 className="text-lg font-chakra font-black italic tracking-tight uppercase text-hud">
                    CREATE<span className="text-tactical">_CHALLENGE</span>
                </h1>
                <p className="text-[10px] text-dimmed font-mono tracking-widest mt-0.5">
                    STREAM_MODE // QUICK_CREATE
                </p>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                <div className="px-4 space-y-4 flex-1">
                    {/* Challenge Title */}
                    <div>
                        <label className="block text-[10px] font-bold text-dimmed mb-1.5 tracking-widest uppercase">
                            CHALLENGE_TITLE *
                        </label>
                        <input
                            type="text"
                            placeholder="E.G. SNIPER_ONLY_RUN"
                            className="w-full bg-void border border-gunmetal px-4 py-3 font-mono text-sm text-hud placeholder-dimmed/50 focus:border-tactical outline-none transition-colors"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            required
                            autoFocus
                        />
                    </div>

                    {/* Given By + Reward (inline) */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-dimmed mb-1.5 tracking-widest uppercase">
                                GIVEN_BY
                            </label>
                            <input
                                type="text"
                                placeholder="VIEWER"
                                className="w-full bg-void border border-gunmetal px-3 py-3 font-mono text-sm text-hud placeholder-dimmed/50 focus:border-tactical outline-none transition-colors"
                                value={formData.given_by}
                                onChange={(e) => setFormData(prev => ({ ...prev, given_by: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-dimmed mb-1.5 tracking-widest uppercase">
                                REWARD
                            </label>
                            <input
                                type="text"
                                placeholder="$50"
                                className="w-full bg-void border border-gunmetal px-3 py-3 font-mono text-sm text-hud placeholder-dimmed/50 focus:border-tactical outline-none transition-colors"
                                value={formData.reward_amount}
                                onChange={(e) => setFormData(prev => ({ ...prev, reward_amount: e.target.value }))}
                            />
                        </div>
                    </div>

                    {/* Objectives */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] font-bold text-tactical tracking-widest uppercase flex items-center gap-1.5">
                                <Target size={10} />
                                OBJECTIVES
                            </label>
                            <button
                                type="button"
                                onClick={addSubChallenge}
                                className="flex items-center gap-1 px-2 py-1 text-[10px] border border-tactical/40 text-tactical active:bg-tactical/10 transition-all"
                            >
                                <Plus size={10} />
                                ADD
                            </button>
                        </div>

                        <div className="space-y-2">
                            {subChallenges.map((sub, index) => (
                                <div key={sub.id} className="bg-armor border border-gunmetal p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-mono text-dimmed">
                                            OBJ_{(index + 1).toString().padStart(2, '0')}
                                        </span>
                                        {subChallenges.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeSubChallenge(sub.id)}
                                                className="text-dimmed hover:text-hostile transition-colors p-1"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <input
                                            type="text"
                                            placeholder="OBJECTIVE TITLE"
                                            className="col-span-2 bg-void border border-gunmetal px-3 py-2 font-mono text-xs text-hud placeholder-dimmed/50 focus:border-tactical outline-none transition-colors"
                                            value={sub.title}
                                            onChange={(e) => updateSubChallenge(sub.id, 'title', e.target.value)}
                                        />
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder="TARGET"
                                            className="bg-void border border-gunmetal px-3 py-2 font-mono text-xs text-hud text-center focus:border-tactical outline-none transition-colors"
                                            value={sub.target_limit}
                                            onChange={(e) => updateSubChallenge(sub.id, 'target_limit', parseInt(e.target.value) || 1)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-hostile/10 border border-hostile/30 p-3 text-hostile text-xs font-mono">
                            {error}
                        </div>
                    )}
                </div>

                {/* Submit button — fixed to bottom */}
                <div className="p-4 mt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting || !formData.title.trim()}
                        className="w-full bg-tactical text-void font-chakra font-black italic py-4 text-sm uppercase tracking-wide flex items-center justify-center gap-2 active:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}
                    >
                        <Zap size={18} fill="currentColor" />
                        {isSubmitting ? 'DEPLOYING...' : 'CREATE_CHALLENGE'}
                    </button>
                </div>
            </form>
        </div>
    );
}
