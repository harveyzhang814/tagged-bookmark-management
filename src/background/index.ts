import { createBookmark, ensureDefaults } from '../lib/bookmarkService';

const QUICK_ADD_MENU_ID = 'tbm.quickAdd';

chrome.runtime.onInstalled.addListener(async () => {
  await ensureDefaults();
  chrome.contextMenus.create({
    id: QUICK_ADD_MENU_ID,
    title: '加入bi书签',
    contexts: ['page', 'selection']
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


