# Settings（设置页）技术说明

## 概述

设置页用于管理“偏好配置”和展示少量“关于信息”。页面入口为 Options 管理页内的隐藏 Tab（通过右上角齿轮进入）。

- 页面文件：`src/pages/options/pages/SettingsPage.tsx`

## 功能特性

- **语言切换**：选择界面语言并持久化
- **主题切换**：选择主题模式（跟随系统 / 明亮 / 暗黑）并持久化（不影响其它入口的主题切换按钮）
- **打开方式偏好**：
  - 单个书签默认打开方式（新标签页/新窗口）
  - 标签/工作区批量打开方式（新标签页/新窗口）
- **数据管理**：
  - **数据迁移**：打开“数据迁移”弹窗，执行导入/导出（原入口从 Options Header 迁移至 Settings）
  - **删除所有数据**：二次确认后删除所有用户数据（书签/标签/工作区/点击历史），但不删除设置项
- **关于信息**：
  - 版本号（从扩展 manifest 读取）
  - 安装/更新时间（本地记录的时间戳，展示到“日”）

## 数据与存储

设置页主要依赖 `chrome.storage.local`，封装在 `src/lib/storage.ts`。

- `tbm.locale`：语言偏好
- `tbm.theme`：主题模式（`system|light|dark`）
- `tbm.settings.browser.defaultOpenMode`：单个书签打开方式
- `tbm.settings.browser.tagWorkstationOpenMode`：标签/工作区批量打开方式
- `tbm.installUpdateTime`：安装/更新时间（毫秒时间戳）
- `tbm.bookmarks` / `tbm.tags` / `tbm.workstations`：核心数据（“删除所有数据”会清除这些 key）
- `tbm.flags.defaultsInitialized`：默认数据初始化标记（用于“清空后保持完全空”）

## 关键实现

### 1) 版本号读取

在 UI 中通过 `chrome.runtime.getManifest().version` 读取扩展版本号；在非扩展环境（例如纯网页调试）会回退为空并显示占位符 `—`。

实现位置：`src/pages/options/pages/SettingsPage.tsx`

### 2) 安装/更新时间记录

在 MV3 Service Worker 的安装钩子中写入时间戳：

- 监听：`chrome.runtime.onInstalled`
- 写入：`saveInstallUpdateTime(Date.now())`

实现位置：`src/background/index.ts`、`src/lib/storage.ts`

### 3) 日期展示（到日）

设置页展示时使用 `toLocaleDateString(currentLocale, { year, month, day })`，确保在不同语言下按本地化格式输出，同时仅保留日期维度。

实现位置：`src/pages/options/pages/SettingsPage.tsx`

### 4) 数据管理：数据迁移入口

Settings 页内提供“数据迁移”入口，通过 action row 打开 `ImportExportModal`（实现：`src/components/ImportExportModal.tsx`）。

实现位置：`src/pages/options/pages/SettingsPage.tsx`

### 5) 数据管理：删除所有数据（保留设置项）

- 入口：Settings 页 “删除所有数据” action row → 自定义确认弹窗（非浏览器系统弹窗）
- 操作：删除 `tbm.bookmarks/tbm.tags/tbm.workstations`，并保留 `tbm.theme/tbm.locale/tbm.settings.*` 等设置项
- 反馈：弹窗提供“进行中（spinner）”与“成功提示（打勾）”，并在成功后自动关闭
- 清空后保持空：写入 `tbm.flags.defaultsInitialized=true`，避免 Popup 再次回填默认标签

实现位置：`src/lib/storage.ts`、`src/lib/bookmarkService.ts`、`src/components/ConfirmDeleteAllDataModal.tsx`

## 扩展方式

- 若未来需要展示“构建时间”，建议在构建阶段注入（如 Vite define/环境变量），避免依赖运行时不可得的信息。
- 若希望安装时间与更新时间区分，可拆分为两个 key（例如 `tbm.installTime` 与 `tbm.lastUpdateTime`），并在 `onInstalled` 的 `details.reason` 分支写入。

