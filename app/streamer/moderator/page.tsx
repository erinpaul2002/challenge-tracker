'use client';

import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  Key,
  Trash2,
  RefreshCw,
  Search
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAction, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useAuthStore } from '@/stores/authStore';

interface Moderator {
  id: string;
  password: string;
  streamer_id: string;
  created_at: string;
  updated_at: string;
  name?: string;
  email?: string;
  active?: boolean;
  challenges_managed?: number;
}

function normalizeModeratorId(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (value && typeof value === 'object') {
    const maybeId = (value as { moderatorId?: unknown; _id?: unknown; id?: unknown }).moderatorId
      ?? (value as { _id?: unknown })._id
      ?? (value as { id?: unknown }).id;

    if (typeof maybeId === 'string') {
      return maybeId;
    }
  }

  return '';
}

export default function ModeratorPage() {
  const { user, profile, hydrated } = useAuthStore();
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    password: ''
  });
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [passwordResetModal, setPasswordResetModal] = useState<{
    isOpen: boolean;
    moderatorId: string | null;
    moderatorName: string;
  }>({
    isOpen: false,
    moderatorId: null,
    moderatorName: '',
  });
  const [passwordResetForm, setPasswordResetForm] = useState({
    password: '',
    confirmPassword: '',
  });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    moderatorId: string | null;
    moderatorName: string;
  }>({
    isOpen: false,
    moderatorId: null,
    moderatorName: '',
  });

  const streamerEmail = user?.email ?? profile?.email;
  const streamer = useQuery(
    api.auth.getStreamerByEmail,
    streamerEmail ? { email: streamerEmail } : 'skip'
  );
  const moderatorsQuery = useQuery(
    api.moderators.getModerators,
    streamer?._id ? { streamerId: streamer._id } : 'skip'
  );
  const createModeratorAction = useAction(api.moderators.createModerator);
  const updateModeratorAction = useAction(api.moderators.updateModerator);
  const deleteModeratorMutation = useMutation(api.moderators.deleteModerator);

  useEffect(() => {
    if (moderatorsQuery === undefined) {
      setLoading(true);
      return;
    }

    setModerators(
      moderatorsQuery.map((mod: {
        _id: string;
        streamerId: string;
        _creationTime: number;
        name?: string;
        active?: boolean;
        challengesManaged?: number;
      }) => ({
        id: normalizeModeratorId(mod._id),
        password: '',
        streamer_id: mod.streamerId,
        created_at: new Date(mod._creationTime).toISOString(),
        updated_at: new Date(mod._creationTime).toISOString(),
        name: mod.name,
        active: mod.active,
        challenges_managed: mod.challengesManaged,
      }))
    );
    setLoading(false);
    setError(null);
  }, [moderatorsQuery]);

  useEffect(() => {
    if (!hydrated) {
      setLoading(true);
      setError(null);
      return;
    }

    if (!streamerEmail) {
      setError('Unable to resolve logged-in streamer account');
      setLoading(false);
      return;
    }

    if (streamer === undefined) {
      setLoading(true);
      return;
    }

    if (streamer === null) {
      setError('Streamer profile not found in Convex');
      setLoading(false);
      return;
    }

    setError(null);
  }, [hydrated, streamer, streamerEmail]);

  const handleDeleteModerator = (moderatorId: string, moderatorName: string) => {
    setDeleteModal({
      isOpen: true,
      moderatorId,
      moderatorName,
    });
  };

  const handleDeleteConfirm = async () => {
    const moderatorId = deleteModal.moderatorId;
    if (!moderatorId) return;

    setActionLoading(moderatorId);
    setError(null);

    try {
      await deleteModeratorMutation({
        moderatorId: moderatorId as Id<'moderators'>,
      });

      setModerators(prev => prev.filter(mod => mod.id !== moderatorId));
      setDeleteModal({
        isOpen: false,
        moderatorId: null,
        moderatorName: '',
      });
    } catch (err) {
      setError('Failed to delete moderator');
      console.error('Error deleting moderator:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = (moderatorId: string, moderatorName: string) => {
    setPasswordResetModal({
      isOpen: true,
      moderatorId,
      moderatorName,
    });
    setPasswordResetForm({
      password: '',
      confirmPassword: '',
    });
  };

  const handlePasswordResetSubmit = async () => {
    const { password, confirmPassword } = passwordResetForm;

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setActionLoading(passwordResetModal.moderatorId);
    setError(null);

    try {
      await updateModeratorAction({
        moderatorId: passwordResetModal.moderatorId as Id<'moderators'>,
        password,
      });

      setPasswordResetModal({
        isOpen: false,
        moderatorId: null,
        moderatorName: '',
      });
      setPasswordResetForm({
        password: '',
        confirmPassword: '',
      });
      alert('Password reset successfully.');
    } catch (err) {
      setError('Failed to reset password');
      console.error('Error resetting password:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (moderatorId: string, currentActive: boolean) => {
    setActionLoading(moderatorId);
    setError(null);

    try {
      await updateModeratorAction({
        moderatorId: moderatorId as Id<'moderators'>,
        active: !currentActive,
      });

      setModerators(prev => prev.map(mod =>
        mod.id === moderatorId
          ? { ...mod, active: !currentActive }
          : mod
      ));
    } catch (err) {
      setError('Failed to update moderator status');
      console.error('Error updating moderator status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateModerator = async () => {
    if (!streamer?._id) {
      setError('Streamer account not found');
      return;
    }

    if (!createForm.password.trim()) {
      setError('Password is required');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const createResult = await createModeratorAction({
        streamerId: streamer._id,
        name: createForm.name.trim(),
        password: createForm.password.trim(),
      });

      const moderatorId = normalizeModeratorId(createResult);

      if (!moderatorId) {
        throw new Error('Invalid moderator id returned from create action');
      }

      setModerators([
        {
          id: moderatorId,
          password: createForm.password.trim(),
          streamer_id: streamer._id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          name: createForm.name.trim(),
          active: true,
          challenges_managed: 0,
        },
      ]);
      setIsCreating(false);
      setCreateForm({ name: '', password: '' });
    } catch (err) {
      setError('Failed to create moderator');
      console.error('Error creating moderator:', err);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gunmetal pb-6">
          <div>
            <h1 className="text-xl md:text-3xl font-black italic tracking-tighter">
              MODERATOR_MANAGEMENT
            </h1>
            <p className="text-dimmed text-xs font-mono tracking-widest mt-1">LOADING_MODERATORS...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-armor border border-gunmetal p-4 animate-pulse">
                <div className="h-4 bg-gunmetal rounded mb-2"></div>
                <div className="h-6 bg-gunmetal rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gunmetal pb-6">
          <div>
            <h1 className="text-xl md:text-3xl font-black italic tracking-tighter">
              MODERATOR_MANAGEMENT
            </h1>
            <p className="text-dimmed text-xs font-mono tracking-widest mt-1">ERROR_LOADING_MODERATORS</p>
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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gunmetal pb-6">
        <div>
          <h1 className="text-xl md:text-3xl font-black italic tracking-tighter">
            MODERATOR_MANAGEMENT
          </h1>
          <p className="text-dimmed text-xs font-mono tracking-widest mt-1">AUTHORIZED_MODERATORS: {moderators.length} | MODERATOR_ACCESS</p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          disabled={moderators.length > 0}
          className="btn-tactical flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <UserPlus size={18} />
          {moderators.length > 0 ? 'MODERATOR_ACTIVE' : 'ADD_NEW_MODERATOR'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Moderator List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-gunmetal pb-2">
            <h3 className="text-lg font-bold italic inline-flex items-center gap-2 text-hud">
              <Users size={18} className="text-tactical" />
              ACTIVE_MODERATORS
            </h3>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-dimmed" size={12} />
              <input
                type="text"
                placeholder="SEARCH_BY_ID..."
                className="bg-void border border-gunmetal pl-7 pr-3 py-1 text-[10px] font-mono focus:border-tactical outline-none"
              />
            </div>
          </div>

          <div className="space-y-3">
            {moderators.map((mod) => (
              <div
                key={mod.id}
                className={`bg-armor border border-gunmetal p-4 hover:border-tactical/50 transition-all flex items-center justify-between group relative`}
                style={{ clipPath: 'polygon(0 0, 98% 0, 100% 15%, 100% 100%, 2% 100%, 0 85%)' }}
              >
                <div className="flex items-center gap-3 md:gap-5">
                  <div className={`w-12 h-12 flex items-center justify-center border ${mod.active ? 'border-terminal text-terminal bg-terminal/5' : 'border-gunmetal text-dimmed bg-void'}`}>
                    <Shield size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="font-chakra font-black text-lg italic tracking-tight uppercase">{mod.name || 'Unknown'}</h4>
                      <span className={`px-2 py-0.5 text-[8px] font-black font-mono tracking-widest ${mod.active ? 'bg-terminal/20 text-terminal' : 'bg-gunmetal text-dimmed'}`}>
                        {mod.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-[10px] text-dimmed font-mono uppercase">ID: {String(mod.id).slice(0, 8)}</span>
                      <span className="text-[10px] text-dimmed font-mono uppercase">CHALLENGES: {mod.challenges_managed || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleResetPassword(mod.id, mod.name || 'Unknown')}
                    disabled={actionLoading === mod.id}
                    className="p-2 text-dimmed hover:text-tactical transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Reset Password"
                  >
                    <Key size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteModerator(mod.id, mod.name || 'Unknown')}
                    disabled={actionLoading === mod.id}
                    className="p-2 text-dimmed hover:text-hostile transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete Moderator"
                  >
                    <Trash2 size={18} />
                  </button>
                  <div className="h-4 w-px bg-gunmetal mx-1"></div>
                  <button
                    onClick={() => handleToggleActive(mod.id, mod.active || false)}
                    disabled={actionLoading === mod.id}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-tactical focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${mod.active ? 'bg-tactical' : 'bg-gunmetal'
                      }`}
                    title={mod.active ? "Deactivate Moderator" : "Activate Moderator"}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-void transition-transform ${mod.active ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>


      </div>

      {/* New Moderator Overlay (Simple Mock) */}
      {isCreating && (
        <div className="fixed inset-0 bg-void/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-armor border border-tactical w-full max-w-md p-8 tactical-border relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsCreating(false)}
              className="absolute top-4 right-4 text-dimmed hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-black italic tracking-tighter mb-6 flex items-center gap-2">
              <UserPlus className="text-tactical" /> ADD_MODERATOR
            </h2>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-dimmed uppercase tracking-widest">MODERATOR_NAME</label>
                <input
                  type="text"
                  className="w-full input-tactical py-4"
                  placeholder="ENTER_UNIQUE_NAME..."
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-dimmed uppercase tracking-widest">ACCESS_CODE / PASSWORD</label>
                <input
                  type="password"
                  className="w-full input-tactical py-4"
                  placeholder="••••••••••••"
                  value={createForm.password}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
              <div className="pt-4 flex gap-4">
                <button
                  onClick={handleCreateModerator}
                  disabled={creating}
                  className="flex-1 btn-tactical py-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      CREATING...
                    </>
                  ) : (
                    'CONFIRM_ADDITION'
                  )}
                </button>
                <button
                  onClick={() => setIsCreating(false)}
                  disabled={creating}
                  className="px-6 bg-void border border-gunmetal text-dimmed hover:text-hud transition-colors font-chakra font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {passwordResetModal.isOpen && (
        <div className="fixed inset-0 bg-void/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-armor border border-tactical w-full max-w-md p-8 tactical-border relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setPasswordResetModal({ isOpen: false, moderatorId: null, moderatorName: '' })}
              className="absolute top-4 right-4 text-dimmed hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-black italic tracking-tighter mb-6 flex items-center gap-2">
              <Key className="text-tactical" /> RESET_ACCESS_CODE
            </h2>

            <div className="mb-4 p-3 bg-void/50 border border-gunmetal rounded">
              <p className="text-sm text-dimmed">
                Resetting password for: <span className="text-tactical font-mono">{passwordResetModal.moderatorName}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-dimmed uppercase tracking-widest">NEW_ACCESS_CODE</label>
                <input
                  type="password"
                  className="w-full input-tactical py-4"
                  placeholder="••••••••••••"
                  value={passwordResetForm.password}
                  onChange={(e) => setPasswordResetForm(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-dimmed uppercase tracking-widest">CONFIRM_ACCESS_CODE</label>
                <input
                  type="password"
                  className="w-full input-tactical py-4"
                  placeholder="••••••••••••"
                  value={passwordResetForm.confirmPassword}
                  onChange={(e) => setPasswordResetForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </div>
              <div className="pt-4 flex gap-4">
                <button
                  onClick={handlePasswordResetSubmit}
                  disabled={actionLoading === passwordResetModal.moderatorId}
                  className="flex-1 btn-tactical py-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {actionLoading === passwordResetModal.moderatorId ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      RESETTING...
                    </>
                  ) : (
                    'CONFIRM_RESET'
                  )}
                </button>
                <button
                  onClick={() => setPasswordResetModal({ isOpen: false, moderatorId: null, moderatorName: '' })}
                  disabled={actionLoading === passwordResetModal.moderatorId}
                  className="px-6 bg-void border border-gunmetal text-dimmed hover:text-hud transition-colors font-chakra font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-void/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-armor border border-hostile w-full max-w-md p-8 tactical-border relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setDeleteModal({ isOpen: false, moderatorId: null, moderatorName: '' })}
              className="absolute top-4 right-4 text-dimmed hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-black italic tracking-tighter mb-6 flex items-center gap-2">
              <Trash2 className="text-hostile" /> REMOVE_MODERATOR
            </h2>

            <div className="mb-6 p-4 bg-hostile/10 border border-hostile/30 rounded">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-hostile/20 flex items-center justify-center">
                  <ShieldAlert size={16} className="text-hostile" />
                </div>
                <h3 className="text-lg font-bold text-hostile">DELETION_WARNING</h3>
              </div>
              <p className="text-sm text-dimmed leading-relaxed">
                You are about to permanently remove moderator <span className="text-tactical font-mono font-bold">{deleteModal.moderatorName}</span> from the system.
              </p>
              <p className="text-sm text-dimmed leading-relaxed mt-2">
                This action cannot be undone and will revoke all access privileges immediately.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-void/50 border border-gunmetal rounded">
                <input
                  type="checkbox"
                  id="confirm-delete"
                  className="w-4 h-4 text-tactical bg-void border-gunmetal rounded focus:ring-tactical focus:ring-2"
                />
                <label htmlFor="confirm-delete" className="text-sm text-dimmed">
                  I understand this action is irreversible
                </label>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  onClick={handleDeleteConfirm}
                  disabled={actionLoading === deleteModal.moderatorId}
                  className="flex-1 bg-hostile border border-hostile text-void py-4 font-chakra font-bold text-sm tracking-[0.2em] hover:bg-hostile/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {actionLoading === deleteModal.moderatorId ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      TERMINATING...
                    </>
                  ) : (
                    'CONFIRM_TERMINATION'
                  )}
                </button>
                <button
                  onClick={() => setDeleteModal({ isOpen: false, moderatorId: null, moderatorName: '' })}
                  disabled={actionLoading === deleteModal.moderatorId}
                  className="px-6 bg-void border border-gunmetal text-dimmed hover:text-hud transition-colors font-chakra font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function X({ size }: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}
