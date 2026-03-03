import { describe, it, expect } from 'vitest';
import { normalizeQuery, runGlobalSearch } from '../globalSearchLogic';
import type { BookmarkItem, Tag } from '../types';

const now = Date.now();

const sampleBookmarks: BookmarkItem[] = [
  { id: 'b1', url: 'https://vitest.dev', title: 'Vitest', tags: [], pinned: false, clickCount: 10, createdAt: now - 2000, updatedAt: now },
  { id: 'b2', url: 'https://react.dev', title: 'React', tags: [], pinned: false, clickCount: 5, createdAt: now - 1000, updatedAt: now },
  { id: 'b3', url: 'https://example.com/guide', title: 'Example Guide', tags: [], pinned: false, clickCount: 0, createdAt: now - 3000, updatedAt: now }
];

const sampleTags: Tag[] = [
  { id: 't1', name: 'Testing', color: '#fff', description: 'Unit tests', createdAt: now - 100, updatedAt: now, usageCount: 1, clickCount: 0, pinned: false },
  { id: 't2', name: 'Frontend', color: '#ccc', description: 'React and Vue', createdAt: now - 50, updatedAt: now, usageCount: 1, clickCount: 0, pinned: false }
];

describe('globalSearchLogic', () => {
  describe('normalizeQuery', () => {
    it('trims and lowercases', () => {
      expect(normalizeQuery('  Vitest  ')).toBe('vitest');
      expect(normalizeQuery('REACT')).toBe('react');
      expect(normalizeQuery('')).toBe('');
    });
  });

  describe('runGlobalSearch', () => {
    it('returns empty results for empty query', () => {
      const r = runGlobalSearch('', sampleBookmarks, sampleTags);
      expect(r.bookmarkResults).toHaveLength(0);
      expect(r.tagResults).toHaveLength(0);
    });

    it('returns empty results for whitespace-only query', () => {
      const r = runGlobalSearch('   ', sampleBookmarks, sampleTags);
      expect(r.bookmarkResults).toHaveLength(0);
      expect(r.tagResults).toHaveLength(0);
    });

    it('matches bookmarks by title and url (case-insensitive)', () => {
      const r = runGlobalSearch('vitest', sampleBookmarks, sampleTags);
      expect(r.bookmarkResults).toHaveLength(1);
      expect(r.bookmarkResults[0].bookmark.id).toBe('b1');
      expect(r.bookmarkResults[0].matchScore).toBeGreaterThan(0);

      const r2 = runGlobalSearch('react', sampleBookmarks, sampleTags);
      expect(r2.bookmarkResults).toHaveLength(1);
      expect(r2.bookmarkResults[0].bookmark.id).toBe('b2');

      const r3 = runGlobalSearch('example', sampleBookmarks, sampleTags);
      expect(r3.bookmarkResults).toHaveLength(1);
      expect(r3.bookmarkResults[0].bookmark.id).toBe('b3');
    });

    it('matches tags by name and description', () => {
      const r = runGlobalSearch('testing', sampleBookmarks, sampleTags);
      expect(r.tagResults).toHaveLength(1);
      expect(r.tagResults[0].tag.id).toBe('t1');

      const r2 = runGlobalSearch('vue', sampleBookmarks, sampleTags);
      expect(r2.tagResults).toHaveLength(1);
      expect(r2.tagResults[0].tag.description).toContain('Vue');
    });

    it('sorts bookmark results by sortScore then createdAt', () => {
      const r = runGlobalSearch('e', sampleBookmarks, sampleTags);
      expect(r.bookmarkResults.length).toBeGreaterThanOrEqual(2);
      for (let i = 1; i < r.bookmarkResults.length; i++) {
        const a = r.bookmarkResults[i - 1];
        const b = r.bookmarkResults[i];
        expect(b.sortScore).toBeLessThanOrEqual(a.sortScore);
        if (b.sortScore === a.sortScore) {
          expect(b.bookmark.createdAt).toBeLessThanOrEqual(a.bookmark.createdAt);
        }
      }
    });

    it('sorts tag results by sortScore then createdAt', () => {
      const r = runGlobalSearch('e', sampleBookmarks, sampleTags);
      if (r.tagResults.length < 2) return;
      for (let i = 1; i < r.tagResults.length; i++) {
        const a = r.tagResults[i - 1];
        const b = r.tagResults[i];
        expect(b.sortScore).toBeLessThanOrEqual(a.sortScore);
        if (b.sortScore === a.sortScore) {
          expect(b.tag.createdAt).toBeLessThanOrEqual(a.tag.createdAt);
        }
      }
    });

    it('excludes bookmarks/tags with no match', () => {
      const r = runGlobalSearch('xyznone', sampleBookmarks, sampleTags);
      expect(r.bookmarkResults).toHaveLength(0);
      expect(r.tagResults).toHaveLength(0);
    });
  });
});
