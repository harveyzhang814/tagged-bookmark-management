# Options 布局与全局搜索

## 概述

Options 管理页采用「左侧导航 + 右侧内容区」布局；内容区顶栏（header）提供可输入的全局搜索框，搜索结果在搜索框正下方以下拉形式展示，与原先浮层内的搜索能力一致。

## 功能特性

- **布局**：左侧 `NavigationSidebar`（品牌图标/标题 + Tab 按钮），右侧 `options-right`（header + 主内容）。Header 高度由 `--options-header-h`（48px）控制。
- **全局搜索入口**：Header 最左侧为可输入搜索框（宽度约 30% header），带搜索图标与偏灰背景（`--bg-secondary`），与 header 背景区分。
- **下拉结果**：有输入时在搜索框正下方展开 `GlobalSearchOverlay` 下拉面板（书签 + 标签两区），内容与交互与原先浮层一致；无输入或点击外部或按 Escape 时关闭。
- **导航栏品牌区**：`NavigationSidebar` 支持可选 `iconUrl`、`appTitle`，在 Tab 上方展示品牌图标与标题。

## 涉及代码

- **Shell**：`src/pages/options/OptionsApp.tsx`（`headerSearchQuery` 状态、搜索 wrap ref、点击外部关闭、Escape、`GlobalSearchOverlay` 置于 search-wrap 内）
- **搜索组件**：`src/components/GlobalSearchOverlay.tsx`（props：`searchQuery`、`onNavigateToBookmarks`；仅当 `searchQuery.trim()` 非空时渲染下拉面板）
- **样式**：`src/pages/options/optionsApp.css`（`options-navigator__search-wrap`、`search-input-wrap`、搜索图标与 input 覆盖）、`src/components/globalSearchOverlay.css`（`.global-search__dropdown-panel`）
- **左侧导航**：`src/components/NavigationSidebar.tsx`（`iconUrl`、`appTitle`、`navigation-sidebar__brand`）

## 关键实现

- **展开/关闭**：下拉可见性由 `headerSearchQuery.trim() !== ''` 推导；点击搜索区域外通过 `useEffect` + `mousedown` 监听清空 `headerSearchQuery`；Escape 在 header 的 `SearchInput` 上处理并清空、blur。
- **数据加载**：`GlobalSearchOverlay` 在 `searchQuery.trim()` 非空时拉取书签/标签，结果计算与高亮逻辑不变。
- **跳转后关闭**：`onNavigateToBookmarks` 回调中执行 `setHeaderSearchQuery('')`，跳转书签页后下拉自动关闭。
