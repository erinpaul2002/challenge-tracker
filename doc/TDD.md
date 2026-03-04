# 🏗️ Technical Design Document – Live Stream Challenge Tracker MVP

**Version:** 1.0  
**Status:** Ready for Development  
**Tech Stack:** Next.js 15 (App Router) | TypeScript | Tailwind CSS | Supabase | Vercel  
**Target Deployment:** 4-week sprint  

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         VERCEL                               │
├──────────────────────┬──────────────────────────────────────┤
│   Next.js Frontend   │      API Routes (Edge Runtime)       │
│  - Dashboard         │  - Auth handlers                     │
│  - Streamer UI       │  - Overlay proxy                     │
│  - Mod Interface     │  - Challenge endpoints               │
│  - Public Overlay    │  - Realtime subscriptions            │
└──────────────┬───────┴──────────────────┬───────────────────┘
               │                          │
               │ Magic Link + JWT         │ Supabase Client
               │                          │
┌──────────────▼──────────────────────────▼──────────────────┐
│                      SUPABASE                               │
├────────────────────┬──────────────────┬────────────────────┤
│  Auth (JWT)        │  Postgres DB     │  Realtime Engine   │
│  - Magic links     │  - Users         │  - Challenge       │
│  - JWT tokens      │  - Channels      │    subscriptions   │
│  - Expiration      │  - Challenges    │  - Presence        │
│                    │  - Sub-challs    │                    │
│                    │  - Audit log     │                    │
└────────────────────┴──────────────────┴────────────────────┘
```

**Flow:**
1. Streamer/Mod authenticates via magic link → Supabase JWT
2. Frontend calls API routes (Next.js) → Supabase client queries
3. Real-time updates via Supabase Realtime subscriptions
4. Public overlay fetches read-only token → subscribes to challenge changes
5. All hosted on Vercel (API + Frontend)

---

## 2. Database Schema (Supabase Postgres)

### 2.1 Core Tables

#### `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('streamer', 'moderator', 'admin')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

#### `channels`
```sql
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  streamer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel_name TEXT NOT NULL UNIQUE,
  overlay_token TEXT UNIQUE,
  overlay_token_expires_at TIMESTAMP,
  overlay_rotation_ms INT DEFAULT 8000 CHECK (overlay_rotation_ms BETWEEN 5000 AND 15000),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_channels_streamer ON channels(streamer_id);
CREATE INDEX idx_channels_overlay_token ON channels(overlay_token);
```

#### `channel_moderators`
```sql
CREATE TABLE channel_moderators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  moderator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(channel_id, moderator_id)
);

CREATE INDEX idx_mods_channel ON channel_moderators(channel_id);
```

#### `challenges`
```sql
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_challenges_channel ON challenges(channel_id);
CREATE INDEX idx_challenges_status ON challenges(status);
```

#### `sub_challenges`
```sql
CREATE TABLE sub_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('numeric', 'boolean')),
  target_value INT,
  current_progress INT DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sub_challs_challenge ON sub_challenges(challenge_id);
```

#### `audit_log`
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  moderator_id UUID NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_channel ON audit_log(channel_id, created_at DESC);
```

### 2.2 RLS Policies (Row-Level Security)

```sql
-- Users can only see their own data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_self ON users
  FOR SELECT USING (auth.uid() = id);

-- Streamers own their channels
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY channels_streamer_select ON channels
  FOR SELECT USING (streamer_id = auth.uid());
CREATE POLICY channels_streamer_update ON channels
  FOR UPDATE USING (streamer_id = auth.uid());

-- Mods can access their assigned channels
CREATE POLICY channels_mod_select ON channels
  FOR SELECT USING (
    streamer_id = auth.uid() OR 
    id IN (SELECT channel_id FROM channel_moderators WHERE moderator_id = auth.uid())
  );

-- Challenges inherit channel access
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY challenges_access ON challenges
  FOR SELECT USING (
    channel_id IN (
      SELECT id FROM channels WHERE streamer_id = auth.uid()
      UNION
      SELECT channel_id FROM channel_moderators WHERE moderator_id = auth.uid()
    )
  );

-- Similar policies for sub_challenges and audit_log

-- Overlay token bypass (public read-only for overlay)
CREATE POLICY challenges_public_with_token ON challenges
  FOR SELECT USING (
    channel_id IN (
      SELECT id FROM channels 
      WHERE overlay_token = current_setting('app.overlay_token', true)
    )
  );
```

---

## 3. API Layer (Next.js API Routes)

### 3.1 Route Structure

```
app/api/
├── auth/
│   ├── magic-link/          POST - Request magic link
│   ├── callback/            GET  - Handle callback
│   └── logout/              POST - Clear JWT
├── challenges/
│   ├── route.ts             GET/POST channels's challenges
│   └── [id]/
│       ├── route.ts         PATCH - update challenge
│       └── complete/        POST  - mark complete
├── sub-challenges/
│   ├── route.ts             GET/POST
│   └── [id]/
│       ├── increment/       POST  - +1 progress
│       ├── decrement/       POST  - -1 progress
│       └── set/             POST  - set exact value
├── overlay/
│   ├── token/               POST/PATCH - generate token
│   └── stream/[token]/      GET  - public stream endpoint
├── undo/
│   └── route.ts             POST - undo last N actions
├── moderators/
│   ├── route.ts             GET/POST
│   └── [id]/                DELETE - remove mod
└── health/
    └── route.ts             GET  - heartbeat for overlay
```

### 3.2 API Examples

#### POST `/api/auth/magic-link`
```typescript
// Request magic link
POST /api/auth/magic-link
Body: { email: string }

Response: { success: boolean; message: string }

// Server calls Supabase:
const { data, error } = await supabase.auth.signInWithOtp({
  email,
  options: { emailRedirectTo: 'https://yourapp.com/api/auth/callback' }
});
```

#### POST `/api/challenges`
```typescript
// Create challenge
POST /api/challenges?channel_id=xyz
Body: { 
  title: string; 
  description?: string;
  subChallenges: { title: string; type: 'numeric' | 'boolean'; target?: number }[]
}

Response: { challenge: Challenge; subChallenges: SubChallenge[] }

// Validation: Auth + channel ownership
```

#### POST `/api/sub-challenges/[id]/increment`
```typescript
// Increment numeric sub-challenge
POST /api/sub-challenges/abc-123/increment
Body: { amount?: number } // defaults to 1

Response: { subChallenge: SubChallenge; challenge: Challenge }

// Auto-logs to audit_log + broadcasts via Realtime
```

#### PATCH `/api/challenges/[id]`
```typescript
// Update challenge (e.g., status, title)
PATCH /api/challenges/xyz
Body: { status: 'active' | 'completed' | 'archived'; title?: string }

Response: { challenge: Challenge }
```

#### POST `/api/undo`
```typescript
// Undo last N actions (max 5)
POST /api/undo
Body: { count: number } // 1-5

Response: { 
  actions: AuditLog[]; 
  challenges: Challenge[]; 
  subChallenges: SubChallenge[] 
}

// Deletes audit logs + restores state
```

#### GET `/api/overlay/stream/[token]`
```typescript
// Public endpoint for overlay
GET /api/overlay/stream/public-token-xyz

Response: {
  challenges: Challenge[];
  subChallenges: SubChallenge[];
  currentChallengeIndex: number;
  rotationMs: number;
}

// No auth required; validates token + expiration
```

---

## 4. Frontend Architecture

### 4.1 Project Structure

```
app/
├── layout.tsx                    // Root layout + providers
├── page.tsx                      // Home / redirect logic
├── (auth)/
│   ├── login/
│   │   └── page.tsx             // Magic link form
│   └── callback/
│       └── route.ts             // Auth callback
├── (app)/
│   ├── layout.tsx               // Auth guard + sidebar
│   ├── dashboard/
│   │   └── page.tsx             // Streamer/mod main view
│   ├── channels/
│   │   ├── page.tsx             // List channels (streamer)
│   │   └── [id]/
│   │       ├── page.tsx         // Channel detail
│   │       ├── challenges/      // Challenge management
│   │       ├── moderators/      // Mod management
│   │       └── settings/        // Overlay token, rotation
│   └── overlay/
│       ├── page.tsx             // Public overlay embed
│       └── [token].tsx          // Token-based overlay
└── api/
    ├── auth/
    ├── challenges/
    ├── overlay/
    └── ... (as above)

components/
├── auth/
│   └── MagicLinkForm.tsx
├── dashboard/
│   ├── ChallengeList.tsx
│   ├── ChallengeCard.tsx
│   ├── SubChallengeRow.tsx
│   └── ActionBar.tsx
├── overlay/
│   ├── OverlayContainer.tsx     // Main carousel logic
│   ├── ChallengeOverlay.tsx     // Single challenge render
│   └── ProgressBar.tsx
├── modals/
│   ├── CreateChallengeModal.tsx
│   ├── CreateSubChallengeModal.tsx
│   └── UndoConfirmModal.tsx
├── layout/
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── AuthGuard.tsx
└── ui/
    ├── Button.tsx
    ├── Input.tsx
    ├── Modal.tsx
    └── ... (reusable primitives)

lib/
├── supabase/
│   ├── client.ts                // Supabase client instance
│   ├── server.ts                // Server-side Supabase
│   └── realtime.ts              // Realtime subscriptions
├── hooks/
│   ├── useAuth.ts               // Auth context + hook
│   ├── useChallenges.ts         // Challenge queries/mutations
│   ├── useOverlay.ts            // Overlay logic
│   └── useUndo.ts               // Undo queue
├── types/
│   └── index.ts                 // TypeScript interfaces
├── api/
│   └── client.ts                // API call helpers
└── utils/
    ├── auth.ts
    └── validation.ts

public/
└── ... (assets, favicon, etc)
```

### 4.2 Key Components

#### `components/dashboard/ChallengeList.tsx`
```typescript
interface Props {
  channelId: string;
}

export default function ChallengeList({ channelId }: Props) {
  const { challenges, isLoading } = useChallenges(channelId);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {challenges.map((ch) => (
        <ChallengeCard
          key={ch.id}
          challenge={ch}
          isExpanded={expandedId === ch.id}
          onToggleExpand={() => setExpandedId(expandedId === ch.id ? null : ch.id)}
        />
      ))}
    </div>
  );
}
```

#### `components/overlay/OverlayContainer.tsx`
```typescript
interface Props {
  token: string;
}

export default function OverlayContainer({ token }: Props) {
  const { challenges, rotationMs } = useOverlay(token);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (challenges.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % challenges.length);
    }, rotationMs);

    return () => clearInterval(timer);
  }, [challenges.length, rotationMs]);

  if (!challenges.length) {
    return <div className="text-center text-gray-400">No active challenges – drop one in chat 👀</div>;
  }

  return (
    <ChallengeOverlay
      challenge={challenges[currentIndex]}
      key={challenges[currentIndex].id}
    />
  );
}
```

### 4.3 Hooks (Realtime)

#### `lib/hooks/useChallenges.ts`
```typescript
export function useChallenges(channelId: string) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChallenges = async () => {
      const { data } = await supabase
        .from('challenges')
        .select('*, sub_challenges(*)')
        .eq('channel_id', channelId)
        .eq('status', 'active');

      setChallenges(data || []);
      setIsLoading(false);
    };

    fetchChallenges();

    // Subscribe to realtime updates
    const subscription = supabase
      .channel(`challenges:${channelId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'challenges', filter: `channel_id=eq.${channelId}` },
        (payload) => {
          // Update challenges on any change
          setChallenges((prev) =>
            payload.eventType === 'DELETE'
              ? prev.filter((c) => c.id !== payload.old.id)
              : prev.map((c) => (c.id === payload.new.id ? payload.new : c))
          );
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, [channelId]);

  return { challenges, isLoading };
}
```

---

## 5. Authentication Flow

### 5.1 Magic Link Flow (Detailed)

```
1. User enters email → POST /api/auth/magic-link
   ├─ Supabase.auth.signInWithOtp({ email })
   ├─ User receives email with callback link
   └─ Callback redirects to /api/auth/callback?code=xxx

2. /api/auth/callback?code=xxx
   ├─ Exchange code for session
   ├─ Supabase returns JWT + refresh token
   ├─ Store JWT in httpOnly cookie (Supabase client library)
   └─ Redirect to /dashboard

3. Browser middleware checks for JWT:
   ├─ Valid JWT → Grant access to /app/* routes
   └─ No JWT → Redirect to /login
```

### 5.2 Session Management (Next.js Middleware)

```typescript
// middleware.ts
import { createClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getSetCookie();
        },
        setAll(cookiesToSet) {
          const response = NextResponse.next();
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
          return response;
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect /app routes
  if (request.nextUrl.pathname.startsWith('/app') && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Public overlay routes don't need auth
  if (request.nextUrl.pathname.startsWith('/overlay')) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*', '/overlay/:path*'],
};
```

---

## 6. Realtime & WebSocket Strategy

### 6.1 Supabase Realtime Subscriptions

**Dashboard (Moderator):**
```typescript
// Subscribe to challenge & sub-challenge changes
supabase
  .channel(`channel:${channelId}`)
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'challenges' },
    (payload) => handleChallengeChange(payload)
  )
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'sub_challenges' },
    (payload) => handleSubChange(payload)
  )
  .subscribe();
```

**Overlay (Public):**
```typescript
// Public channel for overlay token
supabase
  .channel(`overlay:${token}`)
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'challenges' },
    (payload) => handleOverlayUpdate(payload)
  )
  .subscribe();
```

### 6.2 Fallback Strategy (Polling)

If Realtime disconnects, poll every 1s until reconnected:
```typescript
const fallbackInterval = setInterval(async () => {
  const data = await fetchChallenges(channelId);
  updateState(data);
}, 1000);

// Resume Realtime when connection restored
subscription.on('SUBSCRIPTION_STATE', (state) => {
  if (state === 'SUBSCRIBED') clearInterval(fallbackInterval);
});
```

---

## 7. State Management

Use **React hooks + Context** (no Redux needed for MVP):

```typescript
// lib/contexts/ChallengeContext.tsx
interface ChallengeContextType {
  challenges: Challenge[];
  subChallenges: SubChallenge[];
  updateProgress: (subId: string, amount: number) => Promise<void>;
  undoActions: (count: number) => Promise<void>;
}

const ChallengeContext = createContext<ChallengeContextType>(null!);

export function ChallengeProvider({ children }) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [undoQueue, setUndoQueue] = useState<AuditLog[]>([]);

  // Sync via Realtime
  useEffect(() => {
    const sub = supabase.channel('challenges').on('*', (payload) => {
      // Update state
    }).subscribe();
    return () => sub.unsubscribe();
  }, []);

  return (
    <ChallengeContext.Provider value={{ challenges, updateProgress, undoActions }}>
      {children}
    </ChallengeContext.Provider>
  );
}
```

---

## 8. Types (TypeScript)

```typescript
// lib/types/index.ts
export interface User {
  id: string;
  email: string;
  role: 'streamer' | 'moderator' | 'admin';
  created_at: string;
}

export interface Channel {
  id: string;
  streamer_id: string;
  channel_name: string;
  overlay_token: string;
  overlay_token_expires_at: string;
  overlay_rotation_ms: number;
  created_at: string;
}

export interface Challenge {
  id: string;
  channel_id: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface SubChallenge {
  id: string;
  challenge_id: string;
  title: string;
  type: 'numeric' | 'boolean';
  target_value?: number;
  current_progress: number;
  status: 'pending' | 'completed';
  sort_order: number;
  created_at: string;
}

export interface AuditLog {
  id: string;
  channel_id: string;
  moderator_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value?: Record<string, any>;
  new_value?: Record<string, any>;
  created_at: string;
}
```

---

## 9. Performance Optimizations

### 9.1 Frontend

| Optimization | Method |
| --- | --- |
| Code splitting | Dynamic imports for modals |
| Image optimization | Next.js Image component |
| CSS | Tailwind purging (production build) |
| Caching | SWR or react-query for challenge queries |
| Overlay | Lightweight vanilla JS option for reduced bundle |

### 9.2 Backend

| Optimization | Method |
| --- | --- |
| DB indexes | On `channel_id`, `status`, `overlay_token` |
| Realtime filter | Subscriptions scoped to `channel_id` |
| Token expiration | Overlay tokens auto-expire (7 days) |
| Audit log cleanup | Archive logs > 30 days |

### 9.3 Latency Targets

| Action | Target | Method |
| --- | --- | --- |
| Magic link delivery | < 2s | Supabase OTP |
| Challenge creation | < 1s | Direct API + Realtime |
| Progress update | < 500ms | Optimistic UI + Realtime |
| Overlay rotation | < 100ms | Client-side timer |

---

## 10. Deployment & DevOps

### 10.1 Vercel Configuration

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "https://your-project.supabase.co",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "eyJhbGc...",
    "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGc..." // Server only
  },
  "functions": {
    "api/**": {
      "memory": 256,
      "maxDuration": 10
    }
  }
}
```

### 10.2 Environment Variables

```env
# Public (safe for frontend)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Server-only (never leak to client)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXTAUTH_SECRET=random-secret-for-csrf

# Optional
NEXT_PUBLIC_SENTRY_DSN=https://...
```

### 10.3 Deployment Steps

```bash
# 1. Push to GitHub
git push origin main

# 2. Vercel auto-deploys (you can set up preview + production)
# Preview: on PR
# Production: on main merge

# 3. Database migrations (Supabase migrations)
supabase migration up

# 4. Verify health
curl https://your-app.vercel.app/api/health
```

---

## 11. Error Handling & Logging

### 11.1 API Error Responses

```typescript
// Consistent error format
{
  success: false;
  error: {
    code: 'VALIDATION_ERROR' | 'AUTH_REQUIRED' | 'NOT_FOUND' | 'INTERNAL_ERROR';
    message: string;
  }
}
```

### 11.2 Client-Side Error Boundary

```typescript
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="text-center p-8">
      <h2 className="text-xl font-bold">Something went wrong</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

---

## 12. Testing Strategy (MVP)

### 12.1 Unit Tests (Jest + React Testing Library)

```typescript
// __tests__/components/ChallengeCard.test.tsx
describe('ChallengeCard', () => {
  it('renders challenge title', () => {
    const { getByText } = render(
      <ChallengeCard challenge={mockChallenge} />
    );
    expect(getByText('Kill 10 Enemies')).toBeInTheDocument();
  });

  it('calls onIncrement when + button clicked', async () => {
    const onIncrement = jest.fn();
    const { getByRole } = render(
      <SubChallengeRow onIncrement={onIncrement} />
    );
    fireEvent.click(getByRole('button', { name: /\+/ }));
    expect(onIncrement).toHaveBeenCalled();
  });
});
```

### 12.2 E2E Tests (Playwright or Cypress)

```typescript
// e2e/moderator-flow.spec.ts
test('Moderator updates progress live', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'mod@example.com');
  await page.click('button:has-text("Send Link")');
  
  // Simulate clicking magic link
  await page.goto('/api/auth/callback?code=test-code');
  
  // Verify dashboard loads
  await page.waitForSelector('[data-testid="challenge-list"]');
  
  // Update sub-challenge
  await page.click('button:has-text("+")');
  await page.waitForSelector('[data-testid="progress-3-of-10"]');
});
```

---

## 13. Security Checklist

- [ ] All API routes validate JWT before returning data
- [ ] RLS policies enforce row-level access control
- [ ] Overlay token expires in 7 days (auto-regenerate)
- [ ] Magic link tokens single-use, expire in 10 minutes
- [ ] Audit log tracks all mutations (for undo + compliance)
- [ ] CORS restricted to own domain (Vercel project)
- [ ] CSP headers set (Vercel default + Supabase iframe)
- [ ] No secrets in git (use Vercel env vars)
- [ ] HTTPS only (Vercel default)

---

## 14. Monitoring & Observability

### 14.1 Vercel Analytics

```typescript
// Automatic in Next.js 13+
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout() {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### 14.2 Supabase Logs

```typescript
// Log critical events to Supabase
const logEvent = async (event: string, data: any) => {
  await supabase
    .from('event_log')
    .insert([
      {
        event,
        data,
        timestamp: new Date(),
        channel_id: currentChannelId,
      },
    ]);
};
```

---

## 15. Development Workflow

### 15.1 Local Setup

```bash
# Clone repo
git clone <repo>
cd live-challenge-tracker

# Install deps
npm install

# Set up .env.local
cp .env.example .env.local
# Fill in Supabase keys

# Start dev server
npm run dev

# Start Supabase local (optional)
supabase start

# Open http://localhost:3000
```

### 15.2 Git Branching

```
main (production)
├── develop (staging)
│   └── feature/challenge-mvp
│   └── fix/overlay-rotation
└── feature branches (short-lived)
```

### 15.3 PR Checklist

- [ ] Tests pass (`npm run test`)
- [ ] TypeScript strict mode (`npm run type-check`)
- [ ] Linting (`npm run lint`)
- [ ] Vercel preview deployed
- [ ] Database migrations applied
- [ ] Screenshots/video if UI change

---

## 16. Rollout Plan

### Phase 1: Internal (Week 1)
- Deploy to staging (Vercel preview)
- Test all flows (streamer, mod, overlay)
- Fix critical bugs

### Phase 2: Beta Streamers (Week 2-3)
- Invite 3-5 streamers
- Collect feedback via Discord/email
- Iterate on UX

### Phase 3: Production (Week 4)
- Deploy to production main
- Monitor uptime + error rates
- Go-live announcement

---

## 17. Tech Debt & Future Improvements

| Item | Reason | When |
| --- | --- | --- |
| Migrate to SWR/React Query | Better cache management | Post-MVP |
| Add unit tests (coverage > 70%) | Reduce regressions | Post-MVP |
| Migrate overlay to custom React component | Better styling control | Post-MVP |
| Implement subscriber submissions | Feature expansion | Post-MVP |

---

## Summary

This TDD translates the PRD into a **fully executable blueprint**:

✅ **Database schema** is normalized + RLS-secured  
✅ **API routes** are RESTful + typed  
✅ **Frontend** uses modern Next.js patterns (App Router, Realtime hooks)  
✅ **Deployment** is Vercel-native (0 DevOps needed)  
✅ **Performance** targets are aggressive but achievable  
✅ **Security** is baked in (magic links, RLS, tokens)  

