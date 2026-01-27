---
name: release-preflight-workflow
description: 在发布/上架新版本时执行发布前检查清单：同步更新扩展与包版本号、跑 build/test/typecheck、生成 release zip、校验产物与权限/隐私合规，并同步更新商店描述与 README/PRD 等文档。若检查过程中产生修改且用户要求“提交并推送到 GitHub”，则在全部修改完成后统一执行一次 git commit（不自动 pull），并执行 git push（必要时创建发布分支），可选使用 gh 创建 PR。
---

# Release Preflight Workflow（发版前检查与版本号更新）

## 适用场景（触发词）

- 用户提到：**发版 / 发布 / 上架 / Chrome Web Store / release / bump version / 更新版本号**
- 目标：在上传 CWS 或对外发布前，完成**版本号一致性 + 自动化校验 + 产物打包 + 文档/合规同步**。

## 关键原则

- **扩展版本以 `src/manifest.ts` 为准**（UI 的“版本号”读取 `chrome.runtime.getManifest().version`）。
- **release zip 文件名以 `package.json` 版本为准**（`scripts/package-extension.mjs` 读取 `package.json.version`）。
- 强烈建议两者 **保持一致**（避免“商店显示版本”和“发布包文件名版本”不一致）。
- 任何与数据结构兼容性相关的改动，都必须检查 **导入导出 metadata version**（`src/lib/importExportService.ts` 的 `VERSION`，这是文件格式版本，不是扩展版本）。

## 工作流步骤（按顺序执行）

### 0) 收集发布信息（必要输入）

在执行前，明确：

- 目标版本号：`X.Y.Z`（可选；**若用户未提供，默认自动 `patch + 1`**）
- 发布渠道：仅本地打包 / 上传 Chrome Web Store
- 是否需要创建 PR（可选；**默认不创建 PR**）

> 默认行为：完成检查后如有修改则**统一执行一次 git commit 并推送到 GitHub**，且**不自动执行 pull/rebase**；但**不创建 PR**（除非用户明确要求）。

### 0.1 推荐命令模板（可直接执行）

版本号更新（建议先更新 npm 版本，再同步 manifest）：

- 若用户提供 `X.Y.Z`：`npm version X.Y.Z --no-git-tag-version`
- 若用户未提供版本：`npm version patch --no-git-tag-version`（自动 patch + 1）
- 更新 `src/manifest.ts` 的 `version` 为同一 `X.Y.Z`

自动化检查与打包：

- `npm test`
- `npx tsc -p tsconfig.json --noEmit`
- `npm run build`
- `npm run release`

### 1) 版本号更新点（必须检查并同步）

#### 1.1 更新扩展版本（CWS/用户看到的版本）

- 文件：`src/manifest.ts`
- 字段：`version: 'X.Y.Z'`

#### 1.2 更新 npm 包版本（影响 release zip 文件名）

- 文件：`package.json`
- 字段：`version: "X.Y.Z"`

#### 1.3 更新 `package-lock.json`（如果使用 npm）

- 方式建议：用 `npm version X.Y.Z --no-git-tag-version` 来同步更新 lock（若项目使用 npm 且需要保持 lock 一致）
- 或在改完 `package.json` 后执行一次 `npm install` 让 lock 自动更新（取决于团队习惯）

#### 1.4 更新对外文档中的版本标记（按需，但发布通常要做）

- `docs/store/description.md`
  - 检查是否存在类似 “NEW in v…” 的版本字样，必要时更新到目标版本/发布说明。
- `README.md`
  - 检查“版本历史/当前版本”的描述是否与实际版本一致；发布时应同步。
- `docs/product/PRD.md`
  - 若本次发布包含功能变化，确保 PRD 与实现一致（按 `commit-docs-workflow` 规则）。
- `docs/feature/*.md`、`docs/risks/*.md`
  - 若本次发布新增模块/产生风险点，补齐对应文档（按 `commit-docs-workflow` 规则）。

#### 1.5 导入导出文件格式版本（仅在破坏兼容/升级格式时）

- 文件：`src/lib/importExportService.ts`
- 常量：`VERSION`
- 只有在导出 JSON 的结构/语义发生变更且需要区分格式时才升级；升级后要确保 import 兼容策略明确。

### 2) 自动化检查（上线前必跑）

在终端依次执行：

- `npm test`
- `npx tsc -p tsconfig.json --noEmit`
- `npm run build`

若失败：

- 先修复再继续，不允许“带红发版”。

### 3) 打包发布产物（用于上传/分发）

执行：

- `npm run release`

验收要点：

- `release/` 目录生成 `tagged-bookmark-management-vX.Y.Z.zip`
- zip 内应包含可加载的扩展产物（`dist/` 的内容）
- sourcemap 不应出现在发布包中（脚本会移除 `.map`，并以 `ENABLE_SOURCEMAP=false` 构建）

### 4) 关键功能回归（冒烟检查清单）

- **安装/更新链路**：设置页“关于”能显示版本号与安装/更新时间
- **Popup**：新建/编辑/删除书签；置顶；标签选择
- **右键菜单**：菜单存在；Quick Add 成功
- **Options**（至少跑一遍主要路径）：
  - Bookmarks：搜索/筛选/排序/分页；置顶分区；双击打开计数；拖拽打标签/加入工作区
  - Tags：CRUD；颜色；置顶；打开标签下书签遵循设置
  - Workstations：CRUD；一键打开全部；拖拽管理
  - Ranking：聚合展示、筛选/打开交互
  - Settings：语言切换；打开方式偏好持久化；版本号/更新时间显示
- **导入导出**：导出一次、导入（覆盖/增量）至少各跑一次；若包含点击历史也跑一次

### 5) 合规检查（CWS 常见卡点）

- **权限最小化**：`src/manifest.ts` 中 permissions 是否仍必要
- **隐私政策一致**：`PRIVACY_POLICY.md` 与实际行为一致（本地存储、无外传）
- **商店文案一致**：`docs/store/description.md` 与本次版本功能一致

### 6) 若检查导致修改：提交、推送、（可选）创建 PR

#### 6.1 触发条件

默认会执行提交与推送；仅当用户明确要求“不提交/不推送”时跳过本节。

提交策略约束：

- **全程只允许 1 次 git commit**：将“版本号更新 + 自动化检查修复 + 文档/商店文案 + changelog”等在检查过程中产生的修改，**汇总到一次提交**中完成。
- **不自动执行 pull/rebase**：若 push 因非快进被拒绝，停止并等待用户明确指示采用 pull/rebase/merge 的策略。

#### 6.2 生成/更新 Changelog（通过 /changelog-summary，提交前必须做）

本工作流不直接编写 changelog 内容，改为在提交前**调用 `/changelog-summary`** 来更新 `docs/release/CHANGELOG.md`（Keep a Changelog）。

调用约定：

- 若本次目标版本号 `X.Y.Z` 已确定：让 `/changelog-summary` 把核心变更写入 `## [X.Y.Z] - YYYY-MM-DD` 段落（并保留/清空 `## [Unreleased]` 模板，按该工作流规则）。
- 若未明确版本号：让 `/changelog-summary` 将核心变更追加到 `## [Unreleased]` 对应分类下。

#### 6.3 提交流程（复用既有技能）

- 在 `/changelog-summary` 完成并确认文档同步无遗漏后，**只调用一次**项目技能：`commit-docs-workflow`
  - 它会：总结变更 → 同步 PRD/feature/risks 文档 → 生成 Conventional Commit message → `git add` + `git commit`
  - 注意：该技能默认不 push，所以若用户要求 push，需要在其后执行 push。
  - 约束：不要在版本号更新（`npm version ...` / 修改 `src/manifest.ts`）或修复检查项时拆分多次提交；全部合并到本次唯一提交中。

#### 6.4 创建 Git Tag（推送前必须做）

在 push 之前，基于最终版本号创建 tag（指向刚提交的 HEAD）：

- tag 格式：`vX.Y.Z`
- 推荐使用注释 tag：
  - `git tag -a vX.Y.Z -m "vX.Y.Z"`

#### 6.5 推送到 GitHub（安全策略）

- 不允许 force push。
- 不自动执行 `git pull` / `git pull --rebase`。若 push 失败（例如 non-fast-forward），停止并等待用户明确指示同步策略。
- 若当前在 `main/master`：优先创建发布分支（例如 `release-vX.Y.Z`）再 push。
- 推送分支：`git push -u origin <branch>`
- 推送 tag：`git push origin vX.Y.Z`（或 `git push --tags`）

推荐分支策略：

- 若当前分支不是 `main/master`：直接 push 当前分支 `git push -u origin HEAD`
- 若当前分支是 `main/master`：创建分支 `release-vX.Y.Z` 后 push
  - `git checkout -b release-vX.Y.Z`
  - `git push -u origin release-vX.Y.Z`

#### 6.6 可选：创建 PR（推荐）

若用户要求创建 PR（默认不创建）：

- 使用 `gh pr create`
- 标题建议：`chore(release): 发布 vX.Y.Z`
- PR Body 模板：
  - Summary：版本号更新 + 主要改动点（来自 diff/文档）
  - Test plan：build/test/typecheck/release 打包结果 + 冒烟回归项

## 输出要求（给用户的最终交付）

每次运行本工作流，最终回复必须包含：

- **版本号更新点清单**（哪些文件改了哪些字段）
- **自动化检查结果**（test/tsc/build 是否通过）
- **release 产物信息**（zip 文件名与位置）
- **冒烟回归完成情况**（哪些已验证，哪些需要人工确认）
- 若执行了提交/推送/PR：提供 commit 信息、分支名、PR 链接（如果有）

