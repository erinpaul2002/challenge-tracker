import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

type OverlayConfigWithCustomImage = {
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
    (config as OverlayConfigWithCustomImage).custom?.cardBackgroundImageStorageId;

  if (typeof storageId !== "string" || storageId.trim().length === 0) {
    return null;
  }

  return storageId as Id<"_storage">;
};

const resolveOverlayConfigAssetUrls = async (
  ctx: { storage: { getUrl: (id: Id<"_storage">) => Promise<string | null> } },
  config: unknown
) => {
  if (!config || typeof config !== "object") return config;

  const raw = config as OverlayConfigWithCustomImage;
  const storageId = raw.custom?.cardBackgroundImageStorageId;
  if (!storageId) return config;

  const signedUrl = await ctx.storage.getUrl(storageId as Id<"_storage">);

  return {
    ...raw,
    custom: {
      ...raw.custom,
      cardBackgroundImageUrl: signedUrl ?? raw.custom?.cardBackgroundImageUrl ?? "",
    },
  };
};

// ── Get overlay data by token (public — no auth required) ────────────
export const getOverlayByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    // Find streamer by overlay token
    const streamer = await ctx.db
      .query("streamers")
      .withIndex("by_overlayToken", (q) => q.eq("overlayToken", args.token))
      .unique();

    if (!streamer) {
      return null;
    }

    // Get active challenges
    const allChallenges = await ctx.db
      .query("challenges")
      .withIndex("by_streamerId", (q) => q.eq("streamerId", streamer._id))
      .order("desc")
      .collect();

    const activeChallenges = allChallenges.filter(
      (c) => c.status === "active"
    );

    // Get sub-challenges for each active challenge
    const challengesWithSubs = await Promise.all(
      activeChallenges.map(async (challenge) => {
        const subChallenges = await ctx.db
          .query("subChallenges")
          .withIndex("by_challengeId", (q) =>
            q.eq("challengeId", challenge._id)
          )
          .collect();

        return {
          id: challenge._id,
          title: challenge.title,
          description: challenge.description,
          given_by: challenge.givenBy,
          reward_amount: challenge.rewardAmount,
          status: challenge.status,
          created_at: new Date(challenge._creationTime).toISOString(),
          sub_challenges: subChallenges.map((sc) => ({
            id: sc._id,
            title: sc.title,
            description: sc.description,
            current_progress: sc.currentProgress,
            target_limit: sc.targetLimit,
            status: sc.status,
          })),
        };
      })
    );

    return {
      challenges: challengesWithSubs,
      streamerId: streamer._id,
    };
  },
});

// ── Get overlay config by token (public) ─────────────────────────────
export const getOverlayConfigByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const streamer = await ctx.db
      .query("streamers")
      .withIndex("by_overlayToken", (q) => q.eq("overlayToken", args.token))
      .unique();

    if (!streamer) {
      return null;
    }

    const config = await ctx.db
      .query("overlayConfigurations")
      .withIndex("by_streamerId", (q) => q.eq("streamerId", streamer._id))
      .unique();

    if (!config?.config) return null;
    return await resolveOverlayConfigAssetUrls(ctx, config.config);
  },
});

// ── Get overlay config for authenticated streamer ────────────────────
export const getOverlayConfig = query({
  args: { streamerId: v.id("streamers") },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("overlayConfigurations")
      .withIndex("by_streamerId", (q) => q.eq("streamerId", args.streamerId))
      .unique();

    if (!config?.config) return null;
    return await resolveOverlayConfigAssetUrls(ctx, config.config);
  },
});

// ── Generate upload URL for overlay background assets ────────────────
export const generateOverlayAssetUploadUrl = mutation({
  args: {
    streamerId: v.id("streamers"),
  },
  handler: async (ctx, args) => {
    // Keep parity with existing overlay config auth model (streamerId-driven).
    // We at least validate streamer exists before issuing an upload URL.
    const streamer = await ctx.db.get(args.streamerId);
    if (!streamer) {
      throw new Error("Streamer not found");
    }

    const uploadUrl = await ctx.storage.generateUploadUrl();
    return { uploadUrl };
  },
});

// ── Save/update overlay config ───────────────────────────────────────
export const saveOverlayConfig = mutation({
  args: {
    streamerId: v.id("streamers"),
    config: v.any(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("overlayConfigurations")
      .withIndex("by_streamerId", (q) => q.eq("streamerId", args.streamerId))
      .unique();

    const previousStorageId = getCardBackgroundImageStorageId(existing?.config);
    const nextStorageId = getCardBackgroundImageStorageId(args.config);

    if (existing) {
      await ctx.db.patch(existing._id, { config: args.config });
    } else {
      await ctx.db.insert("overlayConfigurations", {
        streamerId: args.streamerId,
        config: args.config,
      });
    }

    const shouldDeletePreviousAsset =
      !!previousStorageId && previousStorageId !== nextStorageId;

    if (shouldDeletePreviousAsset) {
      try {
        await ctx.storage.delete(previousStorageId);
      } catch (error) {
        console.error(
          "Failed to delete previous overlay card background image asset:",
          error
        );
      }
    }

    return { success: true };
  },
});

// ── Generate new overlay token ───────────────────────────────────────
export const regenerateOverlayToken = mutation({
  args: { streamerId: v.id("streamers") },
  handler: async (ctx, args) => {
    const newToken = crypto.randomUUID();
    await ctx.db.patch(args.streamerId, { overlayToken: newToken });
    return { overlayToken: newToken };
  },
});
