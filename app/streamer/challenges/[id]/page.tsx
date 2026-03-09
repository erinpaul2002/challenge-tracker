'use client';

import {
  ArrowLeft,
  Target,
  Zap,
  Clock,
  Edit3,
  Save,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Minus
} from 'lucide-react';
import Link from 'next/link';
import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
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
}

interface SubChallenge {
  id: string;
  challenge_id: string;
  title: string;
  description?: string;
  current_progress: number;
  target_limit: number;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
  updated_at: string;
}

interface ChallengeWithSubs extends Challenge {
  sub_challenges: SubChallenge[];
}

export default function ChallengeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [challenge, setChallenge] = useState<ChallengeWithSubs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const resolvedParams = use(params);
  const challengeId = resolvedParams.id as Id<'challenges'>;

  const getStreamerSessionToken = () => {
    const session = localStorage.getItem('streamer_session');
    if (!session) return null;

    try {
      const parsed = JSON.parse(session) as { session_token?: string };
      return parsed.session_token ?? session;
    } catch {
      return session;
    }
  };

  const streamerSessionToken =
    typeof window !== 'undefined' ? getStreamerSessionToken() : null;

  const challengeFromQuery = useQuery(
    api.challenges.getChallengeWithSubs,
    streamerSessionToken
      ? {
        challengeId,
        sessionToken: streamerSessionToken,
      }
      : 'skip'
  );

  const updateSubChallengeMutation = useMutation(api.challenges.updateSubChallenge);
  const deleteSubChallengeMutation = useMutation(api.challenges.deleteSubChallenge);
  const updateChallengeMutation = useMutation(api.challenges.updateChallenge);
  const deleteChallengeMutation = useMutation(api.challenges.deleteChallenge);
  const createSubChallengeMutation = useMutation(api.challenges.createSubChallenge);

  const [updatingProgress, setUpdatingProgress] = useState<string | null>(null);
  const [deletingSubChallenge, setDeletingSubChallenge] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subChallengeToDelete, setSubChallengeToDelete] = useState<SubChallenge | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubTitle, setNewSubTitle] = useState('');
  const [newSubDescription, setNewSubDescription] = useState('');
  const [newSubTargetLimit, setNewSubTargetLimit] = useState(1);
  const [creatingSubChallenge, setCreatingSubChallenge] = useState(false);
  const [showEditChallengeModal, setShowEditChallengeModal] = useState(false);
  const [editChallengeTitle, setEditChallengeTitle] = useState('');
  const [editChallengeDescription, setEditChallengeDescription] = useState('');
  const [editChallengeGivenBy, setEditChallengeGivenBy] = useState('');
  const [editChallengeDeadline, setEditChallengeDeadline] = useState('');
  const [editChallengeReward, setEditChallengeReward] = useState('');
  const [updatingChallenge, setUpdatingChallenge] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'complete' | 'fail' | 'activate' | 'terminate' | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSubChallenge, setEditingSubChallenge] = useState<SubChallenge | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCurrentProgress, setEditCurrentProgress] = useState(0);
  const [editTargetLimit, setEditTargetLimit] = useState(1);

  const updateSubChallengeProgress = async (subId: string, newProgress: number) => {
    if (!streamerSessionToken) return;
    if (!challenge) return;

    const subChallenge = challenge.sub_challenges.find((sub) => sub.id === subId);
    if (!subChallenge) return;

    const boundedProgress = Math.max(0, Math.min(subChallenge.target_limit, newProgress));
    const newStatus: SubChallenge['status'] = boundedProgress >= subChallenge.target_limit ? 'completed' : 'active';

    setUpdatingProgress(subId);
    try {
      await updateSubChallengeMutation({
        sessionToken: streamerSessionToken,
        subChallengeId: subId as Id<'subChallenges'>,
        currentProgress: boundedProgress,
        status: newStatus,
      });

      // Update local state
      setChallenge(prev => prev ? {
        ...prev,
        sub_challenges: prev.sub_challenges.map(sub =>
          sub.id === subId
            ? { ...sub, current_progress: boundedProgress, status: newStatus }
            : sub
        )
      } : null);
    } catch (error) {
      console.error('Error updating progress:', error);
    } finally {
      setUpdatingProgress(null);
    }
  };

  const incrementProgress = (subId: string, currentProgress: number) => {
    updateSubChallengeProgress(subId, currentProgress + 1);
  };

  const decrementProgress = (subId: string, currentProgress: number) => {
    updateSubChallengeProgress(subId, currentProgress - 1);
  };

  const confirmDeleteSubChallenge = async () => {
    if (!subChallengeToDelete || !streamerSessionToken) return;

    setDeletingSubChallenge(subChallengeToDelete.id);
    setShowDeleteModal(false);
    try {
      await deleteSubChallengeMutation({
        sessionToken: streamerSessionToken,
        subChallengeId: subChallengeToDelete.id as Id<'subChallenges'>,
      });

      // Update local state
      setChallenge(prev => prev ? {
        ...prev,
        sub_challenges: prev.sub_challenges.filter(sub => sub.id !== subChallengeToDelete.id)
      } : null);
    } catch (error) {
      console.error('Error deleting sub-challenge:', error);
      alert('Failed to delete objective');
    } finally {
      setDeletingSubChallenge(null);
      setSubChallengeToDelete(null);
    }
  };

  const startDeleteSubChallenge = (subChallenge: SubChallenge) => {
    setSubChallengeToDelete(subChallenge);
    setShowDeleteModal(true);
  };

  const cancelDeleteSubChallenge = () => {
    setShowDeleteModal(false);
    setSubChallengeToDelete(null);
  };

  const openAddSubChallengeModal = () => {
    setNewSubTitle('');
    setNewSubDescription('');
    setNewSubTargetLimit(1);
    setShowAddModal(true);
  };

  const cancelAddSubChallenge = () => {
    setShowAddModal(false);
    setNewSubTitle('');
    setNewSubDescription('');
    setNewSubTargetLimit(1);
  };

  const openEditChallengeModal = () => {
    if (!challenge) return;
    setEditChallengeTitle(challenge.title);
    setEditChallengeDescription(challenge.description || '');
    setEditChallengeGivenBy(challenge.given_by || '');
    setEditChallengeDeadline(challenge.deadline || '');
    setEditChallengeReward(challenge.reward_amount || '');
    setShowEditChallengeModal(true);
  };

  const cancelEditChallenge = () => {
    setShowEditChallengeModal(false);
    setEditChallengeTitle('');
    setEditChallengeDescription('');
    setEditChallengeGivenBy('');
    setEditChallengeDeadline('');
    setEditChallengeReward('');
  };

  const updateChallenge = async () => {
    if (!streamerSessionToken) return;
    if (!editChallengeTitle.trim() || !challenge) return;

    setUpdatingChallenge(true);
    try {
      await updateChallengeMutation({
        sessionToken: streamerSessionToken,
        challengeId,
        title: editChallengeTitle.trim(),
        description: editChallengeDescription.trim() || undefined,
        givenBy: editChallengeGivenBy.trim() || undefined,
        deadline: editChallengeDeadline.trim() || undefined,
        rewardAmount: editChallengeReward.trim() || undefined,
      });

      // Update local state
      setChallenge(prev => prev ? {
        ...prev,
        title: editChallengeTitle.trim(),
        description: editChallengeDescription.trim() || undefined,
        given_by: editChallengeGivenBy.trim() || undefined,
        deadline: editChallengeDeadline.trim() || undefined,
        reward_amount: editChallengeReward.trim() || undefined,
      } : null);
      setShowEditChallengeModal(false);
      setEditChallengeTitle('');
      setEditChallengeDescription('');
      setEditChallengeGivenBy('');
      setEditChallengeDeadline('');
      setEditChallengeReward('');
    } catch (error) {
      console.error('Error updating challenge:', error);
      alert('Failed to update challenge');
    } finally {
      setUpdatingChallenge(false);
    }
  };

  const completeChallenge = async () => {
    setConfirmAction('complete');
    setShowConfirmModal(true);
  };

  const failChallenge = async () => {
    setConfirmAction('fail');
    setShowConfirmModal(true);
  };

  const activateChallenge = async () => {
    setConfirmAction('activate');
    setShowConfirmModal(true);
  };

  const confirmActionHandler = async () => {
    if (!confirmAction || !challenge) return;

    if (!streamerSessionToken) {
      setUpdatingChallenge(false);
      setShowConfirmModal(false);
      setConfirmAction(null);
      return;
    }

    if (confirmAction === 'terminate') {
      await confirmTerminateChallenge();
      return;
    }

    setUpdatingChallenge(true);
    setShowConfirmModal(false);

    const newStatus = confirmAction === 'complete'
      ? 'completed'
      : confirmAction === 'fail'
        ? 'cancelled'
        : 'active';
    const actionLabel = confirmAction === 'complete'
      ? 'complete'
      : confirmAction === 'fail'
        ? 'fail'
        : 'activate';

    try {
      await updateChallengeMutation({
        sessionToken: streamerSessionToken,
        challengeId,
        status: newStatus,
      });

      // Update local state
      setChallenge(prev => prev ? {
        ...prev,
        status: newStatus,
      } : null);
    } catch (error) {
      console.error(`Error ${actionLabel} challenge:`, error);
      alert(`Failed to ${actionLabel} challenge`);
    } finally {
      setUpdatingChallenge(false);
      setConfirmAction(null);
    }
  };

  const cancelConfirmAction = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  const terminateChallenge = () => {
    setConfirmAction('terminate');
    setShowConfirmModal(true);
  };

  const confirmTerminateChallenge = async () => {
    if (!challenge || !streamerSessionToken) return;

    setUpdatingChallenge(true);
    setShowConfirmModal(false);

    try {
      await deleteChallengeMutation({
        sessionToken: streamerSessionToken,
        challengeId,
      });

      // Redirect back to challenges list
      router.push('/streamer/challenges');
    } catch (error) {
      console.error('Error terminating challenge:', error);
      alert('Failed to terminate challenge');
      setUpdatingChallenge(false);
    } finally {
      setConfirmAction(null);
    }
  };

  const createSubChallenge = async () => {
    if (!streamerSessionToken) return;
    if (!newSubTitle.trim() || !challenge) return;

    setCreatingSubChallenge(true);
    try {
      const newSubId = await createSubChallengeMutation({
        sessionToken: streamerSessionToken,
        challengeId,
        title: newSubTitle.trim(),
        description: newSubDescription.trim() || undefined,
        targetLimit: newSubTargetLimit,
      });

      // Update local state
      setChallenge(prev => prev ? {
        ...prev,
        sub_challenges: [...prev.sub_challenges, {
          id: newSubId,
          challenge_id: challenge.id,
          title: newSubTitle.trim(),
          description: newSubDescription.trim() || undefined,
          current_progress: 0,
          target_limit: newSubTargetLimit,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]
      } : null);
      setShowAddModal(false);
      setNewSubTitle('');
      setNewSubDescription('');
      setNewSubTargetLimit(1);
    } catch (error) {
      console.error('Error creating sub-challenge:', error);
      alert('Failed to create objective');
    } finally {
      setCreatingSubChallenge(false);
    }
  };

  const startEditingSubChallenge = (subChallenge: SubChallenge) => {
    setEditingSubChallenge(subChallenge);
    setEditTitle(subChallenge.title);
    setEditDescription(subChallenge.description || '');
    setEditCurrentProgress(subChallenge.current_progress);
    setEditTargetLimit(subChallenge.target_limit);
    setShowEditModal(true);
  };

  const cancelEditingSubChallenge = () => {
    setShowEditModal(false);
    setEditingSubChallenge(null);
    setEditTitle('');
    setEditDescription('');
    setEditCurrentProgress(0);
    setEditTargetLimit(1);
  };

  const saveSubChallengeEdit = async () => {
    if (!streamerSessionToken) return;
    if (!editingSubChallenge || !editTitle.trim()) return;

    if (editCurrentProgress < 0) {
      alert('Current progress cannot be less than zero.');
      return;
    }

    if (editTargetLimit < editCurrentProgress) {
      alert('Target limit cannot be less than current progress. Please increase target or decrease progress first.');
      return;
    }

    const nextStatus: SubChallenge['status'] = editCurrentProgress >= editTargetLimit ? 'completed' : 'active';

    setUpdatingProgress(editingSubChallenge.id);
    try {
      await updateSubChallengeMutation({
        sessionToken: streamerSessionToken,
        subChallengeId: editingSubChallenge.id as Id<'subChallenges'>,
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        currentProgress: editCurrentProgress,
        targetLimit: editTargetLimit,
        status: nextStatus,
      });

      // Update local state
      setChallenge(prev => prev ? {
        ...prev,
        sub_challenges: prev.sub_challenges.map(sub =>
          sub.id === editingSubChallenge.id ? {
            ...sub,
            title: editTitle.trim(),
            description: editDescription.trim() || undefined,
            current_progress: editCurrentProgress,
            target_limit: editTargetLimit,
            status: nextStatus,
          } : sub
        )
      } : null);
      setShowEditModal(false);
      setEditingSubChallenge(null);
      setEditTitle('');
      setEditDescription('');
      setEditCurrentProgress(0);
      setEditTargetLimit(1);
    } catch (error) {
      console.error('Error updating sub-challenge:', error);
      alert('Failed to update objective');
    } finally {
      setUpdatingProgress(null);
    }
  };

  useEffect(() => {
    if (!streamerSessionToken) {
      setError('Unauthorized');
      setChallenge(null);
      setLoading(false);
      return;
    }

    if (challengeFromQuery === undefined) {
      setLoading(true);
      return;
    }

    if (challengeFromQuery === null) {
      setError('Challenge not found');
      setChallenge(null);
      setLoading(false);
      return;
    }

    setChallenge({
      id: challengeFromQuery._id,
      title: challengeFromQuery.title,
      description: challengeFromQuery.description,
      given_by: challengeFromQuery.givenBy,
      deadline: challengeFromQuery.deadline,
      reward_amount: challengeFromQuery.rewardAmount,
      status: challengeFromQuery.status,
      created_at: new Date(challengeFromQuery._creationTime).toISOString(),
      sub_challenges: challengeFromQuery.subChallenges.map((sub: {
        _id: string;
        challengeId: string;
        title: string;
        description?: string;
        currentProgress: number;
        targetLimit: number;
        status: 'active' | 'completed' | 'paused';
        _creationTime: number;
      }) => ({
        id: sub._id,
        challenge_id: sub.challengeId,
        title: sub.title,
        description: sub.description,
        current_progress: sub.currentProgress,
        target_limit: sub.targetLimit,
        status: sub.status,
        created_at: new Date(sub._creationTime).toISOString(),
        updated_at: new Date(sub._creationTime).toISOString(),
      })),
    });
    setError(null);
    setLoading(false);
  }, [challengeFromQuery, streamerSessionToken]);

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gunmetal rounded animate-pulse"></div>
        </div>
        <div className="bg-armor border border-gunmetal p-6 animate-pulse">
          <div className="h-8 bg-gunmetal rounded mb-4"></div>
          <div className="h-4 bg-gunmetal rounded mb-2"></div>
          <div className="h-4 bg-gunmetal rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <Link
            href="/streamer/challenges"
            className="flex items-center gap-2 text-dimmed hover:text-tactical transition-colors font-mono text-xs font-bold"
          >
            ← BACK_TO_CHALLENGES
          </Link>
        </div>
        <div className="text-center py-12">
          <p className="text-hostile mb-4">{error || 'Challenge not found'}</p>
          <Link href="/streamer/challenges" className="btn-tactical">
            BACK_TO_CHALLENGES
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/streamer/challenges"
          className="flex items-center gap-2 text-dimmed hover:text-tactical transition-colors font-mono text-xs font-bold"
        >
          <ArrowLeft size={14} />
          BACK_TO_LOGS
        </Link>

        <div className="flex flex-wrap gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={openEditChallengeModal}
                className="bg-gunmetal hover:bg-tactical hover:text-void px-4 py-2 border border-gunmetal flex items-center gap-2 text-xs font-bold font-chakra transition-all"
              >
                <Edit3 size={14} /> MODIFY_ENTRY
              </button>
              <button
                onClick={terminateChallenge}
                className="bg-hostile/10 text-hostile hover:bg-hostile hover:text-white px-4 py-2 border border-hostile/50 flex items-center gap-2 text-xs font-bold font-chakra transition-all"
              >
                <Trash2 size={14} /> TERMINATE
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-terminal text-void px-4 py-2 border border-terminal flex items-center gap-2 text-xs font-bold font-chakra transition-all"
              >
                <Save size={14} /> COMMIT_CHANGES
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gunmetal px-4 py-2 border border-gunmetal flex items-center gap-2 text-xs font-bold font-chakra transition-all"
              >
                <X size={14} /> CANCEL
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Intel Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-armor border border-gunmetal p-4 md:p-8 tactical-border relative overflow-hidden">
            {/* Background HUD Graphics */}
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Target size={200} />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-tactical text-void px-2 py-0.5 text-[10px] font-black font-mono">ID: {challenge.id.slice(0, 8).toUpperCase()}</span>
                <span className="text-dimmed font-mono text-[10px]">CREATED: {new Date(challenge.created_at).toLocaleDateString()}</span>
              </div>

              <h1 className="text-2xl md:text-4xl font-black italic tracking-tighter mb-4">
                {challenge.title}
              </h1>

              <div className="p-4 bg-void border-l-2 border-tactical mb-8">
                <p className="text-hud font-mono text-sm leading-relaxed">
                  {challenge.description || 'No description provided.'}
                </p>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="text-[10px] text-dimmed font-bold tracking-widest uppercase">STATUS</div>
                  <div className={`font-chakra font-bold flex items-center gap-2 ${challenge.status === 'completed' ? 'text-terminal' :
                    challenge.status === 'cancelled' ? 'text-hostile' : 'text-tactical'
                    }`}>
                    <Clock size={14} /> {challenge.status.toUpperCase()}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-dimmed font-bold tracking-widest uppercase">REWARD</div>
                  <div className="text-optic font-chakra font-bold">
                    {challenge.reward_amount || 'N/A'}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-dimmed font-bold tracking-widest uppercase">GIVEN_BY</div>
                  <div className="text-hud font-chakra font-bold">
                    {challenge.given_by || 'N/A'}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-dimmed font-bold tracking-widest uppercase">DEADLINE</div>
                  <div className="text-dimmed font-chakra font-bold">
                    {challenge.deadline ? new Date(challenge.deadline).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-Challenges / Objectives List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gunmetal pb-2">
              <h3 className="text-lg font-bold italic tracking-tight">SUB_OBJECTIVES</h3>
            </div>

            <div className="space-y-3">
              {challenge.sub_challenges.map((sub: SubChallenge, i) => {
                const progressPercentage = Math.min(100, (sub.current_progress / sub.target_limit) * 100);
                const isCompleted = sub.current_progress >= sub.target_limit;
                const isUpdating = updatingProgress === sub.id;

                return (
                  <div
                    key={sub.id}
                    className={`border p-4 transition-colors ${isCompleted
                      ? 'bg-terminal/5 border-terminal/30'
                      : 'bg-void border-gunmetal hover:border-tactical'
                      }`}
                    style={{ clipPath: 'polygon(0 0, 98% 0, 100% 15%, 100% 100%, 2% 100%, 0 85%)' }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className={`text-sm font-chakra font-bold ${isCompleted ? 'line-through text-dimmed' : 'text-hud'}`}>
                          {sub.title}
                        </span>
                        {sub.description && (
                          <p className="text-xs text-dimmed font-mono mt-1">{sub.description}</p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditingSubChallenge(sub)}
                          className="p-1.5 text-dimmed hover:text-tactical disabled:opacity-50"
                          disabled={updatingProgress === sub.id || deletingSubChallenge === sub.id}
                          title="Edit goal"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => startDeleteSubChallenge(sub)}
                          disabled={deletingSubChallenge === sub.id}
                          className="p-1.5 text-dimmed hover:text-hostile disabled:opacity-50"
                          title="Delete goal"
                        >
                          {deletingSubChallenge === sub.id ? (
                            <div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Progress Section */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-dimmed">PROGRESS:</span>
                        <span className={`font-bold ${isCompleted ? 'text-terminal' : 'text-tactical'}`}>
                          {sub.current_progress} / {sub.target_limit}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gunmetal h-2 border border-gunmetal/50">
                        <div
                          className={`h-full transition-all duration-300 ${isCompleted ? 'bg-terminal' : 'bg-tactical'
                            }`}
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>

                      {/* Progress Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => decrementProgress(sub.id, sub.current_progress)}
                            disabled={isUpdating || sub.current_progress <= 0}
                            className="w-8 h-8 flex items-center justify-center border border-gunmetal hover:border-tactical disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <Minus size={12} />
                          </button>

                          <span className="text-sm font-mono font-bold min-w-[3rem] text-center">
                            {isUpdating ? '...' : sub.current_progress}
                          </span>

                          <button
                            onClick={() => incrementProgress(sub.id, sub.current_progress)}
                            disabled={isUpdating || sub.current_progress >= sub.target_limit}
                            className="w-8 h-8 flex items-center justify-center border border-gunmetal hover:border-tactical disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <div className="text-xs font-mono text-dimmed">
                          {progressPercentage.toFixed(0)}% COMPLETE
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <button
                onClick={openAddSubChallengeModal}
                className="w-full p-4 border border-dashed border-tactical/60 text-tactical hover:border-tactical hover:bg-tactical/5 transition-all"
                style={{ clipPath: 'polygon(0 0, 98% 0, 100% 15%, 100% 100%, 2% 100%, 0 85%)' }}
              >
                <div className="flex items-center justify-center gap-2 text-[11px] font-black italic tracking-widest uppercase">
                  <span>Add sub challenge</span>
                  <Plus size={13} />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Intel */}
        <div className="space-y-6">
          {/* Challenge Control */}
          <div className="bg-armor border border-gunmetal p-6 tactical-border">
            <h3 className="text-sm font-bold italic mb-6 tracking-widest text-center border-b border-gunmetal pb-2">CHALLENGE_CONTROL</h3>

            <div className="space-y-4">
              <button
                onClick={completeChallenge}
                disabled={updatingChallenge || challenge?.status === 'completed'}
                className="w-full bg-terminal/10 text-terminal border border-terminal/30 py-4 font-chakra font-bold uppercase transition-colors hover:bg-terminal hover:text-void flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updatingChallenge ? (
                  <>
                    <div className="w-5 h-5 border border-current border-t-transparent rounded-full animate-spin"></div>
                    PROCESSING...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} /> COMPLETE_CHALLENGE
                  </>
                )}
              </button>
              <button
                onClick={failChallenge}
                disabled={updatingChallenge || challenge?.status === 'cancelled'}
                className="w-full bg-hostile/10 text-hostile border border-hostile/30 py-4 font-chakra font-bold uppercase transition-colors hover:bg-hostile hover:text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updatingChallenge ? (
                  <>
                    <div className="w-5 h-5 border border-current border-t-transparent rounded-full animate-spin"></div>
                    PROCESSING...
                  </>
                ) : (
                  <>
                    <AlertCircle size={18} /> MARK_AS_FAILED
                  </>
                )}
              </button>
              <button
                onClick={activateChallenge}
                disabled={updatingChallenge || challenge?.status === 'active'}
                className="w-full bg-tactical/10 text-tactical border border-tactical/30 py-4 font-chakra font-bold uppercase transition-colors hover:bg-tactical hover:text-void flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updatingChallenge ? (
                  <>
                    <div className="w-5 h-5 border border-current border-t-transparent rounded-full animate-spin"></div>
                    PROCESSING...
                  </>
                ) : (
                  <>
                    <Zap size={18} /> MARK_AS_ACTIVE
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Sub-Challenge Modal */}
      {showEditModal && editingSubChallenge && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-armor border border-gunmetal p-4 md:p-8 max-w-md w-full tactical-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold italic tracking-widest">EDIT_OBJECTIVE</h3>
              <button
                onClick={cancelEditingSubChallenge}
                className="p-2 text-dimmed hover:text-hostile"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-chakra font-bold mb-2 text-hud">
                  OBJECTIVE_TITLE
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-void border border-tactical text-hud px-4 py-3 font-chakra font-bold focus:outline-none focus:border-terminal"
                  placeholder="Enter goal title..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveSubChallengeEdit();
                    if (e.key === 'Escape') cancelEditingSubChallenge();
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-chakra font-bold mb-2 text-hud">
                  DESCRIPTION
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-void border border-tactical text-hud px-4 py-3 font-mono text-sm focus:outline-none focus:border-terminal resize-none"
                  placeholder="Optional description..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-chakra font-bold mb-2 text-hud">
                  CURRENT_PROGRESS
                </label>
                <input
                  type="number"
                  value={editCurrentProgress}
                  onChange={(e) => setEditCurrentProgress(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-void border border-tactical text-hud px-4 py-3 font-chakra font-bold focus:outline-none focus:border-terminal"
                  placeholder="Current progress..."
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-chakra font-bold mb-2 text-hud">
                  TARGET_LIMIT
                </label>
                <input
                  type="number"
                  value={editTargetLimit}
                  onChange={(e) => setEditTargetLimit(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-void border border-tactical text-hud px-4 py-3 font-chakra font-bold focus:outline-none focus:border-terminal"
                  placeholder="Target amount..."
                  min="1"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={saveSubChallengeEdit}
                  disabled={!editTitle.trim() || updatingProgress === editingSubChallenge.id}
                  className="flex-1 btn-tactical py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingProgress === editingSubChallenge.id ? (
                    <>
                      <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin"></div>
                      UPDATING...
                    </>
                  ) : (
                    <>
                      <Save size={16} /> COMMIT_CHANGES
                    </>
                  )}
                </button>
                <button
                  onClick={cancelEditingSubChallenge}
                  className="flex-1 bg-gunmetal text-dimmed border border-gunmetal py-3 font-chakra font-bold uppercase hover:bg-gunmetal/80 transition-colors flex items-center justify-center gap-2"
                >
                  <X size={16} /> CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Sub-Challenge Modal */}
      {showDeleteModal && subChallengeToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-armor border border-gunmetal p-4 md:p-8 max-w-md w-full tactical-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold italic tracking-widest text-hostile">CONFIRM_DELETION</h3>
              <button
                onClick={cancelDeleteSubChallenge}
                className="p-2 text-dimmed hover:text-hostile"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-hostile/10 border border-hostile/30">
                <p className="text-hud font-mono text-sm leading-relaxed">
                  Are you sure you want to delete this objective? This action cannot be undone.
                </p>
              </div>

              <div className="p-4 bg-void border border-gunmetal">
                <h4 className="font-chakra font-bold text-tactical mb-2">OBJECTIVE_TO_DELETE:</h4>
                <p className="text-hud font-chakra font-bold">{subChallengeToDelete.title}</p>
                {subChallengeToDelete.description && (
                  <p className="text-dimmed font-mono text-sm mt-2">{subChallengeToDelete.description}</p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={confirmDeleteSubChallenge}
                  disabled={deletingSubChallenge === subChallengeToDelete.id}
                  className="flex-1 bg-hostile/10 text-hostile border border-hostile/30 py-3 font-chakra font-bold uppercase hover:bg-hostile hover:text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingSubChallenge === subChallengeToDelete.id ? (
                    <>
                      <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin"></div>
                      DELETING...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} /> TERMINATE_OBJECTIVE
                    </>
                  )}
                </button>
                <button
                  onClick={cancelDeleteSubChallenge}
                  className="flex-1 bg-gunmetal text-dimmed border border-gunmetal py-3 font-chakra font-bold uppercase hover:bg-gunmetal/80 transition-colors flex items-center justify-center gap-2"
                >
                  <X size={16} /> CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Sub-Challenge Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-armor border border-gunmetal p-4 md:p-8 max-w-md w-full tactical-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold italic tracking-widest text-tactical">ADD_SUB_CHALLENGE</h3>
              <button
                onClick={cancelAddSubChallenge}
                className="p-2 text-dimmed hover:text-hostile"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-chakra font-bold mb-2 text-hud">
                  OBJECTIVE_TITLE
                </label>
                <input
                  type="text"
                  value={newSubTitle}
                  onChange={(e) => setNewSubTitle(e.target.value)}
                  className="w-full bg-void border border-tactical text-hud px-4 py-3 font-chakra font-bold focus:outline-none focus:border-terminal"
                  placeholder="Enter goal title..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') createSubChallenge();
                    if (e.key === 'Escape') cancelAddSubChallenge();
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-chakra font-bold mb-2 text-hud">
                  DESCRIPTION
                </label>
                <textarea
                  value={newSubDescription}
                  onChange={(e) => setNewSubDescription(e.target.value)}
                  className="w-full bg-void border border-tactical text-hud px-4 py-3 font-mono text-sm focus:outline-none focus:border-terminal resize-none"
                  placeholder="Optional description..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-chakra font-bold mb-2 text-hud">
                  TARGET_LIMIT
                </label>
                <input
                  type="number"
                  value={newSubTargetLimit}
                  onChange={(e) => setNewSubTargetLimit(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-void border border-tactical text-hud px-4 py-3 font-chakra font-bold focus:outline-none focus:border-terminal"
                  placeholder="Target amount..."
                  min="1"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={createSubChallenge}
                  disabled={!newSubTitle.trim() || creatingSubChallenge}
                  className="flex-1 btn-tactical py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingSubChallenge ? (
                    <>
                      <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin"></div>
                      CREATING...
                    </>
                  ) : (
                    <>
                      <Plus size={16} /> PUBLISH_CHALLENGE
                    </>
                  )}
                </button>
                <button
                  onClick={cancelAddSubChallenge}
                  className="flex-1 bg-gunmetal text-dimmed border border-gunmetal py-3 font-chakra font-bold uppercase hover:bg-gunmetal/80 transition-colors flex items-center justify-center gap-2"
                >
                  <X size={16} /> CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Challenge Modal */}
      {showEditChallengeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-armor border border-gunmetal p-4 md:p-8 max-w-lg w-full tactical-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold italic tracking-widest text-tactical">MODIFY_CHALLENGE</h3>
              <button
                onClick={cancelEditChallenge}
                className="p-2 text-dimmed hover:text-hostile"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-chakra font-bold mb-2 text-hud">
                  CHALLENGE_TITLE
                </label>
                <input
                  type="text"
                  value={editChallengeTitle}
                  onChange={(e) => setEditChallengeTitle(e.target.value)}
                  className="w-full bg-void border border-tactical text-hud px-4 py-3 font-chakra font-bold focus:outline-none focus:border-terminal"
                  placeholder="Enter challenge title..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') updateChallenge();
                    if (e.key === 'Escape') cancelEditChallenge();
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-chakra font-bold mb-2 text-hud">
                  DESCRIPTION
                </label>
                <textarea
                  value={editChallengeDescription}
                  onChange={(e) => setEditChallengeDescription(e.target.value)}
                  className="w-full bg-void border border-tactical text-hud px-4 py-3 font-mono text-sm focus:outline-none focus:border-terminal resize-none"
                  placeholder="Challenge description..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-chakra font-bold mb-2 text-hud">
                    GIVEN_BY
                  </label>
                  <input
                    type="text"
                    value={editChallengeGivenBy}
                    onChange={(e) => setEditChallengeGivenBy(e.target.value)}
                    className="w-full bg-void border border-tactical text-hud px-4 py-3 font-chakra font-bold focus:outline-none focus:border-terminal"
                    placeholder="Who gave this challenge..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-chakra font-bold mb-2 text-hud">
                    REWARD_AMOUNT
                  </label>
                  <input
                    type="text"
                    value={editChallengeReward}
                    onChange={(e) => setEditChallengeReward(e.target.value)}
                    className="w-full bg-void border border-tactical text-hud px-4 py-3 font-chakra font-bold focus:outline-none focus:border-terminal"
                    placeholder="Reward amount..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-chakra font-bold mb-2 text-hud">
                  DEADLINE
                </label>
                <input
                  type="date"
                  value={editChallengeDeadline}
                  onChange={(e) => setEditChallengeDeadline(e.target.value)}
                  className="w-full bg-void border border-tactical text-hud px-4 py-3 font-chakra font-bold focus:outline-none focus:border-terminal"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={updateChallenge}
                  disabled={!editChallengeTitle.trim() || updatingChallenge}
                  className="flex-1 btn-tactical py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingChallenge ? (
                    <>
                      <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin"></div>
                      UPDATING...
                    </>
                  ) : (
                    <>
                      <Save size={16} /> COMMIT_CHANGES
                    </>
                  )}
                </button>
                <button
                  onClick={cancelEditChallenge}
                  className="flex-1 bg-gunmetal text-dimmed border border-gunmetal py-3 font-chakra font-bold uppercase hover:bg-gunmetal/80 transition-colors flex items-center justify-center gap-2"
                >
                  <X size={16} /> CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-armor border border-gunmetal p-4 md:p-8 max-w-md w-full tactical-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold italic tracking-widest text-tactical">
                CONFIRM_{confirmAction === 'complete' ? 'COMPLETION' : confirmAction === 'fail' ? 'FAILURE' : confirmAction === 'activate' ? 'ACTIVATION' : 'TERMINATION'}
              </h3>
              <button
                onClick={cancelConfirmAction}
                className="p-2 text-dimmed hover:text-hostile"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className={`p-4 border ${confirmAction === 'complete' ? 'bg-terminal/10 border-terminal/30' : confirmAction === 'activate' ? 'bg-tactical/10 border-tactical/30' : 'bg-hostile/10 border-hostile/30'}`}>
                <p className="text-hud font-mono text-sm leading-relaxed">
                  {confirmAction === 'complete'
                    ? 'Are you sure you want to mark this challenge as completed? This action cannot be undone.'
                    : confirmAction === 'fail'
                      ? 'Are you sure you want to mark this challenge as failed? This action cannot be undone.'
                      : confirmAction === 'activate'
                        ? 'Are you sure you want to set this challenge back to active?'
                        : 'Are you sure you want to terminate this challenge? This will permanently delete the challenge and all its objectives. This action cannot be undone.'
                  }
                </p>
              </div>

              <div className="p-4 bg-void border border-gunmetal">
                <h4 className="font-chakra font-bold text-tactical mb-2">
                  {confirmAction === 'terminate' ? 'CHALLENGE_TO_DELETE:' : 'CHALLENGE:'} {challenge?.title}
                </h4>
                <p className="text-dimmed font-mono text-sm">
                  {confirmAction === 'terminate'
                    ? 'This will permanently delete the challenge and all associated objectives.'
                    : `Status will change to: ${confirmAction === 'complete' ? 'COMPLETED' : confirmAction === 'fail' ? 'CANCELLED' : 'ACTIVE'}`
                  }
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={confirmActionHandler}
                  disabled={updatingChallenge}
                  className={`flex-1 py-3 font-chakra font-bold uppercase transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${confirmAction === 'complete'
                    ? 'btn-tactical'
                    : confirmAction === 'activate'
                      ? 'bg-tactical/10 text-tactical border border-tactical/30 hover:bg-tactical hover:text-void'
                      : 'bg-hostile/10 text-hostile border border-hostile/30 hover:bg-hostile hover:text-white'
                    }`}
                >
                  {updatingChallenge ? (
                    <>
                      <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin"></div>
                      PROCESSING...
                    </>
                  ) : (
                    <>
                      {confirmAction === 'complete' ? <CheckCircle2 size={16} /> : confirmAction === 'activate' ? <Zap size={16} /> : confirmAction === 'terminate' ? <Trash2 size={16} /> : <AlertCircle size={16} />}
                      {confirmAction === 'complete' ? 'CONFIRM_COMPLETION' : confirmAction === 'activate' ? 'CONFIRM_ACTIVATION' : confirmAction === 'terminate' ? 'CONFIRM_TERMINATION' : 'CONFIRM_FAILURE'}
                    </>
                  )}
                </button>
                <button
                  onClick={cancelConfirmAction}
                  className="flex-1 bg-gunmetal text-dimmed border border-gunmetal py-3 font-chakra font-bold uppercase hover:bg-gunmetal/80 transition-colors flex items-center justify-center gap-2"
                >
                  <X size={16} /> CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
