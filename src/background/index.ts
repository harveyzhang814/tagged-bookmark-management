import { createBookmark, ensureDefaults } from '../lib/bookmarkService';
import { saveInstallUpdateTime } from '../lib/storage';

const QUICK_ADD_MENU_ID = 'tbm.quickAdd';

chrome.runtime.onInstalled.addListener(async () => {
  await ensureDefaults();
  await saveInstallUpdateTime(Date.now());
  // 创建上下文菜单项
  // 如果菜单项已存在，Chrome会报错，但这是正常的，可以忽略
  chrome.contextMenus.create({
    id: QUICK_ADD_MENU_ID,
    title: '加入 CrossTag Bookmarks',
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


