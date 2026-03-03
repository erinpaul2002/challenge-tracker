'use client';

import { Zap, X, Radio } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface ModeratorSession {
  moderator_id: string;
  streamer_id: string;
  streamer_name: string;
  streamer_channel: string;
  created_at: string;
}

export default function StreamTopBar() {
  const [streamerName, setStreamerName] = useState('STREAMER');

  useEffect(() => {
    const session = localStorage.getItem('moderator_session');
    if (session) {
      try {
        const parsed = JSON.parse(session) as ModeratorSession;
        setStreamerName(parsed.streamer_name || parsed.streamer_channel || 'STREAMER');
      } catch {}
    }
  }, []);

  return (
    <header className="h-12 bg-armor/95 backdrop-blur-md border-b border-gunmetal flex items-center justify-between px-4 relative z-30 shrink-0">
      {/* Left: Mode indicator */}
      <div className="flex items-center gap-2">
        <Zap size={14} className="text-tactical" fill="currentColor" />
        <span className="text-xs font-chakra font-black italic tracking-tight text-hud uppercase">
          STREAM<span className="text-tactical">_MODE</span>
        </span>
      </div>

      {/* Center: Live indicator + streamer */}
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-terminal rounded-full animate-pulse shadow-[0_0_6px_rgba(0,255,65,0.6)]"></div>
        <span className="text-[10px] font-mono text-dimmed tracking-widest uppercase">
          {streamerName}
        </span>
      </div>

      {/* Right: Exit button */}
      <Link
        href="/moderator/dashboard"
        className="w-8 h-8 flex items-center justify-center text-dimmed hover:text-hostile transition-colors"
        title="EXIT_STREAM_MODE"
      >
        <X size={16} />
      </Link>

      {/* Top accent line */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-tactical/60 to-transparent"></div>
    </header>
  );
}
