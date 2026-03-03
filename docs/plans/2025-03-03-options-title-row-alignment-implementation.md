# Options 标题行与品牌 logo 对齐 — 实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 通过统一 token 与每页标题行，使左侧品牌 logo 行与各 tab 页面第一行垂直对齐；主标题统一字号/品牌色。

**Architecture:** 在 options-shell 定义 --options-title-row-h；左栏 brand 使用该变量；内容区去掉 padding-top，每页顶部增加标题行容器（min-height 同 token），内放主标题（首页加副标题）；主标题样式在 global 或 DESIGN_GUIDE 中规范。

**Tech Stack:** React, TypeScript, CSS (tokens in global.css / optionsApp.css), Chrome Extension MV3.

**设计文档:** `docs/plans/2025-03-03-options-title-row-alignment-design.md`

---

## Task 1: 定义 token 与左栏 brand 使用

**Files:**
- Modify: `src/pages/options/optionsApp.css`
- Modify: `src/components/navigationSidebar.css`

**Step 1:** 在 `.options-shell` 中增加 `--options-title-row-h: 56px`。

**Step 2:** 在 `navigationSidebar.css` 中，将 `.navigation-sidebar__brand` 的 `height: 56px` 改为 `height: var(--options-title-row-h, 56px)`。

**验证:** 构建通过；左栏 brand 高度仍为 56px。

---

## Task 2: 内容区去掉 padding-top，增加标题行基础样式

**Files:**
- Modify: `src/pages/options/optionsApp.css`
- Modify: `src/styles/global.css`（或新建 options 用标题 class）

**Step 1:** 在 `optionsApp.css` 的 `.options-content` 中去掉 `padding-top`（或设为 0），保留左右、底部 padding。

**Step 2:** 在 `global.css` 或 `optionsApp.css` 中新增「Options 页面主标题」样式：例如 `.options-page-title`：font-size 18px 或 20px、font-weight 600、color: var(--accent)；供各页标题行内主标题使用。

**验证:** 主内容顶边与 shell 顶边齐平；样式可被各页复用。

---

## Task 3: 首页标题行（主标题 + 副标题）

**Files:**
- Modify: `src/pages/options/pages/HomepagePage.tsx`
- Modify: `src/pages/options/pages/homepagePage.css`

**Step 1:** 将首页 `homepage-page__header-section` 改为仅包含「标题行」：min-height: var(--options-title-row-h)；内放主标题（使用新 .options-page-title 或等效）与副标题（slogan）；主标题字号/字重按设计、颜色 var(--accent)，副标题保持现有或 12px/--text-muted。

**Step 2:** 调整 `homepagePage.css`：`.homepage-page__header-section` 作为标题行容器，min-height: var(--options-title-row-h)；`.homepage-page__title` 使用 18px/20px、600、var(--accent)；副标题样式与主标题同排（可换行）。

**验证:** 首页第一行与左栏 brand 等高；主标题+副标题均在标题行内。

---

## Task 4: 书签页标题行

**Files:**
- Modify: `src/pages/options/pages/BookmarksPage.tsx`
- Modify: `src/pages/options/pages/bookmarksPage.css`

**Step 1:** 在书签页最顶部（toolbar 之上）增加标题行容器：min-height: var(--options-title-row-h)，内放主标题「书签」（i18n key 如 navigation.bookmarks 或 bookmark.title）。

**Step 2:** 在 CSS 中为该书签页标题行与主标题设样式（复用 .options-page-title），保证与首页标题行视觉一致。

**验证:** 书签页第一行为标题「书签」，其下为 toolbar 与内容；标题行与 brand 对齐。

---

## Task 5: 标签页、排行页、工作区页标题行

**Files:**
- Modify: `src/pages/options/pages/TagsPage.tsx`, `RankingPage.tsx`, `WorkstationsPage.tsx`
- Modify: `src/pages/options/pages/tagsPage.css`, `rankingPage.css`, `workstationsPage.css`

**Step 1:** 在标签页、排行页、工作区页各自最顶部（toolbar 之上）增加标题行容器，min-height: var(--options-title-row-h)，内放主标题（标签 / 排行榜 / 工作区，使用现有 i18n key）。

**Step 2:** 为三页标题行与主标题添加或复用样式，与首页/书签页一致。

**验证:** 三页第一行均为标题，与 brand 对齐；其下为 toolbar 与内容。

---

## Task 6: 设置页标题行

**Files:**
- Modify: `src/pages/options/pages/SettingsPage.tsx`
- Modify: `src/pages/options/pages/settingsPage.css`

**Step 1:** 在设置页顶部增加标题行容器（min-height: var(--options-title-row-h)），内放主标题「设置」；返回按钮放在标题行右侧或标题行下一行（推荐：标题行内左标题、右返回）。

**Step 2:** 若返回按钮移入标题行，调整 settings-toolbar 或等效结构，使标题行内为「主标题 + 返回按钮」；样式与其它页标题行一致。

**验证:** 设置页第一行为「设置」标题（与 brand 对齐），返回可用。

---

## Task 7: 更新 DESIGN_GUIDE 与收尾

**Files:**
- Modify: `docs/design/DESIGN_GUIDE.md`

**Step 1:** 在 3.1 Options 中补充：第一行为标题行，高度由 `--options-title-row-h` 控制，与左栏 brand 对齐。

**Step 2:** 在 5. 排版与密度中新增「Options 页面主标题」：字号 18px 或 20px、字重 600、颜色 var(--accent)。

**Step 3:** 运行 `npm run build`，在 Chrome 中逐 tab 检查：品牌 logo 行与标题行等高、顶对齐；主标题统一品牌色与新字号。

**验证:** 文档与实现一致；构建通过；视觉验收通过。

---

## 执行选项

**计划已保存至 `docs/plans/2025-03-03-options-title-row-alignment-implementation.md`。**

1. **本会话内按任务执行** — 按 Task 1～7 顺序实现，每步验证后提交。
2. **新会话 + executing-plans** — 在新会话中打开该计划，使用 executing-plans 按任务执行并在检查点暂停。
