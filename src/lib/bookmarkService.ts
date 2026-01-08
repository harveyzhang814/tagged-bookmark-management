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

/**
 * 16色预设模版 - 使用HEX编码存储
 * 基于OKLCH色彩空间设计，确保在Light/Dark模式下都有良好表现
 */
export const TAG_COLOR_PALETTE_24: readonly string[] = [
  // Green (绿色系)
  '#4A9A5E', // green-1: oklch(0.62 0.120 150)
  '#358660', // green-2: oklch(0.56 0.100 160)
  // Teal (青色系)
  '#0F9B89', // teal-1: oklch(0.62 0.110 180)
  '#16827D', // teal-2: oklch(0.55 0.090 190)
  // Cyan (青蓝色系)
  '#33A3B4', // cyan-1: oklch(0.66 0.100 210)
  '#398BA9', // cyan-2: oklch(0.60 0.090 225)
  // Azure (天蓝色系)
  '#5DA1C8', // azure-1: oklch(0.68 0.090 235)
  // Blue (蓝色系)
  '#488ACB', // blue-1: oklch(0.62 0.120 250)
  '#537ABB', // blue-2: oklch(0.58 0.110 260)
  '#5365A3', // blue-3: oklch(0.52 0.100 270)
  // Indigo (靛蓝色系)
  '#7470B9', // indigo-1: oklch(0.58 0.110 285)
  '#6D5C9C', // indigo-2: oklch(0.52 0.100 295)
  // Purple (紫色系)
  '#8E70B0', // purple-1: oklch(0.60 0.100 305)
  '#825E93', // purple-2: oklch(0.54 0.090 315)
  // Slate (石板/灰色系)
  '#798898', // slate-1: oklch(0.62 0.030 250)
  '#576574', // slate-2: oklch(0.50 0.030 250)
] as const;

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

/**
 * 重新计算标签的点击次数：该标签下所有书签的点击次数之和
 */
const recalcTagClickCounts = (bookmarks: Record<string, BookmarkItem>, tags: Record<string, Tag>) => {
  const clickCounts = new Map<string, number>();
  
  // 遍历所有书签，累加每个标签的点击次数
  Object.values(bookmarks).forEach((bookmark) => {
    bookmark.tags.forEach((tagId) => {
      const currentCount = clickCounts.get(tagId) ?? 0;
      clickCounts.set(tagId, currentCount + (bookmark.clickCount || 0));
    });
  });

  // 更新所有标签的点击次数
  Object.entries(tags).forEach(([tagId, tag]) => {
    tags[tagId] = { ...tag, clickCount: clickCounts.get(tagId) ?? 0 };
  });
};

/**
 * 生成HSL中L>75%的随机颜色
 */
const generateLightColor = (): string => {
  // HSL中L在75%-95%之间，确保颜色足够亮
  const hue = Math.floor(Math.random() * 360); // 0-360度
  const saturation = Math.floor(Math.random() * 40) + 40; // 40%-80%
  const lightness = Math.floor(Math.random() * 20) + 75; // 75%-95%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

/**
 * 获取默认标签颜色（智能分配：优先使用最少被使用的颜色）
 * @returns 返回预设16色中使用次数最少的颜色
 */
const getDefaultTagColor = async (): Promise<string> => {
  const tags = await getTagsMap();
  const tagList = Object.values(tags);
  
  // 统计每种预设颜色的使用次数
  const colorUsage = new Map<string, number>();
  TAG_COLOR_PALETTE_24.forEach(color => {
    colorUsage.set(color.toLowerCase(), 0);
  });
  
  // 统计现有标签使用的颜色（忽略非预设颜色）
  tagList.forEach(tag => {
    const normalizedColor = tag.color.toLowerCase();
    if (colorUsage.has(normalizedColor)) {
      const count = colorUsage.get(normalizedColor) ?? 0;
      colorUsage.set(normalizedColor, count + 1);
    }
  });
  
  // 找到使用次数最少的颜色
  let minCount = Infinity;
  let selectedColor = TAG_COLOR_PALETTE_24[0];
  
  for (const color of TAG_COLOR_PALETTE_24) {
    const normalizedColor = color.toLowerCase();
    const count = colorUsage.get(normalizedColor) ?? 0;
    if (count < minCount) {
      minCount = count;
      selectedColor = color;
    }
  }
  
  return selectedColor;
};

const normalizeBookmark = (bookmark: BookmarkItem): BookmarkItem => {
  const uniqueTags = Array.from(new Set(bookmark.tags));
  return { 
    ...bookmark, 
    tags: uniqueTags,
    clickHistory: bookmark.clickHistory ?? []
  };
};

export const ensureDefaults = async () => {
  const [bookmarks, tags] = await Promise.all([getBookmarksMap(), getTagsMap()]);

  if (Object.keys(tags).length === 0) {
    const now = Date.now();
    // 为默认标签分配不同的颜色
    const defaultTagColors = [
      TAG_COLOR_PALETTE_24[0], // green-1
      TAG_COLOR_PALETTE_24[7], // blue-1
      TAG_COLOR_PALETTE_24[12], // purple-1
    ];
    const defaultTags: Tag[] = [
      {
        id: generateId('tag'),
        name: '灵感',
        color: defaultTagColors[0],
        usageCount: 0,
        clickCount: 0,
        pinned: false,
        createdAt: now,
        updatedAt: now
      },
      {
        id: generateId('tag'),
        name: '阅读清单',
        color: defaultTagColors[1],
        usageCount: 0,
        clickCount: 0,
        pinned: false,
        createdAt: now,
        updatedAt: now
      },
      {
        id: generateId('tag'),
        name: '工具',
        color: defaultTagColors[2],
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

export const getBookmarkByUrl = async (url: string): Promise<BookmarkItem | null> => {
  const bookmarks = await getBookmarksMap();
  const normalizedUrl = url.toLowerCase();
  const bookmark = Object.values(bookmarks).find(
    (bm) => bm.url.toLowerCase() === normalizedUrl
  );
  return bookmark || null;
};

export const getAllTags = async (): Promise<Tag[]> => {
  const tags = await getTagsMap();
  // 确保向后兼容：如果标签缺少 pinned 字段，默认为 false
  return Object.values(tags).map((tag) => ({
    ...tag,
    pinned: tag.pinned ?? false
  }));
};

export const createTag = async (payload: Pick<Tag, 'name' | 'color' | 'description'>): Promise<Tag> => {
  const tags = await getTagsMap();
  const id = generateId('tag');
  const now = Date.now();
  
  // 如果用户未提供颜色或颜色为空，使用智能分配获取默认颜色
  let tagColor: string;
  if (payload.color && payload.color.trim()) {
    tagColor = payload.color.trim();
  } else {
    // 使用智能分配：优先选择使用次数最少的预设颜色
    tagColor = await getDefaultTagColor();
  }
  
  const tag: Tag = {
    id,
    name: payload.name,
    color: tagColor,
    description: payload.description,
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

export const updateTag = async (tagId: string, patch: Partial<Pick<Tag, 'name' | 'color' | 'description' | 'pinned'>>) => {
  const tags = await getTagsMap();
  const target = tags[tagId];
  if (!target) return null;
  const updated: Tag = {
    ...target,
    ...patch,
    updatedAt: Date.now()
  };
  // 如果更新了颜色，直接使用用户提供的颜色（去除首尾空格）
  if (patch.color !== undefined) {
    updated.color = patch.color.trim();
  }
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
    clickHistory: [],
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
  const [bookmarks, tags] = await Promise.all([getBookmarksMap(), getTagsMap()]);
  const bookmark = bookmarks[bookmarkId];
  if (!bookmark) return null;
  bookmark.clickCount += 1;
  bookmark.updatedAt = Date.now();
  
  // 记录点击时间戳
  const clickTimestamp = Date.now();
  if (!bookmark.clickHistory) {
    bookmark.clickHistory = [];
  }
  bookmark.clickHistory.unshift(clickTimestamp);
  // 限制为最近100次点击
  if (bookmark.clickHistory.length > 100) {
    bookmark.clickHistory = bookmark.clickHistory.slice(0, 100);
  }
  
  bookmarks[bookmarkId] = bookmark;
  await saveBookmarksMap(bookmarks);
  // 重新计算相关标签的点击次数（基于所有书签的点击次数之和）
  recalcTagClickCounts(bookmarks, tags);
  await saveTagsMap(tags);
  return bookmark;
};

const syncUsageCounts = async () => {
  const [bookmarks, tags] = await Promise.all([getBookmarksMap(), getTagsMap()]);
  recalcTagUsage(bookmarks, tags);
  recalcTagClickCounts(bookmarks, tags);
  await saveTagsMap(tags);
};

export const getHotTags = async (limit = 6): Promise<HotTag[]> => {
  const tags = await getAllTags();
  return tags
    .sort((a, b) => b.clickCount - a.clickCount)
    .slice(0, limit)
    .map((tag) => ({ tag, clickCount: tag.clickCount }));
};

export const getHotBookmarks = async (limit = 10): Promise<BookmarkItem[]> => {
  const bookmarks = await getAllBookmarks();
  return bookmarks
    .sort((a, b) => b.clickCount - a.clickCount)
    .slice(0, limit);
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
      clickHistory: [],
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


