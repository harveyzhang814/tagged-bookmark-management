---
name: changelog-summary
description: 基于上一个 git tag 到本次要发布的新 tag（tag-to-tag）的提交历史，筛选核心用户可感知改动并生成 Keep a Changelog 风格更新日志，写入 docs/release/CHANGELOG.md。变更素材以 commit message 为主，docs/ 变更仅做验证，必要时才最小化查看代码。适用于用户提到 changelog/更新日志/release notes/发版说明/Keep a Changelog/从 tag 总结变更/准备发版 tag 等场景。
---

# Changelog Summary（从上一个 tag 生成更新日志）

## 触发时机

当用户提到以下意图时，执行本工作流：

- 生成/更新 **changelog / 更新日志 / release notes / 发版说明**
- “从上一个版本（git tag）到现在”的变更总结
- 明确要求 **Keep a Changelog** 格式

## 目标与输出

- **目标**：找到“上一个版本 tag”，并以 **tag-to-tag** 的范围汇总变更（`<lastTag>..<newTag>`），筛选核心变更写入 changelog。
- **输出文件**：`docs/release/CHANGELOG.md`
- **格式**：遵循 Keep a Changelog（按 `Added/Changed/Fixed/...` 分类）

## 工作流步骤

### 1) 确定对比范围（tag-to-tag）

本工作流要求明确“本次要添加的新 tag”（例如 `v1.2.3`）。若用户未提供，则默认认为“新 tag 将指向当前 `HEAD`”，先用 `HEAD` 作为临时上界生成 changelog，待用户创建 tag 后再将范围标记为 tag-to-tag。

优先使用“当前分支可达的最近 tag”作为上一个版本：

- `git describe --tags --abbrev=0`

若项目存在多个 tag 但 `describe` 找不到（例如分支历史不含 tag），则按语义版本排序取最新一个：

- `git tag -l "v*" --sort=-version:refname | head -n 1`

若仍没有任何 tag：

- 视为“首次发布/尚未发版”，对比范围为“仓库初始提交 .. HEAD”，changelog 主要填到 `## [Unreleased]`。

对比范围统一记为：

- `RANGE = <lastTag>..<newTag>`（若 `<newTag>` 还未创建，则先用 `RANGE = <lastTag>..HEAD` 并在输出中标注“新 tag 预计为 <newTag>”）

### 2) 收集变更素材（以 commit message 为主，docs 验证，必要时查代码）

收集提交列表（以 **commit message** 为主，按时间正序便于总结演进）：

- `git log --reverse --no-merges --pretty=format:"%h %s%n%n%b%n---" RANGE`

收集变更文件概览（用于识别模块范围与 docs 验证目标）：

- `git diff --name-status RANGE`

聚焦 docs 变更（仅作“语义验证”，尤其是产品/功能说明变化）：

- `git diff --name-status RANGE -- docs`
- 必要时展开查看：`git diff RANGE -- docs/product/PRD.md docs/feature docs/risks`

仅在 **commit message 语义不清** 或 **docs 与 message 不一致** 时，才最小化查看代码：

- 先定位可疑路径：`git diff --name-status RANGE`
- 再局部展开：`git diff RANGE -- <suspect_paths...>`

如果变更较大，可补充“按模块的统计/热点”（用于聚合，而非逐条展开代码）：

- `git diff --stat RANGE`

### 3) 筛选“核心变更”（不要把所有 commit 原封不动塞进 changelog）

原则：**不严格限制 changelog 条目数量**，目标是“尽可能完整覆盖所有重要变更”；但在“重要性判定”上要更严格，避免把无关细节塞进来。

写入 changelog 的优先级（从高到低；满足任一条就应纳入）：

- **用户可感知功能**：新增入口/能力、交互变化、默认行为变化
- **修复**：会影响用户数据、打开方式、筛选排序、导入导出等的 bug 修复
- **破坏性变更**：数据结构/导入导出格式/权限/配置项含义变化（必须清晰标注迁移/影响）
- **性能/稳定性**：明显改善性能或修复崩溃/卡顿
- **安全/隐私**：权限变化、数据处理方式变化

通常不写入（除非满足“会影响用户使用/发布交付/二次开发”的明确理由）：

- 纯重构、格式化、变量改名
- 小范围内部实现替换且无行为变化
- 仅为开发体验的 chore（除非对发布/构建流程有影响）

合并与去重规则（更严格）：

- 同一主题多 commits：**合并为 1 条 changelog**，以“对用户的最终变化”表述；除非存在可独立理解的多个变化点。
- 仅当 commit message 不能准确表达“对用户的变化”时，才引用 docs 结论或补充一句影响说明；不要贴文件清单。
- 对“边缘但可能重要”的条目，优先判断是否满足：**默认行为/数据/权限/兼容性/发布流程**任一变化；否则不写。

对每条候选项，输出要点遵循：

- 以“**对用户有什么变化**”为主，而不是“改了哪些文件”
- 需要时补充 “影响范围 / 兼容性 / 注意事项”

### 4) 生成 Keep a Changelog 条目（写入 docs/release/CHANGELOG.md）

默认行为（用户未指定新版本号时）：

- 将 `RANGE` 内的核心变更**追加到** `## [Unreleased]` 下的各分类中

若用户明确“准备发版 vX.Y.Z”或“写成某个版本段落”：

- 在 `## [Unreleased]` 下方插入：
  - `## [X.Y.Z] - YYYY-MM-DD`
- 将本次整理的条目写入该版本段落（而不是 Unreleased）
- `## [Unreleased]` 保持为空模板（或只保留未来未发版条目）

分类规则（默认映射）：

- **Added**：新功能、新入口、新设置项（默认关闭也算 Added）
- **Changed**：行为调整、UI/交互调整、默认策略变化、文档/流程变更（仅当对使用/维护有意义）
- **Fixed**：bug 修复
- **Deprecated/Removed**：弃用/移除（必须给出替代/迁移）
- **Security**：权限、隐私、安全修复

写作风格：

- 每条使用 bullet，动词开头，简洁明确
- 同类条目合并，避免“每个 commit 一条”
- 如涉及 Options/Popup/Background 等入口，尽量点名模块

### 5) 质量校验（写完必须自检）

- `docs/release/CHANGELOG.md` 仍符合 Keep a Changelog 的结构（标题 + Unreleased + 分类）
- 没有把无关 chore/重构堆进来
- 若存在破坏性/权限变化，有明确说明
- 语言一致（默认中文），术语一致（Bookmark/Tag/Workstation 等按项目现有用法）

## 输出要求（在 chat 中交付）

除了写文件外，在回复里同时给出：

- **上一个 tag** 与 **对比范围**（优先使用 tag-to-tag，例如 `v1.2.3..v1.2.4`；若新 tag 尚未创建，说明使用了 `v1.2.3..HEAD` 作为临时范围）
- **核心变更摘要**：尽可能覆盖所有重要变更（不设固定条数），并说明为何重要（用户影响/兼容性/发布影响等）
- 若 changelog 只更新了 Unreleased：说明“这些是未发版变更”

## 执行边界（必须遵守）

- **变更素材优先级**：commit message 为主；docs 仅作验证；仅在不一致/语义不清时最小化查看代码 diff。
- **只更新 changelog**：默认只写 `docs/release/CHANGELOG.md`，不自动创建 git tag、不执行 push（除非用户明确要求）。

