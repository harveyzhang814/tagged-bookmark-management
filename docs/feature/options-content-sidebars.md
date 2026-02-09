# Options 内容区侧边栏（互斥与 Esc）

## 概述

Options 各页（Home、Bookmarks、Tags、Workstations、Ranking）内的内容区侧边栏（tag 书签侧栏、工作区书签侧栏、书签编辑侧栏等）采用统一约定：**同一时间仅允许一个打开**，**按 Esc 关闭当前打开的侧栏**。与左侧全局导航（NavigationSidebar）无关。

## 约定

- **单一状态**：每页用 `openSidebar: T | null` 表示当前打开的内容区侧栏，`T` 为该页的侧栏类型联合（如 `HomepageSidebarKind`）。
- **不写死优先级**：Esc 只关闭“当前打开”的侧栏，不做“先关 A 再关 B”的固定顺序；打开新侧栏时设 `openSidebar` 为新类型即可自然互斥。
- **扩展方式**：新增侧栏时在对应页的 `*SidebarKind` 类型中增加字面量，并在打开/关闭/渲染处增加分支即可。

## 各页类型与侧栏

| 页面 | 类型 | 侧栏取值 |
|------|------|----------|
| HomepagePage | `HomepageSidebarKind` | `'workstation' \| 'tag' \| 'bookmark-edit'` |
| BookmarksPage | `BookmarksSidebarKind` | `'tag' \| 'workstation' \| 'bookmark-edit'` |
| TagsPage | `TagsSidebarKind` | `'tag-bookmark'` |
| WorkstationsPage | `WorkstationsSidebarKind` | `'workstation-bookmark'` |
| RankingPage | `RankingSidebarKind` | `'tag-bookmark'` |

## 涉及代码

- `src/pages/options/pages/HomepagePage.tsx`：`HomepageSidebarKind`、`openSidebar`、Esc effect、打开/关闭 handler
- `src/pages/options/pages/BookmarksPage.tsx`：`BookmarksSidebarKind`、`openSidebar`、Esc effect、切换按钮
- `src/pages/options/pages/TagsPage.tsx`：`TagsSidebarKind`、`openSidebar`、Esc effect
- `src/pages/options/pages/WorkstationsPage.tsx`：`WorkstationsSidebarKind`、`openSidebar`、Esc effect
- `src/pages/options/pages/RankingPage.tsx`：`RankingSidebarKind`、`openSidebar`、Esc effect
