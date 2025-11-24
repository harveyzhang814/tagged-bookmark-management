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

export const openOptionsPage = async (tab?: 'home' | 'bookmarks' | 'tags') => {
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


