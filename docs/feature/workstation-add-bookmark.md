# 工作区详情侧边栏与「添加书签到工作区」弹窗

## 概述

在工作区管理页中，当用户打开某工作区的详情侧边栏（WorkstationBookmarkSidebar）时，侧栏作为工作区编辑窗口：主信息区可编辑标题/描述并具备置顶、全部打开、删除等操作；绑定书签区提供搜索、排序与添加书签入口，书签列表可滚动。通过绑定区的加号按钮可打开书签选择弹窗，将多个书签加入当前工作区；添加/移除立即写入，关闭弹窗时刷新页面数据。

## 功能特性

### 侧边栏布局与交互

- **吸住**：侧边栏高度由视口减去顶栏与工具栏决定（`workstations-sidebar-wrapper`），不随主列表增高；内部书签列表在侧栏内单独滚动。
- **主信息区**：标题、描述可编辑；功能区同一行图标按钮：置顶（IconButton，有状态）、全部打开（按当前列表批量打开，复用「标签/工作区打开方式」）、删除工作区（IconButton danger，打开编辑弹窗执行删除）。
- **绑定书签区**：搜索占位符「Search/搜索」；排序文案缩短（如 Created Time/创建时间）；添加书签为加号图标；无下分割线；列表项紧凑（标题单行省略，标签与点击次数同一行），卡片间距 8px；样式符合 DESIGN_GUIDE（token、焦点环、圆角）。

### 添加书签弹窗

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
