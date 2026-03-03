export type ThemeName = 'default' | 'kuronami' | 'prelude' | 'radiant' | 'scrappunk' | 'azuredragon' | 'chromatactical' | 'cyberthreat' | 'araxys' | 'spectrum' | 'neofrontier' | 'singularity' | 'gearhead' | 'bloodbones' | 'highrollerroyalerevival' | 'elderflame' | 'phoenixrevival';

export type EntranceAnimation = 'slide-left' | 'slide-right' | 'slide-up' | 'fade' | 'scale' | 'glitch';
export type ExitAnimation = 'slide-left' | 'slide-right' | 'fade' | 'scale';
export type LayoutPosition = 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface OverlayConfig {
  theme: ThemeName;
  colors: {
    background: string;
    cardBackground: string;
    border: string;
    challengeTitle: string;
    subchallengeTitle: string;
    subchallengeCompleted: string;
    viewerName: string;
    dateText: string;
    progressCount: string;
    progressFill: string;
    progressEmpty: string;
    iconPrimary: string;
    iconSecondary: string;
    completedIndicator: string;

    // Legacy fields kept for backward compatibility
    text?: string;
    accent?: string;
    progressBar?: string;
    completed?: string;
    dimmed?: string;
  };
  fonts: {
    title: string;
    body: string;
    titleSize: number;
    bodySize: number;
    titleWeight: number;
  };
  animations: {
    enabled: boolean;
    rotationInterval: number;
    entranceType: EntranceAnimation;
    exitType: ExitAnimation;
    duration: number;
  };
  layout: {
    position: LayoutPosition;
    width: number;
    opacity: number;
    borderRadius: number;
    padding: number;
    showBorder: boolean;
  };
  display: {
    maxChallenges: number;
    showChallengeTitle?: boolean;
    showProgressCount?: boolean;
    showProgressBar: boolean;
    showSubChallenges: boolean;
    showReward?: boolean;
    showGivenBy: boolean;
    showDate: boolean;
    // Legacy field kept for backward compatibility
    compactMode?: boolean;
  };
}

export interface SubChallenge {
  id: string;
  challenge_id: string;
  title: string;
  description?: string;
  current_progress: number;
  target_limit: number;
  status: 'active' | 'completed' | 'paused';
}

export interface Challenge {
  id: string;
  title: string;
  description?: string;
  given_by?: string;
  reward_amount?: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  created_at: string;
}

export interface ActiveChallenge {
  challenge: Challenge;
  subChallenges: SubChallenge[];
  progress: number;
  timeLeft: string;
}

export interface StreamerProfile {
  id: string;
  username: string;
  overlay_token: string;
}

export type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

export interface ThemeRendererProps {
  challenge: ActiveChallenge;
  config: OverlayConfig;
  fade: boolean;
}

export const DEFAULT_OVERLAY_CONFIG: OverlayConfig = {
  theme: 'default',
  colors: {
    background: 'transparent',
    cardBackground: '#1a1e15',      // Dark military olive
    border: '#3d4a2a',              // OD green border
    challengeTitle: '#e8dcc8',      // Warm sand/khaki title
    subchallengeTitle: '#a09878',   // Desert tan text
    subchallengeCompleted: '#4a4a38', // Muted olive for completed
    viewerName: '#f2a900',          // PUBG signature orange
    dateText: '#6b7a52',            // Military green muted
    progressCount: '#f2a900',       // PUBG orange ammo counter
    progressFill: '#f2a900',        // PUBG orange fill
    progressEmpty: '#0e1209',       // Near-black forest green
    iconPrimary: '#f2a900',         // PUBG orange for brackets/icons
    iconSecondary: '#8fa65a',       // Olive/tactical green accent
    completedIndicator: '#8fa65a',  // Green for completed objectives
  },
  fonts: {
    title: 'Chakra Petch',
    body: 'Inter',
    titleSize: 15,
    bodySize: 12,
    titleWeight: 900,
  },
  animations: {
    enabled: true,
    rotationInterval: 10000,
    entranceType: 'slide-left',
    exitType: 'fade',
    duration: 500,
  },
  layout: {
    position: 'bottom-left',
    width: 400,
    opacity: 100,
    borderRadius: 6,
    padding: 18,
    showBorder: true,
  },
  display: {
    maxChallenges: 10,
    showChallengeTitle: true,
    showProgressCount: true,
    showProgressBar: true,
    showSubChallenges: true,
    showReward: true,
    showGivenBy: true,
    showDate: true,
    compactMode: false,
  },
};

export interface ThemePreset {
  name: ThemeName;
  label: string;
  description: string;
  config: OverlayConfig;
}

export const PRELUDE_OVERLAY_CONFIG: OverlayConfig = {
  theme: 'prelude',
  colors: {
    background: 'transparent',
    cardBackground: '#141416',
    border: '#4a3020',
    challengeTitle: '#e8e0d8',
    subchallengeTitle: '#a09080',
    subchallengeCompleted: '#4a4030',
    viewerName: '#c0b0a0',
    dateText: '#807060',
    progressCount: '#c020ff',
    progressFill: '#ff4500',
    progressEmpty: '#0a0a0c',
    iconPrimary: '#c020ff',
    iconSecondary: '#ff6020',
    completedIndicator: '#c020ff',
  },
  fonts: {
    title: 'Chakra Petch',
    body: 'Inter',
    titleSize: 16,
    bodySize: 12,
    titleWeight: 800,
  },
  animations: {
    enabled: true,
    rotationInterval: 10000,
    entranceType: 'slide-left',
    exitType: 'fade',
    duration: 500,
  },
  layout: {
    position: 'bottom-left',
    width: 420,
    opacity: 100,
    borderRadius: 4,
    padding: 0,
    showBorder: false,
  },
  display: {
    maxChallenges: 10,
    showProgressBar: true,
    showSubChallenges: true,
    showGivenBy: true,
    showDate: true,
    compactMode: false,
  },
};

export const RADIANT_OVERLAY_CONFIG: OverlayConfig = {
  theme: 'radiant',
  colors: {
    background: 'transparent',
    cardBackground: '#d8dce6',
    border: '#8a90a8',
    challengeTitle: '#ffffff',
    subchallengeTitle: '#ffffff',
    subchallengeCompleted: '#6a7080',
    viewerName: '#2a2e38',
    dateText: '#5a6070',
    progressCount: '#e8a820',
    progressFill: '#f0c040',
    progressEmpty: '#2a2e38',
    iconPrimary: '#00c8ff',
    iconSecondary: '#e8a820',
    completedIndicator: '#00c8ff',
  },
  fonts: {
    title: 'Chakra Petch',
    body: 'Inter',
    titleSize: 16,
    bodySize: 12,
    titleWeight: 800,
  },
  animations: {
    enabled: true,
    rotationInterval: 10000,
    entranceType: 'slide-up',
    exitType: 'fade',
    duration: 500,
  },
  layout: {
    position: 'bottom-left',
    width: 420,
    opacity: 100,
    borderRadius: 10,
    padding: 0,
    showBorder: false,
  },
  display: {
    maxChallenges: 10,
    showProgressBar: true,
    showSubChallenges: true,
    showGivenBy: true,
    showDate: true,
    compactMode: false,
  },
};

export const SCRAPPUNK_OVERLAY_CONFIG: OverlayConfig = {
  theme: 'scrappunk',
  colors: {
    background: 'transparent',
    cardBackground: '#2a2420',
    border: '#5a4a38',
    challengeTitle: '#f0e8d0',
    subchallengeTitle: '#c0a870',
    subchallengeCompleted: '#6a5a40',
    viewerName: '#d8c8a0',
    dateText: '#8a7a58',
    progressCount: '#e8c020',
    progressFill: '#e8a020',
    progressEmpty: '#1a1410',
    iconPrimary: '#e8c020',
    iconSecondary: '#d89020',
    completedIndicator: '#e8c020',
  },
  fonts: {
    title: 'Chakra Petch',
    body: 'Inter',
    titleSize: 16,
    bodySize: 12,
    titleWeight: 800,
  },
  animations: {
    enabled: true,
    rotationInterval: 10000,
    entranceType: 'slide-left',
    exitType: 'fade',
    duration: 500,
  },
  layout: {
    position: 'bottom-left',
    width: 430,
    opacity: 100,
    borderRadius: 4,
    padding: 0,
    showBorder: false,
  },
  display: {
    maxChallenges: 10,
    showProgressBar: true,
    showSubChallenges: true,
    showGivenBy: true,
    showDate: true,
    compactMode: false,
  },
};

export const AZUREDRAGON_OVERLAY_CONFIG: OverlayConfig = {
  theme: 'azuredragon',
  colors: {
    background: 'transparent',
    cardBackground: '#2a1a10',
    border: '#b89850',
    challengeTitle: '#f0e8d0',
    subchallengeTitle: '#c0a870',
    subchallengeCompleted: '#5a4830',
    viewerName: '#d8c8a0',
    dateText: '#8a7a58',
    progressCount: '#e8b830',
    progressFill: '#40c8b0',
    progressEmpty: '#1a1208',
    iconPrimary: '#40c8b0',
    iconSecondary: '#e8b830',
    completedIndicator: '#40c8b0',
  },
  fonts: {
    title: 'Chakra Petch',
    body: 'Inter',
    titleSize: 16,
    bodySize: 12,
    titleWeight: 800,
  },
  animations: {
    enabled: true,
    rotationInterval: 10000,
    entranceType: 'fade',
    exitType: 'fade',
    duration: 500,
  },
  layout: {
    position: 'bottom-left',
    width: 420,
    opacity: 100,
    borderRadius: 6,
    padding: 0,
    showBorder: false,
  },
  display: {
    maxChallenges: 10,
    showProgressBar: true,
    showSubChallenges: true,
    showGivenBy: true,
    showDate: true,
    compactMode: false,
  },
};

export const CHROMATACTICAL_OVERLAY_CONFIG: OverlayConfig = {
  theme: 'chromatactical',
  colors: {
    background: 'transparent',
    cardBackground: '#0e0e14',
    border: '#2a2a38',
    challengeTitle: '#e0e4f0',
    subchallengeTitle: '#ff40c0',
    subchallengeCompleted: '#4a4a5a',
    viewerName: '#c0c4d0',
    dateText: '#6a6a7a',
    progressCount: '#00e8ff',
    progressFill: '#00e8ff',
    progressEmpty: '#0a0a10',
    iconPrimary: '#00e8ff',
    iconSecondary: '#ff40c0',
    completedIndicator: '#00e8ff',
  },
  fonts: {
    title: 'Chakra Petch',
    body: 'Inter',
    titleSize: 16,
    bodySize: 12,
    titleWeight: 800,
  },
  animations: {
    enabled: true,
    rotationInterval: 10000,
    entranceType: 'glitch',
    exitType: 'fade',
    duration: 500,
  },
  layout: {
    position: 'bottom-left',
    width: 430,
    opacity: 100,
    borderRadius: 4,
    padding: 0,
    showBorder: false,
  },
  display: {
    maxChallenges: 10,
    showProgressBar: true,
    showSubChallenges: true,
    showGivenBy: true,
    showDate: true,
    compactMode: false,
  },
};

export const CYBERTHREAT_OVERLAY_CONFIG: OverlayConfig = {
  theme: 'cyberthreat',
  colors: {
    background: 'transparent',
    cardBackground: '#e6e9f5',
    border: '#59607a',
    challengeTitle: '#f7f9ff',
    subchallengeTitle: '#56dfff',
    subchallengeCompleted: '#4c536e',
    viewerName: '#dbe1f8',
    dateText: '#8088a8',
    progressCount: '#ff42be',
    progressFill: '#3de7ff',
    progressEmpty: '#0a0f1a',
    iconPrimary: '#3de7ff',
    iconSecondary: '#ff38b0',
    completedIndicator: '#3de7ff',
  },
  fonts: {
    title: 'Chakra Petch',
    body: 'JetBrains Mono',
    titleSize: 16,
    bodySize: 12,
    titleWeight: 800,
  },
  animations: {
    enabled: true,
    rotationInterval: 10000,
    entranceType: 'glitch',
    exitType: 'fade',
    duration: 500,
  },
  layout: {
    position: 'bottom-left',
    width: 440,
    opacity: 100,
    borderRadius: 8,
    padding: 0,
    showBorder: false,
  },
  display: {
    maxChallenges: 10,
    showProgressBar: true,
    showSubChallenges: true,
    showGivenBy: true,
    showDate: true,
    compactMode: false,
  },
};

export const ARAXYS_OVERLAY_CONFIG: OverlayConfig = {
  theme: 'araxys',
  colors: {
    background: 'transparent',
    cardBackground: '#1e1810',
    border: '#5a4028',
    challengeTitle: '#f0e0c0',
    subchallengeTitle: '#d0a060',
    subchallengeCompleted: '#5a4830',
    viewerName: '#e0c890',
    dateText: '#8a7050',
    progressCount: '#ff9030',
    progressFill: '#ff8020',
    progressEmpty: '#12100a',
    iconPrimary: '#ff9030',
    iconSecondary: '#e87020',
    completedIndicator: '#ff9030',
  },
  fonts: {
    title: 'Chakra Petch',
    body: 'Inter',
    titleSize: 16,
    bodySize: 12,
    titleWeight: 800,
  },
  animations: {
    enabled: true,
    rotationInterval: 10000,
    entranceType: 'scale',
    exitType: 'fade',
    duration: 500,
  },
  layout: {
    position: 'bottom-left',
    width: 430,
    opacity: 100,
    borderRadius: 4,
    padding: 0,
    showBorder: false,
  },
  display: {
    maxChallenges: 10,
    showProgressBar: true,
    showSubChallenges: true,
    showGivenBy: true,
    showDate: true,
    compactMode: false,
  },
};

export const SPECTRUM_OVERLAY_CONFIG: OverlayConfig = {
  theme: 'spectrum',
  colors: {
    background: 'transparent',
    cardBackground: '#e8eaf0',
    border: '#c0c4d0',
    challengeTitle: '#1a1e28',
    subchallengeTitle: '#3a3e50',
    subchallengeCompleted: '#8a90a8',
    viewerName: '#2a2e3a',
    dateText: '#6a7088',
    progressCount: '#c840ff',
    progressFill: '#00e0ff',
    progressEmpty: '#1e2030',
    iconPrimary: '#00e0ff',
    iconSecondary: '#ff40c0',
    completedIndicator: '#00e0ff',
  },
  fonts: {
    title: 'Chakra Petch',
    body: 'Inter',
    titleSize: 16,
    bodySize: 12,
    titleWeight: 800,
  },
  animations: {
    enabled: true,
    rotationInterval: 10000,
    entranceType: 'scale',
    exitType: 'fade',
    duration: 500,
  },
  layout: {
    position: 'bottom-left',
    width: 420,
    opacity: 100,
    borderRadius: 16,
    padding: 0,
    showBorder: false,
  },
  display: {
    maxChallenges: 10,
    showProgressBar: true,
    showSubChallenges: true,
    showGivenBy: true,
    showDate: true,
    compactMode: false,
  },
};

export const NEOFRONTIER_OVERLAY_CONFIG: OverlayConfig = {
  theme: 'neofrontier',
  colors: {
    background: 'transparent',
    cardBackground: '#1a1408',
    border: '#4a3828',
    challengeTitle: '#e8d8b8',
    subchallengeTitle: '#a08860',
    subchallengeCompleted: '#4a5868',
    viewerName: '#e0d0a8',
    dateText: '#6a5a40',
    progressCount: '#00e0ff',
    progressFill: '#00e0ff',
    progressEmpty: '#0e0a06',
    iconPrimary: '#00e0ff',
    iconSecondary: '#00a8c0',
    completedIndicator: '#00e0ff',
  },
  fonts: {
    title: 'Chakra Petch',
    body: 'Inter',
    titleSize: 16,
    bodySize: 12,
    titleWeight: 800,
  },
  animations: {
    enabled: true,
    rotationInterval: 10000,
    entranceType: 'slide-left',
    exitType: 'fade',
    duration: 500,
  },
  layout: {
    position: 'bottom-left',
    width: 430,
    opacity: 100,
    borderRadius: 6,
    padding: 0,
    showBorder: false,
  },
  display: {
    maxChallenges: 10,
    showProgressBar: true,
    showSubChallenges: true,
    showGivenBy: true,
    showDate: true,
    compactMode: false,
  },
};

export const SINGULARITY_OVERLAY_CONFIG: OverlayConfig = {
  theme: 'singularity',
  colors: {
    background: 'transparent',
    cardBackground: '#0a0810',
    border: '#2a1838',
    challengeTitle: '#e8e0f8',
    subchallengeTitle: '#a090c0',
    subchallengeCompleted: '#3a2848',
    viewerName: '#d0c0e8',
    dateText: '#6a5880',
    progressCount: '#c040ff',
    progressFill: '#a020e0',
    progressEmpty: '#08060c',
    iconPrimary: '#c040ff',
    iconSecondary: '#e040a0',
    completedIndicator: '#c040ff',
  },
  fonts: {
    title: 'Chakra Petch',
    body: 'Inter',
    titleSize: 16,
    bodySize: 12,
    titleWeight: 800,
  },
  animations: {
    enabled: true,
    rotationInterval: 10000,
    entranceType: 'scale',
    exitType: 'fade',
    duration: 500,
  },
  layout: {
    position: 'bottom-left',
    width: 430,
    opacity: 100,
    borderRadius: 4,
    padding: 0,
    showBorder: false,
  },
  display: {
    maxChallenges: 10,
    showProgressBar: true,
    showSubChallenges: true,
    showGivenBy: true,
    showDate: true,
    compactMode: false,
  },
};

export const GEARHEAD_OVERLAY_CONFIG: OverlayConfig = {
  theme: 'gearhead',
  colors: {
    background: 'transparent',
    cardBackground: '#2a2830',
    border: '#4a4a58',
    challengeTitle: '#e8e4d8',
    subchallengeTitle: '#a0a8b8',
    subchallengeCompleted: '#4a4a58',
    viewerName: '#d0d0d8',
    dateText: '#707880',
    progressCount: '#00d8ff',
    progressFill: '#00d8ff',
    progressEmpty: '#0e0e14',
    iconPrimary: '#00d8ff',
    iconSecondary: '#e8c020',
    completedIndicator: '#00d8ff',
  },
  fonts: {
    title: 'Chakra Petch',
    body: 'Inter',
    titleSize: 16,
    bodySize: 12,
    titleWeight: 800,
  },
  animations: {
    enabled: true,
    rotationInterval: 10000,
    entranceType: 'slide-left',
    exitType: 'fade',
    duration: 500,
  },
  layout: {
    position: 'bottom-left',
    width: 440,
    opacity: 100,
    borderRadius: 6,
    padding: 0,
    showBorder: false,
  },
  display: {
    maxChallenges: 10,
    showProgressBar: true,
    showSubChallenges: true,
    showGivenBy: true,
    showDate: true,
    compactMode: false,
  },
};

export const BLOODBONES_OVERLAY_CONFIG: OverlayConfig = {
  theme: 'bloodbones',
  colors: {
    background: 'transparent',
    cardBackground: '#1e0c0c',
    border: '#4a2828',
    challengeTitle: '#f0e0d8',
    subchallengeTitle: '#c0a090',
    subchallengeCompleted: '#4a2828',
    viewerName: '#e0c8b8',
    dateText: '#806058',
    progressCount: '#cc2020',
    progressFill: '#b01818',
    progressEmpty: '#0a0406',
    iconPrimary: '#cc2020',
    iconSecondary: '#a08070',
    completedIndicator: '#cc2020',
  },
  fonts: {
    title: 'Chakra Petch',
    body: 'Inter',
    titleSize: 16,
    bodySize: 12,
    titleWeight: 800,
  },
  animations: {
    enabled: true,
    rotationInterval: 10000,
    entranceType: 'fade',
    exitType: 'fade',
    duration: 500,
  },
  layout: {
    position: 'bottom-left',
    width: 440,
    opacity: 100,
    borderRadius: 6,
    padding: 0,
    showBorder: false,
  },
  display: {
    maxChallenges: 10,
    showProgressBar: true,
    showSubChallenges: true,
    showGivenBy: true,
    showDate: true,
    compactMode: false,
  },
};

export const HIGHROLLERROYALEREVIVAL_OVERLAY_CONFIG: OverlayConfig = {
  theme: 'highrollerroyalerevival',
  colors: {
    background: 'transparent',
    cardBackground: '#f4efe3',
    border: '#c89654',
    challengeTitle: '#1f1d1a',
    subchallengeTitle: '#2e2a23',
    subchallengeCompleted: '#8a7a63',
    viewerName: '#2b2620',
    dateText: '#8f6a3d',
    progressCount: '#fff2d3',
    progressFill: '#7ed9ff',
    progressEmpty: '#111319',
    iconPrimary: '#aee9ff',
    iconSecondary: '#e3b56f',
    completedIndicator: '#ffd696',
  },
  fonts: {
    title: 'Chakra Petch',
    body: 'Inter',
    titleSize: 16,
    bodySize: 12,
    titleWeight: 800,
  },
  animations: {
    enabled: true,
    rotationInterval: 10000,
    entranceType: 'scale',
    exitType: 'fade',
    duration: 500,
  },
  layout: {
    position: 'bottom-left',
    width: 460,
    opacity: 100,
    borderRadius: 14,
    padding: 0,
    showBorder: false,
  },
  display: {
    maxChallenges: 10,
    showProgressBar: true,
    showSubChallenges: true,
    showGivenBy: true,
    showDate: true,
    compactMode: false,
  },
};

export const ELDERFLAME_OVERLAY_CONFIG: OverlayConfig = {
  theme: 'elderflame',
  colors: {
    background: 'transparent',
    cardBackground: '#161210',
    border: '#4a3828',
    challengeTitle: '#f5f0e8',
    subchallengeTitle: '#c0a880',
    subchallengeCompleted: '#5a4030',
    viewerName: '#e8dcc8',
    dateText: '#8a7060',
    progressCount: '#ff8c30',
    progressFill: '#ff6020',
    progressEmpty: '#0a0806',
    iconPrimary: '#ff7030',
    iconSecondary: '#e84010',
    completedIndicator: '#ff9040',
  },
  fonts: {
    title: 'Chakra Petch',
    body: 'Inter',
    titleSize: 16,
    bodySize: 12,
    titleWeight: 800,
  },
  animations: {
    enabled: true,
    rotationInterval: 10000,
    entranceType: 'scale',
    exitType: 'fade',
    duration: 500,
  },
  layout: {
    position: 'bottom-left',
    width: 430,
    opacity: 100,
    borderRadius: 8,
    padding: 0,
    showBorder: false,
  },
  display: {
    maxChallenges: 10,
    showProgressBar: true,
    showSubChallenges: true,
    showGivenBy: true,
    showDate: true,
    compactMode: false,
  },
};

export const PHOENIXREVIVAL_OVERLAY_CONFIG: OverlayConfig = {
  theme: 'phoenixrevival',
  colors: {
    background: 'transparent',
    cardBackground: '#181208',
    border: '#4a3820',
    challengeTitle: '#f5eedc',
    subchallengeTitle: '#c8a860',
    subchallengeCompleted: '#5a4020',
    viewerName: '#e8d8b0',
    dateText: '#9a8050',
    progressCount: '#ffc030',
    progressFill: '#ff8c00',
    progressEmpty: '#0a0804',
    iconPrimary: '#ffc000',
    iconSecondary: '#ff8c00',
    completedIndicator: '#ffd700',
  },
  fonts: {
    title: 'Chakra Petch',
    body: 'Inter',
    titleSize: 16,
    bodySize: 12,
    titleWeight: 800,
  },
  animations: {
    enabled: true,
    rotationInterval: 10000,
    entranceType: 'scale',
    exitType: 'fade',
    duration: 500,
  },
  layout: {
    position: 'bottom-left',
    width: 430,
    opacity: 100,
    borderRadius: 8,
    padding: 0,
    showBorder: false,
  },
  display: {
    maxChallenges: 10,
    showProgressBar: true,
    showSubChallenges: true,
    showGivenBy: true,
    showDate: true,
    compactMode: false,
  },
};

export const KURONAMI_OVERLAY_CONFIG: OverlayConfig = {
  theme: 'kuronami',
  colors: {
    background: 'transparent',
    cardBackground: '#12131a',
    border: '#2a2d3a',
    challengeTitle: '#e8ecf8',
    subchallengeTitle: '#9aa0ba',
    subchallengeCompleted: '#404560',
    viewerName: '#dde2ef',
    dateText: '#7a8099',
    progressCount: '#8a2be2',
    progressFill: '#00d2ff',
    progressEmpty: '#0a0b10',
    iconPrimary: '#00d2ff',
    iconSecondary: '#8a2be2',
    completedIndicator: '#00d2ff',
  },
  fonts: {
    title: 'Chakra Petch',
    body: 'Inter',
    titleSize: 16,
    bodySize: 12,
    titleWeight: 800,
  },
  animations: {
    enabled: true,
    rotationInterval: 10000,
    entranceType: 'slide-left',
    exitType: 'fade',
    duration: 500,
  },
  layout: {
    position: 'bottom-left',
    width: 420,
    opacity: 100,
    borderRadius: 8,
    padding: 20,
    showBorder: false,
  },
  display: {
    maxChallenges: 10,
    showProgressBar: true,
    showSubChallenges: true,
    showGivenBy: true,
    showDate: true,
    compactMode: false,
  },
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    name: 'default',
    label: 'Battleground',
    description: 'Military tactical HUD with PUBG-inspired orange ammo counters, zone-closing progress bar, and dust particle VFX',
    config: { ...DEFAULT_OVERLAY_CONFIG },
  },
  {
    name: 'kuronami',
    label: 'Kuronami',
    description: 'Obsidian carbon-steel chassis with charcoal leather side wraps, neon liquid-water progress tube and stylized 3D rain splash VFX',
    config: { ...KURONAMI_OVERLAY_CONFIG },
  },
  {
    name: 'prelude',
    label: 'Prelude to Chaos',
    description: 'Brutalist dark-iron chassis with purple lightning arcs and molten lava progress bar',
    config: { ...PRELUDE_OVERLAY_CONFIG },
  },
  {
    name: 'radiant',
    label: 'Radiant Arcade',
    description: 'Retro-premium glossy white chassis with LED dot-matrix numbers and modular light cells',
    config: { ...RADIANT_OVERLAY_CONFIG },
  },
  {
    name: 'scrappunk',
    label: 'Scrap Punk',
    description: 'Rusted diamond-plate steel with hazard stripes, flip-counter numerals and spark VFX',
    config: { ...SCRAPPUNK_OVERLAY_CONFIG },
  },
  {
    name: 'azuredragon',
    label: 'Azure Dragon',
    description: 'Ornate dark mahogany relic with gold filigree, emerald jade inlays and ethereal cyan mist',
    config: { ...AZUREDRAGON_OVERLAY_CONFIG },
  },
  {
    name: 'chromatactical',
    label: 'Chroma Tactical',
    description: 'Angular carbon-fiber HUD with electric cyan and hot magenta neon accents and power-cell progress',
    config: { ...CHROMATACTICAL_OVERLAY_CONFIG },
  },
  {
    name: 'cyberthreat',
    label: 'Cyber Threat',
    description: 'Glossy white polycarbonate shell with carbon-fiber core, glitching 8-bit counter, laser-grid progress conduit and pixel-heart effects',
    config: { ...CYBERTHREAT_OVERLAY_CONFIG },
  },
  {
    name: 'araxys',
    label: 'Araxys Alien',
    description: 'Dark-bronze alien alloy with interlocking scales, crackling orange energy beam and glowing particle dust',
    config: { ...ARAXYS_OVERLAY_CONFIG },
  },
  {
    name: 'spectrum',
    label: 'Spectrum',
    description: 'Glossy white ceramic chassis with RGB cycling numbers, rainbow equalizer progress bar and prismatic laser flecks',
    config: { ...SPECTRUM_OVERLAY_CONFIG },
  },
  {
    name: 'neofrontier',
    label: 'Neo Frontier',
    description: 'Sci-Fi Western fusion with scratched brass frame, walnut wood grip, cyan neon tubes, hexagonal holographic numbers and bullet-chamber progress bar',
    config: { ...NEOFRONTIER_OVERLAY_CONFIG },
  },
  {
    name: 'singularity',
    label: 'Singularity',
    description: 'Cosmic black hole with floating dark matter shards, void-black texture, glowing cosmic purple edges, warped gravitational numbers and swirling stardust progress bar',
    config: { ...SINGULARITY_OVERLAY_CONFIG },
  },
  {
    name: 'gearhead',
    label: 'Gear Head',
    description: 'Heavy V8 engine block chassis with greasy dark iron, tachometer gauge display, pumping piston progress bar, hazard stripes and steam venting exhaust pipes',
    config: { ...GEARHEAD_OVERLAY_CONFIG },
  },
  {
    name: 'bloodbones',
    label: 'Blood & Bones',
    description: 'Gothic reliquary box with bleached bone spikes, tarnished silver frame, blood-red velvet, crimson aura numerals and glass vial progress bar filling with swirling crimson liquid',
    config: { ...BLOODBONES_OVERLAY_CONFIG },
  },
  {
    name: 'highrollerroyalerevival',
    label: 'High Roller Royale Revival',
    description: '24k gold and ivory luxury frame with diamond accents, mother-of-pearl inlays, crystal counter and tourbillon-inspired progress carriage',
    config: { ...HIGHROLLERROYALEREVIVAL_OVERLAY_CONFIG },
  },
  {
    name: 'elderflame',
    label: 'Elderflame',
    description: 'Living dragon-scale volcanic chassis with charcoal rock texture, molten lava cracks, honeycomb lava-vein progress bar and rising ember particles',
    config: { ...ELDERFLAME_OVERLAY_CONFIG },
  },
  {
    name: 'phoenixrevival',
    label: 'Phoenix Revival',
    description: 'Iridescent metallic wing chassis embraced by elegant feathered wings, golden amber glow, fire-ringed progress bar with ascending ember particles',
    config: { ...PHOENIXREVIVAL_OVERLAY_CONFIG },
  },
];

/** Get the default colors for a given theme name */
export function getThemeDefaultColors(themeName: ThemeName): OverlayConfig['colors'] {
  const preset = THEME_PRESETS.find((p) => p.name === themeName);
  return preset ? { ...preset.config.colors } : { ...DEFAULT_OVERLAY_CONFIG.colors };
}

/** Check if current colors differ from the theme's defaults */
export function isUsingCustomColors(config: OverlayConfig): boolean {
  const defaults = getThemeDefaultColors(config.theme);
  const colorKeys: (keyof OverlayConfig['colors'])[] = [
    'background', 'cardBackground', 'border', 'challengeTitle',
    'subchallengeTitle', 'subchallengeCompleted', 'viewerName',
    'dateText', 'progressCount', 'progressFill', 'progressEmpty',
    'iconPrimary', 'iconSecondary', 'completedIndicator',
  ];
  return colorKeys.some((key) => config.colors[key] !== defaults[key]);
}

export function mergeWithDefaults(saved: Partial<OverlayConfig> | null): OverlayConfig {
  if (!saved) return { ...DEFAULT_OVERLAY_CONFIG };
  // Map saved theme to a valid ThemeName
  const validThemes: ThemeName[] = ['default', 'kuronami', 'prelude', 'radiant', 'scrappunk', 'azuredragon', 'chromatactical', 'cyberthreat', 'araxys', 'spectrum', 'neofrontier', 'singularity', 'gearhead', 'bloodbones', 'highrollerroyalerevival', 'elderflame', 'phoenixrevival'];
  const theme: ThemeName = validThemes.includes(saved.theme as ThemeName) ? (saved.theme as ThemeName) : 'default';

  const mergedColors = { ...DEFAULT_OVERLAY_CONFIG.colors, ...(saved.colors || {}) };

  // Migrate legacy color fields → modern equivalents if the modern field was not explicitly set
  // This ensures old saved configs still render correctly.
  if (saved.colors) {
    const sc = saved.colors;
    if (sc.accent && !sc.iconPrimary) mergedColors.iconPrimary = sc.accent;
    if (sc.progressBar && !sc.progressFill) mergedColors.progressFill = sc.progressBar;
    if (sc.completed && !sc.completedIndicator) mergedColors.completedIndicator = sc.completed;
    if (sc.dimmed && !sc.dateText) mergedColors.dateText = sc.dimmed;
    if (sc.text && !sc.challengeTitle) mergedColors.challengeTitle = sc.text;
  }

  return {
    ...DEFAULT_OVERLAY_CONFIG,
    ...saved,
    theme,
    colors: mergedColors,
    fonts: { ...DEFAULT_OVERLAY_CONFIG.fonts, ...(saved.fonts || {}) },
    animations: { ...DEFAULT_OVERLAY_CONFIG.animations, ...(saved.animations || {}) },
    layout: { ...DEFAULT_OVERLAY_CONFIG.layout, ...(saved.layout || {}) },
    display: { ...DEFAULT_OVERLAY_CONFIG.display, ...(saved.display || {}) },
  };
}
