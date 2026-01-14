import { createBookmark, ensureDefaults } from '../lib/bookmarkService';

const QUICK_ADD_MENU_ID = 'tbm.quickAdd';

chrome.runtime.onInstalled.addListener(async () => {
  await ensureDefaults();
  // 先尝试移除已存在的菜单项（如果存在），避免重复创建错误
  chrome.contextMenus.remove(QUICK_ADD_MENU_ID, () => {
    // 创建上下文菜单项
    chrome.contextMenus.create({
      id: QUICK_ADD_MENU_ID,
      title: '加入 CrossTag Bookmarks',
      contexts: ['page', 'selection']
    });
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


