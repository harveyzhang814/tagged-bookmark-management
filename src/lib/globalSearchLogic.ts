import type { BookmarkItem, Tag } from './types';

export type BookmarkSearchResult = { bookmark: BookmarkItem; matchScore: number; sortScore: number };
export type TagSearchResult = { tag: Tag; matchScore: number; sortScore: number };

export const normalizeQuery = (q: string): string => q.trim().toLowerCase();

const includesCI = (text: string | undefined, q: string): boolean => {
  if (!text) return false;
  return text.toLowerCase().includes(q);
};

export function runGlobalSearch(
  query: string,
  bookmarks: BookmarkItem[],
  tags: Tag[]
): { bookmarkResults: BookmarkSearchResult[]; tagResults: TagSearchResult[] } {
  const q = normalizeQuery(query);
  if (!q) {
    return { bookmarkResults: [], tagResults: [] };
  }

  const scoredBookmarks: BookmarkSearchResult[] = [];
  for (const bookmark of bookmarks) {
    const titleHit = includesCI(bookmark.title, q);
    const urlHit = includesCI(bookmark.url, q);
    const matchScore = (titleHit ? 1.2 : 0) + (urlHit ? 1.0 : 0);
    if (matchScore <= 0) continue;
    const sortScore = 0.75 * matchScore + 0.25 * (bookmark.clickCount ?? 0) / 100;
    scoredBookmarks.push({ bookmark, matchScore, sortScore });
  }
  scoredBookmarks.sort(
    (a, b) => (b.sortScore - a.sortScore) || (b.bookmark.createdAt - a.bookmark.createdAt)
  );

  const scoredTags: TagSearchResult[] = [];
  for (const tag of tags) {
    const nameHit = includesCI(tag.name, q);
    const descHit = includesCI(tag.description ?? '', q);
    const matchScore = (nameHit ? 1.5 : 0) + (descHit ? 1.0 : 0);
    if (matchScore <= 0) continue;
    scoredTags.push({ tag, matchScore, sortScore: matchScore });
  }
  scoredTags.sort(
    (a, b) => (b.sortScore - a.sortScore) || (b.tag.createdAt - a.tag.createdAt)
  );

  return { bookmarkResults: scoredBookmarks, tagResults: scoredTags };
}
