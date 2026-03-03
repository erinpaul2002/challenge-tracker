# Authentication System Documentation

## Overview
The authentication system provides secure user authentication for streamers and moderators using Supabase Auth and a Zustand-based state management store.

## Architecture

### Components

#### 1. **Auth Store** (`stores/authStore.ts`)
Zustand-based store managing global authentication state.

**State:**
```typescript
- user: User | null           // Current authenticated user
- session: Session | null     // Current auth session
- loading: boolean            // Loading state for async operations
- error: string | null        // Error messages from auth operations
```

**Methods:**
- `setUser(user)` - Update current user
- `setSession(session)` - Update current session
- `setLoading(loading)` - Set loading state
- `setError(error)` - Set error message
- `clearAuth()` - Clear all auth state

#### 2. **Auth Service** (`services/authService.ts`)
Business logic for authentication operations.

**Methods:**

##### Streamer Authentication
```typescript
// Sign up a new streamer
authService.signUpStreamer({
  email: string;
  password: string;
  name: string;
  channel_name?: string;
})

// Sign in an existing streamer
authService.signInStreamer({
  email: string;
  password: string;
})
```

##### Moderator Authentication
```typescript
// Sign in as a moderator
authService.signInModerator({
  moderator_id: string;
  password: string;
})
```

##### Session Management
```typescript
// Sign out current user
authService.signOut()

// Get current authenticated user
authService.getCurrentUser()

// Get current session
authService.getCurrentSession()
```

## Flows

### Streamer Sign Up Flow
1. User provides email, password, name, and channel name
2. Service calls `supabase.auth.signUp()`
3. On success:
   - Creates streamer profile in database
   - Generates overlay link
   - Updates auth store with user and session
4. On error:
   - Cleans up auth user if database fails
   - Updates error state in store

### Streamer Sign In Flow
1. User provides email and password
2. Service calls `supabase.auth.signInWithPassword()`
3. On success:
   - Updates auth store with user and session
   - Session token automatically managed by Supabase
4. On error:
   - Updates error state with error message

### Moderator Sign In Flow
1. Moderator provides ID and password
2. Service queries moderators table for matching ID
3. Validates password (plain text comparison in MVP)
4. On success:
   - Returns moderator session object with streamer_id
   - Does NOT update global auth store (moderators are separate context)
5. On error:
   - Returns error message

### Sign Out Flow
1. Calls `supabase.auth.signOut()`
2. Clears auth store (user, session, error)
3. Removes all authentication state

## Security Considerations

### Current Implementation (MVP)
- ✅ Passwords hashed in Supabase Auth for streamers
- ✅ Row-level security (RLS) policies on database
- ✅ Session tokens managed by Supabase
- ⚠️ Moderator passwords stored as plain text (TODO: implement hashing)
- ⚠️ No rate limiting on sign in attempts (TODO: implement)

### TODO - Security Enhancements
1. **Moderator Password Hashing**: Use bcrypt for moderator password hashing
2. **Rate Limiting**: Implement rate limiting on auth endpoints
3. **Session Timeout**: Add inactivity timeout for sessions
4. **Audit Logging**: Log all authentication events
5. **Two-Factor Authentication**: Optional 2FA for streamers

## Testing

### Test Files
- `tests/unit/authStore.test.ts` - Store functionality
- `tests/unit/authService.test.ts` - Auth service methods
- `tests/integration/authFlow.test.ts` - Complete flows

### Running Tests
```bash
# Run all tests
npm run test

# Run in watch mode
npm run test:watch

# Run specific test file
npm run test tests/unit/authService.test.ts

# Generate coverage report
npm run test:coverage
```

### Test Coverage
- ✅ Sign up with valid/invalid data
- ✅ Sign in with valid/invalid credentials
- ✅ Moderator sign in
- ✅ Sign out
- ✅ Error handling and recovery
- ✅ State management
- ✅ Concurrent operations
- ✅ Loading state management

## Usage Examples

### In React Components

```typescript
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';

export function LoginComponent() {
  const { user, loading, error, setError } = useAuthStore();

  const handleSignUp = async (email: string, password: string, name: string) => {
    const result = await authService.signUpStreamer({
      email,
      password,
      name,
    });

    if (!result.success) {
      setError(result.error);
    }
  };

  const handleSignIn = async (email: string, password: string) => {
    const result = await authService.signInStreamer({
      email,
      password,
    });

    if (!result.success) {
      setError(result.error);
    }
  };

  const handleSignOut = async () => {
    await authService.signOut();
  };

  return (
    <div>
      {user ? (
        <div>
          <p>Logged in as: {user.email}</p>
          <button onClick={handleSignOut}>Sign Out</button>
        </div>
      ) : (
        <div>
          {error && <p className="error">{error}</p>}
          {loading && <p>Loading...</p>}
          {/* Sign up/in forms */}
        </div>
      )}
    </div>
  );
}
```

### Accessing Auth State

```typescript
const { user, session, loading, error } = useAuthStore();

// Check if authenticated
if (user && session) {
  // User is authenticated
}

// Listen to auth state changes
useAuthStore.subscribe(
  (state) => state.user,
  (user) => {
    console.log('User changed:', user);
  }
);
```

## Database Schema Integration

Auth system integrates with the following tables:

### streamers
- Stores streamer profiles created during sign up
- Links to Supabase Auth via user ID
- Contains channel and overlay information

### moderators
- Stores moderator accounts assigned by streamers
- References streamer via foreign key
- Contains hashed password (TODO: implement)

## Next Steps

1. **UI Implementation**: Create sign up/sign in forms using the auth service
2. **Route Protection**: Implement route guards for authenticated pages
3. **Session Persistence**: Add session persistence across page reloads
4. **Refresh Token Handling**: Implement automatic token refresh
5. **Password Reset**: Add forgot password functionality
6. **Email Verification**: Implement email confirmation flow
7. **Moderator Manager**: Create UI for streamers to manage moderators
