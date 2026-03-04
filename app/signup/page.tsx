'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { UserPlus, AlertTriangle, Loader2, ArrowLeft } from 'lucide-react';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    channel_name: '',
    password: '',
    confirmPassword: '',
  });
  
  const router = useRouter();
  const { loading, error, setError, setLoading, setProfile } = useAuthStore();
  const signUpStreamer = useAction(api.auth.signUpStreamer);

  const setSessionCookie = (token: string) => {
    if (typeof document === 'undefined') return;
    document.cookie = `streamer_session=${encodeURIComponent(token)}; Path=/; Max-Age=604800; SameSite=Lax`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Password mismatch error');
      return;
    }

    setLoading(true);

    try {
      const result = await signUpStreamer({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        channelName: formData.channel_name || undefined,
      });

      localStorage.setItem(
        'streamer_session',
        JSON.stringify({
          session_token: result.sessionToken,
          email: formData.email,
          name: formData.name,
          channel_name: formData.channel_name || undefined,
          streamer_id: result.streamerId,
          created_at: new Date().toISOString(),
        })
      );
      setSessionCookie(result.sessionToken);

      setProfile({
        id: result.streamerId,
        email: formData.email,
        name: formData.name,
        channel_name: formData.channel_name || undefined,
        overlay_link: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      router.push('/streamer/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      setError(message);
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-10 right-10 w-64 h-64 border border-tactical/10 rounded-full pointer-events-none"></div>
      <div className="absolute -bottom-20 -left-20 w-96 h-96 border border-tactical/5 rounded-full pointer-events-none"></div>
      
      <div className="w-full max-w-lg z-10">
        {/* Back navigation */}
        <Link href="/login" className="mb-6 inline-flex items-center gap-2 text-dimmed hover:text-tactical transition-colors text-xs font-bold uppercase tracking-widest">
          <ArrowLeft size={14} />
          Return to Login
        </Link>

        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="border-l-4 border-tactical pl-4">
            <h1 className="text-4xl font-black italic tracking-tight uppercase">
              Streamer <span className="text-tactical">Signup</span>
            </h1>
            <p className="text-dimmed text-[10px] uppercase tracking-[0.2em] font-bold mt-1">
              Creating New Streamer Account
            </p>
          </div>
        </div>

        {/* Auth Container */}
        <div className="bg-panel border border-gunmetal p-8 tactical-border shadow-2xl backdrop-blur-sm relative">
          {/* Top-right corner accent */}
          <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden">
             <div className="absolute top-[-25px] right-[-25px] w-[50px] h-[50px] bg-gunmetal rotate-45"></div>
          </div>

          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gunmetal">
            <UserPlus className="text-tactical" size={24} />
            <span className="text-sm font-chakra font-bold tracking-widest text-hud">REGISTRATION FORM</span>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-hostile/10 border-l-4 border-hostile flex items-start gap-3">
              <AlertTriangle className="text-hostile shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-hud font-mono">{error}</p>
            </div>
          )}

          <form onSubmit={handleSignup} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] text-tactical font-bold uppercase tracking-widest ml-1">
                Display Name
              </label>
              <input
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="input-tactical w-full"
                placeholder="STREAMER NAME"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-tactical font-bold uppercase tracking-widest ml-1">
                Channel Handle
              </label>
              <input
                name="channel_name"
                value={formData.channel_name}
                onChange={handleChange}
                className="input-tactical w-full"
                placeholder="@TWITCH_HANDLE"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] text-tactical font-bold uppercase tracking-widest ml-1">
                Comm-Link [Email]
              </label>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="input-tactical w-full"
                placeholder="streamer@channel.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-tactical font-bold uppercase tracking-widest ml-1">
                Encription Key
              </label>
              <input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="input-tactical w-full"
                placeholder="************"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-tactical font-bold uppercase tracking-widest ml-1">
                Verify Key
              </label>
              <input
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input-tactical w-full"
                placeholder="************"
              />
            </div>

            <div className="md:col-span-2 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-tactical w-full flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    PROCESSING...
                  </>
                ) : (
                  <>
                    CONFIRM REGISTRATION
                    <div className="w-0 group-hover:w-4 overflow-hidden transition-all duration-300">
                      <UserPlus size={16} />
                    </div>
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="mt-8 text-[9px] text-dimmed uppercase font-bold text-center leading-relaxed">
            By proceeding, you agree to the terms of service and privacy policy of the Challenge Tracker system.
          </p>
        </div>

        {/* Side bar accents */}
        <div className="grid grid-cols-4 gap-2 mt-4 px-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-1 bg-gunmetal clip-corner"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
