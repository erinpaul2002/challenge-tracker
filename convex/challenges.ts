import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { validateSessionToken } from "./auth";

const UNAUTHORIZED_ERROR = "Unauthorized";

const requireSessionStreamerId = async (
  ctx: { db: any },
  sessionToken: string
) => {
  const session = await validateSessionToken(ctx, sessionToken);
  if (!session) {
    throw new Error(UNAUTHORIZED_ERROR);
  }

  return session.streamerId;
};

// ── Get all challenges for a streamer ────────────────────────────────
export const getChallenges = query({
  args: { streamerId: v.id("streamers") },
  handler: async (ctx, args) => {
    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_streamerId", (q) => q.eq("streamerId", args.streamerId))
      .order("desc")
      .collect();

    return challenges;
  },
});

// ── Get challenges with sub-challenges for a streamer ───────────────
export const getChallengesWithSubsByStreamer = query({
  args: { streamerId: v.id("streamers") },
  handler: async (ctx, args) => {
    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_streamerId", (q) => q.eq("streamerId", args.streamerId))
      .order("desc")
      .collect();

    const challengesWithSubs = await Promise.all(
      challenges.map(async (challenge) => {
        const subChallenges = await ctx.db
          .query("subChallenges")
          .withIndex("by_challengeId", (q) => q.eq("challengeId", challenge._id))
          .order("desc")
          .collect();

        return { ...challenge, subChallenges };
      })
    );

    return challengesWithSubs;
  },
});

// ── Get a single challenge by ID ─────────────────────────────────────
export const getChallenge = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.challengeId);
  },
});

// ── Get challenge with sub-challenges ────────────────────────────────
export const getChallengeWithSubs = query({
  args: {
    challengeId: v.id("challenges"),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    let sessionStreamerId: Awaited<ReturnType<typeof requireSessionStreamerId>>;
    try {
      sessionStreamerId = await requireSessionStreamerId(ctx, args.sessionToken);
    } catch {
      return null;
    }

    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) {
      return null;
    }

    if (challenge.streamerId !== sessionStreamerId) {
      return null;
    }

    const subChallenges = await ctx.db
      .query("subChallenges")
      .withIndex("by_challengeId", (q) => q.eq("challengeId", args.challengeId))
      .order("desc")
      .collect();

    return { ...challenge, subChallenges };
  },
});

// ── Create a challenge (with optional sub-challenges) ────────────────
export const createChallenge = mutation({
  args: {
    streamerId: v.id("streamers"),
    title: v.string(),
    description: v.optional(v.string()),
    givenBy: v.optional(v.string()),
    deadline: v.optional(v.string()),
    rewardAmount: v.optional(v.string()),
    subChallenges: v.optional(
      v.array(
        v.object({
          title: v.string(),
          description: v.optional(v.string()),
          targetLimit: v.number(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const { subChallenges, ...challengeFields } = args;

    const challengeId = await ctx.db.insert("challenges", {
      ...challengeFields,
      status: "active",
    });

    // Create sub-challenges
    if (subChallenges && subChallenges.length > 0) {
      for (const sub of subChallenges) {
        await ctx.db.insert("subChallenges", {
          challengeId,
          title: sub.title,
          description: sub.description,
          targetLimit: sub.targetLimit,
          currentProgress: 0,
          status: "active",
        });
      }
    } else {
      // Create a default sub-challenge if none provided
      await ctx.db.insert("subChallenges", {
        challengeId,
        title: challengeFields.title,
        description: challengeFields.description,
        targetLimit: 1,
        currentProgress: 0,
        status: "active",
      });
    }

    return challengeId;
  },
});

// ── Update a challenge ───────────────────────────────────────────────
export const updateChallenge = mutation({
  args: {
    sessionToken: v.string(),
    challengeId: v.id("challenges"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    givenBy: v.optional(v.string()),
    deadline: v.optional(v.string()),
    rewardAmount: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("completed"),
        v.literal("paused"),
        v.literal("cancelled")
      )
    ),
  },
  handler: async (ctx, args) => {
    const { challengeId, sessionToken, ...updates } = args;

    const sessionStreamerId = await requireSessionStreamerId(
      ctx,
      sessionToken
    );
    const existingChallenge = await ctx.db.get(challengeId);
    if (!existingChallenge || existingChallenge.streamerId !== sessionStreamerId) {
      throw new Error(UNAUTHORIZED_ERROR);
    }

    // Filter out undefined values
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        patch[key] = value;
      }
    }

    await ctx.db.patch(challengeId, patch);
    return await ctx.db.get(challengeId);
  },
});

// ── Delete a challenge (cascades to sub-challenges) ──────────────────
export const deleteChallenge = mutation({
  args: {
    sessionToken: v.string(),
    challengeId: v.id("challenges"),
  },
  handler: async (ctx, args) => {
    const sessionStreamerId = await requireSessionStreamerId(
      ctx,
      args.sessionToken
    );

    const existingChallenge = await ctx.db.get(args.challengeId);
    if (!existingChallenge || existingChallenge.streamerId !== sessionStreamerId) {
      throw new Error(UNAUTHORIZED_ERROR);
    }

    // Delete all sub-challenges first
    const subs = await ctx.db
      .query("subChallenges")
      .withIndex("by_challengeId", (q) =>
        q.eq("challengeId", args.challengeId)
      )
      .collect();

    for (const sub of subs) {
      await ctx.db.delete(sub._id);
    }

    await ctx.db.delete(args.challengeId);
    return { success: true };
  },
});

// ── Sub-challenge queries & mutations ────────────────────────────────

export const getSubChallenges = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subChallenges")
      .withIndex("by_challengeId", (q) => q.eq("challengeId", args.challengeId))
      .order("desc")
      .collect();
  },
});

export const createSubChallenge = mutation({
  args: {
    sessionToken: v.string(),
    challengeId: v.id("challenges"),
    title: v.string(),
    description: v.optional(v.string()),
    targetLimit: v.number(),
  },
  handler: async (ctx, args) => {
    const sessionStreamerId = await requireSessionStreamerId(
      ctx,
      args.sessionToken
    );
    const parentChallenge = await ctx.db.get(args.challengeId);
    if (!parentChallenge || parentChallenge.streamerId !== sessionStreamerId) {
      throw new Error(UNAUTHORIZED_ERROR);
    }

    const subId = await ctx.db.insert("subChallenges", {
      challengeId: args.challengeId,
      title: args.title,
      description: args.description,
      targetLimit: args.targetLimit,
      currentProgress: 0,
      status: "active",
    });
    return subId;
  },
});

export const updateSubChallenge = mutation({
  args: {
    sessionToken: v.string(),
    subChallengeId: v.id("subChallenges"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    targetLimit: v.optional(v.number()),
    currentProgress: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("completed"),
        v.literal("paused")
      )
    ),
  },
  handler: async (ctx, args) => {
    const { subChallengeId, sessionToken, ...updates } = args;

    const sessionStreamerId = await requireSessionStreamerId(
      ctx,
      sessionToken
    );

    const existingSubChallenge = await ctx.db.get(subChallengeId);
    if (!existingSubChallenge) {
      throw new Error(UNAUTHORIZED_ERROR);
    }

    const parentChallenge = await ctx.db.get(existingSubChallenge.challengeId);
    if (!parentChallenge || parentChallenge.streamerId !== sessionStreamerId) {
      throw new Error(UNAUTHORIZED_ERROR);
    }

    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        patch[key] = value;
      }
    }

    if (updates.targetLimit !== undefined) {
      patch.targetLimit = Math.max(1, updates.targetLimit);
    }

    if (updates.currentProgress !== undefined || updates.targetLimit !== undefined) {
      const effectiveTargetLimit =
        updates.targetLimit !== undefined
          ? Math.max(1, updates.targetLimit)
          : existingSubChallenge.targetLimit;
      const requestedProgress =
        updates.currentProgress !== undefined
          ? updates.currentProgress
          : existingSubChallenge.currentProgress;

      patch.currentProgress = Math.max(0, Math.min(effectiveTargetLimit, requestedProgress));
    }

    await ctx.db.patch(subChallengeId, patch);
    return await ctx.db.get(subChallengeId);
  },
});

export const deleteSubChallenge = mutation({
  args: {
    sessionToken: v.string(),
    subChallengeId: v.id("subChallenges"),
  },
  handler: async (ctx, args) => {
    const sessionStreamerId = await requireSessionStreamerId(
      ctx,
      args.sessionToken
    );

    const subChallenge = await ctx.db.get(args.subChallengeId);
    if (!subChallenge) {
      throw new Error(UNAUTHORIZED_ERROR);
    }

    const parentChallenge = await ctx.db.get(subChallenge.challengeId);
    if (!parentChallenge || parentChallenge.streamerId !== sessionStreamerId) {
      throw new Error(UNAUTHORIZED_ERROR);
    }

    await ctx.db.delete(args.subChallengeId);
    return { success: true };
  },
});
