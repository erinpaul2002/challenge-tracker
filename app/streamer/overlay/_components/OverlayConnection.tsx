import { MonitorPlay, Copy, ExternalLink, Key, RotateCcw, Download, Upload } from 'lucide-react';
import { StreamerProfile, DEFAULT_OVERLAY_CONFIG } from '../types';
import { useState } from 'react';

interface OverlayConnectionProps {
  profile: StreamerProfile | null;
  loading: boolean;
  generating: boolean;
  copying: boolean;
  onGenerateToken: () => void;
  onCopy: () => void;
}

export default function OverlayConnection({
  profile,
  loading,
  generating,
  copying,
  onGenerateToken,
  onCopy,
}: OverlayConnectionProps) {
  const overlayUrl = profile?.overlay_token
    ? `${window.location.origin}/overlay/${profile.overlay_token}`
    : '';

  return (
    <div className="bg-armor border border-gunmetal p-6 tactical-border relative overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-base font-bold italic mb-2 inline-flex items-center gap-2">
            <MonitorPlay size={18} className="text-tactical" />
            BROADCAST_LINK
          </h3>
          <p className="text-[10px] text-dimmed font-mono leading-relaxed uppercase">
            Use this URL as a browser source in OBS / SLOBs / Streamlabs.
          </p>
        </div>

        {loading ? (
          <div className="animate-pulse bg-void border border-gunmetal p-3 w-full md:w-96">
            <div className="h-4 bg-gunmetal rounded" />
          </div>
        ) : !profile?.overlay_token ? (
          <button
            onClick={onGenerateToken}
            disabled={generating}
            className="btn-tactical py-2.5 px-5 flex items-center justify-center gap-2 disabled:opacity-50 text-xs"
          >
            <Key size={14} />
            {generating ? 'GENERATING...' : 'GENERATE_TOKEN'}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="bg-void border border-gunmetal px-3 py-2 truncate font-mono text-xs text-hud/80 max-w-xs">
              {overlayUrl}
            </div>
            <button
              onClick={onCopy}
              className={`p-2 border transition-all ${copying ? 'bg-tactical text-void border-tactical' : 'bg-armor border-gunmetal hover:bg-tactical hover:text-void'}`}
              title="COPY_LINK"
            >
              <Copy size={14} />
            </button>
            <a
              href={overlayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-armor hover:bg-white hover:text-void transition-all border border-gunmetal"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}