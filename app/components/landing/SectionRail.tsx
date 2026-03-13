'use client';

import { useEffect, useState, useCallback } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const SECTIONS = [
  { id: 'hero', label: 'DROP ZONE' },
  { id: 'problem', label: 'THE ZONE' },
  { id: 'overlay', label: 'AIRDROP' },
  { id: 'moderator', label: 'COMMAND' },
  { id: 'stats', label: 'SUMMARY' },
  { id: 'cta', label: 'DEPLOY' },
];

export default function SectionRail() {
  const [activeId, setActiveId] = useState('hero');
  const [isVisible, setIsVisible] = useState(false);

  /* After all components mount, refresh ScrollTrigger so sections already
     on-screen after browser scroll restoration get their animations played */
  useEffect(() => {
    const t = setTimeout(() => {
      if (typeof window !== 'undefined' && typeof ScrollTrigger?.refresh === 'function') {
        ScrollTrigger.refresh();
      }
    }, 200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    /* Track which section is most visible */
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { threshold: [0.1, 0.3, 0.5, 0.7] }
    );

    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    /* Show rail after scrolling past hero */
    const handleScroll = () => {
      setIsVisible(window.scrollY > window.innerHeight * 0.5);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <nav
      className={`section-rail hidden lg:flex transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
      }`}
      aria-label="Page sections"
    >
      {SECTIONS.map(s => (
        <button
          key={s.id}
          onClick={() => scrollTo(s.id)}
          className={`section-rail-dot group relative ${s.id === activeId ? 'active' : ''}`}
          aria-label={`Scroll to ${s.label}`}
          aria-current={s.id === activeId ? 'true' : undefined}
        >
          {/* Tooltip on hover */}
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-[9px] tracking-[0.15em] text-dimmed opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {s.label}
          </span>
        </button>
      ))}
    </nav>
  );
}
