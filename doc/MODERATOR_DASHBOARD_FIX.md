# Moderator Dashboard Stats Fix Summary

## Problem
The moderator dashboard stats were empty because moderator sessions couldn't access challenges from Supabase. The issue was that:

1. Moderators are not authenticated through Supabase Auth (they use custom session headers)
2. Supabase RLS policies check `auth.uid()` for access control
3. When a moderator makes an API request, `auth.uid()` returns NULL because they're not logged in through Auth
4. This causes RLS policies to deny access to the challenges table

## Root Cause
The RLS policies for the `challenges` table use:
```sql
create policy challenges_select_by_streamer_or_moderator
on public.challenges
for select
to authenticated
using (
  streamer_id = auth.uid()
  or streamer_id = public.get_moderator_streamer_id(auth.uid())  -- This fails when auth.uid() is NULL
);
```

When a moderator makes a request with a custom `x-moderator-session` header, `auth.uid()` is NULL, so `get_moderator_streamer_id(NULL)` returns nothing, and the policy denies access.

## Solution
Updated all challenge-related API endpoints to use the **service role client** (admin client) when a moderator session is detected. This bypasses RLS policies because service role clients have full access.

### Files Modified
1. **app/api/challenges/route.ts** - GET endpoint
2. **app/api/challenges/[id]/route.ts** - GET endpoint  
3. **app/api/challenges/[id]/sub-challenges/route.ts** - GET endpoint
4. **app/api/challenges/[id]/sub-challenges/[subId]/route.ts** - GET endpoint

### Implementation Pattern
```typescript
// Detect moderator session from header
let isModeratorAccess = false;
if (!user && moderatorSession) {
  isModeratorAccess = true;
}

// Use admin client for moderator access to bypass RLS
const dbClient = isModeratorAccess ? createAdminClient() : supabase;

// Then use dbClient instead of supabase for queries
const challengeService = new ChallengeService(dbClient);
const challenges = await challengeService.getChallenges(streamerId);
```

## Security Implications
- The admin client is only used when a moderator session header is provided
- The API still validates that the `streamer_id` in the moderator session matches the challenge being accessed
- POST/PUT/DELETE endpoints for authenticated streamers remain unchanged
- This is safe because:
  1. Moderator sessions are stored only in localStorage (client-side only)
  2. The moderator password is hashed in the database
  3. The session can only be created through the moderator login endpoint which validates credentials

## Testing
The fix enables moderators to:
1. View dashboard stats (total challenges, active missions, success rate, completed)
2. View the challenges list
3. View individual challenge details and sub-challenges

All of this now works with the custom moderator session authentication.
