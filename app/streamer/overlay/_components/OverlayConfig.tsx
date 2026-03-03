'use client';

import { Settings2, RefreshCw, Check, RotateCcw, Palette } from 'lucide-react';
import { OverlayConfig, SaveStatus, ThemeName, LayoutPosition, isUsingCustomColors, THEME_PRESETS } from '../types';
import { OverlayTab } from './OverlayTabs';

interface OverlayConfigProps {
  tempConfig: OverlayConfig | null;
  saving: boolean;
  hasChanges: boolean;
  saveStatus: SaveStatus;
  saveError: string | null;
  activeTab: OverlayTab;
  onConfigChange: (updates: Partial<OverlayConfig>) => void;
  onColorChange: (colorKey: string, value: string) => void;
  onThemePresetApply: (themeName: ThemeName) => void;
  onResetColors: () => void;
  onSave: () => void;
  onDiscard: () => void;
}

const FONT_OPTIONS = [
  'Chakra Petch', 'Inter', 'Roboto', 'Outfit', 'Orbitron',
  'VT323', 'JetBrains Mono', 'Fira Code', 'Space Grotesk',
  'Poppins', 'Montserrat', 'Oswald', 'monospace', 'sans-serif',
];

const POSITION_LABELS: Record<LayoutPosition, string> = {
  'top-left': '↖', 'top-center': '↑', 'top-right': '↗',
  'center-left': '←', 'center': '◎', 'center-right': '→',
  'bottom-left': '↙', 'bottom-center': '↓', 'bottom-right': '↘',
};

const POSITIONS: LayoutPosition[] = [
  'top-left', 'top-center', 'top-right',
  'center-left', 'center', 'center-right',
  'bottom-left', 'bottom-center', 'bottom-right',
];

const ENTRANCE_TYPES = [
  { value: 'slide-left', label: 'Slide Left' },
  { value: 'slide-right', label: 'Slide Right' },
  { value: 'slide-up', label: 'Slide Up' },
  { value: 'fade', label: 'Fade' },
  { value: 'scale', label: 'Scale' },
  { value: 'glitch', label: 'Glitch' },
] as const;

export default function OverlayConfigComponent({
  tempConfig,
  saving,
  hasChanges,
  saveStatus,
  saveError,
  activeTab,
  onConfigChange,
  onColorChange,
  onResetColors,
  onSave,
  onDiscard,
}: OverlayConfigProps) {
  if (!tempConfig) return null;

  return (
    <div className="bg-armor border border-gunmetal overflow-hidden">
      <div className="p-4 bg-gunmetal/20 font-chakra font-black text-sm italic tracking-widest flex items-center gap-2">
        <Settings2 size={16} /> CONFIGURE_OVERLAY
      </div>

      <div className="p-6">
        {/* Tab content — themes tab is handled at page level */}
        {activeTab === 'colors' && (
          <ColorsPanel tempConfig={tempConfig} saving={saving} onColorChange={onColorChange} onResetColors={onResetColors} />
        )}
        {activeTab === 'typography' && (
          <TypographyPanel tempConfig={tempConfig} onConfigChange={onConfigChange} />
        )}
        {activeTab === 'animations' && (
          <AnimationsPanel tempConfig={tempConfig} onConfigChange={onConfigChange} />
        )}
        {activeTab === 'layout' && (
          <LayoutPanel tempConfig={tempConfig} onConfigChange={onConfigChange} />
        )}
        {activeTab === 'display' && (
          <DisplayPanel tempConfig={tempConfig} onConfigChange={onConfigChange} />
        )}

        {/* Save/Discard bar */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gunmetal">
          <button
            onClick={onSave}
            disabled={saving || !hasChanges}
            className="flex-1 btn-tactical py-3 flex items-center justify-center gap-2 relative overflow-hidden group disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <RefreshCw size={16} className={saving ? 'animate-spin' : ''} />
            {saving ? 'SAVING...' : 'APPLY_CHANGES'}
          </button>
          {hasChanges && (
            <button
              onClick={onDiscard}
              disabled={saving}
              className="px-6 py-3 border border-gunmetal bg-void hover:bg-gunmetal/20 transition-colors disabled:opacity-50 text-xs font-bold font-mono uppercase"
            >
              DISCARD
            </button>
          )}
        </div>

        {saveStatus === 'success' && (
          <div className="mt-3 p-3 bg-completed/20 border border-completed text-completed text-xs font-mono flex items-center gap-2">
            <Check size={14} /> Configuration saved successfully
          </div>
        )}
        {saveStatus === 'error' && (
          <div className="mt-3 p-3 bg-red-500/20 border border-red-500 text-red-400 text-xs font-mono">
            ✗ {saveError || 'Failed to save configuration'}
          </div>
        )}
      </div>
    </div>
  );
}

// ThemesPanel moved to ThemeShowcase.tsx

// ── Colors Panel ──────────────────────────────
function ColorsPanel({ tempConfig, saving, onColorChange, onResetColors }: {
  tempConfig: OverlayConfig;
  saving: boolean;
  onColorChange: (key: string, val: string) => void;
  onResetColors: () => void;
}) {
  const isCustom = isUsingCustomColors(tempConfig);
  const themeLabel = THEME_PRESETS.find((p) => p.name === tempConfig.theme)?.label || tempConfig.theme;

  const colorGroups = [
    {
      label: 'Layout',
      colors: [
        { key: 'background', label: 'Background' },
        { key: 'cardBackground', label: 'Card BG' },
        { key: 'border', label: 'Border' },
      ],
    },
    {
      label: 'Text',
      colors: [
        { key: 'challengeTitle', label: 'Challenge Title' },
        { key: 'subchallengeTitle', label: 'Subchallenge' },
        { key: 'viewerName', label: 'Viewer/Reward Text' },
        { key: 'dateText', label: 'Viewer/Reward Title' },
        { key: 'progressCount', label: 'Progress Count' },
      ],
    },
    {
      label: 'Progress',
      colors: [
        { key: 'progressFill', label: 'Fill' },
        { key: 'progressEmpty', label: 'Empty' },
      ],
    },
    {
      label: 'Icons',
      colors: [
        { key: 'iconPrimary', label: 'Primary' },
        { key: 'iconSecondary', label: 'Secondary' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Color Mode Indicator + Reset Button */}
      <div className="flex items-center justify-between gap-2 p-3 border border-gunmetal bg-void/50 rounded">
        <div className="flex items-center gap-2">
          <Palette size={14} className={isCustom ? 'text-tactical' : 'text-dimmed'} />
          <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-dimmed">
            {isCustom ? (
              <span className="text-tactical">CUSTOM COLORS</span>
            ) : (
              <span>{themeLabel} DEFAULTS</span>
            )}
          </span>
        </div>
        {isCustom && (
          <button
            onClick={onResetColors}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold font-mono uppercase tracking-wider border border-gunmetal bg-void hover:bg-gunmetal/20 text-dimmed hover:text-hud transition-colors disabled:opacity-50"
          >
            <RotateCcw size={10} />
            Reset to {themeLabel} Defaults
          </button>
        )}
      </div>

      {colorGroups.map((group) => (
        <div key={group.label} className="space-y-3">
          <div className="text-[10px] font-bold font-mono text-dimmed uppercase tracking-wider">{group.label} Elements</div>
          <div className="grid grid-cols-3 gap-3">
            {group.colors.map((c) => (
              <div key={c.key} className="flex items-center gap-2">
                <input
                  type="color"
                  value={(tempConfig.colors as Record<string, string>)[c.key] || '#000000'}
                  onChange={(e) => onColorChange(c.key, e.target.value)}
                  disabled={saving}
                  className="w-7 h-7 border border-gunmetal rounded cursor-pointer disabled:opacity-50"
                />
                <label className="text-[9px] font-mono text-dimmed">{c.label}</label>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Typography Panel ──────────────────────────
function TypographyPanel({ tempConfig, onConfigChange }: {
  tempConfig: OverlayConfig;
  onConfigChange: (u: Partial<OverlayConfig>) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Font families */}
      <div className="space-y-3">
        <div className="text-[10px] font-bold font-mono text-dimmed uppercase tracking-wider">Font Families</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[9px] font-mono text-dimmed block mb-1">Title Font</label>
            <select
              value={tempConfig.fonts.title}
              onChange={(e) => onConfigChange({ fonts: { ...tempConfig.fonts, title: e.target.value } })}
              className="w-full bg-void border border-gunmetal px-3 py-2 text-xs font-mono text-hud focus:border-tactical outline-none"
            >
              {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[9px] font-mono text-dimmed block mb-1">Body Font</label>
            <select
              value={tempConfig.fonts.body}
              onChange={(e) => onConfigChange({ fonts: { ...tempConfig.fonts, body: e.target.value } })}
              className="w-full bg-void border border-gunmetal px-3 py-2 text-xs font-mono text-hud focus:border-tactical outline-none"
            >
              {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Font sizes */}
      <div className="space-y-3">
        <div className="text-[10px] font-bold font-mono text-dimmed uppercase tracking-wider">Font Sizes</div>
        <SliderControl
          label="Title Size"
          value={tempConfig.fonts.titleSize}
          min={10} max={36} step={1} unit="px"
          onChange={(v) => onConfigChange({ fonts: { ...tempConfig.fonts, titleSize: v } })}
        />
        <SliderControl
          label="Body Size"
          value={tempConfig.fonts.bodySize}
          min={8} max={24} step={1} unit="px"
          onChange={(v) => onConfigChange({ fonts: { ...tempConfig.fonts, bodySize: v } })}
        />
      </div>

      {/* Font weight */}
      <div className="space-y-3">
        <div className="text-[10px] font-bold font-mono text-dimmed uppercase tracking-wider">Title Weight</div>
        <div className="flex gap-2 flex-wrap">
          {[400, 500, 600, 700, 800, 900].map((w) => (
            <button
              key={w}
              onClick={() => onConfigChange({ fonts: { ...tempConfig.fonts, titleWeight: w } })}
              className={`px-3 py-1.5 text-[10px] font-mono border transition-all ${tempConfig.fonts.titleWeight === w
                  ? 'bg-tactical text-void border-tactical'
                  : 'bg-void border-gunmetal text-dimmed hover:border-gunmetal/80'
                }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Animations Panel ──────────────────────────
function AnimationsPanel({ tempConfig, onConfigChange }: {
  tempConfig: OverlayConfig;
  onConfigChange: (u: Partial<OverlayConfig>) => void;
}) {
  const anims = tempConfig.animations;
  return (
    <div className="space-y-6">
      {/* Enable toggle */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="anim-enabled"
          checked={anims.enabled}
          onChange={(e) => onConfigChange({ animations: { ...anims, enabled: e.target.checked } })}
          className="accent-tactical"
        />
        <label htmlFor="anim-enabled" className="text-xs font-mono text-dimmed">Enable animations</label>
      </div>

      {/* Animation style */}
      <div className="space-y-2">
        <div className="text-[10px] font-bold font-mono text-dimmed uppercase tracking-wider">Animation Style</div>
        <div className="flex gap-2 flex-wrap">
          {ENTRANCE_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => onConfigChange({ animations: { ...anims, entranceType: t.value } })}
              className={`px-3 py-1.5 text-[10px] font-mono border transition-all ${anims.entranceType === t.value
                  ? 'bg-tactical text-void border-tactical'
                  : 'bg-void border-gunmetal text-dimmed hover:border-gunmetal/80'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <SliderControl
        label="Animation Duration"
        value={anims.duration}
        min={200} max={1500} step={50} unit="ms"
        onChange={(v) => onConfigChange({ animations: { ...anims, duration: v } })}
      />

      {/* Rotation interval */}
      <SliderControl
        label="Sub-Challenge Rotation Interval"
        value={Math.round(anims.rotationInterval / 1000)}
        min={3} max={30} step={1} unit="s"
        onChange={(v) => onConfigChange({ animations: { ...anims, rotationInterval: v * 1000 } })}
      />
    </div>
  );
}

// ── Layout Panel ──────────────────────────────
function LayoutPanel({ tempConfig, onConfigChange }: {
  tempConfig: OverlayConfig;
  onConfigChange: (u: Partial<OverlayConfig>) => void;
}) {
  const layout = tempConfig.layout;
  return (
    <div className="space-y-6">
      {/* 9-point position grid */}
      <div className="space-y-2">
        <div className="text-[10px] font-bold font-mono text-dimmed uppercase tracking-wider">Overlay Position</div>
        <div className="grid grid-cols-3 gap-1.5 w-48">
          {POSITIONS.map((pos) => (
            <button
              key={pos}
              onClick={() => onConfigChange({ layout: { ...layout, position: pos } })}
              className={`aspect-square flex items-center justify-center text-sm border transition-all ${layout.position === pos
                  ? 'bg-tactical text-void border-tactical font-bold'
                  : 'bg-void border-gunmetal text-dimmed hover:border-gunmetal/80 hover:text-hud'
                }`}
            >
              {POSITION_LABELS[pos]}
            </button>
          ))}
        </div>
      </div>

      {/* Width */}
      <SliderControl
        label="Width"
        value={layout.width}
        min={200} max={900} step={10} unit="px"
        onChange={(v) => onConfigChange({ layout: { ...layout, width: v } })}
      />

      {/* Opacity */}
      <SliderControl
        label="Opacity"
        value={layout.opacity}
        min={10} max={100} step={5} unit="%"
        onChange={(v) => onConfigChange({ layout: { ...layout, opacity: v } })}
      />


    </div>
  );
}

// ── Display Panel ──────────────────────────────
function DisplayPanel({ tempConfig, onConfigChange }: {
  tempConfig: OverlayConfig;
  onConfigChange: (u: Partial<OverlayConfig>) => void;
}) {
  const display = tempConfig.display;
  const toggles = [
    { key: 'showChallengeTitle', label: 'Show Challenge Title', defaultValue: true },
    { key: 'showProgressCount', label: 'Show Progress Count', defaultValue: true },
    { key: 'showProgressBar', label: 'Show Progress Bar' },
    { key: 'showSubChallenges', label: 'Show Sub-Challenges' },
    { key: 'showReward', label: 'Show Reward' , defaultValue: true },
    { key: 'showGivenBy', label: 'Show "Given By" Name' },
    { key: 'showDate', label: 'Show Date / Time Left' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Max challenges */}
      <SliderControl
        label="Max Visible Challenges"
        value={display.maxChallenges}
        min={1} max={20} step={1} unit=""
        onChange={(v) => onConfigChange({ display: { ...display, maxChallenges: v } })}
      />

      {/* Toggle switches */}
      <div className="space-y-3">
        <div className="text-[10px] font-bold font-mono text-dimmed uppercase tracking-wider">Visibility Toggles</div>
        {toggles.map((t) => (
          <div key={t.key} className="flex items-center gap-3">
            <input
              type="checkbox"
              id={`toggle-${t.key}`}
              checked={display[t.key] ?? ('defaultValue' in t ? t.defaultValue : false)}
              onChange={(e) => onConfigChange({ display: { ...display, [t.key]: e.target.checked } })}
              className="accent-tactical"
            />
            <label htmlFor={`toggle-${t.key}`} className="text-xs font-mono text-dimmed">{t.label}</label>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Shared Slider Component ────────────────────
function SliderControl({ label, value, min, max, step, unit, onChange }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-dimmed uppercase tracking-wider">{label}</span>
        <span className="text-[10px] font-mono text-tactical">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-gunmetal rounded-full appearance-none cursor-pointer accent-tactical"
      />
    </div>
  );
}
