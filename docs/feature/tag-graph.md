# 标签关系图（Tag Co-occurrence Graph）

## 概述

在标签管理页提供「关系图」入口，以力导向图形式展示标签之间的共现关系：两标签若经常出现在同一书签中，则图中有一条边。支持全局模式（所有标签与边）与中心模式（以某标签为中心仅显示其邻居），边上线宽与边标签用于表达强度与概率。

## 功能特性

### 数据与存储

- **共现数据**：`tbm.tagCooccurrence`（`src/lib/storage.ts`），key 为 `tagId1|tagId2`（按字典序），value 为共现次数（同一书签内同时带有两 tag 的书签数）。
- **计算与同步**：`src/lib/tagCooccurrenceService.ts` 提供 `recalcTagCooccurrence(bookmarks)`、`syncTagCooccurrence()`。书签新增/更新/删除后（`bookmarkService.ts`）调用 `syncTagCooccurrence()`；关系图内提供「刷新关系数据」按钮可手动触发重算。

### 入口与布局

- **入口**：Tags 页（`TagsPage.tsx`）工具栏「关系图」按钮，打开 `TagGraphOverlay`，浮层仅覆盖标签页内容区（不盖住顶栏/侧栏）。
- **图库**：`react-force-graph-2d`（d3-force 布局），节点为标签、边为共现关系；节点名与中心模式边标签通过 `onRenderFramePost` 在 canvas 上绘制。

### 全局模式

- 展示所有标签与所有共现边。
- **簇分离**：按边表计算连通分量，每个连通分量为一簇；为每簇分配目标位置（圆周上），通过 `forceX`/`forceY` 将节点拉向簇中心；**簇越大（节点数越多）半径越小，越靠近画布中心**。
- **边线宽**：1–6px，由「当前图中共现次数 / 最大共现次数」得到强度 0–1，再线性映射为线宽。
- 其他力：`link` 距离 160、`charge` -95、`center` 强度 0.35、`forceCollide` 防重叠。

### 中心模式

- 以当前选中的标签为中心，仅显示该标签及其有共现关系的邻居标签与边。
- **中心节点固定**：中心节点设置 `fx: 0, fy: 0`，固定在力仿真中心。
- **边标签**：边上显示「概率 (数量)」——概率 = 共现次数 / 中心标签的 `usageCount`（百分比），数量 = 共现次数。
- **边线宽**：1–6px，由概率 0–1 线性映射。
- 点击某节点可切换为该节点的中心模式；「全局」按钮返回全局模式。

### 交互与无障碍

- 支持 Esc、关闭按钮、遮罩点击关闭；刷新时显示 loading、禁用关闭。
- 文案与 aria 使用 i18n（`tag.graph`、`tag.graphGlobal`、`tag.graphRefresh`、`tag.graphClose` 等）。

## 涉及文件

| 类型 | 路径 |
|------|------|
| 组件 | `src/components/TagGraphOverlay.tsx` |
| 样式 | `src/components/tagGraphOverlay.css` |
| 服务 | `src/lib/tagCooccurrenceService.ts` |
| 类型声明 | `src/d3-force-3d.d.ts`（forceCollide / forceX / forceY） |
| 存储 | `src/lib/storage.ts`（TAG_COOCCURRENCE、get/save、reset/clear 时清除） |
| 书签联动 | `src/lib/bookmarkService.ts`（create/update/delete bookmark 后 `syncTagCooccurrence()`） |
| 入口 | `src/pages/options/pages/TagsPage.tsx`（关系图按钮、`TagGraphOverlay`） |
| i18n | `src/i18n/locales/en/translation.json`、`zh-CN/translation.json`（tag.graph*） |

## 扩展说明

- 共现键为无序对，读写时统一按 `id1|id2` 字典序，避免重复键。
- 力参数（charge、link distance、簇半径 rMin/rMax、forceX/forceY strength）可在 `TagGraphOverlay.tsx` 中按需微调。
