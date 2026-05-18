import { useAuthStore } from '@/features/auth/stores/auth-store';

export const ALL_PAGES = ['vignettes', 'photos', 'audio', 'files', 'timeline', 'search', 'wedding'] as const;
export type PageKey = typeof ALL_PAGES[number];

export function usePageAccess() {
  const user = useAuthStore((s) => s.user);

  function canAccess(page: PageKey): boolean {
    if (!user) return false;
    if (user.is_admin || user.page_access == null) return true;
    const allowed = new Set(user.page_access.split(',').map((p) => p.trim()).filter(Boolean));
    return allowed.has(page);
  }

  return canAccess;
}

export function pageAccessToString(pages: PageKey[]): string | null {
  if (pages.length === ALL_PAGES.length) return null; // null = full access
  return pages.join(',') || null;
}

export function stringToPageAccess(value: string | null | undefined): PageKey[] {
  if (!value) return [...ALL_PAGES];
  const set = new Set(value.split(',').map((p) => p.trim()));
  return ALL_PAGES.filter((p) => set.has(p));
}
