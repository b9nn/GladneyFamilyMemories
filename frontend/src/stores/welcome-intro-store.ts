import { create } from 'zustand';

/**
 * Welcome intro shown on the dashboard right after login/registration:
 *  - 'photo'  : only the background photo is shown (no dark tint, content hidden)
 *  - 'reveal' : tint and dashboard content fade in, staggered
 *  - 'off'    : normal page
 */
export type WelcomePhase = 'off' | 'photo' | 'reveal';

/** How long the photo is shown on its own, once it has loaded. */
export const WELCOME_PHOTO_MS = 3000;
/** How long the fade-in lasts (longest stagger delay + transition duration). */
export const WELCOME_REVEAL_MS = 2200;
/** Give up waiting for the photo to load after this long and just show the page. */
export const WELCOME_LOAD_TIMEOUT_MS = 4000;

interface WelcomeIntroState {
  phase: WelcomePhase;
  start: () => void;
  setPhase: (phase: WelcomePhase) => void;
}

export const useWelcomeIntroStore = create<WelcomeIntroState>()((set) => ({
  phase: 'off',
  start: () => set({ phase: 'photo' }),
  setPhase: (phase) => set({ phase }),
}));
