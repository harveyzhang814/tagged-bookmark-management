import {
  getBookmarksMap,
  getSnapshot,
  getTagsMap,
  saveBookmarksMap,
  saveTagsMap
} from './storage';
import type {
  BookmarkInput,
  BookmarkItem,
  FilterOptions,
  HotTag,
  StorageShape,
  Tag
} from './types';

const tagPalette = ['#ffcc00', '#ff6b6b', '#1dd3b0', '#6c63ff', '#ff9472', '#12c2e9'];

const generateId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

const getThumbnailForUrl = (url: string) =>
  `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(url)}`;

const recalcTagUsage = (bookmarks: Record<string, BookmarkItem>, tags: Record<string, Tag>) => {
  const usage = new Map<string, number>();
  Object.values(bookmarks).forEach((bookmark) => {
    bookmark.tags.forEach((tagId) => {
      usage.set(tagId, (usage.get(tagId) ?? 0) + 1);
    });
  });

  Object.entries(tags).forEach(([tagId, tag]) => {
    tags[tagId] = { ...tag, usageCount: usage.get(tagId) ?? 0 };
  });
};

const ensureTagColor = (color?: string) => {
  if (color) return color;
  return tagPalette[Math.floor(Math.random() * tagPalette.length)];
};

const normalizeBookmark = (bookmark: BookmarkItem): BookmarkItem => {
  const uniqueTags = Array.from(new Set(bookmark.tags));
  return { ...bookmark, tags: uniqueTags };
};

export const ensureDefaults = async () => {
  const [bookmarks, tags] = await Promise.all([getBookmarksMap(), getTagsMap()]);

  if (Object.keys(tags).length === 0) {
    const now = Date.now();
    const defaultTags: Tag[] = [
      {
        id: generateId('tag'),
        name: '灵感',
        color: '#ffcc00',
        usageCount: 0,
        clickCount: 0,
        pinned: false,
        createdAt: now,
        updatedAt: now
      },
      {
        id: generateId('tag'),
        name: '阅读清单',
        color: '#12c2e9',
        usageCount: 0,
        clickCount: 0,
        pinned: false,
        createdAt: now,
        updatedAt: now
      },
      {
        id: generateId('tag'),
        name: '工具',
        color: '#6c63ff',
        usageCount: 0,
        clickCount: 0,
        pinned: false,
        createdAt: now,
        updatedAt: now
      }
    ];

    const tagMap: Record<string, Tag> = {};
    defaultTags.forEach((tag) => {
      tagMap[tag.id] = tag;
    });
    await saveTagsMap(tagMap);
  }

  if (Object.keys(bookmarks).length === 0) {
    await saveBookmarksMap({});
  }
};

export const getAllData = (): Promise<StorageShape> => getSnapshot();

export const getAllBookmarks = async (): Promise<BookmarkItem[]> => {
  const bookmarks = await getBookmarksMap();
  return Object.values(bookmarks).map(normalizeBookmark);
};

export const getAllTags = async (): Promise<Tag[]> => {
  const tags = await getTagsMap();
  // 确保向后兼容：如果标签缺少 pinned 字段，默认为 false
  return Object.values(tags).map((tag) => ({
    ...tag,
    pinned: tag.pinned ?? false
  }));
};

export const createTag = async (payload: Pick<Tag, 'name' | 'color'>): Promise<Tag> => {
  const tags = await getTagsMap();
  const id = generateId('tag');
  const now = Date.now();
  const tag: Tag = {
    id,
    name: payload.name,
    color: ensureTagColor(payload.color),
    usageCount: 0,
    clickCount: 0,
    pinned: false,
    createdAt: now,
    updatedAt: now
  };
  tags[id] = tag;
  await saveTagsMap(tags);
  return tag;
};

export const updateTag = async (tagId: string, patch: Partial<Pick<Tag, 'name' | 'color' | 'pinned'>>) => {
  const tags = await getTagsMap();
  const target = tags[tagId];
  if (!target) return null;
  const updated: Tag = {
    ...target,
    ...patch,
    updatedAt: Date.now()
  };
  tags[tagId] = updated;
  await saveTagsMap(tags);
  return updated;
};

export const deleteTag = async (tagId: string) => {
  const [bookmarks, tags] = await Promise.all([getBookmarksMap(), getTagsMap()]);
  if (!tags[tagId]) return;
  delete tags[tagId];
  Object.values(bookmarks).forEach((bookmark) => {
    bookmark.tags = bookmark.tags.filter((id) => id !== tagId);
  });
  await Promise.all([saveTagsMap(tags), saveBookmarksMap(bookmarks)]);
};

export const createBookmark = async (payload: BookmarkInput): Promise<BookmarkItem> => {
  const bookmarks = await getBookmarksMap();
  const id = generateId('bm');
  const now = Date.now();
  const bookmark: BookmarkItem = normalizeBookmark({
    id,
    url: payload.url,
    title: payload.title,
    note: payload.note ?? '',
    tags: payload.tags,
    thumbnail: payload.thumbnail ?? getThumbnailForUrl(payload.url),
    pinned: Boolean(payload.pinned),
    clickCount: 0,
    createdAt: now,
    updatedAt: now
  });
  bookmarks[id] = bookmark;
  await saveBookmarksMap(bookmarks);
  await syncUsageCounts();
  return bookmark;
};

export const updateBookmark = async (bookmarkId: string, patch: Partial<BookmarkInput>) => {
  const bookmarks = await getBookmarksMap();
  const target = bookmarks[bookmarkId];
  if (!target) return null;
  const updated: BookmarkItem = normalizeBookmark({
    ...target,
    ...patch,
    tags: patch.tags ?? target.tags,
    title: patch.title ?? target.title,
    note: patch.note ?? target.note,
    url: patch.url ?? target.url,
    thumbnail: patch.thumbnail ?? target.thumbnail ?? getThumbnailForUrl(target.url),
    pinned: typeof patch.pinned === 'boolean' ? patch.pinned : target.pinned,
    updatedAt: Date.now()
  });
  bookmarks[bookmarkId] = updated;
  await saveBookmarksMap(bookmarks);
  await syncUsageCounts();
  return updated;
};

export const deleteBookmark = async (bookmarkId: string) => {
  const bookmarks = await getBookmarksMap();
  if (!bookmarks[bookmarkId]) return;
  delete bookmarks[bookmarkId];
  await saveBookmarksMap(bookmarks);
  await syncUsageCounts();
};

export const incrementBookmarkClick = async (bookmarkId: string) => {
  const bookmarks = await getBookmarksMap();
  const bookmark = bookmarks[bookmarkId];
  if (!bookmark) return null;
  bookmark.clickCount += 1;
  bookmark.updatedAt = Date.now();
  bookmarks[bookmarkId] = bookmark;
  await saveBookmarksMap(bookmarks);
  await incrementTagClicks(bookmark.tags);
  return bookmark;
};

const incrementTagClicks = async (tagIds: string[]) => {
  const tags = await getTagsMap();
  tagIds.forEach((tagId) => {
    if (!tags[tagId]) return;
    tags[tagId] = {
      ...tags[tagId],
      clickCount: tags[tagId].clickCount + 1,
      updatedAt: Date.now()
    };
  });
  await saveTagsMap(tags);
};

const syncUsageCounts = async () => {
  const [bookmarks, tags] = await Promise.all([getBookmarksMap(), getTagsMap()]);
  recalcTagUsage(bookmarks, tags);
  await saveTagsMap(tags);
};

export const getHotTags = async (limit = 6): Promise<HotTag[]> => {
  const tags = await getAllTags();
  return tags
    .sort((a, b) => b.clickCount - a.clickCount)
    .slice(0, limit)
    .map((tag) => ({ tag, clickCount: tag.clickCount }));
};

export const getPinnedBookmarks = async (): Promise<BookmarkItem[]> => {
  const bookmarks = await getAllBookmarks();
  return bookmarks.filter((bookmark) => bookmark.pinned).sort((a, b) => b.updatedAt - a.updatedAt);
};

export const filterBookmarks = async (options: FilterOptions): Promise<BookmarkItem[]> => {
  const bookmarks = await getAllBookmarks();
  return bookmarks
    .filter((bookmark) => {
      if (options.onlyPinned && !bookmark.pinned) return false;
      if (options.tags && options.tags.length > 0) {
        const hasAll = options.tags.every((tagId) => bookmark.tags.includes(tagId));
        if (!hasAll) return false;
      }
      if (options.query) {
        const query = options.query.toLowerCase();
        const text = `${bookmark.title} ${bookmark.note ?? ''} ${bookmark.url}`.toLowerCase();
        if (!text.includes(query)) return false;
      }
      return true;
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);
};

export interface ImportChromeBookmarksResult {
  imported: number;
  skipped: number;
  total: number;
}

/**
 * 从 Chrome 书签中提取所有有 URL 的书签节点
 */
const extractBookmarkNodes = (bookmarkTreeNodes: chrome.bookmarks.BookmarkTreeNode[]): chrome.bookmarks.BookmarkTreeNode[] => {
  const result: chrome.bookmarks.BookmarkTreeNode[] = [];
  
  const traverse = (nodes: chrome.bookmarks.BookmarkTreeNode[]) => {
    for (const node of nodes) {
      // 如果有 URL，说明是书签节点（不是文件夹）
      if (node.url) {
        result.push(node);
      }
      // 如果有子节点，递归遍历
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    }
  };
  
  traverse(bookmarkTreeNodes);
  return result;
};

/**
 * 导入 Chrome 书签
 * 只导入新增的书签，跳过已存在的 URL
 */
export const importChromeBookmarks = async (): Promise<ImportChromeBookmarksResult> => {
  // 检查是否有 Chrome API
  if (typeof chrome === 'undefined' || !chrome.bookmarks) {
    throw new Error('Chrome 书签 API 不可用');
  }

  // 获取所有现有的书签，用于去重
  const existingBookmarks = await getAllBookmarks();
  const existingUrls = new Set(existingBookmarks.map((bm) => bm.url.toLowerCase()));

  // 获取 Chrome 书签树
  const bookmarkTree = await new Promise<chrome.bookmarks.BookmarkTreeNode[]>((resolve, reject) => {
    chrome.bookmarks.getTree((tree) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(tree);
    });
  });

  // 提取所有有 URL 的书签节点
  const bookmarkNodes = extractBookmarkNodes(bookmarkTree);
  
  let imported = 0;
  let skipped = 0;
  const bookmarks = await getBookmarksMap();

  // 批量创建新书签
  for (const node of bookmarkNodes) {
    if (!node.url || !node.title) continue;

    const normalizedUrl = node.url.toLowerCase();
    
    // 检查是否已存在
    if (existingUrls.has(normalizedUrl)) {
      skipped++;
      continue;
    }

    // 创建新书签
    const id = generateId('bm');
    const now = Date.now();
    const bookmark: BookmarkItem = normalizeBookmark({
      id,
      url: node.url,
      title: node.title,
      note: '',
      tags: [],
      thumbnail: getThumbnailForUrl(node.url),
      pinned: false,
      clickCount: 0,
      createdAt: node.dateAdded ? node.dateAdded : now,
      updatedAt: now
    });
    
    bookmarks[id] = bookmark;
    existingUrls.add(normalizedUrl); // 添加到已存在集合，避免同批次重复
    imported++;
  }

  // 保存所有新书签
  if (imported > 0) {
    await saveBookmarksMap(bookmarks);
    await syncUsageCounts();
  }

  return {
    imported,
    skipped,
    total: bookmarkNodes.length
  };
};


