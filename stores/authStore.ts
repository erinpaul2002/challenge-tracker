'use client';

import { useEffect, useSyncExternalStore } from 'react';

export interface AuthUser {
  id?: string;
  email?: string;
  role?: 'streamer' | 'moderator';
}

export interface AuthProfile {
  id: string;
  email: string;
  name?: string;
  channel_name?: string;
  overlay_link?: string;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: AuthUser | null;
  profile: AuthProfile | null;
  loading: boolean;
  error: string | null;
  hydrated: boolean;
}

interface AuthStore extends AuthState {
  setUser: (user: AuthUser | null) => void;
  setProfile: (profile: AuthProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
}

const initialState: AuthState = {
  user: null,
  profile: null,
  loading: false,
  error: null,
  hydrated: false,
};

let state: AuthState = initialState;
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function setState(partial: Partial<AuthState>) {
  state = { ...state, ...partial };
  emitChange();
}

function parseJSON<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function hydrateFromStorage() {
  if (typeof window === 'undefined' || state.hydrated) return;

  const streamerSession = parseJSON<{
    streamer_id?: string;
    email?: string;
    name?: string;
    channel_name?: string;
  }>(window.localStorage.getItem('streamer_session'));

  if (streamerSession?.email) {
    setState({
      user: {
        id: streamerSession.streamer_id,
        email: streamerSession.email,
        role: 'streamer',
      },
      profile: {
        id: streamerSession.streamer_id ?? 'local-streamer',
        email: streamerSession.email,
        name: streamerSession.name,
        channel_name: streamerSession.channel_name,
        overlay_link: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      hydrated: true,
      error: null,
    });
    return;
  }

  const moderatorSession = parseJSON<{
    moderator_id?: string;
    streamer_name?: string;
  }>(window.localStorage.getItem('moderator_session'));

  if (moderatorSession?.moderator_id) {
    setState({
      user: {
        id: moderatorSession.moderator_id,
        email: undefined,
        role: 'moderator',
      },
      profile: {
        id: moderatorSession.moderator_id,
        email: '',
        name: moderatorSession.streamer_name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      hydrated: true,
      error: null,
    });
    return;
  }

  setState({ hydrated: true });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function clearClientSessions() {
  if (typeof window === 'undefined') return;

  window.localStorage.removeItem('streamer_session');
  window.localStorage.removeItem('moderator_session');

  document.cookie = 'streamer_session=; Path=/; Max-Age=0; SameSite=Lax';
  document.cookie = 'moderator_session=; Path=/; Max-Age=0; SameSite=Lax';
}

const actions = {
  setUser: (user: AuthUser | null) => setState({ user }),
  setProfile: (profile: AuthProfile | null) => {
    const user = profile?.email
      ? {
          id: profile.id,
          email: profile.email,
          role: 'streamer' as const,
        }
      : state.user;

    setState({ profile, user, error: null });
  },
  setLoading: (loading: boolean) => setState({ loading }),
  setError: (error: string | null) => setState({ error }),
  clearAuth: () => {
    clearClientSessions();
    setState({
      user: null,
      profile: null,
      loading: false,
      error: null,
      hydrated: true,
    });
  },
};

export function useAuthStore(): AuthStore {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (!state.hydrated) {
      hydrateFromStorage();
    }
  }, []);

  return {
    ...snapshot,
    ...actions,
  };
}
