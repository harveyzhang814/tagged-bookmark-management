chrome.runtime.onMessage.addListener(
  (msg: { type?: string }, _sender: unknown, sendResponse: (r: unknown) => void) => {
    if (msg.type === 'TOGGLE_GLOBAL_SEARCH') {
      sendResponse({ ok: true });
    }
    return true;
  }
);
