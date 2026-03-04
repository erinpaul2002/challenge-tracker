'use client';

import { Palette, Layers, Type, Sparkles, Layout, Eye, MonitorPlay, Copy, ExternalLink, Key } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { StreamerProfile } from '../types';

export type OverlayTab = 'themes' | 'colors' | 'typography' | 'animations' | 'layout' | 'display';

interface OverlayTabsProps {
    activeTab: OverlayTab;
    onTabChange: (tab: OverlayTab) => void;
    profile?: StreamerProfile | null;
    loading?: boolean;
    generating?: boolean;
    copying?: boolean;
    onGenerateToken?: () => void;
    onCopy?: () => void;
}

const TABS: { id: OverlayTab; label: string; icon: LucideIcon }[] = [
    { id: 'themes', label: 'THEMES', icon: Layers },
    { id: 'colors', label: 'COLORS', icon: Palette },
    { id: 'typography', label: 'TYPE', icon: Type },
    { id: 'animations', label: 'MOTION', icon: Sparkles },
    { id: 'layout', label: 'LAYOUT', icon: Layout },
    { id: 'display', label: 'DISPLAY', icon: Eye },
];

export default function OverlayTabs({ activeTab, onTabChange, profile, loading, generating, copying, onGenerateToken, onCopy }: OverlayTabsProps) {
    const overlayUrl = profile?.overlay_token
        ? `/overlay/${profile.overlay_token}`
        : '';

    return (
        <div className="flex items-center justify-between border-b border-gunmetal">
            {/* Left: Tab buttons */}
            <div className="flex gap-1 overflow-x-auto scrollbar-none pb-0 -mb-px">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`flex items-center gap-1.5 px-4 py-3 text-[10px] font-bold font-mono uppercase tracking-wider transition-all whitespace-nowrap border-b-2 ${isActive
                                    ? 'text-tactical border-tactical bg-tactical/5'
                                    : 'text-dimmed border-transparent hover:text-hud hover:border-gunmetal'
                                }`}
                        >
                            <Icon size={13} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Right: Broadcast link controls */}
            <div className="flex items-center gap-2 pl-4 pr-1 flex-shrink-0 -mb-px pb-1">
                {loading ? (
                    <div className="animate-pulse bg-void border border-gunmetal px-3 py-1.5 w-32">
                        <div className="h-3 bg-gunmetal rounded" />
                    </div>
                ) : !profile?.overlay_token ? (
                    <button
                        onClick={onGenerateToken}
                        disabled={generating}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-tactical text-void text-[9px] font-bold font-chakra uppercase tracking-wider hover:bg-white transition-all disabled:opacity-50"
                        style={{ clipPath: 'polygon(3px 0, 100% 0, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0 100%, 0 3px)' }}
                    >
                        <Key size={11} />
                        {generating ? 'GEN...' : 'GENERATE_LINK'}
                    </button>
                ) : (
                    <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-void/60 border border-gunmetal/60 rounded-sm">
                            <MonitorPlay size={11} className="text-tactical flex-shrink-0" />
                            <span className="text-[9px] font-mono text-dimmed truncate max-w-[160px] hidden lg:block">
                                {overlayUrl}
                            </span>
                            <span className="text-[9px] font-mono text-tactical lg:hidden">LINK</span>
                        </div>
                        <button
                            onClick={onCopy}
                            className={`p-1.5 border transition-all text-[9px] ${
                                copying
                                    ? 'bg-tactical text-void border-tactical'
                                    : 'bg-armor border-gunmetal hover:bg-tactical hover:text-void'
                            }`}
                            title="Copy overlay URL"
                        >
                            <Copy size={11} />
                        </button>
                        <a
                            href={overlayUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-armor hover:bg-white hover:text-void transition-all border border-gunmetal"
                            title="Open overlay preview"
                        >
                            <ExternalLink size={11} />
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
