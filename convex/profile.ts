import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ── Get streamer profile ─────────────────────────────────────────────
export const getProfile = query({
  args: { streamerId: v.id("streamers") },
  handler: async (ctx, args) => {
    const streamer = await ctx.db.get(args.streamerId);
    if (!streamer) return null;

    return {
      _id: streamer._id,
      _creationTime: streamer._creationTime,
      email: streamer.email,
      name: streamer.name,
      channelName: streamer.channelName,
      overlayLink: streamer.overlayLink,
      overlayToken: streamer.overlayToken,
    };
  },
});

// ── Update streamer profile ──────────────────────────────────────────
export const updateProfile = mutation({
  args: {
    streamerId: v.id("streamers"),
    name: v.optional(v.string()),
    channelName: v.optional(v.string()),
    overlayLink: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { streamerId, ...updates } = args;

    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        patch[key] = value;
      }
    }

    await ctx.db.patch(streamerId, patch);
    const updated = await ctx.db.get(streamerId);

    return {
      _id: updated!._id,
      _creationTime: updated!._creationTime,
      email: updated!.email,
      name: updated!.name,
      channelName: updated!.channelName,
      overlayLink: updated!.overlayLink,
      overlayToken: updated!.overlayToken,
    };
  },
});
