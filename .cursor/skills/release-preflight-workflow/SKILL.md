---
name: release-preflight-workflow
description: 本仓库中 global-release-preflight-workflow 的补充规则：Chrome 扩展版本号位置、构建/打包命令、release 产物、冒烟清单与 CWS 合规。与 global-release-preflight-workflow 配合使用；执行发版/发布/上架 时以 global 工作流为准，本文件提供项目定制内容。
---

# Release Preflight Workflow（本项目补充规则）

与 **global-release-preflight-workflow** 配合使用。流程与步骤（含提交前调用 global-changelog-summary、global-commit-docs-workflow）以 global skill 为准；以下仅为本项目**版本号、命令、产物、冒烟与合规**的定制内容。

## 关键原则

- **扩展版本以 `src/manifest.ts` 为准**（UI 的“版本号”读取 `chrome.runtime.getManifest().version`）。
- **release zip 文件名以 `package.json` 版本为准**（`scripts/package-extension.mjs` 读取 `package.json.version`）。两者**保持一致**。
- 与数据结构兼容性相关的改动，须检查 **导入导出 metadata version**：`src/lib/importExportService.ts` 的 `VERSION`（文件格式版本，非扩展版本）。

## 1) 版本号更新点

### 1.1 扩展版本（CWS/用户可见）

- 文件：`src/manifest.ts`，字段：`version: 'X.Y.Z'`

### 1.2 npm 包版本（影响 release zip 文件名）

- 文件：`package.json`，字段：`version: "X.Y.Z"`

### 1.3 package-lock.json

- 使用 `npm version X.Y.Z --no-git-tag-version` 同步，或改完 `package.json` 后执行 `npm install`。

### 1.4 对外文档版本标记

- `docs/store/description.md`：必要时更新 “NEW in v…” 等
- `README.md`：版本历史/当前版本与实际一致
- `docs/product/PRD.md`、`docs/feature/*.md`、`docs/risks/*.md`：按 commit-docs-workflow 规则与实现一致

### 1.5 导入导出文件格式版本（仅格式变更时）

- 文件：`src/lib/importExportService.ts`，常量 `VERSION`。仅在导出 JSON 结构/语义变更且需区分格式时升级；升级后明确 import 兼容策略。

## 推荐命令（版本号与检查）

- 版本：`npm version X.Y.Z --no-git-tag-version` 或 `npm version patch --no-git-tag-version`，再同步 `src/manifest.ts` 的 `version`
- 检查与打包：`npm test` → `npx tsc -p tsconfig.json --noEmit` → `npm run build` → `npm run release`

## 2) 自动化检查

- `npm test`
- `npx tsc -p tsconfig.json --noEmit`
- `npm run build`

## 3) 打包发布产物

- 执行：`npm run release`
- 验收：`release/` 下生成 `tagged-bookmark-management-vX.Y.Z.zip`；zip 内为可加载扩展（`dist/` 内容）；不含 sourcemap（脚本会移除 `.map`，`ENABLE_SOURCEMAP=false` 构建）。

## 4) 关键功能回归（冒烟清单）

- **安装/更新**：设置页“关于”显示版本号与安装/更新时间
- **Popup**：新建/编辑/删除书签；置顶；标签选择
- **右键菜单**：菜单存在；Quick Add 成功
- **Options**：Bookmarks（搜索/筛选/排序/分页、置顶分区、双击打开计数、拖拽打标签/加入工作区）；Tags（CRUD、颜色、置顶、打开标签下书签遵循设置）；Workstations（CRUD、一键打开全部、拖拽管理）；Ranking（聚合展示、筛选/打开）；Settings（语言、打开方式偏好、版本号/更新时间）
- **导入导出**：导出一次；导入（覆盖/增量）各跑一次；含点击历史时也跑一次

## 5) 合规检查（CWS）

- **权限最小化**：`src/manifest.ts` 中 permissions 是否仍必要
- **隐私政策**：`PRIVACY_POLICY.md` 与实际行为一致（本地存储、无外传）
- **商店文案**：`docs/store/description.md` 与本次版本功能一致

## 6) 提交/推送/PR（仅项目分支与 PR 约定）

- 若当前在 `main/master`：创建分支 `release-vX.Y.Z` 再 push（`git checkout -b release-vX.Y.Z` → `git push -u origin release-vX.Y.Z`）；否则直接 `git push -u origin HEAD`
- 推送 tag：`git push origin vX.Y.Z`（或 `git push --tags`）
- PR：`gh pr create`，标题建议 `chore(release): 发布 vX.Y.Z`，Body 含 Summary（版本号+主要改动）、Test plan（build/test/typecheck/release + 冒烟）
