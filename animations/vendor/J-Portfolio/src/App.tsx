// ============================================
// Portfolio application
// ============================================

import React, { useCallback, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { Navigation } from '@/components/layout/Navigation';
import { CustomCursor } from '@/components/layout/CustomCursor';
import { FooterSection } from '@/components/sections/FooterSection';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { AtmosphereOverlays } from '@/components/layout/AtmosphereOverlays';
import { LoadingScreen } from '@/components/layout/LoadingScreen';
import { PortfolioExperience } from '@/components/sections/PortfolioExperience';
import { usePrefersReducedMotion } from '@/hooks';
import { SecretGameProvider } from '@/components/game/SecretGame';
import { SecretArchive } from '@/components/game/SecretArchive';
import { SiteBottom } from '@/components/layout/SiteBottom';
import { Marquee } from '@/components/ui/Marquee';
import { MANIFESTO_ITEMS } from '@/constants/data';
import { NAV_OFFSET } from '@/features/portfolio/scene';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

const DEFAULT_ACCENT = '#ff5555';
const isReload =
  (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)
    ?.type === 'reload';
if (isReload) {
  history.scrollRestoration = 'manual';
  history.replaceState(history.state, '', `${location.pathname}${location.search}#hero`);
  window.scrollTo({ top: 0, behavior: 'instant' });
}

const hexToRgb = (hex: string): string => {
  const normalized = hex.replace('#', '');
  const value =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized;

  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);

  return `${r} ${g} ${b}`;
};

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [enableCustomCursor, setEnableCustomCursor] = useState(false);
  const [accentColor, setAccentColor] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_ACCENT;
    try {
      const saved = window.localStorage.getItem('theme-accent');
      return saved && /^#[0-9a-f]{6}$/i.test(saved) ? saved : DEFAULT_ACCENT;
    } catch {
      return DEFAULT_ACCENT;
    }
  });
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 1024px)');
    const pointerQuery = window.matchMedia('(pointer: fine)');

    const updateCursorState = () => {
      const shouldEnableCursor =
        desktopQuery.matches &&
        pointerQuery.matches &&
        !prefersReducedMotion &&
        document.documentElement.dataset.renderQuality !== 'low';

      setEnableCustomCursor(shouldEnableCursor);

      if (shouldEnableCursor) {
        document.body.classList.add('cursor-hidden');
      } else {
        document.body.classList.remove('cursor-hidden');
      }
    };

    updateCursorState();
    const qualityObserver = new MutationObserver(updateCursorState);
    qualityObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-render-quality'],
    });
    desktopQuery.addEventListener('change', updateCursorState);
    pointerQuery.addEventListener('change', updateCursorState);

    // Smooth scroll behavior with performance optimizations
    ScrollTrigger.defaults({
      toggleActions: 'play none none reverse',
    });

    ScrollTrigger.config({
      limitCallbacks: true,
      syncInterval: 150,
    });

    return () => {
      qualityObserver.disconnect();
      desktopQuery.removeEventListener('change', updateCursorState);
      pointerQuery.removeEventListener('change', updateCursorState);
      document.body.classList.remove('cursor-hidden');
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-accent', accentColor);
    root.style.setProperty('--theme-accent-rgb', hexToRgb(accentColor));
    root.style.setProperty('--color-alert', accentColor);
    try {
      window.localStorage.setItem('theme-accent', accentColor);
    } catch {
      // The live theme remains usable when persistent storage is unavailable.
    }
  }, [accentColor]);

  const handleLoadingComplete = useCallback(() => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isLoading || !window.location.hash) return;
    // The initial document loads before React creates chapter anchors. Apply
    // deep links once the boot overlay has released scrolling.
    const frame = requestAnimationFrame(() => {
      let id: string;
      try {
        id = decodeURIComponent(window.location.hash.slice(1));
      } catch {
        return;
      }
      const target = document.getElementById(id);
      if (!target) return;
      window.scrollTo({
        top: Math.max(
          0,
          window.scrollY + target.getBoundingClientRect().top - (id === 'hero' ? 0 : NAV_OFFSET)
        ),
        behavior: 'instant',
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [isLoading]);

  return (
    <ErrorBoundary>
      <SecretGameProvider>
        <div className="bg-void min-h-screen">
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>

          {/* Loading Screen */}
          {isLoading && <LoadingScreen onComplete={handleLoadingComplete} />}

          {/* Custom Cursor */}
          {enableCustomCursor && <CustomCursor />}

          {/* Atmosphere Overlays */}
          <AtmosphereOverlays />

          {/* Main Content */}
          <div
            className="relative"
            data-secret-surface
            inert={isLoading}
            aria-hidden={isLoading ? true : undefined}
          >
            {/* Navigation */}
            <Navigation accentColor={accentColor} onAccentChange={setAccentColor} />

            {/* Main Sections */}
            <main id="main-content" tabIndex={-1}>
              <PortfolioExperience accentColor={accentColor} active={!isLoading} />

              {/* Footer */}
              <Marquee items={MANIFESTO_ITEMS} />
              <FooterSection />
              <div className="resident-chapter">
                <SecretArchive />
              </div>
            </main>
            <SiteBottom />
          </div>
        </div>
      </SecretGameProvider>
    </ErrorBoundary>
  );
};

export default App;
