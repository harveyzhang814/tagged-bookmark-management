# 工作区「添加书签到工作区」弹窗

## 概述

在工作区管理页中，当用户打开某工作区的详情侧边栏（WorkstationBookmarkSidebar）时，可通过搜索排序区的「添加书签」按钮打开书签选择弹窗，将多个书签加入当前工作区。添加/移除操作立即写入工作区与书签关系，关闭弹窗时刷新页面数据。

## 功能特性

- **入口**：工作区页面 → 点击某工作区卡片打开详情侧边栏 → 侧栏绑定书签区同一行中的加号图标按钮（与搜索、SortDropdown 并列）。
- **弹窗**：居中悬浮（与 ImportExportModal 一致），标题「选择书签」，支持 Esc、遮罩点击、关闭按钮退出。
- **搜索**：仅召回书签，匹配书签的标题、URL、以及书签关联的标签名称（tag 名）。
- **结果区**：无关键词时展示置顶书签（按 updatedAt 排序）；有关键词时展示搜索结果；列表项样式与首页搜索结果一致，命中高亮；每项右侧为加号按钮（添加/选中态/已添加禁用）。
- **选中区**：展示「本次已选中」书签（即本次弹窗内新加入工作区的书签），与结果区共用同一加号按钮样式，选中态点击可移除。
- **数据**：每次添加调用 `addBookmarkToWorkstation`，每次移除调用 `removeBookmarkFromWorkstation`；关闭弹窗时由父组件执行 `refresh()` 再关闭，保证工作区卡片与侧栏列表数据最新。

## 涉及文件

| 类型 | 路径 |
|------|------|
| 组件 | `src/components/AddBookmarkToWorkstationModal.tsx` |
| 样式 | `src/components/addBookmarkToWorkstationModal.css` |
| 侧栏 | `src/components/WorkstationBookmarkSidebar.tsx`（按钮 + `onAddBookmarkClick` prop） |
| 页面 | `src/pages/options/pages/WorkstationsPage.tsx`（状态、弹窗挂载、onClose 刷新） |
| 服务 | `src/lib/workstationService.ts`（`addBookmarkToWorkstation`、`removeBookmarkFromWorkstation`） |
| i18n | `src/i18n/locales/en/translation.json`、`zh-CN/translation.json`（workstation.addBookmark / selectBookmark / alreadyAdded / selectedThisSession） |

## 关键实现

- **弹窗内状态**：打开时用 `initialBookmarkIdsRef` 记录当前工作区书签 id 列表；`currentBookmarkIds` 随添加/移除更新。「本次已选中」= `currentBookmarkIds` 中不在 `initialBookmarkIdsRef` 的 id。
- **搜索匹配**：`matchBookmark(bookmark, query, tagById)` 对 title、url、以及 `bookmark.tags` 解析出的 tag 名称做小写包含匹配。
- **高亮**：与首页搜索一致，`renderHighlighted(text, rawQuery)` 按词高亮，样式使用 `add-bookmark-modal__highlight`（与 design token 一致）。
