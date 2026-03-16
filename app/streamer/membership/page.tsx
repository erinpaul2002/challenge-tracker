'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MonitorPlay, Copy, ExternalLink, Users, LoaderCircle, Minus, Plus, Target, Palette, Upload, ImageOff } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useOverlayData } from '../overlay/hooks/useOverlayData';

type MembershipThemeName = "default";
type MembershipManagementTab = 'data' | 'themes';

const MEMBERSHIP_THEME_OPTIONS: Array<{ value: MembershipThemeName; label: string }> = [
  { value: 'default', label: 'Default' },
];

const MEMBERSHIP_THEME_PREVIEW: Record<MembershipThemeName, {
  cardBg: string;
  border: string;
  title: string;
  month: string;
  value: string;
  target: string;
  progressText: string;
  progressFill: string;
  progressTrack: string;
  streamer: string;
}> = {
  'default': {
    cardBg: '#0a0f13e8',
    border: '#2a3a48',
    title: '#e7eef5',
    month: '#99a9b8',
    value: '#ffffff',
    target: '#d7e4f1',
    progressText: '#bcd1e6',
    progressFill: '#5dc2ff',
    progressTrack: '#18232d',
    streamer: '#7f95a8',
  },
};

const MAX_UPLOAD_BYTES = 6 * 1024 * 1024; // 6MB

const formatMonthForThemeTitle = (monthKey: string): string => {
  const [year, month] = monthKey.split('-').map((value) => Number.parseInt(value, 10));
  if (!year || !month) return monthKey;

  const monthText = new Intl.DateTimeFormat(undefined, {
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)));

  return `${monthText}, ${year}`;
};

const getStreamerSessionToken = (): string | null => {
  if (typeof window === 'undefined') return null;

  const rawSession = localStorage.getItem('streamer_session');
  const cookieToken = document.cookie
    .split('; ')
    .find((row) => row.startsWith('streamer_session='))
    ?.split('=')[1];

  if (!rawSession) {
    return cookieToken ? decodeURIComponent(cookieToken) : null;
  }

  try {
    const parsed = JSON.parse(rawSession) as { session_token?: string; sessionToken?: string };
    return parsed.session_token ?? parsed.sessionToken ?? (cookieToken ? decodeURIComponent(cookieToken) : null);
  } catch {
    return rawSession;
  }
};

const formatMonthKey = (monthKey: string): string => {
  const [year, month] = monthKey.split('-').map((value) => Number.parseInt(value, 10));
  if (!year || !month) return monthKey;
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

type MembershipThemeColors = {
  cardBg: string;
  border: string;
  title: string;
  month: string;
  value: string;
  target: string;
  progressText: string;
  progressFill: string;
  progressTrack: string;
  streamer: string;
};

type MembershipCustomImageConfig = {
  cardBackgroundImageStorageId?: string;
  cardBackgroundImageUrl?: string;
  cardBackgroundImageOpacity?: number;
  cardBackgroundImageSize?: 'cover' | 'contain';
  cardBackgroundImagePosition?: string;
  cardBackgroundImageRepeat?: 'no-repeat' | 'repeat';
};

const DEFAULT_CUSTOM_IMAGE_CONFIG: MembershipCustomImageConfig = {
  cardBackgroundImageStorageId: '',
  cardBackgroundImageUrl: '',
  cardBackgroundImageOpacity: 100,
  cardBackgroundImageSize: 'cover',
  cardBackgroundImagePosition: 'center',
  cardBackgroundImageRepeat: 'no-repeat',
};

const MEMBERSHIP_COLOR_FIELDS: Array<{ key: keyof MembershipThemeColors; label: string }> = [
  { key: 'cardBg', label: 'Card Background' },
  { key: 'border', label: 'Card Border' },
  { key: 'title', label: 'Title Text' },
  { key: 'value', label: 'Current Value' },
  { key: 'target', label: 'Target Value' },
  { key: 'progressText', label: 'Progress Text' },
  { key: 'progressFill', label: 'Progress Fill' },
  { key: 'progressTrack', label: 'Progress Track' },
];

function renderMembershipThemeCard({
  colors,
  currentCount,
  targetCount,
  progress,
  monthLabel,
  customImage,
}: {
  colors: MembershipThemeColors;
  currentCount: number;
  targetCount: number;
  progress: number;
  monthLabel: string;
  customImage?: MembershipCustomImageConfig;
}) {
  const pct = Math.round(progress);
  const showImage = Boolean(customImage?.cardBackgroundImageUrl);

  return (
    <div className="relative min-h-[170px] overflow-hidden p-5 flex flex-col" style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}>
      {showImage && (
        <>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url(${customImage?.cardBackgroundImageUrl})`,
              backgroundSize: customImage?.cardBackgroundImageSize || 'cover',
              backgroundPosition: customImage?.cardBackgroundImagePosition || 'center',
              backgroundRepeat: customImage?.cardBackgroundImageRepeat || 'no-repeat',
              opacity: Math.max(0, Math.min(100, customImage?.cardBackgroundImageOpacity ?? 100)) / 100,
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(165deg, rgba(10,15,19,0.22) 0%, rgba(6,9,14,0.78) 100%)',
            }}
          />
        </>
      )}

      <div className="relative z-10 text-sm font-semibold tracking-wide" style={{ color: colors.title }}>
        Membership Goal : {monthLabel}
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl font-black leading-none" style={{ color: colors.value }}>
            {currentCount}
            <span className="mx-2 text-3xl font-semibold" style={{ color: colors.progressText }}>/</span>
            <span className="text-5xl font-bold" style={{ color: colors.target }}>{targetCount}</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 h-1" style={{ backgroundColor: colors.progressTrack }}>
        <div className="h-full" style={{ width: `${pct}%`, backgroundColor: colors.progressFill }} />
      </div>
    </div>
  );
}

export default function StreamerMembershipOverlayPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [copying, setCopying] = useState<'membership' | null>(null);
  const [generating, setGenerating] = useState(false);
  const [stepAmount, setStepAmount] = useState('1');
  const [targetInput, setTargetInput] = useState('0');
  const [isUpdatingCount, setIsUpdatingCount] = useState(false);
  const [isUpdatingTarget, setIsUpdatingTarget] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<MembershipThemeName>('default');
  const [activeManagementTab, setActiveManagementTab] = useState<MembershipManagementTab>('data');
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [themeFeedback, setThemeFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [editableColors, setEditableColors] = useState<MembershipThemeColors>(MEMBERSHIP_THEME_PREVIEW['default']);
  const [editableCustomImage, setEditableCustomImage] = useState<MembershipCustomImageConfig>(DEFAULT_CUSTOM_IMAGE_CONFIG);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  const { profile, loading, streamerId, generateOverlayToken: generateToken } = useOverlayData();
  const updateMembershipMutation = useMutation(api.memberships.updateMonthlyMembershipByStreamer);
  const saveMembershipOverlayConfigMutation = useMutation(api.memberships.saveMembershipOverlayConfig);
  const generateOverlayAssetUploadUrlMutation = useMutation(api.overlay.generateOverlayAssetUploadUrl);

  const membership = useQuery(
    api.memberships.getCurrentMembershipByStreamer,
    streamerId ? { streamerId } : 'skip'
  );

  const membershipOverlayConfig = useQuery(
    api.memberships.getMembershipOverlayConfig,
    streamerId ? { streamerId } : 'skip'
  );

  useEffect(() => {
    setSessionToken(getStreamerSessionToken());
  }, []);

  useEffect(() => {
    if (membership?.targetCount !== undefined) {
      setTargetInput(String(membership.targetCount));
    }
  }, [membership?.targetCount]);

  useEffect(() => {
    if (!feedback) return;
    const timeoutId = window.setTimeout(() => setFeedback(null), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  useEffect(() => {
    if (!themeFeedback) return;
    const timeoutId = window.setTimeout(() => setThemeFeedback(null), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [themeFeedback]);

  useEffect(() => {
    const theme = membershipOverlayConfig?.theme as MembershipThemeName | undefined;
    if (theme) {
      setSelectedTheme(theme);
    }
  }, [membershipOverlayConfig?.theme]);

  useEffect(() => {
    const colors = membershipOverlayConfig?.colors as Partial<MembershipThemeColors> | undefined;
    if (!colors) {
      setEditableColors(MEMBERSHIP_THEME_PREVIEW['default']);
      return;
    }

    setEditableColors({
      ...MEMBERSHIP_THEME_PREVIEW['default'],
      ...colors,
    });
  }, [membershipOverlayConfig?.colors]);

  useEffect(() => {
    const customImage = membershipOverlayConfig?.custom as MembershipCustomImageConfig | undefined;
    setEditableCustomImage({
      ...DEFAULT_CUSTOM_IMAGE_CONFIG,
      ...(customImage ?? {}),
    });
  }, [membershipOverlayConfig?.custom]);

  const membershipPath = profile?.overlay_token ? `/membership/${profile.overlay_token}` : '';

  const normalizedStepAmount = useMemo(() => {
    const parsed = Number.parseInt(stepAmount, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }, [stepAmount]);

  const normalizedTarget = useMemo(() => {
    const parsed = Number.parseInt(targetInput, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }, [targetInput]);

  const progressPercentage = useMemo(() => {
    if (!membership || membership.targetCount <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((membership.currentCount / membership.targetCount) * 100)));
  }, [membership]);

  const previewTheme = editableColors;
  const previewCurrentCount = membership?.currentCount ?? 17;
  const previewTargetCount = membership?.targetCount ?? 50;
  const previewMonthLabel = membership ? formatMonthForThemeTitle(membership.monthKey) : 'March, 2026';
  const previewProgress = previewTargetCount > 0
    ? Math.min(100, Math.max(0, Math.round((previewCurrentCount / previewTargetCount) * 100)))
    : 0;


  const handleGenerateToken = async () => {
    setGenerating(true);
    await generateToken();
    setGenerating(false);
  };

  const handleCopy = (type: 'membership', value: string) => {
    if (!value) return;

    navigator.clipboard.writeText(value);
    setCopying(type);
    setTimeout(() => setCopying(null), 1500);
  };

  const handleAdjustCount = async (direction: -1 | 1) => {
    if (!sessionToken || !membership || isUpdatingCount) return;

    setIsUpdatingCount(true);
    setFeedback(null);

    try {
      const result = await updateMembershipMutation({
        sessionToken,
        countDelta: direction * normalizedStepAmount,
      });

      setFeedback({
        type: 'success',
        message: `Count updated: ${result.currentCount}`,
      });
    } catch (error) {
      console.error('Failed to update membership count:', error);
      setFeedback({ type: 'error', message: 'Unable to update count right now.' });
    } finally {
      setIsUpdatingCount(false);
    }
  };

  const handleSaveTarget = async () => {
    if (!sessionToken || isUpdatingTarget) return;

    setIsUpdatingTarget(true);
    setFeedback(null);

    try {
      const result = await updateMembershipMutation({
        sessionToken,
        targetCount: normalizedTarget,
      });

      setFeedback({
        type: 'success',
        message: `Target saved: ${result.targetCount}`,
      });
    } catch (error) {
      console.error('Failed to update membership target:', error);
      setFeedback({ type: 'error', message: 'Unable to update target right now.' });
    } finally {
      setIsUpdatingTarget(false);
    }
  };

  const handleSaveTheme = async () => {
    if (!sessionToken || isSavingTheme) return;

    setIsSavingTheme(true);
    setThemeFeedback(null);

    try {
      await saveMembershipOverlayConfigMutation({
        sessionToken,
        config: {
          theme: selectedTheme,
          colors: editableColors,
          custom: editableCustomImage,
        },
      });

      setThemeFeedback({ type: 'success', message: `Theme saved: ${selectedTheme.toUpperCase()}` });
    } catch (error) {
      console.error('Failed to save membership overlay theme:', error);
      setThemeFeedback({ type: 'error', message: 'Unable to save theme right now.' });
    } finally {
      setIsSavingTheme(false);
    }
  };

  const handleColorChange = (key: keyof MembershipThemeColors, value: string) => {
    setEditableColors((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleUploadBackgroundImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setImageUploadError('Please upload a valid image file.');
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setImageUploadError('Image is too large. Please choose a file under 6MB.');
      return;
    }

    if (!streamerId) {
      setImageUploadError('Streamer not found. Please refresh and try again.');
      return;
    }

    setUploadingImage(true);
    setImageUploadError(null);

    try {
      const { uploadUrl } = await generateOverlayAssetUploadUrlMutation({ streamerId });
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image to storage');
      }

      const uploadResult = (await uploadResponse.json()) as { storageId?: string };
      if (!uploadResult.storageId) {
        throw new Error('Upload succeeded but storage id was missing');
      }

      const localPreviewUrl = URL.createObjectURL(file);
      setEditableCustomImage((prev) => ({
        ...prev,
        cardBackgroundImageStorageId: uploadResult.storageId,
        cardBackgroundImageUrl: localPreviewUrl,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload image';
      setImageUploadError(message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveBackgroundImage = () => {
    setEditableCustomImage((prev) => ({
      ...prev,
      cardBackgroundImageStorageId: '',
      cardBackgroundImageUrl: '',
    }));
    setImageUploadError(null);
  };

  const isMembershipLoading = Boolean(streamerId) && membership === undefined;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-mono">
      <div className="flex flex-col gap-3 border-b border-gunmetal pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 border border-tactical/30 bg-tactical/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-tactical">
            <Users size={12} />
            Membership Overlay
          </div>
          <p className="text-xs text-dimmed">
            Dedicated membership flow: manage monthly counts and copy OBS membership overlay link.
          </p>
        </div>
      </div>

      <div className="bg-armor border border-gunmetal p-6 tactical-border relative overflow-hidden space-y-5">
        {!profile?.overlay_token ? (
          <button
            onClick={handleGenerateToken}
            disabled={loading || generating}
            className="btn-tactical py-3 px-5 text-xs disabled:opacity-50"
          >
            {generating ? 'GENERATING_TOKEN...' : 'GENERATE_OVERLAY_TOKEN'}
          </button>
        ) : (
          <>
            <div className="space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-optic inline-flex items-center gap-2">
                <MonitorPlay size={16} /> Membership Overlay Link
              </h3>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-void border border-gunmetal px-3 py-2 truncate font-mono text-xs text-hud/80">
                  {membershipPath}
                </div>
                <button
                  onClick={() => handleCopy('membership', membershipPath)}
                  className={`p-2 border transition-all ${copying === 'membership' ? 'bg-tactical text-void border-tactical' : 'bg-armor border-gunmetal hover:bg-tactical hover:text-void'}`}
                  title="Copy membership overlay link"
                >
                  <Copy size={14} />
                </button>
                <a
                  href={membershipPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-armor hover:bg-optic hover:text-void transition-all border border-gunmetal"
                  title="Open membership overlay"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="border border-gunmetal bg-armor p-5 md:p-6 shadow-2xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-gunmetal pb-4">
          <div className="inline-flex items-center gap-2 border border-tactical/30 bg-tactical/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-tactical">
            <Users size={12} />
            Membership Management
          </div>

          {membership && (
            <div className="border border-gunmetal bg-void px-3 py-2 text-right">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-dimmed">Cycle</div>
              <div className="text-sm font-black italic text-hud">{formatMonthKey(membership.monthKey)}</div>
            </div>
          )}
        </div>

        <div className="mb-5 flex gap-2 border-b border-gunmetal pb-4">
          <button
            onClick={() => setActiveManagementTab('data')}
            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] border transition-colors ${
              activeManagementTab === 'data'
                ? 'border-tactical bg-tactical/10 text-tactical'
                : 'border-gunmetal bg-void text-dimmed hover:text-hud'
            }`}
          >
            DATA_UPDATE
          </button>
          <button
            onClick={() => setActiveManagementTab('themes')}
            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] border transition-colors ${
              activeManagementTab === 'themes'
                ? 'border-tactical bg-tactical/10 text-tactical'
                : 'border-gunmetal bg-void text-dimmed hover:text-hud'
            }`}
          >
            THEME_MANAGEMENT
          </button>
        </div>

        {isMembershipLoading ? (
          <div className="flex min-h-36 items-center justify-center gap-3 text-sm font-bold text-dimmed">
            <LoaderCircle size={18} className="animate-spin" />
            Loading membership data...
          </div>
        ) : !sessionToken ? (
          <div className="border border-hostile/30 bg-hostile/5 px-4 py-5 text-sm text-hostile">
            Streamer session unavailable. Please sign in again to manage membership data.
          </div>
        ) : !membership ? (
          <div className="border border-gunmetal bg-void px-4 py-5 text-sm text-dimmed">
            No membership data found yet.
          </div>
        ) : (
          <div className="space-y-5">
            {activeManagementTab === 'data' ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="border border-gunmetal bg-void p-4">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-dimmed">Current Count</div>
                    <div className="mt-2 text-3xl font-black italic text-hud">{membership.currentCount}</div>
                  </div>
                  <div className="border border-gunmetal bg-void p-4">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-dimmed">Monthly Target</div>
                    <div className="mt-2 text-3xl font-black italic text-hud">{membership.targetCount}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-dimmed">
                    <span>Progress</span>
                    <span className="text-tactical">{progressPercentage}%</span>
                  </div>
                  <div className="h-4 overflow-hidden border border-gunmetal bg-void">
                    <div
                      className="h-full bg-gradient-to-r from-tactical via-terminal to-tactical transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-[1fr_180px_1fr] md:items-end">
                  <button
                    onClick={() => handleAdjustCount(-1)}
                    disabled={isUpdatingCount || membership.currentCount <= 0}
                    className="flex h-16 items-center justify-center gap-3 border border-gunmetal bg-armor text-lg font-black text-hud transition-all hover:border-tactical hover:text-tactical disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isUpdatingCount ? <LoaderCircle size={20} className="animate-spin" /> : <Minus size={20} />}
                    <span>DECREMENT</span>
                  </button>

                  <div className="space-y-2 text-center">
                    <label className="block text-[10px] font-bold uppercase tracking-[0.22em] text-dimmed">
                      Step amount
                    </label>
                    <input
                      type="number"
                      min="1"
                      inputMode="numeric"
                      value={stepAmount}
                      onChange={(event) => setStepAmount(event.target.value)}
                      onBlur={() => setStepAmount(String(normalizedStepAmount))}
                      className="h-16 w-full border border-tactical bg-void px-4 text-center text-2xl font-black italic text-hud outline-none transition-colors focus:border-terminal"
                    />
                  </div>

                  <button
                    onClick={() => handleAdjustCount(1)}
                    disabled={isUpdatingCount}
                    className="flex h-16 items-center justify-center gap-3 border border-gunmetal bg-armor text-lg font-black text-hud transition-all hover:border-tactical hover:text-tactical disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isUpdatingCount ? <LoaderCircle size={20} className="animate-spin" /> : <Plus size={20} />}
                    <span>INCREMENT</span>
                  </button>
                </div>

                <div className="border border-gunmetal bg-void p-4">
                  <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-dimmed">
                    <Target size={12} />
                    Update Monthly Target
                  </div>
                  <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={targetInput}
                      onChange={(event) => setTargetInput(event.target.value)}
                      onBlur={() => setTargetInput(String(normalizedTarget))}
                      className="h-12 w-full border border-gunmetal bg-armor px-4 text-lg font-black italic text-hud outline-none transition-colors focus:border-tactical"
                    />
                    <button
                      onClick={handleSaveTarget}
                      disabled={isUpdatingTarget}
                      className="btn-tactical h-12 px-6 text-[10px] uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isUpdatingTarget ? 'SAVING...' : 'SAVE_TARGET'}
                    </button>
                  </div>
                </div>

                {feedback && (
                  <div
                    className={`border px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] ${
                      feedback.type === 'success'
                        ? 'border-terminal/40 bg-terminal/10 text-terminal'
                        : 'border-hostile/40 bg-hostile/10 text-hostile'
                    }`}
                  >
                    {feedback.message}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
                  <div className="space-y-3">
                    <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                      <select
                        value={selectedTheme}
                        onChange={(event) => setSelectedTheme(event.target.value as MembershipThemeName)}
                        className="h-12 w-full border border-gunmetal bg-void px-4 text-sm font-black text-hud outline-none transition-colors focus:border-tactical"
                      >
                        {MEMBERSHIP_THEME_OPTIONS.map((theme) => (
                          <option key={theme.value} value={theme.value}>
                            {theme.label}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={handleSaveTheme}
                        disabled={isSavingTheme || !sessionToken}
                        className="btn-tactical h-12 px-6 text-[10px] uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSavingTheme ? 'SAVING...' : 'SAVE_THEME'}
                      </button>
                    </div>

                    <div className="border border-gunmetal bg-void/70 p-3">
                      <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-dimmed">
                        Card color controls
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        {MEMBERSHIP_COLOR_FIELDS.map((field) => (
                          <label key={field.key} className="grid grid-cols-[1fr_96px] items-center gap-3">
                            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-dimmed">{field.label}</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={editableColors[field.key]}
                                onChange={(event) => handleColorChange(field.key, event.target.value)}
                                className="h-9 w-10 cursor-pointer border border-gunmetal bg-transparent p-0"
                              />
                              <input
                                type="text"
                                value={editableColors[field.key]}
                                onChange={(event) => handleColorChange(field.key, event.target.value)}
                                className="h-9 w-full border border-gunmetal bg-armor px-2 text-[11px] font-bold uppercase tracking-[0.08em] text-hud outline-none transition-colors focus:border-tactical"
                                placeholder="#FFFFFF"
                              />
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="border border-gunmetal bg-void/70 p-3 space-y-3">
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-dimmed">
                        Card background image
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              void handleUploadBackgroundImage(file);
                            }
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isSavingTheme || uploadingImage || !streamerId}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold font-mono uppercase tracking-wider border border-gunmetal bg-void hover:bg-gunmetal/20 text-dimmed hover:text-hud transition-colors disabled:opacity-50"
                        >
                          <Upload size={11} />
                          {uploadingImage
                            ? 'Uploading...'
                            : editableCustomImage.cardBackgroundImageUrl
                              ? 'Replace Image'
                              : 'Upload Image'}
                        </button>

                        {editableCustomImage.cardBackgroundImageUrl && (
                          <button
                            type="button"
                            onClick={handleRemoveBackgroundImage}
                            disabled={isSavingTheme || uploadingImage}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold font-mono uppercase tracking-wider border border-gunmetal bg-void hover:bg-red-500/10 text-dimmed hover:text-red-300 transition-colors disabled:opacity-50"
                          >
                            <ImageOff size={11} />
                            Remove
                          </button>
                        )}
                      </div>

                      {imageUploadError && (
                        <div className="text-[10px] text-red-400 font-mono">✗ {imageUploadError}</div>
                      )}

                      {editableCustomImage.cardBackgroundImageUrl && (
                        <div className="grid gap-3 md:grid-cols-3">
                          <label className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-dimmed">Opacity</span>
                            <input
                              type="range"
                              min={10}
                              max={100}
                              step={5}
                              value={editableCustomImage.cardBackgroundImageOpacity ?? 100}
                              onChange={(event) => {
                                const value = Number(event.target.value);
                                setEditableCustomImage((previous) => ({
                                  ...previous,
                                  cardBackgroundImageOpacity: value,
                                }));
                              }}
                              className="w-full h-1.5 bg-gunmetal rounded-full appearance-none cursor-pointer accent-tactical"
                            />
                          </label>

                          <label className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-dimmed">Image Fit</span>
                            <select
                              value={editableCustomImage.cardBackgroundImageSize || 'cover'}
                              onChange={(event) => {
                                setEditableCustomImage((previous) => ({
                                  ...previous,
                                  cardBackgroundImageSize: event.target.value as 'cover' | 'contain',
                                }));
                              }}
                              className="h-9 w-full border border-gunmetal bg-armor px-2 text-[11px] font-bold uppercase tracking-[0.08em] text-hud outline-none transition-colors focus:border-tactical"
                            >
                              <option value="cover">Cover</option>
                              <option value="contain">Contain</option>
                            </select>
                          </label>

                          <label className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-dimmed">Image Repeat</span>
                            <select
                              value={editableCustomImage.cardBackgroundImageRepeat || 'no-repeat'}
                              onChange={(event) => {
                                setEditableCustomImage((previous) => ({
                                  ...previous,
                                  cardBackgroundImageRepeat: event.target.value as 'no-repeat' | 'repeat',
                                }));
                              }}
                              className="h-9 w-full border border-gunmetal bg-armor px-2 text-[11px] font-bold uppercase tracking-[0.08em] text-hud outline-none transition-colors focus:border-tactical"
                            >
                              <option value="no-repeat">No repeat</option>
                              <option value="repeat">Repeat</option>
                            </select>
                          </label>
                        </div>
                      )}
                    </div>

                    {themeFeedback && (
                      <div
                        className={`border px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] ${
                          themeFeedback.type === 'success'
                            ? 'border-terminal/40 bg-terminal/10 text-terminal'
                            : 'border-hostile/40 bg-hostile/10 text-hostile'
                        }`}
                      >
                        {themeFeedback.message}
                      </div>
                    )}
                  </div>

                  <div className="border border-gunmetal bg-void p-4">
                    <div className="mb-3 inline-flex items-center gap-2 border border-tactical/30 bg-tactical/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-tactical">
                      <Palette size={12} />
                      Theme Preview
                    </div>

                    <div
                      className="border shadow-[0_0_16px_rgba(0,0,0,0.35)]"
                      style={{
                        borderColor: previewTheme.border,
                        backgroundColor: previewTheme.cardBg,
                      }}
                    >
                      {renderMembershipThemeCard({
                        colors: previewTheme,
                        currentCount: previewCurrentCount,
                        targetCount: previewTargetCount,
                        progress: previewProgress,
                        monthLabel: previewMonthLabel,
                        customImage: editableCustomImage,
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
