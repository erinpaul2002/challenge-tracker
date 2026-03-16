'use client';

import { usePathname } from 'next/navigation';
import { Cpu, UserCheck, LogOut, Menu } from 'lucide-react';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const pathname = usePathname();
  const { profile, hydrated } = useAuthStore();
  const moderatorDisplayName = hydrated && profile?.name?.trim()
    ? profile.name
    : 'MODERATOR_01';

  const handleSignOut = () => {
    void (async () => {
      await authService.signOut();
      window.location.href = '/login';
    })();
  };

  const getPageTitle = () => {
    const segment = pathname.split('/').pop()?.toUpperCase();
    if (segment === 'DASHBOARD') return 'OVERVIEW';
    if (segment === 'CHALLENGES') return 'CHALLENGE_LOGS';
    if (segment === 'MEMBERSHIP') return 'MEMBERSHIP';
    return segment || 'MODERATOR';
  };

  return (
    <header className="h-14 md:h-16 border-b border-gunmetal bg-armor flex items-center justify-between px-4 md:px-8 relative overflow-hidden shrink-0">
      {/* Background HUD Graphics */}
      <div className="absolute left-0 top-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/simple-dashed.png')] opacity-10 pointer-events-none"></div>

      <div className="flex items-center gap-3 md:gap-6 relative z-10">
        {/* Hamburger button — mobile only */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 text-dimmed hover:text-tactical transition-colors border border-gunmetal hover:border-tactical"
        >
          <Menu size={20} />
        </button>

        <div className="flex flex-col">
          <h2 className="text-base md:text-xl font-black italic tracking-tighter leading-none inline-flex items-center gap-2">
            <span className="text-tactical">#</span> {getPageTitle()}
          </h2>
          <span className="text-[10px] text-dimmed font-mono tracking-widest mt-1 hidden md:block"></span>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-8 relative z-10">
        {/* Moderator Info */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-chakra font-bold leading-none uppercase">
              {moderatorDisplayName}
            </div>
            <div className="text-[10px] text-terminal font-mono leading-none mt-1 uppercase flex items-center justify-end gap-1">
              <UserCheck size={10} />
            </div>
          </div>
          <div className="w-9 h-9 md:w-10 md:h-10 border border-tactical bg-void p-0.5 tactical-border flex items-center justify-center text-tactical font-black italic shadow-[0_0_10px_rgba(242,201,76,0.2)]">
            <Cpu size={18} />
          </div>
          <button
            onClick={handleSignOut}
            className="text-dimmed hover:text-hostile transition-colors p-2 border border-transparent hover:border-hostile/20"
            title="EXIT_TERMINAL"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-tactical to-transparent opacity-50"></div>
    </header>
  );
}
