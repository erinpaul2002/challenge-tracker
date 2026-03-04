'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sword, Zap, Radio } from 'lucide-react';

const navItems = [
    { name: 'CHALLENGES', icon: Sword, href: '/moderator/stream' },
    { name: 'CREATE', icon: Zap, href: '/moderator/stream/new' },
    { name: 'STREAM', icon: Radio, href: '/moderator/dashboard' },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="h-16 bg-armor/95 backdrop-blur-md border-t border-gunmetal flex items-stretch relative z-30 shrink-0"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
            {navItems.map((item) => {
                const isActive = item.href === '/moderator/stream'
                    ? pathname === '/moderator/stream' || (pathname.startsWith('/moderator/stream/') && pathname !== '/moderator/stream/new')
                    : pathname === item.href;

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all relative ${isActive
                                ? 'text-tactical'
                                : 'text-dimmed hover:text-hud'
                            }`}
                    >
                        {/* Active indicator bar */}
                        {isActive && (
                            <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-tactical shadow-[0_0_8px_rgba(242,201,76,0.4)]"></div>
                        )}
                        <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                        <span className="text-[9px] font-chakra font-bold tracking-wider uppercase">
                            {item.name}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
