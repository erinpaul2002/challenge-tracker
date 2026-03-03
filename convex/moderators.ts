import { v } from "convex/values";
import {
  mutation,
  query,
  action,
  internalMutation,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// ── Get moderators for a streamer ────────────────────────────────────
export const getModerators = query({
  args: { streamerId: v.id("streamers") },
  handler: async (ctx, args) => {
    const moderators = await ctx.db
      .query("moderators")
      .withIndex("by_streamerId", (q) => q.eq("streamerId", args.streamerId))
      .order("desc")
      .collect();

    // Return without password hashes
    return moderators.map((mod) => ({
      _id: mod._id,
      _creationTime: mod._creationTime,
      streamerId: mod.streamerId,
      name: mod.name,
      active: mod.active,
      challengesManaged: 0, // TODO: track this
    }));
  },
});

// ── Get all streamers (for moderator login dropdown) ─────────────────
export const getAllStreamers = query({
  args: {},
  handler: async (ctx) => {
    const streamers = await ctx.db.query("streamers").collect();
    return streamers.map((s) => ({
      _id: s._id,
      name: s.name,
      channelName: s.channelName,
    }));
  },
});

// ── Get moderators for a streamer (for login) ────────────────────────
export const getModeratorsByStreamer = query({
  args: { streamerId: v.id("streamers") },
  handler: async (ctx, args) => {
    const mods = await ctx.db
      .query("moderators")
      .withIndex("by_streamerId", (q) => q.eq("streamerId", args.streamerId))
      .collect();

    return mods.map((m) => ({
      _id: m._id,
      name: m.name,
      active: m.active,
    }));
  },
});

// ── Get moderator login options (streamer label + moderator id) ─────
export const getModeratorLoginOptions = query({
  args: {},
  handler: async (ctx) => {
    const moderators = await ctx.db.query("moderators").collect();

    const options: Array<{
      moderatorId: Id<"moderators">;
      streamerId: Id<"streamers">;
      name: string;
      channelName?: string;
    }> = [];

    for (const moderator of moderators) {
      if (!moderator.active) continue;

      const streamer = await ctx.db.get(moderator.streamerId);
      if (!streamer) continue;

      options.push({
        moderatorId: moderator._id,
        streamerId: streamer._id,
        name: streamer.name,
        channelName: streamer.channelName,
      });
    }

    return options;
  },
});

// ── Internal mutation for creating moderator ─────────────────────────
export const createModeratorInternal = internalMutation({
  args: {
    streamerId: v.id("streamers"),
    name: v.string(),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("moderators", {
      streamerId: args.streamerId,
      name: args.name,
      passwordHash: args.passwordHash,
      active: true,
    });
  },
});

// ── Create a moderator (action — needs bcrypt) ──────────────────────
export const createModerator = action({
  args: {
    streamerId: v.id("streamers"),
    name: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: true; moderatorId: Id<"moderators"> }> => {
    if (!args.password || args.password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }
    if (!args.name || args.name.trim().length === 0) {
      throw new Error("Name is required");
    }

    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash(args.password, 10);

    const moderatorId: Id<"moderators"> = await ctx.runMutation(
      internal.moderators.createModeratorInternal,
      {
        streamerId: args.streamerId,
        name: args.name.trim(),
        passwordHash,
      }
    );

    return { success: true, moderatorId };
  },
});

// ── Update a moderator ───────────────────────────────────────────────
export const updateModerator = action({
  args: {
    moderatorId: v.id("moderators"),
    name: v.optional(v.string()),
    password: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = {};

    if (args.name !== undefined) {
      patch.name = args.name.trim();
    }

    if (args.password !== undefined) {
      if (args.password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }
      const bcrypt = await import("bcryptjs");
      patch.passwordHash = await bcrypt.hash(args.password, 10);
    }

    if (args.active !== undefined) {
      patch.active = args.active;
    }

    await ctx.runMutation(internal.moderators.updateModeratorInternal, {
      moderatorId: args.moderatorId,
      patch,
    });

    return { success: true };
  },
});

export const updateModeratorInternal = internalMutation({
  args: {
    moderatorId: v.id("moderators"),
    patch: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.moderatorId, args.patch);
  },
});

// ── Delete a moderator ───────────────────────────────────────────────
export const deleteModerator = mutation({
  args: { moderatorId: v.id("moderators") },
  handler: async (ctx, args) => {
    // Also delete any sessions for this moderator
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_moderatorId", (q) =>
        q.eq("moderatorId", args.moderatorId)
      )
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    await ctx.db.delete(args.moderatorId);
    return { success: true };
  },
});
