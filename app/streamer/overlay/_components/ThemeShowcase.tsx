'use client';

import { useState, useRef, useEffect, useCallback, useMemo, createElement } from 'react';
import { Check, ChevronLeft, ChevronRight, Sparkles, RefreshCw } from 'lucide-react';
import { OverlayConfig, THEME_PRESETS, ThemeName, ActiveChallenge, SaveStatus } from '../types';
import { getThemeRenderer } from './themes';

// ── Demo challenge for rendering previews ──
const DEMO_CHALLENGE: ActiveChallenge = {
  challenge: {
    id: 'demo',
    title: 'Chicken Dinner Sprint',
    description: 'Demo challenge',
    given_by: 'DropHunter07',
    reward_amount: '₹5,000',
    status: 'active',
    created_at: new Date().toISOString(),
  },
  subChallenges: [
    { id: 's1', challenge_id: 'demo', title: 'Win with M416', current_progress: 3, target_limit: 5, status: 'active' },
    { id: 's2', challenge_id: 'demo', title: 'Secure two airdrops', current_progress: 2, target_limit: 2, status: 'completed' },
  ],
  progress: 50,
  timeLeft: '2h 30m',
};

interface ThemeShowcaseProps {
  tempConfig: OverlayConfig;
  saving: boolean;
  hasChanges: boolean;
  saveStatus: SaveStatus;
  saveError: string | null;
  onThemePresetApply: (name: ThemeName) => void;
  onSave: () => void;
  onDiscard: () => void;
}

export default function ThemeShowcase({ tempConfig, saving, hasChanges, saveStatus, saveError, onThemePresetApply, onSave, onDiscard }: ThemeShowcaseProps) {
  const [hoveredTheme, setHoveredTheme] = useState<ThemeName | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // The big preview always shows the equipped theme only
  const displayTheme = tempConfig.theme;
  const displayPreset = THEME_PRESETS.find(p => p.name === displayTheme) ?? THEME_PRESETS[0];
  const displayRenderer = useMemo(() => getThemeRenderer(displayTheme), [displayTheme]);
  const displayConfig = tempConfig;
  const isActive = true;

  // ── Scroll management ──
  const updateScrollState = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState]);

  const scrollCarousel = (direction: 'left' | 'right') => {
    const el = carouselRef.current;
    if (!el) return;
    const cardWidth = 220;
    el.scrollBy({ left: direction === 'left' ? -cardWidth * 2 : cardWidth * 2, behavior: 'smooth' });
  };

  // Scroll selected theme into view on mount
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const idx = THEME_PRESETS.findIndex(p => p.name === tempConfig.theme);
    if (idx >= 0) {
      const cardWidth = 220;
      const offset = idx * cardWidth - el.clientWidth / 2 + cardWidth / 2;
      el.scrollTo({ left: Math.max(0, offset), behavior: 'smooth' });
    }
  }, [tempConfig.theme]);

  const handleCardClick = (name: ThemeName) => {
    onThemePresetApply(name);
  };

  return (
    <div className="theme-showcase flex flex-col h-full min-h-0">

      {/* ═══ HERO PREVIEW — expands to fill available space ═══ */}
      <div className="flex-1 min-h-0 relative group">
        {/* Ambient glow behind the preview */}
        <div
          className="absolute -inset-1 rounded-lg opacity-30 blur-xl transition-all duration-700 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, ${displayConfig.colors.progressFill}40, ${displayConfig.colors.iconPrimary}20, transparent 70%)`,
          }}
        />

        <div className="relative bg-void border border-gunmetal rounded-lg overflow-hidden h-full flex flex-col">
          {/* Header bar — compact */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-gunmetal/30 border-b border-gunmetal/60">
            <div className="flex items-center gap-3">
              <Sparkles size={14} className="text-tactical" />
              <div>
                <div className="text-xs font-chakra font-black uppercase tracking-widest text-hud">
                  {displayPreset.label}
                </div>
                <div className="text-[9px] font-mono text-dimmed mt-0.5 max-w-[500px] truncate">
                  {displayPreset.description}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isActive && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-tactical/15 border border-tactical/30 rounded-sm">
                  <Check size={10} className="text-tactical" />
                  <span className="text-[9px] font-bold font-mono text-tactical uppercase">Equipped</span>
                </div>
              )}
              {!isActive && (
                <button
                  onClick={() => handleCardClick(displayTheme)}
                  className="px-4 py-1.5 bg-tactical text-void text-[10px] font-bold font-chakra uppercase tracking-wider hover:bg-white transition-all duration-200"
                  style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}
                >
                  Equip Theme
                </button>
              )}
            </div>
          </div>

          {/* Main preview area — fills all available height */}
          <div
            className="flex-1 min-h-0 relative overflow-hidden transition-all duration-500"
            style={{
              background: `radial-gradient(ellipse at 40% 50%, ${displayConfig.colors.progressFill}08, transparent 60%), #0d0d14`,
            }}
          >
            {/* Subtle scanlines */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
            }} />

            {/* Grid lines */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '20% 20%',
            }} />

            {/* Corner accents */}
            <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 opacity-20" style={{ borderColor: displayConfig.colors.progressFill }} />
            <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 opacity-20" style={{ borderColor: displayConfig.colors.progressFill }} />
            <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 opacity-20" style={{ borderColor: displayConfig.colors.progressFill }} />
            <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 opacity-20" style={{ borderColor: displayConfig.colors.progressFill }} />

            {/* Centered theme renderer */}
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div
                className="w-full transition-transform duration-500"
                style={{ maxWidth: 520 }}
              >
                {createElement(displayRenderer, {
                  challenge: DEMO_CHALLENGE,
                  config: displayConfig,
                  fade: false,
                })}
              </div>
            </div>
          </div>

          {/* Color palette strip + save controls — compact bottom bar */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-void/80 border-t border-gunmetal/40">
            {/* Palette */}
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] font-mono text-dimmed/60 mr-1 uppercase">Palette</span>
              {[
                displayConfig.colors.cardBackground,
                displayConfig.colors.border,
                displayConfig.colors.challengeTitle,
                displayConfig.colors.progressFill,
                displayConfig.colors.iconPrimary,
                displayConfig.colors.iconSecondary,
              ].map((color, i) => (
                <div
                  key={i}
                  className="w-4 h-2.5 rounded-[2px] border border-white/10 transition-all duration-300"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            {/* Save / Discard */}
            <div className="flex items-center gap-2">
              {saveStatus === 'success' && (
                <span className="text-[9px] font-mono text-green-400 flex items-center gap-1">
                  <Check size={10} /> Saved
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="text-[9px] font-mono text-red-400">
                  ✗ {saveError || 'Failed'}
                </span>
              )}
              {hasChanges && (
                <button
                  onClick={onDiscard}
                  disabled={saving}
                  className="px-3 py-1 border border-gunmetal bg-void hover:bg-gunmetal/20 transition-colors disabled:opacity-50 text-[9px] font-bold font-mono uppercase"
                >
                  Discard
                </button>
              )}
              <button
                onClick={onSave}
                disabled={saving || !hasChanges}
                className="px-4 py-1 bg-tactical text-void text-[9px] font-bold font-chakra uppercase tracking-wider hover:bg-white transition-all duration-200 disabled:opacity-40 disabled:hover:bg-tactical flex items-center gap-1.5"
                style={{ clipPath: 'polygon(3px 0, 100% 0, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0 100%, 0 3px)' }}
              >
                <RefreshCw size={10} className={saving ? 'animate-spin' : ''} />
                {saving ? 'Saving...' : 'Apply'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ CAROUSEL SECTION — pinned at bottom ═══ */}
      <div className="flex-shrink-0 relative pt-3">
        {/* Section label + nav arrows */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-bold font-mono text-dimmed uppercase tracking-wider">
            Select Theme ─ {THEME_PRESETS.length} Available
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => scrollCarousel('left')}
              disabled={!canScrollLeft}
              className="p-1 border border-gunmetal bg-armor hover:bg-gunmetal/40 transition-all disabled:opacity-20 disabled:cursor-default"
            >
              <ChevronLeft size={12} />
            </button>
            <button
              onClick={() => scrollCarousel('right')}
              disabled={!canScrollRight}
              className="p-1 border border-gunmetal bg-armor hover:bg-gunmetal/40 transition-all disabled:opacity-20 disabled:cursor-default"
            >
              <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* Left/right gradient masks */}
        {canScrollLeft && (
          <div className="absolute left-0 top-[28px] bottom-0 w-16 z-10 pointer-events-none bg-gradient-to-r from-void to-transparent" />
        )}
        {canScrollRight && (
          <div className="absolute right-0 top-[28px] bottom-0 w-16 z-10 pointer-events-none bg-gradient-to-l from-void to-transparent" />
        )}

        {/* Scrollable carousel */}
        <div
          ref={carouselRef}
          className="flex gap-2.5 overflow-x-auto scrollbar-none pb-1 px-1"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {THEME_PRESETS.map((preset, index) => {
            const isSelected = tempConfig.theme === preset.name;
            const isPreviewed = hoveredTheme === preset.name && !isSelected;
            const isHovered = hoveredIndex === index;
            const Renderer = getThemeRenderer(preset.name);
            const cardConfig = isSelected ? tempConfig : preset.config;

            return (
              <div
                key={preset.name}
                className="carousel-card-wrapper flex-shrink-0"
                style={{
                  scrollSnapAlign: 'center',
                  transform: hoveredIndex !== null && hoveredIndex !== index
                    ? `translateX(${index < hoveredIndex ? -6 : index > hoveredIndex ? 6 : 0}px)`
                    : 'translateX(0)',
                  transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
                onMouseEnter={() => {
                  setHoveredIndex(index);
                  setHoveredTheme(preset.name);
                }}
                onMouseLeave={() => {
                  setHoveredIndex(null);
                  setHoveredTheme(null);
                }}
              >
                <button
                  onClick={() => handleCardClick(preset.name)}
                  className={`
                    theme-card relative flex flex-col overflow-hidden border rounded-md
                    transition-all duration-400 ease-out cursor-pointer group
                    ${isSelected
                      ? 'border-tactical shadow-[0_0_20px_rgba(242,201,76,0.25)] ring-1 ring-tactical/40'
                      : isPreviewed
                        ? 'border-dimmed/60 shadow-[0_0_12px_rgba(255,255,255,0.08)]'
                        : 'border-gunmetal/60 hover:border-white/30'
                    }
                  `}
                  style={{
                    width: 180,
                    transform: isHovered ? 'scale(1.06) translateY(-4px)' : 'scale(1) translateY(0)',
                    transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s ease, border-color 0.3s ease',
                    boxShadow: isHovered && !isSelected
                      ? `0 0 24px ${cardConfig.colors.progressFill}35, 0 8px 32px rgba(0,0,0,0.5), inset 0 0 0 1px ${cardConfig.colors.progressFill}15`
                      : undefined,
                  }}
                >
                  {/* Glow border overlay on hover */}
                  <div
                    className="absolute inset-0 rounded-md pointer-events-none transition-opacity duration-400 z-10"
                    style={{
                      opacity: isHovered ? 1 : 0,
                      boxShadow: `inset 0 0 0 1.5px ${cardConfig.colors.progressFill}60`,
                    }}
                  />

                  {/* Animated glow pulse on hover */}
                  {isHovered && (
                    <div
                      className="absolute -inset-[1px] rounded-md pointer-events-none z-0 animate-pulse"
                      style={{
                        background: `linear-gradient(135deg, ${cardConfig.colors.progressFill}15, transparent 40%, ${cardConfig.colors.iconPrimary}10, transparent 70%)`,
                      }}
                    />
                  )}

                  {/* Mini preview */}
                  <div
                    className="relative overflow-hidden z-[1]"
                    style={{
                      height: 80,
                      backgroundColor: cardConfig.colors.background === 'transparent' ? '#12121a' : cardConfig.colors.background,
                    }}
                  >
                    <div className="absolute inset-0 pointer-events-none"
                      style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)' }}
                    />

                    <div
                      className="p-1.5 transition-transform duration-500 ease-out"
                      style={{
                        transform: isHovered ? 'scale(0.55) translateY(-2px)' : 'scale(0.48)',
                        transformOrigin: 'top center',
                        width: '220%',
                        marginLeft: '-60%',
                      }}
                    >
                      <Renderer challenge={DEMO_CHALLENGE} config={cardConfig} fade={false} />
                    </div>

                    {/* Equipped badge */}
                    {isSelected && (
                      <div className="absolute top-1 right-1 z-20">
                        <div className="w-4 h-4 rounded-full bg-tactical flex items-center justify-center shadow-lg shadow-tactical/30">
                          <Check size={8} className="text-void" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card footer */}
                  <div className={`
                    px-2.5 py-1.5 z-[1] border-t transition-colors duration-300
                    ${isSelected ? 'bg-tactical/8 border-tactical/20' : 'bg-armor/90 border-gunmetal/40'}
                  `}>
                    <div className={`
                      text-[9px] font-chakra font-bold uppercase tracking-wider truncate
                      ${isSelected ? 'text-tactical' : 'text-hud/90 group-hover:text-white'}
                    `}>
                      {preset.label}
                    </div>

                    <div className="flex gap-0.5 mt-1">
                      {[
                        cardConfig.colors.progressFill,
                        cardConfig.colors.iconPrimary,
                        cardConfig.colors.challengeTitle,
                        cardConfig.colors.border,
                      ].map((color, i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full border border-white/10"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
