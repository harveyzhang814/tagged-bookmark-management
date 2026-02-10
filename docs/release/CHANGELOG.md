# Changelog

本文件记录 CrossTag Bookmarks 的重要变更，格式参考 [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)。

## [Unreleased]

### Added

### Changed

### Fixed

## [0.5.1] - 2026-02-09

### Added

- （无本版本新增项）

### Changed

- **Options 内容区侧边栏**：各页侧栏统一为单一 `openSidebar` 互斥，同一时间仅一个侧栏打开；Esc 关闭当前侧栏
- **UI/设计规范**：侧栏与主信息区样式统一（DESIGN_GUIDE 4.5、2.6），主信息区控件默认无边框、hover/focus 显边框，列表区块间隔与 token 统一

### Fixed

- **首页**：Tag/工作区侧栏「添加书签」弹窗可正常打开

## [0.5.0] - 2025-02-07

### Added

- **标签关系图**：Tags 页新增关系图入口，展示标签共现与簇布局，支持全局/中心模式，边线宽度与概率标注
- **添加书签弹窗**：标签页与工作区侧栏支持「添加书签」弹窗，按标题/URL/标签搜索并加入当前标签或工作区
- **Options 全局搜索**：顶栏全局搜索入口，浮层内搜索书签与标签
- **首页置顶列表**：置顶工作区、置顶标签、置顶书签三组横向滚动列表，单击打开侧栏、双击打开网页
- **Settings**：数据管理（数据迁移入口、删除全部数据流程）、外观主题选择；导入/导出入口移至 Settings
- **工作区侧栏**：工作区详情侧栏可添加书签、主信息区标题/描述/置顶可编辑，全部打开与删除入口集中于侧栏

### Changed

- **Options 顶栏**：改为左侧导航 + 右侧搜索框，全局搜索改为 header 下拉
- **工作区**：侧栏改为编辑窗口，卡片移除编辑按钮；移除工作区颜色设置与相关 UI
- 设计规范与焦点环 token 对齐，侧栏吸住与列表紧凑化

### Fixed

- （无本版本单独修复项）

## [0.4.1] - 2026-01-28

### Added

- Options：Bookmarks/Tags 升级为虚拟化网格列表（按行虚拟化），大数据量滚动更流畅，并新增“回到顶部”按钮
- Settings：新增关于信息，展示版本号与安装/更新时间
- 国际化：支持英文界面，并在初始化时按浏览器语言选择默认语言

### Changed

- Popup：简化为 `BookmarkPopup`，并与全局设计 token 对齐
- UI：统一各列表页样式，优化 Header 与首页交互细节（含搜索结果单击/双击行为）
- 设计体系：全局设计 tokens 与 `DESIGN_GUIDE` 落地，统一 hover/active/focus 等交互规范

[Unreleased]: https://github.com/harveyzhang814/tagged-bookmark-management/compare/v0.5.1...HEAD
[0.5.1]: https://github.com/harveyzhang814/tagged-bookmark-management/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/harveyzhang814/tagged-bookmark-management/compare/v0.4.1...v0.5.0
[0.4.1]: https://github.com/harveyzhang814/tagged-bookmark-management/compare/v0.4.0...v0.4.1

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security

