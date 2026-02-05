# CrossTag Bookmarks - PRD

本文档基于当前代码实现（Manifest V3 + Vite + React + TypeScript）梳理页面与功能点，并按“主要功能 / 一般功能”分级。

## 1. 产品概述

CrossTag Bookmarks 是一款本地优先（无服务端）的 Chrome 书签管理扩展：用“标签（Tag）”与“工作区（Workstation）”组织书签，并基于点击次数做简单统计与榜单。

## 2. 目标与非目标

### 目标

- 提供快速收藏入口（Popup / 右键菜单）
- 在 Options 管理页完成书签、标签、工作区的创建/编辑/删除
- 支持搜索、筛选、排序、分页/虚拟滚动等管理能力
- 支持本地备份（导入/导出 JSON）与一键导入 Chrome 原生书签

### 非目标（当前代码未覆盖）

- 账号体系/云端同步
- 团队共享/协作
- 复杂的多端数据一致性（目前以 `chrome.storage.local` 为主）
- UI 中展示/分析完整“点击历史明细”（代码记录点击时间戳，但当前 UI 主要展示累计点击数）

## 3. 核心数据模型（Storage）

数据存储在 `chrome.storage.local`（封装：`src/lib/storage.ts`）。核心实体：

- Bookmark（`src/lib/types.ts#L13`）
  - `url/title/tags[]/pinned/clickCount/clickHistory[]` 等
  - `clickHistory` 记录最近 100 次点击的时间戳（写入逻辑：`src/lib/bookmarkService.ts`）
- Tag（`src/lib/types.ts#L1`）
  - `name/color/description/pinned/usageCount/clickCount`
- Workstation（`src/lib/types.ts#L46`）
  - `name/description/pinned/bookmarks[]/clickCount`

此外还包含少量“偏好/元信息”类 key（示例）：

- `tbm.locale`：界面语言
- `tbm.theme`：主题模式
- `tbm.settings.browser.*`：打开方式偏好
- `tbm.installUpdateTime`：扩展安装/更新时间（用于设置页展示）

## 4. 入口与页面信息架构

### 4.1 Extension Action Popup（快速收藏）

- 页面入口：`src/pages/popup/main.html` / `src/pages/popup/main.tsx`
- 主组件：`src/pages/popup/BookmarkPopup.tsx`
- 功能点：
  - 读取当前激活标签页（`chrome.tabs`）
  - 若 URL 已被收藏：进入编辑模式（更新 title/tags/pinned，支持删除）
  - 若未收藏：创建书签（title/tags/pinned）
  - 快捷跳转到 Options 管理页（`openOptionsPage('home')`）

### 4.2 右键菜单（Quick Add）

- Service Worker：`src/background/index.ts`
- 功能点：
  - 安装时注册右键菜单“加入 CrossTag Bookmarks”
  - 安装/更新时写入 `tbm.installUpdateTime`（用于设置页“关于”展示安装/更新时间）
  - 点击后创建书签；若有选中文本，将其写入 `note`（当前 UI 未提供 note 的展示/编辑入口）

### 4.3 Options 管理页（完整功能）

- 页面入口：`src/pages/options/main.html` / `src/pages/options/main.tsx`
- Shell：`src/pages/options/OptionsApp.tsx`
- Tab（左侧导航）：
  - Home：`src/pages/options/pages/HomepagePage.tsx`
  - Bookmarks：`src/pages/options/pages/BookmarksPage.tsx`
  - Tags：`src/pages/options/pages/TagsPage.tsx`
  - Workstations：`src/pages/options/pages/WorkstationsPage.tsx`
  - Ranking：`src/pages/options/pages/RankingPage.tsx`
  - Settings（隐藏 tab，仅通过按钮/URL 进入）：`src/pages/options/pages/SettingsPage.tsx`

## 5. 页面与功能点明细

### 5.1 Home（首页/聚合 + 搜索入口）

文件：`src/pages/options/pages/HomepagePage.tsx`

- 聚合展示
  - 热门标签（基于 tag.clickCount 排序）
  - 工作区卡片（横向展示，支持“一键打开全部”）
- 搜索模式
  - 搜索书签（title/url 命中 + clickCount 参与排序）
  - 搜索标签（name/description 命中）
  - 结果交互：
    - 书签结果：单击跳转到 Bookmarks 页并带 query；双击打开并记一次点击
    - 标签结果：单击跳转到 Bookmarks 页并按 tag 过滤；双击打开该标签下所有书签
- 快捷创建
  - FloatingActionButton：创建书签/标签/工作区（弹窗复用 `BookmarkEditModal/TagEditModal/WorkstationEditModal`）

### 5.2 Bookmarks（书签管理）

文件：`src/pages/options/pages/BookmarksPage.tsx`

- 列表管理
  - 搜索（title+url）
  - 多标签筛选（AND 关系）
  - 排序：创建时间 / 点击次数；升序/降序
  - 置顶分区（Pinned 与普通列表分离）
  - 虚拟化网格列表（取消分页）：按行虚拟化渲染，提升大列表性能；提供“回到顶部”按钮
  - 响应式布局：中尺寸 3–4 列、大尺寸 4–5 列自动选择；超大尺寸不限制卡片最大宽度，避免视觉间距被拉大
- CRUD
  - 新建/编辑/删除（`BookmarkEditModal`）
  - 置顶切换（立即持久化）
- 交互与联动
  - 双击打开书签并记一次点击
  - Tag Sidebar：拖拽标签到书签卡片，快速打标签（`TagSidebar` + `BookmarkCard` drop）
  - Workstation Sidebar：拖拽书签到工作区，快速加入（`WorkstationSidebar` + drop）
- Chrome 书签一键导入（Sync）
  - 入口：ChromeSyncModal（`src/components/ChromeSyncModal.tsx`）
  - 选项：路径转标签（层级/独立）、是否更新已存在书签的路径标签

### 5.3 Tags（标签管理）

文件：`src/pages/options/pages/TagsPage.tsx`

- 列表管理
  - 搜索（name）
  - 排序：创建时间 / 使用次数 / 点击次数；升序/降序
  - 置顶分区（Pinned 与普通列表分离）
  - 虚拟化网格列表（取消分页）：按行虚拟化渲染；提供“回到顶部”按钮
  - 响应式布局（固定卡片宽度推导列数）：列数完全由统一卡片宽度（200px）与容器宽度计算得到
- CRUD
  - 新建/编辑/删除（`TagEditModal`）
  - 颜色：预设色板 + 智能分配默认色（基于现有使用次数）
  - 置顶切换
- 关联浏览
  - 标签双击：打开该标签下所有书签（按“标签/工作区打开方式”设置）并累加标签 clickCount
  - BookmarkSidebar：按标签查看书签列表；支持拖拽书签到侧边栏外移除标签绑定

### 5.4 Workstations（工作区管理）

文件：`src/pages/options/pages/WorkstationsPage.tsx`

- 列表管理
  - 搜索（name）
  - 排序：创建时间 / 书签数量 / 点击次数；升序/降序；置顶优先
  - 分页（每页 40）
  - 工作区卡片：单击打开详情侧栏；无编辑按钮，编辑入口在侧栏内
- CRUD
  - 新建（`WorkstationEditModal`）/ 删除（由侧栏「删除工作区」打开 `WorkstationEditModal` 执行）
  - 置顶切换（卡片与侧栏均可）
- 关联浏览（侧栏定位为工作区编辑窗口）
  - WorkstationBookmarkSidebar 上半部分为主信息区：标题、描述、置顶可编辑（默认展示样式 + hover，单击进入编辑，blur/Enter 保存）；「删除工作区」打开编辑弹窗执行删除
  - 下半部分为绑定书签区：搜索、排序（SortDropdown 与列表页一致）、添加书签（icon 加号）同一行；书签列表可滚动、不分页；支持拖拽到侧边栏外移除绑定
  - 添加书签到工作区弹窗（AddBookmarkToWorkstationModal）：入口为绑定区加号按钮；居中悬浮；搜索匹配标题/URL/标签名，默认置顶书签、有关键词时展示搜索结果；选中区与结果区共用加号按钮；添加/移除立即写入；关闭时刷新页面数据
  - 一键打开工作区全部书签（Home 中提供；打开方式由设置决定）

### 5.5 Ranking（统计与榜单）

文件：`src/pages/options/pages/RankingPage.tsx`

- 聚合模块
  - 置顶书签横向列表
  - 置顶标签横向列表
  - 热门标签榜单（Top 10）
  - 热门书签榜单（Top 10）
- 搜索：对上述模块进行关键字过滤（title/url/tag name/description）
- 关联浏览：点击标签打开 BookmarkSidebar；支持拖拽书签到侧边栏外移除标签绑定
- 快捷创建：创建书签（BookmarkEditModal）

### 5.6 Settings（设置）

文件：`src/pages/options/pages/SettingsPage.tsx`

- 语言切换（i18n）
  - 语言存储：`tbm.locale`（`src/lib/storage.ts`）
- 主题模式（外观）
  - 主题存储：`tbm.theme`（`system|light|dark`）
- 浏览器打开方式
  - 单个书签：新标签页 / 新窗口
  - 标签/工作区批量打开：新标签页 / 新窗口
- 数据管理
  - 数据迁移：导入/导出（入口已迁移到 Settings）
  - 删除所有数据：清空书签/标签/工作区/点击历史，但保留设置项（语言/主题/打开方式等）
- 关于信息
  - 版本号：读取 `chrome.runtime.getManifest().version`
  - 安装/更新时间：读取 `tbm.installUpdateTime`（在 `chrome.runtime.onInstalled` 时写入；显示到“日”维度）

## 6. 功能分级（主要 / 一般）

### 主要功能

- 快速收藏入口：Popup / 右键菜单
- 书签管理：创建/编辑/删除、置顶、双击打开并计数
- 标签体系：标签 CRUD、书签打标签、多标签筛选、按标签浏览
- 检索能力：搜索、筛选、排序、分页/虚拟滚动（部分页面已升级为虚拟滚动）

### 一般功能

- 工作区：把一组书签作为集合管理，支持一键打开
- 统计与榜单：置顶/热门的聚合展示与搜索过滤
- 导入导出：JSON 备份/恢复（可选包含点击历史）
- Chrome 原生书签导入：可选“路径转标签”、可选更新已存在书签的路径标签
- 主题与国际化：主题切换、语言切换
- 交互增强：拖拽赋值/移除、侧边栏辅助管理

## 7. 权限与隐私

- 权限（见 `src/manifest.ts`）：`storage`, `tabs`, `bookmarks`, `contextMenus`
- 隐私：数据只存储在本地 `chrome.storage.local`，无服务端上传（详见 `PRIVACY_POLICY.md`）
