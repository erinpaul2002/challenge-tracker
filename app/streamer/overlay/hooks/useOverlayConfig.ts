import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { OverlayConfig, SaveStatus, ThemeName, THEME_PRESETS, mergeWithDefaults, getThemeDefaultColors } from '../types';

export function useOverlayConfig(initialConfig: OverlayConfig | null, streamerId: Id<'streamers'> | null) {
  const [tempConfig, setTempConfig] = useState<OverlayConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveOverlayConfig = useMutation(api.overlay.saveOverlayConfig);

  useEffect(() => {
    if (hasChanges) return;
    setTempConfig(mergeWithDefaults(initialConfig));
  }, [initialConfig, hasChanges]);

  const handleColorChange = (colorKey: string, value: string) => {
    if (!tempConfig) return;
    setTempConfig({
      ...tempConfig,
      colors: { ...tempConfig.colors, [colorKey]: value },
    });
    setHasChanges(true);
  };

  // Generic partial config update handler
  const handleConfigChange = (updates: Partial<OverlayConfig>) => {
    if (!tempConfig) return;
    const newConfig = { ...tempConfig };

    if (updates.fonts) newConfig.fonts = { ...tempConfig.fonts, ...updates.fonts };
    if (updates.animations) newConfig.animations = { ...tempConfig.animations, ...updates.animations };
    if (updates.layout) newConfig.layout = { ...tempConfig.layout, ...updates.layout };
    if (updates.display) newConfig.display = { ...tempConfig.display, ...updates.display };
    if (updates.theme !== undefined) newConfig.theme = updates.theme;
    if (updates.colors) newConfig.colors = { ...tempConfig.colors, ...updates.colors };

    setTempConfig(newConfig);
    setHasChanges(true);
  };

  // Apply a full theme preset (replaces entire config while keeping display toggles)
  const applyThemePreset = (themeName: ThemeName) => {
    const preset = THEME_PRESETS.find((p) => p.name === themeName);
    if (!preset || !tempConfig) return;
    setTempConfig({
      ...preset.config,
      // Preserve user's display preferences
      display: tempConfig.display,
    });
    setHasChanges(true);
  };

  const saveConfig = async (newConfig?: OverlayConfig | unknown) => {
    // If the function was called directly as an event handler, newConfig will be an event object.
    // We only want to use newConfig if it's an actual OverlayConfig object.
    const isEvent =
      !!newConfig &&
      typeof newConfig === 'object' &&
      ('nativeEvent' in newConfig || 'preventDefault' in newConfig);
    const configToSave = (newConfig && !isEvent) ? newConfig : tempConfig;

    if (!configToSave || !streamerId) {
      setSaveStatus('error');
      setSaveError('Streamer not found. Please refresh and try again.');
      return;
    }

    setSaving(true);
    setSaveStatus('saving');
    setSaveError(null);

    try {
      await saveOverlayConfig({
        streamerId,
        config: configToSave,
      });

      setTempConfig(configToSave as OverlayConfig);
      setHasChanges(false);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
      return configToSave;
    } catch (error: any) {
      setSaveStatus('error');
      console.error('Save config exact error:', error);
      setSaveError(error?.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const discardChanges = () => {
    setTempConfig(mergeWithDefaults(initialConfig));
    setHasChanges(false);
  };

  /** Reset only the colors to the current theme's defaults */
  const resetColorsToDefaults = () => {
    if (!tempConfig) return;
    const defaultColors = getThemeDefaultColors(tempConfig.theme);
    setTempConfig({
      ...tempConfig,
      colors: { ...defaultColors },
    });
    setHasChanges(true);
  };

  return {
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
    setTempConfig,
  };
}