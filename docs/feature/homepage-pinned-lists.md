# 首页置顶列表功能

## 概述

首页重构为展示三个置顶列表（工作区、Tag、Bookmark）的横向滚动卡片布局，提供快速访问和操作入口。

## 功能特性

### 1. 置顶工作区列表

- **展示内容**：显示所有 `pinned: true` 的工作区，按 `clickCount` 倒序排列
- **卡片元素**：
  - 标题（工作区名称）
  - 说明（description，可选）
  - Bookmark icon 缩略图（横向排列，最多显示4个）
  - 置顶按钮
- **交互**：
  - 单击：打开 `WorkstationBookmarkSidebar` 侧边栏
  - 双击：调用 `openWorkstation()` 打开工作区下所有书签
  - 点击置顶按钮：调用 `updateWorkstation()` 取消置顶

### 2. 置顶Tag列表

- **展示内容**：显示所有 `pinned: true` 的标签，按 `clickCount` 倒序排列
- **卡片元素**：
  - Tag pill（带颜色）
  - 说明（description，可选）
  - 置顶按钮
  - 使用次数 + 点击次数（icon + 数字）
- **交互**：
  - 单击：打开 `BookmarkSidebar` 侧边栏
  - 双击：获取tag下的所有bookmark URLs，调用 `openUrlsWithMode()` 打开
  - 点击置顶按钮：调用 `updateTag()` 取消置顶

### 3. 置顶Bookmark列表

- **展示内容**：显示所有 `pinned: true` 的书签，按 `clickCount` 倒序排列
- **卡片元素**：
  - 缩略图（favicon）+ 标题
  - 网址（单行省略）
  - 置顶按钮
  - 点击次数（icon + 数字）
- **交互**：
  - 单击：打开 `BookmarkEditSidebar` 侧边栏
  - 双击：调用 `openUrlWithMode()` 打开书签
  - 点击置顶按钮：调用 `updateBookmark()` 取消置顶

## 架构与实现

### 组件结构

```
HomepagePage.tsx
├── HorizontalScrollList (复用组件)
│   ├── HomepagePinnedWorkstationCard
│   ├── HomepagePinnedTagCard
│   └── HomepagePinnedBookmarkCard
└── Sidebars (条件渲染)
    ├── WorkstationBookmarkSidebar
    ├── BookmarkSidebar
    └── BookmarkEditSidebar
```

### 关键实现

#### 数据获取与排序

```typescript
// 使用 useMemo 计算置顶数据，按 clickCount 倒序
const pinnedWorkstations = useMemo(() => {
  return workstations
    .filter((w) => w.pinned)
    .sort((a, b) => b.clickCount - a.clickCount);
}, [workstations]);

const pinnedTags = useMemo(() => {
  return allTags
    .filter((t) => t.pinned)
    .sort((a, b) => b.clickCount - a.clickCount);
}, [allTags]);

const pinnedBookmarks = useMemo(() => {
  return bookmarks
    .filter((b) => b.pinned)
    .sort((a, b) => b.clickCount - a.clickCount);
}, [bookmarks]);
```

#### 双击检测

使用 `clickTimer` ref 延迟单点击，300ms 内检测到双击则取消单点击：

```typescript
const clickTimer = useRef<NodeJS.Timeout | null>(null);

const handleCardClick = () => {
  if (clickTimer.current) {
    clearTimeout(clickTimer.current);
  }
  clickTimer.current = setTimeout(() => {
    if (onClick) {
      onClick(...);
    }
    clickTimer.current = null;
  }, 300);
};

const handleCardDoubleClick = (e: React.MouseEvent) => {
  e.stopPropagation();
  if (clickTimer.current) {
    clearTimeout(clickTimer.current);
    clickTimer.current = null;
  }
  if (onDoubleClick) {
    onDoubleClick(...);
  }
};
```

#### 侧边栏状态管理

- `isWorkstationSidebarOpen` / `selectedWorkstationId`
- `isTagSidebarOpen` / `selectedTagId`
- `editingBookmark`

侧边栏在 `homepage-content-wrapper` 内绝对定位，与内容区域并排显示。

### 样式设计

- **卡片尺寸**：保持与列表页的相对比例，但整体压缩以适应首页展示更多信息
  - Workstation Card: 240px 宽度
  - Tag Card: 200px 宽度
  - Bookmark Card: 220px 宽度
- **横向滚动**：使用 `HorizontalScrollList` 组件，支持左右滑动
- **标题布局**：左上对齐，上下排列

## 文件清单

### 新增组件

- `src/components/HomepagePinnedWorkstationCard.tsx`
- `src/components/HomepagePinnedTagCard.tsx`
- `src/components/HomepagePinnedBookmarkCard.tsx`
- `src/components/homepagePinnedWorkstationCard.css`
- `src/components/homepagePinnedTagCard.css`
- `src/components/homepagePinnedBookmarkCard.css`

### 修改文件

- `src/pages/options/pages/HomepagePage.tsx`：重构布局，添加置顶列表和侧边栏逻辑
- `src/pages/options/pages/homepagePage.css`：调整标题布局和内容区域样式

## 扩展方式

- 如需调整卡片尺寸，修改各 Card 组件的 CSS 文件中的 `width` 属性
- 如需修改排序规则，调整 `useMemo` 中的 `sort` 函数
- 如需添加新的置顶列表类型，参考现有实现添加新的 Card 组件和数据处理逻辑
