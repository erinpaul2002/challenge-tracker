'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { SearchableSelect } from '@/app/components/SearchableSelect';
import { useAction, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { User, Shield, AlertTriangle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [loginType, setLoginType] = useState<'streamer' | 'moderator'>('streamer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedStreamer, setSelectedStreamer] = useState('');
  const moderatorLoginOptions = useQuery(api.moderators.getModeratorLoginOptions, {});
  const signInStreamer = useAction(api.auth.signInStreamer);
  const signInModerator = useAction(api.auth.signInModerator);
  
  const router = useRouter();
  const { loading, error, setError, setLoading, clearAuth, setProfile } = useAuthStore();

  const setSessionCookie = (name: 'streamer_session' | 'moderator_session', value: string) => {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=604800; SameSite=Lax`;
  };

  // Check for existing sessions on mount
  useEffect(() => {
    const checkExistingSessions = async () => {
      // Check for moderator session
      const moderatorSession = localStorage.getItem('moderator_session');
      if (moderatorSession) {
        try {
          JSON.parse(moderatorSession); // Validate it's valid JSON
          router.push('/moderator/dashboard');
          return;
        } catch {
          localStorage.removeItem('moderator_session');
        }
      }

      // Check for streamer session
      const streamerSession = localStorage.getItem('streamer_session');
      if (streamerSession) {
        try {
          const parsed = JSON.parse(streamerSession) as { email?: string; name?: string; channel_name?: string };
          if (parsed.email) {
            setSessionCookie('streamer_session', streamerSession);
            setProfile({
              id: 'convex-streamer',
              email: parsed.email,
              name: parsed.name,
              channel_name: parsed.channel_name,
              overlay_link: undefined,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            router.push('/streamer/dashboard');
            return;
          }
        } catch {
          localStorage.removeItem('streamer_session');
        }
      }
    };

    checkExistingSessions();
  }, [router, setProfile]);

  const streamers = (moderatorLoginOptions ?? []).map((option: {
    moderatorId: Id<'moderators'>;
    streamerId: Id<'streamers'>;
    name: string;
    channelName?: string;
  }) => ({
    id: option.moderatorId,
    name: option.name,
    channel_name: option.channelName,
    streamer_id: option.streamerId,
  }));

  const loadingStreamers = loginType === 'moderator' && moderatorLoginOptions === undefined;

  const handleStreamerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signInStreamer({ email, password });

      localStorage.setItem(
        'streamer_session',
        JSON.stringify({
          session_token: result.sessionToken,
          email: result.email,
          name: result.name,
          channel_name: result.channelName,
          streamer_id: result.streamerId,
          created_at: new Date().toISOString(),
        })
      );
      setSessionCookie('streamer_session', result.sessionToken);

      setProfile({
        id: result.streamerId,
        email: result.email,
        name: result.name,
        channel_name: result.channelName,
        overlay_link: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      router.push('/streamer/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      setError(message);
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  const handleModeratorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signInModerator({
        moderatorId: selectedStreamer as Id<'moderators'>,
        password,
      });

      localStorage.setItem(
        'moderator_session',
        JSON.stringify({
          session_token: result.sessionToken,
          moderator_id: result.moderatorId,
          streamer_id: result.streamerId,
          streamer_name: result.streamerName,
          streamer_channel: result.streamerChannel,
          created_at: new Date().toISOString(),
        })
      );
      setSessionCookie('moderator_session', result.sessionToken);

      router.push('/moderator/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      setError(message);
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-tactical/30"></div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-tactical/30"></div>
      
      <div className="w-full max-w-md z-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-block border-2 border-tactical p-2 mb-4 clip-corner">
            <h1 className="text-3xl font-black italic tracking-tighter">
              STREAMER<span className="text-tactical">LOGIN</span>
            </h1>
          </div>
          <p className="text-dimmed text-xs uppercase tracking-widest font-bold">
            Login Required
          </p>
        </div>

        {/* Auth Container */}
        <div className="bg-panel border border-gunmetal p-8 tactical-border shadow-2xl backdrop-blur-sm">
          {/* Toggle */}
          <div className="flex mb-8 bg-void p-1 clip-corner border border-muted">
            <button
              onClick={() => { setLoginType('streamer'); clearAuth(); }}
              className={`flex-1 py-2 flex items-center justify-center gap-2 font-chakra text-sm transition-all ${
                loginType === 'streamer' ? 'bg-tactical text-void font-bold italic' : 'text-dimmed hover:text-hud'
              }`}
              style={{ clipPath: 'polygon(0 0, 95% 0, 100% 25%, 100% 100%, 5% 100%, 0 75%)' }}
            >
              <User size={16} />
              STREAMER
            </button>
            <button
              onClick={() => { setLoginType('moderator'); clearAuth(); }}
              className={`flex-1 py-2 flex items-center justify-center gap-2 font-chakra text-sm transition-all ${
                loginType === 'moderator' ? 'bg-tactical text-void font-bold italic' : 'text-dimmed hover:text-hud'
              }`}
              style={{ clipPath: 'polygon(5% 0, 100% 0, 100% 75%, 95% 100%, 0 100%, 0 25%)' }}
            >
              <Shield size={16} />
              MODERATOR
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-hostile/10 border-l-4 border-hostile flex items-start gap-3">
              <AlertTriangle className="text-hostile shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-hud font-mono">{error}</p>
            </div>
          )}

          <form onSubmit={loginType === 'streamer' ? handleStreamerLogin : handleModeratorLogin} className="space-y-6">
            {loginType === 'streamer' ? (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] text-tactical font-bold uppercase tracking-widest ml-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-tactical w-full"
                    placeholder="streamer@gmail.com"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <SearchableSelect
                    options={streamers}
                    value={selectedStreamer}
                    onChange={setSelectedStreamer}
                    label="Select Streamer"
                    placeholder={loadingStreamers ? '-- LOADING CHANNELS --' : '-- SELECT CHANNEL --'}
                    required
                  />
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-[10px] text-tactical font-bold uppercase tracking-widest ml-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-tactical w-full"
                placeholder="************"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-tactical w-full flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  INITIALIZING...
                </>
              ) : (
                <>
                  ESTABLISH CONNECTION
                </>
              )}
            </button>
          </form>

          {loginType === 'streamer' && (
            <div className="mt-8 pt-6 border-t border-gunmetal text-center">
              <p className="text-dimmed text-[10px] uppercase font-bold tracking-tighter">
                New Streamer? <Link href="/signup" className="text-tactical hover:underline ml-2">Sign Up</Link>
              </p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-12 flex justify-between items-center px-2">
          <div className="flex gap-4">
            <div className="w-2 h-2 bg-terminal rounded-full animate-pulse"></div>
            <span className="text-[10px] text-dimmed font-mono uppercase tracking-widest">System Online</span>
          </div>
          <span className="text-[10px] text-dimmed font-mono uppercase tracking-widest">v1.0.4-beta</span>
        </div>
      </div>
    </div>
  );
}
