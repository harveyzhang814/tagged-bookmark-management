import { overlayStyles } from './globalSearchOverlayStyles';

type MessagePayload = { type?: string };

let overlayHost: HTMLDivElement | null = null;
let savedActiveElement: HTMLElement | null = null;
let escapeListener: ((e: KeyboardEvent) => void) | null = null;

function applyTheme(host: HTMLDivElement): void {
  chrome.storage.local.get('tbm.theme', (data) => {
    const theme = data['tbm.theme'] as string | undefined;
    host.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
  });
}

function closeOverlay(): void {
  if (escapeListener) {
    document.removeEventListener('keydown', escapeListener);
    escapeListener = null;
  }
  if (!overlayHost?.parentNode) return;
  overlayHost.parentNode.removeChild(overlayHost);
  overlayHost = null;
  if (savedActiveElement && typeof savedActiveElement.focus === 'function') {
    savedActiveElement.focus();
  }
  savedActiveElement = null;
}

function createOverlay(): HTMLDivElement {
  const host = document.createElement('div');
  host.id = 'tbm-global-search-overlay';
  const shadow = host.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = overlayStyles;
  shadow.appendChild(style);

  const backdrop = document.createElement('div');
  backdrop.className = 'backdrop';
  backdrop.setAttribute('aria-hidden', 'true');
  backdrop.addEventListener('click', closeOverlay);
  shadow.appendChild(backdrop);

  const card = document.createElement('div');
  card.className = 'card';
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-label', 'Global search');

  const searchWrap = document.createElement('div');
  searchWrap.className = 'search-wrap';
  const input = document.createElement('input');
  input.type = 'text';
  input.autocomplete = 'off';
  input.setAttribute('aria-label', 'Search');
  input.placeholder = 'Search bookmarks and tags…';
  searchWrap.appendChild(input);
  card.appendChild(searchWrap);

  const resultsPanel = document.createElement('div');
  resultsPanel.className = 'results-panel';
  resultsPanel.setAttribute('role', 'listbox');
  resultsPanel.setAttribute('aria-label', 'Search results');
  card.appendChild(resultsPanel);

  shadow.appendChild(card);

  escapeListener = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeOverlay();
    }
  };
  document.addEventListener('keydown', escapeListener);

  input.addEventListener('blur', () => {
    savedActiveElement = null;
  });

  applyTheme(host);
  setTimeout(() => input.focus(), 0);

  return host;
}

function toggleOverlay(): void {
  if (overlayHost?.parentNode) {
    closeOverlay();
    return;
  }
  savedActiveElement = document.activeElement as HTMLElement | null;
  overlayHost = createOverlay();
  document.body.appendChild(overlayHost);
}

chrome.runtime.onMessage.addListener(
  (msg: MessagePayload, _sender: unknown, sendResponse: (r: unknown) => void) => {
    if (msg.type === 'TOGGLE_GLOBAL_SEARCH') {
      toggleOverlay();
      sendResponse({ ok: true });
    }
    return true;
  }
);
