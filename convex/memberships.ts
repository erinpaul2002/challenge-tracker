import { v } from "convex/values";
import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { validateSessionToken } from "./auth";

type MembershipThemeName = "default";

type MembershipOverlayConfig = {
  theme: MembershipThemeName;
  layout: {
    position: "bottom-left" | "bottom-right" | "top-left" | "top-right";
    width: number;
    padding: number;
  };
  colors: {
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
  custom?: {
    cardBackgroundImageStorageId?: string;
    cardBackgroundImageUrl?: string;
    cardBackgroundImageOpacity?: number;
    cardBackgroundImageSize?: "cover" | "contain";
    cardBackgroundImagePosition?: string;
    cardBackgroundImageRepeat?: "no-repeat" | "repeat";
  };
};

type MembershipOverlayConfigWithCustomImage = {
  custom?: {
    cardBackgroundImageStorageId?: string;
    cardBackgroundImageUrl?: string;
  };
};

const getCardBackgroundImageStorageId = (
  config: unknown
): Id<"_storage"> | null => {
  if (!config || typeof config !== "object") return null;

  const storageId =
    (config as MembershipOverlayConfigWithCustomImage).custom
      ?.cardBackgroundImageStorageId;

  if (typeof storageId !== "string" || storageId.trim().length === 0) {
    return null;
  }

  return storageId as Id<"_storage">;
};

const resolveMembershipConfigAssetUrls = async (
  ctx: { storage: { getUrl: (id: Id<"_storage">) => Promise<string | null> } },
  config: MembershipOverlayConfig
) => {
  const storageId = getCardBackgroundImageStorageId(config);
  if (!storageId) return config;

  const signedUrl = await ctx.storage.getUrl(storageId);

  return {
    ...config,
    custom: {
      ...config.custom,
      cardBackgroundImageUrl:
        signedUrl ?? config.custom?.cardBackgroundImageUrl ?? "",
    },
  };
};

const sanitizeMembershipConfigForSave = (
  config: MembershipOverlayConfig
): MembershipOverlayConfig => {
  const custom = config.custom;
  if (!custom) return config;

  if (custom.cardBackgroundImageStorageId) {
    const restCustom = { ...custom };
    delete restCustom.cardBackgroundImageUrl;
    return {
      ...config,
      custom: restCustom,
    };
  }

  return config;
};

const MEMBERSHIP_THEME_PRESETS: Record<MembershipThemeName, MembershipOverlayConfig> = {
  "default": {
    theme: "default",
    layout: { position: "bottom-left", width: 460, padding: 24 },
    colors: {
      cardBg: "#0a0f13e8",
      border: "#2a3a48",
      title: "#e7eef5",
      month: "#99a9b8",
      value: "#ffffff",
      target: "#d7e4f1",
      progressText: "#bcd1e6",
      progressFill: "#5dc2ff",
      progressTrack: "#18232d",
      streamer: "#7f95a8",
    },
  },
};

const DEFAULT_MEMBERSHIP_CONFIG = MEMBERSHIP_THEME_PRESETS["default"];

const mergeMembershipConfig = (
  raw: Partial<MembershipOverlayConfig> | null | undefined
): MembershipOverlayConfig => {
  if (!raw) {
    return {
      ...DEFAULT_MEMBERSHIP_CONFIG,
      layout: { ...DEFAULT_MEMBERSHIP_CONFIG.layout },
      colors: { ...DEFAULT_MEMBERSHIP_CONFIG.colors },
      custom: {
        cardBackgroundImageUrl: "",
        cardBackgroundImageOpacity: 100,
        cardBackgroundImageSize: "cover",
        cardBackgroundImagePosition: "center",
        cardBackgroundImageRepeat: "no-repeat",
      },
    };
  }

  const theme =
    raw.theme && raw.theme in MEMBERSHIP_THEME_PRESETS
      ? (raw.theme as MembershipThemeName)
      : "default";

  const themedDefaults = MEMBERSHIP_THEME_PRESETS[theme];

  return {
    theme,
    layout: {
      ...themedDefaults.layout,
      ...(raw.layout ?? {}),
    },
    colors: {
      ...themedDefaults.colors,
      ...(raw.colors ?? {}),
    },
    custom: {
      cardBackgroundImageUrl: "",
      cardBackgroundImageOpacity: 100,
      cardBackgroundImageSize: "cover",
      cardBackgroundImagePosition: "center",
      cardBackgroundImageRepeat: "no-repeat",
      ...(raw.custom ?? {}),
    },
  };
};

const getCurrentMonthKey = (timestamp = Date.now()): string => {
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const normalizeCount = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
};

const getCurrentMembershipState = async (
  ctx: QueryCtx | MutationCtx,
  streamerId: Id<"streamers">,
  now: number
) => {
  const monthKey = getCurrentMonthKey(now);

  const currentMonthRecord = await ctx.db
    .query("membershipCounters")
    .withIndex("by_streamerId_monthKey", (q) =>
      q.eq("streamerId", streamerId).eq("monthKey", monthKey)
    )
    .unique();

  if (currentMonthRecord) {
    return {
      monthKey,
      currentCount: currentMonthRecord.currentCount,
      targetCount: currentMonthRecord.targetCount,
      recordId: currentMonthRecord._id,
    };
  }

  const history = await ctx.db
    .query("membershipCounters")
    .withIndex("by_streamerId", (q) => q.eq("streamerId", streamerId))
    .order("desc")
    .collect();

  const latest = history[0];

  return {
    monthKey,
    currentCount: 0,
    targetCount: latest?.targetCount ?? 0,
    recordId: null,
  };
};

// ── Public: membership data for overlay by overlay token ─────────────
export const getMembershipByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const streamer = await ctx.db
      .query("streamers")
      .withIndex("by_overlayToken", (q) => q.eq("overlayToken", args.token))
      .unique();

    if (!streamer) {
      return null;
    }

    const now = Date.now();
    const state = await getCurrentMembershipState(ctx, streamer._id, now);

    return {
      streamerId: streamer._id,
      streamerName: streamer.channelName || streamer.name,
      monthKey: state.monthKey,
      currentCount: state.currentCount,
      targetCount: state.targetCount,
      updatedAt: now,
    };
  },
});

// ── Public: membership overlay config by token (separate theme system) ──
export const getMembershipOverlayConfigByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const streamer = await ctx.db
      .query("streamers")
      .withIndex("by_overlayToken", (q) => q.eq("overlayToken", args.token))
      .unique();

    if (!streamer) {
      return null;
    }

    const existing = await ctx.db
      .query("membershipOverlayConfigurations")
      .withIndex("by_streamerId", (q) => q.eq("streamerId", streamer._id))
      .unique();

    const merged = mergeMembershipConfig(
      (existing?.config ?? null) as Partial<MembershipOverlayConfig> | null
    );

    return await resolveMembershipConfigAssetUrls(ctx, merged);
  },
});

// ── Authenticated: current month membership state for a streamer ─────
export const getCurrentMembershipByStreamer = query({
  args: { streamerId: v.id("streamers") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const state = await getCurrentMembershipState(ctx, args.streamerId, now);

    return {
      streamerId: args.streamerId,
      monthKey: state.monthKey,
      currentCount: state.currentCount,
      targetCount: state.targetCount,
      updatedAt: now,
    };
  },
});

// ── Streamer: get editable membership overlay config ─────────────────────
export const getMembershipOverlayConfig = query({
  args: { streamerId: v.id("streamers") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("membershipOverlayConfigurations")
      .withIndex("by_streamerId", (q) => q.eq("streamerId", args.streamerId))
      .unique();

    const merged = mergeMembershipConfig(
      (existing?.config ?? null) as Partial<MembershipOverlayConfig> | null
    );

    return await resolveMembershipConfigAssetUrls(ctx, merged);
  },
});

// ── Streamer: save membership overlay config (separate from challenge) ──
export const saveMembershipOverlayConfig = mutation({
  args: {
    sessionToken: v.string(),
    config: v.any(),
  },
  handler: async (ctx, args) => {
    const session = await validateSessionToken(ctx, args.sessionToken);
    if (!session || session.type !== "streamer") {
      throw new Error("Unauthorized: streamer session required");
    }

    const merged = mergeMembershipConfig(
      args.config as Partial<MembershipOverlayConfig>
    );
    const sanitized = sanitizeMembershipConfigForSave(merged);

    const existing = await ctx.db
      .query("membershipOverlayConfigurations")
      .withIndex("by_streamerId", (q) => q.eq("streamerId", session.streamerId))
      .unique();

    const previousStorageId = getCardBackgroundImageStorageId(existing?.config);
    const nextStorageId = getCardBackgroundImageStorageId(sanitized);

    if (existing) {
      await ctx.db.patch(existing._id, { config: sanitized });
    } else {
      await ctx.db.insert("membershipOverlayConfigurations", {
        streamerId: session.streamerId,
        config: sanitized,
      });
    }

    const shouldDeletePreviousAsset =
      !!previousStorageId && previousStorageId !== nextStorageId;

    if (shouldDeletePreviousAsset) {
      try {
        await ctx.storage.delete(previousStorageId);
      } catch (error) {
        console.error(
          "Failed to delete previous membership overlay card background image asset:",
          error
        );
      }
    }

    return { success: true, config: sanitized };
  },
});

// ── Moderator-only mutation: update monthly membership counters ───────
export const updateMonthlyMembership = mutation({
  args: {
    sessionToken: v.string(),
    streamerId: v.id("streamers"),
    currentCount: v.optional(v.number()),
    targetCount: v.optional(v.number()),
    countDelta: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = await validateSessionToken(ctx, args.sessionToken);
    if (!session || session.type !== "moderator") {
      throw new Error("Unauthorized: moderator session required");
    }

    if (session.streamerId !== args.streamerId) {
      throw new Error("Unauthorized: moderator cannot update another streamer");
    }

    const now = Date.now();
    const state = await getCurrentMembershipState(ctx, args.streamerId, now);

    let nextCurrent = state.currentCount;
    let nextTarget = state.targetCount;

    if (args.currentCount !== undefined) {
      nextCurrent = normalizeCount(args.currentCount);
    }

    if (args.countDelta !== undefined) {
      nextCurrent = normalizeCount(nextCurrent + args.countDelta);
    }

    if (args.targetCount !== undefined) {
      nextTarget = normalizeCount(args.targetCount);
    }

    const payload = {
      streamerId: args.streamerId,
      monthKey: state.monthKey,
      currentCount: nextCurrent,
      targetCount: nextTarget,
      updatedAt: now,
      updatedByModeratorId: session.moderatorId,
    };

    if (state.recordId) {
      await ctx.db.patch(state.recordId, payload);
    } else {
      await ctx.db.insert("membershipCounters", payload);
    }

    return {
      success: true,
      streamerId: args.streamerId,
      monthKey: state.monthKey,
      currentCount: nextCurrent,
      targetCount: nextTarget,
      updatedAt: now,
    };
  },
});

// ── Streamer mutation: update own monthly membership counters ────────
export const updateMonthlyMembershipByStreamer = mutation({
  args: {
    sessionToken: v.string(),
    currentCount: v.optional(v.number()),
    targetCount: v.optional(v.number()),
    countDelta: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = await validateSessionToken(ctx, args.sessionToken);
    if (!session || session.type !== "streamer") {
      throw new Error("Unauthorized: streamer session required");
    }

    const now = Date.now();
    const state = await getCurrentMembershipState(ctx, session.streamerId, now);

    let nextCurrent = state.currentCount;
    let nextTarget = state.targetCount;

    if (args.currentCount !== undefined) {
      nextCurrent = normalizeCount(args.currentCount);
    }

    if (args.countDelta !== undefined) {
      nextCurrent = normalizeCount(nextCurrent + args.countDelta);
    }

    if (args.targetCount !== undefined) {
      nextTarget = normalizeCount(args.targetCount);
    }

    const payload = {
      streamerId: session.streamerId,
      monthKey: state.monthKey,
      currentCount: nextCurrent,
      targetCount: nextTarget,
      updatedAt: now,
    };

    if (state.recordId) {
      await ctx.db.patch(state.recordId, payload);
    } else {
      await ctx.db.insert("membershipCounters", payload);
    }

    return {
      success: true,
      streamerId: session.streamerId,
      monthKey: state.monthKey,
      currentCount: nextCurrent,
      targetCount: nextTarget,
      updatedAt: now,
    };
  },
});
