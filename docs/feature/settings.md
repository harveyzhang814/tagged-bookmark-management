# Settings（设置页）技术说明

## 概述

设置页用于管理“偏好配置”和展示少量“关于信息”。页面入口为 Options 管理页内的隐藏 Tab（通过右上角齿轮进入）。

- 页面文件：`src/pages/options/pages/SettingsPage.tsx`

## 功能特性

- **语言切换**：选择界面语言并持久化
- **打开方式偏好**：
  - 单个书签默认打开方式（新标签页/新窗口）
  - 标签/工作区批量打开方式（新标签页/新窗口）
- **关于信息**：
  - 版本号（从扩展 manifest 读取）
  - 安装/更新时间（本地记录的时间戳，展示到“日”）

## 数据与存储

设置页主要依赖 `chrome.storage.local`，封装在 `src/lib/storage.ts`。

- `tbm.locale`：语言偏好
- `tbm.settings.browser.defaultOpenMode`：单个书签打开方式
- `tbm.settings.browser.tagWorkstationOpenMode`：标签/工作区批量打开方式
- `tbm.installUpdateTime`：安装/更新时间（毫秒时间戳）

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

## 扩展方式

- 若未来需要展示“构建时间”，建议在构建阶段注入（如 Vite define/环境变量），避免依赖运行时不可得的信息。
- 若希望安装时间与更新时间区分，可拆分为两个 key（例如 `tbm.installTime` 与 `tbm.lastUpdateTime`），并在 `onInstalled` 的 `details.reason` 分支写入。

