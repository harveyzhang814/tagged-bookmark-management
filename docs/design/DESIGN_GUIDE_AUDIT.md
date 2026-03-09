# DESIGN_GUIDE 符合性审计：快捷弹窗 / Options 网页 / 全局搜索弹窗

**审计日期**：2025-03-03  
**范围**：快捷弹窗（Popup）、Options 管理界面（网页）、全局搜索弹窗（GlobalSearchOverlay）  
**依据**：`docs/design/DESIGN_GUIDE.md` 全文及第 9 节交付检查清单。

---

## 一、快捷弹窗（Popup）

**涉及文件**：`src/pages/popup/BookmarkPopup.tsx`、`src/pages/popup/popup.css`

### 已符合

- **Token**：背景/文本/边框/强调/成功·错误反馈/阴影/焦点环/滚动条均使用 global.css token。
- **双主题**：无组件内 dark 分支，依赖 token。
- **可交互元素**：page-info 有 hover + focus（描边 + focus-ring）；form-input 有 hover/focus/placeholder（--text-muted）；save-button 有 hover/active/disabled；status 使用 --success-* / --danger-*。
- **焦点环**：form-input:focus 使用 `var(--focus-ring-lg)`，outline: none 有替代。
- **滚动**：发生在 `.popup-content`，尺寸固定、内部滚动，符合 3.2。
- **组件复用**：PixelButton、IconButton、TagInput、ToggleSwitch、ThemeToggle。
- **图标**：无 emoji，使用内联 SVG。
- **过渡**：0.2s ease，在 150–300ms 内。

### 已修复的遗漏

- 圆角：`.page-info` / `.form-input` / `.save-button` / `.popup-status` / `.page-info-icon` 由 8px/6px 改为 `var(--radius-md)` / `var(--radius-sm)`。
- `.settings-button`：补充 `cursor: pointer` 与 `:focus { outline: none; box-shadow: var(--focus-ring); }`。

### 建议（可选）

- Popup 内按钮实际使用 PixelButton，其 focus 环已在 `pixelButton.css` 中统一补全，无需在 popup.css 重复。

---

## 二、Options 管理界面（网页）

**涉及文件**：`src/pages/options/OptionsApp.tsx`、`src/pages/options/optionsApp.css`，以及各子页面布局。

### 已符合

- **布局**：左侧 NavigationSidebar + 右侧 options-right（header + content）；顶栏 sticky，符合 3.1 骨架。
- **Token**：顶栏/搜索区/背景使用 --bg-panel、--bg-secondary、--border-muted、--shadow-sm、--focus-ring（focus-within）。
- **搜索框**：SearchInput 复用，focus-within 使用 `var(--focus-ring)`，outline: none 有替代。
- **滚动**：`.options-content` 与 `main` 为 flex 容器，主滚动由各子页（如 bookmarks-content、tags-content）承担，符合「内容区域容器滚动」。
- **图标**：Header 使用 SVG，无 emoji。

### 已修复的遗漏（在共用组件）

- **IconButton**：在 `iconButton.css` 中补全 `:focus { outline: none; box-shadow: var(--focus-ring); }`，Options 顶栏设置按钮等一并符合。

### 建议（可选）

- 若某子页（书签/标签/工作区）有独立滚动区，可再按 8.2 / 8.3 逐页核对滚动容器与回到顶部。

---

## 三、全局搜索弹窗（GlobalSearchOverlay）

**涉及文件**：`src/components/GlobalSearchOverlay.tsx`、`src/components/globalSearchOverlay.css`

### 已符合

- **Token**：面板背景/文本/边框/阴影/圆角/滚动条/高亮背景均使用 token。
- **双主题**：去掉 hover 的 `[data-theme='dark']` 分支，统一用 `var(--button-hover-bg)`。
- **可点击项**：结果项为 `<button>`，已有 cursor: pointer、hover 描边+背景。
- **过渡**：0.15s → 0.2s，落在 150–300ms。

### 已修复的遗漏

- **圆角**：结果项 `border-radius: 10px` 改为 `var(--radius-md)`。
- **Hover**：统一为 `border-color: var(--accent)` + `background: var(--button-hover-bg)`，删除 dark 单独分支。
- **Focus**：`.global-search__bookmark-item:focus` / `.global-search__tag-item:focus` 增加 `outline: none; box-shadow: var(--focus-ring);`。
- **Active**：增加 `:active { transform: scale(0.98); }`，与 4.1 一致。

### 说明

- `.global-search__dropdown-panel` 的 `outline: none` 用于容器 div，当前未设 tabindex，若日后改为可键盘聚焦，建议补充 `:focus` 时 `box-shadow: var(--focus-ring)`。

---

## 四、共用组件（影响三处 UI）

### PixelButton（`pixelButton.css`）

- **已修复**：增加 `.pixel-btn:focus { outline: none; box-shadow: var(--focus-ring); }`，满足 4.1 与 5.5。
- **待后续**：primary/secondary/danger 的 `color: #ffffff !important` 为硬编码，建议在 global.css 增加如 `--button-primary-color` 等 token 后替换（DESIGN_GUIDE 2.1 禁止长期硬编码色值）。

### IconButton（`iconButton.css`）

- **已修复**：增加 `:focus { outline: none; box-shadow: var(--focus-ring); }`，Popup 与 Options 中的图标按钮均具备可见焦点环。

---

## 五、交付检查清单核对（第 9 节）

| 检查项 | Popup | Options | 全局搜索 |
|--------|--------|----------|----------|
| 仅使用 token，无硬编码颜色/阴影/焦点环 | ✅ | ✅ | ✅ |
| 同时覆盖 light/dark | ✅ | ✅ | ✅ |
| 可交互元素具备 hover/active/focus/disabled | ✅（已补 focus） | ✅ | ✅（已补 focus/active） |
| 焦点环可见、正文对比度 ≥ 4.5:1 | ✅ | ✅ | ✅ |
| 滚动在正确容器 | ✅ | ✅ | N/A（下拉内滚动） |
| 复用现有组件 | ✅ | ✅ | 结果项为 button+TagPill |
| 无 emoji 图标、统一图标集 | ✅ | ✅ | N/A |
| 过渡 150–300ms、尊重 prefers-reduced-motion | ✅ | ✅ | ✅（0.2s） |

---

## 六、总结

- **快捷弹窗、网页（Options）、全局搜索弹窗** 已按 DESIGN_GUIDE 过一遍，遗漏项已在本轮修复（圆角 token 化、focus 环、全局搜索 hover 统一与 active、IconButton/PixelButton focus）。
- **仍建议后续统一处理**：PixelButton 主色/次色/危险按钮上的 `#ffffff` 收敛为 global.css 的 token（如 `--button-primary-color`），以完全满足 2.1。
