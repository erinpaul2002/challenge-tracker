'use client';

import {
  UserCircle,
  Mail,
  Tv,
  ShieldCheck,
  Save,
  Camera,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface ProfileData {
  id: string;
  email: string;
  name?: string;
  channel_name?: string;
  overlay_link?: string;
  created_at: string;
  updated_at: string;
}

export default function ProfilePage() {
  const { user, profile: authProfile, setProfile: setGlobalProfile, hydrated } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isModified, setIsModified] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    channel_name: '',
    overlay_link: ''
  });
  const [originalFormData, setOriginalFormData] = useState({
    name: '',
    channel_name: '',
    overlay_link: ''
  });

  const streamerEmail = user?.email ?? authProfile?.email;
  const streamer = useQuery(
    api.auth.getStreamerByEmail,
    streamerEmail ? { email: streamerEmail } : 'skip'
  );
  const convexProfile = useQuery(
    api.profile.getProfile,
    streamer?._id ? { streamerId: streamer._id } : 'skip'
  );
  const updateProfileMutation = useMutation(api.profile.updateProfile);

  const isLoading = !hydrated || (Boolean(streamerEmail) && (streamer === undefined || convexProfile === undefined));

  useEffect(() => {
    if (!convexProfile) return;

    const mappedProfile: ProfileData = {
      id: convexProfile._id,
      email: convexProfile.email,
      name: convexProfile.name,
      channel_name: convexProfile.channelName,
      overlay_link: convexProfile.overlayLink,
      created_at: new Date(convexProfile._creationTime).toISOString(),
      updated_at: new Date(convexProfile._creationTime).toISOString(),
    };

    setProfile(mappedProfile);
    setGlobalProfile(mappedProfile);

    const initialData = {
      name: mappedProfile.name || '',
      channel_name: mappedProfile.channel_name || '',
      overlay_link: mappedProfile.overlay_link || '',
    };

    setFormData(initialData);
    setOriginalFormData(initialData);
  }, [convexProfile, setGlobalProfile]);

  // Detect form changes
  useEffect(() => {
    const hasChanged =
      formData.name !== originalFormData.name ||
      formData.channel_name !== originalFormData.channel_name ||
      formData.overlay_link !== originalFormData.overlay_link;
    setIsModified(hasChanged);
  }, [formData, originalFormData]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-20">
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-2 border-tactical border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="text-dimmed font-mono text-sm uppercase tracking-widest">LOADING_PROFILE_DATA...</div>
          </div>
        </div>
      ) : (
        <>
          {/* Profile Header Card */}
          <div className="bg-armor border border-gunmetal p-4 md:p-8 tactical-border relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <UserCircle size={160} />
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 relative z-10">
              <div className="relative group">
                <div className="w-32 h-32 border-2 border-gunmetal bg-void p-1 tactical-border relative overflow-hidden">
                  <div className="w-full h-full bg-gunmetal flex items-center justify-center text-tactical text-4xl font-black italic">
                    {user?.email?.[0].toUpperCase() || 'O'}
                  </div>
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-tactical text-void rounded-none hover:bg-white transition-colors border border-void">
                  <Camera size={14} />
                </button>
              </div>

              <div className="flex-1 text-center md:text-left space-y-2">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 justify-center md:justify-start">
                  <h1 className="text-2xl md:text-4xl font-black italic tracking-tighter uppercase">
                    {profile?.name || user?.email?.split('@')[0] || 'STREAMER_X'}
                  </h1>
                </div>
                <div className="flex items-center gap-4 justify-center md:justify-start font-mono text-xs text-dimmed uppercase tracking-widest">
                  <span className="flex items-center gap-1"><Mail size={12} /> {user?.email}</span>
                  <span className="flex items-center gap-1 text-terminal"><ShieldCheck size={12} /> VERIFIED</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Settings Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Channel Info */}
              <div className="bg-armor border border-gunmetal divide-y divide-gunmetal">
                <div className="p-4 bg-gunmetal/20 flex items-center gap-3 font-chakra font-black text-sm italic tracking-widest border-b border-gunmetal">
                  <Tv size={18} className="text-tactical" /> CHANNEL_STATS
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-dimmed uppercase tracking-widest">STREAM_IDENTIFIER</label>
                      <input
                        type="text"
                        className="w-full input-tactical"
                        value={formData.channel_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, channel_name: e.target.value }))}
                        placeholder={user?.email?.split('@')[0]}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-dimmed uppercase tracking-widest">DISPLAY_NICKNAME</label>
                      <input
                        type="text"
                        className="w-full input-tactical"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>



              {isModified && (
                <div className="flex gap-4">
                  <button
                    className="flex-1 btn-tactical py-4 flex items-center justify-center gap-2"
                    onClick={async () => {
                      if (!streamer?._id) {
                        console.error('Streamer account not found');
                        return;
                      }

                      setIsSaving(true);
                      try {
                        const updated = await updateProfileMutation({
                          streamerId: streamer._id,
                          name: formData.name || undefined,
                          channelName: formData.channel_name || undefined,
                          overlayLink: formData.overlay_link || undefined,
                        });

                        const mappedUpdated: ProfileData = {
                          id: updated._id,
                          email: updated.email,
                          name: updated.name,
                          channel_name: updated.channelName,
                          overlay_link: updated.overlayLink,
                          created_at: new Date(updated._creationTime).toISOString(),
                          updated_at: new Date(updated._creationTime).toISOString(),
                        };

                        setProfile(mappedUpdated);
                        setGlobalProfile(mappedUpdated);
                        setOriginalFormData(formData);
                        setIsModified(false);
                      } catch (error) {
                        console.error('Failed to update profile:', error);
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                    disabled={isSaving}
                  >
                    {isSaving ? 'REWRITING_DATA...' : <><Save size={18} /> CONFIRM_CHANGES</>}
                  </button>
                  <button
                    className="px-8 bg-hostile/10 hover:bg-hostile text-hostile hover:text-white border border-hostile/50 transition-colors font-chakra font-bold text-xs tracking-widest uppercase"
                    onClick={() => {
                      setFormData(originalFormData);
                      setIsModified(false);
                    }}
                  >
                    REVERT
                  </button>
                </div>
              )}
            </div>

            {/* Action Sidebar */}
            {/* <div className="space-y-6">
          <div className="bg-hostile/5 border border-hostile/20 p-6 relative">
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <LogOut size={24} />
            </div>
            <h4 className="text-xs font-bold font-chakra text-hostile uppercase tracking-widest mb-2">DANGER_ZONE</h4>
            <p className="text-[10px] font-mono text-dimmed mb-6">
              DELETING THIS ACCOUNT WILL REMOVE ALL DATA, CHALLENGES, AND MODERATOR ACCESS PERMANENTLY.
            </p>
            <button className="w-full bg-hostile/10 hover:bg-hostile text-hostile hover:text-white border border-hostile/50 py-3 font-chakra font-bold text-xs transition-all uppercase tracking-widest">
              DELETE_ACCOUNT
            </button>
          </div>

          <div className="flex items-center justify-center gap-6 p-4 border border-gunmetal opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer">
            <TrendingUp size={24} />
            <Award size={24} />
            <ShieldCheck size={24} />
          </div>
        </div> */}
          </div>
        </>
      )}
    </div>
  );
}
