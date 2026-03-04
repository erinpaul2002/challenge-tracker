'use client';

import { ReactNode, useState } from 'react';
import Sidebar from './_components/Sidebar';
import Header from './_components/Header';

export default function ModeratorLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-void text-hud overflow-hidden font-mono">
      {/* HUD Scanlines and Vignette Effect */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)] opacity-30"></div>
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col relative z-10 w-full overflow-hidden">
        <Header onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
          <main className="flex-1 overflow-auto p-4 md:p-6 scrollbar-tactical">
          <div className="max-w-7xl mx-auto">
            {/* Moderator Status */}
            <div className="mb-4 flex items-center gap-2 opacity-50">
              <div className="w-2 h-2 bg-tactical animate-pulse"></div>
              <span className="text-[10px] tracking-widest font-black uppercase"></span>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
