import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // 1) Streamers — the channel owners
  streamers: defineTable({
    // Using Convex's built-in _id. We store the email as the unique lookup key.
    email: v.string(),
    passwordHash: v.string(), // bcrypt hash
    name: v.string(),
    channelName: v.optional(v.string()),
    overlayLink: v.optional(v.string()),
    overlayToken: v.string(), // UUID for public overlay access
  })
    .index("by_email", ["email"])
    .index("by_overlayToken", ["overlayToken"]),

  // 2) Moderators — shared accounts per streamer
  moderators: defineTable({
    streamerId: v.id("streamers"),
    name: v.string(),
    passwordHash: v.string(), // bcrypt hash
    active: v.boolean(),
  }).index("by_streamerId", ["streamerId"]),

  // 3) Challenges — parent challenges owned by a streamer
  challenges: defineTable({
    streamerId: v.id("streamers"),
    title: v.string(),
    description: v.optional(v.string()),
    givenBy: v.optional(v.string()),
    deadline: v.optional(v.string()), // ISO date string
    rewardAmount: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("paused"),
      v.literal("cancelled")
    ),
  }).index("by_streamerId", ["streamerId"]),

  // 4) Sub-challenges — micro objectives within a challenge
  subChallenges: defineTable({
    challengeId: v.id("challenges"),
    title: v.string(),
    description: v.optional(v.string()),
    currentProgress: v.number(),
    targetLimit: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("paused")
    ),
  }).index("by_challengeId", ["challengeId"]),

  // 5) Overlay configurations — per-streamer overlay theming
  overlayConfigurations: defineTable({
    streamerId: v.id("streamers"),
    config: v.any(), // JSONB-equivalent — flexible theme config object
  }).index("by_streamerId", ["streamerId"]),

  // 6) Sessions — custom session tokens for both streamers and moderators
  sessions: defineTable({
    token: v.string(),
    streamerId: v.optional(v.id("streamers")),
    moderatorId: v.optional(v.id("moderators")),
    expiresAt: v.number(), // timestamp ms
  })
    .index("by_token", ["token"])
    .index("by_streamerId", ["streamerId"])
    .index("by_moderatorId", ["moderatorId"]),
});
