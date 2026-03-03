import { createBookmark, ensureDefaults } from '../lib/bookmarkService';
import { saveInstallUpdateTime } from '../lib/storage';

const QUICK_ADD_MENU_ID = 'tbm.quickAdd';

const OPTIONS_BASE = 'src/pages/options/main.html';
const TOGGLE_DEBOUNCE_MS = 200;

function getGlobalSearchContentScriptPath(): string | null {
  const manifest = chrome.runtime.getManifest();
  const scripts = manifest.content_scripts?.[0]?.js;
  return scripts?.[0] ?? null;
}

function isInjectableUrl(url: string | undefined): boolean {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
}

async function openOrFocusOptionsBookmarks(params?: { query?: string; tagId?: string }): Promise<void> {
  const baseUrl = chrome.runtime.getURL(OPTIONS_BASE);
  const search = new URLSearchParams();
  search.set('tab', 'bookmarks');
  if (params?.query) search.set('query', params.query);
  if (params?.tagId) search.set('tag', params.tagId);
  const targetUrl = `${baseUrl}?${search.toString()}`;

  const tabs = await chrome.tabs.query({ url: baseUrl + '*' });
  if (tabs.length > 0 && tabs[0].id != null) {
    await chrome.tabs.update(tabs[0].id, { active: true, url: targetUrl });
    if (tabs[0].windowId != null) {
      await chrome.windows.update(tabs[0].windowId, { focused: true });
    }
  } else {
    await chrome.tabs.create({ url: targetUrl });
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  await ensureDefaults();
  await saveInstallUpdateTime(Date.now());
  // 创建上下文菜单项
  // 如果菜单项已存在，Chrome会报错，但这是正常的，可以忽略
  chrome.contextMenus.create({
    id: QUICK_ADD_MENU_ID,
    title: '加入 GrapeMark',
    contexts: ['page', 'selection']
  }, () => {
    // 忽略创建时的错误（如果菜单项已存在）
    void chrome.runtime.lastError;
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== QUICK_ADD_MENU_ID) return;
  if (!tab?.url || !tab.title) return;
  await createBookmark({
    url: tab.url,
    title: tab.title,
    tags: [],
    note: typeof info.selectionText === 'string' ? info.selectionText : undefined,
    pinned: false
  });
});

const lastToggleByTab = new Map<number, number>();

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'open-global-search') return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  if (!isInjectableUrl(tab.url)) {
    await openOrFocusOptionsBookmarks();
    return;
  }

  const now = Date.now();
  if (now - (lastToggleByTab.get(tab.id) ?? 0) < TOGGLE_DEBOUNCE_MS) return;
  lastToggleByTab.set(tab.id, now);

  const scriptPath = getGlobalSearchContentScriptPath();
  if (!scriptPath) {
    await openOrFocusOptionsBookmarks();
    return;
  }
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: [scriptPath]
    });
    await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_GLOBAL_SEARCH' });
  } catch {
    await openOrFocusOptionsBookmarks();
  }
});


