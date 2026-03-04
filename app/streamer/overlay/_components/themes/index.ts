import { ThemeRendererProps } from '../../types';
import ThemeDefault from './ThemeDefault';
import ThemeKuronami from './ThemeKuronami';
import ThemePrelude from './ThemePrelude';
import ThemeRadiant from './ThemeRadiant';
import ThemeScrappunk from './ThemeScrappunk';
import ThemeAzureDragon from './ThemeAzureDragon';
import ThemeChromaTactical from './ThemeChromaTactical';
import ThemeCyberThreat from './ThemeCyberThreat';
import ThemeAraxys from './ThemeAraxys';
import ThemeSpectrum from './ThemeSpectrum';
import ThemeNeoFrontier from './ThemeNeoFrontier';
import ThemeSingularity from './ThemeSingularity';
import ThemeGearhead from './ThemeGearhead';
import ThemeBloodBones from './ThemeBloodBones';
import ThemeHighRollerRoyaleRevival from './ThemeHighRollerRoyaleRevival';
import ThemeElderflame from './ThemeElderflame';
import ThemePhoenixRevival from './ThemePhoenixRevival';

const THEME_RENDERERS: Record<string, React.ComponentType<ThemeRendererProps>> = {
    'default': ThemeDefault,
    'kuronami': ThemeKuronami,
    'prelude': ThemePrelude,
    'radiant': ThemeRadiant,
    'scrappunk': ThemeScrappunk,
    'azuredragon': ThemeAzureDragon,
    'chromatactical': ThemeChromaTactical,
    'cyberthreat': ThemeCyberThreat,
    'araxys': ThemeAraxys,
    'spectrum': ThemeSpectrum,
    'neofrontier': ThemeNeoFrontier,
    'singularity': ThemeSingularity,
    'gearhead': ThemeGearhead,
    'bloodbones': ThemeBloodBones,
    'highrollerroyalerevival': ThemeHighRollerRoyaleRevival,
    'elderflame': ThemeElderflame,
    'phoenixrevival': ThemePhoenixRevival,
};

export function getThemeRenderer(theme: string): React.ComponentType<ThemeRendererProps> {
    return THEME_RENDERERS[theme] || ThemeDefault;
}

export { ThemeDefault, ThemeKuronami, ThemePrelude, ThemeRadiant, ThemeScrappunk, ThemeAzureDragon, ThemeChromaTactical, ThemeCyberThreat, ThemeAraxys, ThemeSpectrum, ThemeNeoFrontier, ThemeSingularity, ThemeGearhead, ThemeBloodBones, ThemeHighRollerRoyaleRevival, ThemeElderflame, ThemePhoenixRevival };
