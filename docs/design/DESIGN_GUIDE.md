# Design Guide (Tagged Bookmark Management)

本项目的 UI 目标是：工具型、高信息密度、可预测交互、轻量卡片化，并在浅色/暗色（`data-theme='dark'`）下保持一致体验。

本指南用于统一后续页面与组件的视觉与交互实现。

## 1. 设计原则

- 信息密度高但不压迫：通过分组、层级、留白解决复杂度；避免大面积强对比色块。
- 交互可预测：所有可点击/可拖拽/可编辑元素必须具备一致的 `hover/active/focus/disabled`。
- Token 优先：颜色/阴影/圆角/滚动条/焦点环/控件高度优先使用全局 CSS 变量；禁止散落硬编码值。
- 一致性优先于“更好看”：除非是明确的产品方向变更，否则不要引入新的视觉语言。

## 2. 全局 Tokens（必须遵守）

来源：`src/styles/global.css`

### 2.1 颜色（语义化优先）

- 背景：`--bg-main` / `--bg-panel` / `--bg-card` / `--bg-secondary`
- 文本：`--text-main` / `--text-muted`
- 边框：`--border-muted` / `--border-color`
- 强调：`--accent` / `--accent-hover` / `--accent-2` / `--accent-2-hover`
- 反馈：
  - 成功：`--success`（基础）、`--success-strong`（前景色）、`--success-surface`（浅背景）、`--success-border`
  - 错误：`--danger`（基础）、`--danger-strong`（前景色）、`--danger-surface`（浅背景）、`--danger-border`
- Button hover：`--button-hover-bg` / `--button-primary-hover-bg` / `--button-danger-hover-bg`

禁止：在组件内写 `#dc2626` / `#10b981` / `rgba(91, 155, 213, ...)` 作为长期方案；必须收敛到 token。

### 2.2 形状与阴影

- 圆角：`--radius-sm`（控件） / `--radius-md`（卡片/面板/弹窗）
- 阴影：`--shadow-sm` / `--shadow-md` / `--shadow-lg`

### 2.3 焦点环（Focus Ring）

- 标准：`box-shadow: var(--focus-ring);`
- 大号：`box-shadow: var(--focus-ring-lg);`

说明：不要在各组件里再写 `rgba(...)` 分支；暗色差异由 token 负责。

### 2.4 控件尺寸

- 标准高度：`--control-h`（常见按钮/下拉触发器）
- 大号高度：`--control-h-lg`（少数需要更强触达的场景）

### 2.5 滚动条

- 主滚动区：`--scrollbar-w`
- 小列表/下拉：`--scrollbar-w-sm`

### 2.6 列表区块间隔

- 同一页内多个列表区块之间的垂直间隔（例如：列表页的 pinned 与 unpinned 之间、首页的「置顶工作区 / 置顶标签 / 置顶书签」各区块之间）统一使用：`--list-section-gap`。
- 该 token 与列表页 virtual-divider 的间距一致，保证首页与书签/标签列表页的视觉节奏统一。

## 3. 页面布局规范

### 3.1 Options（设置/管理界面）

- 保持现有结构：左侧导航（48px）+ 内容区。
- 内容滚动应发生在“内容区域容器”，避免整个页面滚动造成顶栏/侧栏跳动。
- 页面骨架建议：
  - `toolbar`（固定/粘性）
  - `content-wrapper`（主内容 + 可选 sidebar）
  - `content`（仅这里滚动）

### 3.2 Popup

- Popup 尺寸固定，内容区内部滚动。
- Popup 与 Options 使用同一套 token（不要额外硬编码白底/蓝环）。

## 4. 组件规范

### 4.1 Button

- 文本按钮优先使用：`PixelButton`
- 图标按钮优先使用：`IconButton`（或 `ThemeToggle` 这类专用组件）
- 同类按钮不要在页面里“各写一套”样式；如需要新样式，先考虑：
  - 为现有组件新增 `variant/size`
  - 或新增一个可复用的小型组件（例如统一的 `MoreButton`）

交互（按钮/可点击卡片统一）：

- `hover`：描边 `--accent` + 阴影从 `sm` 到 `md` + 轻微上浮（-1px/-2px）
- `active`：回落或轻缩放（0.96–0.98），避免布局抖动
- `focus`：必须可见（`--focus-ring`）
- `disabled`：降低 opacity + `not-allowed`

### 4.2 Input / Select / Textarea

- `:focus` 必须使用 `var(--focus-ring)`，不要写 rgba。
- placeholder 使用 `--text-muted` 并降低 opacity。

### 4.3 Card / Panel

- 卡片层级：
  - `pixel-panel`：模块容器
  - `pixel-card`：列表项/内容卡片
- hover 行为与按钮一致（描边+阴影+上浮）。

### 4.4 Modal

- backdrop：固定定位 + 0.5 遮罩；移动端可全屏。
- 内容：`--bg-card` + `--shadow-lg` + `--radius-md` + 头/体/底 padding 统一。
- 成功/错误状态：使用 `--success-*` / `--danger-*` token。

**操作性弹窗一致性（导入/导出/同步/删除/保存等）：**

- **进行中**：展示加载动画（spinner），并禁用关闭与重复触发（含 Esc、遮罩点击、关闭按钮）。
- **成功**：展示成功提示（如打勾 + 文案），短暂停留后自动关闭或回到可继续操作的状态。
- **危险操作确认弹窗**：同上进行中/成功反馈；文案须明确不可逆风险。
- 统一样式：复用现有弹窗结构（backdrop + header + content + actions）与全局 token（颜色/圆角/阴影/焦点环），避免引入新视觉语言。

### 4.5 侧边栏（Sidebar）

适用于书签页的标签列表/工作区列表侧栏与编辑类书签/标签/工作区侧栏，保持视觉与 token 一致。

- **容器**：宽度 300px，背景 `--bg-panel`，左边框 `1px solid var(--border-muted)`，圆角 `var(--radius-md) 0 0 var(--radius-md)`，滚动条使用 `--scrollbar-w`。
- **主信息区（仅编辑类）**：可编辑字段（标题、描述、颜色等）使用**无边框控件**——默认 `border: 1px solid transparent`，hover/focus 时 `border-color: var(--accent)`；**仅主信息区适用，列表 card 不适用无边框样式**。
- **列表区**：列表项（card）使用**有边框**样式：默认 `border: 1px solid var(--border-muted)`，hover 时 `border-color: var(--accent)`，圆角 `var(--radius-sm)`，hover 可配合 `box-shadow: var(--shadow-sm)`、轻微位移。
- **标题**：若为不可编辑字段，直接展示文案或控件，不套用可编辑区「点击变输入框」交互。
- **搜索 / 工具栏**：区块 padding 统一为 12px 16px，与主信息区/编辑侧栏 toolbar 一致；控件高度与字号可依密度使用 `--control-h` 或略小（如 26px）。
- **分页 / 底栏**：padding 12px 16px，border-top 使用 `--border-muted`。

## 5. 排版与密度

- 默认正文：13px
- 辅助说明：12px（`--text-muted`）
- section 标题：16px/600（列表区块）或 `.section-title`（设置页模块标题）

避免：同一页面同时出现多套标题体系。

## 6. 暗色模式（Theme）

- 主题切换由 `data-theme='dark'` 控制；不要在组件内部写大量 dark 分支。
- 需要差异时，优先在 `global.css` 用 token 解决。

## 7. CSS 与命名

- CSS 以组件/页面分文件维护，命名遵循现有 `block__element` 风格。
- 避免全局选择器污染；优先 `.component-name__part`。
- 禁止在页面内复制粘贴一套新的按钮/输入框样式；应复用组件或抽公共样式。

## 8. 列表与网格设计

适用于 Options 管理页内的卡片列表/书签列表/标签列表等大数据量场景（上百～上千条）。

### 8.1 渲染策略（性能优先）

- 默认使用虚拟化列表/虚拟化网格，避免一次性渲染全部 item。
- 推荐实现：**按行虚拟化**（row virtualization）——先根据容器宽度计算列数 `columnCount`，将数据按列数分组为 `rows`，虚拟化组件渲染 rows，行内用 CSS grid 排列卡片。
- 分组标题/分隔行（如 pinned/normal）优先作为虚拟项插入，保持可滚动一致性。

### 8.2 滚动容器（布局稳定）

- 滚动应发生在页面「内容区域容器」（如 `.bookmarks-content` / `.tags-content`），而非整个页面，避免 sticky 顶栏/侧栏抖动。
- 虚拟化组件应接管该滚动容器（custom scroll parent），保持滚动条与行为一致。

### 8.3 回到顶部（可用性）

- 主滚动区 `scrollTop` 超过阈值时显示悬浮「回到顶部」按钮。
- 点击后优先调用虚拟化组件 API（如 `scrollToIndex({ index: 0, behavior: 'smooth' })`），并对滚动容器 `scrollTo({ top: 0 })` 做兜底。
- 悬浮按钮需预留底部空间（如 `padding-bottom`），避免遮挡内容与分页/操作区。

### 8.4 响应式布局：列数与卡片宽度

**默认方案（推荐）：断点范围 + 卡片宽度约束**

- 列数基于容器宽度：`<720px` 为 1 列，`720–959px` 为 2 列，`960–1279px` 为 3–4 列（自动选择），`≥1280px` 为 4–5 列（自动选择）。
- 用最小卡片宽度与目标最大可读宽度控制列数，避免卡片过宽导致行长过长。
- 超大尺寸下不限制卡片最大宽度（`max-width: none`，卡片 `justify-self: stretch`），避免居中 + max-width 造成视觉间距变大。

**可选方案（opt-in）：固定卡片宽度推导列数**

- 适用于标签等信息密度较低、希望列数完全由卡片宽度决定的网格。
- 规则：给定 `cardWidth` 与 `gap`，`cols = max(1, floor((containerWidth + gap) / (cardWidth + gap)))`；行内 grid 使用 `grid-template-columns: repeat(var(--cols), var(--cardWidth))`，`justify-content: start`。仅当需求明确要求「固定卡片宽度推导列数」时采用。

### 8.5 卡片高度规则化（虚拟化友好）

- 卡片高度尽量稳定（标题/URL/标签 clamp、meta 区贴底等），减少滚动跳动与测量误差。
- 若移除缩略图，需同步移除缩略图区与占位样式，避免大面积空白。

## 9. 交付检查清单（PR/提交前）

- 新增 UI 是否只使用 token（`src/styles/global.css`）而非硬编码颜色/阴影/焦点环？
- 是否同时覆盖 light/dark？
- 所有可交互元素是否具备 hover/active/focus/disabled？
- 滚动是否发生在正确容器（不会导致顶栏/侧栏抖动）？
- 是否复用了现有组件（PixelButton/IconButton/SearchInput/Modal）？
