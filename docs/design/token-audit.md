# Token 硬编码审计清单

**生成日期**：2025-03-03  
**目的**：将组件/页面 CSS 中的硬编码色值、阴影、焦点环逐步替换为 `src/styles/global.css` 的 token，便于按模块落地。

**说明**：`global.css` 内 `:root` / `[data-theme='dark']` 下的变量定义为合法来源，不列入替换；本表仅列需替换或评估的组件/页面文件。

**实施记录**：2025-03-03 已按 `docs/plans/2025-03-03-design-system-implementation.md` 完成 Task 1–10；下表所列项已替换为 token（遮罩、hover、焦点、阴影、边框、danger-surface 等），仅 colorPicker 的 `text-shadow`、customColorPicker 的色相环渐变等保留为合理例外。

---

## 替换建议约定

| 用途 | 建议替换为 |
|------|------------|
| 遮罩层 0.5 黑 | 可新增 `--modal-backdrop: rgba(0,0,0,0.5)` 于 global.css，或暂时保留并统一注释 |
| 浅色 hover 背景 | `--button-hover-bg`（浅色） / dark 下已有 token |
| 焦点/描边 accent | `--focus-ring` 或 `--accent` |
| 阴影 | `--shadow-sm` / `--shadow-md` / `--shadow-lg` |
| 错误态背景 | `--danger-surface` |

---

## 按文件列出

### addBookmarkToTagModal.css

| 行号 | 当前写法 | 建议 |
|------|----------|------|
| 7 | `background: rgba(0, 0, 0, 0.5)` | 遮罩 → 使用统一 backdrop token（见上） |
| 235 | `background: rgba(91, 155, 213, 0.14)` | → `var(--button-primary-hover-bg)` 或新 token |
| 239 | `background: rgba(91, 155, 213, 0.22)` | 同上 |

### addBookmarkToWorkstationModal.css

| 行号 | 当前写法 | 建议 |
|------|----------|------|
| 7 | `background: rgba(0, 0, 0, 0.5)` | 遮罩 → 统一 backdrop |
| 235 | `background: rgba(91, 155, 213, 0.14)` | → `var(--button-primary-hover-bg)` 或新 token |
| 239 | `background: rgba(91, 155, 213, 0.22)` | 同上 |

### bookmarkCard.css

| 行号 | 当前写法 | 建议 |
|------|----------|------|
| 160 | `box-shadow: 0 0 0 2px rgba(91, 155, 213, 0.2), var(--shadow-md)` | 焦点/描边 → 使用 `var(--focus-ring)` 或 `var(--accent)` + `var(--shadow-md)` |
| 165 | `box-shadow: 0 0 0 2px rgba(100, 181, 246, 0.3), var(--shadow-md)` | 同上，暗色可交由 token 覆盖 |

### bookmarkEditModal.css

| 行号 | 当前写法 | 建议 |
|------|----------|------|
| 7 | `background: rgba(0, 0, 0, 0.5)` | 遮罩 → 统一 backdrop |

### chromeSyncModal.css

| 行号 | 当前写法 | 建议 |
|------|----------|------|
| 7 | `background: rgba(0, 0, 0, 0.5)` | 遮罩 → 统一 backdrop |
| 302 | `background: rgba(0, 0, 0, 0.04)` | → `var(--button-hover-bg)`（浅色） |
| 308 | `background: rgba(255, 255, 255, 0.08)` | → `var(--button-hover-bg)`（暗色） |

### colorPicker.css

| 行号 | 当前写法 | 建议 |
|------|----------|------|
| 91 | `text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5)` | 可选：新增 `--input-shadow` 或保留（色板控件装饰） |
| 136 | `box-shadow: 0 0 0 1px rgba(...), 0 2px 4px rgba(...)` | 与 global 中 toggle/控件阴影对齐或抽 token |
| 165 | `border: 1px solid rgba(0, 0, 0, 0.3)` | → `var(--border-color)` / `var(--border-muted)` |
| 168 | `box-shadow: 0 0 2px rgba(0, 0, 0, 0.3)` | → `var(--shadow-sm)` |
| 183 | `box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1)` | → `var(--shadow-sm)` |

### confirmDeleteAllDataModal.css

| 行号 | 当前写法 | 建议 |
|------|----------|------|
| 4 | `background: rgba(0, 0, 0, 0.5)` | 遮罩 → 统一 backdrop |

### customColorPicker.css

| 行号 | 当前写法 | 建议 |
|------|----------|------|
| 30 | `box-shadow: ... rgba(0,0,0,0.3), ...` | → `var(--shadow-sm)` 等 |
| 50-56 | `#ff0000`, `#ffff00`, … 色相环渐变 | 色相环语义色，可保留或抽为 `--color-picker-hue-*` |
| 66 | `border: 1px solid rgba(0, 0, 0, 0.3)` | → `var(--border-color)` |
| 70 | `box-shadow: 0 0 2px rgba(0, 0, 0, 0.3)` | → `var(--shadow-sm)` |

### horizontalScrollList.css

| 行号 | 当前写法 | 建议 |
|------|----------|------|
| 42 | `background: rgba(0, 0, 0, 0.04)` | → `var(--button-hover-bg)`（浅色） |
| 48 | `background: rgba(255, 255, 255, 0.08)` | → `var(--button-hover-bg)`（暗色） |

### hotTagCard.css

| 行号 | 当前写法 | 建议 |
|------|----------|------|
| 35 | `box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05)` | 极浅描边 → 可统一为 `var(--border-muted)` 或保留并注释 |

### importExportModal.css

| 行号 | 当前写法 | 建议 |
|------|----------|------|
| 7 | `background: rgba(0, 0, 0, 0.5)` | 遮罩 → 统一 backdrop |

### optionsApp.css

| 行号 | 当前写法 | 建议 |
|------|----------|------|
| 26 | `box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08)` | → `var(--shadow-sm)` |
| 91 | `box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3)` | → `var(--shadow-md)`（暗色由 theme 覆盖） |

### popup.css

| 行号 | 当前写法 | 建议 |
|------|----------|------|
| 77 | `box-shadow: 0 0 0 3px rgba(91, 155, 213, 0.05)` | → `var(--focus-ring)` 或与 token 对齐 |
| 87 | `background: rgba(91, 155, 213, 0.08)` | → `var(--button-primary-hover-bg)` |
| 264 | `box-shadow: 0 4px 12px rgba(91, 155, 213, 0.3)` | → 可用 `var(--shadow-md)` + 需时再增 accent 阴影 token |

### rankingList.css

| 行号 | 当前写法 | 建议 |
|------|----------|------|
| 43 | `background: rgba(0, 0, 0, 0.04)` | → `var(--button-hover-bg)`（浅色） |
| 49 | `background: rgba(255, 255, 255, 0.08)` | → `var(--button-hover-bg)`（暗色） |

### tagEditModal.css

| 行号 | 当前写法 | 建议 |
|------|----------|------|
| 7 | `background: rgba(0, 0, 0, 0.5)` | 遮罩 → 统一 backdrop |

### tagFilterDropdown.css

| 行号 | 当前写法 | 建议 |
|------|----------|------|
| 198 | `box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05)` | → 极浅描边可统一或保留并注释 |

### tagGraphOverlay.css

| 行号 | 当前写法 | 建议 |
|------|----------|------|
| 6 | `background: rgba(0, 0, 0, 0.4)` | 遮罩 → 可新增 `--overlay-backdrop` 或与 modal 统一 |
| 14 | `background: rgba(0, 0, 0, 0.6)` | 同上 |

### tagInput.css

| 行号 | 当前写法 | 建议 |
|------|----------|------|
| 45 | `background: rgba(0, 0, 0, 0.05)` | → `var(--button-hover-bg)` 或 input 态 token |
| 65 | `background: rgba(229, 115, 115, 0.15)` | → `var(--danger-surface)` |

### tagSidebar.css

| 行号 | 当前写法 | 建议 |
|------|----------|------|
| 86 | `box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05)` | → 极浅描边可统一或保留 |

### workstationEditModal.css

| 行号 | 当前写法 | 建议 |
|------|----------|------|
| 7 | `background: rgba(0, 0, 0, 0.5)` | 遮罩 → 统一 backdrop |

### workstationInput.css

| 行号 | 当前写法 | 建议 |
|------|----------|------|
| 69 | `background: rgba(0, 0, 0, 0.05)` | → `var(--button-hover-bg)` 或 input 态 token |
| 89 | `background: rgba(229, 115, 115, 0.15)` | → `var(--danger-surface)` |

---

## 建议的 global.css 新增（可选）

- `--modal-backdrop: rgba(0, 0, 0, 0.5)`，暗色下可覆盖为 `rgba(0,0,0,0.6)`，供所有 Modal 遮罩使用。
- 若多处使用「极浅描边」：可增加 `--border-subtle` 或沿用 `--border-muted`。

落地时按「颜色/排版 → 组件 → 页面」或按文件在 PR 中逐项替换，并跑 DESIGN_GUIDE 第 9 节交付检查清单。
