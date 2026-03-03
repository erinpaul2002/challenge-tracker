# Quick Start Guide - Auth System

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

**Current Status:** ✅ 27 tests passing

## Available Auth Functions

### Sign Up (Streamer)
```typescript
import { authService } from '@/services/authService';

const result = await authService.signUpStreamer({
  email: 'user@example.com',
  password: 'SecurePassword123!',
  name: 'Streamer Name',
  channel_name: 'twitch_handle', // optional
});

if (result.success) {
  console.log('Signed up:', result.user);
}
```

### Sign In (Streamer)
```typescript
const result = await authService.signInStreamer({
  email: 'user@example.com',
  password: 'SecurePassword123!',
});

if (result.success) {
  console.log('Signed in:', result.user);
}
```

### Sign In (Moderator)
```typescript
const result = await authService.signInModerator({
  moderator_id: 'mod-uuid',
  password: 'moderator-password',
});

if (result.success) {
  console.log('Moderator session:', result.moderatorSession);
}
```

### Sign Out
```typescript
const result = await authService.signOut();

if (result.success) {
  console.log('Signed out successfully');
}
```

### Get Current User
```typescript
const user = await authService.getCurrentUser();
console.log('Current user:', user?.email);
```

### Get Current Session
```typescript
const session = await authService.getCurrentSession();
console.log('Session token:', session?.access_token);
```

## Using Auth Store

```typescript
import { useAuthStore } from '@/stores/authStore';

// In a React component
export function MyComponent() {
  const { user, session, loading, error, setError } = useAuthStore();

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      {user && <p>Welcome, {user.email}!</p>}
    </div>
  );
}
```

## Store API

```typescript
const {
  // State
  user,        // User | null
  session,     // Session | null
  loading,     // boolean
  error,       // string | null
  
  // Methods
  setUser,     // (user: User | null) => void
  setSession,  // (session: Session | null) => void
  setLoading,  // (loading: boolean) => void
  setError,    // (error: string | null) => void
  clearAuth,   // () => void
} = useAuthStore();
```

## Files Created

```
stores/authStore.ts                    - Auth state management
services/authService.ts                - Auth service logic
tests/unit/authStore.test.ts          - Store tests (7)
tests/unit/authService.test.ts        - Service tests (15)
tests/integration/authFlow.test.ts    - Integration tests (5)
tests/setup.ts                         - Test environment
vitest.config.ts                       - Vitest config
doc/AUTHENTICATION.md                  - Full documentation
doc/IMPLEMENTATION_SUMMARY.md          - Implementation details
```

## Test Coverage

- ✅ Streamer sign up (success & errors)
- ✅ Streamer sign in (success & errors)
- ✅ Moderator sign in (success & errors)
- ✅ Sign out
- ✅ Get current user/session
- ✅ Store state management
- ✅ Loading state
- ✅ Error handling
- ✅ Complete auth flows
- ✅ Error recovery
- ✅ Concurrent operations

## Next: UI Implementation

Once ready to build the UI:

1. Create sign-up form component
   - Use `authService.signUpStreamer()`
   - Display `error` from store
   - Show `loading` state

2. Create sign-in form component
   - Use `authService.signInStreamer()`
   - Handle errors and redirect on success

3. Create dashboard
   - Check `user` from store
   - Redirect to login if null

4. Add route protection
   - Check `user` in middleware or layout
   - Redirect to login if not authenticated

## Environment Variables Needed

```env
NEXT_PUBLIC_CONVEX_URL=your_convex_url
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Important Notes

⚠️ **Moderator passwords** are currently stored as plain text. Before production:
- Implement bcrypt hashing for moderator passwords
- Add rate limiting on sign-in attempts
- Add session inactivity timeout

✅ **Streamer authentication** is handled through Convex actions and session tokens

See `doc/AUTHENTICATION.md` for full details and security considerations.
