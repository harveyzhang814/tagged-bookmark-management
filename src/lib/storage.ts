import type { BookmarkItem, StorageShape, Tag, Workstation } from './types';
import type { Locale } from '../i18n/locales';
import { DEFAULT_LOCALE } from '../i18n/locales';

const STORAGE_KEYS = {
  BOOKMARKS: 'tbm.bookmarks',
  TAGS: 'tbm.tags',
  WORKSTATIONS: 'tbm.workstations',
  THEME: 'tbm.theme',
  ACTIVE_TAB: 'tbm.activeTab',
  LOCALE: 'tbm.locale',
  SETTINGS_BROWSER_DEFAULT_OPEN_MODE: 'tbm.settings.browser.defaultOpenMode',
  SETTINGS_BROWSER_TAG_WORKSTATION_OPEN_MODE: 'tbm.settings.browser.tagWorkstationOpenMode'
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

export const getWorkstationsMap = async (): Promise<Record<string, Workstation>> =>
  readValue<Record<string, Workstation>>(STORAGE_KEYS.WORKSTATIONS, {});

export const saveWorkstationsMap = async (payload: Record<string, Workstation>) =>
  writeValue(STORAGE_KEYS.WORKSTATIONS, payload);

export const resetStorage = async () => {
  await Promise.all([
    removeValue(STORAGE_KEYS.BOOKMARKS),
    removeValue(STORAGE_KEYS.TAGS),
    removeValue(STORAGE_KEYS.WORKSTATIONS)
  ]);
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
  const [bookmarks, tags, workstations] = await Promise.all([
    getBookmarksMap(),
    getTagsMap(),
    getWorkstationsMap()
  ]);
  return { bookmarks, tags, workstations };
};

export type Theme = 'light' | 'dark' | 'system';

export const getTheme = async (): Promise<Theme> =>
  readValue<Theme>(STORAGE_KEYS.THEME, 'system');

export const saveTheme = async (theme: Theme) =>
  writeValue(STORAGE_KEYS.THEME, theme);

export type ActiveTab = 'home' | 'bookmarks' | 'tags' | 'ranking' | 'workstations';

export const getActiveTab = async (): Promise<ActiveTab> =>
  readValue<ActiveTab>(STORAGE_KEYS.ACTIVE_TAB, 'home');

export const saveActiveTab = async (tab: ActiveTab) =>
  writeValue(STORAGE_KEYS.ACTIVE_TAB, tab);

export type BookmarkOpenMode = 'newTab' | 'newWindow';

export const getBrowserDefaultOpenMode = async (): Promise<BookmarkOpenMode> =>
  readValue<BookmarkOpenMode>(STORAGE_KEYS.SETTINGS_BROWSER_DEFAULT_OPEN_MODE, 'newTab');

export const saveBrowserDefaultOpenMode = async (mode: BookmarkOpenMode) =>
  writeValue(STORAGE_KEYS.SETTINGS_BROWSER_DEFAULT_OPEN_MODE, mode);

export const getBrowserTagWorkstationOpenMode = async (): Promise<BookmarkOpenMode> =>
  readValue<BookmarkOpenMode>(STORAGE_KEYS.SETTINGS_BROWSER_TAG_WORKSTATION_OPEN_MODE, 'newTab');

export const saveBrowserTagWorkstationOpenMode = async (mode: BookmarkOpenMode) =>
  writeValue(STORAGE_KEYS.SETTINGS_BROWSER_TAG_WORKSTATION_OPEN_MODE, mode);

export const getLocale = async (): Promise<Locale> =>
  readValue<Locale>(STORAGE_KEYS.LOCALE, DEFAULT_LOCALE);

export const saveLocale = async (locale: Locale) =>
  writeValue(STORAGE_KEYS.LOCALE, locale);

// 检测是否是首次启动（没有保存过语言偏好）
export const isFirstLaunch = async (): Promise<boolean> => {
  try {
    const locale = await readValue<Locale | null>(STORAGE_KEYS.LOCALE, null);
    return locale === null;
  } catch {
    // 如果读取失败，视为首次启动
    return true;
  }
};

// 初始化语言（首次启动时根据浏览器语言自动设置，否则使用用户保存的偏好）
export const initLocale = async (): Promise<Locale> => {
  const isFirst = await isFirstLaunch();
  
  if (isFirst) {
    // 首次启动：根据浏览器语言自动设置
    const { detectBrowserLocale } = await import('../i18n/locales');
    const detectedLocale = detectBrowserLocale();
    await saveLocale(detectedLocale);
    return detectedLocale;
  } else {
    // 非首次启动：使用保存的语言偏好
    return await getLocale();
  }
};


