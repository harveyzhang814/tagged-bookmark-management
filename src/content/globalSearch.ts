import { overlayStyles } from './globalSearchOverlayStyles';

type MessagePayload = { type?: string };

interface BookmarkResult {
  bookmark: { id: string; title: string; url: string; tags: string[] };
}
interface TagResult {
  tag: { id: string; name: string; color: string; description?: string };
}
interface SearchResponse {
  error?: boolean;
  bookmarkResults?: BookmarkResult[];
  tagResults?: TagResult[];
}

type FlatItem =
  | { type: 'bookmark'; index: number; bookmarkId: string; title: string; url: string }
  | { type: 'tag'; index: number; tagId: string; name: string };

const DEBOUNCE_MS = 180;

function i18n(key: string): string {
  try {
    const s = chrome.i18n.getMessage(key);
    return s || key;
  } catch {
    return key;
  }
}

let overlayHost: HTMLDivElement | null = null;
let savedActiveElement: HTMLElement | null = null;
let escapeListener: ((e: KeyboardEvent) => void) | null = null;
let flatItems: FlatItem[] = [];
let highlightedIndex = -1;
let resultButtons: HTMLButtonElement[] = [];
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingClickTimer: ReturnType<typeof setTimeout> | null = null;

function applyTheme(host: HTMLDivElement): void {
  chrome.storage.local.get('tbm.theme', (data) => {
    const theme = data['tbm.theme'] as string | undefined;
    host.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
  });
}

function closeOverlay(): void {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = null;
  }
  if (pendingClickTimer) {
    clearTimeout(pendingClickTimer);
    pendingClickTimer = null;
  }
  flatItems = [];
  resultButtons = [];
  highlightedIndex = -1;
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

function sendMessage<T>(payload: object): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(payload, (response: T | undefined) => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve(response as T);
    });
  });
}

function renderResults(
  resultsPanel: HTMLDivElement,
  data: SearchResponse,
  tagById: Map<string, TagResult['tag']>
): void {
  resultsPanel.innerHTML = '';
  resultButtons = [];
  flatItems = [];
  highlightedIndex = -1;

  if (data.error || !data.bookmarkResults || !data.tagResults) {
    const empty = document.createElement('div');
    empty.className = 'empty-msg';
    empty.textContent = data.error ? i18n('globalSearchLoadFailed') : i18n('globalSearchNoResults');
    resultsPanel.appendChild(empty);
    return;
  }

  const { bookmarkResults, tagResults } = data;
  if (bookmarkResults.length === 0 && tagResults.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-msg';
    empty.textContent = i18n('globalSearchNoResults');
    resultsPanel.appendChild(empty);
    return;
  }

  let index = 0;

  if (bookmarkResults.length > 0) {
    const sectionTitle = document.createElement('div');
    sectionTitle.className = 'section-title';
    sectionTitle.textContent = i18n('bookmarkTitle');
    resultsPanel.appendChild(sectionTitle);
    const list = document.createElement('div');
    list.className = 'result-list';
    for (const { bookmark } of bookmarkResults) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'item';
      btn.setAttribute('role', 'option');
      btn.setAttribute('data-index', String(index));
      const main = document.createElement('div');
      main.className = 'item-main';
      const titleEl = document.createElement('div');
      titleEl.className = 'item-title';
      titleEl.textContent = bookmark.title;
      titleEl.title = bookmark.title;
      const metaEl = document.createElement('div');
      metaEl.className = 'item-meta';
      metaEl.textContent = bookmark.url;
      metaEl.title = bookmark.url;
      main.appendChild(titleEl);
      main.appendChild(metaEl);
      btn.appendChild(main);
      list.appendChild(btn);
      resultButtons.push(btn);
      flatItems.push({
        type: 'bookmark',
        index,
        bookmarkId: bookmark.id,
        title: bookmark.title,
        url: bookmark.url
      });
      index++;
    }
    resultsPanel.appendChild(list);
  }

  if (tagResults.length > 0) {
    const sectionTitle = document.createElement('div');
    sectionTitle.className = 'section-title';
    sectionTitle.textContent = i18n('tagTitle');
    resultsPanel.appendChild(sectionTitle);
    const list = document.createElement('div');
    list.className = 'result-list';
    for (const { tag } of tagResults) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'item';
      btn.setAttribute('role', 'option');
      btn.setAttribute('data-index', String(index));
      const dot = document.createElement('span');
      dot.className = 'item-dot';
      dot.style.backgroundColor = tag.color;
      const main = document.createElement('div');
      main.className = 'item-main';
      const titleEl = document.createElement('div');
      titleEl.className = 'item-title';
      titleEl.textContent = tag.name;
      titleEl.title = tag.name;
      const metaEl = document.createElement('div');
      metaEl.className = 'item-meta';
      metaEl.textContent = tag.description ?? '';
      metaEl.title = tag.description ?? '';
      main.appendChild(titleEl);
      main.appendChild(metaEl);
      btn.appendChild(dot);
      btn.appendChild(main);
      list.appendChild(btn);
      resultButtons.push(btn);
      flatItems.push({ type: 'tag', index, tagId: tag.id, name: tag.name });
      index++;
    }
    resultsPanel.appendChild(list);
  }
}

function runNavigate(item: FlatItem): void {
  if (item.type === 'bookmark') {
    void sendMessage({ type: 'NAVIGATE_BOOKMARKS', query: item.title }).then(() => closeOverlay());
  } else {
    void sendMessage({ type: 'NAVIGATE_BOOKMARKS', tagId: item.tagId }).then(() => closeOverlay());
  }
}

function runOpen(item: FlatItem): void {
  if (item.type === 'bookmark') {
    void sendMessage({
      type: 'OPEN_BOOKMARK',
      url: item.url,
      bookmarkId: item.bookmarkId
    }).then(() => closeOverlay());
  } else {
    void sendMessage({ type: 'OPEN_TAG_BOOKMARKS', tagId: item.tagId }).then(() => closeOverlay());
  }
}

function setHighlight(idx: number): void {
  resultButtons.forEach((el, i) => {
    if (i === idx) {
      el.classList.add('highlight');
      el.setAttribute('aria-selected', 'true');
    } else {
      el.classList.remove('highlight');
      el.setAttribute('aria-selected', 'false');
    }
  });
  highlightedIndex = idx;
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
  card.setAttribute('aria-label', i18n('globalSearchAriaLabel'));

  const searchWrap = document.createElement('div');
  searchWrap.className = 'search-wrap';
  const input = document.createElement('input');
  input.type = 'text';
  input.autocomplete = 'off';
  input.setAttribute('aria-label', 'Search');
  input.placeholder = i18n('globalSearchPlaceholder');
  searchWrap.appendChild(input);
  card.appendChild(searchWrap);

  const resultsPanel = document.createElement('div');
  resultsPanel.className = 'results-panel';
  resultsPanel.setAttribute('role', 'listbox');
  resultsPanel.setAttribute('aria-label', i18n('searchResultsAriaLabel'));
  card.appendChild(resultsPanel);

  shadow.appendChild(card);

  input.addEventListener('input', () => {
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    const query = input.value.trim();
    if (!query) {
      renderResults(resultsPanel, { bookmarkResults: [], tagResults: [] }, new Map());
      return;
    }
    searchDebounceTimer = setTimeout(() => {
      searchDebounceTimer = null;
      void sendMessage<SearchResponse>({ type: 'GLOBAL_SEARCH_QUERY', query })
        .then((res) => {
          const tagById = new Map<string, TagResult['tag']>();
          (res.tagResults ?? []).forEach((r) => tagById.set(r.tag.id, r.tag));
          renderResults(resultsPanel, res, tagById);
        })
        .catch(() => {
          renderResults(resultsPanel, { error: true }, new Map());
        });
    }, DEBOUNCE_MS);
  });

  resultsPanel.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest?.('.item') as HTMLButtonElement | null;
    if (!target) return;
    const idx = parseInt(target.getAttribute('data-index') ?? '-1', 10);
    if (idx < 0 || idx >= flatItems.length) return;
    if (pendingClickTimer) clearTimeout(pendingClickTimer);
    pendingClickTimer = setTimeout(() => {
      pendingClickTimer = null;
      runNavigate(flatItems[idx]);
    }, 250);
  });

  resultsPanel.addEventListener('dblclick', (e) => {
    const target = (e.target as HTMLElement).closest?.('.item') as HTMLButtonElement | null;
    if (!target) return;
    e.preventDefault();
    if (pendingClickTimer) {
      clearTimeout(pendingClickTimer);
      pendingClickTimer = null;
    }
    const idx = parseInt(target.getAttribute('data-index') ?? '-1', 10);
    if (idx < 0 || idx >= flatItems.length) return;
    runOpen(flatItems[idx]);
  });

  escapeListener = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeOverlay();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (flatItems.length === 0) return;
      const next = highlightedIndex < flatItems.length - 1 ? highlightedIndex + 1 : 0;
      setHighlight(next);
      resultButtons[next]?.scrollIntoView({ block: 'nearest' });
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (flatItems.length === 0) return;
      const next = highlightedIndex <= 0 ? flatItems.length - 1 : highlightedIndex - 1;
      setHighlight(next);
      resultButtons[next]?.scrollIntoView({ block: 'nearest' });
      return;
    }
    if (e.key === 'Enter' && e.target !== input) {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < flatItems.length) {
        runNavigate(flatItems[highlightedIndex]);
      }
    }
  };
  document.addEventListener('keydown', escapeListener);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' && flatItems.length > 0) {
      e.preventDefault();
      setHighlight(0);
      resultButtons[0]?.scrollIntoView({ block: 'nearest' });
    }
  });

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
