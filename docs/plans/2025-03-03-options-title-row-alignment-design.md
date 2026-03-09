# 设计：Options 品牌 logo 与各页标题行对齐

**日期**：2025-03-03  
**状态**：已确认

## 1. 目标与范围

- **目标**：左侧 NavigationSidebar 的**品牌 logo 所在行**与各 tab 页面**第一行（标题行）**垂直对齐；第一行仅放页面主标题（首页加副标题）；主标题统一字体/字号、颜色保持品牌色。
- **范围**：Options 页布局、NavigationSidebar、以及所有 tab 页（首页、书签、标签、排行、工作区、设置）的「第一行」结构；不涉及 Popup。

## 2. 方案选择

- 采用**统一 token + 每页必有标题行**：在 `.options-shell` 定义 `--options-title-row-h`（56px），左栏 brand 与内容区标题行均使用该高度；内容区去掉 padding-top，每页顶部为标题行容器（min-height 同 token），内放主标题。

## 3. 布局与 Token

- **Token**：在 `.options-shell` 上定义 `--options-title-row-h: 56px`。左栏 brand 与内容区「标题行」均使用该高度（min-height）。
- **左侧栏**：`.navigation-sidebar__brand` 高度改为 `var(--options-title-row-h, 56px)`。
- **内容区**：`options-content` 去掉 padding-top，保留左右与底部 padding；每页最顶部为「标题行」容器，min-height: `var(--options-title-row-h)`。

## 4. 各页标题行与主标题规范

- **通用**：每页顶部有标题行容器（如 `.page-title-row` 或各页统一类名），min-height: `var(--options-title-row-h)`，内放页面主标题。主标题：颜色 `var(--accent)`；字号/字重在 DESIGN_GUIDE 中新增「Options 页面主标题」，建议 18px 或 20px、font-weight 600。
- **首页**：标题行内主标题 + 副标题（slogan）；主标题用新字号/字重、颜色 `var(--accent)`；副标题保持 12px 或 16px、`--text-muted`，可与主标题同行换行。
- **书签 / 标签 / 排行 / 工作区**：先标题行（仅主标题：「书签」「标签」「排行榜」「工作区」），再 toolbar，再内容。
- **设置**：先标题行（主标题「设置」），再返回按钮与模块内容；返回按钮可放在标题行右侧或下一行，实现时二选一（推荐：标题行内左标题、右返回）。

## 5. 组件与 DOM

- 可选：抽 **PageTitleRow** 组件（children：主标题 + 可选副标题/右侧操作），统一使用 token 高度；否则各页用统一 class + token。
- 首页：`homepage-page__header-section` 仅包含标题行（主标题 + 副标题），使用统一 min-height。

## 6. 文档与验收

- **DESIGN_GUIDE**：3.1 Options 中说明第一行为标题行、高度由 `--options-title-row-h` 控制、与左栏 brand 对齐；5. 排版中新增「Options 页面主标题」：字号/字重、颜色 `var(--accent)`。
- **验收**：逐 tab 检查品牌 logo 行与右侧标题行等高、顶对齐；首页主标题+副标题在标题行内；主标题统一品牌色与新字号。
