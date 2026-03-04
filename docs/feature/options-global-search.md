# Options 布局与全局搜索

## 概述

Options 管理页采用「左侧导航 + 右侧内容区」布局，无顶栏；各页第一行为标题行（与左栏 brand 等高）。**全局搜索**：Options 内当前暂不展示入口（`GlobalSearchOverlay` 组件与状态保留、条件不渲染）；任意网页通过快捷键触发的 content 脚本浮层见「任意网页全局搜索」实现。

## 功能特性

- **布局**：左侧 `NavigationSidebar`（品牌区 + Tab 按钮 + 底部主题与设置），右侧 `options-right`（无 header，主内容区首行为各页标题行）。
- **全局搜索组件**：`GlobalSearchOverlay` 与相关 state 仍在 `OptionsApp.tsx` 中保留，便于恢复；恢复时需根据新入口调整下拉定位。
- **导航栏品牌区**：`NavigationSidebar` 使用 `--options-title-row-h` 与内容区标题行等高对齐。

## 涉及代码

- **Shell**：`src/pages/options/OptionsApp.tsx`（`headerSearchQuery` 与 `GlobalSearchOverlay` 条件不渲染）
- **搜索组件**：`src/components/GlobalSearchOverlay.tsx`（props：`searchQuery`、`onNavigateToBookmarks`）
- **样式**：`src/components/globalSearchOverlay.css`（下拉面板与结果项；token 与焦点环与 DESIGN_GUIDE 一致）
- **左侧导航**：`src/components/NavigationSidebar.tsx`（`iconUrl`、`appTitle`、底部 `onOpenSettings` / ThemeToggle）

## 任意网页全局搜索（content 脚本浮层）

- **入口**：快捷键 Cmd+Shift+K / Ctrl+Shift+K；实现见 `src/content/globalSearch.ts`、样式注入 `globalSearchOverlayStyles.ts`。
- **浮层**：Shadow DOM 内卡片含标题（扩展名）、搜索框、书签/标签结果；样式与 DESIGN_GUIDE §4.4 Modal 及 token（圆角、焦点环、backdrop）对齐；结果项具备 hover/focus/active 与 `--focus-ring`。
