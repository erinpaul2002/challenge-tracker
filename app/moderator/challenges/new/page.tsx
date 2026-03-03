'use client';

import {
  ArrowLeft,
  Zap,
  AlertTriangle,
  Plus,
  Trash2,
  Target
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

interface CreateSubChallengeData {
  title: string;
  description?: string;
  target_limit: number;
}

interface CreateChallengeData {
  title: string;
  description?: string;
  given_by?: string;
  deadline?: string;
  reward_amount?: string;
}

interface SubChallengeFormData extends CreateSubChallengeData {
  id: string; // Temporary ID for form management
  tempTargetLimit?: string; // Temporary string value for input
}

export default function NewChallengePage() {
  const createChallengeMutation = useMutation(api.challenges.createChallenge);

  const [formData, setFormData] = useState<CreateChallengeData>({
    title: '',
    description: '',
    given_by: '',
    deadline: '',
    reward_amount: '',
  });

  const [subChallenges, setSubChallenges] = useState<SubChallengeFormData[]>([
    {
      id: 'default-1',
      title: '',
      description: '',
      target_limit: 1,
    }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const addSubChallenge = () => {
    const newId = `sub-${Date.now()}`;
    setSubChallenges(prev => [...prev, {
      id: newId,
      title: '',
      description: '',
      target_limit: 1,
    }]);
  };

  const removeSubChallenge = (id: string) => {
    if (subChallenges.length > 1) {
      setSubChallenges(prev => prev.filter(sub => sub.id !== id));
    }
  };

  const updateSubChallenge = (id: string, field: keyof SubChallengeFormData, value: string | number | undefined) => {
    setSubChallenges(prev => prev.map(sub =>
      sub.id === id ? { ...sub, [field]: value } : sub
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    // Validate that we have at least one sub-challenge with a title
    const validSubChallenges = subChallenges.filter(sub => sub.title.trim());
    if (validSubChallenges.length === 0) {
      setError('At least one objective is required');
      setIsSubmitting(false);
      return;
    }

    // Validate target limits are at least 1
    const invalidTargets = validSubChallenges.filter(sub => sub.target_limit < 1);
    if (invalidTargets.length > 0) {
      setError('All objectives must have a target limit of at least 1');
      setIsSubmitting(false);
      return;
    }

    try {
      const session = localStorage.getItem('moderator_session');
      if (!session) {
        setError('No moderator session found');
        setIsSubmitting(false);
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
        subChallenges: validSubChallenges.map(({ id, tempTargetLimit, ...sub }) => ({
          title: sub.title.trim(),
          description: sub.description?.trim() || undefined,
          targetLimit: sub.target_limit,
        })),
      });

      setSuccess(true);
      // Reset form
      setFormData({
        title: '',
        description: '',
        given_by: '',
        deadline: '',
        reward_amount: '',
      });
      setSubChallenges([{
        id: 'default-1',
        title: '',
        description: '',
        target_limit: 1,
      }]);
    } catch (err) {
      setError('Failed to create challenge');
      console.error('Error creating challenge:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CreateChallengeData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-gunmetal pb-6">
        <Link
          href="/moderator/challenges"
          className="w-10 h-10 border border-gunmetal flex items-center justify-center hover:border-tactical transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl md:text-3xl font-black italic tracking-tighter uppercase">
            CREATE_NEW_CHALLENGE
          </h1>
          <p className="text-dimmed text-xs font-mono tracking-widest mt-1">
            SECTION: CHALLENGE_CREATION // MODE: MANUAL
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Challenge Details */}
          <section className="space-y-4">
            <h2 className="text-xs font-mono text-tactical tracking-[0.3em] uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-tactical animate-pulse"></span>
              01_CHALLENGE_INFO
            </h2>

            <div className="space-y-6 bg-armor border border-gunmetal p-4 md:p-6 tactical-border">
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-dimmed uppercase tracking-widest">Challenge_Title</label>
                <input
                  type="text"
                  placeholder="E.G. SNIPER_ONLY_RUN"
                  className="w-full bg-void border border-gunmetal px-4 py-3 font-mono text-sm focus:border-tactical outline-none transition-colors"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-dimmed uppercase tracking-widest">Challenge_Description</label>
                <textarea
                  rows={4}
                  placeholder="ENTER_CHALLENGE_DETAILS_AND_RULES..."
                  className="w-full bg-void border border-gunmetal px-4 py-3 font-mono text-sm focus:border-tactical outline-none transition-colors resize-none"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-dimmed uppercase tracking-widest">Given_By</label>
                  <input
                    type="text"
                    placeholder="VIEWER_NAME"
                    className="w-full bg-void border border-gunmetal px-4 py-3 font-mono text-sm focus:border-tactical outline-none transition-colors"
                    value={formData.given_by}
                    onChange={(e) => handleInputChange('given_by', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-dimmed uppercase tracking-widest">Deadline</label>
                  <input
                    type="date"
                    className="w-full bg-void border border-gunmetal px-4 py-3 font-mono text-sm focus:border-tactical outline-none transition-colors"
                    value={formData.deadline}
                    onChange={(e) => handleInputChange('deadline', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-dimmed uppercase tracking-widest">Reward_Amount</label>
                <input
                  type="text"
                  placeholder="E.G. $50 / 1000 POINTS"
                  className="w-full bg-void border border-gunmetal px-4 py-3 font-mono text-sm focus:border-tactical outline-none transition-colors"
                  value={formData.reward_amount}
                  onChange={(e) => handleInputChange('reward_amount', e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Objectives Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono text-tactical tracking-[0.3em] uppercase flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-tactical animate-pulse"></span>
                02_OBJECTIVES
              </h2>
              <button
                type="button"
                onClick={addSubChallenge}
                className="flex items-center gap-2 px-3 py-1 bg-tactical/10 border border-tactical/30 text-tactical text-xs font-mono uppercase hover:bg-tactical/20 transition-colors"
              >
                <Plus size={12} />
                Add Objective
              </button>
            </div>

            <div className="space-y-4">
              {subChallenges.map((subChallenge, index) => (
                <div key={subChallenge.id} className="bg-armor border border-gunmetal p-4 tactical-border space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target size={14} className="text-tactical" />
                      <span className="text-xs font-mono text-dimmed uppercase tracking-widest">
                        Objective {index + 1}
                      </span>
                    </div>
                    {subChallenges.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSubChallenge(subChallenge.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-dimmed uppercase tracking-widest">Objective_Title</label>
                      <input
                        type="text"
                        placeholder="E.G. GET_10_HEADSHOTS"
                        className="w-full bg-void border border-gunmetal px-3 py-2 font-mono text-sm focus:border-tactical outline-none transition-colors"
                        value={subChallenge.title}
                        onChange={(e) => updateSubChallenge(subChallenge.id, 'title', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-dimmed uppercase tracking-widest">Target_Limit</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="10"
                        className="w-full bg-void border border-gunmetal px-3 py-2 font-mono text-sm focus:border-tactical outline-none transition-colors"
                        value={subChallenge.tempTargetLimit !== undefined ? subChallenge.tempTargetLimit : subChallenge.target_limit}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || parseInt(value) >= 1) {
                            updateSubChallenge(subChallenge.id, 'tempTargetLimit', value);
                            if (value !== '' && parseInt(value) >= 1) {
                              updateSubChallenge(subChallenge.id, 'target_limit', parseInt(value));
                              updateSubChallenge(subChallenge.id, 'tempTargetLimit', undefined);
                            }
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value;
                          if (value === '' || parseInt(value) < 1) {
                            updateSubChallenge(subChallenge.id, 'target_limit', 1);
                            updateSubChallenge(subChallenge.id, 'tempTargetLimit', undefined);
                          }
                        }}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-dimmed uppercase tracking-widest">Goal_Description</label>
                    <textarea
                      rows={2}
                      placeholder="DETAILED_GOAL_REQUIREMENTS..."
                      className="w-full bg-void border border-gunmetal px-3 py-2 font-mono text-sm focus:border-tactical outline-none transition-colors resize-none"
                      value={subChallenge.description}
                      onChange={(e) => updateSubChallenge(subChallenge.id, 'description', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Success/Error Messages */}
          {error && (
            <div className="bg-red-900/20 border border-red-500 p-4 text-red-400 text-sm font-mono">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-900/20 border border-green-500 p-4 text-green-400 text-sm font-mono">
              Challenge created successfully!
            </div>
          )}

          {/* Submission Controls */}
          <section className="space-y-4">
            <div className="bg-armor border border-gunmetal p-4 md:p-6 tactical-border">
              <form onSubmit={handleSubmit}>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.title}
                  className="w-full bg-tactical text-void font-chakra font-black italic py-4 hover:bg-white transition-colors flex items-center justify-center gap-2 clip-corner disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap size={20} fill="currentColor" />
                  {isSubmitting ? 'CREATING...' : 'CREATE_CHALLENGE'}
                </button>
              </form>
            </div>
          </section>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-8">
          {/* Summary Card */}
          <div className="bg-void border border-tactical p-4 md:p-6 shadow-[0_0_20px_rgba(242,201,76,0.1)] space-y-4">
            <div className="flex items-center gap-3 text-tactical border-b border-tactical/20 pb-4">
              <AlertTriangle size={18} />
              <span className="text-xs font-mono font-bold uppercase tracking-tighter">Challenge_Summary</span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-dimmed">STATUS:</span>
                <span className="text-terminal">
                  {formData.title ? 'READY_FOR_UP_LINK' : 'MISSING_TITLE'}
                </span>
              </div>
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-dimmed">TITLE:</span>
                <span>{formData.title || 'NOT_SET'}</span>
              </div>
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-dimmed">GIVEN_BY:</span>
                <span>{formData.given_by || 'NOT_SET'}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <button
                type="submit"
                disabled={isSubmitting || !formData.title}
                className="w-full bg-tactical text-void font-chakra font-black italic py-4 hover:bg-white transition-colors flex items-center justify-center gap-2 clip-corner disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap size={20} fill="currentColor" />
                {isSubmitting ? 'DEPLOYING...' : 'INITIATE_DEPLOYMENT'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}