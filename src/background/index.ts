import { createBookmark, ensureDefaults } from '../lib/bookmarkService';

const QUICK_ADD_MENU_ID = 'tbm.quickAdd';

chrome.runtime.onInstalled.addListener(async () => {
  await ensureDefaults();
  // 创建上下文菜单项
  chrome.contextMenus.create({
    id: QUICK_ADD_MENU_ID,
    title: '加入 CrossTag Bookmarks',
    contexts: ['page', 'selection']
  }, () => {
    // 如果菜单项已存在（重复创建），忽略错误
    if (chrome.runtime.lastError) {
      // 菜单项已存在，这是正常的，忽略错误
      return;
    }
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


