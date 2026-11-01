import { useAuthStore } from '@/features/auth/stores/auth-store';

export const ALL_PAGES = ['family_trees', 'vignettes', 'photos', 'files', 'audio', 'wedding', 'search'] as const;
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

export function useIsWeddingOnly(): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user || user.is_admin || user.page_access == null) return false;
  const pages = stringToPageAccess(user.page_access);
  return pages.length === 1 && pages[0] === 'wedding';
}

export function pageAccessToString(pages: PageKey[]): string | null {
  if (pages.length === ALL_PAGES.length) return null; // null = full access
  return pages.join(','); // '' = no pages
}

export function stringToPageAccess(value: string | null | undefined): PageKey[] {
  if (value == null) return [...ALL_PAGES];
  const set = new Set(value.split(',').map((p) => p.trim()));
  return ALL_PAGES.filter((p) => set.has(p));
}
