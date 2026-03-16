import LandingHero from './components/landing/LandingHero';
import LandingProblem from './components/landing/LandingProblem';
import LandingOverlay from './components/landing/LandingOverlay';
import LandingModerator from './components/landing/LandingModerator';
import LandingStats from './components/landing/LandingStats';
import LandingCTA from './components/landing/LandingCTA';
import LandingFooter from './components/landing/LandingFooter';
import SectionRail from './components/landing/SectionRail';

export default function Home() {
  return (
    <div className="relative">
      {/* Atmospheric layers */}
      <div className="landing-vignette" />
      <div className="landing-grain" />

      {/* Section rail navigation */}
      <SectionRail />

      {/* Sections */}
      <LandingHero />
      <LandingProblem />
      <LandingOverlay />
      <LandingModerator />
      <LandingStats />
      <LandingCTA />
      <LandingFooter />
    </div>
  );
}

