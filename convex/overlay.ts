import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

    return config?.config ?? null;
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

    return config?.config ?? null;
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

    if (existing) {
      await ctx.db.patch(existing._id, { config: args.config });
    } else {
      await ctx.db.insert("overlayConfigurations", {
        streamerId: args.streamerId,
        config: args.config,
      });
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
