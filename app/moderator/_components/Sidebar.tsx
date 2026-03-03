'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Sword,
  LogOut,
  ChevronRight,
  Shield,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const navItems = [
  { name: 'DASHBOARD', icon: LayoutDashboard, href: '/moderator/dashboard' },
  { name: 'CHALLENGES', icon: Sword, href: '/moderator/challenges' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = () => {
    localStorage.removeItem('moderator_session');
    router.push('/login');
  };

  return (
    <div className={`
      fixed lg:static inset-y-0 left-0 z-40
      w-64 bg-[#0a0a0a] border-r border-gunmetal flex flex-col
      transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      {/* Sidebar Header */}
      <div className="p-6 border-b border-gunmetal flex items-center justify-between">
        <Link href="/moderator/dashboard" className="flex items-center gap-2 group" onClick={onClose}>
          <div className="p-1.5 border border-tactical text-tactical group-hover:bg-tactical group-hover:text-void transition-colors">
            <Shield size={20} />
          </div>
          <span className="font-chakra font-black italic tracking-tighter text-xl text-hud">
            MODERATOR<span className="text-tactical">PANEL</span>
          </span>
        </Link>
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 text-dimmed hover:text-hostile transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-2">
        <div className="text-[10px] font-bold text-dimmed mb-4 px-2 tracking-widest leading-none">
          MODERATOR DASHBOARD
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center justify-between p-3 transition-all duration-200 group relative ${isActive
                  ? 'bg-gunmetal text-tactical'
                  : 'text-hud hover:bg-void hover:text-white'
                }`}
              style={{
                clipPath: 'polygon(0 0, 92% 0, 100% 25%, 100% 100%, 8% 100%, 0 75%)'
              }}
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} className={isActive ? 'text-tactical' : 'text-dimmed group-hover:text-hud'} />
                <span className="font-chakra font-bold text-sm tracking-wider">{item.name}</span>
              </div>
              {isActive && <ChevronRight size={14} className="animate-pulse" />}

              {isActive && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-tactical"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-gunmetal">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 p-3 text-dimmed hover:text-hostile transition-colors font-chakra font-bold text-sm tracking-wider group"
        >
          <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
          EXIT_TERMINAL
        </button>
      </div>
    </div>
  );
}
