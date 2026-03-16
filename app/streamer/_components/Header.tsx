'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';
import { Bell, Search, LogOut, ShieldCheck, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile } = useAuthStore();

  const handleSignOut = async () => {
    const result = await authService.signOut();
    if (result.success) {
      window.location.href = '/login';
    } else {
      console.error('Sign out failed:', result.error);
      // Even if failed, try to redirect
      window.location.href = '/login';
    }
  };

  const getPageTitle = () => {
    const segment = pathname.split('/').pop()?.toUpperCase();
    if (segment === 'DASHBOARD') return 'DASHBOARD';
    if (segment === 'CHALLENGES') return 'CHALLENGES';
    if (segment === 'MODERATOR') return 'MODERATORS';
    if (segment === 'OVERLAY') return 'OVERLAY_CONFIG';
    if (segment === 'MEMBERSHIP') return 'MEMBERSHIP_OVERLAY';
    if (segment === 'PROFILE') return 'PROFILE';
    return segment || 'STREAMER';
  };

  return (
    <header className="h-14 md:h-16 border-b border-gunmetal bg-armor flex items-center justify-between px-3 md:px-8 relative overflow-hidden">
      {/* HUD Background Pattern */}
      <div className="absolute top-0 right-0 w-1/4 h-full bg-gradient-to-l from-tactical/5 to-transparent pointer-events-none"></div>

      <div className="flex items-center gap-3 md:gap-6">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuToggle}
          className="md:hidden p-1.5 text-dimmed hover:text-tactical transition-colors border border-gunmetal"
        >
          <Menu size={20} />
        </button>

        <div className="flex flex-col">
          <h2 className="text-base md:text-xl font-black italic tracking-tighter leading-none inline-flex items-center gap-2">
            <span className="text-tactical">/</span> {getPageTitle()}
          </h2>
          <span className="text-[10px] text-dimmed font-mono tracking-widest mt-1 hidden md:inline"></span>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        {/* Search - Tactical Style */}
        <div className="hidden md:flex items-center bg-void border border-gunmetal px-3 py-1.5 focus-within:border-tactical transition-colors">
          <Search size={14} className="text-dimmed" />
          <input
            type="text"
            placeholder="SEARCH_DATA..."
            className="bg-transparent border-none outline-none text-[10px] font-mono ml-2 w-48 text-hud placeholder:text-muted"
          />
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button className="text-dimmed hover:text-tactical transition-colors p-2 border border-transparent hover:border-gunmetal">
            <Bell size={18} />
          </button>

          <div className="h-8 w-px bg-gunmetal hidden md:block"></div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-chakra font-bold leading-none uppercase">{profile?.name || user?.email?.split('@')[0] || 'STREAMER_01'}</div>
              <div className="text-[10px] text-tactical font-mono leading-none mt-1 uppercase flex items-center justify-end gap-1">
                <ShieldCheck size={10} /> STREAMER_LEVEL
              </div>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 border border-gunmetal bg-void p-0.5 tactical-border mr-1 md:mr-2">
              <div className="w-full h-full bg-gunmetal flex items-center justify-center text-tactical font-black italic text-sm md:text-base">
                {user?.email?.[0].toUpperCase() || 'O'}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="text-dimmed hover:text-hostile transition-colors p-2 border border-transparent hover:border-hostile/20 hidden md:block"
              title="SIGN_OUT"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-tactical to-transparent opacity-50"></div>
    </header>
  );
}
