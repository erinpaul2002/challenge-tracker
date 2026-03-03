import { v } from "convex/values";
import {
  mutation,
  query,
  action,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// ── Sign Up (streamer) ───────────────────────────────────────────────
export const signUpStreamer: ReturnType<typeof action> = action({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    channelName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const bcrypt = await import("bcryptjs");

    // Check if email already exists
    const existing = await ctx.runQuery(internal.auth.getStreamerByEmailInternal, {
      email: args.email,
    });

    if (existing) {
      throw new Error("Email already registered");
    }

    const passwordHash = await bcrypt.hash(args.password, 10);
    const overlayToken = crypto.randomUUID();

    const streamerId: Id<"streamers"> = await ctx.runMutation(
      internal.auth.createStreamerInternal,
      {
        email: args.email,
        passwordHash,
        name: args.name,
        channelName: args.channelName,
        overlayToken,
      }
    );

    // Create a session token
    const sessionToken = crypto.randomUUID();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    await ctx.runMutation(internal.auth.createSessionInternal, {
      token: sessionToken,
      streamerId,
      expiresAt,
    });

    return {
      success: true,
      streamerId,
      sessionToken,
    };
  },
});

// ── Sign In (streamer) ───────────────────────────────────────────────
export const signInStreamer: ReturnType<typeof action> = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const bcrypt = await import("bcryptjs");

    const streamer = await ctx.runQuery(
      internal.auth.getStreamerByEmailInternal,
      { email: args.email }
    );

    if (!streamer) {
      throw new Error("Invalid email or password");
    }

    const valid = await bcrypt.compare(args.password, streamer.passwordHash);
    if (!valid) {
      throw new Error("Invalid email or password");
    }

    // Create session
    const sessionToken = crypto.randomUUID();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    await ctx.runMutation(internal.auth.createSessionInternal, {
      token: sessionToken,
      streamerId: streamer._id,
      expiresAt,
    });

    return {
      success: true,
      streamerId: streamer._id,
      name: streamer.name,
      email: streamer.email,
      channelName: streamer.channelName,
      sessionToken,
    };
  },
});

// ── Moderator Sign In ────────────────────────────────────────────────
export const signInModerator: ReturnType<typeof action> = action({
  args: {
    moderatorId: v.id("moderators"),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const bcrypt = await import("bcryptjs");

    const moderator = await ctx.runQuery(
      internal.auth.getModeratorByIdInternal,
      { moderatorId: args.moderatorId }
    );

    if (!moderator) {
      throw new Error("Moderator not found");
    }

    const valid = await bcrypt.compare(args.password, moderator.passwordHash);
    if (!valid) {
      throw new Error("Invalid password");
    }

    // Get streamer info
    const streamer = await ctx.runQuery(
      internal.auth.getStreamerByIdInternal,
      { streamerId: moderator.streamerId }
    );

    if (!streamer) {
      throw new Error("Associated streamer not found");
    }

    // Create moderator session
    const sessionToken = crypto.randomUUID();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    await ctx.runMutation(internal.auth.createModeratorSessionInternal, {
      token: sessionToken,
      moderatorId: moderator._id,
      expiresAt,
    });

    return {
      success: true,
      sessionToken,
      moderatorId: moderator._id,
      streamerId: moderator.streamerId,
      streamerName: streamer.name,
      streamerChannel: streamer.channelName,
    };
  },
});

// ── Sign Out ─────────────────────────────────────────────────────────
export const signOut = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});

// ── Validate Session (public — used by client) ──────────────────────
export const validateSession = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    if (session.streamerId) {
      const streamer = await ctx.db.get(session.streamerId);
      if (!streamer) return null;
      return {
        type: "streamer" as const,
        streamerId: streamer._id,
        name: streamer.name,
        email: streamer.email,
        channelName: streamer.channelName,
      };
    }

    if (session.moderatorId) {
      const moderator = await ctx.db.get(session.moderatorId);
      if (!moderator) return null;
      const streamer = await ctx.db.get(moderator.streamerId);
      return {
        type: "moderator" as const,
        moderatorId: moderator._id,
        streamerId: moderator.streamerId,
        streamerName: streamer?.name,
        streamerChannel: streamer?.channelName,
      };
    }

    return null;
  },
});

// ── Public queries ───────────────────────────────────────────────────

export const getStreamerByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const streamer = await ctx.db
      .query("streamers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    if (!streamer) return null;
    // Don't expose password hash
    return {
      _id: streamer._id,
      email: streamer.email,
      name: streamer.name,
      channelName: streamer.channelName,
      overlayToken: streamer.overlayToken,
    };
  },
});

// ── Internal queries & mutations (only callable from other Convex functions) ─

export const getStreamerByEmailInternal = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("streamers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

export const getStreamerByIdInternal = internalQuery({
  args: { streamerId: v.id("streamers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.streamerId);
  },
});

export const getModeratorByIdInternal = internalQuery({
  args: { moderatorId: v.id("moderators") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.moderatorId);
  },
});

export const createStreamerInternal = internalMutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
    name: v.string(),
    channelName: v.optional(v.string()),
    overlayToken: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("streamers", {
      email: args.email,
      passwordHash: args.passwordHash,
      name: args.name,
      channelName: args.channelName,
      overlayToken: args.overlayToken,
    });
  },
});

export const createSessionInternal = internalMutation({
  args: {
    token: v.string(),
    streamerId: v.id("streamers"),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("sessions", {
      token: args.token,
      streamerId: args.streamerId,
      expiresAt: args.expiresAt,
    });
  },
});

export const createModeratorSessionInternal = internalMutation({
  args: {
    token: v.string(),
    moderatorId: v.id("moderators"),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("sessions", {
      token: args.token,
      moderatorId: args.moderatorId,
      expiresAt: args.expiresAt,
    });
  },
});
