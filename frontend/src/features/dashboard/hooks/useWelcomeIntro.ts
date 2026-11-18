import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useDashboardBackground } from './useDashboard';
import {
  useWelcomeIntroStore, WELCOME_PHOTO_MS, WELCOME_REVEAL_MS, WELCOME_LOAD_TIMEOUT_MS,
} from '@/stores/welcome-intro-store';

/**
 * Drives the post-login welcome intro. Mount once (in Layout).
 * Waits for the background photo to load, holds it on screen, then reveals the page.
 */
export function useWelcomeIntro() {
  const phase = useWelcomeIntroStore((s) => s.phase);
  const setPhase = useWelcomeIntroStore((s) => s.setPhase);
  const { data: bg, isFetched } = useDashboardBackground();
  const { pathname } = useLocation();
  const bgUrl = bg?.url ?? null;

  // Photo phase: skip if there is no photo or we're not on the dashboard;
  // otherwise wait for the image to load, then hold it before revealing.
  useEffect(() => {
    if (phase !== 'photo') return;
    if (pathname !== '/') { setPhase('off'); return; }
    if (!isFetched) return;
    if (!bgUrl) { setPhase('off'); return; }

    let holdTimer: number | undefined;
    const startHold = () => {
      if (holdTimer !== undefined) return;
      holdTimer = window.setTimeout(() => setPhase('reveal'), WELCOME_PHOTO_MS);
    };
    const img = new Image();
    img.onload = startHold;
    img.onerror = () => setPhase('reveal');
    img.src = bgUrl;
    if (img.complete) startHold();
    const loadTimeout = window.setTimeout(() => setPhase('reveal'), WELCOME_LOAD_TIMEOUT_MS + WELCOME_PHOTO_MS);

    return () => {
      img.onload = null;
      img.onerror = null;
      window.clearTimeout(holdTimer);
      window.clearTimeout(loadTimeout);
    };
  }, [phase, pathname, isFetched, bgUrl, setPhase]);

  // Reveal phase: once the fade-in has finished, return to normal.
  useEffect(() => {
    if (phase !== 'reveal') return;
    const t = window.setTimeout(() => setPhase('off'), WELCOME_REVEAL_MS);
    return () => window.clearTimeout(t);
  }, [phase, setPhase]);

  return phase;
}
