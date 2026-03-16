'use client';

import { useState } from 'react';
import OverlayConfigComponent from './_components/OverlayConfig';
import OverlayPreview from './_components/OverlayPreview';
import ThemeShowcase from './_components/ThemeShowcase';
import OverlayTabs, { OverlayTab } from './_components/OverlayTabs';
import { useOverlayData } from './hooks/useOverlayData';
import { useOverlayConfig } from './hooks/useOverlayConfig';
import { useOverlayAnimation } from './hooks/useOverlayAnimation';

export default function OverlayPage() {
  const [copying, setCopying] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<OverlayTab>('themes');

  const {
    profile,
    loading,
    config,
    activeChallenges,
    streamerId,
    generateOverlayToken: generateToken,
  } = useOverlayData();

  const {
    tempConfig,
    saving,
    hasChanges,
    saveStatus,
    saveError,
    handleColorChange,
    handleConfigChange,
    applyThemePreset,
    saveConfig,
    discardChanges,
    resetColorsToDefaults,
    uploadCardBackgroundImage,
    removeCardBackgroundImage,
    updateCustomImageConfig,
    uploadingImage,
    imageUploadError,
  } = useOverlayConfig(config, streamerId);

  const { activeIndex, activeSubIndex, fade, animationClass, transitionDurationMs } = useOverlayAnimation(activeChallenges, tempConfig);

  const handleGenerateToken = async () => {
    setGenerating(true);
    await generateToken();
    setGenerating(false);
  };

  const handleCopy = () => {
    const overlayUrl = profile?.overlay_token
      ? `${window.location.origin}/overlay/${profile.overlay_token}`
      : '';
    navigator.clipboard.writeText(overlayUrl);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-500 h-[calc(100dvh-7rem)]">
      {/* Config Tabs + Broadcast Link */}
      <div className="flex-shrink-0 mb-4">
        <OverlayTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          profile={profile}
          loading={loading}
          generating={generating}
          copying={copying}
          onGenerateToken={handleGenerateToken}
          onCopy={handleCopy}
        />
      </div>

      {/* Content area — fills remaining height, no outer scroll */}
      {loading || !tempConfig ? (
        <div className="flex-1 min-h-0 border border-gunmetal bg-armor/60 flex items-center justify-center">
          <div className="text-center">
            <div className="text-xs font-bold font-mono uppercase tracking-[0.18em] text-dimmed">Loading overlay configuration…</div>
            <div className="mt-2 text-[10px] font-mono text-dimmed/70">Syncing your equipped theme and uploaded assets.</div>
          </div>
        </div>
      ) : activeTab === 'themes' ? (
        /* Theme showcase owns the entire remaining space */
        <div className="flex-1 min-h-0 flex flex-col">
          <ThemeShowcase
            tempConfig={tempConfig}
            saving={saving}
            hasChanges={hasChanges}
            saveStatus={saveStatus}
            saveError={saveError}
            onThemePresetApply={applyThemePreset}
            onSave={saveConfig}
            onDiscard={discardChanges}
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6">
          {/* Config Panel — scrolls independently */}
          <div className="lg:w-3/5 overflow-y-auto pr-1 scrollbar-tactical">
            <OverlayConfigComponent
              tempConfig={tempConfig}
              saving={saving}
              hasChanges={hasChanges}
              saveStatus={saveStatus}
              saveError={saveError}
              activeTab={activeTab}
              onConfigChange={handleConfigChange}
              onColorChange={handleColorChange}
              onThemePresetApply={applyThemePreset}
              onResetColors={resetColorsToDefaults}
              onImageUpload={uploadCardBackgroundImage}
              onRemoveImage={removeCardBackgroundImage}
              onCustomImageConfigChange={updateCustomImageConfig}
              uploadingImage={uploadingImage}
              imageUploadError={imageUploadError}
              onSave={saveConfig}
              onDiscard={discardChanges}
            />
          </div>

          {/* Live Preview — stays fixed in place */}
          <div className="lg:w-2/5 flex-shrink-0">
            <OverlayPreview
              tempConfig={tempConfig}
              activeChallenges={activeChallenges}
              activeIndex={activeIndex}
              activeSubIndex={activeSubIndex}
              fade={fade}
              animationClass={animationClass}
              transitionDurationMs={transitionDurationMs}
            />
          </div>
        </div>
      )}
    </div>
  );
}
