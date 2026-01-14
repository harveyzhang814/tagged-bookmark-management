export const isChromeRuntime = () => typeof chrome !== 'undefined';

export const getActiveTab = async (): Promise<chrome.tabs.Tab | null> => {
  if (!isChromeRuntime() || !chrome.tabs?.query) return null;
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs?.[0] ?? null);
    });
  });
};

export const openBookmark = async (url: string) => {
  if (!isChromeRuntime() || !chrome.tabs?.create) return;
  await chrome.tabs.create({ url });
};

/**
 * 在新浏览器窗口打开多个标签页
 */
export const openBookmarksInNewWindow = async (urls: string[]): Promise<void> => {
  if (!isChromeRuntime() || !chrome.windows?.create || !chrome.tabs?.create) return;
  if (urls.length === 0) return;

  // 创建新窗口，第一个URL作为初始标签页
  const window = await chrome.windows.create({ url: urls[0] });
  if (!window?.id) return;

  // 在新窗口中创建剩余的标签页
  for (let i = 1; i < urls.length; i++) {
    await chrome.tabs.create({ windowId: window.id, url: urls[i] });
  }
};

/**
 * 在当前浏览器窗口打开多个标签页
 */
export const openBookmarksInCurrentWindow = async (urls: string[]): Promise<void> => {
  if (!isChromeRuntime() || !chrome.tabs?.create) return;
  if (urls.length === 0) return;

  // 获取当前活动窗口
  const currentWindow = await chrome.windows.getCurrent();
  if (!currentWindow?.id) return;

  // 在当前窗口中创建所有标签页
  for (const url of urls) {
    await chrome.tabs.create({ windowId: currentWindow.id, url });
  }
};

export const sendMessage = async <T extends object, R = void>(message: T): Promise<R | null> => {
  if (!isChromeRuntime() || !chrome.runtime?.sendMessage) return null;
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve(response as R);
    });
  });
};

export const openOptionsPage = async (tab?: 'home' | 'bookmarks' | 'tags' | 'ranking') => {
  if (!isChromeRuntime() || !chrome.runtime?.openOptionsPage) {
    // Fallback: 手动打开 options 页面
    const url = chrome.runtime.getURL('src/pages/options/main.html');
    const finalUrl = tab ? `${url}?tab=${tab}` : url;
    await openBookmark(finalUrl);
    return;
  }
  const url = chrome.runtime.getURL('src/pages/options/main.html');
  const finalUrl = tab ? `${url}?tab=${tab}` : url;
  await openBookmark(finalUrl);
};


