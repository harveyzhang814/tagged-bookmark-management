import { describe, beforeEach, it, expect } from 'vitest';
import {
  createBookmark,
  createTag,
  filterBookmarks,
  getAllBookmarks,
  getAllTags
} from '../bookmarkService';
import { resetStorage } from '../storage';

describe('bookmarkService', () => {
  beforeEach(async () => {
    await resetStorage();
  });

  it('creates tags and bookmarks with relationships', async () => {
    const tag = await createTag({ name: '测试', color: '#fff000' });
    const bookmark = await createBookmark({
      title: 'Vitest',
      url: 'https://vitest.dev',
      note: '测试框架',
      tags: [tag.id],
      pinned: true
    });

    expect(bookmark.id).toBeDefined();
    expect(bookmark.tags).toContain(tag.id);

    const [tags, bookmarks] = await Promise.all([getAllTags(), getAllBookmarks()]);
    expect(tags).toHaveLength(1);
    expect(bookmarks).toHaveLength(1);
  });

  it('filters bookmarks by query and tag', async () => {
    const readingTag = await createTag({ name: '阅读', color: '#ffcc00' });
    const devTag = await createTag({ name: '开发', color: '#6c63ff' });

    await createBookmark({
      title: '前端速查',
      url: 'https://frontend.fun',
      note: '',
      tags: [readingTag.id]
    });

    await createBookmark({
      title: 'React 指南',
      url: 'https://react.dev',
      note: '',
      tags: [devTag.id]
    });

    const filtered = await filterBookmarks({ query: 'React', tags: [devTag.id] });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toContain('React');
  });
});


