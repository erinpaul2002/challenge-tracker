import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { OverlayConfig, SaveStatus, ThemeName, THEME_PRESETS, mergeWithDefaults, getThemeDefaultColors } from '../types';

const MAX_UPLOAD_BYTES = 6 * 1024 * 1024; // 6MB source guardrail

export function useOverlayConfig(initialConfig: OverlayConfig | null, streamerId: Id<'streamers'> | null) {
  const [tempConfig, setTempConfig] = useState<OverlayConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const saveOverlayConfig = useMutation(api.overlay.saveOverlayConfig);
  const generateOverlayAssetUploadUrl = useMutation(api.overlay.generateOverlayAssetUploadUrl);

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) return error.message;
    return fallback;
  };

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
      // Preserve uploaded custom image metadata across theme switches
      custom: tempConfig.custom,
    });
    setHasChanges(true);
  };

  const sanitizeConfigForSave = (config: OverlayConfig): OverlayConfig => {
    const custom = config.custom;
    if (!custom) return config;

    if (custom.cardBackgroundImageStorageId) {
      const restCustom = { ...custom };
      delete restCustom.cardBackgroundImageUrl;
      return {
        ...config,
        custom: restCustom,
      };
    }

    return config;
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
      const normalizedConfig = sanitizeConfigForSave(configToSave as OverlayConfig);

      await saveOverlayConfig({
        streamerId,
        config: normalizedConfig,
      });

      setTempConfig(normalizedConfig);
      setHasChanges(false);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
      return normalizedConfig;
    } catch (error: unknown) {
      setSaveStatus('error');
      console.error('Save config exact error:', error);
      setSaveError(getErrorMessage(error, 'Failed to save configuration'));
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

  const uploadCardBackgroundImage = async (file: File) => {
    if (!tempConfig) return;

    if (!file.type.startsWith('image/')) {
      setImageUploadError('Please upload a valid image file.');
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setImageUploadError('Image is too large. Please choose a file under 6MB.');
      return;
    }

    setUploadingImage(true);
    setImageUploadError(null);

    try {
      if (!streamerId) {
        throw new Error('Streamer not found. Please refresh and try again.');
      }

      const { uploadUrl } = await generateOverlayAssetUploadUrl({ streamerId });
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image to storage');
      }

      const uploadResult = (await uploadResponse.json()) as { storageId?: string };
      if (!uploadResult.storageId) {
        throw new Error('Upload succeeded but storage id was missing');
      }

      const localPreviewUrl = URL.createObjectURL(file);

      setTempConfig({
        ...tempConfig,
        custom: {
          ...tempConfig.custom,
          cardBackgroundImageStorageId: uploadResult.storageId,
          cardBackgroundImageUrl: localPreviewUrl,
        },
      });
      setHasChanges(true);
    } catch (error: unknown) {
      setImageUploadError(getErrorMessage(error, 'Failed to upload image'));
    } finally {
      setUploadingImage(false);
    }
  };

  const removeCardBackgroundImage = () => {
    if (!tempConfig) return;
    setTempConfig({
      ...tempConfig,
      custom: {
        ...tempConfig.custom,
        cardBackgroundImageStorageId: '',
        cardBackgroundImageUrl: '',
      },
    });
    setHasChanges(true);
    setImageUploadError(null);
  };

  const updateCustomImageConfig = (updates: Partial<NonNullable<OverlayConfig['custom']>>) => {
    if (!tempConfig) return;
    setTempConfig({
      ...tempConfig,
      custom: {
        ...tempConfig.custom,
        ...updates,
      },
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
    uploadCardBackgroundImage,
    removeCardBackgroundImage,
    updateCustomImageConfig,
    uploadingImage,
    imageUploadError,
    setTempConfig,
  };
}