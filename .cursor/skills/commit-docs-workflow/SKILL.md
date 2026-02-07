---
name: commit-docs-workflow
description: 本仓库中 global-commit-docs-workflow 的补充规则：文档路径与参考示例。与 global-commit-docs-workflow 配合使用；执行 commit/提交/同步 PRD 时以 global 工作流为准，本文件提供项目文档路径与结构。
---

# 提交与文档同步工作流（本项目补充规则）

与 **global-commit-docs-workflow** 配合使用。流程与步骤以 global skill 为准；以下仅为本项目**文档路径与参考**。

## 同步产品文档（PRD）

- 路径：`docs/product/PRD.md`
- 新增入口/页面/能力 → 在对应章节补充或新增小节；删除或降级功能 → 同步调整「功能分级」「非目标」等。保持与当前实现一致；不臆造未实现功能。

## 技术方案文档（feature）

- 路径：`docs/feature/<模块名>.md`
- 参考结构：`docs/feature/i18n.md`（概述、功能特性、架构/目录、关键实现、扩展方式等）
- 新功能模块新增独立文档；已有模块（如 i18n、某页面）则同步更新对应 `docs/feature/*.md`。

## 遗留问题与风险（risks）

- 路径：`docs/risks/<简短描述>.md`
- 参考格式：`docs/risks/path-tag-rename.md`，必须包含：
  - **涉及代码**：文件路径、函数/符号名、行号区间（若稳定）
  - **触发条件**：在何种操作、配置、数据状态下会暴露
  - **影响与表现**、**规避建议**（可选）

## 文档路径参考（汇总）

- PRD：`docs/product/PRD.md`
- Feature：`docs/feature/<模块名>.md`，参考 `docs/feature/i18n.md`
- Risks：`docs/risks/<简短描述>.md`，参考 `docs/risks/path-tag-rename.md`

## Commit 消息示例（本项目模块名）

- **语言**：commit message 内容部分（前缀除外）应主要使用中文。
- `feat(home): 首页增加热门标签与工作区卡片`
- `fix(import): 路径转标签时已存在书签的 pathTagIds 未更新`
- `docs: 同步 PRD 与 i18n 技术方案`
