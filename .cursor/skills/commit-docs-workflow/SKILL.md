---
name: commit-docs-workflow
description: 在用户准备提交 git、撰写/回复 GitHub PR comment、或要求总结本次更新时，自动总结功能变更、同步更新 PRD/feature/risks 文档，生成符合 Conventional Commits 规范的 commit message，并自动执行 git 提交（git add + git commit）。默认不推送到 GitHub（不执行 git push），除非用户明确要求。
---

# 提交与文档同步工作流

## 触发时机

当用户准备提交 git、撰写/回复 GitHub PR comment、或要求「总结本次更新」时，自动执行此工作流。

## 工作流步骤

### 1. 总结本次更新

根据**当前代码 diff** 与 **chat 上下文**，简要归纳：
- 功能变更（新增/修改/删除的能力、入口、交互）
- 非功能变更（重构、依赖、配置、文案等）

### 2. 同步产品文档（功能变更）

- **PRD**：任何与功能有关的变更，更新到 `docs/product/PRD.md`。
  - 新增入口/页面/能力 → 在对应章节补充或新增小节。
  - 删除或降级功能 → 同步调整「功能分级」「非目标」等描述。
- 保持与当前实现一致；不臆造未实现功能。

### 3. 技术方案文档（feature）

- **新功能模块**：在 `docs/feature/` 下新增独立技术方案，如 `docs/feature/<模块名>.md`。
  - 参考 `docs/feature/i18n.md` 的结构：概述、功能特性、架构/目录、关键实现、扩展方式等。
- **已有模块**：若本次改动涉及现有 feature（如 i18n、某页面），**同步更新**对应 `docs/feature/*.md`，避免文档滞后。

### 4. 遗留问题与风险（risks）

- 将**遗留问题、已知风险、技术债**记录到 `docs/risks/`，单篇如 `docs/risks/<简短描述>.md`。
- 参考 `docs/risks/path-tag-rename.md` 的格式，必须包含：
  - **涉及代码**：文件路径、函数/符号名、行号区间（若稳定）。
  - **触发条件**：在何种操作、配置、数据状态下会暴露。
  - **影响与表现**、**规避建议**（可选）。

### 5. 自动生成 Commit 文案并提交到 git（不推送 GitHub）

按 **GitHub / Conventional Commits** 风格生成 commit message：

- **格式**：`<前缀>: <具体内容>`
- **前缀**（小写）：`feat` 功能、`fix` 修复、`docs` 文档、`chore` 构建/工具/杂项、`refactor` 重构、`style` 格式、`test` 测试、`perf` 性能。
- **内容**：简洁说明本次改动，可选括注模块（如 `feat(workstation): 支持一键打开全部书签`）。

生成后提供给用户，供复制到 `git commit -m "..."` 或 PR 描述。

生成 commit message 后，自动执行本地提交：
- 将相关变更加入暂存区（`git add ...`）
- 使用生成的 message 执行 `git commit`

默认**不提交 GitHub**：不执行 `git push`。只有当用户明确要求“推送/提交到 GitHub”时，才执行 `git push`。

## Commit 消息示例

- `feat(home): 首页增加热门标签与工作区卡片`
- `fix(import): 路径转标签时已存在书签的 pathTagIds 未更新`
- `docs: 同步 PRD 与 i18n 技术方案`

## 文档路径参考

- PRD：`docs/product/PRD.md`
- Feature 文档：`docs/feature/<模块名>.md`
- 风险文档：`docs/risks/<简短描述>.md`
- Feature 参考示例：`docs/feature/i18n.md`
- 风险参考示例：`docs/risks/path-tag-rename.md`
