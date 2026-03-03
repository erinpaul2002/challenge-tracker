# Database Schema Design - Live Stream Challenge Tracker

## Overview
This document outlines the database schema for the Live Stream Challenge Tracker MVP. The schema supports streamers, moderators, challenges with sub-challenges, and overlay functionality.

## Tables

### 1. streamers
Stores information about streamers who use the platform.

**Fields:**
- `id` (UUID, Primary Key) - Unique identifier
- `email` (TEXT, Unique) - Streamer's email for authentication
- `name` (TEXT) - Streamer's display name
- `channel_name` (TEXT) - Streamer's channel name (e.g., Twitch/YouTube handle)
- `overlay_link` (TEXT) - Generated URL for the public OBS overlay
- `created_at` (TIMESTAMP) - Account creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**Notes:**
- Authentication handled by Supabase Auth
- One channel per streamer
- Overlay link generated on account creation

### 2. moderators
Stores information about moderators assigned by streamers.

**Fields:**
- `id` (UUID, Primary Key) - Unique identifier
- `password` (TEXT) - Generated password for moderator login
- `streamer_id` (UUID, Foreign Key to streamers.id) - Reference to the streamer they moderate for
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**Notes:**
- No email required - moderators use ID and password for login
- Assigned by streamer, no self-signup
- One moderator per streamer (for MVP simplicity)

### 3. challenges
Stores main challenge information.

**Fields:**
- `id` (UUID, Primary Key) - Unique identifier
- `streamer_id` (UUID, Foreign Key to streamers.id) - Reference to the streamer
- `title` (TEXT) - Challenge title/name
- `description` (TEXT, Optional) - Challenge description
- `given_by` (TEXT, Optional) - Name of the viewer who gave the challenge
- `deadline` (DATE, Optional) - Challenge deadline
- `reward_amount` (TEXT, Optional) - Prize or stake amount (e.g., "$50" or "Custom prize")
- `status` (TEXT) - Challenge status: 'active', 'completed', 'paused', 'cancelled'
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**Notes:**
- Container for sub-challenges
- Status can be updated by streamer or moderator
- Reward amount is flexible (text field for various formats)

### 4. sub_challenges
Stores individual trackable sub-challenges within a main challenge.

**Fields:**
- `id` (UUID, Primary Key) - Unique identifier
- `challenge_id` (UUID, Foreign Key to challenges.id) - Reference to parent challenge
- `title` (TEXT) - Sub-challenge title
- `description` (TEXT, Optional) - Sub-challenge description
- `current_progress` (INTEGER) - Current progress count (default: 0)
- `target_limit` (INTEGER) - Target progress count
- `status` (TEXT) - Sub-challenge status: 'active', 'completed', 'paused'
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**Notes:**
- Every challenge has at least one sub-challenge (representing the main goal)
- Progress can be incremented/decremented by any amount
- Main challenge status derived from sub-challenges (all completed = main completed)

## Relationships
- `streamers` 1:N `moderators` (one streamer can have multiple moderators, but MVP assumes 1)
- `streamers` 1:N `challenges`
- `challenges` 1:N `sub_challenges`

## Security Considerations
- Row Level Security (RLS) policies needed:
  - Streamers can only access their own data and assigned moderators/challenges
  - Moderators can only access challenges for their assigned streamer
  - Public overlay access via read-only tokens (not stored in DB)

## Future Considerations
- Audit logs (for tracking changes) - deferred for MVP
- Multiple channels per streamer - deferred
- Moderator permissions/roles - deferred
- Challenge templates - deferred

## Implementation Notes
- All tables use UUID primary keys for Supabase compatibility
- Timestamps use Supabase defaults
- Foreign key constraints ensure data integrity
- Status fields use TEXT enums for flexibility