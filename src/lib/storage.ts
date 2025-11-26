import type { BookmarkItem, StorageShape, Tag } from './types';

const STORAGE_KEYS = {
  BOOKMARKS: 'tbm.bookmarks',
  TAGS: 'tbm.tags',
  THEME: 'tbm.theme',
  ACTIVE_TAB: 'tbm.activeTab'
} as const;

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

const memoryFallback = new Map<string, unknown>();

const getChromeStorage = () => {
  if (typeof chrome === 'undefined') {
    return null;
  }

  // 使用 local 存储作为临时方案，避免未发布扩展的 sync 配额限制
  // 未发布的扩展使用 sync 存储有配额限制（约100KB），local 存储没有限制
  // 发布后可以考虑迁移到 sync 以实现跨设备同步
  return chrome.storage?.local ?? null;
};

const readValue = async <T>(key: StorageKey, defaultValue: T): Promise<T> => {
  const storage = getChromeStorage();

  if (!storage) {
    return (memoryFallback.get(key) as T) ?? defaultValue;
  }

  return new Promise<T>((resolve, reject) => {
    storage.get([key], (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }

      resolve((result[key] as T) ?? defaultValue);
    });
  });
};

const writeValue = async <T>(key: StorageKey, value: T) => {
  const storage = getChromeStorage();

  if (!storage) {
    memoryFallback.set(key, value);
    return;
  }

  return new Promise<void>((resolve, reject) => {
    storage.set({ [key]: value }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve();
    });
  });
};

const removeValue = async (key: StorageKey) => {
  const storage = getChromeStorage();
  if (!storage) {
    memoryFallback.delete(key);
    return;
  }

  return new Promise<void>((resolve, reject) => {
    storage.remove(key, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve();
    });
  });
};

export const storageClient = {
  readValue,
  writeValue,
  removeValue,
  STORAGE_KEYS
};

export const getBookmarksMap = async (): Promise<Record<string, BookmarkItem>> =>
  readValue<Record<string, BookmarkItem>>(STORAGE_KEYS.BOOKMARKS, {});

export const saveBookmarksMap = async (payload: Record<string, BookmarkItem>) =>
  writeValue(STORAGE_KEYS.BOOKMARKS, payload);

export const getTagsMap = async (): Promise<Record<string, Tag>> =>
  readValue<Record<string, Tag>>(STORAGE_KEYS.TAGS, {});

export const saveTagsMap = async (payload: Record<string, Tag>) =>
  writeValue(STORAGE_KEYS.TAGS, payload);

export const resetStorage = async () => {
  await Promise.all([removeValue(STORAGE_KEYS.BOOKMARKS), removeValue(STORAGE_KEYS.TAGS)]);
};

export const watchStorage = <T>(
  key: StorageKey,
  callback: (value: T) => void
): (() => void) | null => {
  if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) {
    return null;
  }

  const handler = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
    if (areaName !== 'local') return;
    if (changes[key]) {
      callback(changes[key].newValue as T);
    }
  };

  chrome.storage.onChanged.addListener(handler);
  return () => chrome.storage.onChanged.removeListener(handler);
};

export const getSnapshot = async (): Promise<StorageShape> => {
  const [bookmarks, tags] = await Promise.all([getBookmarksMap(), getTagsMap()]);
  return { bookmarks, tags };
};

export type Theme = 'light' | 'dark';

export const getTheme = async (): Promise<Theme> =>
  readValue<Theme>(STORAGE_KEYS.THEME, 'light');

export const saveTheme = async (theme: Theme) =>
  writeValue(STORAGE_KEYS.THEME, theme);

export type ActiveTab = 'home' | 'bookmarks' | 'tags';

export const getActiveTab = async (): Promise<ActiveTab> =>
  readValue<ActiveTab>(STORAGE_KEYS.ACTIVE_TAB, 'home');

export const saveActiveTab = async (tab: ActiveTab) =>
  writeValue(STORAGE_KEYS.ACTIVE_TAB, tab);


