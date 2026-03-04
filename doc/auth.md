# Auth Feature Documentation

## Updated Auth Feature Summary

- **Problem:** Streamers need a way to delegate challenge management to moderators without giving full access, while ensuring updates are secure and traceable.
- **Target Users:** Streamers (who create moderator accounts) and Moderators (who use shared credentials to log in and update challenges).
- **Solution Overview:** A shared moderator account per streamer, generated with a unique ID and password. Moderators log in to update challenges, with basic security to prevent unauthorized access.
- **Key Features:**
  - Streamer creates a moderator account (generates ID and password).
  - Moderators log in using the shared ID and password.
  - Logged-in moderators can update challenges (e.g., add, edit, or mark complete).
  - Basic session management (e.g., logout after inactivity).
- **Technical Considerations (High-Level):** Use simple authentication (e.g., username/password check), store credentials securely (hashed), and track updates with timestamps or user IDs for auditing.
- **Business Model Outline:** Freemium—basic features free, premium for advanced moderation (e.g., multiple accounts later).
- **Next Steps Roadmap:** 1. Define user stories. 2. Outline implementation (e.g., TDD tests). 3. Prototype UI flow.

## User Flows

### Streamer Flow
- Sign up: name, email, ID, channel name, password.
- Login: email and password.
- Email confirmation via Supabase auth.
- Sign out from dashboard.
- State management with stores for auth state.
- If authenticated, go to dashboard; else, login page.

### Moderator Flow
- Streamer creates one moderator account with generated ID and password.
- Multiple moderators can use the same ID and password.
- Log in with ID and password to update challenges.
- Ignore concurrency for now.

## Permissions
- Streamer: Create moderator account, create/update/delete challenges.
- Moderator: Create/update/delete challenges (including sub-challenges).

## Database Confirmation
- Tables: streamers, moderators, challenges, sub_challenges.
- RLS enabled with appropriate policies.
- Foreign keys to auth.users.