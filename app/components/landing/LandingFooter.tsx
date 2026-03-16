'use client';

import { Globe, Linkedin, Mail } from 'lucide-react';

export default function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-gunmetal/30 bg-charcoal/50 backdrop-blur-sm">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-tactical/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand Column */}
          <div className="md:col-span-2">
            <h3 className="text-2xl font-black tracking-[0.12em] text-hud mb-2" style={{ fontFamily: 'var(--font-chakra)' }}>
              CHALLENGE TRACKER
            </h3>
            <p className="text-dimmed text-sm mb-4 max-w-md">
              Tactical engagement system for streamers. Real-time challenge tracking, moderator delegation, and seamless OBS integration.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
              <a
                href="https://www.linkedin.com/in/erin-paul-manjaly-17596b250/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-dimmed text-sm hover:text-tactical transition-colors duration-200"
                aria-label="LinkedIn profile"
              >
                <Linkedin size={16} />
                <span>Linkedin</span>
              </a>

              <a
                href="mailto:erinpaulmanjaly2002@gmail.com"
                className="inline-flex items-center gap-2 text-dimmed text-sm hover:text-tactical transition-colors duration-200"
                aria-label="Send email"
              >
                <Mail size={16} />
                <span>erinpaulmanjaly2002@gmail.com</span>
              </a>

              <a
                href="https://epm-portfolio.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-dimmed text-sm hover:text-tactical transition-colors duration-200"
                aria-label="Portfolio link"
              >
                <Globe size={16} />
                <span>Portfolio</span>
              </a>
            </div>

            <div className="mt-6 pt-5 border-t border-gunmetal/20 text-left">
              <p
                className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[0.18em] text-transparent bg-clip-text bg-gradient-to-r from-tactical via-hud to-tactical drop-shadow-[0_0_18px_rgba(72,239,165,0.35)]"
                style={{ fontFamily: 'var(--font-chakra)' }}
              >
                EPIC PIXELS
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-hud/80 mb-4">
              Platform
            </h4>
            <ul className="space-y-2">
              {[
                { label: 'Features', href: '#problem' },
                { label: 'Overlay', href: '#overlay' },
                { label: 'Moderators', href: '#moderator' },
                { label: 'Pricing', href: '#cta' },
              ].map(link => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-dimmed text-sm hover:text-tactical transition-colors duration-200 hover:translate-x-1 inline-block"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        {/* <div className="pt-8 border-t border-gunmetal/20 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-tactical animate-pulse" />
            <p className="font-mono text-xs text-dimmed/60 tracking-wider">
              OPERATIONAL SINCE {currentYear}
            </p>
          </div>
          
          <p className="font-mono text-xs text-dimmed/60">
            © {currentYear} Challenge Tracker
          </p>
        </div> */}

        {/* Tactical accent corners */}
        <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-tactical/20" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-tactical/20" />
      </div>
    </footer>
  );
}
