/**
 * Minimal tokens + overlay styles for content script Shadow DOM.
 * Sourced from src/styles/global.css and src/components/globalSearchOverlay.css.
 */
export const overlayStyles = `
:host {
  --radius-md: 8px;
  --scrollbar-w: 8px;
  --bg-main: #fafafa;
  --bg-panel: #ffffff;
  --bg-card: #ffffff;
  --border-muted: #e8e8e8;
  --border-color: #e0e0e0;
  --text-main: #2c2c2c;
  --text-muted: #6b6b6b;
  --accent: #5b9bd5;
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
  --button-hover-bg: rgba(0, 0, 0, 0.04);
  --button-primary-hover-bg: rgba(91, 155, 213, 0.1);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  all: initial;
  font: inherit;
  box-sizing: border-box;
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
}
:host([data-theme="dark"]) {
  --bg-main: #121212;
  --bg-panel: #1e1e1e;
  --bg-card: #252525;
  --border-muted: #2d2d2d;
  --border-color: #3a3a3a;
  --text-main: #e0e0e0;
  --text-muted: #9e9e9e;
  --accent: #1976d2;
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
  --button-hover-bg: rgba(255, 255, 255, 0.08);
  --button-primary-hover-bg: rgba(25, 118, 210, 0.2);
}

.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  cursor: pointer;
}
.card {
  position: relative;
  width: min(520px, 92vw);
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-main);
  color: var(--text-main);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}
.search-wrap {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-muted);
}
.search-wrap input {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  font-size: 14px;
  border: 1px solid var(--border-muted);
  border-radius: 6px;
  background: var(--bg-panel);
  color: var(--text-main);
  outline: none;
}
.search-wrap input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--button-primary-hover-bg);
}
.search-wrap input::placeholder {
  color: var(--text-muted);
}
.results-panel {
  overflow-x: hidden;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.results-panel::-webkit-scrollbar {
  width: var(--scrollbar-w);
}
.results-panel::-webkit-scrollbar-thumb {
  background: var(--border-muted);
  border-radius: 4px;
}
.section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.02em;
}
.result-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.item {
  width: 100%;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--border-muted);
  border-radius: 10px;
  background: var(--bg-card);
  color: var(--text-main);
  cursor: pointer;
  transition: all 0.15s ease;
  font: inherit;
}
.item:hover, .item.highlight {
  border-color: var(--accent);
}
:host([data-theme="dark"]) .item:hover,
:host([data-theme="dark"]) .item.highlight {
  background: var(--button-hover-bg);
}
.item-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.item-title {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.item-meta {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.item-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  flex-shrink: 0;
  border: 1px solid var(--border-muted);
}
.empty-msg {
  padding: 10px 12px;
  border: 1px dashed var(--border-muted);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  font-size: 12px;
  background: var(--bg-panel);
}
.highlight {
  outline: none;
}
`;
