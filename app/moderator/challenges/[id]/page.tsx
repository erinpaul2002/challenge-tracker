'use client';

import {
  ArrowLeft,
  Target,
  Plus,
  Minus,
  Trash2,
  Skull,
  Trophy,
  Activity,
  AlertTriangle,
  X,
  Edit3,
  Save
} from 'lucide-react';
import Link from 'next/link';
import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

interface SubChallenge {
  id: string;
  challenge_id: string;
  title: string;
  description?: string;
  current_progress: number;
  target_limit: number;
  status: 'active' | 'completed' | 'paused';
  created_at?: string;
  updated_at?: string;
}

export default function ModeratorChallengeDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [challenge, setChallenge] = useState<any>(null);
  const [subChallenges, setSubChallenges] = useState<SubChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newSubTitle, setNewSubTitle] = useState('');
  const [newSubTarget, setNewSubTarget] = useState(1);
  const resolvedParams = use(params);
  const challengeId = resolvedParams.id as Id<'challenges'>;

  const getModeratorSessionToken = () => {
    const session = localStorage.getItem('moderator_session');
    const cookieToken = document.cookie
      .split('; ')
      .find((row) => row.startsWith('moderator_session='))
      ?.split('=')[1];

    if (!session) {
      return cookieToken ? decodeURIComponent(cookieToken) : null;
    }

    try {
      const parsed = JSON.parse(session) as { session_token?: string; sessionToken?: string };
      return parsed.session_token ?? parsed.sessionToken ?? (cookieToken ? decodeURIComponent(cookieToken) : null);
    } catch {
      return session;
    }
  };

  const moderatorSessionToken =
    typeof window !== 'undefined' ? getModeratorSessionToken() : null;

  const challengeFromQuery = useQuery(
    api.challenges.getChallengeWithSubs,
    moderatorSessionToken
      ? {
        challengeId,
        sessionToken: moderatorSessionToken,
      }
      : 'skip'
  );

  const updateChallengeMutation = useMutation(api.challenges.updateChallenge);
  const deleteChallengeMutation = useMutation(api.challenges.deleteChallenge);
  const createSubChallengeMutation = useMutation(api.challenges.createSubChallenge);
  const updateSubChallengeMutation = useMutation(api.challenges.updateSubChallenge);
  const deleteSubChallengeMutation = useMutation(api.challenges.deleteSubChallenge);

  // Edit challenge modal states
  const [showEditChallengeModal, setShowEditChallengeModal] = useState(false);
  const [editChallengeTitle, setEditChallengeTitle] = useState('');
  const [editChallengeDescription, setEditChallengeDescription] = useState('');
  const [editChallengeGivenBy, setEditChallengeGivenBy] = useState('');
  const [editChallengeDeadline, setEditChallengeDeadline] = useState('');
  const [editChallengeReward, setEditChallengeReward] = useState('');
  const [updatingChallenge, setUpdatingChallenge] = useState(false);

  // Edit sub-challenge modal states
  const [showEditSubModal, setShowEditSubModal] = useState(false);
  const [editingSubChallenge, setEditingSubChallenge] = useState<SubChallenge | null>(null);
  const [editSubTitle, setEditSubTitle] = useState('');
  const [editSubDescription, setEditSubDescription] = useState('');
  const [editSubTargetLimit, setEditSubTargetLimit] = useState(1);

  // Delete sub-challenge states
  const [deletingSubChallenge, setDeletingSubChallenge] = useState<string | null>(null);
  const [showDeleteSubModal, setShowDeleteSubModal] = useState(false);
  const [subChallengeToDelete, setSubChallengeToDelete] = useState<SubChallenge | null>(null);

  // Challenge completion/failure states
  const [completingChallenge, setCompletingChallenge] = useState(false);
  const [failingChallenge, setFailingChallenge] = useState(false);
  const [activatingChallenge, setActivatingChallenge] = useState(false);

  // Delete challenge states
  const [deletingChallenge, setDeletingChallenge] = useState(false);
  const [showDeleteChallengeModal, setShowDeleteChallengeModal] = useState(false);

  // Calculate actual progress based on sub-challenges
  const calculateActualProgress = (subs: SubChallenge[]) => {
    if (subs.length === 0) return 0;

    // Calculate progress as average of individual sub-challenge completion percentages
    const totalProgress = subs.reduce((sum, sub) => {
      const subProgress = Math.min((sub.current_progress / sub.target_limit) * 100, 100);
      return sum + subProgress;
    }, 0);

    return Math.round(totalProgress / subs.length);
  };

  useEffect(() => {
    if (!moderatorSessionToken) {
      setChallenge(null);
      setSubChallenges([]);
      setError('Unauthorized');
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
      created_at: new Date(challengeFromQuery._creationTime).toISOString(),
      updated_at: new Date(challengeFromQuery._creationTime).toISOString(),
      progress: calculateActualProgress(mappedSubChallenges),
    });
    setError(null);
    setLoading(false);
  }, [challengeFromQuery, moderatorSessionToken]);

  const updateSubProgress = async (subId: string, increment: number) => {
    if (!moderatorSessionToken) return;
    const subChallenge = subChallenges.find(s => s.id === subId);
    if (!subChallenge) return;

    const newProgress = Math.max(0, Math.min(subChallenge.target_limit, subChallenge.current_progress + increment));
    if (newProgress === subChallenge.current_progress) return;

    try {
      await updateSubChallengeMutation({
        sessionToken: moderatorSessionToken,
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
        // Update challenge progress based on new sub-challenge data
        setChallenge((prevChallenge: any) => prevChallenge ? { ...prevChallenge, progress: calculateActualProgress(updatedSubs) } : prevChallenge);
        return updatedSubs;
      });

    } catch (err) {
      console.error('Failed to update progress:', err);
    }
  };

  const addQuickSubChallenge = async () => {
    if (!moderatorSessionToken) return;
    if (!newSubTitle.trim() || newSubTarget < 1) return;

    try {
      const subChallengeId = await createSubChallengeMutation({
        sessionToken: moderatorSessionToken,
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
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, ...prev];
        // Update challenge progress based on new sub-challenge data
        setChallenge((prevChallenge: any) => prevChallenge ? { ...prevChallenge, progress: calculateActualProgress(updatedSubs) } : prevChallenge);
        return updatedSubs;
      });
      setNewSubTitle('');
      setNewSubTarget(1);
      setShowQuickAdd(false);
    } catch (err) {
      console.error('Failed to add sub-challenge:', err);
    }
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
    if (!moderatorSessionToken) return;
    if (!editChallengeTitle.trim() || !challenge) return;

    setUpdatingChallenge(true);
    try {
      await updateChallengeMutation({
        sessionToken: moderatorSessionToken,
        challengeId,
        title: editChallengeTitle.trim(),
        description: editChallengeDescription.trim() || undefined,
        givenBy: editChallengeGivenBy.trim() || undefined,
        deadline: editChallengeDeadline.trim() || undefined,
        rewardAmount: editChallengeReward.trim() || undefined,
      });

      // Update local state
      setChallenge((prev: any) => prev ? {
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

  const startEditingSubChallenge = (subChallenge: SubChallenge) => {
    setEditingSubChallenge(subChallenge);
    setEditSubTitle(subChallenge.title);
    setEditSubDescription(subChallenge.description || '');
    setEditSubTargetLimit(subChallenge.target_limit);
    setShowEditSubModal(true);
  };

  const cancelEditingSubChallenge = () => {
    setShowEditSubModal(false);
    setEditingSubChallenge(null);
    setEditSubTitle('');
    setEditSubDescription('');
    setEditSubTargetLimit(1);
  };

  const saveSubChallengeEdit = async () => {
    if (!moderatorSessionToken) return;
    if (!editingSubChallenge || !editSubTitle.trim()) return;

    // Validate that target limit is not less than current progress
    if (editSubTargetLimit < editingSubChallenge.current_progress) {
      alert('Target limit cannot be less than current progress. Please adjust the target limit or reduce progress first.');
      return;
    }

    try {
      await updateSubChallengeMutation({
        sessionToken: moderatorSessionToken,
        subChallengeId: editingSubChallenge.id as Id<'subChallenges'>,
        title: editSubTitle.trim(),
        description: editSubDescription.trim() || undefined,
        targetLimit: editSubTargetLimit,
      });

      // Update local state
      setSubChallenges(prev => {
        const updatedSubs = prev.map(sub =>
          sub.id === editingSubChallenge.id ? {
            ...sub,
            title: editSubTitle.trim(),
            description: editSubDescription.trim() || undefined,
            target_limit: editSubTargetLimit
          } : sub
        );
        // Update challenge progress based on new sub-challenge data
        setChallenge((prevChallenge: any) => prevChallenge ? { ...prevChallenge, progress: calculateActualProgress(updatedSubs) } : prevChallenge);
        return updatedSubs;
      });
      setShowEditSubModal(false);
      setEditingSubChallenge(null);
      setEditSubTitle('');
      setEditSubDescription('');
      setEditSubTargetLimit(1);
    } catch (error) {
      console.error('Error updating sub-challenge:', error);
      alert('Failed to update goal');
    }
  };

  const startDeleteSubChallenge = (subChallenge: SubChallenge) => {
    setSubChallengeToDelete(subChallenge);
    setShowDeleteSubModal(true);
  };

  const cancelDeleteSubChallenge = () => {
    setShowDeleteSubModal(false);
    setSubChallengeToDelete(null);
  };

  const confirmDeleteSubChallenge = async () => {
    if (!subChallengeToDelete || !moderatorSessionToken) return;

    setDeletingSubChallenge(subChallengeToDelete.id);
    setShowDeleteSubModal(false);
    try {
      await deleteSubChallengeMutation({
        sessionToken: moderatorSessionToken,
        subChallengeId: subChallengeToDelete.id as Id<'subChallenges'>,
      });

      // Update local state
      setSubChallenges(prev => {
        const updatedSubs = prev.filter(sub => sub.id !== subChallengeToDelete.id);
        // Update challenge progress based on remaining sub-challenges
        setChallenge((prevChallenge: any) => prevChallenge ? { ...prevChallenge, progress: calculateActualProgress(updatedSubs) } : prevChallenge);
        return updatedSubs;
      });
    } catch (error) {
      console.error('Error deleting sub-challenge:', error);
      alert('Failed to delete goal');
    } finally {
      setDeletingSubChallenge(null);
      setSubChallengeToDelete(null);
    }
  };

  const completeChallenge = async () => {
    if (!moderatorSessionToken) return;
    if (!challenge) return;

    setCompletingChallenge(true);
    try {
      await updateChallengeMutation({
        sessionToken: moderatorSessionToken,
        challengeId,
        status: 'completed',
      });
      // Update local state
      setChallenge((prev: any) => prev ? { ...prev, status: 'completed' } : null);
    } catch (error) {
      console.error('Error completing challenge:', error);
      alert('Failed to complete challenge');
    } finally {
      setCompletingChallenge(false);
    }
  };

  const failChallenge = async () => {
    if (!moderatorSessionToken) return;
    if (!challenge) return;

    setFailingChallenge(true);
    try {
      await updateChallengeMutation({
        sessionToken: moderatorSessionToken,
        challengeId,
        status: 'cancelled',
      });
      // Update local state
      setChallenge((prev: any) => prev ? { ...prev, status: 'cancelled' } : null);
    } catch (error) {
      console.error('Error failing challenge:', error);
      alert('Failed to fail challenge');
    } finally {
      setFailingChallenge(false);
    }
  };

  const activateChallenge = async () => {
    if (!moderatorSessionToken) return;
    if (!challenge) return;

    setActivatingChallenge(true);
    try {
      await updateChallengeMutation({
        sessionToken: moderatorSessionToken,
        challengeId,
        status: 'active',
      });
      // Update local state
      setChallenge((prev: any) => prev ? { ...prev, status: 'active' } : null);
    } catch (error) {
      console.error('Error activating challenge:', error);
      alert('Failed to activate challenge');
    } finally {
      setActivatingChallenge(false);
    }
  };

  const startDeleteChallenge = () => {
    setShowDeleteChallengeModal(true);
  };

  const cancelDeleteChallenge = () => {
    setShowDeleteChallengeModal(false);
  };

  const confirmDeleteChallenge = async () => {
    if (!challenge || !moderatorSessionToken) return;

    setDeletingChallenge(true);
    setShowDeleteChallengeModal(false);
    try {
      await deleteChallengeMutation({
        sessionToken: moderatorSessionToken,
        challengeId,
      });
      router.push('/moderator/challenges');
    } catch (error) {
      console.error('Error deleting challenge:', error);
      alert('Failed to delete challenge');
    } finally {
      setDeletingChallenge(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 font-mono">
        <div className="flex items-center justify-between border-b border-gunmetal pb-4">
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
      <div className="space-y-8 animate-in fade-in duration-500 font-mono">
        <div className="flex items-center justify-between border-b border-gunmetal pb-4">
          <Link
            href="/moderator/challenges"
            className="flex items-center gap-2 text-dimmed hover:text-tactical transition-colors font-bold text-[10px] tracking-widest"
          >
            <ArrowLeft size={14} />
            REVERT_TO_BASE_LOGS
          </Link>
        </div>
        <div className="text-center py-12">
          <p className="text-hostile mb-4">{error || 'Challenge not found'}</p>
          <Link href="/moderator/challenges" className="btn-tactical">
            BACK_TO_CHALLENGES
          </Link>
        </div>
      </div>
    );
  }

  const normalizedStatus = typeof challenge.status === 'string' ? challenge.status.toLowerCase() : '';
  const challengeStatusColor =
    normalizedStatus === 'completed'
      ? 'text-terminal'
      : normalizedStatus === 'cancelled'
        ? 'text-hostile'
        : normalizedStatus === 'paused'
          ? 'text-alert'
          : 'text-tactical';
  const challengeStatusLabel = normalizedStatus ? normalizedStatus.toUpperCase() : 'UNKNOWN';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-mono">
      {/* Navigation Layer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gunmetal pb-4">
        <Link
          href="/moderator/challenges"
          className="flex items-center gap-2 text-dimmed hover:text-tactical transition-colors font-bold text-[10px] tracking-widest"
        >
          <ArrowLeft size={14} />
          REVERT_TO_BASE_LOGS
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={openEditChallengeModal}
            className="bg-gunmetal hover:bg-tactical hover:text-void px-3 md:px-4 py-2 border border-gunmetal flex items-center gap-2 text-xs font-bold font-chakra transition-all"
          >
            <Edit3 size={14} />
            <span className="hidden sm:inline">MODIFY_CHALLENGE</span>
            <span className="sm:hidden">MODIFY</span>
          </button>
          <button
            onClick={startDeleteChallenge}
            disabled={deletingChallenge}
            className="bg-gunmetal hover:bg-hostile hover:text-white px-3 md:px-4 py-2 border border-gunmetal flex items-center gap-2 text-xs font-bold font-chakra transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deletingChallenge ? (
              <div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Trash2 size={14} />
            )}
            <span className="hidden sm:inline">DELETE_CHALLENGE</span>
            <span className="sm:hidden">DELETE</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Interaction Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-armor border border-gunmetal p-4 md:p-8 tactical-border relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Activity size={180} />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-void border border-gunmetal px-2 py-0.5 text-[10px] text-dimmed font-bold tracking-widest">

                </span>
                <span className={`text-[10px] font-black italic tracking-widest ${challengeStatusColor}`}>
                  [{challengeStatusLabel}]
                </span>
              </div>

              <h1 className="text-2xl md:text-4xl font-black italic tracking-tighter text-hud mb-4 md:mb-6">
                {challenge.title}
              </h1>

              <div className="space-y-8 mt-12">
                {/* Progress Control */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-xs font-black italic tracking-widest text-hud">AUTO_CALCULATED_PROGRESS</label>
                    <span className="text-2xl font-black italic font-chakra text-tactical">{challenge.progress}%</span>
                  </div>
                  <div className="relative h-2 bg-void border border-gunmetal">
                    <div className="h-full bg-tactical transition-all duration-300 relative" style={{ width: `${challenge.progress}%` }}>
                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-white opacity-50 animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Sub-challenges - Interactive */}
                <div className="space-y-4 pt-4">
                  <div className="text-xs font-black italic tracking-widest text-hud border-b border-gunmetal pb-2 mb-4">
                    <span>SUB_CHALLENGES</span>
                  </div>
                  <div className="space-y-2">
                    {subChallenges.map((sub) => (
                      <div
                        key={sub.id}
                        className={`p-4 border transition-all ${sub.status === 'completed' ? 'bg-terminal/5 border-terminal/30 text-terminal' : 'bg-void border-gunmetal text-hud'
                          }`}
                        style={{ clipPath: 'polygon(0 0, 98% 0, 100% 25%, 100% 100%, 2% 100%, 0 75%)' }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className={`text-sm font-bold uppercase tracking-widest ${sub.status === 'completed' ? '' : 'opacity-80'}`}>
                              {sub.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEditingSubChallenge(sub)}
                              className="p-1.5 text-dimmed hover:text-tactical transition-all"
                              title="Edit goal"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => startDeleteSubChallenge(sub)}
                              disabled={deletingSubChallenge === sub.id}
                              className="p-1.5 text-dimmed hover:text-hostile disabled:opacity-50 transition-all"
                              title="Delete goal"
                            >
                              {deletingSubChallenge === sub.id ? (
                                <div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </button>
                            {sub.status === 'completed' && <span className="text-[10px] font-black italic">VERIFIED</span>}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateSubProgress(sub.id, -1)}
                              disabled={sub.current_progress <= 0}
                              className="w-9 h-9 md:w-8 md:h-8 flex items-center justify-center border border-gunmetal hover:border-tactical hover:text-tactical transition-all"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="text-sm font-bold min-w-[60px] text-center">
                              {sub.current_progress}/{sub.target_limit}
                            </span>
                            <button
                              onClick={() => updateSubProgress(sub.id, 1)}
                              disabled={sub.current_progress >= sub.target_limit}
                              className="w-9 h-9 md:w-8 md:h-8 flex items-center justify-center border border-gunmetal hover:border-tactical hover:text-tactical transition-all"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-dimmed">
                              {Math.round((sub.current_progress / sub.target_limit) * 100)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => setShowQuickAdd(true)}
                      className="w-full p-4 border border-dashed border-tactical/60 text-tactical hover:border-tactical hover:bg-tactical/5 transition-all"
                      style={{ clipPath: 'polygon(0 0, 98% 0, 100% 25%, 100% 100%, 2% 100%, 0 75%)' }}
                    >
                      <div className="flex items-center justify-center gap-2 text-[11px] font-black italic tracking-widest uppercase">
                        <span>Add sub challenge</span>
                        <Plus size={13} />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Console & Results Panel */}
        <div className="space-y-6">
          <div className="bg-void border border-gunmetal p-4 md:p-6 space-y-6 md:space-y-8">
            <div className="text-center space-y-2">
              <div className="text-[10px] font-black text-dimmed tracking-[0.3em] uppercase">CHALLENGE_MANAGEMENT</div>
              <div className="h-px bg-gunmetal w-1/2 mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={activateChallenge}
                disabled={activatingChallenge || normalizedStatus === 'active'}
                className="flex flex-col items-center justify-center gap-2 md:gap-3 p-4 md:p-6 border border-tactical/30 bg-tactical/5 hover:bg-tactical hover:text-void transition-all text-tactical group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {activatingChallenge ? (
                  <div className="w-8 h-8 border border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Activity size={32} />
                )}
                <span className="text-[10px] font-black italic">
                  {activatingChallenge ? 'PROCESSING...' : 'Active'}
                </span>
              </button>
              <button
                onClick={completeChallenge}
                disabled={completingChallenge || normalizedStatus === 'completed'}
                className="flex flex-col items-center justify-center gap-2 md:gap-3 p-4 md:p-6 border border-terminal/30 bg-terminal/5 hover:bg-terminal hover:text-void transition-all text-terminal group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {completingChallenge ? (
                  <div className="w-8 h-8 border border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Trophy size={32} />
                )}
                <span className="text-[10px] font-black italic">
                  {completingChallenge ? 'PROCESSING...' : 'Completed'}
                </span>
              </button>
              <button
                onClick={failChallenge}
                disabled={failingChallenge || normalizedStatus === 'cancelled'}
                className="flex flex-col items-center justify-center gap-2 md:gap-3 p-4 md:p-6 border border-hostile/30 bg-hostile/5 hover:bg-hostile hover:text-white transition-all text-hostile disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {failingChallenge ? (
                  <div className="w-8 h-8 border border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Skull size={32} />
                )}
                <span className="text-[10px] font-black italic">
                  {failingChallenge ? 'PROCESSING...' : 'Failed'}
                </span>
              </button>
            </div>


          </div>


        </div>
      </div>

      {/* Quick Add Sub-Challenge Modal */}
      {showQuickAdd && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-armor border border-gunmetal p-8 max-w-md w-full tactical-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black italic text-hud">QUICK_SUB_CHALLENGE_INJECTION</h3>
              <button
                onClick={() => setShowQuickAdd(false)}
                className="text-dimmed hover:text-tactical transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-dimmed mb-2">OBJECTIVE_TITLE</label>
                <input
                  type="text"
                  value={newSubTitle}
                  onChange={(e) => setNewSubTitle(e.target.value)}
                  className="w-full bg-void border border-gunmetal p-3 text-hud placeholder-dimmed focus:border-tactical focus:outline-none"
                  placeholder="Enter sub-challenge title..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-dimmed mb-2">TARGET_LIMIT</label>
                <input
                  type="number"
                  min="1"
                  value={newSubTarget}
                  onChange={(e) => setNewSubTarget(parseInt(e.target.value) || 1)}
                  className="w-full bg-void border border-gunmetal p-3 text-hud focus:border-tactical focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowQuickAdd(false)}
                  className="flex-1 border border-gunmetal text-dimmed hover:text-hud transition-colors py-3"
                >
                  CANCEL
                </button>
                <button
                  onClick={addQuickSubChallenge}
                  disabled={!newSubTitle.trim() || newSubTarget < 1}
                  className="flex-1 bg-tactical border border-tactical text-void hover:bg-tactical/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all py-3"
                >
                  INJECT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sub-Challenge Modal */}
      {showEditSubModal && editingSubChallenge && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-armor border border-gunmetal p-8 max-w-md w-full tactical-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold italic tracking-widest text-tactical">EDIT_OBJECTIVE</h3>
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
                  value={editSubTitle}
                  onChange={(e) => setEditSubTitle(e.target.value)}
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
                  value={editSubDescription}
                  onChange={(e) => setEditSubDescription(e.target.value)}
                  className="w-full bg-void border border-tactical text-hud px-4 py-3 font-mono text-sm focus:outline-none focus:border-terminal resize-none"
                  placeholder="Goal description..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-chakra font-bold mb-2 text-hud">
                  TARGET_LIMIT
                </label>
                <input
                  type="number"
                  min="1"
                  value={editSubTargetLimit}
                  onChange={(e) => setEditSubTargetLimit(parseInt(e.target.value) || 1)}
                  className="w-full bg-void border border-tactical text-hud px-4 py-3 font-chakra font-bold focus:outline-none focus:border-terminal"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={cancelEditingSubChallenge}
                  className="flex-1 border border-gunmetal text-dimmed hover:text-hud transition-colors py-3"
                >
                  CANCEL
                </button>
                <button
                  onClick={saveSubChallengeEdit}
                  disabled={!editSubTitle.trim() || editSubTargetLimit < 1}
                  className="flex-1 bg-tactical border border-tactical text-void hover:bg-tactical/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all py-3 flex items-center justify-center gap-2"
                >
                  <Save size={16} /> UPDATE_OBJECTIVE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Sub-Challenge Modal */}
      {showDeleteSubModal && subChallengeToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-armor border border-gunmetal p-8 max-w-md w-full tactical-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold italic tracking-widest text-hostile">DELETE_OBJECTIVE</h3>
              <button
                onClick={cancelDeleteSubChallenge}
                className="p-2 text-dimmed hover:text-hostile"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-hud font-mono text-sm">
                Are you sure you want to delete the objective <span className="text-tactical font-bold">"{subChallengeToDelete.title}"</span>?
              </p>
              <p className="text-dimmed font-mono text-xs">
                This action cannot be undone. All progress data for this objective will be permanently removed.
              </p>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={cancelDeleteSubChallenge}
                  className="flex-1 border border-gunmetal text-dimmed hover:text-hud transition-colors py-3"
                >
                  CANCEL
                </button>
                <button
                  onClick={confirmDeleteSubChallenge}
                  className="flex-1 bg-hostile border border-hostile text-white hover:bg-hostile/90 transition-all py-3 flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} /> DELETE_OBJECTIVE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Challenge Modal */}
      {showEditChallengeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-armor border border-gunmetal p-8 max-w-lg w-full tactical-border">
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

              <div className="grid grid-cols-2 gap-4">
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
                  onClick={cancelEditChallenge}
                  className="flex-1 border border-gunmetal text-dimmed hover:text-hud transition-colors py-3"
                >
                  CANCEL
                </button>
                <button
                  onClick={updateChallenge}
                  disabled={!editChallengeTitle.trim() || updatingChallenge}
                  className="flex-1 bg-tactical border border-tactical text-void hover:bg-tactical/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all py-3 flex items-center justify-center gap-2"
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Challenge Modal */}
      {showDeleteChallengeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-armor border border-gunmetal p-8 max-w-md w-full tactical-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold italic tracking-widest text-hostile">DELETE_CHALLENGE</h3>
              <button
                onClick={cancelDeleteChallenge}
                className="p-2 text-dimmed hover:text-hostile"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-hud font-mono text-sm">
                Are you sure you want to delete the challenge <span className="text-tactical font-bold">"{challenge.title}"</span>?
              </p>
              <p className="text-dimmed font-mono text-xs">
                This action cannot be undone. All objectives, progress data, and challenge information will be permanently removed.
              </p>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={cancelDeleteChallenge}
                  className="flex-1 border border-gunmetal text-dimmed hover:text-hud transition-colors py-3"
                >
                  CANCEL
                </button>
                <button
                  onClick={confirmDeleteChallenge}
                  className="flex-1 bg-hostile border border-hostile text-white hover:bg-hostile/90 transition-all py-3 flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} /> DELETE_CHALLENGE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
